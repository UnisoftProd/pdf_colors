import React from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import pantoneList from './pantone.json';

function cmykToRgb(c, m, y, k) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

export default function PantoneSelector({ value, onChange }) {
  return (
    <Autocomplete
      options={pantoneList}
      getOptionLabel={p => p ? `${p.pantone} (C${p.c} M${p.m} Y${p.y} K${p.k})` : ''}
      isOptionEqualToValue={(option, val) => option.pantone === val}
      value={pantoneList.find(x => x.pantone === value) || null}
      onChange={(_, newValue) => newValue && onChange(newValue)}
      renderInput={params => <TextField {...params} label="Pantone" fullWidth sx={{ mb: 2 }} />}
      filterSelectedOptions
      autoHighlight
      openOnFocus
      renderOption={(props, option) => {
        const rgb = cmykToRgb(option.c, option.m, option.y, option.k);
        const color = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
        return (
          <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', background: color, border: '1px solid #ccc', mr: 1 }} />
            {option.pantone} (C{option.c} M{option.m} Y{option.y} K{option.k})
          </Box>
        );
      }}
      renderOptionSelected={(option) => {
        const rgb = cmykToRgb(option.c, option.m, option.y, option.k);
        const color = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', background: color, border: '1px solid #ccc', mr: 1 }} />
            {option.pantone} (C{option.c} M{option.m} Y{option.y} K{option.k})
          </Box>
        );
      }}
    />
  );
} 