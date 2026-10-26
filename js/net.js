// Reviro · capa de red sobre Firebase (Authentication + Cloud Firestore).
// Se carga como módulo desde index.html cuando js/firebase-config.js tiene datos.
// Expone window.NET con: auth, rooms, stats, admin, y los adaptadores que usa la interfaz (db, usr, roomCap).

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendEmailVerification, sendPasswordResetEmail, updateProfile, deleteUser,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, where, orderBy, limit, runTransaction, serverTimestamp, writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ------------------------------------------------------------------ */
/* Inicialización                                                      */
/* ------------------------------------------------------------------ */
const app = initializeApp(window.REVIRO_FIREBASE);
const auth = getAuth(app);
const fs = getFirestore(app);

/** Administradores fijos. Las reglas de Firestore repiten esta lista: si la cambiás acá, cambiala también en firestore.rules. */
export const ADMIN_EMAILS = ['alejandro.clemente05@gmail.com'];

export const EMPTY_STATS = { played: 0, wins: 0, losses: 0, winRate: 0, currentStreak: 0, bestStreak: 0 };

const me = () => auth.currentUser;
let USER = null;          // users/{uid} del jugador conectado
const NAMES = {};         // caché uid -> username

/* ------------------------------------------------------------------ */
/* Autenticación y roles                                               */
/* ------------------------------------------------------------------ */
const USERNAME_RE = /^[A-Za-z0-9_.]{3,20}$/;

function authError(code) {
  const M = {
    'auth/email-already-in-use': 'Ya hay una cuenta con ese mail.',
    'auth/invalid-email': 'El mail no es válido.',
    'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
    'auth/invalid-credential': 'Mail o contraseña incorrectos.',
    'auth/wrong-password': 'Mail o contraseña incorrectos.',
    'auth/user-not-found': 'No hay ninguna cuenta con ese mail.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá un rato y probá de nuevo.',
    'auth/network-request-failed': 'No hay conexión. Revisá internet.',
    'usuario-invalido': 'El usuario tiene que tener de 3 a 20 letras, números, punto o guion bajo.',
    'usuario-tomado': 'Ese nombre de usuario ya está en uso.',
  };
  const e = new Error(M[code] || 'Algo salió mal. Probá de nuevo.');
  e.code = code;
  return e;
}

/** Crea la cuenta: usuario de Firebase Auth + users/{uid} + usernames/{usuario} (reserva única) + datos privados. */
async function register({ email, username, password, avatar }) {
  const name = String(username || '').trim();
  if (!USERNAME_RE.test(name)) throw authError('usuario-invalido');
  const lower = name.toLowerCase();
  if ((await getDoc(doc(fs, 'usernames', lower))).exists()) throw authError('usuario-tomado');

  let cred;
  try { cred = await createUserWithEmailAndPassword(auth, String(email).trim(), password); }
  catch (e) { throw authError(e.code); }

  try {
    await createUserDocs(cred.user, name, avatar);
  } catch (e) {
    await deleteUser(cred.user).catch(() => {});
    throw e.code ? e : authError('usuario-tomado');
  }
  await updateProfile(cred.user, { displayName: name }).catch(() => {});
  sendEmailVerification(cred.user).catch(() => {});
  return loadUser();
}

async function createUserDocs(user, name, avatar) {
  const lower = name.toLowerCase();
  await runTransaction(fs, async (tx) => {
    const uRef = doc(fs, 'usernames', lower);
    if ((await tx.get(uRef)).exists()) throw authError('usuario-tomado');
    tx.set(uRef, { uid: user.uid });
    tx.set(doc(fs, 'users', user.uid), {
      username: name, usernameLower: lower, role: 'player', avatar: avatar || 'gaucho',
      createdAt: serverTimestamp(), stats: { ...EMPTY_STATS }, lastMatchId: null,
    });
    tx.set(doc(fs, 'users', user.uid, 'private', 'account'), { email: user.email });
  });
}

/** Para cuentas que quedaron a medio crear (por ejemplo, se cortó internet al registrarse). */
async function completeProfile({ username, avatar }) {
  const name = String(username || '').trim();
  if (!USERNAME_RE.test(name)) throw authError('usuario-invalido');
  await createUserDocs(me(), name, avatar);
  return loadUser();
}

async function login({ email, password }) {
  try { await signInWithEmailAndPassword(auth, String(email).trim(), password); }
  catch (e) { throw authError(e.code); }
}

const logout = () => signOut(auth);
const resetPassword = (email) => sendPasswordResetEmail(auth, String(email).trim()).catch((e) => { throw authError(e.code); });
const resendVerification = () => sendEmailVerification(me());

/** Admin = mail fijo verificado, o rol 'admin' asignado por otro admin. */
function isAdmin() {
  const u = me();
  if (!u) return false;
  if (u.emailVerified && ADMIN_EMAILS.includes((u.email || '').toLowerCase())) return true;
  return USER?.role === 'admin';
}

async function loadUser() {
  const u = me();
  if (!u) return (USER = null);
  const s = await getDoc(doc(fs, 'users', u.uid));
  USER = s.exists() ? { uid: u.uid, ...s.data() } : null;
  if (USER) NAMES[u.uid] = USER.username;
  // El admin fijo deja asentado su rol para que la interfaz lo muestre igual en todos lados.
  if (USER && isAdmin() && USER.role !== 'admin') {
    await updateDoc(doc(fs, 'users', u.uid), { role: 'admin' }).catch(() => {});
    USER.role = 'admin';
  }
  return USER;
}

function onChange(cb) {
  return onAuthStateChanged(auth, async (u) => {
    if (u) {
      await u.reload().catch(() => {});
      if (u.emailVerified) await u.getIdToken(true).catch(() => {});   // para que las reglas vean el mail ya verificado
    }
    await loadUser().catch(() => { USER = null; });
    cb(me() ? { uid: me().uid, email: me().email, emailVerified: me().emailVerified, user: USER } : null);
  });
}

