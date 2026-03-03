const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const fraw=fs.readFileSync('C:/dev/patchify/proper-factory-dump-with-init-full.syx');
const fall=decode7bit(fraw.slice(237+7,-1));
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();
const arpIdxs=[2,9,10,31,64,104];

// Compare factory arp vs non-arp global bytes 12-37 to find arp-enabling byte
const pArp=fall.slice(9*254,10*254);   // MetallicArp
const pNoArp=fall.slice(1*254,2*254);  // Plucky Synth
console.log('Factory MetallicArp(P9) vs PluckySynth(P1) - global bytes 12-37:');
for(let b=12;b<38;b++){
  const mark=pArp[b]!==pNoArp[b]?' <--DIFF':'';
  console.log('B'+String(b).padStart(3)+': arp=0x'+pArp[b].toString(16).padStart(2,'0')+'('+pArp[b]+') noArp=0x'+pNoArp[b].toString(16).padStart(2,'0')+'('+pNoArp[b]+')'+mark);
}

// Check all 6 factory arp patches global bytes vs init
const pInit=fall.slice(0*254,1*254);
console.log('\nFactory ARP patches global bytes (vs init P0):');
arpIdxs.forEach(i=>{
  const p=fall.slice(i*254,(i+1)*254);
  const diffs=[];
  for(let b=12;b<38;b++) if(p[b]!==pInit[b]) diffs.push('B'+b+'=0x'+p[b].toString(16));
  console.log(i+' '+getName(p)+': diffs='+diffs.join(' '));
});

// Now check our P5 (arp-on) global bytes vs FACTORY_INIT
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const p5=all.slice(5*254,6*254);
const p4=all.slice(4*254,5*254);
console.log('\nOur P5(arp-on) global bytes 12-37:');
for(let b=12;b<38;b++) process.stdout.write('B'+b+'='+p5[b].toString(16)+' ');
console.log('\nOur P4(arp-off) global bytes 12-37:');
for(let b=12;b<38;b++) process.stdout.write('B'+b+'='+p4[b].toString(16)+' ');
console.log('\nFactory init P0 global bytes 12-37:');
for(let b=12;b<38;b++) process.stdout.write('B'+b+'='+pInit[b].toString(16)+' ');
console.log('');
