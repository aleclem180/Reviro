/*ENGINE-START*/
const SUITS=['E','B','O','C'];
const NUMS=[1,2,3,4,5,6,7,10,11,12];
const TNAME={2:'Truco',3:'Retruco',4:'Vale cuatro'};
const ENAME={envido:'Envido',real:'Real envido',falta:'Falta envido'};
function deck(){const d=[];for(const s of SUITS)for(const n of NUMS)d.push(n+s);return d}
const cn=c=>parseInt(c,10), cs=c=>c[c.length-1];
const team=s=>s%2;
function rank(c){const n=cn(c),s=cs(c);
  if(n===1&&s==='E')return 14;if(n===1&&s==='B')return 13;if(n===7&&s==='E')return 12;if(n===7&&s==='O')return 11;
  if(n===3)return 10;if(n===2)return 9;if(n===1)return 8;if(n===12)return 7;if(n===11)return 6;if(n===10)return 5;if(n===7)return 4;if(n===6)return 3;if(n===5)return 2;return 1}
const eVal=c=>{const n=cn(c);return n>=10?0:n};
function envidoOf(cards){const by={};for(const c of cards)(by[cs(c)]=by[cs(c)]||[]).push(eVal(c));let best=0;
  for(const s in by){const v=by[s].sort((a,b)=>b-a);best=Math.max(best,v.length>=2?20+v[0]+v[1]:v[0])}return best}
const hasFlor=cards=>cards.length===3&&cs(cards[0])===cs(cards[1])&&cs(cards[1])===cs(cards[2]);
const florVal=cards=>20+cards.reduce((s,c)=>s+eVal(c),0);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const clone=o=>JSON.parse(JSON.stringify(o));

function newMatch(o){
  const g={v:1,seq:0,n:o.n,target:o.target,flor:!!o.flor,seats:o.seats,scores:[0,0],mano:Math.floor(Math.random()*o.n),
    handNo:0,log:[],matchOver:null,stake:o.stake||0,matchId:o.matchId,diff:o.diff||'medio',lastAct:Date.now()};
  dealHand(g,true);return g}
function dealHand(g,first){
  if(!first)g.mano=(g.mano+1)%g.n;
  g.handNo++;const d=shuffle(deck());const cards=[];
  for(let i=0;i<g.n;i++)cards.push(d.slice(i*3,i*3+3));
  g.hand={cards,orig:clone(cards),bazas:[{lead:g.mano,plays:[]}],results:[],turn:g.mano,
    truco:{level:1,holder:null,pending:null},env:{done:false,pending:null},flor:{done:false,pending:null},
    said:{},gains:[],ended:null};
  logp(g,{k:'hand',no:g.handNo,mano:g.mano});
}
function logp(g,e){g.log.push(e);if(g.log.length>10)g.log=g.log.slice(-10)}
function say(g,s,t){g.hand.said[s]=t;logp(g,{s,t})}
function played(h,s){return h.bazas.some(b=>b.plays.some(p=>p.seat===s))}
function playedIn0(h,s){return h.bazas[0].plays.some(p=>p.seat===s)}
function actor(g){const h=g.hand;if(g.matchOver||h.ended)return -1;
  if(h.flor.pending)return h.flor.pending.resp;if(h.env.pending)return h.env.pending.resp;if(h.truco.pending)return h.truco.pending.resp;return h.turn}
function mustFlor(g,s){const h=g.hand;return g.flor&&!h.flor.done&&!h.flor.pending&&hasFlor(h.orig[s])&&h.results.length===0&&!playedIn0(h,s)}
function canEnvido(g,s){const h=g.hand;return !h.env.done&&!h.flor.pending&&h.results.length===0&&!playedIn0(h,s)&&h.truco.level===1&&!(g.flor&&hasFlor(h.orig[s]))}
function envidoOptions(chain){if(!chain.length)return['envido','real','falta'];const last=chain[chain.length-1];
  if(last==='falta')return[];if(last==='real')return['falta'];return chain.filter(x=>x==='envido').length<2?['envido','real','falta']:['real','falta']}
