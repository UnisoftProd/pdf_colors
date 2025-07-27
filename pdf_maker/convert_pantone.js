const fs = require('fs');

const lines = fs.readFileSync('../Pantone.txt', 'utf8').split(/\r?\n/).filter(Boolean);
const result = lines.map(line => {
  const parts = line.trim().split(/\t+/);
  return {
    pantone: parts[0].trim(),
    c: Number(parts[1]),
    m: Number(parts[2]),
    y: Number(parts[3]),
    k: Number(parts[4])
  };
});
fs.writeFileSync('src/pantone.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Готово! Файл src/pantone.json создан из Pantone.txt.'); 