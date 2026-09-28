const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const bad=(m='Richiesta non valida',s=400)=>json({error:m},s);
const enc=new TextEncoder();
function slugify(s=''){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)}
async function hmac(secret,msg){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(msg));return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')}
async function makeSession(env){const exp=Date.now()+1000*60*60*12,payload=`admin.${exp}`,sig=await hmac(env.SESSION_SECRET||'change-me',payload);return `${payload}.${sig}`}
async function isAdmin(req,env){const cookie=req.headers.get('cookie')||'',m=cookie.match(/mif_session=([^;]+)/);if(!m)return false;const parts=m[1].split('.');if(parts.length!==3||parts[0]!=='admin')return false;const exp=Number(parts[1]);if(!exp||exp<Date.now())return false;return (await hmac(env.SESSION_SECRET||'change-me',`admin.${exp}`))===parts[2]}
async function body(req){try{return await req.json()}catch{return{}}}
async function uniqueSlug(env,title,date,id){let base=slugify(`${title}-${(date||'').slice(0,4)}`)||`evento-${Date.now()}`;let slug=base,n=2;while(true){const row=await env.DB.prepare('SELECT id FROM events WHERE slug=?').bind(slug).first();if(!row||String(row.id)===String(id||''))return slug;slug=`${base}-${n++}`}}
function mapEventPayload(o){return {title:o.title||'',category:o.category||'',area:o.area||'',province:o.province||'',city:o.city||'',locality:o.locality||'',address:o.address||'',start_date:o.start_date||'',end_date:o.end_date||o.start_date||'',start_time:o.start_time||'',description:o.description||'',program:typeof o.program==='string'?o.program:JSON.stringify(o.program||[]),organizer:o.organizer||'',phone:o.phone||'',email:o.email||'',social:o.social||'',image:o.image||o.poster_url||'',poster_url:o.poster_url||'',free:Number(o.free??(o.price_type!=='A pagamento')),featured:Number(o.featured||0),weekend:Number(o.weekend||0),status:o.status||'published'}}
async function sendNotify(env,s){if(!env.RESEND_API_KEY||!env.NOTIFY_EMAIL)return;const from=env.FROM_EMAIL||'Marchesato in Festa <onboarding@resend.dev>';await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[env.NOTIFY_EMAIL],subject:`Nuova segnalazione: ${s.title}`,html:`<h2>Nuova segnalazione evento</h2><p><b>${s.title}</b></p><p>${s.city||''} — ${s.start_date||''}</p><p>Da: ${s.email||''}</p><p>Accedi all'admin per verificarla.</p>`})}).catch(()=>{});}
async function requireAdmin(req,env){return await isAdmin(req,env)?null:bad('Non autorizzato',401)}
export async function onRequest({request,env,params}){
 if(!env.DB)return bad('Binding D1 DB non configurato',503);
 const url=new URL(request.url),method=request.method.toUpperCase(),path='/' + ((params.path)||[]).join('/');
 try{

  if(method==='GET'&&path==='/settings'){
   const rows=await env.DB.prepare('SELECT key,value FROM site_settings').all();
   const settings={};for(const r of rows.results||[])settings[r.key]=r.value;return json({settings});
  }
  if(method==='GET'&&path==='/events'){
   const rows=await env.DB.prepare("SELECT * FROM events WHERE status='published' ORDER BY start_date ASC, featured DESC").all();return json({items:rows.results||[]});
  }
  if(method==='GET'&&path.startsWith('/events/')){const slug=decodeURIComponent(path.split('/').pop());const row=await env.DB.prepare("SELECT * FROM events WHERE slug=? AND status='published'").bind(slug).first();return row?json(row):bad('Evento non trovato',404)}
  if(method==='GET'&&path==='/places'){const rows=await env.DB.prepare('SELECT * FROM places ORDER BY name').all();return json({items:rows.results||[]})}
  if(method==='GET'&&path==='/partners'){const rows=await env.DB.prepare('SELECT * FROM partners ORDER BY id DESC').all();return json({items:rows.results||[]})}
  if(method==='GET'&&path.startsWith('/media/')){if(!env.MEDIA)return bad('R2 non configurato',404);const key=decodeURIComponent(path.slice('/media/'.length)),obj=await env.MEDIA.get(key);if(!obj)return bad('File non trovato',404);const headers=new Headers();obj.writeHttpMetadata(headers);headers.set('etag',obj.httpEtag);headers.set('cache-control','public, max-age=31536000, immutable');return new Response(obj.body,{headers})}
  if(method==='POST'&&path==='/submissions'){
   const o=await body(request);if(!o.title||!o.email||!o.start_date||!o.city)return bad('Compila titolo, email, data e comune.');
   const cols=['title','category','province','city','locality','address','start_date','end_date','start_time','price_type','description','program_text','organizer','phone','email','social','poster_url'];const vals=cols.map(c=>o[c]||'');const marks=cols.map(()=>'?').join(',');const res=await env.DB.prepare(`INSERT INTO submissions (${cols.join(',')}) VALUES (${marks})`).bind(...vals).run();await sendNotify(env,o);return json({ok:true,id:res.meta?.last_row_id},201)
  }
  if(method==='POST'&&path==='/admin/login'){
   const o=await body(request);if(!env.ADMIN_PASSWORD||o.password!==env.ADMIN_PASSWORD)return bad('Password non valida',401);const token=await makeSession(env);return json({ok:true},200,{'set-cookie':`mif_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`})
  }
  if(method==='POST'&&path==='/admin/logout')return json({ok:true},200,{'set-cookie':'mif_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
  if(path.startsWith('/admin/')){const denied=await requireAdmin(request,env);if(denied)return denied}

  if(method==='GET'&&path==='/admin/settings'){
   const rows=await env.DB.prepare('SELECT key,value FROM site_settings ORDER BY key').all();
   const settings={};for(const r of rows.results||[])settings[r.key]=r.value;return json({settings});
  }
  if(method==='PATCH'&&path==='/admin/settings'){
   const o=await body(request),allowed=new Set(['logo_dark','logo_light','hero_image','category_feste_patronali','category_sagre','category_concerti','category_cultura','category_sport','category_bambini','territory_marchesato','territory_crotone','territory_catanzaro','banner_mangiare','banner_dormire']);
   if(!allowed.has(o.key)||!o.value)return bad('Impostazione non valida');
   await env.DB.prepare('INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP').bind(o.key,o.value).run();
   return json({ok:true,key:o.key,value:o.value});
  }
  if(method==='GET'&&path==='/admin/dashboard'){
   const [events,upcoming,pending,places]=await Promise.all([env.DB.prepare('SELECT COUNT(*) c FROM events').first(),env.DB.prepare("SELECT COUNT(*) c FROM events WHERE start_date>=date('now') AND status='published'").first(),env.DB.prepare("SELECT COUNT(*) c FROM submissions WHERE status='pending'").first(),env.DB.prepare('SELECT COUNT(*) c FROM places').first()]);return json({events:events?.c||0,upcoming:upcoming?.c||0,pending:pending?.c||0,places:places?.c||0})
  }
  if(method==='GET'&&path==='/admin/events'){const r=await env.DB.prepare('SELECT * FROM events ORDER BY start_date DESC').all();return json({items:r.results||[]})}
  if(method==='POST'&&path==='/admin/events'){
   const o=mapEventPayload(await body(request));if(!o.title||!o.start_date||!o.category)return bad('Titolo, categoria e data sono obbligatori.');const slug=await uniqueSlug(env,o.title,o.start_date);const cols=['slug',...Object.keys(o)];const vals=[slug,...Object.values(o)];await env.DB.prepare(`INSERT INTO events (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`).bind(...vals).run();return json({ok:true,slug},201)
  }
  if(path.match(/^\/admin\/events\/\d+$/)){
   const id=Number(path.split('/').pop());if(method==='PATCH'){const o=mapEventPayload(await body(request));const slug=await uniqueSlug(env,o.title,o.start_date,id);const cols=['slug',...Object.keys(o)];await env.DB.prepare(`UPDATE events SET ${cols.map(c=>`${c}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(slug,...Object.values(o),id).run();return json({ok:true})}if(method==='DELETE'){await env.DB.prepare('DELETE FROM events WHERE id=?').bind(id).run();return json({ok:true})}
  }
  if(method==='GET'&&path==='/admin/submissions'){const r=await env.DB.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();return json({items:r.results||[]})}
  if(path.match(/^\/admin\/submissions\/\d+$/)&&method==='PATCH'){
   const id=Number(path.split('/').pop()),o=await body(request),s=await env.DB.prepare('SELECT * FROM submissions WHERE id=?').bind(id).first();if(!s)return bad('Segnalazione non trovata',404);if(o.create_event&&o.status==='approved'){const ev=mapEventPayload({...s,area:s.province==='Catanzaro'?'Provincia di Catanzaro':'Provincia di Crotone',image:s.poster_url,free:s.price_type!=='A pagamento'});const slug=await uniqueSlug(env,ev.title,ev.start_date);const cols=['slug',...Object.keys(ev)];await env.DB.prepare(`INSERT INTO events (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`).bind(slug,...Object.values(ev)).run()}await env.DB.prepare('UPDATE submissions SET status=? WHERE id=?').bind(o.status||'pending',id).run();return json({ok:true})
  }
  if(method==='GET'&&path==='/admin/places'){const r=await env.DB.prepare('SELECT * FROM places ORDER BY id DESC').all();return json({items:r.results||[]})}
  if(method==='POST'&&path==='/admin/places'){const o=await body(request);if(!o.name)return bad('Nome obbligatorio');await env.DB.prepare('INSERT INTO places(name,type,city,province,description,image,address,phone,whatsapp,instagram,website,maps_url) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(o.name,o.type||'mangiare',o.city||'',o.province||'',o.description||'',o.image||'',o.address||'',o.phone||'',o.whatsapp||'',o.instagram||'',o.website||'',o.maps_url||'').run();return json({ok:true},201)}
  if(method==='GET'&&path==='/admin/partners'){const r=await env.DB.prepare('SELECT * FROM partners ORDER BY id DESC').all();return json({items:r.results||[]})}
  if(method==='POST'&&path==='/admin/partners'){const o=await body(request);if(!o.name)return bad('Nome obbligatorio');await env.DB.prepare('INSERT INTO partners(name,description,logo,image,website,instagram,level) VALUES(?,?,?,?,?,?,?)').bind(o.name,o.description||'',o.logo||'',o.image||'',o.website||'',o.instagram||'',o.level||'partner').run();return json({ok:true},201)}
  if(method==='POST'&&path==='/admin/upload'){
   if(!env.MEDIA)return bad('Binding R2 MEDIA non configurato',503);const form=await request.formData(),file=form.get('file');if(!(file instanceof File))return bad('File mancante');if(file.size>8*1024*1024)return bad('File troppo grande (max 8 MB)');if(!/^image\//.test(file.type))return bad('Sono consentite solo immagini');const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase(),key=`uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type}});return json({ok:true,key,url:`/api/media/${encodeURIComponent(key)}`},201)
  }
  return bad('Endpoint non trovato',404);
 }catch(err){console.error(err);return bad('Errore interno',500)}
}
