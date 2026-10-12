// Browser helpers for the Member handoff studio. The case pack, call scripts,
// and grading arrive from the protected learning service after a membership
// check; none of that content is bundled here. Saved results are a learner-facing
// progress record, not a tamper-proof certification.
export const HANDOFF_DRAFT_KEY='handoffStudio';
const STAGES=['brief','practice','check','complete'];
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);

export const newHandoffDraft=pack=>({version:1,stage:'brief',rules:{...pack.defaults.rules},fields:[...pack.defaults.fields],test:null,transfer:null,reflection:'',finished:false,runs:0});

// Keep only choices the current pack offers, so an old or edited draft cannot
// carry modes or fields the service would reject.
export function cleanHandoffDraft(raw,pack) {
  if(!object(raw)||raw.version!==1) return newHandoffDraft(pack);
  const d=raw,modeIds=pack.modes.map(m=>m.id),fieldIds=pack.fields.map(f=>f.id),rules=object(d.rules)?d.rules:{};
  if(!STAGES.includes(d.stage)) d.stage='brief';
  d.rules=Object.fromEntries(pack.rows.map(r=>[r.id,modeIds.includes(rules[r.id])?rules[r.id]:pack.defaults.rules[r.id]]));
  d.fields=Array.isArray(d.fields)?fieldIds.filter(id=>d.fields.includes(id)):[...pack.defaults.fields];
  if(!object(d.test)||typeof d.test.signature!=='string'||!Array.isArray(d.test.calls)||!object(d.test.summary)) d.test=null;
  if(!object(d.transfer)||!Number.isInteger(d.transfer.choice)) d.transfer=null;
  d.reflection=typeof d.reflection==='string'?d.reflection.slice(0,1000):'';
  d.finished=d.finished===true;
  d.runs=Number.isInteger(d.runs)&&d.runs>=0?d.runs:0;
  return d;
}

// A run proves only the exact rules and handoff fields it tested.
export const handoffSignature=(d={})=>JSON.stringify([Object.keys(d.rules||{}).sort().map(k=>[k,d.rules[k]]),[...new Set(d.fields||[])].sort()]);
export const handoffTested=d=>d?.test?.pass===true&&d.test.signature===handoffSignature(d);
export const handoffStale=d=>!!d?.test&&d.test.signature!==handoffSignature(d);
export const handoffReady=d=>handoffTested(d)&&d?.transfer?.pass===true;

export function handoffRulebook(d,pack,notes='') {
  const mode=id=>pack.modes.find(m=>m.id===id)?.label||'Not set';
  const rules=pack.rows.map(r=>`- ${r.label}\n  Rule: ${mode(d.rules?.[r.id])}`).join('\n');
  const fields=pack.fields.filter(f=>(d.fields||[]).includes(f.id)).map(f=>`- ${f.label}`).join('\n')||'- Nothing selected yet.';
  const summary=d.test?.summary;
  const results=summary?pack.metrics.map(m=>`- ${m.label}: ${summary[m.id]??0} (target ${m.target})`).join('\n'):'- Not run yet.';
  const verdict=handoffTested(d)?'Every call was handled with the rules above.':'These rules have not passed the full test yet.';
  const transfer=d.transfer?.pass?`“${pack.transfer.text}”\n${pack.transfer.options[d.transfer.choice]}`:'Not completed yet.';
  const reflection=String(d.reflection||'').trim()||pack.reflection.fallback;
  return `${pack.kit.title}\n\n${pack.kit.subtitle}\n\n## My rules\n\n${rules}\n\n## Every handoff includes\n\n${fields}\n\n## Test results\n\n${results}\n\n${verdict}\n\n## My default rule\n\n${pack.kit.defaultRule}\n\n## The call no rule covered\n\n${transfer}\n\n${pack.kit.template}\n\n## My takeaway\n\n${reflection}\n\n## My notes\n\n${String(notes||'').trim()||'No additional notes.'}\n\n${pack.kit.disclaimer}\n`;
}
