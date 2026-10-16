// SIMULACIÓN DE TASAS DE CAMBIO (Base: USD)
const exchangeRates = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.50,
  ARS: 1040.00,
  MXN: 18.20,
  COP: 4350.00,
  BRL: 5.65,
  CLP: 950.00,
  CAD: 1.38
};

const currencySymbols = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', ARS: '$',
  MXN: '$', COP: '$', BRL: 'R$', CLP: '$', CAD: '$'
};

// ELEM. DOM
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const swapBtn = document.getElementById('swap-btn');
const rateDisplay = document.getElementById('rate-display');
const resultDisplay = document.getElementById('result-display');
const fromSymbol = document.getElementById('from-symbol');
const sendToNotesBtn = document.getElementById('send-to-notes-btn');
const autosaveCheck = document.getElementById('autosave-check');
const notesContainer = document.getElementById('notes-container');
const quickNoteInput = document.getElementById('quick-note-input');
const addQuickNoteBtn = document.getElementById('add-quick-note-btn');
const copyAllBtn = document.getElementById('copy-all-btn');
const exportBtn = document.getElementById('export-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const toast = document.getElementById('toast');

let notesList = [];
let lastSavedConversion = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  calculateConversion();
  renderNotes();

  // Event Listeners
  amountInput.addEventListener('input', handleAutoConversion);
  fromCurrencySelect.addEventListener('change', () => {
    updateSymbol();
    handleAutoConversion();
  });
  toCurrencySelect.addEventListener('change', handleAutoConversion);

  swapBtn.addEventListener('click', () => {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    updateSymbol();
    handleAutoConversion();
  });

  sendToNotesBtn.addEventListener('click', () => {
    addCurrentConversionToNotes();
  });

  addQuickNoteBtn.addEventListener('click', addQuickNote);
  quickNoteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addQuickNote();
  });

  copyAllBtn.addEventListener('click', copyAllNotes);
  exportBtn.addEventListener('click', exportNotesTxt);
  clearAllBtn.addEventListener('click', clearAllNotes);
});

// ACTUALIZA SÍMBOLO
function updateSymbol() {
  fromSymbol.textContent = currencySymbols[fromCurrencySelect.value] || '$';
}

// CÁLCULO DE CONVERSIÓN
function calculateConversion() {
  const amount = parseFloat(amountInput.value) || 0;
  const from = fromCurrencySelect.value;
  const to = toCurrencySelect.value;

  // Convertir a base (USD) y luego a destino
  const rateFromUSD = exchangeRates[from];
  const rateToUSD = exchangeRates[to];
  const rate = (1 / rateFromUSD) * rateToUSD;

  const result = amount * rate;

  // Formatear
  rateDisplay.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
  resultDisplay.innerHTML = `${result.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>${to}</small>`;

  return { amount, from, to, result, rate };
}

// MANEJO CON AUTO-GUARDADO
function handleAutoConversion() {
  const data = calculateConversion();

  if (autosaveCheck.checked && data.amount > 0) {
    const currentConversionKey = `${data.amount}_${data.from}_${data.to}`;
    
    // Evitar agregar duplicados continuos en el mismo cambio de input
    if (lastSavedConversion !== currentConversionKey) {
      lastSavedConversion = currentConversionKey;
      addCurrentConversionToNotes(true);
    }
  }
}

