import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = [
  { file: 'public/robots.txt', required: true },
  { file: 'public/sitemap.xml', required: true },
  { file: 'public/.well-known/security.txt', required: true },
  { file: 'public/humans.txt', required: true },
  { file: 'public/manifest.json', required: true },
  { file: 'public/social-preview.png', required: true, maxSize: 500 * 1024 }, // 500KB
];

let errors = 0;
let warnings = 0;

console.log('\n🔍 Infrastructure File Verification\n');

checks.forEach(check => {
  const filePath = path.resolve(__dirname, '..', check.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing: ${check.file}`);
    if (check.required) errors++;
  } else if (check.maxSize) {
    const stats = fs.statSync(filePath);
    if (stats.size > check.maxSize) {
      console.warn(`⚠️  Large file: ${check.file} (${(stats.size / 1024).toFixed(0)}KB, recommended <${(check.maxSize / 1024).toFixed(0)}KB)`);
      warnings++;
    } else {
      console.log(`✅ ${check.file} (${(stats.size / 1024).toFixed(0)}KB)`);
    }
  } else {
    console.log(`✅ ${check.file}`);
  }
});

console.log('');

if (errors > 0) {
  console.error(`❌ Build failed: ${errors} required files missing\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`✅ All required files present (${warnings} warnings)\n`);
} else {
  console.log(`✅ All infrastructure files present and optimized\n`);
}
