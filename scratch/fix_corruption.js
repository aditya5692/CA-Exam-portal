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

let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix incorrect replacements like 'rounded-lg-full' -> 'rounded-full'
    // This happened because the previous script matched 'rounded' inside 'rounded-full'
    if (content.includes('rounded-lg-full')) {
        content = content.replace(/rounded-lg-full/g, 'rounded-full');
        changed = true;
    }
    
    // Also check for other potential accidental double-hyphen names if any
    if (content.includes('rounded-lg-')) {
        // Only revert if it's following a known tailwind suffix that we shouldn't have touched
        // like rounded-lg-md, rounded-lg-sm etc.
        content = content.replace(/rounded-lg-(full|md|sm|xl|2xl|3xl|lg|none)/g, 'rounded-$1');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed corruption: ${file}`);
        count++;
    }
});

console.log(`Finished. Fixed ${count} files.`);
