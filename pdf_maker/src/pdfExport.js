export async function exportVariantsToPdf(variantGroups, baseCmyk, deviation, comment, pantoneName = '') {
  const response = await fetch('http://localhost:5030/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cmyk: baseCmyk,
      deviation,
      comment,
      pantone: pantoneName
    })
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cmyk_variants.pdf';
  a.click();
  window.URL.revokeObjectURL(url);
} 