/* ------------------------------------------------------------------ */
/* Salas: 1vIA, 1v1 y 2v2                                              */
/* ------------------------------------------------------------------ */
/*
  rooms/{code}
    code, type ('1vIA'|'1v1'|'2v2'), n (2|4), target (15|30), flor, stake, diff,
    host (uid), seats [{id, bot}], playerIds [uid], teams {uid: 0|1},
    status ('waiting'|'playing'|'finished'|'closed'),
    gameJson (estado completo de la partida, serializado), seq, matchId,
    result {matchId, winnerTeam} | null, created, updatedAt
  El estado se guarda serializado porque Firestore no admite listas dentro de listas
  (las manos de cartas son listas de listas).
*/
const roomRef = (code) => doc(fs, 'rooms', String(code).toUpperCase());
const humans = (seats) => seats.filter((s) => s.id && !s.bot).map((s) => s.id);
const teamsOf = (seats) => Object.fromEntries(seats.map((s, i) => [s.id, i % 2]).filter(([id]) => id));
const typeOf = (n, seats) => (n === 4 ? '2v2' : humans(seats).length >= 2 ? '1v1' : '1vIA');

/** Convierte el documento guardado en lo que usa la interfaz (con el estado de la partida ya parseado). */
export function decodeRoom(d) {
  if (!d) return d;
  let game = null;
  try { game = d.gameJson ? JSON.parse(d.gameJson) : null; } catch (e) { game = null; }
  return { ...d, game };
}

const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');

/** Lobby: crea una sala vacía con el creador sentado en el asiento 1. Devuelve el código. */
async function createRoom({ n = 2, target = 30, flor = true, stake = 0, diff = 'medio', bots = 0 }) {
  const uid = me().uid;
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newCode();
    const seats = Array.from({ length: n }, (_, i) => (i === 0 ? { id: uid, bot: false } : { id: null, bot: i <= bots }));
    const ok = await runTransaction(fs, async (tx) => {
      if ((await tx.get(roomRef(code))).exists()) return false;   // código repetido: probamos otro
      tx.set(roomRef(code), {
        code, n, target, flor, stake, diff, type: typeOf(n, seats),
        host: uid, seats, playerIds: humans(seats), teams: {}, status: 'waiting',
        gameJson: null, seq: 0, matchId: null, result: null,
        created: Date.now(), updatedAt: Date.now(),
      });
      return true;
    });
    if (ok) return code;
  }
  throw new Error('No se pudo crear la sala');
}

/** Cambia los asientos en una transacción: mutator recibe la lista actual y devuelve la nueva (o null para no hacer nada). */
async function updateSeats(code, mutator) {
  return runTransaction(fs, async (tx) => {
    const s = await tx.get(roomRef(code));
    if (!s.exists()) return { ok: false, reason: 'no-existe' };
    const d = s.data();
    if (d.status !== 'waiting') return { ok: false, reason: 'empezada' };
    const seats = mutator(d.seats.map((x) => ({ ...x })), d);
    if (!seats) return { ok: false, reason: 'ocupado' };
    tx.update(roomRef(code), { seats, playerIds: humans(seats), type: typeOf(d.n, seats), updatedAt: Date.now() });
    return { ok: true };
  });
}

const sit = (code, i) => updateSeats(code, (seats) => {
  const uid = me().uid;
  if (seats[i].id || seats[i].bot) return null;
  seats = seats.map((x) => (x.id === uid ? { id: null, bot: false } : x));
  seats[i] = { id: uid, bot: false };
  return seats;
});

/** Entrar a una sala: te sienta en el primer asiento libre (dentro de la transacción, así dos personas que entran a la vez no chocan). */
const join = (code) => updateSeats(code, (seats) => {
  const uid = me().uid;
  if (seats.some((x) => x.id === uid)) return null;
  const i = seats.findIndex((x) => !x.id && !x.bot);
  if (i < 0) return null;
  seats[i] = { id: uid, bot: false };
  return seats;
});

/**
  Lanza la sala. Los asientos vacíos se rellenan con la IA:
  en 2v2, si se lanza con 3 jugadores, el cuarto lugar lo juega un bot.
  buildGame(seats, room) arma el estado inicial con el motor del juego.
*/
async function startRoom(code, buildGame) {
  return runTransaction(fs, async (tx) => {
    const s = await tx.get(roomRef(code));
    if (!s.exists()) return { ok: false };
    const d = s.data();
    if (d.status === 'playing' || d.status === 'closed') return { ok: false };
    if (d.host !== me().uid) return { ok: false };
    const seats = d.seats.map((x) => (x.id || x.bot ? { id: x.id || null, bot: !!x.bot } : { id: null, bot: true }));
    const game = buildGame(seats, d);
    tx.update(roomRef(code), {
      status: 'playing', seats, playerIds: humans(seats), teams: teamsOf(seats), type: typeOf(d.n, seats),
      gameJson: JSON.stringify(game), seq: game.seq, matchId: game.matchId, result: null, updatedAt: Date.now(),
    });
    return { ok: true, game };
  });
}

/**
  Sincronización: cada jugada es una transacción que solo se aplica si la sala sigue en el paso
  anterior (seq). Si otro jugador movió primero, no se escribe nada y se devuelve el estado real
  para que el cliente lo adopte. Todos los clientes escuchan rooms/{code} con onSnapshot.
*/
async function commitMove(code, next) {
  return runTransaction(fs, async (tx) => {
    const s = await tx.get(roomRef(code));
    if (!s.exists()) return { ok: false, room: null };
    const d = s.data();
    const cur = decodeRoom(d).game;
    if (!cur || cur.matchId !== next.matchId || cur.seq !== next.seq - 1) return { ok: false, room: decodeRoom(d) };
    const upd = { gameJson: JSON.stringify(next), seq: next.seq, updatedAt: Date.now() };
    if (next.matchOver) {
      upd.status = 'finished';
      upd.result = { matchId: next.matchId, winnerTeam: next.matchOver.winner, at: Date.now() };
    }
    tx.update(roomRef(code), upd);
    return { ok: true };
  });
}

