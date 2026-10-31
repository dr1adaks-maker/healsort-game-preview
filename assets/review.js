export const reviewEnabled=search=>new URLSearchParams(search).get('review')!=='0';
export const reviewStorageKey=(base,review)=>review?base+'-review':base;

// Review affects only the browser preview, never intake records or practice completion.
export function openReviewStep(state,day){
 if(!Number.isInteger(day)||day<1||day>30)throw Error('Выберите шаг от 1 до 30.');
 for(let n=state.opened.length+1;n<=day;n++)state.opened.push(n);
 return day;
}
