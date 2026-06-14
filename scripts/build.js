const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'www');

// Assets to copy directly from project root
const rootAssets = [
  'index.html',
  'manifest.json',
  'service-worker.js',
  'avatar.jpg',
  'file.svg',
  'vocabsart-icon.svg',
  'app-icon.png'
];

// Directories to copy
const dirsToCopy = [
  'icons'
];

function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

function copyFolderRecursiveSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderRecursiveSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

function build() {
  console.log('Starting VocabsArt production build...');
  
  // 1. Clean the www folder
  if (fs.existsSync(distDir)) {
    console.log('Cleaning existing www directory...');
    deleteFolderRecursive(distDir);
  }
  
  // 2. Recreate www folder
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created empty www directory.');

  // 3. Copy root assets
  rootAssets.forEach(asset => {
    const sourcePath = path.join(projectRoot, asset);
    const destPath = path.join(distDir, asset);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied asset: ${asset}`);
    } else {
      console.warn(`Warning: Asset not found: ${asset}`);
    }
  });

  // 4. Copy folders
  dirsToCopy.forEach(dir => {
    const sourcePath = path.join(projectRoot, dir);
    const destPath = path.join(distDir, dir);
    if (fs.existsSync(sourcePath)) {
      copyFolderRecursiveSync(sourcePath, destPath);
      console.log(`Copied directory: ${dir}`);
    } else {
      console.warn(`Warning: Directory not found: ${dir}`);
    }
  });

  console.log('Build completed successfully!');
}

build();
