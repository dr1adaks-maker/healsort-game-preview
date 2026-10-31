// The shared app has no bot tokens and never treats unsigned client data as identity.
// Actual messenger delivery and identity validation belong to the Russian backend.
export const host={name:'Браузер',app:null,verified:false};
export async function initBridge(){
 const p=new URLSearchParams(location.hash.slice(1));
 const tg=p.has('tgWebAppData')||new URLSearchParams(location.search).get('host')==='telegram';
 const max=p.has('WebAppData')||p.has('webAppData')||new URLSearchParams(location.search).get('host')==='max';
 if(!tg&&!max)return host;
 const url=tg?'https://telegram.org/js/telegram-web-app.js':'https://st.max.ru/js/max-web-app.js';
 await new Promise(resolve=>{const s=document.createElement('script');s.src=url;s.async=true;s.onload=resolve;s.onerror=resolve;document.head.append(s);setTimeout(resolve,2500);});
 const app=tg?window.Telegram?.WebApp:window.WebApp;
 if(app){host.name=tg?'Telegram':'MAX';host.app=app;try{app.ready?.();app.expand?.();}catch{}}
 return host;
}
export function haptic(type='light'){try{host.app?.HapticFeedback?.impactOccurred?.(type);}catch{}}
