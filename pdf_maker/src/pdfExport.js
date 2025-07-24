import { PDFDocument, rgb, cmyk, StandardFonts } from 'pdf-lib';

export async function exportVariantsToPdf(variantGroups, baseCmyk, deviation, comment, pantoneName = '') {
  const pdfDoc = await PDFDocument.create();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Размер страницы: 11.61 × 15.24 inch = 836.0 × 1097.3 pt
  const pageWidth = 11.61 * 72;
  const pageHeight = 15.24 * 72;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const { width, height } = page.getSize();
  const margin = 200; // большие поля со всех сторон
  const workWidth = width - 2 * margin;
  const workHeight = height - 2 * margin;

  const cellW = 44, cellH = 44;
  const groupCols = 3, groupRows = 3;
  const groupGapX = 40, groupGapY = 20; // уменьшенные отступы между группами
  const cols = 3, rows = 3;
  const colorGapX = 12, colorGapY = 24; // уменьшенные отступы внутри группы

  const groupW = cols * cellW + (cols - 1) * colorGapX;
  const groupH = rows * cellH + (rows - 1) * colorGapY + 24;
  const totalGridW = groupCols * groupW + (groupCols - 1) * groupGapX;
  const totalGridH = groupRows * groupH + (groupRows - 1) * groupGapY;

  // --- Заголовок и комментарий ---
  const pantoneFontSize = 22;
  const cmykFontSize = 15;
  const cmykTextFontSize = 22;
  let titleHeight = 0;
  let commentHeight = comment ? 20 : 0;
  let titleBlockHeight;
  if (pantoneName) {
    titleHeight = pantoneFontSize + 4 + cmykFontSize;
    titleBlockHeight = titleHeight + (comment ? commentHeight : 0);
  } else {
    titleHeight = cmykTextFontSize;
    titleBlockHeight = titleHeight + (comment ? commentHeight : 0);
  }
  // --- Центрирование по рабочей области ---
  const blockHeight = titleBlockHeight + 80 + totalGridH; // 80 — увеличенный отступ между заголовком и сеткой
  const blockStartY = margin + Math.round((workHeight + blockHeight) / 2);
  let titleY = blockStartY;
  let gridStartY;
  // Центрирование по горизонтали внутри рабочей области
  const gridStartX = margin + Math.round((workWidth - totalGridW) / 2);

  if (pantoneName) {
    const pantoneWidth = helveticaBold.widthOfTextAtSize(pantoneName, pantoneFontSize);
    const cmykText = `C:${baseCmyk.c} M:${baseCmyk.m} Y:${baseCmyk.y} K:${baseCmyk.k}`;
    const cmykWidth = helvetica.widthOfTextAtSize(cmykText, cmykFontSize);
    const pantoneX = margin + (workWidth - pantoneWidth) / 2;
    const cmykX = margin + (workWidth - cmykWidth) / 2;
    page.drawText(pantoneName, { x: pantoneX, y: titleY, size: pantoneFontSize, font: helveticaBold });
    page.drawText(cmykText, { x: cmykX, y: titleY - pantoneFontSize - 4, size: cmykFontSize, font: helvetica });
    gridStartY = titleY - titleHeight - 80;
  } else {
    const cmykText = `CMYK ${baseCmyk.c},${baseCmyk.m},${baseCmyk.y},${baseCmyk.k}`;
    const cmykWidth = helveticaBold.widthOfTextAtSize(cmykText, cmykTextFontSize);
    const cmykX = margin + (workWidth - cmykWidth) / 2;
    page.drawText(cmykText, { x: cmykX, y: titleY, size: cmykTextFontSize, font: helveticaBold });
    gridStartY = titleY - titleHeight - 80;
  }

  // --- Комментарий (по центру, под заголовком) ---
  if (comment) {
    const commentFontSize = 12;
    const commentWidth = helvetica.widthOfTextAtSize(comment, commentFontSize);
    const commentX = margin + (workWidth - commentWidth) / 2;
    const commentY = gridStartY + 40;
    page.drawText('Comment: ' + comment, { x: commentX, y: commentY, size: commentFontSize, font: helvetica });
    gridStartY = commentY - 20;
  }

  // --- Сетка групп ---
  for (let groupIdx = 0; groupIdx < variantGroups.length; groupIdx++) {
    const group = variantGroups[groupIdx];
    const groupCol = groupIdx % groupCols;
    const groupRow = Math.floor(groupIdx / groupCols);
    const groupX = gridStartX + groupCol * (groupW + groupGapX);
    const groupY = gridStartY - groupRow * (groupH + groupGapY);

    for (let i = 0; i < group.length; i++) {
      const v = group[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = groupX + col * (cellW + colorGapX);
      const cy = groupY - row * (cellH + colorGapY);
      page.drawRectangle({
        x: cx, y: cy, width: cellW, height: cellH,
        color: cmyk(v.c / 100, v.m / 100, v.y / 100, v.k / 100),
        borderWidth: 0
      });
      const cStr = v.dc > 0 ? `+${v.dc}` : v.dc < 0 ? `${v.dc}` : '0';
      const mStr = v.dm > 0 ? `+${v.dm}` : v.dm < 0 ? `${v.dm}` : '0';
      const yStr = v.dy > 0 ? `+${v.dy}` : v.dy < 0 ? `${v.dy}` : '0';
      const kStr = v.dk > 0 ? `+${v.dk}` : v.dk < 0 ? `${v.dk}` : '0';
      // Формируем подписи с большим пробелом
      const line1 = `C:${cStr}   M:${mStr}`;
      const line2 = `Y:${yStr}   K:${kStr}`;
      // Центрируем подписи по центру квадрата
      const line1Width = helvetica.widthOfTextAtSize(line1, 8);
      const line2Width = helvetica.widthOfTextAtSize(line2, 8);
      const centerX = cx + cellW / 2;
      page.drawText(line1, {
        x: centerX - line1Width / 2, y: cy - 12, size: 8, color: rgb(0,0,0), font: helvetica
      });
      page.drawText(line2, {
        x: centerX - line2Width / 2, y: cy - 20, size: 8, color: rgb(0,0,0), font: helvetica
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cmyk_variants.pdf';
  a.click();
  URL.revokeObjectURL(url);
} 