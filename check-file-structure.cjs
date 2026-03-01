const fs = require('fs');

const custom = fs.readFileSync('patches/custom-library-2026-03-01.syx');

// Check structure
console.log('FILE STRUCTURE CHECK:\n');
console.log(`Total size: ${custom.length} bytes`);
console.log(`Expected: 36,420 bytes\n`);

// Check header
const header = custom.slice(0, 5);
console.log(`Header: ${Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
console.log(`(Should be: f0 42 30 58 50)\n`);

// Check end marker
const endMarker = custom.slice(-1);
console.log(`End marker: ${endMarker[0].toString(16)}`);
console.log(`(Should be: f7)\n`);

// Check patch data section
console.log('PATCH DATA SECTION:');
const bodyStart = 5;
const bodyEnd = custom.length - 1;
const bodySize = bodyEnd - bodyStart;
console.log(`Body starts at: byte ${bodyStart}`);
console.log(`Body ends at: byte ${bodyEnd}`);
console.log(`Body size: ${bodySize} bytes`);
console.log(`Expected: 36,414 bytes\n`);

// Show first 16 bytes of first patch (the name field)
const nameBytes = custom.slice(bodyStart, bodyStart + 16);
const nameStr = nameBytes.toString().replace(/\0/g, ' ').trim();
console.log(`First patch name field (bytes 5-20): "${nameStr}"`);
console.log(`Hex: ${Array.from(nameBytes).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
console.log(`(Should start with: 44 65 65 70 ... for "Deep")\n`);

// Check where the actual patch data starts vs where system data starts
const patch254Point = bodyStart + 128 * 254;
console.log(`Patch data should end at byte: ${patch254Point}`);
console.log(`Actual body end: ${bodyEnd}`);
console.log(`System data size: ${bodyEnd - patch254Point} bytes`);
console.log(`Expected system data: 3,902 bytes`);
