/* ---------- idiomas: español (el original), inglés y portugués ----------
   La interfaz se escribe en español. Al mostrarse, cada texto se busca en I18N (src/textos.js, generado por
   tools/build.py a partir de i18n/en.json e i18n/pt.json) y se reemplaza por su traducción. Las claves con {0}, {1}…
   son plantillas: lo que va en el hueco (un número, un nombre, otro texto) se traduce aparte.
   Un observador traduce todo lo que entra a la página (avisos, cuentas regresivas, el tablero), así no hace falta
   tocar cada lugar del código. Lo marcado con translate="no" no se toca. */
const LANGS=[['es','Español'],['en','English'],['pt','Português']];
const LOCALES={es:'es-AR',en:'en-US',pt:'pt-BR'};
let LANG='es';
const I18X={};
const RX=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function i18nPrep(l){if(I18X[l])return I18X[l];const d=(window.I18N||{})[l]||(typeof I18N!=='undefined'?I18N[l]:null);if(!d)return null;
  const pats=[];
  for(const k in d){if(!/\{\d\}/.test(k))continue;const lit=k.replace(/\{\d\}/g,'');if(!/[A-Za-zÀ-ÿ]/.test(lit))continue;
    const idx=[];let re='^';for(const p of k.split(/(\{\d\})/)){const m=/^\{(\d)\}$/.exec(p);if(m){idx.push(+m[1]);re+='([\\s\\S]+?)'}else re+=RX(p)}
    pats.push({re:new RegExp(re+'$'),idx,t:d[k],n:lit.length})}
  pats.sort((a,b)=>b.n-a.n);
  return I18X[l]={d,pats,cache:new Map()}}
const HASL=/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡]/;
function tcore(X,s){const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);const c=m[2];if(!c||!HASL.test(c))return s;
  let r=X.cache.get(c);if(r===undefined){r=tlook(X,c,0);if(X.cache.size>5000)X.cache.clear();X.cache.set(c,r)}
  return r===null?s:m[1]+r+m[3]}