function faltaFor(g,w){const mx=Math.max(g.scores[0],g.scores[1]);if(g.target===30&&mx<15)return g.target-g.scores[w];return g.target-mx}
function envWanted(g,chain,w){if(chain.includes('falta'))return faltaFor(g,w);return chain.reduce((s,k)=>s+(k==='envido'?2:3),0)}
function envNot(chain){if(chain.length===1)return 1;return chain.slice(0,-1).reduce((s,k)=>s+(k==='envido'?2:3),0)}
function legal(g,s){const h=g.hand,L={play:false,truco:null,envido:[],flor:false,florOpts:[],respond:null,canQuiero:false,mazo:false};
  if(actor(g)!==s)return L;
  if(h.flor.pending){L.respond='flor';const st=h.flor.pending.stage;L.florOpts=st==='flor'?['achico','contra','resto']:st==='contra'?['resto']:[];L.canQuiero=st!=='flor';return L}
  if(h.env.pending){L.respond='env';if(mustFlor(g,s)){L.flor=true;return L}L.canQuiero=true;L.envido=envidoOptions(h.env.pending.chain);return L}
  if(h.truco.pending){L.respond='truco';L.canQuiero=true;const p=h.truco.pending;if(p.level<4)L.truco=p.level+1;
    if(mustFlor(g,s))L.flor=true;else if(canEnvido(g,s))L.envido=['envido','real','falta'];return L}
  L.flor=mustFlor(g,s);L.play=!L.flor;L.mazo=true;
  if(h.truco.level<4&&(h.truco.holder===null||h.truco.holder===team(s)))L.truco=h.truco.level+1;
  if(canEnvido(g,s))L.envido=['envido','real','falta'];
  return L}
function addPoints(g,t,p,why){if(p<=0)return;g.scores[t]+=p;g.hand.gains.push({tm:t,p,why});logp(g,{k:'pts',tm:t,p,why});
  if(g.scores[t]>=g.target&&!g.matchOver){g.scores[t]=Math.min(g.scores[t],g.target);g.matchOver={winner:t};endHand(g,t)}}
function endHand(g,w){if(!g.hand.ended)g.hand.ended={winner:w};g.hand.turn=-1}
function winnerOf(r,mt){
  if(r.length===2){const[a,b]=r;if(a!=='P'&&a===b)return a;if(a==='P'&&b!=='P')return b;if(a!=='P'&&b==='P')return a;return null}
  if(r.length===3){const[a,b,c]=r;if(c!=='P')return c;if(a!=='P')return a;if(b!=='P')return b;return mt}
  return null}
function bestBySeatOrder(g,valFn,filter){let best=-1,bs=-1;for(let i=0;i<g.n;i++){const s=(g.mano+i)%g.n;if(filter&&!filter(s))continue;const v=valFn(s);if(v>best){best=v;bs=s}}return{best,seat:bs}}
function teamBest(g,valFn,filter,t){let best=-1,bs=-1;for(let i=0;i<g.n;i++){const s=(g.mano+i)%g.n;if(team(s)!==t)continue;if(filter&&!filter(s))continue;const v=valFn(s);if(v>best){best=v;bs=s}}return{best,seat:bs}}
function resolveBaza(g){const h=g.hand,b=h.bazas[h.bazas.length-1];let best=-1,ws=[];
  for(const p of b.plays){const r=rank(p.card);if(r>best){best=r;ws=[p.seat]}else if(r===best)ws.push(p.seat)}
  const ts=new Set(ws.map(team));let res,next;if(ts.size>1){res='P';next=b.lead}else{res=team(ws[0]);next=ws[0]}
  h.results.push(res);b.res=res;b.win=res==='P'?-1:ws[0];logp(g,{k:'baza',r:res,i:h.results.length});
  const w=winnerOf(h.results,team(g.mano));
  if(w!==null){addPoints(g,w,h.truco.level,h.truco.level>1?TNAME[h.truco.level].toLowerCase():'la mano');endHand(g,w)}
  else{h.bazas.push({lead:next,plays:[]});h.turn=next}}
