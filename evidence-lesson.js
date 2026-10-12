import {state,e,storageAvailable} from './state.js';
import {icon} from './icons.js';
import {CASE_ID,CLAIMS,SOURCES,newEvidenceDraft,evidenceReviewed,evidenceReady,composeReply,evidenceFieldGuide} from './evidence-engine.js';

export function evidenceDraft() {
  let d=state.drafts.evidenceStudio;
  if (!d || d.version!==1 || typeof d!=='object') d=state.drafts.evidenceStudio=newEvidenceDraft();
  if (!['brief','practice','check','complete'].includes(d.stage)) d.stage='brief';
  d.opened=Array.isArray(d.opened)?d.opened.filter(x=>SOURCES[x]):[];
  d.flags=Array.isArray(d.flags)?d.flags.filter(x=>CLAIMS.some(c=>c.id===x)):[];
  return d;
}

const stageButton=(stage,text,primary=true)=>`<button class="btn btn-${primary?'primary':'secondary'}" data-action="studio-stage" data-stage="${stage}">${text}${icon(primary?'arrowRight':'arrowLeft')}</button>`;
const doneLabel=(done,number)=>done?icon('check'):`<span>${number}</span>`;

export function evidenceLesson() {
  const d=evidenceDraft();
  const stage=d.stage==='complete'&&!d.finished?'brief':d.stage;
  const ready=evidenceReviewed(d), complete=d.finished;
  const nav=[['brief','The brief','Know the job'],['practice','Your workspace','Inspect and repair'],['check','Prove it','Try a different case']];
  return `<div class="studio-top wrap"><a href="#/path/foundations" class="back-link">AI foundations</a><span>Lesson 01 / 04 <i></i> Free</span></div>
  <div class="wrap studio-layout">
    <aside class="studio-rail"><div class="studio-rail-title">Your first useful skill</div><nav aria-label="Lesson stages">${nav.map(([id,label,sub],i)=>`<button data-action="studio-stage" data-stage="${id}" ${stage===id?'aria-current="step"':''}><span class="studio-step-mark">${doneLabel(i===0?d.opened.length>0:i===1?ready:complete,`0${i+1}`)}</span><span><strong>${label}</strong><small>${sub}</small></span></button>`).join('')}</nav><div class="studio-rail-note">${icon('document')}<p>Make a corrected reply.<br>Keep your field guide.</p></div><a class="text-link" href="#/dashboard">My learning</a></aside>
    <article class="studio-main">
      <header class="studio-heading"><div class="studio-meta"><span class="pill pill-free">Foundations</span><span>${icon('clock')} About 7 minutes</span><span class="studio-simulation">Fictional practice case</span></div><h1 id="studio-heading" tabindex="-1">${stage==='brief'?'Check the source.<br><span>Fix the answer.</span>':stage==='practice'?'A better answer starts here.':stage==='check'?'Different case. Same skill.':'A skill you can take with you.'}</h1><p>${stage==='brief'?'Turn a convincing AI draft into a reply you can support with evidence.':stage==='practice'?'Open the evidence, question the claims, then build a corrected reply.':stage==='check'?'Use what you learned when the facts and the setting change.':'You inspected the source, repaired the reply, and tested your judgment.'}</p></header>
      <div class="studio-mobile-stages" aria-label="Lesson stages on mobile">${nav.map(([id,label],i)=>`<button data-action="studio-stage" data-stage="${id}" ${stage===id?'aria-current="step"':''}><span>0${i+1}</span>${label}</button>`).join('')}</div>
      ${d.finished&&evidenceReady(d)&&stage!=='complete'?`<div class="studio-completed-shortcut"><span>You’ve completed this lesson.</span><button class="text-link" data-action="studio-stage" data-stage="complete">Open your field guide</button></div>`:''}
      ${stage==='brief'?brief(d):stage==='practice'?workspace(d):stage==='check'?transfer(d):finish(d)}
      ${stage!=='complete'?`<details class="studio-notes"><summary>Your private notes <span>Saved with your work</span></summary><label class="field">What would you use in your own work?<textarea id="lesson-note" data-lesson="evidence" rows="3" maxlength="5000" placeholder="A question, a reminder, or something to try…">${e(state.notes.evidence||'')}</textarea></label><p id="note-status" class="notes-status" aria-live="polite">${storageAvailable?'Notes stay in this browser.':'Storage is unavailable. Notes last for this visit only.'}</p></details>`:''}
      <div class="studio-save"><span id="studio-save-status" role="status">${storageAvailable?'Your work saves automatically on this device.':'Storage is unavailable. Your work lasts for this visit only.'}</span><span>Simulation · no live AI calls</span></div>
    </article>
  </div>`;
}

