import {lessons,tracks} from './data.js';

export const PROGRESS_LIMIT=262144;
export const emptyProgress=()=>({version:1,profile:null,completed:[],practice:{},quiz:{},notes:{},current:'evidence',days:[],drafts:{},results:{}});
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const safeKeys=new Set(['__proto__','constructor','prototype']);
function clean(value,depth=0) {
  if(depth>24) throw new Error('This saved work is too deeply nested.');
  if(Array.isArray(value)) return value.map(v=>clean(v,depth+1));
  if(object(value)) return Object.fromEntries(Object.entries(value).filter(([k])=>!safeKeys.has(k)).map(([k,v])=>[k,clean(v,depth+1)]));
  return value;
}
export function progressDocument(raw={}) {
  const next=emptyProgress();
  if(!object(raw)) return next;
  if(raw.profile&&typeof raw.profile.name==='string') next.profile={name:raw.profile.name.trim().slice(0,50),goal:tracks.some(t=>t.id===raw.profile.goal)?raw.profile.goal:'foundations'};
  next.completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(id=>Object.hasOwn(lessons,id)))].sort():[];
  next.current=Object.hasOwn(lessons,raw.current)?raw.current:'evidence';
  next.days=Array.isArray(raw.days)?[...new Set(raw.days.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort():[];
  for(const field of ['practice','quiz','notes','drafts','results']) if(object(raw[field])) next[field]=clean(raw[field]);
  for(const [id,note] of Object.entries(next.notes)) next.notes[id]=String(note??'').slice(0,5000);
  if(new TextEncoder().encode(JSON.stringify(next)).length>PROGRESS_LIMIT) throw new Error('Your saved work is too large to sync. Export a copy before making changes.');
  return next;
}
const stable=value=>Array.isArray(value)?value.map(stable):object(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
export const sameProgress=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
export const hasProgress=d=>!!d.profile||d.completed.length>0||['notes','drafts','practice','quiz'].some(k=>Object.keys(d[k]).length>0);
export const progressSummary=d=>({completed:d.completed.length,notes:Object.values(d.notes).filter(Boolean).length,drafts:Object.keys(d.drafts).length});

// Importing is explicit. Existing account work wins on overlapping keys;
// the original device copy remains available, so neither version is discarded.
export function importDeviceProgress(account,device) {
  const a=progressDocument(account),d=progressDocument(device);
  return progressDocument({...d,...a,profile:a.profile||d.profile,
    completed:[...d.completed,...a.completed],days:[...d.days,...a.days],
    ...Object.fromEntries(['practice','quiz','notes','drafts','results'].map(k=>[k,{...d[k],...a[k]}])),
  });
}
