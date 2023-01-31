import { arraysEqual, isInt, mergeActions, normalizeText, normalizeSearchQuery, stripPrefix, stringToIntOrThrow } from './utils';

test('mergeActions', () => {
  expect(mergeActions('a:b', 'c:d')).toEqual('a:b:c:d');
  expect(mergeActions('a', 'c')).toEqual('a:c');
  expect(mergeActions('a:b', '')).toEqual('a:b');
  expect(mergeActions('a', '')).toEqual('a');
  expect(mergeActions('', 'a:b')).toEqual('a:b');
  expect(mergeActions('', 'a')).toEqual('a');
  expect(mergeActions('', '')).toEqual('');
});

test('arraysEqual', () => {
  expect(arraysEqual(null, null)).toEqual(true);
  expect(arraysEqual([], [])).toEqual(true);
  expect(arraysEqual([], null)).toEqual(false);
  expect(arraysEqual(null, ['a'])).toEqual(false);
  expect(arraysEqual(['a'], ['a'])).toEqual(true);
  expect(arraysEqual(['a'], ['b'])).toEqual(false);
  expect(arraysEqual(['a'], ['b', 'c'])).toEqual(false);
  expect(arraysEqual(['a', 'c'], ['a', 'b'])).toEqual(false);
  expect(arraysEqual(['a', 'c'], ['a', 'c'])).toEqual(true);

  let arr = ['a', 'z'];
  expect(arraysEqual(arr, arr)).toEqual(true);
});

test('normalizeText', () => {
  expect(normalizeText('')).toEqual('');
  expect(normalizeText('blah')).toEqual('blah');
  expect(normalizeText('  \t\nblah\t      ')).toEqual('blah');
  expect(normalizeText('  blah \n \t blah \n\t \n\n')).toEqual('blah blah');
  expect(normalizeText('  <p>abc</p>   <p>def</p>')).toEqual('<p>abc</p><p>def</p>');
  expect(normalizeText('  <p>abc. </p>')).toEqual('<p>abc.</p>');
});

test('normalizeSearchQuery', () => {
  expect(normalizeSearchQuery('')).toEqual('');
  expect(normalizeSearchQuery('blah')).toEqual('blah');
  expect(normalizeSearchQuery('blah (a) "b" \'c\' ,d, .e. [f] g?')).toEqual('blah a b c d e f g');
  expect(normalizeSearchQuery('\tblah\n\t  blah  ')).toEqual('blah blah');
  expect(normalizeSearchQuery('blah R-Z')).toEqual('blah R Z');
  expect(normalizeSearchQuery('blah R/Z')).toEqual('blah R Z');
  expect(normalizeSearchQuery('blah R\\Z')).toEqual('blah R Z');
});

test('stripPrefix', () => {
  expect(stripPrefix('', 'blah')).toEqual('');
  expect(stripPrefix('test', 'blah')).toEqual('test');
  expect(stripPrefix('test', '')).toEqual('test');
  expect(stripPrefix('test', 't')).toEqual('est');
  expect(stripPrefix('test', 'test')).toEqual('');
});

test('isInt', () => {
  expect(isInt('0')).toEqual(true);
  expect(isInt('1')).toEqual(true);
  expect(isInt('-1')).toEqual(true);
  expect(isInt('2')).toEqual(true);
  expect(isInt('-2')).toEqual(true);
  expect(isInt('-234')).toEqual(true);
  expect(isInt('-23456789')).toEqual(true);
  expect(isInt('1.1')).toEqual(false);
  expect(isInt('blah')).toEqual(false);
  expect(isInt('2blah')).toEqual(false);
  expect(isInt('blah2')).toEqual(false);
});

test('stringToInt', () => {
  expect(stringToIntOrThrow('0')).toEqual(0);
  expect(stringToIntOrThrow('1')).toEqual(1);
  expect(stringToIntOrThrow('-1')).toEqual(-1);
  expect(stringToIntOrThrow('2')).toEqual(2);
  expect(stringToIntOrThrow('22222')).toEqual(22222);
  expect(stringToIntOrThrow('-102938')).toEqual(-102938);
  expect(() => stringToIntOrThrow('1.1')).toThrow(/cannot parse/)
  expect(() => stringToIntOrThrow('abc')).toThrow(/cannot parse/)
});
