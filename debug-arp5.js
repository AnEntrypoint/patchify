const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const T1=38;
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();

// Compare P5 (arp-on) vs P0 (presumably arp-off, both have VP2dst=4)
// Look at ALL 254 bytes
const p0=all.slice(0*254,1*254);
const p5=all.slice(5*254,6*254);
console.log('P0('+getName(p0)+') vs P5('+getName(p5)+') — full diff:');
for(let b=12;b<254;b++){
  if(p0[b]!==p5[b]){
    const sec=b<38?'GLOBAL':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);
    console.log('B'+String(b).padStart(3)+' ['+sec+']: P0=0x'+p0[b].toString(16)+'('+p0[b]+') P5=0x'+p5[b].toString(16)+'('+p5[b]+')');
  }
}

// Find which of our patches have VP2dst=4 (LFO1Freq) — list all with intensities
console.log('\nOur patches with VP2dst=4 (LFO1Freq routing):');
for(let i=0;i<32;i++){
  const p=all.slice(i*254,(i+1)*254);
  const v2=p[T1+46];
  if((v2>>4)===4) console.log('P'+i+'(hw#'+(i+1)+') '+getName(p)+' VP2src='+(v2&0xf)+' VP2int='+p[T1+47]);
}
