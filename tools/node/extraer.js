// Saca todos los textos en castellano que puede mostrar la interfaz (src/*.js) para traducirlos.
// Uso: node tools/node/extraer.js > i18n/claves.json
const fs = require('fs'), path = require('path'), acorn = require('acorn'), walk = require('acorn-walk');
const SRC = path.join(__dirname, '..', '..', 'src');
const keys = new Map();
const ATTR = /(?:aria-label|title|placeholder|alt)="([^"]*)"/g;
const CODEY = /[{}<>]|="|=>|^[#\[]|^\.[a-z]|\b(rgba|var|url|calc|scale|scaleX|rotate|translate|saturate|linear-gradient)\(|\d(px|deg)\b|data-|class=|style=|^\(prefers|^https?:|\.(js|png|json|webp)\b|^\?id=|^(italic )?\d{3} \d+px/;
const looksText = s => { const t = s.replace(/\{\d+\}/g, ''); if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]{2,}/.test(t)) return false; if (CODEY.test(t)) return false;
  if (/^[a-z0-9_]+$/.test(t) && !/[áéíóúñ]/.test(t)) return /^[a-záéíóúñ]{3,}$/.test(t) && SPANISH.has(t); return true; };
// palabras sueltas en minúscula que sí aparecen en pantalla (las demás suelen ser nombres internos)
const SPANISH = new Set('fichas monedas porotos parejas jugadores puntos partidas amistosa gratis ganadas jugando esperando premio entrada fácil medio difícil liga eliminación nosotros ellos mano vos bot equipo anfitrión cartas parda pardas inscriptos lugares lugar mesa mesas'.split(' '));
function add(s, where) {
  s = s.replace(/\s+/g, ' ').trim();
  if (!s || s.length < 2 || !looksText(s)) return;
  if (/^[\d\s.,:%+−\-·{}()]+$/.test(s.replace(/\{\d+\}/g, ''))) return;
  if (/(^|\s)(var\(|calc\(|rgba?\(|url\(|translate|rotate\(|M[\d.-]+ [\d.-]+|#[0-9a-f]{3,6}\b)/i.test(s)) return;
  if (!keys.has(s)) keys.set(s, where);
}
function harvest(str, where) {
  // atributos legibles
  let m; while ((m = ATTR.exec(str))) add(m[1], where);
  // texto entre etiquetas
  const noTags = str.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]*>/g, '\u0001');
  for (const run of noTags.split('\u0001')) {
    // un marcador suelto entre textos se considera parte del texto ("Hay {0} de {1}")
    const t = run.replace(/\s+/g, ' ').trim();
    if (t.replace(/\{\d+\}/g, '').trim()) add(t, where);
  }
}
for (const f of ['cat.js', 'art.js', 'ui.js', 'engine.js']) {
  const code = fs.readFileSync(path.join(SRC, f), 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  walk.full(ast, n => {
    if (n.type === 'Literal' && typeof n.value === 'string') { if (n.value.length < 4000 && !n.value.startsWith('data:')) harvest(n.value, f + ':' + n.loc.start.line); }
    else if (n.type === 'TemplateLiteral') {
      let s = ''; n.quasis.forEach((q, i) => { s += q.value.cooked; if (i < n.expressions.length) s += '{' + i + '}'; });
      // los marcadores se renumeran en el orden en que quedan en cada texto
      harvest(s, f + ':' + n.loc.start.line);
    }
  });
}
// renumerar marcadores por clave: {3} {7} -> {0} {1}
const out = {};
for (const [k, w] of keys) { let i = 0; const map = {}; const nk = k.replace(/\{(\d+)\}/g, (_, d) => '{' + (map[d] ??= i++) + '}'); if (!(nk in out)) out[nk] = w; }
process.stdout.write(JSON.stringify(out, null, 1));
