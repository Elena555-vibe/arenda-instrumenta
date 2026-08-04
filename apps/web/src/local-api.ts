import { localRead, localWrite } from './offline';

type Client={id:string;full_name:string;phone:string};
type Tool={id:string;name:string;internal_number:string;daily_rate:number;default_deposit:number;purchase_cost:number;status:string};
type Rental={id:string;client_id:string;full_name:string;tools:string[];tool_ids:string[];issue_date:string;planned_return_date:string;final_rental_amount:number;status:string};
type Data={tools:Tool[];clients:Client[];rentals:Rental[];bookings:any[]};

const key='single-user-data';
const id=()=>crypto.randomUUID();
const today=()=>new Date().toISOString().slice(0,10);
const overlaps=(start:string,end:string,otherStart:string,otherEnd:string)=>start<=otherEnd&&otherStart<=end;
async function data():Promise<Data>{return await localRead<Data>(key)??{tools:[],clients:[],rentals:[],bookings:[]}}
async function save(value:Data){await localWrite(key,value)}
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));

export async function localApi<T>(url:string,options?:RequestInit):Promise<T>{
  const d=await data();const method=options?.method??'GET';const body=options?.body?JSON.parse(String(options.body)):{};const path=url.split('?')[0];
  if(method==='GET'&&path==='/api/tools'){const q=new URLSearchParams(url.split('?')[1]??'').get('q')?.toLowerCase()??'';return clone(d.tools.filter(t=>!q||t.name.toLowerCase().includes(q))) as T}
  if(method==='GET'&&path==='/api/clients')return clone(d.clients) as T;
  if(method==='GET'&&path==='/api/rentals')return clone(d.rentals) as T;
  if(method==='GET'&&path==='/api/bookings')return clone(d.bookings) as T;
  if(method==='GET'&&path==='/api/dashboard'){const due=today();const rentals=d.rentals.filter(r=>r.status==='active');return {today:due,counters:{overdue:rentals.filter(r=>r.planned_return_date<due).length,due_today:rentals.filter(r=>r.planned_return_date===due).length,pickup_today:d.bookings.filter(b=>b.status==='active'&&b.start_date===due).length},rentals:clone(rentals)} as T}
  if(method==='POST'&&path==='/api/clients'){const client={id:id(),...body};d.clients.push(client);await save(d);return clone(client) as T}
  if(method==='POST'&&path==='/api/tools'){if(d.tools.some(t=>t.internal_number===body.internal_number))throw new Error('Не удалось создать инструмент');const tool={id:id(),status:'available',...body};d.tools.push(tool);await save(d);return clone(tool) as T}
  const returnMatch=path.match(/^\/api\/rentals\/([^/]+)\/return$/);
  if(method==='POST'&&returnMatch){
    const rental=d.rentals.find(r=>r.id===returnMatch[1]);if(!rental||rental.status!=='active')throw new Error('Эта аренда уже закрыта или не найдена');
    rental.status='completed';
    rental.tool_ids.forEach(toolId=>{const tool=d.tools.find(t=>t.id===toolId);if(!tool)return;const hasBooking=d.bookings.some(b=>b.status==='active'&&(b.tool_ids?.includes(toolId)||(!b.tool_ids&&b.tools?.includes(tool.name)))&&b.planned_return_date>=today());tool.status=hasBooking?'reserved':'available'});
    await save(d);return clone(rental) as T
  }
  if(method==='POST'&&path==='/api/rentals'){
    if(!body.client_id||!body.tool_ids?.length)throw new Error('Выберите клиента и хотя бы один инструмент');const chosen=d.tools.filter(t=>body.tool_ids.includes(t.id));
    if(chosen.length!==body.tool_ids.length||chosen.some(t=>t.status!=='available'))throw new Error('Выберите только доступные инструменты');
    const days=Math.max(1,Math.round((Date.parse(body.planned_return_date)-Date.parse(body.issue_date))/86400000));const amount=body.final_rental_amount||chosen.reduce((s,t)=>s+t.daily_rate*days,0);const client=d.clients.find(c=>c.id===body.client_id)!;
    const rental={id:id(),client_id:client.id,full_name:client.full_name,tools:chosen.map(t=>t.name),tool_ids:chosen.map(t=>t.id),issue_date:body.issue_date,planned_return_date:body.planned_return_date,final_rental_amount:amount,status:'active'};chosen.forEach(t=>t.status='rented');d.rentals.push(rental);await save(d);return clone(rental) as T
  }
  if(method==='POST'&&path==='/api/bookings'){
    const chosen=d.tools.filter(t=>body.tool_ids?.includes(t.id));if(!body.client_id||!chosen.length)throw new Error('Выберите клиента и инструмент');
    const conflict=(tool:Tool)=>d.rentals.some(r=>r.status==='active'&&r.tool_ids.includes(tool.id)&&overlaps(body.start_date,body.planned_return_date,r.issue_date,r.planned_return_date))||d.bookings.some(b=>b.status==='active'&&(b.tool_ids?.includes(tool.id)||(!b.tool_ids&&b.tools?.includes(tool.name)))&&overlaps(body.start_date,body.planned_return_date,b.start_date,b.planned_return_date));
    if(chosen.some(t=>t.status==='service'||t.status==='written_off'||conflict(t)))throw new Error('Один из инструментов уже занят на выбранные даты');
    const client=d.clients.find(c=>c.id===body.client_id)!;const booking={id:id(),client_id:client.id,full_name:client.full_name,tools:chosen.map(t=>t.name),tool_ids:chosen.map(t=>t.id),start_date:body.start_date,planned_return_date:body.planned_return_date,status:'active'};
    chosen.forEach(t=>{const rentedNow=d.rentals.some(r=>r.status==='active'&&r.tool_ids.includes(t.id)&&r.issue_date<=today()&&r.planned_return_date>=today());t.status=rentedNow?'rented':'reserved'});d.bookings.push(booking);await save(d);return clone(booking) as T
  }
  throw new Error('Эта операция пока недоступна в локальной версии');
}