/** Salir de la sala: el anfitrión que se va antes de empezar la cierra; el resto libera su asiento. */
async function leaveRoom(code) {
  const uid = me().uid;
  return runTransaction(fs, async (tx) => {
    const s = await tx.get(roomRef(code));
    if (!s.exists()) return;
    const d = s.data();
    // salas de torneo: los asientos están reservados; salir solo te marca como ausente
    if (d.tour) {
      if (d.status === 'waiting') { const here = { ...(d.here || {}) }; delete here[uid]; tx.update(roomRef(code), { here, updatedAt: Date.now() }); }
      return;
    }
    if (d.status === 'waiting') {
      if (d.host === uid) { tx.update(roomRef(code), { status: 'closed', updatedAt: Date.now() }); return; }
      const seats = d.seats.map((x) => (x.id === uid ? { id: null, bot: false } : x));
      tx.update(roomRef(code), { seats, playerIds: humans(seats), updatedAt: Date.now() });
      return;
    }
    if (d.status === 'playing' && humans(d.seats).filter((id) => id !== uid).length === 0) {
      tx.update(roomRef(code), { status: 'closed', updatedAt: Date.now() });   // 1vIA abandonada
    }
  });
}

/* ------------------------------------------------------------------ */
/* Estadísticas                                                        */
/* ------------------------------------------------------------------ */
/**
  Al terminar una partida, cada jugador registra SU resultado en una transacción:
  crea users/{uid}/matches/{matchId} (si ya existe, no hace nada: nunca se cuenta dos veces)
  y actualiza users/{uid}.stats. Las reglas de Firestore verifican que la cuenta sea correcta
  y que coincida con el resultado guardado en la sala.
*/
async function recordMatch(code) {
  const uid = me().uid;
  return runTransaction(fs, async (tx) => {
    const rs = await tx.get(roomRef(code));
    if (!rs.exists()) return null;
    const room = rs.data();
    if (room.status !== 'finished' || !room.result || !(uid in (room.teams || {}))) return null;
    if (!isOnline(room)) return null;   // contra la IA no cuenta en el historial
    const matchId = room.result.matchId;
    const recRef = doc(fs, 'users', uid, 'matches', matchId);
    if ((await tx.get(recRef)).exists()) return null;
    const uRef = doc(fs, 'users', uid);
    const us = await tx.get(uRef);
    if (!us.exists()) return null;
    const won = room.result.winnerTeam === room.teams[uid];
    const stats = nextStats(us.data().stats, won);
    tx.set(recRef, { roomId: room.code, matchId, type: room.type, won, team: room.teams[uid], at: serverTimestamp() });
    tx.update(uRef, { stats, lastMatchId: matchId });
    return { won, stats };
  });
}

/** Solo cuentan las partidas online: con al menos dos personas en la mesa. */
const isOnline = (room) => humans(room.seats || []).length >= 2;

/** Cuenta nueva después de una partida: jugadas +1, ganada o perdida, racha y mejor racha. */
function nextStats(prev, won) {
  const o = { ...EMPTY_STATS, ...(prev || {}) };
  const played = o.played + 1;
  const wins = o.wins + (won ? 1 : 0);
  const currentStreak = won ? (o.currentStreak > 0 ? o.currentStreak + 1 : 1) : (o.currentStreak < 0 ? o.currentStreak - 1 : -1);
  return {
    played, wins, losses: o.losses + (won ? 0 : 1),
    winRate: wins / played,
    currentStreak,
    bestStreak: Math.max(o.bestStreak, currentStreak),
  };
}

/**
  Abandonar cuenta como derrota: si salís de una partida que sigue en juego, se registra una
  derrota en ese momento. Cuando la partida termine (la IA sigue en tu lugar), ya no se vuelve a contar.
*/
async function recordAbandon(code) {
  const uid = me().uid;
  return runTransaction(fs, async (tx) => {
    const rs = await tx.get(roomRef(code));
    if (!rs.exists()) return null;
    const room = rs.data();
    if (room.status !== 'playing' || !room.matchId || !(uid in (room.teams || {}))) return null;
    if (!isOnline(room)) return null;   // abandonar contra la IA no cuenta
    const matchId = room.matchId;
    const recRef = doc(fs, 'users', uid, 'matches', matchId);
    if ((await tx.get(recRef)).exists()) return null;
    const uRef = doc(fs, 'users', uid);
    const us = await tx.get(uRef);
    if (!us.exists()) return null;
    const stats = nextStats(us.data().stats, false);
    tx.set(recRef, { roomId: room.code, matchId, type: room.type, won: false, team: room.teams[uid], abandoned: true, at: serverTimestamp() });
    tx.update(uRef, { stats, lastMatchId: matchId });
    return { won: false, stats };
  });
}

/** Al iniciar sesión, registra partidas terminadas que quedaron sin contar (por ejemplo, si cerraste antes del final). */
async function recordPending() {
  const uid = me()?.uid;
  if (!uid) return;
  const q = query(collection(fs, 'rooms'), where('playerIds', 'array-contains', uid), limit(30));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const r = d.data();
    if (r.status === 'finished') {
      await recordMatch(d.id).catch(() => null);
      if (r.tour) await tour.reportResult(r.tour.tid, r.tour.mid).catch(() => null);
    }
    // partida contra la IA que quedó colgada (se cerró la pestaña sin salir): se cierra, sin contar en el historial
    else if (r.status === 'playing' && !r.tour && humans(r.seats || []).length === 1 && Date.now() - (r.updatedAt || 0) > 15 * 60e3) {
      await leaveRoom(d.id).catch(() => null);
    }
  }
}

function watchUser(uid, cb) {
  return onSnapshot(doc(fs, 'users', uid), (s) => {
    if (!s.exists()) return;
    USER = { uid, ...s.data() };
    cb(USER);
  });
}

