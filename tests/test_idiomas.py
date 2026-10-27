"""Traducciones: en inglés y en portugués no tiene que quedar ningún texto de la interfaz en español,
y el idioma se tiene que poder cambiar en el momento desde Ajustes."""
import asyncio, json, re, unittest
from playwright.async_api import async_playwright
from util import servidor, pagina, RAIZ

HOJAS = ["menu", "online", "torneos", "gira", "extra", "profile", "settings", "shop", "missions", "ranking",
         "anotador", "rules", "tutorial", "pase"]
# los textos visibles y las etiquetas de accesibilidad de la página
TEXTOS = r"""()=>{const o=new Set();const w=document.createTreeWalker(document.body,4);
 for(let n=w.nextNode();n;n=w.nextNode()){const p=n.parentElement;if(!p||p.closest('script,style,[translate="no"]'))continue;const t=n.data.trim();if(t)o.add(t)}
 document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(e=>{if(e.closest('[translate="no"]'))return;for(const a of ['aria-label','title','placeholder']){const v=e.getAttribute(a);if(v)o.add(v)}});return [...o]}"""


def traducciones(idioma):
    return json.loads((RAIZ / "i18n" / f"{idioma}.json").read_text(encoding="utf-8"))


async def revisar(idioma):
    tr = {k: v for k, v in traducciones(idioma).items() if k != v and not re.search(r"\{\d\}", k)}
    quedan = {}
    with servidor() as base:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await pagina(b, base, 1280, 800, idioma=idioma)
            for v in HOJAS:
                await pg.evaluate(f"overlayView=null;view='{v}';render()")
                await pg.wait_for_timeout(250)
                for t in await pg.evaluate(TEXTOS):
                    if t in tr:
                        quedan.setdefault(t, v)
            # una partida contra la máquina: el tablero, los cantos y el registro
            await pg.evaluate("startSolo()")
            for _ in range(8):
                await pg.wait_for_timeout(700)
                for t in await pg.evaluate(TEXTOS):
                    if t in tr:
                        quedan.setdefault(t, "partida")
                await pg.evaluate("""(()=>{const c=document.querySelector('.hand button:not([disabled])');if(c){c.click();setTimeout(()=>c.click(),50)}})()""")
            errores = pg.errores
            await b.close()
    return quedan, errores


async def cambiar():
    with servidor() as base:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await pagina(b, base, 390, 844, idioma="es")
            await pg.evaluate("view='settings';PT.set='idioma';render()")
            textos = {}
            for l in ("en", "pt", "es"):
                await pg.click(f'[data-a="lang"][data-v="{l}"]')
                await pg.wait_for_timeout(200)
                textos[l] = (await pg.evaluate("document.querySelector('.phd,h1,h2').innerText"),
                             await pg.evaluate("document.documentElement.lang"),
                             await pg.evaluate("JSON.parse(localStorage.getItem('reviro.set')).lang"))
            await b.close()
    return textos


class Idiomas(unittest.TestCase):
    def test_ingles_completo(self):
        quedan, errores = asyncio.run(revisar("en"))
        self.assertEqual(errores, [])
        self.assertEqual(quedan, {}, quedan)

    def test_portugues_completo(self):
        quedan, errores = asyncio.run(revisar("pt"))
        self.assertEqual(errores, [])
        self.assertEqual(quedan, {}, quedan)

    def test_se_cambia_en_ajustes(self):
        t = asyncio.run(cambiar())
        self.assertIn("Settings", t["en"][0]); self.assertEqual(t["en"][1:], ("en", "en"))
        self.assertIn("Ajustes", t["pt"][0]); self.assertEqual(t["pt"][1:], ("pt-BR", "pt"))
        self.assertIn("Ajustes", t["es"][0]); self.assertEqual(t["es"][1:], ("es", "es"))

    def test_mismas_plantillas(self):
        """Cada traducción tiene que conservar los huecos {0}, {1}… del original."""
        for idioma in ("en", "pt"):
            for k, v in traducciones(idioma).items():
                self.assertEqual(sorted(re.findall(r"\{\d\}", k)), sorted(re.findall(r"\{\d\}", v)), f"{idioma}: {k}")


if __name__ == "__main__":
    unittest.main()
