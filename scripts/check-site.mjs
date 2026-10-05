import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
for (const reference of references) {
  if (/^(data:|https?:|#)/.test(reference) || reference === './') continue;
  assert.ok(!reference.startsWith('/'), `Use caminho relativo: ${reference}`);
  const target = path.resolve(root, reference);
  assert.ok(target.startsWith(root + path.sep), `Referência fora do site: ${reference}`);
  assert.ok(fs.existsSync(target), `Arquivo não encontrado: ${reference}`);
  if (reference.endsWith('.js')) new vm.Script(fs.readFileSync(target, 'utf8'), { filename: reference });
}
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'assets/data/data.js'), 'utf8'), context);
assert.equal(Object.keys(context.window.TRAINING_DATA.workouts).length, 29);
assert.ok(context.window.TRAINING_DATA.guide);
assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
console.log('Caminhos relativos, JavaScript e 29 fichas conferidos. Site pronto para empacotamento.');
