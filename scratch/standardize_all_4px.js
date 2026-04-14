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

    // Pattern to catch rounded-2xl, rounded-3xl, and any manual rounded-[...]
    // Except rounded-full which is usually intentional for circles
    const patterns = [
        /rounded-2xl/g,
        /rounded-3xl/g,
        /rounded-xl/g,
        /rounded-lg/g,
        /rounded-md/g,
        /rounded-\[[^\]]+\]/g
    ];

    patterns.forEach(pattern => {
        if (pattern.test(content)) {
            // Standardize everything to 'rounded' (4px)
            content = content.replace(pattern, 'rounded');
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Standardized (4px): ${file}`);
        count++;
    }
});

console.log(`Finished. Standardized ${count} files to the 4px baseline.`);
