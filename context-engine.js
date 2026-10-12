// Explicit teaching rules, not a model or a predictor of model behavior.
export const CONTEXT_CASES = {
  routine:{label:'The routine update',tag:'01',owner:'Maya',date:'confirmed',description:'The project has a named owner and a confirmed target date.'},
  exception:{label:'The missing detail',tag:'02',owner:null,date:'proposed',description:'The owner is unassigned and the new target is only proposed.'},
};
export const CONTEXT_FILES = [
  {id:'status',title:'Current project notes',label:'Updated today',icon:'document'},
  {id:'decisions',title:'Decision log',label:'Updated today',icon:'target'},
  {id:'archive',title:'Original launch plan',label:'Archived · superseded',icon:'clock'},
  {id:'newsletter',title:'Newsletter ideas',label:'Separate project',icon:'reply'},
];
export function contextFileText(id,caseId='routine') {
  const c=CONTEXT_CASES[caseId]||CONTEXT_CASES.routine;
  return {
    status:'Harbor website refresh: the homepage is ready. The booking form is blocked while the team waits for the business owner to approve its wording. The October 22 launch target has been replaced.',
    decisions:`Booking-form follow-up owner: ${c.owner||'not assigned'}. New launch target: October 29 (${c.date}). ${c.date==='proposed'?'The business owner has not confirmed the date.':'The business owner has confirmed the target date.'} A target date is not a guarantee of launch.`,
    archive:'Original plan: launch on October 22. This plan has been superseded; keep it for historical reference only.',
    newsletter:'Next month’s newsletter could feature staff introductions, autumn photos, and a customer interview. This is separate from the website refresh.',
  }[id]||'';
}
export const newContextDraft=()=>({version:1,stage:'brief',selected:[],format:'paragraph',boundary:'assume',activeCase:'routine',runs:{},attempts:0,transfer:null,reflection:'',finished:false});
export function contextSignature(d={}) { return JSON.stringify([[...new Set(d.selected||[])].sort(),d.format,d.boundary]); }
export function composeContextBrief(d={},caseId=d.activeCase||'routine') {
  const files=CONTEXT_FILES.filter(f=>(d.selected||[]).includes(f.id));
  return `TASK\nWrite a decision-ready update for the business owner of the Harbor website refresh. Help them see what is done, what happens next, and what needs their decision.\n\nEVIDENCE\n${files.length?files.map(f=>`${f.title}: ${contextFileText(f.id,caseId)}`).join('\n\n'):'[Add the source files this task needs.]'}\n\nOUTPUT\n${d.format==='structured'?'Use three labeled sections: Status, Next step, Decision needed. Keep each section to one or two sentences.':'Write a friendly paragraph about progress.'}\n\nWHEN DETAILS ARE MISSING\n${d.boundary==='ask'?'Use only the supplied evidence. Name missing details and ask for confirmation. Do not invent an owner or turn a proposed date into a commitment.':'Fill in reasonable missing details so the update feels complete.'}`;
}
export function runContextCase(d={},caseId='routine') {
  if(!CONTEXT_CASES[caseId]) throw new Error('Unknown teaching case');
  const selected=new Set(d.selected||[]),c=CONTEXT_CASES[caseId];
  const evidence=selected.has('status')&&selected.has('decisions');
  const current=!selected.has('archive'),focus=!selected.has('newsletter');
  const bounded=d.boundary==='ask',safe=caseId==='routine'||bounded;
  const checks=[
    {id:'evidence',label:'Supply the facts the job needs',pass:evidence,detail:'Include both the current project notes and the decision log. One describes progress; the other names ownership and the date’s status.'},
    {id:'current',label:'Remove superseded instructions',pass:current,detail:'Leave out the original launch plan. The current notes explicitly replace its October 22 target.'},
    {id:'focus',label:'Keep the packet relevant',pass:focus,detail:'Leave out the newsletter ideas. They add no evidence for this project update. More material does not automatically make a better brief.'},
    {id:'format',label:'Make the output useful to its reader',pass:d.format==='structured',detail:'Choose Status / Next step / Decision needed so the owner can find the action and decision quickly.'},
    {id:'uncertainty',label:caseId==='routine'?'Use the known owner and target':'Keep missing details visible',pass:evidence&&current&&safe,detail:caseId==='routine'?'The decision log names Maya and a confirmed October 29 target. A target still is not a guarantee.':'Choose “Name the gap and ask.” An unassigned owner and a proposed date must stay unresolved until someone confirms them.'},
  ];
  let output;
  if(!evidence) output='The source packet is incomplete. I need the current project notes and decision log to produce this update. This simulation pauses here; a real model may behave differently.';
  else if(!current) output='The packet contains two launch targets: October 22 in the superseded plan and October 29 in the decision log. Remove the obsolete plan before testing again. This simulation deliberately stops on conflicting context.';
  else {
    const next=c.owner?'Maya will follow up on approval of the booking-form wording.':bounded?'The follow-up owner is not assigned. Ask who will own the booking-form approval.':'Maya will follow up on approval of the booking-form wording.';
    const decision=c.date==='confirmed'?'Approve the booking-form wording. October 29 is the confirmed launch target, not a guarantee.':bounded?'Approve the booking-form wording and confirm whether October 29 should become the launch target. The date is currently only proposed.':'Approve the booking-form wording. The launch is confirmed for October 29.';
    output=d.format==='structured'?`Status\nThe homepage is ready. The booking form is blocked pending approval of its wording.\n\nNext step\n${next}\n\nDecision needed\n${decision}`:`The homepage is ready, and the booking form is waiting for wording approval. ${next} ${decision}`;
  }
  return {caseId,signature:contextSignature(d),pass:checks.every(c=>c.pass),checks,output};
}
export function contextCasePassed(d,caseId) {
  return !!d?.runs?.[caseId]?.pass&&d.runs[caseId].signature===contextSignature(d)&&runContextCase(d,caseId).pass;
}
export const contextReviewed=d=>Object.keys(CONTEXT_CASES).every(id=>contextCasePassed(d,id));
export const contextReady=d=>contextReviewed(d)&&d.transfer===1;
export function contextFieldGuide(d,notes='') {
  return `# My reusable AI brief\n\nGarrett Johnson AI · AI foundations\nFictional practice project: Harbor website refresh\n\n## My tested brief — missing-detail case\n\n${composeContextBrief(d,'exception')}\n\n## The simulated result\n\n${runContextCase(d,'exception').output}\n\n## Reuse this template\n\nTASK\nCreate [deliverable] for [reader] so they can [decision or action].\n\nEVIDENCE\n[Current, relevant source files, with dates and status.]\n[Task-specific facts, ownership, and known gaps.]\nLeave out superseded instructions and unrelated material.\n\nOUTPUT\n[Sections, length, and format that make the result useful.]\n\nWHEN DETAILS ARE MISSING\nUse the supplied evidence. Name the gap and ask for confirmation.\nDo not invent facts or turn a proposal into an approved decision.\n\nTEST BEFORE REUSE\nTry a routine case and a case with missing or conflicting facts. Inspect the output against the sources. A good brief is not a guarantee of reliable model behavior.\n\n## My takeaway\n\n${String(d.reflection||'Give the task, the relevant evidence, the output shape, and a rule for missing information.').trim()}\n\n## My notes\n\n${String(notes||'No additional notes.').trim()}\n\nThese outputs follow explicit teaching rules. They are not generated by a live AI model and do not predict how one will respond.\n`;
}