function brief(d) {
  return `<div class="studio-intro-grid"><section class="studio-principle"><span class="eyebrow">The idea, in a minute</span><h2>A polished answer<br>is still a draft.</h2><p>AI can write a helpful-sounding reply while using an old rule or claiming something that never happened.</p><p>Your job is to connect each important claim to evidence. A source needs to apply to the question, be current, and actually support the answer.</p><div class="studio-guide"><img src="./assets/headshot.jpg" width="36" height="36" alt="Garrett Johnson"><p>A habit worth keeping: check what the answer is based on before you act on it.<span>Garrett · Your guide</span></p></div></section>
  <section class="studio-case-paper"><div class="studio-paper-top">Your assignment <span>CASE 017</span></div><div class="studio-paper-icon">${icon('reply')}</div><h2>Help Alex<br>with a return.</h2><p>A customer has a question. AI has drafted a reply. You have the policy files.</p><div class="studio-deliverable"><span>You’ll make</span><strong>A corrected customer reply</strong><small>Plus a field guide with the checks you used.</small></div>${stageButton('practice',d.opened.length?'Resume your workspace':'Open the case file')}</section></div>
  <section class="studio-method"><div class="studio-section-label">Three questions to keep</div><div class="studio-method-grid">${[['document','Does it apply?','Check the source matches this task.'],['clock','Is it current?','Find the version that governs now.'],['check','Does it support the claim?','Compare the words, conditions, and limits.']].map(([shape,title,body])=>`<div>${icon(shape)}<h3>${title}</h3><p>${body}</p></div>`).join('')}</div></section>
  <div class="studio-brief-foot"><span>Read, try, and learn at your pace. No timer or account required.</span><a href="./downloads/northline-case-017.md" download class="text-link">Download the case files</a></div>`;
}

