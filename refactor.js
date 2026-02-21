const fs = require('fs');
const path = require('path');

// Allowed spacing values in Config:
// 0, px, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64
const spacingMap = {
  '0.5': 'px',
  '1.5': '2',
  '2.5': '2', // Round down to 8px
  '3.5': '4', // Round up to 16px
  '5': '4', // 20px -> 16px
  '7': '6', // 28px -> 24px
  '9': '8', // 36px -> 32px
  '10': '8', // 40px -> 32px
  '11': '12', // 44px -> 48px
  '14': '12', // 56px -> 48px
  '20': '16', // 80px -> 64px
  '28': '24', // 112px -> 96px
};

const borderRadiusMap = {
  'rounded-sm': 'rounded-sm',
  'rounded-md': 'rounded',
  'rounded-lg': 'rounded',
  'rounded-xl': 'rounded',
  'rounded-2xl': 'rounded',
  'rounded-3xl': 'rounded',
  'rounded-t-md': 'rounded-t',
  'rounded-t-lg': 'rounded-t',
  'rounded-t-xl': 'rounded-t',
  'rounded-t-2xl': 'rounded-t',
  'rounded-t-3xl': 'rounded-t',
  'rounded-b-md': 'rounded-b',
  'rounded-b-lg': 'rounded-b',
  'rounded-b-xl': 'rounded-b',
  'rounded-b-2xl': 'rounded-b',
  'rounded-b-3xl': 'rounded-b',
};

// Prefixes for spacing replacement
const spacePrefixes = ['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'gap', 'gap-x', 'gap-y', 'top', 'bottom', 'left', 'right', 'inset', 'inset-x', 'inset-y'];

function processSpacing(classStr) {
  let classes = classStr.split(/\s+/);
  classes = classes.map(c => {
    // Check border radius
    if (borderRadiusMap[c]) return borderRadiusMap[c];

    // Check spacing
    for (const prefix of spacePrefixes) {
      if (c.startsWith(prefix + '-')) {
        const val = c.substring(prefix.length + 1);
        if (spacingMap[val]) {
          return prefix + '-' + spacingMap[val];
        } else if (val.startsWith('[')) {
          // Arbitrary value! Convert [20px] -> closest allowed, e.g. 16px, but for now we'll strip brackets if it's purely spacing violation? 
          // Extract px value
          const match = val.match(/\[(\d+)px\]/);
          if (match) {
            const px = parseInt(match[1]);
            // Closest px to 4,8,12,16,24,32,48,64
            const allowed = [0, 4, 8, 12, 16, 24, 32, 48, 64];
            let closest = allowed.reduce((prev, curr) => Math.abs(curr - px) < Math.abs(prev - px) ? curr : prev);
            const tailwindKey = closest === 0 ? '0' : closest === 4 ? '1' : closest === 8 ? '2' : closest === 12 ? '3' : closest === 16 ? '4' : closest === 24 ? '6' : closest === 32 ? '8' : closest === 48 ? '12' : closest === 64 ? '16' : '4';
            return prefix + '-' + tailwindKey;
          }
        }
      }
    }
    return c;
  });
  return classes.join(' ');
}

// Regex to find className="..."
const classRegex = /className=["']([^"']+)["']/g;
const clsxRegex = /cn\(([\s\S]*?)\)/g;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      // Skip node_modules, dist, .git
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

  // 1. Spacing and Radius
  content = content.replace(classRegex, (match, classes) => {
    return 'className="' + processSpacing(classes) + '"';
  });

  // Simple string literals inside cn() or clsx() usually have backticks or quotes
  const strRegex = /(["'`])([^"'`]+)\1/g;
  content = content.replace(clsxRegex, (match, args) => {
    const newArgs = args.replace(strRegex, (m, quote, classes) => {
        return quote + processSpacing(classes) + quote;
    });
    return 'cn(' + newArgs + ')';
  });

  // 2. Component Replacements (Basic HTML -> AppComponents if desired, but let's carefully replace custom old Button/Card with AppButton/AppCard)
  // Actually, wait, replacing `<button` with `<AppButton` globally is extremely dangerous without importing. But we will do:
  // We'll replace import { Button } from '.../atoms/Button' to import { AppButton } from '.../ui/AppButton'
  // Then replace <Button ...> with <AppButton ...>
  
  content = content.replace(/import\s+\{\s*Button\s*\}\s+from\s+[^;]+;/g, "import { AppButton } from '@/components/ui/AppButton';");
  content = content.replace(/<Button/g, "<AppButton");
  content = content.replace(/<\/Button>/g, "</AppButton>");

  content = content.replace(/import\s+\{\s*Input\s*\}\s+from\s+[^;]+;/g, "import { AppInput } from '@/components/ui/AppInput';");
  content = content.replace(/<Input/g, "<AppInput");
  content = content.replace(/<\/Input>/g, "</AppInput>");

  content = content.replace(/import\s+\{\s*Card\s*\}\s+from\s+[^;]+;/g, "import { AppCard } from '@/components/ui/AppCard';");
  content = content.replace(/<Card/g, "<AppCard");
  content = content.replace(/<\/Card>/g, "</AppCard>");

  // Remove arbitrary shadows
  content = content.replace(/shadow-(lg|xl|2xl|inner)/g, "shadow-md");
  
  // Icon sizes: remove w-8, h-8, etc on Lucide icons.
  // This is harder. But we'll try to enforce typography sizes. Text-sizes were already removed in Tailwind config!
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});

console.log('Refactor complete.');
