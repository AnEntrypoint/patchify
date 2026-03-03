const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const T1=38;

// Factory init (ground truth)
const initRaw=fs.readFileSync('C:/dev/patchify/initpatch.syx');
const initData=decode7bit(initRaw.slice(7,-1));
console.log('Factory init T1+38..+55 (LFO+VP area):');
for(let i=38;i<=55;i++) process.stdout.write('T1+'+(i)+'=0x'+initData[T1+i].toString(16)+' ');
console.log('');

// Our patches P4(arp-off) and P5(arp-on)
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const p4=all.slice(4*254,5*254);
const p5=all.slice(5*254,6*254);

console.log('P4(arp-off) T1+38..+55:');
for(let i=38;i<=55;i++) process.stdout.write('T1+'+(i)+'=0x'+p4[T1+i].toString(16)+' ');
console.log('');
console.log('P5(arp-on ) T1+38..+55:');
for(let i=38;i<=55;i++) process.stdout.write('T1+'+(i)+'=0x'+p5[T1+i].toString(16)+' ');
console.log('');

// Scan ALL our 256 patches - find any byte > 0 in normally-zero positions
// Focus on global B32 (arp flag per factory analysis)
let arpOn=0;
for(let i=0;i<256;i++){
  const p=all.slice(i*254,(i+1)*254);
  if(p[32] !== 0) { console.log('P'+i+' B32=0x'+p[32].toString(16)+' (ARP FLAG SET!)'); arpOn++; }
}
console.log('\n'+arpOn+' patches with B32 (arp flag) non-zero');

// Check factory arp patches T1+40 (LFO1 sync?) and T1+43 (LFO2 sync?)
const fraw=fs.readFileSync('C:/dev/patchify/proper-factory-dump-with-init-full.syx');
const fall=decode7bit(fraw.slice(237+7,-1));
console.log('\nFactory MetallicArp(P9) T1+38..+55:');
const fArp=fall.slice(9*254,10*254);
for(let i=38;i<=55;i++) process.stdout.write('T1+'+(i)+'=0x'+fArp[T1+i].toString(16)+' ');
console.log('');

// T1+40 = ? T1+43 = ? Let's decode LFO sync bits if any
console.log('\nT1+40 in factory: init=0x'+initData[T1+40].toString(16)+' MetallicArp=0x'+fArp[T1+40].toString(16));
console.log('T1+43 in factory: init=0x'+initData[T1+43].toString(16)+' MetallicArp=0x'+fArp[T1+43].toString(16));
