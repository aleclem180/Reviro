# Traducciones de Reviro

La interfaz se escribe en castellano. `src/i18n.js` traduce en el momento todo lo que se muestra
(textos, `aria-label`, `title`, `placeholder`, avisos y la imagen para compartir) usando:

- `en.json` — inglés
- `pt.json` — portugués de Brasil

Cada archivo es `"texto en castellano": "traducción"`. Los huecos `{0}`, `{1}`… son partes que cambian
(un número, un nombre) y tienen que quedar en la traducción. `tools/build.py` los junta en `src/textos.js`.

- `python3 tools/i18n_faltan.py` lista los textos nuevos que todavía no tienen traducción.
- Lo que tenga `translate="no"` no se traduce (por ejemplo, los nombres de los idiomas en el selector).
- Los cantos del truco (Truco, Retruco, Envido, Quiero…) quedan en castellano en inglés, como se juega.

El jugador elige el idioma al crear la cuenta y lo cambia cuando quiera en Ajustes → Idioma.
Se guarda en el dispositivo y en la cuenta (`wallets/{uid}.lang`).
