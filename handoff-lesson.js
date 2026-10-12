import {state,e,saveMessage} from './state.js';
import {tracks,lessons} from './data.js';
import {icon} from './icons.js';
import {HANDOFF_DRAFT_KEY,cleanHandoffDraft,handoffTested,handoffStale,handoffReady,handoffRulebook} from './handoff-engine.js';

// Request state that must never be saved with learner progress.
export const handoffUi={running:false,checking:false,error:''};

export function handoffDraft(pack) {
  const d=cleanHandoffDraft(state.drafts[HANDOFF_DRAFT_KEY],pack);
  state.drafts[HANDOFF_DRAFT_KEY]=d;
  return d;
}

const STAGES=['brief','practice','check'];
const pad=n=>String(n).padStart(2,'0');
const VERDICTS={ok:'Handled',missed:'Emergency waited',overreach:'Unapproved promise',dropped:'Went nowhere',escalated:'Unneeded handoff',incomplete:'Missing details'};
const stageButton=(stage,label,primary=true)=>`<button class="btn btn-${primary?'primary':'secondary'}" data-action="hand-stage" data-stage="${stage}">${primary?'':icon('arrowLeft')}${label}${primary?icon('arrowRight'):''}</button>`;
const twoLines=lines=>`${e(lines[0])}<br><span>${e(lines[1])}</span>`;

export function handoffLesson(pack) {
  const d=handoffDraft(pack),tested=handoffTested(d),ready=handoffReady(d);
  if(d.stage==='complete'&&(!d.finished||!ready)) d.stage='practice';
  const stage=d.stage,copy=pack.stages[stage];
  const track=tracks.find(t=>t.id==='business'),index=track.lessons.indexOf('handoff');
  const marks=[d.runs>0,tested,d.finished&&ready];
  return `<div class="studio-top wrap"><a class="back-link" href="#/path/business">${e(track.name)}</a><span>Lesson ${pad(index+1)} / ${pad(track.lessons.length)} <i></i> Member</span></div><div class="wrap studio-layout hand-studio"><aside class="studio-rail"><div class="studio-rail-title">A Member lab</div><nav aria-label="Lesson stages">${STAGES.map((id,i)=>`<button data-action="hand-stage" data-stage="${id}" ${stage===id?'aria-current="step"':''}><span class="studio-step-mark">${marks[i]?icon('check'):`<span>0${i+1}</span>`}</span><span><strong>${e(pack.stages[id].label)}</strong><small>${e(pack.stages[id].sub)}</small></span></button>`).join('')}</nav><div class="studio-rail-note">${icon('gate')}<p>${pack.rail.map(e).join('<br>')}</p></div><a class="text-link" href="#/dashboard">My learning</a></aside>
  <article class="studio-main"><header class="studio-heading"><div class="studio-meta"><span class="pill">Member</span><span>${icon('clock')} About ${lessons.handoff.duration} minutes</span><span class="studio-simulation">Fictional business · scripted calls</span></div><h1 id="hand-heading" tabindex="-1">${twoLines(copy.title)}</h1><p>${e(copy.intro)}</p></header><div class="studio-mobile-stages" aria-label="Lesson stages on mobile">${STAGES.map((id,i)=>`<button data-action="hand-stage" data-stage="${id}" ${stage===id?'aria-current="step"':''}><span>0${i+1}</span>${e(pack.stages[id].label)}</button>`).join('')}</div>
  ${d.finished&&ready&&stage!=='complete'?'<div class="studio-completed-shortcut"><span>You’ve completed this lesson.</span><button class="text-link" data-action="hand-stage" data-stage="complete">Open your rulebook</button></div>':''}
  ${stage==='brief'?brief(pack,d):stage==='practice'?workspace(pack,d):stage==='check'?transfer(pack,d):finish(pack,d)}
  ${stage!=='complete'?`<details class="studio-notes"><summary>Your private notes <span>Saved with your work</span></summary><label class="field">What would you use in your own business?<textarea id="lesson-note" data-lesson="handoff" rows="3" maxlength="5000" placeholder="A question, a reminder, or something to try…">${e(state.notes.handoff||'')}</textarea></label><p id="note-status" class="notes-status" aria-live="polite">${e(saveMessage())}</p></details>`:''}
  <div class="studio-save"><span id="hand-save-status" role="status">${e(saveMessage())}</span><span>Simulation · no live calls</span></div></article></div>`;
}

