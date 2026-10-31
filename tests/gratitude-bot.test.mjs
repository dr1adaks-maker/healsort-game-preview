import test from 'node:test';
import assert from 'node:assert/strict';
import {createGratitudeSession,gratitudeBotView,gratitudeBotEvent,telegramGratitudePayload,maxGratitudePayload} from '../assets/gratitude-bot.js';
import {layoutBodies} from '../assets/atlas-export.js';
const who={userId:'test-user',today:'2026-10-28'};
const fresh=()=>createGratitudeSession({userId:who.userId,date:who.today});
function act(s,cmd,id=crypto.randomUUID()){return gratitudeBotEvent(s,{kind:'action',action:`grat:${cmd}:20261028`,id},who);}
test('one button starts one free-text entry; finish is offered only at the minimum of three',()=>{
 let s=fresh();assert.equal(gratitudeBotView(s).buttons[0][0].text,'✍️ Написать благодарность');
 for(let i=1;i<=3;i++){s=act(s,'add').session;assert.equal(s.awaiting,true);s=gratitudeBotEvent(s,{kind:'text',text:`Спасибо за момент ${i}`,id:`text:${i}`},who).session;assert.equal(s.items.length,i);assert.equal(s.awaiting,false);const actions=gratitudeBotView(s).buttons.flat().map(x=>x.action);assert.equal(actions.some(x=>x.includes(':finish:')),i>=3);}
 assert.equal(s.completed,false);s=act(s,'finish').session;assert.equal(s.completed,true);
});
test('fourth gratitude is allowed and a repeated webhook cannot append it twice',()=>{
 let s=createGratitudeSession({userId:who.userId,date:who.today,items:['Один','Два','Три']});
 s=act(s,'add').session;const e={kind:'text',text:'Четвёртый момент',id:'stable-platform-message-id'};
 s=gratitudeBotEvent(s,e,who).session;assert.equal(s.items.length,4);s=gratitudeBotEvent(s,e,who).session;assert.equal(s.items.length,4);
});
test('finish before three, cancel and later preserve existing entries',()=>{
 let s=createGratitudeSession({userId:who.userId,date:who.today,items:['Спасибо себе']});s=act(s,'finish').session;assert.equal(s.completed,false);assert.equal(s.items.length,1);
 s=act(s,'add').session;s=act(s,'cancel').session;assert.equal(s.awaiting,false);assert.equal(s.items.length,1);s=act(s,'later').session;assert.equal(s.items.length,1);
});
test('only today and the owning user can add gratitude; old buttons do not change the journal',()=>{
 const s=fresh();assert.throws(()=>gratitudeBotEvent(s,{kind:'action',action:'grat:add:20261028'},{...who,userId:'other-user'}));
 const old=gratitudeBotEvent(s,{kind:'action',action:'grat:add:20261027',id:'old'},who);assert.equal(old.changed,false);assert.equal(old.session.items.length,0);
 const newDay=gratitudeBotEvent(s,{kind:'text',text:'Запись',id:'x'},{...who,today:'2026-10-29'});assert.equal(newDay.changed,false);
});
test('Telegram and MAX keyboards use their respective native callback fields',()=>{
 const view=gratitudeBotView(fresh()),tg=telegramGratitudePayload(123,view),max=maxGratitudePayload(view);
 assert.equal(tg.reply_markup.inline_keyboard[0][0].callback_data,'grat:add:20261028');assert.ok(Buffer.byteLength(tg.reply_markup.inline_keyboard[0][0].callback_data)<=64);
 assert.equal(max.attachments[0].type,'inline_keyboard');assert.equal(max.attachments[0].payload.buttons[0][0].type,'callback');assert.equal(max.attachments[0].payload.buttons[0][0].payload,'grat:add:20261028');
});
test('atlas displaces close display discs without changing the calculated coordinates',()=>{
 const bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'].map((id,i)=>({id,azimuth:95+i*.2,altitude:20+i*.2}));
 const layout=layoutBodies(bodies);assert.equal(layout.length,10);assert.equal(layout[0].exact.x,layoutBodies(bodies)[0].exact.x);assert.ok(layout.some(b=>Math.hypot(b.exact.x-b.x,b.exact.y-b.y)>20));
 for(let i=0;i<layout.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(layout[i].x-layout[j].x,layout[i].y-layout[j].y)>layout[i].radius+layout[j].radius);
});