// AGREGAR CONVERSIÓN A NOTAS
function addCurrentConversionToNotes(isAuto = false) {
  const data = calculateConversion();
  if (data.amount <= 0) return;

  const note = {
    id: Date.now(),
    type: 'conversion',
    amount: data.amount,
    from: data.from,
    to: data.to,
    result: data.result,
    annotation: '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  notesList.unshift(note);
  renderNotes();

  if (!isAuto) {
    showToast('Conversión agregada a las notas');
  }
}

// AGREGAR NOTA RÁPIDA MANUAL
function addQuickNote() {
  const text = quickNoteInput.value.trim();
  if (!text) return;

  const note = {
    id: Date.now(),
    type: 'manual',
    text: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  notesList.unshift(note);
  quickNoteInput.value = '';
  renderNotes();
  showToast('Nota rápida añadida');
}

// RENDERIZAR FEED DE NOTAS
function renderNotes() {
  notesContainer.innerHTML = '';

  if (notesList.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-clipboard"></i>
        <p>Aún no hay notas registradas.</p>
        <small>Realiza conversiones o escribe una nota rápida.</small>
      </div>
    `;
    return;
  }

  notesList.forEach(note => {
    const card = document.createElement('div');
    card.className = `note-item ${note.type}`;

    if (note.type === 'conversion') {
      const fromSym = currencySymbols[note.from] || '';
      const toSym = currencySymbols[note.to] || '';

      card.innerHTML = `
        <div class="note-header">
          <span class="note-title"><i class="fa-solid fa-arrow-right-arrow-left"></i> ${note.result.toFixed(2)} ${note.to}</span>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="note-time">${note.timestamp}</span>
            <button class="btn-delete-note" onclick="deleteNote(${note.id})" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="note-details">
          ${fromSym}${note.amount.toFixed(2)} ${note.from} ➔ ${toSym}${note.result.toFixed(2)} ${note.to}
        </div>
        <input type="text" class="note-annotation" placeholder="➕ Añadir nota o detalle del gasto..." 
               value="${note.annotation}" onchange="updateAnnotation(${note.id}, this.value)">
      `;
    } else {
      card.innerHTML = `
        <div class="note-header">
          <span class="note-title"><i class="fa-regular fa-note-sticky"></i> Nota rápida</span>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="note-time">${note.timestamp}</span>
            <button class="btn-delete-note" onclick="deleteNote(${note.id})" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div style="color: var(--text-main); font-size: 0.9rem; margin-top: 0.25rem;">${note.text}</div>
      `;
    }

    notesContainer.appendChild(card);
  });
}

// ACTUALIZAR ANOTACIÓN
window.updateAnnotation = function(id, text) {
  const note = notesList.find(n => n.id === id);
  if (note) {
    note.annotation = text;
  }
};

// ELIMINAR NOTA
window.deleteNote = function(id) {
  notesList = notesList.filter(n => n.id !== id);
  renderNotes();
  showToast('Nota eliminada');
};

// BORRAR TODO
function clearAllNotes() {
  if (notesList.length === 0) return;
  if (confirm('¿Seguro que deseas eliminar todas las notas?')) {
    notesList = [];
    renderNotes();
    showToast('Cuaderno limpiado');
  }
}

// COPIAR RESUMEN AL PORTAPAPELES
function copyAllNotes() {
  if (notesList.length === 0) {
    showToast('No hay notas para copiar');
    return;
  }

  let textToCopy = "--- RESUMEN DE NOTAS Y CONVERSIONES ---\n\n";
  notesList.forEach((n, i) => {
    if (n.type === 'conversion') {
      textToCopy += `${i + 1}. [${n.timestamp}] ${n.amount} ${n.from} -> ${n.result.toFixed(2)} ${n.to}`;
      if (n.annotation) textToCopy += ` (Nota: ${n.annotation})`;
    } else {
      textToCopy += `${i + 1}. [${n.timestamp}] ${n.text}`;
    }
    textToCopy += "\n";
  });

  navigator.clipboard.writeText(textToCopy);
  showToast('Notas copiadas al portapapeles');
}

// EXPORTAR TXT
function exportNotesTxt() {
  if (notesList.length === 0) {
    showToast('No hay notas para exportar');
    return;
  }

  let textContent = "HISTORIAL DE CONVERSIONES Y NOTAS\n";
  textContent += `Fecha: ${new Date().toLocaleDateString()}\n`;
  textContent += "----------------------------------------\n\n";

  notesList.forEach((n, i) => {
    if (n.type === 'conversion') {
      textContent += `[${n.timestamp}] ${n.amount} ${n.from} = ${n.result.toFixed(2)} ${n.to}\n`;
      if (n.annotation) textContent += `   Detalle: ${n.annotation}\n`;
    } else {
      textContent += `[${n.timestamp}] NOTA: ${n.text}\n`;
    }
    textContent += "\n";
  });

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `notas_divisas_${Date.now()}.txt`;
  a.click();
  showToast('Archivo TXT descargado');
}

// MOSTRAR TOAST
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}
