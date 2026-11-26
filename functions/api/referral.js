export async function onRequestPost({request,env}){
const reply=(d,status=200)=>Response.json(d,{status,headers:{"Cache-Control":"no-store"}});
if(!env.DB)return reply({error:"Storage unavailable"},503);
if(request.headers.get("Origin")!==new URL(request.url).origin)return reply({error:"Invalid origin"},403);
try{const raw=await request.text();if(raw.length>1000)return reply({error:"Too large"},413);const d=JSON.parse(raw);if(!["Mat Valley Tile & Stone","Pacific Tile Supply","T&A Supply","Lowe’s","Home Depot","Unspecified supplier"].includes(d.store)||!["directions","copy"].includes(d.action))return reply({error:"Invalid event"},400);
await env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, kind TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL)").run();
await env.DB.prepare("INSERT INTO submissions (id,kind,created_at,payload) VALUES (?,?,?,?)").bind(crypto.randomUUID(),"referral_event",new Date().toISOString(),JSON.stringify({store:d.store,action:d.action})).run();return reply({ok:true});}catch{return reply({error:"Unable to record"},503);}
}