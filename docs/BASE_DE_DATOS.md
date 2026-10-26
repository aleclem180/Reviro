# Estructura de la base de datos

Reviro usa **Cloud Firestore** (base de documentos en tiempo real) y **Firebase Authentication** (cuentas con mail y contraseña).

## Vista general

```
usernames/{usuario}            reserva única del nombre de usuario
users/{uid}                    perfil, rol y estadísticas
  ├─ matches/{matchId}         una entrada por partida contada (evita contar dos veces)
  └─ private/account           mail (solo lo ve el dueño y los admins)
rooms/{código}                 sala y estado de la partida en tiempo real
  ├─ presence/{uid}            latido de cada jugador conectado
  └─ events/{id}               reacciones y señas
tournaments/{tid}              torneo: datos, pozo, parejas armadas y podio
  ├─ entries/{uid}             inscripciones
  ├─ matches/{mid}             cruces (llave o fechas de la liga)
  └─ claims/{uid}              premio o reintegro ya cobrado (uno por jugador)
profiles/{uid}                 personaje, apodo, código de amigo, amigos, puntos de ranking
wallets/{uid}                  fichas, monedas y cosas compradas (privado)
premium/{uid}                  cuentas premium (solo las escribe un admin)
invites/{id}                   invitaciones a una mesa
```

## Usuarios, roles y estadísticas

### `usernames/{usuario en minúsculas}`

```json
{ "uid": "Xb12...9" }
```

Garantiza que no haya dos usuarios con el mismo nombre. Se crea en la misma transacción que `users/{uid}`.

### `users/{uid}`

```json
{
  "username": "ElAle",
  "usernameLower": "elale",
  "role": "admin",
  "avatar": "gaucho",
  "createdAt": "2026-10-23T23:40:00Z",
  "lastMatchId": "PNJT-mvln47sy",
  "stats": {
    "played": 12,
    "wins": 8,
    "losses": 4,
    "winRate": 0.6667,
    "currentStreak": 3,
    "bestStreak": 5
  }
}
```

| Campo | Qué es |
|---|---|
| `role` | `"player"` (jugador) o `"admin"`. Solo un admin puede cambiarlo. |
| `stats.played` | Partidas jugadas en total. |
| `stats.winRate` | Partidas ganadas sobre jugadas, de 0 a 1 (0,6667 = 66,67 %). |
| `stats.currentStreak` | Racha actual: positiva con victorias seguidas (`3` = tres ganadas), negativa con derrotas (`-2` = dos perdidas). |
| `stats.bestStreak` | Mejor racha histórica de victorias. |
| `lastMatchId` | Última partida sumada. Las reglas lo usan para validar cada actualización. |

**Admin fijo:** `alejandro.clemente05@gmail.com` es admin siempre que tenga el mail verificado. Está escrito en `firestore.rules` (función `isFixedAdmin`) y en `js/net.js` (`ADMIN_EMAILS`). Además puede nombrar a otros admins desde Ajustes.

### `users/{uid}/matches/{matchId}`

```json
{ "roomId": "PNJT", "matchId": "PNJT-mvln47sy", "type": "2v2", "won": false, "team": 0, "at": "..." }
```

Se crea una sola vez por partida y por jugador. Si ya existe, la partida no se vuelve a contar.

**Abandono:** si un jugador sale de una partida que sigue en juego, se crea el registro en ese momento con `"won": false, "abandoned": true` y se le suma una derrota (corta la racha). Cuando la partida termina con la IA en su lugar, ya no se le vuelve a contar. Una partida contra la IA que quedó a medias más de 15 minutos (por ejemplo, se cerró la pestaña) también se cuenta como abandono la próxima vez que inicia sesión. Las reglas solo aceptan `abandoned` si la sala sigue en `playing` con ese `matchId`.

### `users/{uid}/private/account`

```json
{ "email": "alejandro.clemente05@gmail.com" }
```

## Salas en tiempo real

### `rooms/{código}`

```json
{
  "code": "PNJT",
  "type": "2v2",
  "n": 4,
  "target": 30,
  "flor": true,
  "stake": 0,
  "diff": "medio",
  "host": "uidDelAnfitrion",
  "seats": [
    { "id": "uid1", "bot": false },
    { "id": "uid2", "bot": false },
    { "id": "uid3", "bot": false },
    { "id": null,   "bot": true }
  ],
  "playerIds": ["uid1", "uid2", "uid3"],
  "teams": { "uid1": 0, "uid2": 1, "uid3": 0 },
  "status": "playing",
  "gameJson": "{\"seq\":42,\"scores\":[8,11],\"hand\":{...}}",
  "seq": 42,
  "matchId": "PNJT-mvln47sy",
  "result": null,
  "created": 1792800550792,
  "updatedAt": 1792800612955
}
```

| Campo | Qué es |
|---|---|
| `type` | `"1vIA"` (vos contra la IA), `"1v1"` o `"2v2"`. |
| `seats` | Asientos en orden de juego. Los asientos 1 y 3 son un equipo y 2 y 4 el otro. `bot: true` = lo juega la IA. |
| `playerIds` | Las personas sentadas (para buscar salas y para los permisos). |
| `teams` | Equipo de cada persona (0 o 1). Se fija al lanzar la partida. |
| `status` | `waiting` (esperando gente), `playing`, `finished` o `closed`. |
| `gameJson` | Estado completo de la partida: manos, bazas, cantos, puntos. Va como texto porque Firestore no admite listas dentro de listas, y las manos de cartas lo son. |
| `seq` | Número de jugada. Cada jugada nueva tiene que ser exactamente `seq + 1`: así se evitan choques. |
| `result` | Al terminar: `{ "matchId": "...", "winnerTeam": 1 }`. Es la base para sumar las estadísticas. |

