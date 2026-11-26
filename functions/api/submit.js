export async function onRequestPost({request,env}) {
 const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
 if(!env.DB)return reply({error:"Storage unavailable"},503);
 if(request.headers.get("Origin")!==new URL(request.url).origin)return reply({error:"Invalid origin"},403);
 if(!(request.headers.get("Content-Type")||"").startsWith("application/json"))return reply({error:"Invalid content type"},415);
 try {
 const raw=await request.text(); if(raw.length>16000)return reply({error:"Too large"},413);
 const d=JSON.parse(raw); if(!d||!["estimate","review"].includes(d.kind))return reply({error:"Invalid request"},400);
 const fields=d.kind==="estimate"?["name","email","phone","location","service","referral","referral_detail","contact_method","details","utm_source","utm_medium","utm_campaign","utm_content"]:["name","rating","city","review","permission"];
 const clean={}; for(const k of fields){if(typeof d[k]==="string")clean[k]=d[k].trim().slice(0,4000);}
 if(!clean.name||(d.kind==="estimate"?(!clean.phone||!clean.details||!clean.referral):(!clean.review||!["1","2","3","4","5"].includes(clean.rating))))return reply({error:"Missing required fields"},400);
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, kind TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL)").run();
 const id=crypto.randomUUID(); await env.DB.prepare("INSERT INTO submissions (id,kind,created_at,payload) VALUES (?,?,?,?)").bind(id,d.kind,new Date().toISOString(),JSON.stringify(clean)).run();
 return reply({ok:true,id},201);
 }catch(e){return reply({error:"Unable to save submission"},503);}
}
