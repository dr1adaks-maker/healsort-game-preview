import {SkyMap,bodyForDay} from './map.js';

const TAU=Math.PI*2;
const PALETTES={Sun:['#fff8c6','#ffc653','#dc6828'],Moon:['#fff8e4','#c3cbd0','#657987'],Mercury:['#f1e0c2','#a89f94','#596c71'],Venus:['#fff1c5','#dab77e','#9a704c'],Mars:['#ffc995','#d36f49','#743c37'],Jupiter:['#fff1cf','#d9b18b','#8f695b'],Saturn:['#fff3cd','#c9b58a','#867c6a'],Uranus:['#e1ffff','#82d5d5','#4a8c99'],Neptune:['#aedcff','#538fdf','#304c98'],Pluto:['#f0d9bc','#af8c78','#69575a'],Earth:['#c2f1ff','#3c9dcd','#1c4a91']};
function circle(ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU);}
function rounded(ctx,x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function continent(ctx,points,r){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*r,y*r):ctx.moveTo(x*r,y*r));ctx.closePath();ctx.fill();ctx.stroke();}
export function drawPlanet(ctx,id,x,y,r,{alpha=1,glow=1}={}){
 const c=PALETTES[id]||PALETTES.Moon;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);
 const aura=ctx.createRadialGradient(0,0,r*.6,0,0,r*2.1);aura.addColorStop(0,c[1]+'55');aura.addColorStop(.5,c[1]+'22');aura.addColorStop(1,c[1]+'00');ctx.fillStyle=aura;ctx.globalAlpha=alpha*glow;ctx.fillRect(-r*2.2,-r*2.2,r*4.4,r*4.4);ctx.globalAlpha=alpha;
 if(id==='Saturn'){ctx.save();ctx.rotate(-.32);ctx.strokeStyle='#e6d4a4';ctx.lineWidth=r*.25;ctx.shadowBlur=r*.4;ctx.shadowColor='#e8d7ac';ctx.beginPath();ctx.ellipse(0,0,r*1.82,r*.49,0,0,TAU);ctx.stroke();ctx.strokeStyle='#9a8e78';ctx.lineWidth=r*.08;ctx.beginPath();ctx.ellipse(0,0,r*1.57,r*.40,0,0,TAU);ctx.stroke();ctx.restore();}
 ctx.save();circle(ctx,0,0,r);ctx.clip();
 const surface=ctx.createRadialGradient(-r*.35,-r*.4,r*.05,r*.35,r*.25,r*1.5);surface.addColorStop(0,c[0]);surface.addColorStop(.43,c[1]);surface.addColorStop(1,c[2]);ctx.fillStyle=surface;ctx.fillRect(-r,-r,r*2,r*2);
 if(id==='Earth'){
  ctx.fillStyle='#91c895';ctx.strokeStyle='#b3e5ad';ctx.lineWidth=r*.014;
  continent(ctx,[[-.82,-.25],[-.65,-.59],[-.25,-.68],[-.04,-.48],[-.24,-.25],[-.13,-.04],[-.29,.09],[-.38,-.01],[-.54,-.1],[-.68,-.04]],r);
  continent(ctx,[[-.25,.05],[-.02,.18],[.05,.44],[-.13,.78],[-.31,.59],[-.37,.32]],r);
  continent(ctx,[[.13,-.48],[.25,-.62],[.68,-.58],[.85,-.31],[.65,-.09],[.42,-.04],[.37,.19],[.2,.12],[.05,-.09],[.16,-.22]],r);
  continent(ctx,[[.15,.08],[.48,.14],[.46,.42],[.25,.62],[.12,.39]],r);
  continent(ctx,[[.65,.52],[.9,.48],[.94,.68],[.71,.77]],r);
  ctx.strokeStyle='#f1ffffaa';ctx.lineWidth=r*.06;ctx.lineCap='round';for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse((i%2?r*.15:-r*.15),(i-1.5)*r*.35,r*.8,r*.09,-.2,Math.PI*.12,Math.PI*.78);ctx.stroke();}
 }else if(['Jupiter','Saturn','Venus','Uranus','Neptune'].includes(id)){
  for(let i=-5;i<=5;i++){ctx.strokeStyle=i%2===0?c[0]+'55':c[2]+'55';ctx.lineWidth=r*(id==='Jupiter'?.16:.08);ctx.beginPath();ctx.ellipse(-r*.1,i*r*.19,r*1.35,r*.15,-.13,0,TAU);ctx.stroke();}
  if(id==='Jupiter'){ctx.fillStyle='#b66c57aa';ctx.beginPath();ctx.ellipse(r*.35,r*.31,r*.27,r*.12,-.13,0,TAU);ctx.fill();}
 }else if(id!=='Sun'){
  for(let i=0;i<13;i++){const a=i*2.399,rr=r*.75*Math.sqrt((i+.5)/13),px=Math.cos(a)*rr,py=Math.sin(a)*rr,cr=r*(.045+(i%3)*.032);circle(ctx,px,py,cr);ctx.fillStyle=c[2]+'55';ctx.fill();ctx.strokeStyle=c[0]+'55';ctx.lineWidth=1;ctx.stroke();}
  if(id==='Mars'){ctx.fillStyle='#fff6ddaa';ctx.beginPath();ctx.ellipse(0,-r*.88,r*.37,r*.15,0,0,TAU);ctx.fill();}
 }else{
  for(let i=0;i<7;i++){ctx.strokeStyle='#fff9b955';ctx.lineWidth=r*.055;ctx.beginPath();ctx.ellipse(0,(i-3)*r*.24,r*1.15,r*.1,.08,0,TAU);ctx.stroke();}
 }
 const shade=ctx.createLinearGradient(-r,-r,r,r);shade.addColorStop(0,'#ffffff22');shade.addColorStop(.5,'#00000000');shade.addColorStop(1,'#0a244d88');ctx.fillStyle=shade;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
 circle(ctx,0,0,r);ctx.shadowBlur=r*.30;ctx.shadowColor=c[0];ctx.strokeStyle=c[0]+'dd';ctx.lineWidth=Math.max(1.5,r*.035);ctx.stroke();ctx.restore();
}
export function layoutBodies(bodies,centre={x:800,y:1020},scale=2.12){
 const occupied=[{x:centre.x-115,y:centre.y-110,w:230,h:260}];
 return bodies.map(b=>{
  const a=(b.azimuth-90)*Math.PI/180,rho=(90-b.altitude)/180*255*scale;
  const exact={x:centre.x+Math.cos(a)*rho,y:centre.y+Math.sin(a)*rho};
  const radius={Sun:48,Moon:32,Mercury:29,Venus:38,Mars:35,Jupiter:52,Saturn:45,Uranus:38,Neptune:38,Pluto:28}[b.id];
  const offsets=[[0,0]];for(let ring=1;ring<=5;ring++)for(let j=0;j<12;j++){const a=j*TAU/12;offsets.push([Math.cos(a)*ring*85,Math.sin(a)*ring*85]);}
  let pos;for(const [dx,dy]of offsets){const x=Math.max(170,Math.min(1430,exact.x+dx)),y=Math.max(420,Math.min(1550,exact.y+dy));const box={x:x-radius-43,y:y-radius-10,w:radius*2+86,h:radius*2+66};if(!occupied.some(o=>box.x<o.x+o.w&&box.x+box.w>o.x&&box.y<o.y+o.h&&box.y+box.h>o.y)){pos={x,y,box};break;}}
  if(!pos){const idx=bodies.indexOf(b);pos={x:idx%2?1360:240,y:450+Math.floor(idx/2)*200};pos.box={x:pos.x-90,y:pos.y-65,w:180,h:150};}
  occupied.push(pos.box);return {...b,exact,x:pos.x,y:pos.y,radius};
 });
}
function trackedText(ctx,text,x,y,spacing=6){const chars=[...text],width=chars.reduce((s,c)=>s+ctx.measureText(c).width,0)+(chars.length-1)*spacing;let at=x-width/2;ctx.textAlign='left';for(const c of chars){ctx.fillText(c,at,y);at+=ctx.measureText(c).width+spacing;}ctx.textAlign='center';}
export async function renderAtlas({state,chart,stars,lines}){
 await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=2100;const ctx=canvas.getContext('2d');
 const bg=ctx.createLinearGradient(0,0,1600,2100);bg.addColorStop(0,'#406757');bg.addColorStop(.5,'#294d42');bg.addColorStop(1,'#426a59');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,2100);
 // Decorative edge planets are outside the calculated map and have no data labels.
 drawPlanet(ctx,'Saturn',1510,240,158,{alpha:.22,glow:.8});drawPlanet(ctx,'Neptune',80,1735,128,{alpha:.22,glow:.8});
 ctx.save();ctx.strokeStyle='#d9cfaa66';ctx.lineWidth=1;rounded(ctx,42,42,1516,2016,24);ctx.stroke();ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='#f4dfaa';ctx.font='28px Manrope, sans-serif';trackedText(ctx,'ХилСорт',800,115,3);
 ctx.font='74px Georgia';ctx.fillStyle='#fff3d6';ctx.fillText('Мой звёздный атлас',800,220);ctx.font='27px Manrope, sans-serif';ctx.fillStyle='#e0e7d4';ctx.fillText(state.profile.name,800,272);
 ctx.font='17px Manrope, sans-serif';ctx.fillStyle='#d6dfca';trackedText(ctx,'ВАШЕ НЕБО · ВАШ ЛИЧНЫЙ ПУТЬ',800,319,2.5);
 const tmp=document.createElement('canvas'),fog=document.createElement('canvas'),nodes=document.createElement('div'),sky=new SkyMap(tmp,fog,nodes,chart,state.profile,stars,lines,()=>{});
 const centre={x:800,y:1020},scale=2.12,R=267*scale;
 ctx.save();ctx.translate(centre.x,centre.y);const field=ctx.createRadialGradient(-120,-110,20,0,0,R);field.addColorStop(0,'#517c68');field.addColorStop(.5,'#355d50');field.addColorStop(1,'#2d5046');circle(ctx,0,0,R);ctx.fillStyle=field;ctx.fill();ctx.shadowColor='#c9e8c3';ctx.shadowBlur=28;ctx.strokeStyle='#e2d2a8';ctx.lineWidth=2.5;ctx.stroke();ctx.shadowBlur=0;ctx.restore();
 ctx.save();circle(ctx,centre.x,centre.y,R-2);ctx.clip();
 ctx.translate(centre.x-320*scale,centre.y-320*scale);ctx.scale(scale,scale);
 for(const line of sky.segments){ctx.beginPath();let last;for(const p of line){if(!last||Math.hypot(last.x-p.x,last.y-p.y)>170)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);last=p;}ctx.shadowColor='#e9e6bb';ctx.shadowBlur=3;ctx.strokeStyle='rgba(237,222,171,.65)';ctx.lineWidth=.72;ctx.stroke();}
 ctx.shadowBlur=0;for(const s of sky.points){circle(ctx,s.x,s.y,Math.max(.65,(5.2-s.mag)*.48));ctx.fillStyle='#fff1c2';ctx.shadowColor='#fff6ca';ctx.shadowBlur=s.mag<2?7:3;ctx.fill();if(s.mag<1.8){ctx.lineWidth=.6;ctx.strokeStyle='#ffffdd';ctx.beginPath();ctx.moveTo(s.x-3,s.y);ctx.lineTo(s.x+3,s.y);ctx.moveTo(s.x,s.y-3);ctx.lineTo(s.x,s.y+3);ctx.stroke();}}
 ctx.shadowBlur=0;ctx.font='7px Manrope, sans-serif';ctx.textAlign='center';ctx.fillStyle='#dce4c2aa';for(const p of sky.constellationLabels)ctx.fillText(p.name.toUpperCase(),p.x,p.y-7);
 ctx.restore();
 if(state.opened.length<30){
  const veil=document.createElement('canvas');veil.width=1600;veil.height=2100;const f=veil.getContext('2d');circle(f,centre.x,centre.y,R-2);f.fillStyle='#355a4ce8';f.fill();f.globalCompositeOperation='destination-out';
  for(const b of sky.planets.filter(b=>state.opened.some(n=>bodyForDay(n)===b.id))){const x=centre.x+(b.x-320)*scale,y=centre.y+(b.y-320)*scale,rr=90+state.opened.length*9,g=f.createRadialGradient(x,y,25,x,y,rr);g.addColorStop(0,'#000');g.addColorStop(.65,'#000e');g.addColorStop(1,'#0000');f.fillStyle=g;f.fillRect(x-rr,y-rr,rr*2,rr*2);}ctx.drawImage(veil,0,0);
 }
 for(const r of [127.5*scale,R+17,R+39]){circle(ctx,centre.x,centre.y,r);ctx.strokeStyle=r<R?'#eff1c955':'#e4d3a883';ctx.lineWidth=r<R?1:1.5;ctx.stroke();}
 for(let i=0;i<120;i++){const a=i*TAU/120,r0=R+20,r1=R+(i%10===0?36:28);ctx.beginPath();ctx.moveTo(centre.x+Math.cos(a)*r0,centre.y+Math.sin(a)*r0);ctx.lineTo(centre.x+Math.cos(a)*r1,centre.y+Math.sin(a)*r1);ctx.strokeStyle=i%10===0?'#fff0c3':'#e6d6ab88';ctx.lineWidth=1.5;ctx.stroke();}
 ctx.textAlign='center';ctx.font='23px Georgia';ctx.fillStyle='#eee5c5';ctx.fillText('С',centre.x,centre.y-R-61);ctx.fillText('Ю',centre.x,centre.y+R+76);ctx.fillText('В',centre.x+R+65,centre.y+8);ctx.fillText('З',centre.x-R-65,centre.y+8);
 drawPlanet(ctx,'Earth',centre.x,centre.y,88,{glow:1.4});ctx.font='25px Manrope, sans-serif';ctx.fillStyle='#f6f2d9';ctx.shadowColor='#142c23';ctx.shadowBlur=5;ctx.fillText('Земля',centre.x,centre.y+126);ctx.shadowBlur=0;ctx.font='13px Manrope, sans-serif';ctx.fillStyle='#e1e8d1';ctx.fillText('ТОЧКА НАБЛЮДЕНИЯ',centre.x,centre.y+150);
 const visible=chart.bodies.filter(b=>state.opened.some(n=>bodyForDay(n)===b.id));
 for(const b of layoutBodies(visible,centre,scale)){
  if(Math.hypot(b.x-b.exact.x,b.y-b.exact.y)>10){ctx.beginPath();ctx.moveTo(b.exact.x,b.exact.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#f4e4b5cc';ctx.lineWidth=1.7;ctx.stroke();circle(ctx,b.exact.x,b.exact.y,4);ctx.shadowColor='#fff7cf';ctx.shadowBlur=10;ctx.fillStyle='#fff8d5';ctx.fill();ctx.shadowBlur=0;}
  drawPlanet(ctx,b.id,b.x,b.y,b.radius,{glow:1.3});ctx.font='24px Manrope, sans-serif';const w=Math.max(110,ctx.measureText(b.name).width+28),y=b.y+b.radius+11;rounded(ctx,b.x-w/2,y,w,38,12);ctx.fillStyle='#294d42eb';ctx.fill();ctx.strokeStyle='#d6dabb66';ctx.lineWidth=.8;ctx.stroke();ctx.fillStyle='#fff5db';ctx.fillText(b.name,b.x,y+27);
 }
 ctx.font='29px Georgia';ctx.fillStyle='#ffebba';ctx.fillText(`${state.opened.length} / 30 открытий`,800,1745);ctx.font='24px Manrope, sans-serif';ctx.fillStyle='#eef1df';ctx.fillText(`${state.profile.dob.split('-').reverse().join('.')} · ${state.profile.unknownTime?'время неизвестно':state.profile.time} · ${state.profile.city}`,800,1800,1430);
 ctx.font='18px Manrope, sans-serif';ctx.fillStyle='#d8e2cf';ctx.fillText(chart.approximate?'Предварительный расчёт на местный полдень.':'Точки на карте — положения небесных тел на момент рождения.',800,1846);ctx.fillText('Художественная схема: размеры дисков условные, Земля обозначает точку наблюдения.',800,1878);ctx.fillText('Планеты на полях — декоративные элементы.',800,1908);
 const mascot=new Image();mascot.src='assets/olion.png';await mascot.decode();ctx.save();ctx.globalCompositeOperation='lighten';ctx.drawImage(mascot,74,1912,160,160);ctx.restore();ctx.textAlign='left';ctx.font='italic 32px Georgia';ctx.fillStyle='#ffedc6';ctx.fillText('Открываем небо. Замечаем себя.',275,1990);ctx.font='16px Manrope, sans-serif';ctx.fillStyle='#dce5cf';ctx.fillText(state.mode==='demo'?'Пример финального атласа · ХилСорт':'Личный звёздный атлас · ХилСорт',275,2026);
 return canvas;
}
