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

## Lo cosmético

| Colección | Contenido | Quién escribe |
|---|---|---|
| `profiles/{uid}` | `av`, `dorso`, `nick`, `code` (código de amigo), `friends`, `pts`, `copas` (porotos) | El propio jugador |
| `wallets/{uid}` | `chips`, `coins`, `owned`, `eq`, misiones, logros | El propio jugador (nadie más la puede leer) |
| `premium/{uid}` | `{ "on": true }` | Solo admins |
| `invites/{id}` | `{ "from", "to", "code", "at" }` | Quien invita; la borra cualquiera de los dos |

Las reglas de acceso completas están en [`firestore.rules`](../firestore.rules).
