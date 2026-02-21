const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else { 
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Change subcomponents of Card
  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"](?:@\/|\.\.\/|\.\/)*components\/(?:atoms|ui)\/AppCard['"];/g, (match, imports) => {
      // Re-add CardHeader, CardContent, CardTitle support to the import if they existed
      let newImports = imports.replace(/Card([HCT])/g, 'AppCard$1').trim();
      return `import { ${newImports} } from '@/components/ui/AppCard';`;
  });

  // Since we replaced <Card... earlier but left CardContent.. Let's replace now
  content = content.replace(/<CardHeader/g, "<AppCardHeader");
  content = content.replace(/<\/CardHeader>/g, "</AppCardHeader>");
  
  content = content.replace(/<CardContent/g, "<AppCardContent");
  content = content.replace(/<\/CardContent>/g, "</AppCardContent>");
  
  content = content.replace(/<CardTitle/g, "<AppCardTitle");
  content = content.replace(/<\/CardTitle>/g, "</AppCardTitle>");

  // Fix Login syntax error for mismatched quotes in bg-[url("...')]
  content = content.replace(/className=\"absolute inset-0 bg-\[url\(\"https([^)]+)\'\)\]/g, 'className="absolute inset-0 bg-[url(\'https$1\')]');

  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
