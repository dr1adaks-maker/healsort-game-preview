import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {BODIES,CITIES,DEMO_PROFILE,SIGNS,defaultState,initialForProfile,birthInstant,calculateChart,discovery,motivation,shortPractice,openDay,canOpen,localDay,validateProfile,parseSavedState,saveGratitudes,dailyBotMessages} from '../assets/core.js';
import {planetReading} from '../assets/interpretations.js';
const context=vm.createContext({Date,Math,console});
vm.runInContext(fs.readFileSync(new URL('../assets/astronomy.browser.min.js',import.meta.url),'utf8'),context);
const A=context.Astronomy;
const data=JSON.parse(fs.readFileSync(new URL('../assets/practices.json',import.meta.url)));
test('31 birth-day routes contain 30 complete original practices each',()=>{
 assert.equal(Object.keys(data.tracks).length,31);
 for(let n=1;n<=31;n++)for(let d=1;d<=30;d++){
  const t=data.tracks[n],p=t.days[d];assert.ok(p.full&&p.question&&p.next);const short=shortPractice(d,t);assert.ok(short.title&&short.text&&short.minutes);
 }
});
test('birth date validation rejects invalid dates, future dates and minors',()=>{
 for(const dob of ['2026-02-30','2030-01-01','2015-04-01','1899-01-01'])assert.throws(()=>validateProfile({...DEMO_PROFILE,dob},new Date('2026-10-27T12:00:00Z')));
 assert.equal(validateProfile({...DEMO_PROFILE,dob:'2008-10-27'},new Date('2026-10-27T12:00:00Z')).dob,'2008-10-27');
 assert.throws(()=>validateProfile({...DEMO_PROFILE,dob:'2008-10-28'},new Date('2026-10-27T12:00:00Z')));
});
test('historical daylight time is respected, and clock gap/overlap are explicit',()=>{
 assert.equal(birthInstant({...DEMO_PROFILE,dob:'1992-05-15',time:'10:30'}).toISOString(),'1992-05-15T06:30:00.000Z');
 const p={...DEMO_PROFILE,birthZone:'America/New_York',dob:'2024-03-10',time:'02:30'};
 assert.throws(()=>birthInstant(p),/не существовало/);
 assert.throws(()=>birthInstant({...p,dob:'2024-11-03',time:'01:30'}),/повторялось/);
});
test('unknown birth time explicitly uses local noon and an approximate chart',()=>{
 const p={...DEMO_PROFILE,unknownTime:true,time:''};assert.equal(birthInstant(p).toISOString(),'1992-05-15T08:00:00.000Z');
 const chart=calculateChart(p,A);assert.equal(chart.approximate,true);assert.match(discovery(13,chart,p).fact,/Без времени нельзя/);
});
test('astronomical positions are date-dependent and include genuine constellations',()=>{
 const c=calculateChart(DEMO_PROFILE,A);assert.equal(c.bodies.length,10);for(const b of c.bodies){assert.ok(b.lon>=0&&b.lon<360);assert.ok(b.altitude>=-90&&b.altitude<=90);assert.ok(b.constellation);}
 assert.equal(c.bodies[0].sign,'Телец');
 const other=calculateChart({...DEMO_PROFILE,dob:'1992-11-15'},A);assert.ok(Math.abs(c.bodies[0].lon-other.bodies[0].lon)>100);
 const eclipse=calculateChart({...DEMO_PROFILE,dob:'2024-04-08',time:'18:21',birthZone:'UTC'},A);assert.ok(eclipse.phase<1||eclipse.phase>359);
});
test('all 30 discoveries are complete and preserve astronomical vs game distinction',()=>{
 const c=calculateChart(DEMO_PROFILE,A);
 for(let d=1;d<=30;d++){const x=discovery(d,c,DEMO_PROFILE);assert.ok(x.title&&x.fact&&x.interpretation&&x.body);assert.equal(x.special,[7,14,21,30].includes(d));}
 assert.match(discovery(1,c,DEMO_PROFILE).fact,/Астрономическое созвездие/);
});
test('one opening per local day; skipping never resets the accumulated route',()=>{
 const now=new Date('2026-10-27T12:00:00Z'),s=initialForProfile({...DEMO_PROFILE},now);
 assert.equal(openDay(s,'taken',now),1);assert.equal(canOpen(s,now),false);assert.throws(()=>openDay(s,'taken',now));
 assert.equal(openDay(s,'missed',new Date('2026-11-02T12:00:00Z')),2);assert.deepEqual(s.opened,[1,2]);
});
test('all honest check-in statuses unlock equally; pause only stops intake reminders',()=>{
 for(const status of ['taken','missed','paused','private']){const s=defaultState();assert.equal(openDay(s,status),1);assert.equal(s.opened.length,1);assert.equal(s.reminders.paused,status==='paused');}
});
test('the thirty-day journey ends exactly once, with no extra dose or auto-extension',()=>{
 const s=defaultState();for(let i=1;i<=30;i++)assert.equal(openDay(s,'private'),i);assert.equal(canOpen(s),false);assert.throws(()=>openDay(s,'private'));assert.equal(s.opened.length,30);
});
test('product schedule is one or two reminders independently from morning/evening',()=>{
 const m=initialForProfile({...DEMO_PROFILE,product:'magnesium'}),i=initialForProfile({...DEMO_PROFILE,product:'inositol'});
 assert.equal(m.reminders.times.length,2);assert.equal(i.reminders.times.length,1);assert.ok(m.reminders.morning&&m.reminders.evening);
});
test('motivation adapts to the chosen support style',()=>{
 assert.notEqual(motivation({...DEMO_PROFILE,style:'direct'},1,0),motivation({...DEMO_PROFILE,style:'gentle'},1,0));
});
test('local day uses the selected timezone across UTC midnight',()=>{
 assert.equal(localDay(new Date('2026-10-27T21:30:00Z'),'Europe/Samara'),'2026-10-28');
 assert.equal(localDay(new Date('2026-10-27T21:30:00Z'),'Europe/Moscow'),'2026-10-28');
});
test('saved progress round-trips, and malformed executable schedule text is rejected',()=>{
 const s=defaultState();openDay(s,'private');s.notes[1]='Моя заметка';s.practices[1]={date:'2026-10-27'};
 const out=parseSavedState(JSON.parse(JSON.stringify(s)));assert.deepEqual(out.opened,[1]);assert.equal(out.notes[1],'Моя заметка');
 const bad=JSON.parse(JSON.stringify(s));bad.reminders.times=['<img src=x onerror=alert(1)>','19:00'];assert.throws(()=>parseSavedState(bad));
 const bad2=JSON.parse(JSON.stringify(s));bad2.opened=[1,3];assert.throws(()=>parseSavedState(bad2));
});
test('all 120 planet/sign combinations have a resource, a shadow, a recommendation and an action',()=>{
 const readings=[];
 for(const body of BODIES)for(const sign of SIGNS){const r=planetReading({...body,sign});for(const key of ['title','intro','resource','shadow','recommendation','action'])assert.ok(r[key]?.length>10);readings.push(r.intro);}
 assert.equal(new Set(readings).size,120);
 const leo=planetReading({...BODIES[0],sign:'Лев'});assert.match(leo.title,/Солнце во Льве/);assert.match(leo.recommendation,/признания/);assert.ok(Object.values(leo).join(' ').split(/\s+/).length>200);
});
test('gratitudes need at least three non-empty entries to complete, and allow incomplete drafts',()=>{
 const s=defaultState(),now=new Date('2026-10-27T12:00:00Z');
 assert.throws(()=>saveGratitudes(s,1,['Спасибо за день','',''],true,now));
 saveGratitudes(s,1,['Спасибо за день','',''],false,now);assert.equal(s.gratitudes[1].completed,false);
 saveGratitudes(s,1,['За разговор','За помощь','Себе за маленький шаг'],true,now);assert.equal(s.gratitudes[1].completed,true);assert.equal(s.gratitudes[1].items.length,3);
 assert.deepEqual(parseSavedState(JSON.parse(JSON.stringify(s))).gratitudes,s.gratitudes);
 assert.equal(s.opened.length,0);assert.equal(Object.keys(s.practices).length,0);
});
test('old backups retain progress and gain an empty gratitude journal',()=>{
 const s=defaultState();openDay(s,'private');delete s.gratitudes;const migrated=parseSavedState(s);assert.deepEqual(migrated.opened,[1]);assert.deepEqual(migrated.gratitudes,{});
 const bad=defaultState();bad.gratitudes[1]={items:['one','two',''],date:'2026-10-27',completed:true};assert.throws(()=>parseSavedState(bad));
});
test('bot scenarios include independent morning motivation, intake and three evening gratitudes',()=>{
 const messages=dailyBotMessages(DEMO_PROFILE,4,3);assert.match(messages.morning.text,/ХилСорт/);assert.match(messages.morning.text,/дня 4/);assert.match(messages.evening.text,/три благодарности/);assert.match(messages.evening.text,/0 \/ 3/);assert.equal(messages.evening.buttons[0][0].text,'✍️ Написать благодарность');
 assert.notEqual(messages.intake.kind,messages.evening.kind);
});
