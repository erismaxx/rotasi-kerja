const KEY_NAMES="rotasi_names_v1", KEY_DATE="rotasi_start_v1";
const defaultNames = Array.from({length:12},(_,i)=>`Orang ${i+1}`);
let names = JSON.parse(localStorage.getItem(KEY_NAMES) || "null") || defaultNames;
let startDate = localStorage.getItem(KEY_DATE) || new Date().toISOString().slice(0,10);
let selectedWeek = 0;

const namesBox=document.getElementById("names");
const dateInput=document.getElementById("startDate");
const schedule=document.getElementById("schedule");
const weekTitle=document.getElementById("weekTitle");

function renderNames(){
  namesBox.innerHTML="";
  names.forEach((n,i)=>{
    const input=document.createElement("input");
    input.value=n;
    input.placeholder=`Orang ${i+1}`;
    input.dataset.i=i;
    namesBox.appendChild(input);
  });
}
function saveNames(){
  names=[...namesBox.querySelectorAll("input")].map((x,i)=>x.value.trim()||`Orang ${i+1}`);
  localStorage.setItem(KEY_NAMES,JSON.stringify(names));
  renderSchedule();
  alert("Nama berhasil disimpan.");
}
function dateForWeek(offset){
  const d=new Date(startDate+"T00:00:00");
  d.setDate(d.getDate()+offset*7);
  return d;
}
function fmt(d){
  return d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
}
function renderSchedule(){
  const w=((selectedWeek%4)+4)%4;
  weekTitle.textContent=`Minggu ${w+1}`;
  const d1=dateForWeek(selectedWeek), d2=new Date(d1); d2.setDate(d2.getDate()+6);
  const groups={A:[],B:[],C:[],Libur:[]};
  names.forEach((name,i)=>{
    const base=Math.floor(i/3); // 0=A, 1=B, 2=C, 3=Libur
    const order=["A","B","C","Libur"];
    groups[order[(base+w)%4]].push(name);
  });
  schedule.innerHTML="";
  [["A","Titik A"],["B","Titik B"],["C","Titik C"],["Libur","Libur"]].forEach(([key,label])=>{
    const box=document.createElement("div"); box.className="group";
    box.innerHTML=`<div class="badge">${label}</div><ul>${groups[key].map(n=>`<li>${escapeHtml(n)}</li>`).join("")}</ul>`;
    schedule.appendChild(box);
  });
  const hint=document.createElement("p"); hint.className="hint";
  hint.style.gridColumn="1/-1"; hint.textContent=`${fmt(d1)} – ${fmt(d2)}`;
  schedule.prepend(hint);
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
document.getElementById("saveNames").onclick=saveNames;
document.getElementById("prevWeek").onclick=()=>{selectedWeek--;renderSchedule()};
document.getElementById("nextWeek").onclick=()=>{selectedWeek++;renderSchedule()};
dateInput.value=startDate;
dateInput.onchange=()=>{startDate=dateInput.value;localStorage.setItem(KEY_DATE,startDate);selectedWeek=0;renderSchedule()};

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e;
  document.getElementById("installBtn").classList.remove("hidden");
});
document.getElementById("installBtn").onclick=async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
  document.getElementById("installBtn").classList.add("hidden");
};
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));

renderNames(); renderSchedule();
