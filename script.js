(() => {
'use strict';
const cfg=window.DOM_RUIZ_CONFIG || {api:'/api/index',whatsapp:'5511957704065'};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const prettyDate=s=>new Date(s+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'});
const localDate=(dt=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(dt);
const icon=(name)=>`<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(action,options={}){
 const params=new URLSearchParams({action,...(options.params||{})});
 let r;try{r=await fetch(`${cfg.api}?${params}`,{method:options.body?'POST':'GET',headers:options.body?{'Content-Type':'application/json'}:{},body:options.body?JSON.stringify(options.body):undefined,cache:'no-store'});}catch{throw new Error('Sem conexão. Verifique a internet e tente novamente.');}
 let data={};try{data=await r.json();}catch{}
 if(!r.ok)throw new Error(data.error||'Algo deu errado. Tente novamente.');return data;
}
let services=[],selected=null,date='',time='',lastBooking=null,offline=false,slotsRequestId=0;
const fallbackServices=[
 {id:'preview-social',name:'Corte Social',description:'Clássico, alinhado e pronto para qualquer ocasião.',price:30,duration_min:25,image_path:'/assets/corte.social.jpg'},
 {id:'preview-tesoura',name:'Corte na Tesoura',description:'Acabamento natural com técnica e controle.',price:40,duration_min:40,image_path:'/assets/corte.na.tesoura.jpg'},
 {id:'preview-degrade',name:'Corte Degradê',description:'Transição suave e acabamento moderno.',price:35,duration_min:35,image_path:'/assets/degrade.jpg'},
 {id:'preview-barba',name:'Barba',description:'Modelagem e alinhamento no detalhe.',price:30,duration_min:20,image_path:'/assets/barba.jpg'},
 {id:'preview-sobrancelha',name:'Sobrancelha',description:'O detalhe que faz diferença.',price:10,duration_min:5,image_path:'/assets/sobrancelha.jpg'},
 {id:'preview-combo',name:'Corte + Barba',description:'Combo completo para um visual alinhado.',price:60,duration_min:55,image_path:'/assets/corte.barba.jpg'}
];
const waLink=(msg)=>'https://wa.me/'+cfg.whatsapp+'?text='+encodeURIComponent(msg);
function catalogNotice(message){const n=$('#catalogNotice');if(!n)return;n.hidden=!message;const t=n.querySelector('span');if(t)t.textContent=message;}

const track=$('#servicesTrack'),bookingServices=$('#bookingServices');
function selectService(id){selected=services.find(s=>s.id===id)||null;$$('.choose-service').forEach(n=>n.classList.toggle('selected',n.dataset.id===id));$('#goDate').disabled=!selected||offline;}
function createService(s,i){
 const card=el('article','service-card');
 const media=el('div','service-image');const img=el('img');img.src=s.image_path||'/assets/logo.jpg.jpeg';img.alt=s.name;img.loading='lazy';media.append(img);media.append(el('span','service-number',String(i+1).padStart(2,'0')+' / DOM RUIZ'));
 const content=el('div','service-info');content.append(el('h3','',s.name),el('p','',s.description));
 const meta=el('div','service-meta');meta.append(el('strong','',money(s.price)),el('span','',s.duration_min+' min'));content.append(meta);
 const button=el(offline?'a':'button','service-book');
 if(offline){button.href=waLink('Olá! Tenho interesse em '+s.name+' na Barbearia Dom Ruiz. Gostaria de consultar um horário.');button.target='_blank';button.rel='noopener';button.innerHTML=`CONSULTAR NO WHATSAPP ${icon('arrow-up')}`;}
 else{button.type='button';button.innerHTML=`ESCOLHER SERVIÇO ${icon('arrow-up')}`;button.addEventListener('click',()=>openBooking(s.id));}
 content.append(button);card.append(media,content);return card;
}
function renderServices(){track.replaceChildren();bookingServices.replaceChildren();services.forEach((s,i)=>{
 track.append(createService(s,i));
 const button=el('button','choose-service');button.type='button';button.dataset.id=s.id;
 const img=el('img');img.src=s.image_path||'/assets/logo.jpg.jpeg';img.alt='';
 const content=el('span');content.append(el('strong','',s.name),el('small','',money(s.price)+' · '+s.duration_min+' min'));
 const check=el('span','service-check');check.innerHTML=icon('check');
 button.append(img,content,check);button.disabled=offline;button.addEventListener('click',()=>selectService(s.id));bookingServices.append(button);
 });if(selected)selectService(selected.id);
}
async function loadServices(){try{
 const rows=(await api('services')).services;if(!Array.isArray(rows))throw new Error('Catálogo indisponível.');
 services=rows;offline=false;renderServices();catalogNotice('');
 }catch(err){
 offline=true;services=fallbackServices;selected=null;$('#goDate').disabled=true;
 renderServices();catalogNotice('A agenda está temporariamente indisponível. Os serviços abaixo são uma referência. Consulte valores e horários pelo WhatsApp.');
 const msg=el('p','offline-booking-note','Ainda não conseguimos consultar os horários. Para agendar agora, fale diretamente com a Dom Ruiz.');
 const a=el('a','btn btn-primary','Chamar no WhatsApp');a.href=waLink('Olá! Gostaria de marcar um horário na Dom Ruiz.');a.target='_blank';a.rel='noopener';
 bookingServices.prepend(a);bookingServices.prepend(msg);
 console.warn('Dom Ruiz: API do catálogo indisponível:',err.message);
 }}
function showError(s){const t=$('#bookingError');t.textContent=s;t.hidden=!s;}
function step(n){showError('');$$('.booking-step').forEach(s=>s.hidden=Number(s.dataset.step)!==n);$$('#bookingProgress span').forEach((s,i)=>s.classList.toggle('active',i<n));if(n===4)$$('#bookingProgress span').forEach(s=>s.classList.add('active'));$('#bookingPanel').scrollTop=0;$('#bookingDrawer').scrollTop=0;}
function openBooking(id){
 if(id)selectService(id);lastBooking=null;date='';time='';$('#goDate').disabled=!selected||offline;
 const shade=$('#bookingShade'),drawer=$('#bookingDrawer');shade.hidden=false;drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');document.body.classList.add('locked');step(1);drawer.focus();
}
function closeBooking(){const drawer=$('#bookingDrawer');drawer.classList.remove('is-open');drawer.setAttribute('aria-hidden','true');$('#bookingShade').hidden=true;document.body.classList.remove('locked');}
$$('[data-book]').forEach(b=>b.addEventListener('click',()=>openBooking()));$('#bookingShade').addEventListener('click',closeBooking);$('#closeBooking').addEventListener('click',closeBooking);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#bookingDrawer').classList.contains('is-open'))closeBooking();});
$('#goDate').addEventListener('click',()=>{if(!selected)return;step(2);const input=$('#bookingDate');const today=localDate();input.min=today;input.max=localDate(new Date(Date.now()+30*86400000));input.value=date||today;date=input.value;loadSlots();});
async function loadSlots(){const thisRequest=++slotsRequestId;time='';$('#goDetails').disabled=true;const area=$('#bookingSlots');area.replaceChildren(el('p','slot-note','Buscando horários disponíveis...'));date=$('#bookingDate').value;
 if(!date||!selected)return;
 try{const response=await api('availability',{params:{date,serviceId:selected.id}});if(thisRequest!==slotsRequestId||date!==$('#bookingDate').value)return;area.replaceChildren();
 if(!response.slots?.length){area.append(el('p','slot-note','Não há horários livres neste dia. Escolha outra data.'));return;}
 for(const t of response.slots){const b=el('button','',t);b.type='button';b.addEventListener('click',()=>{time=t;$$('#bookingSlots button').forEach(n=>n.classList.toggle('selected',n===b));$('#goDetails').disabled=false;});area.append(b);}
 }catch(err){if(thisRequest!==slotsRequestId)return;area.replaceChildren(el('p','slot-note',err.message));
 const a=el('a','btn btn-outline','Consultar pelo WhatsApp');a.href=waLink('Olá! Não consegui consultar os horários pelo site da Dom Ruiz. Pode me ajudar?');a.target='_blank';a.rel='noopener';area.append(a);
 }
}
$('#bookingDate').addEventListener('change',loadSlots);
$('#backService').addEventListener('click',()=>step(1));
$('#goDetails').addEventListener('click',()=>{if(!time||!selected)return;$('#bookingSummary').innerHTML=`<strong>${htmlEscape(selected.name)}</strong> · ${money(selected.price)}<br>${htmlEscape(prettyDate(date))} às ${htmlEscape(time)} · ${selected.duration_min} min`;step(3);});
$('#backDate').addEventListener('click',()=>step(2));
$('#bookingPhone').addEventListener('input',e=>{let s=e.target.value.replace(/\D/g,'').slice(0,11);e.target.value=s.length<=2?'('+s:s.length<=7?`(${s.slice(0,2)}) ${s.slice(2)}`:`(${s.slice(0,2)}) ${s.slice(2,7)}-${s.slice(7)}`;});
$('#bookingForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!$('#bookingConsent').checked||!selected||!date||!time)return;
 const btn=$('#confirmBooking');btn.disabled=true;btn.textContent='Confirmando...';showError('');
 try{const body={serviceId:selected.id,date,time,name:$('#bookingName').value,phone:$('#bookingPhone').value,website:$('#bookingForm').elements.website.value};const data=await api('book',{body});
 lastBooking=data.booking;$('#successText').textContent=`${data.booking.name}, seu horário está reservado no sistema da Dom Ruiz.`;
 $('#successSummary').innerHTML=`<strong>${htmlEscape(data.booking.service)}</strong><br>${htmlEscape(prettyDate(data.booking.date))}, ${htmlEscape(data.booking.time)}<br>${money(data.booking.price)} · ${data.booking.minutes} min`;
 const msg=`Olá! Acabei de agendar pelo site da Dom Ruiz.\nNome: ${data.booking.name}\nServiço: ${data.booking.service}\nDia: ${data.booking.date}\nHorário: ${data.booking.time}\nReserva: ${data.booking.id.slice(0,8)}`;
 $('#notifyWhatsapp').href='https://wa.me/'+cfg.whatsapp+'?text='+encodeURIComponent(msg);
 try{sessionStorage.setItem('domRuizLastBooking',JSON.stringify(lastBooking));}catch{}
 step(4);
 }catch(err){showError(err.message);if(/horário|reservar|disponível/i.test(err.message)){await loadSlots();step(2);showError(err.message);}}
 finally{btn.disabled=false;btn.innerHTML=`Confirmar horário ${icon('check')}`;}
});
$('#newBooking').addEventListener('click',()=>{selected=null;$('#goDate').disabled=true;$('#bookingForm').reset();$$('.choose-service').forEach(x=>x.classList.remove('selected'));openBooking();});
$('#cancelBooking').addEventListener('click',async()=>{if(!lastBooking||!confirm('Cancelar este agendamento?'))return;const button=$('#cancelBooking');button.disabled=true;try{await api('cancel',{body:{token:lastBooking.token}});alert('Agendamento cancelado.');try{sessionStorage.removeItem('domRuizLastBooking');}catch{}closeBooking();}catch(err){showError(err.message);}finally{button.disabled=false;}});
$('#prevServices').addEventListener('click',()=>track.scrollBy({left:-track.clientWidth*.75,behavior:'smooth'}));
$('#nextServices').addEventListener('click',()=>track.scrollBy({left:track.clientWidth*.75,behavior:'smooth'}));
const toggle=$('#menuToggle'),menu=$('#mobileMenu');toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));});$$('#mobileMenu a, #mobileMenu button').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');}));
$('#year').textContent=String(new Date().getFullYear());loadServices();
})();
