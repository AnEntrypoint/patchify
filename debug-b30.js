const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();
let issues=0;
for(let i=0;i<256;i++){
  const p=all.slice(i*254,(i+1)*254);
  if(p[30] !== 0){console.log('P'+i+' '+getName(p)+' B30=0x'+p[30].toString(16)+' ARP ON!');issues++;}
}
console.log(issues===0?'All 256 patches have B30=0x00 (arp off)':issues+' patches have arp on');
const initRaw=fs.readFileSync('C:/dev/patchify/initpatch.syx');
const init=decode7bit(initRaw.slice(7,-1));
console.log('Factory init B30=0x'+init[30].toString(16));
// Show what the arpon reference has
const onRaw=fs.readFileSync('C:/dev/patchify/arpon.syx');
const onData=decode7bit(onRaw.slice(7,-1));
console.log('arpon.syx B30=0x'+onData[30].toString(16)+' (should be 0x80)');
// Show our P5 and P4 B30
const p5=all.slice(5*254,6*254);
const p4=all.slice(4*254,5*254);
console.log('Our P5(hw6) B30=0x'+p5[30].toString(16));
console.log('Our P4(hw5) B30=0x'+p4[30].toString(16));
