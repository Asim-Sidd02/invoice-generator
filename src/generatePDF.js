import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format a number with Indian-style comma separation
 * e.g. 126000 -> "1,26,000.00"
 */
function formatIndianCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  const fixed = Number(num).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const isNegative = intPart.startsWith('-');
  let digits = isNegative ? intPart.slice(1) : intPart;

  if (digits.length <= 3) {
    return (isNegative ? '-' : '') + digits + '.' + decPart;
  }

  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  return (isNegative ? '-' : '') + formatted + '.' + decPart;
}

/**
 * Make sure there is `needed` mm of vertical room left on the current page
 * before the bottom margin. If not, start a new page and return the new y.
 * This is what keeps the bottom sections (totals, declarations, signature,
 * footer) from silently overflowing past the printable page, which is what
 * was causing the footer band to disappear on some invoices.
 */
function ensureSpace(doc, y, needed, margin, pageHeight) {
  if (y + needed > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

/**
 * Draw the dark blue "Thank you" footer band on every page of the document,
 * flush against the bottom margin. Called once at the very end, after all
 * content (and any page breaks it triggered) has been drawn.
 */
function drawFooterOnAllPages(doc, darkBlue, white) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerHeight = 15;
  const footerBottomMargin = 6; // keep clear of the true page edge so viewers/printers never clip it
  const footerY = pageHeight - footerHeight - footerBottomMargin;
  const totalPages = doc.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFillColor(...darkBlue);
    doc.rect(0, footerY, pageWidth, footerHeight, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...white);
    doc.text('Thank you for your business!', pageWidth / 2, footerY + footerHeight / 2 + 3, { align: 'center' });
  }
}

/**
 * Generate a PDF invoice matching the exact layout from the sample
 */
