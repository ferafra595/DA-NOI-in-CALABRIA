const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const app=$('#app');
const provinces=['Catanzaro','Cosenza','Crotone','Reggio Calabria','Vibo Valentia'];
const cats=['Feste patronali','Sagre','Concerti','Musica','Cultura','Tradizioni','Sport','Eventi per bambini','Enogastronomia','Fiere/Mercatini','Feste Locali'];
const state={events:[],places:[],partners:[],territories:[],fields:[],settings:{}};
const api=async u=>{const r=await fetch(u);if(!r.ok)throw new Error();return r.json()};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
const fmt=d=>{if(!d)return'';return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'))};
const month=d=>{if(!d)return'';return new Intl.DateTimeFormat('it-IT',{month:'short'}).format(new Date(d+'T12:00:00')).replace('.','').toUpperCase()};
const day=d=>(d||'').slice(8,10);
function formatEventRange(e){
  if(!e?.start_date)return '';
  const start=e.start_date;
  const end=e.end_date&&e.end_date!==e.start_date?e.end_date:null;
  if(!end)return `${day(start)} ${month(start)}`;
  const sameMonth=month(start)===month(end);
  return sameMonth?`${day(start)}–${day(end)} ${month(start)}`:`${day(start)} ${month(start)} – ${day(end)} ${month(end)}`;
}
const keySlug=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const img=(src,fallback='https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80')=>src||fallback;
async function load(){const req=async(u,k)=>{try{const j=await api(u);state[k]=j.items||j}catch{}};await Promise.all([req('/api/events','events'),req('/api/places','places'),req('/api/partners','partners'),req('/api/territories','territories'),req('/api/submission-fields','fields'),req('/api/settings','settings')]);applyBrand();route()}
function applyBrand(){const b=$('.brand img');if(b&&state.settings.logo_black)b.src=state.settings.logo_black;const root=document.documentElement;root.style.setProperty('--logo-desktop-width',(Number(state.settings.logo_header_width)||210)+'px');root.style.setProperty('--logo-mobile-width',(Number(state.settings.logo_header_width_mobile)||155)+'px');root.style.setProperty('--logo-footer-width',(Number(state.settings.logo_footer_width)||190)+'px')}
function footer(){return `<footer class="footer"><div class="container footer-grid"><img src="${esc(state.settings.logo_white||'/assets/logo-white.png')}" alt="Marchesato in Festa"><div class="footer-links"><a href="#/eventi">Eventi</a><a href="#/territorio">Territorio</a><a href="#/mangiare">Dove mangiare</a><a href="#/dormire">Dove dormire</a><a href="#/partner">Partner</a><a href="/admin">Area riservata</a></div><div>© 2026 Marchesato in Festa</div></div></footer>`}

function eventDateRange(e,compact=false){
  const start=e.start_date;
  const end=e.end_date&&e.end_date!==e.start_date?e.end_date:null;
  if(!start)return '';
  if(!end){
    return compact?`<div class="agenda-date">${day(start)}<small>${month(start)}</small></div>`:`<div class="date-big">${day(start)}<small>${month(start)}</small></div>`;
  }
  const sameMonth=month(start)===month(end);
  if(compact){
    return `<div class="agenda-date agenda-date-range"><span>${day(start)}</span><b>–</b><span>${day(end)}</span><small>${sameMonth?month(start):month(start)+' / '+month(end)}</small></div>`;
  }
  return `<div class="date-big date-range"><span>${day(start)}</span><b>–</b><span>${day(end)}</span><small>${sameMonth?month(start):month(start)+' / '+month(end)}</small></div>`;
}

function card(e){return `<a class="event-card" href="#/evento/${encodeURIComponent(e.slug)}"><img src="${esc(img(e.image))}" alt="${esc(e.title)}"><div class="event-card-body"><span class="badge">${esc(e.category)}</span>${eventDateRange(e)}<h3>${esc(e.title)}</h3><div class="meta">${esc(e.locality||e.city)}${e.city&&e.locality?` · ${esc(e.city)}`:''}</div></div></a>`}
function home(){const weekend=state.events.filter(e=>e.weekend).slice(0,6),upcoming=state.events.slice(0,7),hero=state.settings.hero_image||'';app.innerHTML=`<section class="hero"><div class="hero-bg" style="${hero?`background-image:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.18)),url('${esc(hero)}')`:''}"></div><div class="hero-content"><div class="eyebrow">EVENTI · TRADIZIONI · TERRITORIO</div><h1>Scopri cosa succede intorno a te.</h1><p>Feste, sagre, concerti ed eventi tra Marchesato, provincia di Crotone e Catanzaro.</p><form class="searchbar" id="heroSearch"><input placeholder="Cerca evento, comune o località"><button>⌕</button></form><div class="chips">${cats.slice(0,6).map(c=>`<a class="chip" href="#/eventi?cat=${encodeURIComponent(c)}">${c}</a>`).join('')}</div></div></section>
<section class="section compact"><div class="container"><div class="section-head"><div><h2>Questo weekend</h2><p>Scopri cosa fare da venerdì a domenica.</p></div><a class="text-link" href="#/eventi">Vedi tutti →</a></div><div class="scroll-row">${(weekend.length?weekend:upcoming.slice(0,4)).map(card).join('')}</div></div></section>
<section class="section alt"><div class="container"><div class="section-head"><div><h2>Prossimi eventi</h2><p>Tutti gli eventi in ordine cronologico.</p></div><a class="text-link" href="#/eventi">Vedi tutti →</a></div><div class="agenda">${upcoming.map(e=>`<a class="agenda-item" href="#/evento/${encodeURIComponent(e.slug)}">${eventDateRange(e,true)}<img class="agenda-thumb" src="${esc(img(e.image))}"><div><h3>${esc(e.title)}</h3><div class="meta">${esc(e.city)}</div></div><span class="pill">${esc(e.category)}</span></a>`).join('')}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><div><h2>Esplora per categoria</h2><p>Trova l'evento giusto per te.</p></div></div><div class="category-grid">${cats.slice(0,6).map((c,i)=>`<a class="category-card" href="#/eventi?cat=${encodeURIComponent(c)}"><img src="${esc(state.settings['cat_'+keySlug(c)]||`https://images.unsplash.com/photo-${['1533174072545-7a4b6ad7a6c3','1501386761578-eac5c94b800a','1492684223066-81342ee5ff30','1529156069898-49953e39b3ac','1500530855697-b586d89ba3ee','1511795409834-ef04bbd61622'][i]}?auto=format&fit=crop&w=700&q=80`)}"><span>${c}</span></a>`).join('')}</div></div></section>
<section class="section alt"><div class="container"><div class="section-head"><div><h2>Esplora il territorio</h2><p>Comuni, eventi e tradizioni.</p></div><a class="text-link" href="#/territorio">Vedi tutti →</a></div><div class="territory-grid">${(state.territories.length?state.territories.slice(0,6):[{id:0,name:'Marchesato',province:'Crotone',image:'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1000&q=80'}]).map(t=>`<a class="territory-card" href="#/territorio/${t.id}"><img src="${esc(img(t.image))}"><div><h3>${esc(t.name)}</h3><small>${esc(t.province)}</small></div></a>`).join('')}</div></div></section>
<section class="section"><div class="container split-banner"><a class="feature-banner" href="#/mangiare"><img src="${esc(state.settings.eat_banner||'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80')}"><div><h3>Dove mangiare</h3><p>Scopri i sapori del territorio.</p></div></a><a class="feature-banner" href="#/dormire"><img src="${esc(state.settings.sleep_banner||'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80')}"><div><h3>Dove dormire</h3><p>Trova la sistemazione giusta.</p></div></a></div></section>
${footer()}`;$('#heroSearch').onsubmit=e=>{e.preventDefault();location.hash='#/cerca?q='+encodeURIComponent(e.target.querySelector('input').value)}}
function eventsPage(initialView='list'){
  const q=new URLSearchParams((location.hash.split('?')[1]||''));
  const cat=q.get('cat')||'';
  const term=(q.get('q')||'').toLowerCase();
  let currentView=q.get('view')||initialView;
  let calendarDate=getCalendarStart();

  const filteredEvents=()=>{
    const qq=($('#q')?.value||term).toLowerCase();
    const cc=$('#cat')?.value||cat;
    const pp=$('#prov')?.value||'';
    return state.events.filter(e=>(!cc||e.category===cc)&&(!pp||e.province===pp)&&(!qq||[e.title,e.city,e.locality,e.category].join(' ').toLowerCase().includes(qq)));
  };

  app.innerHTML=`<section class="page-hero"><div class="container"><div class="eyebrow">AGENDA</div><h1>Eventi</h1><p>Scopri gli eventi del territorio e scegli come visualizzarli.</p></div></section>
  <section class="section"><div class="container">
    <div class="events-toolbar">
      <div class="view-toggle" role="group" aria-label="Visualizzazione eventi">
        <button type="button" class="view-btn ${currentView==='list'?'active':''}" data-view="list">☰ Lista</button>
        <button type="button" class="view-btn ${currentView==='calendar'?'active':''}" data-view="calendar">▦ Calendario</button>
      </div>
    </div>
    <div class="filterbar"><input id="q" placeholder="Cerca..." value="${esc(q.get('q')||'')}"><select id="cat"><option value="">Tutte le categorie</option>${cats.map(c=>`<option ${c===cat?'selected':''}>${c}</option>`).join('')}</select><select id="prov"><option value="">Tutte le province</option>${provinces.map(p=>`<option>${p}</option>`).join('')}</select></div>
    <div id="eventsView"></div>
  </div></section>${footer()}`;

  function getCalendarStart(){
    const sorted=[...state.events].filter(e=>e.start_date).sort((a,b)=>a.start_date.localeCompare(b.start_date));
    const now=new Date();
    const future=sorted.find(e=>new Date(e.start_date+'T12:00:00')>=new Date(now.getFullYear(),now.getMonth(),1));
    const base=future?new Date(future.start_date+'T12:00:00'):now;
    return new Date(base.getFullYear(),base.getMonth(),1);
  }

  function renderList(list){
    $('#eventsView').innerHTML=`<div class="grid-events">${list.map(card).join('')||'<div class="empty">Nessun evento trovato.</div>'}</div>`;
  }

  function renderCalendar(list){
    const y=calendarDate.getFullYear(),m=calendarDate.getMonth();
    const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate();
    const offset=(first.getDay()+6)%7;
    const monthLabel=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(first);
    const byDay={};
    const monthStart=new Date(y,m,1,12,0,0);
    const monthEnd=new Date(y,m+1,0,12,0,0);

    list.forEach(e=>{
      if(!e.start_date)return;

      const start=new Date(e.start_date+'T12:00:00');
      const end=new Date((e.end_date||e.start_date)+'T12:00:00');
      if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))return;

      // Se per errore la data finale precede quella iniziale, usa un solo giorno.
      const safeEnd=end<start?start:end;
      if(safeEnd<monthStart||start>monthEnd)return;

      const cursor=new Date(start<monthStart?monthStart:start);
      const last=new Date(safeEnd>monthEnd?monthEnd:safeEnd);

      while(cursor<=last){
        const n=cursor.getDate();
        const dateKey=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
        const isStart=dateKey===e.start_date;
        const isEnd=dateKey===(e.end_date||e.start_date);
        (byDay[n]||(byDay[n]=[])).push({...e,_calIsStart:isStart,_calIsEnd:isEnd,_calDate:dateKey});
        cursor.setDate(cursor.getDate()+1);
      }
    });
    let cells='';
    for(let i=0;i<offset;i++)cells+='<div class="cal-cell muted"></div>';
    for(let d=1;d<=days;d++){
      const ev=(byDay[d]||[]).slice(0,3);
      cells+=`<div class="cal-cell"><div class="num">${d}</div>${ev.map(e=>{
        const rangeClass=e._calIsStart&&e._calIsEnd?' single':e._calIsStart?' range-start':e._calIsEnd?' range-end':' range-middle';
        const dateRange=e.end_date&&e.end_date!==e.start_date?`<small class="cal-range">${esc(formatEventRange(e))}</small>`:'';
        return `<a class="cal-event${rangeClass}" href="#/evento/${encodeURIComponent(e.slug)}" title="${esc(e.title)}"><b>${esc(e.title)}</b>${dateRange}<span>${esc(e.city||e.locality||'')}</span></a>`;
      }).join('')}${(byDay[d]||[]).length>3?`<div class="cal-more">+${byDay[d].length-3} altri</div>`:''}</div>`;
    }
    $('#eventsView').innerHTML=`<div class="calendar-shell"><div class="calendar-top"><button class="cal-nav" id="prevMonth" type="button">←</button><h2>${monthLabel}</h2><button class="cal-nav" id="nextMonth" type="button">→</button></div><div class="calendar-scroll"><div class="calendar"><div class="cal-head">Lun</div><div class="cal-head">Mar</div><div class="cal-head">Mer</div><div class="cal-head">Gio</div><div class="cal-head">Ven</div><div class="cal-head">Sab</div><div class="cal-head">Dom</div>${cells}</div></div></div>`;
    $('#prevMonth').onclick=()=>{calendarDate=new Date(y,m-1,1);renderCalendar(filteredEvents())};
    $('#nextMonth').onclick=()=>{calendarDate=new Date(y,m+1,1);renderCalendar(filteredEvents())};
  }

  const refresh=()=>{
    const list=filteredEvents();
    currentView==='calendar'?renderCalendar(list):renderList(list);
  };
  $$('.view-btn').forEach(b=>b.onclick=()=>{
    currentView=b.dataset.view;
    $$('.view-btn').forEach(x=>x.classList.toggle('active',x===b));
    refresh();
  });
  ['q','cat','prov'].forEach(id=>$('#'+id).addEventListener(id==='q'?'input':'change',refresh));
  refresh();
}
function parsePublicProgram(raw,startDate){
  if(!raw)return [];
  if(Array.isArray(raw))return raw;
  if(typeof raw==='string'){
    try{const p=JSON.parse(raw);if(Array.isArray(p))return p}catch{}
    return [{date:startDate||'',text:raw}];
  }
  return [];
}
function fullDate(iso){if(!iso)return '';return new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long'}).format(new Date(iso+'T12:00:00'))}
function renderProgramText(text){
  const lines=String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  return lines.map(line=>{
    const m=line.match(/^[-•]?\s*(\d{1,2}[.:]\d{2})\s*[-–:]?\s*(.*)$/);
    if(m)return `<div class="program-item"><div class="program-time">${esc(m[1].replace('.',':'))}</div><div class="program-desc">${esc(m[2]||'')}</div></div>`;
    return `<div class="program-item program-item-no-time"><div class="program-time">•</div><div class="program-desc">${esc(line.replace(/^[-•]\s*/,''))}</div></div>`;
  }).join('');
}
function eventDetail(slug){
  const e=state.events.find(x=>x.slug===decodeURIComponent(slug));if(!e)return notFound();
  const nearby=state.places.filter(p=>!e.city||p.city===e.city).slice(0,4);
  const days=parsePublicProgram(e.program,e.start_date);
  const program=days.length?`<section class="event-program"><div class="program-title"><span>PROGRAMMA</span><h2>Giorno per giorno</h2></div><div class="program-days">${days.map((d,i)=>`<article class="program-day-card"><div class="program-day-date"><span class="program-day-number">${String(i+1).padStart(2,'0')}</span><div><small>GIORNO ${i+1}</small><h3>${esc(fullDate(d.date))}</h3></div></div><div class="program-list">${renderProgramText(d.text)}</div></article>`).join('')}</div></section>`:'';
  app.innerHTML=`<section class="detail-hero"><img src="${esc(img(e.image))}"><div class="detail-title"><span class="badge">${esc(e.category)}</span><h1>${esc(e.title)}</h1><div>${fmt(e.start_date)} · ${esc(e.city)}${e.locality?` · ${esc(e.locality)}`:''}</div></div></section><div class="container detail-layout"><article><h2>Informazioni</h2><p>${esc(e.description||'')}</p>${program}${e.poster_url?`<h2>Locandina</h2><img src="${esc(e.poster_url)}" style="max-width:700px;border-radius:20px">`:''}${nearby.length?`<h2 style="margin-top:45px">Dove mangiare e dormire</h2><div class="grid-events">${nearby.map(placeCard).join('')}</div>`:''}</article><aside><div class="info-card"><div class="info-row"><b>Quando</b><br>${fmt(e.start_date)}${e.end_date&&e.end_date!==e.start_date?` — ${fmt(e.end_date)}`:''}</div><div class="info-row"><b>Dove</b><br>${esc(e.address||e.locality||e.city)}</div>${e.start_time?`<div class="info-row"><b>Ora</b><br>${esc(e.start_time)}</div>`:''}${e.organizer?`<div class="info-row"><b>Organizzato da</b><br>${esc(e.organizer)}</div>`:''}${e.phone?`<div class="info-row"><a class="btn btn-dark" href="tel:${esc(e.phone)}">Chiama</a></div>`:''}</div></aside></div>${footer()}`
}
function territoryPage(){
  app.innerHTML=`<section class="page-hero"><div class="container"><div class="eyebrow">ESPLORA</div><h1>Territorio</h1><p>Luoghi, comunità ed eventi del nostro territorio.</p></div></section><section class="section"><div class="container"><div class="territory-grid">${state.territories.map(t=>`<a class="territory-card" href="#/territorio/${t.id}"><img src="${esc(img(t.image))}" alt="${esc(t.name)}"><div><h3>${esc(t.name)}</h3><small>${esc(t.province)}</small></div></a>`).join('')||'<div class="empty">Nessun territorio inserito.</div>'}</div></div></section>${footer()}`;
}

function territoryDetail(id){const t=state.territories.find(x=>String(x.id)===String(id));if(!t)return territoryPage();const ev=state.events.filter(e=>e.area===t.name||e.city===t.name);app.innerHTML=`<section class="detail-hero"><img src="${esc(img(t.image))}"><div class="detail-title"><span class="badge">${esc(t.province)}</span><h1>${esc(t.name)}</h1></div></section><section class="section"><div class="container"><p style="max-width:800px;font-size:18px">${esc(t.description||'')}</p><div class="section-head" style="margin-top:45px"><h2>Eventi</h2></div><div class="grid-events">${ev.map(card).join('')||'<div class="empty">Nessun evento in programma.</div>'}</div></div></section>${footer()}`}
function reportPage(){const fields=state.fields.length?state.fields:[{field_key:'title',label:'Nome evento',field_type:'text',required:1},{field_key:'province',label:'Provincia',field_type:'province',required:1},{field_key:'city',label:'Comune',field_type:'text',required:1},{field_key:'start_date',label:'Data inizio',field_type:'date',required:1},{field_key:'email',label:'Email',field_type:'email',required:1}];app.innerHTML=`<section class="page-hero"><div class="container"><div class="eyebrow">COLLABORA</div><h1>Segnala un evento</h1><p>Inviaci le informazioni. La segnalazione verrà verificata prima della pubblicazione.</p></div></section><section class="section"><div class="container"><form class="report-form" id="report">${fields.map(fieldHtml).join('')}<div class="field full"><button class="btn btn-accent">Invia segnalazione</button></div></form><div id="msg"></div></div></section>${footer()}`;$('#report').onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));const r=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)});if(r.ok){e.target.reset();$('#msg').innerHTML='<div class="notice" style="margin-top:16px">Segnalazione ricevuta. La verificheremo prima della pubblicazione.</div>'}else $('#msg').innerHTML='<div class="notice" style="margin-top:16px">Controlla i campi obbligatori.</div>'}}
function fieldHtml(f){const req=f.required?'required':'',ph=esc(f.placeholder||'');if(f.field_type==='textarea')return `<div class="field full"><label>${esc(f.label)}${f.required?' *':''}</label><textarea name="${esc(f.field_key)}" placeholder="${ph}" ${req}></textarea></div>`;if(f.field_type==='province')return `<div class="field"><label>${esc(f.label)}${f.required?' *':''}</label><select name="${esc(f.field_key)}" ${req}><option value="">Seleziona</option>${provinces.map(p=>`<option>${p}</option>`).join('')}</select></div>`;if(f.field_type==='select'){const opts=String(f.options||'').split('|').filter(Boolean);return `<div class="field"><label>${esc(f.label)}${f.required?' *':''}</label><select name="${esc(f.field_key)}" ${req}><option value="">Seleziona</option>${opts.map(p=>`<option>${esc(p)}</option>`).join('')}</select></div>`}return `<div class="field"><label>${esc(f.label)}${f.required?' *':''}</label><input type="${esc(f.field_type||'text')}" name="${esc(f.field_key)}" placeholder="${ph}" ${req}></div>`}
function calendarPage(){eventsPage('calendar')}
function searchPage(){eventsPage();$('.page-hero h1').textContent='Cerca';setTimeout(()=>$('#q')?.focus(),50)}
function notFound(){app.innerHTML=`<section class="page-hero"><div class="container"><h1>Pagina non trovata</h1><a class="btn btn-light" href="#/">Torna alla Home</a></div></section>${footer()}`}
function route(){document.querySelector('#mobileMenu')?.classList.remove('open');const h=location.hash.replace(/^#\/?/,'')||'',parts=h.split('?')[0].split('/');if(!h)return home();if(parts[0]==='eventi')return eventsPage();if(parts[0]==='evento')return eventDetail(parts[1]);if(parts[0]==='calendario')return calendarPage();if(parts[0]==='territorio'&&parts[1])return territoryDetail(parts[1]);if(parts[0]==='territorio')return territoryPage();if(parts[0]==='mangiare')return placesPage('mangiare');if(parts[0]==='dormire')return placesPage('dormire');if(parts[0]==='attivita')return placeDetail(parts[1]);if(parts[0]==='partner'&&parts[1])return partnerDetail(parts[1]);if(parts[0]==='partner')return partnersPage();if(parts[0]==='segnala')return reportPage();if(parts[0]==='cerca')return searchPage();notFound()}
$('#menuToggle').onclick=()=>$('#mobileMenu').classList.toggle('open');window.addEventListener('hashchange',route);load();
