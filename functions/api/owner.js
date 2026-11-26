export async function onRequestGet({request,env}) {
 const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 if(!env.OWNER_TOKEN||!env.DB)return reply({error:"Owner access or database not configured"},503);
 if(request.headers.get("Authorization")!=="Bearer "+env.OWNER_TOKEN)return reply({error:"Unauthorized"},401);
 try{await env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, kind TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL)").run();
 const {results}=await env.DB.prepare("SELECT id,kind,created_at,payload FROM submissions ORDER BY created_at DESC LIMIT 500").all();
 return reply({rows:results.map(r=>({...r,payload:JSON.parse(r.payload)}))});}catch{return reply({error:"Database unavailable"},503);}
}