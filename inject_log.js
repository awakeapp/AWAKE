const fs = require('fs');
const { execSync } = require('child_process');

const hash = execSync('git rev-parse --short HEAD').toString().trim();
const file = 'src/main.jsx';
let content = fs.readFileSync(file, 'utf8');

const logLine = `\nconsole.log("BUILD VERIFICATION:", { commit: "${hash}", timestamp: new Date().toISOString() });\n`;

// Inject after the last import line (before first non-import line)
const lines = content.split('\n');
let lastImportIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
}

if (lastImportIdx >= 0) {
  lines.splice(lastImportIdx + 1, 0, logLine);
  const newContent = lines.join('\n');
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('SUCCESS: Injected after line', lastImportIdx + 1);
  console.log('Preview:', newContent.slice(0, 500));
} else {
  console.error('ERROR: No import lines found');
}
