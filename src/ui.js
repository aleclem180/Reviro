/* ---------- utilidades y cartas ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-AR');
const SUITCOL={O:'var(--oro)',C:'var(--copa)',E:'var(--espada)',B:'var(--basto)'};
const GAPS={O:0,C:1,E:2,B:3};
const FIG={10:'SOTA',11:'CABALLO',12:'REY'};
const PIPS={2:[[30,28],[30,62]],3:[[30,24],[30,45],[30,66]],4:[[20,28],[40,28],[20,62],[40,62]],5:[[20,26],[40,26],[30,45],[20,64],[40,64]],
  6:[[20,24],[40,24],[20,45],[40,45],[20,66],[40,66]],7:[[20,22],[40,22],[30,34],[20,47],[40,47],[20,68],[40,68]]};
/* Baraja española: papel crema, pintas arriba y abajo (oros sin corte, copas 1, espadas 2, bastos 3),
   números en las esquinas, palos con detalle y figuras de sota, caballo y rey de cuerpo entero
   (dibujadas en 120x180 y encajadas en el marco de la carta). */

const PIPS2={2:[[30,24],[30,66]],3:[[30,22],[30,45],[30,68]],4:[[20,25],[40,25],[20,65],[40,65]],5:[[20,24],[40,24],[30,45],[20,66],[40,66]],
  6:[[20,22],[40,22],[20,45],[40,45],[20,68],[40,68]],7:[[20,20],[40,20],[30,33],[20,46],[40,46],[20,70],[40,70]]};
/* espadas y bastos van cruzados de a pares, como en la baraja, en filas fáciles de contar: [x, y, largo, ángulo] */
const XP=(y,L,a=L<40?32:24)=>[[30,y,L,-a],[30,y,L,a]];
const CRUCE={2:XP(45,66),3:[...XP(45,66,26),[30,45,66,0]],4:[...XP(26,34),...XP(64,34)],5:[...XP(24,30),...XP(66,30),[30,45,32,90]],
  6:[...XP(21,24),...XP(45,24),...XP(69,24)],7:[...XP(21,24),...XP(45,24),[30,45,24,0],...XP(69,24)]};
const SUITHEX={O:'#c48a12',C:'#b5302a',E:'#2b5b9c',B:'#3d7a38'};
const cardName=c=>`${cn(c)} de ${({O:'oro',C:'copa',E:'espada',B:'basto'})[cs(c)]}`;
function cardHTML(c,cls='',style=''){const n=cn(c),s=cs(c),col=SUITCOL[s],hx=SUITHEX[s],g=GAPS[s];let fr='';const x0=9,x1=51,gw=3.6,sw=(x1-x0-g*gw)/(g+1);
  for(const y of [4.4,85.6])for(let i=0;i<=g;i++){const a=x0+i*(sw+gw);fr+=`<line x1="${a.toFixed(2)}" x2="${(a+sw).toFixed(2)}" y1="${y}" y2="${y}" stroke="${hx}" stroke-width="1.5" stroke-linecap="round"/>`}
  const long=s==='E'||s==='B';
  /* cada palo es un dibujo; se coloca encajado en una caja de z de alto, con su proporción */
  const A=CARDART['sym'+s],WX={E:1.7,B:1.25}[s]||1;const u=(x,y,z,r)=>{const hh=z,ww=z*A.w/A.h*(n>1?WX:1.25);return `<use href="#p${s}" x="${(x-ww/2).toFixed(2)}" y="${(y-hh/2).toFixed(2)}" width="${ww.toFixed(2)}" height="${hh.toFixed(2)}"${r?` transform="rotate(${r} ${x} ${y})"`:''}/>`};
  let mid='',fig='';
  if(n===1){const big=long?66:s==='O'?36:44;mid=(c==='1E'||c==='1B')?`<ellipse cx="30" cy="45" rx="19" ry="27" fill="none" stroke="${hx}" stroke-opacity=".35" stroke-width=".6" stroke-dasharray="1.2 1.4"/>`:'';mid+=u(30,45,big,0)}
  else if(n<=7&&long)mid=CRUCE[n].map(([x,y,L,a])=>u(x,y,L,a)).join('');
  else if(n<=7)mid=PIPS2[n].map(([x,y])=>u(x,y,s==='O'?(n>=6?14:15):(n>=6?15:16.5),0)).join('');
  else{/* sota, caballo y rey: el dibujo de cuerpo entero dentro del marco */const F=CARDART[n+s],bw=40,bh=61,sc=Math.min(bw/F.w,bh/F.h),fw=F.w*sc,fh=F.h*sc;
    fig=`<image href="${F.src}" x="${(30-fw/2).toFixed(2)}" y="${(78.4-fh).toFixed(2)}" width="${fw.toFixed(2)}" height="${fh.toFixed(2)}"/>`;
    fr+=`<rect x="9" y="16" width="42" height="63.4" rx="1.6" fill="none" stroke="${hx}" stroke-width=".7"/>`}
  const label=`${n} de ${({O:'oro',C:'copa',E:'espada',B:'basto'})[s]}`;
  return `<span class="card ${cls}" ${style?`style="${style}"`:''} role="img" aria-label="${label}"><img class="cart" data-c="${c}" src="${cardArt(c,fr,mid+fig)}" alt="" draggable="false"><svg class="cidx" viewBox="0 0 60 90" aria-hidden="true"><text x="4.6" y="14.6" class="cnum" fill="${col}">${n}</text><text x="4.6" y="14.6" class="cnum" fill="${col}" transform="rotate(180 30 45)">${n}</text></svg></span>`}
/* El dibujo de cada carta (papel, pintas, palos y figuras) va con un filtro de lápiz de color, que es caro de calcular.
   Por eso se arma una sola vez por carta como imagen SVG y queda guardado: al moverla o rotarla, el navegador no recalcula el filtro.
   El rayado sale en diagonal porque el filtro trabaja en un espacio girado. Los números van aparte, nítidos, con la letra de la página. */
const CARDIMG={};let CARDDEFS=null;
function cardDefs(){if(CARDDEFS===null)CARDDEFS=['gPapel','fLapiz','fGrano'].map(id=>{const el=document.getElementById(id);return el?el.outerHTML:''}).join('')+['O','C','E','B'].map(s=>{const A=CARDART['sym'+s];return `<symbol id="p${s}" viewBox="0 0 ${A.w} ${A.h}" preserveAspectRatio="none"><image href="${A.src}" width="${A.w}" height="${A.h}"/></symbol>`}).join('');return CARDDEFS}
function cardArt(c,fr,mid){/* mid trae los palos o la figura */if(CARDIMG[c])return CARDIMG[c];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 90" width="360" height="540"><defs>${cardDefs()}</defs><rect x=".5" y=".5" width="59" height="89" rx="4.6" fill="url(#gPapel)" stroke="#b9a27a" stroke-width=".7"/><rect x=".5" y=".5" width="59" height="89" rx="4.6" fill="#fff" filter="url(#fGrano)" opacity=".28"/><g transform="rotate(32 30 45)" filter="url(#fLapiz)"><g transform="rotate(-32 30 45)">${fr}</g></g>${mid}</svg>`;
  const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);CARDIMG[c]=uri;rasterCard(c,uri);return uri}
/* y después se pasa a mapa de bits, que es lo más liviano para mover en pantalla */
/* y después se pasa a mapa de bits, que es lo más liviano para mover en pantalla.
   Ojo: el navegador a veces avisa que la imagen cargó antes de tener listos los dibujos de adentro; por eso se espera
   a que esté decodificada y se revisa que el resultado no haya salido vacío (si sale vacío, se reintenta y, si no, queda el SVG). */
function rasterCard(c,uri,tries=0){try{const im=new Image();im.onload=async()=>{try{if(im.decode)await im.decode().catch(()=>{});await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,30)));
    const cv=document.createElement('canvas');cv.width=360;cv.height=540;const cx=cv.getContext('2d');cx.drawImage(im,0,0,360,540);
    const px=cx.getImageData(180,40,1,1).data,mid=cx.getImageData(180,270,40,40).data;let ink=0;for(let k=3;k<mid.length;k+=4)ink+=mid[k];
    if(px[3]<200||ink===0){if(tries<4)setTimeout(()=>rasterCard(c,uri,tries+1),250*(tries+1));return}
    cv.toBlob(b=>{if(!b)return;const url=URL.createObjectURL(b);CARDIMG[c]=url;document.querySelectorAll('img.cart[data-c="'+c+'"]').forEach(el=>{el.src=url})},'image/png')}catch(e){}};im.src=uri}catch(e){}}
function fosforos(score,target){const groups=target/5,pitch=17,sz=12;let o='';
  for(let gi=0;gi<groups;gi++){const v=Math.max(0,Math.min(5,score-gi*5));const x=gi*pitch+(target===30&&gi>=3?6:0)+2,y=3;
    const L=[[x,y,x+sz,y],[x+sz,y,x+sz,y+sz],[x+sz,y+sz,x,y+sz],[x,y+sz,x,y],[x,y,x+sz,y+sz]];
    L.forEach((l,i)=>{const on=i<v;o+=`<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${on?'var(--fs-on,var(--card))':'var(--fs-off,var(--line))'}" stroke-width="1.6" stroke-linecap="round"/>`+(on?`<circle cx="${l[0]}" cy="${l[1]}" r="1.6" fill="var(--copa)"/>`:'')})}
  if(target===30)o+=`<line x1="${3*pitch+1}" y1="0" x2="${3*pitch+1}" y2="${sz+6}" stroke="var(--brass)" stroke-width="1" stroke-dasharray="2 2"/>`;
  const w=groups*pitch+(target===30?8:2);
  return `<svg width="${w}" height="${sz+6}" viewBox="0 0 ${w} ${sz+6}" role="img" aria-label="${score} de ${target} puntos">${o}</svg>`}
const coinI='<i class="coin" aria-hidden="true"></i>';

/* ---------- estado ---------- */
let SELCARD=null,REPAINT=null,view='menu',mode=null,G=null,mySeat=0,cfg=null,CL=null,db=null,usr=null,uid=null,roomCap=null,R=null,myName='';
let T=null,tableRef=null,unsubTable=null,unsubLobby=null,lobby=[],NAMES={},LOOKS={},isHost=false,busy=false,driveT=null;
let confirmMazo=false,confirmExit=false,overlayView=null,shopTab='av',pendingBuy=null,panel=null,FX={},transient={},botLooks={},partnerSena=null,lastReward=null;
const SET={diff:'medio',n:2,target:30,stake:0,flor:true,sound:true,music:true,mute:false,track:'zamba',vol:80,volMusic:60,volFx:90,hflor:true,help:true,tap2:true,on:{n:2,target:30,stake:0,flor:true}};
try{const s=JSON.parse(localStorage.getItem('reviro.set')||'{}');Object.assign(SET,s);SET.on=Object.assign({n:2,target:30,stake:0,flor:true},s.on||{})}catch(e){}
function saveSet(){try{localStorage.setItem('reviro.set',JSON.stringify(SET))}catch(e){}}
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,3200)}

/* ---------- sonido: muestras pregeneradas, reproducidas con <audio> (suena aunque el iPhone esté en silencio) y respaldo Web Audio ---------- */
const SR=22050;let AC=null,SNDREADY=false;const SNDS={};
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});return AC}
function synth(dur,fn){const n=Math.floor(SR*dur),o=new Float32Array(n);fn(o);let mx=0;for(let i=0;i<n;i++)mx=Math.max(mx,Math.abs(o[i]));if(mx>.95)for(let i=0;i<n;i++)o[i]*=.95/mx;return o}
function addTone(o,f,t0,d,type,v){const s0=Math.floor(t0*SR),len=Math.floor(d*SR);for(let i=0;i<len&&s0+i<o.length;i++){const t=i/SR;const env=t<.012?t/.012:Math.exp(-4.5*(t-.012)/d);
  const ph=(t*f)%1;const w=type==='sine'?Math.sin(2*Math.PI*f*t):type==='square'?(ph<.5?1:-1)*.6:(4*Math.abs(ph-.5)-1);o[s0+i]+=v*env*w}}
function addNoise(o,t0,d,v,bright){const s0=Math.floor(t0*SR),len=Math.floor(d*SR);let lp=0,prev=0;for(let i=0;i<len&&s0+i<o.length;i++){const x=Math.random()*2-1;lp+=(x-lp)*bright;const hp=lp-prev;prev=lp;o[s0+i]+=v*hp*Math.pow(1-i/len,3)*3}}
/* reverberación tipo sala (Freeverb simplificado). Con loop=true la cola del final entra por el principio: el bucle no se corta */
function reverb(x,sr,{mix=.2,room=.84,damp=.32,loop=false}={}){const N=x.length,S=sr/44100;
  const combs=[1116,1188,1277,1356,1422,1491,1557,1617].map(d=>({b:new Float32Array(Math.max(1,Math.round(d*S))),i:0,f:0}));
  const aps=[556,441,341,225].map(d=>({b:new Float32Array(Math.max(1,Math.round(d*S))),i:0}));
  const wet=new Float32Array(N),passes=loop?2:1;
  for(let pass=0;pass<passes;pass++)for(let n=0;n<N;n++){const inp=x[n]*.12;let s=0;
    for(const c of combs){const y=c.b[c.i];c.f=y*(1-damp)+c.f*damp;c.b[c.i]=inp+c.f*room;c.i=(c.i+1)%c.b.length;s+=y}
    for(const a of aps){const bo=a.b[a.i];const y=-s+bo;a.b[a.i]=s+bo*.5;a.i=(a.i+1)%a.b.length;s=y}
    if(pass===passes-1)wet[n]=s}
  const out=new Float32Array(N);for(let n=0;n<N;n++)out[n]=x[n]*(1-mix*.5)+wet[n]*mix;return out}
/* cuerda pulsada (Karplus-Strong) para los efectos: rasguidos de guitarra criolla */
function ksPluck(o,t0,m,dur,vel,soft=.5){const f=440*Math.pow(2,(m-69)/12),p=Math.max(2,Math.round(SR/f)),buf=new Float32Array(p);let lp=0;
  for(let i=0;i<p;i++){const x=Math.random()*2-1;lp+=(x-lp)*soft;buf[i]=lp}const s0=Math.round(t0*SR),len=Math.round(dur*SR);let idx=0;
  for(let i=0;i<len&&s0+i<o.length;i++){const a=buf[idx],b=buf[(idx+1)%p];buf[idx]=(a+b)*.4982;idx=(idx+1)%p;o[s0+i]+=a*vel*(i<24?i/24:1)*(i>len-600?(len-i)/600:1)}}
const strum=(o,t,notes,vel,dur,gap=.018)=>notes.forEach((m,k)=>ksPluck(o,t+k*gap,m,dur,vel*(1-k*.06)));
/* metal: parciales inarmónicos con caída rápida (fichas y monedas) */
function clink(o,t0,f,v,d=.35){[1,2.76,5.4,8.93].forEach((r,k)=>addTone(o,f*r,t0,d/(1+k*.6),'sine',v/(1+k*1.4)))}
/* golpe de carta sobre el paño: chasquido brillante + golpe sordo */
function snap(o,t0,v){addNoise(o,t0,.045,v,.75);addTone(o,140,t0,.06,'sine',v*.45);addNoise(o,t0+.004,.03,v*.4,.25)}
const wet=(s,mix=.18)=>reverb(s,SR,{mix,room:.72,damp:.4});
const RECIPES={
  card:()=>synth(.22,o=>snap(o,0,.85)),
  deal:()=>synth(.75,o=>{for(let k=0;k<12;k++)snap(o,k*.045+Math.random()*.008,.32+k*.02);addNoise(o,0,.6,.12,.08)}),
  call:()=>synth(.3,o=>{addTone(o,180,0,.08,'sine',.3);addNoise(o,0,.03,.16,.45);addTone(o,165,.12,.07,'sine',.22);addNoise(o,.12,.025,.11,.45)}),
  pts:()=>wet(synth(.45,o=>clink(o,0,1380,.32)),.12),
  buy:()=>wet(synth(.8,o=>{[0,.07,.13,.2].forEach((t,k)=>clink(o,t,1250+k*160,.26,.3))}),.15),
  win:()=>wet(synth(2.2,o=>{strum(o,0,[45,52,57,61,64],.5,1.8,.03);strum(o,.42,[52,56,59,64,68],.45,1.6,.03);strum(o,.84,[57,64,69,73,76],.55,1.4,.035);addTone(o,55,0,.5,'sine',.5);addTone(o,55,.84,.5,'sine',.45)}),.24),
  lose:()=>wet(synth(1.8,o=>{strum(o,0,[52,55,59,64],.42,1.4,.04);strum(o,.5,[45,52,57,60],.38,1.3,.05)}),.24),
};
/* volumen: general × música o efectos (0 a 100 cada uno) */
const volOf=kind=>Math.max(0,Math.min(1,(SET.vol??80)/100*((kind==='music'?SET.volMusic??60:SET.volFx??90)/100)));
function wavURL(s){const n=s.length,buf=new ArrayBuffer(44+n*2),v=new DataView(buf);const w=(o,str)=>{for(let i=0;i<str.length;i++)v.setUint8(o+i,str.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,SR,true);v.setUint32(28,SR*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,s[i]))*32767,true);
  let bin='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=8192)bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return 'data:audio/wav;base64,'+btoa(bin)}
function unlockSound(){if(SNDREADY)return;SNDREADY=true;setTimeout(musicUpdate,30);
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  const c=ac();if(c){try{const b=c.createBuffer(1,1,SR),src=c.createBufferSource();src.buffer=b;src.connect(c.destination);src.start(0)}catch(e){}}
  for(const k in RECIPES){const samples=RECIPES[k];const s=samples();const entry={s,el:null};SNDS[k]=entry;
    try{const a=new Audio(wavURL(s));a.preload='auto';a.muted=true;const p=a.play();if(p&&p.then)p.then(()=>{a.pause();a.currentTime=0;a.muted=false;entry.el=a}).catch(()=>{entry.el=null});else{a.pause();a.muted=false;entry.el=a}}catch(e){entry.el=null}}}
function playWA(s){const c=ac();if(!c)return;try{const b=c.createBuffer(1,s.length,SR);b.getChannelData(0).set(s);const src=c.createBufferSource(),g=c.createGain();g.gain.value=volOf('fx');src.buffer=b;src.connect(g);g.connect(c.destination);src.start()}catch(e){}}
function sfx(n){if(!SET.sound||SET.mute)return;const e=SNDS[n];if(!e)return;
  if(!volOf('fx'))return;if(useWAmusic()){playWA(e.s);return}
  if(e.el){try{e.el.currentTime=0;e.el.volume=volOf('fx');const p=e.el.play();if(p&&p.catch)p.catch(()=>playWA(e.s))}catch(err){playWA(e.s)}}else playWA(e.s)}
['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,unlockSound,{once:false,passive:true}));
function renderSnd(){const on=!SET.mute;const b=$('#sndbtn');b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Silenciar todo':'Activar sonido');
  b.innerHTML=`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z" fill="var(--ink)"/>${on?'<path d="M11 5.5q2 2.5 0 5M12.6 4q3 4 0 8" stroke="var(--ink)" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M11 5.5l4 5M15 5.5l-4 5" stroke="var(--bad)" stroke-width="1.4" stroke-linecap="round"/>'}</svg>`}

/* ---------- billetera: fichas, monedas, cosas compradas ---------- */
const WAL={chips:1000,coins:150,owned:[],eq:{av:'gaucho',dorso:'pampa',pano:'quincho',kit:'arg'},stats:{played:0,won:0,streak:0,best:0,earned:0},daily:'',applied:[],mis:null,ach:{cnt:{},done:[]},evk:[],tut:[]};
let walRef=null,walQ=Promise.resolve(),walReady=false;
const WAL0=JSON.parse(JSON.stringify(WAL));
/* en la web con cuentas, cada usuario guarda su billetera aparte en este dispositivo */
const walKey=()=>(typeof FB!=='undefined'&&FB&&uid)?'reviro.wallet.'+uid:'reviro.wallet';
function renderWallet(){$('#chips').textContent=fmt(WAL.chips);$('#coins').textContent=fmt(WAL.coins)}
const itemOf=(type,id)=>(type==='av'?AVM:type==='dorso'?DM:type==='kit'?KITM:PM)[id];
const myAv=()=>WAL.eq.av==='hincha'?kitAv(WAL.eq.kit):WAL.eq.av;
const owns=(type,id,price)=>{const it=itemOf(type,id);if(it&&it.boss)return !!(WAL.gira&&WAL.gira.bosses.includes(it.boss));return !price||WAL.owned.includes(type+':'+id)};
async function loadWallet(){try{const l=JSON.parse(localStorage.getItem(walKey())||'null');if(l)mergeWal(l)}catch(e){}
  if(db&&uid){try{walRef=db.doc('data/users/'+uid+'/wallet');const s=await walRef.get();if(s.exists)mergeWal(s.data())}catch(e){walRef=null}}
  walReady=true;renderWallet();
  const today=new Date().toLocaleDateString('en-CA');
  /* premio del día: 30 monedas y, si te quedaste corto, las fichas se completan hasta 1.000 */
  if(WAL.daily!==today){WAL.daily=today;const top=Math.max(0,1000-WAL.chips);await applyTx('daily-'+today,{coins:30,chips:top});toast('Premio del día: +30 monedas'+(top?` y tus fichas vuelven a 1.000`:''))}
  if(!WAL.fcode){WAL.fcode=genFriendCode();saveWallet()}
  if(!WAL.th2){WAL.th2=1;if(WAL.eq.pano==='bordo')WAL.eq.pano='quincho';if(WAL.eq.dorso==='bordo')WAL.eq.dorso='pampa';saveWallet()}
  ensureMissions();writeLooks();render()}
function mergeWal(d){for(const k of ['chips','coins','daily','th2','nick','fcode','registered','copas'])if(d[k]!==undefined)WAL[k]=d[k];
  if(Array.isArray(d.owned))WAL.owned=d.owned;if(d.mis)WAL.mis=d.mis;if(d.ach)WAL.ach={cnt:d.ach.cnt||{},done:d.ach.done||[]};if(Array.isArray(d.evk))WAL.evk=d.evk;if(Array.isArray(d.tut))WAL.tut=d.tut;if(Array.isArray(d.friends))WAL.friends=d.friends;if(d.gira)WAL.gira={beat:d.gira.beat||{},bosses:d.gira.bosses||[]};if(d.tours&&typeof d.tours==='object')WAL.tours=d.tours;if(Array.isArray(d.applied))WAL.applied=d.applied;
  if(d.eq)WAL.eq=Object.assign({},WAL.eq,d.eq);if(d.stats)WAL.stats=Object.assign({},WAL.stats,d.stats)}
async function saveWallet(){const body=JSON.parse(JSON.stringify(WAL));try{localStorage.setItem(walKey(),JSON.stringify(body))}catch(e){}
  if(walRef){try{await walRef.set(body)}catch(e){walRef=null}}}
function applyTx(key,d){walQ=walQ.then(async()=>{if(WAL.applied.includes(key))return false;
    if((d.coins||0)<0&&WAL.coins+d.coins<0)return false;if(d.own&&(d.chips||0)<0&&WAL.chips+d.chips<0)return false;
    WAL.chips=Math.max(0,WAL.chips+(d.chips||0));WAL.coins=Math.max(0,WAL.coins+(d.coins||0));
    if(d.coins>0&&d.earn)WAL.stats.earned+=d.coins;
    if(d.own&&!WAL.owned.includes(d.own))WAL.owned=WAL.owned.concat(d.own);
    if(d.tour){const x=Object.assign({},WAL.tours||{});if(d.tour.v)x[d.tour.id]=d.tour.v;else delete x[d.tour.id];WAL.tours=x}
    if(d.pts)WAL.stats.pts=(WAL.stats.pts||0)+d.pts;if(d.astat){WAL.stats.ast=d.astat==='w'?(WAL.stats.ast||0)+1:0;WAL.stats.abest=Math.max(WAL.stats.abest||0,WAL.stats.ast)}
    if(d.stat){WAL.stats.played++;if(d.stat==='w'){WAL.stats.won++;WAL.stats.streak++;WAL.stats.best=Math.max(WAL.stats.best,WAL.stats.streak)}else WAL.stats.streak=0}
    WAL.applied=WAL.applied.concat(key).slice(-80);renderWallet();await saveWallet();render();return true});return walQ}
let lastLooks='';
async function writeLooks(){if(!db||!uid)return;const st=WAL.stats,body={av:myAv(),dorso:WAL.eq.dorso,pts:st.pts||0,won:st.won,played:st.played,best:st.best,nick:WAL.nick||'',code:WAL.fcode||'',copas:WAL.copas||0,friends:(WAL.friends||[]).slice(0,100)};const v=JSON.stringify(body);if(v===lastLooks)return;lastLooks=v;
  try{await db.doc('looks/'+uid).set(body)}catch(e){lastLooks=''}}
async function fetchLooks(ids){if(!db)return;const miss=ids.filter(id=>id&&!(id in LOOKS));if(!miss.length)return;miss.forEach(id=>LOOKS[id]=null);
  await Promise.all(miss.map(async id=>{try{const s=await db.doc('looks/'+id).get();LOOKS[id]=s.exists?s.data():{}}catch(e){LOOKS[id]={}}}));render()}
function equip(type,id){WAL.eq[type]=id;if(type==='kit'&&owns('av','hincha',AVM.hincha.price))WAL.eq.av='hincha';saveWallet();writeLooks();render()}
/* la tienda cobra en fichas; quien tiene monedas (ganadas o compradas) también puede pagar con ellas.
   Al revés nunca: las monedas no se convierten en fichas. */
const FXR=5,fPrice=p=>p*FXR,chipI='<i class="chip" aria-hidden="true"></i>';
async function buy(type,id,price,name,cur){const coins=cur==='coins';const ok=await applyTx('buy-'+type+'-'+id,coins?{coins:-price,own:type+':'+id}:{chips:-fPrice(price),own:type+':'+id});
  if(ok){sfx('buy');toast('¡Compraste '+name+'!');equip(type,id)}else toast(coins?'No te alcanzan las monedas':'No te alcanzan las fichas')}

/* ---------- jugadores ---------- */
const myTeam=()=>team(mySeat<0?0:mySeat);
const teamName=t=>t===myTeam()?'Nosotros':'Ellos';
function seatLook(s){if(!G)return{av:'gaucho',dorso:'pampa'};if(s===mySeat)return{av:myAv(),dorso:WAL.eq.dorso};
  if(mode==='offline')return botLooks[s]||{av:'veterano',dorso:'pampa'};
  const st=G.seats[s];if(st.bot)return{av:['veterano','asador','tanguero','abuela'][s%4],dorso:'pampa'};
  const l=LOOKS[st.id];return{av:(l&&AVM[l.av])?l.av:'gaucho',dorso:(l&&DM[l.dorso])?l.dorso:'pampa'}}
function nameOf(s){if(!G)return'';if(s===mySeat)return'Vos';const st=G.seats[s];
  if(mode==='offline'&&CAMP&&s===1)return RM[CAMP.rid].name;
  if(mode==='offline'){const n=(AVM[seatLook(s).av]||{}).name||'La Máquina';return G.n===4&&s===2?n+' (compa)':n}
  if(st.bot)return'Bot '+(s+1);return dispName(st.id)||'Jugador '+(s+1)}
async function ensureNames(ids){if(!usr||!ids.length)return;try{const ps=await usr.profiles(ids);let ch=false;for(const id of ids){const nm=(ps[id]&&ps[id].name)||'';if(nm&&NAMES[id]!==nm){NAMES[id]=nm;ch=true}}if(ch)render()}catch(e){}}
function pickBotLooks(n){const pool=shuffle(AVS.map(a=>a.id).filter(id=>id!==WAL.eq.av)),dp=shuffle(DORSOS.map(d=>d.id));const o={};for(let s=1;s<n;s++)o[s]={av:pool[s],dorso:dp[s%dp.length]};return o}

/* ---------- efectos entre estados ---------- */
const countPlays=g=>g.hand.bazas.reduce((a,b)=>a+b.plays.length,0);
const SAIDAT={},SAYS={};
function setG(ng){const p=G;G=ng;FX={};if(!ng)return;
  if(!p||p.matchId!==ng.matchId||p.handNo!==ng.handNo){FX.deal=true;sfx('deal');transient={};for(const k in SAYS)delete SAYS[k];computeSena(ng);
    if(!TUT&&(!p||p.matchId!==ng.matchId)&&ng.handNo===1){const o=[...Array(ng.n).keys()].find(s=>s!==mySeat&&team(s)!==team(mySeat<0?0:mySeat));if(o!==undefined)setTimeout(()=>{if(view==='game'&&G)showTransient(o,pickLine(seatLook(o).av,'greet'),'react',3600)},900)}}
  else{if(countPlays(ng)>countPlays(p)){FX.land=true;sfx('card')}
    let called=false;for(const s in ng.hand.said)if(ng.hand.said[s]!==p.hand.said[s]){(FX.pop=FX.pop||{})[s]=1;called=true;SAIDAT[s]=Date.now();const cat=lineCat(ng.hand.said[s]);SAYS[s]={canon:ng.hand.said[s],line:cat&&Math.random()<.85?pickLine(seatLook(+s).av,cat):null};setTimeout(()=>{if(view==='game')render()},3700)}
    if(called)sfx('call')}
  if(p&&p.matchId===ng.matchId&&(p.scores[0]!==ng.scores[0]||p.scores[1]!==ng.scores[1])){FX.bump=[p.scores[0]!==ng.scores[0],p.scores[1]!==ng.scores[1]];setTimeout(()=>sfx('pts'),180)}
  if(p&&!TUT&&mySeat>=0&&p.matchId===ng.matchId&&p.handNo===ng.handNo&&!p.hand.ended&&ng.hand.ended){const evs=handEvents(ng);if(evs.length)recordEvents(ng.matchId+':h'+ng.handNo,evs)}
  if(TUT&&p&&p.handNo===ng.handNo&&!p.hand.ended&&ng.hand.ended)finishLesson();
  if(!TUT&&p&&p.matchId===ng.matchId&&p.handNo===ng.handNo&&!p.hand.ended&&ng.hand.ended&&!ng.matchOver&&Math.random()<.65){const others=[...Array(ng.n).keys()].filter(s=>s!==mySeat);const s=others[Math.floor(Math.random()*others.length)];const cat=team(s)===ng.hand.ended.winner?'win':'lose';setTimeout(()=>{if(view==='game'&&G&&G.handNo===ng.handNo)showTransient(s,pickLine(seatLook(s).av,cat),'react',3200)},650)}
  if(ng.matchOver&&(!p||!p.matchOver||p.matchId!==ng.matchId)){FX.over=true;const w=ng.matchOver.winner===myTeam();setTimeout(()=>sfx(w?'win':'lose'),350)}}
function cardSenaKey(c,flor){if(flor&&hasFlor(c))return'cachetes';if(c.includes('1E'))return'cejas';if(c.includes('1B'))return'guino';if(c.includes('7E'))return'bocader';if(c.includes('7O'))return'bocaizq';
  if(c.some(x=>cn(x)===3))return'labio';if(c.some(x=>cn(x)===2))return'dos';if(c.includes('1C')||c.includes('1O'))return'falso';return'ojos'}
function envSenaKey(e){return e>=30?'env33':e>=27?'env28':e>=23?'env25':'env0'}
function computeSena(g){partnerSena=null;if(mode!=='offline'||g.n!==4||Math.random()>.85)return;const c=g.hand.orig[2];
  const ks=[cardSenaKey(c,g.flor)];if(!(g.flor&&hasFlor(c)))ks.push(envSenaKey(envidoOf(c)));
  partnerSena={handNo:g.handNo,t:ks.map(k=>SENAS[k]).join(' · ')}}

/* ---------- vistas ---------- */
/* cada hoja ocupa la pantalla justa: arriba su encabezado, al medio el contenido (las listas largas se paginan solas
   según el alto que haya) y abajo la navegación. Nada empuja para que haya que bajar. */
const GATES=['boot','auth','login','register','welcome','banned'];
function pageBody(){switch(view){
  case 'boot':return bootHTML();case 'auth':return authHTML();case 'login':return loginHTML();case 'register':return registerHTML();case 'welcome':return welcomeHTML();case 'banned':return bannedHTML();
  case 'anotador':return anotHTML();case 'gira':return giraHTML();case 'extra':return extraHTML();case 'settings':return settingsHTML();
  case 'rules':return rulesPageHTML();case 'tutorial':return tutorialPageHTML();case 'menu':return playHTML();case 'online':return onlinePageHTML();
  case 'torneos':return toursPageHTML();case 'tour':return tourHTML();case 'tournew':return tourNewHTML();case 'shop':return shopHTML();
  case 'profile':return profileHTML();case 'missions':return missionsHTML();case 'ranking':return rankingHTML();case 'room':return roomHTML()}return''}
function render(){const v=$('#view');routeSync();document.body.dataset.view=view;
  if(view==='game'){if(v.firstElementChild&&v.firstElementChild.classList.contains('game'))morphInto(v,gameHTML());else v.innerHTML=gameHTML()}
  else v.innerHTML=(GATES.includes(view)||view==='room'?'':tabsHTML())+`<div class="page pg-${view}">${pageBody()}</div>`;
  if(view==='torneos'||view==='tour')requestAnimationFrame(animatePots);
  if(view==='game'&&FX.deal){clearTimeout(REPAINT);const hn=G&&G.handNo;REPAINT=setTimeout(()=>{if(view!=='game'||!G||G.handNo!==hn)return;document.querySelectorAll('.hand img.cart').forEach(im=>{const u=CARDIMG[im.dataset.c];if(u&&im.getAttribute('src')!==u)im.src=u});const hd=document.querySelector('.hand');if(hd){hd.style.transform='translateZ(0)';requestAnimationFrame(()=>requestAnimationFrame(()=>{hd.style.transform=''}))}},760)}
  $('#overlay').innerHTML=overlayHTML();FX={};musicUpdate();
  if(view!=='game'){requestAnimationFrame(fitPass);clearTimeout(FITT);FITT=setTimeout(()=>{FITPASS=0;fitPass()},350)}
  {const pl=document.querySelector('.pills');if(pl)pl.style.visibility=(view==='auth'||view==='boot'||view==='login')?'hidden':'visible'}
  if(view==='room'&&T){const ids=T.seats.filter(s=>s.id).map(s=>s.id);ensureNames(ids);fetchLooks(ids)}
  if(view==='game'&&mode==='online'&&G){const ids=G.seats.filter(s=>s.id).map(s=>s.id);ensureNames(ids);fetchLooks(ids)}
  if(view==='online'&&lobby.length)ensureNames(lobby.map(t=>t.host))}

/* ---------- compartir el resultado: una imagen de 1080 × 1350 (el formato de Instagram) armada en el momento ---------- */
const SHAREICO='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
let SHARE=null;
const loadImg=src=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=src});
function shareInfo(){const won=G.matchOver.winner===myTeam(),a1=G.scores[myTeam()],a2=G.scores[1-myTeam()],dos=G.n===4;
  const rival=CAMP&&RM[CAMP.rid]?RM[CAMP.rid].name:G.seats.map((x,i)=>i).filter(i=>team(i)!==myTeam()).map(nameOf).join(' y ');
  const donde=CAMP?'La Huella':mode==='online'?(T&&T.tour?T.tour.name:'Online'):`Contra la máquina · ${({facil:'Fácil',medio:'Medio',dificil:'Difícil'})[G.diff]||'Medio'}`;
  return {won,a1,a2,dos,rival,donde}}
