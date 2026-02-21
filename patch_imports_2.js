const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
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

    // 1. Fix Card imports
    // Matches: import { Card, CardHeader, CardTitle, CardContent } from '../atoms/Card';
    // Matches: import Card from '../atoms/Card';
    content = content.replace(/import\s+(?:{\s*Card[^}]*}|Card)\s+from\s+['"][^'"]+Card(\.jsx)?['"];?/g, "import { AppCard, AppCardHeader, AppCardTitle, AppCardContent } from '@/components/ui/AppCard';");

    // 2. Fix Modal imports
    content = content.replace(/import\s+(?:{\s*Modal[^}]*}|Modal)\s+from\s+['"][^'"]+Modal(\.jsx)?['"];?/g, "import { AppModal } from '@/components/ui/AppModal';");

    // 3. Fix Skeleton imports
    content = content.replace(/import\s+(?:{\s*Skeleton[^}]*}|Skeleton)\s+from\s+['"][^'"]+Skeleton(\.jsx)?['"];?/g, "import { AppSkeleton } from '@/components/ui/AppSkeleton';");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched structures in: ${filePath}`);
        modifiedCount++;
    }
});

console.log(`\nPatch complete. Modified ${modifiedCount} files.`);
