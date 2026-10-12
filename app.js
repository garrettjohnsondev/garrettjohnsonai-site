import { tracks, lessons } from './data.js';
import { state, persist, recordPractice, complete, e, arrow, resetState, saveMessage } from './state.js';
import * as pages from './pages.js';
import { lessonPage } from './lesson.js';
import { economics } from './engine.js';
import { icon, installIconStyles } from './icons.js';
import { installEvidenceEvents } from './evidence-events.js';
import { installContextEvents } from './context-events.js';
import { installWorkflowEvents } from './workflow-events.js';
import { installOutcomeEvents } from './outcome-events.js';
import { installHandoffEvents } from './handoff-events.js';
import {accountInfo,initializeAccounts,onAccountChange,statusMessage} from './account-runtime.js';
import {installAccountEvents} from './account-events.js';
import {syncStatus,conflictPanel} from './account-views.js';
import {memberInfo,onMembershipChange,refreshMembership,ensureMemberLesson,openMembershipDestination,runMemberExercise} from './membership.js';
import {membershipPage} from './membership-views.js';

installIconStyles();

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const toastNode = document.querySelector('#toast');
const ui = { step:'understand', filter:'all', query:'', lesson:null, next:null, afterSignup:null };
const studioDraftKeys={evidence:'evidenceStudio',context:'contextStudio',control:'workflowStudio',outcome:'outcomeStudio',handoff:'handoffStudio'};
let toastTimer, noteTimer, restoreFocus;

