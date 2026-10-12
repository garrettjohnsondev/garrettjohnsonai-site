// Fictional, device-local booking exercise. No calendar or messaging service runs.
export const OUTCOME_CRITERIA=[
  {id:'identity',label:'The original booking B-104 still belongs to Casey.'},
  {id:'time',label:'It is saved for Friday, October 9, at 2:00 PM.'},
  {id:'status',label:'It remains confirmed and 30 minutes long.'},
  {id:'single',label:'Casey has exactly one active booking for this call.'},
  {id:'message',label:'The AI writes a confident “all done” message.'},
];
export const OUTCOME_SLOTS={
  original:{day:'Thursday, October 8',time:'10:00 AM',date:'2026-10-08',clock:'10:00'},
  target:{day:'Friday, October 9',time:'2:00 PM',date:'2026-10-09',clock:'14:00'},
  later:{day:'Friday, October 9',time:'3:00 PM',date:'2026-10-09',clock:'15:00'},
};
export const newOutcomeDraft=()=>({version:1,stage:'brief',criteria:[],actions:[],viewedRevision:null,verdict:null,diagnosis:null,operation:'update',slot:null,review:null,attempts:0,transfer:null,reflection:'',finished:false});
export const validOutcomeAction=a=>!!a&&typeof a==='object'&&(a.type==='undo'||(['update','create'].includes(a.type)&&['target','later'].includes(a.slot)));
const copyRows=rows=>rows.map(r=>({...r}));
export function outcomeSnapshot(d={},revision=(d.actions||[]).length) {
  const actions=d.actions||[],end=Math.max(0,Math.min(Number.isInteger(revision)?revision:0,actions.length));
  let rows=[{id:'B-104',customer:'Casey Morgan',slot:'original',minutes:30,status:'Confirmed'}],serial=104;
  const undo=[];
  for(const a of actions.slice(0,end)) {
    if(!validOutcomeAction(a)) continue;
    if(a.type==='undo') {if(undo.length) rows=undo.pop();continue;}
    undo.push(copyRows(rows));
    if(a.type==='update') rows=rows.map(r=>r.id==='B-104'?{...r,slot:a.slot}:r);
    else rows.push({id:`B-${++serial}`,customer:'Casey Morgan',slot:a.slot,minutes:30,status:'Confirmed'});
  }
  return {rows,revision:end,canUndo:undo.length>0};
}
export function outcomeFacts(d={}) {
  const {rows}=outcomeSnapshot(d),original=rows.find(r=>r.id==='B-104');
  return [
    {id:'identity',label:'Original booking and customer',pass:original?.customer==='Casey Morgan',detail:'Keep Casey’s original B-104 booking.'},
    {id:'time',label:'Requested date and time',pass:original?.slot==='target',detail:'B-104 must be Friday, October 9, at 2:00 PM in America/Detroit.'},
    {id:'status',label:'Confirmed, 30-minute call',pass:original?.status==='Confirmed'&&original?.minutes===30,detail:'Keep the original confirmation status and 30-minute duration.'},
    {id:'single',label:'One active booking',pass:rows.length===1,detail:'A new booking does not replace the original. Undo the extra booking, then update B-104.'},
  ];
}
const criteriaComplete=criteria=>{
  const ids=new Set(criteria||[]);
  return ids.size===4&&['identity','time','status','single'].every(id=>ids.has(id));
};
export const outcomeSignature=(d={})=>JSON.stringify([[...new Set(d.criteria||[])].sort(),d.actions||[],d.viewedRevision,d.verdict]);
export function reviewOutcome(d={}) {
  const facts=outcomeFacts(d),matches=facts.every(f=>f.pass);
  const revision=(d.actions||[]).length,fresh=d.viewedRevision===revision;
  const checks=[
    {id:'criteria',label:'Define success in the saved system',pass:criteriaComplete(d.criteria),detail:'Select the original booking, requested time, confirmation and duration, and one active booking. A confident message is not proof.'},
    {id:'evidence',label:'Read the current saved record',pass:fresh,detail:'Inspect the saved bookings after the latest change. An earlier snapshot or an accepted request cannot verify the new result.'},
    {id:'judgment',label:'Match the conclusion to the record',pass:fresh&&d.verdict===(matches?'verified':'mismatch'),detail:!fresh?'Read the latest record before deciding.':matches?'Every required fact matches. This result can be marked verified.':'At least one required fact still differs. Mark the result as a mismatch and inspect the failed condition.'},
  ];
  const assessmentPass=checks.every(c=>c.pass);
  return {signature:outcomeSignature(d),revision,fresh,matches,assessmentPass,verified:assessmentPass&&matches,checks,facts};
}
export function outcomeDiagnosed(d) {
  if(!d?.diagnosis||d.diagnosis.viewedRevision!==0||d.diagnosis.verdict!=='mismatch') return false;
  return reviewOutcome({...newOutcomeDraft(),criteria:d.diagnosis.criteria,viewedRevision:0,verdict:'mismatch'}).assessmentPass;
}
export function outcomeReviewed(d) {
  return outcomeDiagnosed(d)&&!!d?.review?.verified&&d.review.signature===outcomeSignature(d)&&reviewOutcome(d).verified;
}
export const outcomeReady=d=>outcomeReviewed(d)&&d.transfer===1;
export function outcomeActionLabel(a) {
  if(a.type==='undo') return 'Undid the latest simulated change.';
  const slot=OUTCOME_SLOTS[a.slot];
  return `${a.type==='update'?'Updated B-104':'Created an additional booking'} for ${slot.day}, ${slot.time}.`;
}
export function outcomeFieldGuide(d,notes='') {
  const rows=outcomeSnapshot(d).rows;
  return `# My outcome verification guide\n\nGarrett Johnson AI · AI foundations\nFictional exercise: Harbor Studio / B-104\n\n## The request\n\nMove Casey Morgan’s existing B-104 call to Friday, October 9, 2026, at 2:00 PM. Keep it confirmed, 30 minutes long, with exactly one active booking. All times: America/Detroit.\n\n## The original claim\n\n“All set. Your appointment is now Friday at 2 pm.”\nThe initial saved booking still showed Thursday, October 8, at 10:00 AM.\n\n## The actions I tested\n\n${(d.actions||[]).map((a,i)=>`${i+1}. ${outcomeActionLabel(a)}`).join('\n')||'No simulated changes.'}\n\n## The final saved record\n\n${rows.map(r=>`${r.id} · ${r.customer}\n${OUTCOME_SLOTS[r.slot].day}, ${OUTCOME_SLOTS[r.slot].time} · America/Detroit\n${r.status} · ${r.minutes} minutes`).join('\n\n')}\n\nActive bookings: ${rows.length}\nRecord revision inspected: ${d.viewedRevision}\nConclusion: ${outcomeReviewed(d)?'Verified against every required condition.':'Not yet verified.'}\n\n## Reuse this verification checklist\n\n1. Define the exact result before the action: record identity, requested fields, status, and any limits.\n2. Find the system that owns that result. A completion message is a claim to check.\n3. Read the current record after the action. An old snapshot is not proof of a new change.\n4. Check for unintended effects: duplicates, changed ownership, or lost conditions.\n5. If it differs, report the mismatch, correct it within your authority, and read the record again.\n6. Say only what the evidence supports. Queued, saved, delivered, and read are different states.\n\n## My takeaway\n\n${String(d.reflection||'Before I say an AI-assisted task is done, inspect the saved result against the original request.').trim()}\n\n## My notes\n\n${String(notes||'No additional notes.').trim()}\n\nThis is a scripted, device-local exercise. No real booking was changed and no customer message was sent.\n`;
}