async function shareCanvas(){const I=shareInfo(),W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  try{await document.fonts.ready}catch(e){}
  /* el paño que tenés puesto, oscurecido */
  x.fillStyle='#2a170b';x.fillRect(0,0,W,H);
  try{const u=ARTIMG['pano-'+(PM[WAL.eq.pano]?WAL.eq.pano:'quincho')];if(u&&u!=='q'){const im=await loadImg(u);const sc=Math.max(W/im.width,H/im.height);x.drawImage(im,(W-im.width*sc)/2,(H-im.height*sc)/2,im.width*sc,im.height*sc)}}catch(e){}
  const g=x.createRadialGradient(W/2,H*.42,100,W/2,H*.5,H*.8);g.addColorStop(0,'rgba(20,10,4,.25)');g.addColorStop(1,'rgba(20,10,4,.85)');x.fillStyle=g;x.fillRect(0,0,W,H);
  /* rayos de sol si ganaste */
  if(I.won){x.save();x.translate(W/2,520);for(let i=0;i<16;i++){x.rotate(Math.PI/8);x.fillStyle='rgba(240,197,72,.13)';x.beginPath();x.moveTo(0,0);x.lineTo(-60,-700);x.lineTo(60,-700);x.closePath();x.fill()}x.restore()}
  /* la guarda pampa arriba y abajo */
  const guarda=y=>{x.fillStyle='#efe0bf';x.fillRect(0,y,W,34);x.fillStyle='#2a170b';x.fillRect(0,y,W,4);x.fillRect(0,y+30,W,4);for(let i=0;i<W/56+1;i++){const cx=i*56+28;x.fillStyle='#2a170b';x.beginPath();x.moveTo(cx,y+6);x.lineTo(cx+14,y+17);x.lineTo(cx,y+28);x.lineTo(cx-14,y+17);x.fill();x.fillStyle='#b0261c';x.beginPath();x.moveTo(cx,y+11);x.lineTo(cx+7,y+17);x.lineTo(cx,y+23);x.lineTo(cx-7,y+17);x.fill()}};guarda(40);guarda(H-74);
  const txt=(t,y,font,fill,shadow)=>{x.font=font;x.textAlign='center';x.textBaseline='alphabetic';if(shadow){x.fillStyle='#1d3557';x.fillText(t,W/2+8,y+8);x.fillStyle='#74acdf';x.fillText(t,W/2+4,y+4)}x.fillStyle=fill;x.fillText(t,W/2,y)};
  txt('Reviro',200,'italic 800 120px "Bodoni Moda", Georgia, serif','#fff',true);
  /* tu personaje en un marco */
  const av=myAv(),sid=String(av),kit=sid.split(':')[1],aid=sid.split(':')[0],PH=kit?PHOTOS[aid+':'+kit]:PHOTOS[aid];let pim=null;
  try{pim=await loadImg(PH?PH.src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(avatarSVG(av,400,true).replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"')))}catch(e){}
  const S=360,ax=(W-S)/2,ay=280,rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
  x.save();x.shadowColor='rgba(0,0,0,.55)';x.shadowBlur=40;x.shadowOffsetY=16;rr(ax-14,ay-14,S+28,S+28,44);x.fillStyle=I.won?'#f0c548':'#8a6e62';x.fill();x.restore();
  x.save();rr(ax,ay,S,S,34);x.clip();x.fillStyle='#f6f1e7';x.fillRect(ax,ay,S,S);if(pim){if(!I.won)x.filter='saturate(.55)';x.drawImage(pim,ax,ay,S,S)}x.restore();x.filter='none';
  /* el cartel */
  const rw=760,rh=170,rx=(W-rw)/2,ry=ay+S-20;x.save();x.translate(W/2,ry+rh/2);if(!I.won)x.rotate(-.04);x.translate(-W/2,-(ry+rh/2));
  x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=30;x.shadowOffsetY=12;rr(rx,ry,rw,rh,30);const rg=x.createLinearGradient(0,ry,0,ry+rh);if(I.won){rg.addColorStop(0,'#7a1f2e');rg.addColorStop(1,'#4d1220')}else{rg.addColorStop(0,'#3d3330');rg.addColorStop(1,'#241c1a')}x.fillStyle=rg;x.fill();x.shadowColor='transparent';x.lineWidth=7;x.strokeStyle=I.won?'#f0c548':'#8a6e62';x.stroke();
  x.font='italic 800 118px "Bodoni Moda", Georgia, serif';x.textAlign='center';const label=I.won?'¡Victoria!':'Derrota',ty=ry+rh/2+42;
  if(I.won){x.fillStyle='#1d3557';x.fillText(label,W/2+7,ty+7);x.fillStyle='#74acdf';x.fillText(label,W/2+3.5,ty+3.5);x.fillStyle='#fff'}else{x.fillStyle='#5b4a44';x.fillText(label,W/2+4,ty+4);x.fillStyle='#e9dccb'}x.fillText(label,W/2,ty);x.restore();
  /* el resultado */
  txt(`${I.a1} a ${I.a2}`,ry+rh+150,'800 130px "Bodoni Moda", Georgia, serif','#f6ead2');
  txt(`${I.won?(I.dos?'Ganamos':'Le gané'):(I.dos?'Perdimos':'Perdí')} contra ${I.rival}`.slice(0,46),ry+rh+225,'600 46px "Barlow Semi Condensed", Arial, sans-serif','#e9dccb');
  txt(I.donde,ry+rh+285,'500 38px "Barlow Semi Condensed", Arial, sans-serif','#c9b48f');
  txt('¿Te animás? Jugá truco en aleclem180.github.io/Reviro',H-110,'600 36px "Barlow Semi Condensed", Arial, sans-serif','#f0c548');
  return await new Promise(ok=>cv.toBlob(ok,'image/png'))}
function shareText(){const I=shareInfo();return `${I.won?'¡Gané':'Perdí'} ${I.a1} a ${I.a2} al truco en Reviro${I.won?'!':''} ¿Te animás? ${SITE}`}
async function makeShare(){overlayView='compartir';SHARE={busy:true};render();
  try{const b=await shareCanvas();SHARE={blob:b,url:URL.createObjectURL(b),file:new File([b],'reviro-resultado.png',{type:'image/png'})}}catch(e){SHARE={error:true}}render()}
function canShareFile(){try{return !!(SHARE&&SHARE.file&&navigator.canShare&&navigator.canShare({files:[SHARE.file]}))}catch(e){return false}}
async function shareNative(){if(!SHARE||!SHARE.file)return;try{await navigator.share({files:[SHARE.file],text:shareText()})}catch(e){if(e&&e.name!=='AbortError')toast('No se pudo abrir el menú de compartir: descargá la imagen')}}
function shareDownload(){if(!SHARE||!SHARE.url)return;const a=document.createElement('a');a.href=SHARE.url;a.download='reviro-resultado.png';document.body.appendChild(a);a.click();a.remove();toast('Imagen guardada: subila a tu historia de Instagram')}
function shareHTML(){const s=SHARE||{},enc=encodeURIComponent;
  return `<div class="over" data-a="close"><div class="panel spanel" data-stop><h2>Compartí tu resultado</h2>
    ${s.busy?'<p class="note">Armando la imagen…</p>':s.error?'<p class="note">No se pudo armar la imagen.</p>':`<img class="sprev" src="${s.url}" alt="Imagen del resultado para compartir">`}
    ${s.url?`${canShareFile()?`<button class="btn prim" data-a="sharego">${SHAREICO}Compartir en Instagram, WhatsApp o Facebook</button>`:''}
      <div class="srow"><a class="btn wa" href="${waHref(shareText())}" target="_blank" rel="noopener">${WAICO} WhatsApp</a><a class="btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${enc(SITE)}&quote=${enc(shareText())}" target="_blank" rel="noopener">Facebook</a><button class="btn ig" data-a="sharedl">Guardar para Instagram</button></div>
      <p class="note" style="margin:0">${canShareFile()?'Con el primer botón se comparte la imagen directo. ':'Para Instagram, guardá la imagen y subila a tu historia. '}WhatsApp y Facebook mandan el link con tu resultado.</p>`:''}
    <button class="btn ghost" data-a="sharex">Volver</button></div></div>`}

/* ---------- la mesa se actualiza en el lugar ----------
   En vez de borrar y volver a armar todo en cada jugada (lo que hacía parpadear las cartas y daba tirones en el celular),
   se compara lo nuevo con lo que hay y se cambia solo lo distinto. Las cartas se reconocen por su valor, así no se recargan. */
const mkey=n=>n.nodeType===1?(n.getAttribute('data-card')||(n.classList.contains('card')&&n.querySelector('img.cart')?'c:'+n.querySelector('img.cart').getAttribute('data-c'):null)):null;
function morphNode(a,b){if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName){a.replaceWith(b);return}
  if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return}
  for(const at of [...a.attributes])if(!b.hasAttribute(at.name))a.removeAttribute(at.name);
  for(const at of [...b.attributes])if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value);
  if((a.nodeName==='INPUT'||a.nodeName==='TEXTAREA')&&a!==document.activeElement&&a.value!==b.value)a.value=b.value;
  morphKids(a,b)}
function morphKids(a,b){const bc=[...b.childNodes];
  for(let i=0;i<bc.length;i++){const nb=bc[i];let na=a.childNodes[i];const kb=mkey(nb);
    if(kb&&(!na||mkey(na)!==kb)){const m=[...a.childNodes].slice(i).find(x=>mkey(x)===kb);if(m){a.insertBefore(m,na||null);na=m}else{a.insertBefore(nb,na||null);continue}}
    if(!na){a.appendChild(nb);continue}
    morphNode(na,nb)}
  while(a.childNodes.length>bc.length)a.removeChild(a.lastChild)}
function morphInto(el,html){const t=document.createElement('div');t.innerHTML=html;morphKids(el,t)}

/* ---------- listas que se paginan solas: se mide cuántas entran en el lugar que queda ---------- */
const FITN={},FITP={};let FITPASS=0,FITT=null;
function fitList(key,arr,fn,cls='',empty=''){const n=arr.length;if(!n)return empty;const per=Math.max(1,Math.min(n,FITN[key]||4));const pages=Math.ceil(n/per);const p=Math.min(FITP[key]||0,pages-1);FITP[key]=p;
  const tg=/\b(flist|rvl)\b/.test(cls)?'ul':/\blb\b/.test(cls)?'ol':'div';
  return `<div class="fitw"><${tg} class="fit ${cls}" data-fit="${key}" data-n="${n}">${arr.slice(p*per,p*per+per).map(fn).join('')}</${tg}>${pages>1?`<div class="pager" role="group" aria-label="Páginas"><button type="button" class="pgb" data-a="pg" data-k="${key}" data-d="-1" ${p?'':'disabled'} aria-label="Página anterior">‹</button><span>${p+1} de ${pages}</span><button type="button" class="pgb" data-a="pg" data-k="${key}" data-d="1" ${p<pages-1?'':'disabled'} aria-label="Página siguiente">›</button></div>`:''}</div>`}
/* el mapa de La Huella se dimensiona en píxeles con el lugar que queda (en Safari los altos en % dentro de flex no siempre funcionan) */
function sizeMap(){const w=document.querySelector('.glay .mapwrap'),m=w&&w.querySelector('.armap');if(!m)return;const cs=getComputedStyle(w);
  const W=w.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),H=w.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);if(W<20||H<20)return;
  const r=236/440,h=Math.min(H,W/r);m.style.height=Math.floor(h)+'px';m.style.width=Math.floor(h*r)+'px'}
function fitPass(){sizeMap();let ch=false;const nw={};document.querySelectorAll('[data-fit]').forEach(box=>{const k=box.dataset.fit,n=+box.dataset.n,kids=[...box.children];if(!kids.length)return;
    const H=box.clientHeight;if(H<8)return;const cs=getComputedStyle(box),rg=parseFloat(cs.rowGap)||0;
    let cols=1;if(cs.display.includes('grid'))cols=Math.max(1,cs.gridTemplateColumns.split(' ').filter(Boolean).length);
    /* filas que ya se ven enteras */
    const rows=[];kids.forEach(x=>{const t=x.offsetTop,b=t+x.offsetHeight;const r=rows.find(r=>Math.abs(r.t-t)<2);if(r)r.b=Math.max(r.b,b);else rows.push({t,b})});
    const fitRows=rows.filter(r=>r.b<=H+1).length,cur=kids.length;let per;
    if(fitRows<rows.length)per=Math.max(1,fitRows*cols);
    else{const last=rows[rows.length-1].b,maxH=Math.max(...rows.map(r=>r.b-r.t));let more=Math.max(0,Math.floor((H-last)/(maxH+rg)));
      const pg=box.parentElement.querySelector('.pager');if(pg&&cur+more*cols<n){/* sin el paginador, ¿entran todos? */const extra=pg.offsetHeight+(parseFloat(getComputedStyle(box.parentElement).rowGap)||0);if(cur+Math.floor((H+extra-last)/(maxH+rg))*cols>=n)more=Math.ceil((n-cur)/cols)}
      per=cur<(FITN[k]||4)&&cur<n?(FITN[k]||4):cur+more*cols}
    per=Math.max(1,Math.min(n,per));if((FITN[k]||Math.min(n,4))!==per){nw[k]=per;ch=true}});
  if(ch&&FITPASS++<6){Object.assign(FITN,nw);render()}else if(!ch)FITPASS=0}
try{document.fonts&&document.fonts.ready.then(()=>{FITPASS=0;if(view!=='game')fitPass()})}catch(e){}
let RSZ=null;window.addEventListener('resize',()=>{clearTimeout(RSZ);RSZ=setTimeout(()=>{if(view!=='game'){FITPASS=0;render()}},150)});

