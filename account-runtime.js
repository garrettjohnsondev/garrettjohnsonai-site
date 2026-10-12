import {accountConfig} from './account-config.js';
import {validateAccountConfig,createAccountClient,progressRepository} from './account-client.js';
import {state,onPersist,switchWorkspace,restoreDeviceWorkspace,readDeviceWorkspace,setSaveMessageProvider} from './state.js';
import {progressDocument,emptyProgress,hasProgress,importDeviceProgress} from './progress-document.js';
import {ProgressSync} from './progress-sync.js';

let configured=false,configurationError=false;
try {configured=validateAccountConfig(accountConfig);}catch{configurationError=true;}
export const accountInfo={enabled:configured||configurationError,environment:accountConfig.environment,user:null,status:configured?'loading':configurationError?'unavailable':'preview',conflict:null,cacheAvailable:true};
const listeners=new Set();
export const onAccountChange=listener=>{listeners.add(listener);return ()=>listeners.delete(listener);};
const emit=kind=>{for(const listener of listeners) listener(kind);};
let client,sync,sessionGeneration=0,activeKey='',initPromise;
const prefix=()=>`gj-learning:${new URL(accountConfig.supabaseUrl).host}:`;
function cacheFor(id){
  const key=prefix()+id+':sync';
  return {
    read(){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}},
    write(value){try{localStorage.setItem(key,JSON.stringify(value));accountInfo.cacheAvailable=true;}catch{accountInfo.cacheAvailable=false;}},
    backup(value){try{localStorage.setItem(prefix()+id+':recovery',JSON.stringify(value));return true;}catch{return false;}},
  };
}
async function acceptSession(session){
  const user=session?.user;
  if(user?.id===accountInfo.user?.id) return;
  const generation=++sessionGeneration;
  sync?.stop();sync=null;
  accountInfo.user=user?{id:user.id,email:user.email||''}:null;accountInfo.conflict=null;
  if(!user){restoreDeviceWorkspace();accountInfo.status='signed-out';emit('workspace');return;}
  activeKey=prefix()+user.id+':workspace';
  const cache=cacheFor(user.id);
  try {
    sync=new ProgressSync({repository:progressRepository(client),cache,
      onChange(snapshot){if(generation!==sessionGeneration)return;accountInfo.status=snapshot.status;accountInfo.conflict=snapshot.remote;emit('status');},
      onDocument(document){if(generation!==sessionGeneration)return;switchWorkspace(activeKey,{...document,tier:'free'});emit('workspace');},
    });
  } catch {accountInfo.status='unavailable';switchWorkspace(activeKey,emptyProgress());emit('workspace');return;}
  switchWorkspace(activeKey,{...sync.local,tier:'free'});accountInfo.status='loading';emit('workspace');
  await sync.refresh();
}
export async function initializeAccounts(){
  if(!configured||initPromise) return initPromise;
  initPromise=(async()=>{
    try {
      client=await createAccountClient(accountConfig);
      client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>acceptSession(session),0);});
      const {data,error}=await client.auth.getSession();if(error) throw error;
      if(data.session) await acceptSession(data.session);
      else {accountInfo.status='signed-out';emit('status');}
    } catch {accountInfo.status='unavailable';emit('status');}
  })();
  return initPromise;
}
onPersist(document=>{
  if(!accountInfo.user||!sync) return;
  try{sync.edit(progressDocument(document));}catch{accountInfo.status='too-large';emit('status');}
});
export async function sendAccountCode(email){
  await initializeAccounts();if(!client) throw new Error('Accounts are not connected yet. You can keep learning on this device.');
  const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
  if(error) throw new Error(error.status===429?'Please wait a minute before requesting another code.':'We couldn’t send a code. Check the email address and try again.');
}
export async function verifyAccountCode(email,token){
  if(!client) throw new Error('Sign-in is unavailable. Please try again.');
  const {data,error}=await client.auth.verifyOtp({email,token,type:'email'});
  if(error||!data.session) throw new Error('That code is invalid or expired. Try the newest code, or request another.');
  await acceptSession(data.session);
}
export async function refreshAccount(){
  if(!sync) {initPromise=null;return initializeAccounts();}
  return sync.refresh();
}
export async function callAccountFunction(name,body){
  await initializeAccounts();
  if(!client||!accountInfo.user)throw new Error('Sign in to continue.');
  const {data,error}=await client.functions.invoke(name,{body});
  if(error){
    let message='Membership is temporarily unavailable. Please try again.';
    try{const payload=await error.context.json();if(typeof payload?.error==='string')message=payload.error;}catch{}
    throw new Error(message);
  }
  return data;
}
export async function resolveAccountConflict(choice){if(sync) return sync.resolve(choice);}
export function deviceProgress(){try{return progressDocument(readDeviceWorkspace()||{});}catch{return emptyProgress();}}
export function canImportDevice(){return !!accountInfo.user&&hasProgress(deviceProgress());}
export function importDevice(){
  if(!sync||!accountInfo.user||accountInfo.conflict||!sync.ready) return false;
  const document=importDeviceProgress(sync.local,deviceProgress());
  switchWorkspace(activeKey,{...document,tier:'free'});sync.edit(document);emit('workspace');return true;
}
export function recoveryCopy(){
  if(!accountInfo.user) return null;
  try{return JSON.parse(localStorage.getItem(prefix()+accountInfo.user.id+':recovery')||'null');}catch{return null;}
}
export function accountExport(){return {exportedAt:new Date().toISOString(),current:progressDocument(state),otherVersion:accountInfo.conflict?.document||null,recovery:recoveryCopy()};}
export async function signOutAccount({keepPending=false}={}){
  if(!client) return;
  // Refuse a normal sign-out when an unsynced draft could be stranded.
  if(!keepPending&&sync&&(accountInfo.conflict||!(await sync.flush()))) throw new Error('Your latest work hasn’t reached your account. Retry saving or resolve the two versions before signing out.');
  const {error}=await client.auth.signOut({scope:'local'});
  if(error){const {data}=await client.auth.getSession();if(data.session) throw new Error('Sign-out didn’t finish. Please try again.');}
  await acceptSession(null);
}
export function statusMessage(){
  if(!accountInfo.cacheAvailable) return 'Browser storage is unavailable. Keep this tab open until your work is saved to your account.';
  return ({preview:'Saved on this device.',loading:'Checking your saved work…','signed-out':'Learning as a guest. Work stays on this device.',pending:'Changes saved here. Waiting to sync…',saving:'Saving to your account…',saved:'Saved to your account.',offline:'Not synced yet. Your work is saved here; retry when you’re connected.',conflict:'Another device has different work. Choose which version to continue.',unavailable:'Accounts are unavailable. Your work remains on this device.','too-large':'This work is too large to sync. Export a copy from your account.'})[accountInfo.status]||'Saved on this device.';
}
if(typeof window!=='undefined'){
  window.addEventListener('online',()=>{if(accountInfo.user) refreshAccount();});
}
if(accountInfo.enabled) setSaveMessageProvider(statusMessage);