const NUMDE={en:'of',pt:'de'};
function tlook(X,c,depth){const d=X.d;if(d[c]!==undefined)return d[c];if(depth>4)return null;
  /* "1 de 3" (páginas, lecciones) */
  let m=/^(\d+) de (\d+)$/.exec(c);if(m)return m[1]+' '+(NUMDE[LANG]||'de')+' '+m[2];
  m=/^(\d+) a (\d+)$/.exec(c);if(m)return m[1]+(LANG==='en'?'–':' a ')+m[2];
  m=/^a (\d+)$/.exec(c);if(m)return (LANG==='en'?'to ':'até ')+m[1];
  /* varias oraciones pegadas: la primera parte conocida y el resto aparte */
  const ss=c.split(/(?<=[.!?…])\s+(?=[¡¿A-ZÁÉÍÓÚÑ])/);
  if(ss.length>1)for(let i=ss.length-1;i>=1;i--){const h=ss.slice(0,i).join(' ');const y=d[h]!==undefined?d[h]:(i===1?tpat(X,h,true):null);if(y!=null){const rest=ss.slice(i).join(' ');const z=tlook(X,rest,depth+1);return y+' '+(z===null?rest:z)}}
  /* plantillas largas: "Volver a {0}", "Ganá {0} fichas"… */
  let y=tpat(X,c,true);if(y!==null)return y;
  /* un comienzo conocido y el resto: "Ahora te llamás Ale", "Jefe de la zona · Premio: el dorso Ombú" */
  const w=c.split(' ');for(let k=w.length-1;k>=1;k--){const pre=w.slice(0,k).join(' ');if(pre.length>2&&d[pre]!==undefined){const rest=w.slice(k).join(' ');const z=tlook(X,rest,depth+1);if(z!==null||/^[¡¿]?[A-ZÁÉÍÓÚÑ0-9]/.test(rest))return d[pre]+' '+(z===null?rest:z)}}
  /* textos pegados con separadores: "Tu turno · 12 s", "El Estudiante (compa): ¡Truco!" */
  for(const sep of [' · ',': ',' — ']){if(!c.includes(sep))continue;const parts=c.split(sep),out=[];let ch=false;
    for(let a=0;a<parts.length;){let b=parts.length;for(;b>a+1;b--){if(b-a===parts.length)continue;const jn=parts.slice(a,b).join(sep);if(d[jn]!==undefined){out.push(d[jn]);ch=true;break}}
      if(b>a+1){a=b;continue}const z=tlook(X,parts[a].trim(),depth+1);if(z!==null&&z!==parts[a].trim()){out.push(parts[a].replace(parts[a].trim(),z));ch=true}else out.push(parts[a]);a++}
    if(ch)return out.join(sep)}
  /* plantillas cortas: "{0} fichas" */
  y=tpat(X,c,false);if(y!==null)return y;
  /* signos alrededor: "(compa)", "Racha:", "¡Truco!" */
  const pm=/^([¡¿·(«"“]*\s*)([\s\S]*?)(\s*[.:!?)·…,»"”]*)$/.exec(c);if(pm&&(pm[1]||pm[3])&&pm[2]&&pm[2]!==c){const z=tlook(X,pm[2],depth+1);if(z!==null||/[¡¿]/.test(pm[1]))return pm[1].replace(/[¡¿]/g,'')+(z===null?pm[2]:z)+pm[3]}
  /* un final conocido: "Tierra del Chamamé (bloqueada)" */
  for(let k=1;k<w.length;k++){const suf=w.slice(k).join(' ');if(d[suf]!==undefined){const head=w.slice(0,k).join(' ');const z=tlook(X,head,depth+1);if(z!==null||/^[A-ZÁÉÍÓÚÑ0-9]/.test(head))return (z===null?head:z)+' '+d[suf]}}
  return null}
function tpat(X,c,long){for(const p of X.pats){if((p.n>=6)!==long)continue;const mm=p.re.exec(c);if(mm)return p.t.replace(/\{(\d)\}/g,(_,n)=>{const v=mm[p.idx.indexOf(+n)+1];return v==null?'':tcore(X,v)})}return null}
/* traducir un texto suelto (para el lienzo de compartir, los avisos del sistema…) */
function tx(s){if(LANG==='es'||s==null)return s;const X=i18nPrep(LANG);return X?tcore(X,String(s)):s}
const fmtLoc=()=>LOCALES[LANG]||'es-AR';

/* ---------- traducir el DOM ---------- */
const TATTR=['aria-label','title','placeholder','alt'];
const TXT=new WeakMap(),ATT=new WeakMap();
function trText(n){const rec=TXT.get(n);const src=rec&&n.data===rec.out?rec.src:n.data;const out=LANG==='es'?src:tx(src);
  if(out!==n.data)n.data=out;if(out!==src||rec)TXT.set(n,{src,out})}
function trAttr(el,a){const v=el.getAttribute(a);if(v==null)return;let m=ATT.get(el);const rec=m&&m[a];const src=rec&&v===rec.out?rec.src:v;const out=LANG==='es'?src:tx(src);
  if(out!==v)el.setAttribute(a,out);if(out!==src||rec){if(!m)ATT.set(el,m={});m[a]={src,out}}}
const skipEl=el=>el.nodeName==='SCRIPT'||el.nodeName==='STYLE'||el.getAttribute('translate')==='no';
function trTree(root){if(!root)return;if(root.nodeType===3){const p=root.parentElement;if(!p||!p.closest('[translate="no"],script,style'))trText(root);return}
  if(root.nodeType!==1&&root.nodeType!==11)return;if(root.nodeType===1){if(skipEl(root)||root.closest&&root.closest('[translate="no"]'))return;for(const a of TATTR)if(root.hasAttribute(a))trAttr(root,a)}
  const tw=document.createTreeWalker(root,5,{acceptNode:n=>n.nodeType===1?(skipEl(n)?2:3):1});
  /* 5 = elementos y textos; 2 = saltear la rama; 3 = seguir adentro sin tomar el elemento */
  for(let n=tw.nextNode();n;n=tw.nextNode())trText(n);
  if(root.querySelectorAll)root.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(el=>{if(!el.closest('[translate="no"]'))for(const a of TATTR)if(el.hasAttribute(a))trAttr(el,a)})}
let MO=null;
function i18nWatch(){if(MO||typeof MutationObserver==='undefined')return;
  MO=new MutationObserver(ms=>{if(LANG==='es')return;for(const m of ms){
    if(m.type==='characterData'){const p=m.target.parentElement;if(p&&!p.closest('[translate="no"],script,style'))trText(m.target)}
    else if(m.type==='attributes'){if(!m.target.closest('[translate="no"]'))trAttr(m.target,m.attributeName)}
    else m.addedNodes.forEach(trTree)}});
  MO.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:TATTR})}
/* idioma inicial: el guardado o el del navegador */
function guessLang(){const n=((navigator.languages&&navigator.languages[0])||navigator.language||'es').toLowerCase();return n.startsWith('pt')?'pt':n.startsWith('en')?'en':'es'}
function setLangNow(l){if(!LOCALES[l])l='es';LANG=l;document.documentElement.lang=l==='es'?'es':l==='pt'?'pt-BR':'en';
  if(l!=='es')i18nPrep(l);trTree(document.body);if(document.title)document.title=document.title}
/* el selector de idioma (los nombres van siempre en su propio idioma) */
function langPickHTML(cls){return `<div class="seg langseg ${cls||''}" role="group" aria-label="Idioma">${LANGS.map(([k,l])=>`<button type="button" data-a="lang" data-v="${k}" aria-pressed="${LANG===k}" lang="${k}" translate="no">${l}</button>`).join('')}</div>`}
