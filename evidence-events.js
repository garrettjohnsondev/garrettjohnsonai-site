import {state,persist,complete,storageAvailable,saveMessage} from './state.js';
import {evidenceDraft,replyPreview,reviewPanel} from './evidence-lesson.js';
import {SOURCES,reviewEvidence,evidenceSignature,evidenceReady,evidenceReviewed,evidenceFieldGuide} from './evidence-engine.js';
import {icon} from './icons.js';

export function installEvidenceEvents({render,notify}) {
  const save=()=>{
    persist();
    const status=document.querySelector('#studio-save-status');
    if(status) status.textContent=saveMessage();
  };
  const invalidate=d=>{
    if(d.review && d.review.signature!==evidenceSignature(d)) d.review=null;
  };
  const refresh=d=>{
    const preview=document.querySelector('#studio-reply-preview');
    if(preview) preview.innerHTML=replyPreview(d);
    const result=document.querySelector('#studio-review-result');
    if(result) result.innerHTML=reviewPanel(d);
    const practiceMark=document.querySelector('.studio-rail [data-stage="practice"] .studio-step-mark');
    if(practiceMark) practiceMark.innerHTML=evidenceReviewed(d)?icon('check'):'<span>02</span>';
    save();
  };
  const focusHeading=()=>{
    const heading=document.querySelector('#studio-heading');
    heading?.focus({preventScroll:true});
    if(heading) window.scrollTo({top:Math.max(0,heading.getBoundingClientRect().top+window.scrollY-112),behavior:'instant'});
  };
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-action^="studio-"]');
    if(!target || target.disabled) return;
    const d=evidenceDraft();
    switch(target.dataset.action) {
      case 'studio-stage': {
        const stage=target.dataset.stage;
        if(!['brief','practice','check','complete'].includes(stage)) return;
        if(stage==='complete'&&(!d.finished||!evidenceReady(d))) return;
        d.stage=stage;save();render();focusHeading();break;
      }
      case 'studio-document': {
        const key=target.dataset.document;
        if(!SOURCES[key]) return;
        d.activeDoc=key;
        if(!d.opened.includes(key)) d.opened.push(key);
        invalidate(d);save();render();
        document.querySelector(`[data-action="studio-document"][data-document="${key}"]`)?.focus({preventScroll:true});
        break;
      }
      case 'studio-use-source': {
        const key=target.dataset.document;
        if(!SOURCES[key]||!d.opened.includes(key)) return;
        d.source=key;invalidate(d);save();render();
        document.querySelector('[data-action="studio-use-source"]')?.focus({preventScroll:true});
        notify(`${SOURCES[key].code} selected as your source.`);break;
      }
      case 'studio-review': {
        d.review=reviewEvidence(d);d.attempts=(d.attempts||0)+1;
        if(d.review.pass) state.practice.evidence=true;
        save();render();
        const result=document.querySelector('.studio-review-result');
        result?.focus({preventScroll:true});
        if(result) window.scrollTo({top:result.getBoundingClientRect().top+window.scrollY-100,behavior:'instant'});
        break;
      }
      case 'studio-transfer': {
        const choice=Number(target.dataset.choice);
        if(![0,1,2].includes(choice)) return;
        d.transfer=choice;state.quiz.evidence=choice;save();render();
        document.querySelector(`[data-action="studio-transfer"][data-choice="${choice}"]`)?.focus({preventScroll:true});break;
      }
      case 'studio-complete': {
        if(!evidenceReady(d)||!complete('evidence')) return;
        d.finished=true;d.stage='complete';save();render();focusHeading();
        notify('Lesson complete. Your field guide is ready.');break;
      }
      case 'studio-download': {
        if(!d.finished||!evidenceReady(d)) return;
        const file=new Blob([evidenceFieldGuide(d,state.notes.evidence)],{type:'text/markdown;charset=utf-8'});
        const url=URL.createObjectURL(file);
        const link=document.createElement('a');
        link.href=url;link.download='my-evidence-field-guide.md';
        document.body.append(link);link.click();link.remove();
        setTimeout(()=>URL.revokeObjectURL(url),10000);
        break;
      }
    }
  });
  document.addEventListener('input',event=>{
    const field=event.target.dataset.studioField;
    if(!['name','days','reflection'].includes(field)) return;
    const d=evidenceDraft();
    d[field]=event.target.value.slice(0,field==='reflection'?1000:field==='name'?40:5);
    invalidate(d);refresh(d);
  });
  document.addEventListener('change',event=>{
    const field=event.target.dataset.studioField;
    if(!['conditions','decision'].includes(field)&&event.target.name!=='studio-claim') return;
    const d=evidenceDraft();
    if(event.target.name==='studio-claim') d.flags=[...document.querySelectorAll('[name="studio-claim"]:checked')].map(input=>input.value);
    else d[field]=event.target.value;
    invalidate(d);refresh(d);
  });
}
