const fs = require('fs');

const input = JSON.parse(fs.readFileSync('pantone_CMYK_RGB_Hex.json', 'utf8'));

const result = input.map(item => ({
  pantone: `Pantone ${item.Code} C`,
  c: Number(item.C),
  m: Number(item.M),
  y: Number(item.Y),
  k: Number(item.K)
}));

fs.writeFileSync('src/pantone.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Готово! Файл src/pantone.json создан.'); 