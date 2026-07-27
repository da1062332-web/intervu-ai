const fs = require('fs');

// A 1x1 transparent PNG base64
const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

// Write it to app/icon.png
const buffer = Buffer.from(iconBase64, 'base64');
fs.writeFileSync('src/app/icon.png', buffer);

// Wait, the prompt says "Ensure there is an app/favicon.ico or app/icon.png"
// Next.js recognizes icon.png. But let's also put favicon.ico to prevent any 404s from hardcoded browser behavior.
fs.writeFileSync('src/app/favicon.ico', buffer);

console.log('Created src/app/icon.png and src/app/favicon.ico');
