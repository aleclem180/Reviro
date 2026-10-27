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
    top:(()=>{const A=CARDART.symO,h=22,w=h*A.w/A.h;return `<image href="${A.data||A.src}" x="${30-w/2}" y="${45-h/2}" width="${w}" height="${h}"/>`})()}},
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
  guitarra(){const rn=srand(53);let fl='';for(let i=0;i<46;i++){const x=FX0+rn()*FW,y=FY0+rn()*FH;fl+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.25+rn()*.35).toFixed(2)}" fill="#e2b252" opacity=".55"/>`}
    const body=`<path d="M30 30C23.4 30 20.4 34 21 38.6C21.4 41.6 23 43.6 21.6 46C18.6 48.6 16.4 52.6 16.6 58C17 66.4 22.6 71.6 30 71.6S43 66.4 43.4 58C43.6 52.6 41.4 48.6 38.4 46C37 43.6 38.6 41.6 39 38.6C39.6 34 36.6 30 30 30Z" fill="#d9a05b" stroke="#7a4518" stroke-width=".9"/>
      <path d="M30 32.2C25.4 32.2 23.2 35.2 23.6 38.6C23.9 41 25 42.8 24 45" fill="none" stroke="#f0c98a" stroke-width=".7" stroke-linecap="round" opacity=".8"/>`;
    const hole=`<circle cx="30" cy="47" r="4.4" fill="#f1e3c3"/><circle cx="30" cy="47" r="3.5" fill="#2a170b"/><circle cx="30" cy="47" r="4.4" fill="none" stroke="#c0392b" stroke-width=".6"/><circle cx="30" cy="47" r="5.2" fill="none" stroke="#74acdf" stroke-width=".45"/>`;
    const neck=`<rect x="27.8" y="9" width="4.4" height="25" rx=".6" fill="#5a3218"/><path d="M27.8 13.6h4.4M27.8 17.6h4.4M27.8 21.2h4.4M27.8 24.4h4.4M27.8 27.2h4.4" stroke="#e2b252" stroke-width=".35"/>
      <path d="M27 9L26.4 3.8H33.6L33 9Z" fill="#3b2010"/><g fill="#f1e3c3">${[4.8,6.4,8].map(y=>`<circle cx="25.4" cy="${y}" r=".7"/><circle cx="34.6" cy="${y}" r=".7"/>`).join('')}</g>`;
    const bridge=`<rect x="25" y="61.4" width="10" height="2" rx=".6" fill="#3b2010"/><path d="M28.6 9V62.4M29.5 9V62.4M30.5 9V62.4M31.4 9V62.4" stroke="#f4ead2" stroke-width=".22"/>`;
    const vol=[[0,0,1,1],[60,0,-1,1],[0,90,1,-1],[60,90,-1,-1]].map(([x,y,sx,sy])=>`<g transform="translate(${x+sx*5} ${y+sy*5}) scale(${sx*.5} ${sy*.5})">${VOLU}</g>`).join('');
    return{base:FIELD('#4e1424'),art:FIELD('#5e1a2b')+fl+body+hole+neck+bridge,top:vol}},
  bombo(){let band='';for(const y of [10.6,79.4]){band+=`<rect x="${FX0}" y="${y-5.2}" width="${FW}" height="10.4" fill="#2a170b"/>`;for(let i=0;i<9;i++){const x=FX0+3+i*6;band+=rhomb(x,y,6,7.6,'#f1e3c3')+rhomb(x,y,3,3.8,'#c4532d')}}
    let rope='';for(let i=0;i<8;i++){const x0=14+i*4,x1=x0+4;rope+=`<path d="M${x0.toFixed(2)} ${(37.6+Math.sin(i/8*Math.PI)*4.6).toFixed(2)}L${((x0+x1)/2).toFixed(2)} ${(60.6+Math.sin((i+.5)/8*Math.PI)*4.2).toFixed(2)}L${x1.toFixed(2)} ${(37.6+Math.sin((i+1)/8*Math.PI)*4.6).toFixed(2)}" fill="none" stroke="#f1e3c3" stroke-width=".7"/>`}
    const drum=`<path d="M14 38V60Q14 66.6 30 66.6T46 60V38Z" fill="#7a4b28"/><path d="M14 38V60Q14 66.6 30 66.6T46 60V38" fill="none" stroke="#3b2010" stroke-width=".8"/>
      <path d="M14 57.6Q14 64.2 30 64.2T46 57.6V61Q46 67.6 30 67.6T14 61Z" fill="#3b2010"/>${rope}
      <ellipse cx="30" cy="38" rx="16" ry="6.2" fill="#3b2010"/><ellipse cx="30" cy="38" rx="14.2" ry="5" fill="#efdcb2"/><path d="M19 37q11 4.4 22 0" stroke="#d6bf8a" stroke-width=".5" fill="none"/>`;
    const sticks=`<path d="M17 18L30.6 35M43 18L29.4 35" stroke="#3b2010" stroke-width="1.6" stroke-linecap="round"/><circle cx="16.4" cy="17.2" r="2.3" fill="#efdcb2" stroke="#3b2010" stroke-width=".6"/><circle cx="43.6" cy="17.2" r="2.3" fill="#efdcb2" stroke="#3b2010" stroke-width=".6"/>`;
    return{base:FIELD('#b2462a'),art:FIELD('#c4532d')+band+drum+sticks,top:''}},
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
const PSOLID={cuero:.7,pena:.85,poncho:.8};const DSOLID={guitarra:.8,bombo:.6,cruzsur:.85,bordo:.8,marino:.8,cuero:.7,noche:.85,oro:.6,fileteado:.85,cuarteto:.7};
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
  pena(){const f=feltArt('#1d3b3a','#2f5a58','');const cols=['#f6c437','#e0453a','#74acdf','#f1e3c3','#6fbf73'];let g='';
    for(const [y0,dir] of [[14,1],[186,-1]]){g+=`<path d="M-4 ${y0}Q50 ${y0+dir*16} 100 ${y0+dir*6}T204 ${y0}" fill="none" stroke="#0b1414" stroke-width="1"/>`;
      for(let i=0;i<9;i++){const x=10+i*22.5,t=(x+4)/208,yy=y0+dir*(Math.sin(t*Math.PI*2)*5+8*(1-Math.abs(2*t-1)));const c=cols[i%cols.length];
        g+=`<path d="M${x} ${yy.toFixed(1)}v${dir*3}" stroke="#0b1414" stroke-width=".8"/><rect x="${x-3.4}" y="${(yy+dir*3-(dir<0?8.4:0)).toFixed(1)}" width="6.8" height="8.4" rx="2.4" fill="${c}"/><circle cx="${x}" cy="${(yy+dir*7.2).toFixed(1)}" r="5.6" fill="${c}" opacity=".18"/>`}}
    const rn=srand(61);let st='';for(let i=0;i<26;i++)st+=`<circle cx="${(rn()*200).toFixed(1)}" cy="${(40+rn()*120).toFixed(1)}" r="${(.4+rn()*.6).toFixed(2)}" fill="#f4f0e0" opacity=".35"/>`;
    f.art+=st+g;return f},
  poncho(){const f=feltArt('#a8201a','#c23a2a','');let g='';
    for(const y of [0,186]){g+=`<rect y="${y}" width="200" height="14" fill="#1a0d08"/>`;for(let i=0;i<14;i++){const x=7+i*14.2;g+=rhomb(x,y+7,8,8,'#a8201a')+rhomb(x,y+7,3.6,3.6,'#1a0d08')}}
    g+=`<path d="M0 20H200M0 180H200" stroke="#1a0d08" stroke-width="1.6"/><path d="M0 23H200M0 177H200" stroke="#1a0d08" stroke-width=".7"/>`;
    g+=rhomb(100,100,46,46,'#1a0d08')+rhomb(100,100,38,38,'#a8201a')+rhomb(100,100,22,22,'#1a0d08')+rhomb(100,100,10,10,'#a8201a');
    f.art+=g;return f},
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
  cuero(){const rn=srand(53);let o=`${P0} fill="#7a4a28"/>`;
    for(let i=0;i<46;i++)o+=`<path d="${blob(rn()*200,rn()*200,6+rn()*18,rn,8,.6)}" fill="${rn()<.5?'#5e3519':'#8f5a32'}" opacity="${(.18+rn()*.3).toFixed(2)}"/>`;
    for(let i=0;i<16;i++){const x=rn()*200,y=rn()*200;o+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(8+rn()*14).toFixed(1)} ${(rn()*6-3).toFixed(1)} ${(18+rn()*20).toFixed(1)} ${(rn()*8-4).toFixed(1)}" stroke="#3f2310" stroke-width=".6" fill="none" opacity=".45"/>`}
    /* repujado: una flor de cardo con volutas en el centro, hundida en el cuero */
    let r='';for(let i=0;i<8;i++){const a=i*Math.PI/4;r+=`<path d="M100 100Q${(100+Math.cos(a-.35)*26).toFixed(1)} ${(100+Math.sin(a-.35)*26).toFixed(1)} ${(100+Math.cos(a)*34).toFixed(1)} ${(100+Math.sin(a)*34).toFixed(1)}Q${(100+Math.cos(a+.35)*26).toFixed(1)} ${(100+Math.sin(a+.35)*26).toFixed(1)} 100 100Z" fill="#5a3218" opacity=".55"/>`}
    r+=`<circle cx="100" cy="100" r="9" fill="#4a2a12" opacity=".6"/><circle cx="100" cy="100" r="44" fill="none" stroke="#4a2a12" stroke-width="1.6" opacity=".45"/><circle cx="100" cy="100" r="48" fill="none" stroke="#a8754a" stroke-width=".7" opacity=".35"/>`;
    for(const [x,y,t] of [[60,100,''],[140,100,'scale(-1 1)']])r+=`<g transform="translate(${x} ${y}) ${t}"><path d="M0 0C-14-2-22-14-16-24C-11-31-2-27-4-20C-6-15-12-16-11-20" fill="none" stroke="#4a2a12" stroke-width="1.6" opacity=".5"/><path d="M0 0C-14 2-22 14-16 24C-11 31-2 27-4 20C-6 15-12 16-11 20" fill="none" stroke="#4a2a12" stroke-width="1.6" opacity=".5"/></g>`;
    return{base:`${P0} fill="#6e4024"/>`,art:o+r}},
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
function panoSVG(id){const D=(PANO_ART[id]||PANO_ART.quincho)();if(PSOLID[id])D.base+=`<g opacity="${PSOLID[id]}">${D.art}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="600" height="600"><defs>${cardDefs()}${D.defs||''}</defs>${D.base}${PEN(100,100,D.art)}${P0} fill="#fff" filter="url(#fGrano)" opacity=".16"/></svg>`}

