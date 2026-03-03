const fs=require('fs');
function decode7bit(e){const d=[];let i=0;while(i<e.length){const m=e[i++];const c=Math.min(7,e.length-i);for(let j=0;j<c;j++){let b=e[i+j];if(m&(1<<(6-j)))b|=0x80;d.push(b);}i+=c;}return Buffer.from(d);}
function loadSyx(p){const raw=fs.readFileSync(p);const msgs=[];let s=0;for(let i=0;i<raw.length;i++)if(raw[i]===0xF7){msgs.push(raw.slice(s,i+1));s=i+1;}return decode7bit(msgs[msgs.length-1].slice(7,-1));}
function sec(b){return b<12?'NAME':b<38?'G['+b+']':'T'+(b<146?1:2)+'+'+(b<146?b-38:b-146);}
const trueInit=loadSyx('C:/dev/patchify/arpon.syx');
trueInit[30]=0x00;
const src=fs.readFileSync('C:/dev/patchify/cli/create-custom-library-from-factory.cjs','utf8');
const match=src.match(/const FACTORY_INIT = Buffer\.from\(\[([\s\S]+?)\]\);/);
const hexVals=match[1].replace(/\/\/.*/g,'').match(/0x[0-9a-fA-F]+/g);
const factInit=Buffer.from(hexVals.map(h=>parseInt(h,16)));
console.log('FACTORY_INIT length:',factInit.length);
let issues=0;
for(let b=12;b<254;b++){if(factInit[b]!==trueInit[b]){console.log('B'+b+' ['+sec(b)+']: OURS=0x'+factInit[b].toString(16)+' TRUE=0x'+trueInit[b].toString(16));issues++;}}
console.log(issues===0?'PERFECT MATCH!':issues+' issues remain');
