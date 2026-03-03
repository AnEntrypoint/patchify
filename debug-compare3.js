const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
const all=decode7bit(raw.slice(7,-1));
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();

const onRaw=fs.readFileSync('C:/dev/patchify/arpon.syx');
const onData=decode7bit(onRaw.slice(7,-1));
console.log('arpon.syx name: "'+Array.from(onData.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('')+'"');
console.log('arpon.syx B30=0x'+onData[30].toString(16));

// Compare arpon.syx vs our P5 (Dub Sub, hw#6)
const p5=all.slice(5*254,6*254);
console.log('Our P5 name: "'+getName(p5)+'"');
console.log('\narpon.syx vs our P5 diff:');
let d=0;
for(let b=0;b<254;b++){
  if(onData[b] !== p5[b]){
    const sec=b<12?'NAME':b<38?'GLOBAL['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);
    process.stdout.write('B'+b+'['+sec+']='+onData[b].toString(16)+'/'+p5[b].toString(16)+' ');
    d++;
  }
}
console.log('\n'+d+' diffs');

// Also check: what patch is arpon.syx most similar to in our library?
let best={idx:-1,diffs:9999};
for(let i=0;i<256;i++){
  const p=all.slice(i*254,(i+1)*254);
  let cnt=0;
  for(let b=12;b<254;b++) if(p[b] !== onData[b]) cnt++;
  if(cnt<best.diffs){best={idx:i,diffs:cnt};}
}
console.log('arpon.syx most similar to P'+best.idx+' ('+getName(all.slice(best.idx*254,(best.idx+1)*254))+') with '+best.diffs+' non-name diffs');
