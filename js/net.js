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
  onSnapshot, query, where, orderBy, limit, runTransaction, serverTimestamp,
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
    if (r.status === 'finished') await recordMatch(d.id).catch(() => null);
    // partida contra la IA que quedó colgada (se cerró la pestaña sin salir): cuenta como abandono
    else if (r.status === 'playing' && humans(r.seats || []).length === 1 && Date.now() - (r.updatedAt || 0) > 15 * 60e3) {
      await recordAbandon(d.id).catch(() => null);
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
  admin,
  db, usr, roomCap,
};
window.dispatchEvent(new Event('net-ready'));
