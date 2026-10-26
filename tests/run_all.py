#!/usr/bin/env python3
"""Corre todas las pruebas: python3 tests/run_all.py  (necesita node y playwright)."""
import sys, unittest
from pathlib import Path
aqui = Path(__file__).resolve().parent
sys.path.insert(0, str(aqui))
r = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.discover(str(aqui), pattern="test_*.py"))
sys.exit(not r.wasSuccessful())
