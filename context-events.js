import {state,persist,complete,storageAvailable,saveMessage} from './state.js';
import {contextDraft} from './context-lesson.js';
import {CONTEXT_CASES,CONTEXT_FILES,contextSignature,runContextCase,contextReviewed,contextReady,contextFieldGuide} from './context-engine.js';

export function installContextEvents({render,notify}) {
  const save=()=>{
    persist();
    const el=document.querySelector('#brief-save-status');
    if(el) el.textContent=saveMessage();
  };
  const invalidate=d=>{for(const [id,r] of Object.entries(d.runs)) if(r.signature!==contextSignature(d)) delete d.runs[id];};
  const reveal=selector=>{
    const el=document.querySelector(selector);
    el?.focus({preventScroll:true});
    if(el) window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-108),behavior:'instant'});
  };
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-action^="brief-"]');
    if(!target||target.disabled) return;
    const d=contextDraft();
    switch(target.dataset.action) {
      case 'brief-stage': {
        const stage=target.dataset.stage;
        if(!['brief','practice','check','complete'].includes(stage)) return;
        if(stage==='complete'&&(!d.finished||!contextReady(d))) return;
        d.stage=stage;save();render();reveal('#brief-heading');break;
      }
      case 'brief-file': {
        const id=target.dataset.file;
        if(!CONTEXT_FILES.some(f=>f.id===id)) return;
        d.selected=d.selected.includes(id)?d.selected.filter(x=>x!==id):[...d.selected,id];
        invalidate(d);save();render();
        document.querySelector(`[data-action="brief-file"][data-file="${id}"]`)?.focus({preventScroll:true});break;
      }
      case 'brief-case': {
        if(!CONTEXT_CASES[target.dataset.case]) return;
        const fromResults=!!target.closest('.brief-results');
        d.activeCase=target.dataset.case;save();render();
        const button=document.querySelector(`[data-action="brief-case"][data-case="${d.activeCase}"]`);
        button?.focus({preventScroll:true});
        if(fromResults) reveal('.brief-case-switch');
        break;
      }
      case 'brief-run': {
        d.runs[d.activeCase]=runContextCase(d,d.activeCase);d.attempts=(Number(d.attempts)||0)+1;
        if(contextReviewed(d)) state.practice.context=true;
        save();render();reveal('.brief-results');break;
      }
      case 'brief-edit':reveal('[data-action="brief-file"]');break;
      case 'brief-transfer': {
        const choice=Number(target.dataset.choice);
        if(![0,1,2].includes(choice)) return;
        d.transfer=choice;state.quiz.context=choice;save();render();
        document.querySelector(`[data-action="brief-transfer"][data-choice="${choice}"]`)?.focus({preventScroll:true});break;
      }
      case 'brief-complete': {
        if(!contextReady(d)||!complete('context')) return;
        d.finished=true;d.stage='complete';save();render();reveal('#brief-heading');notify('Lesson complete. Your brief kit is ready.');break;
      }
      case 'brief-copy': {
        if(!contextReady(d)) return;
        const status=document.querySelector('#brief-copy-status');
        try {await navigator.clipboard.writeText(contextFieldGuide(d,state.notes.context));if(status) status.textContent='Copied. Your brief kit is ready to paste.';}
        catch {if(status) status.textContent='Clipboard access is unavailable here. Select and copy the kit below.';document.querySelector('#brief-kit-text')?.focus();}
        break;
      }
      case 'brief-download': {
        if(!contextReady(d)) return;
        const url=URL.createObjectURL(new Blob([contextFieldGuide(d,state.notes.context)],{type:'text/markdown;charset=utf-8'}));
        const a=document.createElement('a');a.href=url;a.download='my-ai-brief-kit.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);break;
      }
    }
  });
  document.addEventListener('change',event=>{
    const field=event.target.dataset.briefField;
    if(!['format','boundary'].includes(field)) return;
    const allowed={format:['paragraph','structured'],boundary:['assume','ask']};
    if(!allowed[field].includes(event.target.value)) return;
    const d=contextDraft();d[field]=event.target.value;invalidate(d);save();render();
    document.querySelector(`[data-brief-field="${field}"]`)?.focus({preventScroll:true});
  });
  document.addEventListener('input',event=>{
    if(event.target.dataset.briefField!=='reflection') return;
    contextDraft().reflection=event.target.value.slice(0,1000);save();
  });
}
