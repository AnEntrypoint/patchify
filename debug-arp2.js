const fs = require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const T1=38;
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();

// Check all VP dst/src values across all patches
// VP1: T1+44 = (dst<<4)|src, T1+45 = intensity
// VP2: T1+46 = (dst<<4)|src, T1+47 = intensity
// VP3: T1+48, VP4: T1+50 (factory defaults, we don't set these)
// Valid dst range: 0-5 (0=Pitch,1=OSC2Pitch,2=Cutoff,3=Amp,4=LFO1Freq,5=LFO2Freq)
// dst 6+ = unknown/invalid

console.log('Patches with VP dst > 5 (potentially invalid):');
let issues = 0;
for(let i=0;i<256;i++){
  const p=all.slice(i*254,(i+1)*254);
  const name=getName(p);
  const vp1b=p[T1+44]; const vp1dst=(vp1b>>4)&0xf; const vp1src=vp1b&0xf;
  const vp2b=p[T1+46]; const vp2dst=(vp2b>>4)&0xf; const vp2src=vp2b&0xf;
  if(vp1dst>5 || vp2dst>5){
    console.log('P'+String(i).padStart(3)+' '+name.padEnd(16)+' VP1='+vp1dst+':'+vp1src+' VP2='+vp2dst+':'+vp2src+(vp1dst>5?' VP1dst='+vp1dst+'!!':'')+(vp2dst>5?' VP2dst='+vp2dst+'!!':''));
    issues++;
  }
}
console.log(issues+' patches with invalid VP dst');

// Also check what factory arp patches have for VP dst
const fraw=fs.readFileSync('C:/dev/patchify/proper-factory-dump-with-init-full.syx');
const fall=decode7bit(fraw.slice(237+7,-1));
const arpIdxs=[2,9,10,31,64,104];
console.log('\nFactory ARP patches VP values:');
arpIdxs.forEach(i=>{
  const p=fall.slice(i*254,(i+1)*254);
  const vp1b=p[T1+44]; const vp2b=p[T1+46];
  console.log(i+':'+getName(p).padEnd(16)+' VP1='+(vp1b>>4)+':'+(vp1b&0xf)+' VP2='+(vp2b>>4)+':'+(vp2b&0xf));
});
