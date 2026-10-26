# Prompts para los retratos de los personajes

Cada retrato se arma con la descripción del personaje más la base de estilo. Formato cuadrado (1:1).

**Base de estilo (va después de cada descripción):**

> Anatomía estrictamente realista y proporciones humanas correctas, rostro proporcionado, estilo de dibujo académico. Técnica: boceto a lápiz tradicional detallado, líneas de grafito visibles, sombreado con achurado (crosshatching). Sutilmente coloreado con lápices de colores texturizados. Fondo de papel blanco liso con una mancha suave de color [COLOR] detrás. Arte conceptual de alta calidad, iluminación natural, trazos finos y realistas.

**Prompt negativo:**

> caricatura, estilo cartoon, proporciones exageradas, cuerpos redondos, anatomía incorrecta, desproporción, estilo infantil, 2D plano, vector, texto, firma, logos, escudos.

| Personaje | Archivo | Color de fondo | Descripción | Estado |
|---|---|---|---|---|
| El Gaucho | `gaucho.jpg` | ocre | Gaucho argentino de unos 50 años bebiendo mate con bombilla, sombrero negro de ala ancha, bigote tupido, pañuelo rojo al cuello, camisa blanca y chaleco oscuro. | Listo |
| El Estudiante | `estudiante.jpg` | azul | Estudiante universitario de 21 años, pelo castaño con rulos, anteojos redondos, buzo con capucha azul oscuro, sosteniendo apuntes. | Listo |
| El Tachero | `tachero.jpg` | amarillo | Taxista porteño de 55 años, bigote, gorra negra con franja de cuadros amarillos, suéter marrón, saludando con la mano abierta. | Listo |
| El Veterano del Bar | `veterano.jpg` | verde oscuro | Hombre de 75 años, boina azul oscuro, bigote canoso, cárdigan marrón, sosteniendo un abanico de naipes españoles, mirada pícara. | Listo |
| La Hincha | `hincha.jpg` | azul | Hincha de 25 años, piel morena, pelo largo oscuro, camiseta a bastones celestes y blancos sin escudo, levantando una bufanda celeste y blanca, sonriendo. | Listo |
| El Asador | `asador.jpg` | rojo ladrillo | Asador de 40 años, barba tupida, delantal blanco sobre camisa azul arremangada, sosteniendo un choripán. | Listo |
| La Abuela | `abuela.jpg` | lila | Abuela de 80 años, pelo canoso en rodete, anteojos redondos, chal tejido crema sobre vestido lila, agujas de tejer y ovillo rosa. | Listo |
| El Godín | `godin.jpg` | gris azulado | Oficinista de 35 años, traje gris oscuro, camisa blanca, corbata roja, cara de cansado, taza de café. | Listo |
| El Cheto | `cheto.jpg` | celeste | Joven de 24 años, pelo rubio peinado hacia atrás, gafas de sol en la cabeza, chomba rosa con suéter azul marino sobre los hombros, vaso de café helado. | Listo |
| El Fisura | `fisura.jpg` | violeta | Joven de 28 años despeinado, anteojos de sol negros, barba de días, campera de cuero negra sobre remera blanca, porción de pizza, sonrisa amplia. | Listo |
| La Doña del Barrio | `dona.jpg` | naranja | Señora de 60 años con ruleros de colores, bata floreada rosa, aros dorados, sosteniendo una escoba de paja. | Listo |
| El Mochilero | `mochilero.jpg` | verde agua | Viajero de 30 años, gorro de lana andino naranja y blanco con pompón, barba corta, camisa verde, tiras rojas de mochila, mapa desplegado. | Listo |
| El Rolinga | `rolinga.jpg` | rojo | Rockero de 30 años, pelo negro largo con flequillo, pañuelo amarillo al cuello, remera negra, micrófono antiguo. | Listo |
| La Hippie de la Feria | `hippie.jpg` | verde | Artesana de 35 años, piel morena, trenzas, vincha violeta con flores, aros dorados, blusa tejida con guardas andinas, girasol. | Listo |
| El Tanguero | `tanguero.jpg` | rojo carmín | Bailarín de tango de 40 años, fedora negro con cinta blanca, bigote fino, pelo engominado, traje negro, camisa blanca, rosa roja. | Listo |
| La Murguera | `murguera.jpg` | violeta | Murguera de 27 años, afrodescendiente, pelo largo oscuro, galera roja con lentejuelas, levita verde con lentejuelas doradas, serpentinas, guiñando un ojo. | Listo |
| La Influencer | `influencer.jpg` | rosa | Influencer de 25 años, pelo rubio largo, aros dorados, remera blanca, celular en mano como si se grabara, aro de luz detrás. | Listo |

Los retratos listos están en `img/personajes/`. Para sumar uno nuevo, mandáselo a Claude o agregalo a esa carpeta y a `PHOTOS` en `src/cat.js`, con el recorte de la cara para los avatares chicos.
