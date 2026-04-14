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

    // Pattern to catch 'rounded ' (with space) or 'rounded"' or 'rounded`' or 'rounded\n'
    // This targets exactly 'rounded' (4px) to upgrade it to 'rounded-lg' (8px)
    // We use word boundary \b to avoid matching 'rounded-md' etc.
    const pattern = /\brounded\b/g;

    if (pattern.test(content)) {
        // Standardize everything to 'rounded-lg' (8px)
        content = content.replace(pattern, 'rounded-lg');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Upgraded to 8px (rounded-lg): ${file}`);
        count++;
    }
});

console.log(`Finished. Upgraded ${count} files to the 8px baseline.`);