/* pestañas dentro de una hoja */
const PT={};
function ptabs(k,opts,def){const cur=opts.some(o=>o[0]===PT[k])?PT[k]:def;PT[k]=cur;
  return [cur,`<div class="subtabs ptabs" role="tablist">${opts.map(([v,l])=>`<button type="button" role="tab" data-a="ptab" data-k="${k}" data-v="${v}" aria-selected="${cur===v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`]}
/* encabezado de hoja: volver, título y lo que va a la derecha */
const BACKL={menu:'Jugar',extra:'Extra',torneos:'Torneos',profile:'Perfil'};
function phd(title,right='',back=null){return `<header class="phd">${back?`<button type="button" class="pback" data-a="nav" data-v="${back}" aria-label="Volver a ${BACKL[back]||back}">‹</button>`:''}<h2>${title}</h2>${right?`<div class="phr">${right}</div>`:''}</header>`}

/* ---------- direcciones propias para cada hoja en la web: /Reviro/torneos, /Reviro/online… ---------- */
const ROUTES={menu:'',online:'online',torneos:'torneos',tour:'torneo',tournew:'nuevo-torneo',gira:'huella',extra:'extra',profile:'perfil',settings:'ajustes',shop:'tienda',missions:'misiones',ranking:'ranking',rules:'reglamento',tutorial:'tutorial',anotador:'anotador'};
const ROUTEV=Object.fromEntries(Object.entries(ROUTES).map(([v,r])=>[r,v]));
const ROUTING=!!window.REVIRO_WEB&&/^https?:$/.test(location.protocol);
const BASEP=(()=>{try{const b=document.querySelector('base');return b?new URL(b.href).pathname:location.pathname.replace(/[^/]*$/,'')}catch(e){return '/'}})();
let PENDROUTE=null,PENDTOUR=null,ROUTED=null,FROMPOP=false;
if(ROUTING){const rest=location.pathname.slice(BASEP.length).replace(/\/+$/,'').split('/').pop()||'';const v=ROUTEV[rest];
  if(v&&v!=='menu')PENDROUTE=v;if(v==='tour'){const id=new URLSearchParams(location.search).get('id');if(id&&/^[A-Z0-9]{8}$/i.test(id))PENDTOUR=id.toUpperCase();PENDROUTE=PENDTOUR?null:'torneos'}}
function routeSync(){if(view==='menu'&&PENDROUTE&&!GATES.includes(view)){const r=PENDROUTE;PENDROUTE=null;if(!['tour','tournew'].includes(r)||FB)view=r}
  if(!ROUTING||!(view in ROUTES))return;const r=ROUTES[view];const url=BASEP+r+(view==='tour'&&TV?'?id='+TV.tid:'');if(ROUTED===url)return;
  try{if(FROMPOP||ROUTED===null)history.replaceState({v:view},'',url+location.hash);else history.pushState({v:view},'',url)}catch(e){}ROUTED=url;FROMPOP=false}
window.addEventListener('popstate',e=>{if(!ROUTING)return;const v=(e.state&&e.state.v)||ROUTEV[location.pathname.slice(BASEP.length).replace(/\/+$/,'')]||'menu';
  if(view==='game'||view==='room'||GATES.includes(view))return;FROMPOP=true;ROUTED=null;if(v==='tour'){const id=new URLSearchParams(location.search).get('id');if(id&&FB){openTour(id);return}}view=ROUTES[v]!==undefined?v:'menu';render()});
const TABICO={"menu": "<path d=\"M5 6.5l6.5-2.2 3.2 12.4-6.5 2.2z\"/><path d=\"M12.6 4.6l6.6 1.6-2.9 12.6\"/>", "torneos": "<path d=\"M7 4h10v4a5 5 0 0 1-10 0z\"/><path d=\"M7 6H4.5a2.5 2.5 0 0 0 2.6 3.4M17 6h2.5a2.5 2.5 0 0 1-2.6 3.4\"/><path d=\"M12 13v4M8.5 20h7M10 17h4\"/>", "gira": "<path d=\"M9 4.5 4 6.5v13l5-2 6 2 5-2v-13l-5 2z\"/><path d=\"M9 4.5v13M15 6.5v13\"/>", "extra": "<path d=\"M7.5 10.5h9c0 5-1.8 9-4.5 9s-4.5-4-4.5-9z\"/><path d=\"M9 10.5c.4-2 1.5-3 3-3s2.6 1 3 3\"/><path d=\"M13.5 7.6 16.8 2.8\"/>", "profile": "<circle cx=\"12\" cy=\"8.5\" r=\"3.6\"/><path d=\"M5 20c.8-3.8 3.6-5.6 7-5.6s6.2 1.8 7 5.6\"/>"};
function tabsHTML(){const t=[['menu','Jugar'],['gira','La Huella'],['extra','Extra'],['profile','Perfil']];const cur=EXTRA_SUB.includes(view)?'extra':['tour','tournew','torneos','online'].includes(view)?'menu':view;
  return `<nav class="tabs" aria-label="Secciones">${t.map(([v,l])=>`<button type="button" data-a="nav" data-v="${v}" ${(cur===v||(v==='profile'&&cur==='settings'))?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${TABICO[v]}</svg><span>${l}</span></button>`).join('')}</nav>`}
function seg(key,opts,cur,dis){return `<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" data-set="${key}" data-v="${v}" aria-pressed="${String(cur)===String(v)}" ${dis&&dis(v)?'disabled':''}>${l}</button>`).join('')}</div>`}
const STAKES=[0,50,100,250,500,1000];
/* mesas entre personas: amistosa o con entrada desde 1.000 fichas; el premio es lo que se ve (el 90% del pozo) */
const ONSTAKES=[0,1000,2500,5000,10000];
const tablePrize=(stake,n)=>Math.floor(stake*n*0.9/(n/2));
const stakeTable=g=>!!(g&&mode==='online'&&g.stake>0&&humansIn(g)>=2&&!(T&&T.tour));
/* título en filete porteño: letras blancas con sombra celeste y volutas a los lados */
const VOLUTA=`<svg class="vol" viewBox="0 0 64 40" aria-hidden="true"><path d="M62 31C46 31 33 26 30 16C28 9 33 4 39 5.6C44 7 44.6 13.6 40 15C37 15.8 35 13.4 36.4 11.4" fill="none" stroke="#74acdf" stroke-width="2.6" stroke-linecap="round"/><path d="M62 31C46 31 33 26 30 16" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/><path d="M33 23Q20 31 4 27Q15 19 33 23Z" fill="#74acdf"/><path d="M31 23.6Q19 27.4 8 26.4" fill="none" stroke="#fff" stroke-width=".8" opacity=".75"/><path d="M41 28Q34 38 22 38.4Q28 30 41 28Z" fill="#3d7fc4"/><circle cx="48" cy="24" r="1.9" fill="#e9b830"/><circle cx="53.4" cy="26.6" r="1.3" fill="#e9b830"/><circle cx="26" cy="12" r="1.5" fill="#c8361f"/></svg>`;
const fileteHTML=(cls='')=>`<h1 class="filete ${cls}">${VOLUTA}<span>Reviro</span>${VOLUTA.replace('class="vol"','class="vol r"')}</h1>`;
let SOLOOPTS=false,ONOPTS=false;
function playHTML(){const remembered=(()=>{try{return localStorage.getItem('reviro.table')}catch(e){return null}})();
  const onlineOk=!!(db&&uid);const dz={facil:'fácil',medio:'medio',dificil:'difícil'}[SET.diff];
  const sum=`${SET.n==4?'2 contra 2':'Mano a mano'} · ${dz} · a ${SET.target} · ${SET.flor===false||SET.flor==='false'?'sin flor':'con flor'}${+SET.stake?` · ${fmt(SET.stake)} fichas`:''}`;
  const openT=(TOURS||[]).filter(t=>t.status==='open'&&!tClosed(t)).length,nOpen=lobby.filter(t=>!t.tour&&Date.now()-(t.created||0)<3*3600e3).length;
  const st=(FB&&MYUSER&&MYUSER.stats)||null,cz=[...ZONES].reverse().find(zoneOpen)||ZONES[0];
  return `<section class="phead"><button type="button" class="pav" data-a="nav" data-v="shop" aria-label="Cambiar personaje">${avatarSVG(myAv(),54)}</button><div><b>${esc(myDisp())}</b><small>${esc(titleOf(WAL.copas||0))}${st&&st.played?` · ${st.played} partidas online · ${Math.round(st.winRate*100)}% ganadas`:''}</small></div><button type="button" class="btn sm ghost" data-a="nav" data-v="profile">Perfil</button></section>
  ${remembered&&onlineOk?`<button type="button" class="rowb hot slim" data-a="rejoin" data-code="${esc(remembered)}"><b>Volver a la mesa ${esc(remembered)}</b><small>Tu partida sigue ahí</small></button>`:''}
  <section class="deal">${fileteHTML()}
    <p class="lema">Truco de campo, como en la pulpería.</p>
    <div class="fan" aria-hidden="true">${['7O','1E','1B'].map(c=>cardHTML(c)).join('')}</div>
    <button class="btn prim xl" data-a="solo" ${SET.stake>WAL.chips?'disabled':''}>Repartir</button>
    <button type="button" class="optline" data-a="soloopts">${esc(sum)} · <u>Cambiar</u></button>
  </section>
  <div class="modes">
    ${modeTile('data-a="nav" data-v="torneos"','12O','Torneos',FB?(openT?(openT===1?'Hay uno abierto':`Hay ${openT} abiertos`):'Mirá los que vienen'):'Con tu cuenta en la web')}
    ${modeTile('data-a="nav" data-v="gira"','11E','La Huella',`${esc(cz.short||cz.name)} · ${fmt(WAL.copas||0)} porotos`)}
    ${modeTile('data-a="nav" data-v="online"','10C','Jugar online',onlineOk?(nOpen?`${nOpen} mesa${nOpen>1?'s':''} esperando gente`:'Rápido, con código o armá tu mesa'):'Con tu cuenta en la web')}
    ${modeTile('data-a="nav" data-v="anotador"','12B','Anotador','Para jugar en persona, con fósforos')}
  </div>
  <a class="waline" href="${waHref(waInviteText())}" target="_blank" rel="noopener">${WAICO} Invitar amigos por WhatsApp</a>`}
const modeTile=(attrs,art,t,d)=>`<button type="button" class="mode" ${attrs}><img src="${CARDART[art].src}" alt="" aria-hidden="true"><span><b>${t}</b><small>${d}</small></span></button>`;
function soloOptsHTML(){return `<div class="over" data-a="close"><div class="panel opanel" data-stop><h2>Contra la máquina</h2>
    <div class="field"><span>Dificultad</span>${seg('diff',[['facil','Fácil'],['medio','Medio'],['dificil','Difícil']],SET.diff)}</div>
    <div class="field"><span>Jugadores</span>${seg('n',[[2,'1 contra 1'],[4,'2 contra 2']],SET.n)}</div>
    <div class="field"><span>Partida a</span>${seg('target',[[15,'15 puntos'],[30,'30 puntos']],SET.target)}</div>
    <div class="field"><span>Flor</span>${seg('flor',[['true','Con flor'],['false','Sin flor']],SET.flor)}</div>
    <div class="field"><span>Apuesta en fichas</span>${seg('stake',STAKES.map(v=>[v,v?fmt(v):'Sin apuesta']),SET.stake,v=>+v>WAL.chips)}</div>
    <p class="note">Ganando sumás ${({facil:20,medio:40,dificil:80})[SET.diff]} monedas. Contra la máquina es práctica: no cuenta en tu historial.</p>
    <div class="btns"><button class="btn prim" data-a="solo" ${SET.stake>WAL.chips?'disabled':''}>Repartir</button><button class="btn ghost" data-a="close">Listo</button></div></div></div>`}
/* jugar online: su propia hoja (/online) */
function onlinePageHTML(){const on=SET.on;if(!ONSTAKES.includes(+on.stake))on.stake=0;const remembered=(()=>{try{return localStorage.getItem('reviro.table')}catch(e){return null}})();
  const onlineOk=!!(db&&uid);const open=lobby.filter(t=>!t.tour&&Date.now()-(t.created||0)<3*3600e3);const wa=`<a class="rowb wa" href="${waHref(waInviteText())}" target="_blank" rel="noopener"><b>${WAICO} Invitar por WhatsApp</b><small>Mandales el link para jugar juntos</small></a>`;
  if(!onlineOk)return phd('Jugar online','','menu')+`<div class="ocol">${wa}<section class="box"><p class="note" style="margin:0">${LOCAL?'Las mesas online, los amigos y el ranking funcionan con tu cuenta en la web.':'El juego online necesita que abras Reviro con tu cuenta de claude.ai. Mientras tanto podés jugar contra la máquina.'}</p></section></div>`;
  return phd('Jugar online','','menu')+`<div class="olay"><div class="ocol">
    ${remembered?`<button type="button" class="rowb hot" data-a="rejoin" data-code="${esc(remembered)}"><b>Volver a la mesa ${esc(remembered)}</b><small>Tu partida sigue ahí</small></button>`:''}
    <button type="button" class="rowb prim" data-a="quick"><b>Jugar rápido</b><small>Te sienta en una mesa abierta o te arma una nueva</small></button>
    <button type="button" class="rowb" data-a="onopts"><b>Armar una mesa</b><small>${on.n==4?'Cuatro jugadores':'Dos jugadores'}, a ${on.target}${+on.stake?', entrada '+fmt(on.stake)+' fichas':', amistosa'}. Pasale el código a tus amigos</small></button>
    <form class="rowb rowf" data-form="join"><label for="joincode"><b>Entrar con código</b><small>Las cuatro letras que te pasaron</small></label><input type="text" id="joincode" maxlength="4" placeholder="ABCD" autocomplete="off"><button class="btn" type="submit">Entrar</button></form>
    ${wa}${FB?'':'<p class="note">Para que tus amigos puedan sentarse, compartí esta página con ellos desde el botón Compartir, con permiso para editar.</p>'}</div>
    <section class="box grow"><h3>Mesas esperando gente</h3>${fitList('lobby',open,t=>{const f=t.seats.filter(s=>s.id||s.bot).length;return `<div class="trow"><div><b>${esc(t.code)}</b> <span>${t.n} jugadores, a ${t.target}${t.flor===false?' sin flor':''}, ${t.stake?`entrada ${fmt(t.stake)}, premio ${fmt(tablePrize(t.stake,t.n))}`:'amistosa'}. Hay ${f} de ${t.n}</span></div><button class="btn" data-a="join" data-code="${esc(t.code)}" ${t.stake>WAL.chips?'disabled':''}>Sentarme</button></div>`},'tables','<p class="note" style="margin:0">Ahora no hay mesas esperando. Armá una o entrá con Jugar rápido.</p>')}</section></div>`}
function onOptsHTML(){const on=SET.on;return `<div class="over" data-a="close"><div class="panel opanel" data-stop><h2>Armar una mesa</h2>
    <div class="field"><span>Jugadores</span>${seg('on.n',[[2,'2 jugadores'],[4,'4 jugadores']],on.n)}</div>
    <div class="field"><span>Partida a</span>${seg('on.target',[[15,'15'],[30,'30']],on.target)}</div>
    <div class="field"><span>Flor</span>${seg('on.flor',[['true','Con flor'],['false','Sin flor']],on.flor)}</div>
    <div class="field"><span>Entrada por jugador</span>${seg('on.stake',ONSTAKES.map(v=>[v,v?fmt(v):'Amistosa']),on.stake,v=>+v>WAL.chips)}</div>${+on.stake?`<p class="note" style="margin:0">Premio: <b>${fmt(tablePrize(+on.stake,+on.n))}</b> fichas ${+on.n===4?'para cada ganador':'para el ganador'}.</p>`:''}
    <div class="btns"><button class="btn prim" data-a="create" ${on.stake>WAL.chips?'disabled':''}>Crear la mesa</button><button class="btn ghost" data-a="close">Cancelar</button></div></div></div>`}
const RULES_ORDER=['1E','1B','7E','7O','3E','2E','1C','12E','11E','10E','7C','6E','5E','4E'];
const RULES={cartas:()=>`<p>Mazo de 40 cartas españolas, sin ochos ni nueves. Tres cartas por jugador: gana la mano quien gana dos bazas.</p><p><b>Orden de las cartas</b>, de mayor a menor:</p><div class="rank">${RULES_ORDER.map(c=>cardHTML(c)).join('')}</div><p><b>Pardas:</b> si se empata la primera, define la segunda; si se empata la segunda o la tercera, gana quien ganó la primera; si se empatan todas, gana el mano.</p>`,
  envido:()=>`<p><b>Envido</b> (2), <b>real envido</b> (3) y <b>falta envido</b>. Se canta solo en la primera baza, antes de tirar tu primera carta. El envido va primero: se puede cantar como respuesta a un truco todavía no querido.</p><p>No querido vale 1, o lo acumulado hasta el canto anterior.</p><p><b>El tanto</b> suma 20 más las dos cartas del mismo palo; las figuras valen 0. Si empatan, gana el mano.</p><p><b>Falta envido:</b> en las malas (a 30, cuando nadie llegó a 15) gana el partido; en las buenas da lo que le falta al que va ganando.</p>`,
  flor:()=>`<p><b>Flor</b> (tres cartas del mismo palo) vale 3 y anula el envido.</p><p>Si el otro equipo también tiene: <b>con flor me achico</b> (4 para el primero), <b>contraflor</b> (6) o <b>contraflor al resto</b> (la falta).</p><p>Con flor activada, quien la tiene debe cantarla antes de tirar.</p>`,
  truco:()=>`<p><b>Truco</b> (2), <b>retruco</b> (3) y <b>vale cuatro</b> (4). Solo sube el equipo que tiene el quiero. No querido da lo que valía antes del canto.</p><p><b>Irse al mazo</b> regala la mano; en la primera baza, sin envido cantado, el rival suma un punto más.</p>`,
  mas:()=>`<p><b>Señas:</b> en 2 contra 2 tu compañero puede avisarte qué tiene con un gesto, y online vos también le podés hacer señas. Solo las ve tu equipo.</p><p><b>Fichas:</b> sirven para las mesas con entrada, los torneos y la tienda; las ganás con misiones y logros. Son de práctica y no tienen valor en dinero. Las <b>monedas</b> son otra forma de pagar en la tienda, y nunca se cambian por fichas.</p>`};
function rulesHTML(){return `<details class="rules"><summary>Reglamento</summary>${Object.values(RULES).map(f=>f()).join('')}</details>`}
function rulesPageHTML(){const [tab,tabs]=ptabs('rules',[['cartas','Cartas'],['envido','Envido'],['flor','Flor'],['truco','Truco'],['mas','Más']],'cartas');
  return phd('Reglamento','','extra')+tabs+`<section class="box rbody">${RULES[tab]()}</section>`}
function tutorialPageHTML(){return phd('Tutorial','','extra')+tutorialBoxHTML()}
/* ---------- tienda ---------- */
function buyBtn(type,id,price,name){const own=owns(type,id,price),on=WAL.eq[type]===id;const it=itemOf(type,id);
  if(it&&it.boss&&!own)return `<button class="btn" disabled>Ganale al jefe de ${esc(ZM[it.boss].name)}</button>`;
  if(on)return `<button class="btn" disabled>Usando</button>`;
  if(own)return `<button class="btn ink" data-a="equip" data-t="${type}" data-id="${id}">Usar</button>`;
  const fp=fPrice(price),k=type+':'+id,alt=WAL.coins>=price?`<button type="button" class="paycoins" data-a="prebuy" data-t="${type}" data-id="${id}" data-c="coins">o ${fmt(price)} monedas</button>`:'';
  if(pendingBuy===k)return `<button class="btn prim" data-a="buy" data-t="${type}" data-id="${id}">Confirmar · ${fmt(fp)} fichas</button>`;
  if(pendingBuy===k+':coins')return `<button class="btn prim" data-a="buy" data-t="${type}" data-id="${id}" data-c="coins">Confirmar · ${fmt(price)} monedas</button>`;
  if(WAL.chips<fp)return `<button class="btn" disabled>${chipI} Faltan ${fmt(fp-WAL.chips)}</button>${alt}`;
  return `<button class="btn brass" data-a="prebuy" data-t="${type}" data-id="${id}">${chipI} ${fmt(fp)}</button>${alt}`}
let HKIT=null;
/* La Hincha: las camisetas se eligen en su propia tarjeta */
function hinchaItemHTML(a){const hasH=owns('av','hincha',a.price);const sel=KITM[HKIT||WAL.eq.kit]?(HKIT||WAL.eq.kit):'arg',k=KITM[sel];
  const using=WAL.eq.av==='hincha'&&WAL.eq.kit===sel;
  return `<div class="item hincha ${WAL.eq.av==='hincha'?'on':''}"><div class="prev" style="height:150px">${avatarSVG(kitAv(sel),146,true)}</div>
    <b>${esc(a.name)}</b><p>${esc(a.bio)}</p>
    <div class="kits" role="group" aria-label="Camiseta">${KITS.map(x=>{const own=owns('kit',x.id,x.price);return `<button type="button" class="kitb ${sel===x.id?'sel':''}" data-a="hkit" data-id="${x.id}" aria-pressed="${sel===x.id}" title="${esc(x.name)}${own?'':' · '+fmt(x.price)+' monedas'}"><span style="${kitSwatch(x)}"></span>${own?'':'<i aria-hidden="true"></i>'}</button>`}).join('')}</div>
    <p class="kitname"><b>${esc(k.name)}</b>. ${esc(k.bio)}</p>
    ${!hasH?buyBtn('av','hincha',a.price,a.name):using?'<button class="btn" disabled>Usando</button>':owns('kit',sel,k.price)?`<button class="btn ink" data-a="equip" data-t="kit" data-id="${sel}">Usar esta camiseta</button>`:buyBtn('kit',sel,k.price,k.name)}</div>`}
const kitSwatch=k=>({v:`background:repeating-linear-gradient(90deg,${k.c1} 0 25%,${k.c2} 25% 50%)`,h:`background:linear-gradient(${k.c1} 0 38%,${k.c2} 38% 62%,${k.c1} 62%)`,d:`background:linear-gradient(135deg,${k.c1} 0 38%,${k.c2} 38% 62%,${k.c1} 62%)`,s:`background:${k.c1};box-shadow:inset 0 3px 0 ${k.c2}`,p:`background:linear-gradient(90deg,${k.c1} 50%,${k.c2} 50%)`,w:`background:linear-gradient(135deg,${k.c1} 40%,transparent 40%),linear-gradient(225deg,${k.c1} 40%,${k.c2} 40%)`,r:`background:repeating-linear-gradient(0deg,${k.c1} 0 20%,${k.c2} 20% 40%)`})[k.pat]||`background:${k.c1}`;
function shopItem(type,x,prev){return `<div class="item ${WAL.eq[type]===x.id?'on':''}"><div class="prev">${prev}</div><b>${esc(x.name)}</b><p>${esc(x.bio)}</p>${buyBtn(type,x.id,x.price,x.name)}</div>`}
function shopHTML(){const sub=[['av','Personajes'],['dorso','Dorsos'],['pano','Paños'],['coins','Monedas']];if(shopTab==='kit')shopTab='av';
  let body='';
  if(shopTab==='av')body=fitList('shop-av',AVS,a=>{if(a.id!=='hincha')return shopItem('av',a,avatarSVG(a.id,96,true));const has=owns('av','hincha',a.price);
      return `<div class="item ${WAL.eq.av==='hincha'?'on':''}"><div class="prev">${avatarSVG(kitAv(KITM[WAL.eq.kit]?WAL.eq.kit:'arg'),96,true)}</div><b>${esc(a.name)}</b><p>${KITS.length} camisetas para elegir.</p>${has?`<button class="btn ink" data-a="ov" data-v="kits">Camisetas</button>`:buyBtn('av','hincha',a.price,a.name)}</div>`},'items');
  if(shopTab==='dorso')body=fitList('shop-dorso',DORSOS,d=>shopItem('dorso',d,`<div class="bigback" style="background:${backBg(d.id)}"></div>`),'items');
  if(shopTab==='pano')body=fitList('shop-pano',PANOS,p=>shopItem('pano',p,`<div class="swatch pano-${p.id}" style="background:${panoBg(p.id)};border-color:${p.edge}">${cardHTML('1E')}${cardHTML('7O')}</div>`),'items');
  const earn='Las monedas sirven también para pagar en la tienda. Se ganan jugando: 20, 40 u 80 por partida ganada según la dificultad, 60 por partida online, 5 por jugar aunque pierdas y 30 cada día.';
  if(shopTab==='coins'&&FB)body=mpShopHTML();
  else if(shopTab==='coins'&&!PREMIUM)body=premLock()+`<p class="note">${earn}</p>`;
  else if(shopTab==='coins')body=`<div class="demo"><b>Modo prueba.</b> Acá no se cobra nada: los paquetes se acreditan gratis para que veas cómo funciona la tienda.</div>
    ${fitList('shop-pk',PACKS.map((p,i)=>Object.assign({i},p)),p=>`<div class="item pack"><div class="prev">${coinI.replace('class="coin"','class="coin" style="width:26px;height:26px"')}${fmt(p.coins)}</div><b>${fmt(p.coins)} monedas</b><p>${p.tag?`<span class="tag">${p.tag}</span> `:''}<span class="ars">$ ${fmt(p.ars)}</span></p>
      ${pendingBuy==='pack:'+p.i?`<button class="btn prim" data-a="pack" data-i="${p.i}">Confirmar prueba</button>`:`<button class="btn brass" data-a="prepack" data-i="${p.i}">Simular compra</button>`}</div>`,'items')}<p class="note">${earn}</p>`;
  return phd('Tienda',`<span class="pill">${chipI}${fmt(WAL.chips)}</span>`,'extra')+`<div class="subtabs" role="group">${sub.map(([k,l])=>`<button type="button" data-a="shoptab" data-v="${k}" aria-pressed="${shopTab===k}">${l}</button>`).join('')}</div><div class="pbody">${body}</div>`}
function kitsHTML(){const a=AVM.hincha;return `<div class="over" data-a="close"><div class="panel kpanel" data-stop>${hinchaItemHTML(a)}<button class="btn ghost" data-a="close">Cerrar</button></div></div>`}
/* ---------- perfil ---------- */
function profileHTML(){const a=AVM[WAL.eq.av]||AVM.gaucho,st=WAL.stats,pct=st.played?Math.round(st.won*100/st.played):0;
  const sb=(l,v,c='')=>`<div class="stat-b"><small>${l}</small><b class="${c}">${v}</b></div>`;
  let stats;if(FB){const s=(MYUSER&&MYUSER.stats)||NET.EMPTY_STATS,cs=s.currentStreak||0;stats=sb('Jugadas',fmt(s.played))+sb('Ganadas',fmt(s.wins))+sb('Ganás',(s.played?Math.round(s.winRate*100):0)+'%')+sb('Racha',cs>0?'+'+cs:cs,cs>0?'pos':cs<0?'neg':'')+sb('Récord',fmt(s.bestStreak))}
  else stats=sb('Jugadas',fmt(st.played))+sb('Ganadas',fmt(st.won))+sb('Ganás',pct+'%')+sb('Racha',st.streak)+sb('Récord',st.best)+sb('Monedas',fmt(st.earned));
  const opts=[['mesa','Tu mesa'],['amigos','Amigos']];if(FB)opts.push(['invitar','Invitá y ganá']);const [tab,tabs]=ptabs('prof',opts,'mesa');
  const D=DM[WAL.eq.dorso]||DM.pampa,Pn=PM[WAL.eq.pano]||PM.quincho;
  const mesa=`<section class="box grow mesa"><div class="mesa3">
      <button type="button" class="mz" data-a="shopgo" data-v="av">${avatarSVG(myAv(),84,true)}<b>${esc(a.name)}</b><small>Personaje</small></button>
      <button type="button" class="mz" data-a="shopgo" data-v="dorso"><span class="bigback" style="background:${backBg(D.id)}"></span><b>${esc(D.name)}</b><small>Dorso</small></button>
      <button type="button" class="mz" data-a="shopgo" data-v="pano"><span class="swatch pano-${Pn.id}" style="background:${panoBg(Pn.id)};border-color:${Pn.edge}">${cardHTML('3O')}</span><b>${esc(Pn.name)}</b><small>Paño</small></button></div>
    <button class="btn" data-a="nav" data-v="shop">Ir a la tienda</button></section>`;
  return phd('Perfil','<button type="button" class="btn sm ghost" data-a="nav" data-v="settings">Ajustes</button>')+`
  <section class="prof">${avatarSVG(myAv(),84,true)}<div><h2>${esc(myDisp())}${PREMIUM?' <span class="prem">Premium</span>':''}</h2><p>${esc(a.name)}${myEmail?' · '+esc(myEmail):''}</p>
    <form class="row" data-form="nick"><input type="text" id="nickin" class="plain" maxlength="20" placeholder="Tu apodo" value="${esc(WAL.nick||'')}" aria-label="Apodo" autocomplete="off"><button class="btn sm" type="submit">Guardar</button></form></div></section>
  <div class="stats">${stats}</div><p class="note snote">Cuentan solo las partidas online contra otras personas. Contra la máquina es práctica.</p>
  ${tabs}<div class="pbody">${tab==='mesa'?mesa:tab==='amigos'?friendsBoxHTML():refBoxHTML()}</div>`}
/* ---------- sala online ---------- */
function roomHTML(){if(!T)return `<div class="room"><p class="note">Cargando mesa…</p></div>`;if(T.tour)return tourRoomHTML();
  const mine=T.seats.findIndex(s=>s.id===uid);const full=T.seats.every(s=>s.id||s.bot);
  return `<div class="room"><div class="row" style="justify-content:space-between"><div><h3 style="margin:0;color:var(--muted);font-size:.78rem;letter-spacing:.14em;text-transform:uppercase">Mesa</h3><div class="code">${esc(T.code)}</div></div>
    <div class="row" style="flex-wrap:nowrap"><button class="btn" data-a="copy">Copiar código</button><a class="btn wa" href="${waHref(`Sumate a mi mesa de truco en Reviro. Código ${T.code}: ${siteURL()}#m-${T.code}`)}" target="_blank" rel="noopener">${WAICO} WhatsApp</a></div></div>
    <p class="note">${T.n} jugadores · a ${T.target} puntos · ${T.flor===false?'sin flor':'con flor'} · ${T.stake?`entrada de ${fmt(T.stake)} fichas por jugador · premio de ${fmt(tablePrize(T.stake,T.n))} fichas ${T.n===4?'para cada ganador':'para el ganador'}`:'amistosa'}${T.n===4?' · los asientos 1 y 3 juegan juntos contra 2 y 4':''}</p>
    <div class="seats">${T.seats.map((s,i)=>{const who=s.bot?'Bot':s.id?(s.id===uid?'Vos':(dispName(s.id)||'Jugador')):'Libre';
      const av=s.bot?'veterano':s.id?(s.id===uid?myAv():((LOOKS[s.id]&&LOOKS[s.id].av)||'gaucho')):null;
      let b='';if(!s.id&&!s.bot){b=`<button class="btn sm" data-a="sit" data-i="${i}" ${T.stake>WAL.chips?'disabled':''}>Sentarme</button>`;if(isHost)b+=`<button class="btn sm ghost" data-a="addbot" data-i="${i}">+ Bot</button>`}
      else if(isHost&&(s.bot||(s.id&&s.id!==uid)))b=`<button class="btn sm ghost" data-a="kick" data-i="${i}">Quitar</button>`;
      return `<div class="seatc ${s.id===uid?'mine':''}"><div class="who">${av?avatarSVG(av,36):'<span style="width:36px;height:36px;border-radius:50%;border:1px dashed var(--line);display:block"></span>'}<div><small>Asiento ${i+1}${T.n===4?' · equipo '+(i%2?'B':'A'):''}${s.id&&s.id===T.host?' · anfitrión':''}</small><b>${esc(who)}</b></div></div><div class="row">${b}</div></div>`}).join('')}</div>
    <div class="row">${isHost?`<button class="btn prim" data-a="start" ${full?'':'disabled'}>Empezar partida</button>`:`<p class="note">${mine<0?'Elegí un asiento libre.':'Esperando que el anfitrión empiece.'}</p>`}
    <button class="btn ghost" data-a="leave">Salir de la mesa</button></div>
    ${isHost&&!full?`<div class="row"><button class="btn brass" data-a="fillstart">Completar con bots y empezar</button></div><p class="note">O esperá a que se sumen tus amigos.</p>`:''}
    ${roomInviteHTML(full)}</div>`}

/* ---------- mesa de juego ---------- */
function posOf(s){const me=mySeat<0?0:mySeat;const r=(s-me+G.n)%G.n;if(G.n===2)return r===0?'bottom':'top';return['bottom','right','top','left'][r]}
function statusLine(){const h=G.hand;const t=h.truco;let parts=[];
  if(t.level>1)parts.push(`<b>${TNAME[t.level]}</b> querido · vale ${t.level}`);else parts.push('La mano vale 1');
  if(h.flor.pending)parts.push('Flor en juego');else if(h.env.pending)parts.push(h.env.pending.chain.map(k=>ENAME[k]).join(' + ')+' en juego');
  else if(t.pending)parts.push(TNAME[t.pending.level]+' cantado');
  return parts.join('<br>')}
function lastPlayKey(h){for(let i=h.bazas.length-1;i>=0;i--){const p=h.bazas[i].plays;if(p.length)return p[p.length-1].seat+'-'+p[p.length-1].card}return''}
function gameHTML(){if(!G)return'';const h=G.hand,me=mySeat,mt=myTeam(),a=actor(G),pano=PM[WAL.eq.pano]||PM.bordo;
  const sc=G.scores,lk=FX.land?lastPlayKey(h):'',now=Date.now();const seatsHTML=[];
  for(let s=0;s<G.n;s++){const pos=posOf(s),look=seatLook(s);
    const cards=h.bazas.map(b=>{const p=b.plays.find(p=>p.seat===s);if(!p)return'';const done=b.res!==undefined;const cls=[done&&b.win!==s?'lost':'',done&&b.win===s?'win':'',lk===s+'-'+p.card?'land':''].join(' ');return cardHTML(p.card,cls)}).join('');
    let bub='';const tr=transient[s];
    if(tr&&tr.until>now)bub=`<div class="bubble ${tr.cls} pop">${esc(tr.t)}</div>`;
    else if(h.said[s]&&(Date.now()-(SAIDAT[s]||0)<3600||[h.flor.pending,h.env.pending,h.truco.pending].some(x=>x&&x.caller===s))){const sy=SAYS[s];bub=`<div class="bubble ${FX.pop&&FX.pop[s]?'pop':''}">${esc(h.said[s])}${sy&&sy.canon===h.said[s]&&sy.line?`<span class="line">${esc(sy.line)}</span>`:''}</div>`}
    const us=team(s)===mt;
    let rest='';if(s!==me){rest=h.ended?`<div class="reveal">${h.cards[s].map(c=>cardHTML(c)).join('')}</div>`:`<div class="backs" aria-label="${h.cards[s].length} cartas">${h.cards[s].map(()=>`<i style="background:${backBg(look.dorso)}"></i>`).join('')}</div>`}
    const badge=`<div class="badge ${us?'us':''} ${a===s?'active':''}">${avatarSVG(look.av,32)}<span>${esc(nameOf(s))}${isAbsent(s)?' · bot':''}</span>${G.mano===s?'<span class="m" title="Es mano">mano</span>':''}</div>`;
    seatsHTML.push(`<div class="seat pos-${pos}">${pos==='bottom'?`<div class="played">${cards}</div>${badge}`:`<div class="seathead">${badge}${rest}</div><div class="played">${cards}</div>`}${bub}</div>`)}
  const baz=[0,1,2].map(i=>{const r=h.results[i];if(r===undefined)return'<i></i>';if(r==='P')return'<i class="p" title="parda"></i>';return r===mt?'<i class="w" title="ganada"></i>':'<i class="l" title="perdida"></i>'}).join('');
  const deck=`<div class="deck" aria-hidden="true">${'<i style="background:'+backBg(WAL.eq.dorso)+'"></i>'.repeat(3)}</div>`;
  let center=`<div class="crow">${deck}<div class="bazas" aria-label="Bazas">${baz}</div></div><div class="stat">${statusLine()}</div>@@INFO@@`;
  const co=coachNow();
  if(TUT&&h.ended){const nx=TUT.i+1<LESSONS.length;center=`<div class="result"><b>¡Lección cumplida!</b><span>${esc(co&&co.done||'')}</span><span>+20 monedas la primera vez</span><div class="btns">${nx?`<button class="btn prim" data-a="lesson" data-i="${TUT.i+1}">Siguiente lección</button>`:''}<button class="btn" data-a="tomenu">${nx?'Menú':'Volver al menú'}</button></div></div>`}
  else if(h.ended&&!G.matchOver){const gains=h.gains.map(x=>`${teamName(x.tm)} +${x.p} por ${x.why}`).join(' · ');
    center=`<div class="result"><b>${h.ended.winner===mt?'La mano es nuestra':'La mano es de ellos'}</b><span>${esc(gains)}</span>${mode==='offline'||(me>=0&&controllerSeat()===mySeat)?'<button class="btn prim" data-a="next">Repartir</button>':'<span>Reparte la próxima en un ratito…</span>'}</div>`}
  const myCards=me>=0?h.cards[me]:[];const L=me>=0?legal(G,me):{};
  if(SELCARD&&(!L.play||!myCards.includes(SELCARD)))SELCARD=null;
  const hand=`<div class="hand ${L.play?'':'wait'} ${SELCARD?'picking':''}">${myCards.map((c,i)=>`<button type="button" class="${FX.deal?'deal':''} ${SELCARD===c?'sel':''}" aria-pressed="${SELCARD===c}" style="animation-delay:${i*90}ms" data-card="${c}" ${L.play&&!busy&&tutAllowed({t:'play',card:c})?'':'disabled'} aria-label="${SELCARD===c?'Tocá de nuevo para tirar':'Elegir esta carta'}">${cardHTML(c)}</button>`).join('')}</div>`;
  let info='';if(SET.help&&me>=0&&!h.ended&&h.results.length===0){const o=h.orig[me];info=G.flor&&hasFlor(o)?`<span>Tenés flor: <b>${florVal(o)}</b></span>`:`<span>Tu envido: <b>${envidoOf(o)}</b></span>`}
  if(mode==='offline'&&partnerSena&&partnerSena.handNo===G.handNo&&h.results.length===0&&!h.ended)info+=`<span>Seña del compa: <b>${esc(partnerSena.t)}</b></span>`;
  const tk=G.log.slice(-2).map(e=>`<div>${esc(logText(e))}</div>`).join('');
  center=center.replace('@@INFO@@',`<div class="ticker" aria-live="polite">${tk}</div>${info&&G.n===2?`<div class="handinfo">${info}</div>`:''}`);
  const absentNote=mode==='online'&&G.seats.some((_,s)=>isAbsent(s))?(stakeTable(G)?G.seats.map((st,s)=>isAbsent(s)?`<p class="pausebar" data-pause="${(goneSince[st.id]||Date.now())+GRACE+60000}" data-who="${esc(nameOf(s))}">${pauseText(nameOf(s),(goneSince[st.id]||Date.now())+GRACE+60000)}</p>`:'').join(''):'<p class="note">Un bot difícil juega por quien se desconectó hasta que vuelva.</p>'):'';
  const coachBox=TUT&&co&&!h.ended?`<div class="coach"><small>Lección ${TUT.i+1} de ${LESSONS.length} · ${esc(LESSONS[TUT.i].title)}</small><p>${esc(co.t||'')}</p></div>`:'';
  const b0=FX.bump&&FX.bump[mt]?'bump':'',b1=FX.bump&&FX.bump[1-mt]?'bump':'';
  return `<section class="game">
    <div class="gtop"><button class="btn ${confirmExit?'warn':'ghost'}" data-a="exit">${confirmExit?(inProgress()&&countsOnline(G)?(G.stake?'Salir: derrota y perdés la apuesta':'Salir: cuenta como derrota'):inProgress()&&CAMP?'Salir: perdés los porotos':inProgress()&&G.stake?'Salir: perdés la apuesta':'Confirmar salida'):'Salir'}</button>${mode==='online'?`<span class="note">Mesa ${esc(T?T.code:'')}</span>`:`<span class="note">${({facil:'Fácil',medio:'Medio',dificil:'Difícil'})[G.diff]}</span>`}</div>
    <div class="score"><div class="sc us"><span class="lbl">Nosotros</span><b class="${b0}">${sc[mt]}</b>${fosforos(sc[mt],G.target)}</div>
      <div class="mid"><b>a ${G.target}</b>${G.flor?'con flor':'sin flor'}<br>${G.stake?fmt(G.stake)+' fichas':'amistosa'}</div>
      <div class="sc them"><span class="lbl">Ellos</span><b class="${b1}">${sc[1-mt]}</b>${fosforos(sc[1-mt],G.target)}</div></div>
    <div class="felt n${G.n} pano-${pano.id}" style="background:${panoBg(pano.id)};border-color:${pano.edge}">${seatsHTML.join('')}<div class="center">${center}</div></div>
    ${G.n!==2&&info?`<div class="handinfo">${info}</div>`:''}${turnBarHTML()}${coachBox}
    ${hand}
    <div class="actions">${actionsHTML(L)}${TUT?'':socialHTML()}${absentNote}</div></section>`}
function logText(e){if(e.k==='hand')return e.mano===mySeat?`Mano ${e.no}: sos mano vos`:`Mano ${e.no}: es mano ${nameOf(e.mano)}`;
  if(e.k==='baza')return e.r==='P'?`Baza ${e.i}: parda`:`Baza ${e.i} para ${teamName(e.r).toLowerCase()}`;
  if(e.k==='pts')return `${teamName(e.tm)} suma ${e.p} (${e.why})`;if(e.k==='txt')return e.t;
  return `${nameOf(e.s)}: ${e.t}`}
const B=(a,l,c='')=>{if(TUT){const co=coachNow();if(co&&co.x){const ok=co.x(actKey(a));return `<button class="btn ${ok?c+' glow':''}" data-a="${a}" ${ok?'':'disabled'}>${l}</button>`}}return `<button class="btn ${c}" data-a="${a}">${l}</button>`};
function actionsHTML(L){if(mySeat<0)return'<p class="hint">Estás mirando la partida.</p>';const h=G.hand;
  if(G.matchOver||h.ended)return'';const a=actor(G);
  if(a!==mySeat){let w='Turno de <b>'+esc(nameOf(a))+'</b>';if(h.flor.pending||h.env.pending||h.truco.pending)w='Esperando la respuesta de <b>'+esc(nameOf(a))+'</b>';return `<p class="hint">${w}</p>`}
  const b=[];
  if(L.respond){let q;
    if(L.respond==='flor'){const st=h.flor.pending.stage;q=st==='flor'?'Cantaron flor y vos también tenés':st==='contra'?'¿Querés la contraflor?':'¿Querés la contraflor al resto?';
      if(L.canQuiero)b.push(B('quiero','Quiero','prim'),B('noquiero','No quiero'));
      if(L.florOpts.includes('achico'))b.push(B('achico','Con flor me achico'));if(L.florOpts.includes('contra'))b.push(B('contra','Contraflor','brass'));if(L.florOpts.includes('resto'))b.push(B('resto','Contraflor al resto','brass'))}
    else if(L.respond==='env'){q='¿'+h.env.pending.chain.map(k=>ENAME[k]).join(' + ')+'?';
      if(L.flor)b.push(B('flor','¡Flor!','prim'));else{b.push(B('quiero','Quiero','prim'),B('noquiero','No quiero'));L.envido.forEach(k=>b.push(B('env:'+k,ENAME[k],'brass')))}}
    else{q='¿'+TNAME[h.truco.pending.level]+'?';b.push(B('quiero','Quiero','prim'),B('noquiero','No quiero'));if(L.truco)b.push(B('truco:'+L.truco,'Quiero '+TNAME[L.truco].toLowerCase(),'brass'));
      if(L.flor)b.push(B('flor','¡Flor!'));L.envido.forEach(k=>b.push(B('env:'+k,ENAME[k])))}
    return `<p class="ask">${q}</p><div class="btns">${b.join('')}</div>`}
  if(L.flor)b.push(B('flor','¡Flor!','prim'));
  L.envido.forEach(k=>b.push(B('env:'+k,ENAME[k])));
  if(L.truco)b.push(B('truco:'+L.truco,TNAME[L.truco],'brass'));
  b.push(B('mazo',confirmMazo?'¿Seguro? Me voy':'Me voy al mazo',confirmMazo?'warn':'ghost'));
  return `<p class="hint">${L.flor?'Tenés <b>flor</b>: cantala antes de tirar':(SELCARD?`Tocá de nuevo el ${cardName(SELCARD)} para tirarlo`:SET.tap2!==false?'Tu turno: tocá una carta y tocala otra vez para tirarla':'Tu turno: tocá una carta para tirarla')}</p><div class="btns">${b.join('')}</div>`}
function partnerHuman(){if(!G||G.n!==4||mySeat<0)return false;if(mode==='offline')return true;const p=(mySeat+2)%4;return !G.seats[p].bot}
function socialHTML(){if(!G||G.matchOver||mySeat<0)return'';const canReact=mode==='offline'||!!R;if(!canReact)return'';
  const sena=partnerHuman()&&!G.hand.ended;
  let o=`<div class="social"><button class="btn sm ${panel==='react'?'ink':'ghost'}" data-a="panel" data-v="react">Reaccionar</button>${sena?`<button class="btn sm ${panel==='sena'?'ink':'ghost'}" data-a="panel" data-v="sena">Hacer seña</button>`:''}</div>`;
  if(panel==='react')o+=`<div class="chips">${Object.entries(REACTS).map(([k,t])=>`<button type="button" data-a="react" data-k="${k}">${t}</button>`).join('')}</div>`;
  if(panel==='sena'&&sena){const btn=([k,t])=>`<button type="button" data-a="sena" data-k="${k}">${t}</button>`;const all=Object.entries(SENA_SHORT);
    o+=`<div class="chips"><span class="chiph">Cartas</span>${all.filter(([k])=>!SENA_ENV.includes(k)).map(btn).join('')}</div><div class="chips"><span class="chiph">Envido</span>${all.filter(([k])=>SENA_ENV.includes(k)).map(btn).join('')}</div>`;o+=`<p class="note">Solo la ve tu compañero. Podés hacer una de cartas y una de envido.</p>`}
  if(false)o+=`<p class="note">Solo la ve tu compañero.</p>`;
  return o}
function overlayHTML(){
  if(overlayView==='terms')return `<div class="over" data-a="close"><div class="panel tpanel" data-stop><h2>Términos y condiciones</h2>${termsHTML()}<button class="btn prim" data-a="close">Cerrar</button></div></div>`;
  if(overlayView==='termsAccept')return `<div class="over"><div class="panel tpanel"><h2>Términos y condiciones</h2><p>Para seguir jugando, leé y aceptá los términos.</p>${termsHTML()}<button class="btn prim" data-a="tosaccept">Acepto los términos</button><button class="btn ghost" data-a="logout">Salir de mi cuenta</button></div></div>`;
  if(overlayView==='admuser')return admUserHTML();
  {const OV={soloopts:soloOptsHTML,onopts:onOptsHTML,tourhow:tourHowHTML,tourfriend:tourFriendHTML,tabla:tablaHTML,rivales:rivalesHTML,kits:kitsHTML,compras:comprasHTML,
      tourrules:()=>`<div class="over" data-a="close"><div class="panel lpanel" data-stop><h2>Reglas del torneo</h2><p style="white-space:pre-wrap;text-align:left">${esc((TV&&TV.t&&TV.t.rules)||'')}</p><button class="btn ghost" data-a="close">Cerrar</button></div></div>`};
    if(OV[overlayView]&&view!=='game')return OV[overlayView]()}
  if(INV&&INV.kind==='tour'&&view!=='game'&&view!=='room'&&view!=='register'&&view!=='welcome'){const l=LOOKS[INV.from]||{};return `<div class="over"><div class="panel">${avatarSVG(AVM[l.av]?l.av:'gaucho',72,true)}<h2>¡Te invitan!</h2><p><b>${esc(dispName(INV.from)||'Un amigo')}</b> quiere jugar con vos en pareja el torneo <b>${esc(INV.name||'')}</b>.</p><div class="btns"><button class="btn prim" data-a="invgo">Ver el torneo</button><button class="btn ghost" data-a="invno">Ahora no</button></div></div></div>`}
  if(INV&&view!=='game'&&view!=='room'&&view!=='register'&&view!=='welcome'){const l=LOOKS[INV.from]||{};return `<div class="over"><div class="panel">${avatarSVG(AVM[l.av]?l.av:'gaucho',72,true)}<h2>¡Te invitan!</h2><p><b>${esc(dispName(INV.from)||'Un amigo')}</b> te invita a su mesa <b>${esc(INV.code)}</b>.</p><div class="btns"><button class="btn prim" data-a="invgo">Ir a la mesa</button><button class="btn ghost" data-a="invno">Ahora no</button></div></div></div>`}
  if(overlayView==='load'&&!PREMIUM)return `<div class="over" data-a="close"><div class="panel" data-stop><h2>Cargar fichas</h2><p>Tenés ${fmt(WAL.chips)} fichas.</p>${premLock()}<button class="btn ghost" data-a="close">Cerrar</button></div></div>`;
  if(overlayView==='load')return `<div class="over" data-a="close"><div class="panel" data-stop><h2>Cargar fichas</h2><p>Las fichas sirven para apostar en las partidas. Son de práctica: se cargan gratis, no se compran ni se cobran. Las monedas de la tienda son otra cosa.</p>
    <div class="btns">${[500,1000,5000].map(v=>`<button class="btn prim" data-a="add" data-v="${v}">+ ${fmt(v)}</button>`).join('')}</div><button class="btn ghost" data-a="close">Cerrar</button></div></div>`;
  if(overlayView==='compartir')return shareHTML();
  if(view==='game'&&G&&G.matchOver){const won=G.matchOver.winner===myTeam();const st=G.stake;const TT=mode==='online'&&T&&T.tour;const can=!TT&&(mode==='offline'||isHost);
    const rw=lastReward&&lastReward.matchId===G.matchId?lastReward.coins:null;
    let conf='';if(won&&FX.over){const suits=['O','C','E','B'];for(let i=0;i<26;i++){const s=suits[i%4];conf+=`<svg viewBox="0 0 24 24" style="left:${(Math.random()*100).toFixed(1)}%;animation-delay:${(Math.random()*.9).toFixed(2)}s;color:${SUITCOL[s]}"><use href="#s${s}"/></svg>`}}
    const canc=G.matchOver.cancelled,k=canc?'nada':won?'win':'lose',dos=G.n===4,a1=G.scores[myTeam()],a2=G.scores[1-myTeam()];
    const sub=canc?'Alguien se fue en los primeros 30 segundos: se devolvieron todas las entradas.':won?`${dos?'Ganaron':'Ganaste'} ${a1} a ${a2}${G.matchOver.forfeit?', el rival abandonó':''}`:`${dos?'Perdieron':'Perdiste'} ${a1} a ${a2}${G.matchOver.forfeit?', por abandono':''}`;
    return `<div class="over">${conf?`<div class="confetti" aria-hidden="true">${conf}</div>`:''}<div class="panel endp ${k} ${FX.over?'anim':''}">
      <div class="cartel ${k} ${FX.over?'anim':''}" role="status"><div class="c-rays" aria-hidden="true"></div><div class="c-av">${avatarSVG(myAv(),88,true)}</div>
        <div class="c-rib">${VOLUTA}<b>${canc?'Cancelada':won?'¡Victoria!':'Derrota'}</b>${VOLUTA.replace('class="vol"','class="vol r"')}</div></div>
      <p class="c-sub">${sub}</p>${TT?`<p class="note">${esc(T.tour.name)} · ${esc(T.tour.label||'')}: ${won?'pasás a la siguiente':'quedaste afuera de este cruce'}.</p>`:''}
      ${st&&mySeat>=0?`<p class="big"><i class="chip"></i>${won?'+ '+fmt(st*2):'− '+fmt(st)} fichas</p>`:''}
      ${rw?`<p class="big">${coinI}+ ${fmt(rw)} monedas</p>`:''}${CAMP?giraOverHTML():''}
      <div class="btns">${TT?`<button class="btn prim" data-a="tourback">Volver al torneo</button>`:can?`<button class="btn prim" data-a="rematch" ${st>WAL.chips?'disabled':''}>Revancha</button>`:'<p class="note">Esperando la revancha del anfitrión</p>'}<button class="btn" data-a="tomenu">${CAMP?'Volver al mapa':'Menú'}</button></div>${canc?'':`<button type="button" class="btn share" data-a="sharemk">${SHAREICO}Compartir el resultado</button>`}</div></div>`}
  return''}

/* ---------- control de partida ---------- */
function startSolo(){TUT=null;mySena=null;CAMP=null;if(FB){fbStartAI();return}const n=+SET.n,stake=+SET.stake;if(stake>WAL.chips){toast('No te alcanzan las fichas');return}
  const seats=Array.from({length:n},(_,i)=>i===0?{me:true}:{bot:true});
  cfg={n,target:+SET.target,stake,diff:SET.diff,flor:SET.flor===true||SET.flor==='true'};botLooks=pickBotLooks(n);
  mode='offline';mySeat=0;view='game';confirmExit=false;panel=null;
  setG(newMatch({...cfg,seats,matchId:'solo-'+Date.now().toString(36)}));
  if(stake)applyTx(G.matchId+':in',{chips:-stake});render();drive()}
function settle(g){if(!g||!g.matchOver||mySeat<0)return;const key=g.matchId+':done';if(WAL.applied.includes(key))return;
  const won=g.matchOver.winner===myTeam();const prize=mode==='online'?60:({facil:20,medio:40,dificil:80})[g.diff]||40;const coins=won?prize:5;
  const pts=won?(mode==='online'?30:({facil:3,medio:8,dificil:15})[g.diff]||8):0;
  const mo=g.matchOver;let chips=won&&g.stake?g.stake*2:0;
  if(mode==='online'&&g.stake&&humansIn(g)>=2&&!(T&&T.tour)){const mt=myTeam(),n=g.n;
    if(mo.cancelled)chips=g.stake;                                   // cancelada al arrancar: se devuelve la entrada
    else if(mo.forfeit){const fs=g.seats.findIndex(s=>s.id===mo.forfeit),ft=fs%2;
      chips=uid===mo.forfeit?0:mt===ft?g.stake:g.stake+Math.floor(g.stake*0.9/(n/2))}   // abandono: el compañero recupera su entrada; los rivales se llevan la del que se fue
    else chips=won?tablePrize(g.stake,n):0}
  if(mo.cancelled){applyTx(key,{chips}).then(()=>writeLooks());return}
  lastReward={matchId:g.matchId,coins};applyTx(key,{chips,coins,earn:true,stat:countsOnline(g)?(won?'w':'l'):null,astat:won?'w':'l',pts}).then(()=>{recordEvents(g.matchId+':m',matchEvents(g));writeLooks()})}
async function commit(ng){confirmMazo=false;
  if(mode==='offline'){setG(ng);settle(G);if(CAMP)settleGira(G);render();drive();return}
  if(busy)return;const base=T&&T.game?T.game.seq:-1;if(ng.seq<=base)return;
  setG(ng);settle(G);render();busy=true;let ok=false;
  if(FB){try{const r=await NET.rooms.commitMove(T.code,ng);ok=r.ok;if(!ok&&r.room)T=r.room}catch(e){toast('No se pudo enviar la jugada. Revisá tu conexión.')}
    busy=false;if(!ok&&T&&T.game)setG(T.game);reconcile();render();drive();return}
  try{if(!await getLease(tableRef))throw new Error('busy');
    const s=await tableRef.get();const cur=s.exists?s.data().game:null;
    if(!cur||cur.matchId!==ng.matchId||cur.seq!==ng.seq-1){if(s.exists)T=s.data()}
    else{await tableRef.update({game:ng,status:ng.matchOver?'done':'playing'});ok=true}}
  catch(e){toast('No se pudo enviar la jugada. Revisá tu conexión.')}
  finally{busy=false;if(!ok&&T&&T.game)setG(T.game);reconcile();render();drive()}}
const TABID=Math.random().toString(36).slice(2,9);
const gsig=g=>g?g.matchId+'|'+g.seq+'|'+g.handNo+'|'+JSON.stringify(g.hand.cards)+'|'+JSON.stringify(g.scores):'';
/* la mesa en la base manda: si lo que veo no coincide, me quedo con lo de la base */
function reconcile(){if(busy||mode!=='online'||!T||!T.game)return;if(!G||gsig(G)!==gsig(T.game))setG(T.game)}
function drive(){clearTimeout(driveT);if(!G||view!=='game')return;const ctrl=mode==='offline'||(mode==='online'&&mySeat>=0&&controllerSeat()===mySeat);if(!ctrl||G.matchOver)return;
  if(G.hand.ended){if(TUT)return;const seq=G.seq;driveT=setTimeout(()=>{if(G&&G.seq===seq&&G.hand.ended&&!G.matchOver)commit(nextHand(G))},3400);return}
  const a=actor(G);if(a<0)return;const absent=isAbsent(a);if(!G.seats[a].bot&&!absent)return;const seq=G.seq;
  if(absent&&stakeTable(G)){const id=G.seats[a].id,left=(goneSince[id]||Date.now())+GRACE+60000-Date.now();
    if(left<=0){commit(endWith({winner:1-team(a),forfeit:id}));return}
    driveT=setTimeout(drive,Math.min(left,2000));return}
  driveT=setTimeout(()=>{if(!G||G.seq!==seq)return;let ac=null;
    if(TUT){const sc=LESSONS[TUT.i].script[TUT.step];if(sc){try{act(G,a,sc);ac=sc;TUT.step++}catch(e){}}}
    let hint=null;if(mode==='offline'&&G.n===4&&a===2&&mySena&&mySena.handNo===G.handNo)hint=senaHint(G,mySena.ks,0);
    try{if(!ac)ac=aiAct(G,a,absent?'dificil':undefined,hint);commit(act(G,a,ac))}catch(e){console.error(e)}},850+Math.random()*700)}
function doAction(ac){if(busy||!G||mySeat<0||actor(G)!==mySeat)return;if(TUT&&!tutAllowed(ac)){toast('Seguí la indicación de la lección');return}try{commit(act(G,mySeat,ac))}catch(e){console.error(e);toast('Esa jugada no es válida ahora')}}
function showTransient(s,t,cls,ms=3600){transient[s]={t,cls,until:Date.now()+ms};render();setTimeout(()=>{if(transient[s]&&transient[s].until<=Date.now()){delete transient[s];if(view==='game')render()}},ms+50)}
function sendReact(k){if(!REACTS[k]||mySeat<0)return;panel=null;showTransient(mySeat,REACTS[k],'react');
  if(mode==='online'&&R)R.emit('react',{seat:mySeat,k}).catch(()=>{});
  if(mode==='offline'&&Math.random()<.45){const others=[...Array(G.n).keys()].filter(s=>s!==mySeat);const s=others[Math.floor(Math.random()*others.length)];
    setTimeout(()=>{if(view==='game'&&G)showTransient(s,pickLine(seatLook(s).av,'reply')||'¡Ja!','react')},1100)}}
function sendSena(k){if(!SENAS[k]||mySeat<0)return;if(mode==='offline'){panel=null;const prev=mySena&&mySena.handNo===G.handNo?mySena.ks:[];const isEnv=SENA_ENV.includes(k);mySena={handNo:G.handNo,ks:prev.filter(x=>SENA_ENV.includes(x)!==isEnv).concat(k)};toast('Tu compañero vio la seña');render();return}if(!R)return;panel=null;R.emit('sena',{seat:mySeat,k}).catch(()=>{});toast('Le hiciste la seña a tu compañero');render()}
function validSender(msg,seat){if(!G||typeof seat!=='number'||seat<0||seat>=G.n)return false;const st=G.seats[seat];return !msg.by||!st.id||st.id===msg.by}
function onReactMsg(msg){const d=msg.data||{};if(msg.isMe&&msg.sameTab)return;if(!validSender(msg,d.seat)||!REACTS[d.k])return;showTransient(d.seat,REACTS[d.k],'react')}
function onSenaMsg(msg){const d=msg.data||{};if(msg.isMe)return;if(!validSender(msg,d.seat)||!SENAS[d.k])return;if(d.seat===mySeat||team(d.seat)!==myTeam())return;showTransient(d.seat,SENAS[d.k],'sena',6000)}

/* ---------- online ---------- */
const CODECH='ABCDEFGHJKLMNPQRSTUVWXYZ';
function genCode(){let c='';for(let i=0;i<4;i++)c+=CODECH[Math.floor(Math.random()*CODECH.length)];return c}
function subLobby(){if(!db||unsubLobby)return;try{unsubLobby=db.collection('tables').where('status','==','waiting').onSnapshot(s=>{lobby=s.docs.map(d=>d.data());if(view==='menu')render()},()=>{unsubLobby=null})}catch(e){}}
async function createTable(){const on=SET.on;if(on.stake>WAL.chips){toast('No te alcanzan las fichas');return}
  if(FB){try{const code=await NET.rooms.createRoom({n:+on.n,target:+on.target,stake:+on.stake,flor:on.flor===true||on.flor==='true'});INVITED=new Set();openTable(code);return code}catch(e){toast('No se pudo crear la sala. Revisá tu conexión.');return}}
  try{let code,ref;for(let i=0;i<5;i++){code=genCode();ref=db.doc('tables/'+code);const ex=await ref.get();if(!ex.exists)break}
    const seats=Array.from({length:+on.n},(_,i)=>i===0?{id:uid,bot:false}:{id:null,bot:false});
    await ref.set({code,n:+on.n,target:+on.target,stake:+on.stake,flor:on.flor===true||on.flor==='true',host:uid,seats,status:'waiting',created:Date.now(),game:null});INVITED=new Set();openTable(code);return code}
  catch(e){toast('No se pudo crear la mesa. Necesitás permiso para editar esta página.')}}
async function joinRoom(code){if(!roomCap)return;try{if(R){await R.leave().catch(()=>{});R=null}
  R=await roomCap.join('reviro-'+code.toLowerCase());roomJoinedAt=Date.now();PEERS=null;R.on('react',onReactMsg,()=>{});R.on('sena',onSenaMsg,()=>{});R.onPeers(ch=>{PEERS=ch.peers;presenceTick()},()=>{});R.presence({here:true,uid}).catch(()=>{})}catch(e){R=null}}
function openTable(code){code=code.toUpperCase();if(unsubTable)unsubTable();tableRef=db.doc('tables/'+code);T=null;view='room';G=null;panel=null;
  try{localStorage.setItem('reviro.table',code)}catch(e){}render();joinRoom(code);
  let first=true;unsubTable=tableRef.onSnapshot(s=>{onTable(s,first);first=false},()=>toast('Se cortó la conexión con la mesa'))}
function onTable(snap,first){if(!snap.exists){toast(first?'No existe una mesa con ese código':'La mesa se cerró');leaveTable(true);return}
  T=snap.data();mySeat=T.seats.findIndex(s=>s.id===uid);isHost=T.host===uid;
  if(FB&&T.tour)tourOnTable();
  if(FB&&T.status==='finished'&&T.result&&mySeat>=0)fbRecord(T.code,T.result.matchId);
  if(T.status==='closed'){toast('El anfitrión cerró la mesa');leaveTable(true);return}
  if(T.status==='waiting'){view='room';G=null;if(first&&mySeat<0){const i=T.seats.findIndex(s=>!s.id&&!s.bot);if(i>=0&&T.stake<=WAL.chips){if(FB)NET.rooms.join(T.code).catch(()=>{});else sit(i)}}}
  else if(T.game){mode='online';view='game';if(!busy&&(!G||gsig(G)!==gsig(T.game)))setG(T.game);
    if(mySeat>=0&&T.stake)applyTx(G.matchId+':in',{chips:-T.stake});settle(G)}
  render();drive()}
async function getLease(ref){for(let k=0;k<8;k++){const r=await ref.acquire({holder:uid+':'+TABID,ttlMs:1500});if(r.acquired)return true;await new Promise(res=>setTimeout(res,Math.min(1600,Math.max(120,(r.expiresAt?Date.parse(r.expiresAt)-Date.now():300)+40))))}return false}
async function withLease(fn){if(!await getLease(tableRef)){toast('Alguien está moviendo los asientos, probá de nuevo');return}
  const s=await tableRef.get();if(!s.exists)return;const d=s.data();if(d.status!=='waiting')return;await fn(d)}
async function sit(i){if(FB){try{const r=await NET.rooms.sit(T.code,i);if(!r.ok)toast(r.reason==='ocupado'?'Ese asiento ya está ocupado':'La sala ya empezó')}catch(e){toast('No pudiste sentarte. Revisá tu conexión.')}return}
  try{await withLease(async d=>{if(d.seats[i].id||d.seats[i].bot){toast('Ese asiento ya está ocupado');return}
  const seats=d.seats.map(x=>x.id===uid?{id:null,bot:false}:x);seats[i]={id:uid,bot:false};await tableRef.update({seats})})}catch(e){toast('No pudiste sentarte. Pedile al dueño que te comparta la página con permiso para editar.')}}
async function setSeat(i,val){if(FB){try{await NET.rooms.updateSeats(T.code,s=>{s[i]=val;return s})}catch(e){toast('No se pudo cambiar el asiento')}return}
  try{await withLease(async d=>{const seats=d.seats.slice();seats[i]=val;await tableRef.update({seats})})}catch(e){toast('No se pudo cambiar el asiento')}}
async function startOnline(){if(!T)return;
  if(FB){try{const r=await NET.rooms.startRoom(T.code,(seats,d)=>newMatch({n:d.n,target:d.target,stake:d.stake,flor:d.flor!==false,seats:seats.map(s=>({id:s.id,bot:!!s.bot})),matchId:d.code+'-'+Date.now().toString(36),diff:d.diff||'medio'}));if(!r.ok)toast('No se pudo empezar la partida')}catch(e){toast('No se pudo empezar la partida')}return}
  const g=newMatch({n:T.n,target:T.target,stake:T.stake,flor:T.flor!==false,seats:T.seats.map(s=>({id:s.id,bot:!!s.bot})),matchId:T.code+'-'+Date.now().toString(36),diff:'medio'});
  try{await tableRef.update({status:'playing',game:g,startedAt:Date.now()})}catch(e){toast('No se pudo empezar la partida')}}
async function leaveTable(silent){const ref=tableRef,t=T;if(unsubTable){unsubTable();unsubTable=null}if(R){R.leave().catch(()=>{});R=null}
  if(FB&&t){const c=t.code;abandonP.finally(()=>NET.rooms.leaveRoom(c)).catch(()=>{});abandonP=Promise.resolve()}
  else if(!silent&&ref&&t&&t.status==='waiting'){try{if(t.host===uid)await ref.update({status:'closed'});else{if(await getLease(ref)){const s=await ref.get();if(s.exists)await ref.update({seats:s.data().seats.map(x=>x.id===uid?{id:null,bot:false}:x)})}}}catch(e){}}
  try{localStorage.removeItem('reviro.table')}catch(e){}T=null;tableRef=null;G=null;mode=null;view='menu';panel=null;clearTimeout(driveT);render()}
/* cierra la partida online con un resultado especial (cancelada o por abandono) */
function forceEnd(ng){const code=T&&T.code,ref=tableRef;return async()=>{if(!code)return;try{if(FB){await NET.rooms.commitMove(code,ng);return}
  if(ref&&await getLease(ref)){const s=await ref.get();const cur=s.exists?s.data().game:null;if(cur&&cur.matchId===ng.matchId&&cur.seq===ng.seq-1)await ref.update({game:ng,status:'done'})}}catch(e){}}}
function endWith(over){const ng=JSON.parse(JSON.stringify(G));ng.seq=(ng.seq||0)+1;ng.matchOver=over;return ng}
/* abandonar una partida en juego cuenta como derrota (en el historial y, en La Huella, en los porotos) */
let abandonP=Promise.resolve();
const inProgress=()=>!!(G&&!G.matchOver&&mySeat>=0&&!TUT);
const humansIn=g=>g?g.seats.filter(s=>s.id&&!s.bot).length:0;
const countsOnline=g=>mode==='online'&&humansIn(g)>=2;
function abandonCurrent(){if(!inProgress())return;const g=G;
  /* mesa con entrada: en los primeros 30 segundos se cancela y se devuelve todo; después, el que se va pierde su entrada */
  if(stakeTable(g)){const early=Date.now()-((T&&T.startedAt)||g.startedAt||0)<30000;
    if(early){const ng=endWith({winner:-1,cancelled:true});abandonP=forceEnd(ng)();applyTx(g.matchId+':done',{chips:g.stake});toast('Te fuiste al arrancar: se cancela la partida y se devuelven las entradas');return}
    const ng=endWith({winner:1-myTeam(),forfeit:uid});
    const fin=forceEnd(ng);abandonP=(FB?NET.stats.recordAbandon(T.code).catch(()=>{}):Promise.resolve()).then(fin);
    applyTx(g.matchId+':done',{stat:'l'});toast('Abandonaste: perdés tu entrada');return}
  if(countsOnline(g))applyTx(g.matchId+':done',{stat:'l'}).then(()=>{recordEvents(g.matchId+':m',['match_played']);writeLooks()});
  else applyTx(g.matchId+':done',{}).then(()=>{});
  if(CAMP)settleGira(Object.assign({},g,{matchOver:{winner:1}}));
  if(FB&&mode==='online'&&T){const code=T.code,tt=T.tour;abandonP=NET.stats.recordAbandon(code).then(r=>{if(r&&r.stats)MYUSER=Object.assign({},MYUSER,{stats:r.stats})})
    .then(()=>tt?NET.tour.forfeit(code).then(()=>NET.tour.reportResult(tt.tid,tt.mid)):null).catch(()=>{})}
  toast(FB&&mode==='online'&&T&&T.tour?'Abandonaste: perdés este partido del torneo':countsOnline(g)?'Abandonaste la partida: cuenta como derrota':CAMP?'Abandonaste: perdés los porotos de esta partida':'Saliste de la partida')}
function toMenu(){TUT=null;mySena=null;const wasCamp=!!CAMP;CAMP=null;if(mode==='online')leaveTable(true);else{G=null;mode=null;view=wasCamp?'gira':'menu';panel=null;clearTimeout(driveT);render()}}

/* ---------- presencia online: quién está y quién maneja la mesa ---------- */
let PEERS=null,roomJoinedAt=0;const goneSince={};
const GRACE=12000;
const SEEN=new Set();
function presentIds(){const s=new Set();if(PEERS)for(const p of PEERS){const id=p.by||(p.presence&&typeof p.presence.uid==='string'?p.presence.uid:null);if(id){s.add(id);SEEN.add(id)}}if(uid)s.add(uid);return s}
function roomReliable(){return !!(R&&PEERS&&R.connected()&&Date.now()-roomJoinedAt>5000)}
function refreshPresence(){if(!roomReliable())return;const pr=presentIds(),now=Date.now();
  const seats=(G?G.seats:(T?T.seats:[]))||[];for(const st of seats){if(!st.id)continue;if(pr.has(st.id))delete goneSince[st.id];else if(!goneSince[st.id])goneSince[st.id]=now}}
function isAbsent(s){if(mode!=='online'||!G)return false;const st=G.seats[s];if(!st||st.bot||!st.id||st.id===uid)return false;
  if(!roomReliable()||!SEEN.has(st.id))return false;return !!goneSince[st.id]&&Date.now()-goneSince[st.id]>GRACE}
function controllerSeat(){if(!G||mode!=='online')return -1;const host=G.seats.findIndex(s=>s.id&&T&&s.id===T.host);
  if(!roomReliable())return host;if(host>=0&&!isAbsent(host))return host;
  for(let s=0;s<G.n;s++){const st=G.seats[s];if(st.id&&!st.bot&&!isAbsent(s))return s}return host}
let lastCtrlSig='';
function presenceTick(){if(view!=='game'||mode!=='online'||!G)return;refreshPresence();
  const sig=controllerSeat()+'|'+G.seats.map((_,s)=>isAbsent(s)?1:0).join('');if(sig!==lastCtrlSig){lastCtrlSig=sig;render();drive()}}

/* ---------- señas al compañero máquina ---------- */
let mySena=null;
function senaHint(g,ks,from){const map={cejas:['1E'],guino:['1B'],bocader:['7E'],bocaizq:['7O']};const H={seat:from},o=g.hand.orig[from];ks=[].concat(ks||[]);
  for(const k of ks){if(map[k])H.cards=(H.cards||[]).concat(map[k]);
    else if(k==='labio'||k==='dos'){const t=o.find(c=>cn(c)===(k==='labio'?3:2));if(t)H.cards=(H.cards||[]).concat(t)}
    else if(k==='falso'){const t=o.find(c=>c==='1C'||c==='1O');if(t)H.cards=(H.cards||[]).concat(t)}
    else if(k==='ojos')H.weak=true;
    else if(SENA_EVAL[k])H.env=SENA_EVAL[k]}
  return H.cards||H.weak||H.env?H:null}

/* ---------- misiones y logros ---------- */
const MISSIONS=[
 {id:'manos5',t:'Ganá 5 manos',ev:'hand_won',goal:5,r:40},
 {id:'retruco2',t:'Ganá 2 manos con retruco querido',ev:'retruco_won',goal:2,r:60},
 {id:'envido3',t:'Ganá 3 envidos',ev:'envido_won',goal:3,r:50},
 {id:'falta1',t:'Ganá un falta envido',ev:'falta_won',goal:1,r:80},
 {id:'flor1',t:'Sumá puntos con una flor',ev:'flor_won',goal:1,r:60},
 {id:'partida1',t:'Ganá una partida',ev:'match_won',goal:1,r:50},
 {id:'dificil1',t:'Ganale a la máquina en Difícil',ev:'match_won_dificil',goal:1,r:120},
 {id:'online1',t:'Jugá una partida online',ev:'online_played',goal:1,r:60},
 {id:'vale4',t:'Ganá una mano con vale cuatro',ev:'vale4_won',goal:1,r:100},
 {id:'parda1',t:'Ganá una mano que tuvo parda',ev:'parda_won',goal:1,r:50},
 {id:'mazo2',t:'Hacé que el rival se vaya al mazo 2 veces',ev:'mazo_rival',goal:2,r:40},
 {id:'jugar3',t:'Jugá 3 partidas',ev:'match_played',goal:3,r:50},
];
const ACHS=[
 {id:'primera',t:'Primera de muchas',d:'Ganá tu primera partida',ev:'match_won',goal:1,r:50},
 {id:'diez',t:'Ya sos de la mesa',d:'Ganá 10 partidas',ev:'match_won',goal:10,r:150},
 {id:'cien',t:'Cien manos',d:'Ganá 100 manos',ev:'hand_won',goal:100,r:200},
 {id:'faltero',t:'El Faltero',d:'Ganá un falta envido',ev:'falta_won',goal:1,r:80},
 {id:'florista',t:'Florista',d:'Sumá puntos con 10 flores',ev:'flor_won',goal:10,r:150},
 {id:'vale4x5',t:'Cuatro al hilo',d:'Ganá 5 manos con vale cuatro',ev:'vale4_won',goal:5,r:150},
 {id:'dificil',t:'Le ganaste a la Difícil',d:'Ganale a la máquina en Difícil',ev:'match_won_dificil',goal:1,r:150},
 {id:'maestro',t:'Maestro del truco',d:'10 victorias en Difícil',ev:'match_won_dificil',goal:10,r:400},
 {id:'online10',t:'Habitué del club',d:'Jugá 10 partidas online',ev:'online_played',goal:10,r:200},
 {id:'racha5',t:'Racha de cinco',d:'Ganá 5 partidas seguidas',ev:'@streak',goal:5,r:150},
 {id:'coleccion',t:'Coleccionista',d:'Tené 6 personajes',ev:'@avatars',goal:6,r:120},
 {id:'alumno',t:'Alumno aplicado',d:'Completá el tutorial',ev:'tutorial_done',goal:1,r:60},
];
function dayHash(s){let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;return h}
function ensureMissions(){const today=new Date().toLocaleDateString('en-CA');if(WAL.mis&&WAL.mis.date===today)return;
  const ids=MISSIONS.map(m=>m.id);let x=dayHash(today);const pick=[];while(pick.length<3){x=(x*1103515245+12345)>>>0;const id=ids[x%ids.length];if(!pick.includes(id))pick.push(id)}
  WAL.mis={date:today,ids:pick,prog:{},done:[]}}
function achValue(a){if(a.ev==='@streak')return Math.max(WAL.stats.best||0,WAL.stats.abest||0);if(a.ev==='@avatars')return AVS.filter(x=>owns('av',x.id,x.price)).length;return (WAL.ach.cnt[a.ev]||0)}
function recordEvents(key,evs){walQ=walQ.then(async()=>{if(key&&WAL.evk.includes(key))return;ensureMissions();const msgs=[];let chips=0;
    for(const ev of evs){WAL.ach.cnt[ev]=(WAL.ach.cnt[ev]||0)+1;
      for(const id of WAL.mis.ids){const m=MISSIONS.find(x=>x.id===id);if(!m||m.ev!==ev||WAL.mis.done.includes(id))continue;
        WAL.mis.prog[id]=Math.min(m.goal,(WAL.mis.prog[id]||0)+1);if(WAL.mis.prog[id]>=m.goal){WAL.mis.done.push(id);chips+=fPrice(m.r);msgs.push('Misión cumplida: '+m.t+' (+'+fmt(fPrice(m.r))+' fichas)')}}}
    for(const a of ACHS){if(WAL.ach.done.includes(a.id))continue;if(achValue(a)>=a.goal){WAL.ach.done.push(a.id);chips+=fPrice(a.r);msgs.push('Logro: '+a.t+' (+'+fmt(fPrice(a.r))+' fichas)')}}
    if(key)WAL.evk=WAL.evk.concat(key).slice(-60);
    if(chips){WAL.chips+=chips;sfx('buy')}renderWallet();await saveWallet();if(msgs.length)toast(msgs.join(' · '));render()});return walQ}
function handEvents(g){const h=g.hand,mt=myTeam(),won=h.ended&&h.ended.winner===mt,evs=[];
  if(won)evs.push('hand_won');if(won&&h.truco.level>=3)evs.push('retruco_won');if(won&&h.truco.level===4)evs.push('vale4_won');
  if(won&&h.results.includes('P'))evs.push('parda_won');
  for(const x of h.gains){if(x.tm!==mt)continue;if(x.why==='envido'||x.why==='falta envido')evs.push('envido_won');if(x.why==='falta envido')evs.push('falta_won');
    if(x.why==='flor'||x.why==='contraflor')evs.push('flor_won');if(x.why==='mazo')evs.push('mazo_rival')}
  return evs}
function matchEvents(g){const won=g.matchOver.winner===myTeam(),evs=['match_played'];if(won)evs.push('match_won');
  if(won&&mode==='offline'&&g.diff==='dificil')evs.push('match_won_dificil');if(mode==='online')evs.push('online_played');return evs}

/* ---------- tutorial ---------- */
let TUT=null;
const LESSONS=[
 {title:'Las bazas',mano:0,flor:false,hands:[['1E','3O','4C'],['5E','12B','6C']],script:[{t:'play',card:'5E'},{t:'play',card:'12B'}],
  coach(g){const h=g.hand,my=actor(g)===0;
    if(h.ended)return{done:'Ganaste dos bazas y la mano. En el truco gana quien gana dos de las tres bazas.'};
    if(my&&h.results.length===0)return{t:'Cada mano tiene hasta tres bazas: gana la mano quien gana dos. El ancho de espada (el 1 de espada) es la carta más alta del mazo. Tiralo.',x:a=>a.t==='play'&&a.card==='1E'};
    if(my&&h.results.length===1)return{t:'Ganaste la primera baza, así que empezás vos. Ahora tirá el 3 de oro: los treses están entre las cartas más fuertes.',x:a=>a.t==='play'&&a.card==='3O'};
    return{t:'Ahora juega la máquina…'}}},
 {title:'El envido',mano:0,flor:false,hands:[['7C','6C','12O'],['5E','4B','11O']],script:[{t:'quiero'}],
  coach(g){const h=g.hand,my=actor(g)===0;
    if(h.ended)return{done:'Muy bien. El envido y el truco se juegan por separado: podés ganar uno y perder el otro en la misma mano.'};
    if(!h.env.done&&!h.env.pending&&my)return{t:'Tus dos copas suman 20 + 7 + 6 = 33 de envido, casi lo máximo. Las figuras valen cero. El envido se canta antes de tirar tu primera carta: cantá Envido.',x:a=>a.t==='envido'&&a.kind==='envido'};
    if(h.env.pending)return{t:'La máquina está pensando si quiere…'};
    return{t:'Ganaste el envido 33 a 5 y sumaste 2 puntos. Ahora terminá la mano como quieras.'}}},
 {title:'El truco',mano:0,flor:false,hands:[['1B','7E','3C'],['2O','6B','10C']],script:[{t:'quiero'}],
  coach(g){const h=g.hand,my=actor(g)===0;
    if(h.ended)return{done:'Ganaste 2 puntos con el truco. Si la máquina no hubiera querido, sumabas 1 igual.'};
    if(h.truco.level===1&&!h.truco.pending&&my)return{t:'Tenés el ancho de basto y el siete de espada, dos de las cuatro mejores cartas. Cantá Truco: si la máquina quiere, la mano pasa a valer 2.',x:a=>a.t==='truco'&&a.level===2};
    if(h.truco.pending)return{t:'Esperá la respuesta…'};
    return{t:'¡Quiso! Ahora la mano vale 2. Ganá dos bazas: arrancá con el siete de espada y guardá el ancho para después.'}}},
 {title:'Contestar y subir',mano:1,flor:false,hands:[['1E','7O','2C'],['4E','5B','6C']],script:[{t:'truco',level:2},{t:'noquiero'}],
  coach(g){const h=g.hand,my=actor(g)===0;
    if(h.ended)return{done:'No quiso el retruco: sumaste 2, lo que valía el truco que ya habías aceptado. Subir la apuesta con buenas cartas presiona al rival.'};
    if(h.truco.pending&&my&&h.truco.pending.level===2)return{t:'La máquina es mano y cantó truco. Con el ancho de espada y el siete de oro tenés la mano casi ganada: subí con Quiero retruco, que vale 3.',x:a=>a.t==='truco'&&a.level===3};
    return{t:'La máquina es mano: le toca empezar…'}}},
 {title:'La flor',mano:0,flor:true,hands:[['5O','6O','7O'],['1E','3B','12C']],script:[],
  coach(g){const h=g.hand,my=actor(g)===0;
    if(h.ended)return{done:'¡Terminaste el tutorial! Ya sabés lo básico: bazas, envido, truco, cómo subir y la flor.'};
    if(!h.flor.done&&my)return{t:'Tus tres cartas son de oro: eso es flor y vale 3 puntos. Se canta antes de tirar y anula el envido. Cantá ¡Flor!',x:a=>a.t==='flor'};
    return{t:'Flor de 38: sumaste 3. Ahora jugá la mano; la máquina tiene cartas altas, así que tranquilo si la perdés.'}}},
];
function startLesson(i){const L=LESSONS[i];if(!L)return;CAMP=null;
  const g=newMatch({n:2,target:30,flor:L.flor,stake:0,seats:[{me:true},{bot:true}],matchId:'tut-'+i+'-'+Date.now().toString(36),diff:'medio'});
  g.mano=L.mano;g.hand.cards=clone(L.hands);g.hand.orig=clone(L.hands);g.hand.bazas=[{lead:L.mano,plays:[]}];g.hand.turn=L.mano;g.log=[{k:'hand',no:1,mano:L.mano}];
  TUT={i,step:0};mode='offline';mySeat=0;view='game';confirmExit=false;panel=null;botLooks={1:{av:'veterano',dorso:'pampa'}};cfg=null;
  setG(g);render();drive()}
function coachNow(){return TUT&&G?LESSONS[TUT.i].coach(G):null}
function tutAllowed(ac){const c=coachNow();return !c||!c.x||c.x(ac)}
function finishLesson(){if(!TUT)return;const i=TUT.i;applyTx('tut-'+i,{coins:20,earn:true});
  if(!WAL.tut.includes(i)){WAL.tut=WAL.tut.concat(i);saveWallet()}
  if(LESSONS.every((_,k)=>WAL.tut.includes(k)))recordEvents('tut-all',['tutorial_done'])}
function actKey(a){if(a.startsWith('env:'))return{t:'envido',kind:a.slice(4)};if(a.startsWith('truco:'))return{t:'truco',level:+a.slice(6)};return{t:a}}

/* ---------- ranking ---------- */
let RANK=null,unsubRank=null;
function subRank(){if(!db||unsubRank)return;try{unsubRank=db.collection('looks').orderBy('pts','desc').limit(100).onSnapshot(s=>{RANK=s.docs.map(d=>({id:d.id,...d.data()}));if(view==='ranking')render()},()=>{unsubRank=null})}catch(e){}}

/* ---------- vistas nuevas ---------- */
function missionsHTML(){ensureMissions();const now=new Date(),mid=new Date(now);mid.setHours(24,0,0,0);const hrs=Math.max(1,Math.round((mid-now)/3600e3));
  const mis=WAL.mis.ids.map(id=>MISSIONS.find(m=>m.id===id)).filter(Boolean);const got=ACHS.filter(a=>WAL.ach.done.includes(a.id)).length;
  const [tab,tabs]=ptabs('mis',[['hoy','Misiones de hoy'],['logros',`Logros (${got} de ${ACHS.length})`]],'hoy');
  const body=tab==='hoy'?`<p class="note snote">Se renuevan en ${hrs} h.</p><div class="mislist">${mis.map(m=>{const p=WAL.mis.prog[m.id]||0,done=WAL.mis.done.includes(m.id);
      return `<div class="mis ${done?'ok':''}"><div class="mtop"><b>${esc(m.t)}</b><span class="rw">${chipI}+${fmt(fPrice(m.r))}</span></div><div class="bar"><i style="width:${Math.round(p*100/m.goal)}%"></i></div><small>${done?'Cumplida':p+' de '+m.goal}</small></div>`}).join('')}</div>`
    :fitList('achs',ACHS,a=>{const v=Math.min(a.goal,achValue(a)),done=WAL.ach.done.includes(a.id);
      return `<div class="ach ${done?'ok':''}"><span class="medal" aria-hidden="true">${done?'★':'☆'}</span><div><b>${esc(a.t)}</b><small>${esc(a.d)}</small><div class="bar"><i style="width:${Math.round(v*100/a.goal)}%"></i></div><small>${done?'Conseguido':v+' de '+a.goal} · ${chipI.replace('class="chip"','class="chip" style="display:inline-block;width:11px;height:11px;vertical-align:-1px"')} ${fmt(fPrice(a.r))} fichas</small></div></div>`},'achs');
  return phd('Misiones','','extra')+tabs+`<div class="pbody">${body}</div>`}
function rankingHTML(){const head=phd('Ranking','','extra');if(!db||!uid)return head+`<section class="box"><p class="note" style="margin:0">${LOCAL?'El ranking funciona con tu cuenta en la web.':'El ranking necesita que abras Reviro con tu cuenta de claude.ai.'}</p></section>`;
  subRank();subFriends();const fs=friendSet();const rows=(RANK||[]).filter(r=>r.played>0&&(rankScope==='all'||r.id===uid||fs.has(r.id)));const ids=rows.map(r=>r.id);if(ids.length)ensureNames(ids);
  const myPos=rows.findIndex(r=>r.id===uid);const head2=phd(rankScope==='all'?'Los 100 mejores':'Ranking',`<span class="pill">${myPos>=0?'Vas '+(myPos+1)+'.º':'Fuera del top'}</span>`,'extra');
  return head2+`<div class="subtabs" role="group"><button type="button" data-a="rscope" data-v="all" aria-pressed="${rankScope==='all'}">Top 100</button><button type="button" data-a="rscope" data-v="friends" aria-pressed="${rankScope==='friends'}">Mis amigos (${fs.size})</button></div>
  <div class="pbody">${RANK===null?'<p class="note">Cargando…</p>':fitList('rank-'+rankScope,rows.map((r,i)=>Object.assign({pos:i+1},r)),r=>`<li class="${r.id===uid?'me':''}"><span class="pos">${r.pos}</span>${avatarSVG(AVM[r.av]?r.av:'gaucho',36)}<span class="nm">${esc(r.id===uid?myDisp():((r.nick)||NAMES[r.id]||'Jugador'))}<small>${fmt(r.won||0)} ganadas de ${fmt(r.played||0)} · racha máx. ${r.best||0}</small></span><b>${fmt(r.pts||0)}</b></li>`,'lb',rankScope==='friends'?'<p class="note">Todavía no tenés amigos con partidas. Pasales tu link de amigo desde Perfil.</p>':'<p class="note">Todavía nadie terminó una partida. Jugá una y aparecés acá.</p>')}</div>
  <p class="note snote">Puntos: 30 por partida online ganada y 3, 8 o 15 por ganarle a la máquina en Fácil, Medio o Difícil.</p>`}
function tutorialBoxHTML(){const done=WAL.tut||[];
  return `<section class="box"><h2>¿Primera vez?</h2><p class="note">Cinco lecciones cortas con manos armadas para aprender bazas, envido, truco y flor. Cada una te da 20 monedas.</p>
    <div class="lessons">${LESSONS.map((L,i)=>`<button type="button" class="lesson ${done.includes(i)?'ok':''}" data-a="lesson" data-i="${i}"><span>${done.includes(i)?'✓':i+1}</span>${esc(L.title)}</button>`).join('')}</div></section>`}


/* ---------- apodo y amigos ---------- */
const APP_URL='https://claude.ai/artifact/Bh36r5K4CVn9KRgdY1QbcS';
let rankScope='all',REVF=[],unsubRev=null;
const FCH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genFriendCode(){let c='';for(let i=0;i<6;i++)c+=FCH[Math.floor(Math.random()*FCH.length)];return c}
function cleanNick(s){return String(s||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20)}
function myDisp(){return WAL.nick||myName||'Vos'}
function dispName(id){if(!id)return'';if(id===uid)return myDisp();const l=LOOKS[id];return (l&&l.nick)||NAMES[id]||''}
function saveNick(v){const n=cleanNick(v);if(n&&n.length<2){toast('El apodo necesita al menos 2 letras');return}WAL.nick=n;saveWallet();writeLooks();toast(n?'Ahora te llamás '+n:'Apodo borrado');render()}
/* compartir por WhatsApp: abre WhatsApp con el mensaje armado */
const SITE='https://aleclem180.github.io/Reviro/';
const siteURL=()=>FB?location.origin+BASEP:SITE;
const waHref=t=>'https://wa.me/?text='+encodeURIComponent(t);
const WAICO='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.8l5.1-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.6-.2z"/></svg>';
function waInviteText(){return `¿Un truco? Te espero en Reviro: ${FB?siteURL():SITE}${WAL.fcode?'#a-'+WAL.fcode:''}`}
function friendLink(){return (window.claude?APP_URL:location.href.split('#')[0])+'#a-'+(WAL.fcode||'')}
function friendSet(){const s=new Set(WAL.friends||[]);for(const id of REVF)s.add(id);s.delete(uid);return s}
function subFriends(){if(!db||!uid||unsubRev)return;try{unsubRev=db.collection('looks').where('friends','array-contains',uid).onSnapshot(s=>{REVF=s.docs.map(d=>d.id);s.docs.forEach(d=>{LOOKS[d.id]=d.data()});if(view==='profile'||view==='ranking')render()},()=>{unsubRev=null})}catch(e){}}
async function addFriendByCode(raw){const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length!==6){toast('El código de amigo tiene 6 caracteres');return}
  if(code===WAL.fcode){toast('Ese es tu propio código');return}
  if(!db){toast('Para agregar amigos abrí Reviro con tu cuenta');return}
  try{const s=await db.collection('looks').where('code','==',code).limit(1).get();if(s.empty){toast('No encontré a nadie con ese código');return}
    const d=s.docs[0],id=d.id;LOOKS[id]=d.data();
    if((WAL.friends||[]).includes(id)){toast('Ya son amigos');return}
    WAL.friends=(WAL.friends||[]).concat(id).slice(-100);await saveWallet();await writeLooks();
    toast('¡Ahora sos amigo de '+(dispName(id)||'tu amigo')+'!');ensureNames([id]);render()}
  catch(e){toast('No se pudo agregar. Probá de nuevo')}}
function checkInviteHash(){let hsh='';try{hsh=location.hash||''}catch(e){}
  if(PENDTOUR&&FB){const id=PENDTOUR;PENDTOUR=null;openTour(id);return}
  const mm=/^#m-([A-Z0-9-]{4,24})$/i.exec(hsh),mt=/^#t-([A-Z0-9]{8})$/i.exec(hsh);
  if(mm||mt){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
    if(mm&&db&&uid){openTable(mm[1]);return}if(mt&&FB){openTour(mt[1].toUpperCase());return}return}
  const m=/^#a-([A-Z0-9]{6})$/i.exec(hsh);if(!m)return;
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  if(m[1].toUpperCase()!==WAL.fcode)addFriendByCode(m[1])}
function friendsBoxHTML(){const fs=[...friendSet()];if(fs.length){fetchLooks(fs);ensureNames(fs)}
  if(!(db&&uid))return `<section class="box"><p class="note" style="margin:0">${LOCAL?'Los amigos funcionan con tu cuenta en la web.':'Los amigos necesitan que abras Reviro con tu cuenta de claude.ai.'}</p></section>`;
  return `<section class="box grow"><div class="row frow"><span class="fcode" title="Tu código de amigo">${esc(WAL.fcode||'')}</span><button class="btn prim sm" data-a="copylink">Copiar mi link</button>
      <form class="row" data-form="friend"><input type="text" id="friendin" maxlength="6" placeholder="Código de un amigo" aria-label="Código de amigo" autocomplete="off"><button class="btn sm" type="submit">Agregar</button></form></div>
    ${fitList('friends',fs,id=>{const l=LOOKS[id]||{};return `<li>${avatarSVG(AVM[l.av]?l.av:'gaucho',34)}<span style="flex:1">${esc(dispName(id)||'Jugador')}<small>${fmt(l.pts||0)} puntos · ${fmt(l.won||0)} ganadas</small></span><button class="btn sm brass" data-a="invite" data-id="${esc(id)}">Invitar</button></li>`},'flist','<p class="note" style="margin:0">Todavía no agregaste a nadie. Mandá tu link: cuando lo abran, quedan agregados de los dos lados.</p>')}</section>`}
/* ---------- cuenta: inicio de sesión y registro ---------- */
let isOwnerV=false,PREMIUM=false,myEmail=null,regAv='gaucho',PREMS={},ADMINP=null,unsubPrem=null,unsubAdmin=null;
function bootHTML(){return `<div class="gate">${fileteHTML('gtitle')}<p class="note">Conectando con tu cuenta…</p></div>`}
function loginHTML(){return `<div class="gate">${fileteHTML('gtitle')}
  <section class="box"><h2>Iniciá sesión para jugar</h2>
  <p>Reviro usa tu cuenta de claude.ai, la de tu mail, para guardar tu personaje, tus monedas, tus amigos y tu ranking.</p>
  <p class="note">Abrí este link con tu sesión de claude.ai iniciada. Si te lo pasó un amigo, pedile que te comparta la página con permiso para editar.</p></section></div>`}
function registerHTML(){const free=AVS.filter(a=>!a.price);
  return `<div class="gate">${fileteHTML('gtitle')}
  <form class="box" data-form="reg"><h2>Creá tu cuenta</h2>
    ${myEmail?`<p class="note">Vas a quedar registrado con <b>${esc(myEmail)}</b>.</p>`:`<p class="note">${LOCAL?'Tu progreso se guarda en este dispositivo.':'Vas a quedar registrado con tu cuenta de claude.ai.'}</p>`}
    <div class="field"><span>Tu apodo en la mesa</span><input type="text" id="regnick" class="plain" maxlength="20" placeholder="Por ejemplo: El Ale" value="${esc(WAL.nick||myName||'')}" autocomplete="off" required></div>
    <div class="field"><span>Elegí tu personaje</span><div class="regavs">${free.map(a=>`<button type="button" class="regav" data-a="regav" data-id="${a.id}" aria-pressed="${regAv===a.id}">${avatarSVG(a.id,96,true)}<b>${esc(a.name)}</b></button>`).join('')}</div>
      <p class="note">Después podés conseguir más en la tienda.</p></div>
    <button class="btn prim" type="submit">Crear mi cuenta</button>
    <p class="note">Las fichas y las monedas de Reviro no tienen valor en dinero.</p></form></div>`}
function doRegister(){const n=cleanNick($('#regnick')&&$('#regnick').value);if(!n||n.length<2){toast('Poné un apodo de al menos 2 letras');return}
  WAL.nick=n;WAL.registered=true;WAL.eq.av=regAv;saveWallet();writeLooks();view='welcome';render()}

/* ---------- premium: solo lo otorga el dueño ---------- */
function subPremium(){if(!db||!uid||unsubPrem)return;try{unsubPrem=db.doc('premium/'+uid).onSnapshot(s=>{const d=s.exists?s.data():null;const was=PREMIUM;PREMIUM=isOwnerV||!!(d&&d.on===true);if(PREMIUM&&!was&&!isOwnerV)toast('¡Tu cuenta ahora es premium!');render()},()=>{unsubPrem=null})}catch(e){}}
function subAdmin(){if(!db||!isOwnerV||unsubAdmin)return;try{
  db.collection('premium').onSnapshot(s=>{PREMS={};s.docs.forEach(d=>{if(d.data().on)PREMS[d.id]=true});if(view==='profile')render()},()=>{});
  unsubAdmin=db.collection('looks').limit(300).onSnapshot(s=>{ADMINP=s.docs.map(d=>({id:d.id,...d.data()}));s.docs.forEach(d=>{LOOKS[d.id]=d.data()});if(view==='profile')render()},()=>{unsubAdmin=null})}catch(e){}}
async function setPremium(id,on){if(!isOwnerV)return;try{const ref=db.doc('premium/'+id);if(on)await ref.set({on:true,at:Date.now()});else await ref.delete();if(FB)NET.admin.audit(on?'dar premium':'quitar premium',id);toast(on?'Premium activado':'Premium quitado')}catch(e){toast('No se pudo cambiar el premium')}}
async function premiumByCode(raw){const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==6){toast('El código tiene 6 caracteres');return}
  try{const s=await db.collection('looks').where('code','==',code).limit(1).get();if(s.empty){toast('No encontré a nadie con ese código');return}await setPremium(s.docs[0].id,true)}catch(e){toast('No se pudo buscar ese código')}}
function adminHTML(){if(!isOwnerV)return'';const list=(ADMINP||[]).filter(p=>p.id!==uid);
  return `<section class="box admin grow"><p class="note" style="margin:0">Solo vos ves esto. Las cuentas premium pueden cargarse fichas y monedas de prueba.</p>
    <form class="row" data-form="prem"><input type="text" id="premin" maxlength="6" placeholder="Código" aria-label="Código del jugador" autocomplete="off"><button class="btn prim sm" type="submit">Dar premium</button></form>
    ${ADMINP===null?'<p class="note">Cargando jugadores…</p>':fitList('adm-prem',list,p=>{const on=!!PREMS[p.id];return `<li>${avatarSVG(AVM[p.av]?p.av:'gaucho',34)}<span style="flex:1">${esc(p.nick||NAMES[p.id]||'Jugador')}<small>Código ${esc(p.code||'—')} · ${on?'premium':'común'}</small></span><button class="btn sm ${on?'warn':'brass'}" data-a="prem" data-id="${esc(p.id)}" data-on="${on?0:1}">${on?'Quitar':'Dar'}</button></li>`},'flist','<p class="note">Todavía no hay otros jugadores.</p>')}</section>`}
const premLock=()=>`<div class="demo"><b>Solo para cuentas premium.</b> ${isOwnerV?'':'Pedile al dueño de Reviro que te active el premium. Las monedas también se ganan jugando y con las misiones.'}</div>`;

/* ---------- anotador para jugar en persona ---------- */
const ANOT={target:30,names:['Nosotros','Ellos'],s:[0,0],hist:[]};
try{Object.assign(ANOT,JSON.parse(localStorage.getItem('reviro.anot')||'{}'))}catch(e){}
function saveAnot(){try{localStorage.setItem('reviro.anot',JSON.stringify(ANOT))}catch(e){}}
function anotAdd(t,d){if(ANOT.s[0]>=ANOT.target||ANOT.s[1]>=ANOT.target){if(d>0)return}const before=ANOT.s[t];ANOT.s[t]=Math.max(0,Math.min(ANOT.target,ANOT.s[t]+d));
  if(ANOT.s[t]===before)return;ANOT.hist=ANOT.hist.concat({t,d:ANOT.s[t]-before}).slice(-40);saveAnot();
  if(ANOT.s[t]>=ANOT.target){sfx('win');toast('¡Ganó '+ANOT.names[t]+'!')}else sfx(d>0?'pts':'card');render()}
function anotUndo(){const l=ANOT.hist.pop();if(!l)return;ANOT.s[l.t]=Math.max(0,ANOT.s[l.t]-l.d);saveAnot();render()}
function anotHTML(){const T2=ANOT.target,win=ANOT.s.findIndex(v=>v>=T2);
  const col=t=>{const sc=ANOT.s[t],ph=T2===30?(sc<15?'malas':'buenas'):'';
    return `<section class="acol ${win===t?'won':''}"><input type="text" class="plain aname" id="an${t}" maxlength="16" value="${esc(ANOT.names[t])}" aria-label="Nombre del equipo">
      <b class="anum">${sc}</b>${ph?`<span class="aph">en las ${ph}</span>`:''}
      <div class="afos">${fosforos(sc,T2)}</div>
      <button class="btn prim abig" data-a="an" data-t="${t}" data-d="1" ${win>=0?'disabled':''}>+1</button>
      <div class="arow">${[2,3,4].map(d=>`<button class="btn sm" data-a="an" data-t="${t}" data-d="${d}" ${win>=0?'disabled':''}>+${d}</button>`).join('')}<button class="btn sm ghost" data-a="an" data-t="${t}" data-d="-1">−1</button></div></section>`};
  return phd('Anotador',seg('anot.target',[[15,'A 15'],[30,'A 30']],T2),'extra')+`
    ${win>=0?`<div class="demo" style="text-align:center"><b>¡Ganó ${esc(ANOT.names[win])}!</b> ${ANOT.s[0]} a ${ANOT.s[1]}</div>`:''}
    <div class="anot">${col(0)}${col(1)}</div>
    <div class="row arow2"><button class="btn" data-a="anundo" ${ANOT.hist.length?'':'disabled'}>Deshacer</button><button class="btn ${anotConfirm?'warn':'ghost'}" data-a="anreset">${anotConfirm?'Confirmar: de cero':'Nueva partida'}</button></div>
    <p class="note snote" style="text-align:center">+2 truco o envido querido · +3 retruco, real envido o flor · +4 vale cuatro</p>`}
let anotConfirm=false;


/* ---------- La Huella: mapa de Argentina, rivales con porotos y zonas que se desbloquean ---------- */
const MAPK=12,MAPC=.788;
const prj=([lon,lat])=>[((lon+74)*MAPC*MAPK).toFixed(1),((-21-lat)*MAPK).toFixed(1)];
const pathOf=pts=>'M'+pts.map(p=>prj(p).join(' ')).join('L')+'Z';
const AR_MAIN=[[-66.8,-22.4],[-65.75,-22.1],[-63.8,-22],[-62.65,-22.25],[-60,-23.8],[-58.6,-24.9],[-57.7,-25.3],[-58.1,-26.4],[-58.6,-27.2],[-57.4,-27.4],[-56.5,-27.4],[-55.9,-27.35],[-55.5,-26.9],[-54.9,-26.4],[-54.6,-25.6],[-53.85,-25.9],[-53.65,-26.25],[-53.8,-27.1],[-55.1,-27.8],[-55.8,-28.4],[-56.4,-28.9],[-57.6,-30.2],[-57.8,-31.2],[-58.1,-32.4],[-58.2,-33.1],[-58.4,-33.9],[-58.4,-34.6],[-57.6,-35],[-57.1,-35.6],[-56.8,-36.3],[-56.7,-36.9],[-57.5,-38.1],[-58.5,-38.6],[-59.6,-38.8],[-61.2,-39],[-62.3,-38.8],[-62.1,-39.6],[-62.3,-40.2],[-62.3,-40.8],[-63,-41.1],[-64.4,-40.8],[-65.1,-40.9],[-65,-41.8],[-64.4,-42.2],[-63.6,-42.6],[-63.8,-42.9],[-64.5,-42.9],[-65,-43.4],[-65.3,-44.5],[-65.7,-45],[-67,-45.5],[-67.5,-46],[-67.4,-46.6],[-66.4,-47.1],[-65.8,-47.8],[-66.6,-48.5],[-67.6,-49.2],[-68.2,-50.1],[-69.1,-50.9],[-69.2,-51.6],[-68.4,-52.3],[-69.5,-52.15],[-71.9,-52],[-72.3,-51.4],[-72.4,-50.7],[-73.2,-49],[-72.6,-48],[-72.3,-47.4],[-71.8,-46.6],[-71.7,-45.6],[-71.5,-44.4],[-71.8,-43.4],[-71.6,-42.1],[-71.8,-41],[-71.6,-39.6],[-71.1,-38.2],[-71.2,-37.2],[-70.5,-36.1],[-70,-35],[-69.9,-33.9],[-70.1,-32.8],[-70.2,-31.4],[-69.9,-30.3],[-69.6,-29],[-68.9,-27.9],[-68.3,-26.9],[-68.6,-26.2],[-68.3,-25.1],[-67.4,-24],[-67,-23]];
const AR_TDF=[[-68.6,-52.65],[-68.6,-54.9],[-67.2,-55],[-66.1,-55],[-65.2,-54.7],[-65.8,-54.4],[-66.6,-54],[-67.6,-53.3],[-68.2,-52.9]];
/* Islas Malvinas: Gran Malvina (oeste) y Soledad (este), con sus bahías */
const AR_ISL=[[[-61.35,-51.25],[-60.6,-51.2],[-59.95,-51.35],[-60.15,-51.7],[-59.85,-51.95],[-60.25,-52.2],[-60.85,-52.15],[-61.2,-51.85],[-60.95,-51.6]],
  [[-59.3,-51.42],[-58.6,-51.3],[-57.85,-51.45],[-57.72,-51.7],[-58.2,-51.78],[-58.05,-52.05],[-58.65,-52.25],[-59.2,-52.1],[-59.05,-51.8],[-59.4,-51.62]]];
const ZONES=[
 {id:'ba',name:'Llanura del Ombú',short:'El Ombú',prov:'Provincia de Buenos Aires, CABA y La Pampa',need:0,col:'#c9a227',lab:[-61,-36.9],
  cut:[[-58.4,-34],[-60.3,-33.3],[-61.9,-34.3],[-63.4,-34.6],[-63.4,-35],[-65.2,-35],[-65.2,-35.6],[-66.6,-35.6],[-68,-37.6],[-68.3,-38],[-64,-39.4],[-62.9,-40.8],[-62,-41.5],[-50,-41.5],[-50,-34]]},
 {id:'litoral',name:'Tierra del Chamamé',short:'Chamamé',prov:'Santa Fe, Entre Ríos, Corrientes y Misiones',need:150,col:'#3f8f6b',lab:[-59.3,-30.6],
  cut:[[-61.7,-28],[-59.4,-28],[-58.7,-27.4],[-57,-27.2],[-57,-21],[-50,-21],[-50,-34],[-58.4,-34],[-60.3,-33.3],[-61.9,-34.3],[-61.9,-28]]},
 {id:'centro',name:'Sierras del Cuarteto',short:'Cuarteto',prov:'Córdoba',need:350,col:'#b5622f',lab:[-63.9,-32.4],
  cut:[[-65.6,-30],[-61.7,-30],[-61.9,-30],[-61.9,-34.3],[-63.4,-34.6],[-63.4,-35],[-65.2,-35],[-65.2,-33.8],[-65.8,-31.9]]},
 {id:'cuyo',name:'Valles de la Vendimia',short:'Vendimia',prov:'Mendoza, San Juan y San Luis',need:600,col:'#7b2f4a',lab:[-68.4,-33.4],
  cut:[[-75,-28.5],[-69,-28.5],[-66.8,-31.9],[-65.8,-31.9],[-65.2,-33.8],[-65.2,-35.6],[-66.6,-35.6],[-68,-37.6],[-70.4,-36.4],[-75,-36.4]]},
 {id:'noa',name:'Cerros de Siete Colores',short:'Siete Colores',prov:'Jujuy, Salta, Tucumán, Catamarca, La Rioja y Santiago del Estero',need:900,col:'#c4532d',lab:[-66,-26.6],
  cut:[[-75,-21],[-62.3,-21],[-62.3,-25.7],[-61.7,-25.7],[-61.7,-30],[-65.6,-30],[-66.8,-31.9],[-69,-28.5],[-75,-28.5]]},
 {id:'nea',name:'Monte Impenetrable',short:'Impenetrable',prov:'Chaco y Formosa',need:1250,col:'#5b7d2a',lab:[-60.5,-25.6],
  cut:[[-62.3,-21],[-57,-21],[-57,-27.2],[-58.7,-27.4],[-59.4,-28],[-61.7,-28],[-61.7,-25.7],[-62.3,-25.7]]},
 {id:'patagonia',name:'Tierra del Viento',short:'Tierra del Viento',prov:'Neuquén, Río Negro, Chubut y Santa Cruz',need:1650,col:'#3f6f8f',lab:[-68.8,-45.2],
  cut:[[-75,-36.4],[-70.4,-36.4],[-68,-37.6],[-68.3,-38],[-64,-39.4],[-62.9,-40.8],[-62,-41.5],[-50,-41.5],[-50,-50.6],[-62,-50.6],[-62,-52.45],[-75,-52.45]]},
 {id:'tdf',name:'El Último Faro',short:'Último Faro',prov:'Tierra del Fuego',need:2100,col:'#6d8fa8',lab:[-66.6,-53.9],
  cut:[[-75,-52.45],[-50,-52.45],[-50,-60],[-75,-60]]},
 {id:'malvinas',name:'Islas del Pingüino',short:'Malvinas',prov:'Islas Malvinas, Gran Malvina y Soledad',need:2600,col:'#4f7d8a',lab:[-59.6,-50.55],
  cut:[[-62,-50.6],[-50,-50.6],[-50,-52.45],[-62,-52.45]]},
];
const ZM=Object.fromEntries(ZONES.map(z=>[z.id,z]));
const RIVALS=[
 ['ba','Tito, de Mataderos','tachero','facil',20],['ba','Marta, de Chascomús','dona','facil',70],['ba','Vicky, de Mar del Plata','hincha','medio',120],['ba','Don Aurelio, de Areco','veterano','medio',200,1],
 ['litoral','Nacho, de Rosario','estudiante','facil',170],['litoral','Doña Chela, de Corrientes','abuela','medio',230],['litoral','Pocho, de Paraná','asador','medio',290],['litoral','Ramón Silva, de Goya','gaucho','medio',400,1],
 ['centro','Fer, de Carlos Paz','fisura','medio',370],['centro','Quique, de Córdoba','rolinga','medio',430],['centro','Mirta, de Alta Gracia','dona','medio',500],['centro','Doña Rosa, de Cruz del Eje','abuela','dificil',650,1],
 ['cuyo','Lucas, de Mendoza','cheto','medio',620],['cuyo','Don Cirilo, de San Juan','veterano','medio',700],['cuyo','Agus, de San Luis','estudiante','dificil',790],['cuyo','Bautista Funes, de Maipú','asador','dificil',950,1],
 ['noa','Ernesto, de Tilcara','mochilero','medio',920],['noa','Rosario, de Santiago del Estero','hippie','dificil',1010],['noa','Don Segundo, de Cafayate','gaucho','dificil',1110],['noa','Facundo, el payador de Salta','tanguero','dificil',1300,1],
 ['nea','Coco, de Resistencia','godin','medio',1270],['nea','Mabel, de Formosa','dona','dificil',1370],['nea','El Pescador de Clorinda','mochilero','dificil',1470],['nea','Don Gauna, del Impenetrable','veterano','dificil',1700,1],
 ['patagonia','Julieta, de Bariloche','influencer','dificil',1670],['patagonia','Tomás, de Neuquén','cheto','dificil',1780],['patagonia','Doña Elba, de Trelew','abuela','dificil',1900],['patagonia','El Esquilador de Río Gallegos','gaucho','dificil',2150,1],
 ['malvinas','Juana, de Puerto Argentino','hincha','dificil',2580],['malvinas','El Ovejero de Gran Malvina','gaucho','dificil',2700],['malvinas','Don Ramiro, de Bahía Fox','veterano','dificil',2820],['malvinas','El Guardián de las Islas','tanguero','dificil',3100,1],
 ['tdf','Lalo, de Río Grande','fisura','dificil',2120],['tdf','Marina, de Ushuaia','hippie','dificil',2250],['tdf','El Farero de Ushuaia','tanguero','dificil',2380],['tdf','La Leyenda del Último Faro','veterano','dificil',2600,1],
].map(([zone,name,av,diff,copas,boss],i)=>{const skill=Math.min(1,Math.max(.05,copas/2400+(boss?.08:0)));return{id:'r'+i,zone,name,av,copas,boss:!!boss,skill,diff:skill<.3?'facil':skill<.65?'medio':'dificil'}});
const stars=k=>{const n=Math.max(1,Math.min(5,Math.round(k*5)));return '★'.repeat(n)+'☆'.repeat(5-n)};
const RM=Object.fromEntries(RIVALS.map(r=>[r.id,r]));
const TITLES=[[0,'Pichón'],[150,'Aprendiz de pulpería'],[350,'Baqueano'],[600,'Truquero de ley'],[900,'Taita'],[1250,'Gaucho mayor'],[1650,'Maestro del truco'],[2100,'Leyenda del Último Faro'],[2600,'Guardián de las Islas']];
const titleOf=c=>{let t=TITLES[0][1];for(const [n,l] of TITLES)if(c>=n)t=l;return t};
const zoneOpen=z=>(WAL.copas||0)>=z.need;
let giraZone='ba',CAMP=null;
function copasDelta(my,rv,won){const exp=1/(1+Math.pow(10,(rv-my)/400));let d=Math.round(36*((won?1:0)-exp));if(won)d=Math.max(6,Math.min(40,d));else d=Math.min(-4,Math.max(-28,d));return d}
/* La Huella: mapa dibujado como una carta antigua, en papel, con lápiz de color y tinta */
const MAPICO={
  ba:'<path d="M0 6V1M0 1C-6 1-7-4-3-6C-3-9 3-9 3-6C7-4 6 1 0 1Z" /><path d="M-6 6H6"/>',
  litoral:'<path d="M-7 2Q-3.5-1 0 2T7 2M-7 5Q-3.5 2 0 5T7 5"/><path d="M-2-1V-7M-2-7Q-5-6-6-8M-2-7Q1-6 2-8M-2-7Q-3-9-1-10"/>',
  centro:'<path d="M-8 5L-3-3L0 1L3-4L8 5Z"/>',
  cuyo:'<circle cx="-2" cy="0" r="1.6"/><circle cx="1.4" cy="0" r="1.6"/><circle cx="-.4" cy="3" r="1.6"/><circle cx="-3.4" cy="-3" r="1.6"/><circle cx=".2" cy="-3" r="1.6"/><path d="M-1.5-4.6Q0-8 3-8"/>',
  noa:'<path d="M-8 5L-1-5L6 5Z"/><path d="M-6 2.2H4.2M-4.2-.4H2.4M-2.6-3H.8"/>',
  nea:'<path d="M0 6V-1M0-1C-5-1-6-6-2-7C-1-10 4-9 3-6C7-5 5-1 0-1Z"/><path d="M-3 6H3"/>',
  patagonia:'<path d="M-7-3Q0-6 4-3T7-1M-8 1Q-1-2 3 1T8 3M-6 5Q0 2 4 5"/>',
  tdf:'<path d="M-2 6L-1.4-4H1.4L2 6Z"/><path d="M-2.2-4H2.2L1.6-6H-1.6Z"/><path d="M2.6-5.4L7-7M2.6-4.6L7-3"/>',
  malvinas:'<path d="M0-7C-3-7-4-3-3.6 1C-3.4 4-2 6.4 0 6.4S3.4 4 3.6 1C4-3 3-7 0-7Z"/><path d="M-1.4-1C-2 1-1.6 4 0 5.2C1.6 4 2-1 1.4-1"/><path d="M.6-5.4L3.4-4.6L.8-4"/><path d="M-2 6.6H-.4M.4 6.6H2"/>'};
const ANDES=[[-66.2,-22.6],[-67.6,-24.4],[-68.4,-26.3],[-69,-28.1],[-69.6,-29.9],[-70,-31.7],[-70.1,-33.4],[-70.2,-35.2],[-70.6,-37],[-71,-38.8],[-71.3,-40.6],[-71.6,-42.4],[-71.8,-44.2],[-72.1,-46],[-72.5,-47.8],[-73,-49.6]];
function mapSVG(){const main=pathOf(AR_MAIN),tdf=pathOf(AR_TDF),isl=AR_ISL.map(pathOf).join(''),land=main+tdf+isl;
  let o=`<svg class="armap" viewBox="-18 -14 236 440" role="img" aria-label="Mapa de la Argentina por zonas"><defs><clipPath id="arclip"><path d="${land}"/></clipPath>
    <pattern id="lockhatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#e3d6b6"/><path d="M0 0v4" stroke="#8b7a63" stroke-width=".7"/></pattern>
    <pattern id="mar" width="16" height="9" patternUnits="userSpaceOnUse"><path d="M0 4.5q4-3.4 8 0t8 0" stroke="#6f93b3" stroke-width=".55" fill="none" opacity=".55"/></pattern>
    <radialGradient id="mapvig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5a3d1e" stop-opacity=".28"/></radialGradient></defs>
    <rect x="-18" y="-14" width="236" height="440" rx="6" fill="#efe4c8"/><rect x="-18" y="-14" width="236" height="440" rx="6" fill="#fff" filter="url(#fGrano)" opacity=".35"/>
    <rect x="-8" y="-4" width="216" height="420" fill="url(#mar)"/>
    <text x="150" y="250" class="mar" transform="rotate(-70 150 250)">Mar Argentino</text>
    <text x="-6" y="150" class="mar sm" transform="rotate(-82 -6 150)">Cordillera de los Andes</text>
    <path d="${land}" fill="#5a3d1e" opacity=".22" transform="translate(1.6 2.2)"/>
    <path d="${land}" fill="#f3e9cf"/>
    <g transform="rotate(32 100 206)" filter="url(#fLapiz)"><g transform="rotate(-32 100 206)" clip-path="url(#arclip)">`;
  for(const z of ZONES){const open=zoneOpen(z);o+=`<path d="${pathOf(z.cut)}" fill="${open?z.col:'url(#lockhatch)'}" fill-opacity="${open?.78:1}"/>`}
  o+=`</g></g><g clip-path="url(#arclip)">`;
  for(const z of ZONES){const sel=giraZone===z.id;o+=`<path d="${pathOf(z.cut)}" fill="transparent" stroke="#3b2c1f" stroke-opacity=".55" stroke-width=".6" stroke-dasharray="2.2 1.2" data-a="zone" data-id="${z.id}" class="zp ${sel?'sel':''}" tabindex="0" aria-label="${z.name}${zoneOpen(z)?'':' (bloqueada)'}"/>`}
  o+=`</g><path d="${land}" fill="none" stroke="#2f2218" stroke-width="1.1" stroke-linejoin="round"/>`;
  /* la cordillera, con trazos de tinta */
  o+=`<g fill="none" stroke="#4a3626" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round" opacity=".8" pointer-events="none">${ANDES.map(p=>{const [x,y]=prj(p).map(Number);return `<path d="M${x-3.4} ${y+2.4}L${x} ${y-2.6}L${x+3.4} ${y+2.4}M${x-.6} ${y-1.4}L${x+1.2} ${y+.4}"/>`}).join('')}</g>`;
  for(const z of ZONES){const [x,y]=prj(z.lab).map(Number),open=zoneOpen(z),sel=giraZone===z.id;
    o+=`<g class="zl ${open?'':'lock'} ${sel?'sel':''}" pointer-events="none"><g transform="translate(${x} ${y-12}) scale(.9)" class="zi">${MAPICO[z.id]||''}</g><text x="${x}" y="${y}" text-anchor="middle">${z.short||z.name}</text>${open?'':`<text x="${x}" y="${y+7.5}" text-anchor="middle" class="need">faltan ${fmt(Math.max(0,z.need-(WAL.copas||0)))} porotos</text>`}</g>`}
  /* rosa de los vientos */
  o+=`<g transform="translate(176 372)" class="rosa" pointer-events="none"><circle r="15" fill="none" stroke="#4a3626" stroke-width=".5"/><circle r="11" fill="none" stroke="#4a3626" stroke-width=".35" stroke-dasharray="1 1.2"/>
    <path d="M0-17L3 0L0 17L-3 0Z" fill="#4a3626"/><path d="M-17 0L0-3L17 0L0 3Z" fill="#4a3626" opacity=".75"/><path d="M0-17L3 0H-3Z" fill="#b0261c"/><path d="M-9-9L1.5-1.5M9-9L-1.5-1.5M-9 9L1.5 1.5M9 9L-1.5 1.5" stroke="#4a3626" stroke-width=".5"/><text y="-20" text-anchor="middle">N</text></g>`;
  const cur=[...ZONES].reverse().find(zoneOpen)||ZONES[0];const [px,py]=prj(cur.lab).map(Number);
  o+=`<g transform="translate(${px+12} ${py-6})" pointer-events="none"><path d="M0 9C-5 3-5-3 0-4S5 3 0 9Z" fill="#b0261c" stroke="#2f2218" stroke-width=".7"/><circle cy="-.5" r="1.8" fill="#f3e9cf"/></g>`;
  o+=`<rect x="-15" y="-11" width="230" height="434" rx="4" fill="none" stroke="#4a3626" stroke-width=".8"/><rect x="-12.5" y="-8.5" width="225" height="429" rx="3" fill="none" stroke="#4a3626" stroke-width=".35"/>
    <rect x="-18" y="-14" width="236" height="440" rx="6" fill="url(#mapvig)" pointer-events="none"/>`;
  return o+'</svg>'}
function rivalCard(r){const open=zoneOpen(ZM[r.zone]),wins=(WAL.gira&&WAL.gira.beat[r.id])||0;const my=WAL.copas||0;
  const win=copasDelta(my,r.copas,true),lose=copasDelta(my,r.copas,false);
  return `<li class="rv ${r.boss?'boss':''}">${avatarSVG(r.av,46)}<div class="rvi"><b>${esc(r.name)}</b><small>${r.boss?'Jefe de la zona · Premio: '+esc(prizeLabel(BOSS_PRIZE[r.zone]))+' · ':''}<span class="stars" aria-label="Nivel ${Math.round(r.skill*5)} de 5">${stars(r.skill)}</span> · ${r.boss?'a 30':'a 15'}</small>
    <small><span class="cup"><i class="poroto" aria-hidden="true"></i>${fmt(r.copas)}</span> · <span title="Si ganás / si perdés">+${win} / ${lose}</span>${wins?` · ✓ ${wins}`:''}</small></div>
    <button class="btn ${r.boss?'prim':'brass'} sm" data-a="girago" data-id="${r.id}" ${open?'':'disabled'}>Jugar</button></li>`}
function giraHTML(){const c=WAL.copas||0,z=ZM[giraZone]||ZONES[0],open=zoneOpen(z);const next=ZONES.find(x=>!zoneOpen(x));
  const prevNeed=next?((ZONES[ZONES.indexOf(next)-1]||{need:0}).need):0;const pct=next?Math.round((c-prevNeed)*100/Math.max(1,next.need-prevNeed)):100;
  const zi=ZONES.indexOf(z),zp=ZONES[(zi+ZONES.length-1)%ZONES.length],zn=ZONES[(zi+1)%ZONES.length],nR=RIVALS.filter(r=>r.zone===z.id).length;
  const wide=innerWidth>=720;
  const zhd=`<div class="zhd"><button type="button" class="pgb" data-a="zone" data-id="${zp.id}" data-keep="1" aria-label="Zona anterior: ${esc(zp.name)}">‹</button><div><h3>${open?'':'🔒︎ '}${esc(z.name)}</h3><small>${esc(z.prov)}${open?'':` · se abre con ${fmt(z.need)} porotos`}</small></div><button type="button" class="pgb" data-a="zone" data-id="${zn.id}" data-keep="1" aria-label="Zona siguiente: ${esc(zn.name)}">›</button></div>`;
  const tit=`<section class="box gtit"><div class="gtl"><small class="tag">Tu título</small><b class="gt">${esc(titleOf(c))}</b></div>
      ${next?`<div class="bar"><i style="width:${Math.max(3,Math.min(100,pct))}%"></i></div><p class="note" style="margin:0">Te faltan <b>${fmt(next.need-c)}</b> porotos para abrir ${esc(next.name)}.</p>`:'<p class="note" style="margin:0">Abriste todo el país. ¡Sos leyenda!</p>'}</section>`;
  return phd('La Huella',`<button type="button" class="pill cuppill" data-a="ov" data-v="tabla" aria-label="Ver la tabla nacional"><i class="poroto" aria-hidden="true"></i>${fmt(c)} porotos</button>`)+`<div class="glay ${wide?'wide':''}">
    <div class="mapwrap">${mapSVG()}</div>
    ${wide?`<div class="gside">${tit}<section class="box zbox grow" style="border-color:${open?z.col:'var(--line)'}">${zhd}${giraRivalsHTML(z)}</section></div>`
      :`${tit}<section class="box zbar" style="border-color:${open?z.col:'var(--line)'}">${zhd}<button type="button" class="btn ${open?'prim':''}" data-a="ov" data-v="rivales">Ver los ${nR} rivales de ${esc(z.short||z.name)}</button></section>`}</div>`}
function giraRivalsHTML(z){return fitList('riv-'+z.id,RIVALS.filter(r=>r.zone===z.id),rivalCard,'rvl')+(WAL.gira&&WAL.gira.bosses.includes(z.id)?`<p class="note" style="margin:0">★ Ya le ganaste al jefe de ${esc(z.name)}.</p>`:'')}
function rivalesHTML(){const z=ZM[giraZone]||ZONES[0],open=zoneOpen(z);return `<div class="over" data-a="close"><div class="panel lpanel rpanel" data-stop style="border-color:${open?z.col:'var(--line)'}"><h2>${esc(z.name)}</h2><p class="note" style="margin:0">${esc(z.prov)}${open?'':` · se abre con ${fmt(z.need)} porotos`}</p>${giraRivalsHTML(z)}<button class="btn ghost" data-a="close">Volver al mapa</button></div></div>`}
function tablaHTML(){const c=WAL.copas||0;const table=RIVALS.map(r=>({n:r.name,c:r.copas,av:r.av})).concat({n:myDisp()+' (vos)',c,av:myAv(),me:1}).sort((a,b)=>b.c-a.c);const myPos=table.findIndex(x=>x.me);
  const win=table.slice(Math.max(0,myPos-3),myPos+4);
  return `<div class="over" data-a="close"><div class="panel lpanel" data-stop><h2>Tabla nacional</h2><p class="note" style="margin:0">Vas ${myPos+1}.º de ${table.length}.</p><ol class="lb">${win.map(x=>`<li class="${x.me?'me':''}"><span class="pos">${table.indexOf(x)+1}</span>${avatarSVG(x.av,30)}<span class="nm">${esc(x.n)}</span><b>${fmt(x.c)}</b></li>`).join('')}</ol><button class="btn ghost" data-a="close">Cerrar</button></div></div>`}
function startGira(rid){const r=RM[rid];if(!r||!zoneOpen(ZM[r.zone]))return;TUT=null;mySena=null;
  CAMP={rid,before:WAL.copas||0};cfg={n:2,target:r.boss?30:15,stake:0,diff:r.diff,flor:SET.hflor!==false};
  botLooks={1:{av:r.av,dorso:['pampa','cuero','marino','noche','celeste','oro','fileteado','bordo','viento'][ZONES.findIndex(z=>z.id===r.zone)]||'pampa'}};
  mode='offline';mySeat=0;view='game';confirmExit=false;panel=null;
  const gm=newMatch({...cfg,seats:[{me:true},{bot:true}],matchId:'gira-'+rid+'-'+Date.now().toString(36)});gm.skill=r.skill;setG(gm);render();drive()}
function settleGira(g){if(!CAMP||!g.matchOver||CAMP.done===g.matchId)return;const C=CAMP;C.done=g.matchId;const r=RM[C.rid];const won=g.matchOver.winner===0;
  const my=WAL.copas||0,d=copasDelta(my,r.copas,won);const opened0=ZONES.filter(zoneOpen).map(z=>z.id);
  walQ=walQ.then(async()=>{if(WAL.applied.includes('gira-'+g.matchId))return;WAL.applied=WAL.applied.concat('gira-'+g.matchId).slice(-80);
    WAL.copas=Math.max(0,my+d);WAL.gira=WAL.gira||{beat:{},bosses:[]};let bonus=0;
    let prize=null;if(won){WAL.gira.beat[r.id]=(WAL.gira.beat[r.id]||0)+1;if(r.boss&&!WAL.gira.bosses.includes(r.zone)){WAL.gira.bosses.push(r.zone);bonus=100;WAL.coins+=bonus;WAL.stats.earned+=bonus;prize=BOSS_PRIZE[r.zone]}}
    const newly=ZONES.filter(z=>zoneOpen(z)&&!opened0.includes(z.id));
    C.res={d,bonus,newly:newly.map(z=>z.name),name:r.name,prize};
    renderWallet();await saveWallet();writeLooks();render()})}
function giraOverHTML(){if(!CAMP||!CAMP.res)return'';const x=CAMP.res;
  return `<p class="big"><i class="poroto" aria-hidden="true"></i>${x.d>0?'+':''}${x.d} porotos</p>${x.bonus?`<p class="big">${coinI}+ ${x.bonus} por vencer al jefe</p>`:''}${x.prize?`<p class="unlock">¡Ganaste ${esc(prizeLabel(x.prize))}!</p><p class="note">Lo encontrás en la Tienda, listo para usar.</p>`:''}${x.newly.length?`<p class="unlock">¡Se abrió ${esc(x.newly.join(' y '))}!</p>`:''}`}




/* ---------- música de fondo: zamba, milonga, tango, chamamé y chacarera (sintetizadas, originales) ---------- */
const MSR=22050;
const midiF=m=>440*Math.pow(2,(m-69)/12);
function kit(seconds){const SR=MSR,N=Math.floor(SR*seconds),out=new Float32Array(N);const add=(i,v)=>{out[((i%N)+N)%N]+=v};
  const K={out,N,SR,
    pluck(t,m,vel,dur,soft=.45){const f=midiF(m),p=Math.max(2,Math.round(SR/f)),buf=new Float32Array(p);let lp=0;
      for(let i=0;i<p;i++){const x=Math.random()*2-1;lp+=(x-lp)*soft;buf[i]=lp}
      const s0=Math.round(t*SR),len=Math.round(dur*SR);let idx=0;
      for(let i=0;i<len;i++){const a=buf[idx],b=buf[(idx+1)%p];buf[idx]=(a+b)*.4985;idx=(idx+1)%p;add(s0+i,a*vel*(i<30?i/30:1)*(i>len-2000?(len-i)/2000:1))}},
    parche(t,v){const s0=Math.round(t*SR);for(let i=0;i<SR*.55;i++){const tt=i/SR,f=52+40*Math.exp(-tt*18);add(s0+i,v*Math.sin(2*Math.PI*f*tt)*Math.exp(-tt*7.5)+(i<220?v*.35*(Math.random()*2-1)*(1-i/220):0))}},
    aro(t,v){const s0=Math.round(t*SR);let lp=0,prev=0;for(let i=0;i<SR*.07;i++){const tt=i/SR,x=Math.random()*2-1;lp+=(x-lp)*.5;const hp=lp-prev;prev=lp;add(s0+i,v*(hp*.9+Math.sin(2*Math.PI*880*tt)*.5)*Math.exp(-tt*70))}},
    chasquido(t,v){const s0=Math.round(t*SR);let lp=0,prev=0;for(let i=0;i<SR*.05;i++){const tt=i/SR,x=Math.random()*2-1;lp+=(x-lp)*.35;const hp=lp-prev;prev=lp;add(s0+i,v*hp*2*Math.exp(-tt*90))}},
    quena(t,m,dur,v){const f=midiF(m),s0=Math.round(t*SR),len=Math.round(dur*SR);let ph=0,lp=0;
      for(let i=0;i<len;i++){const tt=i/SR,vib=tt>.22?1+.006*Math.sin(2*Math.PI*5.2*tt):1;ph+=2*Math.PI*f*vib/SR;
        const atk=Math.min(1,tt/.09),rel=Math.min(1,(len-i)/(SR*.12));lp+=((Math.random()*2-1)-lp)*.08;add(s0+i,v*atk*rel*(Math.sin(ph)+.18*Math.sin(2*ph)+.06*Math.sin(3*ph)+lp*.35))}},
    /* lengüeta: bandoneón y acordeón (det = desafinado musette) */
    reed(t,m,dur,v,o={}){const f=midiF(m),s0=Math.round(t*SR),len=Math.round(dur*SR),H=o.h||7,det=o.det||0,trem=o.trem||0,atk=o.atk||.035;const ph=[0,0];
      for(let i=0;i<len;i++){const tt=i/SR;const bell=1+(trem?trem*Math.sin(2*Math.PI*4.5*tt):0);let s=0;
        for(let vo=0;vo<(det?2:1);vo++){ph[vo]+=2*Math.PI*f*(1+(vo?det:0))/SR;for(let k=1;k<=H;k++)s+=Math.sin(k*ph[vo])*(k%2?1:.55)/k}
        const env=Math.min(1,tt/atk)*Math.min(1,(len-i)/(SR*.11));add(s0+i,v*env*bell*s*.5)}},
    violin(t,m,dur,v){const f=midiF(m),s0=Math.round(t*SR),len=Math.round(dur*SR);let ph=0;
      for(let i=0;i<len;i++){const tt=i/SR,vib=tt>.12?1+.007*Math.sin(2*Math.PI*5.8*tt):1;ph+=2*Math.PI*f*vib/SR;let s=0;for(let k=1;k<=9;k++)s+=Math.sin(k*ph)/k*(k===2?.7:1);
        const env=Math.min(1,tt/.06)*Math.min(1,(len-i)/(SR*.11));add(s0+i,v*env*s*.45)}},
    bass(t,m,dur,v){const f=midiF(m),s0=Math.round(t*SR),len=Math.round(dur*SR);for(let i=0;i<len;i++){const tt=i/SR,ph=2*Math.PI*f*tt;
      add(s0+i,v*(Math.sin(ph)+.3*Math.sin(2*ph)+.12*Math.sin(3*ph))*Math.exp(-tt*4.2)*Math.min(1,i/40)*Math.min(1,(len-i)/400))}},
    strum(t,notes,vel,dur,gap=.012){notes.forEach((m,k)=>K.pluck(t+k*gap,m,vel,dur))},
    /* mezcla final: un eco corto para el cuerpo, sala con cola que da la vuelta (sin corte al repetir) y un compresor suave */
    finish(echo=[[.13,.22],[.21,.14]],peak=.82){const cp=out.slice();const e1=echo[0];const ds=Math.round(SR*e1[0]);for(let i=0;i<N;i++)out[i]+=cp[(i-ds+N)%N]*e1[1]*.5;
      const r=reverb(out,SR,{mix:.3,room:.86,damp:.28,loop:true});
      let mx=0,rs=0;for(let i=0;i<N;i++){mx=Math.max(mx,Math.abs(r[i]));rs+=r[i]*r[i]}rs=Math.sqrt(rs/N);const g=Math.min(.95/Math.max(mx,.001),.15/Math.max(rs,.0001));
      const k=1.6,tk=Math.tanh(k);for(let i=0;i<N;i++)out[i]=Math.tanh(r[i]*g*k)/tk*.9;return out}};
  return K}
/* tercera diatónica por debajo, para segundas voces */
function third(m,pcs){for(let d=3;d<=4;d++){const x=m-d;if(pcs.includes(((x%12)+12)%12))return x}return m-3}
const TRACKS={
 zamba:{name:'Zamba',desc:'La menor · guitarra, bombo y quena',render(){const E=.36,BAR=6*E,K=kit(BAR*8);
   const CH=[[45,57,60,64],[50,57,62,65],[43,55,59,62],[48,55,60,64],[41,57,60,65],[50,57,62,65],[40,56,59,64],[45,57,60,64]];
   for(let b=0;b<8;b++){const t0=b*BAR,c=CH[b];[c[0],c[1],c[2],c[3],c[2],c[1]].forEach((m,k)=>K.pluck(t0+k*E+(k?Math.random()*.012:0),m,k===0?.55:.32,k===0?BAR*1.3:E*4));
     [c[1],c[2],c[3],c[3]+12].forEach((m,k)=>K.pluck(t0+3*E+k*.014,m,.16,E*2.8));K.aro(t0+3*E,.05);K.parche(t0,.42);K.aro(t0+2*E,.13);K.parche(t0+3*E,.22);K.aro(t0+5*E,.1)}
   [[12,3,71],[15,1,69],[16,2,67],[18,4,76],[22,1,74],[23,1,72],[24,3,72],[27,2,69],[29,1,72],[30,2,74],[32,1,77],[33,1,76],[34,2,74],[36,3,71],[39,1,68],[40,1,71],[41,1,74],[42,2,72],[44,1,71],[45,3,69]].forEach(([s,d,m])=>K.quena(s*E,m,d*E+.12,.11));
   return K.finish()}},
 milonga:{name:'Milonga',desc:'Mi menor · guitarra en 3-3-2 y bandoneón',render(){const E=.357,BAR=8*E,K=kit(BAR*8);
   const CH=[[40,47,[55,59,64]],[45,52,[57,60,64]],[47,42,[57,59,63]],[40,47,[55,59,64]],[48,43,[55,60,64]],[45,52,[57,60,64]],[47,42,[57,59,63]],[40,47,[55,59,64]]];
   for(let b=0;b<8;b++){const t0=b*BAR,[r,f,tri]=CH[b];K.pluck(t0,r,.6,E*3);K.pluck(t0+3*E,f,.45,E*3);K.pluck(t0+6*E,r,.5,E*2);
     K.strum(t0+2*E,tri,.18,E*3,.02);K.strum(t0+5*E,tri,.16,E*3,.02);K.pluck(t0+7*E,tri[2],.14,E*2)}
   [[2,2,67],[4,2,71],[6,2,69],[8,3,72],[11,1,71],[12,2,69],[14,2,67],[16,3,66],[19,1,67],[20,2,69],[22,2,63],[24,6,64],[32,2,67],[34,2,72],[36,2,76],[38,2,74],[40,3,72],[43,1,71],[44,4,69],[48,2,71],[50,2,69],[52,2,67],[54,2,66],[56,6,64]]
     .forEach(([s,d,m])=>K.reed(s*E,m,d*E+.1,.05,{h:6,trem:.06,atk:.08}));
   return K.finish([[.15,.2],[.27,.12]])}},
 tango:{name:'Tango',desc:'Re menor · marcato, contrabajo y bandoneón',render(){const Q=.517,BAR=4*Q,K=kit(BAR*8);
   const CH={Dm:[38,[57,62,65]],A7:[45,[55,61,64]],Gm:[43,[55,58,62]],E7:[40,[56,62,64]]};
   const PROG=[['Dm','Dm'],['Dm','Dm'],['A7','A7'],['A7','A7'],['Gm','Gm'],['Dm','Dm'],['E7','A7'],['Dm','Dm']];
   for(let b=0;b<8;b++){const t0=b*BAR;for(let q=0;q<4;q++){const c=CH[PROG[b][q<2?0:1]];const acc=q===0||q===2;
       K.bass(t0+q*Q,c[0]+(q===2&&PROG[b][0]===PROG[b][1]?7:0),Q*1.02,acc?.5:.3);
       c[1].forEach(m=>K.reed(t0+q*Q,m,acc?.38:.3,acc?.045:.03,{h:7,atk:.012}))}
     if(b%2===1){const nb=CH[PROG[(b+1)%8][0]][0];[nb-3,nb-2,nb-1].forEach((m,k)=>K.bass(t0+3.25*Q+k*Q*.25,m,Q*.22,.25))}}
   [[0,1.5,69],[1.5,.5,70],[2,1,69],[3,1,65],[4,3,62],[7,1,64],[8,1,65],[9,1,67],[10,1,69],[11,1,73],[12,3,76],[15,1,74],[16,1.5,74],[17.5,.5,72],[18,1,70],[19,1,67],[20,2,69],[22,1,65],[23,1,62],[24,1,68],[25,1,71],[26,1,73],[27,1,76],[28,3,74]]
     .forEach(([s,d,m])=>K.reed(s*Q,m,d*Q+.1,.06,{h:7,trem:.08,atk:.05}));
   return K.finish([[.11,.18],[.19,.1]])}},
 chamame:{name:'Chamamé',desc:'La mayor · acordeón a dos voces y guitarra',render(){const E=.27,BAR=6*E,K=kit(BAR*8);
   const CH={A:[45,52,[57,61,64]],E7:[40,47,[56,59,62]],D:[50,45,[57,62,66]]};const PROG=['A','E7','A','D','A','E7','E7','A'];
   for(let b=0;b<8;b++){const t0=b*BAR,[r,f,tri]=CH[PROG[b]];K.pluck(t0,r,.55,E*3.4);K.strum(t0+2*E,tri,.2,E*1.8,.01);K.pluck(t0+3*E,f,.42,E*3.4);K.strum(t0+5*E,tri,.18,E*1.8,.01);K.chasquido(t0+5*E,.05)}
   const pcs=[9,11,1,2,4,6,8];
   [[0,2,76],[2,1,73],[3,2,69],[5,1,73],[6,2,74],[8,1,71],[9,2,68],[11,1,71],[12,3,73],[15,1,76],[16,1,78],[17,1,76],[18,2,74],[20,1,78],[21,3,78],[24,2,76],[26,1,73],[27,2,69],[29,1,71],[30,2,73],[32,1,71],[33,2,68],[35,1,64],[36,2,71],[38,1,74],[39,2,76],[41,1,74],[42,4,73],[46,2,69]]
     .forEach(([s,d,m])=>{K.reed(s*E,m,d*E+.09,.045,{h:6,det:.004,atk:.03});K.reed(s*E,third(m,pcs),d*E+.09,.03,{h:6,det:.004,atk:.03})});
   return K.finish([[.12,.18],[.2,.1]])}},
 chacarera:{name:'Chacarera',desc:'Re menor · violín, rasguido y bombo',render(){const E=.2,BAR=6*E,K=kit(BAR*8);
   const CH={Dm:[50,[57,62,65,69]],A7:[45,[55,61,64,69]],C:[48,[55,60,64,67]],F:[41,[57,60,65,69]]};const PROG=['Dm','A7','Dm','C','F','C','A7','Dm'];
   for(let b=0;b<8;b++){const t0=b*BAR,[r,ch]=CH[PROG[b]];K.pluck(t0,r,.45,E*6.2);
     K.strum(t0,ch,.24,E*2.4);K.strum(t0+E,ch.slice().reverse(),.12,E*2,.008);K.chasquido(t0+2*E,.12);K.strum(t0+3*E,ch,.2,E*2.4);K.strum(t0+4*E,ch.slice().reverse(),.11,E*2,.008);K.chasquido(t0+5*E,.12);
     K.parche(t0,.45);K.aro(t0+E,.11);K.aro(t0+2*E,.13);K.parche(t0+3*E,.3);K.aro(t0+4*E,.11);K.aro(t0+5*E,.15)}
   [[0,1,69],[1,1,74],[2,1,77],[3,2,76],[5,1,74],[6,3,73],[9,1,76],[10,1,73],[11,1,69],[12,1,74],[13,1,77],[14,1,81],[15,2,79],[17,1,77],[18,3,76],[21,1,72],[22,1,76],[23,1,79],[24,2,81],[26,1,77],[27,2,72],[29,1,77],[30,2,76],[32,1,72],[33,2,67],[35,1,72],[36,1,73],[37,1,76],[38,1,79],[39,2,77],[41,1,76],[42,3,74],[45,1,69],[46,2,74]]
     .forEach(([s,d,m])=>K.violin(s*E,m,d*E+.08,.055));
   return K.finish([[.1,.16],[.17,.1]])}},
};
const TRACK_IDS=Object.keys(TRACKS);
function wavURLRate(s,rate){const n=s.length,buf=new ArrayBuffer(44+n*2),v=new DataView(buf);const w=(o,str)=>{for(let i=0;i<str.length;i++)v.setUint8(o+i,str.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,s[i]))*32767,true);
  let bin='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=8192)bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return 'data:audio/wav;base64,'+btoa(bin)}
const MUS={cache:{},cur:null,el:null,src:null,gain:null,playing:false};
const IOSLIKE=/iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
/* el bucle de Web Audio es exacto (sin microcorte); el <audio> común deja un silencio al repetir, así que solo se usa en iPhone viejos y con 3 vueltas seguidas */
const useWAmusic=()=>!!(ac()&&(!IOSLIKE||navigator.audioSession));
function trackData(id){if(!TRACKS[id])id='zamba';if(!MUS.cache[id])MUS.cache[id]={s:TRACKS[id].render(),el:null};const d=MUS.cache[id];
  if(!useWAmusic()&&!d.el&&!d.noEl){try{const s3=new Float32Array(d.s.length*3);for(let k=0;k<3;k++)s3.set(d.s,k*d.s.length);const el=new Audio(wavURLRate(s3,MSR));el.loop=true;el.preload='auto';d.el=el}catch(e){d.noEl=true}}return d}
function musicWant(){return SNDREADY&&SET.music&&!SET.mute&&view!=='game'}
function musicStopAll(){if(MUS.el)try{MUS.el.pause()}catch(e){}MUS.el=null;const c=AC;if(MUS.src&&c){try{MUS.gain.gain.linearRampToValueAtTime(0,c.currentTime+.5);const s=MUS.src;setTimeout(()=>{try{s.stop()}catch(e){}},600)}catch(e){}}MUS.src=null}
function musicStartWA(d){const c=ac();if(!c)return;try{const b=c.createBuffer(1,d.s.length,MSR);b.getChannelData(0).set(d.s);const src=c.createBufferSource(),g=c.createGain();src.buffer=b;src.loop=true;
  g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.42*volOf('music'),c.currentTime+1.2);src.connect(g);g.connect(c.destination);src.start();MUS.src=src;MUS.gain=g}catch(e){}}
