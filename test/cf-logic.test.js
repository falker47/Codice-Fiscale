import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildPlaceIndex,
  calculateFiscalCode,
  decodeFiscalCode,
  generateNameCode,
  generateSurnameCode,
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

test('does not invent a full century during reverse decoding', () => {
  const decoded = decodeFiscalCode('RSSMRA80A01H501U');
  assert.equal(decoded.yearSuffix, '80');
  assert.equal('year' in decoded, false);
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
