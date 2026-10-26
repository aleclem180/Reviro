/* ---------- dorsos y paños dibujados a lápiz de color ----------
   Mismo método que las cartas y el mapa: el dibujo se arma en SVG, pasa por el filtro de lápiz (fLapiz) dentro de un
   grupo girado para que el rayado salga en diagonal, y se pasa una sola vez a mapa de bits.
   Cada dibujo tiene tres capas: "base" (color pleno, sin filtro, para que los tonos oscuros no queden lavados),
   "art" (lo que se colorea con lápiz) y "top" (tinta o imágenes nítidas encima). */
const ARTIMG={},ARTQ=[];let ARTBUSY=false;
const srand=seed=>{let s=seed%2147483647||7;return()=>(s=(s*16807)%2147483647)/2147483647};
const PEN=(cx,cy,inner)=>`<g transform="rotate(32 ${cx} ${cy})" filter="url(#fLapiz)"><g transform="rotate(-32 ${cx} ${cy})">${inner}</g></g>`;
const rhomb=(cx,cy,w,h,f,st='')=>`<path d="M${cx} ${cy-h/2}L${cx+w/2} ${cy}L${cx} ${cy+h/2}L${cx-w/2} ${cy}Z" fill="${f}" ${st}/>`;
/* sol de mayo: rayos rectos y ondulados alternados, con cara */
function solMayo(cx,cy,r,face=true){let o='';for(let i=0;i<16;i++){const a=i*Math.PI/8,l=i%2?r*1.75:r*2.05,w=i%2?.16:.12;
    const p=(k,rr)=>`${(cx+Math.cos(a+k)*rr).toFixed(2)} ${(cy+Math.sin(a+k)*rr).toFixed(2)}`;
    o+=i%2?`<path d="M${p(-w,r*.95)}Q${p(.1,r*1.35)} ${p(0,l)}Q${p(-.1,r*1.35)} ${p(w,r*.95)}Z" fill="#e8a417"/>`:`<path d="M${p(-w,r*.95)}L${p(0,l)}L${p(w,r*.95)}Z" fill="#f2bd2a"/>`}
  o+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f6c437" stroke="#9a6a10" stroke-width="${r*.08}"/>`;
  if(face)o+=`<g fill="#9a6a10"><circle cx="${cx-r*.33}" cy="${cy-r*.14}" r="${r*.11}"/><circle cx="${cx+r*.33}" cy="${cy-r*.14}" r="${r*.11}"/></g><path d="M${cx-r*.36} ${cy+r*.3}Q${cx} ${cy+r*.58} ${cx+r*.36} ${cy+r*.3}" stroke="#9a6a10" stroke-width="${r*.08}" fill="none" stroke-linecap="round"/><path d="M${cx} ${cy-r*.1}v${r*.26}" stroke="#9a6a10" stroke-width="${r*.07}" stroke-linecap="round"/>`;
  return o}