/* ------------------------------------------------------------------ */
/* Torneos                                                             */
/* ------------------------------------------------------------------ */
/*
  tournaments/{tid}
    id, name, theme, rules, startAt (ms | null),
    format ('ko' eliminación directa | 'liga' todos contra todos), mode ('1v1' | '2v2'),
    maxTeams, buyIn (fichas), target (15 | 30), flor, cut (% de la casa), split ([60, 30, 10]),
    status ('open' | 'running' | 'finished' | 'cancelled'), players (inscriptos),
    pot (se fija al empezar), teams [{ids, names, bot}], places {p1, p2, p3}, createdBy, created, updatedAt
  tournaments/{tid}/entries/{uid}   uid, name, av, team (uid del que armó la pareja), partner, at
  tournaments/{tid}/matches/{mid}   id, round, idx, label, a/b {ids, names, bot} | null, room (código de la sala),
                                    winner ('a' | 'b' | null), pts [a, b], bye, from {a, b}, loser, final, third, wo
  tournaments/{tid}/claims/{uid}    uid, kind ('premio' | 'reintegro'), place, amount, at

  Las fichas no tienen valor en dinero: la entrada y el premio se pagan en fichas de práctica.
  El pozo es el (100 - cut)% de las entradas; el resto queda para la casa (esas fichas salen de circulación).
*/
const T_CUT = 10, T_SPLIT = [60, 30, 10];   // T_CUT: parte de la casa (no se muestra a los jugadores)
const tRef = (tid) => doc(fs, 'tournaments', tid);
const tEntry = (tid, uid) => doc(fs, 'tournaments', tid, 'entries', uid);
const tMatch = (tid, mid) => doc(fs, 'tournaments', tid, 'matches', mid);
const tClaim = (tid, uid) => doc(fs, 'tournaments', tid, 'claims', uid);
const tCap = (t) => t.maxTeams * (t.mode === '2v2' ? 2 : 1);
const other = (s) => (s === 'a' ? 'b' : 'a');

/** Pozo: el 90% de lo que se juntó en entradas (antes de empezar, va creciendo con cada inscripto). */
const potOf = (t) => (t.status === 'open' || t.pot == null)
  ? Math.floor((t.players || 0) * (t.buyIn || 0) * (100 - T_CUT) / 100) : t.pot;
/** Cuentas internas (solo para el admin): recaudación bruta, premio y lo que queda para la casa. */
const booksOf = (t) => { const gross = (t.players || 0) * (t.buyIn || 0); const pot = potOf(t); return { gross, pot, house: gross - pot }; };
const tLedger = (tid, id) => doc(fs, 'tournaments', tid, 'ledger', id);
const tBooks = (tid) => doc(fs, 'tournaments', tid, 'private', 'books');

/**
  Reparto del pozo: 1.º 60%, 2.º 30%, 3.º 10%. Si hay menos de tres equipos, las partes que sobran
  van al primero. Se redondea para abajo y los sobrantes del redondeo también van al primero,
  así la suma de los premios es exactamente el pozo.
*/
function prizesOf(t, nTeams) {
  const pot = potOf(t), split = t.split || T_SPLIT;
  const places = Math.max(1, Math.min(split.length, nTeams || split.length));
  const shares = split.slice(0, places);
  shares[0] += split.slice(places).reduce((a, b) => a + b, 0);
  const total = shares.reduce((a, b) => a + b, 0);
  const out = shares.map((s) => Math.floor(pot * s / total));
  out[0] += pot - out.reduce((a, b) => a + b, 0);
  return out;
}
/** Lo que le toca a cada integrante: en parejas se parte en dos (el sobrante, al primero). */
const shareOf = (prize, team, uid) => { const n = team.ids.length, base = Math.floor(prize / n); return team.ids[0] === uid ? prize - base * (n - 1) : base; };

/** Tabla de la liga: partidos ganados, después diferencia de puntos, después puntos a favor. */
function standingsOf(t, matches) {
  const rows = (t.teams || []).map((tm, i) => ({ team: tm, key: tm.ids.join(','), i, w: 0, l: 0, pf: 0, pa: 0, pj: 0 }));
  const by = Object.fromEntries(rows.map((r) => [r.key, r]));
  for (const m of matches) {
    if (!m.winner || !m.a || !m.b) continue;
    const A = by[m.a.ids.join(',')], B = by[m.b.ids.join(',')];
    if (!A || !B) continue;
    const [pa, pb] = m.pts || [0, 0];
    A.pj++; B.pj++; A.pf += pa; A.pa += pb; B.pf += pb; B.pa += pa;
    if (m.winner === 'a') { A.w++; B.l++; } else { B.w++; A.l++; }
  }
  return rows.sort((x, y) => y.w - x.w || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf || x.i - y.i);
}

/** Podio, o null si todavía falta jugar. */
function placesOf(t, matches) {
  if (t.format === 'liga') {
    if (!matches.length || matches.some((m) => !m.winner)) return null;
    const s = standingsOf(t, matches);
    return { p1: s[0]?.team || null, p2: s[1]?.team || null, p3: s[2]?.team || null };
  }
  const fin = matches.find((m) => m.final);
  if (!fin || !fin.winner) return null;
  const p1 = fin[fin.winner], p2 = fin[other(fin.winner)] || null;
  let p3 = null;
  const third = matches.find((m) => m.third);
  if (third) {
    if (!third.winner) return null;
    p3 = third[third.winner];
  } else {
    const semi = matches.find((m) => m.round === fin.round - 1 && !m.bye && m.winner);
    if (semi) p3 = semi[other(semi.winner)] || null;
  }
  return { p1, p2, p3 };
}

