const MONTH_CODES = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];

const MONTH_NAMES_IT = {
  A: 'Gennaio',
  B: 'Febbraio',
  C: 'Marzo',
  D: 'Aprile',
  E: 'Maggio',
  H: 'Giugno',
  L: 'Luglio',
  M: 'Agosto',
  P: 'Settembre',
  R: 'Ottobre',
  S: 'Novembre',
  T: 'Dicembre'
};

const OMOCODIA_TO_DIGIT = {
  L: '0',
  M: '1',
  N: '2',
  P: '3',
  Q: '4',
  R: '5',
  S: '6',
  T: '7',
  U: '8',
  V: '9'
};

const NUMERIC_POSITIONS = new Set([6, 7, 9, 10, 12, 13, 14]);

const ODD_VALUES = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
  U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23
};

const EVEN_VALUES = Object.fromEntries([
  ...Array.from({ length: 10 }, (_, i) => [String(i), i]),
  ...Array.from({ length: 26 }, (_, i) => [String.fromCharCode(65 + i), i])
]);

export function normalizeLetters(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

export function generateSurnameCode(surname) {
  const clean = normalizeLetters(surname);
  const consonants = clean.replace(/[AEIOU]/g, '');
  const vowels = clean.replace(/[^AEIOU]/g, '');
  return (consonants + vowels + 'XXX').slice(0, 3);
}

export function generateNameCode(name) {
  const clean = normalizeLetters(name);
  const consonants = clean.replace(/[AEIOU]/g, '');
  const vowels = clean.replace(/[^AEIOU]/g, '');

  if (consonants.length >= 4) {
    return consonants[0] + consonants[2] + consonants[3];
  }
  return (consonants + vowels + 'XXX').slice(0, 3);
}

function parseIsoBirthdate(birthdate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthdate ?? ''));
  if (!match) throw new Error('Data di nascita non valida.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) throw new Error('Mese di nascita non valido.');
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDay) throw new Error('Giorno di nascita non valido.');

  return { year, month, day };
}

export function generateDateCode(birthdate, gender) {
  if (!['M', 'F'].includes(gender)) throw new Error('Sesso non valido.');

  const { year, month, day } = parseIsoBirthdate(birthdate);
  const encodedDay = gender === 'F' ? day + 40 : day;

  return String(year).slice(-2)
    + MONTH_CODES[month - 1]
    + String(encodedDay).padStart(2, '0');
}

export function generateCheckDigit(cf15) {
  const value = String(cf15 ?? '').toUpperCase();
  if (!/^[A-Z0-9]{15}$/.test(value)) {
    throw new Error('I primi 15 caratteri del codice fiscale non sono validi.');
  }

  let sum = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    sum += i % 2 === 0 ? ODD_VALUES[char] : EVEN_VALUES[char];
  }
  return String.fromCharCode(65 + (sum % 26));
}

export function calculateFiscalCode({ surname, name, birthdate, gender, placeCode }) {
  const normalizedPlaceCode = String(placeCode ?? '').trim().toUpperCase();
  if (!/^[A-Z][0-9]{3}$/.test(normalizedPlaceCode)) {
    throw new Error('Codice Belfiore non valido.');
  }

  const partial = generateSurnameCode(surname)
    + generateNameCode(name)
    + generateDateCode(birthdate, gender)
    + normalizedPlaceCode;

  return partial + generateCheckDigit(partial);
}

function decodeOmocodiaPositions(cf) {
  const chars = cf.split('');
  let isOmocode = false;

  for (const index of NUMERIC_POSITIONS) {
    const char = chars[index];
    if (OMOCODIA_TO_DIGIT[char] !== undefined) {
      chars[index] = OMOCODIA_TO_DIGIT[char];
      isOmocode = true;
    }
  }

  return { normalized: chars.join(''), isOmocode };
}

function maxDayForMonthCode(monthCode) {
  if (monthCode === 'B') return 29;
  if (['D', 'H', 'P', 'S'].includes(monthCode)) return 30;
  return 31;
}

export function validateFiscalCode(value) {
  const cf = String(value ?? '').toUpperCase().replace(/\s+/g, '');

  if (cf.length !== 16) {
    throw new Error('Lunghezza codice errata: servono 16 caratteri.');
  }

  const structuralPattern = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
  if (!structuralPattern.test(cf)) {
    throw new Error('Struttura del codice fiscale non valida.');
  }

  if (generateCheckDigit(cf.slice(0, 15)) !== cf[15]) {
    throw new Error('Carattere di controllo non valido.');
  }

  const { normalized, isOmocode } = decodeOmocodiaPositions(cf);
  const yearSuffix = normalized.slice(6, 8);
  const monthCode = normalized[8];
  const encodedDay = Number(normalized.slice(9, 11));

  let gender;
  let day;
  if (encodedDay >= 1 && encodedDay <= 31) {
    gender = 'M';
    day = encodedDay;
  } else if (encodedDay >= 41 && encodedDay <= 71) {
    gender = 'F';
    day = encodedDay - 40;
  } else {
    throw new Error('Giorno/sesso codificato non valido.');
  }

  if (day > maxDayForMonthCode(monthCode)) {
    throw new Error('Giorno incompatibile con il mese codificato.');
  }

  const placeCode = normalized.slice(11, 15);
  return {
    cf,
    isOmocode,
    yearSuffix,
    monthCode,
    monthName: MONTH_NAMES_IT[monthCode],
    day,
    gender,
    placeCode
  };
}

export function decodeFiscalCode(value) {
  return validateFiscalCode(value);
}

export function buildPlaceIndex(rows) {
  const byLabel = new Map();
  const byName = new Map();
  const byBelfiore = new Map();
  const options = [];

  for (const item of rows) {
    const name = String(item['DESCRIZIONE COMUNE'] ?? '').trim();
    const code = String(item['CODICE BELFIORE'] ?? '').trim().toUpperCase();
    const sigla = String(item.SIGLA ?? '').trim().toUpperCase();
    const regione = String(item.REGIONE ?? '').trim();

    if (!name || !/^[A-Z][0-9]{3}$/.test(code)) continue;

    const entry = { name, code, sigla, regione };
    const normalizedName = name.toUpperCase();
    const label = `${normalizedName} (${sigla || 'EE'}) · ${code}`;

    byLabel.set(label, entry);
    if (!byName.has(normalizedName)) byName.set(normalizedName, []);
    byName.get(normalizedName).push(entry);
    byBelfiore.set(code, entry);
    options.push(label);
  }

  return { byLabel, byName, byBelfiore, options };
}

export function resolvePlaceCode(input, index) {
  const value = String(input ?? '').trim().toUpperCase();
  const direct = index.byLabel.get(value);
  if (direct) return direct.code;

  const candidates = index.byName.get(value) ?? [];
  if (candidates.length === 1) return candidates[0].code;
  if (candidates.length > 1) {
    throw new Error('Località ambigua: seleziona una voce completa dall’elenco.');
  }
  throw new Error('Comune o Stato estero non trovato nel database.');
}
