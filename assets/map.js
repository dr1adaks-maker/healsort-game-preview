import {BODIES} from './core.js';
const rad=Math.PI/180;
function project(az,alt){const a=(az-90)*rad,r=(90-alt)/180*255;return {x:320+Math.cos(a)*r,y:320+Math.sin(a)*r};}
export class SkyMap{
 constructor(canvas,fog,nodeLayer,chart,profile,stars,lines,onClick){this.canvas=canvas;this.fog=fog;this.nodeLayer=nodeLayer;this.chart=chart;this.profile=profile;this.stars=stars;this.lines=lines;this.onClick=onClick;this.rotation=0;this.ready=false;this.prepare();}
 prepare(){
  const A=window.Astronomy,date=new Date(this.chart.instant),obs=new A.Observer(this.profile.lat,this.profile.lon,0),rotation=A.Rotation_EQJ_EQD(date);
  const convert=coord=>{
   const ra=coord[0]*rad,dec=coord[1]*rad,v=new A.Vector(Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec),date);
   const eq=A.EquatorFromVector(A.RotateVector(rotation,v)),h=A.Horizon(date,obs,eq.ra,eq.dec);return project(h.azimuth,h.altitude);
  };
  this.points=this.stars.features.filter(s=>s.properties.mag<=4.65).map(s=>({...convert(s.geometry.coordinates),mag:s.properties.mag}));
  this.segments=this.lines.features.flatMap(f=>f.geometry.coordinates.map(line=>line.map(convert)));
  const names={Cas:'Кассиопея',UMa:'Большая Медведица',UMi:'Малая Медведица',Ori:'Орион',Cyg:'Лебедь',Lyr:'Лира',And:'Андромеда',Per:'Персей',Leo:'Лев',Vir:'Дева',Tau:'Телец',Gem:'Близнецы',Sco:'Скорпион',Sgr:'Стрелец',Aqr:'Водолей',Psc:'Рыбы',Ari:'Овен',Lib:'Весы',Cap:'Козерог',Cnc:'Рак'};
  this.constellationLabels=this.lines.features.filter(f=>names[f.id]).map(f=>{const pts=f.geometry.coordinates.flat().map(convert);return {name:names[f.id],x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};}).filter(p=>Math.hypot(p.x-320,p.y-320)<245);
  this.planets=this.chart.bodies.map(b=>({...b,...project(b.azimuth,b.altitude)}));
  // Screen-only label collision avoidance: leader lines retain the true position.
  this.labels=this.planets.map((b,i)=>{let x=b.x,y=b.y;for(let tries=0;tries<18;tries++){
   const overlap=this.planets.slice(0,i).some((p,j)=>Math.hypot(x-(this.labels?.[j]?.x??p.x),y-(this.labels?.[j]?.y??p.y))<37);
   if(!overlap)break;const a=(i*71+tries*54)*rad;x=b.x+Math.cos(a)*(22+tries*2);y=b.y+Math.sin(a)*(22+tries*2);
  }return {...b,labelX:Math.min(575,Math.max(65,x)),labelY:Math.min(575,Math.max(65,y))};});
  this.ready=true;
 }
 resize(){const dpr=Math.min(window.devicePixelRatio||1,2);for(const canvas of [this.canvas,this.fog]){canvas.width=640*dpr;canvas.height=640*dpr;canvas.getContext('2d').setTransform(dpr,0,0,dpr,0,0);}this.draw(this.opened||[],this.current||1);}
 draw(opened,current){
  if(!this.ready)return;this.opened=opened;this.current=current;
  const ctx=this.canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,640,640);
  ctx.save();ctx.beginPath();ctx.arc(320,320,266,0,Math.PI*2);ctx.clip();
  const g=ctx.createRadialGradient(320,320,10,320,320,270);g.addColorStop(0,'#203e35');g.addColorStop(.65,'#172e28');g.addColorStop(1,'#162922');ctx.fillStyle=g;ctx.fillRect(0,0,640,640);
  for(const line of this.segments){ctx.beginPath();let last;for(const p of line){if(!last||Math.hypot(p.x-last.x,p.y-last.y)>170)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);last=p;}ctx.strokeStyle='rgba(192,171,123,.2)';ctx.lineWidth=.65;ctx.stroke();}
  for(const s of this.points){const r=Math.max(.55,(5.2-s.mag)*.46);ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);ctx.fillStyle=`rgba(238,228,194,${Math.min(.9,.32+(5-s.mag)*.12)})`;ctx.fill();if(s.mag<1.8){ctx.strokeStyle='rgba(226,209,156,.55)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(s.x-r*2,s.y);ctx.lineTo(s.x+r*2,s.y);ctx.moveTo(s.x,s.y-r*2);ctx.lineTo(s.x,s.y+r*2);ctx.stroke();}}
  ctx.font='8px Manrope, sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(202,190,150,.42)';for(const p of this.constellationLabels)ctx.fillText(p.name.toUpperCase(),p.x,p.y-8);
  const visible=body=>opened.some(d=>bodyForDay(d)===body);
  const first=this.planets.filter(b=>visible(b.id));
  for(const b of this.labels){if(!visible(b.id)&&b.id!==bodyForDay(current))continue;if(Math.hypot(b.labelX-b.x,b.labelY-b.y)>3){ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.labelX,b.labelY);ctx.strokeStyle='rgba(212,190,137,.4)';ctx.lineWidth=.7;ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,2,0,Math.PI*2);ctx.fillStyle='#d6bd87';ctx.fill();}}
  if(first.length>1){ctx.beginPath();first.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='rgba(205,181,124,.35)';ctx.lineWidth=.7;ctx.setLineDash([3,6]);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
  // The horizon is the inner ring in an all-sky azimuthal equidistant projection.
  for(const [r,opacity] of [[127.5,.18],[267,.37],[279,.15],[294,.18]]){ctx.beginPath();ctx.arc(320,320,r,0,Math.PI*2);ctx.strokeStyle=`rgba(203,180,134,${opacity})`;ctx.lineWidth=.7;ctx.stroke();}
  for(let i=0;i<120;i++){const a=i*3*rad,r1=i%10===0?269:274;ctx.beginPath();ctx.moveTo(320+Math.cos(a)*r1,320+Math.sin(a)*r1);ctx.lineTo(320+Math.cos(a)*278,320+Math.sin(a)*278);ctx.strokeStyle=`rgba(203,180,134,${i%10===0?.6:.22})`;ctx.lineWidth=.7;ctx.stroke();}
  ctx.font='11px Georgia';ctx.fillStyle='#a6a68d';ctx.textAlign='center';ctx.fillText('С',320,19);ctx.fillText('В',620,324);ctx.fillText('Ю',320,627);ctx.fillText('З',20,324);
  ctx.font='9px sans-serif';ctx.fillStyle='#6f8275';ctx.fillText('Г О Р И З О Н Т',320,451);
  const f=this.fog.getContext('2d');f.clearRect(0,0,640,640);
  if(opened.length<30){f.save();f.beginPath();f.arc(320,320,265,0,Math.PI*2);f.clip();const mist=f.createRadialGradient(255,230,10,340,380,350);mist.addColorStop(0,'rgba(149,168,145,.16)');mist.addColorStop(.45,'rgba(36,61,50,.90)');mist.addColorStop(1,'rgba(40,62,51,.65)');f.fillStyle=mist;f.fillRect(0,0,640,640);
   f.globalCompositeOperation='destination-out';for(const b of first){const radius=45+opened.length*3;const v=f.createRadialGradient(b.x,b.y,10,b.x,b.y,radius);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.6,'rgba(0,0,0,.9)');v.addColorStop(1,'rgba(0,0,0,0)');f.fillStyle=v;f.fillRect(b.x-radius,b.y-radius,radius*2,radius*2);}f.restore();}
  this.nodeLayer.replaceChildren();
  this.labels.forEach(b=>{const day=firstDay(b.id),unlocked=visible(b.id),next=bodyForDay(current)===b.id;
   if(!unlocked&&!next)return;const el=document.createElement('button');el.className='planet-node '+(unlocked?'revealed':'awaiting')+(next?' selected':'');el.style.left=`${b.labelX/640*100}%`;el.style.top=`${b.labelY/640*100}%`;el.setAttribute('aria-label',`${b.name}: ${unlocked?'открыть карточку':'следующее открытие'}`);el.innerHTML=`<span class="planet-symbol">${b.symbol}</span><span class="planet-label">${unlocked?b.name:'Ваше открытие'}</span>`;el.addEventListener('click',()=>this.onClick(unlocked?day:current));this.nodeLayer.append(el);
  });
 }
}
const ORDER=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Sun','Saturn','Uranus','Neptune','Pluto','Moon','Sun','Moon','Sun','Mercury','Mars','Moon','Sun','Mercury','Saturn','Venus','Moon','Sun','Mercury','Venus','Mars','Moon','Sun','Sun'];
export function bodyForDay(n){return ORDER[n-1];}
export function firstDay(body){return ORDER.indexOf(body)+1;}
