# Dónde poner anuncios (para más adelante)

Reviro hoy no tiene anuncios. Si algún día se suman, la regla es una sola: **nunca en el medio de una mano**. El truco se juega con la cabeza; un anuncio que tapa la mesa o interrumpe un canto hace que la gente se vaya.

## Lugares buenos

| Lugar | Formato | Por qué funciona |
|---|---|---|
| **Al terminar una partida**, en la pantalla de "¡Ganamos!" / "Perdimos" | Video con premio, **opcional**: "Mirá un video y duplicá tus monedas" | Es el momento de pausa natural y el jugador elige verlo. Es el formato que más paga y el que menos molesta. |
| **Cuando te quedás sin fichas** | Video con premio: "Mirá un video y recibí 500 fichas" | Le da una salida al que no quiere esperar a la recarga diaria. |
| **Tienda → Monedas** | Video con premio: "+50 monedas gratis" (con un tope por día) | Convive con la compra con Mercado Pago sin competirle. |
| **Entre partidas contra la máquina** | Pantalla completa cada 3 o 4 partidas, salteable a los 5 segundos | Solo contra la máquina; nunca en mesas online ni en torneos, donde hay gente esperando. |
| **Abajo de Extra, Torneos y La Huella** | Banner chico, fijo arriba de la barra de navegación | Son pantallas de lectura, no de juego. |
| **Torneos patrocinados** | "Copa Fernet Tal", con el logo de la marca en el cartel del torneo y en el podio | Es publicidad que se integra con el juego en vez de interrumpirlo. Ideal para marcas argentinas. |
| **Dorsos y paños de marca** | Ítems de la tienda con diseño de una marca | Mismo criterio: la marca paga y el jugador lo elige. |

## Lugares a evitar

- La mesa de juego (felt, cartas, botones de canto).
- La sala de espera de una partida online o de torneo.
- El registro y el tutorial: el primer contacto tiene que ser limpio.

## Premium sin anuncios

El premium que hoy da el admin pasaría a significar **"sin anuncios"**: a las cuentas premium no se les muestra ningún banner ni pantalla completa, pero pueden seguir mirando los videos con premio si quieren.

## Cómo se haría

- **Web (GitHub Pages):** Google AdSense para banners. Los videos con premio en la web son limitados; AdSense tiene "anuncios con recompensa" en algunas cuentas.
- **App (si algún día se publica en Play Store / App Store):** AdMob, que es lo estándar para videos con premio y pantallas completas.
- En los dos casos conviene una sola función `mostrarAnuncio(lugar)` que primero mire si la cuenta es premium y si el lugar está habilitado desde el panel del admin, así se pueden prender y apagar sin tocar el código.
