const fs = require('fs');
const dir = 'src/components/ugc/studio';
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.tsx')) continue;
  const p = dir + '/' + f;
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  s = s.split("'../../hooks/").join("'../../../hooks/");
  s = s.split("'../../lib/").join("'../../../lib/");
  s = s.split("'../../data/").join("'../../../data/");
  s = s.split("'../../types/").join("'../../../types/");
  s = s.split("'../ugc/shared/primitives'").join("'../shared/primitives'");
  if (s !== before) { fs.writeFileSync(p, s); console.log('fixed', f); }
}