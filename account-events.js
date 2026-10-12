import {e} from './state.js';
import {accountInfo,sendAccountCode,verifyAccountCode,refreshAccount,resolveAccountConflict,importDevice,accountExport,signOutAccount} from './account-runtime.js';
import {accountSigninForm,accountCodeForm} from './account-views.js';

export function installAccountEvents({showDialog,closeDialog,go,render,notify}){
  let email='',next='dashboard',busy=false,lastSent=0,formEpoch=0,exportText='';
  const error=message=>{const node=document.querySelector('#account-auth-error')||document.querySelector('#account-page-error');if(node)node.textContent=message;else notify(message);};
  const working=value=>{busy=value;document.querySelectorAll('#account-email-form button,#account-code-form button,[data-action="account-resend"]').forEach(b=>{b.disabled=value;});};
  function open(destination='dashboard'){
    formEpoch++;next=destination;
    if(!accountInfo.enabled||accountInfo.status==='unavailable') {
      showDialog('<span class="eyebrow">Accounts are being connected</span><h2 id="dialog-title">Keep learning here.</h2><p>Email sign-in is not available in this preview yet. Your existing lessons and work still save on this device.</p><button class="btn btn-primary btn-block" data-action="close-dialog">Back to learning</button>');return;
    }
    showDialog(accountSigninForm());
  }
  document.addEventListener('submit',async event=>{
    const form=event.target;
    if(!['account-email-form','account-code-form'].includes(form.id)) return;
    event.preventDefault();if(busy||!form.reportValidity()) return;
    const epoch=formEpoch,values=Object.fromEntries(new FormData(form));working(true);error('');
    try{
      if(form.id==='account-email-form'){
        const address=String(values.email).trim();
        await sendAccountCode(address);email=address;lastSent=Date.now();
        if(epoch===formEpoch&&form.isConnected) showDialog(accountCodeForm(email));
      }else{
        await verifyAccountCode(email,String(values.code).trim());
        if(epoch===formEpoch){closeDialog();go(next);render();notify('Signed in. Your account work is ready.');}
      }
    }catch(err){if(epoch===formEpoch)error(err.message);}
    finally{working(false);}
  });
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action^="account-"]');if(!button||button.disabled) return;
    const action=button.dataset.action;
    if(action==='account-signin'){open();return;}
    if(action==='account-export'){
      exportText=JSON.stringify(accountExport(),null,2);
      showDialog(`<span class="eyebrow">A copy you can keep</span><h2 id="dialog-title">Your learning work.</h2><p>This includes your current work and any saved recovery versions. Sign-in credentials are excluded.</p><div class="actions"><button class="btn btn-primary" data-action="account-copy-export">Copy saved work</button><button class="btn btn-secondary" data-action="account-download-export">Download JSON</button></div><p id="account-export-status" class="small muted" role="status">You can also select and copy the text below.</p><pre class="account-version-preview" tabindex="0">${e(exportText)}</pre>`);return;
    }
    if(action==='account-copy-export'){
      try{await navigator.clipboard.writeText(exportText);document.querySelector('#account-export-status').textContent='Copied. Keep this file somewhere private.';}
      catch{document.querySelector('#account-export-status').textContent='Select and copy the text below.';}return;
    }
    if(action==='account-download-export'){
      const blob=new Blob([exportText],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='my-learning-work.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);return;
    }
    if(action==='account-signout'&&accountInfo.status!=='saved'){
      showDialog('<span class="eyebrow">Work still on this device</span><h2 id="dialog-title">Sign out with work<br>waiting to sync?</h2><p>Your latest changes may only exist here. A copy stays on this browser for the next time you sign in to this account. Export your work first if you’ll be clearing browser data.</p><div class="actions"><button class="btn btn-secondary" data-action="account-export">Export my work</button><button class="btn btn-quiet" data-action="account-signout-pending">Sign out and keep the device copy</button></div><button class="btn btn-primary btn-block" data-action="close-dialog" style="margin-top:20px">Stay and finish saving</button>');return;
    }
    if(action==='account-import'){
      showDialog(`<span class="eyebrow">Bring your work along</span><h2 id="dialog-title">Save this device’s work<br>to your account?</h2><p>It will be added to <strong>${e(accountInfo.user?.email)}</strong>. Existing account drafts and notes take priority if the same lesson appears in both. The original device copy stays here.</p><button class="btn btn-primary btn-block" data-action="account-import-confirm">Bring my progress</button><button class="btn btn-quiet btn-block" data-action="close-dialog">Keep it separate</button>`);return;
    }
    button.disabled=true;
    try{
      if(action==='account-resend'){
        if(Date.now()-lastSent<60000) throw new Error('Please wait a minute before requesting another code.');
        await sendAccountCode(email);lastSent=Date.now();document.querySelector('#account-send-status').textContent='A new code was requested. Check your inbox and use the newest code.';
      }
      if(action==='account-retry') await refreshAccount();
      if(action==='account-resolve'){await resolveAccountConflict(button.dataset.choice);render();}
      if(action==='account-import-confirm'){
        if(!importDevice()) throw new Error('Check for saved work and resolve any version differences before importing.');
        closeDialog();render();notify('Device progress added. The original copy is still on this device.');
      }
      if(action==='account-signout'||action==='account-signout-pending'){await signOutAccount({keepPending:action==='account-signout-pending'});closeDialog();go('');render();notify('Signed out. Your account work is separate from guest progress.');}
    }catch(err){error(err.message);}
    finally{if(button.isConnected)button.disabled=false;}
  });
  return {open};
}
