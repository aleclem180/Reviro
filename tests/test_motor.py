"""El motor del truco: mazo, orden de las cartas, envido y partidas completas jugadas al azar."""
import unittest
from util import motor


class Motor(unittest.TestCase):
    def test_mazo_de_40_sin_ochos_ni_nueves(self):
        d = motor("return deck()")
        self.assertEqual(len(d), 40)
        self.assertEqual(len(set(d)), 40)
        self.assertFalse([c for c in d if c[:-1] in ("8", "9")])

    def test_orden_de_las_cartas(self):
        orden = ["1E", "1B", "7E", "7O", "3E", "2E", "1C", "12E", "11E", "10E", "7C", "6E", "5E", "4E"]
        r = motor("return %s.map(rank)" % orden)
        self.assertEqual(r, sorted(r, reverse=True), "cada carta tiene que ganarle a la que sigue")
        self.assertEqual(motor("return [rank('3E')===rank('3O'),rank('1O')===rank('1C')]"), [True, True])

    def test_envido(self):
        casos = {"['7E','6E','1O']": 33, "['12O','11O','4C']": 20, "['1E','2B','3O']": 3, "['10C','11C','5C']": 25}
        for cartas, tanto in casos.items():
            self.assertEqual(motor(f"return envidoOf({cartas})"), tanto, cartas)

    def test_partidas_completas(self):
        """Se juegan 30 partidas (1v1 y 2v2) eligiendo jugadas legales al azar: todas tienen que terminar bien."""
        r = motor("""
          const out=[];
          for(let k=0;k<30;k++){const n=k%2?4:2;let g=newMatch({n,target:k%3?15:30,flor:k%2===0,seats:Array.from({length:n},()=>({bot:true})),matchId:'t'+k});
            let pasos=0;
            while(!g.matchOver&&pasos<5000){pasos++;
              if(g.hand.ended){g=nextHand(g);continue}
              const s=actor(g);if(s<0)break;const L=legal(g,s);const ops=[];
              if(L.play)for(const c of g.hand.cards[s])ops.push({t:'play',card:c});
              if(L.respond){ops.push({t:'quiero'});ops.push({t:'noquiero'})}
              if(L.flor)ops.push({t:'flor'});
              if(L.truco)ops.push({t:'truco',level:L.truco});
              for(const e of L.envido||[])ops.push({t:'envido',kind:e});
              if(!ops.length)break;
              g=act(g,s,ops[Math.floor(Math.random()*ops.length)])}
            out.push({over:!!g.matchOver,scores:g.scores,target:g.target,pasos})}
          return out""")
        for p in r:
            self.assertTrue(p["over"], p)
            self.assertGreaterEqual(max(p["scores"]), p["target"], p)


if __name__ == "__main__":
    unittest.main()