const isHuman=(g,s)=>!(g.seats[s]&&g.seats[s].bot);
function respFor(g,caller){let first=-1;for(let i=1;i<=g.n;i++){const s=(caller+i)%g.n;if(team(s)===team(caller))continue;if(first<0)first=s;if(isHuman(g,s))return s}return first}
function firstFlorSeat(g,t,from){let first=-1;for(let i=1;i<=g.n;i++){const s=(from+i)%g.n;if(team(s)===t&&hasFlor(g.hand.orig[s])){if(first<0)first=s;if(isHuman(g,s))return s}}return first}
function act(g0,seat,a){const g=clone(g0),h=g.hand;g.seq++;g.lastAct=Date.now();
  switch(a.t){
  case 'play':{const i=h.cards[seat].indexOf(a.card);if(i<0)throw new Error('carta inválida');h.cards[seat].splice(i,1);
    const b=h.bazas[h.bazas.length-1];b.plays.push({seat,card:a.card});
    if(b.plays.length<g.n)h.turn=(seat+1)%g.n;else resolveBaza(g);break}
  case 'truco':{const prev=h.truco.pending;if(prev)h.truco.level=prev.level;
    h.truco.pending={level:a.level,caller:seat,resp:respFor(g,seat)};say(g,seat,(prev?'¡Quiero ':'¡')+TNAME[a.level]+'!');break}
  case 'envido':{const prev=h.env.pending;const chain=prev?prev.chain.concat(a.kind):[a.kind];
    h.env.pending={chain,caller:seat,resp:respFor(g,seat)};say(g,seat,'¡'+ENAME[a.kind]+'!');break}
  case 'flor':{if(h.env.pending){h.env.pending=null;logp(g,{k:'txt',t:'El envido no va: hay flor'})}h.env.done=true;say(g,seat,'¡Flor!');
    const opp=firstFlorSeat(g,1-team(seat),seat);
    if(opp<0){h.flor.done=true;addPoints(g,team(seat),3,'flor')}else h.flor.pending={stage:'flor',caller:seat,resp:opp};break}
  case 'achico':{const p=h.flor.pending;say(g,seat,'Con flor me achico');h.flor.pending=null;h.flor.done=true;addPoints(g,team(p.caller),4,'flor');break}
  case 'contra':{const p=h.flor.pending;say(g,seat,'¡Contraflor!');h.flor.pending={stage:'contra',caller:seat,resp:p.caller};break}
  case 'resto':{const p=h.flor.pending;say(g,seat,'¡Contraflor al resto!');h.flor.pending={stage:'resto',caller:seat,resp:p.caller,fromContra:p.stage==='contra'};break}
  case 'quiero':
    if(h.flor.pending){const p=h.flor.pending;say(g,seat,'¡Quiero!');h.flor.pending=null;h.flor.done=true;
      const f=s=>hasFlor(h.orig[s]);const b0=teamBest(g,s=>florVal(h.orig[s]),f,0),b1=teamBest(g,s=>florVal(h.orig[s]),f,1);
      const w=pickTie(g,b0,b1);h.said[b0.seat]='Flor de '+b0.best;h.said[b1.seat]='Flor de '+b1.best;
      logp(g,{k:'txt',t:'Flores: '+b0.best+' contra '+b1.best});addPoints(g,w,p.stage==='contra'?6:faltaFor(g,w),'contraflor')}
    else if(h.env.pending){const p=h.env.pending;h.env.pending=null;h.env.done=true;say(g,seat,'¡Quiero!');
      const b0=teamBest(g,s=>envidoOf(h.orig[s]),null,0),b1=teamBest(g,s=>envidoOf(h.orig[s]),null,1);const w=pickTie(g,b0,b1);
      const ws=w===0?b0:b1,ls=w===0?b1:b0;h.said[ws.seat]=String(ws.best);h.said[ls.seat]=ls.best+(ls.best===ws.best?' (gana el mano)':'');
      h.env.sung={w:ws,l:ls};logp(g,{k:'txt',t:'Envido: '+b0.best+' contra '+b1.best});addPoints(g,w,envWanted(g,p.chain,w),p.chain.includes('falta')?'falta envido':'envido')}
    else{const p=h.truco.pending;h.truco.level=p.level;h.truco.holder=team(seat);h.truco.pending=null;say(g,seat,'¡Quiero!')}
    break;
  case 'noquiero':
    if(h.flor.pending){const p=h.flor.pending;say(g,seat,'No quiero');h.flor.pending=null;h.flor.done=true;addPoints(g,team(p.caller),p.stage==='contra'?4:(p.fromContra?6:4),'flor')}
    else if(h.env.pending){const p=h.env.pending;say(g,seat,'No quiero');h.env.pending=null;h.env.done=true;addPoints(g,team(p.caller),envNot(p.chain),'envido no querido')}
    else{const p=h.truco.pending;say(g,seat,'No quiero');h.truco.pending=null;addPoints(g,team(p.caller),h.truco.level,TNAME[p.level].toLowerCase()+' no querido');endHand(g,team(p.caller))}
    break;
  case 'mazo':{say(g,seat,'Me voy al mazo');const o=1-team(seat);let pts=h.truco.level;if(h.results.length===0&&!h.env.done)pts+=1;
    addPoints(g,o,pts,'mazo');endHand(g,o);break}
  default:throw new Error('acción desconocida')}
  return g}
