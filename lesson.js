import {memberInfo} from './membership.js';
import {accountInfo} from './account-runtime.js';
import { icon } from './icons.js';
import { lessons, trackFor } from './data.js';
import { state, e, arrow, hasAccess, isQuizPassed, canComplete, storageAvailable, saveMessage } from './state.js';
import { notFound } from './pages.js';
import { evidenceLesson } from './evidence-lesson.js';
import { contextLesson } from './context-lesson.js';
import { workflowLesson } from './workflow-lesson.js';
import { outcomeLesson } from './outcome-lesson.js';
import { handoffLesson } from './handoff-lesson.js';

export function lessonPage(id, step = 'understand') {
  if (id==='evidence') return evidenceLesson();
  if (id==='context') return contextLesson();
  if (id==='control') return workflowLesson();
  if (id==='outcome') return outcomeLesson();
  if (id==='handoff' && hasAccess(id) && memberInfo.lesson?.id==='handoff' && memberInfo.lesson.studio) return handoffLesson(memberInfo.lesson.studio);
  const lesson = lessons[id];
  if (!lesson) return notFound();
  const track = trackFor(lesson.track);
  const index = track.lessons.indexOf(id);
  const access = hasAccess(id) && memberInfo.lesson?.id===id;
  const activeStep = step === 'complete' ? 'check' : step;
  const sidebar = track.lessons.map((key,i)=>`<a href="#/lesson/${key}" class="${key===id ? 'active' : ''} ${state.completed.includes(key) ? 'done' : ''}" ${key===id ? 'aria-current="page"' : ''}><span>${state.completed.includes(key) ? icon('check') : String(i+1).padStart(2,'0')}</span>${lessons[key].short}</a>`).join('');
  return `<div class="lesson-top"><div class="wrap"><a class="back-link" href="#/path/${track.id}">${track.name}</a><span class="small">Lesson ${index+1} of ${track.lessons.length}</span></div></div><div class="wrap lesson-layout"><aside class="lesson-sidebar"><span class="eyebrow">Your learning path</span><h2>${track.name}</h2><nav aria-label="Lessons in this path">${sidebar}</nav><div class="sidebar-foot">Learn at your pace.<br>${e(saveMessage())}</div><a class="text-link" href="#/dashboard" style="font-size:12px">My learning</a></aside><article class="lesson-main"><details class="mobile-outline"><summary>Lesson ${index+1} of ${track.lessons.length} · View path</summary><nav aria-label="Lesson outline">${sidebar}</nav></details><div class="lesson-meta"><span class="pill ${track.access==='Free' ? 'pill-free' : ''}">${track.access}</span><span>About ${lesson.duration} minutes</span>${state.completed.includes(id) ? `<span class="completed-label">${icon('check')} Completed</span>` : ''}</div><h1>${lesson.title}</h1><p class="lesson-intro">${lesson.intro}</p>${access ? `<div class="lesson-tabs" role="tablist" aria-label="Lesson stages">${[['understand','Understand'],['practice','Practice'],['check','Check']].map(([key,title],i)=>`<button role="tab" id="tab-${key}" data-action="lesson-step" data-step="${key}" data-lesson="${id}" aria-controls="lesson-panel" aria-selected="${key===activeStep}" tabindex="${key===activeStep ? '0' : '-1'}"><span>${i===1&&state.practice[id] || i===2&&isQuizPassed(id) ? icon('check') : `0${i+1}`}</span>${title}</button>`).join('')}</div><div id="lesson-panel" class="lesson-content" role="tabpanel" aria-labelledby="tab-${activeStep}">${step === 'understand' ? understand(id) : step === 'practice' ? practice(id) : step === 'complete' ? celebration(id) : quiz(id)}</div>` : locked(id)}${access && step !== 'complete' ? `<label class="field notes-label">Your notes<textarea id="lesson-note" data-lesson="${id}" rows="3" maxlength="5000" placeholder="What would you use or check in your own work?">${e(state.notes[id] || '')}</textarea></label><p id="note-status" class="notes-status" aria-live="polite">${e(saveMessage())}</p>` : ''}</article></div>`;
}

function locked(id) {
  const waiting=memberInfo.loadingLesson===id;
  if(!accountInfo.enabled) return `<div class="locked-panel" style="margin-top:36px"><span class="eyebrow">A Member learning path</span><h2>Member opens soon.</h2><p>Business and team learning paths are part of Member. The four foundations lessons are free and open now.</p><div class="actions"><a class="btn btn-primary" href="#/path/foundations">Start the free lessons ${arrow}</a><a class="btn btn-secondary" href="#/plans">See the plans</a></div></div>`;
  return `<div class="locked-panel" style="margin-top:36px"><span class="eyebrow">A Member learning path</span><h2>${waiting?'Opening your lesson…':'Make room for deeper practice.'}</h2><p>${e(memberInfo.lessonError||'Business and team learning paths are part of Member. Your foundations lessons stay free.')}</p><div class="actions">${waiting?'':'<a class="btn btn-primary" href="#/membership">View membership '+arrow+'</a>'}<a class="btn btn-secondary" href="#/path/foundations">Continue with Free</a></div><p class="small muted" style="margin:22px 0 0">Membership is being tested. No live payments.</p></div>`;
}

