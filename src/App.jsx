import { useState } from 'react'
import { generateInvoicePDF, formatIndianCurrency } from './generatePDF.js'

const defaultItems = [
  { description: 'UTL Solar PV Panels (3 kW Capacity)', baseValue: 120000, gstPercent: 5 },
  { description: 'UTL On-Grid Solar Inverter (3 kW)', baseValue: 46000, gstPercent: 5 },
  { description: 'ACDB, DCDB & Mounting Structure', baseValue: 16000, gstPercent: 18 },
  { description: 'Solar Installation & Commissioning Charges', baseValue: 48152.54, gstPercent: 18 },
]

function computeItem(item) {
  const base = parseFloat(item.baseValue) || 0
  const pct = parseFloat(item.gstPercent) || 0
  const gstAmount = parseFloat((base * pct / 100).toFixed(2))
  const total = parseFloat((base + gstAmount).toFixed(2))
  return { ...item, baseValue: base, gstAmount, total }
}

function buildInvoiceData(form, items) {
  const computed = items.map(computeItem)
  const totalTaxableValue = computed.reduce((s, i) => s + i.baseValue, 0)
  const totalGstAmount = computed.reduce((s, i) => s + i.gstAmount, 0)
  const grandTotal = parseFloat((totalTaxableValue + totalGstAmount).toFixed(2))
  return {
    ...form,
    items: computed,
    totalTaxableValue,
    totalGstAmount,
    grandTotal,
    declarations: form.declarations
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean),
  }
}