function route() {
  // Anchors from the previous one-page site (#contact, #episodes) open the homepage.
  if (!location.hash.startsWith('#/')) return [''];
  const path = location.hash.replace(/^#\/?/,'').split('?')[0].replace(/\/$/,'');
  return path.split('/');
}
function go(path) {
  const hash = `#/${path}`;
  if (location.hash === hash) render();
  else location.hash=hash;
}
function notify(message) {
  clearTimeout(toastTimer);
  toastNode.textContent=message;
  toastNode.classList.add('visible');
  toastTimer=setTimeout(()=>toastNode.classList.remove('visible'),4000);
}
function render({scroll=false, focus=false} = {}) {
  const [page,id] = route();
  if (page !== 'lesson' || id !== ui.lesson) ui.step='understand';
  ui.lesson=page==='lesson'?id:null;
  let content;
  switch(page) {
    case '': content=pages.home(); break;
    case 'learn': content=pages.library(ui.filter,ui.query); break;
    case 'path': content=pages.trackPage(id); break;
    case 'lesson':
      ensureMemberLesson(id);
      if (lessons[id] && ui.step !== 'complete' && state.drafts[studioDraftKeys[id]]?.stage !== 'complete') { state.current=id; persist(); }
      content=lessonPage(id,ui.step); break;
    case 'dashboard': content=pages.dashboard(); break;
    case 'new': content=pages.newPage(); break;
    case 'plans': content=pages.plans(); break;
    case 'teams': content=pages.teams(); break;
    case 'about': content=pages.about(); break;
    case 'account': content=pages.account(); break;
    case 'membership': content=accountInfo.enabled?membershipPage():pages.plans(); break;
    default: content=pages.notFound();
  }
  const titles={'':'Learn it. Put it to work.',learn:'Learning paths',path:tracks.find(t=>t.id===id)?.name,lesson:lessons[id]?.short,dashboard:'My learning',new:'Practice briefs',plans:'Membership',teams:'For teams',about:'Meet Garrett',account:'Your account',membership:'Your membership'};
  document.title=`${titles[page] || 'Learning Lab'} | Garrett Johnson AI`;
  app.innerHTML=pages.header(page)+`<main id="main" tabindex="-1" class="${scroll?'route-enter':''}">${content}</main>`+pages.footer();
  if(accountInfo.enabled) document.querySelectorAll('[id$="save-status"],#note-status').forEach(node=>{node.textContent=saveMessage();});
  if (page==='lesson' && id==='opportunity' && ui.step==='practice') updateCalculator();
  if (scroll) window.scrollTo({top:0,behavior:'instant'});
  if (focus) document.querySelector('#main').focus({preventScroll:true});
}

function setStep(step) {
  if (!['understand','practice','check','complete'].includes(step)) return;
  ui.step=step;
  render();
  const activeStep=step==='complete'?'check':step;
  document.querySelector(`#tab-${activeStep}`)?.focus({preventScroll:true});
  const tabs=document.querySelector('.lesson-tabs');
  if (tabs && (tabs.getBoundingClientRect().top<80 || tabs.getBoundingClientRect().top>window.innerHeight-150)) window.scrollTo({top:tabs.getBoundingClientRect().top+window.scrollY-105,behavior:'instant'});
}

function showDialog(content) {
  if (!dialog.open) restoreFocus=document.activeElement;
  dialog.innerHTML=`<div class="dialog-inner"><div class="dialog-top">${pages.brand()}<button class="dialog-close" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div>${content}</div>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input,select')?.focus();
}
function closeDialog() {
  dialog.close();
  if (restoreFocus?.isConnected) restoreFocus.focus({preventScroll:true});
}
function signup(next='dashboard',after=null) {
  if(accountInfo.enabled){if(accountInfo.user)go(next);else accountEvents.open(next);return;}
  ui.next=next;
  ui.afterSignup=after;
  showDialog(`<span class="eyebrow">Your next chapter</span><h2 id="dialog-title">Make a little room<br>for learning.</h2><p>Choose a starting point. Your progress saves on this device.</p><form id="signup-form"><label class="field">What should we call you?<input name="name" required maxlength="50" autocomplete="given-name" placeholder="Your first name" value="${e(state.profile?.name||'')}"></label><label class="field">What brings you here?<select name="goal">${tracks.map(t=>`<option value="${t.id}" ${state.profile?.goal===t.id?'selected':''}>${t.name}</option>`).join('')}</select></label><button class="btn btn-primary btn-block" type="submit">Enter my learning space ${arrow}</button></form><p class="preview-note">No email, password, or payment needed. Your profile and progress stay in this browser.</p>`);
}
function upgrade(){go(accountInfo.enabled?'membership':'plans');}


document.addEventListener('click',event=>{
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    document.querySelector('#main')?.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
    return;
  }
  const target=event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const action=target.dataset.action, id=target.dataset.lesson;
  switch(action) {
    case 'menu': {
      const menu=document.querySelector('#mobile-menu');
      menu.hidden=!menu.hidden;
      target.setAttribute('aria-expanded',String(!menu.hidden));
      break;
    }
    case 'preview-info':
      if(accountInfo.enabled){showDialog(`<span class="eyebrow">Account build</span><h2 id="dialog-title">Your work, saved with you.</h2><p>${accountInfo.environment==='test'?'This local test environment uses test identities and a local database. No emails are sent.':'Email sign-in and saved progress connect to the configured account service.'}</p><ul><li>Guest work stays on this device until you choose to import it.</li><li>Account work syncs after sign-in. Check the visible save status.</li><li>Conflicting versions are kept for you to review.</li><li>Billing and live AI calls are disabled.</li></ul><button class="btn btn-primary btn-block" data-action="close-dialog">Back to learning</button>`);break;}
      break;
    case 'close-dialog': closeDialog();break;
    case 'signup': signup();break;
    case 'start-free': (accountInfo.enabled?accountInfo.user:state.profile)?go('path/foundations'):signup('path/foundations');break;
    case 'upgrade': upgrade(target.dataset.next);break;
    case 'membership-signin': accountEvents.open('membership');break;
    case 'membership-refresh': refreshMembership();break;
    case 'membership-checkout': openMembershipDestination('checkout');break;
    case 'membership-portal': openMembershipDestination('portal');break;
    case 'hero-answer': {
      const correct=target.dataset.answer==='check';
      document.querySelectorAll('[data-action="hero-answer"]').forEach(b=>{b.classList.toggle('chosen',b===target);b.setAttribute('aria-pressed',String(b===target));});
      document.querySelector('#sample-hint').hidden=true;
      document.querySelector('#hero-feedback').innerHTML=`<div class="feedback ${correct?'correct':'incorrect'}"><strong class="sample-result-title">${icon(correct?'check':'alert')}${correct?'You caught it. 60 should be 30.':'Not yet. The deadlines don’t match.'}</strong><p>${correct?'AI can sound right and still get a detail wrong. Check the source before using its answer.':'The policy allows 30 days. AI promised 60. Correct the reply to 30 days before sending.'}</p><div class="sample-takeaway"><span>The skill you just practiced</span><strong>Verify the answer against the source.</strong></div><a class="text-link" href="#/lesson/evidence">Try the full lesson</a></div>`;
      break;
    }
    case 'filter': ui.filter=target.dataset.filter;render();document.querySelector(`[data-filter="${ui.filter}"]`)?.focus({preventScroll:true});break;
    case 'clear-search': ui.query='';ui.filter='all';render();document.querySelector('#course-search')?.focus();break;
    case 'lesson-step': setStep(target.dataset.step);break;
    case 'simple-lab': {
      if (!memberInfo.lesson?.evaluation || memberInfo.lesson.id!==id) return;
      const config=memberInfo.lesson.evaluation, choice=target.dataset.choice;
      const pass=choice===config.correct;
      state.drafts[id]={...state.drafts[id],choice};
      recordPractice(id,{pass,title:pass?config.title:'Look at the evidence again.',message:pass?config.message:config.wrong});
      render();document.querySelector(`.feedback`)?.setAttribute('tabindex','-1');document.querySelector('.feedback')?.focus({preventScroll:true});break;
    }
    case 'quiz': {
      if (!lessons[id]) return;
      state.quiz[id]=Number(target.dataset.choice);persist();render();
      document.querySelector(`[data-action="quiz"][data-choice="${state.quiz[id]}"]`)?.focus({preventScroll:true});break;
    }
    case 'complete': if (complete(id)) {setStep('complete');notify('Lesson completed. Keep that skill with you.');}break;
    case 'reset-prompt':
      if(accountInfo.enabled) return;
      showDialog('<span class="eyebrow">Start fresh</span><h2 id="dialog-title">Clear your progress?</h2><p>This removes your profile, notes, achievements, and lesson progress from this browser. It can’t be undone.</p><button class="btn btn-secondary btn-block" data-action="close-dialog">Keep my progress</button><button class="btn btn-quiet btn-block" data-action="reset-confirm" style="margin-top:12px">Clear my progress</button>');break;
    case 'reset-confirm': if(!accountInfo.enabled){resetState();closeDialog();go('');notify('Progress cleared. You can start fresh.');}break;
  }
});

document.addEventListener('submit',async event=>{
  const form=event.target;
  const supported=['signup-form','profile-form','retrieval-form','recovery-form','calculator-form','team-form'];
  if (!supported.includes(form.id)) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values=Object.fromEntries(new FormData(form));
  if (form.id==='signup-form'||form.id==='profile-form') {
    const name=String(values.name||'').trim();
    if (!name) {const input=form.elements.name;input.setCustomValidity('Enter a first name to continue.');input.reportValidity();return;}
    const goal=tracks.some(t=>t.id===values.goal)?values.goal:'foundations';
    state.profile={name:name.slice(0,50),goal};persist();
    if (form.id==='profile-form') {render();notify(accountInfo.enabled?'Profile updated. Check your save status below.':'Your profile is saved on this device.');return;}
    const next=ui.next ||'dashboard',after=ui.afterSignup;
    closeDialog();
    if (after==='upgrade') {upgrade(next);render();} else {go(next);notify('Your learning space is ready.');}
    return;
  }
  if (['retrieval-form','recovery-form'].includes(form.id)) {
    const id=form.id.split('-')[0],button=form.querySelector('button[type="submit"]');
    button.disabled=true;
    try {const result=await runMemberExercise(id,values);state.drafts[id]=values;recordPractice(id,result);render();}
    catch(error){notify(error.message);button.disabled=false;}
  }
  if (form.id==='calculator-form') {
    const result=economics(values);state.drafts.opportunity=result.inputs;
    recordPractice('opportunity',{pass:true,title:'Your assumptions are recorded.',message:result.value>=0?`These assumptions imply ${result.hours.toFixed(1)} hours of monthly capacity and ${money(result.value)} of capacity value after the tool cost. Validate the time estimates with a trial.`:`These assumptions imply ${money(result.value)} of capacity value after the tool cost. A negative result is useful evidence: reconsider the workflow or the review burden before buying.`});render();
  }
  if (form.id==='team-form') {
    const subject='Team learning pilot inquiry';
    const body=`Hi Garrett,\n\nI would like to discuss a learning pilot.\n\nName: ${values.name}\nWork email: ${values.email}\nTeam size: ${values.size}\n\nOur learning goal:\n${values.goal}\n`;
    window.location.href=`mailto:hello@garrettjohnsonai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    notify('Email draft requested. Review it in your email app before sending.');
  }
});

