#!/usr/bin/env python3
"""Lista los textos de la interfaz que todavía no tienen traducción al inglés o al portugués.

Uso:  python3 tools/i18n_faltan.py        (necesita Node y `npm install` en tools/node)

1. Vuelve a sacar los textos en castellano de src/*.js (tools/node/extraer.js -> i18n/claves.json).
2. Muestra los que no están en i18n/en.json o i18n/pt.json. Para traducir uno nuevo, se agrega la línea
   "texto en castellano": "traducción" en cada archivo y se corre tools/build.py.
   Los huecos {0}, {1}… tienen que quedar en la traducción (pueden cambiar de lugar).
Hay claves que no hace falta traducir (nombres internos, nombres propios, cantos del truco como «Retruco»).
"""
import json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
out = subprocess.run(["node", str(ROOT / "tools" / "node" / "extraer.js")], capture_output=True, text=True, check=True).stdout
(ROOT / "i18n" / "claves.json").write_text(out, encoding="utf-8")
claves = json.loads(out)
for l in ("en", "pt"):
    tr = json.loads((ROOT / "i18n" / f"{l}.json").read_text(encoding="utf-8"))
    faltan = [k for k in claves if k not in tr]
    print(f"\n== {l}: {len(faltan)} sin traducción (de {len(claves)}) ==")
    for k in faltan:
        print(f"  {claves[k]:>14}  {k[:110]}")
