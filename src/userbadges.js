(function(){

if(window.__AVIA_PROFILE_BADGES__)return;
window.__AVIA_PROFILE_BADGES__=true;

const BADGE_URL="https://raw.githubusercontent.com/AvaLilac/AviaClientBadges/refs/heads/main/userbadgesbackend.js";

let badgeData=null,loadingPromise=null;

function loadBadges(){
if(badgeData)return Promise.resolve();
if(loadingPromise)return loadingPromise;

loadingPromise=fetch(BADGE_URL+"?t="+Date.now())
.then(r=>r.text())
.then(code=>{

const start = code.indexOf("[");
const end = code.lastIndexOf("]");

if(start === -1 || end === -1){
console.error("Badge backend format invalid");
badgeData=[];
return;
}

let arrayText = code.slice(start, end + 1);

arrayText = arrayText
.replace(/(\w+)\s*:/g, '"$1":'); // quote keys

try{
badgeData = JSON.parse(arrayText);
}catch(err){
console.error("Badge parse failed:", err);
badgeData=[];
}

})
.catch(err=>{
console.error("Badge backend failed:",err);
badgeData=[];
});

return loadingPromise;
}

function getUsername(root){
const tag=root.querySelector("span.fw_200");
if(!tag)return null;
const span=tag.parentElement;
return span?span.textContent.trim():null;
}

function getUserBadges(username){
if(!badgeData)return[];
const clean=username.trim().toLowerCase();
return badgeData.filter(b=>
Array.isArray(b.users) &&
b.users.some(u=>u.toLowerCase()===clean)
);
}

function injectBadge(card,username){
if(card.dataset.aviaBadgeInjected)return;
card.dataset.aviaBadgeInjected="true";

card.classList.remove("asp_1/1");
card.style.aspectRatio="auto";
card.style.height="auto";
card.style.minHeight="unset";
card.style.overflow="visible";

const container=document.createElement("div");
container.style.marginTop="8px";
container.style.display="flex";
container.style.flexDirection="column";
container.style.gap="4px";

const label=document.createElement("span");
label.className="lh_1.25rem fs_0.875rem fw_550";
label.textContent="BADGE";
container.appendChild(label);

const badges=getUserBadges(username);

if(badges.length){
badges.forEach(b=>{
const line=document.createElement("span");
line.className="lh_1rem fs_0.75rem fw_500";
line.textContent=`${b.icon} ${b.name}`;
line.style.color=b.color;
container.appendChild(line);
});
}else{
const none=document.createElement("span");
none.className="lh_1rem fs_0.75rem fw_500";
none.textContent="User Has No Badges";
none.style.opacity="0.7";
container.appendChild(none);
}

card.appendChild(container);
}

async function processProfile(root){
await loadBadges();
const username=getUsername(root);
if(!username)return;

const joined=[...root.querySelectorAll("div.pos_relative")]
.find(c=>c.querySelector("span")&&c.querySelector("span").textContent.trim()==="Joined");

if(!joined)return;

injectBadge(joined,username);
}

const observer=new MutationObserver(muts=>{
for(const m of muts){
for(const n of m.addedNodes){
if(!(n instanceof HTMLElement))continue;

if(n.matches?.("div.will-change_transform"))processProfile(n);
if(n.matches?.("div.p_24px.min-w_280px.max-w_560px"))processProfile(n);

const small=n.querySelector?.("div.will-change_transform");
if(small)processProfile(small);

const expanded=n.querySelector?.("div.p_24px.min-w_280px.max-w_560px");
if(expanded)processProfile(expanded);
}
}
});

observer.observe(document.body,{childList:true,subtree:true});

})();
