import fs from 'fs';
import path from 'path';

function replaceInContent(content) {
  // Replace 'pkg@1.2.3' or "pkg@1.2.3" within quotes, preserving quotes
  const pattern = /(['"])([^'"\n]+?)@\d[\d\.]*\1/g;
  return content.replace(pattern, (_m, quote, name) => `${quote}${name}${quote}`);
}

function processFile(filePath) {
  const orig = fs.readFileSync(filePath, 'utf8');
  const next = replaceInContent(orig);
  if (next !== orig) {
    fs.writeFileSync(filePath, next);
    return true;
  }
  return false;
}

function walk(dir) {
  let changed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      changed += walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      if (processFile(p)) changed += 1;
    }
  }
  return changed;
}

const totalChanged = walk(path.resolve('src'));
console.log(`Rewrites completed. Files changed: ${totalChanged}`);

