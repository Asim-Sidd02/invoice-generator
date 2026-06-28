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
 * Generate a PDF invoice matching the exact layout from the sample
 */
export function generateInvoicePDF(data) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const darkBlue = [30, 58, 95];     // #1e3a5f
  const textDark = [34, 34, 34];
  const textMedium = [85, 85, 85];
  const white = [255, 255, 255];
  const borderGray = [208, 213, 221];
  const rowBg = [248, 249, 250];

  // ========== HEADER ==========
  // Company name (left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...textDark);
  doc.text(data.companyName || 'RAM RHEEM MOBILE WALE', margin, y + 6);

  // TAX INVOICE (right)
  doc.setFontSize(18);
  doc.setTextColor(...darkBlue);
  doc.text('TAX INVOICE', pageWidth - margin, y + 6, { align: 'right' });

  y += 12;

  // Company details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMedium);
  doc.text(`GSTIN: ${data.gstin || ''}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMedium);
  const dateText = `Date: ${data.invoiceDate || ''}`;
  doc.text(dateText, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text(`Mobile: ${data.companyMobile || ''}`, margin, y);
  const invoiceNoText = `Invoice No: ${data.invoiceNo || ''}`;
  doc.text(invoiceNoText, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.text(data.companyTagline || 'Authorized Solar Solutions', margin, y);

  y += 6;

  // Divider line
  doc.setDrawColor(...darkBlue);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ========== INFO BOXES ==========
  const boxWidth = (contentWidth - 6) / 2;
  const boxLeft = margin;
  const boxRight = margin + boxWidth + 6;

  // --- Customer Details Box ---
  // Header
  doc.setFillColor(...darkBlue);
  doc.roundedRect(boxLeft, y, boxWidth, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('CUSTOMER DETAILS', boxLeft + 6, y + 5);

  // Body
  const custBodyY = y + 7;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.rect(boxLeft, custBodyY, boxWidth, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMedium);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Customer Name: ', boxLeft + 6, custBodyY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.customerName || '', boxLeft + 6 + doc.getTextWidth('Customer Name: '), custBodyY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Mobile No: ', boxLeft + 6, custBodyY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.customerMobile || '', boxLeft + 6 + doc.getTextWidth('Mobile No: '), custBodyY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('System: ', boxLeft + 6, custBodyY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.systemType || '', boxLeft + 6 + doc.getTextWidth('System: '), custBodyY + 18);

  // --- System Information Box ---
  doc.setFillColor(...darkBlue);
  doc.roundedRect(boxRight, y, boxWidth, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('SYSTEM INFORMATION', boxRight + 6, y + 5);

  const sysBodyY = y + 7;
  doc.setDrawColor(...borderGray);
  doc.rect(boxRight, sysBodyY, boxWidth, 22);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Total Set Brand: ', boxRight + 6, sysBodyY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.totalSetBrand || '', boxRight + 6 + doc.getTextWidth('Total Set Brand: '), sysBodyY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Capacity: ', boxRight + 6, sysBodyY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.capacity || '', boxRight + 6 + doc.getTextWidth('Capacity: '), sysBodyY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Scope: ', boxRight + 6, sysBodyY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text(data.scope || '', boxRight + 6 + doc.getTextWidth('Scope: '), sysBodyY + 18);

  y = sysBodyY + 22 + 8;

  // ========== BIFURCATED PRICE BREAKDOWN ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkBlue);
  doc.text('BIFURCATED PRICE BREAKDOWN', margin, y);
  y += 5;

  // Table
  const tableColumns = [
    { header: '#', dataKey: 'num' },
    { header: 'DESCRIPTION OF GOODS / SERVICES', dataKey: 'description' },
    { header: 'BASE VALUE (₹)', dataKey: 'baseValue' },
    { header: 'GST %', dataKey: 'gstPercent' },
    { header: 'GST (₹)', dataKey: 'gstAmount' },
    { header: 'TOTAL (₹)', dataKey: 'total' },
  ];

  const tableRows = data.items.map((item, index) => ({
    num: String(index + 1),
    description: item.description || '',
    baseValue: formatIndianCurrency(item.baseValue),
    gstPercent: item.gstPercent ? `${item.gstPercent}%` : '',
    gstAmount: formatIndianCurrency(item.gstAmount),
    total: formatIndianCurrency(item.total),
  }));

  autoTable(doc, {
    startY: y,
    columns: tableColumns,
    body: tableRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      lineColor: [230, 230, 230],
      lineWidth: 0.3,
      textColor: textDark,
    },
    headStyles: {
      fillColor: darkBlue,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      halign: 'left',
    },
    columnStyles: {
      num: { halign: 'center', cellWidth: 10 },
      description: { cellWidth: 'auto', fontStyle: 'bold' },
      baseValue: { halign: 'right', cellWidth: 28 },
      gstPercent: { halign: 'center', cellWidth: 18 },
      gstAmount: { halign: 'right', cellWidth: 24 },
      total: { halign: 'right', cellWidth: 28 },
    },
    alternateRowStyles: {
      fillColor: rowBg,
    },
    didParseCell: function (hookData) {
      if (hookData.section === 'head') {
        if (['baseValue', 'gstPercent', 'gstAmount', 'total'].includes(hookData.column.dataKey)) {
          hookData.cell.styles.halign = hookData.column.dataKey === 'gstPercent' ? 'center' : 'right';
        }
      }
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ========== BOTTOM SECTION: Bank Details + Totals ==========
  const bottomY = y;

  // --- Bank Details Box (left) ---
  const bankBoxWidth = boxWidth;

  doc.setFillColor(...darkBlue);
  doc.roundedRect(margin, bottomY, bankBoxWidth, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('BANK DETAILS FOR PAYMENT', margin + 6, bottomY + 5);

  const bankBodyY = bottomY + 7;
  doc.setDrawColor(...borderGray);
  doc.rect(margin, bankBodyY, bankBoxWidth, 30);

  const bankLabels = [
    ['BANK NAME:', data.bankName || ''],
    ['ACCOUNT NAME:', data.accountName || ''],
    ['ACCOUNT NO:', data.accountNo || ''],
    ['IFSC CODE:', data.ifscCode || ''],
  ];

  doc.setFontSize(8.5);
  bankLabels.forEach((row, idx) => {
    const rowY = bankBodyY + 6 + idx * 6.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(row[0], margin + 6, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMedium);
    doc.text(row[1], margin + 42, rowY);
  });

  // --- Totals (right) ---
  const totalsX = boxRight;
  const totalsWidth = boxWidth;

  // Total Taxable Value
  let tY = bottomY + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMedium);
  doc.text('Total Taxable Value:', totalsX, tY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`₹${formatIndianCurrency(data.totalTaxableValue)}`, totalsX + totalsWidth, tY, { align: 'right' });

  // Divider
  tY += 3;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.2);
  doc.line(totalsX, tY, totalsX + totalsWidth, tY);

  // Total GST Amount
  tY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMedium);
  doc.text('Total GST Amount:', totalsX, tY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`₹${formatIndianCurrency(data.totalGstAmount)}`, totalsX + totalsWidth, tY, { align: 'right' });

  // Divider
  tY += 3;
  doc.line(totalsX, tY, totalsX + totalsWidth, tY);

  // Grand Total
  tY += 3;
  doc.setFillColor(...darkBlue);
  doc.roundedRect(totalsX, tY, totalsWidth, 10, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...white);
  doc.text('Grand Total (Net Cost):', totalsX + 6, tY + 7);
  doc.text(`₹${formatIndianCurrency(data.grandTotal)}`, totalsX + totalsWidth - 6, tY + 7, { align: 'right' });

  y = Math.max(bankBodyY + 30, tY + 10) + 10;

  // ========== DECLARATIONS ==========
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Declarations & Terms:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMedium);

  const declarations = data.declarations || [
    '1. Panel & Inverter GST calculated @ 5% as per standard green energy rates.',
    '2. ACDB/DCDB Electricals, Structures, and Labor calculated @ 18% GST.',
    '3. All items belong to the UTL Total Set brand ecosystem.',
  ];

  declarations.forEach((decl) => {
    doc.text(decl, margin, y);
    y += 3.5;
  });

  y += 8;

  // Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkBlue);
  doc.text(`For ${data.companyName || 'RAM RHEEM MOBILE WALE'}`, pageWidth - margin, y, { align: 'right' });

  // ========== FOOTER ==========
  const footerY = 282;
  doc.setFillColor(...darkBlue);
  doc.rect(0, footerY, pageWidth, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...white);
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 9, { align: 'center' });

  return doc;
}

export { formatIndianCurrency };
