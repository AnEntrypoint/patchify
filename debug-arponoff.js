const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}

// Load both reference files
const onRaw=fs.readFileSync('C:/dev/patchify/arpon.syx');
const offRaw=fs.readFileSync('C:/dev/patchify/arpoff.syx');
console.log('arpon.syx size:',onRaw.length,'arpoff.syx size:',offRaw.length);
console.log('arpon header:', Array.from(onRaw.slice(0,8)).map(b=>b.toString(16).padStart(2,'0')).join(' '));

// Try to decode - these may be single-program dumps (function 0x40) or all-program (0x50)
// Single prog: F0 42 30 00 01 40 40 [data] F7 - function byte at index 6
const fn=onRaw[6];
console.log('Function byte: 0x'+fn.toString(16));

let onData, offData;
if(fn===0x40){
  // single program dump
  onData=decode7bit(onRaw.slice(7,-1));
  offData=decode7bit(offRaw.slice(7,-1));
  console.log('Single program dump, decoded size:',onData.length,'bytes');
} else if(fn===0x50){
  // all programs - skip
  console.log('All programs dump - need different offset');
  process.exit(1);
} else {
  // try generic slice
  onData=decode7bit(onRaw.slice(7,-1));
  offData=decode7bit(offRaw.slice(7,-1));
  console.log('Unknown function, decoded size:',onData.length);
}

// Find ALL differing bytes
console.log('\nBytes that differ (arp-ON vs arp-OFF):');
let diffs=0;
const len=Math.min(onData.length,offData.length);
for(let b=0;b<len;b++){
  if(onData[b]!==offData[b]){
    const sec=b<12?'NAME':b<38?'GLOBAL['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);
    console.log('B'+String(b).padStart(3)+' ['+sec+']: ON=0x'+onData[b].toString(16).padStart(2,'0')+'('+onData[b]+') OFF=0x'+offData[b].toString(16).padStart(2,'0')+'('+offData[b]+')');
    diffs++;
  }
}
console.log(diffs+' bytes differ');

// Now compare our P5(arp-on) and P4(arp-off) with the reference
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const ourOn=all.slice(5*254,6*254);   // P5 hw#6 arp-on
const ourOff=all.slice(4*254,5*254);  // P4 hw#5 arp-off

console.log('\nARP-ON byte in reference vs our P5 and P4:');
for(let b=0;b<len;b++){
  if(onData[b]!==offData[b]){
    const sec=b<12?'NAME':b<38?'GLOBAL['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);
    console.log('B'+String(b).padStart(3)+' ['+sec+']: ref_ON='+onData[b]+' ref_OFF='+offData[b]+' ourP5='+ourOn[b]+' ourP4='+ourOff[b]);
  }
}
