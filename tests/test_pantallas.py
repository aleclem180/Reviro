"""Cada hoja tiene que entrar entera en la pantalla, sin bajar, en celulares chicos, comunes y en la compu,
en los tres idiomas (el inglés y el portugués a veces ocupan más)."""
import asyncio, unittest
from playwright.async_api import async_playwright
from util import servidor, pagina

HOJAS = ["menu", "online", "torneos", "gira", "extra", "profile", "settings", "shop", "missions", "ranking",
         "anotador", "rules", "tutorial"]
TAMANIOS = [(360, 640), (390, 844), (414, 896), (1280, 800)]


async def medir():
    malas = []
    with servidor() as base:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for idioma, (ancho, alto) in [(i, t) for i in ("es", "en", "pt") for t in TAMANIOS]:
                pg = await pagina(b, base, ancho, alto, idioma=idioma)
                for v in HOJAS:
                    await pg.evaluate(f"overlayView=null;view='{v}';render()")
                    await pg.wait_for_timeout(500)
                    sobra = await pg.evaluate("(()=>{const p=document.querySelector('.page');return p?p.scrollHeight-p.clientHeight:0})()")
                    ancho_doc = await pg.evaluate("document.documentElement.scrollWidth-innerWidth")
                    if sobra > 1 or ancho_doc > 0:
                        malas.append(f"{v} ({idioma}) en {ancho}x{alto}: sobran {sobra}px de alto y {ancho_doc}px de ancho")
                if pg.errores:
                    malas.append(f"errores en {ancho}x{alto}: {pg.errores[:3]}")
                await pg.close()
            await b.close()
    return malas


class Pantallas(unittest.TestCase):
    def test_ninguna_hoja_necesita_scroll(self):
        malas = asyncio.run(medir())
        self.assertEqual(malas, [], "\n".join(malas))


if __name__ == "__main__":
    unittest.main()
