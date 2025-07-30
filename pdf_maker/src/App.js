import React, { useState } from 'react';
import { Container, Typography, Radio, RadioGroup, FormControlLabel, TextField, Slider, Button, Box, Grid, Paper } from '@mui/material';
import PantoneSelector from './PantoneSelector';
import { exportVariantsToPdf } from './pdfExport';

function cmykToRgb(c, m, y, k) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

function clamp(val) {
  return Math.max(0, Math.min(100, Number(val)));
}

function generateVariants(baseCmyk, deviation) {
  const steps = [-deviation, 0, deviation];
  const variants = [];
  for (let yStep of steps) {
    for (let kStep of steps) {
      const group = [];
      for (let cStep of steps) {
        for (let mStep of steps) {
          group.push({
            c: clamp(baseCmyk.c + cStep),
            m: clamp(baseCmyk.m + mStep),
            y: clamp(baseCmyk.y + yStep),
            k: clamp(baseCmyk.k + kStep),
            dc: cStep,
            dm: mStep,
            dy: yStep,
            dk: kStep
          });
        }
      }
      variants.push(group);
    }
  }
  return variants; // массив из 9 групп по 9 цветов
}

export default function App() {
  const [mode, setMode] = useState('cmyk');
  const [cmyk, setCmyk] = useState({ c: '100', m: '10', y: '2', k: '32' });
  const [deviation, setDeviation] = useState(5);
  const [comment, setComment] = useState('');
  const [pantone, setPantone] = useState('');

  // Для генерации вариантов и экспорта преобразуем к числам
  const numericCmyk = {
    c: clamp(Number(cmyk.c)),
    m: clamp(Number(cmyk.m)),
    y: clamp(Number(cmyk.y)),
    k: clamp(Number(cmyk.k)),
  };
  const variants = generateVariants(numericCmyk, deviation);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Выберите способ
        </Typography>
        <RadioGroup
          row
          value={mode}
          onChange={e => setMode(e.target.value)}
          sx={{ justifyContent: 'center', mb: 2 }}
        >
          <FormControlLabel value="pantone" control={<Radio />} label="Pantone" />
          <FormControlLabel value="cmyk" control={<Radio />} label="CMYK вручную" />
        </RadioGroup>
        {mode === 'pantone' && (
          <PantoneSelector
            value={pantone}
            onChange={p => {
              setPantone(p.pantone);
              setCmyk({ c: p.c, m: p.m, y: p.y, k: p.k });
            }}
          />
        )}
        {mode === 'cmyk' && (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'center', alignItems: 'center' }}>
              <TextField
                label="C"
                type="number"
                value={cmyk.c}
                onChange={e => setCmyk({ ...cmyk, c: e.target.value })}
                onKeyDown={e => {
                  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                  const isNumber = /^\d$/.test(e.key);
                  const isAllowedKey = allowedKeys.includes(e.key);
                  if (!isNumber && !isAllowedKey) {
                    e.preventDefault();
                  }
                }}
                onBlur={e => setCmyk({ ...cmyk, c: String(Math.round(clamp(e.target.value))) })}
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
              <TextField
                label="M"
                type="number"
                value={cmyk.m}
                onChange={e => setCmyk({ ...cmyk, m: e.target.value })}
                onKeyDown={e => {
                  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                  const isNumber = /^\d$/.test(e.key);
                  const isAllowedKey = allowedKeys.includes(e.key);
                  if (!isNumber && !isAllowedKey) {
                    e.preventDefault();
                  }
                }}
                onBlur={e => setCmyk({ ...cmyk, m: String(Math.round(clamp(e.target.value))) })}
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
              <TextField
                label="Y"
                type="number"
                value={cmyk.y}
                onChange={e => setCmyk({ ...cmyk, y: e.target.value })}
                onKeyDown={e => {
                  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                  const isNumber = /^\d$/.test(e.key);
                  const isAllowedKey = allowedKeys.includes(e.key);
                  if (!isNumber && !isAllowedKey) {
                    e.preventDefault();
                  }
                }}
                onBlur={e => setCmyk({ ...cmyk, y: String(Math.round(clamp(e.target.value))) })}
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
              <TextField
                label="K"
                type="number"
                value={cmyk.k}
                onChange={e => setCmyk({ ...cmyk, k: e.target.value })}
                onKeyDown={e => {
                  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                  const isNumber = /^\d$/.test(e.key);
                  const isAllowedKey = allowedKeys.includes(e.key);
                  if (!isNumber && !isAllowedKey) {
                    e.preventDefault();
                  }
                }}
                onBlur={e => setCmyk({ ...cmyk, k: String(Math.round(clamp(e.target.value))) })}
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
              <Box sx={{ width: 40, height: 40, borderRadius: 2, border: '1px solid #ccc', ml: 2, background: `rgb(${cmykToRgb(Number(cmyk.c), Number(cmyk.m), Number(cmyk.y), Number(cmyk.k)).r},${cmykToRgb(Number(cmyk.c), Number(cmyk.m), Number(cmyk.y), Number(cmyk.k)).g},${cmykToRgb(Number(cmyk.c), Number(cmyk.m), Number(cmyk.y), Number(cmyk.k)).b})` }} />
            </Box>
          </>
        )}
        {/* Поле для комментария теперь всегда отображается */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Комментарий (необязательно)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>
            Отклонение по CMYK (1-10): {deviation}
          </Typography>
          <Slider
            value={deviation}
            min={1}
            max={10}
            step={1}
            onChange={(_, v) => setDeviation(v)}
          />
        </Box>
        <Button variant="contained" size="large" fullWidth sx={{ mb: 3 }}
          onClick={() => exportVariantsToPdf(variants, numericCmyk, deviation, comment, mode === 'pantone' ? pantone : '')}>
          Создать PDF
        </Button>
      </Paper>
    </Container>
  );
} 