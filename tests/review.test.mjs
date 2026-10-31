import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_PROFILE,initialForProfile,openDay,canOpen,parseSavedState} from '../assets/core.js';
import {reviewEnabled,reviewStorageKey,openReviewStep} from '../assets/review.js';

const now=new Date('2026-10-31T10:00:00Z');
test('personal review can visit all 30 steps in one instant and stops at the final step',()=>{
 const s=initialForProfile({...DEMO_PROFILE},now);
 for(let day=1;day<=30;day++)assert.equal(openDay(s,'private',now,{review:true}),day);
 assert.equal(canOpen(s,now,{review:true}),false);
 assert.throws(()=>openDay(s,'private',now,{review:true}),/уже собран/);
 assert.equal(parseSavedState(JSON.parse(JSON.stringify(s))).opened.length,30);
});
test('ordinary personal mode still enforces one opening per local day',()=>{
 const s=initialForProfile({...DEMO_PROFILE},now);
 openDay(s,'private',now);
 assert.equal(canOpen(s,now),false);
 assert.throws(()=>openDay(s,'private',now),/завтра/);
});
test('review navigation opens arbitrary steps without fabricating intake, practice or dates',()=>{
 const normal=initialForProfile({...DEMO_PROFILE},now);
 openDay(normal,'missed',now);normal.notes[1]='existing note';
 const before=JSON.stringify(normal),review=parseSavedState(JSON.parse(before));
 openReviewStep(review,30);openReviewStep(review,7);
 assert.deepEqual(review.opened,Array.from({length:30},(_,i)=>i+1));
 for(const field of ['checkins','practices','lastOpenDate','notes'])assert.deepEqual(review[field],normal[field]);
 assert.equal(JSON.stringify(normal),before);
 assert.throws(()=>openReviewStep(review,31));
 assert.throws(()=>openReviewStep(review,1.5));
 assert.equal(parseSavedState(JSON.parse(JSON.stringify(review))).opened.length,30);
});
test('review is opt-in and uses separate browser storage',()=>{
 assert.equal(reviewEnabled('?review=1'),true);
 assert.equal(reviewEnabled(''),true);assert.equal(reviewEnabled('?review=0'),false);
 assert.notEqual(reviewStorageKey('atlas',true),reviewStorageKey('atlas',false));
});
