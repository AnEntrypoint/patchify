const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
function loadSyx(p){const raw=fs.readFileSync(p);const msgs=[];let s=0;for(let i=0;i<raw.length;i++)if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}return decode7bit(msgs[msgs.length-1].slice(7,-1));}
function sec(b){return b<12?'NAME':b<38?'G['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);}

// vibratozero = init patch with vibrato at 0 (T1+6=0x40 instead of 0x45)
// arpon = init patch with arp on (B30=0x80)
// Both are init patches, giving us ground truth for ALL other bytes
const vibzero=loadSyx('C:/dev/patchify/vibratozero.syx');
const arpon=loadSyx('C:/dev/patchify/arpon.syx');

// Extract our FACTORY_INIT from source
const src=fs.readFileSync('C:/dev/patchify/cli/create-custom-library-from-factory.cjs','utf8');
const match=src.match(/const FACTORY_INIT = Buffer\.from\(\[([^\]]+)\]\)/s);
if(!match){console.log('FACTORY_INIT not found');process.exit(1);}
const factoryInit=Buffer.from(match[1].split(',').map(s=>parseInt(s.trim())));
console.log('FACTORY_INIT length:',factoryInit.length,'bytes');

// Build "true init" = arpon but with B30=0x00 (arp off) and T1+6 from arpon (=0x45 factory vibrato)
// OR use vibratozero which is init+vibrato=0 — use arpon for ALL bytes except B30
const trueInit=Buffer.from(arpon);
trueInit[30]=0x00; // arp off

console.log('\n=== FACTORY_INIT vs true init (arpon with B30=0) ===');
let issues=0;
for(let b=12;b<254;b++){
  if(factoryInit[b]!==trueInit[b]){
    console.log('B'+String(b).padStart(3)+' ['+sec(b)+']: OURS=0x'+factoryInit[b].toString(16)+'('+factoryInit[b]+') TRUE=0x'+trueInit[b].toString(16)+'('+trueInit[b]+')');
    issues++;
  }
}
console.log(issues===0?'FACTORY_INIT matches true init perfectly!':issues+' discrepancies found');

// Also: what does vibratozero tell us about FACTORY_INIT?
// vibratozero = init with T1+6=0x40 (vibrato off). Our FACTORY_INIT T1+6 should be 0x45 (factory default).
console.log('\nVibratozero T1+6=0x'+vibzero[38+6].toString(16)+' (should be 0x40=zero)');
console.log('Arpon T1+6=0x'+arpon[38+6].toString(16)+' (should be 0x45=factory vibrato)');
console.log('Our FACTORY_INIT T1+6=0x'+factoryInit[38+6].toString(16)+' (should be 0x45=factory vibrato)');

// Check arp byte
console.log('\nArp byte B30: arpon=0x'+arpon[30].toString(16)+' vibzero=0x'+vibzero[30].toString(16)+' ourInit=0x'+factoryInit[30].toString(16));

// Show key bytes from true init for documentation
console.log('\nKey global bytes from init:');
for(let b=12;b<38;b++) process.stdout.write('B'+b+'=0x'+trueInit[b].toString(16)+' ');
console.log('\nKey T1 bytes (T1+0..+20):');
for(let i=0;i<21;i++) process.stdout.write('T1+'+i+'=0x'+trueInit[38+i].toString(16)+' ');
console.log('');