**Ciclo de una sala:** `waiting` → (el anfitrión la lanza, la IA ocupa los lugares vacíos) → `playing` → `finished` → (revancha) → `playing`… o `closed`.

### `rooms/{código}/presence/{uid}`

```json
{ "uid": "uid1", "at": 1792800612955 }
```

Cada jugador lo reescribe cada 15 segundos. Si alguien no aparece en 45 segundos, la IA juega por él hasta que vuelve, y si era el anfitrión, otro jugador pasa a manejar la mesa.

### `rooms/{código}/events/{id}`

```json
{ "topic": "react", "data": { "seat": 2, "k": "vamos" }, "by": "uid3", "at": 1792800612955 }
```

## Torneos

La entrada y el premio se pagan en **fichas**, que no tienen valor en dinero: no se compran ni se cambian por plata. Cobrar entrada en dinero real y repartir un pozo es un juego de apuestas online y necesita licencia (en CABA, LOTBA; en Provincia, IPLyC), así que Reviro no lo hace.

### `tournaments/{tid}`

```json
{
  "id": "QWERTYUI", "name": "Copa del Fogón", "theme": "Truco de pulpería", "rules": "…",
  "startAt": 1793000000000, "format": "ko", "mode": "1v1", "maxTeams": 8,
  "buyIn": 100, "target": 15, "flor": true, "cut": 10, "split": [60, 30, 10],
  "status": "open", "players": 5, "pot": null, "teams": [], "places": null,
  "createdBy": "uid-admin", "created": 1792990000000, "updatedAt": 1792990000000
}
```

- `format`: `ko` (eliminación directa) o `liga` (todos contra todos). `mode`: `1v1` o `2v2`. El admin los elige en cada torneo.
- `status`: `open` (inscripción) → `running` → `finished`, o `cancelled`.
- **Pozo dinámico:** mientras la inscripción está abierta, el pozo es `players × buyIn × 90%` y crece con cada inscripto. Al empezar se fija en `pot`. El 10% (`cut`) queda para la casa: esas fichas salen de circulación.
- **Reparto:** 1.º 60%, 2.º 30%, 3.º 10% del pozo. Si hay menos de tres equipos, lo que sobra va al primero. En parejas, cada uno cobra la mitad del premio del equipo; si el compañero es la IA, el jugador cobra todo.
- `teams`: las parejas o jugadores, ya sorteados al empezar: `[{ "ids": ["uid1", "uid2"], "names": ["Ale", "Bruno"], "bot": false }]`.
- `places`: el podio cuando termina, `{ "p1": equipo, "p2": equipo, "p3": equipo | null }`.

### `tournaments/{tid}/entries/{uid}`

`{ "uid", "name", "av", "team", "partner", "at" }`. En 2v2, `team` es el uid de quien armó la pareja, y `partner` (en la inscripción de quien la armó) es el que se sumó. Al empezar, los que quedaron solos se juntan de a dos; si sobra uno, juega con la IA de compañero.

### `tournaments/{tid}/matches/{mid}`

```json
{ "id": "R1M0", "round": 1, "idx": 0, "label": "Semifinal",
  "a": { "ids": ["uid1"], "names": ["Ale"], "bot": false }, "b": { "ids": ["uid2"], "names": ["Caro"], "bot": false },
  "room": "TQWERTYUI-R1M0", "winner": null, "pts": null,
  "bye": false, "from": null, "loser": false, "final": false, "third": false, "wo": false, "forfeit": false }
```

- **Eliminación:** la llave se arma a la potencia de 2 siguiente; los que sobran pasan directo en la primera ronda (`bye`). `from` dice de qué partidos salen los dos lugares de la ronda siguiente. Con cuatro equipos o más hay partido por el tercer puesto (`P3`, con `loser: true`: juegan los perdedores de las semifinales).
- **Liga:** todos contra todos, ordenados en fechas (`L0`, `L1`, …). La tabla se ordena por partidos ganados, después diferencia de puntos y después puntos a favor.
- Cada partido se juega en la sala `room` (la crea el primero que entra, con los asientos ya reservados). Arranca sola cuando llegan todos; pasados 5 minutos se puede empezar con la IA en lugar de los que faltan.
- Cuando la sala termina, cualquiera de los jugadores anota el `winner`. Las reglas solo lo aceptan si coincide con el resultado de la sala. Después, el ganador pasa al lugar que le toca en la ronda siguiente, y las reglas verifican que sea el ganador (o el perdedor, en el tercer puesto) del partido anterior.
- **Abandono:** salir de una partida de torneo en juego te la da por perdida (`forfeit`) y te suma una derrota.
- El admin puede dar un partido por ganado si alguien no se presenta (`wo: true`).

### `tournaments/{tid}/claims/{uid}`

`{ "uid", "kind": "premio" | "reintegro", "place", "amount", "at" }`. Se crea una sola vez: con eso nadie cobra dos veces. Si el torneo se cancela, cada inscripto recupera su entrada.

## Lo cosmético

| Colección | Contenido | Quién escribe |
|---|---|---|
| `profiles/{uid}` | `av`, `dorso`, `nick`, `code` (código de amigo), `friends`, `pts`, `copas` (porotos) | El propio jugador |
| `wallets/{uid}` | `chips`, `coins`, `owned`, `eq`, misiones, logros | El propio jugador (nadie más la puede leer) |
| `premium/{uid}` | `{ "on": true }` | Solo admins |
| `invites/{id}` | `{ "from", "to", "code", "at" }` | Quien invita; la borra cualquiera de los dos |

Las reglas de acceso completas están en [`firestore.rules`](../firestore.rules).
