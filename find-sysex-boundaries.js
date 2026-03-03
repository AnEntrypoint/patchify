const fs = require('fs');

// Look for F0...F7 boundaries in factory-prg.syx to find actual patch structure
const raw = fs.readFileSync('factory-prg.syx');
console.log(`factory-prg.syx: ${raw.length} bytes`);

// Find all F0 start markers
const f0positions = [];
const f7positions = [];
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === 0xF0) f0positions.push(i);
  if (raw[i] === 0xF7) f7positions.push(i);
}
console.log(`\nF0 (SysEx start) positions: ${f0positions.length} found`);
console.log(`F7 (SysEx end) positions: ${f7positions.length} found`);

if (f0positions.length <= 10) {
  console.log('\nAll F0 positions:', f0positions);
  console.log('All F7 positions:', f7positions);
}

// If there are multiple F0/F7 pairs, this is concatenated messages
if (f0positions.length > 1) {
  console.log('\n=== MULTIPLE SYSEX MESSAGES FOUND ===');
  const messageSizes = [];
  for (let i = 0; i < f0positions.length; i++) {
    const start = f0positions[i];
    const end = f7positions[i]; // corresponding F7
    const size = end - start + 1;
    messageSizes.push(size);
    if (i < 5 || i === f0positions.length - 1) {
      console.log(`Message ${i}: bytes ${start}-${end} = ${size} bytes`);
      console.log(`  Header: ${raw.slice(start, start + 8).toString('hex')}`);
    }
  }
  const unique = [...new Set(messageSizes)];
  console.log(`\nMessage sizes: ${unique.join(', ')} bytes`);
  console.log(`Total messages: ${f0positions.length}`);

  // If all messages same size, calculate patch size
  if (unique.length === 1 || unique.length === 2) {
    const commonSize = unique[0];
    console.log(`\nEach message = ${commonSize} bytes`);
    // Decode one message to get patch size
    function decode7bit(encoded) {
      const decoded = [];
      let i = 0;
      while (i < encoded.length) {
        const msb = encoded[i++];
        const chunkSize = Math.min(7, encoded.length - i);
        for (let j = 0; j < chunkSize; j++) {
          let b = encoded[i + j];
          if (msb & (1 << (6 - j))) b |= 0x80;
          decoded.push(b);
        }
        i += chunkSize;
      }
      return Buffer.from(decoded);
    }
    const msg0 = raw.slice(f0positions[0], f7positions[0] + 1);
    const encoded = msg0.slice(8, -1);
    const decoded = decode7bit(encoded);
    console.log(`First message decoded: ${decoded.length} bytes`);
    console.log(`First message name bytes: "${decoded.slice(0, 12).toString('ascii').replace(/[^\x20-\x7e]/g, '.')}"`);
  }
} else {
  console.log('\nSingle SysEx message - checking if it has patches inside');
  function decode7bit(encoded) {
    const decoded = [];
    let i = 0;
    while (i < encoded.length) {
      const msb = encoded[i++];
      const chunkSize = Math.min(7, encoded.length - i);
      for (let j = 0; j < chunkSize; j++) {
        let b = encoded[i + j];
        if (msb & (1 << (6 - j))) b |= 0x80;
        decoded.push(b);
      }
      i += chunkSize;
    }
    return Buffer.from(decoded);
  }
  const encoded = raw.slice(8, -1);
  const decoded = decode7bit(encoded);
  console.log(`Decoded: ${decoded.length} bytes`);

  // Scan for F0 in decoded data
  const decodedF0 = [];
  for (let i = 0; i < decoded.length; i++) {
    if (decoded[i] === 0xF0) decodedF0.push(i);
  }
  console.log(`F0 bytes in decoded data: ${decodedF0.length}`);
}

// Also check the initpatch.syx as reference
const ip = fs.readFileSync('initpatch.syx');
console.log(`\n\ninitpatch.syx: ${ip.length} bytes`);
const ipF0 = [];
const ipF7 = [];
for (let i = 0; i < ip.length; i++) {
  if (ip[i] === 0xF0) ipF0.push(i);
  if (ip[i] === 0xF7) ipF7.push(i);
}
console.log(`F0 count: ${ipF0.length}, F7 count: ${ipF7.length}`);
console.log(`Header: ${ip.slice(0, 8).toString('hex')}`);