function brief(pack,d) {
  const p=pack.principle,a=pack.assignment;
  return `<div class="studio-intro-grid"><section class="studio-principle"><span class="eyebrow">The idea, in a minute</span><h2>${e(p.heading[0])}<br>${e(p.heading[1])}</h2>${p.paragraphs.map(t=>`<p>${e(t)}</p>`).join('')}<div class="studio-guide"><img src="./assets/headshot.jpg" width="36" height="36" alt="Garrett Johnson"><p>${e(p.guide)}<span>Garrett · Your guide</span></p></div></section><section class="studio-case-paper"><div class="studio-paper-top">${e(a.label)} <span>${e(a.tag)}</span></div><div class="studio-paper-icon">${icon('route')}</div><h2>${e(a.title)}</h2><p>${e(a.text)}</p><div class="studio-deliverable"><span>You’ll make</span><strong>${e(a.makes)}</strong><small>${e(a.makesSub)}</small></div><button class="btn" data-action="hand-stage" data-stage="practice">${d.runs?'Resume your rules':'Open the case file'} ${icon('arrowRight')}</button></section></div>
  <section class="studio-method"><span class="studio-section-label">Three parts of every handoff</span><div class="studio-method-grid">${p.parts.map(part=>`<div>${icon(part.icon)}<h3>${e(part.title)}</h3><p>${e(part.text)}</p></div>`).join('')}</div></section><div class="studio-brief-foot"><span>Work at your own pace. Your rules save with your account.</span><span>Simulation · no live calls</span></div>`;
}

function caseFile(pack) {
  const b=pack.business;
  return `<div class="hand-case-head"><div><span class="studio-section-label">The case file</span><h2>${e(b.name)}</h2><p>${e(b.place)}</p></div></div><dl class="hand-facts">${b.facts.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl><div class="hand-policies"><h3>Policies</h3><ul>${b.policies.map(t=>`<li>${icon('document')}<span>${e(t)}</span></li>`).join('')}</ul></div>`;
}

function workspace(pack,d) {
  const s=pack.sections,stale=handoffStale(d);
  return `<section class="hand-case" aria-label="Case file">${caseFile(pack)}</section>
  <section class="hand-block"><div class="hand-section-heading"><span class="studio-step-number">01</span><div><h2>${e(s.rules.title)}</h2><p>${e(s.rules.text)}</p></div></div><div class="hand-wizard">${icon('note')}<div><span>The setup wizard’s instruction</span><q>${e(pack.wizard)}</q></div></div><div class="hand-rule-list">${pack.rows.map(r=>`<div class="hand-rule"><div class="hand-rule-text"><strong id="hand-rule-${e(r.id)}">${e(r.label)}</strong><span>${e(r.example)}</span></div><label class="hand-rule-select"><span class="sr-only">What the assistant may do</span><select data-hand-rule="${e(r.id)}" aria-describedby="hand-rule-${e(r.id)}">${pack.modes.map(m=>`<option value="${e(m.id)}" ${d.rules[r.id]===m.id?'selected':''}>${e(m.label)}</option>`).join('')}</select></label></div>`).join('')}</div></section>
  <section class="hand-block"><div class="hand-section-heading"><span class="studio-step-number">02</span><div><h2>${e(s.fields.title)}</h2><p>${e(s.fields.text)}</p></div></div><fieldset class="hand-fields"><legend class="sr-only">Information included in every handoff</legend>${pack.fields.map(f=>`<label class="studio-claim"><input type="checkbox" name="hand-field" value="${e(f.id)}" ${d.fields.includes(f.id)?'checked':''}><span>${e(f.label)}</span></label>`).join('')}</fieldset></section>
  <section class="hand-block"><div class="hand-section-heading"><span class="studio-step-number">03</span><div><h2 id="hand-run-heading" tabindex="-1">${e(s.run.title)}</h2><p>${e(s.run.text)}</p></div></div><div class="hand-run-action"><button class="btn btn-primary" data-action="hand-run" ${handoffUi.running?'disabled aria-busy="true"':''}>${handoffUi.running?'Running the calls…':e(s.run.button)} ${icon('play')}</button>${stale?'<p class="hand-stale" role="status">You changed the rules after this run. Run the calls again to test them.</p>':''}</div><div id="hand-results" aria-live="polite">${results(pack,d)}</div></section>`;
}

