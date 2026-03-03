const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const T1=38;
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();

// Compare P0 (presumably arp-off, VP2dst=4) vs P5 (arp-on, VP2dst=4)
const p0=all.slice(0*254,1*254);
const p5=all.slice(5*254,6*254);
console.log('P0(hw1,arp-off?) vs P5(hw6,arp-on), both VP2dst=4');
let diffs=0;
for(let b=12;b<254;b++){
  if(p0[b] !== p5[b]){
    const sec=b<38?'GLOBAL['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);
    process.stdout.write(b+'['+sec+']='+p0[b]+'/'+p5[b]+' ');
    diffs++;
  }
}
console.log('\n'+diffs+' diffs (non-name)');

// Check factory arp patches to understand what arp-enabling looks like
const fraw=fs.readFileSync('C:/dev/patchify/proper-factory-dump-with-init-full.syx');
const fall=decode7bit(fraw.slice(237+7,-1));
const arpIdxs=[2,9,10,31,64,104];
const nonArpIdxs=[0,1,3,4,5,6,7,8];
console.log('\nFactory ARP VP2 bytes:');
arpIdxs.forEach(i=>{const p=fall.slice(i*254,(i+1)*254);const v=p[T1+46];console.log(i+' '+getName(p)+': VP2=dst:'+(v>>4)+' src:'+(v&0xf)+' int:'+p[T1+47]);});
console.log('Factory non-arp VP2 bytes (first 8):');
nonArpIdxs.forEach(i=>{const p=fall.slice(i*254,(i+1)*254);const v=p[T1+46];console.log(i+' '+getName(p)+': VP2=dst:'+(v>>4)+' src:'+(v&0xf)+' int:'+p[T1+47]);});

// Does factory have any patches with VP2dst=4?
console.log('\nFactory patches with VP2dst=4 (LFO1Freq):');
for(let i=0;i<256;i++){
  const p=fall.slice(i*254,(i+1)*254);
  const v=p[T1+46];
  if((v>>4)===4) console.log(i+' '+getName(p)+' int='+p[T1+47]+' isArp='+arpIdxs.includes(i));
}
