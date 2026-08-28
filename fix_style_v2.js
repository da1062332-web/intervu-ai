const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('apps/web/src');
const TARGET = '<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#9333EA]">X</span>';

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Split by target to see if we need to insert Skillitri
    let parts = content.split(TARGET);
    if (parts.length > 1) {
        let newContent = parts[0];
        for (let i = 1; i < parts.length; i++) {
            // Check if it's already preceded by Skillitri
            if (!parts[i-1].endsWith('Skillitri')) {
                newContent += 'Skillitri';
            }
            newContent += TARGET + parts[i];
        }
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log('Fixed', file);
        }
    }
});
