# Modo servidor de Reviro

Con el modo servidor, las partidas online y la billetera las maneja el servidor (Cloud Functions de Firebase),
no la página de cada jugador. Mientras está **apagado**, Reviro funciona exactamente como siempre.

## Qué cambia cuando está prendido

**Partidas online (mesas, contra la máquina, La Huella y torneos)**
- El servidor reparte y guarda la partida completa en un lugar que nadie puede leer.
- Cada jugador recibe **solo sus cartas**. La mesa pública tiene las de los demás tapadas hasta que termina la mano.
- Cada jugada la valida el servidor con el mismo motor del juego: no se puede jugar fuera de turno, mandar una jugada
  inválida ni inventar un resultado.
- El servidor juega por los bots, por quien se quedó sin tiempo (30 s) y por quien se fue o no responde.
  En mesas con entrada, quien desaparece más de 72 s pierde la partida.
- Al terminar, el servidor paga: entradas y premios de mesas, monedas por ganar, puntos del ranking, estadísticas,
  misiones y logros, el premio de quien invitó a un amigo y el resultado del partido de torneo.

**Billetera**
- Nadie puede escribir su propio saldo. Las fichas y monedas solo se mueven desde el servidor:
  premio del día, tienda (con los precios del servidor), lecciones del tutorial (una vez cada una),
  cargas de prueba de las cuentas premium, invitaciones, torneos (entrada, baja y premio calculado desde los partidos),
  compras de Mercado Pago (las acredita el admin) y ajustes del admin.
- Cada movimiento queda anotado en `wallets/{uid}/movimientos` y no se puede borrar. El admin los ve en la ficha
  de cada jugador (Ajustes → Admin → Jugadores → Ver).
- Lo que no es dinero (personaje elegido, apodo, amigos, idioma, progreso de La Huella) lo sigue guardando
  el jugador, ahora en `userdata/{uid}`.

**No hay retiros.** Las fichas no tienen valor en dinero y este servidor no convierte fichas en plata.

## Cómo prenderlo

1. **Plan Blaze.** En la consola de Firebase, en el proyecto `reviro-e2336`: ícono de engranaje → Uso y facturación →
   Detalles y configuración → Modificar plan → Blaze. Poné una **alerta de presupuesto** (por ejemplo, US$ 10).
2. **Herramientas.** En tu compu, con Node 20 instalado:
   ```
   npm install -g firebase-tools
   firebase login
   ```
3. **Subir las funciones y las reglas.** Desde la carpeta del repositorio:
   ```
   cd functions && npm install && cd ..
   firebase deploy --only functions,firestore:rules --project reviro-e2336
   ```
   Las funciones quedan en la región `southamerica-east1` (San Pablo).
4. **Probar y prender.** En Reviro, con tu cuenta de admin: Ajustes → Admin → Servidor → **Probar el servidor**.
   Si responde bien, **Prender modo servidor**. Todos los jugadores recargan la página solos.

Para volver atrás: Ajustes → Admin → Servidor → **Apagar modo servidor**.

## Para el que programa

- `functions/nucleo.js`: toda la lógica (partidas, billetera, torneos, admin). No depende de Firebase: recibe
  una base con `get`, `list`, `set`, `update`, `add` y transacciones.
- `functions/index.js`: la conecta con Firestore y la expone como funciones (`billetera`, `salaEmpezar`, `salaJugar`,
  `salaAvanzar`, `salaSalir`, `torneo`, `admin`).
- `functions/compartido/`: el motor del juego y el catálogo de la tienda, generados desde `src/` por `tools/build.py`
  (así el servidor usa las mismas reglas y los mismos precios que la página). En el servidor, el mazo se mezcla
  con números al azar criptográficos.
- `functions/memoria.js` + `tests/servidor.test.js`: pruebas con una base en memoria (`node tests/servidor.test.js`).
- Reglas: `firestore.rules` tiene la función `srv()`, que lee `config/servidor.on` y cierra lo que en modo servidor
  escribe solo el servidor (billeteras, partidas, estadísticas, ranking, torneos, referidos).

## Límites que quedan

- **Misiones y lecciones:** el servidor cuenta las misiones de las partidas que él maneja. Las lecciones del tutorial
  se juegan en la página, así que su premio (20 monedas cada una, una sola vez) se paga cuando la página avisa.
- **Cuentas múltiples:** el servidor no puede saber si dos cuentas son de la misma persona. El premio por invitar solo
  se paga si el invitado juega contra otra persona que no sea quien lo invitó; el admin puede revisar los movimientos
  y suspender cuentas.
- **Señas en 2 contra 2:** las señas al compañero viajan por la sala en tiempo real, como antes.