function results(pack,d) {
  if(handoffUi.error) return `<p class="hand-error" role="alert">${icon('alert')}<span>${e(handoffUi.error)}</span></p>`;
  const t=d.test;
  if(!t) return '<p class="studio-help">No calls run yet. Your results appear here, call by call.</p>';
  const stale=handoffStale(d),call=id=>pack.calls.find(c=>c.id===id),mode=id=>pack.modes.find(m=>m.id===id)?.short||'';
  const metric=m=>{const value=Number(t.summary[m.id])||0;return `<div class="hand-metric ${value===m.target?'on-target':'off-target'}"><strong>${value}</strong><span>${e(m.label)}</span><small>Target ${m.target}</small></div>`;};
  return `<div class="studio-review-result hand-result ${t.pass&&!stale?'passed':''} ${stale?'is-stale':''}" tabindex="-1"><div class="studio-review-title">${icon(t.pass?'check':'alert')}<div><h3>${e(t.title)}</h3><p>${e(t.message)}</p></div></div><div class="hand-metrics">${pack.metrics.map(metric).join('')}</div><ol class="hand-calls">${t.calls.map(r=>{const c=call(r.id);if(!c) return '';return `<li class="hand-call verdict-${e(r.verdict)}"><div class="hand-call-head"><span>${e(c.time)} · ${e(c.caller)}, ${e(c.town)}</span><em>${e(VERDICTS[r.verdict]||r.verdict)}</em></div><blockquote>“${e(c.text)}”</blockquote><p class="hand-call-rule">Your rule: ${e(mode(r.mode))}</p><p>${e(r.did)}</p>${r.note?`<p class="hand-call-note">${icon('alert')}<span>${e(r.note)}</span></p>`:''}</li>`;}).join('')}</ol>${t.pass&&!stale?`<div class="hand-next"><p>Every call is covered. One more call is waiting.</p>${stageButton('check','Take the next call')}</div>`:''}</div>`;
}

function transfer(pack,d) {
  const t=pack.transfer,tested=handoffTested(d),ready=handoffReady(d);
  return `<section class="studio-transfer hand-transfer"><span class="studio-section-label">A new call · ${e(t.time)}</span><blockquote class="hand-transfer-call">“${e(t.text)}”<cite>${e(t.caller)}, ${e(t.town)}</cite></blockquote><h2>${e(t.question)}</h2>${tested?'':'<p class="studio-prerequisite">You can answer now. The lesson completes once your rules also pass Saturday night.</p>'}<details class="hand-case-recall"><summary>Look at the case file again</summary><div class="hand-case">${caseFile(pack)}</div></details><fieldset class="studio-transfer-options"><legend>Choose what the assistant does</legend>${t.options.map((o,i)=>`<button class="choice ${d.transfer?.choice===i?'selected':''} ${d.transfer?.choice===i&&d.transfer.pass?'correct':''}" data-action="hand-transfer" data-choice="${i}" aria-pressed="${d.transfer?.choice===i}" ${handoffUi.checking?'disabled':''}><span class="letter">${'ABC'[i]}</span>${e(o)}</button>`).join('')}</fieldset>${d.transfer?`<div class="feedback ${d.transfer.pass?'correct':'incorrect'}" role="status"><strong>${e(d.transfer.title)}</strong><p>${e(d.transfer.message)}</p></div>`:''}<div class="studio-reflection"><label class="field">${e(pack.reflection.label)}<span>Optional</span><textarea data-hand-field="reflection" rows="3" maxlength="1000" placeholder="${e(pack.reflection.placeholder)}">${e(d.reflection)}</textarea></label><p>Saved with your rulebook.</p></div><div class="studio-stage-actions">${stageButton('practice','Back to your rules',false)}<button class="btn btn-primary" data-action="hand-complete" ${ready?'':'disabled'}>Complete lesson ${icon('arrowRight')}</button></div></section>`;
}

function finish(pack,d) {
  const f=pack.finish,track=tracks.find(t=>t.id==='business'),next=track.lessons[track.lessons.indexOf('handoff')+1];
  return `<section class="studio-finish"><div class="studio-finish-seal">${icon('check')}</div><span class="eyebrow">${e(f.eyebrow)}</span><h2>${e(f.heading)}</h2><p>${e(f.text)}</p><div class="studio-finish-proof">${f.proof.map(p=>`<span>${icon('check')}${e(p)}</span>`).join('')}</div></section><section class="studio-field-guide"><div class="studio-field-guide-copy"><span class="studio-section-label">Keep it</span><h2>${e(f.kitTitle)}</h2><p>${e(f.kitText)}</p><button class="btn btn-primary" data-action="hand-download">Download the rulebook ${icon('download')}</button><p><button class="text-link" data-action="hand-copy">Copy it instead</button></p><p id="hand-copy-status" class="studio-help" aria-live="polite"></p></div><details class="studio-guide-preview" open><summary>Preview your rulebook</summary><pre id="hand-kit-text" tabindex="0">${e(handoffRulebook(d,pack,state.notes.handoff))}</pre></details></section>${next?`<section class="studio-next"><div><span>Next in ${e(track.name)}</span><h3>${e(lessons[next].short)}</h3><p>${e(lessons[next].intro)}</p></div><a class="btn btn-primary" href="#/lesson/${next}">Next lesson ${icon('arrowRight')}</a></section>`:''}`;
}