function money(value) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value); }
function updateCalculator() {
  const form=document.querySelector('#calculator-form');
  if (!form) return;
  const result=economics(Object.fromEntries(new FormData(form)));
  document.querySelector('#hours-result').textContent=`${result.hours.toFixed(1)} h`;
  document.querySelector('#value-result').textContent=money(result.value);
}

document.addEventListener('input',event=>{
  const input=event.target;
  if (input.name==='name') input.setCustomValidity('');
  if (input.id==='lesson-note') {
    const id=input.dataset.lesson;
    if (!lessons[id]) return;
    state.notes[id]=input.value.slice(0,5000);
    const saved=persist();
    clearTimeout(noteTimer);
    noteTimer=setTimeout(()=>{const status=document.querySelector('#note-status');if(status)status.textContent=accountInfo.enabled?saveMessage():saved?'Saved on this device.':'Storage is unavailable. Notes last for this visit only.';},250);
  }
  if (input.id==='course-search') {
    ui.query=input.value;
    const temporary=document.createElement('div');
    temporary.innerHTML=pages.library(ui.filter,ui.query);
    document.querySelector('#course-results').innerHTML=temporary.querySelector('#course-results').innerHTML;
  }
  if (input.closest('#calculator-form')) {
    state.drafts.opportunity=Object.fromEntries(new FormData(input.closest('form')));persist();updateCalculator();
  }
});

