import { randomUUID } from 'node:crypto';
// Dom Ruiz — API Vercel. Nunca envie a chave service_role ao navegador.
const URL = process.env.SUPABASE_URL || 'https://bysxwsoiyxsflildpznf.supabase.co';
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_BsTF4RNQ3wBSymPDG3ApFg_6dzDRHSZ';
const TZ = '-03:00'; // Horário de São Paulo (sem horário de verão atualmente).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const json = (res, status, data) => res.status(status).setHeader('Cache-Control','no-store').json(data);
const fail = (status, message) => Object.assign(new Error(message),{status});
function qs(obj) { const q = new URLSearchParams(); Object.entries(obj).forEach(([k,v])=>{if(v!==undefined && v!==null) q.set(k,String(v));});return q.toString(); }
async function db(table, opts={}) {
  if(!SECRET) throw fail(503,'Configuração pendente na Vercel: SUPABASE_SERVICE_ROLE_KEY não definida.');
  const {method='GET',query={},body,prefer}=opts;
  const path='/rest/v1/'+table+(Object.keys(query).length?'?'+qs(query):'');
  const res=await fetch(URL+path,{method,headers:{apikey:SECRET,Authorization:'Bearer '+SECRET,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const text=await res.text();let data;try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!res.ok){const e=fail(res.status,(data?.message||data?.details||'Erro de banco de dados'));e.code=data?.code;throw e;}
  return data;
}
function dateOk(s){return typeof s==='string' && DATE.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
function iso(s,t){if(!dateOk(s)||!TIME.test(t))throw fail(400,'Dia ou horário inválido.');return new Date(`${s}T${t}:00${TZ}`).toISOString();}
function localDay(date){return new Date(date+'T12:00:00Z').getUTCDay();}
function min(t){const [h,m]=t.slice(0,5).split(':').map(Number);return h*60+m;}
function clock(m){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
function period(date){return {start:iso(date,'00:00'),end:new Date(new Date(iso(date,'00:00')).getTime()+86400000).toISOString()};}
function normPhone(v){const n=String(v||'').replace(/\D/g,'');if(n.length!==11||n[2]!=='9') throw fail(400,'Informe WhatsApp com DDD, com 11 dígitos.');return n;}
function normName(v){const s=String(v||'').replace(/\s+/g,' ').trim();if(s.length<2||s.length>80)throw fail(400,'Informe seu nome (2 a 80 caracteres).');return s;}
async function services(){return await db('services',{query:{select:'id,name,description,price,duration_min,image_path,sort_order,active',order:'sort_order.asc'}});}
async function hours(){return await db('business_hours',{query:{select:'weekday,open_at,close_at,is_open',order:'weekday.asc'}});}
async function daily(date){const p=period(date);return await db('appointments',{query:{select:'id,kind,status,starts_at,ends_at,customer_name,customer_phone,service_id,service_name,service_price,duration_min,notes,source,created_at',starts_at:`gte.${p.start}`,ends_at:`lte.${p.end}`,status:'neq.cancelled',order:'starts_at.asc',limit:250}});}
async function slots(date,serviceId,ss,hh,bookings){
 const s=ss.find(x=>x.id===serviceId&&x.active);if(!s)throw fail(404,'Serviço não encontrado.');
 const h=hh.find(x=>x.weekday===localDay(date));if(!h?.is_open)return [];
 const now=Date.now()+30*60*1000;
 const times=[];
 for(let t=min(h.open_at);t+Number(s.duration_min)<=min(h.close_at);t+=15){
   const start=Date.parse(iso(date,clock(t))),end=start+Number(s.duration_min)*60000;
   if(start<now)continue;
   if(bookings.some(b=>Date.parse(b.starts_at)<end&&Date.parse(b.ends_at)>start))continue;
   times.push(clock(t));
 }
 return times;
}
function adminBearer(req){const m=String(req.headers.authorization||'').match(/^Bearer (.+)$/);if(!m)throw fail(401,'Entre no painel administrativo.');return m[1];}
async function checkAdmin(req){
 const token=adminBearer(req);
 const r=await fetch(URL+'/auth/v1/user',{headers:{apikey:PUBLIC,Authorization:'Bearer '+token}});
 if(!r.ok)throw fail(401,'Sessão expirada. Entre novamente.');
 const u=await r.json();if(!u?.id||!UUID.test(u.id))throw fail(401,'Sessão inválida.');
 const admin=await db('admin_users',{query:{select:'user_id',user_id:`eq.${u.id}`,limit:1}});
 if(!admin.length)throw fail(403,'Esta conta não tem permissão administrativa.');
 return u;
}
const safeId=(id)=>{if(!UUID.test(String(id||'')))throw fail(400,'Identificador inválido.');return id;};
const adminActions=new Set(['overview','day','customers','admin-hours','save-hours','save-service','change-booking','manual-booking','block-time','cancel-block','all-services','upload-image']);
async function reserve(body,source='site'){
 const date=body.date, time=body.time;
 const s=await services(),h=await hours(),b=await daily(date);
 const serviceId=safeId(body.serviceId);
 const valid=await slots(date,serviceId,s,h,b);
 if(!valid.includes(time))throw fail(409,'Esse horário já não está disponível. Escolha outro.');
 const service=s.find(x=>x.id===serviceId);
 const phone=normPhone(body.phone),name=normName(body.name);
 if(source==='site'){
   // Limite simples contra uso acidental repetido; não substitui WAF/captcha em produção de alto volume.
   const p=period(date);const existing=await db('appointments',{query:{select:'id',customer_phone:`eq.${phone}`,starts_at:`gte.${p.start}`,ends_at:`lte.${p.end}`,status:'eq.booked',limit:3}});
   if(existing.length>=2)throw fail(429,'Limite de duas reservas por telefone nesse dia. Fale com a barbearia.');
 }
 const start=iso(date,time),end=new Date(Date.parse(start)+Number(service.duration_min)*60000).toISOString();
 let row;
 try{row=await db('appointments',{method:'POST',prefer:'return=representation',body:{kind:'booking',status:'booked',customer_name:name,customer_phone:phone,service_id:service.id,service_name:service.name,service_price:service.price,duration_min:service.duration_min,starts_at:start,ends_at:end,notes:String(body.notes||'').slice(0,400),source}});}catch(e){if(e.code==='23P01'||e.status===409)throw fail(409,'Alguém acabou de reservar este horário. Escolha outro.');throw e;}
 return {id:row[0].id,token:row[0].manage_token,date,time,service:service.name,price:service.price,minutes:service.duration_min,name};
}
function ensureMethod(req,method){if(req.method!==method)throw fail(405,'Método não permitido.');}
export default async function handler(req,res){
 try{
   if(req.method==='OPTIONS'){res.setHeader('Allow','GET, POST, OPTIONS');return res.status(204).end();}
   const action=String(req.query.action||'');
   if(action==='health'){
     ensureMethod(req,'GET');
     if(!SECRET) return json(res,503,{ok:false,reason:'missing_server_key',message:'Falta configurar SUPABASE_SERVICE_ROLE_KEY no projeto Vercel da Dom Ruiz.'});
     try { await db('services',{query:{select:'id',limit:1}}); return json(res,200,{ok:true,database:'connected'}); }
     catch(err) { console.error('Health database:',err.message); return json(res,503,{ok:false,reason:'database_connection',message:'Falha na conexão com o Supabase. Confira SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.'}); }
   }
   if(action==='services'){ensureMethod(req,'GET');return json(res,200,{services:(await services()).filter(x=>x.active)});}
   if(action==='availability'){
     ensureMethod(req,'GET');const date=req.query.date,serviceId=req.query.serviceId;
     if(!dateOk(date)||!UUID.test(String(serviceId)))throw fail(400,'Dia ou serviço inválido.');
     return json(res,200,{slots:await slots(date,serviceId,await services(),await hours(),await daily(date))});
   }
   if(action==='book'){
     ensureMethod(req,'POST');if(req.body?.website) return json(res,200,{ok:true});
     const saved=await reserve(req.body||{});return json(res,201,{ok:true,booking:saved});
   }
   if(action==='cancel'){
     ensureMethod(req,'POST');const token=safeId(req.body?.token);
     const r=await db('appointments',{query:{select:'id,status,starts_at,kind',manage_token:'eq.'+token,limit:1}});
     if(!r.length||r[0].kind!=='booking')throw fail(404,'Agendamento não encontrado.');
     if(r[0].status!=='booked')throw fail(409,'Esse agendamento não está ativo.');
     if(Date.parse(r[0].starts_at)-Date.now()<2*3600000)throw fail(409,'Para cancelar com menos de 2 horas, fale com a barbearia.');
     const cancelled=await db('appointments',{method:'PATCH',query:{id:'eq.'+r[0].id,status:'eq.booked'},body:{status:'cancelled'},prefer:'return=representation'});
     if(!cancelled?.length) throw fail(409,'A reserva já foi alterada. Atualize os dados.');
     return json(res,200,{ok:true});
   }
   if(!adminActions.has(action))throw fail(404,'Rota não encontrada.');
   await checkAdmin(req);
   if(action==='overview'){
     ensureMethod(req,'GET');
     const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
     const first=today.slice(0,7)+'-01';const next=new Date(Date.parse(first+'T12:00:00Z'));next.setUTCMonth(next.getUTCMonth()+1);const last=next.toISOString().slice(0,10);
     const p={start:iso(first,'00:00'),end:iso(last,'00:00')};
     const appointments=await db('appointments',{query:{select:'id,status,kind,starts_at,ends_at,service_name,service_price,customer_name,customer_phone,source','and':`(starts_at.gte.${p.start},starts_at.lt.${p.end})`,order:'starts_at.asc',limit:2000}});
     const td=await daily(today);
     return json(res,200,{today,month:appointments,todayBookings:td});
   }
   if(action==='day'){
     ensureMethod(req,'GET');const date=req.query.date;if(!dateOk(date))throw fail(400,'Data inválida.');
     return json(res,200,{appointments:await daily(date)});
   }
   if(action==='customers'){
     ensureMethod(req,'GET');const r=await db('appointments',{query:{select:'customer_name,customer_phone,starts_at,status,service_name,service_price',kind:'eq.booking',order:'starts_at.desc',limit:2000}});
     return json(res,200,{bookings:r});
   }
   if(action==='admin-hours'){ensureMethod(req,'GET');return json(res,200,{hours:await hours()});}
   if(action==='all-services'){ensureMethod(req,'GET');return json(res,200,{services:await services()});}
   if(action==='upload-image'){
     ensureMethod(req,'POST'); const body=req.body||{};
     const mime=String(body.mime||''),b64=String(body.base64||'');
     const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime];
     if(!ext||b64.length>2400000||!/^[-A-Za-z0-9+/=]+$/.test(b64))throw fail(400,'Envie JPEG, PNG ou WebP com até 1,6 MB.');
     const file=Buffer.from(b64,'base64');if(file.length===0||file.length>1700000)throw fail(400,'Arquivo muito grande.');
     const object='services/'+Date.now()+'-'+randomUUID()+'.'+ext;
     const rsp=await fetch(URL+'/storage/v1/object/dom-ruiz-media/'+object,{method:'POST',headers:{apikey:SECRET,Authorization:'Bearer '+SECRET,'Content-Type':mime,'x-upsert':'false'},body:file});
     if(!rsp.ok){const t=await rsp.text();console.error('Storage:',t.slice(0,300));throw fail(503,'Falha ao enviar imagem para o Storage.');}
     return json(res,201,{url:URL+'/storage/v1/object/public/dom-ruiz-media/'+object});
   }
   if(action==='save-hours'){
     ensureMethod(req,'POST');const b=req.body||{};
     if(!Number.isInteger(Number(b.weekday))||Number(b.weekday)<0||Number(b.weekday)>6||!TIME.test(b.open_at)||!TIME.test(b.close_at)||min(b.close_at)<=min(b.open_at))throw fail(400,'Horários inválidos.');
     const rows=await db('business_hours',{method:'POST',query:{on_conflict:'weekday'},prefer:'resolution=merge-duplicates,return=representation',body:{weekday:Number(b.weekday),open_at:b.open_at,close_at:b.close_at,is_open:!!b.is_open}});
     return json(res,200,{hours:rows});
   }
   if(action==='save-service'){
     ensureMethod(req,'POST');const b=req.body||{};
     const name=String(b.name||'').trim(),description=String(b.description||'').trim(),price=Number(b.price),duration=Number(b.duration_min),sort=Number(b.sort_order||0),path=String(b.image_path||'');
     if(name.length<2||name.length>90||description.length>300||!Number.isFinite(price)||price<0||price>50000||!Number.isInteger(duration)||duration<5||duration>240||!Number.isInteger(sort)||sort<0||sort>9999||path.length>255||!(path===''||/^\/assets\/[a-zA-Z0-9._-]+$/.test(path)||/^https:\/\/[^\s]+$/.test(path)))throw fail(400,'Revise os dados do serviço.');
     const data={name,description,price,duration_min:duration,image_path:path,active:b.active!==false,sort_order:sort};
     const saved=b.id?await db('services',{method:'PATCH',query:{id:'eq.'+safeId(b.id)},prefer:'return=representation',body:data}):await db('services',{method:'POST',prefer:'return=representation',body:data});
     return json(res,200,{service:saved[0]});
   }
   if(action==='change-booking'){
     ensureMethod(req,'POST');const b=req.body||{},id=safeId(b.id);
     const old=await db('appointments',{query:{select:'id,status,kind,starts_at,ends_at,duration_min',id:'eq.'+id,limit:1}});
     if(!old.length||old[0].kind!=='booking')throw fail(404,'Reserva não encontrada.');
     const allowed=['booked','completed','no_show','cancelled'];if(!allowed.includes(b.status))throw fail(400,'Status inválido.');
     let patch={status:b.status};
     if(b.date||b.time){
       if(b.status!=='booked'||!dateOk(b.date)||!TIME.test(b.time))throw fail(400,'Nova data ou horário inválido.');
       const t=iso(b.date,b.time),end=new Date(Date.parse(t)+Number(old[0].duration_min)*60000).toISOString();
       const hr=(await hours()).find(x=>x.weekday===localDay(b.date));
       if(!hr?.is_open||min(b.time)<min(hr.open_at)||Date.parse(end)>Date.parse(iso(b.date,hr.close_at)))throw fail(400,'Fora do expediente.');
       patch={...patch,starts_at:t,ends_at:end};
     }
     try{const r=await db('appointments',{method:'PATCH',query:{id:'eq.'+id},prefer:'return=representation',body:patch});return json(res,200,{appointment:r[0]});}
     catch(e){if(e.code==='23P01')throw fail(409,'Horário ocupado.');throw e;}
   }
   if(action==='manual-booking'){ensureMethod(req,'POST');return json(res,201,{booking:await reserve(req.body||{},'admin')});}
   if(action==='block-time'){
     ensureMethod(req,'POST');const b=req.body||{};
     if(!dateOk(b.date)||!TIME.test(b.time)||!TIME.test(b.end_time)||min(b.end_time)<=min(b.time))throw fail(400,'Intervalo inválido.');
     const start=iso(b.date,b.time),end=iso(b.date,b.end_time);
     try{const r=await db('appointments',{method:'POST',prefer:'return=representation',body:{kind:'block',status:'blocked',starts_at:start,ends_at:end,notes:String(b.reason||'Indisponível').slice(0,200),source:'admin'}});return json(res,201,{block:r[0]});}
     catch(e){if(e.code==='23P01')throw fail(409,'Existe atendimento nesse intervalo.');throw e;}
   }
   if(action==='cancel-block'){
     ensureMethod(req,'POST');const id=safeId(req.body?.id);
     await db('appointments',{method:'PATCH',query:{id:'eq.'+id,kind:'eq.block'},body:{status:'cancelled'}});return json(res,200,{ok:true});
   }
 } catch(e){
   console.error('Dom Ruiz API:',e.message);
   if(e.code==='23P01')return json(res,409,{error:'Horário já ocupado.'});
   const isConfigProblem=e.status===503 && (/SUPABASE_SERVICE_ROLE_KEY/.test(e.message)||e.code==='PGRST301'||e.status===401);
   return json(res,e.status>=400&&e.status<600?e.status:500,{error:isConfigProblem?'Agendamento temporariamente indisponível. A conexão com o banco ainda precisa ser configurada na Vercel.':e.status>=500?'Falha temporária no agendamento. Tente novamente ou fale pelo WhatsApp.':e.message});
 }
}
