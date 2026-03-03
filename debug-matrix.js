const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
function loadSyx(p){const raw=fs.readFileSync(p);const msgs=[];let s=0;for(let i=0;i<raw.length;i++)if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}return decode7bit(msgs[msgs.length-1].slice(7,-1));}
function sec(b){return b<12?'NAME':b<38?'G['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);}

// Load all matrix files
const mats={};
for(let m=1;m<=4;m++){
  mats['m'+m+'min']=loadSyx('C:/dev/patchify/matrix'+m+'-input-min.syx');
  mats['m'+m+'max']=loadSyx('C:/dev/patchify/matrix'+m+'-input-max.syx');
}

// Use arpon (init patch) as baseline reference
const ref=loadSyx('C:/dev/patchify/arpon.syx');
ref[30]=0x00; // clear arp flag

console.log('=== Matrix VP analysis ===');
console.log('Each matrix (VP1-VP4) should have: dst/src byte + intensity byte');
console.log('In timbre section: T1+44=VP1 byte, T1+45=VP1 int, T1+46=VP2, T1+47=VP2 int,');
console.log('                   T1+48=VP3 byte, T1+49=VP3 int, T1+50=VP4 byte, T1+51=VP4 int\n');

const T1=38;
// Check what changes between min and max for each matrix
for(let m=1;m<=4;m++){
  const mn=mats['m'+m+'min'];
  const mx=mats['m'+m+'max'];
  console.log('--- Matrix '+m+' ---');
  const diffs=[];
  for(let b=0;b<254;b++) if(mn[b]!==mx[b]) diffs.push({b,mn:mn[b],mx:mx[b]});
  diffs.forEach(({b,mn,mx})=>console.log('  B'+String(b).padStart(3)+' ['+sec(b)+']: min=0x'+mn.toString(16)+'('+mn+') max=0x'+mx.toString(16)+'('+mx+')'));

  // Also compare min vs ref to find the matrix byte
  const fromRef=[];
  for(let b=12;b<254;b++) if(mn[b]!==ref[b]) fromRef.push({b,val:mn[b],ref:ref[b]});
  if(fromRef.length>0){
    console.log('  (vs init ref: '+fromRef.map(({b,val,ref})=>'B'+b+'['+sec(b)+']='+val.toString(16)+'/ref='+ref.toString(16)).join(' ')+')');
  }
  console.log('');
}

// Focused: show VP bytes T1+44..+51 and T2+44..+51 for all 8 files
console.log('=== VP bytes T1+44..+51 across all matrix files ===');
const labels=['VP1byte','VP1int','VP2byte','VP2int','VP3byte','VP3int','VP4byte','VP4int'];
for(let i=0;i<8;i++){
  const offset=T1+44+i;
  const vals=Object.entries(mats).map(([k,v])=>k+'=0x'+v[offset].toString(16)+'('+v[offset]+')').join(' ');
  console.log('T1+'+(44+i)+' ['+labels[i]+']: '+vals);
}
