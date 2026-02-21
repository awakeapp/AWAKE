const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (dirPath.endsWith('.jsx') || dirPath.endsWith('.js')) {
            callback(dirPath);
        }
    });
}

let modifiedCount = 0;

walkDir(srcDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix default imports of legacy atoms that were updated to App* components
    
    // Fix Button
    content = content.replace(/import\s+Button\s+from\s+['"][^'"]+Button(\.jsx)?['"];?/g, "import { AppButton } from '@/components/ui/AppButton';");

    // Fix Input
    content = content.replace(/import\s+Input\s+from\s+['"][^'"]+Input(\.jsx)?['"];?/g, "import { AppInput } from '@/components/ui/AppInput';");

    // Fix Textarea
    content = content.replace(/import\s+Textarea\s+from\s+['"][^'"]+Textarea(\.jsx)?['"];?/g, "import { AppTextarea } from '@/components/ui/AppInputs';");

    // Fix Select
    content = content.replace(/import\s+Select\s+from\s+['"][^'"]+Select(\.jsx)?['"];?/g, "import { AppSelect } from '@/components/ui/AppInputs';");

    // Fix Badge
    content = content.replace(/import\s+Badge\s+from\s+['"][^'"]+Badge(\.jsx)?['"];?/g, "import { AppBadge } from '@/components/ui/AppBadge';");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched imports in: ${filePath}`);
        modifiedCount++;
    }
});

console.log(`\nPatch complete. Modified ${modifiedCount} files.`);
