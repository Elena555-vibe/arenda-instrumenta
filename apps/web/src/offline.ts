import { openDB } from 'idb';
const db = openDB('tool-rental',1,{upgrade(d){d.createObjectStore('cache');d.createObjectStore('queue',{keyPath:'id',autoIncrement:true});}});
export async function cached<T>(key:string,load:()=>Promise<T>):Promise<T>{try{const value=await load();(await db).put('cache',value,key);return value;}catch{const value=await (await db).get('cache',key);if(value!==undefined)return value;throw new Error('Нет сети и сохранённых данных');}}
export async function queue(url:string,body:unknown){await (await db).add('queue',{url,body,key:crypto.randomUUID()});}
export async function sync(){const store=await db;const tx=store.transaction('queue','readwrite');for(const item of await tx.store.getAll()){try{const r=await fetch(item.url,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':item.key},body:JSON.stringify(item.body)});if(!r.ok) throw new Error();await tx.store.delete(item.id);}catch{break;}}await tx.done;}