/* se pasan a mapa de bits de a uno, con un respiro entre cada uno para no trabar la pantalla.
   El resultado queda en una variable de CSS (--a-dorso-pampa, --a-pano-quincho…), así todo lo que ya está en pantalla se actualiza solo. */
function artVar(kind,id){const k=kind+'-'+id;if(!ARTIMG[k]&&window.REVIRO_ART_V&&!window.__ARTGEN){const u=`img/arte/${window.REVIRO_ART_V}/${k}.webp`;ARTIMG[k]=u;try{document.documentElement.style.setProperty('--a-'+k,`url("${u}")`)}catch(e){}}if(!ARTIMG[k]){ARTIMG[k]='q';ARTQ.push([k,kind,id]);artPump()}return `var(--a-${k})`}
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
const DBASE={pampa:'#efe0bf',bordo:'#6e1f33',marino:'#1d2f57',cuero:'#8a5530',celeste:'#74acdf',noche:'#0f1638',oro:'#d9a84a',fileteado:'#141113',ombu:'#cfe3f0',cuarteto:'#7a3fa0',sietecolores:'#d9822b',viento:'#dde9f1',cruzsur:'#13254a',guitarra:'#5e1a2b',bombo:'#c4532d'};
const PBASE={cuero:'#6e4024',quincho:'#6b4224',cuerovaca:'#e6dccb',bordo:'#561a2e',verde:'#1a5e3e',azul:'#1c3566',petroleo:'#17545c',bodegon:'#efe6d6',fileteado:'#121012',ibera:'#195a5a',vinedo:'#5e3624',monte:'#1e3010',faro:'#0a1428',pena:'#1d3b3a',poncho:'#a8201a'};