function musicVolume(){const v=.42*volOf('music');if(MUS.gain&&AC)try{MUS.gain.gain.cancelScheduledValues(AC.currentTime);MUS.gain.gain.setTargetAtTime(v,AC.currentTime,.05)}catch(e){}if(MUS.el)MUS.el.volume=v}
function musicUpdate(force){if(!SNDREADY)return;const want=musicWant(),id=TRACKS[SET.track]?SET.track:'zamba';
  if(!force&&want===MUS.playing&&(!want||MUS.cur===id))return;
  musicStopAll();MUS.playing=want;MUS.cur=want?id:null;if(!want)return;
  const d=trackData(id);if(useWAmusic()||!d.el){musicStartWA(d);return}
  MUS.el=d.el;try{d.el.currentTime=0}catch(e){}d.el.volume=.42*volOf('music');const p=d.el.play();if(p&&p.catch)p.catch(()=>{d.noEl=true;d.el=null;MUS.el=null;musicStartWA(d)})}
function musicPickerHTML(compact){const cur=TRACKS[SET.track]?SET.track:'zamba';
  return `<div class="mpick${compact?' compact':''}" role="group" aria-label="Música de fondo">${compact?'<span class="note">♪ Música</span>':''}${TRACK_IDS.map(id=>`<button type="button" data-a="track" data-id="${id}" aria-pressed="${cur===id&&SET.music}" title="${esc(TRACKS[id].desc)}">${esc(TRACKS[id].name)}</button>`).join('')}${compact?`<button type="button" data-a="track" data-id="off" aria-pressed="${!SET.music}">Sin música</button>`:''}</div>`}