function pickTie(g,b0,b1){if(b0.best!==b1.best)return b0.best>b1.best?0:1;
  for(let i=0;i<g.n;i++){const s=(g.mano+i)%g.n;if(s===b0.seat)return 0;if(s===b1.seat)return 1}return team(g.mano)}
function nextHand(g0){const g=clone(g0);if(g.matchOver)return g;g.seq++;g.lastAct=Date.now();dealHand(g,false);return g}

/* ---------- IA ---------- */
function allPlayed(h){const a=[];for(const b of h.bazas)for(const p of b.plays)a.push(p.card);return a}
function unseen(g,s){const h=g.hand;const k=new Set([...h.orig[s],...allPlayed(h)]);return deck().filter(c=>!k.has(c))}
let AIHINT=null;
function sampleOnce(g,s){const h=g.hand,pool=shuffle(unseen(g,s));const out=[];let k=0;const H=AIHINT;let fixed=[];
  if(H&&H.cards){fixed=H.cards.filter(c=>pool.includes(c)&&h.cards[H.seat].length>0).slice(0,h.cards[H.seat].length);for(const c of fixed)pool.splice(pool.indexOf(c),1)}
  for(let i=0;i<g.n;i++){if(i===s)out.push(h.cards[i].slice());else{const m=h.cards[i].length;let hand=[];if(H&&i===H.seat)hand=fixed.slice();while(hand.length<m)hand.push(pool[k++]);out.push(hand)}}return out}
function sampleHands(g,s){let out=sampleOnce(g,s);const H=AIHINT;if(H&&H.weak){for(let t=0;t<10&&out[H.seat].some(c=>rank(c)>=9);t++)out=sampleOnce(g,s)}return out}
function greedy(hand,plays,s){const my=team(s);let bo=-1,bm=-1;for(const p of plays){const r=rank(p.card);if(team(p.seat)===my)bm=Math.max(bm,r);else bo=Math.max(bo,r)}
  const so=hand.slice().sort((a,b)=>rank(a)-rank(b));if(!plays.length)return so[so.length-1];if(bm>bo)return so[0];
  return so.find(c=>rank(c)>bo)||so[0]}
