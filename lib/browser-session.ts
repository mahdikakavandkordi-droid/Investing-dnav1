const VISITOR_KEY='investing-dna:visitor:v1';
const SESSION_KEY='investing-dna:session:v1';
const SEEN_KEY='investing-dna:seen:v1';

function id(storage:Storage,key:string){let value=storage.getItem(key);if(!value){value=crypto.randomUUID();storage.setItem(key,value)}return value}
export function getVisitorId(){if(typeof window==='undefined')return null;return id(localStorage,VISITOR_KEY)}
export function getBrowserSessionId(){if(typeof window==='undefined')return null;return id(sessionStorage,SESSION_KEY)}
export function isReturningVisitor(){if(typeof window==='undefined')return false;return localStorage.getItem(SEEN_KEY)==='1'}
export function markVisitorSeen(){if(typeof window!=='undefined')localStorage.setItem(SEEN_KEY,'1')}
