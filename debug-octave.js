const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}

const files=['oct-3','oct-2','oct-1','oct0','oct+1','oct+2','oct+3'];
const patches={};
for(const f of files){
  const path='C:/dev/patchify/'+f+'.syx';
  if(!fs.existsSync(path)){console.log(f+': NOT FOUND');continue;}
  const raw=fs.readFileSync(path);
  // handle multiple sysex msgs - take last one (most recent state)
  const msgs=[];let s=0;
  for(let i=0;i<raw.length;i++) if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}
  const msg=msgs[msgs.length-1];
  patches[f]=decode7bit(msg.slice(7,-1));
  console.log(f+': '+patches[f].length+' bytes decoded, msgs='+msgs.length);
}

// Find bytes that differ across all available patches
const keys=Object.keys(patches);
if(keys.length<2){console.log('Need at least 2 files');process.exit(1);}
const ref=patches[keys[0]];
console.log('\nBytes that vary across octave settings:');
for(let b=0;b<254;b++){
  const vals=keys.map(k=>patches[k][b]);
  const unique=new Set(vals);
  if(unique.size>1){
    const sec=b<12?'NAME':b<38?'GLOBAL['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);
    const valStr=keys.map(k=>k+'=0x'+patches[k][b].toString(16)+'('+patches[k][b]+')').join(' ');
    console.log('B'+String(b).padStart(3)+' ['+sec+']: '+valStr);
  }
}
