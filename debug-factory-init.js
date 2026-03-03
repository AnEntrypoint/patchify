const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
function loadSyx(p){const raw=fs.readFileSync(p);const msgs=[];let s=0;for(let i=0;i<raw.length;i++)if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}return decode7bit(msgs[msgs.length-1].slice(7,-1));}
function sec(b){return b<12?'NAME':b<38?'G['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);}

// True init: arpon = init patch with arp on. Remove arp flag.
const trueInit=loadSyx('C:/dev/patchify/arpon.syx');
trueInit[30]=0x00; // clear arp flag

// Get our generated patch P0 from the SYX — P0 is "Deep Sine" which has many settings
// Better: read our generator's FACTORY_INIT directly by parsing the hex array properly
const src=fs.readFileSync('C:/dev/patchify/cli/create-custom-library-from-factory.cjs','utf8');
// Extract just the hex values, stripping comments
const match=src.match(/const FACTORY_INIT = Buffer\.from\(\[([\s\S]+?)\]\);/);
const rawContent=match[1];
// Remove // comments from each line, then extract all 0x?? patterns
const hexVals=rawContent.replace(/\/\/.*/g,'').match(/0x[0-9a-fA-F]+/g);
const factInit=Buffer.from(hexVals.map(h=>parseInt(h,16)));
console.log('Parsed FACTORY_INIT length:',factInit.length,'(should be 254)');

// Compare FACTORY_INIT vs true init (non-name bytes 12-253)
console.log('\n=== FACTORY_INIT vs true hardware init ===');
let issues=0;
for(let b=12;b<254;b++){
  if(factInit[b]!==trueInit[b]){
    console.log('B'+String(b).padStart(3)+' ['+sec(b)+']: OURS=0x'+factInit[b].toString(16)+' TRUE=0x'+trueInit[b].toString(16));
    issues++;
  }
}
console.log(issues===0?'PERFECT MATCH — FACTORY_INIT is correct!':issues+' discrepancies');
