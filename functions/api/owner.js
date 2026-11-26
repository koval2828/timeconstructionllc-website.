export async function onRequestGet({request,env}) {
 const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 if(!env.OWNER_TOKEN||!env.DB)return reply({error:"Owner access or database not configured"},503);
 if(request.headers.get("Authorization")!=="Bearer "+env.OWNER_TOKEN)return reply({error:"Unauthorized"},401);
 try{await env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, kind TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL)").run();
 const {results}=await env.DB.prepare("SELECT id,kind,created_at,payload FROM submissions ORDER BY created_at DESC LIMIT 500").all();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS owner_status (id TEXT PRIMARY KEY, status TEXT NOT NULL)").run();const {results:statuses}=await env.DB.prepare("SELECT id,status FROM owner_status").all();const map=new Map(statuses.map(x=>[x.id,x.status]));return reply({rows:results.map(r=>({...r,payload:JSON.parse(r.payload),status:map.get(r.id)||"new"}))});}catch{return reply({error:"Database unavailable"},503);}
}
export async function onRequestPost({request,env}){
const reply=(d,status=200)=>Response.json(d,{status,headers:{"Cache-Control":"no-store"}});
if(!env.OWNER_TOKEN||!env.DB)return reply({error:"Not configured"},503);
if(request.headers.get("Authorization")!=="Bearer "+env.OWNER_TOKEN||request.headers.get("Origin")!==new URL(request.url).origin)return reply({error:"Unauthorized"},401);
try{const d=await request.json();const row=await env.DB.prepare("SELECT kind FROM submissions WHERE id=?").bind(d.id).first();if(!row||!(row.kind==="estimate"?["new","contacted","scheduled","completed","paid"]:row.kind==="review"?["new","verified","archived"]:[]).includes(d.status))return reply({error:"Invalid status"},400);
await env.DB.prepare("CREATE TABLE IF NOT EXISTS owner_status (id TEXT PRIMARY KEY, status TEXT NOT NULL)").run();await env.DB.prepare("INSERT INTO owner_status(id,status) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status").bind(d.id,d.status).run();return reply({ok:true});}catch{return reply({error:"Save failed"},503);}
}