import { ActionsResult } from './actions-result.js';
import { ActionResult } from './action-result.js';

test('hasSuccess', () => {
    let ar = new ActionsResult();
    ar.reportResult(new ActionResult(true));
    expect(ar.hasSuccess()).toEqual(true);
    ar.reportResult(new ActionResult(false));
    expect(ar.hasSuccess()).toEqual(true);
});

test('hasFailed', () => {
    let ar = new ActionsResult();
    ar.reportResult(new ActionResult(true));
    expect(ar.hasFailed()).toEqual(false);
    ar.reportResult(new ActionResult(false));
    expect(ar.hasFailed()).toEqual(true);
});

test('isDone', () => {
    let ar = new ActionsResult();
    expect(ar.isDone).toEqual(false);
    ar.reportResult(new ActionResult(true));
    expect(ar.isDone).toEqual(false);
    ar.reportResult(new ActionResult(false));
    expect(ar.isDone).toEqual(true);
});

test('nextActions', () => {
    let ar = new ActionsResult();
    ar.reportResult(new ActionResult(true).setNextActions('someAction'));
    expect(ar.isDone).toEqual(true);
});
