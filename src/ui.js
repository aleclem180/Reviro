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
function cardArt(c,fr,mid){/* mid trae los palos o la figura */if(CARDIMG[c])return CARDIMG[c];
  if(CARDDEFS===null)CARDDEFS=['gPapel','fLapiz','fGrano'].map(id=>{const el=document.getElementById(id);return el?el.outerHTML:''}).join('')+['O','C','E','B'].map(s=>{const A=CARDART['sym'+s];return `<symbol id="p${s}" viewBox="0 0 ${A.w} ${A.h}" preserveAspectRatio="none"><image href="${A.src}" width="${A.w}" height="${A.h}"/></symbol>`}).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 90" width="360" height="540"><defs>${CARDDEFS}</defs><rect x=".5" y=".5" width="59" height="89" rx="4.6" fill="url(#gPapel)" stroke="#b9a27a" stroke-width=".7"/><rect x=".5" y=".5" width="59" height="89" rx="4.6" fill="#fff" filter="url(#fGrano)" opacity=".28"/><g transform="rotate(32 30 45)" filter="url(#fLapiz)"><g transform="rotate(-32 30 45)">${fr}</g></g>${mid}</svg>`;
  const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);CARDIMG[c]=uri;rasterCard(c,uri);return uri}
/* y después se pasa a mapa de bits, que es lo más liviano para mover en pantalla */
function rasterCard(c,uri){try{const im=new Image();im.onload=()=>{try{const cv=document.createElement('canvas');cv.width=360;cv.height=540;cv.getContext('2d').drawImage(im,0,0,360,540);
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
let view='menu',mode=null,G=null,mySeat=0,cfg=null,CL=null,db=null,usr=null,uid=null,roomCap=null,R=null,myName='';
let T=null,tableRef=null,unsubTable=null,unsubLobby=null,lobby=[],NAMES={},LOOKS={},isHost=false,busy=false,driveT=null;
let confirmMazo=false,confirmExit=false,overlayView=null,shopTab='av',pendingBuy=null,panel=null,FX={},transient={},botLooks={},partnerSena=null,lastReward=null;
const SET={diff:'medio',n:2,target:30,stake:0,flor:true,sound:true,music:true,mute:false,track:'zamba',hflor:true,help:true,on:{n:2,target:30,stake:0,flor:true}};
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
const RECIPES={
  card:()=>synth(.1,o=>{addNoise(o,0,.09,.9,.55);addTone(o,180,0,.05,'sine',.25)}),
  deal:()=>synth(.36,o=>{for(let k=0;k<3;k++)addNoise(o,k*.11,.07,.8,.6)}),
  call:()=>synth(.36,o=>{addTone(o,523,0,.18,'tri',.45);addTone(o,784,.09,.26,'tri',.45)}),
  pts:()=>synth(.18,o=>addTone(o,988,0,.16,'sine',.5)),
  buy:()=>synth(.3,o=>{addTone(o,784,0,.12,'sine',.45);addTone(o,1175,.08,.2,'sine',.45)}),
  win:()=>synth(.8,o=>[523,659,784,1047].forEach((f,i)=>addTone(o,f,i*.11,.34,'tri',.42))),
  lose:()=>synth(.8,o=>[392,330,262].forEach((f,i)=>addTone(o,f,i*.15,.4,'sine',.5))),
};
function wavURL(s){const n=s.length,buf=new ArrayBuffer(44+n*2),v=new DataView(buf);const w=(o,str)=>{for(let i=0;i<str.length;i++)v.setUint8(o+i,str.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,SR,true);v.setUint32(28,SR*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,s[i]))*32767,true);
  let bin='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=8192)bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return 'data:audio/wav;base64,'+btoa(bin)}
function unlockSound(){if(SNDREADY)return;SNDREADY=true;setTimeout(musicUpdate,30);
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  const c=ac();if(c){try{const b=c.createBuffer(1,1,SR),src=c.createBufferSource();src.buffer=b;src.connect(c.destination);src.start(0)}catch(e){}}
  for(const k in RECIPES){const samples=RECIPES[k];const s=samples();const entry={s,el:null};SNDS[k]=entry;
    try{const a=new Audio(wavURL(s));a.preload='auto';a.muted=true;const p=a.play();if(p&&p.then)p.then(()=>{a.pause();a.currentTime=0;a.muted=false;entry.el=a}).catch(()=>{entry.el=null});else{a.pause();a.muted=false;entry.el=a}}catch(e){entry.el=null}}}
function playWA(s){const c=ac();if(!c)return;try{const b=c.createBuffer(1,s.length,SR);b.getChannelData(0).set(s);const src=c.createBufferSource(),g=c.createGain();g.gain.value=.9;src.buffer=b;src.connect(g);g.connect(c.destination);src.start()}catch(e){}}
function sfx(n){if(!SET.sound||SET.mute)return;const e=SNDS[n];if(!e)return;
  if(e.el){try{e.el.currentTime=0;const p=e.el.play();if(p&&p.catch)p.catch(()=>playWA(e.s))}catch(err){playWA(e.s)}}else playWA(e.s)}
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
  if(WAL.daily!==today){WAL.daily=today;await applyTx('daily-'+today,{coins:30});toast('Premio del día: +30 monedas')}
  if(!WAL.fcode){WAL.fcode=genFriendCode();saveWallet()}
  if(!WAL.th2){WAL.th2=1;if(WAL.eq.pano==='bordo')WAL.eq.pano='quincho';if(WAL.eq.dorso==='bordo')WAL.eq.dorso='pampa';saveWallet()}
  ensureMissions();writeLooks();render()}
function mergeWal(d){for(const k of ['chips','coins','daily','th2','nick','fcode','registered','copas'])if(d[k]!==undefined)WAL[k]=d[k];
  if(Array.isArray(d.owned))WAL.owned=d.owned;if(d.mis)WAL.mis=d.mis;if(d.ach)WAL.ach={cnt:d.ach.cnt||{},done:d.ach.done||[]};if(Array.isArray(d.evk))WAL.evk=d.evk;if(Array.isArray(d.tut))WAL.tut=d.tut;if(Array.isArray(d.friends))WAL.friends=d.friends;if(d.gira)WAL.gira={beat:d.gira.beat||{},bosses:d.gira.bosses||[]};if(d.tours&&typeof d.tours==='object')WAL.tours=d.tours;if(Array.isArray(d.applied))WAL.applied=d.applied;
  if(d.eq)WAL.eq=Object.assign({},WAL.eq,d.eq);if(d.stats)WAL.stats=Object.assign({},WAL.stats,d.stats)}
async function saveWallet(){const body=JSON.parse(JSON.stringify(WAL));try{localStorage.setItem(walKey(),JSON.stringify(body))}catch(e){}
  if(walRef){try{await walRef.set(body)}catch(e){walRef=null}}}
function applyTx(key,d){walQ=walQ.then(async()=>{if(WAL.applied.includes(key))return false;
    if((d.coins||0)<0&&WAL.coins+d.coins<0)return false;
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
async function buy(type,id,price,name){const ok=await applyTx('buy-'+type+'-'+id,{coins:-price,own:type+':'+id});
  if(ok){sfx('buy');toast('¡Compraste '+name+'!');equip(type,id)}else toast('No te alcanzan las monedas')}

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
function render(){const v=$('#view');document.body.dataset.view=view;
  if(view==='boot')v.innerHTML=bootHTML();
  else if(view==='auth')v.innerHTML=authHTML();
  else if(view==='login')v.innerHTML=loginHTML();
  else if(view==='register')v.innerHTML=registerHTML();
  else if(view==='welcome')v.innerHTML=welcomeHTML();
  else if(view==='anotador')v.innerHTML=tabsHTML()+backX()+anotHTML();
  else if(view==='gira')v.innerHTML=tabsHTML()+giraHTML();
  else if(view==='extra')v.innerHTML=tabsHTML()+extraHTML();
  else if(view==='settings')v.innerHTML=tabsHTML()+settingsHTML();
  else if(view==='rules')v.innerHTML=tabsHTML()+backX()+rulesHTML().replace('<details class="rules">','<details class="rules" open>');
  else if(view==='tutorial')v.innerHTML=tabsHTML()+backX()+`<div class="grid">${tutorialBoxHTML()}</div>`;
  else if(view==='menu')v.innerHTML=tabsHTML()+playHTML();
  else if(view==='torneos')v.innerHTML=tabsHTML()+toursPageHTML();
  else if(view==='tour')v.innerHTML=tabsHTML()+tourHTML();
  else if(view==='tournew')v.innerHTML=tabsHTML()+tourNewHTML();
  else if(view==='shop')v.innerHTML=tabsHTML()+backX()+shopHTML();
  else if(view==='profile')v.innerHTML=tabsHTML()+profileHTML();
  else if(view==='missions')v.innerHTML=tabsHTML()+backX()+missionsHTML();
  else if(view==='ranking')v.innerHTML=tabsHTML()+backX()+rankingHTML();
  else if(view==='room')v.innerHTML=roomHTML();
  else if(view==='game')v.innerHTML=gameHTML();
  if(view==='torneos'||view==='tour')requestAnimationFrame(animatePots);
  const dealt=view==='game'&&FX.deal;$('#overlay').innerHTML=overlayHTML();FX={};musicUpdate();
  /* al repartir, si la mano queda fuera de la pantalla, se acomoda la vista para ver la mesa y las cartas juntas */
  if(dealt)requestAnimationFrame(()=>{const f=document.querySelector('.felt'),hd=document.querySelector('.hand');if(!f||!hd)return;const r=hd.getBoundingClientRect();if(r.bottom>innerHeight)window.scrollTo({top:Math.max(0,f.getBoundingClientRect().top+scrollY-8),behavior:'smooth'})});
  {const pl=document.querySelector('.pills');if(pl)pl.style.visibility=(view==='auth'||view==='boot'||view==='login')?'hidden':'visible'}
  if(view==='room'&&T){const ids=T.seats.filter(s=>s.id).map(s=>s.id);ensureNames(ids);fetchLooks(ids)}
  if(view==='game'&&mode==='online'&&G){const ids=G.seats.filter(s=>s.id).map(s=>s.id);ensureNames(ids);fetchLooks(ids)}
  if(view==='menu'&&lobby.length)ensureNames(lobby.map(t=>t.host))}
const TABICO={"menu": "<path d=\"M5 6.5l6.5-2.2 3.2 12.4-6.5 2.2z\"/><path d=\"M12.6 4.6l6.6 1.6-2.9 12.6\"/>", "torneos": "<path d=\"M7 4h10v4a5 5 0 0 1-10 0z\"/><path d=\"M7 6H4.5a2.5 2.5 0 0 0 2.6 3.4M17 6h2.5a2.5 2.5 0 0 1-2.6 3.4\"/><path d=\"M12 13v4M8.5 20h7M10 17h4\"/>", "gira": "<path d=\"M9 4.5 4 6.5v13l5-2 6 2 5-2v-13l-5 2z\"/><path d=\"M9 4.5v13M15 6.5v13\"/>", "extra": "<path d=\"M7.5 10.5h9c0 5-1.8 9-4.5 9s-4.5-4-4.5-9z\"/><path d=\"M9 10.5c.4-2 1.5-3 3-3s2.6 1 3 3\"/><path d=\"M13.5 7.6 16.8 2.8\"/>", "profile": "<circle cx=\"12\" cy=\"8.5\" r=\"3.6\"/><path d=\"M5 20c.8-3.8 3.6-5.6 7-5.6s6.2 1.8 7 5.6\"/>"};
function tabsHTML(){const t=[['menu','Jugar'],['torneos','Torneos'],['gira','La Huella'],['extra','Extra'],['profile','Perfil']];const cur=EXTRA_SUB.includes(view)?'extra':(view==='tour'||view==='tournew')?'torneos':view;
  return `<nav class="tabs" aria-label="Secciones">${t.map(([v,l])=>`<button type="button" data-a="nav" data-v="${v}" ${(cur===v||(v==='profile'&&cur==='settings'))?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${TABICO[v]}</svg><span>${l}</span></button>`).join('')}</nav>`}
function seg(key,opts,cur,dis){return `<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" data-set="${key}" data-v="${v}" aria-pressed="${String(cur)===String(v)}" ${dis&&dis(v)?'disabled':''}>${l}</button>`).join('')}</div>`}
const STAKES=[0,50,100,250,500,1000];
/* título en filete porteño: letras blancas con sombra celeste y volutas a los lados */
const VOLUTA=`<svg class="vol" viewBox="0 0 64 40" aria-hidden="true"><path d="M62 31C46 31 33 26 30 16C28 9 33 4 39 5.6C44 7 44.6 13.6 40 15C37 15.8 35 13.4 36.4 11.4" fill="none" stroke="#74acdf" stroke-width="2.6" stroke-linecap="round"/><path d="M62 31C46 31 33 26 30 16" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7"/><path d="M33 23Q20 31 4 27Q15 19 33 23Z" fill="#74acdf"/><path d="M31 23.6Q19 27.4 8 26.4" fill="none" stroke="#fff" stroke-width=".8" opacity=".75"/><path d="M41 28Q34 38 22 38.4Q28 30 41 28Z" fill="#3d7fc4"/><circle cx="48" cy="24" r="1.9" fill="#e9b830"/><circle cx="53.4" cy="26.6" r="1.3" fill="#e9b830"/><circle cx="26" cy="12" r="1.5" fill="#c8361f"/></svg>`;
const fileteHTML=(cls='')=>`<h1 class="filete ${cls}">${VOLUTA}<span>Reviro</span>${VOLUTA.replace('class="vol"','class="vol r"')}</h1>`;
let SOLOOPTS=false,ONOPTS=false;
function playHTML(){const on=SET.on;const remembered=(()=>{try{return localStorage.getItem('reviro.table')}catch(e){return null}})();
  const onlineOk=!!(db&&uid);const open=lobby.filter(t=>!t.tour&&Date.now()-(t.created||0)<3*3600e3);const me=AVM[WAL.eq.av]||AVM.gaucho;
  const dz={facil:'fácil',medio:'medio',dificil:'difícil'}[SET.diff];
  const sum=`${SET.n==4?'2 contra 2':'Mano a mano'} contra la máquina, nivel ${dz}, a ${SET.target} ${SET.flor===false||SET.flor==='false'?'sin flor':'con flor'}${+SET.stake?`, apostando ${fmt(SET.stake)} fichas`:''}`;
  const openT=(TOURS||[]).filter(t=>t.status==='open'&&!tClosed(t)).length;
  return `<section class="deal">${fileteHTML()}
    <p class="lema">Truco de campo, como en la pulpería.</p>
    <div class="fan" aria-hidden="true">${['7O','1E','1B'].map(c=>cardHTML(c)).join('')}</div>
    <button class="btn prim xl" data-a="solo" ${SET.stake>WAL.chips?'disabled':''}>Repartir</button>
    <button type="button" class="optline" data-a="soloopts" aria-expanded="${SOLOOPTS}">${esc(sum)}. <u>${SOLOOPTS?'Listo':'Cambiar'}</u></button>
    ${SOLOOPTS?`<div class="opts">
      <div class="field"><span>Dificultad</span>${seg('diff',[['facil','Fácil'],['medio','Medio'],['dificil','Difícil']],SET.diff)}</div>
      <div class="field"><span>Jugadores</span>${seg('n',[[2,'1 contra 1'],[4,'2 contra 2']],SET.n)}</div>
      <div class="field"><span>Partida a</span>${seg('target',[[15,'15 puntos'],[30,'30 puntos']],SET.target)}</div>
      <div class="field"><span>Flor</span>${seg('flor',[['true','Con flor'],['false','Sin flor']],SET.flor)}</div>
      <div class="field"><span>Apuesta en fichas</span>${seg('stake',STAKES.map(v=>[v,v?fmt(v):'Sin apuesta']),SET.stake,v=>+v>WAL.chips)}</div>
      <p class="note">Ganando sumás ${({facil:20,medio:40,dificil:80})[SET.diff]} monedas para la tienda. Contra la máquina es práctica: no cuenta en tu historial.</p></div>`:''}
  </section>
  <section class="rows" aria-label="Con otras personas"><h2>Con otras personas</h2>
    ${onlineOk?`
    ${remembered?`<button type="button" class="rowb hot" data-a="rejoin" data-code="${esc(remembered)}"><b>Volver a la mesa ${esc(remembered)}</b><small>Tu partida sigue ahí</small></button>`:''}
    <button type="button" class="rowb" data-a="quick"><b>Jugar rápido</b><small>Te sienta en una mesa abierta o te arma una nueva</small></button>
    <button type="button" class="rowb" data-a="onopts" aria-expanded="${ONOPTS}"><b>Armar una mesa</b><small>${on.n==4?'Cuatro jugadores':'Dos jugadores'}, a ${on.target}${on.stake?', '+fmt(on.stake)+' fichas cada uno':', amistosa'}. Pasale el código a tus amigos</small></button>
    ${ONOPTS?`<div class="opts">
      <div class="field"><span>Jugadores</span>${seg('on.n',[[2,'2 jugadores'],[4,'4 jugadores']],on.n)}</div>
      <div class="field"><span>Partida a</span>${seg('on.target',[[15,'15'],[30,'30']],on.target)}</div>
      <div class="field"><span>Flor</span>${seg('on.flor',[['true','Con flor'],['false','Sin flor']],on.flor)}</div>
      <div class="field"><span>Apuesta por jugador</span>${seg('on.stake',STAKES.map(v=>[v,v?fmt(v):'Sin']),on.stake,v=>+v>WAL.chips)}</div>
      <button class="btn prim" data-a="create" ${on.stake>WAL.chips?'disabled':''}>Crear la mesa</button></div>`:''}
    <form class="rowb rowf" data-form="join"><label for="joincode"><b>Entrar con código</b><small>Las cuatro letras que te pasaron</small></label><input type="text" id="joincode" maxlength="4" placeholder="ABCD" autocomplete="off"><button class="btn" type="submit">Entrar</button></form>
    ${FB?`<button type="button" class="rowb" data-a="nav" data-v="torneos"><b>Torneos</b><small>${openT?`${openT===1?'Hay uno abierto':'Hay '+openT+' abiertos'}: anotate y jugá por el premio`:'Mirá los que vienen y los que ya se jugaron'}</small></button>`:''}
    ${open.length?`<h3>Mesas esperando gente</h3><div class="tables">${open.map(t=>{const f=t.seats.filter(s=>s.id||s.bot).length;return `<div class="trow"><div><b>${esc(t.code)}</b> <span>${t.n} jugadores, a ${t.target}${t.flor===false?' sin flor':''}, ${t.stake?fmt(t.stake)+' fichas':'amistosa'}. Hay ${f} de ${t.n}</span></div><button class="btn" data-a="join" data-code="${esc(t.code)}" ${t.stake>WAL.chips?'disabled':''}>Sentarme</button></div>`}).join('')}</div>`:''}
    ${FB?'':'<p class="note">Para que tus amigos puedan sentarse, compartí esta página con ellos desde el botón Compartir, con permiso para editar.</p>'}`
    :LOCAL?`<p class="note">Las mesas online, los amigos y el ranking funcionan en la versión de Reviro dentro de claude.ai. Acá podés jugar contra la máquina, La Huella y el anotador.</p>`:`<p class="note">El juego online necesita que abras Reviro con tu cuenta de claude.ai. Mientras tanto podés jugar contra la máquina.</p>`}
  </section>
  <button type="button" class="meline" data-a="nav" data-v="shop">${avatarSVG(myAv(),40)}<span>Jugás como <b>${esc(me.name)}</b></span><u>Cambiar</u></button>`}
function rulesHTML(){const order=['1E','1B','7E','7O','3E','2E','1C','12E','11E','10E','7C','6E','5E','4E'];
  return `<details class="rules"><summary>Reglamento</summary><ul>
  <li>Mazo de 40 cartas españolas, sin ochos ni nueves. Tres cartas por jugador, gana la mano quien gana dos bazas.</li>
  <li>Orden de las cartas, de mayor a menor:<div class="rank">${order.map(c=>cardHTML(c)).join('')}</div></li>
  <li><b>Pardas:</b> si se empata la primera, define la segunda; si se empata la segunda o la tercera, gana quien ganó la primera; si se empatan todas, gana el mano.</li>
  <li><b>Envido</b> (2), <b>real envido</b> (3) y <b>falta envido</b>. Se canta solo en la primera baza, antes de tirar tu primera carta. El envido va primero: se puede cantar como respuesta a un truco todavía no querido. No querido vale 1, o lo acumulado hasta el canto anterior.</li>
  <li>El tanto suma 20 más las dos cartas del mismo palo; las figuras valen 0. Si empatan, gana el mano.</li>
  <li><b>Falta envido:</b> en las malas (a 30, cuando nadie llegó a 15) gana el partido; en las buenas da lo que le falta al que va ganando.</li>
  <li><b>Flor</b> (tres cartas del mismo palo) vale 3 y anula el envido. Si el otro equipo también tiene: con flor me achico (4 para el primero), contraflor (6) o contraflor al resto (la falta). Con flor activada, quien la tiene debe cantarla antes de tirar.</li>
  <li><b>Truco</b> (2), <b>retruco</b> (3) y <b>vale cuatro</b> (4). Solo sube el equipo que tiene el quiero. No querido da lo que valía antes del canto.</li>
  <li><b>Irse al mazo</b> regala la mano; en la primera baza, sin envido cantado, el rival suma un punto más.</li>
  <li><b>Señas:</b> en 2 contra 2 tu compañero puede avisarte qué tiene con un gesto, y online vos también le podés hacer señas. Solo las ve tu equipo.</li>
  <li><b>Fichas</b> para apostar y <b>monedas</b> para la tienda son cosas distintas. Las fichas son de práctica y no tienen valor en dinero.</li></ul></details>`}

/* ---------- tienda ---------- */
function buyBtn(type,id,price,name){const own=owns(type,id,price),on=WAL.eq[type]===id;const it=itemOf(type,id);
  if(it&&it.boss&&!own)return `<button class="btn" disabled>Ganale al jefe de ${esc(ZM[it.boss].name)}</button>`;
  if(on)return `<button class="btn" disabled>Usando</button>`;
  if(own)return `<button class="btn ink" data-a="equip" data-t="${type}" data-id="${id}">Usar</button>`;
  if(WAL.coins<price)return `<button class="btn" disabled>${coinI} Faltan ${fmt(price-WAL.coins)}</button>`;
  const k=type+':'+id;if(pendingBuy===k)return `<button class="btn prim" data-a="buy" data-t="${type}" data-id="${id}">Confirmar · ${fmt(price)}</button>`;
  return `<button class="btn brass" data-a="prebuy" data-t="${type}" data-id="${id}">${coinI} ${fmt(price)}</button>`}
function shopHTML(){const sub=[['av','Personajes'],['kit','Camisetas'],['dorso','Dorsos'],['pano','Paños'],['coins','Monedas']];
  let body='';
  if(shopTab==='av')body=`<div class="items">${AVS.map(a=>`<div class="item ${WAL.eq.av===a.id?'on':''}"><div class="prev" style="height:124px">${avatarSVG(a.id==='hincha'?kitAv(WAL.eq.kit):a.id,120,true)}</div><b>${esc(a.name)}</b><p>${esc(a.bio)}</p>${buyBtn('av',a.id,a.price,a.name)}</div>`).join('')}</div>`;
  if(shopTab==='kit'){const hasH=owns('av','hincha',AVM.hincha.price);
    body=`<p class="note" style="margin-top:12px">${hasH?'Las camisetas las usa <b>La Hincha</b>. Al elegir una, también te ponés a La Hincha.':'Las camisetas las usa <b>La Hincha</b>. Conseguila primero en Personajes.'} Son diseños de colores, sin escudos ni marcas.</p>
    <div class="items">${KITS.map(k=>`<div class="item ${WAL.eq.kit===k.id&&WAL.eq.av==='hincha'?'on':''}"><div class="prev" style="height:124px">${avatarSVG(kitAv(k.id),120,true)}</div><b>${esc(k.name)}</b><p>${esc(k.bio)}</p>${hasH?buyBtn('kit',k.id,k.price,k.name):'<button class="btn" disabled>Necesitás a La Hincha</button>'}</div>`).join('')}</div>`}
  if(shopTab==='dorso')body=`<div class="items">${DORSOS.map(d=>`<div class="item ${WAL.eq.dorso===d.id?'on':''}"><div class="prev"><div class="bigback" style="background:${d.bg}"></div></div><b>${esc(d.name)}</b><p>${esc(d.bio)}</p>${buyBtn('dorso',d.id,d.price,d.name)}</div>`).join('')}</div>`;
  if(shopTab==='pano')body=`<div class="items">${PANOS.map(p=>`<div class="item ${WAL.eq.pano===p.id?'on':''}"><div class="prev"><div class="swatch" style="background:${p.bg};border-color:${p.edge}">${cardHTML('1E')}${cardHTML('7O')}</div></div><b>${esc(p.name)}</b><p>${esc(p.bio)}</p>${buyBtn('pano',p.id,p.price,p.name)}</div>`).join('')}</div>`;
  if(shopTab==='coins'&&!PREMIUM)body=premLock()+`<p class="note" style="margin-top:12px">Ganás monedas jugando: 20, 40 u 80 por partida ganada según la dificultad, 60 por partida online ganada, 5 por jugar aunque pierdas, 30 de premio cada día y las misiones.</p>`;
  else if(shopTab==='coins')body=`<div class="demo"><b>Modo prueba.</b> Acá no se cobra nada: los paquetes se acreditan gratis para que veas cómo funciona la tienda. El cobro real se conecta cuando Reviro tenga su propia app con medio de pago.</div>
    <div class="items">${PACKS.map((p,i)=>`<div class="item pack"><div class="prev">${coinI.replace('class="coin"','class="coin" style="width:26px;height:26px"')}${fmt(p.coins)}</div><b>${fmt(p.coins)} monedas</b><p>${p.tag?`<span class="tag">${p.tag}</span><br>`:''}<span class="ars">$ ${fmt(p.ars)}</span></p>
      ${pendingBuy==='pack:'+i?`<button class="btn prim" data-a="pack" data-i="${i}">Confirmar prueba</button>`:`<button class="btn brass" data-a="prepack" data-i="${i}">Simular compra</button>`}</div>`).join('')}</div>
    <p class="note" style="margin-top:12px">También ganás monedas jugando: 20, 40 u 80 por partida ganada según la dificultad, 60 por partida online ganada, 5 por jugar aunque pierdas y 30 de premio cada día.</p>`;
  return `<div class="shophead"><h2>Tienda</h2><span class="pill">${coinI}${fmt(WAL.coins)} monedas</span></div>
    <div class="subtabs" role="group">${sub.map(([k,l])=>`<button type="button" data-a="shoptab" data-v="${k}" aria-pressed="${shopTab===k}">${l}</button>`).join('')}</div>${body}`}

/* ---------- perfil ---------- */
function profileHTML(){const a=AVM[WAL.eq.av]||AVM.gaucho,st=WAL.stats,pct=st.played?Math.round(st.won*100/st.played):0;
  const ownedCount=WAL.owned.length+AVS.filter(x=>!x.price).length+1+1;
  const tg=(k,l,sub)=>`<div class="toggle"><span>${l}<small>${sub}</small></span><button type="button" class="sw" data-a="toggle" data-k="${k}" aria-pressed="${!!SET[k]}" aria-label="${l}"></button></div>`;
  return `<div class="profbar"><button type="button" class="btn sm ghost" data-a="nav" data-v="settings">Ajustes</button></div><div class="prof">${avatarSVG(myAv(),132,true)}<div style="flex:1;min-width:0"><h2>${esc(myDisp())}${PREMIUM?' <span class="prem">Premium</span>':''}</h2><p>${esc(a.name)} · ${esc(a.bio)}</p>${myEmail?`<p class="note">Cuenta: ${esc(myEmail)}</p>`:''}
    <form class="row" data-form="nick" style="margin-top:10px"><input type="text" id="nickin" class="plain" maxlength="20" placeholder="Tu apodo" value="${esc(WAL.nick||'')}" aria-label="Apodo" autocomplete="off"><button class="btn sm" type="submit">Guardar apodo</button></form></div></div>
  ${FB?fbStatsHTML():`<div class="stats">
    <div class="stat-b"><small>Partidas</small><b>${fmt(st.played)}</b></div>
    <div class="stat-b"><small>Ganadas</small><b>${fmt(st.won)}</b></div>
    <div class="stat-b"><small>Efectividad</small><b>${pct}%</b></div>
    <div class="stat-b"><small>Racha</small><b>${st.streak}</b></div>
    <div class="stat-b"><small>Mejor racha</small><b>${st.best}</b></div>
    <div class="stat-b"><small>Monedas ganadas</small><b>${fmt(st.earned)}</b></div>
  </div><p class="note" style="margin-top:6px">${LOCAL?'Las partidas, ganadas y rachas cuentan solo online contra otras personas. Contra la IA es práctica: no suma ni resta.':'Cuentan solo las partidas online contra otras personas. Contra la IA es práctica: no suma ni resta.'}</p>`}
  <div class="grid">
    <section class="box"><h2>Tu mesa</h2>
      <div class="row" style="gap:14px">${avatarSVG(myAv(),56)}<div class="bigback" style="background:${backBg(WAL.eq.dorso)}"></div><div class="swatch" style="width:110px;height:72px;background:${PM[WAL.eq.pano].bg};border-color:${PM[WAL.eq.pano].edge}">${cardHTML('3O')}</div></div>
      <p class="note">${esc(a.name)} · dorso ${esc(DM[WAL.eq.dorso].name)} · ${esc(PM[WAL.eq.pano].name)}</p>
      <button class="btn" data-a="nav" data-v="shop">Ir a la tienda</button></section>
    ${friendsBoxHTML()}
  </div>`}

/* ---------- sala online ---------- */
function roomHTML(){if(!T)return `<div class="room"><p class="note">Cargando mesa…</p></div>`;if(T.tour)return tourRoomHTML();
  const mine=T.seats.findIndex(s=>s.id===uid);const full=T.seats.every(s=>s.id||s.bot);
  return `<div class="room"><div class="row" style="justify-content:space-between"><div><h3 style="margin:0;color:var(--muted);font-size:.78rem;letter-spacing:.14em;text-transform:uppercase">Mesa</h3><div class="code">${esc(T.code)}</div></div>
    <button class="btn" data-a="copy">Copiar código</button></div>
    <p class="note">${T.n} jugadores · a ${T.target} puntos · ${T.flor===false?'sin flor':'con flor'} · ${T.stake?fmt(T.stake)+' fichas por jugador':'sin apuesta'}${T.n===4?' · los asientos 1 y 3 juegan juntos contra 2 y 4':''}</p>
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
  const hand=`<div class="hand ${L.play?'':'wait'}">${myCards.map((c,i)=>`<button type="button" class="${FX.deal?'deal':''}" style="animation-delay:${i*90}ms" data-card="${c}" ${L.play&&!busy&&tutAllowed({t:'play',card:c})?'':'disabled'} aria-label="Tirar">${cardHTML(c)}</button>`).join('')}</div>`;
  let info='';if(SET.help&&me>=0&&!h.ended&&h.results.length===0){const o=h.orig[me];info=G.flor&&hasFlor(o)?`<span>Tenés flor: <b>${florVal(o)}</b></span>`:`<span>Tu envido: <b>${envidoOf(o)}</b></span>`}
  if(mode==='offline'&&partnerSena&&partnerSena.handNo===G.handNo&&h.results.length===0&&!h.ended)info+=`<span>Seña del compa: <b>${esc(partnerSena.t)}</b></span>`;
  const tk=G.log.slice(-2).map(e=>`<div>${esc(logText(e))}</div>`).join('');
  center=center.replace('@@INFO@@',`<div class="ticker" aria-live="polite">${tk}</div>${info&&G.n===2?`<div class="handinfo">${info}</div>`:''}`);
  const absentNote=mode==='online'&&G.seats.some((_,s)=>isAbsent(s))?'<p class="note">Un bot difícil juega por quien se desconectó hasta que vuelva.</p>':'';
  const coachBox=TUT&&co&&!h.ended?`<div class="coach"><small>Lección ${TUT.i+1} de ${LESSONS.length} · ${esc(LESSONS[TUT.i].title)}</small><p>${esc(co.t||'')}</p></div>`:'';
  const b0=FX.bump&&FX.bump[mt]?'bump':'',b1=FX.bump&&FX.bump[1-mt]?'bump':'';
  return `<section class="game">
    <div class="gtop"><button class="btn ${confirmExit?'warn':'ghost'}" data-a="exit">${confirmExit?(inProgress()&&countsOnline(G)?(G.stake?'Salir: derrota y perdés la apuesta':'Salir: cuenta como derrota'):inProgress()&&CAMP?'Salir: perdés los porotos':inProgress()&&G.stake?'Salir: perdés la apuesta':'Confirmar salida'):'Salir'}</button>${mode==='online'?`<span class="note">Mesa ${esc(T?T.code:'')}</span>`:`<span class="note">${({facil:'Fácil',medio:'Medio',dificil:'Difícil'})[G.diff]}</span>`}</div>
    <div class="score"><div class="sc us"><span class="lbl">Nosotros</span><b class="${b0}">${sc[mt]}</b>${fosforos(sc[mt],G.target)}</div>
      <div class="mid"><b>a ${G.target}</b>${G.flor?'con flor':'sin flor'}<br>${G.stake?fmt(G.stake)+' fichas':'amistosa'}</div>
      <div class="sc them"><span class="lbl">Ellos</span><b class="${b1}">${sc[1-mt]}</b>${fosforos(sc[1-mt],G.target)}</div></div>
    <div class="felt n${G.n}" style="background:${pano.bg};border-color:${pano.edge}">${seatsHTML.join('')}<div class="center">${center}</div></div>
    ${G.n!==2&&info?`<div class="handinfo">${info}</div>`:''}${turnBarHTML()}${coachBox}
    ${hand}
    <div class="actions">${actionsHTML(L)}${TUT?'':socialHTML()}${absentNote}</div></section>`}
function logText(e){if(e.k==='hand')return `Mano ${e.no}: es mano ${nameOf(e.mano)}`;
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
  return `<p class="hint">${L.flor?'Tenés <b>flor</b>: cantala antes de tirar':'Tu turno: tocá una carta para tirarla'}</p><div class="btns">${b.join('')}</div>`}
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
  if(INV&&view!=='game'&&view!=='room'&&view!=='register'&&view!=='welcome'){const l=LOOKS[INV.from]||{};return `<div class="over"><div class="panel">${avatarSVG(AVM[l.av]?l.av:'gaucho',72,true)}<h2>¡Te invitan!</h2><p><b>${esc(dispName(INV.from)||'Un amigo')}</b> te invita a su mesa <b>${esc(INV.code)}</b>.</p><div class="btns"><button class="btn prim" data-a="invgo">Ir a la mesa</button><button class="btn ghost" data-a="invno">Ahora no</button></div></div></div>`}
  if(overlayView==='load'&&!PREMIUM)return `<div class="over" data-a="close"><div class="panel" data-stop><h2>Cargar fichas</h2><p>Tenés ${fmt(WAL.chips)} fichas.</p>${premLock()}<button class="btn ghost" data-a="close">Cerrar</button></div></div>`;
  if(overlayView==='load')return `<div class="over" data-a="close"><div class="panel" data-stop><h2>Cargar fichas</h2><p>Las fichas sirven para apostar en las partidas. Son de práctica: se cargan gratis, no se compran ni se cobran. Las monedas de la tienda son otra cosa.</p>
    <div class="btns">${[500,1000,5000].map(v=>`<button class="btn prim" data-a="add" data-v="${v}">+ ${fmt(v)}</button>`).join('')}</div><button class="btn ghost" data-a="close">Cerrar</button></div></div>`;
  if(view==='game'&&G&&G.matchOver){const won=G.matchOver.winner===myTeam();const st=G.stake;const TT=mode==='online'&&T&&T.tour;const can=!TT&&(mode==='offline'||isHost);
    const rw=lastReward&&lastReward.matchId===G.matchId?lastReward.coins:null;
    let conf='';if(won&&FX.over){const suits=['O','C','E','B'];for(let i=0;i<26;i++){const s=suits[i%4];conf+=`<svg viewBox="0 0 24 24" style="left:${(Math.random()*100).toFixed(1)}%;animation-delay:${(Math.random()*.9).toFixed(2)}s;color:${SUITCOL[s]}"><use href="#s${s}"/></svg>`}}
    return `<div class="over">${conf?`<div class="confetti" aria-hidden="true">${conf}</div>`:''}<div class="panel"><h2>${won?'¡Ganamos!':'Perdimos'}</h2><p>${G.scores[myTeam()]} a ${G.scores[1-myTeam()]}${G.matchOver.forfeit?(won?' · el rival abandonó':' · por abandono'):''}</p>${TT?`<p class="note">${esc(T.tour.name)} · ${esc(T.tour.label||'')}: ${won?'pasás a la siguiente':'quedaste afuera de este cruce'}.</p>`:''}
      ${st&&mySeat>=0?`<p class="big"><i class="chip"></i>${won?'+ '+fmt(st*2):'− '+fmt(st)} fichas</p>`:''}
      ${rw?`<p class="big">${coinI}+ ${fmt(rw)} monedas</p>`:''}${CAMP?giraOverHTML():''}
      <div class="btns">${TT?`<button class="btn prim" data-a="tourback">Volver al torneo</button>`:can?`<button class="btn prim" data-a="rematch" ${st>WAL.chips?'disabled':''}>Revancha</button>`:'<p class="note">Esperando la revancha del anfitrión</p>'}<button class="btn" data-a="tomenu">${CAMP?'Volver al mapa':'Menú'}</button></div></div></div>`}
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
  lastReward={matchId:g.matchId,coins};applyTx(key,{chips:won&&g.stake?g.stake*2:0,coins,earn:true,stat:countsOnline(g)?(won?'w':'l'):null,astat:won?'w':'l',pts}).then(()=>{recordEvents(g.matchId+':m',matchEvents(g));writeLooks()})}
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
  try{await tableRef.update({status:'playing',game:g})}catch(e){toast('No se pudo empezar la partida')}}
async function leaveTable(silent){const ref=tableRef,t=T;if(unsubTable){unsubTable();unsubTable=null}if(R){R.leave().catch(()=>{});R=null}
  if(FB&&t){const c=t.code;abandonP.finally(()=>NET.rooms.leaveRoom(c)).catch(()=>{});abandonP=Promise.resolve()}
  else if(!silent&&ref&&t&&t.status==='waiting'){try{if(t.host===uid)await ref.update({status:'closed'});else{if(await getLease(ref)){const s=await ref.get();if(s.exists)await ref.update({seats:s.data().seats.map(x=>x.id===uid?{id:null,bot:false}:x)})}}}catch(e){}}
  try{localStorage.removeItem('reviro.table')}catch(e){}T=null;tableRef=null;G=null;mode=null;view='menu';panel=null;clearTimeout(driveT);render()}
/* abandonar una partida en juego cuenta como derrota (en el historial y, en La Huella, en los porotos) */
let abandonP=Promise.resolve();
const inProgress=()=>!!(G&&!G.matchOver&&mySeat>=0&&!TUT);
const humansIn=g=>g?g.seats.filter(s=>s.id&&!s.bot).length:0;
const countsOnline=g=>mode==='online'&&humansIn(g)>=2;
function abandonCurrent(){if(!inProgress())return;const g=G;
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
function recordEvents(key,evs){walQ=walQ.then(async()=>{if(key&&WAL.evk.includes(key))return;ensureMissions();const msgs=[];let coins=0;
    for(const ev of evs){WAL.ach.cnt[ev]=(WAL.ach.cnt[ev]||0)+1;
      for(const id of WAL.mis.ids){const m=MISSIONS.find(x=>x.id===id);if(!m||m.ev!==ev||WAL.mis.done.includes(id))continue;
        WAL.mis.prog[id]=Math.min(m.goal,(WAL.mis.prog[id]||0)+1);if(WAL.mis.prog[id]>=m.goal){WAL.mis.done.push(id);coins+=m.r;msgs.push('Misión cumplida: '+m.t+' (+'+m.r+')')}}}
    for(const a of ACHS){if(WAL.ach.done.includes(a.id))continue;if(achValue(a)>=a.goal){WAL.ach.done.push(a.id);coins+=a.r;msgs.push('Logro: '+a.t+' (+'+a.r+')')}}
    if(key)WAL.evk=WAL.evk.concat(key).slice(-60);
    if(coins){WAL.coins+=coins;WAL.stats.earned+=coins;sfx('buy')}renderWallet();await saveWallet();if(msgs.length)toast(msgs.join(' · '));render()});return walQ}
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
function subRank(){if(!db||unsubRank)return;try{unsubRank=db.collection('looks').orderBy('pts','desc').limit(50).onSnapshot(s=>{RANK=s.docs.map(d=>({id:d.id,...d.data()}));if(view==='ranking')render()},()=>{unsubRank=null})}catch(e){}}

/* ---------- vistas nuevas ---------- */
function missionsHTML(){ensureMissions();const now=new Date(),mid=new Date(now);mid.setHours(24,0,0,0);const hrs=Math.max(1,Math.round((mid-now)/3600e3));
  const mis=WAL.mis.ids.map(id=>MISSIONS.find(m=>m.id===id)).filter(Boolean);
  return `<div class="shophead"><h2>Misiones</h2><span class="note">Se renuevan en ${hrs} h</span></div>
  <div class="mislist">${mis.map(m=>{const p=WAL.mis.prog[m.id]||0,done=WAL.mis.done.includes(m.id);
    return `<div class="mis ${done?'ok':''}"><div class="mtop"><b>${esc(m.t)}</b><span class="rw">${coinI}+${m.r}</span></div><div class="bar"><i style="width:${Math.round(p*100/m.goal)}%"></i></div><small>${done?'Cumplida':p+' de '+m.goal}</small></div>`}).join('')}</div>
  <h2 class="sech">Logros</h2>
  <div class="achs">${ACHS.map(a=>{const v=Math.min(a.goal,achValue(a)),done=WAL.ach.done.includes(a.id);
    return `<div class="ach ${done?'ok':''}"><span class="medal" aria-hidden="true">${done?'★':'☆'}</span><div><b>${esc(a.t)}</b><small>${esc(a.d)}</small><div class="bar"><i style="width:${Math.round(v*100/a.goal)}%"></i></div><small>${done?'Conseguido':v+' de '+a.goal} · ${coinI.replace('class="coin"','class="coin" style="display:inline-block;width:11px;height:11px;vertical-align:-1px"')} ${a.r}</small></div></div>`}).join('')}</div>`}
function rankingHTML(){if(!db||!uid)return `<div class="shophead"><h2>Ranking</h2></div><p class="note" style="margin-top:12px">El ranking necesita que abras Reviro con tu cuenta de claude.ai.</p>`;
  subRank();subFriends();const fs=friendSet();const rows=(RANK||[]).filter(r=>r.played>0&&(rankScope==='all'||r.id===uid||fs.has(r.id)));const ids=rows.map(r=>r.id);if(ids.length)ensureNames(ids);
  return `<div class="shophead"><h2>Ranking</h2></div><div class="subtabs" role="group"><button type="button" data-a="rscope" data-v="all" aria-pressed="${rankScope==='all'}">Todos</button><button type="button" data-a="rscope" data-v="friends" aria-pressed="${rankScope==='friends'}">Mis amigos (${fs.size})</button></div>
  ${RANK===null?'<p class="note" style="margin-top:12px">Cargando…</p>':rows.length?`<ol class="lb">${rows.map((r,i)=>`<li class="${r.id===uid?'me':''}"><span class="pos">${i+1}</span>${avatarSVG(AVM[r.av]?r.av:'gaucho',36)}<span class="nm">${esc(r.id===uid?myDisp():((r.nick)||NAMES[r.id]||'Jugador'))}<small>${fmt(r.won||0)} ganadas de ${fmt(r.played||0)} · racha máx. ${r.best||0}</small></span><b>${fmt(r.pts||0)}</b></li>`).join('')}</ol>`:(rankScope==='friends'?'<p class="note" style="margin-top:12px">Todavía no tenés amigos con partidas. Pasales tu link de amigo desde Perfil.</p>':'<p class="note" style="margin-top:12px">Todavía nadie terminó una partida. Jugá una y aparecés acá.</p>')}
  <p class="note" style="margin-top:12px">Puntos: 30 por partida online ganada y 3, 8 o 15 por ganarle a la máquina en Fácil, Medio o Difícil.</p>`}
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
function checkInviteHash(){let hsh='';try{hsh=location.hash||''}catch(e){}const m=/^#a-([A-Z0-9]{6})$/i.exec(hsh);if(!m)return;
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  if(m[1].toUpperCase()!==WAL.fcode)addFriendByCode(m[1])}
function friendsBoxHTML(){const fs=[...friendSet()];if(fs.length){fetchLooks(fs);ensureNames(fs)}
  return `<section class="box"><h2>Amigos</h2>
    ${db&&uid?`<p class="note">Mandá tu link a quien quieras: cuando lo abra, quedan agregados como amigos de los dos lados.</p>
    <div class="row"><span class="fcode">${esc(WAL.fcode||'')}</span><button class="btn prim sm" data-a="copylink">Copiar mi link de amigo</button></div>
    <form class="row" data-form="friend"><input type="text" id="friendin" maxlength="6" placeholder="Código de un amigo" aria-label="Código de amigo" autocomplete="off"><button class="btn sm" type="submit">Agregar</button></form>
    ${fs.length?`<ul class="flist">${fs.map(id=>{const l=LOOKS[id]||{};return `<li>${avatarSVG(AVM[l.av]?l.av:'gaucho',34)}<span style="flex:1">${esc(dispName(id)||'Jugador')}<small>${fmt(l.pts||0)} puntos · ${fmt(l.won||0)} ganadas</small></span><button class="btn sm brass" data-a="invite" data-id="${esc(id)}">Invitar</button></li>`}).join('')}</ul>`:'<p class="note">Todavía no agregaste a nadie.</p>'}
    <p class="note">Tu amigo necesita acceso a esta página: compartila con él desde el botón Compartir, con permiso para editar.</p>`
    :'<p class="note">Los amigos necesitan que abras Reviro con tu cuenta de claude.ai.</p>'}</section>`}


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
async function setPremium(id,on){if(!isOwnerV)return;try{const ref=db.doc('premium/'+id);if(on)await ref.set({on:true,at:Date.now()});else await ref.delete();toast(on?'Premium activado':'Premium quitado')}catch(e){toast('No se pudo cambiar el premium')}}
async function premiumByCode(raw){const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==6){toast('El código tiene 6 caracteres');return}
  try{const s=await db.collection('looks').where('code','==',code).limit(1).get();if(s.empty){toast('No encontré a nadie con ese código');return}await setPremium(s.docs[0].id,true)}catch(e){toast('No se pudo buscar ese código')}}
function adminHTML(){if(!isOwnerV)return'';const list=(ADMINP||[]).filter(p=>p.id!==uid);
  return `<section class="box admin"><h2>Premium</h2><p class="note">Solo vos ves esto, porque sos el dueño. Las cuentas premium pueden cargarse fichas y monedas.</p>
    <form class="row" data-form="prem"><input type="text" id="premin" maxlength="6" placeholder="Código" aria-label="Código del jugador" autocomplete="off"><button class="btn prim sm" type="submit">Dar premium</button></form>
    ${ADMINP===null?'<p class="note">Cargando jugadores…</p>':list.length?`<ul class="flist">${list.map(p=>{const on=!!PREMS[p.id];return `<li>${avatarSVG(AVM[p.av]?p.av:'gaucho',34)}<span style="flex:1">${esc(p.nick||NAMES[p.id]||'Jugador')}<small>Código ${esc(p.code||'—')} · ${on?'premium':'común'}</small></span><button class="btn sm ${on?'warn':'brass'}" data-a="prem" data-id="${esc(p.id)}" data-on="${on?0:1}">${on?'Quitar':'Dar premium'}</button></li>`}).join('')}</ul>`:'<p class="note">Todavía no hay otros jugadores.</p>'}</section>`}
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
  return `<div class="shophead"><h2>Anotador</h2><span class="note">Para jugar en persona</span></div>
    <div class="row" style="margin-top:10px">${seg('anot.target',[[15,'A 15'],[30,'A 30']],T2)}</div>
    ${win>=0?`<div class="demo" style="text-align:center"><b>¡Ganó ${esc(ANOT.names[win])}!</b> ${ANOT.s[0]} a ${ANOT.s[1]}</div>`:''}
    <div class="anot">${col(0)}${col(1)}</div>
    <div class="row" style="margin-top:12px;justify-content:center"><button class="btn" data-a="anundo" ${ANOT.hist.length?'':'disabled'}>Deshacer</button><button class="btn ${anotConfirm?'warn':'ghost'}" data-a="anreset">${anotConfirm?'Confirmar: empezar de cero':'Nueva partida'}</button></div>
    <p class="note" style="margin-top:10px;text-align:center">Atajos: +2 truco o envido querido, +3 retruco, real envido o flor, +4 vale cuatro.</p>`}
let anotConfirm=false;


/* ---------- La Huella: mapa de Argentina, rivales con porotos y zonas que se desbloquean ---------- */
const MAPK=12,MAPC=.788;
const prj=([lon,lat])=>[((lon+74)*MAPC*MAPK).toFixed(1),((-21-lat)*MAPK).toFixed(1)];
const pathOf=pts=>'M'+pts.map(p=>prj(p).join(' ')).join('L')+'Z';
const AR_MAIN=[[-66.8,-22.4],[-65.75,-22.1],[-63.8,-22],[-62.65,-22.25],[-60,-23.8],[-58.6,-24.9],[-57.7,-25.3],[-58.1,-26.4],[-58.6,-27.2],[-57.4,-27.4],[-56.5,-27.4],[-55.9,-27.35],[-55.5,-26.9],[-54.9,-26.4],[-54.6,-25.6],[-53.85,-25.9],[-53.65,-26.25],[-53.8,-27.1],[-55.1,-27.8],[-55.8,-28.4],[-56.4,-28.9],[-57.6,-30.2],[-57.8,-31.2],[-58.1,-32.4],[-58.2,-33.1],[-58.4,-33.9],[-58.4,-34.6],[-57.6,-35],[-57.1,-35.6],[-56.8,-36.3],[-56.7,-36.9],[-57.5,-38.1],[-58.5,-38.6],[-59.6,-38.8],[-61.2,-39],[-62.3,-38.8],[-62.1,-39.6],[-62.3,-40.2],[-62.3,-40.8],[-63,-41.1],[-64.4,-40.8],[-65.1,-40.9],[-65,-41.8],[-64.4,-42.2],[-63.6,-42.6],[-63.8,-42.9],[-64.5,-42.9],[-65,-43.4],[-65.3,-44.5],[-65.7,-45],[-67,-45.5],[-67.5,-46],[-67.4,-46.6],[-66.4,-47.1],[-65.8,-47.8],[-66.6,-48.5],[-67.6,-49.2],[-68.2,-50.1],[-69.1,-50.9],[-69.2,-51.6],[-68.4,-52.3],[-69.5,-52.15],[-71.9,-52],[-72.3,-51.4],[-72.4,-50.7],[-73.2,-49],[-72.6,-48],[-72.3,-47.4],[-71.8,-46.6],[-71.7,-45.6],[-71.5,-44.4],[-71.8,-43.4],[-71.6,-42.1],[-71.8,-41],[-71.6,-39.6],[-71.1,-38.2],[-71.2,-37.2],[-70.5,-36.1],[-70,-35],[-69.9,-33.9],[-70.1,-32.8],[-70.2,-31.4],[-69.9,-30.3],[-69.6,-29],[-68.9,-27.9],[-68.3,-26.9],[-68.6,-26.2],[-68.3,-25.1],[-67.4,-24],[-67,-23]];
const AR_TDF=[[-68.6,-52.65],[-68.6,-54.9],[-67.2,-55],[-66.1,-55],[-65.2,-54.7],[-65.8,-54.4],[-66.6,-54],[-67.6,-53.3],[-68.2,-52.9]];
const AR_ISL=[[[-61.3,-51.3],[-59.9,-51.4],[-60.2,-52.2],[-61,-52]],[[-59.2,-51.4],[-57.7,-51.5],[-58.2,-52.3],[-59.3,-52.1]]];
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
  cut:[[-75,-36.4],[-70.4,-36.4],[-68,-37.6],[-68.3,-38],[-64,-39.4],[-62.9,-40.8],[-62,-41.5],[-50,-41.5],[-50,-52.45],[-75,-52.45]]},
 {id:'tdf',name:'El Último Faro',short:'Último Faro',prov:'Tierra del Fuego',need:2100,col:'#6d8fa8',lab:[-66.6,-53.9],
  cut:[[-75,-52.45],[-50,-52.45],[-50,-60],[-75,-60]]},
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
 ['tdf','Lalo, de Río Grande','fisura','dificil',2120],['tdf','Marina, de Ushuaia','hippie','dificil',2250],['tdf','El Farero de Ushuaia','tanguero','dificil',2380],['tdf','La Leyenda del Último Faro','veterano','dificil',2600,1],
].map(([zone,name,av,diff,copas,boss],i)=>{const skill=Math.min(1,Math.max(.05,copas/2400+(boss?.08:0)));return{id:'r'+i,zone,name,av,copas,boss:!!boss,skill,diff:skill<.3?'facil':skill<.65?'medio':'dificil'}});
const stars=k=>{const n=Math.max(1,Math.min(5,Math.round(k*5)));return '★'.repeat(n)+'☆'.repeat(5-n)};
const RM=Object.fromEntries(RIVALS.map(r=>[r.id,r]));
const TITLES=[[0,'Pichón'],[150,'Aprendiz de pulpería'],[350,'Baqueano'],[600,'Truquero de ley'],[900,'Taita'],[1250,'Gaucho mayor'],[1650,'Maestro del truco'],[2100,'Leyenda del Último Faro']];
const titleOf=c=>{let t=TITLES[0][1];for(const [n,l] of TITLES)if(c>=n)t=l;return t};
const zoneOpen=z=>(WAL.copas||0)>=z.need;
let giraZone='ba',CAMP=null;
function copasDelta(my,rv,won){const exp=1/(1+Math.pow(10,(rv-my)/400));let d=Math.round(36*((won?1:0)-exp));if(won)d=Math.max(6,Math.min(40,d));else d=Math.min(-4,Math.max(-28,d));return d}
function mapSVG(){const main=pathOf(AR_MAIN),tdf=pathOf(AR_TDF),isl=AR_ISL.map(pathOf).join(''),land=main+tdf+isl;
  let o=`<svg class="armap" viewBox="0 0 200 412" role="img" aria-label="Mapa de la Argentina por zonas"><defs><clipPath id="arclip"><path d="${land}"/></clipPath>
    <pattern id="lockhatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#3a2a1d"/><path d="M0 0v5" stroke="#4d3a28" stroke-width="2"/></pattern></defs>
    <path d="${land}" fill="#2a1a10" transform="translate(2 3)" opacity=".5"/><g clip-path="url(#arclip)">`;
  for(const z of ZONES){const open=zoneOpen(z),sel=giraZone===z.id;
    o+=`<path d="${pathOf(z.cut)}" fill="${open?z.col:'url(#lockhatch)'}" stroke="#f3e6c8" stroke-opacity=".55" stroke-width=".8" data-a="zone" data-id="${z.id}" class="zp ${sel?'sel':''}" tabindex="0" aria-label="${z.name}${open?'':' (bloqueada)'}"/>`}
  o+=`</g><path d="${land}" fill="none" stroke="#f3e6c8" stroke-width="1.2"/>`;
  for(const z of ZONES){const [x,y]=prj(z.lab),open=zoneOpen(z);
    o+=`<g class="zl" pointer-events="none"><text x="${x}" y="${y}" text-anchor="middle">${open?'':'🔒︎ '}${z.short||z.name}</text>${open?'':`<text x="${x}" y="${+y+8}" text-anchor="middle" class="need">${fmt(z.need)} porotos</text>`}</g>`}
  const cur=[...ZONES].reverse().find(zoneOpen)||ZONES[0];const [px,py]=prj(cur.lab);
  o+=`<g transform="translate(${px} ${+py-14})" pointer-events="none"><path d="M0 9C-5 3-5-3 0-4S5 3 0 9Z" fill="#b0261c" stroke="#f3e6c8" stroke-width="1"/><circle cy="-.5" r="1.8" fill="#f3e6c8"/></g>`;
  return o+'</svg>'}
function rivalCard(r){const open=zoneOpen(ZM[r.zone]),wins=(WAL.gira&&WAL.gira.beat[r.id])||0;const my=WAL.copas||0;
  const win=copasDelta(my,r.copas,true),lose=copasDelta(my,r.copas,false);
  return `<li class="rv ${r.boss?'boss':''}">${avatarSVG(r.av,52)}<div class="rvi"><b>${esc(r.name)}</b><small>${r.boss?'Jefe de la zona · Premio: '+esc(prizeLabel(BOSS_PRIZE[r.zone]))+' · ':''}<span class="stars" aria-label="Nivel ${Math.round(r.skill*5)} de 5">${stars(r.skill)}</span> · ${r.boss?'a 30':'a 15'}</small>
    <small><span class="cup"><i class="poroto" aria-hidden="true"></i>${fmt(r.copas)}</span> · ganás +${win}, perdés ${lose}${wins?` · le ganaste ${wins} ${wins>1?'veces':'vez'}`:''}</small></div>
    <button class="btn ${r.boss?'prim':'brass'} sm" data-a="girago" data-id="${r.id}" ${open?'':'disabled'}>Jugar</button></li>`}
function giraHTML(){const c=WAL.copas||0,z=ZM[giraZone]||ZONES[0],open=zoneOpen(z);const next=ZONES.find(x=>!zoneOpen(x));
  const pct=next?Math.round((c-(ZONES[ZONES.indexOf(next)-1]||{need:0}).need)*100/Math.max(1,next.need-(ZONES[ZONES.indexOf(next)-1]||{need:0}).need)):100;
  const table=RIVALS.map(r=>({n:r.name,c:r.copas,av:r.av})).concat({n:myDisp()+' (vos)',c,av:myAv(),me:1}).sort((a,b)=>b.c-a.c);const myPos=table.findIndex(x=>x.me);
  const win=table.slice(Math.max(0,myPos-2),myPos+3);
  return `<div class="shophead"><h2>La Huella</h2><span class="pill cuppill"><i class="poroto" aria-hidden="true"></i>${fmt(c)} porotos</span></div>
    <p class="note" style="margin-top:6px">Dejá tu huella por el país ganándole a los mejores truqueros de cada zona. Cada victoria suma porotos y con más porotos se abren zonas nuevas.</p>
    <div class="field" style="margin-top:10px;max-width:320px"><span>Flor en La Huella</span>${seg('hflor',[['true','Con flor'],['false','Sin flor']],SET.hflor!==false)}</div>
    <div class="girarow"><div class="mapwrap">${mapSVG()}</div>
    <div class="giraside">
      <section class="box"><small class="tag">Tu título</small><h2 style="margin:0">${esc(titleOf(c))}</h2>
        ${next?`<div class="bar"><i style="width:${Math.max(3,Math.min(100,pct))}%"></i></div><p class="note">Te faltan ${fmt(next.need-c)} porotos para abrir <b>${esc(next.name)}</b>.</p>`:'<p class="note">Abriste todo el país. ¡Sos leyenda!</p>'}
        <h3 style="margin-top:6px">Tabla nacional</h3><ol class="lb mini">${win.map(x=>`<li class="${x.me?'me':''}"><span class="pos">${table.indexOf(x)+1}</span>${avatarSVG(x.av,28)}<span class="nm">${esc(x.n)}</span><b>${fmt(x.c)}</b></li>`).join('')}</ol></section>
    </div></div>
    <div class="subtabs" role="group" aria-label="Zonas">${ZONES.map(x=>`<button type="button" data-a="zone" data-id="${x.id}" aria-pressed="${x.id===z.id}">${zoneOpen(x)?'':'🔒︎ '}${esc(x.name)}</button>`).join('')}</div>
    <section class="box zbox" style="margin-top:10px;border-color:${open?z.col:'var(--line)'}"><h2>${esc(z.name)}</h2><p class="note">${esc(z.prov)}${open?'':` · se abre con ${fmt(z.need)} porotos`}</p>
      <ul class="rvl">${RIVALS.filter(r=>r.zone===z.id).map(rivalCard).join('')}</ul>
      ${WAL.gira&&WAL.gira.bosses.includes(z.id)?`<p class="note">★ Ya le ganaste al jefe de ${esc(z.name)}.</p>`:''}</section>`}
function startGira(rid){const r=RM[rid];if(!r||!zoneOpen(ZM[r.zone]))return;TUT=null;mySena=null;
  CAMP={rid,before:WAL.copas||0};cfg={n:2,target:r.boss?30:15,stake:0,diff:r.diff,flor:SET.hflor!==false};
  botLooks={1:{av:r.av,dorso:['pampa','cuero','marino','noche','celeste','oro','fileteado','bordo'][ZONES.findIndex(z=>z.id===r.zone)]||'pampa'}};
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
    finish(echo=[[.13,.22],[.21,.14]],peak=.82){const cp=out.slice();for(const [d,gn] of echo){const ds=Math.round(SR*d);for(let i=0;i<N;i++)out[i]+=cp[(i-ds+N)%N]*gn}
      let mx=0,rs=0;for(let i=0;i<N;i++){mx=Math.max(mx,Math.abs(out[i]));rs+=out[i]*out[i]}rs=Math.sqrt(rs/N);const g=Math.min(.92/Math.max(mx,.001),.12/Math.max(rs,.0001));for(let i=0;i<N;i++)out[i]*=g;return out}};
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
  g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.38,c.currentTime+1.2);src.connect(g);g.connect(c.destination);src.start();MUS.src=src;MUS.gain=g}catch(e){}}
function musicUpdate(force){if(!SNDREADY)return;const want=musicWant(),id=TRACKS[SET.track]?SET.track:'zamba';
  if(!force&&want===MUS.playing&&(!want||MUS.cur===id))return;
  musicStopAll();MUS.playing=want;MUS.cur=want?id:null;if(!want)return;
  const d=trackData(id);if(useWAmusic()||!d.el){musicStartWA(d);return}
  MUS.el=d.el;try{d.el.currentTime=0}catch(e){}d.el.volume=.4;const p=d.el.play();if(p&&p.catch)p.catch(()=>{d.noEl=true;d.el=null;MUS.el=null;musicStartWA(d)})}
function musicPickerHTML(compact){const cur=TRACKS[SET.track]?SET.track:'zamba';
  return `<div class="mpick${compact?' compact':''}" role="group" aria-label="Música de fondo">${compact?'<span class="note">♪ Música</span>':''}${TRACK_IDS.map(id=>`<button type="button" data-a="track" data-id="${id}" aria-pressed="${cur===id&&SET.music}" title="${esc(TRACKS[id].desc)}">${esc(TRACKS[id].name)}</button>`).join('')}${compact?`<button type="button" data-a="track" data-id="off" aria-pressed="${!SET.music}">Sin música</button>`:''}</div>`}


/* ---------- Extra y Ajustes ---------- */
const EXTRA_SUB=['anotador','shop','missions','ranking','rules','tutorial'];
const backX=()=>`<div class="backx"><button type="button" class="btn ghost sm" data-a="nav" data-v="extra">← Extra</button></div>`;
function extraHTML(){const done=(WAL.tut||[]).length,mis=(()=>{ensureMissions();return WAL.mis.done.length})();
  const card=(v,t,d,meta)=>`<button type="button" class="xcard" data-a="nav" data-v="${v}"><b>${t}</b><span>${d}</span>${meta?`<small>${meta}</small>`:''}</button>`;
  return `<div class="shophead"><h2>Extra</h2></div><div class="xgrid">
    ${card('anotador','Anotador','Para anotar los puntos cuando jugás en persona, con fósforos.',`${ANOT.s[0]} a ${ANOT.s[1]} · a ${ANOT.target}`)}
    ${card('shop','Tienda','Personajes, dorsos de cartas y paños de mesa.',`${fmt(WAL.coins)} monedas`)}
    ${card('missions','Misiones y logros','Tres misiones nuevas por día y logros para siempre.',`${mis} de 3 misiones hoy`)}
    ${card('ranking','Ranking','Cómo vas contra los demás y contra tus amigos.','')}
    ${card('tutorial','Tutorial','Cinco lecciones cortas para aprender a jugar.',`${done} de ${LESSONS.length} completas`)}
    ${card('rules','Reglamento','Orden de las cartas, envido, flor, truco, pardas y mazo.','')}
  </div>`}
function settingsHTML(){const tg=(k,l,sub,inv)=>`<div class="toggle"><span>${l}<small>${sub}</small></span><button type="button" class="sw" data-a="toggle" data-k="${k}" aria-pressed="${inv?!SET[k]:!!SET[k]}" aria-label="${l}"></button></div>`;
  return `<div class="shophead"><h2>Ajustes</h2></div><div class="grid">
    <section class="box"><h2>Sonido</h2>
      ${tg('mute','Sonido general','Apaga o prende todo el audio de Reviro',true)}
      ${tg('music','Música','Suena de fondo en los menús')}
      ${tg('sound','Efectos','Sonidos al tirar, cantar y sumar puntos')}
      <div class="field"><span>Elegí el tema</span>${musicPickerHTML(false)}<p class="note">${esc((TRACKS[SET.track]||TRACKS.zamba).desc)}</p></div></section>
    <section class="box"><h2>Juego</h2>
      ${tg('help','Ayuda en pantalla','Te muestra tu envido o tu flor en la primera baza')}
      <div class="field"><span>Flor en La Huella</span>${seg('hflor',[['true','Con flor'],['false','Sin flor']],SET.hflor!==false)}</div>
      <p class="note">La dificultad, los puntos, la flor y la apuesta de cada partida se eligen en Jugar.</p></section>
    <section class="box"><h2>Cuenta</h2>
      <p>Jugás como <b>${esc(myDisp())}</b>${PREMIUM?' · <span class="prem">Premium</span>':''}</p>
      ${myEmail?`<p class="note">Cuenta: ${esc(myEmail)}</p>`:''}
      <p class="note">Tu código de amigo es <b>${esc(WAL.fcode||'—')}</b>. El apodo y los amigos se manejan desde Perfil.</p>
      <button class="btn" data-a="nav" data-v="profile">Ir a Perfil</button>${fbAccountHTML()}</section>
    ${adminHTML()}${fbAdminHTML()}
  </div>`}


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
  return `<div class="tbar ${t.a===mySeat?'mine':''}" aria-hidden="true"><i id="tbari" style="width:${pct}%"></i><span id="tbart">${Math.ceil(t.rem/1000)} s · ${esc(t.a===mySeat?'tu turno':nameOf(t.a))}</span></div>`}
function turnTick(){const t=turnInfo();if(!t)return;const i=document.getElementById('tbari'),s=document.getElementById('tbart');
  if(i){i.style.width=Math.round(t.rem*100/TURN_MS)+'%';i.parentElement.classList.toggle('low',t.rem<8000)}if(s)s.textContent=Math.ceil(t.rem/1000)+' s · '+(t.a===mySeat?'tu turno':nameOf(t.a));
  if(t.rem<=0&&controllerSeat()===mySeat&&lastTimeout!==G.seq&&!busy){lastTimeout=G.seq;const who=nameOf(t.a);
    try{commit(act(G,t.a,aiAct(G,t.a,'medio')));toast('Se acabó el tiempo: el bot jugó por '+(t.a===mySeat?'vos':who))}catch(e){}}}


/* ---------- cuentas con Firebase (versión web): ingreso, registro, roles, estadísticas y administración ---------- */
let AUTHV='login',AUTHERR='',AUTHBUSY=false,AUTHINFO=null,MYUSER=null,ADM_ROOMS=null,ADM_USERS=null,admUnsubs=[];
const waitNET=()=>window.NET?Promise.resolve(window.NET):new Promise(res=>{window.addEventListener('net-ready',()=>res(window.NET),{once:true});setTimeout(()=>res(window.NET||null),20000)});
function authHTML(){const free=AVS.filter(a=>!a.price);const e=AUTHERR?`<p class="autherr" role="alert">${esc(AUTHERR)}</p>`:'';const dis=AUTHBUSY?'disabled':'';
  const tabs=AUTHV==='complete'?'':`<div class="subtabs" role="group"><button type="button" data-a="authv" data-v="login" aria-pressed="${AUTHV==='login'}">Ingresar</button><button type="button" data-a="authv" data-v="register" aria-pressed="${AUTHV==='register'}">Crear cuenta</button></div>`;
  let body='';
  if(AUTHV==='login')body=`<form class="box" data-form="login"><h2>Ingresá a tu cuenta</h2>
    <div class="field"><span>Mail</span><input type="email" id="aemail" class="plain" autocomplete="email" required></div>
    <div class="field"><span>Contraseña</span><input type="password" id="apass" class="plain" autocomplete="current-password" required></div>
    ${e}<button class="btn prim" type="submit" ${dis}>${AUTHBUSY?'Entrando…':'Ingresar'}</button>
    <button class="btn ghost sm" type="button" data-a="authv" data-v="reset">Me olvidé la contraseña</button></form>`;
  if(AUTHV==='reset')body=`<form class="box" data-form="reset"><h2>Recuperar contraseña</h2><p class="note">Te mandamos un mail para elegir una contraseña nueva.</p>
    <div class="field"><span>Mail</span><input type="email" id="aemail" class="plain" autocomplete="email" required></div>
    ${e}<button class="btn prim" type="submit" ${dis}>Mandar mail</button><button class="btn ghost sm" type="button" data-a="authv" data-v="login">Volver</button></form>`;
  if(AUTHV==='register'||AUTHV==='complete')body=`<form class="box" data-form="${AUTHV}"><h2>${AUTHV==='complete'?'Terminá tu registro':'Creá tu cuenta'}</h2>
    ${AUTHV==='register'?`<div class="field"><span>Mail</span><input type="email" id="aemail" class="plain" autocomplete="email" required></div>`:''}
    <div class="field"><span>Nombre de usuario</span><input type="text" id="auser" class="plain" maxlength="20" autocomplete="username" placeholder="De 3 a 20 letras, números, punto o guion bajo" required></div>
    ${AUTHV==='register'?`<div class="field"><span>Contraseña</span><input type="password" id="apass" class="plain" autocomplete="new-password" minlength="6" placeholder="Al menos 6 caracteres" required></div>`:''}
    <div class="field"><span>Elegí tu personaje</span><div class="regavs">${free.map(a=>`<button type="button" class="regav" data-a="regav" data-id="${a.id}" aria-pressed="${regAv===a.id}">${avatarSVG(a.id,96,true)}<b>${esc(a.name)}</b></button>`).join('')}</div></div>
    ${e}<button class="btn prim" type="submit" ${dis}>${AUTHBUSY?'Creando…':'Crear mi cuenta'}</button>
    <p class="note">Te vamos a mandar un mail para verificar tu cuenta. Las fichas y las monedas de Reviro no tienen valor en dinero.</p></form>`;
  return `<div class="gate">${fileteHTML('gtitle')}${tabs}${body}</div>`}
const fval=id=>{const el=document.getElementById(id);return el?el.value:''};
async function authSubmit(kind){if(AUTHBUSY)return;AUTHERR='';AUTHBUSY=true;
  const email=fval('aemail'),pass=fval('apass'),user=fval('auser');render();
  try{
    if(kind==='login')await NET.auth.login({email,password:pass});
    else if(kind==='register'){await NET.auth.register({email,username:user,password:pass,avatar:regAv});await onFbUser(AUTHINFO,true)}
    else if(kind==='complete'){await NET.auth.completeProfile({username:user,avatar:regAv});await onFbUser(AUTHINFO,true)}
    else if(kind==='reset'){await NET.auth.resetPassword(email);toast('Te mandamos el mail para recuperar la contraseña');AUTHV='login'}
  }catch(err){AUTHERR=err.message||'Algo salió mal. Probá de nuevo.'}
  AUTHBUSY=false;render()}
function resetSession(){for(const k of Object.keys(WAL))delete WAL[k];Object.assign(WAL,JSON.parse(JSON.stringify(WAL0)));walRef=null;renderWallet();uid=null;db=null;usr=null;roomCap=null;MYUSER=null;isOwnerV=false;PREMIUM=false;myName='';myEmail=null;
  [unsubLobby,unsubRev,unsubPrem,unsubInv,unsubRank].forEach(u=>{try{u&&u()}catch(e){}});unsubLobby=unsubRev=unsubPrem=unsubInv=unsubRank=null;
  admUnsubs.forEach(u=>{try{u()}catch(e){}});admUnsubs=[];unsubAdmin=null;ADM_ROOMS=ADM_USERS=null;
  [toursUnsub,tvUnsub].forEach(u=>{try{u&&u()}catch(e){}});toursUnsub=tvUnsub=null;TOURS=null;TV=null;TCLAIM.clear()}
async function onFbUser(info,fresh){AUTHINFO=info;
  if(!info){resetSession();AUTHV='login';view='auth';render();return}
  if(!info.user&&!(NET.auth.user())){AUTHV='complete';view='auth';render();return}
  const u=NET.auth.user();if(uid===info.uid&&view!=='auth'&&!fresh)return;
  uid=info.uid;db=NET.db;usr=NET.usr;roomCap=NET.roomCap;myName=u.username;myEmail=info.email;isOwnerV=NET.auth.isAdmin();PREMIUM=isOwnerV;
  await loadWallet();
  if(!WAL.nick)WAL.nick=u.username;
  if(!WAL.registered){WAL.registered=true;WAL.eq.av=AVM[u.avatar]?u.avatar:'gaucho';saveWallet();writeLooks();view='welcome'}
  else if(view==='auth'||view==='boot')view='menu';
  NET.stats.watchUser(uid,x=>{MYUSER=x;const adm=NET.auth.isAdmin();if(adm!==isOwnerV){isOwnerV=adm;PREMIUM=PREMIUM||adm;subAdmin();subFbAdmin()}if(view==='profile'||view==='settings')render()});
  subLobby();subFriends();subPremium();subAdmin();subFbAdmin();subInvites();subTours();checkInviteHash();
  NET.stats.recordPending().catch(()=>{});render()}
const RECORDED=new Set();
function fbRecord(code,matchId){if(RECORDED.has(matchId))return;RECORDED.add(matchId);
  NET.stats.recordMatch(code).then(r=>{if(r&&r.stats){MYUSER=Object.assign({},MYUSER,{stats:r.stats});render()}}).catch(()=>RECORDED.delete(matchId))}
function fbStatsHTML(){const s=(MYUSER&&MYUSER.stats)||NET.EMPTY_STATS;const cs=s.currentStreak||0;
  return `<div class="stats">
    <div class="stat-b"><small>Partidas</small><b>${fmt(s.played)}</b></div>
    <div class="stat-b"><small>Ganadas</small><b>${fmt(s.wins)}</b></div>
    <div class="stat-b"><small>Win rate</small><b>${s.played?Math.round(s.winRate*100):0}%</b></div>
    <div class="stat-b"><small>Racha actual</small><b class="${cs>0?'pos':cs<0?'neg':''}">${cs>0?'+'+cs:cs}</b></div>
    <div class="stat-b"><small>Mejor racha</small><b>${fmt(s.bestStreak)}</b></div>
  </div><p class="note" style="margin-top:6px">Cuentan solo las partidas online contra otras personas (1v1 y 2v2, también las de torneo). Contra la IA es práctica: no suma ni resta.</p>`}
function subFbAdmin(){if(!FB||!isOwnerV||admUnsubs.length)return;try{admUnsubs.push(NET.admin.watchRooms(r=>{ADM_ROOMS=r;if(view==='settings')render()}));admUnsubs.push(NET.admin.watchUsers(u=>{ADM_USERS=u;if(view==='settings')render()}))}catch(e){}}
function fbAdminHTML(){if(!FB||!isOwnerV)return'';const rooms=ADM_ROOMS||[],users=ADM_USERS||[];
  const nm=id=>{const u=users.find(x=>x.uid===id);return u?u.username:'—'};
  return `<section class="box admin"><h2>Salas activas</h2>
    ${ADM_ROOMS===null?'<p class="note">Cargando…</p>':rooms.length?`<ul class="flist">${rooms.map(r=>`<li><span style="flex:1"><b>${esc(r.code)}</b> · ${esc(r.type||'')} · ${r.status==='playing'?'jugando':'esperando'}<small>Anfitrión: ${esc(nm(r.host))} · ${(r.playerIds||[]).length} jugador${(r.playerIds||[]).length===1?'':'es'}${r.game?' · '+r.game.scores[0]+' a '+r.game.scores[1]:''}</small></span><button class="btn sm warn" data-a="admclose" data-id="${esc(r.code)}">Cerrar</button></li>`).join('')}</ul>`:'<p class="note">No hay salas abiertas.</p>'}</section>
  <section class="box admin"><h2>Usuarios y roles</h2>
    ${ADM_USERS===null?'<p class="note">Cargando…</p>':`<ul class="flist">${users.map(u=>{const s=u.stats||{};const adm=u.role==='admin';return `<li>${avatarSVG(AVM[u.avatar]?u.avatar:'gaucho',34)}<span style="flex:1">${esc(u.username||'—')}${adm?' <span class="prem">Admin</span>':''}<small>${fmt(s.played||0)} partidas · ${s.played?Math.round((s.winRate||0)*100):0}% ganadas</small></span>${u.uid===uid?'':`<button class="btn sm ${adm?'warn':'brass'}" data-a="admrole" data-id="${esc(u.uid)}" data-v="${adm?'player':'admin'}">${adm?'Quitar admin':'Hacer admin'}</button>`}</li>`}).join('')}</ul>`}
    <p class="note">El admin fijo es alejandro.clemente05@gmail.com, con el mail verificado.</p></section>`}
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
const TMAX={ko:[4,8,16],liga:[3,4,6,8]};const TBUY=[0,50,100,250,500,1000];
const tFmtDate=ms=>{try{return new Date(ms).toLocaleString('es-AR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return''}};
const tTeamName=tm=>!tm?'—':esc(tm.names.filter(Boolean).join(' y ')+(tm.bot?' y la IA':''));
const tMine=tm=>!!(tm&&tm.ids.includes(uid));
const tStatus={open:'Inscripción abierta',running:'En juego',finished:'Terminado',cancelled:'Cancelado'};
function subTours(){if(!FB||toursUnsub)return;try{toursUnsub=NET.tour.watchList(l=>{TOURS=l;tourClaims();if(view==='torneos')render()})}catch(e){}}
function openTour(tid){if(tvUnsub)tvUnsub();TV={tid,t:null,entries:[],matches:[]};tourConfirm=null;view='tour';render();window.scrollTo(0,0);
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
function tourTick(){const now=Date.now();let ended=false;
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
function toursPageHTML(){
  if(!FB)return `<div class="grid"><section class="box"><h2>Torneos</h2><p class="note">Los torneos se juegan en la web, con tu cuenta: <b>aleclem180.github.io/Reviro</b>. La entrada y el premio son en fichas.</p></section></div>`;
  const live=(TOURS||[]).filter(t=>t.status==='open'||t.status==='running');
  const done=(TOURS||[]).filter(t=>t.status==='finished'&&Date.now()-(t.finishedAt||t.updatedAt||0)<14*864e5);
  return `<section class="hero thero"><h1>Torneos</h1><p>Anotate, armá el pozo y llevate el premio en fichas.</p></section><div class="grid">
    <section class="box tours"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Abiertos y en juego</h2>${isOwnerV?'<button class="btn sm brass" data-a="tournew">+ Crear torneo</button>':''}</div>
    ${TOURS===null?'<p class="note">Cargando…</p>':live.length?`<div class="tlist">${live.map(tourCardHTML).join('')}</div>`
      :`<p class="note">${isOwnerV?'Todavía no hay torneos. Creá el primero.':'Por ahora no hay torneos abiertos. Cuando se arme uno, aparece acá.'}</p>`}</section>
    ${done.length?`<section class="box"><h2>Terminados</h2><div class="tlist">${done.map(tourCardHTML).join('')}</div></section>`:''}
    <section class="box"><h2>Cómo funciona</h2><ul class="tsteps"><li><b>Anotate</b> pagando la entrada en fichas. El premio crece con cada inscripto.</li><li><b>Cuando cierra la inscripción</b> se sortean los cruces.</li><li><b>Jugá tus partidas</b> desde acá: arrancan solas cuando están todos.</li><li><b>Los tres primeros</b> se llevan el premio, que se cobra solo.</li></ul><p class="note">Las fichas no tienen valor en dinero.</p></section></div>`}
function tourNewHTML(){if(!isOwnerV)return `<div class="grid"><section class="box"><p>Solo los admins crean torneos.</p></section></div>`;
  const maxes=TMAX[TN.format];if(!maxes.includes(TN.max))TN.max=maxes[1];
  const full=TN.max*(TN.mode==='2v2'?2:1),fake={id:'new',status:'open',players:full,buyIn:TN.buyIn,split:NET.tour.SPLIT},bk=NET.tour.booksOf(fake),pr=NET.tour.prizesOf(fake,3);
  return `<div class="backx"><button type="button" class="btn ghost sm" data-a="nav" data-v="torneos">← Torneos</button></div><div class="grid"><form class="box" data-form="tour"><h2>Nuevo torneo</h2>
    <label class="field"><span>Nombre</span><input class="tin" id="tname" maxlength="40" required placeholder="Copa de la Pulpería" value="${esc(TN.name)}"></label>
    <label class="field"><span>Temática</span><input class="tin" id="ttheme" maxlength="60" placeholder="Truco de fogón, a 15 con flor" value="${esc(TN.theme)}"></label>
    <label class="field"><span>Fecha y hora</span><input class="tin" id="tdate" type="datetime-local" value="${esc(TN.date)}"></label>
    <div class="field"><span>Formato</span>${seg('tn.format',[['ko','Eliminación directa'],['liga','Liga: todos contra todos']],TN.format)}</div>
    <div class="field"><span>Modalidad</span>${seg('tn.mode',[['1v1','1 contra 1'],['2v2','Parejas 2 contra 2']],TN.mode)}</div>
    <div class="field"><span>Cupo (${TN.mode==='2v2'?'parejas':'jugadores'})</span>${seg('tn.max',maxes.map(v=>[v,v]),TN.max)}</div>
    <div class="field"><span>Entrada por jugador</span>${seg('tn.buyIn',TBUY.map(v=>[v,v?fmt(v):'Gratis']),TN.buyIn)}</div>
    <div class="field"><span>Partidas a</span>${seg('tn.target',[[15,'15 puntos'],[30,'30 puntos']],TN.target)}</div>
    <div class="field"><span>Flor</span>${seg('tn.flor',[['true','Con flor'],['false','Sin flor']],TN.flor)}</div>
    <label class="field"><span>Reglas</span><textarea class="tin" id="trules" maxlength="600" rows="4" placeholder="Ej.: las partidas se juegan el mismo día. Si tu rival no aparece en 5 minutos, podés empezar con la IA en su lugar.">${esc(TN.rules)}</textarea></label>
    <div class="demo" style="margin:0"><b>Cuentas internas (solo las ven los admins).</b> El premio es el 90% de lo recaudado y el 10% queda para la casa; los jugadores solo ven el premio ya calculado. Reparto: 1.º 60%, 2.º 30%, 3.º 10%.${TN.buyIn?` Con el cupo lleno: recaudás <b>${fmt(bk.gross)}</b>, el premio es <b>${fmt(bk.pot)}</b> (${fmt(pr[0])} / ${fmt(pr[1])} / ${fmt(pr[2])}) y la casa se queda <b>${fmt(bk.house)}</b>.`:''} Si ponés fecha y hora, la inscripción cierra ahí y el torneo arranca solo cuando tengas Reviro abierto.</div>
    <button class="btn prim" type="submit" ${tourBusy?'disabled':''}>Crear torneo</button></form></div>`}
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
  return `<section class="box admin"><h2>Cuentas</h2><p class="note" style="margin:0">Solo las ven los admins.</p>
    <div class="stats"><div class="stat-b"><small>Recaudación bruta</small><b>${fmt(b.gross||0)}</b></div><div class="stat-b"><small>Premio</small><b>${fmt(b.pot||0)}</b></div><div class="stat-b"><small>Para la casa</small><b>${fmt(b.house||0)}</b></div></div>
    ${t.status==='cancelled'?'<p class="note">Cancelado: se devolvieron todas las entradas.</p>':''}
    ${L.length?`<details><summary>Movimientos</summary><ul class="flist">${L.slice(0,20).map(x=>`<li><span style="flex:1">${kinds[x.kind]||x.kind}<small>${esc((TV.entries.find(e=>e.uid===x.uid)||{}).name||x.uid.slice(0,6))} · ${esc(tFmtDate(x.at))}</small></span><b>${x.kind==='entrada'?'+':'−'}${fmt(x.amount)}</b></li>`).join('')}</ul></details>`:''}
    ${t.status!=='open'?'<button class="btn sm ghost" data-a="tourbooks">Actualizar</button>':''}</section>`}
function tourMatchHTML(t,m){const me=tMine(m.a)||tMine(m.b);const done=!!m.winner;
  const side=(s)=>{const tm=m[s];return `<span class="tm-side ${done&&m.winner===s?'win':''} ${tMine(tm)?'tme':''}">${tm?tTeamName(tm):'<i>A definir</i>'}${done&&m.pts&&!m.bye&&!m.wo&&!m.forfeit?`<b>${m.pts[s==='a'?0:1]}</b>`:''}</span>`};
  let act='';
  if(!done&&m.a&&m.b&&t.status==='running'){if(me)act=`<button class="btn sm prim" data-a="tourplay" data-mid="${esc(m.id)}">Jugar</button>`;
    if(isOwnerV){const sn=tm=>esc((tm.names[0]||'').split(' ')[0]||'—');act+=`<span class="tm-wo"><button class="btn sm ghost" data-a="tourwo" data-mid="${esc(m.id)}" data-w="a" title="Dar por ganado (no se presentó el rival)">Gana ${sn(m.a)}</button><button class="btn sm ghost" data-a="tourwo" data-mid="${esc(m.id)}" data-w="b" title="Dar por ganado (no se presentó el rival)">Gana ${sn(m.b)}</button></span>`}}
  return `<div class="tm ${me?'mine':''}">${side('a')}${m.bye?'<span class="tm-side bye"><i>Pasa directo</i></span>':side('b')}${m.wo?'<small class="note">Por no presentarse</small>':m.forfeit?'<small class="note">Ganó por abandono del rival</small>':''}${act?`<div class="row">${act}</div>`:''}</div>`}
function tourHTML(){const back=`<div class="backx"><button type="button" class="btn ghost sm" data-a="nav" data-v="torneos">← Torneos</button></div>`;
  if(!TV||!TV.t)return back+`<div class="grid"><section class="box"><p class="note">${TV&&TV.t===null&&TV.loaded?'Ese torneo ya no existe.':'Cargando torneo…'}</p></section></div>`;
  const t=TV.t,E=TV.entries,M=TV.matches,cap=NET.tour.cap(t);const myE=E.find(e=>e.uid===uid);
  const info=[t.format==='liga'?'Liga':'Eliminación directa',t.mode==='2v2'?'Parejas 2 contra 2':'1 contra 1','a '+t.target+' puntos',t.flor===false?'sin flor':'con flor',t.buyIn?'entrada '+fmt(t.buyIn)+' fichas':'entrada gratis'];
  let o=back+`<div class="grid"><section class="box thead"><div class="row" style="justify-content:space-between;align-items:flex-start"><div style="min-width:0"><h2 style="margin:0">${esc(t.name)}</h2>${t.theme?`<p class="tc-theme" style="margin:2px 0 0">${esc(t.theme)}</p>`:''}</div><span class="tst ${t.status}">${tStatus[t.status]}</span></div>
    <div class="tchips">${info.map(x=>`<span>${esc(x)}</span>`).join('')}${t.startAt?`<span>${esc(tFmtDate(t.startAt))}</span>`:''}</div>
    ${cdHTML(t,true)}${tourPrizesHTML(t)}
    ${t.rules?`<details class="trules"><summary>Reglas del torneo</summary><p>${esc(t.rules)}</p></details>`:''}</section>`;
  if(t.status==='open'){const pct=Math.min(100,Math.round(t.players/cap*100));const closed=tClosed(t),left=cap-t.players;
    const recent=E.slice().sort((x,y)=>y.at-x.at).slice(0,3);
    const teams={};E.forEach(e=>{(teams[e.team]=teams[e.team]||[]).push(e)});
    o+=`<section class="box"><h2>Inscripción</h2><div class="tbar"><i style="width:${pct}%"></i></div><p class="note" style="margin:0">${t.players} de ${cap} lugares${t.mode==='2v2'?' ('+t.maxTeams+' parejas)':''}</p>${!closed&&left>0&&left<=Math.max(2,Math.ceil(cap/4))?`<p class="fomo">¡Quedan ${left} lugar${left===1?'':'es'}!</p>`:''}
      ${recent.length&&!closed?`<div class="recent">${recent.map(e=>`<span>${avatarSVG(AVM[e.av]?e.av:'gaucho',22)}<b>${esc(e.name)}</b> se anotó ${esc(agoTxt(e.at))}</span>`).join('')}</div>`:''}
      ${closed?`<p class="note">La inscripción cerró. ${isOwnerV?'Largalo cuando quieras.':'El torneo arranca en un ratito: cuando se sorteen los cruces te aparece tu partida.'}</p>`:''}`;
    if(myE){const cap2=E.find(e=>e.uid===myE.team),mate=myE.team===uid?E.find(e=>e.uid===myE.partner):cap2;
      o+=`<p class="ok">Estás inscripto${t.mode==='2v2'?(mate?` con <b>${esc(mate.name)}</b>`:'. Si nadie se suma a tu pareja, al empezar te toca compañero (o la IA)'):''}.</p>
        <button class="btn ghost" data-a="tourleave" ${tourBusy||closed?'disabled':''}>${tourConfirm==='leave'?'Confirmar baja':'Darme de baja'}${t.buyIn?` (te devolvemos ${fmt(t.buyIn)})`:''}</button>`}
    else{const full=t.players>=cap,poor=t.buyIn>WAL.chips;
      o+=`<button class="btn prim big-cta" data-a="tourjoin" ${full||poor||tourBusy||closed?'disabled':''}>${closed?'Inscripción cerrada':full?'Cupo lleno':`Inscribirme${t.buyIn?' · '+fmt(t.buyIn)+' fichas':''}`}</button>${poor&&!full?'<p class="note">No te alcanzan las fichas.</p>':''}
        ${t.mode==='2v2'?'<p class="note">Te inscribís y armás tu pareja: otro se puede sumar con vos. O sumate a una pareja que tenga un lugar libre.</p>':''}`}
    o+=`<h3>Inscriptos</h3>${E.length?`<ul class="flist">${Object.values(teams).map(g=>{const capE=g.find(e=>e.uid===e.team)||g[0];const open=t.mode==='2v2'&&g.length<2&&capE.uid===capE.team&&!capE.partner;
      return `<li>${g.map(e=>avatarSVG(AVM[e.av]?e.av:'gaucho',30)).join('')}<span style="flex:1">${esc(g.map(e=>e.name).join(' y '))}${g.some(e=>e.uid===uid)?' <small>(vos)</small>':''}${open?'<small>Falta compañero</small>':''}</span>${open&&!myE&&!closed&&t.players<cap?`<button class="btn sm" data-a="tourjoin" data-team="${esc(capE.uid)}" ${t.buyIn>WAL.chips||tourBusy?'disabled':''}>Sumarme</button>`:''}</li>`}).join('')}</ul>`:'<p class="note">Todavía no se anotó nadie.</p>'}</section>`;
    if(isOwnerV)o+=`<section class="box admin"><h2>Administrar</h2>${t.startAt&&Date.now()>t.startAt?'<p class="note">Ya es la hora: empezalo cuando quieras.</p>':''}
      <div class="row"><button class="btn prim" data-a="tourstart" ${E.length<2||tourBusy?'disabled':''}>${tourConfirm==='start'?'Confirmar: cerrar inscripción y sortear':'Empezar torneo'}</button>
      <button class="btn warn" data-a="tourcancel" ${tourBusy?'disabled':''}>${tourConfirm==='cancel'?'Confirmar cancelación':'Cancelar torneo'}</button></div>
      <p class="note">Al empezar se sortean los cruces${t.mode==='2v2'?' y se arman las parejas que falten (si sobra uno, juega con la IA)':''}. Si lo cancelás, a todos se les devuelve la entrada.</p></section>`}
  else if(t.status==='cancelled')o+=`<section class="box"><p>Este torneo se canceló. A cada inscripto se le devolvió la entrada.</p></section>`;
  else{
    const pending=M.filter(m=>!m.winner&&m.a&&m.b&&(tMine(m.a)||tMine(m.b)));
    if(t.status==='running'&&pending.length)o+=`<section class="box tnext"><h2>Te toca</h2>${pending.map(m=>`<div class="trow"><div><b>${esc(m.label)}</b> <span>vs ${tTeamName(tMine(m.a)?m.b:m.a)}</span></div><button class="btn prim" data-a="tourplay" data-mid="${esc(m.id)}">Jugar mi partida</button></div>`).join('')}<p class="note">Si tu rival no llega en 5 minutos, podés empezar igual: la IA juega en su lugar. Abandonar una partida es perderla.</p></section>`;
    if(t.status==='finished'&&t.places){const pr=NET.tour.prizesOf(t,(t.teams||[]).length);
      o+=`<section class="box podio"><h2>Podio</h2>${['p1','p2','p3'].map((p,i)=>t.places[p]?`<div class="pd pd${i+1} ${tMine(t.places[p])?'tme':''}"><span class="pd-n">${i+1}.º</span><span class="pd-w">${tTeamName(t.places[p])}</span><span class="pd-p"><i class="chip"></i>${fmt(pr[i]||0)}</span></div>`:'').join('')}</section>`}
    if(t.format==='liga'){const S=NET.tour.standingsOf(t,M);
      o+=`<section class="box"><h2>Tabla</h2><table class="tstand"><thead><tr><th>#</th><th>${t.mode==='2v2'?'Pareja':'Jugador'}</th><th>PJ</th><th>PG</th><th>Dif.</th></tr></thead><tbody>${S.map((r,i)=>`<tr class="${tMine(r.team)?'tme':''}"><td>${i+1}</td><td>${tTeamName(r.team)}</td><td>${r.pj}</td><td><b>${r.w}</b></td><td>${r.pf-r.pa>0?'+':''}${r.pf-r.pa}</td></tr>`).join('')}</tbody></table></section>`;
      const rounds=[...new Set(M.map(m=>m.round))];
      o+=`<section class="box"><h2>Partidos</h2>${rounds.map(r=>`<h3>Fecha ${r}</h3><div class="tms">${M.filter(m=>m.round===r).map(m=>tourMatchHTML(t,m)).join('')}</div>`).join('')}</section>`}
    else{const rounds=[...new Set(M.filter(m=>!m.third).map(m=>m.round))];
      o+=`<section class="box"><h2>Llave</h2><div class="bracket">${rounds.map(r=>{const ms=M.filter(m=>m.round===r&&!m.third);return `<div class="bcol"><h3>${esc(ms[0].label)}</h3><div class="tms">${ms.map(m=>tourMatchHTML(t,m)).join('')}</div>${M.filter(m=>m.third&&m.round===r).map(m=>`<h3 style="margin-top:10px">${esc(m.label)}</h3><div class="tms">${tourMatchHTML(t,m)}</div>`).join('')}</div>`}).join('')}</div></section>`}}
  if(isOwnerV)o+=tourBooksHTML(t);
  return o+'</div>'}
async function tourJoin(team){const t=TV&&TV.t;if(!t||tourBusy)return;if(t.buyIn>WAL.chips){toast('No te alcanzan las fichas');return}
  tourBusy=true;render();try{const r=await NET.tour.register(t.id,{name:myDisp(),av:WAL.eq.av,team:team||null});tourBusy=false;
    if(!r.ok){toast({lleno:'Ya se llenó el cupo',cerrado:'La inscripción ya cerró',ya:'Ya estás inscripto',pareja:'Esa pareja ya está completa'}[r.reason]||'No se pudo inscribir');render();return}
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

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{unlockSound();ac();const t=e.target.closest('[data-a],[data-set],[data-card]');if(!t)return;
  if(t.dataset.a==='close'&&t.classList.contains('over')&&e.target!==t)return;
  if(t.dataset.set){const k=t.dataset.set,v=t.dataset.v;const val=v==='true'?true:v==='false'?false:(isNaN(+v)?v:+v);
    if(k==='anot.target'){ANOT.target=val;ANOT.s=ANOT.s.map(x=>Math.min(x,val));saveAnot();render();return}
    if(k.startsWith('tn.')){TN[k.slice(3)]=val;render();return}
    if(k.startsWith('on.'))SET.on[k.slice(3)]=val;else SET[k]=val;saveSet();render();return}
  if(t.dataset.card){doAction({t:'play',card:t.dataset.card});return}
  const a=t.dataset.a;
  if(a!=='anreset')anotConfirm=false;if(a!=='mazo')confirmMazo=false;if(a!=='exit')confirmExit=false;if(!['tourleave','tourstart','tourcancel'].includes(a))tourConfirm=null;if(a!=='buy'&&a!=='prebuy'&&a!=='pack'&&a!=='prepack')pendingBuy=null;
  switch(a){
  case 'nav':view=t.dataset.v;render();window.scrollTo(0,0);return;
  case 'load':overlayView='load';render();return;
  case 'close':overlayView=null;render();return;
  case 'shopcoins':if(view==='game'||view==='room'){toast('Terminá la partida para ir a la tienda');return}shopTab='coins';view='shop';render();return;
  case 'sound':SET.mute=!SET.mute;saveSet();renderSnd();musicUpdate();if(!SET.mute)setTimeout(()=>sfx('pts'),60);if(view==='profile')render();return;
  case 'toggle':SET[t.dataset.k]=!SET[t.dataset.k];saveSet();renderSnd();render();musicUpdate();return;
  case 'shoptab':shopTab=t.dataset.v;render();return;
  case 'prebuy':pendingBuy=t.dataset.t+':'+t.dataset.id;render();return;
  case 'buy':{const ty=t.dataset.t,id=t.dataset.id,list=ty==='av'?AVM:ty==='dorso'?DM:ty==='kit'?KITM:PM,it=list[id];pendingBuy=null;if(it)buy(ty,id,it.price,it.name);return}
  case 'equip':equip(t.dataset.t,t.dataset.id);return;
  case 'prepack':if(!PREMIUM){toast('Solo para cuentas premium');return}pendingBuy='pack:'+t.dataset.i;render();return;
  case 'pack':{if(!PREMIUM){toast('Solo para cuentas premium');return}const p=PACKS[+t.dataset.i];pendingBuy=null;if(p){applyTx('pack-'+Date.now(),{coins:p.coins}).then(()=>{sfx('buy');toast('Compra de prueba: +'+fmt(p.coins)+' monedas, sin cobro')})}return}
  case 'add':if(!PREMIUM){toast('Solo para cuentas premium');return}applyTx('load-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),{chips:+t.dataset.v});overlayView=null;toast('Cargaste '+fmt(t.dataset.v)+' fichas de práctica');render();return;
  case 'tour':openTour(t.dataset.id);return;
  case 'soloopts':SOLOOPTS=!SOLOOPTS;render();return;
  case 'onopts':ONOPTS=!ONOPTS;render();return;
  case 'tourbooks':TVB=null;render();return;
  case 'tournew':view='tournew';render();window.scrollTo(0,0);return;
  case 'tourjoin':tourJoin(t.dataset.team);return;
  case 'tourleave':tourLeave();return;
  case 'tourstart':tourStart();return;
  case 'tourcancel':tourCancel();return;
  case 'tourplay':tourPlay(t.dataset.mid);return;
  case 'tourwo':if(TV&&TV.t)NET.tour.walkover(TV.t.id,t.dataset.mid,t.dataset.w).then(()=>toast('Partido dado por ganado')).catch(()=>toast('No se pudo'));return;
  case 'tourforce':if(T&&T.tour)NET.tour.startMatchRoom(T.code,tourBuild,true).then(r=>{if(!r.ok)toast('Todavía no se puede')}).catch(()=>toast('No se pudo empezar'));return;
  case 'tourback':{const tid=T&&T.tour&&T.tour.tid;if(view==='game'&&inProgress()){toast('Terminá la partida primero');return}leaveTable(true);if(tid)openTour(tid);return}
  case 'solo':startSolo();return;
  case 'create':createTable();return;
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
  case 'zone':giraZone=t.dataset.id;render();return;
  case 'girago':startGira(t.dataset.id);return;
  case 'regav':regAv=t.dataset.id;render();return;
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
document.addEventListener('keydown',e=>{const t=e.target;if((e.key==='Enter'||e.key===' ')&&t.classList&&t.classList.contains('zp')){e.preventDefault();giraZone=t.dataset.id;render()}});
document.addEventListener('input',e=>{const k={tname:'name',ttheme:'theme',tdate:'date',trules:'rules'}[e.target.id];if(k)TN[k]=e.target.value});
document.addEventListener('change',e=>{const m=/^an([01])$/.exec(e.target.id||'');if(m){ANOT.names[+m[1]]=cleanNick(e.target.value)||(m[1]==='0'?'Nosotros':'Ellos');saveAnot()}});
document.addEventListener('submit',e=>{const fa=e.target.closest('[data-form="login"],[data-form="register"],[data-form="complete"],[data-form="reset"]');if(fa){e.preventDefault();authSubmit(fa.dataset.form);return}
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
