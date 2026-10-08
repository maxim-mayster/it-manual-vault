import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const filesDir = path.join(dataDir, 'files');
const dbPath = path.join(dataDir, 'manuals.json');
fs.mkdirSync(filesDir, { recursive: true });
const seed = [
 {id:'sample-unifi',title:'UniFi Switch USW-24-PoE',maker:'Ubiquiti',cat:'Networking',year:'2023',tags:['PoE','Switching','LED states'],desc:'Installation and troubleshooting guide',pdf:false},
 {id:'sample-apc',title:'APC Smart-UPS 1500',maker:'APC / Schneider',cat:'Power',year:'2022',tags:['Battery','Alarms','Runtime'],desc:'User and network management guide',pdf:false},
 {id:'sample-brother',title:'Brother HL-L8360CDW',maker:'Brother',cat:'Printers',year:'2021',tags:['Paper jams','Fuser','Error codes'],desc:'Service and reference manual',pdf:false},
 {id:'sample-synology',title:'Synology DS923+',maker:'Synology',cat:'Networking',year:'2024',tags:['RAID','Drives','DSM'],desc:'Hardware installation guide',pdf:false},
 {id:'sample-hikvision',title:'Hikvision DS-7608NI',maker:'Hikvision',cat:'Security',year:'2020',tags:['NVR','Cameras','HDD'],desc:'Network video recorder user manual',pdf:false},
 {id:'sample-dell',title:'Dell OptiPlex 7090',maker:'Dell',cat:'Power',year:'2021',tags:['POST codes','RAM','BIOS'],desc:'Owner and service manual',pdf:false}
];
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
else { try { const existing = JSON.parse(fs.readFileSync(dbPath,'utf8')); if (!Array.isArray(existing) || existing.length === 0) fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2)); } catch { fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2)); } }
function readDb(){ try{return JSON.parse(fs.readFileSync(dbPath,'utf8'));}catch{return [];} }
function writeDb(rows){fs.writeFileSync(dbPath, JSON.stringify(rows,null,2));}
function send(res,status,body,type='application/json'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(type==='application/json'?JSON.stringify(body):body);}
function safeName(name){return String(name||'manual.pdf').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-150);}
function parseMultipart(req, limit=80*1024*1024){return new Promise((resolve,reject)=>{const chunks=[];let size=0;req.on('data',c=>{size+=c.length;if(size>limit){reject(new Error('Upload exceeds 80 MB'));req.destroy();}else chunks.push(c);});req.on('end',()=>{const body=Buffer.concat(chunks);const ct=req.headers['content-type']||'';const match=ct.match(/boundary=([^;]+)/);if(!match)return reject(new Error('Expected multipart/form-data'));const boundary=Buffer.from('--'+match[1].replace(/^"|"$/g,''));const parts=[];let pos=body.indexOf(boundary)+boundary.length;while(pos<body.length){if(body[pos]===45&&body[pos+1]===45)break;if(body[pos]===13&&body[pos+1]===10)pos+=2;const next=body.indexOf(boundary,pos);if(next<0)break;const part=body.subarray(pos,next-2);const sep=part.indexOf(Buffer.from('\r\n\r\n'));if(sep<0){pos=next+boundary.length;continue;}const headers=part.subarray(0,sep).toString();const content=part.subarray(sep+4);const disp=headers.match(/name="([^"]+)"(?:; filename="([^"]*)")?/);if(disp)parts.push({name:disp[1],filename:disp[2]||'',content});pos=next+boundary.length;}const out={fields:{},files:{}};for(const p of parts){if(p.filename)out.files[p.name]=p;else out.fields[p.name]=p.content.toString();}resolve(out);});req.on('error',reject);});}
function id(){return crypto.randomUUID();}
function publicRecord(r){return {...r, pdf:!!r.pdf, pdfUrl:r.pdf?`/api/manuals/${r.id}/pdf`:null, coverUrl:r.coverPath?`/api/manuals/${r.id}/cover`:null};}
async function handle(req,res){
 const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);const pathname=u.pathname;
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
 if(req.method==='GET'&&pathname==='/api/health')return send(res,200,{ok:true,storage:'filesystem',db:dbPath});
 if(req.method==='GET'&&pathname==='/api/manuals')return send(res,200,readDb().map(publicRecord));
 const m=pathname.match(/^\/api\/manuals\/([^/]+)(?:\/(pdf|cover))?$/);const isPdf=pathname.endsWith('/pdf');const isCover=pathname.endsWith('/cover');
 if(m){const manualId=m[1];const rows=readDb();const idx=rows.findIndex(x=>x.id===manualId);if(idx<0)return send(res,404,{error:'Manual not found'});const record=rows[idx];
 if(req.method==='PUT'||req.method==='PATCH'){try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const data=JSON.parse(Buffer.concat(chunks).toString()||'{}');if(data.title!==undefined)record.title=String(data.title).trim()||record.title;if(data.maker!==undefined)record.maker=String(data.maker).trim()||record.maker;if(data.cat!==undefined)record.cat=String(data.cat).trim()||'Other';if(data.year!==undefined)record.year=String(data.year).trim();if(data.desc!==undefined)record.desc=String(data.desc).trim();if(data.tags!==undefined)record.tags=Array.isArray(data.tags)?data.tags.map(x=>String(x).trim()).filter(Boolean):[];rows[idx]=record;writeDb(rows);return send(res,200,publicRecord(record));}catch(e){return send(res,400,{error:'Invalid manual details: '+e.message});}}
 if(req.method==='DELETE'){if(record.pdfPath&&fs.existsSync(record.pdfPath))fs.rmSync(record.pdfPath,{force:true});if(record.coverPath&&fs.existsSync(record.coverPath))fs.rmSync(record.coverPath,{force:true});rows.splice(idx,1);writeDb(rows);return send(res,200,{ok:true});}
  if(req.method==='GET'&&isCover){if(!record.coverPath||!fs.existsSync(record.coverPath))return send(res,404,{error:'No cover photo attached'});const ext=path.extname(record.coverPath).toLowerCase();const type={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});return fs.createReadStream(record.coverPath).pipe(res);}
  if(req.method==='GET'&&isPdf){if(!record.pdfPath||!fs.existsSync(record.pdfPath))return send(res,404,{error:'No PDF attached'});res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${safeName(record.pdfName||record.title+'.pdf')}"`,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});return fs.createReadStream(record.pdfPath).pipe(res);}
  if(req.method==='POST'&&isPdf){try{const form=await parseMultipart(req);const file=form.files.pdf;if(!file)return send(res,400,{error:'Choose a PDF file'});if(path.extname(file.filename).toLowerCase()!=='.pdf')return send(res,400,{error:'Only PDF files are accepted'});if(record.pdfPath)fs.rmSync(record.pdfPath,{force:true});const stored=path.join(filesDir,`${manualId}-${Date.now()}.pdf`);fs.writeFileSync(stored,file.content);record.pdfPath=stored;record.pdfName=safeName(file.filename);record.searchableText=(form.fields.searchableText||'').slice(0,150000);record.pdf=true;rows[idx]=record;writeDb(rows);return send(res,200,publicRecord(record));}catch(e){return send(res,400,{error:e.message});}}
 }
 if(req.method==='POST'&&pathname==='/api/manuals'){try{const form=await parseMultipart(req);const model=(form.fields.model||'Untitled equipment').trim();const maker=(form.fields.manufacturer||'Unknown manufacturer').trim();const manualId=id();const record={id:manualId,title:model,maker,cat:form.fields.category||'Other',year:new Date().getFullYear(),tags:['New intake'],desc:(form.fields.notes||'Manual awaiting source').trim(),pdf:false,createdAt:new Date().toISOString()};const pdf=form.files.pdf;if(pdf){if(path.extname(pdf.filename).toLowerCase()!=='.pdf')return send(res,400,{error:'Only PDF files are accepted'});record.pdfPath=path.join(filesDir,`${manualId}.pdf`);record.pdfName=safeName(pdf.filename);record.searchableText=(form.fields.searchableText||'').slice(0,150000);record.pdf=true;fs.writeFileSync(record.pdfPath,pdf.content);}const cover=form.files.cover;if(cover){record.coverPath=path.join(filesDir,`${manualId}-cover-${safeName(cover.filename)}`);fs.writeFileSync(record.coverPath,cover.content);}const rows=readDb();rows.unshift(record);writeDb(rows);return send(res,201,publicRecord(record));}catch(e){return send(res,400,{error:e.message});}}
 if(req.method==='GET'){const file=pathname==='/'?path.join(root,'index.html'):path.join(root,pathname.replace(/^\//,''));if(file.startsWith(root)&&fs.existsSync(file)&&fs.statSync(file).isFile()){const ext=path.extname(file);const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'}[ext]||'application/octet-stream';return send(res,200,fs.readFileSync(file),type);}}
 send(res,404,{error:'Not found'});
}
const server=http.createServer((req,res)=>handle(req,res).catch(e=>send(res,500,{error:e.message})));server.listen(4173,'::',()=>console.log('Manual Vault server listening on http://localhost:4173'));
