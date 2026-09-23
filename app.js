const NKEY="koordinator_names_v3", DKEY="koordinator_date_v3";
let names=JSON.parse(localStorage.getItem(NKEY)||"null")||["Kuneri","Hirat","Janudin","Denis","Kholi","Erwin","Reynaldi","Dani","Riki","Heri","Yansah","Topik"];
let start=localStorage.getItem(DKEY)||"2026-09-23", week=0, current=null;
const $=id=>document.getElementById(id);
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderNames(){
  $("names").innerHTML=names.map((n,i)=>`<input data-i="${i}" value="${esc(n)}" placeholder="Orang ${i+1}">`).join("");
}
function saveNames(){
  names=[...document.querySelectorAll("#names input")].map((x,i)=>x.value.trim()||`Orang ${i+1}`);
  localStorage.setItem(NKEY,JSON.stringify(names)); renderAll(); alert("Nama berhasil disimpan.");
}
function dateAt(w,d=0){let x=new Date(start+"T00:00:00");x.setDate(x.getDate()+w*7+d);return x}
function fmt(x){return x.toLocaleDateString("id-ID",{day:"2-digit",month:"short"})}
function longFmt(x){return x.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})}
function activeFor(w){
  const order=["A","B","C","Libur"], g={A:[],B:[],C:[],Libur:[]};
  names.forEach((n,i)=>g[order[(Math.floor(i/3)+w)%4]].push(n));
  return g;
}
/* Pola kebutuhan: Sen-Jum 6 orang, Sab 4 orang, Min 2 orang.
   Total 36 penugasan = 9 orang x 4 hari.
   Pola ini menjaga setiap orang aktif tepat 4 hari dan tidak ditugaskan
   dua kali pada hari yang sama. */
const workSets=[
 [0,1,2,3,4,5],
 [0,1,2,6,7,8],
 [3,4,5,6,7,8],
 [0,1,2,3,4,5],
 [0,1,2,6,7,8],
 [3,4,5,6],
 [7,8]
];
const jobsByDay=[
 ["A Tim 1","A Tim 2","B Tim 1","B Tim 2","C Tim 1","C Tim 2"],
 ["A Tim 1","A Tim 2","B Tim 1","B Tim 2","C Tim 1","C Tim 2"],
 ["A Tim 1","A Tim 2","B Tim 1","B Tim 2","C Tim 1","C Tim 2"],
 ["A Tim 1","A Tim 2","B Tim 1","B Tim 2","C Tim 1","C Tim 2"],
 ["A Tim 1","A Tim 2","B Tim 1","B Tim 2","C Tim 1","C Tim 2"],
 ["A Tim 1","A Tim 2","C Tim 1","C Tim 2"],
 ["C Tim 1","C Tim 2"]
];
function makeSchedule(w){
  const g=activeFor(w), active=[...g.A,...g.B,...g.C];
  const result=[];
  const counts=Object.fromEntries(active.map(n=>[n,0]));
  for(let d=0;d<7;d++){
    const people=workSets[d].map(i=>active[(i+(w%9))%9]);
    const arr=jobsByDay[d].map((title,i)=>({title,name:people[i]}));
    arr.forEach(x=>counts[x.name]++);
    result.push(arr);
  }
  return {g,active,result,counts};
}
function renderGroups(){
  const g=activeFor(((week%4)+4)%4);
  $("weekGroups").innerHTML=Object.entries(g).map(([k,v])=>`<div class="wg"><b>${k}</b><div>${v.map(esc).join(", ")}</div></div>`).join("");
}
function renderSchedule(){
  const w=((week%4)+4)%4; current=makeSchedule(w);
  $("weekTitle").textContent=`Minggu ${w+1} · ${fmt(dateAt(week))}–${fmt(dateAt(week,6))}`;
  const totals=current.active.map(n=>`<div class="total"><b>${current.counts[n]}</b><span>${esc(n)} · hari kerja</span></div>`).join("");
  $("summary").innerHTML=`<div class="summary">${totals}</div><div class="ok">36 penugasan / minggu · setiap orang aktif = 4 hari kerja.</div>`;
  $("days").innerHTML=current.result.map((arr,d)=>{
    const date=dateAt(week,d);
    const standby=current.active.filter(n=>!arr.some(x=>x.name===n));
    const jobs=arr.map(x=>`<div class="job"><b>${x.title}</b><div class="people">${esc(x.name)}</div></div>`).join("");
    return `<div class="day"><div class="day-head"><b>${longFmt(date)}</b><span>${fmt(date)}</span></div><div class="jobs">${jobs}<div class="job standby"><b>STANDBY · ${standby.length} orang</b><div class="people">${standby.map(esc).join(", ")}</div></div></div></div>`;
  }).join("");
  renderBackup();
}
function renderBackup(){
  $("backup").innerHTML=current.result.map((arr,d)=>{
    const stand=current.active.filter(n=>!arr.some(x=>x.name===n));
    return `<div class="backup-row"><b>${longFmt(dateAt(week,d))}</b><select><option value="">Pilih orang standby bila ada penggantian</option>${stand.map(n=>`<option>${esc(n)}</option>`).join("")}</select></div>`;
  }).join("");
}
$("saveNames").onclick=saveNames;
$("prev").onclick=()=>{week--;renderAll()};
$("next").onclick=()=>{week++;renderAll()};
$("startDate").value=start;
$("startDate").onchange=e=>{start=e.target.value;localStorage.setItem(DKEY,start);week=0;renderAll()};
function renderAll(){renderNames();renderGroups();renderSchedule()}
renderAll();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js?v=3");