/* ---------- Extra y Ajustes ---------- */
const EXTRA_SUB=['anotador','shop','missions','ranking','rules','tutorial'];
const backX=()=>`<div class="backx"><button type="button" class="btn ghost sm" data-a="nav" data-v="extra">← Extra</button></div>`;
function extraHTML(){const done=(WAL.tut||[]).length,mis=(()=>{ensureMissions();return WAL.mis.done.length})();
  return phd('Extra')+`<div class="xtiles">
    ${modeTile('data-a="nav" data-v="shop"','10O','Tienda',`Personajes, dorsos y paños, con tus ${fmt(WAL.chips)} fichas`)}
    ${modeTile('data-a="nav" data-v="missions"','11B','Misiones y logros',`${mis} de 3 misiones hoy`)}
    ${modeTile('data-a="nav" data-v="ranking"','12E','Ranking','Vos contra todos y contra tus amigos')}
    ${modeTile('data-a="nav" data-v="tutorial"','10E','Tutorial',`${done} de ${LESSONS.length} lecciones hechas`)}
    ${modeTile('data-a="nav" data-v="rules"','11O','Reglamento','Cartas, envido, flor, truco y mazo')}
    ${modeTile('data-a="nav" data-v="anotador"','12B','Anotador',`${ANOT.s[0]} a ${ANOT.s[1]} · a ${ANOT.target}`)}
  </div><button type="button" class="linkrow" data-a="terms">Términos y condiciones</button>`}