export default function App() {
  const [form, setForm] = useState({
    companyName: 'RAM RHEEM MOBILE WALE',
    gstin: '09AIHPA5514A3ZU',
    companyMobile: '+91 9839487052',
    companyTagline: 'Authorized Solar Solutions',
    invoiceNo: 'RRMW/SOL/26-27/042',
    invoiceDate: 'June 27, 2026',
    customerName: 'Rakesh Kumar Srivastava',
    customerMobile: '9793481222',
    systemType: '3 kW On-Grid Solar System',
    totalSetBrand: 'UTL Total Set',
    capacity: '3 kW On-Grid',
    scope: 'Supply, Structure & Installation',
    bankName: 'BANK OF MAHARASHTRA',
    accountName: 'RAM RHEEM MOBILE WALE',
    accountNo: '60578692745',
    ifscCode: 'MAHB0001776',
    declarations: '1. Panel & Inverter GST calculated @ 5% as per standard green energy rates.\n2. ACDB/DCDB Electricals, Structures, and Labor calculated @ 18% GST.\n3. All items belong to the UTL Total Set brand ecosystem.',
  })

  const [items, setItems] = useState(defaultItems.map(computeItem))
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function setItemField(index, key, value) {
    setItems(prev => {
      const next = [...prev]
      next[index] = computeItem({ ...next[index], [key]: value })
      return next
    })
  }

  function addItem() {
    setItems(prev => [...prev, computeItem({ description: '', baseValue: 0, gstPercent: 18 })])
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setForm({
      companyName: 'RAM RHEEM MOBILE WALE',
      gstin: '09AIHPA5514A3ZU',
      companyMobile: '+91 9839487052',
      companyTagline: 'Authorized Solar Solutions',
      invoiceNo: 'RRMW/SOL/26-27/042',
      invoiceDate: 'June 27, 2026',
      customerName: 'Rakesh Kumar Srivastava',
      customerMobile: '9793481222',
      systemType: '3 kW On-Grid Solar System',
      totalSetBrand: 'UTL Total Set',
      capacity: '3 kW On-Grid',
      scope: 'Supply, Structure & Installation',
      bankName: 'BANK OF MAHARASHTRA',
      accountName: 'RAM RHEEM MOBILE WALE',
      accountNo: '60578692745',
      ifscCode: 'MAHB0001776',
      declarations: '1. Panel & Inverter GST calculated @ 5% as per standard green energy rates.\n2. ACDB/DCDB Electricals, Structures, and Labor calculated @ 18% GST.\n3. All items belong to the UTL Total Set brand ecosystem.',
    })
    setItems(defaultItems.map(computeItem))
  }

  function handleDownload() {
    setGenerating(true)
    try {
      const data = buildInvoiceData(form, items)
      const doc = generateInvoicePDF(data)
      doc.save(`invoice-${form.invoiceNo.replace(/\//g, '-')}.pdf`)
      showToast('Invoice downloaded successfully!')
    } catch (err) {
      console.error(err)
      showToast('Failed to generate PDF. Please try again.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const computed = items.map(computeItem)
  const totalTaxable = computed.reduce((s, i) => s + i.baseValue, 0)
  const totalGst = computed.reduce((s, i) => s + i.gstAmount, 0)
  const grandTotal = totalTaxable + totalGst

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-badge">
          <span className="dot" />
          Tax Invoice Generator
        </div>
        <h1>Invoice Generator</h1>
        <p>Fill in the details and download a professional PDF invoice instantly.</p>
      </header>

      <div className="main-layout">
        <div>
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div className="glass-card-header">
              <div className="glass-card-header-icon">🏢</div>
              <div>
                <h2>Company Details</h2>
                <p>Your business information</p>
              </div>
            </div>
            <div className="glass-card-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Company Name</label>
                  <input value={form.companyName} onChange={e => setField('companyName', e.target.value)} placeholder="Company name" />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input value={form.gstin} onChange={e => setField('gstin', e.target.value)} placeholder="GSTIN" />
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input value={form.companyMobile} onChange={e => setField('companyMobile', e.target.value)} placeholder="+91 XXXXXXXXXX" />
                </div>
                <div className="form-group full-width">
                  <label>Tagline / Authorized Text</label>
                  <input value={form.companyTagline} onChange={e => setField('companyTagline', e.target.value)} placeholder="e.g. Authorized Solar Solutions" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div className="glass-card-header">
              <div className="glass-card-header-icon">📄</div>
              <div>
                <h2>Invoice Info</h2>
                <p>Invoice number and date</p>
              </div>
            </div>
            <div className="glass-card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Invoice Number</label>
                  <input value={form.invoiceNo} onChange={e => setField('invoiceNo', e.target.value)} placeholder="INV/001" />
                </div>
                <div className="form-group">
                  <label>Invoice Date</label>
                  <input value={form.invoiceDate} onChange={e => setField('invoiceDate', e.target.value)} placeholder="June 27, 2026" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div className="glass-card-header">
              <div className="glass-card-header-icon">👤</div>
              <div>
                <h2>Customer Details</h2>
                <p>Buyer and system information</p>
              </div>
            </div>
            <div className="glass-card-body">
              <div className="form-section">
                <div className="form-section-title"><span className="icon">👤</span> Customer</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input value={form.customerName} onChange={e => setField('customerName', e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input value={form.customerMobile} onChange={e => setField('customerMobile', e.target.value)} placeholder="XXXXXXXXXX" />
                  </div>
                  <div className="form-group full-width">
                    <label>System / Product</label>
                    <input value={form.systemType} onChange={e => setField('systemType', e.target.value)} placeholder="e.g. 3 kW On-Grid Solar System" />
                  </div>
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title"><span className="icon">⚡</span> System Info</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Total Set Brand</label>
                    <input value={form.totalSetBrand} onChange={e => setField('totalSetBrand', e.target.value)} placeholder="e.g. UTL Total Set" />
                  </div>
                  <div className="form-group">
                    <label>Capacity</label>
                    <input value={form.capacity} onChange={e => setField('capacity', e.target.value)} placeholder="e.g. 3 kW On-Grid" />
                  </div>
                  <div className="form-group full-width">
                    <label>Scope</label>
                    <input value={form.scope} onChange={e => setField('scope', e.target.value)} placeholder="e.g. Supply, Structure & Installation" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div className="glass-card-header">
              <div className="glass-card-header-icon">📦</div>
              <div>
                <h2>Line Items</h2>
                <p>Goods and services with pricing</p>
              </div>
            </div>
            <div className="glass-card-body">
              <div className="line-items-section">
                <table className="line-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th>Base Value (₹)</th>
                      <th>GST %</th>
                      <th>GST (₹)</th>
                      <th>Total (₹)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            value={item.description}
                            onChange={e => setItemField(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </td>
                        <td>
                          <input
                            className="number-input"
                            type="number"
                            value={item.baseValue}
                            onChange={e => setItemField(index, 'baseValue', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            className="number-input"
                            type="number"
                            value={item.gstPercent}
                            onChange={e => setItemField(index, 'gstPercent', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <div className="computed-value">{formatIndianCurrency(item.gstAmount)}</div>
                        </td>
                        <td>
                          <div className="computed-value">{formatIndianCurrency(item.total)}</div>
                        </td>
                        <td>
                          <button className="btn-remove" onClick={() => removeItem(index)} title="Remove item">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn-add-row" onClick={addItem}>+ Add line item</button>
              </div>

              <div className="summary-section">
                <div className="summary-row">
                  <span className="label">Total Taxable Value</span>
                  <span className="value">₹{formatIndianCurrency(totalTaxable)}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Total GST Amount</span>
                  <span className="value">₹{formatIndianCurrency(totalGst)}</span>
                </div>
                <div className="summary-row total">
                  <span className="label">Grand Total (Net Cost)</span>
                  <span className="value">₹{formatIndianCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div className="glass-card-header">
              <div className="glass-card-header-icon">🏦</div>
              <div>
                <h2>Bank Details</h2>
                <p>Payment information</p>
              </div>
            </div>
            <div className="glass-card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input value={form.bankName} onChange={e => setField('bankName', e.target.value)} placeholder="Bank name" />
                </div>
                <div className="form-group">
                  <label>Account Name</label>
                  <input value={form.accountName} onChange={e => setField('accountName', e.target.value)} placeholder="Account holder name" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input value={form.accountNo} onChange={e => setField('accountNo', e.target.value)} placeholder="Account number" />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input value={form.ifscCode} onChange={e => setField('ifscCode', e.target.value)} placeholder="IFSC code" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div className="glass-card-header">
              <div className="glass-card-header-icon">📋</div>
              <div>
                <h2>Declarations & Terms</h2>
                <p>One declaration per line</p>
              </div>
            </div>
            <div className="glass-card-body">
              <div className="form-group">
                <label>Terms (one per line)</label>
                <textarea
                  value={form.declarations}
                  onChange={e => setField('declarations', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="actions-bar">
            <button className="btn-secondary" onClick={resetForm}>↺ Reset</button>
            <button className="btn-primary" onClick={handleDownload} disabled={generating}>
              {generating ? <span className="spinner" /> : '⬇'}
              {generating ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="preview-panel">
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <div className="glass-card-header">
              <div className="glass-card-header-icon">👁</div>
              <div>
                <h2>Live Preview</h2>
                <p>Updates as you type</p>
              </div>
            </div>
          </div>
          <div className="preview-container">
            <div className="invoice-preview">
              <div className="invoice-header">
                <div className="invoice-company">
                  <h1>{form.companyName || 'Company Name'}</h1>
                  <p>GSTIN: {form.gstin}</p>
                  <p>Mobile: {form.companyMobile}</p>
                  <p>{form.companyTagline}</p>
                </div>
                <div className="invoice-meta">
                  <div className="tax-invoice-title">TAX INVOICE</div>
                  <p><strong>Date:</strong> {form.invoiceDate}</p>
                  <p><strong>Invoice No:</strong> {form.invoiceNo}</p>
                </div>
              </div>

              <div className="invoice-info-row">
                <div className="invoice-info-box">
                  <div className="invoice-info-box-header">Customer Details</div>
                  <div className="invoice-info-box-body">
                    <p><strong>Customer Name:</strong> {form.customerName}</p>
                    <p><strong>Mobile No:</strong> {form.customerMobile}</p>
                    <p><strong>System:</strong> {form.systemType}</p>
                  </div>
                </div>
                <div className="invoice-info-box">
                  <div className="invoice-info-box-header">System Information</div>
                  <div className="invoice-info-box-body">
                    <p><strong>Total Set Brand:</strong> {form.totalSetBrand}</p>
                    <p><strong>Capacity:</strong> {form.capacity}</p>
                    <p><strong>Scope:</strong> {form.scope}</p>
                  </div>
                </div>
              </div>

              <div className="invoice-price-title">Bifurcated Price Breakdown</div>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description of Goods / Services</th>
                    <th className="text-right">Base Value (₹)</th>
                    <th className="text-right">GST %</th>
                    <th className="text-right">GST (₹)</th>
                    <th className="text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><span className="item-name">{item.description || '—'}</span></td>
                      <td className="text-right">{formatIndianCurrency(item.baseValue)}</td>
                      <td className="text-right">{item.gstPercent}%</td>
                      <td className="text-right">{formatIndianCurrency(item.gstAmount)}</td>
                      <td className="text-right">{formatIndianCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-bottom">
                <div className="bank-details-box">
                  <div className="bank-details-box-header">Bank Details for Payment</div>
                  <div className="bank-details-box-body">
                    {[
                      ['BANK NAME:', form.bankName],
                      ['ACCOUNT NAME:', form.accountName],
                      ['ACCOUNT NO:', form.accountNo],
                      ['IFSC CODE:', form.ifscCode],
                    ].map(([label, value]) => (
                      <div className="bank-row" key={label}>
                        <span className="bank-label">{label}</span>
                        <span className="bank-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="invoice-totals">
                  <table className="invoice-totals-table">
                    <tbody>
                      <tr>
                        <td className="totals-label">Total Taxable Value:</td>
                        <td className="totals-value">₹{formatIndianCurrency(totalTaxable)}</td>
                      </tr>
                      <tr>
                        <td className="totals-label">Total GST Amount:</td>
                        <td className="totals-value">₹{formatIndianCurrency(totalGst)}</td>
                      </tr>
                      <tr className="grand-total">
                        <td>Grand Total (Net Cost):</td>
                        <td style={{ textAlign: 'right' }}>₹{formatIndianCurrency(grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="invoice-declarations">
                <h4>Declarations & Terms:</h4>
                {form.declarations.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <div className="invoice-declarations-bottom">
                  <div />
                  <div className="invoice-signatory">
                    <p className="for-text">For {form.companyName}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="invoice-footer">Thank you for your business!</div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.message}
        </div>
      )}
    </div>
  )
}
