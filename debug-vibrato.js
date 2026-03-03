const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
function loadSyx(p){const raw=fs.readFileSync(p);const msgs=[];let s=0;for(let i=0;i<raw.length;i++)if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}return decode7bit(msgs[msgs.length-1].slice(7,-1));}
function sec(b){return b<12?'NAME':b<38?'G['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);}

const zero=loadSyx('C:/dev/patchify/vibratozero.syx');
const max=loadSyx('C:/dev/patchify/vibratomax.syx');
const arpon=loadSyx('C:/dev/patchify/arpon.syx'); // init patch reference

console.log('=== vibratozero vs vibratomax ===');
let diffs=0;
for(let b=0;b<254;b++){
  if(zero[b]!==max[b]){
    console.log('B'+String(b).padStart(3)+' ['+sec(b)+']: zero=0x'+zero[b].toString(16)+'('+zero[b]+') max=0x'+max[b].toString(16)+'('+max[b]+')');
    diffs++;
  }
}
console.log(diffs+' diffs\n');

// Compare vibzero vs init (arpon = init patch)
console.log('=== vibratozero vs init patch ===');
diffs=0;
for(let b=12;b<254;b++){
  if(zero[b]!==arpon[b]){
    console.log('B'+String(b).padStart(3)+' ['+sec(b)+']: zero=0x'+zero[b].toString(16)+'('+zero[b]+') init=0x'+arpon[b].toString(16)+'('+arpon[b]+')');
    diffs++;
  }
}
console.log(diffs+' diffs\n');

// Compare vibmax vs init
console.log('=== vibratomax vs init patch ===');
diffs=0;
for(let b=12;b<254;b++){
  if(max[b]!==arpon[b]){
    console.log('B'+String(b).padStart(3)+' ['+sec(b)+']: max=0x'+max[b].toString(16)+'('+max[b]+') init=0x'+arpon[b].toString(16)+'('+arpon[b]+')');
    diffs++;
  }
}
console.log(diffs+' diffs');

// Show vibrato-related bytes in T1+6 and T2+6 across all three
const T1=38;
console.log('\nKey vibrato bytes:');
console.log('T1+6 (vibrato intensity): init=0x'+arpon[T1+6].toString(16)+' zero=0x'+zero[T1+6].toString(16)+' max=0x'+max[T1+6].toString(16));
console.log('T2+6 (T2 vibrato):        init=0x'+arpon[T1+6+108].toString(16)+' zero=0x'+zero[T1+6+108].toString(16)+' max=0x'+max[T1+6+108].toString(16));
// Also check T1+4 (vibrato rate?) and nearby
for(let i=3;i<=10;i++){
  const b=T1+i;
  if(zero[b]!==max[b]||zero[b]!==arpon[b])
    console.log('T1+'+i+': init=0x'+arpon[b].toString(16)+'('+arpon[b]+') zero=0x'+zero[b].toString(16)+'('+zero[b]+') max=0x'+max[b].toString(16)+'('+max[b]+')');
}
