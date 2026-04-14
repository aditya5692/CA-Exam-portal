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

let xlCount = 0;
let lgCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace rounded-xl with rounded-md (12px -> 6px)
    if (content.includes('rounded-xl')) {
        content = content.replace(/rounded-xl/g, 'rounded-md');
        changed = true;
        xlCount++;
    }

    // Replace rounded-lg with rounded (8px -> 4px)
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

console.log(`Finished. Processed ${xlCount} files for xl->md and ${lgCount} files for lg->rounded.`);
