import {emptyProgress,progressDocument,sameProgress} from './progress-document.js';

// One coordinator per authenticated learner. The server uses compare-and-swap;
// clocks on two devices never decide which work survives.
export class ProgressSync {
  constructor({repository,cache,onChange=()=>{},onDocument=()=>{},delay=650}) {
    Object.assign(this,{repository,cache,onChange,onDocument,delay});
    const saved=cache.read();
    this.base=saved?.base&&Number.isSafeInteger(saved.base.revision)&&saved.base.revision>=0?{revision:saved.base.revision,document:progressDocument(saved.base.document)}:{revision:0,document:emptyProgress()};
    this.local=progressDocument(saved?.local||emptyProgress());
    this.status='loading';this.remote=null;this.active=true;this.ready=false;this.pending=null;this.timer=null;
  }
  snapshot(){return {status:this.status,local:this.local,remote:this.remote,dirty:!sameProgress(this.local,this.base.document)};}
  announce(status){this.status=status;this.cache.write({base:this.base,local:this.local});this.onChange(this.snapshot());}
  edit(document){
    if(!this.active) return;
    const next=progressDocument(document);
    if(sameProgress(next,this.local)) return;
    this.local=next;
    this.announce(this.remote?'conflict':this.ready?'pending':this.status);
    clearTimeout(this.timer);
    if(this.ready&&!this.remote) this.timer=setTimeout(()=>this.flush(),this.delay);
  }
  async refresh(){
    if(!this.active||this.pending) return this.pending;
    clearTimeout(this.timer);
    this.announce('loading');
    this.pending=this.reconcile().finally(()=>{this.pending=null;});
    await this.pending;
    if(this.active&&this.ready&&!this.remote&&!sameProgress(this.local,this.base.document)) return this.flush();
  }
  async reconcile(){
    try {
      const row=await this.repository.load();
      if(!this.active) return;
      const remote=row||{revision:0,document:emptyProgress()};
      remote.document=progressDocument(remote.document);
      this.ready=true;
      if(remote.revision<this.base.revision){this.remote=remote;this.announce('conflict');}
      else if(sameProgress(this.local,this.base.document)||sameProgress(this.local,remote.document)) {
        const changed=!sameProgress(this.local,remote.document);
        this.base=remote;this.local=progressDocument(remote.document);this.remote=null;
        if(changed) this.onDocument(progressDocument(this.local));
        this.announce(sameProgress(this.local,this.base.document)?'saved':'pending');
      } else if(remote.revision===this.base.revision&&sameProgress(remote.document,this.base.document)) {
        this.announce('pending');
      } else {this.remote=remote;this.announce('conflict');}
    } catch {if(this.active){this.ready=false;this.announce('offline');}}
  }
  async flush(){
    if(!this.active||this.remote||!this.ready) return false;
    if(this.pending) {await this.pending;return this.active?this.flush():false;}
    clearTimeout(this.timer);
    if(sameProgress(this.local,this.base.document)){this.announce('saved');return true;}
    const sent=progressDocument(this.local),revision=this.base.revision;
    this.announce('saving');
    this.pending=(async()=>{
      try {
        const result=await this.repository.save(sent,revision);
        if(!this.active) return false;
        if(!result.saved){this.remote={revision:result.revision,document:progressDocument(result.document)};this.announce('conflict');return false;}
        this.base={revision:result.revision,document:sent};
        this.announce(sameProgress(this.local,sent)?'saved':'pending');return true;
      } catch {if(this.active) this.announce('offline');return false;}
    })();
    const ok=await this.pending;this.pending=null;
    // An acknowledgement never replaces edits made while the request was in flight.
    if(ok&&this.active&&!sameProgress(this.local,this.base.document)) return this.flush();
    return ok;
  }
  async resolve(choice){
    if(!this.active||!this.remote||!['device','account'].includes(choice)) return false;
    // Both versions are retained before either choice is applied.
    if(!this.cache.backup({device:this.local,account:this.remote.document,at:new Date().toISOString()})) throw new Error('A recovery copy could not be saved. Export both versions before continuing.');
    this.base=this.remote;this.remote=null;
    if(choice==='account'){this.local=progressDocument(this.base.document);this.onDocument(progressDocument(this.local));this.announce('saved');return true;}
    this.announce('pending');return this.flush();
  }
  stop(){this.active=false;clearTimeout(this.timer);}
}
