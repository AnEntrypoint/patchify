const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
function loadSyx(p){const raw=fs.readFileSync(p);const msgs=[];let s=0;for(let i=0;i<raw.length;i++)if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}return decode7bit(msgs[msgs.length-1].slice(7,-1));}

const T1=38;
const mats={};
for(let m=1;m<=4;m++){
  mats['m'+m+'min']=loadSyx('C:/dev/patchify/matrix'+m+'-input-min.syx');
  mats['m'+m+'max']=loadSyx('C:/dev/patchify/matrix'+m+'-input-max.syx');
}

// Key finding: what uniquely changes min→max for each matrix
console.log('=== What changes min→max for each matrix ===');
for(let m=1;m<=4;m++){
  const mn=mats['m'+m+'min'], mx=mats['m'+m+'max'];
  const changes=[];
  for(let b=38;b<146;b++){
    if(mn[b]!==mx[b]){
      const off=b-38;
      const vpDesc={44:'VP1byte',45:'VP1int',46:'VP2byte',47:'VP2int',48:'VP3byte',49:'VP3int',50:'VP4byte',51:'VP4int'};
      const label=vpDesc[off]||('T1+'+off);
      changes.push('T1+'+off+'('+label+'): min='+mn[b]+'(0x'+mn[b].toString(16)+') → max='+mx[b]+'(0x'+mx[b].toString(16)+')');
    }
  }
  console.log('Matrix'+m+': '+changes.join(' | '));
}

// Decode the VP src values that change
console.log('\n=== Decoded VP src changes ===');
const srcNames=['EG1','EG2','LFO1','LFO2','Velocity','KbdTrack','ModWheel','PitchBend'];
const dstNames=['Pitch','OSC2Pitch','Cutoff','Amp','LFO1Freq','LFO2Freq'];

// Matrix1: VP1byte (T1+44) changes
const m1vpMin=mats.m1min[T1+44], m1vpMax=mats.m1max[T1+44];
console.log('Matrix1 (T1+44/VP1): min=(dst:'+dstNames[m1vpMin>>4]+',src:'+srcNames[m1vpMin&0xf]+') → max=(dst:'+dstNames[m1vpMax>>4]+',src:'+srcNames[m1vpMax&0xf]+')');

// Matrix2: VP3byte (T1+48) changes
const m2vpMin=mats.m2min[T1+48], m2vpMax=mats.m2max[T1+48];
console.log('Matrix2 (T1+48/VP3): min=(dst:'+dstNames[m2vpMin>>4]+',src:'+srcNames[m2vpMin&0xf]+') → max=(dst:'+dstNames[m2vpMax>>4]+',src:'+srcNames[m2vpMax&0xf]+')');

// Matrix3: VP2byte (T1+46) AND VP3byte (T1+48) change
const m3vp2Min=mats.m3min[T1+46], m3vp2Max=mats.m3max[T1+46];
const m3vp3Min=mats.m3min[T1+48], m3vp3Max=mats.m3max[T1+48];
console.log('Matrix3 (T1+46/VP2): min=(dst:'+dstNames[m3vp2Min>>4]+',src:'+srcNames[m3vp2Min&0xf]+') → max=(dst:'+dstNames[m3vp2Max>>4]+',src:'+srcNames[m3vp2Max&0xf]+')');
console.log('Matrix3 (T1+48/VP3): min=(dst:'+dstNames[m3vp3Min>>4]+',src:'+srcNames[m3vp3Min&0xf]+') → max=(dst:'+dstNames[m3vp3Max>>4]+',src:'+srcNames[m3vp3Max&0xf]+')');

// Matrix4: VP4byte (T1+50) changes
const m4vpMin=mats.m4min[T1+50], m4vpMax=mats.m4max[T1+50];
console.log('Matrix4 (T1+50/VP4): min=(dst:'+dstNames[m4vpMin>>4]+',src:'+srcNames[m4vpMin&0xf]+') → max=(dst:'+dstNames[m4vpMax>>4]+',src:'+srcNames[m4vpMax&0xf]+')');

// Verify our current generator VP2 mapping
console.log('\n=== Our generator VP2 (T1+46) in current SYX ===');
const raw=fs.readFileSync('C:/dev/patchify/patches/custom-library-2026-03-03.syx');
function decode7bitB(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
const all=decode7bitB(raw.slice(7,-1));
const getName=p=>Array.from(p.slice(0,12)).map(b=>String.fromCharCode(b&0x7F)).join('').trim();
console.log('First 8 patches VP2 (T1+46):');
for(let i=0;i<8;i++){
  const p=all.slice(i*254,(i+1)*254);
  const v=p[T1+46];
  const dst=v>>4, src=v&0xf;
  console.log('P'+i+' '+getName(p)+': '+dstNames[dst]+'←'+srcNames[src]+' int='+(p[T1+47]-64));
}
