/*
  Pruebas del servidor (functions/nucleo.js) con la base en memoria.
  Uso: node tests/servidor.test.js     (lo corre también tests/test_servidor.py)
*/
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const M = require(path.join(ROOT, 'functions/compartido/motor.js'));
const C = require(path.join(ROOT, 'functions/compartido/catalogo.json'));
const { crear } = require(path.join(ROOT, 'functions/nucleo.js'));
const { crearMemoria } = require(path.join(ROOT, 'functions/memoria.js'));

let reloj = Date.UTC(2026, 9, 27, 15, 0, 0);
const ahora = () => reloj;
const pasa = (ms) => { reloj += ms; };

function mundo() {
  const S = crearMemoria();
  const N = crear({ motor: M, cat: C, store: S, ahora });
  return { S, N };
}
const ctxOf = (uid, extra) => Object.assign({ uid, email: uid + '@x.com', emailVerified: true }, extra || {});
async function usuario(S, uid, extra) {
  await S.set('users/' + uid, Object.assign({ username: uid, role: 'player', stats: { played: 0, wins: 0, losses: 0, winRate: 0, currentStreak: 0, bestStreak: 0 } }, extra || {}));
  await S.set('wallets/' + uid, { chips: 5000, coins: 1000, owned: [], applied: [] });
}
async function sala(S, code, seats, extra) {
  await S.set('rooms/' + code, Object.assign({ code, n: seats.length, target: 15, flor: true, stake: 0, diff: 'medio', host: seats[0].id, seats, playerIds: seats.filter((s) => s.id).map((s) => s.id), status: 'waiting', created: reloj }, extra || {}));
}
/** Fichas de los jugadores, sin contar lo que pagaron las misiones y los logros (que son aparte del pozo). */
const total = async (S, ids) => { let c = 0; for (const id of ids) c += (await S.get('wallets/' + id)).chips - await mis(S, id); return c; };
/** Monedas que pagaron las misiones y los logros (aparte del premio de la partida). */
const misC = async (S, id) => (await S.list('wallets/' + id + '/movimientos')).filter((m) => m.tipo === 'misiones y logros').reduce((a, m) => a + (m.monedas || 0), 0);
const mis = async (S, id) => (await S.list('wallets/' + id + '/movimientos')).filter((m) => m.tipo === 'misiones y logros').reduce((a, m) => a + (m.fichas || 0), 0);
async function estado(S, code) { return JSON.parse((await S.get('rooms/' + code + '/secreto/estado')).gameJson); }

/** Juega la partida entera: cada humano juega lo que elegiría la IA; los bots y las manos nuevas, con avanzar. */
async function jugarTodo(S, N, code, { max = 4000, abandonar } = {}) {
  for (let k = 0; k < max; k++) {
    const room = await S.get('rooms/' + code);
    if (room.status !== 'playing') return room;
    const g = await estado(S, code);
    if (g.hand.ended) { pasa(3000); const r = await N.salaAvanzar(ctxOf(room.playerIds[0]), { code, seq: g.seq }); assert(r.ok, 'avanzar mano'); continue; }
    const a = M.actor(g), st = g.seats[a];
    if (st.bot || (room.abandonos || {})[st.id]) { pasa(900); const r = await N.salaAvanzar(ctxOf(room.playerIds[0]), { code, seq: g.seq }); assert(r.ok, 'avanzar bot ' + JSON.stringify(r)); continue; }
    pasa(1200);
    await S.set('rooms/' + code + '/presence/' + st.id, { uid: st.id, at: reloj });
    for (const id of room.playerIds) await S.set('rooms/' + code + '/presence/' + id, { uid: id, at: reloj });
    const r = await N.salaJugar(ctxOf(st.id), { code, seq: g.seq, accion: M.aiAct(g, a) });
    assert(r.ok, 'jugar ' + JSON.stringify(r));
    if (abandonar && k === abandonar.en) await abandonar.fn();
  }
  throw new Error('la partida no terminó');
}

const pruebas = [];
const prueba = (n, f) => pruebas.push([n, f]);

