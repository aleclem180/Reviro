/*
  Núcleo del servidor de Reviro ("modo servidor").

  Todo lo que mueve fichas o monedas, y todo lo que decide una partida online, pasa por acá:
  - Las partidas: el servidor reparte, guarda las manos en secreto, valida cada jugada con el mismo motor
    de la página, juega por los bots y por quien se quedó sin tiempo, y al final paga premios.
    Cada jugador recibe solo sus cartas; la mesa pública tiene las de los demás tapadas.
  - La billetera: premio del día, tienda, lecciones, cargas de prueba, referidos, compras con Mercado Pago,
    ajustes del admin, torneos y mesas con entrada. Cada movimiento queda anotado y no se puede borrar.

  No sabe nada de Firebase: recibe un "store" (leer y escribir documentos por ruta, con transacciones).
  functions/index.js lo conecta con Firestore; las pruebas lo conectan con una base en memoria.
  Las fichas no tienen valor en dinero y no hay retiros: este código no convierte fichas en plata.
*/
'use strict';
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.NUCLEO = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {

  const R = {
    FX: 5,                                   // precio en fichas = 5 × precio en monedas
    MIN_STAKE: 1000,                         // mesas entre personas: entrada desde 1.000 fichas (o amistosa)
    PREMIO_ONLINE: 60, PREMIO_IA: { facil: 20, medio: 40, dificil: 80 }, PERDER: 5,
    PTS_ONLINE: 30, PTS_IA: { facil: 3, medio: 8, dificil: 15 },
    DIARIO_MONEDAS: 30,
    REF_NEW: 1500, REF_DEFAULT: 2500,
    TURNO_MS: 30000,                         // tiempo para jugar; después juega el bot por vos
    AUSENTE_MS: 45000,                       // sin señal de vida: se lo da por ausente
    ABANDONO_APUESTA_MS: 72000,              // en mesas con entrada, ausente tanto tiempo: pierde la partida
    CORTE_TEMPRANO_MS: 30000,                // irse en los primeros 30 s de una mesa con entrada la cancela
    ESPERA_MANO_MS: 2200,                    // pausa entre una mano y la siguiente
    TOUR_ESPERA_MS: 5 * 60e3,                // torneos: pasado este tiempo se puede empezar con la IA por los que faltan
    T_CUT: 10, T_SPLIT: [60, 30, 10],
    CARGAS: [500, 1000, 5000], LECCIONES: 9, LECCION_MONEDAS: 20,
    ADMIN_EMAILS: ['alejandro.clemente05@gmail.com'],
  };
  const WAL0 = () => ({ chips: 0, coins: 150, owned: [], stats: { played: 0, won: 0, streak: 0, best: 0, earned: 0, pts: 0 },
    daily: '', applied: [], mis: null, ach: { cnt: {}, done: [] }, evk: [], tutPaid: [], tours: {} });
  const STATS0 = { played: 0, wins: 0, losses: 0, winRate: 0, currentStreak: 0, bestStreak: 0 };

  function crear({ motor: M, cat: C, store: S, ahora = () => Date.now() }) {
    const err = (code, msg) => { const e = new Error(msg || code); e.code = code; return e; };
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const hoy = (t = ahora()) => new Date(t - 3 * 3600e3).toISOString().slice(0, 10);   // fecha de Argentina (UTC−3)
    const ITEMS = { av: C.AVS, dorso: C.DORSOS, pano: C.PANOS, kit: C.KITS };
    const fPrice = (p) => p * R.FX;

    /* ---------- quién llama ---------- */
    async function esAdmin(ctx, t) {
      if (ctx.email && R.ADMIN_EMAILS.includes(String(ctx.email).toLowerCase()) && ctx.emailVerified) return true;
      const u = await (t || S).get('users/' + ctx.uid);
      return !!(u && u.role === 'admin');
    }
    async function noSuspendido(ctx, t) {
      const u = await (t || S).get('users/' + ctx.uid);
      if (u && u.banned) throw err('suspendido', 'Tu cuenta está suspendida');
    }

    /* ---------- billetera ---------- */
    const walOf = (d) => { const w = Object.assign(WAL0(), d || {}); w.stats = Object.assign(WAL0().stats, (d && d.stats) || {});
      w.ach = { cnt: {}, done: [], ...((d && d.ach) || {}) }; w.ach.cnt = { ...(w.ach.cnt || {}) }; w.ach.done = (w.ach.done || []).slice();
      w.owned = (w.owned || []).slice(); w.applied = (w.applied || []).slice(); w.evk = (w.evk || []).slice(); w.tutPaid = (w.tutPaid || []).slice();
      w.tours = { ...(w.tours || {}) };
      if (d && d.pase && typeof d.pase === 'object') w.pase = { ...d.pase, cf: (d.pase.cf || []).slice(), cp: (d.pase.cp || []).slice() };
      return w; };
    /** Anota un movimiento (con clave única: si ya se aplicó, no se repite). Devuelve false si no alcanza el saldo. */
    /* Fichas de regalo (invitaciones): se juegan como cualquier ficha, pero quedan marcadas en w.regalo y nunca son
       canjeables. Si alguna vez existiera un canje, solo podría tocar chips - regalo. Las de regalo se gastan primero. */
    function mover(t, uid, w, { key, chips = 0, coins = 0, own = null, tipo, ref = null, earn = false, regalo = false }) {
      if (key && w.applied.includes(key)) return false;
      if (chips < 0 && w.chips + chips < 0) return false;
      if (coins < 0 && w.coins + coins < 0) return false;
      w.chips += chips; w.coins += coins;
      w.regalo = Math.max(0, Math.min((+w.regalo || 0) + (regalo && chips > 0 ? chips : 0), w.chips));
      if (coins > 0 && earn) w.stats.earned += coins;
      if (own && !w.owned.includes(own)) w.owned.push(own);
      if (key) w.applied = w.applied.concat(key).slice(-300);
      if (chips || coins || own) t.add('wallets/' + uid + '/movimientos', { tipo: tipo || key || 'ajuste', fichas: chips, monedas: coins, own, ref, regalo: !!(regalo && chips > 0), saldo: { fichas: w.chips, monedas: w.coins }, at: ahora() });
      return true;
    }

    /* ---------- pase de temporada ---------- */
    const SE = C.SEASON;
    const paseActiva = () => !!SE && hoy() >= SE.start && hoy() <= SE.end;
    function pase(w) { if (!w.pase || w.pase.id !== SE.id) w.pase = { id: SE.id, xp: 0, prem: false, cf: [], cp: [] }; return w.pase; }
    const nivel = (w) => Math.min(SE.levels, Math.floor((pase(w).xp || 0) / SE.xpLevel));
    function sumarXP(w, n) { if (!SE || !paseActiva() || !n) return; pase(w).xp += n; }
    const xpPartida = (won, on) => SE ? (SE.xp.partida + (won ? SE.xp.ganada : 0)) * (on ? SE.xp.online : 1) : 0;

    /* misiones del día (las mismas tres que calcula la página) */
    function dayHash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
    function asegurarMisiones(w, d = hoy()) {
      if (w.mis && w.mis.date === d) return;
      const ids = C.MISSIONS.map((m) => m.id); let x = dayHash(d); const pick = [];
      while (pick.length < 3) { x = (x * 1103515245 + 12345) >>> 0; const id = ids[x % ids.length]; if (!pick.includes(id)) pick.push(id); }
      w.mis = { date: d, ids: pick, prog: {}, done: [] };
    }
    const avataresDe = (w) => C.AVS.filter((a) => !a.price || w.owned.includes('av:' + a.id)).length;
    function valorLogro(w, a) {
      if (a.ev === '@streak') return Math.max(w.stats.best || 0, w.stats.abest || 0);
      if (a.ev === '@avatars') return avataresDe(w);
      if (a.ev === '@pase') return SE ? nivel(w) : 0;
      if (a.ev === '@bosses') return Object.keys(w.ach.cnt).filter((k) => k.startsWith('boss:')).length;
      if (a.ev === '@ach') return w.ach.done.filter((x) => x !== 'todos').length;
      return w.ach.cnt[a.ev] || 0;
    }
    /** Suma eventos (manos ganadas, partidas, etc.): avanza misiones y logros y paga sus fichas. */
    function eventos(t, uid, w, evs, key) {
      if (key && w.evk.includes(key)) return [];
      asegurarMisiones(w);
      const avisos = []; let coins = 0;
      for (const ev of evs) {
        w.ach.cnt[ev] = (w.ach.cnt[ev] || 0) + 1;
        for (const id of w.mis.ids) {
          const m = C.MISSIONS.find((x) => x.id === id);
          if (!m || m.ev !== ev || w.mis.done.includes(id)) continue;
          w.mis.prog[id] = Math.min(m.goal, (w.mis.prog[id] || 0) + 1);
          if (w.mis.prog[id] >= m.goal) { w.mis.done.push(id); coins += m.r; avisos.push({ tipo: 'mision', id, monedas: m.r }); }
        }
      }
      for (const a of C.ACHS) {
        if (w.ach.done.includes(a.id)) continue;
        if (valorLogro(w, a) >= a.goal) { w.ach.done.push(a.id); coins += a.r; avisos.push({ tipo: 'logro', id: a.id, monedas: a.r }); }
      }
      if (key) w.evk = w.evk.concat(key).slice(-120);
      if (SE) sumarXP(w, avisos.reduce((a, x) => a + (x.tipo === 'mision' ? SE.xp.mision : SE.xp.logro), 0));
      if (coins) mover(t, uid, w, { coins, tipo: 'misiones y logros', ref: avisos.map((x) => x.id).join(',') });
      return avisos;
    }

    async function billetera(ctx, d) {
      const uid = ctx.uid, op = d && d.op;
      if (!uid) throw err('sin-sesion');
      return S.tx(async (t) => {
        const raw = await t.get('wallets/' + uid);
        const w = walOf(raw);
        let res = { ok: true };
        if (op === 'iniciar') {
          asegurarMisiones(w);
        } else if (op === 'diario') {
          const d0 = hoy();
          if (w.daily !== d0) {
            w.daily = d0;
            const top = 0;   // el premio del día ya no repone fichas
            mover(t, uid, w, { key: 'daily-' + d0, coins: R.DIARIO_MONEDAS, chips: top, tipo: 'premio del día' });
            if (SE) sumarXP(w, SE.xp.diario);
            res = { ok: true, monedas: R.DIARIO_MONEDAS, fichas: top, avisos: eventos(t, uid, w, []) };   // revisa logros (p. ej. el nivel del pase)
          } else res = { ok: true, ya: true };
          asegurarMisiones(w);
        } else if (op === 'comprar') {
          await noSuspendido(ctx, t);
          const it = (ITEMS[d.tipo] || []).find((x) => x.id === d.id);
          if (!it || !it.price || it.boss || it.season) throw err('no-se-vende');
          const own = d.tipo + ':' + d.id;
          if (w.owned.includes(own)) return { ok: true, ya: true };
          const enMonedas = d.moneda === 'monedas';
          const ok = mover(t, uid, w, enMonedas ? { coins: -it.price, own, tipo: 'compra' , ref: own } : { chips: -fPrice(it.price), own, tipo: 'compra', ref: own });
          if (!ok) throw err('saldo', enMonedas ? 'No te alcanzan las monedas' : 'No te alcanzan las fichas');
          res = { ok: true, avisos: eventos(t, uid, w, []) };
        } else if (op === 'tutorial') {
          const i = +d.i;
          if (!(i >= 0 && i < R.LECCIONES) || w.tutPaid.includes(i)) return { ok: true, ya: true };
          w.tutPaid.push(i);
          mover(t, uid, w, { coins: R.LECCION_MONEDAS, earn: true, tipo: 'lección del tutorial', ref: String(i) });
          const evs = w.tutPaid.length >= R.LECCIONES ? ['tutorial_done'] : [];
          res = { ok: true, monedas: R.LECCION_MONEDAS, avisos: eventos(t, uid, w, evs, evs.length ? 'tutorial' : null) };
        } else if (op === 'referidoNuevo') {
          const r = await t.get('referrals/' + uid);
          if (!r || w.applied.includes('ref-new')) return { ok: true, ya: true };
          mover(t, uid, w, { key: 'ref-new', chips: R.REF_NEW, tipo: 'invitación de un amigo', ref: r.referrer, regalo: true });
          res = { ok: true, fichas: R.REF_NEW };
        } else if (op === 'paseComprar') {
          if (!SE || !paseActiva()) throw err('estado', 'La temporada ya terminó');
          const p = pase(w); if (p.prem) return { ok: true, ya: true };
          if (!mover(t, uid, w, { coins: -SE.price, tipo: 'pase de temporada', ref: SE.id })) throw err('saldo', 'No te alcanzan las monedas');
          p.prem = true;
        } else if (op === 'paseCobrar') {
          if (!SE) throw err('estado');
          const track = d.track === 'prem' ? 'prem' : 'free', l = +d.l, p = pase(w);
          const r = (track === 'prem' ? SE.prem : SE.free).find((x) => x.l === l);
          if (!r) throw err('valor');
          const list = track === 'prem' ? p.cp : p.cf;
          if (list.includes(l)) return { ok: true, ya: true };
          if (nivel(w) < l) throw err('estado', 'Todavía no llegaste a ese nivel');
          if (track === 'prem' && !p.prem) throw err('estado', 'Ese premio es del pase');
          if (track === 'prem' && r.t === 'chips') throw err('valor');   // el pase se paga con monedas: nunca da fichas
          if (r.t === 'chips') throw err('valor');   // el pase nunca da fichas
          const own = r.t !== 'coins' ? r.t + ':' + r.v : null;
          mover(t, uid, w, { coins: r.t === 'coins' ? r.v : 0, own, tipo: 'pase: nivel ' + l, ref: SE.id + '-' + track });
          list.push(l);
          res = { ok: true, avisos: own ? eventos(t, uid, w, []) : [] };
        } else if (op === 'cargar' || op === 'pack') {
          const prem = await t.get('premium/' + uid);
          if (!(prem && prem.on) && !(await esAdmin(ctx, t))) throw err('premium', 'Solo para cuentas premium');
          if (op === 'cargar') {
            const v = +d.fichas; if (!R.CARGAS.includes(v)) throw err('valor');
            mover(t, uid, w, { chips: v, tipo: 'carga de práctica (premium)' });
          } else {
            const p = C.PACKS[+d.i]; if (!p) throw err('valor');
            mover(t, uid, w, { coins: p.coins, tipo: 'compra de prueba (premium)' });
          }
        } else throw err('operacion');
        t.set('wallets/' + uid, w);
        return Object.assign(res, { chips: w.chips, coins: w.coins });
      });
    }

    /* ---------- salas y partidas ---------- */
    const humanos = (seats) => seats.filter((s) => s.id && !s.bot).map((s) => s.id);
    const teamsOf = (seats) => Object.fromEntries(seats.map((s, i) => [s.id, i % 2]).filter(([id]) => id));
    const typeOf = (n, seats) => (n === 4 ? '2v2' : humanos(seats).length >= 2 ? '1v1' : '1vIA');
    const tablePrize = (stake, n) => Math.floor(stake * n * 0.9 / (n / 2));
    const esOnline = (g) => humanos(g.seats).length >= 2;

    /** La mesa que ve todo el mundo: sin las cartas de nadie mientras la mano sigue. */
    function publica(g) {
      const p = clone(g);
      if (!p.hand.ended) {
        p.hand.cards = p.hand.cards.map((c) => c.map(() => '?'));
        p.hand.orig = p.hand.orig.map(() => []);
      }
      return p;
    }
    /** Escribe el estado: el completo en secreto, el público en la sala y la mano de cada jugador en su documento. */
    function guardar(t, code, room, g, extra) {
      t.set('rooms/' + code + '/secreto/estado', { gameJson: JSON.stringify(g), at: ahora() });
      const upd = Object.assign({ gameJson: JSON.stringify(publica(g)), seq: g.seq, matchId: g.matchId, updatedAt: ahora(),
        finMano: g.hand.ended ? (room.finMano && room.handNoFin === g.handNo ? room.finMano : ahora()) : null, handNoFin: g.hand.ended ? g.handNo : null }, extra || {});
      t.update('rooms/' + code, upd);
      return upd;
    }
    function repartirManos(t, code, g) {
      g.seats.forEach((st, s) => { if (st.id && !st.bot) t.set('rooms/' + code + '/manos/' + st.id, { matchId: g.matchId, handNo: g.handNo, seat: s, orig: g.hand.orig[s], at: ahora() }); });
    }
    async function leerSala(t, code) {
      code = String(code || '').toUpperCase();
      const room = await t.get('rooms/' + code);
      if (!room) throw err('no-existe', 'No existe una mesa con ese código');
      const sec = await t.get('rooms/' + code + '/secreto/estado');
      const g = sec && sec.gameJson ? JSON.parse(sec.gameJson) : null;
      return { code, room, g };
    }

    /* eventos de misiones de cada mano y de la partida (los mismos que contaba la página) */
    function eventosMano(g, mt, seat) {
      const h = g.hand, won = h.ended && h.ended.winner === mt, evs = [];
      if (won) evs.push('hand_won'); if (won && h.truco.level >= 3) evs.push('retruco_won'); if (won && h.truco.level === 4) evs.push('vale4_won');
      if (won && h.results.includes('P')) evs.push('parda_won');
      for (const x of h.gains) {
        if (x.tm !== mt) continue;
        if (x.why === 'envido' || x.why === 'falta envido') evs.push('envido_won'); if (x.why === 'falta envido') evs.push('falta_won');
        if (x.why === 'flor' || x.why === 'contraflor') evs.push('flor_won'); if (x.why === 'mazo') evs.push('mazo_rival');
      }
      if (seat != null && h.gains.some((x) => x.tm === mt && (x.why === 'envido' || x.why === 'falta envido')) && M.envidoOf(h.orig[seat]) === 33) evs.push('envido33');
      return evs;
    }
    function eventosPartida(g, mt) {
      const won = g.matchOver.winner === mt, on = esOnline(g), evs = ['match_played'];
      if (won) evs.push('match_won'); if (won && !on && g.diff === 'dificil') evs.push('match_won_dificil'); if (on) evs.push('online_played');
      if (won && on) evs.push('online_won'); if (won && g.scores[1 - mt] === 0) evs.push('shutout');
      if (won && !on && g.gira) { evs.push('gira_won'); if (g.gira.boss && g.gira.zone) evs.push('boss:' + g.gira.zone); }
      return evs;
    }
    function nextStats(prev, won) {
      const o = { ...STATS0, ...(prev || {}) }, played = o.played + 1, wins = o.wins + (won ? 1 : 0);
      const currentStreak = won ? (o.currentStreak > 0 ? o.currentStreak + 1 : 1) : (o.currentStreak < 0 ? o.currentStreak - 1 : -1);
      return { played, wins, losses: o.losses + (won ? 0 : 1), winRate: wins / played, currentStreak, bestStreak: Math.max(o.bestStreak, currentStreak) };
    }

    /**
      Lee (al principio de la transacción) todo lo que el cierre de una mano o de la partida puede tocar:
      billeteras de los jugadores, sus usuarios, el registro de la partida, los referidos y el partido del torneo.
    */
    async function leerParaCierre(t, room, g) {
      const ids = humanos(g.seats), out = { w: {}, u: {}, rec: {}, ref: {}, refW: {}, refU: {}, tm: null, nada: false };
      if (!g.hand.ended && !g.matchOver) { out.nada = true; return out; }   // jugada común: no toca billeteras
      for (const id of ids) { out.w[id] = walOf(await t.get('wallets/' + id)); }
      if (g.matchOver) {
        for (const id of ids) {
          out.u[id] = await t.get('users/' + id);
          out.rec[id] = await t.get('users/' + id + '/matches/' + g.matchId);
          out.ref[id] = esOnline(g) ? await t.get('referrals/' + id) : null;
        }
        for (const id of ids) {
          const r = out.ref[id];
          if (r && !r.played && r.referrer && !ids.includes(r.referrer) && !(r.referrer in out.refW)) {
            out.refW[r.referrer] = walOf(await t.get('wallets/' + r.referrer));
            out.refU[r.referrer] = await t.get('users/' + r.referrer);
          }
        }
        if (room.tour) out.tm = await t.get('tournaments/' + room.tour.tid + '/matches/' + room.tour.mid);
      }
      return out;
    }

    /** Lo que pasa cuando termina una mano (misiones) o la partida (premios, estadísticas, referidos, torneo). */
    function cerrar(t, code, room, g, prev, L) {
      if (L.nada) return;
      const ids = humanos(g.seats), rewards = {};
      const abandonos = room.abandonos || {};
      // misiones de la mano que se acaba de terminar
      if (g.hand.ended && !(prev && prev.hand.ended && prev.handNo === g.handNo)) {
        g.seats.forEach((st, s) => { if (!st.id || st.bot || abandonos[st.id]) return; eventos(t, st.id, L.w[st.id], eventosMano(g, s % 2, s), g.matchId + ':h' + g.handNo); });
      }
      if (g.matchOver && !(prev && prev.matchOver)) {
        const mo = g.matchOver, on = esOnline(g), stake = g.stake || 0, tour = !!room.tour;
        const stakeTbl = stake > 0 && on && !tour, n = g.n;
        g.seats.forEach((st, s) => {
          const id = st.id; if (!id || st.bot) return;
          const w = L.w[id], mt = s % 2, won = mo.winner === mt, key = g.matchId + ':done';
          if (w.applied.includes(key)) return;
          if (mo.cancelled) { if (stake && (room.cobrados || {})[id]) mover(t, id, w, { key, chips: stake, tipo: 'mesa cancelada: entrada devuelta', ref: code }); else w.applied.push(key); rewards[id] = { chips: stake, coins: 0 }; return; }
          if (abandonos[id]) { w.applied.push(key); rewards[id] = { chips: 0, coins: 0 }; return; }   // ya contó su derrota al irse
          let chips = 0;
          if (stakeTbl) {
            if (mo.forfeit) { const ft = g.seats.findIndex((x) => x.id === mo.forfeit) % 2; chips = id === mo.forfeit ? 0 : mt === ft ? stake : stake + Math.floor(stake * 0.9 / (n / 2)); }
            else chips = won ? tablePrize(stake, n) : 0;
          } else if (stake && !on) chips = won ? stake * 2 : 0;
          const coins = won ? (on ? R.PREMIO_ONLINE : R.PREMIO_IA[g.diff] || 40) : R.PERDER;
          const pts = won ? (on ? R.PTS_ONLINE : R.PTS_IA[g.diff] || 8) : 0;
          mover(t, id, w, { key, chips, coins, earn: true, tipo: won ? 'partida ganada' : 'partida jugada', ref: code });
          w.stats.pts = (w.stats.pts || 0) + pts;
          sumarXP(w, xpPartida(won, on));
          w.stats.ast = won ? (w.stats.ast || 0) + 1 : 0; w.stats.abest = Math.max(w.stats.abest || 0, w.stats.ast);
          if (on) { w.stats.played++; if (won) { w.stats.won++; w.stats.streak++; w.stats.best = Math.max(w.stats.best, w.stats.streak); } else w.stats.streak = 0; }
          rewards[id] = { chips, coins, pts, avisos: eventos(t, id, w, eventosPartida(g, mt), g.matchId + ':m') };
          // historial (solo online, contra otras personas)
          if (on && L.u[id] && !L.rec[id]) {
            t.set('users/' + id + '/matches/' + g.matchId, { roomId: code, matchId: g.matchId, type: room.type || typeOf(n, g.seats), won, team: mt, at: ahora(), server: true });
            t.update('users/' + id, { stats: nextStats(L.u[id].stats, won), lastMatchId: g.matchId });
          }
          t.set('profiles/' + id, { pts: w.stats.pts, won: w.stats.won, played: w.stats.played, best: w.stats.best }, { merge: true });
          // referidos: la primera partida online del invitado contra otra persona le paga al que lo invitó
          const r = L.ref[id];
          if (on && r && !r.played) {
            const rw = L.refW[r.referrer];
            const pay = rw ? ((L.refU[r.referrer] && L.refU[r.referrer].refBonus) || R.REF_DEFAULT) : 0;
            if (rw && mover(t, r.referrer, rw, { key: 'ref:' + id, chips: pay, tipo: 'amigo invitado', ref: id, regalo: true })) t.set('wallets/' + r.referrer, rw);
            t.update('referrals/' + id, { played: true, paidReferrer: !!rw });
          }
        });
        if (room.tour && L.tm && !L.tm.winner) {
          t.update('tournaments/' + room.tour.tid + '/matches/' + room.tour.mid, { winner: mo.winner === 0 ? 'a' : 'b', pts: [g.scores[0], g.scores[1]], forfeit: !!mo.forfeit, updatedAt: ahora() });
        }
        room.__result = { matchId: g.matchId, winnerTeam: mo.winner, at: ahora(), cancelled: !!mo.cancelled, forfeit: mo.forfeit || null };
        room.__rewards = rewards;
      }
      for (const id of ids) t.set('wallets/' + id, L.w[id]);
    }
    function aplicar(t, code, room, prev, g, extra) {
      const fin = g.matchOver ? { status: 'finished', result: room.__result, rewards: room.__rewards || {} } : {};
      if (prev && g.handNo !== prev.handNo) repartirManos(t, code, g);
      return guardar(t, code, room, g, Object.assign(fin, extra || {}));
    }

    /** El anfitrión (o, en torneos, cualquiera de los jugadores) empieza la partida. Cobra las entradas. */
    async function salaEmpezar(ctx, d) {
      const uid = ctx.uid;
      return S.tx(async (t) => {
        const { code, room } = await leerSala(t, d.code);
        if (room.status === 'playing' || room.status === 'closed') throw err('estado', 'La sala ya empezó');
        if (room.tour) {
          if (!(room.playerIds || []).includes(uid)) throw err('no-sos');
          const tr = await t.get('tournaments/' + room.tour.tid);
          if (!tr || tr.status !== 'running') throw err('estado', 'El torneo no está en juego');
          const here = room.here || {}, all = humanos(room.seats).every((id) => here[id]);
          if (!all && !(d.force && ahora() - room.created > R.TOUR_ESPERA_MS)) throw err('faltan', 'Faltan jugadores');
        } else if (room.host !== uid) throw err('no-sos', 'Solo el anfitrión empieza la partida');
        await noSuspendido(ctx, t);
        const seats = room.seats.map((x) => (x.id || x.bot ? { id: x.id || null, bot: !!x.bot || !x.id } : { id: null, bot: true }));
        const ids = humanos(seats), n = room.n, on = ids.length >= 2;
        let stake = room.tour ? 0 : +room.stake || 0;
        if (stake && on && stake < R.MIN_STAKE) stake = 0;
        const ws = {}; for (const id of ids) ws[id] = walOf(await t.get('wallets/' + id));
        const g = M.newMatch({ n, target: room.target, stake, flor: room.flor !== false, seats, matchId: code + '-' + ahora().toString(36), diff: room.diff || (room.tour ? 'dificil' : 'medio') });
        if (typeof room.skill === 'number' && !stake && seats.some(x => x.bot)) { g.skill = Math.max(0, Math.min(1, room.skill)); g.gira = { boss: !!room.boss, zone: String(room.zone || '').slice(0, 20) }; }   // rivales de La Huella
        g.lastAct = ahora();
        const cobrados = {};
        if (stake) for (const id of ids) {
          if (!mover(t, id, ws[id], { key: g.matchId + ':in', chips: -stake, tipo: 'entrada de mesa', ref: code })) throw err('saldo', 'A alguien no le alcanzan las fichas');
          cobrados[id] = stake;
        }
        for (const id of ids) t.set('wallets/' + id, ws[id]);
        t.set('rooms/' + code + '/secreto/estado', { gameJson: JSON.stringify(g), at: ahora() });
        repartirManos(t, code, g);
        t.update('rooms/' + code, {
          status: 'playing', seats, playerIds: ids, teams: teamsOf(seats), type: typeOf(n, seats), stake,
          gameJson: JSON.stringify(publica(g)), seq: g.seq, matchId: g.matchId, result: null, rewards: null, cobrados,
          abandonos: {}, finMano: null, handNoFin: null, startedAt: ahora(), updatedAt: ahora(), server: true,
        });
        return { ok: true, matchId: g.matchId };
      });
    }

    /** Una jugada de quien tiene el turno. seq es el paso que vio el jugador: si la mesa ya cambió, no se aplica. */
    async function salaJugar(ctx, d) {
      const uid = ctx.uid;
      return S.tx(async (t) => {
        const { code, room, g } = await leerSala(t, d.code);
        if (!g || room.status !== 'playing') throw err('estado', 'La partida no está en juego');
        if (d.seq != null && +d.seq !== g.seq) return { ok: false, motivo: 'tarde', seq: g.seq };
        const seat = g.seats.findIndex((s) => s.id === uid && !s.bot);
        if (seat < 0) throw err('no-sos', 'No estás sentado en esta mesa');
        if (M.actor(g) !== seat) return { ok: false, motivo: 'turno', seq: g.seq };
        let ng; try { ng = M.act(g, seat, d.accion); } catch (e) { throw err('invalida', 'Esa jugada no es válida'); }
        ng.lastAct = ahora();
        const L = await leerParaCierre(t, room, ng);
        cerrar(t, code, room, ng, g, L);
        aplicar(t, code, room, g, ng);
        return { ok: true, seq: ng.seq };
      });
    }

    /**
      Lo que avanza solo: juega el bot (o la IA por quien se quedó sin tiempo, se fue o está ausente),
      reparte la mano siguiente o da por perdida la partida de quien abandonó una mesa con entrada.
      Lo puede pedir cualquiera de los jugadores: el servidor decide si corresponde.
    */
    async function salaAvanzar(ctx, d) {
      const uid = ctx.uid;
      return S.tx(async (t) => {
        const { code, room, g } = await leerSala(t, d.code);
        if (!g || room.status !== 'playing') return { ok: false, motivo: 'estado' };
        if (!(room.playerIds || []).includes(uid)) throw err('no-sos');
        if (d.seq != null && +d.seq !== g.seq) return { ok: false, motivo: 'tarde', seq: g.seq };
        const now = ahora();
        let ng = null;
        if (g.hand.ended) {
          if (now - (room.finMano || 0) < R.ESPERA_MANO_MS) return { ok: false, motivo: 'temprano' };
          ng = M.nextHand(g);
        } else {
          const a = M.actor(g); if (a < 0) return { ok: false, motivo: 'estado' };
          const st = g.seats[a];
          const ab = room.abandonos || {};
          if (st.bot) ng = M.act(g, a, M.aiAct(g, a));
          else if (ab[st.id]) ng = M.act(g, a, M.aiAct(g, a, 'dificil'));
          else {
            const pres = await t.get('rooms/' + code + '/presence/' + st.id);
            const visto = Math.max(pres ? +pres.at || 0 : 0, room.startedAt || 0);
            const ausente = now - visto > R.AUSENTE_MS;
            const stakeTbl = (g.stake || 0) > 0 && esOnline(g) && !room.tour;
            if (ausente && stakeTbl && now - visto > R.ABANDONO_APUESTA_MS) {
              ng = clone(g); ng.seq++; ng.matchOver = { winner: 1 - (a % 2), forfeit: st.id };
            } else if (ausente && !stakeTbl) ng = M.act(g, a, M.aiAct(g, a, 'dificil'));
            else if (now - (g.lastAct || 0) >= R.TURNO_MS) ng = M.act(g, a, M.aiAct(g, a, 'medio'));
            else return { ok: false, motivo: 'esperando' };
          }
        }
        ng.lastAct = ahora();
        const L = await leerParaCierre(t, room, ng);
        cerrar(t, code, room, ng, g, L);
        aplicar(t, code, room, g, ng);
        return { ok: true, seq: ng.seq };
      });
    }

    /** Irse de una partida en juego. */
    async function salaSalir(ctx, d) {
      const uid = ctx.uid;
      return S.tx(async (t) => {
        const { code, room, g } = await leerSala(t, d.code);
        if (!g || room.status !== 'playing') return { ok: true, nada: true };
        const seat = g.seats.findIndex((s) => s.id === uid && !s.bot);
        if (seat < 0) return { ok: true, nada: true };
        const on = esOnline(g), stakeTbl = (g.stake || 0) > 0 && on && !room.tour;
        if (!on) {   // contra la IA: la sala se cierra (y se devuelve la entrada, si había, solo si ya terminó: no, se pierde)
          t.update('rooms/' + code, { status: 'closed', updatedAt: ahora() });
          return { ok: true, cerrada: true };
        }
        if (stakeTbl || room.tour) {
          const ng = clone(g); ng.seq++;
          ng.matchOver = stakeTbl && ahora() - (room.startedAt || 0) < R.CORTE_TEMPRANO_MS ? { winner: -1, cancelled: true } : { winner: 1 - (seat % 2), forfeit: uid };
          const L = await leerParaCierre(t, room, ng);
          cerrar(t, code, room, ng, g, L);
          aplicar(t, code, room, g, ng);
          return { ok: true, cancelada: !!ng.matchOver.cancelled };
        }
        // online sin entrada: la derrota cuenta ya, y la IA sigue en tu lugar
        if ((room.abandonos || {})[uid]) return { ok: true, ya: true };
        const w = walOf(await t.get('wallets/' + uid)), u = await t.get('users/' + uid), rec = await t.get('users/' + uid + '/matches/' + g.matchId);
        w.stats.played++; w.stats.streak = 0; w.stats.ast = 0;
        eventos(t, uid, w, ['match_played'], g.matchId + ':m');
        w.applied.push(g.matchId + ':done');
        t.set('wallets/' + uid, w);
        if (u && !rec) {
          t.set('users/' + uid + '/matches/' + g.matchId, { roomId: code, matchId: g.matchId, type: room.type, won: false, team: seat % 2, abandoned: true, at: ahora(), server: true });
          t.update('users/' + uid, { stats: nextStats(u.stats, false), lastMatchId: g.matchId });
        }
        t.set('profiles/' + uid, { won: w.stats.won, played: w.stats.played, best: w.stats.best }, { merge: true });
        t.update('rooms/' + code, { abandonos: Object.assign({}, room.abandonos || {}, { [uid]: ahora() }), updatedAt: ahora() });
        return { ok: true, abandono: true };
      });
    }

    /* ---------- torneos ---------- */
    const tCap = (tt) => tt.maxTeams * (tt.mode === '2v2' ? 2 : 1);
    const other = (s) => (s === 'a' ? 'b' : 'a');
    const potOf = (tt) => (tt.status === 'open' || tt.pot == null) ? Math.floor((tt.players || 0) * (tt.buyIn || 0) * (100 - R.T_CUT) / 100) : tt.pot;
    function prizesOf(tt, nTeams) {
      const pot = potOf(tt), split = tt.split || R.T_SPLIT;
      const places = Math.max(1, Math.min(split.length, nTeams || split.length));
      const shares = split.slice(0, places); shares[0] += split.slice(places).reduce((a, b) => a + b, 0);
      const total = shares.reduce((a, b) => a + b, 0);
      const out = shares.map((s) => Math.floor(pot * s / total)); out[0] += pot - out.reduce((a, b) => a + b, 0);
      return out;
    }
    const shareOf = (prize, team, uid) => { const n = team.ids.length, base = Math.floor(prize / n); return team.ids[0] === uid ? prize - base * (n - 1) : base; };
    function standingsOf(tt, matches) {
      const rows = (tt.teams || []).map((tm, i) => ({ team: tm, key: tm.ids.join(','), i, w: 0, l: 0, pf: 0, pa: 0 }));
      const by = Object.fromEntries(rows.map((r) => [r.key, r]));
      for (const m of matches) {
        if (!m.winner || !m.a || !m.b) continue;
        const A = by[m.a.ids.join(',')], B = by[m.b.ids.join(',')]; if (!A || !B) continue;
        const [pa, pb] = m.pts || [0, 0]; A.pf += pa; A.pa += pb; B.pf += pb; B.pa += pa;
        if (m.winner === 'a') { A.w++; B.l++; } else { B.w++; A.l++; }
      }
      return rows.sort((x, y) => y.w - x.w || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf || x.i - y.i);
    }
    /** Podio calculado de nuevo desde los partidos (no se confía en el que escribió un jugador). */
    function placesOf(tt, matches) {
      if (tt.format === 'liga') {
        if (!matches.length || matches.some((m) => !m.winner)) return null;
        const s = standingsOf(tt, matches);
        return { p1: s[0] ? s[0].team : null, p2: s[1] ? s[1].team : null, p3: s[2] ? s[2].team : null };
      }
      const fin = matches.find((m) => m.final); if (!fin || !fin.winner) return null;
      const p1 = fin[fin.winner], p2 = fin[other(fin.winner)] || null; let p3 = null;
      const third = matches.find((m) => m.third);
      if (third) { if (!third.winner) return null; p3 = third[third.winner]; }
      else { const semi = matches.find((m) => m.round === fin.round - 1 && !m.bye && m.winner); if (semi) p3 = semi[other(semi.winner)] || null; }
      return { p1, p2, p3 };
    }

    async function torneo(ctx, d) {
      const uid = ctx.uid, tid = String(d.tid || ''), op = d.op;
      if (!uid) throw err('sin-sesion');
      if (op === 'cobrar') {
        const matches = await S.list('tournaments/' + tid + '/matches');
        return S.tx(async (t) => {
          const tt = await t.get('tournaments/' + tid);
          if (!tt || (tt.status !== 'finished' && tt.status !== 'cancelled')) return { ok: false, motivo: 'estado' };
          const claim = await t.get('tournaments/' + tid + '/claims/' + uid);
          const entry = await t.get('tournaments/' + tid + '/entries/' + uid);
          if (claim || !entry) return { ok: false, motivo: claim ? 'ya' : 'no-inscripto' };
          const w = walOf(await t.get('wallets/' + uid));
          let kind = 'reintegro', place = 0, amount = tt.buyIn || 0;
          if (tt.status === 'finished') {
            kind = 'premio'; amount = 0;
            const places = placesOf(tt, matches);
            if (!places) return { ok: false, motivo: 'sin-podio' };
            const prizes = prizesOf(tt, (tt.teams || []).length);
            ['p1', 'p2', 'p3'].forEach((p, i) => { const tm = places[p]; if (tm && tm.ids.includes(uid)) { place = i + 1; amount = shareOf(prizes[i] || 0, tm, uid); } });
          }
          const at = ahora();
          t.set('tournaments/' + tid + '/claims/' + uid, { uid, kind, place, amount, at, server: true });
          if (amount > 0) {
            t.set('tournaments/' + tid + '/ledger/' + uid + '-' + at + '-' + kind, { uid, kind, place, amount, at });
            mover(t, uid, w, { key: 'tour:' + tid + ':claim', chips: amount, tipo: kind === 'premio' ? 'premio de torneo' : 'torneo cancelado: entrada devuelta', ref: tid });
          } else w.applied.push('tour:' + tid + ':claim');
          delete w.tours[tid];
          t.set('wallets/' + uid, w);
          return { ok: true, kind, place, amount };
        });
      }
      return S.tx(async (t) => {
        const tt = await t.get('tournaments/' + tid);
        if (!tt) throw err('no-existe', 'Ese torneo ya no existe');
        const eRef = 'tournaments/' + tid + '/entries/' + uid;
        const mine = await t.get(eRef);
        const w = walOf(await t.get('wallets/' + uid));
        if (op === 'inscribir') {
          await noSuspendido(ctx, t);
          if (tt.status !== 'open') return { ok: false, reason: 'cerrado' };
          if (mine) return { ok: false, reason: 'ya' };
          if ((tt.players || 0) >= tCap(tt)) return { ok: false, reason: 'lleno' };
          const at = ahora();
          if (tt.startAt && at >= tt.startAt) return { ok: false, reason: 'cerrado' };
          let teamId = uid;
          const team = d.team;
          let partnerEntry = null;
          if (team && team !== uid) {
            if (tt.mode !== '2v2') return { ok: false, reason: 'modo' };
            partnerEntry = await t.get('tournaments/' + tid + '/entries/' + team);
            if (!partnerEntry || partnerEntry.team !== team || partnerEntry.partner) return { ok: false, reason: 'pareja' };
            if (partnerEntry.invite && partnerEntry.invite !== uid) return { ok: false, reason: 'reservada' };
            teamId = team;
          }
          if (!mover(t, uid, w, { chips: -(tt.buyIn || 0), tipo: 'entrada de torneo', ref: tid })) return { ok: false, reason: 'fichas' };
          if (partnerEntry) t.update('tournaments/' + tid + '/entries/' + team, { partner: uid });
          t.set(eRef, { uid, name: String(d.name || '').slice(0, 24), av: d.av || 'gaucho', team: teamId, partner: null, at,
            invite: teamId === uid && tt.mode === '2v2' && d.invite && d.invite !== uid ? d.invite : null });
          t.update('tournaments/' + tid, { players: (tt.players || 0) + 1, updatedAt: at });
          t.set('tournaments/' + tid + '/ledger/' + uid + '-' + at + '-in', { uid, kind: 'entrada', amount: tt.buyIn || 0, at });
          w.tours[tid] = { at };
          t.set('wallets/' + uid, w);
          return { ok: true, at, buyIn: tt.buyIn || 0 };
        }
        if (op === 'baja') {
          if (!mine) return { ok: false };
          if (tt.status !== 'open') return { ok: false, reason: 'empezado' };
          let partner = null;
          if (mine.team !== uid) partner = await t.get('tournaments/' + tid + '/entries/' + mine.team);
          if (partner && partner.partner === uid) t.update('tournaments/' + tid + '/entries/' + mine.team, { partner: null });
          t.del(eRef);
          t.update('tournaments/' + tid, { players: Math.max(0, (tt.players || 0) - 1), updatedAt: ahora() });
          t.set('tournaments/' + tid + '/ledger/' + uid + '-' + mine.at + '-out', { uid, kind: 'baja', amount: tt.buyIn || 0, at: ahora() });
          mover(t, uid, w, { chips: tt.buyIn || 0, tipo: 'baja de torneo: entrada devuelta', ref: tid });
          delete w.tours[tid];
          t.set('wallets/' + uid, w);
          return { ok: true, at: mine.at, buyIn: tt.buyIn || 0 };
        }
        throw err('operacion');
      });
    }

    /* ---------- administración ---------- */
    async function admin(ctx, d) {
      if (!(await esAdmin(ctx))) throw err('no-admin', 'Solo para administradores');
      const audit = (t, action, target, detail) => t.add('auditLog', { by: ctx.uid, byName: ctx.name || '', action, target: target || null, detail: detail == null ? null : detail, at: ahora() });
      if (d.op === 'ajustar') {
        const chips = Math.round(+d.chips || 0), coins = Math.round(+d.coins || 0);
        if (!chips && !coins) throw err('valor');
        return S.tx(async (t) => {
          const w = walOf(await t.get('wallets/' + d.uid));
          mover(t, d.uid, w, { chips: Math.max(chips, -w.chips), coins: Math.max(coins, -w.coins), tipo: 'ajuste del admin', ref: String(d.motivo || '').slice(0, 120) });
          t.set('wallets/' + d.uid, w);
          audit(t, 'ajustar saldo', d.uid, { chips, coins, reason: String(d.motivo || '').slice(0, 120) });
          return { ok: true, chips: w.chips, coins: w.coins };
        });
      }
      if (d.op === 'compra') {
        return S.tx(async (t) => {
          const p = await t.get('purchases/' + d.id);
          if (!p || p.status !== 'pendiente') return { ok: false, motivo: 'estado' };
          if (d.ok) {
            const w = walOf(await t.get('wallets/' + p.uid));
            mover(t, p.uid, w, { key: 'mp:' + d.id, coins: +p.coins || 0, tipo: 'compra con Mercado Pago', ref: d.id });
            t.set('wallets/' + p.uid, w);
          }
          t.update('purchases/' + d.id, { status: d.ok ? 'acreditada' : 'rechazada', applied: !!d.ok, decidedAt: ahora() });
          audit(t, d.ok ? 'acreditar compra' : 'rechazar compra', d.id);
          return { ok: true };
        });
      }
      throw err('operacion');
    }

    return { billetera, salaEmpezar, salaJugar, salaAvanzar, salaSalir, torneo, admin, _: { publica, placesOf, prizesOf, hoy, R } };
  }

  return { crear, R };
});