function settingsHTML(){const tg=(k,l,sub,inv)=>`<div class="toggle"><span>${l}<small>${sub}</small></span><button type="button" class="sw" data-a="toggle" data-k="${k}" aria-pressed="${inv?!SET[k]:!!SET[k]}" aria-label="${l}"></button></div>`;
  const opts=[['sonido','Sonido'],['juego','Juego'],['cuenta','Cuenta']];if(isOwnerV)opts.push(['admin','Admin']);const [tab,tabs]=ptabs('set',opts,'sonido');let body='';
  if(tab==='sonido')body=`<section class="box">${tg('mute','Sonido general','Apaga o prende todo el audio de Reviro',true)}${tg('music','Música','Suena de fondo en los menús')}${tg('sound','Efectos','Al tirar, cantar y sumar puntos')}
      ${[['vol','Volumen general'],['volMusic','Música'],['volFx','Efectos']].map(([k,l])=>`<label class="vol"><span>${l}</span><input type="range" min="0" max="100" step="5" value="${SET[k]??80}" data-vol="${k}" aria-label="${l}"><output id="vo-${k}">${SET[k]??80}%</output></label>`).join('')}
      <div class="field"><span>Tema</span>${musicPickerHTML(false)}<p class="note" style="margin:0">${esc((TRACKS[SET.track]||TRACKS.zamba).desc)}</p></div></section>`;
  if(tab==='juego')body=`<section class="box">${tg('tap2','Tirar con dos toques','Tocás la carta, sube, y la tirás tocándola otra vez. Así no se escapa ninguna')}${tg('help','Ayuda en pantalla','Te muestra tu envido o tu flor en la primera baza')}
      <div class="field"><span>Flor en La Huella</span>${seg('hflor',[['true','Con flor'],['false','Sin flor']],SET.hflor!==false)}</div>
      <p class="note" style="margin:0">La dificultad, los puntos, la flor y la apuesta de cada partida se eligen en Jugar, con el botón Cambiar.</p></section>`;
  if(tab==='cuenta')body=`<section class="box"><p style="margin:0">Jugás como <b>${esc(myDisp())}</b>${PREMIUM?' · <span class="prem">Premium</span>':''}</p>${myEmail?`<p class="note" style="margin:0">Cuenta: ${esc(myEmail)}</p>`:''}
      <p class="note" style="margin:0">Tu código de amigo es <b>${esc(WAL.fcode||'—')}</b>. El apodo y los amigos se manejan desde Perfil.</p>
      <button class="btn" data-a="nav" data-v="profile">Ir a Perfil</button><button class="btn ghost" data-a="terms">Términos y condiciones</button>${fbAccountHTML()}</section>`;
  if(tab==='admin'){const ao=FB?[['usuarios','Jugadores'],['salas','Salas'],['cobros','Cobros'],['links','Links de pago'],['registro','Registro'],['premium','Premium']]:[['premium','Premium']];const [at,atabs]=ptabs('adm',ao,ao[0][0]);
    body=atabs+(at==='usuarios'?fbUsersHTML():at==='salas'?fbRoomsHTML():at==='cobros'?mpPendHTML():at==='links'?mpAdminHTML():at==='registro'?auditHTML():adminHTML())}
  return phd('Ajustes','','profile')+tabs+`<div class="pbody">${body}</div>`}
/* ---------- bienvenida ---------- */
function welcomeHTML(){return `<div class="gate">${fileteHTML('gtitle')}<section class="box"><h2>¡Bienvenido a la mesa, ${esc(myDisp())}!</h2>
  <p>¿Sabés jugar al truco?</p><div class="btns" style="justify-content:flex-start"><button class="btn prim" data-a="welcome" data-v="play">Sí, a jugar</button><button class="btn brass" data-a="welcome" data-v="learn">No, enseñame</button><button class="btn ghost" data-a="welcome" data-v="tut">Más o menos</button></div>
  <p class="note">El tutorial son cinco lecciones cortas con manos armadas. Siempre lo encontrás en Extra.</p></section></div>`}

/* ---------- invitaciones a mesa y jugar rápido ---------- */
let INV=null,INVS=[],unsubInv=null,INVITED=new Set();const INV_TTL=10*60e3,dismissedInv=new Set();
function subInvites(){if(!db||!uid||unsubInv)return;try{unsubInv=db.collection('invites').where('to','==',uid).onSnapshot(s=>{
  INVS=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>Date.now()-(x.at||0)<INV_TTL&&!dismissedInv.has(x.id)).sort((a,b)=>b.at-a.at);
  const was=INV&&INV.id;INV=INVS[0]||null;if(INV){fetchLooks([INV.from]);if(INV.id!==was)sfx('call')}render()},()=>{unsubInv=null})}catch(e){}}
async function acceptInvite(go){const x=INV;if(!x)return;dismissedInv.add(x.id);INV=INVS.find(y=>!dismissedInv.has(y.id))||null;
  try{await db.doc('invites/'+x.id).delete()}catch(e){}
  if(go&&x.kind==='tour'){if(mode==='offline'&&G&&!G.matchOver){G=null;mode=null}openTour(x.tid);return}
  if(go){if(mode==='offline'&&G&&!G.matchOver){G=null;mode=null}openTable(x.code)}else render()}
async function sendInvite(fid){if(!db||!uid)return;let code=null;
  if((view==='room')&&T&&T.status==='waiting'&&T.seats.some(s=>s.id===uid))code=T.code;
  else{code=await createTable();if(!code)return}
  try{await db.collection('invites').add({from:uid,to:fid,code,at:Date.now()});INVITED.add(fid);toast('Invitación enviada a '+(dispName(fid)||'tu amigo'));render()}
  catch(e){toast('No se pudo mandar la invitación')}}
function roomInviteHTML(full){const fs=[...friendSet()];if(!fs.length||full||!T||T.status!=='waiting')return'';fetchLooks(fs);
  const inTable=new Set(T.seats.map(s=>s.id).filter(Boolean));
  return `<section class="box" style="margin-top:4px"><h2>Invitá a tus amigos</h2><ul class="flist">${fs.filter(id=>!inTable.has(id)).map(id=>{const l=LOOKS[id]||{};const sent=INVITED.has(id);
    return `<li>${avatarSVG(AVM[l.av]?l.av:'gaucho',34)}<span style="flex:1">${esc(dispName(id)||'Jugador')}</span><button class="btn sm ${sent?'':'brass'}" data-a="invite" data-id="${esc(id)}" ${sent?'disabled':''}>${sent?'Invitado':'Invitar'}</button></li>`}).join('')}</ul></section>`}
async function quickPlay(){if(!db||!uid){toast('El juego online necesita tu cuenta');return}
  const t=lobby.filter(x=>x.status==='waiting'&&!x.tour&&x.host!==uid&&Date.now()-(x.created||0)<3*3600e3&&(x.stake||0)<=WAL.chips&&x.seats.some(s=>!s.id&&!s.bot)).sort((a,b)=>b.created-a.created)[0];
  if(t){toast('Te sentamos en la mesa '+t.code);openTable(t.code);return}
  const code=await createTable();if(code)toast('No había mesas abiertas: armamos una. Invitá amigos o completá con bots.')}
async function fillAndStart(){if(!isHost||!tableRef)return;if(FB){startOnline();return}let seats=null;
  try{await withLease(async d=>{seats=d.seats.map(s=>s.id||s.bot?s:{id:null,bot:true});await tableRef.update({seats})})}catch(e){toast('No se pudo completar la mesa');return}
  if(!seats)return;T=Object.assign({},T,{seats});startOnline()}

/* ---------- reloj por jugada (online) ---------- */
const TURN_MS=30000;let lastTimeout=-1;
function turnInfo(){if(view!=='game'||mode!=='online'||!G||G.matchOver||G.hand.ended)return null;if(G.seats.filter(s=>s.id&&!s.bot).length<2)return null;const a=actor(G);if(a<0||G.seats[a].bot||isAbsent(a))return null;
  const rem=Math.max(0,TURN_MS-(Date.now()-(G.lastAct||Date.now())));return{a,rem}}
function turnBarHTML(){const t=turnInfo();if(!t)return'';const pct=Math.round(t.rem*100/TURN_MS);
  return `<div class="turnbar ${t.a===mySeat?'mine':''} ${t.rem<8000?'low':''}" role="timer" aria-label="Tiempo para jugar"><span class="tt" id="tbart">${esc(t.a===mySeat?'Tu turno':nameOf(t.a))} · <b>${Math.ceil(t.rem/1000)}</b> s</span><span class="tr"><i id="tbari" style="transform:scaleX(${(pct/100).toFixed(3)})"></i></span></div>`}
function turnTick(){const t=turnInfo();if(!t)return;const i=document.getElementById('tbari'),s=document.getElementById('tbart');
  if(i){i.style.transform=`scaleX(${(t.rem/TURN_MS).toFixed(3)})`;const bar=i.closest('.turnbar');if(bar)bar.classList.toggle('low',t.rem<8000)}if(s)s.innerHTML=esc(t.a===mySeat?'Tu turno':nameOf(t.a))+' · <b>'+Math.ceil(t.rem/1000)+'</b> s';
  if(t.rem<=0&&controllerSeat()===mySeat&&lastTimeout!==G.seq&&!busy){lastTimeout=G.seq;const who=nameOf(t.a);
    try{commit(act(G,t.a,aiAct(G,t.a,'medio')));toast('Se acabó el tiempo: el bot jugó por '+(t.a===mySeat?'vos':who))}catch(e){}}}


/* ---------- cuentas con Firebase (versión web): ingreso, registro, roles, estadísticas y administración ---------- */
let AUTHV='login',AUTHERR='',AUTHBUSY=false,AUTHINFO=null,MYUSER=null,ADM_ROOMS=null,ADM_USERS=null,admUnsubs=[];
const waitNET=()=>window.NET?Promise.resolve(window.NET):new Promise(res=>{window.addEventListener('net-ready',()=>res(window.NET),{once:true});setTimeout(()=>res(window.NET||null),20000)});
function authHTML(){const free=AVS.filter(a=>!a.price);const e=AUTHERR?`<p class="autherr" role="alert">${esc(AUTHERR)}</p>`:'';const dis=AUTHBUSY?'disabled':'';
  const tabs=AUTHV==='complete'?'':`<div class="subtabs" role="group"><button type="button" data-a="authv" data-v="login" aria-pressed="${AUTHV==='login'}">Ingresar</button><button type="button" data-a="authv" data-v="register" aria-pressed="${AUTHV==='register'}">Crear cuenta</button></div>`;
  let body='';
  const gbtn=`<button type="button" class="btn gbtn" data-a="google" ${dis}>${GICO}<span>Continuar con Google</span></button><div class="ordiv"><span>o con tu mail</span></div>`;
  if(AUTHV==='login')body=`<form class="box" data-form="login"><h2>Ingresá a tu cuenta</h2>${gbtn}
    <div class="field"><span>Mail</span><input type="email" id="aemail" class="plain" autocomplete="email" value="${esc(savedEmail())}" required></div>
    <div class="field"><span>Contraseña</span><input type="password" id="apass" class="plain" autocomplete="current-password" required></div>
    <label class="tos"><input type="checkbox" id="aremember" ${savedEmail()?'checked':''}> <span>Recordar mi mail en este dispositivo <small class="note">(la contraseña no se guarda)</small></span></label>
    ${e}<button class="btn prim" type="submit" ${dis}>${AUTHBUSY?'Entrando…':'Ingresar'}</button>
    <button class="btn ghost sm" type="button" data-a="authv" data-v="reset">Me olvidé la contraseña</button></form>`;
  if(AUTHV==='reset')body=`<form class="box" data-form="reset"><h2>Recuperar contraseña</h2><p class="note">Te mandamos un mail para elegir una contraseña nueva.</p>
    <div class="field"><span>Mail</span><input type="email" id="aemail" class="plain" autocomplete="email" value="${esc(savedEmail())}" required></div>
    ${e}<button class="btn prim" type="submit" ${dis}>Mandar mail</button><button class="btn ghost sm" type="button" data-a="authv" data-v="login">Volver</button></form>`;
  if(AUTHV==='register'||AUTHV==='complete')body=`<form class="box" data-form="${AUTHV}"><h2>${AUTHV==='complete'?'Terminá tu registro':'Creá tu cuenta'}</h2>${AUTHV==='register'?gbtn:`<p class="note" style="margin:0">Entraste con ${esc(myEmail||(AUTHINFO&&AUTHINFO.email)||'tu cuenta')}. Elegí cómo te van a ver en la mesa.</p>`}
    ${AUTHV==='register'?`<div class="field"><span>Mail</span><input type="email" id="aemail" class="plain" autocomplete="email" value="${esc(savedEmail())}" required></div>`:''}
    <div class="field"><span>Nombre de usuario</span><input type="text" id="auser" class="plain" maxlength="20" value="${AUTHV==='complete'?esc(googleUser()):''}" autocomplete="username" placeholder="De 3 a 20 letras, números, punto o guion bajo" required></div>
    ${AUTHV==='register'?`<div class="field"><span>Contraseña</span><input type="password" id="apass" class="plain" autocomplete="new-password" minlength="6" placeholder="Al menos 6 caracteres" required></div>`:''}
    <div class="field"><span>Elegí tu personaje</span><div class="regavs">${free.map(a=>`<button type="button" class="regav" data-a="regav" data-id="${a.id}" aria-pressed="${regAv===a.id}">${avatarSVG(a.id,96,true)}<b>${esc(a.name)}</b></button>`).join('')}</div></div>
    ${AUTHV==='register'||AUTHV==='complete'?`<label class="tos"><input type="checkbox" id="aterms" ${TOSOK?'checked':''}> <span>Leí y acepto los <button type="button" class="linkb" data-a="terms">términos y condiciones</button></span></label>`:''}
    ${e}<button class="btn prim" type="submit" ${dis}>${AUTHBUSY?'Creando…':'Crear mi cuenta'}</button>
    <p class="note">${AUTHV==='register'?'Te vamos a mandar un mail para verificar tu cuenta. ':''}Las fichas y las monedas de Reviro no tienen valor en dinero.</p></form>`;
  return `<div class="gate">${fileteHTML('gtitle')}${tabs}${body}</div>`}
const GICO='<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
/* el nombre que trae Google, pasado a un usuario válido (de 3 a 20 letras, números, punto o guion bajo) */
const googleUser=()=>{let n='';try{n=(NET.auth.googleName&&NET.auth.googleName())||''}catch(e){}n=n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^A-Za-z0-9._]/g,'').slice(0,20);return n.length>=3?n:''};
async function googleIn(){if(AUTHBUSY)return;AUTHERR='';AUTHBUSY=true;render();try{await NET.auth.google()}catch(err){AUTHERR=err.message||'No se pudo entrar con Google.'}AUTHBUSY=false;render()}
/* solo el mail, nunca la contraseña */
const savedEmail=()=>{try{return localStorage.getItem('reviro.email')||''}catch(e){return ''}};
const fval=id=>{const el=document.getElementById(id);return el?el.value:''};let TOSOK=false;
async function authSubmit(kind){if(AUTHBUSY)return;AUTHERR='';AUTHBUSY=true;
  const email=fval('aemail'),pass=fval('apass'),user=fval('auser'),tos=!!(document.getElementById('aterms')||{}).checked,rem=!!(document.getElementById('aremember')||{}).checked;TOSOK=tos;if(kind==='login'){try{if(rem)localStorage.setItem('reviro.email',email.trim());else localStorage.removeItem('reviro.email')}catch(e){}}render();
  try{
    if(kind==='login')await NET.auth.login({email,password:pass});
    else if(kind==='register'){if(!tos)throw new Error('Para crear la cuenta tenés que aceptar los términos y condiciones.');await NET.auth.register({email,username:user,password:pass,avatar:regAv,terms:true});await onFbUser(AUTHINFO,true)}
    else if(kind==='complete'){if(!tos)throw new Error('Para crear la cuenta tenés que aceptar los términos y condiciones.');await NET.auth.completeProfile({username:user,avatar:regAv,terms:true});await onFbUser(AUTHINFO,true)}
    else if(kind==='reset'){await NET.auth.resetPassword(email);toast('Te mandamos el mail para recuperar la contraseña');AUTHV='login'}
  }catch(err){AUTHERR=err.message||'Algo salió mal. Probá de nuevo.'}
  AUTHBUSY=false;render()}
function resetSession(){for(const k of Object.keys(WAL))delete WAL[k];Object.assign(WAL,JSON.parse(JSON.stringify(WAL0)));walRef=null;renderWallet();uid=null;db=null;usr=null;roomCap=null;MYUSER=null;isOwnerV=false;PREMIUM=false;myName='';myEmail=null;
  [unsubLobby,unsubRev,unsubPrem,unsubInv,unsubRank].forEach(u=>{try{u&&u()}catch(e){}});unsubLobby=unsubRev=unsubPrem=unsubInv=unsubRank=null;
  admUnsubs.forEach(u=>{try{u()}catch(e){}});admUnsubs=[];unsubAdmin=null;ADM_ROOMS=ADM_USERS=null;
  [toursUnsub,tvUnsub,...payUnsubs].forEach(u=>{try{u&&u()}catch(e){}});toursUnsub=tvUnsub=null;payUnsubs=[];PAYCFG=null;MYPUR=[];PENDPUR=null;TOURS=null;TV=null;TCLAIM.clear()}
async function onFbUser(info,fresh){AUTHINFO=info;
  if(!info){resetSession();AUTHV='login';view='auth';{const re=NET.auth.redirectError&&NET.auth.redirectError();if(re)AUTHERR=re.message}render();return}
  if(!info.user&&!(NET.auth.user())){AUTHV='complete';view='auth';render();return}
  const u=NET.auth.user();if(uid===info.uid&&view!=='auth'&&!fresh)return;
  uid=info.uid;db=NET.db;usr=NET.usr;roomCap=NET.roomCap;myName=u.username;myEmail=info.email;isOwnerV=NET.auth.isAdmin();PREMIUM=isOwnerV;
  await loadWallet();
  if(!WAL.nick)WAL.nick=u.username;
  if(!WAL.registered){WAL.registered=true;WAL.eq.av=AVM[u.avatar]?u.avatar:'gaucho';saveWallet();writeLooks();view='welcome';setTimeout(claimReferral,1500)}
  else if(view==='auth'||view==='boot')view='menu';
  NET.stats.watchUser(uid,x=>{MYUSER=x;if(x.banned&&view!=='banned'){view='banned';render();return}const adm=NET.auth.isAdmin();if(adm!==isOwnerV){isOwnerV=adm;PREMIUM=PREMIUM||adm;subAdmin();subFbAdmin()}if(view==='profile'||view==='settings')render()});
  if(u.banned){view='banned';render();return}
  if(!u.terms||u.terms.version!==NET.auth.TERMS_V)overlayView='termsAccept';
  subLobby();subFriends();subPremium();subAdmin();subFbAdmin();subInvites();subTours();subPay();subRewards();checkInviteHash();
  NET.stats.recordPending().catch(()=>{});render()}
const RECORDED=new Set();
function fbRecord(code,matchId){if(RECORDED.has(matchId))return;RECORDED.add(matchId);
  NET.stats.recordMatch(code).then(r=>{if(r&&r.stats){MYUSER=Object.assign({},MYUSER,{stats:r.stats});NET.ref.markPlayed();render()}}).catch(()=>RECORDED.delete(matchId))}
function fbStatsHTML(){const s=(MYUSER&&MYUSER.stats)||NET.EMPTY_STATS;const cs=s.currentStreak||0;
  return `<div class="stats">
    <div class="stat-b"><small>Partidas</small><b>${fmt(s.played)}</b></div>
    <div class="stat-b"><small>Ganadas</small><b>${fmt(s.wins)}</b></div>
    <div class="stat-b"><small>Win rate</small><b>${s.played?Math.round(s.winRate*100):0}%</b></div>
    <div class="stat-b"><small>Racha actual</small><b class="${cs>0?'pos':cs<0?'neg':''}">${cs>0?'+'+cs:cs}</b></div>
    <div class="stat-b"><small>Mejor racha</small><b>${fmt(s.bestStreak)}</b></div>
  </div><p class="note" style="margin-top:6px">Cuentan solo las partidas online contra otras personas (1v1 y 2v2, también las de torneo). Contra la IA es práctica: no suma ni resta.</p>`}
function subFbAdmin(){if(!FB||!isOwnerV||admUnsubs.length)return;try{admUnsubs.push(NET.admin.watchRooms(r=>{ADM_ROOMS=r;if(view==='settings')render()}));admUnsubs.push(NET.admin.watchUsers(u=>{ADM_USERS=u;if(view==='settings')render()}))}catch(e){}}
function fbAdminHTML(){return fbRoomsHTML()+fbUsersHTML()}
function fbRoomsHTML(){if(!FB||!isOwnerV)return'';const rooms=ADM_ROOMS||[],users=ADM_USERS||[];const nm=id=>{const u=users.find(x=>x.uid===id);return u?u.username:'—'};
  return `<section class="box admin grow">${ADM_ROOMS===null?'<p class="note">Cargando…</p>':fitList('adm-rooms',rooms,r=>`<li><span style="flex:1"><b>${esc(r.code)}</b> · ${esc(r.type||'')} · ${r.status==='playing'?'jugando':'esperando'}<small>Anfitrión: ${esc(nm(r.host))} · ${(r.playerIds||[]).length} jugador${(r.playerIds||[]).length===1?'':'es'}${r.game?' · '+r.game.scores[0]+' a '+r.game.scores[1]:''}</small></span><button class="btn sm warn" data-a="admclose" data-id="${esc(r.code)}">Cerrar</button></li>`,'flist','<p class="note">No hay salas abiertas.</p>')}</section>`}
