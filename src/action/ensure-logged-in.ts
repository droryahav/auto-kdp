import { Timeouts, Urls, maybeClosePage } from './action-utils.js';
import { ActionParams } from '../util/action-params.js';
import { ActionResult } from '../util/action-result.js';

export async function ensureLoggedIn(params: ActionParams): Promise<ActionResult> {
  const page = await params.browser.newPage();
  await page.goto(
    Urls.CREATE_PAPERBACK, { waitUntil: 'domcontentloaded', timeout: Timeouts.MIN_1 });

  // This is a fake creation, just to trigger signin (bookshelf is not enough)
  await page.waitForSelector('#data-print-book-title');

  await maybeClosePage(params, page);

  return new ActionResult(true);
}
