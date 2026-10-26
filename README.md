# Reviro

Truco argentino con flor, en el navegador.

**Jugar:** https://aleclem180.github.io/Reviro/

## Qué tiene

- **Cuentas:** registro e inicio de sesión con mail, nombre de usuario y contraseña. Dos roles: jugador y admin.
- **Salas en tiempo real:**
  - **1vIA:** vos contra la IA, en Fácil, Medio o Difícil (también 2 contra 2 con un compañero IA).
  - **1v1:** jugador contra jugador.
  - **2v2:** dos equipos de dos. Si la sala se lanza con lugares vacíos (por ejemplo, con 3 personas), la IA juega en esos asientos.
- **Estadísticas por jugador:** partidas jugadas, win rate, racha actual (positiva de victorias o negativa de derrotas) y mejor racha. Se actualizan solas al terminar cada partida. Abandonar una partida en juego cuenta como derrota.
- **Torneos:** los crea el admin (nombre, temática, fecha, reglas, cupo de hasta 128 jugadores o parejas en eliminación directa y hasta 12 en liga, 1v1 o parejas). En parejas podés anotarte con un amigo elegido: le llega la invitación y el lugar queda reservado. La entrada se paga en fichas y el pozo es el 90% de lo que se junta: crece con cada inscripto y se reparte 60/30/10 entre los tres primeros.
- **Mesas con entrada en fichas:** desde 1.000 por jugador; el premio es el 90% del pozo. Si alguien se va en los primeros 30 segundos se cancela y se devuelve todo; si se desconecta después, tiene 60 segundos para volver o pierde su entrada.
- **Referidos:** el invitado arranca con 1.500 fichas y el que invita gana 2.500 fichas cuando su amigo juega su primera partida online.
- **Moderación:** suspender cuentas, ajustar fichas y monedas, ver la ficha completa de cada jugador, y un registro de acciones del admin que no se puede borrar.
- **Términos y condiciones** que se aceptan al registrarse, con fecha y hora guardadas.
- **Compartir por WhatsApp:** invitación a Reviro, código de mesa y torneos, con un toque.
- **Monedas con Mercado Pago:** el jugador paga con el link del paquete y el admin lo acredita desde Ajustes.
- **Administración:** ver y cerrar salas activas, nombrar o quitar admins, dar premium, crear y manejar torneos.
- **Reglas completas:** envido, real envido y falta envido (malas y buenas), flor, contraflor y contraflor al resto, truco, retruco y vale cuatro, pardas y mazo.
- **La Huella:** el mapa de la Argentina por zonas, con rivales que juegan mejor cuanto más porotos tienen. La última zona son las Islas del Pingüino (Malvinas), con su jefe y el dorso Cruz del Sur de premio.
- **Cada hoja con su dirección:** `/Reviro/online`, `/Reviro/torneos`, `/Reviro/huella`, `/Reviro/perfil`… Se pueden recargar, compartir y usar con el botón Atrás.
- **Todo entra en la pantalla:** ninguna hoja necesita bajar; las listas largas se paginan solas según el alto del celular.
- **Extra:** anotador con fósforos para jugar en persona, tienda, misiones, logros, tutorial y reglamento.
- **Música:** zamba, milonga, tango, chamamé y chacarera.

## Puesta en marcha

Las cuentas y el online funcionan con **Firebase** (Authentication + Firestore), en el plan gratis. Hay que crear el proyecto y pegar la configuración en `js/firebase-config.js`. Mientras ese archivo esté vacío, la web funciona en modo local (contra la IA, La Huella y el anotador, guardando en el dispositivo).

- [Paso a paso de integración](docs/INTEGRACION.md)
- [Estructura de la base de datos](docs/BASE_DE_DATOS.md)
- [Código clave: salas, sincronización y estadísticas](docs/CODIGO_CLAVE.md)

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` y `<hoja>/index.html` | La web y una copia chiquita por cada dirección (se generan con `tools/build.py`) |
| `js/net.js` | Capa de red: cuentas, roles, salas, sincronización, estadísticas, admin |
| `js/firebase-config.js` | La configuración de tu proyecto de Firebase |
| `firestore.rules` | Reglas de seguridad de la base de datos |
| `src/engine.js` | El motor del truco: mazo, envido, flor, truco y la IA |
| `src/cat.js` | Catálogo: personajes, dorsos, paños, cartas ilustradas y paquetes |
| `src/art.js` | Dorsos y paños dibujados a lápiz de color |
| `src/ui.js` | Interfaz: hojas, direcciones, paginado, música y partidas |
| `src/style.css`, `src/head.html`, `src/body.html` | Estilo y esqueleto de la página |
| `tools/build.py` | Arma la web y `dist/claude.html` a partir de `src/` |
| `tools/arte.py` | Pinta de antemano cartas, dorsos y paños como imágenes (`img/arte/`), para que el juego no se trabe al mostrarlos |
| `tests/` | Pruebas en Python: motor, que ninguna hoja necesite scroll y direcciones. `python3 tests/run_all.py` |
| `dist/claude.html` | La versión para publicar como página en claude.ai |

Las fichas y las monedas no tienen valor en dinero.