function workspace(d) {
  return `<div class="studio-case-context"><div><span class="studio-section-label">${CASE_ID}</span><h2>The customer’s question</h2></div><blockquote>“I bought a desk lamp 18 days ago. It’s unused and I have the receipt. Can I return it?”<cite>Alex · Northline customer</cite></blockquote></div>
  <div class="studio-bench">
    <section class="studio-panel"><div class="studio-panel-heading"><span class="studio-step-number">01</span><div><h2>Inspect the evidence</h2><p>Open a policy. Decide which one to use.</p></div></div>
      <div class="studio-files">${Object.entries(SOURCES).map(([key,doc])=>`<button class="studio-file ${d.activeDoc===key?'active':''}" data-action="studio-document" data-document="${key}" aria-expanded="${d.activeDoc===key}" aria-controls="studio-document"><span class="studio-file-icon">${icon('document')}</span><span><strong>${doc.title}</strong><small>${doc.version}</small></span><span class="studio-file-state">${d.source===key?icon('check'):icon('arrowRight')}</span></button>`).join('')}</div>
      <div id="studio-document">${documentPanel(d)}</div>
    </section>
    <section class="studio-panel"><div class="studio-panel-heading"><span class="studio-step-number">02</span><div><h2>Question the draft</h2><p>Mark every statement the evidence does not support.</p></div></div><div class="studio-draft-label">AI draft <span>Based on RET-2024</span></div><fieldset class="studio-claims"><legend class="sr-only">Statements that need correcting</legend>${CLAIMS.map(c=>`<label class="studio-claim"><input type="checkbox" name="studio-claim" value="${c.id}" ${d.flags.includes(c.id)?'checked':''}><span>${c.text}</span></label>`).join('')}</fieldset><p class="studio-help">Marking a statement means “this needs a correction.” Leave supported statements unmarked.</p><div class="studio-reminder">${icon('question')}<p>A policy tells you the rules.<br>Does it prove that a refund happened?</p></div></section>
  </div>
  <section class="studio-rewrite"><div class="studio-panel-heading"><span class="studio-step-number">03</span><div><h2>Make the reply yours</h2><p>Edit the policy fields. Your customer reply updates as you work.</p></div></div><div class="studio-rewrite-grid"><div class="studio-editor"><label class="field">Customer’s first name<input data-studio-field="name" value="${e(d.name)}" maxlength="40" autocomplete="off"></label><label class="field">Return window, in days<input type="number" inputmode="numeric" min="1" max="365" step="1" data-studio-field="days" value="${e(d.days)}"></label>${selectField('conditions','What does the customer need?',[['unused-receipt','An unused item and a receipt'],['receipt','A receipt; any item condition'],['any','No conditions or proof of purchase']],d.conditions)}${selectField('decision','What can you promise?',[['approved','The refund is already approved'],['review','The store will review a return request'],['automatic','A refund will be issued automatically']],d.decision)}<p class="studio-help">Changing the wording starts with getting these facts right.</p></div><div class="studio-reply-paper"><div class="studio-paper-top">Your reply <span>LIVE PREVIEW</span></div><div id="studio-reply-preview">${replyPreview(d)}</div></div></div><div class="studio-review-action"><p>Check your evidence and reply against this case’s policy.</p><button class="btn btn-primary" data-action="studio-review">Review my work ${icon('arrowRight')}</button></div><div id="studio-review-result" aria-live="polite">${reviewPanel(d)}</div></section>`;
}

function documentPanel(d) {
  const doc=SOURCES[d.activeDoc];
  if (!doc) return `<div class="studio-document-empty">${icon('document')}<strong>Start with a source.</strong><p>Choose a file above to inspect its terms and version.</p></div>`;
  return `<div class="studio-document-body"><div class="studio-document-code">${doc.code} <span>${d.activeDoc==='current'?'Governing policy':'Archived'}</span></div><h3>${doc.title}</h3><p class="studio-document-date">${doc.date}</p><ol>${doc.body.map(p=>`<li>${p}</li>`).join('')}</ol><button class="btn btn-secondary btn-block" data-action="studio-use-source" data-document="${d.activeDoc}">${d.source===d.activeDoc?icon('check')+' Source selected':'Use this source '+icon('arrowRight')}</button></div>`;
}
function selectField(name,label,options,value) {
  return `<label class="field">${label}<select data-studio-field="${name}">${options.map(([id,text])=>`<option value="${id}" ${id===value?'selected':''}>${text}</option>`).join('')}</select></label>`;
}
export function replyPreview(d) {
  return `<div class="studio-composed-reply">${e(composeReply(d)).split('\n\n').map(p=>`<p>${p}</p>`).join('')}</div>`;
}
export function reviewPanel(d) {
  if (!d.review) return d.attempts?'<p class="studio-recheck">Your work changed. Review it again to update the checks.</p>':'';
  const r=d.review;
  return `<section class="studio-review-result ${r.pass?'passed':''}" tabindex="-1"><div class="studio-review-title">${icon(r.pass?'check':'alert')}<div><h3>${r.pass?'Your policy checks pass.':'A few things need another look.'}</h3><p>${r.checks.filter(c=>c.pass).length} of ${r.checks.length} checks passed. ${r.pass?'Now try the same skill in a different situation.':'Use the feedback, edit your work, and check again.'}</p></div></div><ul>${r.checks.map(c=>`<li class="${c.pass?'passed':'needs-work'}">${icon(c.pass?'check':'alert')}<div><strong>${c.label}</strong>${!c.pass?`<p>${c.detail}</p>`:''}</div><span>${c.pass?'Passed':'Revisit'}</span></li>`).join('')}</ul>${r.pass?stageButton('check','Try the next challenge'):''}<p class="studio-help">These checks cover the policy fields in this fictional exercise. Nothing is sent to a customer.</p></section>`;
}