function understand(id) {
  const l = lessons[id];
  const diagram = l.track === 'business' ? [['The job','Define the outcome'],['The cost','Include the checking'],['The decision','Test the assumptions']] : l.track === 'product' ? [['Evidence','Inspect the inputs'],['Behavior','Observe the system'],['Outcome','Verify the result']] : [['Ask','Give a clear task'],['Inspect','Check the evidence'],['Use','Verify the outcome']];
  return `<h2 class="lead-idea">${l.idea}</h2>${l.body.map(p=>`<p>${p}</p>`).join('')}<div class="concept-diagram" aria-label="${diagram.map(d=>d.join(': ')).join('. ')}">${diagram.map(([a,b],i)=>`${i ? `<span class="concept-arrow" aria-hidden="true">${icon('arrowRight')}</span>` : ''}<div class="concept-node">${a}<small>${b}</small></div>`).join('')}</div><div class="takeaway"><span>Keep this in mind</span><p>${l.takeaway}</p></div>${l.source ? `<p class="source-link">Further reading: <a href="${l.source[1]}" target="_blank" rel="noopener">${l.source[0]} ${icon('arrow')}</a></p>` : '<p class="source-link">A practical decision framework using fictional examples. Test assumptions in your own setting.</p>'}<div class="lesson-actions"><p>Now put the idea to work in a short exercise.</p><button class="btn btn-primary" data-action="lesson-step" data-lesson="${id}" data-step="practice">Try the practice ${arrow}</button></div>`;
}

const feedback=(result)=>result?`<div class="feedback ${result.pass?'correct':'incorrect'}" role="status"><strong>${e(result.title)}</strong><p>${e(result.message)}</p></div>`:'';
function practice(id){return memberInfo.lesson?.id===id?memberInfo.lesson.practiceHtml:'';}

function quiz(id) {
  const l = lessons[id], selected = state.quiz[id], passed = isQuizPassed(id);
  return `<div class="lab-label">Check your understanding <span class="simulation">One practical distinction</span></div><h2 class="quiz-question">${l.quiz.question}</h2><div class="choices">${l.quiz.choices.map((choice,i)=>`<button class="choice ${selected===i?'selected':''} ${passed && selected===i ? 'correct':''}" data-action="quiz" data-lesson="${id}" data-choice="${i}" aria-pressed="${selected===i}"><span class="letter">${String.fromCharCode(65+i)}</span>${choice}</button>`).join('')}</div>${selected!==undefined ? feedback({pass:passed,title:passed?'That’s the distinction.':'Take another look.',message:passed?l.quiz.explanation:'Look for what the available evidence actually establishes. You can revisit the explanation and try again.'}) : ''}${!state.practice[id] ? '<p class="quiz-prereq">Complete the practice exercise too. A correct answer on its own does not finish the lesson.</p>' : ''}<div class="lesson-actions"><button class="btn btn-secondary" data-action="lesson-step" data-lesson="${id}" data-step="${state.practice[id] ? 'understand':'practice'}">${state.practice[id]?'Review the idea':'Return to practice'}</button><button class="btn btn-primary" data-action="complete" data-lesson="${id}" ${canComplete(id)?'':'disabled'}>Complete lesson ${arrow}</button></div>`;
}

function celebration(id) {
  const l=lessons[id], track=trackFor(l.track), index=track.lessons.indexOf(id), next=track.lessons[index+1];
  const download=l.track==='business'?'automation-brief.md':l.track==='product'?'release-scorecard.csv':'evidence-checklist.md';
  return `<div class="success-panel"><div class="success-seal" aria-hidden="true">${icon('check')}</div><div class="eyebrow" style="margin-bottom:16px">Lesson completed</div><h2>That’s a skill worth keeping.</h2><p>${l.takeaway}</p><div class="actions">${next?`<a class="btn btn-primary" href="#/lesson/${next}">Next lesson ${arrow}</a>`:'<a class="btn btn-primary" href="#/dashboard">See your progress</a>'}<a class="btn btn-secondary" href="./downloads/${download}" download>Take the worksheet ${icon('download')}</a></div><p class="small muted" style="margin-top:24px;margin-bottom:0">${e(saveMessage())}</p></div><div class="lesson-actions"><a class="text-link" href="#/dashboard">My learning</a><button class="btn btn-quiet" data-action="lesson-step" data-step="understand" data-lesson="${id}">Revisit this lesson</button></div>`;
}
