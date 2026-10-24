# Paso a paso: conectar Reviro con Firebase

El código ya está integrado. Lo que falta es crear el proyecto de Firebase (es gratis) y pegar su configuración. Mientras `js/firebase-config.js` esté vacío, la web funciona en modo local, sin cuentas ni online.

## 1. Crear el proyecto

1. Entrá a <https://console.firebase.google.com> con tu cuenta de Google y tocá **Crear un proyecto** (o "Agregar proyecto").
2. Ponele de nombre `reviro`. Google Analytics no hace falta.

## 2. Activar el inicio de sesión con mail

1. En el menú: **Compilación → Authentication → Comenzar**.
2. En **Método de acceso**, activá **Correo electrónico/contraseña** y guardá.
3. En **Configuración → Dominios autorizados**, tocá **Agregar dominio** y poné `aleclem180.github.io`.

## 3. Crear la base de datos

1. **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: `southamerica-east1` (San Pablo), la más cercana a Argentina.
3. Elegí **modo de producción**.
4. Andá a la pestaña **Reglas**, borrá lo que haya, pegá todo el contenido de [`firestore.rules`](../firestore.rules) y tocá **Publicar**.

## 4. Registrar la app web y copiar la configuración

1. En **Configuración del proyecto** (el engranaje) → **Tus apps**, tocá el ícono **`</>`** (Web).
2. Ponele de nombre `Reviro web`. Firebase Hosting no hace falta: la web queda en GitHub Pages.
3. Firebase te muestra un bloque `const firebaseConfig = { ... }`. Copiá esos valores en [`js/firebase-config.js`](../js/firebase-config.js):

```js
window.REVIRO_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "reviro-xxxx.firebaseapp.com",
  projectId: "reviro-xxxx",
  storageBucket: "reviro-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

Estos datos no son secretos: están pensados para ir en el navegador. Lo que protege la base son las reglas del paso 3.

4. Guardá el archivo y subilo al repo (commit y push a `main`). GitHub Pages se actualiza solo en uno o dos minutos.

## 5. Crear tu cuenta de admin

1. Abrí <https://aleclem180.github.io/Reviro/> y tocá **Crear cuenta** con `alejandro.clemente05@gmail.com`.
2. Abrí el mail de verificación que te llega y confirmá.
3. Cerrá sesión y volvé a entrar (o recargá la página). Desde ese momento sos admin: en **Ajustes** aparecen **Salas activas**, **Usuarios y roles** y **Premium**.

## 6. (Opcional) Publicar las reglas desde la terminal

Si preferís no copiar y pegar:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # elegí tu proyecto reviro
firebase deploy --only firestore:rules
```

Usa `firebase.json`, `firestore.rules` y `firestore.indexes.json`, que ya están en el repo.

## Cómo está conectado en el código

```html
<!-- index.html -->
<script src="js/firebase-config.js"></script>
<script>
  // la capa de red se carga solo si hay configuración
  if (window.REVIRO_FIREBASE && window.REVIRO_FIREBASE.apiKey) {
    var s = document.createElement('script'); s.type = 'module'; s.src = 'js/net.js'; document.head.appendChild(s);
  }
</script>
```

- **`js/net.js`** importa el SDK de Firebase 10.12.2 desde `gstatic.com`, inicializa la app y publica `window.NET` con `auth`, `rooms`, `stats` y `admin`. Cuando termina avisa con el evento `net-ready`.
- **`src/ui.js`** espera ese evento (`waitNET`) y escucha la sesión con `NET.auth.onChange(...)`: sin sesión muestra Ingresar / Crear cuenta; con sesión carga el usuario y las salas.
- Para modificar el juego, editá los archivos de `src/` y corré `python3 tools/build.py`: arma `index.html` (la web) y `dist/claude.html` (la versión para claude.ai).

## Probarlo en tu computadora

Los módulos de JavaScript no cargan abriendo el archivo con doble clic. Levantá un servidor local en la carpeta del repo:

```bash
python3 -m http.server 8000
```

y abrí <http://localhost:8000>. Agregá `localhost` a los dominios autorizados de Authentication si vas a probar con cuentas.

## Límites del plan gratis

El plan Spark de Firebase incluye por día 50.000 lecturas y 20.000 escrituras en Firestore. Cada jugada es una escritura, y cada jugador que mira la mesa hace una lectura por jugada; a eso se suman los latidos de presencia (uno cada 15 segundos por jugador). En la práctica alcanza para unas 50 partidas online de cuatro personas por día, o bastantes más de 1v1 y contra la IA. Si se supera, Firestore deja de responder hasta el día siguiente; no te cobran nada salvo que actives el plan Blaze.