function transfer(d) {
  const choice=d.transfer, correct=choice===1, practiced=evidenceReviewed(d);
  return `<section class="studio-transfer"><div class="studio-section-label">A fresh situation</div><h2>Would you approve this trip?</h2><p class="studio-transfer-intro">You’re reviewing an AI summary of a company’s travel policy.</p><div class="studio-transfer-facts"><div><span>The current policy says</span><p>Every trip requires a manager’s approval.</p></div><div><span>The AI summary says</span><p>“Trips under $500 are automatically approved.”</p></div></div><fieldset class="studio-transfer-options"><legend>What should you do?</legend>${['Use the summary. The trip costs less than $500.','Correct the summary and keep the required manager approval.','Ask the AI to repeat the answer until it sounds consistent.'].map((text,i)=>`<button class="choice ${choice===i?'selected':''} ${correct&&choice===i?'correct':''}" data-action="studio-transfer" data-choice="${i}" aria-pressed="${choice===i}"><span class="letter">${String.fromCharCode(65+i)}</span>${text}</button>`).join('')}</fieldset>${choice!==null?`<div class="feedback ${correct?'correct':'incorrect'}" role="status"><strong>${correct?'You carried the skill into a new situation.':'Compare the claim with the actual rule.'}</strong><p>${correct?'The summary invents an exception and removes an approval. You used the governing policy to preserve the real requirement.':'The policy requires approval for every trip. A lower cost or a repeated answer does not create an exception.'}</p></div>`:''}
  <div class="studio-reflection"><label class="field">Where could you use this habit? <span>Optional</span><textarea data-studio-field="reflection" maxlength="1000" rows="3" placeholder="Before I use an AI answer to…">${e(d.reflection||'')}</textarea></label><p>This goes into your field guide. It isn’t scored.</p></div>
  ${!practiced?'<p class="studio-prerequisite">Finish the evidence checks in your workspace before completing the lesson.</p>':''}
  <div class="studio-stage-actions">${stageButton('practice','Back to your workspace',false)}<button class="btn btn-primary" data-action="studio-complete" ${evidenceReady(d)?'':'disabled'}>Complete lesson ${icon('check')}</button></div></section>`;
}

function finish(d) {
  return `<section class="studio-finish"><div class="studio-finish-seal">${icon('flag')}</div><span class="eyebrow">Lesson complete</span><h2>You did more than<br>spot the mistake.</h2><p>You chose the governing policy, corrected two unsupported claims, and kept the approval decision with the store.</p><div class="studio-finish-proof"><span>${icon('check')} Evidence inspected</span><span>${icon('check')} Reply repaired</span><span>${icon('check')} New case resolved</span></div></section><section class="studio-field-guide"><div class="studio-field-guide-copy"><span class="eyebrow">Made by you</span><h2>Your evidence<br>field guide.</h2><p>Your corrected reply, the source you used, your personal takeaway, and a checklist to use again.</p><button class="btn btn-primary" data-action="studio-download">Download your field guide ${icon('download')}</button><p class="studio-help">Editable Markdown file · opens in any text editor</p><details class="studio-guide-preview"><summary>Preview your field guide</summary><pre>${e(evidenceFieldGuide(d,state.notes.evidence))}</pre></details></div><div class="studio-reply-paper"><div class="studio-paper-top">Your finished reply <span>CASE 017</span></div>${replyPreview(d)}</div></section><div class="studio-next"><div><span>Next in AI foundations</span><h3>Give AI a better brief.</h3><p>You’ve learned to check the output. Next, improve what goes in.</p></div><a class="btn btn-primary" href="#/lesson/context">Continue learning ${icon('arrowRight')}</a></div><div class="studio-stage-actions"><button class="text-link" data-action="studio-stage" data-stage="practice">Revisit your work</button><a class="text-link" href="#/dashboard">See your progress</a></div>`;
}
