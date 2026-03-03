const fs = require('fs');

const fp = fs.readFileSync('factory-patches.syx');
const ip = fs.readFileSync('initpatch.syx');

console.log('factory-patches.syx structure analysis:');
console.log(`Total size: ${fp.length}`);
console.log(`  F0 (1) + Header (7) + Data (${fp.length - 9}) + F7 (1)`);

const dataStart = 8; // Skip F0 (1) + Header (7)
const dataEnd = fp.length - 1; // Skip F7 (1)
const dataLength = dataEnd - dataStart;

console.log(`\nData section: bytes ${dataStart} to ${dataEnd}`);
console.log(`Data length: ${dataLength} bytes`);

const halfway = Math.floor(dataLength / 2);
console.log(`\nHalfway of DATA section: ${halfway} bytes`);
console.log(`Halfway byte offset in file: ${dataStart + halfway}`);

console.log(`\n\ninitpatch.syx structure:`);
console.log(`Total size: ${ip.length}`);
console.log(`  F0 (1) + Header (7) + Data (${ip.length - 9}) + F7 (1)`);

const ipDataStart = 8;
const ipDataEnd = ip.length - 1;
const ipDataLength = ipDataEnd - ipDataStart;
console.log(`Data section: bytes ${ipDataStart} to ${ipDataEnd}`);
console.log(`Data length: ${ipDataLength} bytes`);

// Compare the data at halfway point of factory-patches with initpatch
console.log(`\n\n=== COMPARISON ===`);
const halfwayByteOffset = dataStart + halfway;
const halfwayData = fp.slice(halfwayByteOffset, halfwayByteOffset + 50);
const initpatchData = ip.slice(ipDataStart, ipDataStart + 50);

console.log(`\nData at halfway of factory-patches (byte ${halfwayByteOffset}):`);
console.log(halfwayData.toString('hex'));

console.log(`\nData from initpatch.syx (byte ${ipDataStart}):`);
console.log(initpatchData.toString('hex'));

console.log(`\nDo they match? ${halfwayData.equals(initpatchData)}`);

// Check if initpatch appears anywhere in factory-patches at the data level
console.log(`\n\n=== SEARCHING FOR INITPATCH DATA ===`);
const searchData = ip.slice(ipDataStart, ipDataStart + 100); // Use first 100 bytes of initpatch data
const searchStr = searchData.toString('hex');

for (let i = dataStart; i < dataEnd - 100; i += 100) {
  const chunk = fp.slice(i, i + 100).toString('hex');
  if (chunk === searchStr) {
    console.log(`MATCH found at file byte offset ${i}`);
  }
}

// Look for patterns - the header bytes of initpatch in factory
console.log(`\n\n=== CHECKING PATTERNS ===`);
const pattern = Buffer.from([0x00, 0x02, 0x02, 0x02]);
let found = 0;
for (let i = dataStart; i < dataEnd; i++) {
  if (fp[i] === pattern[0] && fp[i+1] === pattern[1] && fp[i+2] === pattern[2] && fp[i+3] === pattern[3]) {
    console.log(`Pattern found at byte ${i}`);
    found++;
    if (found >= 5) break;
  }
}