function fbUsersHTML(){if(!FB||!isOwnerV)return'';const users=ADM_USERS||[];
  return `<section class="box admin grow">${ADM_USERS===null?'<p class="note">Cargando…</p>':fitList('adm-users',users,u=>{const s=u.stats||{};const adm=u.role==='admin';return `<li>${avatarSVG(AVM[u.avatar]?u.avatar:'gaucho',34)}<span style="flex:1">${esc(u.username||'—')}${adm?' <span class="prem">Admin</span>':''}${u.banned?' <span class="prem" style="background:var(--bad)">Suspendido</span>':''}<small>${fmt(s.played||0)} partidas · ${s.played?Math.round((s.winRate||0)*100):0}% ganadas</small></span><button class="btn sm" data-a="admuser" data-id="${esc(u.uid)}">Ver</button>${u.uid===uid?'':`<button class="btn sm ${adm?'warn':'brass'}" data-a="admrole" data-id="${esc(u.uid)}" data-v="${adm?'player':'admin'}">${adm?'Quitar admin':'Hacer admin'}</button>`}</li>`},'flist')}
    <p class="note" style="margin:0">El admin fijo es alejandro.clemente05@gmail.com, con el mail verificado.</p></section>`}
function fbAccountHTML(){if(!FB)return'';const ver=AUTHINFO&&AUTHINFO.emailVerified;
  return `${ver?'':`<div class="demo">Todavía no verificaste tu mail. ${NET.ADMIN_EMAILS.includes((myEmail||'').toLowerCase())?'Hasta que lo verifiques no se activan tus permisos de admin. ':''}<button class="btn sm" data-a="reverify">Reenviar mail</button></div>`}
    <button class="btn ghost" data-a="logout">Cerrar sesión</button>`}
async function fbStartAI(){const n=+SET.n,stake=+SET.stake;if(stake>WAL.chips){toast('No te alcanzan las fichas');return}
  try{const code=await NET.rooms.createRoom({n,target:+SET.target,flor:SET.flor===true||SET.flor==='true',stake,diff:SET.diff,bots:n-1});
    await NET.rooms.startRoom(code,(seats,d)=>newMatch({n:d.n,target:d.target,stake:d.stake,flor:d.flor!==false,seats:seats.map(s=>({id:s.id,bot:!!s.bot})),matchId:code+'-'+Date.now().toString(36),diff:d.diff||'medio'}));
    openTable(code)}catch(e){toast('No se pudo armar la partida. Revisá tu conexión.')}}

