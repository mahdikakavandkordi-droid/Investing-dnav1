import {createClient} from "@supabase/supabase-js";
import {getBrowserSessionId,getVisitorId} from "@/lib/browser-session";

/**
 * Browser transport boundary for Supabase.
 *
 * - `rpc()` calls explicitly browser-facing Postgres RPCs.
 * - `pilot()` calls the privileged assessment/pilot Edge Function.
 *
 * This file may contain only public/publishable credentials. Service-role
 * capability belongs exclusively on the server/Edge Function side.
 * See `docs/DATABASE-AND-API.md`.
 */
const DEFAULT_SUPABASE_URL = "https://bxjjannguzzzqsamnhem.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_p2fijbzQmFxdayOXr1C_fA_OMx4FepZ";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key);

/** Call a narrow browser-facing Postgres RPC and surface its database error. */
export async function rpc<T=any>(name:string,args?:Record<string,unknown>):Promise<T> {
  const {data,error} = await supabase.rpc(name,args);
  if(error) throw new Error(error.message);
  return data as T;
}

/**
 * Call the assessment/pilot Edge Function.
 *
 * Random visitor/session identifiers are attached for privacy-minimized product
 * analytics. The Edge Function remains authoritative for action/session/owner
 * validation and may use service-role access only after those checks.
 */
export async function pilot<T>(action:string, body:Record<string,unknown>={}):Promise<T> {
  const {data:{session},error} = await supabase.auth.getSession();
  if(error) throw error;
  const headers:Record<string,string> = {"Content-Type":"application/json",apikey:key};
  if(session) headers.Authorization = `Bearer ${session.access_token}`;
  let response:Response;
  try {
    response = await fetch(`${url}/functions/v1/investing-dna-pilot`, {
      method:"POST",
      headers,
      body:JSON.stringify({action,...body,browser_session_id:getBrowserSessionId(),visitor_id:getVisitorId()}),
      signal:AbortSignal.timeout(30000)
    });
  } catch {
    throw new Error("Connection interrupted. Your answers are still on this device. Try again.");
  }
  const data = await response.json().catch(()=>null);
  if(!response.ok || data?.error) throw new Error(data?.error || "The request could not be completed.");
  if(!data) throw new Error("The service returned an empty response.");
  return data as T;
}
