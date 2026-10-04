const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const attr=htmlEscape;
function dateRange(e){const f=d=>new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));return e.end_date&&e.end_date!==e.start_date?`${f(e.start_date)} – ${f(e.end_date)}`:f(e.start_date)}
export async function onRequest({request,env,params}){
  const parts=params.path||[];
  if(parts[0]!=='event'||!parts[1])return new Response('Not found',{status:404});
  const slug=decodeURIComponent(parts.slice(1).join('/'));
  const e=await env.DB.prepare("SELECT * FROM events WHERE slug=? AND status='published'").bind(slug).first();
  if(!e)return new Response('Evento non trovato',{status:404});
  const origin=new URL(request.url).origin;
  const target=`${origin}/#/evento/${encodeURIComponent(e.slug)}`;
  const shareUrl=`${origin}/share/event/${encodeURIComponent(e.slug)}`;
  const image=e.image?(e.image.startsWith('http')?e.image:origin+e.image):`${origin}/assets/logo-black.png`;
  const where=[e.locality,e.city,e.province].filter(Boolean).join(' · ');
  const description=`${dateRange(e)}${where?' · '+where:''}${e.start_time?' · ore '+e.start_time:''}`;
  const body=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlEscape(e.title)} | DA NOI in Calabria</title><meta name="description" content="${attr(description)}"><meta property="og:type" content="article"><meta property="og:site_name" content="DA NOI in Calabria"><meta property="og:title" content="${attr(e.title)}"><meta property="og:description" content="${attr(description)}"><meta property="og:image" content="${attr(image)}"><meta property="og:url" content="${attr(shareUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(e.title)}"><meta name="twitter:description" content="${attr(description)}"><meta name="twitter:image" content="${attr(image)}"><meta http-equiv="refresh" content="0;url=${attr(target)}"><script>location.replace(${JSON.stringify(target)})</script></head><body><p><a href="${attr(target)}">Apri ${htmlEscape(e.title)}</a></p></body></html>`;
  return new Response(body,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=300'}})
}
