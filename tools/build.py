#!/usr/bin/env python3
"""Arma la web de Reviro a partir de src/.

Uso:  python3 tools/build.py

- index.html: la página de GitHub Pages. Carga el estilo (src/style.css) y el código (src/*.js) como archivos
  aparte, cada uno con una marca de versión para que el navegador baje solo lo que cambió.
- <hoja>/index.html: una copia chiquita por cada sección (/Reviro/torneos, /Reviro/online…), así cada hoja
  tiene su propia dirección y se puede recargar o compartir.
- dist/claude.html: todo en un solo archivo, para publicar como artifact en claude.ai.
"""
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
JS = ["engine.js", "cat.js", "art.js", "marca.js", "inicio.js", "textos.js", "i18n.js", "ui.js"]
# las direcciones tienen que coincidir con ROUTES en src/ui.js
ROUTES = ["online", "torneos", "torneo", "nuevo-torneo", "huella", "extra", "perfil", "ajustes",
          "tienda", "misiones", "ranking", "reglamento", "tutorial", "anotador", "pase"]

import json
# traducciones: i18n/<idioma>.json (clave = texto en español) -> src/textos.js, que se carga antes que la interfaz
_tr = {l: json.loads((ROOT / "i18n" / f"{l}.json").read_text(encoding="utf-8")) for l in ("en", "pt")}
# los nombres de las cartas: "7 de espada", "ancho de basto"
_SU = {"en": {"oro": "coins", "copa": "cups", "espada": "swords", "basto": "clubs"}, "pt": {"oro": "ouros", "copa": "copas", "espada": "espadas", "basto": "paus"}}
_NUM = {"en": {"ancho": "ace", "siete": "seven", "tres": "three", "dos": "two"}, "pt": {"ancho": "ás", "siete": "sete", "tres": "três", "dos": "dois"}}
for _l, _d in _tr.items():
    for _s, _st in _SU[_l].items():
        for _n in (1, 2, 3, 4, 5, 6, 7, 10, 11, 12):
            _d.setdefault(f"{_n} de {_s}", f"{_n} {'of' if _l == 'en' else 'de'} {_st}")
        for _w, _wt in _NUM[_l].items():
            _d.setdefault(f"{_w} de {_s}", f"{_wt} {'of' if _l == 'en' else 'de'} {_st}")
# "{0} Invitar por WhatsApp": el {0} suele ser un ícono, así que el texto también aparece solo
import re as _re
for _d in _tr.values():
    for _k, _v in list(_d.items()):
        for _pat in (r"^\{0\} ?", r" ?\{(\d)\}$"):
            _k2, _v2 = _re.sub(_pat, "", _k), _re.sub(_pat, "", _v)
            if _k2 != _k and _v2 != _v and _re.search(r"[A-Za-zÀ-ÿ]", _re.sub(r"\{\d\}", "", _k2)) and _k2 not in _d:
                _d[_k2] = _v2
(SRC / "textos.js").write_text("/* generado por tools/build.py desde i18n/*.json: no editar a mano */\nconst I18N=" +
                               json.dumps(_tr, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
# el logo del título (img/logo.webp, armado con tools/marca.py) va adentro del código, así sirve también en claude.ai
import base64
(SRC / "marca.js").write_text("/* generado por tools/build.py desde img/logo.webp: no editar a mano */\nconst LOGO_SRC='data:image/webp;base64," +
                              base64.b64encode((ROOT / "img" / "logo.webp").read_bytes()).decode() + "';\n", encoding="utf-8")
read = lambda f: (SRC / f).read_text(encoding="utf-8")
ver = lambda f: hashlib.sha1((SRC / f).read_bytes()).hexdigest()[:8]
head, style, body = read("head.html"), read("style.css"), read("body.html")

RESET = ("html{color-scheme:light}:root{padding-top:env(safe-area-inset-top,0px);"
         "padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}"
         "img{max-width:100%}[hidden]{display:none!important}")

# Firebase: la configuración se carga primero; la capa de red (módulo) solo si hay configuración.
ARTV = ROOT / "js" / "arte-version.js"
ARTTAG = (f'<script src="js/arte-version.js?v={hashlib.sha1(ARTV.read_bytes()).hexdigest()[:8]}"></script>\n' if ARTV.exists() else "")
FIREBASE = ARTTAG + """<script src="js/firebase-config.js?v=CFGV"></script>
<script>
window.REVIRO_WEB = 1;
if (window.REVIRO_FIREBASE && window.REVIRO_FIREBASE.apiKey) {
  var s = document.createElement('script'); s.type = 'module'; s.src = 'js/net.js?v=NETV'; document.head.appendChild(s);
}
</script>
"""


def web(base=""):
    scripts = "\n".join(f'<script src="src/{f}?v={ver(f)}"></script>' for f in JS)
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
{f'<base href="{base}">' if base else ''}
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Reviro: truco argentino con flor. Jugá contra la IA, 1v1 y 2v2 en tiempo real, recorré La Huella y anotá tus partidas en persona.">
<meta name="theme-color" content="#1c1109">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="img/icono-192.png">
<link rel="shortcut icon" href="img/favicon.ico">
<meta name="apple-mobile-web-app-capable" content="yes">
<style>{RESET}</style>
{head}<link rel="stylesheet" href="src/style.css?v={ver('style.css')}">
{FIREBASE}</head>
<body>
{body}
{scripts}
</body>
</html>
"""


# para que el navegador no se quede con una versión vieja de la capa de red ni de la configuración
FIREBASE = FIREBASE.replace("NETV", hashlib.sha1((ROOT / "js" / "net.js").read_bytes()).hexdigest()[:8]).replace("CFGV", hashlib.sha1((ROOT / "js" / "firebase-config.js").read_bytes()).hexdigest()[:8])
# versión de esta compilación: la página la compara con version.json para avisarse sola cuando hay una nueva
BUILD = hashlib.sha1("".join(ver(f) for f in JS + ["style.css"]).encode() + (ROOT / "js" / "net.js").read_bytes()).hexdigest()[:10]
FIREBASE = f"<script>window.REVIRO_BUILD = '{BUILD}';</script>\n" + FIREBASE
(ROOT / "version.json").write_text('{"v": "%s"}\n' % BUILD, encoding="utf-8")
(ROOT / "index.html").write_text(web(), encoding="utf-8")
for r in ROUTES:
    d = ROOT / r
    d.mkdir(exist_ok=True)
    (d / "index.html").write_text(web("../"), encoding="utf-8")

# versión de un solo archivo para claude.ai
script = "\n".join(read(f) for f in JS)
one = head + "\n<style>\n" + style + "</style>\n\n" + body + "\n<script>\n" + script + "\n</script>\n"
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist" / "claude.html").write_text(one, encoding="utf-8")

# para GitHub, lo generado no cuenta como código del proyecto
attrs = ["dist/** linguist-generated=true", "index.html linguist-generated=true", "src/textos.js linguist-generated=true", "src/marca.js linguist-generated=true", "functions/compartido/** linguist-generated=true"] + [f"{r}/index.html linguist-generated=true" for r in ROUTES]
(ROOT / ".gitattributes").write_text("\n".join(attrs) + "\n", encoding="utf-8")
# servidor (functions/): el mismo motor y el mismo catálogo que la página
import subprocess
subprocess.run(["node", str(ROOT / "tools" / "node" / "compartido.js")], check=True, stdout=subprocess.DEVNULL)
print(f"index.html, {len(ROUTES)} hojas y dist/claude.html listos")
