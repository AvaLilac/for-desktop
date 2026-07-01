(function(){
'@preserve - Built on 2026-03-18T15:07:32.044Z';

if(window.__US_BUILDER_FORCEUSERSETTINGS_JS__){return;}window.__US_BUILDER_FORCEUSERSETTINGS_JS__=true;

(function(){
'use strict';

if(window.__AVIA_FORCE_USER_SETTINGS__) return;
window.__AVIA_FORCE_USER_SETTINGS__ = true;

let userSettingsSpan = null;

function findUserSettingsSpan() {
    if(userSettingsSpan && document.body.contains(userSettingsSpan)) return userSettingsSpan;
    const spans = document.querySelectorAll('span.ov_hidden');
    for(const s of spans){
        const parent = s.parentElement;
        if(!parent) continue;
        if(parent.id === 'avia-cloned-settings') continue;
        if(parent.querySelector('#avia-cloned-settings')) continue;
        const svgPath = parent.querySelector('a svg path');
        if(!svgPath) continue;
        const d = svgPath.getAttribute('d') || '';
        if(d.startsWith('M12 2C6.48 2')) {
            userSettingsSpan = s;
            return s;
        }
    }
    userSettingsSpan = null;
    return null;
}

function enforceUserSettingsLabel() {
    const span = findUserSettingsSpan();
    if(span && span.textContent !== "User Settings") span.textContent = "User Settings";
}

const observer = new MutationObserver(() => enforceUserSettingsLabel());
observer.observe(document.body, { childList: true, subtree: true });

enforceUserSettingsLabel();
})();


if(window.__US_BUILDER_FORCEAPPARENCE_JS__){return;}window.__US_BUILDER_FORCEAPPARENCE_JS__=true;

(function(){

if(window.__AVIA_FORCE_APPEARANCE__)return;
window.__AVIA_FORCE_APPEARANCE__=true;

function setAppearanceLabel(root=document){
const links = root.querySelectorAll(".settings_sidebar .content a.button:not([id^='avia-']):not([id^='stoat-fake-'])");

links.forEach(a=>{
const svg=a.querySelector("svg");
if(!svg)return;

const path=svg.querySelector("path");
if(!path)return;

if(path.getAttribute("d")?.startsWith("M12 22C6.49 22")){

const label=a.querySelector("div.ov_hidden");
if(label&&label.textContent!=="Appearance"){
label.textContent="Appearance";
}

}
});
}

const observer=new MutationObserver(muts=>{
for(const m of muts){
for(const n of m.addedNodes){
if(!(n instanceof HTMLElement))continue;
setAppearanceLabel(n);
}
}
});

observer.observe(document.body,{childList:true,subtree:true});

setAppearanceLabel();

})();



})();