export function generateInvoicePDF(data) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const darkBlue = [30, 58, 95];     // #1e3a5f
  const slateGray = [110, 130, 150];  // Slate gray for invoice title
  const textDark = [34, 34, 34];
  const textMedium = [85, 85, 85];
  const white = [255, 255, 255];
  const borderGray = [208, 213, 221];
  const rowBg = [248, 249, 250];

  const isTaxInvoice = data.invoiceType === 'tax_invoice';
  const invoiceTitle = isTaxInvoice ? 'TAX INVOICE' : 'QUOTATION';

  // ========== HEADER ==========
  // Company name (left) and Invoice title (right) on the same line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...darkBlue);
  doc.text(data.companyName || 'RAM RHEEM MOBILE WALE', margin, y + 5);

  doc.setFontSize(18);
  doc.setTextColor(...slateGray);
  doc.text(invoiceTitle, pageWidth - margin, y + 5, { align: 'right' });

  y += 11;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(66, 84, 102);
  const addressLines = (data.companyAddress || '').split(',').map(part => part.trim()).filter(Boolean);
  addressLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 4;
  });

  y += 1.5;

  // Company details & Invoice details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMedium);
  doc.text(`GSTIN: ${data.gstin || ''}`, margin, y);

  const dateText = `Date: ${data.invoiceDate || ''}`;
  doc.text(dateText, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text(`Mobile: ${data.companyMobile || ''}`, margin, y);
  const invoiceNoText = `Invoice No: ${data.invoiceNo || ''}`;
  doc.text(invoiceNoText, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text(data.companyTagline || 'Authorized Solar Solutions', margin, y);

  y += 5;

  // Divider line
  doc.setDrawColor(...darkBlue);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ========== INFO BOXES ==========
  const boxWidth = (contentWidth - 6) / 2;
  const boxLeft = margin;
  const boxRight = margin + boxWidth + 6;

  // --- Customer Details Box ---
  // Header
  doc.setFillColor(...darkBlue);
  doc.roundedRect(boxLeft, y, boxWidth, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('CUSTOMER DETAILS', boxLeft + 6, y + 4.2);

  // Body
  const custBodyY = y + 6;
  const custBoxHeight = 24;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.rect(boxLeft, custBodyY, boxWidth, custBoxHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMedium);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Customer Name: ', boxLeft + 6, custBodyY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.customerName || '', boxLeft + 6 + doc.getTextWidth('Customer Name: '), custBodyY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Mobile No: ', boxLeft + 6, custBodyY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.customerMobile || '', boxLeft + 6 + doc.getTextWidth('Mobile No: '), custBodyY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Address: ', boxLeft + 6, custBodyY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.customerAddress || '', boxLeft + 6 + doc.getTextWidth('Address: '), custBodyY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('System: ', boxLeft + 6, custBodyY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.systemType || '', boxLeft + 6 + doc.getTextWidth('System: '), custBodyY + 20);

  // --- System Information Box ---
  doc.setFillColor(...darkBlue);
  doc.roundedRect(boxRight, y, boxWidth, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('SYSTEM INFORMATION', boxRight + 6, y + 4.2);

  const sysBodyY = y + 6;
  doc.setDrawColor(...borderGray);
  doc.rect(boxRight, sysBodyY, boxWidth, custBoxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Total Set Brand: ', boxRight + 6, sysBodyY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.totalSetBrand || '', boxRight + 6 + doc.getTextWidth('Total Set Brand: '), sysBodyY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Capacity: ', boxRight + 6, sysBodyY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.capacity || '', boxRight + 6 + doc.getTextWidth('Capacity: '), sysBodyY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Scope: ', boxRight + 6, sysBodyY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.scope || '', boxRight + 6 + doc.getTextWidth('Scope: '), sysBodyY + 16);

  y = sysBodyY + custBoxHeight + 6;

  // ========== BIFURCATED PRICE BREAKDOWN ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkBlue);
  doc.text('BIFURCATED PRICE BREAKDOWN', margin, y);
  if (isTaxInvoice) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMedium);
    doc.text('(All amounts in Rs.)', pageWidth - margin, y, { align: 'right' });
  }
  y += 4.5;

  let tableColumns;
  let tableRows;
  let columnStyles;

  if (isTaxInvoice) {
    tableColumns = [
      { header: '#', dataKey: 'num' },
      { header: 'ITEM', dataKey: 'description' },
      { header: 'HSN/SAC', dataKey: 'hsnSac' },
      { header: 'QTY', dataKey: 'quantity' },
      { header: 'PRICE', dataKey: 'unitPrice' },
      { header: 'CGST', dataKey: 'cgst' },
      { header: 'SGST', dataKey: 'sgst' },
      { header: 'TOTAL', dataKey: 'total' },
    ];
    tableRows = data.items.map((item, index) => ({
      num: String(index + 1),
      description: item.description || '',
      hsnSac: item.hsnSac || '',
      quantity: String(item.quantity ?? ''),
      unitPrice: formatIndianCurrency(item.unitPrice),
      cgst: `${formatIndianCurrency(item.cgstAmount)}\n(${item.cgstPercent}%)`,
      sgst: `${formatIndianCurrency(item.sgstAmount)}\n(${item.sgstPercent}%)`,
      total: formatIndianCurrency(item.total),
    }));
    columnStyles = {
      num: { halign: 'center', cellWidth: 8 },
      description: { cellWidth: 'auto', fontStyle: 'bold' },
      hsnSac: { halign: 'center', cellWidth: 20 },
      quantity: { halign: 'center', cellWidth: 14 },
      unitPrice: { halign: 'right', cellWidth: 26 },
      cgst: { halign: 'right', cellWidth: 20 },
      sgst: { halign: 'right', cellWidth: 20 },
      total: { halign: 'right', cellWidth: 28 },
    };
  } else {
    tableColumns = [
      { header: '#', dataKey: 'num' },
      { header: 'DESCRIPTION OF GOODS / SERVICES', dataKey: 'description' },
      { header: 'BASE VALUE (Rs.)', dataKey: 'baseValue' },
      { header: 'GST %', dataKey: 'gstPercent' },
      { header: 'GST (Rs.)', dataKey: 'gstAmount' },
      { header: 'TOTAL (Rs.)', dataKey: 'total' },
    ];
    tableRows = data.items.map((item, index) => ({
      num: String(index + 1),
      description: item.description || '',
      baseValue: formatIndianCurrency(item.baseValue),
      gstPercent: item.gstPercent ? `${item.gstPercent}%` : '',
      gstAmount: formatIndianCurrency(item.gstAmount),
      total: formatIndianCurrency(item.total),
    }));
    columnStyles = {
      num: { halign: 'center', cellWidth: 10 },
      description: { cellWidth: 'auto', fontStyle: 'bold' },
      baseValue: { halign: 'right', cellWidth: 28 },
      gstPercent: { halign: 'center', cellWidth: 18 },
      gstAmount: { halign: 'right', cellWidth: 24 },
      total: { halign: 'right', cellWidth: 28 },
    };
  }

  const rightAlignedKeys = isTaxInvoice
    ? ['unitPrice', 'cgst', 'sgst', 'total']
    : ['baseValue', 'gstPercent', 'gstAmount', 'total'];
  const centeredKeys = isTaxInvoice ? ['hsnSac', 'quantity'] : ['gstPercent'];

  autoTable(doc, {
    startY: y,
    columns: tableColumns,
    body: tableRows,
    theme: 'plain',
    margin: { left: margin, right: margin, bottom: 20 },
    styles: {
      font: 'helvetica',
      fontSize: isTaxInvoice ? 7.2 : 8.5,
      cellPadding: isTaxInvoice ? { top: 1.8, bottom: 1.8, left: 3, right: 3 } : { top: 2.2, bottom: 2.2, left: 4, right: 4 },
      lineColor: [230, 230, 230],
      lineWidth: 0.3,
      textColor: textDark,
      valign: 'middle',
    },
    headStyles: {
      fillColor: darkBlue,
      textColor: white,
      fontStyle: 'bold',
      fontSize: isTaxInvoice ? 6.8 : 8,
      cellPadding: isTaxInvoice ? { top: 1.8, bottom: 1.8, left: 3, right: 3 } : { top: 2.2, bottom: 2.2, left: 4, right: 4 },
      halign: 'left',
      valign: 'middle',
      minCellHeight: 0,
    },
    columnStyles,
    alternateRowStyles: {
      fillColor: rowBg,
    },
    didParseCell: function (hookData) {
      if (hookData.section === 'head') {
        if (rightAlignedKeys.includes(hookData.column.dataKey)) {
          hookData.cell.styles.halign = centeredKeys.includes(hookData.column.dataKey) ? 'center' : 'right';
        }
      }
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  // ========== BOTTOM SECTION: Bank Details + Totals ==========
  const bottomSectionHeight = 32;
  y = ensureSpace(doc, y, bottomSectionHeight, margin, pageHeight);
  const bottomY = y;

  let bankBodyY = bottomY;

  // --- Bank Details Box (left) ---
  const bankBoxWidth = boxWidth;

  doc.setFillColor(...darkBlue);
  doc.roundedRect(margin, bottomY, bankBoxWidth, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('BANK DETAILS FOR PAYMENT', margin + 6, bottomY + 4.2);

  bankBodyY = bottomY + 6;
  doc.setDrawColor(...borderGray);
  doc.rect(margin, bankBodyY, bankBoxWidth, 24);

  const bankLabels = [
    ['BANK NAME:', data.bankName || ''],
    ['ACCOUNT NAME:', data.accountName || ''],
    ['ACCOUNT NO:', data.accountNo || ''],
    ['IFSC CODE:', data.ifscCode || ''],
  ];

  doc.setFontSize(7.5);
  bankLabels.forEach((row, idx) => {
    const rowY = bankBodyY + 4.5 + idx * 5.0;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(row[0], margin + 6, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMedium);
    doc.text(row[1], margin + 36, rowY);
  });

  // --- Totals (right) ---
  const totalsX = boxRight;
  const totalsWidth = boxWidth;

  // Total Taxable Value
  let tY = bottomY + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMedium);
  doc.text('Total Taxable Value:', totalsX, tY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`Rs. ${formatIndianCurrency(data.totalTaxableValue)}`, totalsX + totalsWidth, tY, { align: 'right' });

  // Divider
  tY += 2.5;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.2);
  doc.line(totalsX, tY, totalsX + totalsWidth, tY);

  if (isTaxInvoice) {
    // Total CGST
    tY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMedium);
    doc.text('Total CGST:', totalsX, tY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(`Rs. ${formatIndianCurrency(data.totalCgstAmount)}`, totalsX + totalsWidth, tY, { align: 'right' });

    tY += 2.5;
    doc.line(totalsX, tY, totalsX + totalsWidth, tY);

    // Total SGST
    tY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMedium);
    doc.text('Total SGST:', totalsX, tY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(`Rs. ${formatIndianCurrency(data.totalSgstAmount)}`, totalsX + totalsWidth, tY, { align: 'right' });

    tY += 2.5;
    doc.line(totalsX, tY, totalsX + totalsWidth, tY);
  } else {
    // Total GST Amount
    tY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMedium);
    doc.text('Total GST Amount:', totalsX, tY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(`Rs. ${formatIndianCurrency(data.totalGstAmount)}`, totalsX + totalsWidth, tY, { align: 'right' });

    tY += 2.5;
    doc.line(totalsX, tY, totalsX + totalsWidth, tY);
  }

  // Grand Total
  tY += 2.5;
  doc.setFillColor(...darkBlue);
  doc.roundedRect(totalsX, tY, totalsWidth, 8.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...white);
  doc.text('Grand Total (Net Cost):', totalsX + 5, tY + 6);
  doc.text(`Rs. ${formatIndianCurrency(data.grandTotal)}`, totalsX + totalsWidth - 5, tY + 6, { align: 'right' });

  y = Math.max(bankBodyY + 24, tY + 8.5) + 6;

  // ========== DECLARATIONS ==========
  const declarations = data.declarations || [
    '1. Panel & Inverter GST calculated @ 5% as per standard green energy rates.',
    '2. ACDB/DCDB Electricals, Structures, and Labor calculated @ 18% GST.',
    '3. All items belong to the UTL Total Set brand ecosystem.',
  ];

  const declarationsHeight = 4 + 3 + declarations.length * 3 + 3;
  y = ensureSpace(doc, y, declarationsHeight, margin, pageHeight);

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text('Declarations & Terms:', margin, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMedium);

  declarations.forEach((decl) => {
    doc.text(decl, margin, y);
    y += 3.0;
  });

  y += 4;

  // ========== SIGNATORY ==========
  const footerReserve = 15 + 6; // footerHeight + footerBottomMargin = 21
  const signatoryHeight = 17; // 4 + 10 + 3
  const targetSignatoryY = pageHeight - footerReserve - signatoryHeight; // 297 - 21 - 17 = 259

  if (y > targetSignatoryY) {
    doc.addPage();
  }
  
  y = targetSignatoryY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkBlue);
  doc.text(`For ${data.companyName || 'RAM RHEEM MOBILE WALE'}`, pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.setDrawColor(...textMedium);
  doc.setLineWidth(0.2);

  // Proprietor signature line (left)
  doc.line(margin, y, margin + 40, y);
  // Authorized Signature line (right)
  doc.line(pageWidth - margin - 45, y, pageWidth - margin, y);

  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text('Proprietor', margin + 20, y, { align: 'center' });
  doc.text('Authorized Signature', pageWidth - margin - 22.5, y, { align: 'center' });

  // ========== FOOTER ==========
  drawFooterOnAllPages(doc, darkBlue, white);

  return doc;
}

export { formatIndianCurrency };