function simulate(g,hands,forced){const h=g.hand,n=g.n;const res=h.results.slice();const cur=h.bazas[h.bazas.length-1];
  let plays=cur.plays.map(p=>({seat:p.seat,card:p.card})),lead=cur.lead,turn=h.turn;hands=hands.map(x=>x.slice());let first=true;
  for(let k=0;k<16;k++){if(!hands[turn].length)break;const card=(first&&forced)?forced:greedy(hands[turn],plays,turn);first=false;
    hands[turn].splice(hands[turn].indexOf(card),1);plays.push({seat:turn,card});
    if(plays.length<n){turn=(turn+1)%n;continue}
    let best=-1,ws=[];for(const p of plays){const r=rank(p.card);if(r>best){best=r;ws=[p.seat]}else if(r===best)ws.push(p.seat)}
    const ts=new Set(ws.map(team));let r,nx;if(ts.size>1){r='P';nx=lead}else{r=team(ws[0]);nx=ws[0]}
    res.push(r);const w=winnerOf(res,team(g.mano));if(w!==null)return w;plays=[];lead=nx;turn=nx}
  return team(g.mano)}
function winProb(g,s,N,forced){let w=0;for(let i=0;i<N;i++){if(simulate(g,sampleHands(g,s),forced)===team(s))w++}return w/N}
function envWinProb(g,s,N){const h=g.hand;let w=0;for(let i=0;i<N;i++){const hs=sampleHands(g,s);let best=-1,bt=null;
  for(let j=0;j<g.n;j++){const x=(g.mano+j)%g.n;const cards=x===s?h.orig[x]:hs[x].concat(allPlayed({bazas:h.bazas.map(b=>({plays:b.plays.filter(p=>p.seat===x)}))}));
    const e=envidoOf(cards);if(e>best){best=e;bt=team(x)}}if(bt===team(s))w++}return w/N}
function decideEnvidoCall(g,s,d,myE){const R=Math.random;
  if(d==='facil')return R()<0.2?{t:'envido',kind:'envido'}:null;
  if(d==='medio'){if(myE>=31)return{t:'envido',kind:'real'};if(myE>=27)return{t:'envido',kind:'envido'};return null}
  const p=envWinProb(g,s,Math.round(200*SMUL));
  if(p>0.9&&faltaFor(g,team(s))<=4)return{t:'envido',kind:'falta'};
  if(p>0.82)return{t:'envido',kind:'real'};if(p>0.6)return{t:'envido',kind:'envido'};
  if(R()<0.07)return{t:'envido',kind:'envido'};return null}
function mediumPick(hand,plays,s,h){const so=hand.slice().sort((a,b)=>rank(a)-rank(b));
  if(AIHINT&&team(AIHINT.seat)===team(s)&&plays.length&&!plays.some(p=>p.seat===AIHINT.seat)&&AIHINT.cards&&AIHINT.cards.some(c=>h.cards[AIHINT.seat].includes(c)&&rank(c)>Math.max(...plays.filter(p=>team(p.seat)!==team(s)).map(p=>rank(p.card)),0)))return so[0];
  if(!plays.length){if(h.results.length===0&&so.length===3)return so[1];return so[so.length-1]}return greedy(hand,plays,s)}
let SMUL=1;
function aiAct(g,s,dOver,hint){AIHINT=hint&&hint.seat!==s?hint:null;let d=dOver||g.diff||'medio';SMUL=1;
  if(!dOver&&typeof g.skill==='number'&&g.seats[s]&&g.seats[s].bot){const k=g.skill,r=Math.random();d=r<k?'dificil':r<Math.min(1,k+.5)?'medio':'facil';SMUL=.45+k*1.1}
  try{return aiCore(g,s,d)}finally{AIHINT=null;SMUL=1}}
