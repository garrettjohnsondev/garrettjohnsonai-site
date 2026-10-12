import {accountInfo,onAccountChange,callAccountFunction} from './account-runtime.js';
import {lessons} from './data.js';
import {state} from './state.js';
import {memberAccess} from './member-access.js';

export const memberInfo={configured:null,mode:'test',access:false,status:'free',hasCustomer:false,price:null,loading:false,error:'',busy:false,lesson:null,loadingLesson:null,lessonError:''};
const listeners=new Set();
export const onMembershipChange=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
const emit=()=>{for(const fn of listeners) fn();};
let accountId=null,generation=0,lessonGeneration=0,lessonKey='',refreshing;
const publicFields=new Set(['title','short','track','duration','kind','intro']);
// Studio lessons render in the browser from a protected pack. Their progress
// changes locally, so it must not trigger a reload that blanks the workspace.
const studioLessons=new Set(['handoff']);
function clearLessons(){
  lessonGeneration++;lessonKey='';memberInfo.lesson=null;memberInfo.loadingLesson=null;
  for(const l of Object.values(lessons)) if(l.track!=='foundations') for(const k of Object.keys(l)) if(!publicFields.has(k)) delete l[k];
}
function reset(){generation++;refreshing=null;clearLessons();Object.assign(memberAccess,{allowed:false,until:null});Object.assign(memberInfo,{configured:null,access:false,status:'free',hasCustomer:false,price:null,loading:false,error:'',busy:false,lessonError:''});}
export async function refreshMembership(){
  if(!accountInfo.user) return;
  if(refreshing) return refreshing;
  const mine=generation;memberInfo.loading=true;memberInfo.error='';emit();
  refreshing=(async()=>{
    try{
      const result=await callAccountFunction('learning-billing',{action:'status'});
      if(mine!==generation)return;
      Object.assign(memberInfo,result);
      Object.assign(memberAccess,{allowed:result.access===true,until:result.periodEnd});
      if(!result.access)clearLessons();
    }catch(error){if(mine!==generation)return;memberInfo.error=error.message;memberInfo.access=false;memberAccess.allowed=false;clearLessons();}
    finally{if(mine===generation){memberInfo.loading=false;refreshing=null;emit();}}
  })();
  return refreshing;
}
export async function ensureMemberLesson(id){
  if(!accountInfo.user||!lessons[id]||lessons[id].track==='foundations'||!memberInfo.access) return;
  const work=studioLessons.has(id)?{}:{draft:state.drafts[id]||{},result:state.results[id]||null,practiced:!!state.practice[id]};
  const key=JSON.stringify([accountId,id,work]);
  if(key===lessonKey)return;
  lessonKey=key;const mine=++lessonGeneration;
  memberInfo.loadingLesson=id;memberInfo.lesson=null;memberInfo.lessonError='';
  // Defer notifications so a route render cannot recursively start itself.
  queueMicrotask(emit);
  try{
    const payload=await callAccountFunction('learning-billing',{action:'lesson',id,work});
    if(mine!==lessonGeneration)return;
    Object.assign(lessons[id],payload.lesson);memberInfo.lesson=payload;
  }catch(error){if(mine!==lessonGeneration)return;memberInfo.lessonError=error.message;}
  finally{if(mine===lessonGeneration){memberInfo.loadingLesson=null;emit();}}
}
export async function openMembershipDestination(action){
  if(memberInfo.busy)return;
  memberInfo.busy=true;memberInfo.error='';emit();
  try{
    const result=await callAccountFunction('learning-billing',{action});
    const url=new URL(result.url);
    const expected=action==='checkout'?'checkout.stripe.com':'billing.stripe.com';
    if(url.protocol!=='https:'||url.hostname!==expected||url.username||url.password)throw new Error('The payment destination could not be verified.');
    location.assign(url.href);
  }catch(error){memberInfo.error=error.message;memberInfo.busy=false;emit();}
}
export async function runMemberExercise(id,values){
  const mine=generation;
  const result=await callAccountFunction('learning-billing',{action:'exercise',id,values});
  if(mine!==generation)throw new Error('Your account changed. Open the lesson again to continue.');
  return result;
}
onAccountChange(()=>{
  const next=accountInfo.user?.id||null;
  if(next===accountId)return;
  accountId=next;reset();emit();if(next)refreshMembership();
});
if(typeof window!=='undefined')window.addEventListener('focus',()=>{if(accountInfo.user)refreshMembership();});
