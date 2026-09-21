'use strict';

import {
  buildPlaceIndex,
  calculateFiscalCode,
  decodeFiscalCode,
  resolvePlaceCode
} from './cf-logic.js';

const store = {
  placeIndex: null
};

const UI = {
  elements: {
    currentYear: document.getElementById('currentYear'),
    datalist: document.getElementById('comuniList'),
    cfForm: document.getElementById('cfForm'),
    cfResultBox: document.getElementById('cfResultBox'),
    cfResultText: document.getElementById('cfResultText'),
    copyCFButton: document.getElementById('copyCFButton'),
    decodeForm: document.getElementById('decodeForm'),
    decodeResultBox: document.getElementById('decodeResultBox'),
    toastContainer: document.getElementById('toast-container')
  },

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconNode = document.createElement('span');
    iconNode.textContent = type === 'success' ? 'OK' : (type === 'error' ? '!' : 'i');
    const textNode = document.createElement('span');
    textNode.textContent = message;
    toast.append(iconNode, textNode);

    this.elements.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  },

  focusNext(currentId, nextId) {
    const currentEl = document.getElementById(currentId);
    if (!currentEl) return;

    currentEl.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      document.getElementById(nextId)?.focus();
    });
  }
};

async function loadPlaces() {
  try {
    const response = await fetch('DB-province.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rows = await response.json();
    store.placeIndex = buildPlaceIndex(rows);

    const fragment = document.createDocumentFragment();
    for (const label of store.placeIndex.options) {
      const option = document.createElement('option');
      option.value = label;
      fragment.appendChild(option);
    }
    UI.elements.datalist.appendChild(fragment);
    console.log(`Database località caricato: ${store.placeIndex.options.length} voci.`);
  } catch (error) {
    console.error('Errore caricamento database località:', error);
    UI.showToast('Errore nel caricamento del database località.', 'error');
  }
}

function getSelectedPlaceCode(placeInput) {
  if (!store.placeIndex) {
    throw new Error('Database località non ancora disponibile.');
  }
  return resolvePlaceCode(placeInput, store.placeIndex);
}

function getLocationInfo(placeCode) {
  const entry = store.placeIndex?.byBelfiore.get(placeCode);
  if (!entry) {
    return {
      name: 'Sconosciuto',
      sigla: '',
      regione: ''
    };
  }
  return entry;
}

function renderDecodedFiscalCode(decoded) {
  const location = getLocationInfo(decoded.placeCode);
  const genderFull = decoded.gender === 'M' ? 'Maschile' : 'Femminile';
  const luogo = location.sigla !== 'EE' && location.regione
    ? `${location.name} (${location.sigla}) - ${location.regione}`
    : location.sigla
      ? `${location.name} (${location.sigla})`
      : location.name;

  const omocodiaItem = decoded.isOmocode
    ? `
      <div class="decode-item">
        <span class="decode-label">Omocodia</span>
        <span class="decode-value">Sì — cifre sostituite con lettere secondo le regole ufficiali</span>
      </div>
    `
    : '';

  UI.elements.decodeResultBox.innerHTML = `
    <div class="decode-grid">
      <div class="decode-item">
        <span class="decode-label">Data di nascita</span>
        <span class="decode-value">${decoded.displayBirthDate}</span>
      </div>

      <div class="decode-item">
        <span class="decode-label">Sesso</span>
        <span class="decode-value">${genderFull}</span>
      </div>

      <div class="decode-item">
        <span class="decode-label">Luogo di nascita</span>
        <span class="decode-value">${luogo}</span>
      </div>

      ${omocodiaItem}
    </div>
  `;
  UI.elements.decodeResultBox.classList.add('show');
}

function init() {
  UI.elements.currentYear.textContent = new Date().getFullYear();
  loadPlaces();

  UI.focusNext('name', 'surname');
  UI.focusNext('surname', 'birthdate');
  UI.focusNext('birthdate', 'genderM');
  UI.focusNext('genderM', 'place');
  UI.focusNext('genderF', 'place');

  UI.elements.cfForm.addEventListener('submit', (event) => {
    event.preventDefault();

    try {
      const surname = document.getElementById('surname').value.trim();
      const name = document.getElementById('name').value.trim();
      const birthdate = document.getElementById('birthdate').value;
      const gender = document.querySelector('input[name="gender"]:checked')?.value;
      const place = document.getElementById('place').value.trim();

      if (!surname || !name || !birthdate || !gender || !place) {
        throw new Error('Compila tutti i campi obbligatori.');
      }

      const placeCode = getSelectedPlaceCode(place);
      const cf = calculateFiscalCode({ surname, name, birthdate, gender, placeCode });

      UI.elements.cfResultText.textContent = cf;
      UI.elements.cfResultBox.classList.add('show');
      UI.elements.copyCFButton.style.display = 'inline-flex';
      UI.showToast('Codice fiscale teorico calcolato.', 'success');
    } catch (error) {
      UI.elements.cfResultText.textContent = 'Errore';
      UI.elements.cfResultBox.classList.add('show');
      UI.elements.copyCFButton.style.display = 'none';
      UI.showToast(error.message, 'error');
    }
  });

  UI.elements.copyCFButton.addEventListener('click', () => {
    const text = UI.elements.cfResultText.textContent.trim();
    if (!text || text === 'Errore') return;

    navigator.clipboard.writeText(text)
      .then(() => UI.showToast('Copiato negli appunti!', 'success'))
      .catch(() => UI.showToast('Errore durante la copia.', 'error'));
  });

  UI.elements.decodeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    try {
      const cfInput = document.getElementById('cfInput').value.trim();
      const decoded = decodeFiscalCode(cfInput);
      renderDecodedFiscalCode(decoded);
      UI.showToast('Codice formalmente valido e decodificato.', 'success');
    } catch (error) {
      UI.elements.decodeResultBox.textContent = 'Errore decodifica';
      UI.showToast(error.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
