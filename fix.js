const fs = require('fs');
let c = fs.readFileSync('scripts/audit-sql-batch-standalone.ts', 'utf8');
c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('scripts/audit-sql-batch-standalone.ts', c, 'utf8');
console.log('Fixed file');
