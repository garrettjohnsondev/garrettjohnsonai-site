// A deterministic teaching workflow. No model, payment, or external action runs.
export const WORKFLOW_STEPS={
  extract:{title:'Read the invoice',owner:'AI',icon:'document',detail:'Extract the vendor, amount, and order reference.'},
  validate:{title:'Check the fields',owner:'Rules',icon:'checklist',detail:'Check that every required field is present.'},
  approve:{title:'Request approval',owner:'Person',icon:'person',detail:'An authorized reviewer approves or rejects it.'},
  queue:{title:'Queue for payment',owner:'Tool',icon:'gate',detail:'Accept only checked invoices with human approval.'},
};
export const WORKFLOW_CASES={
  routine:{label:'Complete invoice',code:'INV-204',vendor:'Fieldwork Studio',amount:'$480.00',reference:'PO-118'},
  exception:{label:'Missing reference',code:'INV-205',vendor:'Fieldwork Studio',amount:'$480.00',reference:null},
};
export const newWorkflowDraft=()=>({version:1,stage:'brief',order:['extract','validate','queue','approve'],permission:'prepare',missing:'continue',activeCase:'routine',runs:{},attempts:0,transfer:null,reflection:'',finished:false});
export const validWorkflowOrder=order=>Array.isArray(order)&&order.length===4&&new Set(order).size===4&&order.every(id=>Object.hasOwn(WORKFLOW_STEPS,id));
export const workflowSignature=(d={})=>JSON.stringify([d.order,d.permission,d.missing]);
export function moveWorkflowStep(order,id,direction) {
  if(!validWorkflowOrder(order)||![-1,1].includes(direction)) return order;
  const index=order.indexOf(id),next=index+direction;
  if(index<0||next<0||next>=order.length) return [...order];
  const moved=[...order];[moved[index],moved[next]]=[moved[next],moved[index]];return moved;
}
export function runWorkflowCase(d={},caseId='routine',decision=null) {
  if(!Object.hasOwn(WORKFLOW_CASES,caseId)) throw new Error('Unknown workflow case');
  const c=WORKFLOW_CASES[caseId],order=validWorkflowOrder(d.order)?d.order:[];
  const signature=workflowSignature(d),trace=[];
  let extracted=false,validated=false,approval='Not requested',queueCount=0,handoff=null,outcome='blocked',halted=false,awaitingApproval=false;
  const actualDecision=['approve','reject'].includes(decision)?decision:null;
  for(const id of order) {
    const step={id,title:WORKFLOW_STEPS[id].title,status:'done',detail:''};
    if(halted) {trace.push({...step,status:'skipped',detail:'Not run. The workflow stopped earlier.'});continue;}
    if(id==='extract') {
      extracted=true;step.detail=`Read ${c.vendor}, ${c.amount}, and ${c.reference||'an empty order-reference field'}. No missing value is invented.`;
    } else if(id==='validate') {
      if(!extracted) {step.status='blocked';step.detail='No extracted fields to check. Read the invoice first.';halted=true;}
      else if(!c.reference&&d.missing==='handoff') {step.status='handoff';step.detail='Order reference missing. Stop and send the invoice plus the missing-field note to the finance coordinator.';handoff='Finance coordinator';outcome='handoff';halted=true;}
      else if(!c.reference) {step.status='warning';step.detail='Order reference missing. Your rule continues anyway; the invoice has not passed validation.';}
      else {validated=true;step.detail='Vendor, amount, and order reference are present. Ready for a human review.';}
    } else if(id==='approve') {
      if(!validated) {step.status='blocked';step.detail='Approval request blocked: the required fields have not passed their checks.';halted=true;}
      else if(d.permission==='approve') {approval='AI attempted approval';step.status='warning';step.detail='The AI marks its own draft approved. This does not count as an authorized human decision.';}
      else if(d.permission!=='prepare') {step.status='blocked';step.detail='Choose who may approve this request.';halted=true;}
      else if(actualDecision==='reject') {approval='Human rejected';step.status='blocked';step.detail='The reviewer rejected the invoice. Stop; nothing enters the payment queue.';outcome='rejected';halted=true;}
      else if(actualDecision==='approve') {approval='Human approved';step.detail='The reviewer approved this checked invoice. The workflow may continue.';}
      else {approval='Awaiting human';step.status='waiting';step.detail='Pause here. A person must review and decide before the tool can act.';outcome='waiting';awaitingApproval=true;halted=true;}
    } else if(id==='queue') {
      if(!validated||approval!=='Human approved') {step.status='blocked';step.detail=`The queue refuses the request: ${!validated?'required fields have not passed their checks':'there is no valid human approval'}. Nothing is queued.`;halted=true;}
      else {queueCount=1;outcome='queued';step.detail=`One simulated queue entry created for ${c.code}. Queued does not mean paid.`;}
    }
    trace.push(step);
  }
  const ordered=order.join(',')==='extract,validate,approve,queue';
  const checks=[
    {id:'order',label:'Put the steps in the right order',pass:ordered,detail:'Read, check, request approval, then queue. A blocked tool call protects the boundary but does not complete the workflow.'},
    {id:'authority',label:'Keep approval with a person',pass:d.permission==='prepare',detail:'Let AI prepare the invoice fields. Approval belongs to an authorized person, and the tool must check that approval.'},
    {id:'fields',label:caseId==='routine'?'Check the required fields':'Stop and assign the exception',pass:caseId==='routine'?validated:handoff==='Finance coordinator'&&d.missing==='handoff',detail:caseId==='routine'?'Read the invoice before checking its vendor, amount, and order reference.':'Choose “Stop and send to the finance coordinator.” Continuing with an empty reference is not a completed handoff.'},
    {id:'result',label:caseId==='routine'?'Test the approved branch':'Verify the handoff record',pass:caseId==='routine'?queueCount===1&&approval==='Human approved':queueCount===0&&outcome==='handoff',detail:caseId==='routine'?'A real pause needs a decision. Approve in this simulation to exercise the approved branch; rejection must leave the queue empty.':'The exception needs a named destination and no queue entry. Stopping without assigning the problem leaves work unresolved.'},
  ];
  return {caseId,signature,decision:actualDecision,trace,approval,queueCount,handoff,outcome,awaitingApproval,checks,pass:checks.every(c=>c.pass)};
}
export function workflowCasePassed(d,id) {
  const run=d?.runs?.[id];
  return !!run?.pass&&run.signature===workflowSignature(d)&&runWorkflowCase(d,id,run.decision).pass;
}
export const workflowReviewed=d=>Object.keys(WORKFLOW_CASES).every(id=>workflowCasePassed(d,id));
export const workflowReady=d=>workflowReviewed(d)&&d.transfer===1;
export function workflowFieldGuide(d,notes='') {
  return `# My workflow control map\n\nGarrett Johnson AI · AI foundations\nFictional exercise: Harbor invoice review\n\n## The route I built\n\n${d.order.map((id,i)=>`${i+1}. ${WORKFLOW_STEPS[id].title} — ${WORKFLOW_STEPS[id].owner}\n   ${WORKFLOW_STEPS[id].detail}`).join('\n\n')}\n\n## My boundaries\n\nAI: ${d.permission==='prepare'?'Prepare the fields only. A person approves.':'Prepare and attempt approval.'}\nMissing reference: ${d.missing==='handoff'?'Stop and send the invoice and missing-field note to the finance coordinator.':'Continue despite the missing field.'}\nTool: require passed field checks and valid human approval before queueing.\n\n## What I tested\n\n${Object.entries(WORKFLOW_CASES).map(([id,c])=>{const r=runWorkflowCase(d,id,d.runs?.[id]?.decision);return `${c.code} · ${c.label}\n- Outcome: ${r.outcome}\n- Approval: ${r.approval}\n- Queue entries: ${r.queueCount}\n- Handoff: ${r.handoff||'None'}`;}).join('\n\n')}\n\n## Reuse this control map\n\nJob: [What outcome is required?]\nRoute: [Which steps are known in advance?]\nAI role: [What may it read, draft, or investigate?]\nChecks: [What must be verified before continuing?]\nHuman decision: [Who can approve, reject, or grant an exception?]\nTool boundary: [What permission and evidence must the tool enforce?]\nException: [When does work stop, who receives it, and what do they receive?]\nProof: [Which saved record establishes the result?]\n\nIf the next step depends on findings, consider a bounded agent. Define allowed tools, data access, a run limit, and a human review point. A workflow can also contain an agent for one bounded step.\n\n## My takeaway\n\n${String(d.reflection||'Give AI the role the task needs. Enforce the approval boundary in the tool, not only in a prompt.').trim()}\n\n## My notes\n\n${String(notes||'No additional notes.').trim()}\n\nThese are scripted training results. No live model, payment, or external action ran. A queued invoice is not a completed payment. This is a narrow teaching example, not a production finance system.\n`;
}
