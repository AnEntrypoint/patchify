const fs = require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();
const T1=38;

// P4=arp ON, P5=arp OFF per user
const p4=all.slice(4*254,5*254);
const p5=all.slice(5*254,6*254);
console.log('P4 (arp ON):', getName(p4));
console.log('P5 (arp OFF):', getName(p5));
let diffs=0;
for(let b=0;b<254;b++){
  if(p4[b]!==p5[b]){
    const section = b<12?'NAME':b<38?'GLOBAL':'T'+(b<146?'1':'2')+'+'+((b<146?b-38:b-146));
    console.log('B'+String(b).padStart(3)+' ['+section+']: P4=0x'+p4[b].toString(16).padStart(2,'0')+'('+p4[b]+') P5=0x'+p5[b].toString(16).padStart(2,'0')+'('+p5[b]+')');
    diffs++;
  }
}
console.log(diffs===0?'IDENTICAL - zero diffs':diffs+' bytes differ');

// Show cfg definitions for these patches
const patches=require('C:/dev/patchify/cli/patches-data.cjs');
console.log('\ncfg[4] (P4, arp ON on hw):', JSON.stringify(patches[4]));
console.log('cfg[5] (P5, arp OFF on hw):', JSON.stringify(patches[5]));

// Critical: look at factory arp patches - what do they have in the timbre section
// that the non-arp patches DON'T have
const fraw=fs.readFileSync('C:/dev/patchify/proper-factory-dump-with-init-full.syx');
const fall=decode7bit(fraw.slice(237+7,-1));
// MetallicArp=P9 (arp), PluckySynth=P1 (no arp) - look at T1+40 to T1+55 (LFO sync, VP area)
const fArp=fall.slice(9*254,10*254);
const fNoArp=fall.slice(1*254,2*254);
console.log('\nFactory MetallicArp T1+38..+55:');
for(let i=38;i<=55;i++) process.stdout.write('+'+(i)+':'+fArp[T1+i].toString(16).padStart(2,'0')+' ');
console.log('\nFactory PluckySynth T1+38..+55:');
for(let i=38;i<=55;i++) process.stdout.write('+'+(i)+':'+fNoArp[T1+i].toString(16).padStart(2,'0')+' ');
console.log('\n');

// And our P4 vs P5 in same range
console.log('Our P4 T1+38..+55:');
for(let i=38;i<=55;i++) process.stdout.write('+'+(i)+':'+p4[T1+i].toString(16).padStart(2,'0')+' ');
console.log('\nOur P5 T1+38..+55:');
for(let i=38;i<=55;i++) process.stdout.write('+'+(i)+':'+p5[T1+i].toString(16).padStart(2,'0')+' ');
console.log('');
