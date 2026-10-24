# Código clave

Todo lo de red está en [`js/net.js`](../js/net.js). La interfaz ([`src/ui.js`](../src/ui.js)) lo llama a través de `window.NET`.

## 1. Crear una sala (lobby)

El creador queda sentado en el asiento 1. El código de 4 letras se reserva dentro de una transacción, así dos salas nunca comparten código. Para jugar contra la IA se crea igual, pero con los demás asientos ya ocupados por bots (`bots: n - 1`).

```js
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
```

Los demás entran con `join`, que también es una transacción: si dos personas entran al mismo tiempo, cada una queda en un asiento distinto.

```js
/** Entrar a una sala: te sienta en el primer asiento libre (dentro de la transacción, así dos personas que entran a la vez no chocan). */
const join = (code) => updateSeats(code, (seats) => {
  const uid = me().uid;
  if (seats.some((x) => x.id === uid)) return null;
  const i = seats.findIndex((x) => !x.id && !x.bot);
  if (i < 0) return null;
  seats[i] = { id: uid, bot: false };
  return seats;
});
```

## 2. Lanzar la partida: la IA completa los lugares vacíos

Al lanzar, todo asiento vacío pasa a ser de la IA. En una 2v2 con 3 personas, el cuarto lugar lo juega un bot. También se fijan los equipos (`teams`), que después se usan para las estadísticas. `buildGame` arma el estado inicial con el motor del juego (`newMatch`).

```js
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
```

Desde la interfaz:

```js
NET.rooms.startRoom(T.code, (seats, d) => newMatch({
  n: d.n, target: d.target, stake: d.stake, flor: d.flor !== false,
  seats: seats.map(s => ({ id: s.id, bot: !!s.bot })),
  matchId: d.code + '-' + Date.now().toString(36), diff: d.diff || 'medio',
}));
```

## 3. Sincronizar la partida entre los clientes

**Escuchar:** cada cliente se suscribe al documento de la sala con `onSnapshot`. Cada vez que alguien juega, Firestore manda el estado nuevo a todos en tiempo real.

```js
function openTable(code){code=code.toUpperCase();if(unsubTable)unsubTable();tableRef=db.doc('tables/'+code);T=null;view='room';G=null;panel=null;
  try{localStorage.setItem('reviro.table',code)}catch(e){}render();joinRoom(code);
  let first=true;unsubTable=tableRef.onSnapshot(s=>{onTable(s,first);first=false},()=>toast('Se cortó la conexión con la mesa'))}
```

**Jugar:** cada jugada es una transacción que solo se guarda si la sala sigue exactamente en la jugada anterior (`seq`). Si otro jugador movió primero, no se escribe nada y el cliente adopta el estado real. Así nunca hay dos versiones distintas de la mano.

```js
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
```

**Corregir:** si lo que ve un cliente no coincide con lo guardado, se queda con lo guardado.

```js
function reconcile(){if(busy||mode!=='online'||!T||!T.game)return;if(!G||gsig(G)!==gsig(T.game))setG(T.game)}
```

**Bots y repartos:** los maneja un solo cliente, el anfitrión. Si se desconecta (no escribe su presencia en 45 segundos), otro jugador conectado toma su lugar y la IA juega por el ausente hasta que vuelva.

## 4. Actualizar las estadísticas al terminar

Cuando la sala pasa a `finished`, cada jugador registra su propio resultado con una transacción. Crea `users/{uid}/matches/{matchId}`: si ya existía, no hace nada, así una partida nunca se cuenta dos veces. Calcula partidas, win rate, racha actual (positiva o negativa) y mejor racha.

```js
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
    const o = { ...EMPTY_STATS, ...(us.data().stats || {}) };
    const won = room.result.winnerTeam === room.teams[uid];
    const played = o.played + 1;
    const wins = o.wins + (won ? 1 : 0);
    const currentStreak = won ? (o.currentStreak > 0 ? o.currentStreak + 1 : 1) : (o.currentStreak < 0 ? o.currentStreak - 1 : -1);
    const stats = {
      played, wins, losses: o.losses + (won ? 0 : 1),
      winRate: wins / played,
      currentStreak,
      bestStreak: Math.max(o.bestStreak, currentStreak),
    };
    tx.set(recRef, { roomId: room.code, matchId, type: room.type, won, team: room.teams[uid], at: serverTimestamp() });
    tx.update(uRef, { stats, lastMatchId: matchId });
    return { won, stats };
  });
}
```

Se llama cuando el cliente ve la sala terminada, y también al iniciar sesión (`recordPending`) para las partidas que terminaron mientras el jugador no estaba:

```js
function fbRecord(code,matchId){if(RECORDED.has(matchId))return;RECORDED.add(matchId);
  NET.stats.recordMatch(code).then(r=>{if(r&&r.stats){MYUSER=Object.assign({},MYUSER,{stats:r.stats});render()}}).catch(()=>RECORDED.delete(matchId))}
```

**Del lado del servidor**, las reglas de [`firestore.rules`](../firestore.rules) verifican cada actualización: que el registro de la partida sea nuevo, que coincida con el resultado guardado en la sala (`validRecord`) y que las cuentas sean exactas (`validStats`: jugadas +1, ganadas o perdidas +1, racha y mejor racha bien calculadas).

## Lo que conviene saber

- **Sin servidor propio, los clientes calculan las jugadas.** Las reglas impiden tocar las estadísticas o el rol de otro, contar dos veces una partida o inventar un resultado distinto al de la sala. Pero un jugador con conocimientos técnicos podría leer el estado completo de la sala (incluidas las cartas de los demás) o forzar el resultado de una partida contra la IA. Para un juego entre amigos alcanza. Para cerrarlo del todo, la lógica de las jugadas tiene que pasar a **Cloud Functions**, que requieren el plan Blaze de Firebase.
- **La Huella y el tutorial son de práctica:** corren en el dispositivo y no suman a las estadísticas.