const roundName = (r, R) => (r === R ? 'Final' : r === R - 1 ? 'Semifinal' : r === R - 2 ? 'Cuartos de final' : r === R - 3 ? 'Octavos de final' : 'Ronda ' + r);
const roomCodeOf = (tid, mid) => ('T' + tid + '-' + mid).toUpperCase();
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Arma los cruces. Eliminación: llave a la potencia de 2 siguiente, con pases directos en la primera ronda y partido por el tercer puesto. Liga: todos contra todos, por fechas. */
function buildMatches(tid, t, teams) {
  const out = [];
  const base = (id, extra) => ({ id, a: null, b: null, room: roomCodeOf(tid, id), winner: null, pts: null, bye: false, from: null, loser: false, final: false, third: false, wo: false, ...extra });
  if (t.format === 'liga') {
    const list = teams.length % 2 ? teams.concat([null]) : teams.slice();
    const n = list.length;
    let k = 0;
    for (let r = 0; r < n - 1; r++) {
      for (let i = 0; i < n / 2; i++) {
        const A = list[i], B = list[n - 1 - i];
        if (A && B) out.push(base('L' + (k++), { round: r + 1, idx: i, label: 'Fecha ' + (r + 1), a: A, b: B }));
      }
      list.splice(1, 0, list.pop());   // método del círculo
    }
    return out;
  }
  let size = 2; while (size < teams.length) size *= 2;
  const R = Math.log2(size), m1 = size / 2, full = teams.length - m1;
  for (let r = 1; r <= R; r++) {
    const cnt = size / 2 ** r;
    for (let i = 0; i < cnt; i++) {
      const id = 'R' + r + 'M' + i;
      const m = base(id, { round: r, idx: i, label: roundName(r, R), final: r === R });
      if (r === 1) {
        m.a = teams[i];
        m.b = i < full ? teams[m1 + i] : null;
        if (!m.b) { m.bye = true; m.winner = 'a'; }
      } else {
        m.from = { a: 'R' + (r - 1) + 'M' + (2 * i), b: 'R' + (r - 1) + 'M' + (2 * i + 1) };
      }
      out.push(m);
    }
  }
  // los que pasaron directo ya quedan anotados en la segunda ronda
  for (const m of out) {
    if (!m.from) continue;
    for (const s of ['a', 'b']) { const src = out.find((x) => x.id === m.from[s]); if (src && src.bye) m[s] = src.a; }
  }
  if (R >= 2 && teams.length >= 4) {
    out.push(base('P3', { round: R, idx: 1, label: 'Tercer puesto', third: true, loser: true, from: { a: 'R' + (R - 1) + 'M0', b: 'R' + (R - 1) + 'M1' } }));
  }
  return out;
}

