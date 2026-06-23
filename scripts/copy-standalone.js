const fs = require('fs');
const path = require('path');

const srcStatic = path.join(__dirname, '../.next/static');
const destStatic = path.join(__dirname, '../.next/standalone/.next/static');

const srcPublic = path.join(__dirname, '../public');
const destPublic = path.join(__dirname, '../.next/standalone/public');

try {
  // Ensure the destination parent directories exist
  fs.mkdirSync(path.dirname(destStatic), { recursive: true });
  fs.mkdirSync(destPublic, { recursive: true });

  if (fs.existsSync(srcStatic)) {
    fs.cpSync(srcStatic, destStatic, { recursive: true, force: true });
    console.log('Successfully copied .next/static to .next/standalone/.next/static');
  } else {
    console.warn('Warning: .next/static does not exist');
  }

  if (fs.existsSync(srcPublic)) {
    fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
    console.log('Successfully copied public to .next/standalone/public');
  } else {
    console.warn('Warning: public directory does not exist');
  }
} catch (err) {
  console.error('Error copying standalone files:', err);
  process.exit(1);
}
