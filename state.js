import { lessons, tracks } from './data.js';
import {accountConfig} from './account-config.js';
import {memberAccess} from './member-access.js';
import { icon } from './icons.js';
import { evidenceReady } from './evidence-engine.js';
import { contextReady } from './context-engine.js';
import { workflowReady } from './workflow-engine.js';
import { outcomeReady } from './outcome-engine.js';
import { handoffReady } from './handoff-engine.js';

export const DEVICE_STORAGE_KEY = 'garrett-ai-learning-preview-v1';
let storageKey=DEVICE_STORAGE_KEY;
const persistListeners=new Set();
let saveMessageProvider=null;
export const setSaveMessageProvider=provider=>{saveMessageProvider=provider;};
export const saveMessage=()=>saveMessageProvider?saveMessageProvider():storageAvailable?'Your work saves automatically on this device.':'Storage is unavailable. Your work lasts for this visit only.';
const fresh = () => ({ version: 1, profile: null, tier: 'free', completed: [], practice: {}, quiz: {}, notes: {}, current: 'evidence', days: [], drafts: {}, results: {} });
export let storageAvailable = true;
export const state = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!raw || raw.version !== 1) return fresh();
    const next = fresh();
    if (raw.profile && typeof raw.profile.name === 'string') next.profile = { name: raw.profile.name.slice(0, 50), goal: tracks.some(t => t.id === raw.profile.goal) ? raw.profile.goal : 'foundations' };
    next.tier = raw.tier === 'member' ? 'member' : 'free';
    next.completed = Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(id => lessons[id]))] : [];
    next.current = lessons[raw.current] ? raw.current : 'evidence';
    for (const field of ['practice', 'quiz', 'notes', 'drafts', 'results']) {
      if (raw[field] && typeof raw[field] === 'object' && !Array.isArray(raw[field])) next[field] = raw[field];
    }
    next.days = Array.isArray(raw.days) ? raw.days.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
    return next;
  } catch { storageAvailable = false; return fresh(); }
}

export function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  for(const listener of persistListeners) listener(state);
  return storageAvailable;
}
export const onPersist=listener=>{persistListeners.add(listener);return ()=>persistListeners.delete(listener);};
export function switchWorkspace(key,document) {
  storageKey=key;
  for(const field of Object.keys(state)) delete state[field];
  Object.assign(state,fresh(),structuredClone(document));
  try {localStorage.setItem(storageKey,JSON.stringify(state));storageAvailable=true;}
  catch {storageAvailable=false;}
}
export function readDeviceWorkspace() {
  try {return JSON.parse(localStorage.getItem(DEVICE_STORAGE_KEY)||'null');}catch{return null;}
}
export function restoreDeviceWorkspace() {
  storageKey=DEVICE_STORAGE_KEY;
  const saved=load();
  for(const field of Object.keys(state)) delete state[field];
  Object.assign(state,saved);
}

export function recordPractice(id, result) {
  if (!lessons[id]) return;
  state.results[id] = result;
  if (result.pass) state.practice[id] = true;
  persist();
}

export function isQuizPassed(id) {
  if(id==='evidence') return state.drafts.evidenceStudio?.transfer===1;
  if(id==='context') return state.drafts.contextStudio?.transfer===1;
  if(id==='control') return state.drafts.workflowStudio?.transfer===1;
  if(id==='outcome') return state.drafts.outcomeStudio?.transfer===1;
  if(id==='handoff') return state.drafts.handoffStudio?.transfer?.pass===true;
  return lessons[id]?.quiz?.correct!==undefined && state.quiz[id] === lessons[id].quiz.correct;
}
export function canComplete(id) {
  if(id==='evidence') return evidenceReady(state.drafts.evidenceStudio);
  if(id==='context') return contextReady(state.drafts.contextStudio);
  if(id==='control') return workflowReady(state.drafts.workflowStudio);
  if(id==='outcome') return outcomeReady(state.drafts.outcomeStudio);
  if(id==='handoff') return handoffReady(state.drafts.handoffStudio);
  return !!state.practice[id] && isQuizPassed(id);
}
export function complete(id) {
  if (!lessons[id] || !canComplete(id)) return false;
  if (!state.completed.includes(id)) state.completed.push(id);
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if (!state.days.includes(date)) state.days.push(date);
  const track = tracks.find(t => t.id === lessons[id].track);
  state.current = track.lessons.find(key => !state.completed.includes(key)) || id;
  persist();
  return true;
}
export const completedIn = track => track.lessons.filter(id => state.completed.includes(id)).length;
export const nextIn = track => track.lessons.find(id => !state.completed.includes(id)) || track.lessons[0];
export const hasAccess = id => lessons[id]?.track === 'foundations' || (memberAccess.allowed && Date.parse(memberAccess.until)>Date.now());
export function resetState() { Object.assign(state, fresh()); persist(); }
export function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
export const e = escapeHTML;
export const arrow = icon('arrow');
export function achievements() {
  return [
    { name:'First step', detail:'Complete your first lesson', earned:state.completed.length >= 1, icon:'flag' },
    { name:'Solid foundations', detail:'Complete all four foundation lessons', earned:completedIn(tracks[0]) === tracks[0].lessons.length, icon:'foundation' },
    { name:'Business ready', detail:'Complete the business path', earned:completedIn(tracks[1]) === tracks[1].lessons.length, icon:'briefcase' },
    { name:'Evidence-led', detail:'Complete the PM & team-lead path', earned:completedIn(tracks[2]) === tracks[2].lessons.length, icon:'target' },
  ];
}