prueba('las cartas de los demás no viajan a nadie', async () => {
  const { S, N } = mundo(); await usuario(S, 'a'); await usuario(S, 'b');
  await sala(S, 'AAAA', [{ id: 'a', bot: false }, { id: 'b', bot: false }]);
  await N.salaEmpezar(ctxOf('a'), { code: 'AAAA' });
  const room = await S.get('rooms/AAAA'), pub = JSON.parse(room.gameJson), full = await estado(S, 'AAAA');
  assert.deepStrictEqual(pub.hand.cards, [['?', '?', '?'], ['?', '?', '?']]);
  assert.deepStrictEqual(pub.hand.orig, [[], []]);
  assert.deepStrictEqual((await S.get('rooms/AAAA/manos/a')).orig, full.hand.orig[0]);
  assert.deepStrictEqual((await S.get('rooms/AAAA/manos/b')).orig, full.hand.orig[1]);
  assert(!JSON.stringify(room).includes(full.hand.orig[1][0] + '"') || full.hand.orig[1].every((c) => !JSON.stringify(pub.hand.cards).includes(c)));
});

prueba('mesa con entrada entre dos personas: se cobra, se juega entera y la casa se queda el 10%', async () => {
  const { S, N } = mundo(); await usuario(S, 'a'); await usuario(S, 'b'); await usuario(S, 'c');
  await S.set('referrals/b', { referrer: 'c', played: false, paidReferrer: false });
  await sala(S, 'BBBB', [{ id: 'a', bot: false }, { id: 'b', bot: false }], { stake: 1000 });
  await N.salaEmpezar(ctxOf('a'), { code: 'BBBB' });
  assert.strictEqual(await total(S, ['a', 'b']), 8000);
  const room = await jugarTodo(S, N, 'BBBB');
  assert.strictEqual(room.status, 'finished');
  const g = await estado(S, 'BBBB'), win = g.matchOver.winner === 0 ? 'a' : 'b', lose = win === 'a' ? 'b' : 'a';
  assert.strictEqual(await total(S, ['a', 'b']), 8000 + 1800);
  const ww = await S.get('wallets/' + win), wl = await S.get('wallets/' + lose);
  assert.strictEqual(ww.coins - await misC(S, win), 1060); assert.strictEqual(wl.coins - await misC(S, lose), 1005);
  assert.strictEqual((await S.get('users/' + win)).stats.wins, 1);
  assert.strictEqual((await S.get('users/' + lose)).stats.losses, 1);
  assert((await S.get('users/a/matches/' + g.matchId)) && (await S.get('users/b/matches/' + g.matchId)));
  assert.strictEqual((await S.get('wallets/c')).chips - await mis(S, 'c'), 5000 + 2500, 'el que invitó cobra cuando el invitado juega su primera partida');
  assert.strictEqual((await S.get('referrals/b')).played, true);
  assert.strictEqual((await S.get('wallets/c')).regalo, 2500, 'las fichas por invitar quedan marcadas como regalo (no canjeables)');
  assert.strictEqual(room.rewards[win].chips, 1800);
  // pedirlo de nuevo no paga dos veces
  await assert.rejects(N.salaJugar(ctxOf(win), { code: 'BBBB', accion: { t: 'mazo' } }));
  assert.strictEqual(await total(S, ['a', 'b']), 9800);
});

prueba('jugadas de quien no tiene el turno, inválidas o con la mesa vieja no se aplican', async () => {
  const { S, N } = mundo(); await usuario(S, 'a'); await usuario(S, 'b');
  await sala(S, 'CCCC', [{ id: 'a', bot: false }, { id: 'b', bot: false }]);
  await N.salaEmpezar(ctxOf('a'), { code: 'CCCC' });
  const g = await estado(S, 'CCCC'), a = M.actor(g), quien = g.seats[a].id, otro = quien === 'a' ? 'b' : 'a';
  assert.strictEqual((await N.salaJugar(ctxOf(otro), { code: 'CCCC', seq: g.seq, accion: { t: 'mazo' } })).motivo, 'turno');
  await assert.rejects(N.salaJugar(ctxOf(quien), { code: 'CCCC', seq: g.seq, accion: { t: 'play', card: g.hand.cards[1 - a][0] } }), /válida/);
  assert.strictEqual((await N.salaJugar(ctxOf(quien), { code: 'CCCC', seq: g.seq - 1, accion: { t: 'mazo' } })).motivo, 'tarde');
  await assert.rejects(N.salaJugar(ctxOf('intruso'), { code: 'CCCC', seq: g.seq, accion: { t: 'mazo' } }), /sentado/);
  assert.strictEqual((await estado(S, 'CCCC')).seq, g.seq);
  // jugada buena
  assert((await N.salaJugar(ctxOf(quien), { code: 'CCCC', seq: g.seq, accion: { t: 'play', card: g.hand.cards[a][0] } })).ok);
  // el mismo pedido dos veces (doble toque): el segundo llega tarde
  assert.strictEqual((await N.salaJugar(ctxOf(quien), { code: 'CCCC', seq: g.seq, accion: { t: 'play', card: g.hand.cards[a][1] } })).motivo, 'tarde');
});

