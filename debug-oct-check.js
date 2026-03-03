const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
let bad=0;
for(let i=0;i<256;i++){
  const p=all.slice(i*254,(i+1)*254);
  if(p[37] !== 0){console.log('P'+i+' B37='+p[37]);bad++;}
}
console.log(bad===0?'All 256 patches have B37=0x00 (octave 0)':bad+' patches wrong');
