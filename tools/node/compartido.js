// Arma functions/compartido/: el motor del juego y el catálogo de la tienda, sacados de src/, para que el servidor
// use exactamente las mismas reglas y los mismos precios que la página.
// Uso: node tools/node/compartido.js   (lo llama tools/build.py)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'functions', 'compartido');
fs.mkdirSync(OUT, { recursive: true });

// --- motor: el mismo src/engine.js, con un mazo mezclado con números al azar criptográficos ---
let motor = fs.readFileSync(path.join(ROOT, 'src', 'engine.js'), 'utf8');
const SH = 'function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));';
if (!motor.includes(SH)) throw new Error('No encontré shuffle() en src/engine.js');
motor = motor.replace(SH, 'function shuffle(a){for(let i=a.length-1;i>0;i--){const j=require("crypto").randomInt(i+1);');
motor = '/* generado por tools/node/compartido.js desde src/engine.js: no editar a mano */\n"use strict";\n' + motor +
  '\nmodule.exports={newMatch,act,nextHand,legal,actor,aiAct,team,envidoOf,hasFlor,florVal,TNAME,ENAME,clone};\n';
fs.writeFileSync(path.join(OUT, 'motor.js'), motor);

// --- catálogo: precios de la tienda, paquetes, misiones y logros (de src/cat.js) ---
const ctx = { console, URL: { createObjectURL: () => '' }, Blob: function () {}, atob: () => '', window: {}, document: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', 'cat.js'), 'utf8') +
  '\n;this.__out={AVS:AVS.map(a=>({id:a.id,price:a.price||0})),DORSOS:DORSOS.map(d=>({id:d.id,price:d.price||0,boss:d.boss||null})),' +
  'PANOS:PANOS.map(p=>({id:p.id,price:p.price||0,boss:p.boss||null})),KITS:KITS.map(k=>({id:k.id,price:k.price||0})),' +
  'PACKS,BOSS_PRIZE,MISSIONS:MISSIONS.map(m=>({id:m.id,ev:m.ev,goal:m.goal,r:m.r})),ACHS:ACHS.map(a=>({id:a.id,ev:a.ev,goal:a.goal,r:a.r}))};', ctx);
fs.writeFileSync(path.join(OUT, 'catalogo.json'), JSON.stringify(ctx.__out, null, 1) + '\n');
console.log('functions/compartido listo');