/* mancha orgánica (cuero, hojas, nubes) */
function blob(cx,cy,r,rn,n=9,jit=.35){const pts=[];for(let i=0;i<n;i++){const a=i*2*Math.PI/n+rn()*.4,rr=r*(1-jit/2+rn()*jit);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let d=`M${m(pts[n-1],pts[0]).map(v=>v.toFixed(2)).join(' ')}`;
  for(let i=0;i<n;i++){const p=pts[i],q=m(p,pts[(i+1)%n]);d+=`Q${p[0].toFixed(2)} ${p[1].toFixed(2)} ${q[0].toFixed(2)} ${q[1].toFixed(2)}`}return d+'Z'}
/* voluta de filete porteño, en coordenadas locales (va en la esquina de arriba a la izquierda) */
const VOLU=`<path d="M0 18C0 7 6 1 17 1C24 1 27 7 23 10C20 12.4 16.6 9.6 18.6 7.4" fill="none" stroke="#c0392b" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M1.6 17C1.6 8 7 3 16 3" fill="none" stroke="#f0cf6a" stroke-width=".55" stroke-linecap="round"/>
  <path d="M6 4Q11 -1 13 4Q9 6 6 4Z" fill="#74acdf"/><path d="M3 9Q-1 13 3 15Q5 12 3 9Z" fill="#74acdf"/><circle cx="21" cy="5.4" r="1" fill="#f0cf6a"/><circle cx="9.6" cy="9.2" r=".8" fill="#f0cf6a"/>`;

/* ===== dorsos: 60 × 90, el campo va de 3,2 a 56,8 ===== */
const FX0=3.2,FY0=3.2,FW=53.6,FH=83.6;
const FIELD=f=>`<rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH}" rx="2.4" fill="${f}"/>`;
const DORSO_ART={
  pampa(){let band='';for(const y of [10.6,79.4]){band+=`<rect x="${FX0}" y="${y-5.2}" width="${FW}" height="10.4" fill="#f1e3c3"/><rect x="${FX0}" y="${y-5.2}" width="${FW}" height=".9" fill="#2a170b"/><rect x="${FX0}" y="${y+4.3}" width="${FW}" height=".9" fill="#2a170b"/>`;
      for(let i=0;i<9;i++){const x=FX0+3+i*6;band+=rhomb(x,y,6,7.6,'#2a170b')+rhomb(x,y,3,3.8,'#b0261c')}
      for(let i=0;i<10;i++){const x=FX0+i*6;band+=`<path d="M${x} ${y-2.2}L${x+1.6} ${y}L${x} ${y+2.2}L${x-1.6} ${y}Z" fill="#b0261c"/>`}}
    const side=`<path d="M7.4 16.4V73.6M52.6 16.4V73.6" stroke="#2a170b" stroke-width=".8"/><path d="M9.2 16.4V73.6M50.8 16.4V73.6" stroke="#b0261c" stroke-width=".5"/>`;
    const med=rhomb(30,45,36,50,'#b0261c')+rhomb(30,45,30,42,'#f1e3c3')+rhomb(30,45,24,34,'#2a170b')+rhomb(30,45,17,24,'#b0261c')+rhomb(30,45,10,14,'#f1e3c3')+rhomb(30,45,4.6,6.4,'#2a170b');
    const steps=[-1,1].map(s=>`<path d="M${30+s*6} 45h${s*4}v-3h${s*3}v3h${s*3}" stroke="#2a170b" stroke-width=".7" fill="none"/>`).join('');
    return{base:FIELD('#e9d8b2'),art:FIELD('#ead9b4')+band+side+med,top:''}},
  bordo(){return{base:FIELD('#5e1a2b'),
    defs:`<pattern id="bkp" width="6" height="9" patternUnits="userSpaceOnUse"><path d="M0 0L6 9M6 0L0 9" stroke="#e2b252" stroke-width=".42"/><circle cx="3" cy="4.5" r=".55" fill="#f0cf6a"/></pattern>`,
    art:FIELD('#6e1f33')+`<rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH}" fill="url(#bkp)"/><ellipse cx="30" cy="45" rx="15.5" ry="21.5" fill="#6e1f33"/><ellipse cx="30" cy="45" rx="13.6" ry="19.6" fill="#f1e3c3" stroke="#e2b252" stroke-width="1.3"/>`+solMayo(30,45,6.6),
    top:`<ellipse cx="30" cy="45" rx="15.5" ry="21.5" fill="none" stroke="#e2b252" stroke-width=".45"/><ellipse cx="30" cy="45" rx="12.4" ry="18.4" fill="none" stroke="#6e1f33" stroke-width=".3"/>`}},
  marino(){let star='';for(let i=0;i<8;i++){const a=i*Math.PI/4,l=i%2?8:12.5,p=(k,r)=>`${(30+Math.cos(a+k)*r).toFixed(2)} ${(45+Math.sin(a+k)*r).toFixed(2)}`;
      star+=`<path d="M30 45L${p(-.32,3.6)}L${p(0,l)}Z" fill="${i%2?'#74acdf':'#1d2f57'}"/><path d="M30 45L${p(.32,3.6)}L${p(0,l)}Z" fill="${i%2?'#a9cbee':'#3b5b92'}"/>`}
    return{base:FIELD('#16244a'),defs:`<pattern id="bkp" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4M0 0H4" stroke="#c9d6ea" stroke-width=".32"/></pattern>`,
      art:FIELD('#1d2f57')+`<rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH}" fill="url(#bkp)"/><circle cx="30" cy="45" r="15.4" fill="#1d2f57"/><circle cx="30" cy="45" r="14" fill="#f1e8d4" stroke="#c9d6ea" stroke-width="1"/>`+star,
      top:`<circle cx="30" cy="45" r="15.4" fill="none" stroke="#c9d6ea" stroke-width=".4"/><circle cx="30" cy="45" r="12.6" fill="none" stroke="#1d2f57" stroke-width=".25" stroke-dasharray=".8 .8"/>`}},
  cuero(){const rn=srand(11);let sp='';for(let i=0;i<22;i++)sp+=`<path d="${blob(FX0+rn()*FW,FY0+rn()*FH,1.4+rn()*4.6,rn,7,.6)}" fill="#5a3218" opacity="${(.25+rn()*.35).toFixed(2)}"/>`;
    let cr='';for(let i=0;i<7;i++){const y=FY0+6+rn()*(FH-12),x=FX0+4+rn()*(FW-16);cr+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(4+rn()*4).toFixed(1)} ${(rn()*2-1).toFixed(1)} ${(9+rn()*4).toFixed(1)} ${(rn()*3-1.5).toFixed(1)}" stroke="#4a2810" stroke-width=".35" fill="none" opacity=".6"/>`}
    const hs=`<path d="M22.4 55.6C18.6 46 20.6 32.4 30 32.4S41.4 46 37.6 55.6" fill="none" stroke="#3a2010" stroke-width="4.4" stroke-linecap="round"/><path d="M22.4 55.6C18.6 46 20.6 32.4 30 32.4S41.4 46 37.6 55.6" fill="none" stroke="#6a4020" stroke-width="1.6" stroke-linecap="round"/>`+[[21.6,50],[21.4,43],[24,36.4],[38.4,50],[38.6,43],[36,36.4]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r=".75" fill="#f0dcb0"/>`).join('');
    return{base:FIELD('#7a4624'),art:FIELD('#8a5530')+sp+cr+hs,top:`<rect x="${FX0+2.4}" y="${FY0+2.4}" width="${FW-4.8}" height="${FH-4.8}" rx="1.6" fill="none" stroke="#f0dcb0" stroke-width=".6" stroke-dasharray="1.6 1.1"/>`}},
  celeste(){return{base:FIELD('#f6f3ea'),art:`<rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH/3}" fill="#74acdf"/><rect x="${FX0}" y="${FY0+FH/3}" width="${FW}" height="${FH/3}" fill="#fbf8ef"/><rect x="${FX0}" y="${FY0+2*FH/3}" width="${FW}" height="${FH/3}" fill="#74acdf"/>`+solMayo(30,45,7.2),
    top:`<path d="M${FX0} ${FY0+FH/3}H${FX0+FW}M${FX0} ${FY0+2*FH/3}H${FX0+FW}" stroke="#4f86bd" stroke-width=".3"/>`}},
  noche(){const rn=srand(5);let st='';for(let i=0;i<46;i++){const x=FX0+rn()*FW,y=FY0+rn()*62,r=.22+rn()*.5;st+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${rn()<.25?'#f6d27a':'#f4f0e0'}"/>`}
    for(const [x,y,s] of [[14,16,1.8],[46,34,1.4],[22,50,1.2],[50,58,1]])st+=`<path d="M${x} ${y-s*1.6}L${x+s*.4} ${y-s*.4}L${x+s*1.6} ${y}L${x+s*.4} ${y+s*.4}L${x} ${y+s*1.6}L${x-s*.4} ${y+s*.4}L${x-s*1.6} ${y}L${x-s*.4} ${y-s*.4}Z" fill="#f6e3a0"/>`;
    const moon=`<path d="M41 13.4A7.4 7.4 0 1 0 47.6 25.6A6 6 0 1 1 41 13.4Z" fill="#f4e7b4"/>`;
    const land=`<path d="M${FX0} 72Q16 67.4 30 70.4T${FX0+FW} 69V${FY0+FH}H${FX0}Z" fill="#0a0f24"/>`;
    const ombu=`<path d="M15.6 71V63.6Q14.6 61 12.6 60.4M15.6 63.6Q17 61 19 60.6" stroke="#0a0f24" stroke-width="1.5" fill="none"/>`+[[15.6,57.6,4.2],[11.6,59.6,3],[19.6,59.4,3.1],[15.4,54.6,3]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#0a0f24"/>`).join('');
    const molino=`<path d="M44.6 70.4L46.4 56M48.2 70.4L46.4 56M45 66.4H47.8M45.6 61.4H47.2" stroke="#0a0f24" stroke-width=".7" fill="none"/>`+[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return `<path d="M46.4 55.6L${(46.4+Math.cos(a)*4.6).toFixed(2)} ${(55.6+Math.sin(a)*4.6).toFixed(2)}" stroke="#0a0f24" stroke-width=".9"/>`}).join('');
    return{base:FIELD('#0f1638'),art:FIELD('#17214a')+`<rect x="${FX0}" y="40" width="${FW}" height="34" fill="#25306a" opacity=".55"/>`+st+moon+land+ombu+molino,top:''}},
  oro(){return{base:FIELD('#c99a3c'),defs:`<pattern id="bkp" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0V5M0 0H5" stroke="#7a5410" stroke-width=".38"/><circle cx="2.5" cy="2.5" r=".45" fill="#fff3c4"/></pattern>`,
    art:FIELD('#e0b558')+`<rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH}" fill="url(#bkp)" opacity=".8"/><circle cx="30" cy="45" r="16" fill="#e0b558"/><circle cx="30" cy="45" r="14.6" fill="#f3e4b8" stroke="#8a5d0c" stroke-width="1.1"/>`+[0,1,2,3].map(i=>rhomb(i%2?30:(i?51:9),i%2?(i===1?10:80):45,5,7,'#8a5d0c')).join(''),
    top:(()=>{const A=CARDART.symO,h=22,w=h*A.w/A.h;return `<image href="${A.src}" x="${30-w/2}" y="${45-h/2}" width="${w}" height="${h}"/>`})()}},
  fileteado(){const c=[[FX0+3,FY0+3,''],[FX0+FW-3,FY0+3,'scale(-1 1)'],[FX0+3,FY0+FH-3,'scale(1 -1)'],[FX0+FW-3,FY0+FH-3,'scale(-1 -1)']].map(([x,y,t])=>`<g transform="translate(${x} ${y}) ${t} scale(.9)">${VOLU}</g>`).join('');
    let ros='';for(let i=0;i<10;i++){const a=i*Math.PI/5;ros+=`<ellipse cx="${(30+Math.cos(a)*9.6).toFixed(2)}" cy="${(45+Math.sin(a)*9.6).toFixed(2)}" rx="3.2" ry="1.5" transform="rotate(${i*36} ${(30+Math.cos(a)*9.6).toFixed(2)} ${(45+Math.sin(a)*9.6).toFixed(2)})" fill="${i%2?'#74acdf':'#c0392b'}"/>`}
    ros+=`<circle cx="30" cy="45" r="7.4" fill="#e9c46a"/><circle cx="30" cy="45" r="5.4" fill="#c0392b"/><circle cx="30" cy="45" r="2.8" fill="#e9c46a"/><circle cx="30" cy="45" r="1" fill="#c0392b"/>`;
    const mid=`<path d="M30 22Q34 28 30 32Q26 28 30 22ZM30 68Q34 62 30 58Q26 62 30 68Z" fill="#c0392b"/><path d="M30 24.6Q32 28 30 30M30 65.4Q32 62 30 60" stroke="#f0cf6a" stroke-width=".45" fill="none"/>`;
    return{base:FIELD('#141113'),art:FIELD('#1c1719')+c+ros+mid,top:`<rect x="${FX0+1.6}" y="${FY0+1.6}" width="${FW-3.2}" height="${FH-3.2}" rx="1.6" fill="none" stroke="#e9c46a" stroke-width=".5"/><rect x="${FX0+2.6}" y="${FY0+2.6}" width="${FW-5.2}" height="${FH-5.2}" rx="1.2" fill="none" stroke="#e9c46a" stroke-width=".22"/>`}},
  ombu(){const rn=srand(3);let gr='';for(let i=0;i<34;i++){const x=FX0+rn()*FW,y=64+rn()*22;gr+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(rn()-.5).toFixed(2)} -${(1.4+rn()*2).toFixed(2)}" stroke="#8a6d17" stroke-width=".4"/>`}
    const tree=`<ellipse cx="30" cy="66.4" rx="15" ry="2.6" fill="#7c6418" opacity=".55"/><path d="M25.6 66.4Q27.6 58 27 50.4L33 50.4Q32.4 58 34.4 66.4Q38 67 40 68.4H20Q22 67 25.6 66.4Z" fill="#5a3a22"/><path d="M27.4 53L22 48M32.6 53L38.4 47.6M30 52V45" stroke="#5a3a22" stroke-width="1.6" stroke-linecap="round"/>`+
      [[30,34,10.6,'#3e7a38'],[19.4,41,7.6,'#4c8c44'],[40.6,40.6,7.6,'#4c8c44'],[24,28.4,6.4,'#57984c'],[37,29,6.4,'#57984c'],[30,43,6.6,'#2f6a2c']].map(([x,y,r,c],i)=>`<path d="${blob(x,y,r,srand(40+i),10,.22)}" fill="${c}"/>`).join('');
    return{base:FIELD('#c9dceb'),art:`<rect x="${FX0}" y="${FY0}" width="${FW}" height="62" fill="#cfe3f0"/><circle cx="46" cy="14" r="4.6" fill="#f6c95a"/><rect x="${FX0}" y="62" width="${FW}" height="${FY0+FH-62}" fill="#cfa630"/>`+gr+tree,top:''}},
  cuarteto(){return{base:FIELD('#7a3fa0'),defs:`<pattern id="bkp" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="16" fill="#e0453a"/><rect x="4" width="4" height="16" fill="#ffd23f"/><rect x="8" width="4" height="16" fill="#3ec1d3"/><rect x="12" width="4" height="16" fill="#7a3fa0"/></pattern>`,
    art:`<rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH}" fill="url(#bkp)"/><ellipse cx="30" cy="45" rx="15.4" ry="21.4" fill="#1d1420"/><ellipse cx="30" cy="45" rx="13.8" ry="19.8" fill="#f3e9cf"/>
      <path d="M30 22.6V44" stroke="#4a2a14" stroke-width="2.2"/><rect x="28" y="20.4" width="4" height="4.4" rx=".8" fill="#4a2a14"/><circle cx="30" cy="51" r="7.2" fill="#c7782f"/><circle cx="30" cy="43.6" r="5.4" fill="#c7782f"/><circle cx="30" cy="48.6" r="2" fill="#2a170b"/><rect x="27" y="54" width="6" height="1.3" fill="#2a170b"/>
      <path d="M18.6 33.6v-5.4l3.6-1v5.4" stroke="#1d1420" stroke-width=".55" fill="none"/><circle cx="17.8" cy="33.8" r="1.1" fill="#1d1420"/><circle cx="21.4" cy="32.8" r="1.1" fill="#1d1420"/><path d="M41 56v-4.6" stroke="#1d1420" stroke-width=".55"/><circle cx="40.2" cy="56.2" r="1.1" fill="#1d1420"/>`,
    top:`<path d="M30 25v19M29.2 25v19M30.8 25v19" stroke="#f3e9cf" stroke-width=".12"/>`}},
  sietecolores(){const cols=['#c4532d','#d9822b','#e8c35a','#8a5a9e','#3f8f6b','#b5302a','#6b3f1e'];let h='';
    cols.forEach((c,i)=>{const y=34+i*7.4,a=2.6+i*.3,ph=i*7;h+=`<path d="M${FX0} ${y+Math.sin(ph)*a}C14 ${y-a*1.6} 22 ${y+a*1.2} 32 ${y-a*.6}S48 ${y+a*1.4} ${FX0+FW} ${y-a*.4}V${FY0+FH}H${FX0}Z" fill="${c}"/>`});
    const cardon=`<path d="M14.4 46V27.4" stroke="#3f6b3a" stroke-width="3" stroke-linecap="round"/><path d="M14.4 38H10.6V31.4M14.4 35H18.2V29.6" stroke="#3f6b3a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    return{base:FIELD('#f0d6a4'),art:`<rect x="${FX0}" y="${FY0}" width="${FW}" height="40" fill="#f4e1b8"/><circle cx="45" cy="15" r="4.4" fill="#f2bd2a"/>`+h+cardon,top:''}},
  viento(){let w='';[[14,16,1],[30,26,.8],[10,36,.7],[36,12,.6]].forEach(([x,y,s])=>{w+=`<path d="M${x} ${y}h${16*s}c${5*s} 0 ${6*s} ${-6*s} ${1*s} ${-6*s}c${-3*s} 0 ${-3.4*s} ${3.4*s} ${-.6*s} ${3.4*s}M${x+4*s} ${y+4*s}h${18*s}c${3*s} 0 ${4*s} ${3*s} ${1*s} ${4*s}" fill="none" stroke="#3f6f8f" stroke-width=".7" stroke-linecap="round"/>`});
    const mt=`<path d="M${FX0} 66L12 54L17 58L24 40L27.4 46L31 31L34.6 44L38 38L45 53L50 49L${FX0+FW} 60V70H${FX0}Z" fill="#5d7f99"/><path d="M24 40L25.6 44.6L27.4 46L29 41L31 31L33 39.4L34.6 44L36 41.4L38 38L39.6 42.6L37 42L35 46L33.4 43L31 46.4L28.6 47.6L26 45.2Z" fill="#f5f8fa"/>`;
    const lake=`<rect x="${FX0}" y="68" width="${FW}" height="${FY0+FH-68}" fill="#3f8f9f"/><path d="M8 74h8M24 77h10M40 73h9M14 81h12M38 82h9" stroke="#a7d3dc" stroke-width=".5" stroke-linecap="round"/>`;
    const tree=`<path d="M11.4 70V61.6Q12.6 60 18 59.4M11.6 64Q14 62.4 17 62.6" stroke="#2f3a2a" stroke-width="1" fill="none" stroke-linecap="round"/><path d="${blob(16.6,59.6,2.4,srand(77),7,.4)}" fill="#3f5a36"/>`;
    return{base:FIELD('#dfeaf1'),art:`<rect x="${FX0}" y="${FY0}" width="${FW}" height="66" fill="#dde9f1"/>`+w+mt+lake+tree,top:''}},
  cruzsur(){const rn=srand(41);let st='';for(let i=0;i<38;i++)st+=`<circle cx="${(FX0+rn()*FW).toFixed(1)}" cy="${(FY0+rn()*50).toFixed(1)}" r="${(.18+rn()*.35).toFixed(2)}" fill="#f4f0e0"/>`;
    const cz=[[30,10,1.9],[30,30,1.6],[22.4,19.6,1.5],[37.2,21.4,1.3],[33.4,24.6,.8]].map(([x,y,r])=>`<path d="M${x} ${y-r*1.8}L${x+r*.45} ${y-r*.45}L${x+r*1.8} ${y}L${x+r*.45} ${y+r*.45}L${x} ${y+r*1.8}L${x-r*.45} ${y+r*.45}L${x-r*1.8} ${y}L${x-r*.45} ${y-r*.45}Z" fill="#f6e3a0"/>`).join('');
    const sea=`<rect x="${FX0}" y="62" width="${FW}" height="${FY0+FH-62}" fill="#1f3f6a"/><path d="M6 70q4-2 8 0t8 0M30 74q4-2 8 0t8 0M10 80q4-2 8 0t8 0" stroke="#6f93b3" stroke-width=".5" fill="none"/>`;
    const isl=`<path d="M${FX0} 62.4Q10 58.6 16 60.6T26 61.6L27 64H${FX0}Z" fill="#3d5a3a"/><path d="M33 62.6Q38 58.4 45 60.2T${FX0+FW} 60.4V64H32Z" fill="#46663f"/>`;
    const pin=`<ellipse cx="30" cy="66.6" rx="7" ry="1.6" fill="#0c1a30" opacity=".6"/><path d="M30 39C25.6 39 23.6 44.6 24 51.4C24.3 58 26.6 65.6 30 65.6S35.7 58 36 51.4C36.4 44.6 34.4 39 30 39Z" fill="#1b1b22"/>
      <path d="M30 45.6C27.2 45.6 26.4 50 26.8 54.6C27.2 59.4 28.4 63.6 30 63.6S32.8 59.4 33.2 54.6C33.6 50 32.8 45.6 30 45.6Z" fill="#f4f1ea"/><path d="M26.6 46.4Q28.4 44.6 30 46.6Q31.6 44.6 33.4 46.4Q32 48.6 30 48.4Q28 48.6 26.6 46.4Z" fill="#f2b632"/>
      <circle cx="28.4" cy="42.6" r=".65" fill="#f4f1ea"/><circle cx="31.6" cy="42.6" r=".65" fill="#f4f1ea"/><path d="M29 44L30 46L31 44Z" fill="#e07a2a"/><path d="M24.4 50Q21.4 56 23 60.6L25 56Z" fill="#1b1b22"/><path d="M35.6 50Q38.6 56 37 60.6L35 56Z" fill="#1b1b22"/><path d="M27 65.6h2.4M30.6 65.6H33" stroke="#e07a2a" stroke-width="1.1" stroke-linecap="round"/>`;
    return{base:FIELD('#0f1d38'),art:FIELD('#13254a')+`<rect x="${FX0}" y="34" width="${FW}" height="30" fill="#24406e" opacity=".5"/>`+st+cz+sea+isl+pin,top:''}},

};
/* en los dorsos oscuros, el dibujo va también debajo en color pleno, así el lápiz suma textura sin lavar los tonos */
const DSOLID={cruzsur:.85,bordo:.8,marino:.8,cuero:.7,noche:.85,oro:.6,fileteado:.85,cuarteto:.7};
function dorsoSVG(id){const D=(DORSO_ART[id]||DORSO_ART.pampa)();if(DSOLID[id])D.base+=`<g opacity="${DSOLID[id]}">${D.art}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 90" width="240" height="360"><defs>${cardDefs()}<clipPath id="bkc"><rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH}" rx="2.4"/></clipPath>${D.defs||''}</defs>
    <rect x=".5" y=".5" width="59" height="89" rx="4.6" fill="url(#gPapel)" stroke="#b9a27a" stroke-width=".7"/>
    <g clip-path="url(#bkc)">${D.base}${PEN(30,45,D.art)}${D.top||''}</g>
    <rect x="${FX0}" y="${FY0}" width="${FW}" height="${FH}" rx="2.4" fill="none" stroke="#3b2c1f" stroke-width=".55"/>
    <rect x=".5" y=".5" width="59" height="89" rx="4.6" fill="#fff" filter="url(#fGrano)" opacity=".22"/></svg>`}

/* ===== paños: un campo cuadrado de 200 × 200 que se estira para cubrir la mesa; el borde lo pone la mesa ===== */
const P0=`<rect width="200" height="200"`;
function feltArt(c,hi,emb){return{base:`${P0} fill="${c}"/>`,defs:`<radialGradient id="pgl" cx=".5" cy=".46" r=".62"><stop offset="0" stop-color="${hi}" stop-opacity=".9"/><stop offset="1" stop-color="${hi}" stop-opacity="0"/></radialGradient>`,art:`${P0} fill="${c}"/>${P0} fill="url(#pgl)"/>${emb}`}}
const PANO_ART={
  quincho(){const rn=srand(9),cols=['#7a4b28','#6c4121','#83532d','#744624','#7c4b27'];let o='';
    for(let r=0;r<5;r++){const y=r*40;o+=`<rect y="${y}" width="200" height="40" fill="${cols[r]}"/>`;
      for(let k=0;k<7;k++){const yy=y+4+k*5.2+rn()*2;o+=`<path d="M-2 ${yy.toFixed(1)}C40 ${(yy+rn()*4-2).toFixed(1)} 80 ${(yy+rn()*4-2).toFixed(1)} 120 ${(yy+rn()*3-1.5).toFixed(1)}S180 ${(yy+rn()*4-2).toFixed(1)} 202 ${yy.toFixed(1)}" stroke="#3f2310" stroke-width="${(.4+rn()*.5).toFixed(2)}" fill="none" opacity=".55"/>`}
      const kx=20+rn()*160,ky=y+10+rn()*20;o+=`<ellipse cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" rx="6.4" ry="2.6" fill="#4a2a12"/><ellipse cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" rx="10" ry="4.4" fill="none" stroke="#4a2a12" stroke-width=".6" opacity=".7"/>`;
      const jx=30+rn()*140;o+=`<path d="M${jx.toFixed(1)} ${y}V${y+40}" stroke="#2a170b" stroke-width="1.1"/><circle cx="${(jx-3).toFixed(1)}" cy="${y+8}" r="1.1" fill="#2a170b"/><circle cx="${(jx-3).toFixed(1)}" cy="${y+32}" r="1.1" fill="#2a170b"/><circle cx="${(jx+3).toFixed(1)}" cy="${y+8}" r="1.1" fill="#2a170b"/><circle cx="${(jx+3).toFixed(1)}" cy="${y+32}" r="1.1" fill="#2a170b"/>`}
    for(let r=1;r<5;r++)o+=`<rect y="${r*40-1}" width="200" height="2" fill="#24140a"/>`;
    return{base:`${P0} fill="#6b4224"/>`,art:o}},
  cuerovaca(){const rn=srand(21);let o=`${P0} fill="#efe6d6"/>`;for(const [x,y,r] of [[34,40,30],[150,60,26],[96,128,34],[22,160,20],[172,170,24],[110,24,14],[66,92,10],[180,110,12]])o+=`<path d="${blob(x,y,r,rn,11,.5)}" fill="#3a2416"/>`;
    for(let i=0;i<40;i++){const x=rn()*200,y=rn()*200;o+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(rn()*4-2).toFixed(1)} ${(2+rn()*3).toFixed(1)}" stroke="#8a7458" stroke-width=".4" opacity=".5"/>`}
    return{base:`${P0} fill="#e6dccb"/>`,art:o}},
  bordo(){let s='';for(let i=0;i<24;i++){const a=i*Math.PI/12;s+=`<path d="M${(100+Math.cos(a)*30).toFixed(1)} ${(100+Math.sin(a)*30).toFixed(1)}L${(100+Math.cos(a)*(i%2?46:54)).toFixed(1)} ${(100+Math.sin(a)*(i%2?46:54)).toFixed(1)}" stroke="#7d2a42" stroke-width="2.4" stroke-linecap="round"/>`}
    return feltArt('#561a2e','#7a2840',`<circle cx="100" cy="100" r="24" fill="none" stroke="#7d2a42" stroke-width="2.4"/>${s}`)},
  verde(){return feltArt('#1a5e3e','#2c8058',`<ellipse cx="100" cy="100" rx="78" ry="56" fill="none" stroke="#d9b45a" stroke-opacity=".32" stroke-width="1.4"/><ellipse cx="100" cy="100" rx="72" ry="50" fill="none" stroke="#d9b45a" stroke-opacity=".22" stroke-width=".6"/>`)},
  azul(){const rn=srand(13);let s='';for(let i=0;i<34;i++){const x=rn()*200,y=rn()*200,r=.6+rn()*1.4;s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#b9cdf2" opacity="${(.2+rn()*.3).toFixed(2)}"/>`}
    return feltArt('#1c3566','#2c4c8a',s+`<path d="M118 56A22 22 0 1 0 138 92A18 18 0 1 1 118 56Z" fill="#b9cdf2" opacity=".18"/>`)},
  petroleo(){let l='';for(let i=-10;i<=20;i++)l+=`<path d="M${i*16} 0L${i*16+200} 200M${i*16} 200L${i*16+200} 0" stroke="#3a8f99" stroke-width=".8" opacity=".5"/>`;
    l+=rhomb(100,100,46,64,'none','stroke="#d9b45a" stroke-opacity=".3" stroke-width="1.4"')+rhomb(100,100,36,52,'none','stroke="#d9b45a" stroke-opacity=".2" stroke-width=".7"');return feltArt('#17545c','#24717a',l)},
  bodegon(){const rn=srand(31);let o=`${P0} fill="#f6f1e6"/>`;for(let i=0;i<10;i++)o+=`<rect x="${i*20}" width="10" height="200" fill="#c0392b" opacity=".55"/><rect y="${i*20}" width="200" height="10" fill="#c0392b" opacity=".55"/>`;
    o+=`<circle cx="146" cy="54" r="14" fill="none" stroke="#6b1a33" stroke-width="2.4" opacity=".5"/><path d="M134 50A13 13 0 0 1 158 46" fill="none" stroke="#6b1a33" stroke-width="1.2" opacity=".35" transform="translate(4 9)"/>`;
    for(let i=0;i<14;i++)o+=`<circle cx="${(40+rn()*120).toFixed(1)}" cy="${(120+rn()*60).toFixed(1)}" r="${(.6+rn()*1.1).toFixed(2)}" fill="#b98a4a"/>`;
    return{base:`${P0} fill="#efe6d6"/>`,art:o}},
  fileteado(){const v=[[30,30,''],[170,30,'scale(-1 1)'],[30,170,'scale(1 -1)'],[170,170,'scale(-1 -1)']].map(([x,y,t])=>`<g transform="translate(${x} ${y}) ${t} scale(1.9)">${VOLU}</g>`).join('');
    return{base:`${P0} fill="#121012"/>`,art:`${P0} fill="#1b1719"/>${v}<circle cx="100" cy="100" r="16" fill="none" stroke="#e9c46a" stroke-opacity=".35" stroke-width="1.4"/><circle cx="100" cy="100" r="10" fill="none" stroke="#c0392b" stroke-opacity=".35" stroke-width="1.4"/>`}},
  ibera(){const rn=srand(17);let o=`${P0} fill="#1f6b6b"/>`;for(let i=0;i<40;i++){const x=rn()*200,y=rn()*200;o+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}q4 -2 8 0" stroke="#5aa7a0" stroke-width=".7" fill="none" opacity=".6"/>`}
    for(const [x,y,r] of [[30,36,13],[150,30,10],[176,120,14],[60,150,11],[120,176,9],[20,110,8],[100,70,7],[140,96,6]]){const a=rn()*6.28;o+=`<path d="M${x} ${y}L${(x+Math.cos(a)*r).toFixed(1)} ${(y+Math.sin(a)*r).toFixed(1)}A${r} ${r} 0 1 1 ${(x+Math.cos(a+.5)*r).toFixed(1)} ${(y+Math.sin(a+.5)*r).toFixed(1)}Z" fill="${rn()<.5?'#6fbf73':'#4f9a55'}"/><path d="M${x} ${y}l${(r*.7).toFixed(1)} 0M${x} ${y}l0 ${(r*.7).toFixed(1)}M${x} ${y}l${(-r*.6).toFixed(1)} ${(-r*.4).toFixed(1)}" stroke="#3d7a40" stroke-width=".5"/>`}
    for(const [x,y] of [[34,30],[180,116],[64,146]])o+=[0,1,2,3,4].map(i=>{const a=i*1.256;return `<ellipse cx="${(x+Math.cos(a)*2.6).toFixed(1)}" cy="${(y+Math.sin(a)*2.6).toFixed(1)}" rx="2.6" ry="1.3" transform="rotate(${i*72} ${(x+Math.cos(a)*2.6).toFixed(1)} ${(y+Math.sin(a)*2.6).toFixed(1)})" fill="#f2c6d8"/>`}).join('')+`<circle cx="${x}" cy="${y}" r="1.2" fill="#f2c94c"/>`;
    return{base:`${P0} fill="#195a5a"/>`,art:o}},
  vinedo(){const rn=srand(23);let o=`${P0} fill="#6b3f2a"/>`;for(let k=-2;k<8;k++){const y0=k*34;o+=`<path d="M-10 ${y0+16}L210 ${y0-10+16}" stroke="#4a2a18" stroke-width="5" opacity=".5"/>`;
      for(let x=-4;x<206;x+=11){const y=y0+(x+10)*(-26/220)+rn()*3;o+=`<path d="${blob(x,y,5+rn()*2,rn,7,.4)}" fill="${rn()<.5?'#4f8a35':'#6fa44a'}"/>`;
        if(rn()<.18)o+=[[0,0],[1.6,0],[.8,1.4],[-.8,1.4],[2.4,1.4],[0,2.8],[1.6,2.8],[.8,4.2]].map(([dx,dy])=>`<circle cx="${(x+dx).toFixed(1)}" cy="${(y+5+dy).toFixed(1)}" r="1" fill="#5b2a5e"/>`).join('')}}
    return{base:`${P0} fill="#5e3624"/>`,art:o}},
  monte(){const rn=srand(29),cols=['#2f5a1f','#3d6b28','#4a7a2e','#2a4f1a','#557f33'];let o=`${P0} fill="#243a14"/>`;
    for(let i=0;i<70;i++)o+=`<path d="${blob(rn()*200,rn()*200,8+rn()*14,rn,9,.35)}" fill="${cols[Math.floor(rn()*5)]}"/>`;
    for(const [x,y] of [[40,50],[150,140],[120,40]])o+=`<path d="${blob(x,y,13,rn,10,.3)}" fill="#d96aa7"/><path d="${blob(x-3,y-3,7,rn,8,.3)}" fill="#ec93c2"/>`;
    return{base:`${P0} fill="#1e3010"/>`,art:o}},
  faro(){const rn=srand(37);let o=`${P0} fill="#13254a"/>`;for(let i=0;i<30;i++)o+=`<circle cx="${(rn()*200).toFixed(1)}" cy="${(rn()*80).toFixed(1)}" r="${(.4+rn()*.8).toFixed(2)}" fill="#f4f0e0"/>`;
    for(let r=0;r<9;r++){const y=96+r*12;o+=`<path d="M-4 ${y}q12 -5 24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0" stroke="#3d5a8a" stroke-width="1.1" fill="none" opacity="${(.4+r*.05).toFixed(2)}"/>`}
    o+=`<path d="M150 44L0 0V96Z" fill="#fff0b4" opacity=".22"/><path d="M150 44L200 26V62Z" fill="#fff0b4" opacity=".12"/>
      <path d="M144 92L146.6 48H153.4L156 92Z" fill="#f4efe6"/><path d="M145.2 72H154.8L155.4 82H144.6ZM146 56H154L154.4 64H145.6Z" fill="#c0392b"/><rect x="145" y="42" width="10" height="6" fill="#fff0b4"/><path d="M144 42L150 36L156 42Z" fill="#2a2a3a"/><path d="M136 96Q150 88 164 96Z" fill="#2a2a3a"/>`;
    return{base:`${P0} fill="#0a1428"/>`,art:o}},
};
function panoSVG(id){const D=(PANO_ART[id]||PANO_ART.quincho)();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="600" height="600"><defs>${cardDefs()}${D.defs||''}</defs>${D.base}${PEN(100,100,D.art)}${P0} fill="#fff" filter="url(#fGrano)" opacity=".16"/></svg>`}

/* se pasan a mapa de bits de a uno, con un respiro entre cada uno para no trabar la pantalla.
   El resultado queda en una variable de CSS (--a-dorso-pampa, --a-pano-quincho…), así todo lo que ya está en pantalla se actualiza solo. */
function artVar(kind,id){const k=kind+'-'+id;if(!ARTIMG[k]){ARTIMG[k]='q';ARTQ.push([k,kind,id]);artPump()}return `var(--a-${k})`}
function artPump(){if(ARTBUSY||!ARTQ.length)return;ARTBUSY=true;const [k,kind,id]=ARTQ.shift();
  const svg=kind==='dorso'?dorsoSVG(id):panoSVG(id),W=kind==='dorso'?240:600,H=kind==='dorso'?360:600;
  const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);const setv=u=>{try{document.documentElement.style.setProperty('--a-'+k,`url("${u}")`)}catch(e){}};
  const done=()=>{ARTBUSY=false;setTimeout(artPump,40)};let tries=0;
  const go=()=>{const im=new Image();im.onload=async()=>{try{if(im.decode)await im.decode().catch(()=>{});await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,30)));
      const cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d');cx.drawImage(im,0,0,W,H);
      const px=cx.getImageData(W>>1,H>>1,1,1).data;if(px[3]<200&&tries++<3){setTimeout(go,250*tries);return}
      if(px[3]<200){setv(uri);ARTIMG[k]=uri;done();return}
      cv.toBlob(b=>{const u=b?URL.createObjectURL(b):uri;ARTIMG[k]=u;setv(u);done()},'image/png')}catch(e){setv(uri);ARTIMG[k]=uri;done()}};
    im.onerror=()=>{setv(uri);done()};im.src=uri};
  go()}
/* lo que usan las pantallas */
const backBg=id=>{const d=DM[id]?id:'pampa';return `${artVar('dorso',d)} center/100% 100% no-repeat, ${DBASE[d]||'#6e1f33'}`};
const panoBg=id=>{const p=PM[id]?id:'quincho';return `${artVar('pano',p)} center/cover no-repeat, ${PBASE[p]||'#3a2416'}`};
const DBASE={pampa:'#efe0bf',bordo:'#6e1f33',marino:'#1d2f57',cuero:'#8a5530',celeste:'#74acdf',noche:'#0f1638',oro:'#d9a84a',fileteado:'#141113',ombu:'#cfe3f0',cuarteto:'#7a3fa0',sietecolores:'#d9822b',viento:'#dde9f1',cruzsur:'#13254a'};
const PBASE={quincho:'#6b4224',cuerovaca:'#e6dccb',bordo:'#561a2e',verde:'#1a5e3e',azul:'#1c3566',petroleo:'#17545c',bodegon:'#efe6d6',fileteado:'#121012',ibera:'#195a5a',vinedo:'#5e3624',monte:'#1e3010',faro:'#0a1428'};