/* ===== íconos de Extra: dibujos a lápiz de color, como los dorsos y el mapa =====
   Cuadro de 120 × 120 con fondo transparente. "art" se colorea con el filtro de lápiz; "ink" es el trazo de tinta
   a mano alzada encima (dos pasadas apenas corridas, como un boceto). */
const IK='stroke="#3b2c1f" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const sk=(d,w=1.7)=>`<path d="${d}" ${IK} stroke-width="${w}" opacity=".85"/><path d="${d}" ${IK} stroke-width="${(w*.45).toFixed(2)}" opacity=".45" transform="translate(.9 -.7)"/>`;
const sombra=(cx,cy,rx)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx*.18).toFixed(1)}" fill="#5a3d1e" opacity=".28"/>`;
const ICON_ART={
 /* ranking: la copa del campeón */
 ranking:()=>({art:sombra(60,104,30)+
   `<path d="M40 24H80V42C80 60 71 70 60 70S40 60 40 42Z" fill="#e2aa2e"/><path d="M47 28V44C47 56 52 62 58 64" stroke="#f8de8c" stroke-width="5" fill="none"/>
    <path d="M40 30C26 30 25 52 43 55" stroke="#d29a22" stroke-width="5" fill="none"/><path d="M80 30C94 30 95 52 77 55" stroke="#d29a22" stroke-width="5" fill="none"/>
    <rect x="55" y="69" width="10" height="13" fill="#c48a1c"/><path d="M42 82H78L82 98H38Z" fill="#7a4b28"/><rect x="48" y="86" width="24" height="6" fill="#e9cf8f"/>
    <path d="M60 33L62.8 40.2 70.4 40.6 64.5 45.4 66.5 52.8 60 48.6 53.5 52.8 55.5 45.4 49.6 40.6 57.2 40.2Z" fill="#b3352b"/>`,
  ink:sk('M40 24H80V42C80 60 71 70 60 70S40 60 40 42Z')+sk('M40 30C26 30 25 52 43 55')+sk('M80 30C94 30 95 52 77 55')+sk('M55 70V82M65 70V82')+sk('M42 82H78L82 98H38Z')+sk('M40 24C46 21 74 21 80 24',1.2)}),
 /* tienda: la bolsa de cuero con fichas */
 shop:()=>({art:sombra(60,104,38)+
   `<path d="M42 50C30 62 27 90 43 100H77C93 90 90 62 78 50Z" fill="#a8683a"/><path d="M50 58C44 70 44 86 50 94" stroke="#c98a55" stroke-width="5" fill="none"/>
    <path d="M45 47L38 33L51 39L60 28L69 39L82 33L75 47Z" fill="#8f5530"/><path d="M44 50C50 44 70 44 76 50" stroke="#e2c37a" stroke-width="4" fill="none"/>
    <circle cx="30" cy="96" r="10" fill="#c0392b"/><circle cx="30" cy="96" r="5.5" fill="#f3e6c8"/>
    <circle cx="88" cy="98" r="9" fill="#f0c548"/><circle cx="88" cy="98" r="5" fill="#d9a441"/><circle cx="76" cy="105" r="7" fill="#2f5f8f"/><circle cx="76" cy="105" r="3.6" fill="#f3e6c8"/>`,
  ink:sk('M42 50C30 62 27 90 43 100H77C93 90 90 62 78 50Z')+sk('M45 47L38 33L51 39L60 28L69 39L82 33L75 47')+sk('M44 50C50 44 70 44 76 50',1.3)+
   `<circle cx="30" cy="96" r="10" ${IK} stroke-width="1.4"/><circle cx="88" cy="98" r="9" ${IK} stroke-width="1.4"/><circle cx="76" cy="105" r="7" ${IK} stroke-width="1.3"/>`+sk('M30 86V89M30 103V106M20 96H23M37 96H40',1.1)}),
 /* misiones: el pergamino con tildes y la pluma */
 missions:()=>({art:sombra(58,106,32)+
   `<path d="M32 26H82V94H32Z" fill="#f1e3c3"/><rect x="28" y="20" width="58" height="10" rx="5" fill="#d9bf8c"/><rect x="28" y="90" width="58" height="10" rx="5" fill="#d9bf8c"/>
    <rect x="39" y="40" width="9" height="9" fill="#fbf4e2"/><rect x="39" y="56" width="9" height="9" fill="#fbf4e2"/><rect x="39" y="72" width="9" height="9" fill="#fbf4e2"/>
    <path d="M98 14C86 18 72 34 66 52L72 50C80 40 92 28 98 14Z" fill="#c8bba3"/><path d="M98 14C92 24 82 36 72 50" stroke="#b3352b" stroke-width="3" fill="none"/>`,
  ink:sk('M32 30V90M82 30V90')+`<rect x="28" y="20" width="58" height="10" rx="5" ${IK} stroke-width="1.6"/><rect x="28" y="90" width="58" height="10" rx="5" ${IK} stroke-width="1.6"/>`+
   sk('M39 40H48V49H39ZM39 56H48V65H39ZM39 72H48V81H39Z',1.2)+sk('M53 45H75M53 61H72M53 77H70',1.2)+
   `<path d="M37 43L43 49L52 36M37 59L43 65L52 52" stroke="#3f7a3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
   sk('M98 14C86 18 72 34 66 52L72 50C80 40 92 28 98 14Z',1.3)+sk('M66 52L62 60',1.4)}),
 /* tutorial: el pizarrón de campo con una carta dibujada en tiza */
 tutorial:()=>({art:sombra(60,106,38)+
   `<rect x="20" y="24" width="80" height="58" rx="3" fill="#8a5a33"/><rect x="26" y="30" width="68" height="46" fill="#2f4a3a"/>
    <path d="M40 82L30 106M80 82L90 106" stroke="#7a4b28" stroke-width="5" fill="none"/><rect x="60" y="80" width="14" height="4" fill="#f4efe2"/>`,
  ink:`<rect x="20" y="24" width="80" height="58" rx="3" ${IK} stroke-width="1.7"/><rect x="26" y="30" width="68" height="46" ${IK} stroke-width="1.1"/>`+sk('M40 82L30 106M80 82L90 106')+
   `<g stroke="#f4efe2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".92"><rect x="34" y="36" width="20" height="30" rx="2" stroke-width="1.6"/><path d="M44 44V58M40 47L44 43 48 47" stroke-width="1.4"/>
    <path d="M60 44H86M60 52H82M60 60H78" stroke-width="1.5" stroke-dasharray="4 2.5"/></g>`}),
 /* reglamento: el libro de tapa bordó con fileteado y su cinta */
 rules:()=>({art:sombra(62,106,34)+
   `<path d="M82 22L92 28L96 96L86 92Z" fill="#f3e6c8"/><path d="M30 28L82 22L86 92L34 98Z" fill="#7a2233"/>
    <path d="M42 46L72 42L73 58L43 62Z" fill="#f1e3c3"/><path d="M62 94L64 112L68 106L72 111L70 93Z" fill="#2f5f8f"/>`,
  ink:sk('M30 28L82 22L86 92L34 98Z')+sk('M82 22L92 28L96 96L86 92')+sk('M42 46L72 42L73 58L43 62Z',1.2)+sk('M48 51L67 48.5M49 56L64 54',1)+
   `<g stroke="#f0c548" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M36 34C40 33 41 36 38 38M80 29C76 29 75 32 78 34M38 90C42 91 43 88 40 86M82 85C78 86 77 83 80 81"/><path d="M45 74C52 70 62 70 70 72" stroke-dasharray="1 3"/></g>`+
   sk('M62 94L64 112L68 106L72 111L70 93',1.2)}),
 /* anotador: los fósforos del cuadrado de cinco y la caja */
 anotador:()=>{const fo=(x1,y1,x2,y2)=>{const a=Math.atan2(y2-y1,x2-x1);return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#d29a5a" stroke-width="4.6" stroke-linecap="round"/><ellipse cx="${x2}" cy="${y2}" rx="5" ry="3.8" transform="rotate(${(a*180/Math.PI).toFixed(1)} ${x2} ${y2})" fill="#9b2a1f"/>`};
  const fi=(x1,y1,x2,y2)=>sk(`M${x1} ${y1}L${x2} ${y2}`,1);
  const M=[[50,22,92,22],[92,24,92,64],[90,66,48,66],[48,64,48,24],[52,62,90,26]];
  return {art:sombra(58,106,40)+M.map(m=>fo(...m)).join('')+
   `<rect x="20" y="78" width="60" height="22" rx="2" fill="#c0392b"/><rect x="26" y="83" width="48" height="12" fill="#f3e6c8"/><rect x="74" y="78" width="10" height="22" fill="#6b4a2a"/>`,
  ink:M.map(m=>fi(...m)).join('')+`<rect x="20" y="78" width="64" height="22" rx="2" ${IK} stroke-width="1.6"/>`+sk('M74 78V100',1.2)+sk('M26 83H74V95H26Z',1)+
   `<path d="M38 89h4M46 89h4M54 89h4M62 89h4" stroke="#3b2c1f" stroke-width="1.6" stroke-linecap="round"/>`}},
 /* torneos: la llave del torneo que termina en el banderín del campeón */
 torneos:()=>({art:sombra(66,106,34)+
   `<path d="M78 30V100" stroke="#7a4b28" stroke-width="4"/><path d="M80 30L108 40L80 52Z" fill="#b3352b"/><circle cx="91" cy="41" r="4" fill="#f6c437"/>
    <rect x="12" y="24" width="20" height="10" rx="2" fill="#74acdf"/><rect x="12" y="46" width="20" height="10" rx="2" fill="#e0453a"/><rect x="12" y="68" width="20" height="10" rx="2" fill="#3f7a3a"/><rect x="12" y="90" width="20" height="10" rx="2" fill="#f6c437"/>
    <rect x="42" y="35" width="20" height="10" rx="2" fill="#e2c37a"/><rect x="42" y="79" width="20" height="10" rx="2" fill="#e2c37a"/>`,
  ink:sk('M78 30V100',1.4)+sk('M80 30L108 40L80 52Z',1.4)+
   `<g ${IK} stroke-width="1.3"><rect x="12" y="24" width="20" height="10" rx="2"/><rect x="12" y="46" width="20" height="10" rx="2"/><rect x="12" y="68" width="20" height="10" rx="2"/><rect x="12" y="90" width="20" height="10" rx="2"/><rect x="42" y="35" width="20" height="10" rx="2"/><rect x="42" y="79" width="20" height="10" rx="2"/></g>`+
   sk('M32 29H37V51H32M37 40H42M32 73H37V95H32M37 84H42M62 40H68V84H62M68 62H76',1.3)}),
 /* La Huella: el mapa plegado con el camino y las pisadas de bota */
 huella:()=>{const pie=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})"><ellipse cx="0" cy="-4" rx="4.6" ry="6.6" fill="#5a3d1e"/><ellipse cx="0" cy="7" rx="3.6" ry="3.4" fill="#5a3d1e"/></g>`;
  return {art:sombra(60,106,40)+
   `<path d="M16 30L44 22L76 30L104 22V92L76 100L44 92L16 100Z" fill="#f1e3c3"/><path d="M44 22V92L76 100V30Z" fill="#e6d3a8"/>
    <path d="M20 40C28 36 36 44 40 52C36 62 26 60 20 66Z" fill="#9fc07a"/><path d="M80 44C90 40 98 46 100 56C94 66 84 62 80 70Z" fill="#e2aa2e" opacity=".8"/><path d="M50 70C58 66 68 72 70 82C62 88 54 86 50 92Z" fill="#74acdf" opacity=".8"/>`+
   pie(34,80,-20)+pie(46,66,10)+pie(58,56,-14)+pie(72,46,16),
  ink:sk('M16 30L44 22L76 30L104 22V92L76 100L44 92L16 100Z')+sk('M44 22V92M76 30V100',1.2)+
   `<path d="M24 92C34 86 40 76 50 68S66 52 80 44 92 34 96 30" stroke="#b3352b" stroke-width="2" stroke-dasharray="3 3.5" fill="none" stroke-linecap="round"/>`+
   `<path d="M96 14C90 14 87 19 87 23C87 29 96 36 96 36S105 29 105 23C105 19 102 14 96 14Z" fill="#c0392b"/><circle cx="96" cy="23" r="3" fill="#f3e6c8"/>`+sk('M96 14C90 14 87 19 87 23C87 29 96 36 96 36S105 29 105 23C105 19 102 14 96 14Z',1.2)}},
 /* jugar online: el celular con tres cartas en la pantalla y la señal */
 online:()=>({art:sombra(56,108,26)+
   `<rect x="34" y="22" width="44" height="80" rx="7" fill="#3b2c2a"/><rect x="38" y="30" width="36" height="62" rx="2" fill="#2f5f8f"/>
    <g transform="rotate(-14 48 66)"><rect x="40" y="52" width="16" height="24" rx="2" fill="#f4efe2"/></g><rect x="49" y="50" width="16" height="24" rx="2" fill="#f4efe2"/><g transform="rotate(14 64 66)"><rect x="58" y="52" width="16" height="24" rx="2" fill="#f4efe2"/></g>
    <circle cx="52" cy="60" r="2.4" fill="#e2aa2e"/><path d="M57 56V68" stroke="#2f5f8f" stroke-width="1.6"/><circle cx="68" cy="60" r="2.4" fill="#b3352b"/>`,
  ink:`<rect x="34" y="22" width="44" height="80" rx="7" ${IK} stroke-width="1.7"/><rect x="38" y="30" width="36" height="62" rx="2" ${IK} stroke-width="1"/>`+sk('M52 26H60',1.3)+
   `<g ${IK} stroke-width="1"><g transform="rotate(-14 48 66)"><rect x="40" y="52" width="16" height="24" rx="2"/></g><rect x="49" y="50" width="16" height="24" rx="2"/><g transform="rotate(14 64 66)"><rect x="58" y="52" width="16" height="24" rx="2"/></g></g>`+
   `<g stroke="#3f7a3a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M86 34a10 10 0 0 1 10 10"/><path d="M86 24a20 20 0 0 1 20 20"/><path d="M86 14a30 30 0 0 1 30 30"/></g><circle cx="87" cy="44" r="2.6" fill="#3f7a3a"/>`}),
 /* jugar offline: el mate de la pulpería con dos naipes al lado */
 offline:()=>({art:sombra(58,106,40)+
   `<g transform="rotate(-12 34 62)"><rect x="18" y="40" width="28" height="42" rx="3" fill="#f4efe2"/><circle cx="32" cy="61" r="7" fill="#e2aa2e"/></g>
    <g transform="rotate(10 50 58)"><rect x="36" y="34" width="28" height="42" rx="3" fill="#f4efe2"/><path d="M50 42V68" stroke="#2f5f8f" stroke-width="3"/><path d="M45 64H55" stroke="#2f5f8f" stroke-width="2.4"/></g>
    <path d="M70 58C66 66 66 86 72 96H96C102 86 102 66 98 58Z" fill="#7a4b28"/><path d="M68 54H100V60H68Z" fill="#c9a24a"/><ellipse cx="84" cy="56" rx="15" ry="3.6" fill="#5e8a3a"/>
    <path d="M88 56L100 18" stroke="#c0c0c0" stroke-width="3.4" stroke-linecap="round"/><path d="M100 18L104 14" stroke="#9a9a9a" stroke-width="4" stroke-linecap="round"/>
    <path d="M74 66C72 76 73 86 76 92" stroke="#a8683a" stroke-width="4" fill="none"/>`,
  ink:`<g transform="rotate(-12 34 62)"><rect x="18" y="40" width="28" height="42" rx="3" ${IK} stroke-width="1.4"/><circle cx="32" cy="61" r="7" ${IK} stroke-width="1"/></g>
    <g transform="rotate(10 50 58)"><rect x="36" y="34" width="28" height="42" rx="3" ${IK} stroke-width="1.4"/></g>`+
   sk('M70 58C66 66 66 86 72 96H96C102 86 102 66 98 58Z')+sk('M68 54H100V60H68Z',1.3)+sk('M88 56L100 18',1.2)+sk('M78 76C82 72 88 72 92 76',1)}),
 /* pase de temporada: la guitarra criolla de la peña con su escarapela de premio */
 pase:()=>({art:sombra(56,108,30)+
   `<g transform="rotate(-24 56 70)"><rect x="51" y="4" width="10" height="44" fill="#6b3f1f"/><rect x="49" y="0" width="14" height="12" rx="2" fill="#4a2a14"/>
    <path d="M56 40C44 40 40 50 44 58C36 62 32 72 36 84C40 98 72 98 76 84C80 72 76 62 68 58C72 50 68 40 56 40Z" fill="#d9a05b"/>
    <circle cx="56" cy="64" r="7" fill="#3b2412"/><rect x="48" y="84" width="16" height="4" fill="#4a2a14"/></g>
    <path d="M86 46L80 70L88 64L93 72L94 48Z" fill="#74acdf"/><path d="M94 46L100 70L92 64L88 70L86 48Z" fill="#b3352b"/>
    <circle cx="90" cy="38" r="15" fill="#f3e6c8"/><circle cx="90" cy="38" r="11" fill="#74acdf"/><circle cx="90" cy="38" r="7" fill="#f6c437"/>`,
  ink:`<g transform="rotate(-24 56 70)">${sk('M51 12V48M61 12V48',1.4)}<rect x="49" y="0" width="14" height="12" rx="2" ${IK} stroke-width="1.5"/>
    ${sk('M56 40C44 40 40 50 44 58C36 62 32 72 36 84C40 98 72 98 76 84C80 72 76 62 68 58C72 50 68 40 56 40Z')}<circle cx="56" cy="64" r="7" ${IK} stroke-width="1.4"/>
    <path d="M53 6V86M56 6V86M59 6V86" stroke="#f3e6c8" stroke-width=".6" opacity=".8"/>${sk('M48 84H64V88H48Z',1.1)}</g>
    ${sk('M86 46L80 70L88 64L93 72L94 48',1.2)}${sk('M94 46L100 70L92 64L88 70L86 48',1.2)}
    <circle cx="90" cy="38" r="15" ${IK} stroke-width="1.6" stroke-dasharray="3.5 1.6"/><circle cx="90" cy="38" r="7" ${IK} stroke-width="1.2"/>
    <path d="M90 33L91.5 36.5 95 36.8 92.3 39 93.1 42.5 90 40.6 86.9 42.5 87.7 39 85 36.8 88.5 36.5Z" fill="#b3352b"/>`}),
};
function iconSVG(id){const D=(ICON_ART[id]||ICON_ART.ranking)();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="360" height="360"><defs>${cardDefs()}</defs>
    ${PEN(60,60,D.art)}<g filter="url(#fGrano)" opacity=".35">${D.art}</g>${D.ink}</svg>`}
/* la imagen del ícono: pintada de antemano (img/arte) o, si no hay, el dibujo directo */
const ICONSRC={};
function iconSrc(id){if(ICONSRC[id])return ICONSRC[id];
  return ICONSRC[id]=(window.REVIRO_ART_V&&!window.__ARTGEN)?`img/arte/${window.REVIRO_ART_V}/icono-${id}.webp`:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(iconSVG(id))}
