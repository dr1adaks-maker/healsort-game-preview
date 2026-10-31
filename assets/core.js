import {discoveryReading} from './interpretations.js';
import {createGratitudeSession,gratitudeBotView} from './gratitude-bot.js';
export const VERSION = 1;
export const SIGNS = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];
export const SIGN_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
export const BODIES = [
 ['Sun','Солнце','☉','Ваш внутренний свет','внимание к себе'],
 ['Moon','Луна','☽','Ваш тихий ритм','бережное восстановление'],
 ['Mercury','Меркурий','☿','Голос ваших мыслей','ясное общение'],
 ['Venus','Венера','♀','То, что вам дорого','личные ценности'],
 ['Mars','Марс','♂','Ваш первый шаг','посильное действие'],
 ['Jupiter','Юпитер','♃','Место для нового','любопытство'],
 ['Saturn','Сатурн','♄','Ваша опора','устойчивый ритм'],
 ['Uranus','Уран','♅','Свобода быть собой','новый взгляд'],
 ['Neptune','Нептун','♆','Пространство воображения','вдохновение'],
 ['Pluto','Плутон','♇','Сила маленьких перемен','готовность менять привычное']
].map(([id,name,symbol,title,theme])=>({id,name,symbol,title,theme}));
export const CITIES = [
 {name:'Москва',zone:'Europe/Moscow',lat:55.756,lon:37.618},
 {name:'Самара',zone:'Europe/Samara',lat:53.195,lon:50.101},
 {name:'Тольятти',zone:'Europe/Samara',lat:53.508,lon:49.419},
 {name:'Ягодное, Самарская область',zone:'Europe/Samara',lat:53.617,lon:49.363},
 {name:'Санкт-Петербург',zone:'Europe/Moscow',lat:59.939,lon:30.315},
 {name:'Кокшетау (Кокчетав)',zone:'Asia/Almaty',lat:53.283,lon:69.383},
 {name:'Астана',zone:'Asia/Almaty',lat:51.169,lon:71.449},
 {name:'Алматы',zone:'Asia/Almaty',lat:43.239,lon:76.89},
 {name:'Лесосибирск',zone:'Asia/Krasnoyarsk',lat:58.221,lon:92.503},
 {name:'Красноярск',zone:'Asia/Krasnoyarsk',lat:56.015,lon:92.893},
 {name:'Краснодар',zone:'Europe/Moscow',lat:45.035,lon:38.975},
 {name:'Курск',zone:'Europe/Moscow',lat:51.737,lon:36.187},
 {name:'Сочи',zone:'Europe/Moscow',lat:43.585,lon:39.724},
 {name:'Казань',zone:'Europe/Moscow',lat:55.796,lon:49.108},
 {name:'Екатеринбург',zone:'Asia/Yekaterinburg',lat:56.839,lon:60.606},
 {name:'Новосибирск',zone:'Asia/Novosibirsk',lat:55.008,lon:82.935},
 {name:'Иркутск',zone:'Asia/Irkutsk',lat:52.287,lon:104.281},
 {name:'Владивосток',zone:'Asia/Vladivostok',lat:43.116,lon:131.882},
 {name:'Калининград',zone:'Europe/Kaliningrad',lat:54.711,lon:20.51},
 {name:'Минск',zone:'Europe/Minsk',lat:53.9,lon:27.566}
];
export const DEMO_PROFILE = {name:'Путешественник',dob:'1992-05-15',time:'10:30',unknownTime:false,city:'Москва',birthZone:'Europe/Moscow',lat:55.756,lon:37.618,zone:'Europe/Samara',style:'gentle',focus:'rhythm',product:'magnesium'};
export function localDay(now=new Date(),zone='Europe/Samara') {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;
}
export function validZone(zone){try{new Intl.DateTimeFormat('en',{timeZone:zone}).format();return true;}catch{return false;}}
function timeParts(ms,zone){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ms)).map(x=>[x.type,x.value]));}
export function birthInstant(p){
 const time=p.unknownTime?'12:00':p.time;
 const target=Date.parse(`${p.dob}T${time}:00Z`);
 if(!Number.isFinite(target)||!validZone(p.birthZone))throw Error('Проверьте дату, время и часовой пояс рождения.');
 const offsets=new Set();
 for(let h=-48;h<=48;h+=6){const t=target+h*3600000,q=timeParts(t,p.birthZone);offsets.add(Date.parse(`${q.year}-${q.month}-${q.day}T${q.hour}:${q.minute}:00Z`)-t);}
 const matches=[...offsets].map(o=>target-o).filter(t=>{const q=timeParts(t,p.birthZone);return `${q.year}-${q.month}-${q.day}T${q.hour}:${q.minute}`===`${p.dob}T${time}`;});
 if(matches.length===0)throw Error('В это время переводили часы: такого местного времени не существовало. Уточните время рождения.');
 if(matches.length>1)throw Error('При переводе часов это время повторялось дважды. Выберите точный UTC-пояс рождения в ручных настройках.');
 return new Date(matches[0]);
}
export function validateProfile(p,now=new Date()){
 if(!p.name?.trim()||p.name.length>40)throw Error('Укажите имя или псевдоним, до 40 символов.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.dob||''))throw Error('Укажите полную дату рождения.');
 const d=new Date(p.dob+'T12:00:00Z');
 if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==p.dob||p.dob<'1900-01-01'||p.dob>localDay(now,p.zone))throw Error('Проверьте дату рождения.');
 const today=localDay(now,p.zone),age=+today.slice(0,4)-+p.dob.slice(0,4)-(today.slice(5)<p.dob.slice(5)?1:0);
 if(age<18)throw Error('Это приключение предназначено для взрослых от 18 лет.');
 if(!p.unknownTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time||''))throw Error('Укажите время рождения или отметьте «Не знаю время».');
 if(!p.city?.trim()||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)throw Error('Выберите город или укажите его координаты.');
 if(!validZone(p.zone)||!validZone(p.birthZone))throw Error('Укажите действующий часовой пояс.');
 birthInstant(p);return p;
}
export function defaultState(){return {version:VERSION,mode:'demo',profile:{...DEMO_PROFILE},opened:[],practices:{},notes:{},checkins:{},reflections:{},gratitudes:{},gratitudeDays:{},lastOpenDate:null,reminders:{enabled:true,paused:false,times:['09:00','19:00'],morning:'08:30',evening:'20:30'},demoDay:1};}
export function nextDay(s){return Math.min(30,s.opened.length+1);}
export function canOpen(s,now=new Date(),{review=false}={}){return s.opened.length<30&&(review||s.mode==='demo'||s.lastOpenDate!==localDay(now,s.profile.zone));}
export function openDay(s,status,now=new Date(),options={}){
 if(!['taken','missed','paused','private'].includes(status))throw Error('Выберите, как отметить день.');
 if(!canOpen(s,now,options))throw Error(s.opened.length>=30?'Атлас уже собран.':'Следующее открытие будет доступно завтра.');
 const n=nextDay(s),date=localDay(now,s.profile.zone);
 s.opened.push(n);s.checkins[n]={status,date};s.lastOpenDate=date;
 if(status==='paused')s.reminders.paused=true;
 return n;
}
export function signFor(lon){return SIGNS[Math.floor(((lon%360)+360)%360/30)];}
export function degreeText(lon){const n=((lon%360)+360)%360;const deg=n%30;return `${Math.floor(deg)}° ${String(Math.floor((deg%1)*60)).padStart(2,'0')}′`;}
const CONST_RU={Ari:'Овен',Tau:'Телец',Gem:'Близнецы',Cnc:'Рак',Leo:'Лев',Vir:'Дева',Lib:'Весы',Sco:'Скорпион',Sgr:'Стрелец',Cap:'Козерог',Aqr:'Водолей',Psc:'Рыбы',Oph:'Змееносец',Cet:'Кит',Ori:'Орион',UMa:'Большая Медведица',UMi:'Малая Медведица',Cas:'Кассиопея',And:'Андромеда',Per:'Персей',Cyg:'Лебедь',Lyr:'Лира',Aql:'Орёл',Peg:'Пегас',Dra:'Дракон',Her:'Геркулес',Boo:'Волопас',Aur:'Возничий'};
export function calculateChart(p,A){
 const instant=birthInstant(p),observer=new A.Observer(p.lat,p.lon,0);
 const bodies=BODIES.map(b=>{
  const v=A.GeoVector(b.id,instant,true),e=A.Ecliptic(v),eq=A.EquatorFromVector(v),c=A.Constellation(eq.ra,eq.dec);
  const top=A.Equator(b.id,instant,observer,true,true),h=A.Horizon(instant,observer,top.ra,top.dec);
  return {...b,lon:e.elon,lat:e.elat,ra:eq.ra,dec:eq.dec,sign:signFor(e.elon),degree:degreeText(e.elon),constellation:CONST_RU[c.symbol]||c.name,azimuth:h.azimuth,altitude:h.altitude};
 });
 return {instant:instant.toISOString(),bodies,phase:A.MoonPhase(instant),approximate:p.unknownTime};
}
const signThemes=['смелость начинать','свой устойчивый ритм','любопытство и обмен идеями','заботу и чувство опоры','право проявляться','внимание к деталям','равновесие в общении','глубину внимания','интерес к новому','последовательность','свободу своего взгляда','пространство для воображения'];
export const SPECIAL={7:{name:'Первый свет',text:'Вы уже нашли первые точки опоры. Они остаются с вами.'},14:{name:'Личная орбита',text:'Ваша карта становится яснее. Отметьте то, что подходит именно вам.'},21:{name:'Созвездие привычки',text:'Продолжение складывается из возвращений, а не из идеальных дней.'},30:{name:'Ваш звёздный атлас',text:'Все открытия собраны. Ваш опыт и ваши выводы принадлежат вам.'}};
const DAY_PLAN=[
 ['body','Sun'],['body','Moon'],['body','Mercury'],['body','Venus'],['body','Mars'],['body','Jupiter'],['special','Sun'],
 ['body','Saturn'],['body','Uranus'],['body','Neptune'],['body','Pluto'],['phase','Moon'],['horizon','Sun'],['special','Moon'],
 ['pair','Sun','Moon'],['pair','Mercury','Venus'],['pair','Mars','Saturn'],['pair','Moon','Venus'],['pair','Sun','Jupiter'],['pair','Mercury','Saturn'],['special','Saturn'],
 ['pair','Venus','Mars'],['pair','Moon','Jupiter'],['pair','Sun','Saturn'],['pair','Mercury','Uranus'],['pair','Venus','Neptune'],['pair','Mars','Jupiter'],['pair','Moon','Saturn'],['pair','Sun','Pluto'],['special','Sun']
];
export function discovery(day,chart,p){
 const [type,id,other]=DAY_PLAN[day-1],b=chart.bodies.find(x=>x.id===id),c=chart.bodies.find(x=>x.id===other);
 let title=b.title,fact,interpretation,eyebrow='В момент вашего рождения';
 const theme=signThemes[SIGNS.indexOf(b.sign)],approx=chart.approximate?'При расчёте на 12:00 местного времени ':'';
 if(type==='body'){
  title=`${b.name} · ${b.title.toLowerCase()}`;
  const was=b.id==='Sun'?'находилось':['Moon','Venus'].includes(b.id)?'находилась':'находился';
  fact=`${approx}${b.name} ${was} на долготе ${b.lon.toFixed(2)}°: ${b.sign}, ${b.degree}. Астрономическое созвездие — ${b.constellation}.`;
  interpretation=`В игровом языке ${b.name} связано с темой «${b.theme}», а знак ${b.sign} предлагает исследовать ${theme}. Проверьте, откликается ли вам эта подсказка.`;
 }else if(type==='pair'){
  const angle=Math.abs(((c.lon-b.lon+540)%360)-180);
  title=`${b.name} и ${c.name}`;
  const near=[[0,'соединение'],[60,'секстиль'],[90,'квадратура'],[120,'тригон'],[180,'оппозиция']].sort((x,y)=>Math.abs(x[0]-angle)-Math.abs(y[0]-angle))[0];
  fact=`${approx}угол между ${b.name} и ${c.name} по эклиптической долготе — ${angle.toFixed(1)}°.`+(Math.abs(near[0]-angle)<=6?` В игровой астрологической системе это ${near[1]} (допуск 6°).`:' Близкого основного аспекта в пределах 6° нет.');
  interpretation=`Сегодня соединяем две темы: ${b.theme} и ${c.theme}. В какой небольшой ситуации вы можете дать место обеим? Угол между планетами не определяет ваш характер.`;
 }else if(type==='phase'){
  title='Луна · ваш ритм перемен';const ph=chart.phase,illum=(1-Math.cos(ph*Math.PI/180))/2*100;
  const phaseName=ph<22.5||ph>=337.5?'около новолуния':ph<67.5?'растущий серп':ph<112.5?'около первой четверти':ph<157.5?'растущая Луна':ph<202.5?'около полнолуния':ph<247.5?'убывающая Луна':ph<292.5?'около последней четверти':'убывающий серп';
  fact=`${approx}фаза Луны — ${phaseName}, освещено примерно ${Math.round(illum)}% её видимого диска.`;
  interpretation='Используйте лунный цикл как образ: иногда хочется начинать, иногда — завершать или отдыхать. Какой темп подходит вам сегодня?';
 }else if(type==='horizon'){
  title='Ваша точка на Земле';fact=p.unknownTime?`Место рождения: ${p.city}. Без времени нельзя достоверно восстановить положение неба относительно горизонта.`:`В точке ${p.city} Солнце было ${b.altitude>=0?'над':'под'} горизонтом: высота ${b.altitude.toFixed(1)}°. Это расчёт без атмосферной рефракции.`;
  interpretation='Место рождения — часть вашей истории. А сегодняшнюю точку опоры вы можете выбрать сами: действие, человек или знакомый ритуал.';
 }else{
  title=SPECIAL[day].name;eyebrow='Особое открытие';
  const n=chart.bodies.filter(x=>x.sign===b.sign).length;
  fact=day===30?`Ваша карта построена для ${p.dob.split('-').reverse().join('.')} ${p.unknownTime?'(время неизвестно)':p.time}, ${p.city}. На ней 10 небесных тел и 30 карточек открытий.`:`${approx}${b.name}: ${b.sign}, ${b.degree}. В этом же зодиакальном секторе находилось ${n} из 10 рассчитанных небесных тел.`;
  interpretation=SPECIAL[day].text;
 }
 const reading=discoveryReading({type,body:b,other:c,day,interpretation});
 return {day,type,body:b,other:c,title:type==='body'?reading.title:title,fact,interpretation:reading.intro,reading,eyebrow,special:!!SPECIAL[day],approximate:chart.approximate};
}
export function motivation(p,day,completed){
 const sets={gentle:['Сегодня достаточно одного маленького шага. Олион рядом.','Можно двигаться бережно и всё равно двигаться вперёд.','Не нужно успеть всё. Оставьте немного внимания себе.','Возвращаться к себе можно в любом темпе.','Ваш путь не требует идеального дня.'],direct:['Выберите один посильный шаг. Выполните. Отметьте результат.','Сегодня — одна практика и одно наблюдение о себе.','Небольшое действие ценнее большого обещания.','Упростите то, что мешает продолжить.','Сохранённый прогресс — ваша опора для следующего шага.'],challenge:['Сегодняшний вызов: сделать маленькое действие без ожидания идеального момента.','Проверьте свою привычку одним новым способом.','Сможете выделить себе три спокойные минуты?','Попробуйте заметить то, что обычно пропускаете.','Дайте новому шагу шанс. Без соревнования с другими.']};
 const birthDay=Number(p.dob?.slice(-2))||1;
 const base=(sets[p.style]||sets.gentle)[(day+birthDay-2)%5];
 const focus={rhythm:'Выберите темп, который можно повторить завтра.',self:'Заметьте, что откликается именно вам.',focus:'Сегодня достаточно одного завершённого действия.'};
 const suffix=day%3===1?' '+(focus[p.focus]||focus.self):'';
 return completed>0&&day%7===0?`За вами уже ${completed} открытий. ${base}`:base+suffix;
}
export function shortPractice(day,track){
 const a=track?.action||'выбрать один посильный шаг';
 const goal=track?.goal||'сохранить внимание к себе';
 const steps=[
 ['Выберите свою точку опоры',`Назовите одну небольшую ситуацию, в которой вам хочется ${goal}. Запишите одно предложение о желаемом изменении.`],
 ['Найдите один пример','Вспомните один недавний эпизод: что произошло, что вы сделали, что получилось. Без оценки себя.'],
 ['Заметьте первый сигнал','Закончите фразу: «Когда происходит ___, я обычно ___». Выберите только один повторяющийся момент.'],
 ['Поймайте мысль','Запишите первую мысль в знакомой ситуации. Рядом — одно другое, нейтральное объяснение.'],
 ['Проверьте пользу','Что привычная реакция даёт сразу? А что усложняет потом? Достаточно двух коротких фраз.'],
 ['Посмотрите иначе','Предложите одно доброжелательное объяснение ситуации от лица другого человека. Не угадывайте его мысли.'],
 ['Соберите первую неделю','Посмотрите свои заметки. Что вы уже заметили? Выберите один небольшой шаг на следующую неделю.'],
 ['Отделите факт от догадки','Запишите один наблюдаемый факт и отдельно свою интерпретацию. Как ещё можно объяснить этот факт?'],
 ['Назовите потребность','Закончите: «В этой ситуации мне важно ___». Выберите то, что действительно откликается вам.'],
 ['Сделайте паузу','В безопасной повседневной ситуации дайте себе 10 секунд перед привычным ответом. Заметьте, что изменилось.'],
 ['Попробуйте новый шаг',`Выберите маленькую попытку: ${a}. Выполните её в простой ситуации или мысленно отрепетируйте.`],
 ['Скажите яснее','Составьте короткую просьбу: «Когда ___, мне важно ___. Прошу ___». Оставьте другому право отказаться.'],
 ['Оставьте место границе','Выберите одну спокойную фразу: «Я готов(а) на ___, но сейчас не готов(а) на ___». Можно просто отрепетировать.'],
 ['Заметьте изменение','Сравните одну сегодняшнюю ситуацию с началом пути. Что стало чуть яснее? Если изменений нет — это тоже наблюдение.'],
 ['Привяжите к знакомому','Закончите: «После ___ я уделю две минуты ___». Выберите уже существующий ежедневный ритуал.'],
 ['Перенесите в дело',`Сделайте один небольшой шаг к цели «${goal}» в обычной задаче. Определите, как поймёте, что шаг завершён.`],
 ['Проверьте в общении','В одном спокойном разговоре задайте прямой вопрос вместо предположения. Или запишите вопрос для будущего разговора.'],
 ['Верните себе ресурс','Выберите короткую обычную паузу: тишину, перерыв или прогулку по возможности. Заметьте, что вам подходит.'],
 ['Сделайте полезный вклад','Предложите маленькую помощь по запросу или завершите полезный фрагмент собственного дела.'],
 ['Продолжите без оценки','Сделайте ещё один маленький шаг, даже если вчера не было похвалы. Что в этом шаге важно лично вам?'],
 ['Оглядитесь на путь','Назовите одно реальное изменение, одну трудность и одну опору. Не нужно искать обязательное улучшение.'],
 ['Подготовьте спокойный ответ','Выберите привычную небольшую сложность. Заранее придумайте короткую паузу и новый ответ. Не создавайте конфликт специально.'],
 ['Разрешите исправление','Закончите: «Если я собьюсь, я могу ___». Выберите действие восстановления без самонаказания.'],
 ['Упростите окружение','Уберите одну небольшую помеху: лишнее уведомление, неудобную настройку или предмет на рабочем месте.'],
 ['Попросите посильную поддержку','Сформулируйте одну конкретную просьбу с правом отказать. Если просить некого — запланируйте короткую самопроверку.'],
 ['Измерьте один шаг','Выберите простой показатель своего действия: одна ясная просьба, один завершённый фрагмент или минута паузы. Проверьте результат.'],
 ['Оставьте выполнимое',`Выберите короткий способ продолжать: ${a}. Когда ему найдётся место в обычной неделе?`],
 ['Придумайте возвращение','Запишите один признак, что вы выпали из ритма, и один шаг возвращения. Начинать всё заново не нужно.'],
 ['Выберите, где пригодится','В какой сфере хотите сохранить освоенный шаг: в общении, делах, отдыхе или заботе о себе? Выберите одну.'],
 ['Сохраните своё открытие','Перечитайте заметки. Назовите то, что хотите оставить с собой, и один вопрос, который пока остаётся открытым.']
 ];return {title:steps[day-1][0],text:steps[day-1][1],minutes:'2–5 минут'};
}
export function initialForProfile(profile,now=new Date()){
 validateProfile(profile,now);const s=defaultState();s.mode='personal';s.profile=profile;s.demoDay=1;
 s.reminders.times=profile.product==='magnesium'?['09:00','19:00']:['09:00'];return s;
}
export const GRATITUDE_PROMPTS=['Первый маленький момент, за который хочется сказать спасибо','Ещё один человек, поступок или момент этого дня','За что вы хотите поблагодарить себя'];
export function saveGratitudes(state,day,items,complete=true,now=new Date()){
 if(!Number.isInteger(day)||day<1||day>30||!Array.isArray(items)||items.length<3||items.length>30||items.some(x=>typeof x!=='string'||x.length>500))throw Error('Нужно минимум три короткие записи, каждая до 500 символов.');
 const clean=items.map(x=>x.trim());if(complete&&clean.filter(Boolean).length<3)throw Error('Добавьте минимум три благодарности или сохраните черновик.');
 state.gratitudes[day]={items:clean,date:localDay(now,state.profile.zone),completed:complete&&clean.filter(Boolean).length>=3};
 return state.gratitudes[day];
}
export function dailyBotMessages(profile,day,openedCount=0,now=new Date()){
 const evening=gratitudeBotView(createGratitudeSession({userId:'message-template',date:localDay(now,profile.zone)}));
 return {
  morning:{kind:'morning',text:`Доброе утро! Это Олион, ХилСорт.\n\n${motivation(profile,day,openedCount)}\n\nВ вашей карте ждёт открытие дня ${day} и одна короткая практика.`,action:'Открыть мою карту'},
  intake:{kind:'intake',text:'ХилСорт · напоминание по вашему режиму приёма. Следуйте маркировке и рекомендациям специалиста. Можно честно отметить приём, пропуск или паузу — прогресс приключения сохранится.',action:'Отметить день'},
  evening:{kind:'evening',...evening,text:'Добрый вечер! Это Олион, ХилСорт.\n\n'+evening.text,action:'Написать благодарность'}
 };
}
export function parseSavedState(raw,now=new Date()){
 const bad=()=>{throw Error('Файл прогресса повреждён или имеет неподдерживаемый формат.');};
 if(!raw||raw.version!==1||!['demo','personal'].includes(raw.mode))bad();
 const p=raw.profile;validateProfile(p,now);
 if(!['gentle','direct','challenge'].includes(p.style)||!['rhythm','self','focus'].includes(p.focus)||!['magnesium','inositol'].includes(p.product)||typeof p.unknownTime!=='boolean')bad();
 if(!Array.isArray(raw.opened)||raw.opened.length>30||!raw.opened.every((n,i)=>n===i+1))bad();
 const r=raw.reminders,time=t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
 if(!r||!Array.isArray(r.times)||r.times.length!==(p.product==='magnesium'?2:1)||!r.times.every(time)||new Set(r.times).size!==r.times.length||!time(r.morning)||!time(r.evening)||typeof r.enabled!=='boolean'||typeof r.paused!=='boolean')bad();
 const day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'));
 if(raw.lastOpenDate!==null&&!day(raw.lastOpenDate))bad();
 const s=defaultState();s.mode=raw.mode;s.profile=Object.fromEntries(['name','dob','time','unknownTime','city','birthZone','lat','lon','zone','style','focus','product'].map(k=>[k,p[k]]));s.opened=[...raw.opened];s.lastOpenDate=raw.lastOpenDate;s.demoDay=Number.isInteger(raw.demoDay)?Math.max(1,Math.min(30,raw.opened.length+1,raw.demoDay)):Math.min(30,raw.opened.length+1);s.reminders={enabled:r.enabled,paused:r.paused,morning:r.morning,evening:r.evening,times:[...r.times]};
 const record=v=>v&&typeof v==='object'&&!Array.isArray(v),key=k=>/^(?:[1-9]|[12]\d|30)$/.test(k);
 for(const field of ['notes','practices','checkins','reflections'])if(!record(raw[field]))bad();
 for(const [k,v]of Object.entries(raw.notes)){if(!key(k)||typeof v!=='string'||v.length>3000)bad();s.notes[k]=v;}
 for(const [k,v]of Object.entries(raw.practices)){if(!key(k)||!record(v)||!day(v.date))bad();s.practices[k]={date:v.date};}
 for(const [k,v]of Object.entries(raw.checkins)){if(!key(k)||!record(v)||!day(v.date)||!['taken','missed','paused','private'].includes(v.status))bad();s.checkins[k]={date:v.date,status:v.status};}
 for(const [k,v]of Object.entries(raw.reflections)){if(/^resonance(?:[1-9]|[12]\d|30)$/.test(k)&&['yes','some','no'].includes(v))s.reflections[k]=v;else if(/^evening(?:[1-9]|[12]\d|30)$/.test(k)&&typeof v==='string'&&v.length<=2000)s.reflections[k]=v;else bad();}
 if(raw.gratitudes!==undefined){if(!record(raw.gratitudes))bad();for(const [k,v]of Object.entries(raw.gratitudes)){if(!key(k)||!record(v)||!day(v.date)||typeof v.completed!=='boolean'||!Array.isArray(v.items)||v.items.length<3||v.items.length>30||v.items.some(x=>typeof x!=='string'||x.length>500)||(v.completed&&v.items.filter(x=>x.trim()).length<3))bad();s.gratitudes[k]={items:v.items.map(x=>x.trim()),date:v.date,completed:v.completed};}}
 if(raw.gratitudeDays!==undefined){if(!record(raw.gratitudeDays))bad();for(const [k,v]of Object.entries(raw.gratitudeDays)){if(!day(k)||!record(v)||typeof v.completed!=='boolean'||!Array.isArray(v.items)||v.items.length>30||v.items.some(x=>typeof x!=='string'||!x.trim()||x.length>500)||(v.completed&&v.items.length<3))bad();s.gratitudeDays[k]={items:v.items.map(x=>x.trim()),completed:v.completed};}}
 if(record(raw.seenNotices)){s.seenNotices={};for(const [k,v]of Object.entries(raw.seenNotices).slice(-600))if(/^\d{4}-\d{2}-\d{2}:(morning|evening|intake):\d{2}:\d{2}$/.test(k)&&v===true)s.seenNotices[k]=true;}
 return s;
}
