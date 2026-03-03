const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}

const onRaw=fs.readFileSync('C:/dev/patchify/arpon.syx');
const offRaw=fs.readFileSync('C:/dev/patchify/arpoff.syx');

// Find SysEx message boundaries in arpoff.syx
const msgs=[];
let start=0;
for(let i=0;i<offRaw.length;i++){
  if(offRaw[i]===0xF7){msgs.push(offRaw.slice(start,i+1));start=i+1;}
}
console.log('arpoff.syx contains',msgs.length,'SysEx messages:');
msgs.forEach((m,i)=>console.log('  msg'+i+': len='+m.length+' fn=0x'+m[6].toString(16)+' data='+(m.length-8)+'encoded bytes'));

// Decode each
const onData=decode7bit(onRaw.slice(7,-1));
const off0=msgs[0]?decode7bit(msgs[0].slice(7,-1)):null;
const off1=msgs[1]?decode7bit(msgs[1].slice(7,-1)):null;
console.log('\narpon: decoded='+onData.length+' bytes');
if(off0) console.log('arpoff msg0: decoded='+off0.length+' bytes');
if(off1) console.log('arpoff msg1: decoded='+off1.length+' bytes');

function diffReport(a,b,label){
  const len=Math.min(a.length,b.length);
  let diffs=0;
  for(let i=0;i<len;i++){
    if(a[i]!==b[i]){
      const sec=i<12?'NAME':i<38?'GLOBAL['+i+']':'T'+(i<146?1:2)+'+'+(i<146?i-38:i-146);
      console.log('  B'+String(i).padStart(3)+' ['+sec+']: A=0x'+a[i].toString(16).padStart(2,'0')+' B=0x'+b[i].toString(16).padStart(2,'0'));
      diffs++;
    }
  }
  console.log('  '+label+': '+diffs+' diffs');
}

console.log('\narpon vs arpoff-msg0:');
if(off0) diffReport(onData,off0,'arpon vs off0');
console.log('\narpon vs arpoff-msg1:');
if(off1) diffReport(onData,off1,'arpon vs off1');
if(off0 && off1){console.log('\narpoff-msg0 vs arpoff-msg1:');diffReport(off0,off1,'off0 vs off1');}