const tour = {
  potOf, prizesOf, shareOf, booksOf, standingsOf, placesOf, SPLIT: T_SPLIT, cap: tCap,

  /** Admin: crea un torneo abierto a inscripciones. */
  async create(cfg) {
    for (let k = 0; k < 6; k++) {
      const id = newCode() + newCode();
      const ok = await runTransaction(fs, async (tx) => {
        if ((await tx.get(tRef(id))).exists()) return false;
        tx.set(tRef(id), {
          id, name: String(cfg.name || 'Torneo').slice(0, 40), theme: String(cfg.theme || '').slice(0, 60), rules: String(cfg.rules || '').slice(0, 600),
          startAt: cfg.startAt || null, format: cfg.format === 'liga' ? 'liga' : 'ko', mode: cfg.mode === '2v2' ? '2v2' : '1v1',
          maxTeams: +cfg.maxTeams || 8, buyIn: Math.max(0, +cfg.buyIn || 0), target: +cfg.target === 30 ? 30 : 15, flor: cfg.flor !== false,
          split: T_SPLIT, status: 'open', players: 0, pot: null, teams: [], places: null,
          createdBy: me().uid, created: Date.now(), updatedAt: Date.now(),
        });
        return true;
      });
      if (ok) return id;
    }
    throw new Error('No se pudo crear el torneo');
  },

  watchList: (cb) => onSnapshot(query(collection(fs, 'tournaments'), orderBy('created', 'desc'), limit(30)),
    (s) => cb(s.docs.map((d) => d.data()))),

  /** Escucha un torneo con sus inscriptos y sus partidos. */
  watch(tid, cb) {
    const st = { t: null, entries: [], matches: [] };
    const emit = () => cb({ ...st });
    const un = [
      onSnapshot(tRef(tid), (s) => { st.t = s.exists() ? s.data() : null; emit(); }),
      onSnapshot(collection(fs, 'tournaments', tid, 'entries'), (s) => { st.entries = s.docs.map((d) => d.data()).sort((a, b) => a.at - b.at); emit(); }),
      onSnapshot(collection(fs, 'tournaments', tid, 'matches'), (s) => { st.matches = s.docs.map((d) => d.data()).sort((a, b) => a.round - b.round || a.idx - b.idx || (a.third ? 1 : 0) - (b.third ? 1 : 0)); emit(); }),
    ];
    return () => un.forEach((u) => u());
  },

  /** Inscribirse. En 2v2, team es el uid de quien armó la pareja (para sumarte a ella) o nada (armás la tuya). */
  async register(tid, { name, av, team }) {
    const uid = me().uid;
    return runTransaction(fs, async (tx) => {
      const ts = await tx.get(tRef(tid));
      if (!ts.exists()) return { ok: false, reason: 'no-existe' };
      const t = ts.data();
      if (t.status !== 'open') return { ok: false, reason: 'cerrado' };
      if ((await tx.get(tEntry(tid, uid))).exists()) return { ok: false, reason: 'ya' };
      if (t.players >= tCap(t)) return { ok: false, reason: 'lleno' };
      let teamId = uid;
      if (team && team !== uid) {
        if (t.mode !== '2v2') return { ok: false, reason: 'modo' };
        const cs = await tx.get(tEntry(tid, team));
        if (!cs.exists() || cs.data().team !== team || cs.data().partner) return { ok: false, reason: 'pareja' };
        teamId = team;
        tx.update(tEntry(tid, team), { partner: uid });
      }
      const at = Date.now();
      if (t.startAt && at >= t.startAt) return { ok: false, reason: 'cerrado' };
      tx.set(tEntry(tid, uid), { uid, name: String(name || '').slice(0, 24), av: av || 'gaucho', team: teamId, partner: null, at });
      tx.update(tRef(tid), { players: t.players + 1, updatedAt: at });
      tx.set(tLedger(tid, uid + '-' + at + '-in'), { uid, kind: 'entrada', amount: t.buyIn || 0, at });
      return { ok: true, at, buyIn: t.buyIn };
    });
  },

  /** Darse de baja antes de que empiece (la interfaz devuelve la entrada). */
  async unregister(tid) {
    const uid = me().uid;
    return runTransaction(fs, async (tx) => {
      const ts = await tx.get(tRef(tid));
      const es = await tx.get(tEntry(tid, uid));
      if (!ts.exists() || !es.exists()) return { ok: false };
      const t = ts.data(), e = es.data();
      if (t.status !== 'open') return { ok: false, reason: 'empezado' };
      if (e.team !== uid) {
        const cs = await tx.get(tEntry(tid, e.team));
        if (cs.exists() && cs.data().partner === uid) tx.update(tEntry(tid, e.team), { partner: null });
      }
      tx.delete(tEntry(tid, uid));
      tx.update(tRef(tid), { players: Math.max(0, t.players - 1), updatedAt: Date.now() });
      tx.set(tLedger(tid, uid + '-' + e.at + '-out'), { uid, kind: 'baja', amount: t.buyIn || 0, at: Date.now() });
      return { ok: true, at: e.at, buyIn: t.buyIn };
    });
  },

  /** Admin: cierra la inscripción, arma las parejas que falten y sortea los cruces. */
  async start(tid) {
    const ts = await getDoc(tRef(tid));
    if (!ts.exists()) return { ok: false };
    const t = ts.data();
    if (t.status !== 'open') return { ok: false, reason: 'empezado' };
    const entries = (await getDocs(collection(fs, 'tournaments', tid, 'entries'))).docs.map((d) => d.data()).sort((a, b) => a.at - b.at);
    let teams = [];
    if (t.mode === '2v2') {
      const groups = {};
      for (const e of entries) (groups[e.team] = groups[e.team] || []).push(e);
      const singles = [];
      for (const g of Object.values(groups)) {
        if (g.length >= 2) teams.push({ ids: g.slice(0, 2).map((e) => e.uid), names: g.slice(0, 2).map((e) => e.name), bot: false });
        else singles.push(g[0]);
      }
      for (let i = 0; i < singles.length; i += 2) {
        const pair = singles.slice(i, i + 2);
        teams.push({ ids: pair.map((e) => e.uid), names: pair.map((e) => e.name), bot: pair.length < 2 });
      }
    } else {
      teams = entries.map((e) => ({ ids: [e.uid], names: [e.name], bot: false }));
    }
    if (teams.length < 2) return { ok: false, reason: 'pocos' };
    teams = shuffle(teams).slice(0, t.maxTeams);
    const matches = buildMatches(tid, t, teams);
    const gross = entries.length * t.buyIn, pot = Math.floor(gross * (100 - T_CUT) / 100);
    const b = writeBatch(fs);
    b.set(tBooks(tid), { gross, pot, house: gross - pot, players: entries.length, buyIn: t.buyIn, cut: T_CUT, at: Date.now() });
    for (const m of matches) b.set(tMatch(tid, m.id), { ...m, updatedAt: Date.now() });
    b.update(tRef(tid), { status: 'running', pot, teams, startedAt: Date.now(), updatedAt: Date.now() });
    await b.commit();
    return { ok: true, teams: teams.length };
  },

  async cancel(tid) {
    const t = (await getDoc(tRef(tid))).data();
    await updateDoc(tRef(tid), { status: 'cancelled', updatedAt: Date.now() });
    await setDoc(tBooks(tid), { gross: 0, pot: 0, house: 0, players: t.players || 0, buyIn: t.buyIn, refunded: (t.players || 0) * (t.buyIn || 0), at: Date.now() }).catch(() => {});
  },
  /** Admin: las cuentas del torneo y los últimos movimientos. */
  async books(tid) {
    const [b, l] = await Promise.all([getDoc(tBooks(tid)), getDocs(query(collection(fs, 'tournaments', tid, 'ledger'), orderBy('at', 'desc'), limit(40)))]);
    return { books: b.exists() ? b.data() : null, ledger: l.docs.map((d) => d.data()) };
  },

  /** Admin: da por ganado un partido (por ejemplo, si alguien no se presentó). */
  async walkover(tid, mid, winner) {
    await updateDoc(tMatch(tid, mid), { winner, wo: true, updatedAt: Date.now() });
    await tour.advance(tid);
  },

  /** Entra a la sala de un partido del torneo. La crea el primero que llega, con los asientos ya reservados. */
  async openMatch(tid, mid) {
    const uid = me().uid;
    const [ts, msnap] = await Promise.all([getDoc(tRef(tid)), getDoc(tMatch(tid, mid))]);
    if (!ts.exists() || !msnap.exists()) return null;
    const t = ts.data(), m = msnap.data();
    if (m.winner || !m.a || !m.b) return null;
    if (!m.a.ids.includes(uid) && !m.b.ids.includes(uid)) return null;
    const code = m.room;
    await runTransaction(fs, async (tx) => {
      const rs = await tx.get(roomRef(code));
      const now = Date.now();
      if (!rs.exists()) {
        const n = t.mode === '2v2' ? 4 : 2;
        const seat = (id) => (id ? { id, bot: false } : { id: null, bot: true });
        const seats = n === 2 ? [seat(m.a.ids[0]), seat(m.b.ids[0])] : [seat(m.a.ids[0]), seat(m.b.ids[0]), seat(m.a.ids[1]), seat(m.b.ids[1])];
        tx.set(roomRef(code), {
          code, n, target: t.target, flor: t.flor !== false, stake: 0, diff: 'dificil', type: n === 4 ? '2v2' : '1v1',
          host: uid, seats, playerIds: humans(seats), teams: {}, status: 'waiting',
          gameJson: null, seq: 0, matchId: null, result: null, created: now, updatedAt: now,
          tour: { tid, mid, name: t.name, label: m.label }, here: { [uid]: now },
        });
      } else if (rs.data().status === 'waiting') {
        tx.update(roomRef(code), { here: { ...(rs.data().here || {}), [uid]: now }, updatedAt: now });
      }
    });
    return code;
  },

  /** Arranca la partida del torneo cuando están todos (o, pasados 5 minutos, con la IA en lugar de los que faltan). */
  async startMatchRoom(code, buildGame, force) {
    const uid = me().uid;
    return runTransaction(fs, async (tx) => {
      const s = await tx.get(roomRef(code));
      if (!s.exists()) return { ok: false };
      const d = s.data();
      if (d.status !== 'waiting' || !d.tour || !(d.playerIds || []).includes(uid)) return { ok: false };
      const here = d.here || {};
      const all = humans(d.seats).every((id) => here[id]);
      if (!all && !(force && Date.now() - d.created > 5 * 60e3)) return { ok: false, reason: 'faltan' };
      const seats = d.seats.map((x) => ({ id: x.id || null, bot: !!x.bot || !x.id }));
      const game = buildGame(seats, d);
      tx.update(roomRef(code), {
        status: 'playing', seats, playerIds: humans(seats), teams: teamsOf(seats),
        gameJson: JSON.stringify(game), seq: game.seq, matchId: game.matchId, result: null, updatedAt: Date.now(),
      });
      return { ok: true };
    });
  },

  /** Abandonar una partida de torneo: el partido se da por perdido para tu equipo. */
  async forfeit(code) {
    const uid = me().uid;
    return runTransaction(fs, async (tx) => {
      const s = await tx.get(roomRef(code));
      if (!s.exists()) return null;
      const d = s.data();
      if (d.status !== 'playing' || !d.tour || !(uid in (d.teams || {}))) return null;
      const g = decodeRoom(d).game;
      if (!g) return null;
      const winner = 1 - d.teams[uid];
      g.matchOver = { winner, forfeit: uid };
      g.seq = (g.seq || 0) + 1;
      tx.update(roomRef(code), {
        status: 'finished', gameJson: JSON.stringify(g), seq: g.seq,
        result: { matchId: g.matchId, winnerTeam: winner, at: Date.now(), forfeit: uid }, updatedAt: Date.now(),
      });
      return { winner };
    });
  },

  /** Anota en el torneo el resultado de la sala terminada y avanza la llave. Lo puede hacer cualquiera de los jugadores; si ya está anotado, no hace nada. */
  async reportResult(tid, mid) {
    await runTransaction(fs, async (tx) => {
      const ms = await tx.get(tMatch(tid, mid));
      if (!ms.exists()) return;
      const m = ms.data();
      if (m.winner) return;
      const rs = await tx.get(roomRef(m.room));
      if (!rs.exists()) return;
      const r = decodeRoom(rs.data());
      if (r.status !== 'finished' || !r.result) return;
      const winner = r.result.winnerTeam === 0 ? 'a' : 'b';
      tx.update(tMatch(tid, mid), { winner, pts: r.game ? [r.game.scores[0], r.game.scores[1]] : [0, 0], forfeit: !!r.result.forfeit, updatedAt: Date.now() });
    });
    await tour.advance(tid);
  },

  /** Pasa a los ganadores a la ronda siguiente y, si ya está todo jugado, cierra el torneo con el podio. */
  async advance(tid) {
    const ts = await getDoc(tRef(tid));
    if (!ts.exists() || ts.data().status !== 'running') return;
    const t = ts.data();
    const list = (await getDocs(collection(fs, 'tournaments', tid, 'matches'))).docs.map((d) => d.data());
    const by = Object.fromEntries(list.map((m) => [m.id, m]));
    for (const m of list) {
      if (!m.from) continue;
      for (const s of ['a', 'b']) {
        if (m[s]) continue;
        const src = by[m.from[s]];
        if (!src || !src.winner) continue;
        const val = m.loser ? src[other(src.winner)] : src[src.winner];
        if (!val) continue;
        await runTransaction(fs, async (tx) => {
          const cur = await tx.get(tMatch(tid, m.id));
          if (cur.exists() && !cur.data()[s]) tx.update(tMatch(tid, m.id), { [s]: val, updatedAt: Date.now() });
        }).catch(() => {});
        m[s] = val;
      }
    }
    const places = placesOf(t, list);
    if (places) {
      await runTransaction(fs, async (tx) => {
        const cur = await tx.get(tRef(tid));
        if (cur.exists() && cur.data().status === 'running') tx.update(tRef(tid), { status: 'finished', places, finishedAt: Date.now(), updatedAt: Date.now() });
      }).catch(() => {});
    }
  },

  /** Cobrar: el premio si quedaste en el podio, o la entrada si el torneo se canceló. Se puede cobrar una sola vez. */
  async claim(tid) {
    const uid = me().uid;
    return runTransaction(fs, async (tx) => {
      const ts = await tx.get(tRef(tid));
      if (!ts.exists()) return null;
      const t = ts.data();
      if (t.status !== 'finished' && t.status !== 'cancelled') return null;
      if ((await tx.get(tClaim(tid, uid))).exists()) return null;
      if (!(await tx.get(tEntry(tid, uid))).exists()) return null;
      let kind = 'reintegro', place = 0, amount = t.buyIn || 0;
      if (t.status === 'finished') {
        kind = 'premio'; amount = 0;
        const prizes = prizesOf(t, (t.teams || []).length);
        ['p1', 'p2', 'p3'].forEach((p, i) => {
          const tm = t.places && t.places[p];
          if (tm && tm.ids.includes(uid)) { place = i + 1; amount = shareOf(prizes[i] || 0, tm, uid); }
        });
      }
      const at = Date.now();
      tx.set(tClaim(tid, uid), { uid, kind, place, amount, at });
      if (amount > 0) tx.set(tLedger(tid, uid + '-' + at + '-' + kind), { uid, kind, place, amount, at });
      return { kind, place, amount };
    });
  },
};

