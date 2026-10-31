// Transport-independent dialogue. No token, network request, or unverified identity.
export const GRATITUDE_MINIMUM=3;
export const GRATITUDE_LIMIT=30;
export function createGratitudeSession({userId,date,items=[],completed=false}){
 if(typeof userId!=='string'||!userId||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Array.isArray(items)||items.length>GRATITUDE_LIMIT||items.some(x=>typeof x!=='string'||!x.trim()||x.length>500))throw Error('Некорректные данные дневника благодарностей.');
 return {userId,date,items:items.map(x=>x.trim()),completed:completed&&items.length>=3,awaiting:false,handledIds:[]};
}
const action=(s,name)=>`grat:${name}:${s.date.replaceAll('-','')}`;
function progress(s){return `${'●'.repeat(Math.min(s.items.length,3))}${'○'.repeat(Math.max(0,3-s.items.length))}  ${s.items.length} / 3`+(s.items.length>3?' · можно больше':'');}
export function gratitudeBotView(s,{list=false,note=''}={}){
 const n=s.items.length,rows=[];
 if(s.awaiting)return {title:'Вечер с Олионом',text:`Благодарность №${n+1}\n\nНапишите одним сообщением, за что вы хотите сказать спасибо сегодня. Это может быть человек, небольшой момент или ваш собственный шаг.\n\n${progress(s)}`,buttons:[[{text:'↩️ Вернуться к записям',action:action(s,'cancel')}]],awaiting:true};
 const intro=s.completed?'Ваш сегодняшний вечер сохранён. Спасибо за эти маленькие моменты.':'Давайте найдём как минимум три благодарности за сегодняшний день. Можно написать больше — по одной записи за раз.';
 if(n<GRATITUDE_LIMIT)rows.push([{text:n===0?'✍️ Написать благодарность':n<3?`✍️ Написать благодарность · ${n+1}/3`:'✨ Добавить ещё благодарность',action:action(s,'add')}]);
 if(n>=3&&!s.completed)rows.push([{text:'✅ Завершить вечер',action:action(s,'finish')}]);
 if(n)rows.push([{text:'📖 Мои благодарности за сегодня',action:action(s,'list')}]);
 if(!s.completed)rows.push([{text:'🌙 Вернуться позже',action:action(s,'later')}]);
 const records=list&&n?'\n\n'+s.items.map((t,i)=>`${i+1}. ${t}`).join('\n\n'):'';
 return {title:'Вечер с Олионом',text:`${intro}\n\n${progress(s)}${note?'\n\n'+note:''}${records}`,buttons:rows,awaiting:false};
}
export function gratitudeBotEvent(session,event,{userId,today}){
 if(userId!==session.userId)throw Error('Запись другого пользователя недоступна.');
 if(today!==session.date)return {session,view:{title:'Начался новый день',text:'Эти кнопки относятся к другому дню. Откройте сегодняшнее вечернее сообщение — сохранённые записи останутся в дневнике.',buttons:[],awaiting:false},changed:false};
 if(event.id&&session.handledIds.includes(event.id))return {session,view:gratitudeBotView(session),changed:false};
 const s=structuredClone(session);if(event.id)s.handledIds=[...s.handledIds,event.id].slice(-100);
 if(event.kind==='action'){
  const match=/^grat:(add|list|cancel|finish|later):(\d{8})$/.exec(event.action||'');
  if(!match||match[2]!==session.date.replaceAll('-',''))return {session,view:gratitudeBotView(session,{note:'Откройте актуальные кнопки за сегодняшний день.'}),changed:false};
  const cmd=match[1];
  if(cmd==='add'){if(s.items.length>=GRATITUDE_LIMIT)return {session:s,view:gratitudeBotView(s,{note:'Сегодня сохранено 30 записей. Все они останутся у вас.'}),changed:true};s.awaiting=true;}
  if(['list','cancel','later'].includes(cmd))s.awaiting=false;
  if(cmd==='finish'){if(s.items.length<3)return {session:s,view:gratitudeBotView(s,{note:`До трёх благодарностей осталось ${3-s.items.length}. Можно вернуться позже.`}),changed:true};s.completed=true;s.awaiting=false;}
  return {session:s,view:gratitudeBotView(s,{list:cmd==='list',note:cmd==='later'?'Вернётесь, когда будет удобно. Записи на месте.':''}),changed:true};
 }
 if(event.kind==='text'){
  if(!s.awaiting)return {session:s,view:gratitudeBotView(s,{note:'Чтобы добавить запись, нажмите «Написать благодарность».'}),changed:false};
  const value=String(event.text||'').trim();
  if(!value||value.length>500)return {session,view:{...gratitudeBotView(session),text:'Пожалуйста, напишите одну благодарность: от 1 до 500 символов.\n\n'+gratitudeBotView(session).text},changed:false};
  if(s.items.length>=GRATITUDE_LIMIT){s.awaiting=false;return {session:s,view:gratitudeBotView(s),changed:true};}
  s.items.push(value);s.awaiting=false;
  return {session:s,view:gratitudeBotView(s,{note:s.items.length<3?'Сохранено. Можно написать следующую.':s.items.length===3?'Три благодарности уже есть. Можно завершить вечер или добавить ещё.':'Ещё один хороший момент сохранён.'}),changed:true};
 }
 return {session,view:gratitudeBotView(session),changed:false};
}
export function telegramGratitudePayload(chatId,view){return {chat_id:chatId,text:view.text,reply_markup:{inline_keyboard:view.buttons.map(row=>row.map(b=>({text:b.text,callback_data:b.action})))}};}
export function maxGratitudePayload(view){return {text:view.text,attachments:[{type:'inline_keyboard',payload:{buttons:view.buttons.map(row=>row.map(b=>({type:'callback',text:b.text,payload:b.action})))}}]};}