prueba('contra la máquina: el servidor juega por los bots y paga según la dificultad', async () => {
  const { S, N } = mundo(); await usuario(S, 'a');
  await sala(S, 'DDDD', [{ id: 'a', bot: false }, { id: null, bot: true }], { diff: 'dificil' });
  await N.salaEmpezar(ctxOf('a'), { code: 'DDDD' });
  const room = await jugarTodo(S, N, 'DDDD');
  const g = await estado(S, 'DDDD'), w = await S.get('wallets/a');
  assert.strictEqual(w.coins - await misC(S, 'a'), 1000 + (g.matchOver.winner === 0 ? 80 : 5));
  assert.strictEqual((await S.get('users/a')).stats.played, 0, 'contra la IA no cuenta en el historial');
  assert(w.mis && w.mis.ids.length === 3 && w.ach.cnt.match_played === 1);
  assert(room.rewards.a);
});

prueba('se acaba el tiempo: antes de 30 s no se puede apurar; después juega el bot por vos', async () => {
  const { S, N } = mundo(); await usuario(S, 'a'); await usuario(S, 'b');
  await sala(S, 'EEEE', [{ id: 'a', bot: false }, { id: 'b', bot: false }]);
  await N.salaEmpezar(ctxOf('a'), { code: 'EEEE' });
  for (const id of ['a', 'b']) await S.set('rooms/EEEE/presence/' + id, { uid: id, at: reloj });
  const g = await estado(S, 'EEEE');
  pasa(10000); for (const id of ['a', 'b']) await S.set('rooms/EEEE/presence/' + id, { uid: id, at: reloj });
  assert.strictEqual((await N.salaAvanzar(ctxOf('a'), { code: 'EEEE', seq: g.seq })).motivo, 'esperando');
  pasa(21000); for (const id of ['a', 'b']) await S.set('rooms/EEEE/presence/' + id, { uid: id, at: reloj });
  assert((await N.salaAvanzar(ctxOf('a'), { code: 'EEEE', seq: g.seq })).ok);
  assert.strictEqual((await estado(S, 'EEEE')).seq, g.seq + 1);
});

prueba('irse de una mesa con entrada: en los primeros 30 s se cancela y se devuelve todo; después pierde el que se fue', async () => {
  const { S, N } = mundo(); await usuario(S, 'a'); await usuario(S, 'b');
  await sala(S, 'FFFF', [{ id: 'a', bot: false }, { id: 'b', bot: false }], { stake: 2000 });
  await N.salaEmpezar(ctxOf('a'), { code: 'FFFF' });
  pasa(5000); await N.salaSalir(ctxOf('b'), { code: 'FFFF' });
  assert.strictEqual((await S.get('rooms/FFFF')).result.cancelled, true);
  assert.strictEqual(await total(S, ['a', 'b']), 10000);
  // revancha y abandono tarde
  await N.salaEmpezar(ctxOf('a'), { code: 'FFFF' });
  assert.strictEqual(await total(S, ['a', 'b']), 6000);
  pasa(60000); await N.salaSalir(ctxOf('b'), { code: 'FFFF' });
  const r = await S.get('rooms/FFFF');
  assert.strictEqual(r.result.forfeit, 'b');
  assert.strictEqual((await S.get('wallets/a')).chips - await mis(S, 'a'), 3000 + 2000 + Math.floor(2000 * 0.9));
  assert.strictEqual((await S.get('wallets/b')).chips, 3000);
});