document.addEventListener('change',event=>{
  const form=event.target.closest('form');
  if (form?.id==='retrieval-form'||form?.id==='recovery-form') {
    const id=form.dataset.lesson;state.drafts[id]=Object.fromEntries(new FormData(form));persist();
  }
});

document.addEventListener('keydown',event=>{
  if (event.key==='Escape') {const menu=document.querySelector('#mobile-menu');if(menu&&!menu.hidden){menu.hidden=true;const b=document.querySelector('[data-action="menu"]');b.setAttribute('aria-expanded','false');b.focus();}}
  if (event.target.matches('[role="tab"]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
    event.preventDefault();const tabs=['understand','practice','check'];let index=tabs.indexOf(ui.step==='complete'?'check':ui.step);
    index=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;
    setStep(tabs[index]);
  }
});
dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
dialog.addEventListener('close',()=>{if(restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});});
window.addEventListener('hashchange',()=>{if(dialog.open)closeDialog();render({scroll:true,focus:true});});
installEvidenceEvents({render,notify});
installContextEvents({render,notify});
installWorkflowEvents({render,notify});
installOutcomeEvents({render,notify});
installHandoffEvents({render,notify});
const accountEvents=installAccountEvents({showDialog,closeDialog,go,render,notify});
onMembershipChange(()=>{const [page]=route();if(['membership','account','lesson','plans'].includes(page))render();});
onAccountChange(kind=>{
  if(kind==='workspace'){render();return;}
  document.querySelectorAll('[data-account-status]').forEach(node=>{const wrap=document.createElement('div');wrap.innerHTML=syncStatus(node.classList.contains('account-status-banner'));node.replaceWith(wrap.firstElementChild);});
  const conflicts=document.querySelector('#account-conflict-region');if(conflicts)conflicts.innerHTML=conflictPanel();
  if(accountInfo.enabled&&accountInfo.user) document.querySelectorAll('[id$="save-status"],#note-status').forEach(node=>{node.textContent=statusMessage();});
});
render();
initializeAccounts();
