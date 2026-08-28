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

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Sometimes it replaced wrongly to just >\s*<span...X</span>\s*<
    let newContent = content.replace(
        />(\s*)<span className="text-transparent bg-clip-text bg-gradient-to-r from-\[#4F46E5\] to-\[#9333EA\]">X<\/span>(\s*)</g, 
        '><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#9333EA]">X</span><'
    );
    // Also, if there are any remaining >SkillitriX<
    newContent = newContent.replace(
        />(\s*)SkillitriX(\s*)</g, 
        '><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#9333EA]">X</span><'
    );
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Fixed', file);
    }
});