/* ---------- torneos (web con cuenta). Entrada y premios en fichas: no tienen valor en dinero ---------- */
let TOURS=null,TV=null,TVB=null,tvUnsub=null,toursUnsub=null,tourBusy=false,tourConfirm=null;const TREP=new Set(),TOPEN=new Set(),TSTART=new Set(),TCLAIM=new Set();
const TN={name:'',theme:'',date:'',rules:'',format:'ko',mode:'1v1',max:8,buyIn:100,target:15,flor:true};
const TMAX={ko:[8,16,32,64,128],liga:[4,6,8,10,12]};const TBUY=[0,50,100,250,500,1000];
const tFmtDate=ms=>{try{return new Date(ms).toLocaleString('es-AR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return''}};
const tTeamName=tm=>!tm?'—':esc(tm.names.filter(Boolean).join(' y ')+(tm.bot?' y la IA':''));
const tMine=tm=>!!(tm&&tm.ids.includes(uid));
const tStatus={open:'Inscripción abierta',running:'En juego',paused:'En pausa',finished:'Terminado',cancelled:'Cancelado'};
function subTours(){if(!FB||toursUnsub)return;try{toursUnsub=NET.tour.watchList(l=>{TOURS=l;tourClaims();if(view==='torneos')render()})}catch(e){}}
function openTour(tid){if(tvUnsub)tvUnsub();TV={tid,t:null,entries:[],matches:[]};tourConfirm=null;PT.tour='res';overlayView=null;view='tour';render();
  TVB=null;tvUnsub=NET.tour.watch(tid,x=>{if(!TV||TV.tid!==tid)return;Object.assign(TV,x,{loaded:true});if(view==='tour')render()})}
/* cobra solo el premio o el reintegro de los torneos en los que te anotaste */
function tourClaims(){for(const t of TOURS||[]){const mine=WAL.tours&&WAL.tours[t.id];if(!mine||mine.claimed||TCLAIM.has(t.id))continue;if(t.status!=='finished'&&t.status!=='cancelled')continue;TCLAIM.add(t.id);
  NET.tour.claim(t.id).then(r=>{const v=Object.assign({},mine,{claimed:true});
    if(r&&r.amount>0){applyTx('tour:'+t.id+':claim',{chips:r.amount,tour:{id:t.id,v}}).then(()=>{sfx('pts');toast(r.kind==='premio'?`¡Saliste ${r.place}.º en ${t.name}! Cobraste ${fmt(r.amount)} fichas`:`Se canceló ${t.name}: te devolvimos ${fmt(r.amount)} fichas`)})}
    else applyTx('tour:'+t.id+':noprize',{tour:{id:t.id,v}})}).catch(()=>TCLAIM.delete(t.id))}}
const pad2=n=>String(n).padStart(2,'0');
const agoTxt=at=>{const m=Math.floor((Date.now()-at)/60e3);return m<1?'recién':m<60?`hace ${m} min`:m<1440?`hace ${Math.floor(m/60)} h`:`hace ${Math.floor(m/1440)} d`};
/* cuenta regresiva: hasta que cierra la inscripción y arranca el torneo */
function cdInner(ms,big){if(ms<=0)return big?'<b class="cd-end">La inscripción cerró</b>':'Inscripción cerrada';const s=Math.floor(ms/1000),d=Math.floor(s/86400),hh=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;
  if(!big)return `Cierra en ${d?d+'d ':''}${pad2(hh)}:${pad2(m)}:${pad2(x)}`;
  return `<small>${ms<36e5?'¡Última hora! Cierra la inscripción en':'La inscripción cierra y arranca en'}</small><div class="cd-u">${[[d,d===1?'día':'días'],[hh,'horas'],[m,'min'],[x,'seg']].map(([v,l])=>`<span><b>${pad2(v)}</b><i>${l}</i></span>`).join('')}</div>`}
function cdHTML(t,big){if(!t.startAt||t.status!=='open')return'';const ms=t.startAt-Date.now();return `<div class="cd ${big?'big':''} ${ms<36e5&&ms>0?'hot':ms<864e5&&ms>0?'warm':''}" data-cd="${t.startAt}">${cdInner(ms,big)}</div>`}
const tClosed=t=>t.status!=='open'||(t.startAt&&Date.now()>=t.startAt);
/* el premio acumulado: cuando sube, el número cuenta hacia arriba y aparece cuánto creció */
const POTSEEN={};
function potHTML(t,cls){const v=NET.tour.potOf(t),k=t.id+(cls||''),prev=POTSEEN[k];POTSEEN[k]=v;const from=prev==null||prev>v?v:prev;
  return `<span class="potn ${cls||''}" data-pot="${v}" data-from="${from}">${fmt(from)}</span>`}
function animatePots(){document.querySelectorAll('.potn').forEach(el=>{const to=+el.dataset.pot,from=+el.dataset.from;if(!(to>from))return;el.dataset.from=to;
  const box=el.closest('.pozo,.tcard');if(box){box.classList.remove('grow');void box.offsetWidth;box.classList.add('grow');const f=document.createElement('span');f.className='potplus';f.textContent='+'+fmt(to-from);box.appendChild(f);setTimeout(()=>f.remove(),1600)}
  const t0=performance.now(),D=1100;const step=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);el.textContent=fmt(Math.round(from+(to-from)*e));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)})}
const TAUTO=new Set();
const pauseText=(who,until)=>{const s=Math.max(0,Math.ceil((until-Date.now())/1000));return `Partida en pausa: esperando a ${who}. Si no vuelve en ${s} s, pierde su entrada.`};
function tourTick(){const now=Date.now();let ended=false;
  document.querySelectorAll('[data-pause]').forEach(el=>{el.textContent=pauseText(el.dataset.who,+el.dataset.pause)});
  document.querySelectorAll('[data-cd]').forEach(el=>{const ms=+el.dataset.cd-now;el.innerHTML=cdInner(ms,el.classList.contains('big'));el.classList.toggle('hot',ms<36e5&&ms>0);el.classList.toggle('warm',ms>=36e5&&ms<864e5);if(ms<=0&&!el.dataset.done){el.dataset.done='1';ended=true}});
  if(ended&&(view==='tour'||view==='torneos'))render();
  /* llegada la hora, el admin con la app abierta larga el torneo solo */
  if(FB&&isOwnerV)for(const t of TOURS||[]){if(t.status==='open'&&t.startAt&&now>=t.startAt&&t.players>=2&&!TAUTO.has(t.id)){TAUTO.add(t.id);NET.tour.start(t.id).then(r=>{if(r.ok)toast(`¡Arrancó ${t.name}! Ya se sortearon los cruces`)}).catch(()=>TAUTO.delete(t.id))}}}
function tourCardHTML(t){const mine=!!(WAL.tours&&WAL.tours[t.id]);const cap=NET.tour.cap(t);const left=cap-t.players;
  const badge=mine&&t.status==='running'?'Estás jugando':mine&&t.status==='open'?'Inscripto':t.status==='open'&&tClosed(t)?'Por arrancar':tStatus[t.status];
  return `<button type="button" class="tcard ${mine?'mine':''}" data-a="tour" data-id="${esc(t.id)}"><span class="tc-top"><b>${esc(t.name)}</b><span class="tst ${t.status}">${badge}</span></span>
    ${t.theme?`<span class="tc-theme">${esc(t.theme)}</span>`:''}
    <span class="tc-meta">${t.format==='liga'?'Liga':'Eliminación'} · ${t.mode} · ${t.status==='open'?`${t.players}/${cap} inscriptos`:`${(t.teams||[]).length} ${t.mode==='2v2'?'parejas':'jugadores'}`}${t.startAt&&t.status!=='open'?' · '+esc(tFmtDate(t.startAt)):''}</span>
    <span class="tc-pot"><i class="chip"></i><b>${potHTML(t,'sm')}</b> de premio <small>· entrada ${t.buyIn?fmt(t.buyIn)+' fichas':'gratis'}</small></span>
    ${t.status==='open'&&!tClosed(t)&&left>0&&left<=Math.max(2,Math.ceil(cap/4))?`<span class="fomo">¡Quedan ${left} lugar${left===1?'':'es'}!</span>`:''}${cdHTML(t,false)}</button>`}
function toursPageHTML(){const head=phd('Torneos',isOwnerV&&FB?'<button type="button" class="btn sm brass" data-a="tournew">+ Crear</button>':'','menu');
  if(!FB)return head+`<section class="box"><p style="margin:0">Los torneos se juegan en la web, con tu cuenta: <b>aleclem180.github.io/Reviro</b>. La entrada y el premio son en fichas.</p></section>`;
  const live=(TOURS||[]).filter(t=>t.status==='open'||t.status==='running'||t.status==='paused');
  const done=(TOURS||[]).filter(t=>t.status==='finished'&&Date.now()-(t.finishedAt||t.updatedAt||0)<14*864e5);
  const [tab,tabs]=ptabs('tours',[['live',`Abiertos y en juego${live.length?' · '+live.length:''}`],['done','Terminados']],'live');
  return head+tabs+`<div class="pbody">${TOURS===null?'<p class="note">Cargando…</p>':fitList('tours-'+tab,tab==='live'?live:done,tourCardHTML,'tlist',`<section class="box"><p class="note" style="margin:0">${tab==='live'?(isOwnerV?'Todavía no hay torneos. Creá el primero.':'Por ahora no hay torneos abiertos. Cuando se arme uno, aparece acá.'):'No terminó ninguno en las últimas dos semanas.'}</p></section>`)}</div>
    <button type="button" class="linkrow" data-a="ov" data-v="tourhow">¿Cómo funcionan los torneos?</button>`}
function tourHowHTML(){return `<div class="over" data-a="close"><div class="panel lpanel" data-stop><h2>Cómo funcionan</h2><ul class="tsteps"><li><b>Anotate</b> pagando la entrada en fichas. El premio crece con cada inscripto.</li><li><b>Cuando cierra la inscripción</b> se sortean los cruces.</li><li><b>Jugá tus partidas</b> desde el torneo: arrancan solas cuando están todos.</li><li><b>Los tres primeros</b> se llevan el premio, que se cobra solo.</li></ul><p class="note">Las fichas no tienen valor en dinero.</p><button class="btn ghost" data-a="close">Cerrar</button></div></div>`}
function tourNewHTML(){const head=phd('Nuevo torneo','','torneos');if(!isOwnerV)return head+`<section class="box"><p style="margin:0">Solo los admins crean torneos.</p></section>`;
  const maxes=TMAX[TN.format];if(!maxes.includes(TN.max))TN.max=maxes[1];
  const full=TN.max*(TN.mode==='2v2'?2:1),fake={id:'new',status:'open',players:full,buyIn:TN.buyIn,split:NET.tour.SPLIT},bk=NET.tour.booksOf(fake),pr=NET.tour.prizesOf(fake,3);
  const [tab,tabs]=ptabs('tnew',[['datos','1. Datos'],['juego','2. Formato'],['premio','3. Premio']],'datos');let body='';
  if(tab==='datos')body=`<label class="field"><span>Nombre</span><input class="tin" id="tname" maxlength="40" placeholder="Copa de la Pulpería" value="${esc(TN.name)}"></label>
    <label class="field"><span>Temática</span><input class="tin" id="ttheme" maxlength="60" placeholder="Truco de fogón, a 15 con flor" value="${esc(TN.theme)}"></label>
    <label class="field"><span>Fecha y hora (cierra la inscripción y arranca)</span><input class="tin" id="tdate" type="datetime-local" value="${esc(TN.date)}"></label>
    <label class="field"><span>Reglas</span><textarea class="tin" id="trules" maxlength="600" rows="3" placeholder="Ej.: si tu rival no aparece en 5 minutos, podés empezar con la IA en su lugar.">${esc(TN.rules)}</textarea></label>`;
  if(tab==='juego')body=`<div class="field"><span>Formato</span>${seg('tn.format',[['ko','Eliminación directa'],['liga','Liga: todos contra todos']],TN.format)}</div>
    <div class="field"><span>Modalidad</span>${seg('tn.mode',[['1v1','1 contra 1'],['2v2','Parejas 2 contra 2']],TN.mode)}</div>
    <div class="field"><span>Cupo (${TN.mode==='2v2'?'parejas':'jugadores'})</span>${seg('tn.max',maxes.map(v=>[v,v]),TN.max)}</div>
    <div class="field"><span>Partidas a</span>${seg('tn.target',[[15,'15 puntos'],[30,'30 puntos']],TN.target)}</div>
    <div class="field"><span>Flor</span>${seg('tn.flor',[['true','Con flor'],['false','Sin flor']],TN.flor)}</div>`;
  if(tab==='premio')body=`<div class="field"><span>Entrada por jugador</span>${seg('tn.buyIn',TBUY.map(v=>[v,v?fmt(v):'Gratis']),TN.buyIn)}</div>
    <div class="demo" style="margin:0"><b>Cuentas internas (solo las ven los admins).</b> El premio es el 90% de lo recaudado y el 10% queda para la casa; los jugadores solo ven el premio ya calculado. Reparto: 1.º 60%, 2.º 30%, 3.º 10%.${TN.buyIn?` Con el cupo lleno: recaudás <b>${fmt(bk.gross)}</b>, el premio es <b>${fmt(bk.pot)}</b> (${fmt(pr[0])} / ${fmt(pr[1])} / ${fmt(pr[2])}) y la casa se queda <b>${fmt(bk.house)}</b>.`:''}</div>`;
  return head+tabs+`<form class="box tnew" data-form="tour">${body}<button class="btn prim" type="submit" ${tourBusy?'disabled':''}>Crear torneo${TN.name?' «'+esc(TN.name)+'»':''}</button></form>`}
async function tourCreate(){if(tourBusy)return;const name=(TN.name||'').trim();if(!name){toast('Ponele un nombre al torneo');return}
  tourBusy=true;render();try{const startAt=TN.date?Date.parse(TN.date):null;
    const id=await NET.tour.create({name,theme:TN.theme.trim(),rules:TN.rules.trim(),startAt:isNaN(startAt)?null:startAt,format:TN.format,mode:TN.mode,maxTeams:TN.max,buyIn:TN.buyIn,target:TN.target,flor:TN.flor});
    Object.assign(TN,{name:'',theme:'',date:'',rules:''});tourBusy=false;toast('Torneo creado');openTour(id)}catch(e){tourBusy=false;render();toast('No se pudo crear el torneo')}}
function tourPrizesHTML(t){const n=t.status==='open'?Math.max(3,t.maxTeams):(t.teams||[]).length;const pr=NET.tour.prizesOf(t,n);
  const full=Object.assign({},t,{players:NET.tour.cap(t)});
  return `<div class="pozo"><small>Premio acumulado</small><div class="pz-n"><i class="chip"></i>${potHTML(t)}</div>
    <div class="pz-sp">${pr.map((v,i)=>`<span><b>${i+1}.º</b> ${fmt(v)}</span>`).join('')}</div>
    ${t.status==='open'?`<p class="note">${t.buyIn?`Crece con cada inscripto. Si se llena, llega a <b>${fmt(NET.tour.potOf(full))}</b> fichas.`:'Torneo gratis: se juega por la gloria.'}</p>`:t.mode==='2v2'?'<p class="note">En parejas, el premio se parte entre los dos (si tu compañero es la IA, es todo tuyo).</p>':''}</div>`}
function tourBooksHTML(t){if(!isOwnerV)return'';const live=NET.tour.booksOf(t);const b=t.status==='open'||!TVB?live:(TVB.books||live);
  if(TVB===null&&t.status!=='open'){TVB=undefined;NET.tour.books(t.id).then(x=>{TVB=x;if(view==='tour')render()}).catch(()=>{TVB={books:null,ledger:[]}})}
  const L=(TVB&&TVB.ledger)||[];const kinds={entrada:'Entrada',baja:'Baja',premio:'Premio',reintegro:'Reintegro'};
  return `<section class="box admin grow"><h3 style="margin:0">Cuentas <small class="note">(solo admins)</small></h3>
    <div class="stats"><div class="stat-b"><small>Recaudado</small><b>${fmt(b.gross||0)}</b></div><div class="stat-b"><small>Premio</small><b>${fmt(b.pot||0)}</b></div><div class="stat-b"><small>Casa</small><b>${fmt(b.house||0)}</b></div></div>
    ${t.status==='cancelled'?'<p class="note" style="margin:0">Cancelado: se devolvieron todas las entradas.</p>':''}
    ${fitList('tledger',L,x=>`<li><span style="flex:1">${kinds[x.kind]||x.kind}<small>${esc((TV.entries.find(e=>e.uid===x.uid)||{}).name||x.uid.slice(0,6))} · ${esc(tFmtDate(x.at))}</small></span><b>${x.kind==='entrada'?'+':'−'}${fmt(x.amount)}</b></li>`,'flist')}
    ${t.status!=='open'?'<button class="btn sm ghost" data-a="tourbooks">Actualizar</button>':''}</section>`}
function tourMatchHTML(t,m){const me=tMine(m.a)||tMine(m.b);const done=!!m.winner;
  const side=(s)=>{const tm=m[s];return `<span class="tm-side ${done&&m.winner===s?'win':''} ${tMine(tm)?'tme':''}">${tm?tTeamName(tm):'<i>A definir</i>'}${done&&m.pts&&!m.bye&&!m.wo&&!m.forfeit?`<b>${m.pts[s==='a'?0:1]}</b>`:''}</span>`};
  let act='';
  if(!done&&m.a&&m.b&&t.status==='running'){if(me)act=`<button class="btn sm prim" data-a="tourplay" data-mid="${esc(m.id)}">Jugar</button>`;
    if(isOwnerV){const sn=tm=>esc((tm.names[0]||'').split(' ')[0]||'—');act+=`<span class="tm-wo"><button class="btn sm ghost" data-a="tourwo" data-mid="${esc(m.id)}" data-w="a" title="Dar por ganado (no se presentó el rival)">Gana ${sn(m.a)}</button><button class="btn sm ghost" data-a="tourwo" data-mid="${esc(m.id)}" data-w="b" title="Dar por ganado (no se presentó el rival)">Gana ${sn(m.b)}</button></span>`}}
  return `<div class="tm ${me?'mine':''}">${side('a')}${m.bye?'<span class="tm-side bye"><i>Pasa directo</i></span>':side('b')}${m.wo?'<small class="note">Por no presentarse</small>':m.forfeit?'<small class="note">Ganó por abandono del rival</small>':''}${act?`<div class="row">${act}</div>`:''}</div>`}
function tourHTML(){
  if(!TV||!TV.t)return phd('Torneo','','torneos')+`<section class="box"><p class="note" style="margin:0">${TV&&TV.t===null&&TV.loaded?'Ese torneo ya no existe.':'Cargando torneo…'}</p></section>`;
  const t=TV.t,E=TV.entries,M=TV.matches,cap=NET.tour.cap(t);const myE=E.find(e=>e.uid===uid);const closed=tClosed(t),left=cap-t.players;
  const teams={};E.forEach(e=>{(teams[e.team]=teams[e.team]||[]).push(e)});const TG=Object.values(teams);
  const opts=[['res','Resumen']];if(t.status==='open')opts.push(['ins',`Inscriptos · ${TG.length}`]);
  else if(t.status!=='cancelled'){opts.push(['cuadro',t.format==='liga'?'Tabla':'Llave']);if(t.format==='liga')opts.push(['fechas','Partidos'])}
  if(isOwnerV)opts.push(['adm','Admin']);const [tab,tabs]=ptabs('tour',opts,'res');
  const head=phd(esc(t.name),`<span class="tst ${t.status}">${tStatus[t.status]}</span>`,'torneos');let body='';
  if(tab==='res'){const info=[t.format==='liga'?'Liga':'Eliminación directa',t.mode==='2v2'?'Parejas':'1 contra 1','a '+t.target,t.flor===false?'sin flor':'con flor',t.buyIn?'entrada '+fmt(t.buyIn):'gratis'];
    let cta='';
    if(t.status==='open'){
      if(myE){const mate=myE.team===uid?E.find(e=>e.uid===myE.partner):E.find(e=>e.uid===myE.team);
        cta=`<p class="ok" style="margin:0">Estás inscripto${t.mode==='2v2'?(mate?` con <b>${esc(mate.name)}</b>`:'. Si nadie se suma a tu pareja, al empezar te toca compañero (o la IA)'):''}.</p><button class="btn ghost" data-a="tourleave" ${tourBusy||closed?'disabled':''}>${tourConfirm==='leave'?'Confirmar baja':'Darme de baja'}${t.buyIn?` (te devolvemos ${fmt(t.buyIn)})`:''}</button>`}
      else{const full=t.players>=cap,poor=t.buyIn>WAL.chips,dis=full||poor||tourBusy||closed;const inv=E.filter(e=>e.invite===uid&&!e.partner);
        cta=inv.map(e=>`<div class="trow hot"><div><b>${esc(e.name)}</b> <span>te invitó a ser su pareja</span></div><button class="btn prim" data-a="tourjoin" data-team="${esc(e.uid)}" ${dis?'disabled':''}>Aceptar</button></div>`).join('')+
          `<div class="row ctas"><button class="btn prim big-cta" data-a="tourjoin" ${dis?'disabled':''}>${closed?'Inscripción cerrada':full?'Cupo lleno':`Inscribirme${t.buyIn?' · '+fmt(t.buyIn)+' fichas':''}`}</button>${t.mode==='2v2'&&!full&&!closed&&friendSet().size?`<button class="btn" data-a="ov" data-v="tourfriend" ${poor||tourBusy?'disabled':''}>Con un amigo</button>`:''}</div>${poor&&!full?'<p class="note" style="margin:0">No te alcanzan las fichas.</p>':''}`}
      if(!closed&&left>0&&left<=Math.max(2,Math.ceil(cap/4)))cta+=`<p class="fomo">¡Quedan ${left} lugar${left===1?'':'es'}!</p>`}
    else if(t.status==='paused')cta=`<p class="note" style="margin:0"><b>Torneo en pausa.</b> El organizador lo frenó un momento. Cuando lo reanude, vas a poder jugar tu partida.</p>`;
    else if(t.status==='running'){const pending=M.filter(m=>!m.winner&&m.a&&m.b&&(tMine(m.a)||tMine(m.b)));
      cta=pending.length?pending.map(m=>`<div class="trow hot"><div><b>Te toca: ${esc(m.label)}</b> <span>vs ${tTeamName(tMine(m.a)?m.b:m.a)}</span></div><button class="btn prim" data-a="tourplay" data-mid="${esc(m.id)}">Jugar</button></div>`).join('')+'<p class="note" style="margin:0">Si tu rival no llega en 5 minutos, la IA juega en su lugar. Abandonar una partida es perderla.</p>':`<p class="note" style="margin:0">Se está jugando. Mirá la ${t.format==='liga'?'tabla':'llave'} para ver cómo va.</p>`}
    else if(t.status==='cancelled')cta='<p style="margin:0">Este torneo se canceló. A cada inscripto se le devolvió la entrada.</p>';
    else if(t.status==='finished'&&t.places){const pr=NET.tour.prizesOf(t,(t.teams||[]).length);cta=`<div class="podio">${['p1','p2','p3'].map((p,i)=>t.places[p]?`<div class="pd pd${i+1} ${tMine(t.places[p])?'tme':''}"><span class="pd-n">${i+1}.º</span><span class="pd-w">${tTeamName(t.places[p])}</span><span class="pd-p"><i class="chip"></i>${fmt(pr[i]||0)}</span></div>`:'').join('')}</div>`}
    body=`<section class="box thead">${t.theme?`<p class="tc-theme" style="margin:0">${esc(t.theme)}</p>`:''}<div class="tchips">${info.map(x=>`<span>${esc(x)}</span>`).join('')}${t.startAt?`<span>${esc(tFmtDate(t.startAt))}</span>`:''}</div>
      ${cdHTML(t,true)}${tourPrizesHTML(t)}${cta}
      <div class="row tlinks">${t.status==='open'&&!closed?`<a class="btn wa sm" href="${waHref(`Anotate en el torneo ${t.name} de Reviro. Premio acumulado: ${fmt(NET.tour.potOf(t))} fichas. ${siteURL()}torneo?id=${t.id}`)}" target="_blank" rel="noopener">${WAICO} Invitar</a>`:''}${t.rules?'<button type="button" class="btn sm ghost" data-a="ov" data-v="tourrules">Reglas del torneo</button>':''}</div></section>`}
  if(tab==='ins'){const pct=Math.min(100,Math.round(t.players/cap*100));const recent=E.slice().sort((x,y)=>y.at-x.at)[0];
    body=`<section class="box grow"><div class="tbar"><i style="width:${pct}%"></i></div><p class="note" style="margin:0">${t.players} de ${cap} lugares${t.mode==='2v2'?' ('+t.maxTeams+' parejas)':''}${recent&&!closed?` · ${esc(recent.name)} se anotó ${esc(agoTxt(recent.at))}`:''}</p>
      ${fitList('tins',TG,g=>{const capE=g.find(e=>e.uid===e.team)||g[0];const open=t.mode==='2v2'&&g.length<2&&capE.uid===capE.team&&!capE.partner&&(!capE.invite||capE.invite===uid);const reserved=t.mode==='2v2'&&g.length<2&&capE.invite&&capE.invite!==uid&&!capE.partner;
        return `<li>${g.map(e=>avatarSVG(AVM[e.av]?e.av:'gaucho',30)).join('')}<span style="flex:1">${esc(g.map(e=>e.name).join(' y '))}${g.some(e=>e.uid===uid)?' <small>(vos)</small>':''}${open?'<small>Falta compañero</small>':reserved?`<small>Esperando a ${esc(dispName(capE.invite)||'su amigo')}</small>`:''}</span>${open&&!myE&&!closed&&t.players<cap?`<button class="btn sm" data-a="tourjoin" data-team="${esc(capE.uid)}" ${t.buyIn>WAL.chips||tourBusy?'disabled':''}>Sumarme</button>`:''}</li>`},'flist','<p class="note" style="margin:0">Todavía no se anotó nadie.</p>')}</section>`}
  if(tab==='cuadro'&&t.format==='liga'){const S=NET.tour.standingsOf(t,M);
    body=`<section class="box grow"><div class="strow sth"><span>#</span><span>${t.mode==='2v2'?'Pareja':'Jugador'}</span><span>PJ</span><span>PG</span><span>Dif.</span></div>${fitList('tstand',S.map((r,i)=>Object.assign({pos:i+1},r)),r=>`<div class="strow ${tMine(r.team)?'tme':''}"><span>${r.pos}</span><span>${tTeamName(r.team)}</span><span>${r.pj}</span><b>${r.w}</b><span>${r.pf-r.pa>0?'+':''}${r.pf-r.pa}</span></div>`,'stand')}</section>`}
  if(tab==='fechas'||(tab==='cuadro'&&t.format!=='liga')){const ko=t.format!=='liga';const rounds=[...new Set(M.filter(m=>!m.third).map(m=>m.round))];
    const cur=rounds.find(r=>M.some(m=>m.round===r&&!m.third&&!m.winner))||rounds[rounds.length-1];const sel=rounds.includes(TV.round)?TV.round:cur;
    const ms=M.filter(m=>m.round===sel).sort((a,b)=>(a.third?1:0)-(b.third?1:0));const lab=r=>{const x=M.find(m=>m.round===r&&!m.third);return ko?(x?x.label:'Ronda '+r):'Fecha '+r};
    body=`${rounds.length>1?`<div class="subtabs rtabs" role="group">${rounds.map(r=>`<button type="button" data-a="tourround" data-v="${r}" aria-pressed="${r===sel}">${esc(lab(r))}</button>`).join('')}</div>`:''}
      <section class="box grow">${fitList('tms-'+sel,ms,m=>(m.third?`<small class="tm-lab">${esc(m.label)}</small>`:'')+tourMatchHTML(t,m),'tms','<p class="note" style="margin:0">Todavía no hay cruces.</p>')}</section>`}
  if(tab==='adm'){let c='';
    if(t.status==='open')c=`<section class="box admin">${t.startAt&&Date.now()>t.startAt?'<p class="note" style="margin:0">Ya es la hora: empezalo cuando quieras.</p>':''}<div class="row"><button class="btn prim" data-a="tourstart" ${E.length<2||tourBusy?'disabled':''}>${tourConfirm==='start'?'Confirmar: cerrar y sortear':'Empezar torneo'}</button><button class="btn warn" data-a="tourcancel" ${tourBusy?'disabled':''}>${tourConfirm==='cancel'?'Confirmar cancelación':'Cancelar torneo'}</button></div><p class="note" style="margin:0">Al empezar se sortean los cruces${t.mode==='2v2'?' y se arman las parejas que falten (si sobra uno, juega con la IA)':''}. Si lo cancelás, a todos se les devuelve la entrada.</p></section>`;
    else if(t.status==='running'||t.status==='paused')c=`<section class="box admin"><div class="row"><button class="btn ${t.status==='paused'?'prim':'brass'}" data-a="tourpause">${t.status==='paused'?'Reanudar torneo':'Pausar torneo'}</button><button class="btn warn" data-a="tourcancel">${tourConfirm==='cancel'?'Confirmar: cancelar y devolver':'Cancelar y devolver entradas'}</button></div><p class="note" style="margin:0">En pausa no arrancan partidas nuevas; las que se están jugando terminan normal.</p></section>`;
    body=c+tourBooksHTML(t)}
  return head+tabs+`<div class="pbody">${body}</div>`}
function tourFriendHTML(){const fr=[...friendSet()];const t=TV&&TV.t;return `<div class="over" data-a="close"><div class="panel lpanel" data-stop><h2>Anotate con un amigo</h2><p class="note" style="margin:0">Le llega la invitación y el lugar queda reservado para él.</p>
  ${fitList('tfr',fr,id=>`<li>${avatarSVG((LOOKS[id]&&LOOKS[id].av)||'gaucho',30)}<span style="flex:1">${esc(dispName(id)||'Amigo')}</span><button class="btn sm prim" data-a="tourwith" data-id="${esc(id)}" ${tourBusy||(t&&t.buyIn>WAL.chips)?'disabled':''}>Elegir</button></li>`,'flist')}
  <button class="btn ghost" data-a="close">Cerrar</button></div></div>`}
async function tourJoin(team,invite){const t=TV&&TV.t;if(!t||tourBusy)return;if(t.buyIn>WAL.chips){toast('No te alcanzan las fichas');return}
  tourBusy=true;render();try{const r=await NET.tour.register(t.id,{name:myDisp(),av:WAL.eq.av,team:team||null,invite:invite||null});tourBusy=false;
    if(r.ok&&invite){try{await db.collection('invites').add({from:uid,to:invite,kind:'tour',tid:t.id,name:t.name,at:Date.now()})}catch(e){}}
    if(!r.ok){toast({lleno:'Ya se llenó el cupo',cerrado:'La inscripción ya cerró',ya:'Ya estás inscripto',pareja:'Esa pareja ya está completa',reservada:'Ese lugar está reservado para otro amigo'}[r.reason]||'No se pudo inscribir');render();return}
    await applyTx('tour:'+t.id+':in:'+r.at,{chips:-(r.buyIn||0),tour:{id:t.id,v:{at:r.at}}});sfx('buy');toast(r.buyIn?`Inscripto: pagaste ${fmt(r.buyIn)} fichas`:'¡Inscripto!')}
  catch(e){tourBusy=false;render();toast('No se pudo inscribir. Revisá tu conexión.')}}
async function tourLeave(){const t=TV&&TV.t;if(!t||tourBusy)return;if(tourConfirm!=='leave'){tourConfirm='leave';render();return}tourConfirm=null;
  tourBusy=true;render();try{const r=await NET.tour.unregister(t.id);tourBusy=false;if(!r.ok){toast('El torneo ya empezó');render();return}
    await applyTx('tour:'+t.id+':out:'+r.at,{chips:r.buyIn||0,tour:{id:t.id,v:null}});toast('Te diste de baja'+(r.buyIn?`: te devolvimos ${fmt(r.buyIn)} fichas`:''))}
  catch(e){tourBusy=false;render();toast('No se pudo. Revisá tu conexión.')}}
async function tourStart(){const t=TV&&TV.t;if(!t||tourBusy)return;if(tourConfirm!=='start'){tourConfirm='start';render();return}tourConfirm=null;
  tourBusy=true;render();try{const r=await NET.tour.start(t.id);tourBusy=false;render();toast(r.ok?'¡Arrancó el torneo! Ya se sortearon los cruces':r.reason==='pocos'?'Hacen falta al menos dos '+(t.mode==='2v2'?'parejas':'jugadores'):'No se pudo empezar')}
  catch(e){tourBusy=false;render();toast('No se pudo empezar el torneo')}}
async function tourCancel(){const t=TV&&TV.t;if(!t||tourBusy)return;if(tourConfirm!=='cancel'){tourConfirm='cancel';render();return}tourConfirm=null;
  try{await NET.tour.cancel(t.id);toast('Torneo cancelado: se devuelven las entradas')}catch(e){toast('No se pudo cancelar')}}
async function tourPlay(mid){const t=TV&&TV.t;if(!t)return;try{const code=await NET.tour.openMatch(t.id,mid);if(!code){toast('Ese partido ya no está para jugar');return}TOPEN.add(code);openTable(code)}catch(e){toast('No se pudo abrir la partida. Revisá tu conexión.')}}
const tourBuild=(seats,d)=>newMatch({n:d.n,target:d.target,stake:0,flor:d.flor!==false,seats:seats.map(s=>({id:s.id,bot:!!s.bot})),matchId:d.code+'-'+Date.now().toString(36),diff:d.diff||'dificil'});
/* la sala de un partido del torneo: se marca quién llegó y arranca sola cuando están todos */
function tourOnTable(){if(!T||!T.tour||mySeat<0)return;const code=T.code;
  if(T.status==='waiting'){const here=T.here||{};
    if(!here[uid]&&!TOPEN.has(code)){TOPEN.add(code);NET.tour.openMatch(T.tour.tid,T.tour.mid).catch(()=>TOPEN.delete(code))}
    const all=T.seats.filter(s=>s.id&&!s.bot).every(s=>here[s.id]);
    if(all&&!TSTART.has(code)){TSTART.add(code);NET.tour.startMatchRoom(code,tourBuild).then(r=>{if(!r.ok)TSTART.delete(code)}).catch(()=>TSTART.delete(code))}}
  if(T.status==='finished'&&T.result&&!TREP.has(T.result.matchId)){TREP.add(T.result.matchId);NET.tour.reportResult(T.tour.tid,T.tour.mid).catch(()=>TREP.delete(T.result.matchId))}}
function tourRoomHTML(){const here=T.here||{};const wait=Math.max(0,5*60e3-(Date.now()-(T.created||Date.now())));
  return `<div class="room"><h3 style="margin:0;color:var(--muted);font-size:.78rem;letter-spacing:.14em;text-transform:uppercase">Torneo · ${esc(T.tour.label||'')}</h3><div class="code" style="font-size:1.6rem">${esc(T.tour.name||'')}</div>
    <p class="note">A ${T.target} puntos · ${T.flor===false?'sin flor':'con flor'}${T.n===4?' · los asientos 1 y 3 juegan juntos contra 2 y 4':''}. La partida arranca sola cuando están todos.</p>
    <div class="seats">${T.seats.map((s,i)=>{const who=s.bot?'La IA':s.id===uid?'Vos':(dispName(s.id)||'Jugador');const av=s.bot?'veterano':s.id===uid?myAv():((LOOKS[s.id]&&LOOKS[s.id].av)||'gaucho');const ok=s.bot||here[s.id];
      return `<div class="seatc ${s.id===uid?'mine':''}"><div class="who">${avatarSVG(av,36)}<div><small>Asiento ${i+1}${T.n===4?' · equipo '+(i%2?'B':'A'):''}</small><b>${esc(who)}</b></div></div><span class="tst ${ok?'running':'open'}">${ok?'Llegó':'Esperando'}</span></div>`}).join('')}</div>
    <div class="row">${wait?`<p class="note">Si falta alguien, en ${Math.ceil(wait/60e3)} min podés empezar con la IA en su lugar.</p>`:`<button class="btn brass" data-a="tourforce">Empezar igual (la IA juega por los que faltan)</button>`}
    <button class="btn ghost" data-a="tourback">Volver al torneo</button></div></div>`}

/* ---------- términos y condiciones ---------- */
const TERMS_TXT=[
 ['Qué es Reviro','Reviro es un juego de truco para jugar con amigos. Usarlo es gratis.'],
 ['Fichas','Las fichas no tienen valor en dinero: no se compran, no se venden y no se cambian por plata ni por monedas. Se ganan con las misiones y los logros, y se usan para las mesas con entrada, los torneos y la tienda. En las mesas con entrada y en los torneos, Reviro retiene el 10% de las fichas del pozo; el 90% restante es el premio que se muestra en pantalla.'],
 ['Monedas','Las monedas se ganan jugando o se compran con Mercado Pago. Sirven solo como otra forma de pago en la tienda (personajes, camisetas, dorsos y paños). No se cambian por fichas ni por dinero, no se transfieren a otras cuentas y no se reintegran, salvo que la compra no se haya acreditado.'],
 ['Abandonos','Abandonar una partida online cuenta como derrota. En las mesas con entrada, si alguien se va en los primeros 30 segundos, la partida se cancela y se devuelven todas las entradas. Después de eso, si alguien se desconecta, la partida espera 60 segundos: si no vuelve, pierde su entrada, que se reparte entre los rivales, y a su compañero se le devuelve la suya.'],
 ['Referidos','Si alguien se registra con tu link y juega su primera partida online, ganás monedas. Cada persona cuenta una sola vez. Crear cuentas falsas para cobrar referidos está prohibido.'],
 ['Conducta','No se permiten trampas, cuentas múltiples para sacar ventaja ni insultos. El administrador puede suspender cuentas y corregir saldos ante fraudes o errores, y esas acciones quedan registradas.'],
 ['Tus datos','Guardamos tu mail, tu nombre de usuario, tus estadísticas, tus fichas y monedas y tus compras, en Firebase (Google). No se venden ni se comparten. Podés pedirle al administrador que borre tu cuenta.'],
 ['Cambios','Si estos términos cambian, te vamos a pedir que los aceptes de nuevo. Queda registrada la fecha y la hora en que los aceptás.']];
const termsHTML=()=>`<div class="terms">${TERMS_TXT.map(([t,p],i)=>`<h3>${i+1}. ${esc(t)}</h3><p>${esc(p)}</p>`).join('')}<p class="note">Versión ${FB?NET.auth.TERMS_V:'2026-10'}.</p></div>`;

/* ---------- monedas con Mercado Pago (web con cuenta) ---------- */
let PAYCFG=null,MYPUR=[],PENDPUR=null,PAYSTEP=-1,payUnsubs=[];const PAYAPPLY=new Set();
let REFS=[],AUDIT=null,ADMU=null;const REFPAY=new Set(),GRANTAPPLY=new Set();
/* referidos y ajustes de saldo: se cobran solos, una sola vez */
function subRewards(){if(!FB)return;try{
  payUnsubs.push(NET.ref.watchMine(l=>{REFS=l;for(const x of l)if(x.played&&!x.paidReferrer&&!REFPAY.has(x.id)){REFPAY.add(x.id);const n=(MYUSER&&MYUSER.refBonus)||NET.REF_DEFAULT;
      applyTx('ref:'+x.id,{coins:n,earn:true}).then(()=>NET.ref.markPaid(x.id)).then(()=>{sfx('buy');toast(`${x.username||'Tu amigo'} jugó su primera partida: +${fmt(n)} monedas`)}).catch(()=>REFPAY.delete(x.id))}
    if(view==='profile')render()}));
  payUnsubs.push(NET.grants.watchMine(l=>{for(const x of l)if(!GRANTAPPLY.has(x.id)){GRANTAPPLY.add(x.id);
      applyTx('grant:'+x.id,{chips:x.chips||0,coins:x.coins||0}).then(()=>NET.grants.markApplied(x.id)).then(()=>{const p=[];if(x.chips)p.push((x.chips>0?'+':'')+fmt(x.chips)+' fichas');if(x.coins)p.push((x.coins>0?'+':'')+fmt(x.coins)+' monedas');toast('Ajuste del admin: '+p.join(' y ')+(x.reason?' ('+x.reason+')':''))}).catch(()=>GRANTAPPLY.delete(x.id))}}));
  if(isOwnerV)payUnsubs.push(NET.admin.watchAudit(l=>{AUDIT=l;if(view==='settings')render()}))}catch(e){}}
/* el que llega con el link de un amigo: al registrarse, queda como su referido y recibe monedas de bienvenida */
function claimReferral(){let code=null;try{code=localStorage.getItem('reviro.ref')}catch(e){}if(!code||code===WAL.fcode)return;
  try{localStorage.removeItem('reviro.ref')}catch(e){}
  NET.ref.byCode(code).then(r=>r&&r!==uid?NET.ref.claim(r):false).then(ok=>{if(ok)applyTx('ref-new',{coins:NET.REF_NEW,earn:true}).then(()=>toast(`Te sumaste con la invitación de un amigo: +${fmt(NET.REF_NEW)} monedas`))}).catch(()=>{})}
function refBoxHTML(){if(!FB)return'';const n=(MYUSER&&MYUSER.refBonus)||NET.REF_DEFAULT,played=REFS.filter(x=>x.played).length;
  return `<section class="box grow"><p class="note" style="margin:0">Por cada amigo que se registre con tu link y juegue su primera partida online, ganás <b>${fmt(n)}</b> monedas. Tu amigo arranca con ${fmt(NET.REF_NEW)} de regalo.</p>
    <div class="row" style="flex-wrap:nowrap"><a class="btn wa" href="${waHref(waInviteText())}" target="_blank" rel="noopener">${WAICO} Invitar por WhatsApp</a><button class="btn" data-a="copylink">Copiar link</button></div>
    ${REFS.length?`<p class="note" style="margin:0">Invitaste a ${REFS.length} ${REFS.length===1?'persona':'personas'}: ${played} ya ${played===1?'jugó':'jugaron'}.</p>`:''}
    ${fitList('refs',REFS,x=>`<li><span style="flex:1">${esc(x.username||'Jugador')}<small>${x.played?(x.paidReferrer?'Cobraste el premio':'Jugó: cobrando…'):'Todavía no jugó online'}</small></span></li>`,'flist')}</section>`}
function bannedHTML(){const r=MYUSER&&MYUSER.bannedReason;return `<div class="gate">${fileteHTML('gtitle')}<section class="box"><h2>Tu cuenta está suspendida</h2><p>${r?'Motivo: '+esc(r)+'. ':''}Si creés que es un error, hablá con el administrador.</p><button class="btn ghost" data-a="logout">Cerrar sesión</button></section></div>`}

/* ---------- administración: vista completa de un jugador ---------- */
function openAdmUser(id){ADMU={uid:id,loading:true};overlayView='admuser';render();NET.admin.user(id).then(d=>{if(ADMU&&ADMU.uid===id){ADMU=Object.assign({uid:id},d);render()}}).catch(()=>{ADMU={uid:id,error:true};render()})}
function admUserHTML(){const d=ADMU||{};const u=d.user;
  if(d.loading||!u)return `<div class="over" data-a="close"><div class="panel" data-stop><p class="note">${d.error?'No se pudo cargar el jugador.':'Cargando…'}</p><button class="btn ghost" data-a="close">Cerrar</button></div></div>`;
  const s=u.stats||{},w=d.wallet||{};
  return `<div class="over" data-a="close"><div class="panel apanel" data-stop>
    <div class="row" style="align-items:center;gap:12px;flex-wrap:nowrap">${avatarSVG(AVM[u.avatar]?u.avatar:'gaucho',56)}<div style="text-align:left;min-width:0"><h2 style="font-size:1.6rem">${esc(u.username||'—')}</h2><p class="note" style="margin:0">${u.role==='admin'?'Admin':'Jugador'}${u.banned?' · <b style="color:var(--bad)">Suspendido</b>':''}${u.terms?' · aceptó los términos':' · sin aceptar términos'}</p></div></div>
    <div class="stats"><div class="stat-b"><small>Partidas</small><b>${fmt(s.played||0)}</b></div><div class="stat-b"><small>Ganadas</small><b>${fmt(s.wins||0)}</b></div><div class="stat-b"><small>Racha</small><b>${s.currentStreak||0}</b></div>
      <div class="stat-b"><small>Fichas</small><b>${fmt(w.chips||0)}</b></div><div class="stat-b"><small>Monedas</small><b>${fmt(w.coins||0)}</b></div><div class="stat-b"><small>Referidos</small><b>${(d.referred||[]).length}</b></div></div>
    <p class="note" style="text-align:left">${d.referredBy?'Llegó invitado por otro jugador. ':''}${(d.purchases||[]).length?'Compras: '+d.purchases.map(x=>fmt(x.coins)+' monedas ('+x.status+')').join(', ')+'.':'Sin compras.'}</p>
    <form class="aform" data-form="admgrant"><h3>Ajustar saldo</h3><div class="row" style="flex-wrap:nowrap"><label class="field"><span>Fichas (+/−)</span><input class="tin" id="agchips" type="number" step="1" value="0"></label><label class="field"><span>Monedas (+/−)</span><input class="tin" id="agcoins" type="number" step="1" value="0"></label></div>
      <label class="field"><span>Motivo</span><input class="tin" id="agreason" maxlength="120" placeholder="Ej.: compensación por error"></label><button class="btn prim" type="submit">Aplicar ajuste</button></form>
    <form class="aform" data-form="admref"><h3>Premio por cada referido</h3><div class="row" style="flex-wrap:nowrap"><input class="tin" id="arefb" type="number" min="0" step="50" value="${u.refBonus||NET.REF_DEFAULT}"><button class="btn" type="submit">Guardar</button></div><p class="note" style="margin:0">Subilo para los que traen más amigos.</p></form>
    <form class="aform" data-form="admban"><h3>${u.banned?'Cuenta suspendida':'Suspender cuenta'}</h3>${u.banned?'':`<input class="tin" id="abanr" maxlength="120" placeholder="Motivo (lo ve el jugador)">`}<button class="btn ${u.banned?'brass':'warn'}" type="submit">${u.banned?'Reactivar cuenta':'Suspender'}</button></form>
    <button class="btn ghost" data-a="close">Cerrar</button></div></div>`}
function auditHTML(){if(!FB||!isOwnerV)return'';const L=AUDIT||[];
  return `<section class="box admin grow"><p class="note" style="margin:0">Todo lo que hacen los admins queda acá y no se puede borrar.</p>
    ${AUDIT===null?'<p class="note">Cargando…</p>':fitList('adm-audit',L.slice(0,200),x=>`<li><span style="flex:1">${esc(x.action)}<small>${esc(x.byName||'admin')} · ${esc(tFmtDate(x.at))}${x.target?' · '+esc(String(x.target).slice(0,24)):''}</small></span></li>`,'flist','<p class="note">Todavía no hay acciones.</p>')}</section>`}
/* ---------- monedas con Mercado Pago (web con cuenta) ---------- */
function subPay(){if(!FB||payUnsubs.length)return;try{
  payUnsubs.push(NET.pay.watchConfig(c=>{PAYCFG=c;if(view==='shop'||view==='settings')render()}));
  payUnsubs.push(NET.pay.watchMine(l=>{MYPUR=l.sort((a,b)=>b.at-a.at);
    /* las compras acreditadas por el admin se suman solas, una sola vez */
    for(const x of l)if(x.status==='acreditada'&&!x.applied&&!PAYAPPLY.has(x.id)){PAYAPPLY.add(x.id);
      applyTx('mp:'+x.id,{coins:x.coins}).then(()=>NET.pay.markApplied(x.id)).then(()=>{sfx('buy');toast(`¡Se acreditaron ${fmt(x.coins)} monedas!`)}).catch(()=>PAYAPPLY.delete(x.id))}
    if(view==='shop')render()}));
  if(isOwnerV)payUnsubs.push(NET.pay.watchPending(l=>{PENDPUR=l;if(view==='settings')render()}))}catch(e){}}
function mpShopHTML(){const links=(PAYCFG&&PAYCFG.links)||[],alias=PAYCFG&&PAYCFG.alias;
  return `<p class="note snote">Con monedas también se paga en la tienda. Se compran con Mercado Pago y se acreditan cuando se confirma el pago. No se cambian por fichas ni por plata.</p>
    ${fitList('shop-mp',PACKS.map((p,i)=>Object.assign({i},p)),p=>{const i=p.i,link=links[i];return `<div class="item pack"><div class="prev">${coinI.replace('class="coin"','class="coin" style="width:26px;height:26px"')}${fmt(p.coins)}</div><b>${fmt(p.coins)} monedas</b><p>${p.tag?`<span class="tag">${p.tag}</span> `:''}<span class="ars">$ ${fmt(p.ars)}</span></p>
      ${PAYSTEP===i?`<button class="btn prim" data-a="mpdone" data-i="${i}">Ya pagué</button><button class="btn ghost sm" data-a="mpcancel">Cancelar</button>`
       :link?`<a class="btn mp" href="${esc(link)}" target="_blank" rel="noopener" data-a="mppay" data-i="${i}">Mercado Pago</a>`
       :alias?`<button class="btn mp" data-a="mppay" data-i="${i}">Mercado Pago</button>`
       :'<button class="btn" disabled>No habilitado</button>'}</div>`},'items')}
    ${PAYSTEP>=0&&!links[PAYSTEP]&&alias?`<p class="note snote">Transferí $ ${fmt(PACKS[PAYSTEP].ars)} al alias <b>${esc(alias)}</b> y tocá «Ya pagué».</p>`:''}
    ${MYPUR.length?`<button type="button" class="linkrow" data-a="ov" data-v="compras">Tus compras (${MYPUR.length})</button>`:''}`}
function comprasHTML(){const st={pendiente:'Esperando confirmación',acreditada:'Acreditada',rechazada:'No se encontró el pago'};
  return `<div class="over" data-a="close"><div class="panel lpanel" data-stop><h2>Tus compras</h2>${fitList('compras',MYPUR,x=>`<li><span style="flex:1">${fmt(x.coins)} monedas · $ ${fmt(x.ars)}<small>${esc(tFmtDate(x.at))}</small></span><span class="tst ${x.status==='acreditada'?'open':x.status==='rechazada'?'cancelled':'running'}">${st[x.status]||x.status}</span></li>`,'flist')}<button class="btn ghost" data-a="close">Cerrar</button></div></div>`}
function mpAdminHTML(){if(!FB||!isOwnerV)return'';const c=PAYCFG||{links:[],alias:''};
  return `<section class="box admin"><p class="note" style="margin:0">En Mercado Pago: <b>Cobrar → Link de pago</b>, poné el monto de cada paquete y pegá el link. O dejá solo tu alias.</p>
    <form class="mpform" data-form="mpcfg">${PACKS.map((p,i)=>`<label class="field mpl"><span>${fmt(p.coins)} · $ ${fmt(p.ars)}</span><input class="tin" id="mpl${i}" placeholder="https://mpago.la/…" value="${esc(c.links&&c.links[i]||'')}"></label>`).join('')}
      <label class="field mpl"><span>Alias</span><input class="tin" id="mpalias" placeholder="tu.alias.mp" value="${esc(c.alias||'')}"></label>
      <button class="btn prim" type="submit">Guardar cobros</button></form></section>`}
function mpPendHTML(){if(!FB||!isOwnerV)return'';const P=PENDPUR||[];
  return `<section class="box admin grow">${PENDPUR===null?'<p class="note">Cargando…</p>':fitList('adm-pend',P,x=>`<li><span style="flex:1">${esc(x.username||'Jugador')} · ${fmt(x.coins)} monedas<small>$ ${fmt(x.ars)} · ${esc(tFmtDate(x.at))}</small></span><button class="btn sm brass" data-a="mpok" data-id="${esc(x.id)}">Acreditar</button><button class="btn sm ghost" data-a="mpno" data-id="${esc(x.id)}">Rechazar</button></li>`,'flist','<p class="note">No hay pagos esperando.</p>')}
    <p class="note" style="margin:0">Antes de acreditar, fijate en tu cuenta de Mercado Pago que el pago haya entrado.</p></section>`}
/* ---------- eventos ---------- */
document.addEventListener('click',e=>{unlockSound();ac();const t=e.target.closest('[data-a],[data-set],[data-card]');if(SELCARD&&!(t&&t.dataset.card)){SELCARD=null;if(!t){render();return}}if(!t)return;
  if(t.dataset.a==='close'&&t.classList.contains('over')&&e.target!==t)return;
  if(t.dataset.set){const k=t.dataset.set,v=t.dataset.v;const val=v==='true'?true:v==='false'?false:(isNaN(+v)?v:+v);
    if(k==='anot.target'){ANOT.target=val;ANOT.s=ANOT.s.map(x=>Math.min(x,val));saveAnot();render();return}
    if(k.startsWith('tn.')){TN[k.slice(3)]=val;render();return}
    if(k.startsWith('on.'))SET.on[k.slice(3)]=val;else SET[k]=val;saveSet();render();return}
  if(t.dataset.card){const c=t.dataset.card;if(SET.tap2!==false&&SELCARD!==c){SELCARD=c;sfx('card');render();return}SELCARD=null;doAction({t:'play',card:c});return}
  const a=t.dataset.a;
  if(a!=='anreset')anotConfirm=false;if(a!=='mazo')confirmMazo=false;if(a!=='exit')confirmExit=false;if(!['tourleave','tourstart','tourcancel'].includes(a))tourConfirm=null;if(a!=='buy'&&a!=='prebuy'&&a!=='pack'&&a!=='prepack')pendingBuy=null;
  switch(a){
  case 'nav':overlayView=null;view=t.dataset.v;render();return;
  case 'ptab':PT[t.dataset.k]=t.dataset.v;render();return;
  case 'pg':{const k=t.dataset.k;FITP[k]=Math.max(0,(FITP[k]||0)+(+t.dataset.d));render();return}
  case 'ov':overlayView=t.dataset.v;render();return;
  case 'shopgo':shopTab=t.dataset.v;view='shop';render();return;
  case 'load':overlayView='load';render();return;
  case 'close':if(overlayView==='termsAccept')return;overlayView=null;render();return;
  case 'terms':{const c=document.getElementById('aterms');if(c)TOSOK=c.checked;overlayView='terms';render();return}
  case 'tosaccept':NET.auth.acceptTerms().then(()=>{overlayView=null;render();toast('¡Gracias! Ya podés seguir jugando')}).catch(()=>toast('No se pudo guardar. Probá de nuevo.'));return;
  case 'shopcoins':if(view==='game'||view==='room'){toast('Terminá la partida para ir a la tienda');return}shopTab='coins';view='shop';render();return;
  case 'sound':SET.mute=!SET.mute;saveSet();renderSnd();musicUpdate();if(!SET.mute)setTimeout(()=>sfx('pts'),60);if(view==='profile')render();return;
  case 'toggle':SET[t.dataset.k]=!SET[t.dataset.k];saveSet();renderSnd();render();musicUpdate();return;
  case 'admuser':openAdmUser(t.dataset.id);return;
  case 'tourwith':overlayView=null;tourJoin(null,t.dataset.id);return;
  case 'tourround':if(TV){TV.round=+t.dataset.v;render()}return;
  case 'tourall':if(TV){TV.all=true;render()}return;
  case 'tourpause':if(TV&&TV.t)NET.tour.pause(TV.t.id,TV.t.status!=='paused').then(()=>toast(TV.t.status==='paused'?'Torneo en pausa':'Torneo reanudado')).catch(()=>toast('No se pudo'));return;
  case 'mppay':PAYSTEP=+t.dataset.i;setTimeout(render,50);return;
  case 'mpcancel':PAYSTEP=-1;render();return;
  case 'mpdone':{const p=PACKS[+t.dataset.i];PAYSTEP=-1;NET.pay.request(+t.dataset.i,p.coins,p.ars).then(()=>toast('Listo: cuando se confirme el pago, las monedas se suman solas')).catch(()=>toast('No se pudo avisar el pago. Probá de nuevo.'));render();return}
  case 'mpok':case 'mpno':NET.pay.decide(t.dataset.id,a==='mpok').then(()=>toast(a==='mpok'?'Monedas acreditadas':'Pago rechazado')).catch(()=>toast('No se pudo'));return;
  case 'hkit':HKIT=t.dataset.id;render();return;
  case 'shoptab':shopTab=t.dataset.v;render();return;
  case 'prebuy':pendingBuy=t.dataset.t+':'+t.dataset.id+(t.dataset.c?':coins':'');render();return;
  case 'buy':{const ty=t.dataset.t,id=t.dataset.id,list=ty==='av'?AVM:ty==='dorso'?DM:ty==='kit'?KITM:PM,it=list[id];pendingBuy=null;if(it)buy(ty,id,it.price,it.name,t.dataset.c);return}
  case 'equip':equip(t.dataset.t,t.dataset.id);return;
  case 'prepack':if(!PREMIUM){toast('Solo para cuentas premium');return}pendingBuy='pack:'+t.dataset.i;render();return;
  case 'pack':{if(!PREMIUM){toast('Solo para cuentas premium');return}const p=PACKS[+t.dataset.i];pendingBuy=null;if(p){applyTx('pack-'+Date.now(),{coins:p.coins}).then(()=>{sfx('buy');toast('Compra de prueba: +'+fmt(p.coins)+' monedas, sin cobro')})}return}
  case 'add':if(!PREMIUM){toast('Solo para cuentas premium');return}applyTx('load-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),{chips:+t.dataset.v});overlayView=null;toast('Cargaste '+fmt(t.dataset.v)+' fichas de práctica');render();return;
  case 'tour':openTour(t.dataset.id);return;
  case 'soloopts':overlayView='soloopts';render();return;
  case 'onopts':overlayView='onopts';render();return;
  case 'tourbooks':TVB=null;render();return;
  case 'tournew':view='tournew';render();return;
  case 'tourjoin':tourJoin(t.dataset.team);return;
  case 'tourleave':tourLeave();return;
  case 'tourstart':tourStart();return;
  case 'tourcancel':tourCancel();return;
  case 'tourplay':tourPlay(t.dataset.mid);return;
  case 'tourwo':if(TV&&TV.t)NET.tour.walkover(TV.t.id,t.dataset.mid,t.dataset.w).then(()=>toast('Partido dado por ganado')).catch(()=>toast('No se pudo'));return;
  case 'tourforce':if(T&&T.tour)NET.tour.startMatchRoom(T.code,tourBuild,true).then(r=>{if(!r.ok)toast('Todavía no se puede')}).catch(()=>toast('No se pudo empezar'));return;
  case 'tourback':{const tid=T&&T.tour&&T.tour.tid;if(view==='game'&&inProgress()){toast('Terminá la partida primero');return}leaveTable(true);if(tid)openTour(tid);return}
  case 'solo':overlayView=null;startSolo();return;
  case 'create':overlayView=null;createTable();return;
  case 'join':case 'rejoin':openTable(t.dataset.code);return;
  case 'sit':sit(+t.dataset.i);return;
  case 'addbot':setSeat(+t.dataset.i,{id:null,bot:true});return;
  case 'kick':setSeat(+t.dataset.i,{id:null,bot:false});return;
  case 'start':startOnline();return;
  case 'leave':leaveTable(false);return;
  case 'copy':{const c=T&&T.code;if(!c)return;try{navigator.clipboard.writeText(c).then(()=>toast('Código copiado'),()=>toast('Código: '+c))}catch(err){toast('Código: '+c)}return}
  case 'lesson':startLesson(+t.dataset.i);return;
  case 'track':{const id=t.dataset.id;if(id==='off')SET.music=false;else{SET.music=true;SET.track=id}saveSet();musicUpdate(true);render();if(id!=='off')toast('Sonando: '+TRACKS[id].name);return}
  case 'invite':sendInvite(t.dataset.id);return;
  case 'quick':quickPlay();return;
  case 'fillstart':fillAndStart();return;
  case 'invgo':acceptInvite(true);return;
  case 'invno':acceptInvite(false);return;
  case 'welcome':if(t.dataset.v==='learn'){startLesson(0)}else if(t.dataset.v==='tut'){view='tutorial';render()}else{view='menu';render()}return;
  case 'zone':giraZone=t.dataset.id;FITP['riv-'+giraZone]=0;if(!t.dataset.keep&&innerWidth<720)overlayView='rivales';render();return;
  case 'girago':startGira(t.dataset.id);return;
  case 'regav':regAv=t.dataset.id;document.querySelectorAll('.regav').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===regAv)));return;
  case 'google':googleIn();return;
  case 'sharex':overlayView=null;render();return;
  case 'sharemk':makeShare();return;
  case 'sharego':shareNative();return;
  case 'sharedl':shareDownload();return;
  case 'authv':AUTHV=t.dataset.v;AUTHERR='';render();return;
  case 'logout':NET.auth.logout();return;
  case 'reverify':NET.auth.resendVerification().then(()=>toast('Te mandamos el mail de verificación')).catch(()=>toast('No se pudo mandar el mail'));return;
  case 'admclose':NET.admin.closeRoom(t.dataset.id).then(()=>toast('Sala cerrada')).catch(()=>toast('No se pudo cerrar'));return;
  case 'admrole':NET.admin.setRole(t.dataset.id,t.dataset.v).then(()=>toast(t.dataset.v==='admin'?'Ahora es admin':'Ya no es admin')).catch(()=>toast('No se pudo cambiar el rol'));return;
  case 'an':anotAdd(+t.dataset.t,+t.dataset.d);return;
  case 'anundo':anotUndo();return;
  case 'anreset':if(!anotConfirm){anotConfirm=true;render();return}anotConfirm=false;ANOT.s=[0,0];ANOT.hist=[];saveAnot();render();return;
  case 'prem':setPremium(t.dataset.id,t.dataset.on==='1');return;
  case 'rscope':rankScope=t.dataset.v;render();return;
  case 'copylink':{const l=friendLink();try{navigator.clipboard.writeText(l).then(()=>toast('Link copiado: mandáselo a tu amigo'),()=>toast(l))}catch(err){toast(l)}return}
  case 'next':if(G&&G.hand.ended&&!G.matchOver&&(mode==='offline'||controllerSeat()===mySeat)){clearTimeout(driveT);commit(nextHand(G))}return;
  case 'quiero':case 'noquiero':case 'flor':case 'achico':case 'contra':case 'resto':doAction({t:a});return;
  case 'mazo':if(!confirmMazo){confirmMazo=true;render();return}confirmMazo=false;doAction({t:'mazo'});return;
  case 'panel':panel=panel===t.dataset.v?null:t.dataset.v;render();return;
  case 'react':sendReact(t.dataset.k);return;
  case 'sena':sendSena(t.dataset.k);return;
  case 'exit':if(!confirmExit){confirmExit=true;render();return}confirmExit=false;abandonCurrent();toMenu();return;
  case 'tomenu':toMenu();return;
  case 'rematch':if(CAMP){startGira(CAMP.rid);return}if(mode==='offline'){Object.assign(SET,{n:cfg.n,target:cfg.target,stake:cfg.stake,diff:cfg.diff,flor:cfg.flor});startSolo()}else if(isHost)startOnline();return;
  }
  if(a&&a.startsWith('env:')){doAction({t:'envido',kind:a.slice(4)});return}
  if(a&&a.startsWith('truco:')){doAction({t:'truco',level:+a.slice(6)});return}
});
/* la onda dorada al tocar: va en una capa aparte, así sigue aunque la pantalla se redibuje con el toque */
document.addEventListener('pointerdown',e=>{const el=e.target.closest('button,.btn,.rowb,.mode,.tcard,.mz,a.pill');if(!el||el.disabled||el.closest('.hand'))return;
  try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(err){}
  const r=el.getBoundingClientRect();if(r.width<8)return;const w=document.createElement('div');w.className='ripple';
  const br=getComputedStyle(el).borderRadius;w.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${br}`;
  const d=Math.hypot(r.width,r.height)*2.1,i=document.createElement('i');i.style.cssText=`left:${e.clientX-r.left}px;top:${e.clientY-r.top}px;width:${d}px;height:${d}px`;
  w.appendChild(i);document.body.appendChild(w);setTimeout(()=>w.remove(),560)},{passive:true});
document.addEventListener('keydown',e=>{const t=e.target;if((e.key==='Enter'||e.key===' ')&&t.classList&&t.classList.contains('zp')){e.preventDefault();giraZone=t.dataset.id;if(innerWidth<720)overlayView='rivales';render()}});
document.addEventListener('input',e=>{const vk=e.target.dataset&&e.target.dataset.vol;if(vk){SET[vk]=+e.target.value;const o=document.getElementById('vo-'+vk);if(o)o.textContent=SET[vk]+'%';musicVolume();saveSet();return}
  const k={tname:'name',ttheme:'theme',tdate:'date',trules:'rules'}[e.target.id];if(k)TN[k]=e.target.value});
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.vol){sfx('pts');return}
  const m=/^an([01])$/.exec(e.target.id||'');if(m){ANOT.names[+m[1]]=cleanNick(e.target.value)||(m[1]==='0'?'Nosotros':'Ellos');saveAnot()}});
document.addEventListener('submit',e=>{const fa=e.target.closest('[data-form="login"],[data-form="register"],[data-form="complete"],[data-form="reset"]');if(fa){e.preventDefault();authSubmit(fa.dataset.form);return}
  const fg=e.target.closest('[data-form="admgrant"]');if(fg&&ADMU){e.preventDefault();const c=+fval('agchips')||0,m=+fval('agcoins')||0;if(!c&&!m){toast('Poné cuántas fichas o monedas');return}
    NET.admin.grant(ADMU.uid,{chips:c,coins:m,reason:fval('agreason')}).then(()=>{toast('Ajuste enviado: se le suma cuando abra Reviro');openAdmUser(ADMU.uid)}).catch(()=>toast('No se pudo'));return}
  const fr2=e.target.closest('[data-form="admref"]');if(fr2&&ADMU){e.preventDefault();NET.admin.setRefBonus(ADMU.uid,fval('arefb')).then(()=>{toast('Premio por referido guardado');openAdmUser(ADMU.uid)}).catch(()=>toast('No se pudo'));return}
  const fb2=e.target.closest('[data-form="admban"]');if(fb2&&ADMU&&ADMU.user){e.preventDefault();const on=!ADMU.user.banned;NET.admin.setBanned(ADMU.uid,on,fval('abanr')).then(()=>{toast(on?'Cuenta suspendida':'Cuenta reactivada');openAdmUser(ADMU.uid)}).catch(()=>toast('No se pudo'));return}
  const fm=e.target.closest('[data-form="mpcfg"]');if(fm){e.preventDefault();NET.pay.saveConfig({links:PACKS.map((_,i)=>($('#mpl'+i)||{}).value||''),alias:($('#mpalias')||{}).value||''}).then(()=>toast('Cobros guardados')).catch(()=>toast('No se pudo guardar'));return}
  const ft=e.target.closest('[data-form="tour"]');if(ft){e.preventDefault();tourCreate();return}
  const fr=e.target.closest('[data-form="reg"]');if(fr){e.preventDefault();doRegister();return}
  const fp=e.target.closest('[data-form="prem"]');if(fp){e.preventDefault();premiumByCode($('#premin').value);return}
  const fn=e.target.closest('[data-form="nick"]');if(fn){e.preventDefault();saveNick($('#nickin').value);return}
  const ff=e.target.closest('[data-form="friend"]');if(ff){e.preventDefault();addFriendByCode($('#friendin').value);return}
  const f=e.target.closest('[data-form="join"]');if(!f)return;e.preventDefault();const c=($('#joincode').value||'').trim().toUpperCase();
  if(!/^[A-Z]{4}$/.test(c)){toast('El código tiene cuatro letras');return}openTable(c)});

/* fuera de claude.ai (por ejemplo, en GitHub Pages) el juego corre en modo local: todo se guarda en este dispositivo */
const FB=!(window.claude&&typeof window.claude.use==='function')&&!!(window.REVIRO_FIREBASE&&window.REVIRO_FIREBASE.apiKey);
const LOCAL=!(window.claude&&typeof window.claude.use==='function')&&!FB;
async function start(data){
  view='boot';
  try{const m=/^#a-([A-Z0-9]{6})$/i.exec(location.hash||'');if(m)localStorage.setItem('reviro.ref',m[1].toUpperCase())}catch(e){}
  if(data&&data.G&&data.mode==='offline'){mode='offline';mySeat=0;view='game';cfg=data.cfg;botLooks=data.botLooks||pickBotLooks(data.G.n);G=data.G}
  renderSnd();renderWallet();render();drive();
  setInterval(presenceTick,3000);setInterval(turnTick,500);setInterval(()=>{if(view==='room'&&T&&T.tour&&T.status==='waiting')render()},15000);setInterval(tourTick,1000);
  try{CL=window.claude;if(CL&&CL.use){[db,usr,roomCap]=await Promise.all([CL.use('db'),CL.use('user'),CL.use('room')]);uid=usr?await usr.id():null;if(usr){try{const me=await usr.me();myName=me.name||'';myEmail=me.email||null}catch(e){}try{isOwnerV=!!(await usr.isOwner())}catch(e){}}}}catch(e){db=null}
  if(FB){await waitNET();if(!window.NET){$('#view').innerHTML=`<div class="gate">${fileteHTML('gtitle')}<section class="box"><h2>No se pudo conectar</h2><p>No pudimos llegar al servidor del juego. Revisá tu conexión y recargá la página.</p></section></div>`;return}
    if(view!=='game')view='boot';render();NET.auth.onChange(info=>onFbUser(info));return}
  if(LOCAL){await loadWallet();if(!WAL.registered){if(view!=='game')view='register';regAv=AVM[WAL.eq.av]&&!AVM[WAL.eq.av].price?WAL.eq.av:'gaucho'}else if(view==='boot')view='menu';render();return}
  if(!uid||!db){if(view!=='game')view='login';render();return}
  PREMIUM=isOwnerV;await loadWallet();
  if(!WAL.registered){view='register';regAv=AVM[WAL.eq.av]&&!AVM[WAL.eq.av].price?WAL.eq.av:'gaucho'}else if(view==='boot')view='menu';
  subLobby();subFriends();subPremium();subAdmin();subInvites();checkInviteHash();render()}
try{window.claude?.hot?.snapshot?.(()=>({G:mode==='offline'?G:null,cfg,mode,botLooks}))}catch(e){}
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