prueba('ausente en una mesa con entrada: pasado el tiempo de gracia, pierde', async () => {
  const { S, N } = mundo(); await usuario(S, 'a'); await usuario(S, 'b');
  await sala(S, 'GGGG', [{ id: 'a', bot: false }, { id: 'b', bot: false }], { stake: 1000 });
  await N.salaEmpezar(ctxOf('a'), { code: 'GGGG' });
  const g = await estado(S, 'GGGG'), a = M.actor(g), aus = g.seats[a].id, otro = aus === 'a' ? 'b' : 'a';
  pasa(80000); await S.set('rooms/GGGG/presence/' + otro, { uid: otro, at: reloj });
  assert((await N.salaAvanzar(ctxOf(otro), { code: 'GGGG', seq: g.seq })).ok);
  assert.strictEqual((await S.get('rooms/GGGG')).result.forfeit, aus);
});

prueba('tienda: precios del servidor, sin saldo no se compra, no se compra dos veces y lo de los jefes no se vende', async () => {
  const { S, N } = mundo(); await usuario(S, 'a');
  const av = C.AVS.find((x) => x.price > 0);
  await S.set('wallets/a', { chips: 10, coins: 0, owned: [], applied: [] });
  await assert.rejects(N.billetera(ctxOf('a'), { op: 'comprar', tipo: 'av', id: av.id, moneda: 'fichas' }), /alcanzan/);
  await S.set('wallets/a', { chips: av.price * 5, coins: 0, owned: [], applied: [] });
  const r = await N.billetera(ctxOf('a'), { op: 'comprar', tipo: 'av', id: av.id, moneda: 'fichas' });
  assert.strictEqual(r.chips, 0);
  assert((await S.get('wallets/a')).owned.includes('av:' + av.id));
  assert((await N.billetera(ctxOf('a'), { op: 'comprar', tipo: 'av', id: av.id, moneda: 'fichas' })).ya);
  const boss = C.DORSOS.find((x) => x.boss);
  await assert.rejects(N.billetera(ctxOf('a'), { op: 'comprar', tipo: 'dorso', id: boss.id, moneda: 'monedas' }), /no-se-vende/);
  const movs = await S.list('wallets/a/movimientos');
  assert.strictEqual(movs.length, 1); assert.strictEqual(movs[0].fichas, -av.price * 5);
});

prueba('logros nuevos: jefes de La Huella y «Leyenda del truco» al tener todos los demás', async () => {
  const { S, N } = mundo(); await usuario(S, 'a');
  await sala(S, 'GGGG', [{ id: 'a', bot: false }, { id: null, bot: true }], { diff: 'facil', skill: 0.05, boss: true, zone: 'ba' });
  await N.salaEmpezar(ctxOf('a'), { code: 'GGGG' });
  await jugarTodo(S, N, 'GGGG');
  const g = await estado(S, 'GGGG'), w = await S.get('wallets/a');
  if (g.matchOver.winner === 0) { assert.strictEqual(w.ach.cnt.gira_won, 1); assert.strictEqual(w.ach.cnt['boss:ba'], 1); assert(w.ach.done.includes('jefe1')); }
  else assert(!w.ach.cnt['boss:ba']);
  const C = require('../functions/compartido/catalogo.json');
  const w2 = await S.get('wallets/a'); w2.ach.done = C.ACHS.map((x) => x.id).filter((x) => x !== 'todos'); await S.set('wallets/a', w2);
  await N.billetera(ctxOf('a'), { op: 'diario' });
  assert((await S.get('wallets/a')).ach.done.includes('todos'));
});

prueba('premio del día una vez por día y lecciones pagadas una sola vez', async () => {
  const { S, N } = mundo(); await usuario(S, 'a');
  await S.set('wallets/a', { chips: 200, coins: 0, owned: [], applied: [] });
  const r1 = await N.billetera(ctxOf('a'), { op: 'diario' });
  assert.strictEqual(r1.chips, 1000); assert.strictEqual(r1.coins, 30);
  assert((await N.billetera(ctxOf('a'), { op: 'diario' })).ya);
  pasa(24 * 3600e3);
  assert.strictEqual((await N.billetera(ctxOf('a'), { op: 'diario' })).coins, 60);
  for (let i = 0; i < 9; i++) await N.billetera(ctxOf('a'), { op: 'tutorial', i });
  for (let i = 0; i < 9; i++) await N.billetera(ctxOf('a'), { op: 'tutorial', i });
  const w = await S.get('wallets/a');
  assert.strictEqual(w.coins - await misC(S, 'a'), 60 + 9 * 20);
  assert(w.ach.done.includes('alumno'));
});

