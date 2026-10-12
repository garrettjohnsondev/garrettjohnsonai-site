// A bounded teaching exercise. Checks validate structured policy fields only.
// No model calls, natural-language grading, or real customer actions.
export const CASE_ID = 'NORTHLINE / 017';
export const CLAIMS = [
  { id:'window', text:'You have 60 days to return it.' },
  { id:'receipt', text:'Unused items need a receipt.' },
  { id:'approval', text:'Your refund is already approved.' },
];
export const SOURCES = {
  current: { title:'Returns policy', version:'2026 · Active', code:'RET-2026', date:'Effective January 1, 2026', body:[
    'Return requests must be made within 30 days of purchase.',
    'Items must be unused and accompanied by a receipt.',
    'The store reviews each request before approving a refund. This policy is not an approval for any individual purchase.',
  ] },
  archive: { title:'Returns policy', version:'2024 · Archived', code:'RET-2024', date:'Replaced by RET-2026', body:[
    'Return requests must be made within 60 days of purchase.',
    'Items must be unused and accompanied by a receipt.',
    'The store reviews each request before approving a refund. This document is retained for reference and no longer governs new requests.',
  ] },
};
export const newEvidenceDraft = () => ({version:1,stage:'brief',opened:[],activeDoc:null,source:null,flags:[],days:'60',conditions:'unused-receipt',decision:'approved',name:'Alex',review:null,attempts:0,transfer:null,reflection:'',finished:false});

export function evidenceSignature(d = {}) {
  return JSON.stringify([d.source, (d.opened||[]).includes('current'), [...new Set(d.flags||[])].sort(), String(d.days), d.conditions, d.decision]);
}
export function reviewEvidence(d = {}) {
  const flags = new Set(d.flags || []);
  const checks = [
    {id:'source',label:'Use the governing source',pass:d.source==='current'&&(d.opened||[]).includes('current'),detail:'Open and cite RET-2026. The 2024 policy has been replaced.'},
    {id:'claims',label:'Separate supported and unsupported claims',pass:flags.size===2&&flags.has('window')&&flags.has('approval'),detail:'Flag the 60-day window and the claimed refund approval. The receipt requirement is supported.'},
    {id:'window',label:'Correct the return window',pass:String(d.days||'').trim()!==''&&Number(d.days)===30,detail:'RET-2026 allows 30 days from purchase, not 60.'},
    {id:'conditions',label:'Keep the policy’s conditions',pass:d.conditions==='unused-receipt',detail:'The item must be unused, and the customer needs a receipt.'},
    {id:'decision',label:'Keep approval with the store',pass:d.decision==='review',detail:'Invite a return request for review. A policy does not prove that a refund has been approved.'},
  ];
  return {signature:evidenceSignature(d),pass:checks.every(c=>c.pass),checks};
}
export function evidenceReviewed(d) {
  return !!d?.review?.pass && d.review.signature===evidenceSignature(d) && reviewEvidence(d).pass;
}
export function evidenceReady(d) { return evidenceReviewed(d) && d.transfer===1; }

export function composeReply(d = {}) {
  const name=String(d.name||'Alex').trim().slice(0,40)||'Alex';
  const days=String(d.days||'').trim()||'[return window]';
  const conditions={ 'unused-receipt':'the item is unused and you have the receipt', 'receipt':'you have a receipt, regardless of the item’s condition', 'any':'no matter the item’s condition or proof of purchase' };
  const decision={review:'You can submit a return request. The store will review it before confirming a refund.',approved:'Your refund is already approved.',automatic:'Your refund will be issued automatically.'};
  return `Hi ${name},\n\nYou can request a return within ${days} days of purchase, provided ${conditions[d.conditions]||'[requirements]'}.\n\n${decision[d.decision]||'[next step]'}\n\nSource: ${SOURCES[d.source]?.code||'[select a policy]'}.`;
}
export function evidenceFieldGuide(d, notes='') {
  return `# My evidence field guide\n\nGarrett Johnson AI · AI foundations\nFictional practice case: ${CASE_ID}\n\n## The original AI draft\n\n${CLAIMS.map(c=>c.text).join(' ')}\n\n## My corrected reply\n\n${composeReply(d)}\n\n## What I checked\n\n- Relevance: the returns policy applies to this customer’s request.\n- Currency: RET-2026 replaces RET-2024.\n- Support: 30 days; unused item; receipt required.\n- Authority: the store must review the request before approving a refund.\n\n## My habit to take back to work\n\n${String(d.reflection||'Before using an AI answer, check which source supports its important claims.').trim()}\n\n## My lesson notes\n\n${String(notes||'No additional notes.').trim()}\n\n## Reuse this check\n\n1. Name the claim.\n2. Find the governing source and version.\n3. Compare the actual words, including conditions and limits.\n4. Correct unsupported claims or pause for a person to review.\n5. For actions, verify the authoritative record before claiming success.\n\nThis is an educational simulation, not a real store policy or customer response.\n`;
}
