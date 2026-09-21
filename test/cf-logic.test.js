import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildPlaceIndex,
  calculateFiscalCode,
  decodeFiscalCode,
  generateNameCode,
  generateSurnameCode,
  inferModernBirthYears,
  resolvePlaceCode,
  validateFiscalCode
} from '../cf-logic.js';

test('surname and name rules follow the official consonant/vowel order', () => {
  assert.equal(generateSurnameCode('Rossi'), 'RSS');
  assert.equal(generateNameCode('Mario'), 'MRA');
  assert.equal(generateNameCode('Cristina'), 'CST');
  assert.equal(generateNameCode('Niccolò'), 'NCL');
  assert.equal(generateSurnameCode("D'Angelo"), 'DNG');
});

test('calculates the standard Mario Rossi example deterministically', () => {
  const cf = calculateFiscalCode({
    surname: 'Rossi',
    name: 'Mario',
    birthdate: '1980-01-01',
    gender: 'M',
    placeCode: 'H501'
  });
  assert.equal(cf, 'RSSMRA80A01H501U');
});

test('validates the control character and rejects transcription errors', () => {
  const decoded = validateFiscalCode('RSSMRA80A01H501U');
  assert.equal(decoded.placeCode, 'H501');
  assert.equal(decoded.yearSuffix, '80');
  assert.equal(decoded.day, 1);
  assert.equal(decoded.gender, 'M');

  assert.throws(
    () => validateFiscalCode('RSSMRA80A01H501A'),
    /Carattere di controllo/
  );
});

test('decodes a formally valid omocode without losing the base place code', () => {
  const decoded = decodeFiscalCode('RSSMRA80A01H50MM');
  assert.equal(decoded.isOmocode, true);
  assert.equal(decoded.placeCode, 'H501');
  assert.equal(decoded.yearSuffix, '80');
  assert.equal(decoded.day, 1);
});

test('infers a single modern year when the 2000s candidate is still in the future', () => {
  const referenceDate = new Date(2026, 8, 21);
  const decoded = decodeFiscalCode('RSSMRA80A01H501U', referenceDate);
  assert.deepEqual(decoded.yearCandidates, [1980]);
  assert.equal(decoded.displayBirthDate, '01/01/1980');
});

test('maps 15/06/98 to 15/06/1998 in the modern window', () => {
  const referenceDate = new Date(2026, 8, 21);
  assert.deepEqual(inferModernBirthYears('98', 'H', 15, referenceDate), [1998]);
});

test('shows both modern-century candidates when both dates are already in the past', () => {
  const referenceDate = new Date(2026, 8, 21);
  assert.deepEqual(inferModernBirthYears('16', 'H', 15, referenceDate), [2016, 1916]);
});

test('uses the full current date when deciding whether the current-century candidate exists yet', () => {
  const referenceDate = new Date(2026, 8, 21);

  assert.deepEqual(inferModernBirthYears('26', 'H', 15, referenceDate), [2026, 1926]);
  assert.deepEqual(inferModernBirthYears('26', 'T', 15, referenceDate), [1926]);
});

test('place index supports foreign states and forces disambiguation for duplicate names', async () => {
  const rows = JSON.parse(await readFile(new URL('../DB-province.json', import.meta.url), 'utf8'));
  const index = buildPlaceIndex(rows);

  assert.ok(index.options.length > 8000);
  assert.equal(resolvePlaceCode('ROMA', index), 'H501');
  assert.equal(resolvePlaceCode("STATI UNITI D'AMERICA", index), 'Z404');

  assert.throws(
    () => resolvePlaceCode('CASTRO', index),
    /Località ambigua/
  );
  assert.equal(resolvePlaceCode('CASTRO (BG) · C337', index), 'C337');
  assert.equal(resolvePlaceCode('CASTRO (LE) · M261', index), 'M261');
});
