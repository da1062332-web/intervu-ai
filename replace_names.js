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
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.md')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = [...walk('apps/web/src'), 'README.md', ...walk('apps/api/src')];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        .replace(/InterVu AI/g, 'SkillitriX')
        .replace(/Intervu AI/g, 'SkillitriX')
        .replace(/InterVu/g, 'SkillitriX')
        .replace(/Intervu/g, 'SkillitriX')
        .replace(/intervu\.ai/g, 'skillitrix.com');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated', file);
    }
});
