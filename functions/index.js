/*
  Cloud Functions de Reviro: conecta el núcleo (nucleo.js) con Firestore y lo expone como funciones
  que la página llama ("callables"). Se sube con:  firebase deploy --only functions
  Necesita el plan Blaze de Firebase. Ver docs/SERVIDOR.md.
*/
'use strict';
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { crear } = require('./nucleo.js');
const motor = require('./compartido/motor.js');
const cat = require('./compartido/catalogo.json');

admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

const data = (s) => (s.exists ? s.data() : null);
/** Adaptador: la forma de base que usa el núcleo, sobre Firestore. */
const store = {
  get: async (p) => data(await db.doc(p).get()),
  list: async (c) => (await db.collection(c).get()).docs.map((d) => d.data()),
  set: (p, d, o) => db.doc(p).set(d, o && o.merge ? { merge: true } : {}),
  update: (p, d) => db.doc(p).update(d),
  del: (p) => db.doc(p).delete(),
  add: (c, d) => db.collection(c).add(d),
  tx: (fn) => db.runTransaction(async (T) => fn({
    get: async (p) => data(await T.get(db.doc(p))),
    set: (p, d, o) => { T.set(db.doc(p), d, o && o.merge ? { merge: true } : {}); },
    update: (p, d) => { T.update(db.doc(p), d); },
    del: (p) => { T.delete(db.doc(p)); },
    add: (c, d) => { T.set(db.collection(c).doc(), d); },
  })),
};
const N = crear({ motor, cat, store });

const CODIGOS = { 'sin-sesion': 'unauthenticated', 'no-admin': 'permission-denied', 'no-sos': 'permission-denied', suspendido: 'permission-denied',
  premium: 'permission-denied', saldo: 'failed-precondition', estado: 'failed-precondition', faltan: 'failed-precondition',
  invalida: 'invalid-argument', valor: 'invalid-argument', operacion: 'invalid-argument', 'no-se-vende': 'invalid-argument', 'no-existe': 'not-found' };
const llamar = (fn) => onCall({ enforceAppCheck: false }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Iniciá sesión');
  const tok = req.auth.token || {};
  const ctx = { uid: req.auth.uid, email: tok.email || null, emailVerified: !!tok.email_verified, name: tok.name || '' };
  try { return await fn(ctx, req.data || {}); }
  catch (e) { if (e instanceof HttpsError) throw e; throw new HttpsError(CODIGOS[e.code] || 'internal', e.message || 'Error', { code: e.code || 'error' }); }
});

exports.billetera = llamar(N.billetera);
exports.salaEmpezar = llamar(N.salaEmpezar);
exports.salaJugar = llamar(N.salaJugar);
exports.salaAvanzar = llamar(N.salaAvanzar);
exports.salaSalir = llamar(N.salaSalir);
exports.torneo = llamar(N.torneo);
exports.admin = llamar(N.admin);
