/**
 * DC Media - Minimalist Quotation & Invoice Studio
 * Delivery Timeline Integration Edition
 */

(function () {
  'use strict';

  const SSL_PAYMENT_URL = 'https://invoice.sslcommerz.com/invoice-form?refer=6735D0BBEEC26';

  // --- Initial Default State ---
  const state = {
    type: 'quotation', // 'quotation' | 'invoice'
    docNumber: 'QT-2026-001',
    currency: '৳',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: getFutureDate(14),
    deliveryTime: '5-7 Working Days',
    status: 'SENT',
    
    sender: {
      name: 'DC Media',
      details: 'Dhaka, Bangladesh\nEmail: contact@dcmedia.com\nPhone: +880 1700-000000',
      logo: ''
    },
    
    client: {
      name: 'Grameenphone Ltd',
      details: 'Attn: Marketing & Brand Division\nGP House, Bashundhara, Dhaka 1229\nEmail: procurement@grameenphone.com'
    },
    
    items: [
      { id: 1, description: 'Media & Production Service', qty: 1, price: 50000 }
    ],

    taxRate: 0,
    discountRate: 0,
    shippingFee: 0,

    // Bank & Mobile Transfer Info
    paymentDetails: 'Bank: Dutch-Bangla Bank Ltd (DBBL)\nAccount: 123-456-7890 (DC Media)\nbKash / Nagad: +880 1700-000000',
    notes: 'Thank you for choosing DC Media! We deliver high-impact creative solutions.',
    signature: ''
  };

  // Temporary raw uploaded signature image object for studio extraction
  let loadedRawSignatureImg = null;
  let currentExtractedDataUrl = '';

  // Storage Keys
  const HISTORY_STORAGE_KEY = 'dc_media_history_v12';
  const SENDER_DEFAULTS_KEY = 'dc_media_sender_defaults_v12';

  // --- DOM Element References ---
  const els = {
    // Mode switcher
    btnModeQuotation: document.getElementById('btnModeQuotation'),
    btnModeInvoice: document.getElementById('btnModeInvoice'),
    convertBtnText: document.getElementById('convertBtnText'),
    btnConvert: document.getElementById('btnConvert'),

    // Top actions
    btnLoadDemo: document.getElementById('btnLoadDemo'),
    btnSaveDoc: document.getElementById('btnSaveDoc'),
    btnPrint: document.getElementById('btnPrint'),
    btnToggleHistory: document.getElementById('btnToggleHistory'),
    historyCount: document.getElementById('historyCount'),
    btnSaveBusinessDefaults: document.getElementById('btnSaveBusinessDefaults'),

    // Inputs
    docNumber: document.getElementById('docNumber'),
    docCurrency: document.getElementById('docCurrency'),
    issueDate: document.getElementById('issueDate'),
    dueDate: document.getElementById('dueDate'),
    lblDueDate: document.getElementById('lblDueDate'),
    deliveryTime: document.getElementById('deliveryTime'),
    docStatus: document.getElementById('docStatus'),

    senderName: document.getElementById('senderName'),
    senderDetails: document.getElementById('senderDetails'),
    companyLogo: document.getElementById('companyLogo'),

    clientName: document.getElementById('clientName'),
    clientDetails: document.getElementById('clientDetails'),

    itemsEditorBody: document.getElementById('itemsEditorBody'),
    btnAddItem: document.getElementById('btnAddItem'),

    taxRate: document.getElementById('taxRate'),
    discountRate: document.getElementById('discountRate'),
    shippingFee: document.getElementById('shippingFee'),

    paymentDetails: document.getElementById('paymentDetails'),
    notes: document.getElementById('notes'),

    // Signature
    signatureFileInput: document.getElementById('signatureFileInput'),
    btnOpenSignatureModal: document.getElementById('btnOpenSignatureModal'),
    signatureModal: document.getElementById('signatureModal'),
    btnCloseSignatureModal: document.getElementById('btnCloseSignatureModal'),
    signatureCanvas: document.getElementById('signatureCanvas'),
    btnClearCanvas: document.getElementById('btnClearCanvas'),
    btnApplySignature: document.getElementById('btnApplySignature'),
    signaturePreviewContainer: document.getElementById('signaturePreviewContainer'),
    signatureImage: document.getElementById('signatureImage'),
    btnReExtractSignature: document.getElementById('btnReExtractSignature'),
    btnClearSignature: document.getElementById('btnClearSignature'),

    // Signature Extractor Studio Modal
    signatureExtractModal: document.getElementById('signatureExtractModal'),
    btnCloseExtractModal: document.getElementById('btnCloseExtractModal'),
    rawSignatureImg: document.getElementById('rawSignatureImg'),
    extractedSignaturePreview: document.getElementById('extractedSignaturePreview'),
    thresholdRange: document.getElementById('thresholdRange'),
    thresholdVal: document.getElementById('thresholdVal'),
    chkEnhanceInk: document.getElementById('chkEnhanceInk'),
    chkAutoCrop: document.getElementById('chkAutoCrop'),
    btnResetExtractor: document.getElementById('btnResetExtractor'),
    btnApplyExtractedSignature: document.getElementById('btnApplyExtractedSignature'),

    // Preview Pane Elements
    statusStamp: document.getElementById('statusStamp'),
    docLogoView: document.getElementById('docLogoView'),
    docSenderName: document.getElementById('docSenderName'),
    docSenderDetails: document.getElementById('docSenderDetails'),
    docTypeBadge: document.getElementById('docTypeBadge'),
    docNumberView: document.getElementById('docNumberView'),
    docIssueDateView: document.getElementById('docIssueDateView'),
    docDueDateLabel: document.getElementById('docDueDateLabel'),
    docDueDateView: document.getElementById('docDueDateView'),
    docDeliveryRow: document.getElementById('docDeliveryRow'),
    docDeliveryView: document.getElementById('docDeliveryView'),

    docClientName: document.getElementById('docClientName'),
    docClientDetails: document.getElementById('docClientDetails'),
    docPreparedByName: document.getElementById('docPreparedByName'),
    docPreparedByDetails: document.getElementById('docPreparedByDetails'),

    docTableBody: document.getElementById('docTableBody'),
    
    docSubtotalView: document.getElementById('docSubtotalView'),
    docDiscountRow: document.getElementById('docDiscountRow'),
    docDiscountRateView: document.getElementById('docDiscountRateView'),
    docDiscountAmtView: document.getElementById('docDiscountAmtView'),

    docTaxRow: document.getElementById('docTaxRow'),
    docTaxRateView: document.getElementById('docTaxRateView'),
    docTaxAmtView: document.getElementById('docTaxAmtView'),

    docShippingRow: document.getElementById('docShippingRow'),
    docShippingAmtView: document.getElementById('docShippingAmtView'),

    docTotalLabel: document.getElementById('docTotalLabel'),
    docGrandTotalView: document.getElementById('docGrandTotalView'),

    paymentMethodsGrid: document.getElementById('paymentMethodsGrid'),
    docNotesTermsView: document.getElementById('docNotesTermsView'),
    docSignatureView: document.getElementById('docSignatureView'),

    // History Drawer
    historyDrawer: document.getElementById('historyDrawer'),
    btnCloseHistory: document.getElementById('btnCloseHistory'),
    historyList: document.getElementById('historyList')
  };

  // Signature Canvas Drawing Variables
  let isDrawing = false;
  let canvasCtx = null;

  // --- Helper Functions ---
  function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  function formatMoney(amount, currency) {
    return `${currency}${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Auto-expand textarea to fit content without scrollbars
  function autoExpandTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.max(el.scrollHeight + 4, 75);
    el.style.height = newHeight + 'px';
  }

  function autoExpandAllTextareas() {
    [els.senderDetails, els.clientDetails, els.paymentDetails, els.notes].forEach(textarea => {
      autoExpandTextarea(textarea);
    });
  }

  // --- Initialize Application ---
  function init() {
    loadSavedSenderDefaults();
    bindEvents();
    initSignatureCanvas();
    populateFormFields();
    updateHistoryCount();
    render();
    setTimeout(autoExpandAllTextareas, 50);
  }

  // --- Load Saved Sender Defaults ---
  function loadSavedSenderDefaults() {
    try {
      const saved = localStorage.getItem(SENDER_DEFAULTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.sender = { ...state.sender, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load sender defaults', e);
    }
  }

  // --- Bind Inputs & Actions ---
  function bindEvents() {
    // Mode Switcher
    els.btnModeQuotation.addEventListener('click', () => setMode('quotation'));
    els.btnModeInvoice.addEventListener('click', () => setMode('invoice'));

    // Convert Quotation <-> Invoice Button
    els.btnConvert.addEventListener('click', convertDocumentType);

    // General Inputs Binding
    els.docNumber.addEventListener('input', (e) => { state.docNumber = e.target.value; render(); });
    els.docCurrency.addEventListener('change', (e) => { state.currency = e.target.value; render(); });
    els.issueDate.addEventListener('change', (e) => { state.issueDate = e.target.value; render(); });
    els.dueDate.addEventListener('change', (e) => { state.dueDate = e.target.value; render(); });
    els.deliveryTime.addEventListener('input', (e) => { state.deliveryTime = e.target.value; render(); });
    els.docStatus.addEventListener('change', (e) => { state.status = e.target.value; render(); });

    els.senderName.addEventListener('input', (e) => { state.sender.name = e.target.value; render(); });
    
    // Auto-expanding textareas binding
    els.senderDetails.addEventListener('input', (e) => { 
      state.sender.details = e.target.value; 
      autoExpandTextarea(e.target);
      render(); 
    });

    els.clientName.addEventListener('input', (e) => { state.client.name = e.target.value; render(); });
    
    els.clientDetails.addEventListener('input', (e) => { 
      state.client.details = e.target.value; 
      autoExpandTextarea(e.target);
      render(); 
    });

    els.taxRate.addEventListener('input', (e) => { state.taxRate = parseFloat(e.target.value) || 0; render(); });
    els.discountRate.addEventListener('input', (e) => { state.discountRate = parseFloat(e.target.value) || 0; render(); });
    els.shippingFee.addEventListener('input', (e) => { state.shippingFee = parseFloat(e.target.value) || 0; render(); });

    els.paymentDetails.addEventListener('input', (e) => { 
      state.paymentDetails = e.target.value; 
      autoExpandTextarea(e.target);
      render(); 
    });
    
    els.notes.addEventListener('input', (e) => { 
      state.notes = e.target.value; 
      autoExpandTextarea(e.target);
      render(); 
    });

    // Logo Upload
    els.companyLogo.addEventListener('change', handleLogoUpload);

    // Signature File Upload with Interactive Extractor Studio
    els.signatureFileInput.addEventListener('change', handleSignatureUpload);

    // Signature Studio Modal Controls
    els.btnCloseExtractModal.addEventListener('click', () => els.signatureExtractModal.classList.remove('active'));
    els.thresholdRange.addEventListener('input', (e) => {
      els.thresholdVal.textContent = e.target.value;
      updateLiveExtractionPreview();
    });
    els.chkEnhanceInk.addEventListener('change', updateLiveExtractionPreview);
    els.chkAutoCrop.addEventListener('change', updateLiveExtractionPreview);
    els.btnResetExtractor.addEventListener('click', () => {
      els.thresholdRange.value = 165;
      els.thresholdVal.textContent = '165';
      els.chkEnhanceInk.checked = true;
      els.chkAutoCrop.checked = true;
      updateLiveExtractionPreview();
    });
    els.btnApplyExtractedSignature.addEventListener('click', () => {
      if (currentExtractedDataUrl) {
        state.signature = currentExtractedDataUrl;
        els.signatureExtractModal.classList.remove('active');
        render();
      }
    });

    if (els.btnReExtractSignature) {
      els.btnReExtractSignature.addEventListener('click', () => {
        if (loadedRawSignatureImg) {
          els.signatureExtractModal.classList.add('active');
          updateLiveExtractionPreview();
        } else {
          alert('Upload a signature image first!');
        }
      });
    }

    // Add Item Row
    els.btnAddItem.addEventListener('click', () => {
      const newId = Date.now();
      state.items.push({ id: newId, description: '', qty: 1, price: 0 });
      renderItemsEditor();
      render();
    });

    // Quick Action Buttons
    els.btnLoadDemo.addEventListener('click', loadDemoData);
    els.btnSaveBusinessDefaults.addEventListener('click', saveSenderDefaults);
    els.btnSaveDoc.addEventListener('click', saveCurrentDocumentToHistory);
    els.btnPrint.addEventListener('click', () => window.print());

    // History Drawer
    els.btnToggleHistory.addEventListener('click', toggleHistoryDrawer);
    els.btnCloseHistory.addEventListener('click', toggleHistoryDrawer);

    // Signature Modal
    els.btnOpenSignatureModal.addEventListener('click', () => els.signatureModal.classList.add('active'));
    els.btnCloseSignatureModal.addEventListener('click', () => els.signatureModal.classList.remove('active'));
    els.btnClearCanvas.addEventListener('click', clearSignatureCanvas);
    els.btnApplySignature.addEventListener('click', applySignature);
    els.btnClearSignature.addEventListener('click', removeSignature);
  }

  // --- Document Mode Setter ---
  function setMode(mode) {
    state.type = mode;
    if (mode === 'quotation') {
      els.btnModeQuotation.classList.add('active');
      els.btnModeInvoice.classList.remove('active');
      els.convertBtnText.textContent = 'Convert to Invoice';
    } else {
      els.btnModeInvoice.classList.add('active');
      els.btnModeQuotation.classList.remove('active');
      els.convertBtnText.textContent = 'Convert to Quotation';
    }
    render();
  }

  // --- 1-Click Convert Document Type ---
  function convertDocumentType() {
    if (state.type === 'quotation') {
      state.type = 'invoice';
      state.docNumber = state.docNumber.replace(/^QT-/i, 'INV-');
      if (!state.docNumber.startsWith('INV-')) {
        state.docNumber = 'INV-' + state.docNumber;
      }
      state.status = 'PENDING';
      state.dueDate = getFutureDate(14);
      els.btnModeInvoice.classList.add('active');
      els.btnModeQuotation.classList.remove('active');
      els.convertBtnText.textContent = 'Convert to Quotation';
    } else {
      state.type = 'quotation';
      state.docNumber = state.docNumber.replace(/^INV-/i, 'QT-');
      if (!state.docNumber.startsWith('QT-')) {
        state.docNumber = 'QT-' + state.docNumber;
      }
      state.status = 'SENT';
      state.dueDate = getFutureDate(14);
      els.btnModeQuotation.classList.add('active');
      els.btnModeInvoice.classList.remove('active');
      els.convertBtnText.textContent = 'Convert to Invoice';
    }
    populateFormFields();
    render();
  }

  // --- Populate Inputs from State ---
  function populateFormFields() {
    els.docNumber.value = state.docNumber;
    els.docCurrency.value = state.currency;
    els.issueDate.value = state.issueDate;
    els.dueDate.value = state.dueDate;
    els.deliveryTime.value = state.deliveryTime || '';
    els.docStatus.value = state.status;

    els.senderName.value = state.sender.name;
    els.senderDetails.value = state.sender.details;

    els.clientName.value = state.client.name;
    els.clientDetails.value = state.client.details;

    els.taxRate.value = state.taxRate;
    els.discountRate.value = state.discountRate;
    els.shippingFee.value = state.shippingFee;

    els.paymentDetails.value = state.paymentDetails;
    els.notes.value = state.notes;

    renderItemsEditor();
    setTimeout(autoExpandAllTextareas, 20);
  }

  // --- Render Editor Line Items Table ---
  function renderItemsEditor() {
    els.itemsEditorBody.innerHTML = '';
    state.items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'item-row';
      tr.innerHTML = `
        <td>
          <input type="text" class="form-control item-desc" data-idx="${idx}" placeholder="e.g. Video Editing Service" value="${escapeHtml(item.description)}">
        </td>
        <td>
          <input type="number" class="form-control item-qty" data-idx="${idx}" value="${item.qty}" min="1" step="1">
        </td>
        <td>
          <input type="number" class="form-control item-price" data-idx="${idx}" value="${item.price}" min="0" step="1">
        </td>
        <td style="text-align: center;">
          <button class="btn-remove-item" data-idx="${idx}" title="Delete item">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </td>
      `;
      els.itemsEditorBody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();

    // Bind event listeners to line item inputs
    const descInputs = els.itemsEditorBody.querySelectorAll('.item-desc');
    const qtyInputs = els.itemsEditorBody.querySelectorAll('.item-qty');
    const priceInputs = els.itemsEditorBody.querySelectorAll('.item-price');
    const removeBtns = els.itemsEditorBody.querySelectorAll('.btn-remove-item');

    descInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        state.items[idx].description = e.target.value;
        render();
      });
    });

    qtyInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        state.items[idx].qty = parseFloat(e.target.value) || 0;
        render();
      });
    });

    priceInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        state.items[idx].price = parseFloat(e.target.value) || 0;
        render();
      });
    });

    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = btn.getAttribute('data-idx');
        if (state.items.length <= 1) {
          state.items[0] = { id: Date.now(), description: '', qty: 1, price: 0 };
        } else {
          state.items.splice(idx, 1);
        }
        renderItemsEditor();
        render();
      });
    });
  }

  // --- Main Render Function (Live Preview Sync) ---
  function render() {
    const isQuotation = state.type === 'quotation';

    // Type Badge & Header Titles
    els.docTypeBadge.textContent = isQuotation ? 'QUOTATION' : 'INVOICE';
    els.lblDueDate.textContent = isQuotation ? 'Valid Until Date' : 'Due Date';
    els.docDueDateLabel.textContent = isQuotation ? 'Valid Until:' : 'Due Date:';
    els.docTotalLabel.textContent = isQuotation ? 'Total Estimate' : 'Total Amount Due';

    // Status Stamp Watermark
    els.statusStamp.textContent = state.status;
    els.statusStamp.className = `status-stamp ${state.status}`;

    // Meta Views
    els.docNumberView.textContent = `# ${state.docNumber || '0000'}`;
    els.docIssueDateView.textContent = state.issueDate || '—';
    els.docDueDateView.textContent = state.dueDate || '—';

    // Delivery Time Row View
    if (state.deliveryTime && state.deliveryTime.trim() !== '') {
      els.docDeliveryRow.style.display = 'table-row';
      els.docDeliveryView.textContent = state.deliveryTime;
    } else {
      els.docDeliveryRow.style.display = 'none';
    }

    // Logo
    if (state.sender.logo) {
      els.docLogoView.src = state.sender.logo;
      els.docLogoView.style.display = 'block';
    } else {
      els.docLogoView.style.display = 'none';
    }

    // Sender & Client Views
    els.docSenderName.textContent = state.sender.name || 'DC Media';
    els.docSenderDetails.textContent = state.sender.details || '';

    els.docClientName.textContent = state.client.name || 'Client Name';
    els.docClientDetails.textContent = state.client.details || '';

    els.docPreparedByName.textContent = state.sender.name || 'DC Media';
    els.docPreparedByDetails.textContent = 'Media & Creative Team';

    // Render Preview Line Items Table & Math
    els.docTableBody.innerHTML = '';
    let subtotal = 0;

    state.items.forEach((item, index) => {
      const itemTotal = (item.qty || 0) * (item.price || 0);
      subtotal += itemTotal;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--slate-400); font-weight: 500;">${index + 1}</td>
        <td>
          <div class="doc-item-title">${escapeHtml(item.description || 'Item Description')}</div>
        </td>
        <td class="center">${item.qty}</td>
        <td class="right">${formatMoney(item.price, state.currency)}</td>
        <td class="right" style="font-weight: 700; font-family: var(--font-mono);">${formatMoney(itemTotal, state.currency)}</td>
      `;
      els.docTableBody.appendChild(tr);
    });

    // Summary Math
    const discountAmt = (subtotal * (state.discountRate || 0)) / 100;
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = (afterDiscount * (state.taxRate || 0)) / 100;
    const grandTotal = afterDiscount + taxAmt + (state.shippingFee || 0);

    els.docSubtotalView.textContent = formatMoney(subtotal, state.currency);

    // Discount Row
    if (state.discountRate > 0) {
      els.docDiscountRow.style.display = 'flex';
      els.docDiscountRateView.textContent = state.discountRate;
      els.docDiscountAmtView.textContent = `-${formatMoney(discountAmt, state.currency)}`;
    } else {
      els.docDiscountRow.style.display = 'none';
    }

    // Tax Row
    if (state.taxRate > 0) {
      els.docTaxRow.style.display = 'flex';
      els.docTaxRateView.textContent = state.taxRate;
      els.docTaxAmtView.textContent = `+${formatMoney(taxAmt, state.currency)}`;
    } else {
      els.docTaxRow.style.display = 'none';
    }

    // Shipping Row
    if (state.shippingFee > 0) {
      els.docShippingRow.style.display = 'flex';
      els.docShippingAmtView.textContent = `+${formatMoney(state.shippingFee, state.currency)}`;
    } else {
      els.docShippingRow.style.display = 'none';
    }

    // Grand Total
    els.docGrandTotalView.textContent = formatMoney(grandTotal, state.currency);

    // Side-by-Side Dual Equal Payment Cards Rendering
    let bankInfoText = escapeHtml(state.paymentDetails || 'N/A').replace(/\n/g, '<br>');

    els.paymentMethodsGrid.className = 'payment-methods-grid';
    els.paymentMethodsGrid.innerHTML = `
      <!-- Left Equal Box: Bank & Mobile Transfer -->
      <div class="payment-box bank-box">
        <div>
          <div class="payment-box-title" style="margin-bottom: 0.35rem;">
            <i data-lucide="building-2" style="width: 15px; height: 15px;"></i> Bank & Mobile Transfer
          </div>
          <div class="payment-box-content">${bankInfoText}</div>
        </div>
      </div>

      <!-- Right Equal Box: SSLCommerz Online Payment Card -->
      <div class="payment-box ssl-box">
        <div>
          <div class="payment-box-header">
            <div class="payment-box-title">
              <i data-lucide="shield-check" style="width: 15px; height: 15px; color: #14B8A6;"></i> SSLCommerz Pay
            </div>
            <span class="ssl-sub-tag">Instant Payment</span>
          </div>
          <p class="ssl-box-desc">Accepts Visa, Mastercard, bKash, Nagad & Internet Banking.</p>
        </div>
        <a href="${SSL_PAYMENT_URL}" target="_blank" rel="noopener noreferrer" class="ssl-pay-action-btn">
          <span>Pay Online Now</span>
          <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </a>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    els.docNotesTermsView.textContent = state.notes || 'Standard terms apply.';

    // Signature View Sync
    if (state.signature) {
      els.docSignatureView.src = state.signature;
      els.docSignatureView.style.display = 'block';
      els.signatureImage.src = state.signature;
      els.signaturePreviewContainer.style.display = 'flex';
    } else {
      els.docSignatureView.style.display = 'none';
      els.signaturePreviewContainer.style.display = 'none';
    }
  }

  // --- Logo Upload Handler ---
  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (evt) {
        state.sender.logo = evt.target.result;
        render();
      };
      reader.readAsDataURL(file);
    }
  }

  // --- Signature File Upload -> Open Signature Extractor Studio Modal ---
  function handleSignatureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        loadedRawSignatureImg = img;
        els.rawSignatureImg.src = evt.target.result;
        els.signatureExtractModal.classList.add('active');
        
        // Default sensitivity threshold
        els.thresholdRange.value = 165;
        els.thresholdVal.textContent = '165';
        els.chkEnhanceInk.checked = true;
        els.chkAutoCrop.checked = true;

        updateLiveExtractionPreview();
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Real-time Interactive Signature Background Removal Engine ---
  function updateLiveExtractionPreview() {
    if (!loadedRawSignatureImg) return;

    const threshold = parseInt(els.thresholdRange.value, 10);
    const enhanceInk = els.chkEnhanceInk.checked;
    const autoCrop = els.chkAutoCrop.checked;

    const img = loadedRawSignatureImg;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
    let foundInk = false;

    // Scan every pixel and remove paper background
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const idx = (y * img.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Luminance calculation
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        // If pixel is background paper (brightness > threshold or already transparent)
        if (brightness > threshold || a < 30) {
          data[idx + 3] = 0; // Make 100% transparent
        } else {
          // Ink stroke pixel detected!
          foundInk = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          // Enhance ink contrast if checked (makes pen strokes crisp dark navy/black)
          if (enhanceInk) {
            data[idx] = Math.max(0, r - 50);
            data[idx + 1] = Math.max(0, g - 50);
            data[idx + 2] = Math.max(0, b - 50);
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    let finalDataUrl = '';

    // If auto-crop checked and ink found, crop tightly around ink bounding box
    if (autoCrop && foundInk && maxX > minX && maxY > minY) {
      const padding = 12;
      const cropMinX = Math.max(0, minX - padding);
      const cropMinY = Math.max(0, minY - padding);
      const cropMaxX = Math.min(img.width, maxX + padding);
      const cropMaxY = Math.min(img.height, maxY + padding);
      const cropWidth = cropMaxX - cropMinX;
      const cropHeight = cropMaxY - cropMinY;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext('2d');

      cropCtx.drawImage(canvas, cropMinX, cropMinY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      finalDataUrl = cropCanvas.toDataURL('image/png');
    } else {
      finalDataUrl = canvas.toDataURL('image/png');
    }

    currentExtractedDataUrl = finalDataUrl;
    els.extractedSignaturePreview.src = finalDataUrl;
  }

  // --- Digital Signature Canvas Operations ---
  function initSignatureCanvas() {
    const canvas = els.signatureCanvas;
    canvasCtx = canvas.getContext('2d');
    canvasCtx.strokeStyle = '#0D5C63';
    canvasCtx.lineWidth = 2.5;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function startDrawing(e) {
      isDrawing = true;
      const pos = getPos(e);
      canvasCtx.beginPath();
      canvasCtx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      canvasCtx.lineTo(pos.x, pos.y);
      canvasCtx.stroke();
    }

    function stopDrawing() {
      isDrawing = false;
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
  }

  function clearSignatureCanvas() {
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, els.signatureCanvas.width, els.signatureCanvas.height);
    }
  }

  function applySignature() {
    const dataUrl = els.signatureCanvas.toDataURL();
    state.signature = dataUrl;
    els.signatureModal.classList.remove('active');
    render();
  }

  function removeSignature() {
    state.signature = '';
    loadedRawSignatureImg = null;
    currentExtractedDataUrl = '';
    if (els.signatureFileInput) els.signatureFileInput.value = '';
    clearSignatureCanvas();
    render();
  }

  // --- Demo Data Preset Loader ---
  function loadDemoData() {
    state.type = 'quotation';
    state.docNumber = 'QT-2026-089';
    state.currency = '৳';
    state.issueDate = new Date().toISOString().split('T')[0];
    state.dueDate = getFutureDate(14);
    state.deliveryTime = '5-7 Working Days';
    state.status = 'SENT';

    state.sender = {
      name: 'DC Media',
      details: 'Dhaka, Bangladesh\nEmail: contact@dcmedia.com\nPhone: +880 1700-000000',
      logo: state.sender.logo
    };

    state.client = {
      name: 'Grameenphone Ltd',
      details: 'Attn: Marketing & Brand Division\nGP House, Bashundhara, Dhaka 1229\nEmail: procurement@grameenphone.com'
    };

    state.items = [
      { id: 1, description: 'Video Commercial Shoot & Production', qty: 1, price: 85000 },
      { id: 2, description: 'Motion Graphics Editing & Color Grading', qty: 1, price: 45000 }
    ];

    state.taxRate = 5;
    state.discountRate = 0;
    state.shippingFee = 0;

    state.paymentDetails = 'Bank: Dutch-Bangla Bank Ltd (DBBL)\nAccount: 123-456-7890 (DC Media)\nbKash / Nagad: +880 1700-000000';
    state.notes = 'Thank you for choosing DC Media! We look forward to creating exceptional media content for you.';

    setMode('quotation');
    populateFormFields();
    render();
  }

  // --- Save Sender Defaults ---
  function saveSenderDefaults() {
    try {
      localStorage.setItem(SENDER_DEFAULTS_KEY, JSON.stringify(state.sender));
      alert('DC Media profile saved as default!');
    } catch (e) {
      alert('Could not save business defaults.');
    }
  }

  // --- Document History Storage Manager ---
  function getHistoryDocs() {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCurrentDocumentToHistory() {
    const history = getHistoryDocs();
    const docCopy = JSON.parse(JSON.stringify(state));
    docCopy.savedAt = new Date().toISOString();

    const existingIndex = history.findIndex(d => d.docNumber === docCopy.docNumber);
    if (existingIndex >= 0) {
      history[existingIndex] = docCopy;
    } else {
      history.unshift(docCopy);
    }

    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      updateHistoryCount();
      renderHistoryList();
      alert(`Document #${docCopy.docNumber} saved to local history!`);
    } catch (e) {
      alert('Failed to save document to storage.');
    }
  }

  function updateHistoryCount() {
    const history = getHistoryDocs();
    els.historyCount.textContent = history.length;
  }

  function toggleHistoryDrawer() {
    els.historyDrawer.classList.toggle('open');
    if (els.historyDrawer.classList.contains('open')) {
      renderHistoryList();
    }
  }

  function renderHistoryList() {
    const history = getHistoryDocs();
    els.historyList.innerHTML = '';

    if (history.length === 0) {
      els.historyList.innerHTML = '<p style="font-size: 0.85rem; color: var(--slate-500); text-align: center; padding: 2rem 0;">No saved documents yet.</p>';
      return;
    }

    history.forEach((doc, idx) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const formattedDate = new Date(doc.savedAt).toLocaleDateString();

      card.innerHTML = `
        <div>
          <div class="history-info-title">${doc.type.toUpperCase()} #${escapeHtml(doc.docNumber)}</div>
          <div class="history-info-sub">${escapeHtml(doc.client.name || 'Client')} • ${formattedDate}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm btn-load-doc" data-idx="${idx}">Load</button>
          <button class="btn-remove-item btn-del-doc" data-idx="${idx}" title="Delete document">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;

      els.historyList.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();

    // Bind load & delete handlers
    const loadBtns = els.historyList.querySelectorAll('.btn-load-doc');
    const delBtns = els.historyList.querySelectorAll('.btn-del-doc');

    loadBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-idx');
        const docToLoad = history[idx];
        Object.assign(state, docToLoad);
        setMode(state.type);
        populateFormFields();
        render();
        toggleHistoryDrawer();
      });
    });

    delBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = btn.getAttribute('data-idx');
        history.splice(idx, 1);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        updateHistoryCount();
        renderHistoryList();
      });
    });
  }

  // --- Utility Escaper ---
  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Run initial setup on load
  document.addEventListener('DOMContentLoaded', init);

})();
