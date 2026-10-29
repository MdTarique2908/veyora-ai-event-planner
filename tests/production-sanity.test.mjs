import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Production Sanity Checks for Veyora', async (t) => {
  await t.test('1. Production build files exist and have valid content', () => {
    assert.ok(fs.existsSync('dist/index.html'), 'dist/index.html should exist after build');
    const html = fs.readFileSync('dist/index.html', 'utf8');
    assert.match(html, /Veyora — Every occasion, extraordinary\./, 'HTML must contain brand title');
    assert.match(html, /favicon\.svg/, 'HTML must link favicon.svg');
    assert.match(html, /AI-powered event planning, beautifully simplified\./, 'HTML must contain meta description');

    assert.ok(fs.existsSync('public/favicon.svg'), 'public/favicon.svg must exist');
    const favicon = fs.readFileSync('public/favicon.svg', 'utf8');
    assert.match(favicon, /<svg/i, 'Favicon must be valid SVG');
    assert.match(favicon, /#e8d4a8/i, 'Favicon must contain Champagne Gold brand color');
    assert.match(favicon, /#172033/i, 'Favicon must contain Midnight Navy brand color');

    const assets = fs.readdirSync('dist/assets');
    const jsFiles = assets.filter((f) => f.endsWith('.js'));
    const cssFiles = assets.filter((f) => f.endsWith('.css'));
    assert.ok(jsFiles.length > 0, 'Should have at least 1 JS bundle in dist/assets');
    assert.ok(cssFiles.length > 0, 'Should have at least 1 CSS bundle in dist/assets');
  });

  await t.test('2. Server and package configuration verification', () => {
    assert.ok(fs.existsSync('package.json'), 'package.json must exist');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    assert.equal(pkg.name, 'veyora', 'Package name must be veyora');
    assert.ok(pkg.scripts.build, 'Must have build script');
    assert.ok(pkg.scripts.start, 'Must have start script');

    assert.ok(fs.existsSync('server.ts'), 'server.ts must exist');
    const serverCode = fs.readFileSync('server.ts', 'utf8');
    assert.match(serverCode, /You are Veyora/, 'Server prompt must use Veyora persona');
    assert.match(serverCode, /app\.use\(express\.static\(path\.resolve\(__dirname, 'dist'\)\)\)/, 'Server must serve dist in production');
  });

  await t.test('3. Client code security check (Zero exposed API keys in client)', () => {
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          scanDir(full);
        } else if (/\.(ts|tsx)$/.test(file)) {
          const content = fs.readFileSync(full, 'utf8');
          assert.doesNotMatch(content, /AIza[0-9A-Za-z-_]{35}/, `No hardcoded Google API keys allowed in client file ${full}`);
          assert.doesNotMatch(content, /sk-[0-9A-Za-z-_]{20,}/, `No hardcoded OpenAI keys allowed in client file ${full}`);
        }
      }
    }
    scanDir('src');
  });

  await t.test('4. Creator attribution and About section verified', () => {
    assert.ok(fs.existsSync('src/components/AboutModal.tsx'), 'AboutModal component must exist');
    const aboutCode = fs.readFileSync('src/components/AboutModal.tsx', 'utf8');
    assert.match(aboutCode, /Created by Md Tarique/, 'AboutModal must attribute Md Tarique');
    assert.match(aboutCode, /First-year B\.Tech Electronics and VLSI Design student at Jamia Millia Islamia/, 'AboutModal must include credentials');
    assert.match(aboutCode, /Every occasion, extraordinary\./, 'AboutModal must include tagline');
    assert.match(aboutCode, /md-tarique-516476447/, 'AboutModal must link to Tarique\'s LinkedIn profile');
    assert.match(aboutCode, /MdTarique2908/, 'AboutModal must link to Tarique\'s GitHub profile');

    const appCode = fs.readFileSync('src/App.tsx', 'utf8');
    assert.match(appCode, /Md Tarique/, 'App.tsx footer must attribute Md Tarique');
    assert.match(appCode, /Jamia Millia Islamia/, 'App.tsx footer must mention university');
    assert.match(appCode, /md-tarique-516476447/, 'App.tsx footer must link to Tarique\'s LinkedIn profile');
    assert.match(appCode, /MdTarique2908/, 'App.tsx footer must link to Tarique\'s GitHub profile');
  });
});