prueba('cargas de prueba solo para premium; ajustes y compras de Mercado Pago solo para admins', async () => {
  const { S, N } = mundo(); await usuario(S, 'a'); await usuario(S, 'adm', { role: 'admin' });
  await assert.rejects(N.billetera(ctxOf('a'), { op: 'cargar', fichas: 5000 }), /premium/);
  await S.set('premium/a', { on: true });
  await N.billetera(ctxOf('a'), { op: 'cargar', fichas: 5000 });
  await assert.rejects(N.billetera(ctxOf('a'), { op: 'cargar', fichas: 999999 }), /valor/);
  await assert.rejects(N.admin(ctxOf('a'), { op: 'ajustar', uid: 'a', chips: 100000 }), /administradores/);
  await N.admin(ctxOf('adm'), { op: 'ajustar', uid: 'a', chips: -1000, motivo: 'prueba' });
  assert.strictEqual((await S.get('wallets/a')).chips, 9000);
  await S.set('purchases/p1', { uid: 'a', coins: 1100, status: 'pendiente', applied: false });
  await N.admin(ctxOf('adm'), { op: 'compra', id: 'p1', ok: true });
  await N.admin(ctxOf('adm'), { op: 'compra', id: 'p1', ok: true });
  assert.strictEqual((await S.get('wallets/a')).coins, 2100);
  assert((await S.list('auditLog')).length >= 2);
});

prueba('torneo: entrada, baja, y el premio se calcula de los partidos (no del podio que escribió alguien)', async () => {
  const { S, N } = mundo();
  for (const id of ['p1', 'p2', 'p3', 'p4']) await usuario(S, id);
  await S.set('tournaments/T1', { id: 'T1', status: 'open', players: 0, buyIn: 1000, maxTeams: 4, mode: '1v1', format: 'ko', split: [60, 30, 10], teams: [] });
  for (const id of ['p1', 'p2', 'p3', 'p4']) assert((await N.torneo(ctxOf(id), { op: 'inscribir', tid: 'T1', name: id })).ok);
  assert(!(await N.torneo(ctxOf('p1'), { op: 'inscribir', tid: 'T1' })).ok);
  assert.strictEqual((await S.get('wallets/p1')).chips, 4000);
  await N.torneo(ctxOf('p4'), { op: 'baja', tid: 'T1' });
  assert.strictEqual((await S.get('wallets/p4')).chips, 5000);
  await N.torneo(ctxOf('p4'), { op: 'inscribir', tid: 'T1', name: 'p4' });
  const tm = (id) => ({ ids: [id], names: [id] });
  const pot = Math.floor(4000 * 0.9);
  await S.update('tournaments/T1', { status: 'finished', pot, teams: [tm('p1'), tm('p2'), tm('p3'), tm('p4')],
    places: { p1: tm('p4'), p2: tm('p3'), p3: tm('p2') } });   // podio trucho escrito por un jugador
  await S.set('tournaments/T1/matches/R1M0', { id: 'R1M0', round: 1, idx: 0, a: tm('p1'), b: tm('p4'), winner: 'a' });
  await S.set('tournaments/T1/matches/R1M1', { id: 'R1M1', round: 1, idx: 1, a: tm('p2'), b: tm('p3'), winner: 'a' });
  await S.set('tournaments/T1/matches/R2M0', { id: 'R2M0', round: 2, idx: 0, a: tm('p1'), b: tm('p2'), winner: 'a', final: true });
  await S.set('tournaments/T1/matches/P3', { id: 'P3', round: 2, idx: 1, a: tm('p4'), b: tm('p3'), winner: 'b', third: true });
  const r1 = await N.torneo(ctxOf('p1'), { op: 'cobrar', tid: 'T1' });
  assert.strictEqual(r1.amount, Math.floor(pot * 0.6) + (pot - Math.floor(pot * 0.6) - Math.floor(pot * 0.3) - Math.floor(pot * 0.1)));
  { const r4 = await N.torneo(ctxOf('p4'), { op: 'cobrar', tid: 'T1' }); assert.strictEqual(r4.amount, 0, JSON.stringify(r4)); }
  assert.strictEqual((await N.torneo(ctxOf('p1'), { op: 'cobrar', tid: 'T1' })).motivo, 'ya');
  const fichas = await total(S, ['p1', 'p2', 'p3', 'p4']);
  const resto = [(await N.torneo(ctxOf('p2'), { op: 'cobrar', tid: 'T1' })).amount, (await N.torneo(ctxOf('p3'), { op: 'cobrar', tid: 'T1' })).amount];
  assert.strictEqual(fichas + resto[0] + resto[1], 16000 + pot);
});

