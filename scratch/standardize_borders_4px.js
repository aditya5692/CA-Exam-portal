const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'src'));

let mdCount = 0;
let lgCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace rounded-md and rounded-lg with rounded (6px/8px -> 4px)
    if (content.includes('rounded-md')) {
        content = content.replace(/rounded-md/g, 'rounded');
        changed = true;
        mdCount++;
    }

    if (content.includes('rounded-lg')) {
        content = content.replace(/rounded-lg/g, 'rounded');
        changed = true;
        lgCount++;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});

console.log(`Finished. Processed ${mdCount} files for md->rounded and ${lgCount} files for lg->rounded.`);
