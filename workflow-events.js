import {state,persist,complete,storageAvailable,saveMessage} from './state.js';
import {workflowDraft} from './workflow-lesson.js';
import {WORKFLOW_STEPS,WORKFLOW_CASES,moveWorkflowStep,workflowSignature,runWorkflowCase,workflowReviewed,workflowReady,workflowFieldGuide} from './workflow-engine.js';

export function installWorkflowEvents({render,notify}) {
  const save=()=>{
    persist();
    const el=document.querySelector('#flow-save-status');
    if(el) el.textContent=saveMessage();
  };
  const invalidate=d=>{for(const [id,r] of Object.entries(d.runs)) if(r.signature!==workflowSignature(d)) delete d.runs[id];};
  const reveal=selector=>{
    const el=document.querySelector(selector);
    el?.focus({preventScroll:true});
    if(el) window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-108),behavior:'instant'});
  };
  const showRun=d=>{if(workflowReviewed(d)) state.practice.control=true;save();render();reveal('.flow-results');};
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-action^="flow-"]');
    if(!target||target.disabled) return;
    const d=workflowDraft();
    switch(target.dataset.action) {
      case 'flow-stage': {
        const stage=target.dataset.stage;
        if(!['brief','practice','check','complete'].includes(stage)) return;
        if(stage==='complete'&&(!d.finished||!workflowReady(d))) return;
        d.stage=stage;save();render();reveal('#flow-heading');break;
      }
      case 'flow-move': {
        const id=target.dataset.step,direction=Number(target.dataset.direction);
        if(!Object.hasOwn(WORKFLOW_STEPS,id)||![-1,1].includes(direction)) return;
        d.order=moveWorkflowStep(d.order,id,direction);invalidate(d);save();render();
        let button=document.querySelector(`[data-action="flow-move"][data-step="${id}"][data-direction="${direction}"]`);
        if(button?.disabled) button=document.querySelector(`[data-action="flow-move"][data-step="${id}"]:not(:disabled)`);
        button?.focus({preventScroll:true});button?.closest('.flow-node')?.scrollIntoView({block:'nearest',behavior:'instant'});
        const message=`${WORKFLOW_STEPS[id].title} moved to step ${d.order.indexOf(id)+1}. Run both cases again after editing.`;
        const status=document.querySelector('#flow-move-status');if(status) status.textContent=message;
        notify(message);break;
      }
      case 'flow-case': {
        if(!Object.hasOwn(WORKFLOW_CASES,target.dataset.case)) return;
        const fromResult=!!target.closest('.flow-results');
        d.activeCase=target.dataset.case;save();render();
        if(fromResult) reveal('.flow-test-desk');
        else document.querySelector(`[data-action="flow-case"][data-case="${d.activeCase}"]`)?.focus({preventScroll:true});
        break;
      }
      case 'flow-run':d.runs[d.activeCase]=runWorkflowCase(d,d.activeCase);d.attempts=(Number(d.attempts)||0)+1;showRun(d);break;
      case 'flow-decide': {
        const decision=target.dataset.decision,run=d.runs[d.activeCase];
        if(!['approve','reject'].includes(decision)||!run?.awaitingApproval||run.signature!==workflowSignature(d)) return;
        d.runs[d.activeCase]=runWorkflowCase(d,d.activeCase,decision);showRun(d);break;
      }
      case 'flow-edit':reveal('#flow-builder-title');break;
      case 'flow-transfer': {
        const choice=Number(target.dataset.choice);
        if(![0,1,2].includes(choice)) return;
        d.transfer=choice;state.quiz.control=choice;save();render();
        document.querySelector(`[data-action="flow-transfer"][data-choice="${choice}"]`)?.focus({preventScroll:true});break;
      }
      case 'flow-complete': {
        if(!workflowReady(d)||!complete('control')) return;
        d.finished=true;d.stage='complete';save();render();reveal('#flow-heading');notify('Lesson complete. Your workflow control map is ready.');break;
      }
      case 'flow-copy': {
        if(!workflowReady(d)) return;
        const status=document.querySelector('#flow-copy-status');
        try {await navigator.clipboard.writeText(workflowFieldGuide(d,state.notes.control));if(status) status.textContent='Copied. Your control map is ready to paste.';}
        catch {if(status) status.textContent='Clipboard access is unavailable here. Select and copy the map below.';document.querySelector('#flow-kit-text')?.focus();}
        break;
      }
      case 'flow-download': {
        if(!workflowReady(d)) return;
        const url=URL.createObjectURL(new Blob([workflowFieldGuide(d,state.notes.control)],{type:'text/markdown;charset=utf-8'}));
        const a=document.createElement('a');a.href=url;a.download='my-workflow-control-map.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);break;
      }
    }
  });
  document.addEventListener('change',event=>{
    const field=event.target.dataset.flowField,allowed={permission:['prepare','approve'],missing:['continue','handoff']};
    if(!Object.hasOwn(allowed,field)||!allowed[field].includes(event.target.value)) return;
    const d=workflowDraft();d[field]=event.target.value;invalidate(d);save();render();
    document.querySelector(`[data-flow-field="${field}"]`)?.focus({preventScroll:true});
  });
  document.addEventListener('input',event=>{
    if(event.target.dataset.flowField!=='reflection') return;
    workflowDraft().reflection=event.target.value.slice(0,1000);save();
  });
}
