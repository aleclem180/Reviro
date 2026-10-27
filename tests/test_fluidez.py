"""Fluidez de la mesa: que no se rehaga lo que no cambió y que una foto vieja de la base no haga retroceder la partida."""
import asyncio, unittest
from playwright.async_api import async_playwright
from util import servidor, pagina


async def correr(js):
    with servidor() as base:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await pagina(b, base, 1280, 800)
            await pg.evaluate("SET.n=2;SET.diff='facil';startSolo()")
            await pg.wait_for_timeout(2500)
            r = await pg.evaluate(js)
            errores = pg.errores
            await b.close()
    return r, errores


class Fluidez(unittest.TestCase):
    def test_render_sin_cambios_no_toca_la_mesa(self):
        r, err = asyncio.run(correr("""(()=>{clearTimeout(driveT);render();const mo=new MutationObserver(()=>{});
            mo.observe(document.querySelector('#view'),{subtree:true,childList:true,attributes:true,characterData:true});
            render();render();const n=mo.takeRecords().length;mo.disconnect();return n})()"""))
        self.assertEqual(err, [])
        self.assertEqual(r, 0, "un render sin cambios no debería modificar nada")

    def test_solo_cambia_la_parte_tocada(self):
        """Elegir una carta cambia la mano y el aviso del turno, pero no el marcador ni el paño."""
        r, err = asyncio.run(correr("""(()=>{clearTimeout(driveT);drive=()=>{};render();const sc=document.querySelector('.game .score'),felt=document.querySelector('.game .felt');
            const mo=new MutationObserver(()=>{});mo.observe(sc,{subtree:true,childList:true,attributes:true,characterData:true});
            const mo2=new MutationObserver(()=>{});mo2.observe(felt,{subtree:true,childList:true,attributes:true,characterData:true});
            SELCARD=G.hand.cards[mySeat][0];render();return [mo.takeRecords().length,mo2.takeRecords().length,document.querySelector('.game .score')===sc]})()"""))
        self.assertEqual(err, [])
        self.assertEqual(r, [0, 0, True])

    def test_una_foto_vieja_no_hace_retroceder(self):
        r, err = asyncio.run(correr("""(()=>{clearTimeout(driveT);drive=()=>{};const viejo=G;let g=G;
            for(let k=0;k<4;k++){if(g.hand.ended)break;const a=actor(g);g=act(g,a,aiAct(g,a))}
            mode='online';busy=false;setG(g);T={game:viejo,seats:G.seats.map(s=>({id:s.id})),status:'playing',host:uid};
            reconcile();const tras1=G.seq;
            onTable({exists:true,data:()=>({game:viejo,seats:[],status:'playing',host:'x'})},false);const tras2=G.seq;
            return [g.seq,tras1,tras2,viejo.seq]})()"""))
        self.assertEqual(err, [])
        nuevo, tras1, tras2, viejo = r
        self.assertGreater(nuevo, viejo)
        self.assertEqual(tras1, nuevo)
        self.assertEqual(tras2, nuevo)


if __name__ == "__main__":
    unittest.main()
