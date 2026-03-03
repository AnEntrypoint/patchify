const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}

function loadSyx(path){
  if(!fs.existsSync(path)){return null;}
  const raw=fs.readFileSync(path);
  const msgs=[];let s=0;
  for(let i=0;i<raw.length;i++) if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}
  // take last msg (most recent state)
  const msg=msgs[msgs.length-1];
  return decode7bit(msg.slice(7,-1));
}

const files={
  arpon:   loadSyx('C:/dev/patchify/arpon.syx'),
  arpoff:  loadSyx('C:/dev/patchify/arpoff.syx'),
  vibzero: loadSyx('C:/dev/patchify/vibratozero.syx'),
  vibmin:  loadSyx('C:/dev/patchify/vibratomin.syx'),
  vibmax:  loadSyx('C:/dev/patchify/vibratomax.syx'),
};

for(const[k,v] of Object.entries(files)) console.log(k+':'+(v?v.length+' bytes':'NOT FOUND'));

function diff(a,b,la,lb){
  const diffs=[];
  for(let i=0;i<Math.min(a.length,b.length);i++)
    if(a[i]!==b[i]) diffs.push({b:i,a:a[i],bv:b[i]});
  return diffs;
}

function sec(b){return b<12?'NAME':b<38?'G['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);}

// ARP: arpon vs arpoff
if(files.arpon&&files.arpoff){
  console.log('\n=== ARP ON vs OFF ===');
  const d=diff(files.arpon,files.arpoff);
  d.forEach(({b,a,bv})=>console.log('B'+String(b).padStart(3)+' ['+sec(b)+']: ON=0x'+a.toString(16)+'('+a+') OFF=0x'+bv.toString(16)+'('+bv+')'));
  console.log(d.length+' diffs');
}

// VIBRATO: compare all 3
if(files.vibzero&&files.vibmin&&files.vibmax){
  console.log('\n=== VIBRATO zero/min/max ===');
  const keys=['vibzero','vibmin','vibmax'];
  const all=keys.map(k=>files[k]);
  for(let b=0;b<254;b++){
    const vals=all.map(p=>p[b]);
    const u=new Set(vals);
    if(u.size>1){
      const s=sec(b);
      console.log('B'+String(b).padStart(3)+' ['+s+']: zero=0x'+vals[0].toString(16)+'('+vals[0]+') min=0x'+vals[1].toString(16)+'('+vals[1]+') max=0x'+vals[2].toString(16)+'('+vals[2]+')');
    }
  }
  // Also compare vibzero vs vibratomin
  console.log('\nzero vs min:');
  diff(files.vibzero,files.vibmin).forEach(({b,a,bv})=>console.log('B'+String(b).padStart(3)+' ['+sec(b)+']: zero=0x'+a.toString(16)+'('+a+') min=0x'+bv.toString(16)+'('+bv+')'));
}

// Show our current FACTORY_INIT key bytes
const raw=fs.readFileSync('C:/dev/patchify/cli/create-custom-library-from-factory.cjs','utf8');
const initMatch=raw.match(/const FACTORY_INIT = Buffer\.from\(\[([\s\S]+?)\]\)/);
console.log('\nFACTORY_INIT found in source:',initMatch?'yes':'no');
