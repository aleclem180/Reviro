"""Servidor (functions/nucleo.js): partidas con cartas ocultas, jugadas validadas, premios, tienda, torneos y admin."""
import subprocess, unittest
from util import RAIZ


class Servidor(unittest.TestCase):
    def test_nucleo(self):
        r = subprocess.run(["node", str(RAIZ / "tests" / "servidor.test.js")], capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stdout[-3000:] + r.stderr[-2000:])


if __name__ == "__main__":
    unittest.main()
