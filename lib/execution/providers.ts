type Json=Record<string,any>
async function http(url:string,init:RequestInit={}){const r=await fetch(url,{...init,headers:{'Content-Type':'application/json',...(init.headers||{})},cache:'no-store'});const text=await r.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{data={raw:text}}if(!r.ok)throw new Error('Provider '+r.status+': '+(data?.message||data?.error||text||'Request failed'));return data}
export function providerHealth(){
 const env:any=process.env
 return {
  github:{configured:!!env.GITHUB_TOKEN,label:'GitHub',hint:'GITHUB_TOKEN',mode:'repository'},
  figma:{configured:!!env.FIGMA_ACCESS_TOKEN,label:'Figma',hint:'FIGMA_ACCESS_TOKEN',mode:'design-handoff'},
  supabase:{configured:!!env.EXECUTION_SUPABASE_URL&&!!(env.EXECUTION_SUPABASE_SERVICE_ROLE_KEY||env.SUPABASE_SERVICE_ROLE_KEY),label:'Supabase',hint:'EXECUTION_SUPABASE_URL + EXECUTION_SUPABASE_SERVICE_ROLE_KEY',mode:'schema-target'},
  vercel:{configured:!!env.VERCEL_TOKEN,label:'Vercel',hint:'VERCEL_TOKEN',mode:'deployment'},
  build_agent:{configured:env.EXECUTION_BUILD_AGENT_ENABLED==='true'||!!env.OPENAI_API_KEY,label:'Build Agent',hint:'EXECUTION_BUILD_AGENT_ENABLED=true or OPENAI_API_KEY',mode:'scaffold'}
 }
}
function githubHeaders(){const token=process.env.GITHUB_TOKEN;if(!token)throw new Error('GITHUB_TOKEN is not configured');return {Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}}
function repoName(product:any){const base=String(product.name||'venture-product').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,45)||'venture-product';return 'ventureos-'+base+'-'+product.id}
export async function githubProvision(product:any,files:{path:string,content:string}[]){
 const h=githubHeaders(),org=process.env.GITHUB_ORG
 let owner='',repo=repoName(product)
 if(org){owner=org;try{await http('https://api.github.com/repos/'+org+'/'+repo,{headers:h})}catch{await http('https://api.github.com/orgs/'+org+'/repos',{method:'POST',headers:h,body:JSON.stringify({name:repo,private:true,description:'VentureOS execution scaffold for '+product.name,auto_init:true})})}}
 else {const me=await http('https://api.github.com/user',{headers:h});owner=me.login;try{await http('https://api.github.com/repos/'+owner+'/'+repo,{headers:h})}catch{await http('https://api.github.com/user/repos',{method:'POST',headers:h,body:JSON.stringify({name:repo,private:true,description:'VentureOS execution scaffold for '+product.name,auto_init:true})})}}
 for(const file of files){
  let sha:string|undefined
  try{const current=await http('https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+file.path,{headers:h});if(current?.sha)sha=current.sha}catch{}
  const body:any={message:'VentureOS: '+file.path,content:Buffer.from(file.content,'utf8').toString('base64'),branch:'main'};if(sha)body.sha=sha
  await http('https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+file.path,{method:'PUT',headers:h,body:JSON.stringify(body)})
 }
 return {owner,repo,url:'https://github.com/'+owner+'/'+repo}
}
export async function figmaValidate(){
 const token=process.env.FIGMA_ACCESS_TOKEN,fileKey=process.env.FIGMA_FILE_KEY
 if(!token)return {configured:false,message:'FIGMA_ACCESS_TOKEN is not configured'}
 if(!fileKey)return {configured:true,linked:false,message:'FIGMA_FILE_KEY is not configured; handoff package will remain ready-to-import'}
 const r=await http('https://api.figma.com/v1/files/'+encodeURIComponent(fileKey),{headers:{'X-Figma-Token':token}})
 return {configured:true,linked:true,name:r.name,lastModified:r.lastModified,url:'https://www.figma.com/file/'+fileKey}
}
function vercelHeaders(){const token=process.env.VERCEL_TOKEN;if(!token)throw new Error('VERCEL_TOKEN is not configured');return {Authorization:'Bearer '+token}}
export async function vercelDeploy(product:any,owner:string,repo:string){
 const h=vercelHeaders(),team=process.env.VERCEL_TEAM_ID
 const name=('ventureos-'+String(product.name||'product').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)+'-'+product.id).slice(0,60)
 let url='https://api.vercel.com/v13/deployments'
 if(team)url+='?teamId='+encodeURIComponent(team)
 const r=await http(url,{method:'POST',headers:h,body:JSON.stringify({name,target:'production',gitSource:{type:'github',repo:owner+'/'+repo,ref:'main'}})})
 return {projectName:name,deploymentId:r.id,state:r.readyState||r.state||'QUEUED',url:r.url?('https://'+r.url):null,raw:r}
}
export async function vercelStatus(deploymentId:string){
 const h=vercelHeaders(),team=process.env.VERCEL_TEAM_ID
 let url='https://api.vercel.com/v13/deployments/'+encodeURIComponent(deploymentId)
 if(team)url+='?teamId='+encodeURIComponent(team)
 const r=await http(url,{headers:h})
 return {id:r.id,state:r.readyState||r.state,url:r.url?('https://'+r.url):null,raw:r}
}