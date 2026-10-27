/*
  Base de datos en memoria con la misma forma que usa nucleo.js (get, list, set, update, add, tx).
  Sirve para probar el servidor sin Firebase. Las transacciones se hacen de a una, y como en Firestore,
  primero se lee y después se escribe: leer después de escribir es un error (así las pruebas lo detectan).
*/
'use strict';
function crearMemoria() {
  const db = new Map();
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  let n = 0;
  const id = () => 'x' + (++n).toString(36) + Math.random().toString(36).slice(2, 6);
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const k in b) o[k] = b[k]; return o; };
  let cola = Promise.resolve();
  const store = {
    db,
    async get(p) { return db.has(p) ? clone(db.get(p)) : null; },
    async list(coll) { const pre = coll + '/', out = []; for (const [k, v] of db) if (k.startsWith(pre) && !k.slice(pre.length).includes('/')) out.push(clone(v)); return out; },
    async set(p, d, o) { db.set(p, o && o.merge ? merge(db.get(p), clone(d)) : clone(d)); },
    async update(p, d) { if (!db.has(p)) throw new Error('no existe ' + p); db.set(p, merge(db.get(p), clone(d))); },
    async del(p) { db.delete(p); },
    async add(coll, d) { const k = coll + '/' + id(); db.set(k, clone(d)); return k; },
    tx(fn) {
      const run = async () => {
        const writes = []; let wrote = false;
        const t = {
          async get(p) { if (wrote) throw new Error('lectura después de escribir en la transacción: ' + p); return store.get(p); },
          set(p, d, o) { wrote = true; writes.push(['set', p, clone(d), o]); },
          update(p, d) { wrote = true; writes.push(['update', p, clone(d)]); },
          del(p) { wrote = true; writes.push(['del', p]); },
          add(coll, d) { wrote = true; writes.push(['add', coll, clone(d)]); },
        };
        const r = await fn(t);
        // se aplica todo junto (y si una actualización apunta a algo que no existe, no se aplica nada)
        const snapshot = new Map(db);
        try {
          for (const [op, p, d, o] of writes) {
            if (op === 'set') db.set(p, o && o.merge ? merge(db.get(p), d) : d);
            else if (op === 'update') { if (!db.has(p)) throw new Error('no existe ' + p); db.set(p, merge(db.get(p), d)); }
            else if (op === 'del') db.delete(p);
            else db.set(p + '/' + id(), d);
          }
        } catch (e) { db.clear(); for (const [k, v] of snapshot) db.set(k, v); throw e; }
        return r;
      };
      const p = cola.then(run, run); cola = p.catch(() => {}); return p;
    },
  };
  return store;
}
if (typeof module === 'object' && module.exports) module.exports = { crearMemoria };