function aiCore(g,s,d){const L=legal(g,s),h=g.hand,R=Math.random,Q={t:'quiero'},NQ={t:'noquiero'};
  const myE=envidoOf(h.orig[s]),opp=1-team(s);
  if(L.respond==='flor'){const fv=florVal(h.orig[s]),st=h.flor.pending.stage;
    if(d==='facil'){if(st==='flor')return{t:R()<.5?'achico':'contra'};return R()<.5?Q:NQ}
    const th=d==='dificil'?[30,33,35]:[29,32,34];
    if(st==='flor'){if(fv>=th[2]&&faltaFor(g,team(s))<=10)return{t:'resto'};return fv>=th[0]?{t:'contra'}:{t:'achico'}}
    if(st==='contra'){if(fv>=th[2]&&L.florOpts.includes('resto'))return{t:'resto'};return fv>=th[0]?Q:NQ}
    return fv>=th[1]?Q:NQ}
  if(L.flor)return{t:'flor'};
  if(L.respond==='env'){const chain=h.env.pending.chain,W=envWanted(g,chain,team(s)),N=envNot(chain);
    if(g.scores[opp]+N>=g.target)return Q;
    if(d==='facil')return R()<.55?Q:NQ;
    if(d==='medio'){const need=chain.includes('falta')?30:chain.length>1?29:chain[0]==='real'?28:26;
      if(myE>=33&&L.envido.includes('falta')&&!chain.includes('falta'))return{t:'envido',kind:'falta'};
      if(myE>=31&&L.envido.includes('real'))return{t:'envido',kind:'real'};return myE>=need?Q:NQ}
    let p=envWinProb(g,s,Math.round(250*SMUL))*0.86;
    if(p>0.8&&L.envido.length){const k=L.envido.includes('real')?'real':L.envido.includes('falta')&&faltaFor(g,team(s))<=8?'falta':null;if(k)return{t:'envido',kind:k}}
    return (2*p-1)*W>-N+0.3?Q:NQ}
  if(L.respond==='truco'){
    if(L.envido.length){const e=decideEnvidoCall(g,s,d,myE);if(e)return e}
    const P=h.truco.pending,W=P.level,N=h.truco.level;
    if(g.scores[opp]+N>=g.target)return Q;
    if(d==='facil')return R()<.6?Q:NQ;
    const p=winProb(g,s,Math.round((d==='dificil'?220:90)*SMUL));
    if(d==='medio'){if(p>0.8&&L.truco)return{t:'truco',level:L.truco};return p>0.42?Q:NQ}
    const pa=p*0.86;if(pa>0.72&&L.truco)return{t:'truco',level:L.truco};
    return pa>(W-N)/(2*W)+0.12?Q:NQ}
  if(L.envido.length){const e=decideEnvidoCall(g,s,d,myE);if(e)return e}
  if(L.truco){let call=false;
    if(d==='facil')call=R()<0.12;
    else{const p=winProb(g,s,Math.round((d==='dificil'?200:80)*SMUL));call=d==='medio'?p>0.7:(p>0.63||(R()<0.1&&p>0.3))}
    if(call)return{t:'truco',level:L.truco}}
  const hand=h.cards[s],plays=h.bazas[h.bazas.length-1].plays;
  if(d==='facil')return{t:'play',card:hand[Math.floor(R()*hand.length)]};
  if(d==='medio')return{t:'play',card:mediumPick(hand,plays,s,h)};
  if(hand.length===1)return{t:'play',card:hand[0]};
  let best=null,bp=-1;for(const c of hand.slice().sort((a,b)=>rank(a)-rank(b))){const p=winProb(g,s,Math.round(110*SMUL),c);if(p>bp+0.02){bp=p;best=c}}
  return{t:'play',card:best}}
/*ENGINE-END*/
