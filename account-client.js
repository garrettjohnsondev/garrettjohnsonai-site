export function validateAccountConfig(config) {
  if(!config.supabaseUrl&&!config.publishableKey) return false;
  const url=new URL(config.supabaseUrl);
  const local=config.environment==='test'&&['localhost','127.0.0.1'].includes(url.hostname);
  if(url.username||url.password||url.search||url.hash||(url.protocol!=='https:'&&!local)) throw new Error('Account service URL must use HTTPS.');
  if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)) throw new Error('Use a Supabase publishable key, never a secret or service-role key.');
  return true;
}
export async function createAccountClient(config) {
  validateAccountConfig(config);
  const {createClient}=await import('./vendor/supabase.js');
  return createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:`gj-learning-auth:${new URL(config.supabaseUrl).host}`},global:{fetch:boundedFetch}});
}
export async function boundedFetch(input,options={}){
  const controller=new AbortController(),cancel=()=>controller.abort();
  const timeout=setTimeout(cancel,15000);options.signal?.addEventListener('abort',cancel,{once:true});
  if(options.signal?.aborted) controller.abort();
  try{return await fetch(input,{...options,signal:controller.signal});}
  finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',cancel);}
}
export function progressRepository(client) {
  return {
    async load(){const {data,error}=await client.rpc('load_learning_progress');if(error) throw error;return data;},
    async save(document,revision){const {data,error}=await client.rpc('save_learning_progress',{next_document:document,expected_revision:revision});if(error) throw error;return data;},
  };
}
