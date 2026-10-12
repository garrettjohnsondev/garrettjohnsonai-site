import {state,persist,complete,saveMessage} from './state.js';
import {memberInfo,runMemberExercise} from './membership.js';
import {handoffDraft,handoffUi} from './handoff-lesson.js';
import {handoffSignature,handoffTested,handoffReady,handoffRulebook} from './handoff-engine.js';

export function installHandoffEvents({render,notify}) {
  const pack=()=>memberInfo.lesson?.id==='handoff'?memberInfo.lesson.studio||null:null;
  const save=()=>{
    persist();
    const el=document.querySelector('#hand-save-status');
    if(el) el.textContent=saveMessage();
  };
  const reveal=selector=>{
    const el=document.querySelector(selector);
    el?.focus({preventScroll:true});
    if(el) window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-108),behavior:'instant'});
  };
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-action^="hand-"]');
    if(!target||target.disabled) return;
    const p=pack();
    if(!p) return;
    const d=handoffDraft(p);
    switch(target.dataset.action) {
      case 'hand-stage': {
        const stage=target.dataset.stage;
        if(!['brief','practice','check','complete'].includes(stage)) return;
        if(stage==='complete'&&(!d.finished||!handoffReady(d))) return;
        d.stage=stage;handoffUi.error='';save();render();reveal('#hand-heading');break;
      }
      case 'hand-run': {
        if(handoffUi.running) return;
        // Stamp the result with exactly what was sent. Edits made while the
        // request runs leave the new rules untested.
        const signature=handoffSignature(d),rules={...d.rules},fields=[...d.fields];
        handoffUi.running=true;handoffUi.error='';render();
        try {
          const result=await runMemberExercise('handoff',{kind:'rules',rules,fields});
          const current=handoffDraft(p);
          current.test={signature,pass:result.pass===true,title:String(result.title||''),message:String(result.message||''),summary:result.summary||{},calls:Array.isArray(result.calls)?result.calls:[]};
          current.runs=(current.runs||0)+1;
          if(handoffTested(current)) state.practice.handoff=true;
          save();
        } catch(error) {handoffUi.error=error.message||'The calls could not run. Your rules are saved.';}
        finally {handoffUi.running=false;render();reveal(handoffUi.error?'#hand-results':'.hand-result');}
        break;
      }
      case 'hand-transfer': {
        const choice=Number(target.dataset.choice);
        if(!Number.isInteger(choice)||handoffUi.checking) return;
        handoffUi.checking=true;render();
        try {
          const result=await runMemberExercise('handoff',{kind:'transfer',choice});
          handoffDraft(p).transfer={choice:result.choice,pass:result.pass===true,title:String(result.title||''),message:String(result.message||'')};
          save();
        } catch(error) {notify(error.message||'That answer could not be checked. Try again.');}
        finally {handoffUi.checking=false;render();document.querySelector(`[data-action="hand-transfer"][data-choice="${choice}"]`)?.focus({preventScroll:true});}
        break;
      }
      case 'hand-complete': {
        if(!handoffReady(d)||!complete('handoff')) return;
        d.finished=true;d.stage='complete';save();render();reveal('#hand-heading');
        notify('Lesson complete. Your handoff rulebook is ready.');break;
      }
      case 'hand-copy': {
        if(!handoffReady(d)) return;
        const status=document.querySelector('#hand-copy-status');
        try {await navigator.clipboard.writeText(handoffRulebook(d,p,state.notes.handoff));if(status) status.textContent='Copied. Your rulebook is ready to paste.';}
        catch {if(status) status.textContent='Clipboard access is unavailable here. Select and copy the rulebook below.';document.querySelector('#hand-kit-text')?.focus();}
        break;
      }
      case 'hand-download': {
        if(!handoffReady(d)) return;
        const url=URL.createObjectURL(new Blob([handoffRulebook(d,p,state.notes.handoff)],{type:'text/markdown;charset=utf-8'}));
        const a=document.createElement('a');a.href=url;a.download=p.finish.file||'my-handoff-rulebook.md';document.body.append(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),10000);break;
      }
    }
  });
  document.addEventListener('change',event=>{
    const el=event.target,p=pack();
    if(!p) return;
    if(el.matches('select[data-hand-rule]')) {
      const row=el.dataset.handRule;
      if(!p.rows.some(r=>r.id===row)||!p.modes.some(m=>m.id===el.value)) return;
      handoffDraft(p).rules[row]=el.value;handoffUi.error='';save();render();
      document.querySelector(`select[data-hand-rule="${row}"]`)?.focus({preventScroll:true});
    } else if(el.matches('input[name="hand-field"]')) {
      const d=handoffDraft(p),id=el.value;
      if(!p.fields.some(f=>f.id===id)) return;
      const chosen=new Set(d.fields);
      if(el.checked) chosen.add(id);else chosen.delete(id);
      d.fields=p.fields.map(f=>f.id).filter(x=>chosen.has(x));handoffUi.error='';save();render();
      document.querySelector(`input[name="hand-field"][value="${id}"]`)?.focus({preventScroll:true});
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.dataset?.handField!=='reflection') return;
    const p=pack();
    if(!p) return;
    handoffDraft(p).reflection=event.target.value.slice(0,1000);save();
  });
}
