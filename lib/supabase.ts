import {createClient} from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export async function rpc<T=any>(name:string,args?:Record<string,unknown>):Promise<T> {
  if (!supabase) throw new Error("The service is not configured yet.");
  const {data,error} = await supabase.rpc(name,args);
  if(error) throw new Error(error.message);
  return data as T;
}
export async function pilot<T>(action:string, body:Record<string,unknown>={}):Promise<T> {
  if (!supabase || !url || !key) throw new Error("The assessment service is not configured yet.");
  const {data:{session},error} = await supabase.auth.getSession();
  if(error) throw error;
  const headers:Record<string,string> = {"Content-Type":"application/json",apikey:key};
  if(session) headers.Authorization = `Bearer ${session.access_token}`;
  let response:Response;
  try { response = await fetch(`${url}/functions/v1/investing-dna-pilot`, {
    method:"POST",headers,body:JSON.stringify({action,...body}),signal:AbortSignal.timeout(30000)
  }); } catch { throw new Error("Connection interrupted. Your answers are still on this device. Try again."); }
  const data = await response.json().catch(()=>null);
  if(!response.ok || data?.error) throw new Error(data?.error || "The request could not be completed.");
  if(!data) throw new Error("The service returned an empty response.");
  return data as T;
}
