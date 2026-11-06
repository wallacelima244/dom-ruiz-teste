/* Dom Ruiz • Studio Manager. Sessão no navegador, permissões verificadas no servidor. */
(() => {
  'use strict';
  const cfg = window.DOM_RUIZ_CONFIG || {api:'/api/index',supabaseUrl:'',supabasePublishableKey:''};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const SP = 'America/Sao_Paulo';
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: SP, year: 'numeric', month: '2-digit', day: '2-digit' });
  const localDate = (d = new Date()) => formatter.format(d);
  const dateString = (s) => new Date(`${s}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
  const dayOf = (iso) => formatter.format(new Date(iso));
  const hourOf = (iso) => new Intl.DateTimeFormat('pt-BR', { timeZone: SP, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const escaped = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = n => `<svg aria-hidden="true"><use href="#a-${n}"></use></svg>`;
  const labelFor = {booked:'Reservado', completed:'Concluído', cancelled:'Cancelado', no_show:'Faltou',blocked:'Bloqueado'};
  let session = null, currentView = 'overview', services = [], agenda = [], customerBookings = [], activeModal = null;
  let lastToast;

  function alertError(msg) { const a = $('#mainAlert'); a.hidden = !msg; a.textContent = msg || ''; }
  function toast(msg) { const t=$('#toast'); clearTimeout(lastToast); t.textContent=msg; t.hidden=false; lastToast=setTimeout(()=>t.hidden=true,4500); }
  function setSession(data) { session = data; try { if(data)sessionStorage.setItem('domRuizAdminSession', JSON.stringify(data)); else sessionStorage.removeItem('domRuizAdminSession'); } catch {} }
  async function auth(path, body, token) {
    const response = await fetch(cfg.supabaseUrl+'/auth/v1/'+path, { method: 'POST', headers: {
      apikey:cfg.supabasePublishableKey, 'Content-Type':'application/json', ...(token?{Authorization:'Bearer '+token}:{})
    }, body: body?JSON.stringify(body):undefined });
    let data={};try{data=await response.json();}catch{}
    if (!response.ok) throw new Error(data.msg || data.error_description || data.message || 'Não foi possível autenticar.');
    return data;
  }
  async function refreshSession() {
    if(!session?.refresh_token) throw new Error('Sessão expirada. Entre novamente.');
    const data = await auth('token?grant_type=refresh_token', {refresh_token:session.refresh_token});
    setSession(data);return data.access_token;
  }
  async function api(action, options={}) {
    let params = new URLSearchParams({action,...(options.params||{})});
    const request = async token => {
      const response=await fetch(`${cfg.api}?${params}`, {
        method: options.body?'POST':'GET',
        headers:{...(token?{Authorization:'Bearer '+token}:{}),...(options.body?{'Content-Type':'application/json'}:{})},
        body:options.body?JSON.stringify(options.body):undefined, cache:'no-store'
      });
      let data={};try{data=await response.json();}catch{}
      return {response,data};
    };
    let result;
    try { result=await request(session?.access_token); if(result.response.status===401 && session?.refresh_token) result=await request(await refreshSession()); }
    catch(e) { throw new Error(e?.message?.includes('Sessão expirada')?e.message:'Sem conexão com o servidor. Verifique a internet e se o site foi publicado na Vercel.'); }
    if(!result.response.ok) throw new Error(result.data.error||'Não foi possível concluir a operação.');
    return result.data;
  }
  async function start() {
    $('#adminYear').textContent=String(new Date().getFullYear());$('#agendaDate').value=localDate();
    try { const saved=sessionStorage.getItem('domRuizAdminSession'); if(saved)session=JSON.parse(saved); } catch {}
    if(session?.access_token) {
      try { await api('overview'); showApp(); await showView('overview'); return; } catch (e) { setSession(null); showLogin(); const err=$('#loginError');err.hidden=false;err.textContent=e.message; return; }
    }
    showLogin();
  }
  function showLogin() { $('#loginScreen').hidden=false;$('#adminApp').hidden=true;$('#loginPassword').value=''; }
  function showApp() { $('#loginScreen').hidden=true;$('#adminApp').hidden=false; }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();const btn=$('#loginBtn'),err=$('#loginError');err.hidden=true;btn.disabled=true;
    try {
      const data=await auth('token?grant_type=password', {email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});
      setSession(data);await api('overview');showApp();await showView('overview');
    } catch (e) {setSession(null);err.hidden=false;err.textContent=/Invalid login credentials/i.test(e.message)?'Email ou senha incorretos.':e.message;}
    finally{btn.disabled=false;}
  });
  $('#logoutBtn').addEventListener('click',async()=>{
    const token=session?.access_token;setSession(null);showLogin();
    if(token){try{await auth('logout',null,token);}catch{}}
  });
  function nav(view) {
    currentView=view;
    $$('.side-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    $$('.view').forEach(v=>v.hidden=v.dataset.view!==view);
    const names={overview:'Visão geral',appointments:'Agenda',customers:'Clientes',services:'Serviços',hours:'Funcionamento'};
    $('#viewHeading').textContent=names[view];$('#sidebar').classList.remove('open');alertError('');
  }
  async function showView(view) {
    nav(view);
    try {
      if(view==='overview')await loadOverview();
      if(view==='appointments')await loadAgenda();
      if(view==='customers')await loadCustomers();
      if(view==='services')await loadServices();
      if(view==='hours')await loadHours();
    }catch(e){alertError(e.message);}
  }
  $$('.side-nav button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.goto)));
  $('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#refreshOverview').addEventListener('click',()=>showView('overview'));

  async function loadOverview() {
    const r=await api('overview');const rows=r.month.filter(x=>x.kind==='booking');const today=r.today;
    const complete=rows.filter(x=>x.status==='completed');const revenue=complete.reduce((a,x)=>a+Number(x.service_price||0),0);
    $('#overviewDate').textContent='MOVIMENTO DE '+new Date(today+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',month:'long',year:'numeric'}).toUpperCase();
    $('#statRevenue').textContent=money(revenue);$('#statCompleted').textContent=String(complete.length);
    $('#statToday').textContent=String(r.todayBookings.filter(x=>x.kind==='booking'&&x.status==='booked').length);
    $('#statBooked').textContent=String(rows.filter(x=>x.status==='booked').length);
    const chart=$('#revenueChart');chart.replaceChildren();const [yy,mm]=today.split('-').map(Number);
    const days=new Date(Date.UTC(yy,mm,0)).getUTCDate();const dailyTotals=Array(days).fill(0);
    complete.forEach(x=>{const d=dayOf(x.starts_at);if(d.slice(0,7)===today.slice(0,7)){const ix=Number(d.slice(-2))-1;dailyTotals[ix]+=Number(x.service_price||0);}});
    const max=Math.max(...dailyTotals,1);dailyTotals.forEach((value,i)=>{
      const col=document.createElement('div');col.className='bar-item';col.title=`Dia ${i+1}: ${money(value)}`;
      const tip=document.createElement('small');tip.textContent=money(value);
      const bar=document.createElement('div');bar.className='bar-fill';bar.style.height=(value?Math.max(4,value/max*190):1)+'px';
      const day=document.createElement('span');day.textContent=(i+1)%5===0||i===0?String(i+1):'';
      col.append(tip,bar,day);chart.append(col);
    });
    const preview=$('#todayPreview');preview.replaceChildren();const todayRows=r.todayBookings.filter(x=>x.kind==='booking'&&x.status==='booked');
    if(!todayRows.length){preview.innerHTML='<p class="empty">Nenhuma reserva ativa para hoje.</p>';return;}
    todayRows.slice(0,7).forEach(x=>{
      const item=document.createElement('div');item.className='today-item';
      item.innerHTML=`<span class="today-time">${escaped(hourOf(x.starts_at))}</span><div><strong>${escaped(x.customer_name)}</strong><small>${escaped(x.service_name||'Serviço')}</small></div><span class="status booked">Reservado</span>`;
      preview.append(item);
    });
  }

  function statusTag(status){return `<span class="status ${escaped(status)}">${escaped(labelFor[status]||status)}</span>`;}
  function whatsapp(phone,text){return 'https://wa.me/55'+String(phone||'').replace(/\D/g,'')+'?text='+encodeURIComponent(text||'Olá! Aqui é da Barbearia Dom Ruiz.');}
  async function loadAgenda(){
    const date=$('#agendaDate').value||localDate();const r=await api('day',{params:{date}});agenda=r.appointments||[];
    $('#dayCount').textContent=`${agenda.filter(x=>x.kind==='booking').length} reserva(s) · ${dateString(date)}`;
    const area=$('#dayAppointments');area.replaceChildren();if(!agenda.length){area.innerHTML='<p class="empty">Nenhum agendamento ou bloqueio neste dia.</p>';return;}
    agenda.forEach(x=>{
      const item=document.createElement('div');item.className='appointment-item';
      const blocked=x.kind==='block';const name=blocked?'Horário indisponível':x.customer_name;
      item.innerHTML=`<div class="appointment-clock">${escaped(hourOf(x.starts_at))}</div><div class="appointment-main"><strong>${escaped(name)}</strong><p>${escaped(blocked?(x.notes||'Bloqueio'):x.service_name||'Serviço')}${blocked?'':' · '+money(x.service_price)}</p><small>${escaped(hourOf(x.starts_at))} às ${escaped(hourOf(x.ends_at))}${blocked?'':' · '+escaped(x.customer_phone)}</small></div>${statusTag(x.status)}<div class="appointment-actions"></div>`;
      const actions=item.querySelector('.appointment-actions');
      function action(title,handler){const b=document.createElement('button');b.type='button';b.textContent=title;b.addEventListener('click',handler);actions.append(b);}
      if(blocked){action('Liberar',()=>changeBlock(x.id));}
      else {
        const a=document.createElement('a');a.href=whatsapp(x.customer_phone,`Olá, ${x.customer_name}! Aqui é da Barbearia Dom Ruiz sobre seu horário de ${dateString(date)} às ${hourOf(x.starts_at)}.`);a.target='_blank';a.rel='noopener';a.textContent='WhatsApp';actions.append(a);
        if(x.status==='booked'){
          action('Concluir',()=>changeBooking(x.id,'completed'));
          action('Faltou',()=>changeBooking(x.id,'no_show'));
          action('Reagendar',()=>reschedule(x));
          action('Cancelar',()=>changeBooking(x.id,'cancelled'));
        }
        if(x.status==='completed'||x.status==='no_show')action('Reabrir',()=>changeBooking(x.id,'booked'));
      }
      area.append(item);
    });
  }
  async function changeBooking(id,status){
    const msg={completed:'Marcar o atendimento como concluído?',cancelled:'Cancelar esta reserva?',no_show:'Marcar como falta?',booked:'Reabrir este atendimento?'};
    if(!confirm(msg[status]||'Alterar atendimento?'))return;
    try{await api('change-booking',{body:{id,status}});toast('Atendimento atualizado.');await loadAgenda();}catch(e){alertError(e.message);}
  }
  async function changeBlock(id){if(!confirm('Liberar este horário?'))return;try{await api('cancel-block',{body:{id}});toast('Horário liberado.');await loadAgenda();}catch(e){alertError(e.message);}}
  function showModal(title,html,submit){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modalShade').hidden=false;$('#adminModal').hidden=false;
    activeModal=submit;if(submit){const form=$('#adminModal form');form.addEventListener('submit',async e=>{e.preventDefault();const btn=form.querySelector('[type=submit]');if(btn)btn.disabled=true;
      try{await activeModal(new FormData(form),form);closeModal();toast('Alteração salva.');await showView(currentView);}catch(err){const msg=form.querySelector('.modal-error');if(msg){msg.textContent=err.message;msg.hidden=false;}else alertError(err.message);}finally{if(btn)btn.disabled=false;}
    });}
  }
  function closeModal(){activeModal=null;$('#modalShade').hidden=true;$('#adminModal').hidden=true;$('#modalBody').replaceChildren();}
  $('#modalClose').addEventListener('click',closeModal);$('#modalShade').addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#adminModal').hidden)closeModal();});
  const days=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  $('#agendaDate').addEventListener('change',()=>loadAgenda().catch(e=>alertError(e.message)));
  function incrementDay(steps){const d=new Date($('#agendaDate').value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+steps);$('#agendaDate').value=d.toISOString().slice(0,10);loadAgenda().catch(e=>alertError(e.message));}
  $('#prevDay').addEventListener('click',()=>incrementDay(-1));$('#nextDay').addEventListener('click',()=>incrementDay(1));
  async function getServices(){services=(await api('all-services')).services||[];return services;}
  const field=(label,name,type,value='',extra='')=>`<label>${label}<input name="${name}" type="${type}" value="${escaped(value)}" ${extra}></label>`;
  const modalError='<p class="form-feedback modal-error" role="alert" hidden></p>';
  $('#newManual').addEventListener('click',async()=>{
    try{await getServices();}catch(e){return alertError(e.message);}
    showModal('Adicionar agendamento',`<form class="form-grid">
      <div class="span2">${field('Cliente','name','text','', 'required minlength="2" maxlength="80"')}</div>
      <div class="span2">${field('WhatsApp com DDD','phone','tel','', 'required minlength="11"')}</div>
      <label class="span2">Serviço<select name="serviceId" required>${services.filter(x=>x.active).map(x=>`<option value="${x.id}">${escaped(x.name)} · ${money(x.price)} (${x.duration_min} min)</option>`).join('')}</select></label>
      ${field('Data','date','date',$('#agendaDate').value,'required')}
      ${field('Horário','time','time','13:00','required step="900"')}
      <div class="span2">${modalError}</div><button class="btn btn-primary span2" type="submit">Salvar agendamento</button>
      <p class="modal-hint span2">Para manter a agenda organizada, só serão aceitos horários disponíveis e dentro do expediente.</p>
    </form>`,async f=>{await api('manual-booking',{body:{name:f.get('name'),phone:f.get('phone'),serviceId:f.get('serviceId'),date:f.get('date'),time:f.get('time')}});});
  });
  function reschedule(x){
    showModal('Reagendar '+x.customer_name,`<form class="form-grid"><div class="span2"><p class="modal-hint">${escaped(x.service_name)} · Horário original: ${escaped(hourOf(x.starts_at))}</p></div>
      ${field('Nova data','date','date',$('#agendaDate').value,'required')}${field('Novo horário','time','time',hourOf(x.starts_at),'required step="900"')}
      <div class="span2">${modalError}</div><button class="btn btn-primary span2" type="submit">Salvar alteração</button></form>`,async f=>{await api('change-booking',{body:{id:x.id,status:'booked',date:f.get('date'),time:f.get('time')}});});
  }
  const newBlock=document.createElement('button');newBlock.className='btn btn-ghost';newBlock.type='button';newBlock.innerHTML=svg('lock')+' Bloquear horário';$('#newManual').before(newBlock);
  newBlock.addEventListener('click',()=>{
    showModal('Bloquear um horário',`<form class="form-grid">${field('Data','date','date',$('#agendaDate').value,'required')}${field('Início','time','time','13:00','required')}${field('Fim','end_time','time','14:00','required')}
      <div class="span2">${field('Motivo (opcional)','reason','text','Indisponível','maxlength="200"')}</div><div class="span2">${modalError}</div><button class="btn btn-primary span2" type="submit">Bloquear</button></form>`,async f=>{await api('block-time',{body:Object.fromEntries(f)});});
  });
  $('#exportDay').addEventListener('click',()=>{
    if(!agenda.length)return toast('Não há registros para exportar.');
    const headers=['Data','Início','Fim','Cliente','Telefone','Serviço','Preço','Status','Origem'];
    const rows=agenda.map(x=>[$('#agendaDate').value,hourOf(x.starts_at),hourOf(x.ends_at),x.customer_name||'',x.customer_phone||'',x.service_name||x.notes||'',x.service_price||'',labelFor[x.status]||x.status,x.source||'']);
    const cell=v=>'"'+String(v??'').replace(/^[=+@\-]/,m=>"'"+m).replace(/"/g,'""')+'"';
    const csv='\ufeff'+[headers,...rows].map(row=>row.map(cell).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`dom-ruiz-agenda-${$('#agendaDate').value}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  });

  async function loadCustomers(){const r=await api('customers');customerBookings=r.bookings||[];renderCustomers();}
  function renderCustomers(){
    const grouped=new Map();for(const x of customerBookings){const key=x.customer_phone;if(!key)continue;const item=grouped.get(key)||{name:x.customer_name,phone:key,count:0,last:x.starts_at};item.count++;if(x.starts_at>item.last){item.last=x.starts_at;item.name=x.customer_name;}grouped.set(key,item);}
    const query=$('#customerSearch').value.toLowerCase().trim();const list=[...grouped.values()].sort((a,b)=>b.last.localeCompare(a.last)).filter(x=>(x.name+' '+x.phone).toLowerCase().includes(query));
    const tbody=$('#customerRows');tbody.replaceChildren();if(!list.length){tbody.innerHTML='<tr><td colspan="5">Nenhum cliente encontrado.</td></tr>';return;}
    list.forEach(x=>{const tr=document.createElement('tr');tr.innerHTML=`<td><strong>${escaped(x.name)}</strong></td><td>${escaped(x.phone)}</td><td>${x.count}</td><td>${escaped(dateString(dayOf(x.last)))}</td><td><a target="_blank" rel="noopener" href="${escaped(whatsapp(x.phone,`Olá, ${x.name}! Aqui é da Barbearia Dom Ruiz.`))}">WhatsApp ↗</a></td>`;tbody.append(tr);});
  }
  $('#customerSearch').addEventListener('input',renderCustomers);

  async function loadServices(){await getServices();const area=$('#adminServices');area.replaceChildren();
    if(!services.length){area.innerHTML='<p class="empty">Nenhum serviço cadastrado.</p>';return;}
    services.forEach(s=>{
      const card=document.createElement('article');card.className='admin-service';
      card.innerHTML=`<img loading="lazy" src="${escaped(s.image_path||'/assets/logo.jpg.jpeg')}" alt=""><div class="admin-service-body"><h3>${escaped(s.name)}</h3><p>${escaped(s.description||'')}<br>${s.duration_min} min · ${s.active?'Ativo':'Oculto no site'}</p><strong>${money(s.price)}</strong><button class="small-link" type="button">Editar serviço →</button></div>`;
      card.querySelector('button').addEventListener('click',()=>editService(s));area.append(card);
    });
  }
  $('#newService').addEventListener('click',()=>editService(null));
  function editService(s){
    showModal(s?'Editar serviço':'Novo serviço',`<form class="form-grid">
      <div class="span2">${field('Nome do serviço','name','text',s?.name||'','required maxlength="90"')}</div>
      <div class="span2"><label>Descrição<textarea name="description" maxlength="300">${escaped(s?.description||'')}</textarea></label></div>
      ${field('Preço (R$)','price','number',s?.price??'0','required min="0" max="50000" step="0.01"')}
      ${field('Duração (min)','duration_min','number',s?.duration_min||30,'required min="5" max="240" step="1"')}
      ${field('Posição na lista','sort_order','number',s?.sort_order??(services.length+1),'min="0" max="9999"')}
      <div class="form-check"><input id="serviceActive" type="checkbox" name="active" ${s?.active!==false?'checked':''}><label for="serviceActive">Exibir no site</label></div>
      <div class="span2">${field('Caminho da imagem','image_path','text',s?.image_path||'','placeholder="/assets/foto.jpg" maxlength="255"')}</div>
      <div class="span2"><label>Enviar nova foto (JPEG, PNG ou WebP, até 1,6 MB)<input type="file" name="image" accept="image/png,image/jpeg,image/webp"></label></div>
      <div class="span2">${modalError}</div><button class="btn btn-primary span2" type="submit">Salvar serviço</button></form>`,async (f,form)=>{
        let path=f.get('image_path')||'';const file=form.querySelector('[name=image]').files[0];
        if(file){if(file.size>1700000)throw new Error('Foto muito grande. Use até 1,6 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use foto JPEG, PNG ou WebP.');
          const b64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
          path=(await api('upload-image',{body:{base64:b64,mime:file.type}})).url;
        }
        await api('save-service',{body:{id:s?.id||undefined,name:f.get('name'),description:f.get('description'),price:Number(f.get('price')),duration_min:Number(f.get('duration_min')),sort_order:Number(f.get('sort_order')),active:f.has('active'),image_path:path}});
      });
  }
  async function loadHours(){const r=await api('admin-hours');const area=$('#hoursRows');area.replaceChildren();
    (r.hours||[]).forEach(h=>{
      const wrap=document.createElement('div');wrap.className='hours-item';wrap.innerHTML=`<strong>${days[h.weekday]}</strong><input type="time" value="${escaped(h.open_at.slice(0,5))}" aria-label="Abertura de ${days[h.weekday]}"><input type="time" value="${escaped(h.close_at.slice(0,5))}" aria-label="Fechamento de ${days[h.weekday]}"><label class="checkbox-group"><input type="checkbox" ${h.is_open?'checked':''}> Aberto</label><button type="button">Salvar</button>`;
      wrap.querySelector('button').addEventListener('click',async()=>{
        const times=wrap.querySelectorAll('input[type=time]');const enabled=wrap.querySelector('input[type=checkbox]').checked;const btn=wrap.querySelector('button');btn.disabled=true;
        try{await api('save-hours',{body:{weekday:h.weekday,open_at:times[0].value,close_at:times[1].value,is_open:enabled}});toast('Horário de '+days[h.weekday]+' salvo.');}catch(e){alertError(e.message);}finally{btn.disabled=false;}
      });area.append(wrap);
    });
  }
  start();
})();
