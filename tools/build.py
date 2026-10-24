#!/usr/bin/env python3
"""Arma index.html (la web de GitHub Pages) a partir de src/.

Uso:  python3 tools/build.py
También genera dist/claude.html, la versión para publicar como artifact en claude.ai.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

head = (SRC / "head.html").read_text(encoding="utf-8")
script = "\n".join((SRC / f).read_text(encoding="utf-8") for f in ["engine.js", "cat.js", "ui.js"])
body = head + "\n<script>\n" + script + "\n</script>\n"

RESET = ("html{color-scheme:light}:root{padding-top:env(safe-area-inset-top,0px);"
         "padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}"
         "img{max-width:100%}[hidden]{display:none!important}")

# Firebase: la configuración se carga primero; la capa de red (módulo) solo si hay configuración.
FIREBASE = """<script src="js/firebase-config.js"></script>
<script>
if (window.REVIRO_FIREBASE && window.REVIRO_FIREBASE.apiKey) {
  var s = document.createElement('script'); s.type = 'module'; s.src = 'js/net.js'; document.head.appendChild(s);
}
</script>
"""

web = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Reviro: truco argentino con flor. Jugá contra la IA, 1v1 y 2v2 en tiempo real, recorré La Huella y anotá tus partidas en persona.">
<meta name="theme-color" content="#1c1109">
<style>{RESET}</style>
{FIREBASE}</head>
<body>
{body}</body>
</html>
"""
(ROOT / "index.html").write_text(web, encoding="utf-8")
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist" / "claude.html").write_text(body, encoding="utf-8")
print("index.html y dist/claude.html listos")
