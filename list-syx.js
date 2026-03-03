const fs = require('fs');
const path = require('path');

function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.')) {
      walk(full);
    } else if (item.name.endsWith('.syx')) {
      console.log(full);
    }
  });
}

walk('C:\\dev\\patchify');
