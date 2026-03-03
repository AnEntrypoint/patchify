const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();
// hw#5=P4(arp OFF), hw#6=P5(arp ON) per user
const pOff=all.slice(4*254,5*254);
const pOn=all.slice(5*254,6*254);
console.log('OFF='+getName(pOff)+' ON='+getName(pOn));
let diffs=0;
for(let b=0;b<254;b++){
  if(pOff[b] !== pOn[b]){
    const sec=b<12?'NAME':b<38?'GLOBAL['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);
    console.log('B'+String(b).padStart(3)+' ['+sec+']: OFF=0x'+pOff[b].toString(16)+'('+pOff[b]+') ON=0x'+pOn[b].toString(16)+'('+pOn[b]+')');
    diffs++;
  }
}
console.log(diffs+' diffs');

// Also show VP values for all first 8 patches
const T1=38;
console.log('\nFirst 8 patches VP2:');
for(let i=0;i<8;i++){
  const p=all.slice(i*254,(i+1)*254);
  const vp2b=p[T1+46];
  console.log('P'+i+'(hw#'+(i+1)+') '+getName(p).padEnd(16)+' VP2dst='+(vp2b>>4)+' VP2src='+(vp2b&0xf)+' VP2int='+p[T1+47]);
}
