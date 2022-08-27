import { Keys } from './keys';
import { Book } from './book';
import { ExecuteBookActions } from './book-action-executor';
import { makeOkTestBook } from './test-utils'

test('one action succeeds', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => { return { success: true, nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(1);
    expect(result.result).toBe.truthy;
});

test('one action succeeds / boolean callback', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => true;
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(1);
    expect(result.result).toBe.truthy;
});


test('one action fails', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => { return { success: false, nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(0);
    expect(result.result).toBe.false;
});

test('one action fails and succeeds on second attempt', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => { return { success: p.attempt++ > 1, nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, { attempt: 1 });
    expect(result.numSuccesses).toBe(1);
    expect(result.result).toBe.true;
});

test('one action fails and succeeds on third attempt', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => { return { success: p.attempt++ > 2, nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, { attempt: 1 });
    expect(result.numSuccesses).toBe(1);
    expect(result.result).toBe.true;
});

test('one action throws', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => { throw new Error('bad action'); }
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(0);
    expect(result.result).toBe.false;
});

test('two actions succeed', async () => {
    let book = makeOkTestBook();
    book.action = 'action1:action2';
    let cb = async (a, b, p) => { return { success: true, nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(2);
    expect(result.result).toBe.true;
});

test('one action succeeds, one fails', async () => {
    let book = makeOkTestBook();
    book.action = 'action1:action2';
    let cb = async (a, b, p) => { return { success: a == 'action1', nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(1);
    expect(result.result).toBe.false;
});

test('three actions succeed', async () => {
    let book = makeOkTestBook();
    book.action = 'action1:action2:action3';
    let cb = async (a, b, p) => { return { success: true, nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(3);
    expect(result.result).toBe.true;
});

test('two actions succeed and one fails', async () => {
    let book = makeOkTestBook();
    book.action = 'action1:action2:action3';
    let cb = async (a, b, p) => { return { success: a != 'action3', nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(2);
    expect(result.result).toBe.false;
});

test('one actions succeed, one fails, onenever runs', async () => {
    let book = makeOkTestBook();
    book.action = 'action1:action2:action3';
    let cb = async (a, b, p) => { return { success: a != 'action2', nextActions: '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(result.numSuccesses).toBe(1);
    expect(result.result).toBe.false;
});

test('do not execute the same next actions', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => { return { success: a == 'action1', nextActions: 'action1' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(book.action).toBe('action1');
});

test('has next actions', async () => {
    let book = makeOkTestBook();
    book.action = 'action1';
    let cb = async (a, b, p) => { return { success: a == 'action1', nextActions: 'NEXT' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(book.action).toBe('NEXT');
});

test('next actions for last action', async () => {
    let book = makeOkTestBook();
    book.action = 'action1:action2:action3';
    let cb = async (a, b, p) => { return { success: a != 'NEXT', nextActions: a == 'action3' ? 'NEXT' : '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(book.action).toBe('NEXT');
});

test('next actions for middle action', async () => {
    let book = makeOkTestBook();
    book.action = 'action1:action2:action3';
    let cb = async (a, b, p) => { return { success: a != 'NEXT', nextActions: a == 'action2' ? 'NEXT:NEXT' : '' } };
    let result = await ExecuteBookActions(book, cb, {});
    expect(book.action).toBe('NEXT:NEXT:action3');
});