prueba('2 contra 2 con un bot: termina, y las manos privadas son solo de las personas', async () => {
  const { S, N } = mundo(); for (const id of ['a', 'b', 'c']) await usuario(S, id);
  await sala(S, 'HHHH', [{ id: 'a', bot: false }, { id: 'b', bot: false }, { id: 'c', bot: false }, { id: null, bot: false }]);
  await N.salaEmpezar(ctxOf('a'), { code: 'HHHH' });
  assert(!(await S.get('rooms/HHHH/manos/null')));
  const room = await jugarTodo(S, N, 'HHHH');
  assert.strictEqual(room.status, 'finished');
});

prueba('pase de temporada: experiencia jugando, compra con monedas y premios por nivel (el pase nunca da fichas)', async () => {
  const { S, N } = mundo(); await usuario(S, 'a');
  await sala(S, 'PPPP', [{ id: 'a', bot: false }, { id: null, bot: true }], { diff: 'facil' });
  await N.salaEmpezar(ctxOf('a'), { code: 'PPPP' });
  await jugarTodo(S, N, 'PPPP');
  const g = await estado(S, 'PPPP'), w1 = await S.get('wallets/a');
  assert(w1.pase && w1.pase.xp >= C.SEASON.xp.partida, 'suma experiencia al terminar la partida');
  await assert.rejects(N.billetera(ctxOf('a'), { op: 'paseCobrar', track: 'prem', l: 1 }), /pase|nivel/);
  // lo llevamos al nivel 6
  await S.set('wallets/a', Object.assign(w1, { pase: { id: C.SEASON.id, xp: 650, prem: false, cf: [], cp: [] }, coins: 1000 }));
  const antes = (await S.get('wallets/a')).chips;
  await N.billetera(ctxOf('a'), { op: 'paseCobrar', track: 'free', l: 2 });
  await N.billetera(ctxOf('a'), { op: 'paseCobrar', track: 'free', l: 2 });
  assert.strictEqual((await S.get('wallets/a')).chips - antes, 300, 'se cobra una sola vez');
  await assert.rejects(N.billetera(ctxOf('a'), { op: 'paseCobrar', track: 'free', l: 8 }), /nivel/);
  await assert.rejects(N.billetera(ctxOf('a'), { op: 'comprar', tipo: 'dorso', id: 'guitarra', moneda: 'monedas' }), /no-se-vende/);
  await N.billetera(ctxOf('a'), { op: 'paseComprar' });
  assert.strictEqual((await S.get('wallets/a')).coins, 1000 - C.SEASON.price);
  await N.billetera(ctxOf('a'), { op: 'paseCobrar', track: 'prem', l: 1 });
  assert((await S.get('wallets/a')).owned.includes('dorso:guitarra'));
  assert(C.SEASON.prem.every((r) => r.t !== 'chips'), 'el camino del pase no tiene fichas');
});

(async () => {
  let ok = 0;
  for (const [n, f] of pruebas) {
    try { await f(); ok++; console.log('ok  ' + n); } catch (e) { console.log('MAL ' + n + '\n    ' + (e && e.stack || e)); process.exitCode = 1; }
  }
  console.log(`${ok} de ${pruebas.length} pruebas del servidor bien`);
})();
