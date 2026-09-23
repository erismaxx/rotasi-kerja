const NKEY="koordinator_names_v2", DKEY="koordinator_date_v2";
let names=JSON.parse(localStorage.getItem(NKEY)||"null")||["Kuneri","Hirat","Janudin","Denis","Kholi","Erwin","Reynaldi","Dani","Riki","Heri","Yansah","Topik"];
let start=localStorage.getItem(DKEY)||new Date().toISOString().slice(0,10), week=0, current=null;
const $=id=>document.getElementById(id);
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderNames(){$("names").innerHTML=names.map((n,i)=>`<input data-i="${i}" value="${esc(n)}" placeholder="Orang ${i+1}">`).join("")}
function saveNames(){names=[...document.querySelectorAll("#names input")].map((x,i)=>x.value.trim()||`Orang ${i+1}`);localStorage.setItem(NKEY,JSON.stringify(names));renderAll();alert("Nama tersimpan.")}
function dateAt(w,d=0){let x=new Date(start+"T00:00:00");x.setDate(x.getDate()+w*7+d);return x}
function fmt(x){return x.toLocaleDateString("id-ID",{day:"2-digit",month:"short"})}
function full(x){return x.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}
function activeFor(w){
  const order=["A","B","C","Libur"], g={A:[],B:[],C:[],Libur:[]};
  names.forEach((n,i)=>g[order[(Math.floor(i/3)+w)%4]].push(n));
  return g;
}
/* Membuat tepat 36 penugasan/minggu: A 12, B 10, C 14.
   Algoritma menjaga setiap dari 9 orang aktif tepat 4 hari kerja.
   Ia memilih kandidat dengan total kerja terendah, lalu memberi penalti
   untuk kerja berturut-turut agar pola tidak menumpuk pada orang yang sama. */