/* ------------------------------------------------------------------ */
/* Administración                                                      */
/* ------------------------------------------------------------------ */
const admin = {
  watchRooms: (cb) => onSnapshot(query(collection(fs, 'rooms'), where('status', 'in', ['waiting', 'playing'])),
    (s) => cb(s.docs.map((d) => decodeRoom(d.data())))),
  closeRoom: (code) => updateDoc(roomRef(code), { status: 'closed', updatedAt: Date.now() }),
  deleteRoom: (code) => deleteDoc(roomRef(code)),
  watchUsers: (cb) => onSnapshot(query(collection(fs, 'users'), limit(300)),
    (s) => cb(s.docs.map((d) => ({ uid: d.id, ...d.data() })))),
  setRole: (uid, role) => updateDoc(doc(fs, 'users', uid), { role: role === 'admin' ? 'admin' : 'player' }),
};

/* ------------------------------------------------------------------ */
/* Adaptadores para la interfaz                                        */
/* ------------------------------------------------------------------ */
// La interfaz de Reviro usa un mismo formato de base de datos en claude.ai y acá.
// Este adaptador lo traduce a Firestore y renombra colecciones:
//   tables -> rooms · looks -> profiles · data/users/{uid}/wallet -> wallets/{uid}
function mapPath(p) {
  if (/^tables(\/|$)/.test(p)) return 'rooms' + p.slice(6);
  if (/^looks(\/|$)/.test(p)) return 'profiles' + p.slice(5);
  const m = /^data\/users\/([^/]+)\/wallet$/.exec(p);
  if (m) return 'wallets/' + m[1];
  return p;
}
const isRooms = (p) => /^tables(\/|$)/.test(p);
const clean = (d) => JSON.parse(JSON.stringify(d));
const wrap = (s, rooms) => ({
  id: s.id, exists: s.exists(),
  data: () => (s.exists() ? (rooms ? decodeRoom(s.data()) : s.data()) : undefined),
  metadata: { fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites },
});
function dref(path) {
  const r = doc(fs, mapPath(path)), rooms = isRooms(path);
  return {
    id: r.id, path,
    get: async () => wrap(await getDoc(r), rooms),
    set: (d) => setDoc(r, clean(d)),
    update: (d) => updateDoc(r, clean(d)),
    delete: () => deleteDoc(r),
    onSnapshot: (next, err) => onSnapshot(r, (s) => next(wrap(s, rooms)), err),
    acquire: async () => ({ acquired: true }),   // en Firebase las salas usan transacciones (rooms.*), no turnos
    collection: (p) => cref(path + '/' + p),
  };
}
function cref(path, cons = []) {
  const rooms = isRooms(path);
  const q = () => query(collection(fs, mapPath(path)), ...cons);
  const api = {
    path,
    where: (f, op, v) => cref(path, cons.concat(where(f, op, v))),
    orderBy: (f, dir) => cref(path, cons.concat(orderBy(f, dir || 'asc'))),
    limit: (n) => cref(path, cons.concat(limit(n))),
    doc: (id) => dref(path + '/' + (id || doc(collection(fs, mapPath(path))).id)),
    add: async (d) => dref(path + '/' + (await addDoc(collection(fs, mapPath(path)), clean(d))).id),
    get: async () => { const s = await getDocs(q()); const docs = s.docs.map((x) => wrap(x, rooms)); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [] }; },
    onSnapshot: (next, err) => onSnapshot(q(), (s) => { const docs = s.docs.map((x) => wrap(x, rooms)); next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [] }); }, err),
  };
  return api;
}
const db = { doc: dref, collection: (p) => cref(p) };

