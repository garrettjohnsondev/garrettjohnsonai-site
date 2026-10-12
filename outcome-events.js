import {state,persist,complete,storageAvailable,saveMessage} from './state.js';
import {outcomeDraft} from './outcome-lesson.js';
import {OUTCOME_CRITERIA,outcomeSnapshot,outcomeSignature,reviewOutcome,outcomeDiagnosed,outcomeReviewed,outcomeReady,outcomeFieldGuide} from './outcome-engine.js';

export function installOutcomeEvents({render,notify}) {
  const save=()=>{
    persist();
    const el=document.querySelector('#verify-save-status');
    if(el) el.textContent=saveMessage();
  };
  const invalidate=d=>{if(d.review?.signature!==outcomeSignature(d)) d.review=null;};
  const reveal=selector=>{
    const el=document.querySelector(selector);el?.focus({preventScroll:true});
    if(el) window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-108),behavior:'instant'});
  };
  const apply=(d,action)=>{
    d.actions.push(action);d.verdict=null;d.review=null;save();render();reveal('#verify-record-heading');
    notify('Simulation changed. Refresh saved bookings before verifying the result.');
  };
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-action^="verify-"]');
    if(!target||target.disabled) return;
    const d=outcomeDraft();
    switch(target.dataset.action) {
      case 'verify-stage': {
        const stage=target.dataset.stage;
        if(!['brief','practice','check','complete'].includes(stage)) return;
        if(stage==='complete'&&(!d.finished||!outcomeReady(d))) return;
        d.stage=stage;save();render();reveal('#verify-heading');break;
      }
      case 'verify-inspect':
        d.viewedRevision=d.actions.length;invalidate(d);save();render();
        document.querySelector('[data-action="verify-inspect"]')?.focus({preventScroll:true});
        notify('Current saved bookings inspected. Compare every required condition.');break;
      case 'verify-verdict': {
        const verdict=target.dataset.verdict;if(!['verified','mismatch'].includes(verdict)) return;
        d.verdict=verdict;invalidate(d);save();render();
        document.querySelector(`[data-action="verify-verdict"][data-verdict="${verdict}"]`)?.focus({preventScroll:true});break;
      }
      case 'verify-review': {
        d.review=reviewOutcome(d);d.attempts=(Number(d.attempts)||0)+1;
        if(d.actions.length===0&&d.review.assessmentPass&&!d.review.matches) d.diagnosis={criteria:[...d.criteria],viewedRevision:0,verdict:'mismatch'};
        if(outcomeReviewed(d)) state.practice.outcome=true;
        save();render();reveal('.verify-review');break;
      }
      case 'verify-repair-focus':if(outcomeDiagnosed(d)) reveal('#verify-repair-heading');break;
      case 'verify-slot': {
        if(!outcomeDiagnosed(d)||!['target','later'].includes(target.dataset.slot)) return;
        d.slot=target.dataset.slot;save();render();
        document.querySelector(`[data-action="verify-slot"][data-slot="${d.slot}"]`)?.focus({preventScroll:true});break;
      }
      case 'verify-apply':
        if(outcomeDiagnosed(d)&&['update','create'].includes(d.operation)&&['target','later'].includes(d.slot)) apply(d,{type:d.operation,slot:d.slot});break;
      case 'verify-undo':
        if(outcomeDiagnosed(d)&&outcomeSnapshot(d).canUndo) apply(d,{type:'undo'});break;
      case 'verify-transfer': {
        const choice=Number(target.dataset.choice);if(![0,1,2].includes(choice)) return;
        d.transfer=choice;state.quiz.outcome=choice;save();render();
        document.querySelector(`[data-action="verify-transfer"][data-choice="${choice}"]`)?.focus({preventScroll:true});break;
      }
      case 'verify-complete': {
        if(!outcomeReady(d)||!complete('outcome')) return;
        d.finished=true;d.stage='complete';save();render();reveal('#verify-heading');notify('Lesson complete. Your verification guide is ready.');break;
      }
      case 'verify-copy': {
        if(!outcomeReady(d)) return;
        const status=document.querySelector('#verify-copy-status');
        try {await navigator.clipboard.writeText(outcomeFieldGuide(d,state.notes.outcome));if(status) status.textContent='Copied. Your verification guide is ready to paste.';}
        catch {if(status) status.textContent='Clipboard access is unavailable here. Select and copy the guide below.';document.querySelector('#verify-kit-text')?.focus();}
        break;
      }
      case 'verify-download': {
        if(!outcomeReady(d)) return;
        const url=URL.createObjectURL(new Blob([outcomeFieldGuide(d,state.notes.outcome)],{type:'text/markdown;charset=utf-8'}));
        const a=document.createElement('a');a.href=url;a.download='my-outcome-verification-guide.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);break;
      }
    }
  });
  document.addEventListener('change',event=>{
    const d=event.target.name==='verify-criterion'||event.target.dataset.verifyField==='operation'?outcomeDraft():null;
    if(!d) return;
    if(event.target.name==='verify-criterion') {
      const id=event.target.value;if(!OUTCOME_CRITERIA.some(c=>c.id===id)) return;
      d.criteria=event.target.checked?[...new Set([...d.criteria,id])]:d.criteria.filter(x=>x!==id);
      invalidate(d);save();render();document.querySelector(`[name="verify-criterion"][value="${id}"]`)?.focus({preventScroll:true});
    } else if(outcomeDiagnosed(d)&&['update','create'].includes(event.target.value)) {
      d.operation=event.target.value;save();render();document.querySelector('[data-verify-field="operation"]')?.focus({preventScroll:true});
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.dataset.verifyField!=='reflection') return;
    outcomeDraft().reflection=event.target.value.slice(0,1000);save();
  });
}
