import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the ADHDPlannerWorking directory exists in dist
const adhpDir = path.join(__dirname, '../dist/ADHDPlannerWorking');
if (!fs.existsSync(adhpDir)) {
  fs.mkdirSync(adhpDir, { recursive: true });
}

// Copy manifest.json to the root of dist to make it accessible at /manifest.json
console.log('Copying manifest.json to root...');
fs.copyFileSync(
  path.join(__dirname, '../public/manifest.json'),
  path.join(__dirname, '../dist/manifest.json')
);

// Copy the 404.html file to the root of dist
console.log('Copying 404.html to root...');
fs.copyFileSync(
  path.join(__dirname, '../public/404.html'),
  path.join(__dirname, '../dist/404.html')
);

// Copy assets to the ADHDplanner directory
const assetsToCopy = [
  'manifest.json',
  'favicon.ico',
  'apple-touch-icon.png',
  'masked-icon.svg',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-helper.js',
  '404.html'
];

console.log('Copying assets to /ADHDPlannerWorking directory...');
assetsToCopy.forEach(asset => {
  const src = path.join(__dirname, '../public', asset);
  const dest = path.join(adhpDir, asset);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${asset} to ${dest}`);
  } else {
    console.log(`Warning: Could not find ${src}`);
  }
});

// Create a proper .nojekyll file to prevent GitHub Pages from processing the site with Jekyll
console.log('Creating .nojekyll file...');
fs.writeFileSync(path.join(__dirname, '../dist/.nojekyll'), '');

// Make sure the index.html in the dist directory has the correct MIME type header
// and fix any path issues
console.log('Adding MIME type hint to index.html and fixing paths...');
const indexPath = path.join(__dirname, '../dist/index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add a comment at the top of the file to ensure it's served with the correct MIME type
  if (!indexContent.includes('<!-- text/html -->')) {
    indexContent = '<!-- text/html -->\n' + indexContent;
  }
  
  // Fix any absolute paths to be relative
  indexContent = indexContent
    .replace(/src="\/assets\//g, 'src="assets/')
    .replace(/href="\/assets\//g, 'href="assets/')
    .replace(/src="\/registerSW\.js/g, 'src="registerSW.js')
    .replace(/href="\/manifest\.webmanifest/g, 'href="manifest.webmanifest');
  
  fs.writeFileSync(indexPath, indexContent);
}

console.log('Post-build processing complete!');