
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// URL of the repository
const REPO_URL = 'https://github.com/awakeapp/AWAKE.git';
const DIST_DIR = 'dist';

console.log('🚀 Starting Manual Deployment...');

try {
    // 1. Build
    console.log('📦 Building project...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Navigate to dist
    const distPath = path.resolve(process.cwd(), DIST_DIR);
    if (!fs.existsSync(distPath)) {
        throw new Error('Dist directory not found!');
    }

    // FIX: Create 404.html for SPA routing
    console.log('📄 Creating 404.html for GitHub Pages SPA support...');
    fs.copyFileSync(path.join(distPath, 'index.html'), path.join(distPath, '404.html'));

    process.chdir(distPath);

    // FIX: Trust this directory explicitly
    console.log('🛡️ Fixing git permissions...');
    // We use forward slashes for git compatibility on Windows
    const safePath = distPath.replace(/\\/g, '/');
    try {
        // Run it blindly to ensure it's added
        execSync(`git config --global --add safe.directory "${safePath}"`);
    } catch (e) {
        console.log("Allowed safe directory (or already exists).");
    }

    // 3. Init Git in dist
    console.log('🌱 Initializing temp git repo...');
    // Initialize if not exists, or re-init (safe)
    try {
        execSync('git init', { stdio: 'inherit' });
    } catch (e) { }

    // Checkout gh-pages or create it
    try {
        execSync('git checkout -b gh-pages', { stdio: 'inherit' });
    } catch (e) {
        execSync('git checkout gh-pages', { stdio: 'inherit' });
    }

    // 4. Add all files
    console.log('➕ Adding files...');
    execSync('git add -A', { stdio: 'inherit' });

    // 5. Commit
    console.log('committing...');
    try {
        // FIX: Set identity for this temp repo so it doesn't fail
        execSync('git config user.email "deploy@bot.com"', { stdio: 'inherit' });
        execSync('git config user.name "Deploy Bot"', { stdio: 'inherit' });

        execSync('git commit -m "deploy"', { stdio: 'inherit' });
    } catch (e) {
        console.log("Nothing to commit (clean working tree)");
    }

    // 6. Push
    console.log('📤 Pushing to gh-pages...');
    execSync(`git push -f ${REPO_URL} gh-pages`, { stdio: 'inherit' });

    console.log('✅ Deployment Complete! App should be live in a few minutes.');
} catch (error) {
    console.error('❌ Deployment Failed:', error.message);
    process.exit(1);
}