function makeSchedule(w){
  const g=activeFor(w), active=[...g.A,...g.B,...g.C], idx=new Map(active.map((n,i)=>[n,i]));
  const jobs=[]; for(let d=0;d<7;d++){
    if(d<=5){jobs.push([d,"A Tim 1"],[d,"A Tim 2"]);} 
    if(d<=4){jobs.push([d,"B Tim 1"],[d,"B Tim 2"]);} 
    jobs.push([d,"C Tim 1"],[d,"C Tim 2"]);
  }
  const work=Object.fromEntries(active.map(n=>[n,0])), days=Object.fromEntries(active.map(n=>[n,[]]));
  // Pilih per hari berdasarkan beban kerja, kemudian penalti hari sebelumnya.
  for(const [d,j] of jobs){
    const candidates=active.filter(n=>work[n]<4);
    candidates.sort((a,b)=>{
      const sa=work[a]*10+(days[a].includes(d-1)?18:0)+(days[a].includes(d-2)?5:0)+Math.random()*.01;
      const sb=work[b]*10+(days[b].includes(d-1)?18:0)+(days[b].includes(d-2)?5:0)+Math.random()*.01;
      return sa-sb;
    });
    // Hindari orang yang sudah ditugaskan pada hari yang sama.
    let chosen=candidates.find(n=>!days[n].includes(d));
    if(!chosen) chosen=candidates[0];
    work[chosen]++; days[chosen].push(d); 
    // temporarily store
    jobs[jobs.indexOf([d,j])]?.x;
  }
  // Greedy di atas sudah mengisi 36 slot; karena ada 4 hari per orang dan 36 slot,
  // bila distribusi tidak tepat, fallback konstruktif dengan rotasi kandidat.
  if(Object.values(work).some(v=>v!==4)) return makeScheduleDet(w,active);
  const byDay=Array.from({length:7},()=>[]);
  // Re-run deterministic assignment from stored work/day sets to map jobs using a stable fill.
  const result=Array.from({length:7},()=>[]);
  const count=Object.fromEntries(active.map(n=>[n,0])), used=Object.fromEntries(active.map(n=>[n,new Set()]));
  for(let d=0;d<7;d++){
    const titles=[]; if(d<=5)titles.push("A Tim 1","A Tim 2"); if(d<=4)titles.push("B Tim 1","B Tim 2"); titles.push("C Tim 1","C Tim 2");
    for(const title of titles){
      const cand=active.filter(n=>count[n]<4&&!used[n].has(d)).sort((a,b)=>(count[a]-count[b])||((used[a].has(d-1)?1:0)-(used[b].has(d-1)?1:0))||a.localeCompare(b));
      const chosen=cand[0]; count[chosen]++;used[chosen].add(d);result[d].push({title,name:chosen});
    }
  }
  if(Object.values(count).some(v=>v!==4)) return makeScheduleDet(w,active);
  return {g,result,count,active};
}
function makeScheduleDet(w,active){
  const count=Object.fromEntries(active.map(n=>[n,0])), used=Object.fromEntries(active.map(n=>[n,new Set()])), result=Array.from({length:7},()=>[]);
  const slots=[];for(let d=0;d<7;d++){if(d<=5)slots.push([d,"A Tim 1"],[d,"A Tim 2"]);if(d<=4)slots.push([d,"B Tim 1"],[d,"B Tim 2"]);slots.push([d,"C Tim 1"],[d,"C Tim 2"])}
  // Search with backtracking; 9 people x 36 slots is small with strong constraints.
  function bt(k){
    if(k===slots.length)return Object.values(count).every(v=>v===4);
    const [d,t]=slots[k];
    const cand=active.filter(n=>count[n]<4&&!used[n].has(d)).sort((a,b)=>count[a]-count[b]||a.localeCompare(b));
    for(const n of cand){
      count[n]++;used[n].add(d);result[d].push({title:t,name:n});
      if(bt(k+1))return true;
      result[d].pop();used[n].delete(d);count[n]--;
    } return false;
  }
  bt(0);return {g:activeFor(w),result,count,active};
}
function renderGroups(){const g=activeFor(((week%4)+4)%4);$("weekGroups").innerHTML=Object.entries(g).map(([k,v])=>`<div class="wg"><b>${k}</b><div>${v.map(esc).join(", ")}</div></div>`).join("")}
function renderSchedule(){
  const w=((week%4)+4)%4;current=makeSchedule(w);$("weekTitle").textContent=`Minggu ${w+1} · ${fmt(dateAt(week))}–${fmt(dateAt(week,6))}`;
  const total=current.count; const totalBox=`<div class="totals">${current.active.map(n=>`<div class="total"><b>${total[n]}</b><span>${esc(n)} · hari kerja</span></div>`).join("")}</div>`;
  $("days").innerHTML=totalBox+current.result.map((arr,d)=>{
    const date=dateAt(week,d), jobs=arr.map(x=>`<div class="job"><b>${x.title}</b><div class="people">${esc(x.name)}</div></div>`).join("");
    const standby=current.active.filter(n=>!arr.some(x=>x.name===n));
    return `<div class="day"><div class="day-head"><b>${date.toLocaleDateString("id-ID",{weekday:"long"})}</b><span>${fmt(date)}</span></div><div class="jobs">${jobs}<div class="job standby"><span class="status">STANDBY · ${standby.length} orang</span><div class="people">${standby.map(esc).join(", ")}</div></div></div></div>`;
  }).join("");
  renderBackup();
}
function renderBackup(){
  const options=current.active.map(n=>`<option>${esc(n)}</option>`).join("");
  $("backup").innerHTML=current.result.map((arr,d)=>{
    const date=dateAt(week,d), stand=current.active.filter(n=>!arr.some(x=>x.name===n));
    return `<div class="backup-row"><b>${date.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"short"})}</b><select><option value="">Pilih orang standby sebagai backup</option>${stand.map(n=>`<option>${esc(n)}</option>`).join("")}</select></div>`;
  }).join("");
}
$("saveNames").onclick=saveNames;$("prev").onclick=()=>{week--;renderAll()};$("next").onclick=()=>{week++;renderAll()};
$("startDate").value=start;$("startDate").onchange=e=>{start=e.target.value;localStorage.setItem(DKEY,start);week=0;renderAll()};
function renderAll(){renderNames();renderGroups();renderSchedule()}
renderAll();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