/** Nombres de usuario para mostrar en las mesas. */
const usr = {
  id: async () => me()?.uid || null,
  isOwner: async () => isAdmin(),
  name: async () => USER?.username || '',
  me: async () => ({ id: me()?.uid, name: USER?.username || '', email: me()?.email || null }),
  async profiles(ids) {
    const out = {};
    await Promise.all([].concat(ids).map(async (id) => {
      if (!(id in NAMES)) {
        NAMES[id] = '';
        try { const s = await getDoc(doc(fs, 'users', id)); NAMES[id] = s.exists() ? s.data().username : ''; } catch (e) { /* sin nombre */ }
      }
      out[id] = { id, name: NAMES[id] || '', isMe: id === me()?.uid };
    }));
    return out;
  },
};

/**
  Presencia y eventos de la mesa (reacciones y señas), con la misma forma que usa la interfaz:
  cada jugador escribe rooms/{code}/presence/{uid} cada 15 s; quien no aparece en 45 s se considera
  desconectado (y la IA juega por él). Las reacciones van en rooms/{code}/events.
*/
const TAB = Math.random().toString(36).slice(2, 9);
const roomCap = {
  async join(name) {
    const code = String(name).replace(/^reviro-/, '').toUpperCase();
    const uid = me().uid, joinedAt = Date.now();
    const pRef = doc(fs, 'rooms', code, 'presence', uid);
    const beat = () => setDoc(pRef, { uid, at: Date.now() }).catch(() => {});
    beat();
    const hb = setInterval(beat, 15000);
    const unsubs = [];
    let peersCache = [];
    return {
      name,
      connected: () => navigator.onLine !== false,
      presence: () => { beat(); return Promise.resolve(); },
      peers: () => peersCache,
      onPeers(handler) {
        let docs = [];
        const emit = () => {
          peersCache = docs.filter((d) => Date.now() - (d.at || 0) < 45000)
            .map((d) => ({ peer: d.uid, by: d.uid, isMe: d.uid === uid, sameTab: d.uid === uid, kind: 'viewer', guest: false, presence: { uid: d.uid }, updatedAt: d.at }));
          handler({ peers: peersCache, joined: [], left: [], updated: [] });
        };
        unsubs.push(onSnapshot(collection(fs, 'rooms', code, 'presence'), (s) => { docs = s.docs.map((d) => d.data()); emit(); }));
        const t = setInterval(emit, 5000);
        unsubs.push(() => clearInterval(t));
        return () => {};
      },
      emit: (topic, data) => addDoc(collection(fs, 'rooms', code, 'events'), { topic, data: data ?? null, by: uid, tab: TAB, at: Date.now() }).then(() => {}),
      on(topic, handler) {
        const q = query(collection(fs, 'rooms', code, 'events'), where('at', '>', joinedAt));
        const seen = new Set();
        const un = onSnapshot(q, (s) => {
          s.docs.forEach((d) => {
            if (seen.has(d.id)) return; seen.add(d.id);
            const e = d.data();
            if (e.topic !== topic) return;
            handler({ topic, data: e.data, by: e.by, peer: e.by, isMe: e.by === uid, sameTab: e.tab === TAB, kind: 'viewer', guest: false });
          });
        });
        unsubs.push(un);
        return un;
      },
      async leave() { clearInterval(hb); unsubs.forEach((u) => u()); await deleteDoc(pRef).catch(() => {}); },
    };
  },
};

/* ------------------------------------------------------------------ */
window.NET = {
  ADMIN_EMAILS, EMPTY_STATS, decodeRoom,
  auth: { register, completeProfile, login, logout, resetPassword, resendVerification, onChange, isAdmin, loadUser, user: () => USER },
  rooms: { createRoom, updateSeats, sit, join, startRoom, commitMove, leaveRoom },
  stats: { recordMatch, recordAbandon, recordPending, watchUser },
  admin, tour,
  db, usr, roomCap,
};
window.dispatchEvent(new Event('net-ready'));
