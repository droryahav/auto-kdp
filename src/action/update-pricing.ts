import { Page } from 'puppeteer';

import { ActionResult } from '../util/action-result.js';
import { debug } from '../util/utils.js'
import { Timeouts, Urls, clickSomething, maybeClosePage, selectValue, updateTextFieldIfChanged, waitForElements } from './action-utils.js';
import { ActionParams } from '../util/action-params.js';
import { ALL_MARKETPLACES } from '../book/keys.js';
import { Book } from '../book/book.js';

export async function updatePricing(book: Book, params: ActionParams): Promise<ActionResult> {
  const verbose = params.verbose;

  if (params.dryRun) {
    debug(book, verbose, 'Updating pricing (dry run)');
    return new ActionResult(true);
  }

  // Publishing happens on the pricing page.
  const url = Urls.EDIT_PAPERBACK_PRICING.replace('$id', book.id);
  if (verbose) {
    debug(book, verbose, 'Updating pricing at url:' + url);
  }
  const page = await params.browser.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Timeouts.MIN_1 });
  await page.waitForTimeout(Timeouts.SEC_1);  // Just in case.

  // Primary marketplace.
  selectValue('#data-print-book-home-marketplace .a-native-dropdown', book.primaryMarketplace, 'primary marketplace', page, book, verbose);

  // Update the primary marketplace's price first and add some extra wait time
  let wasUpdated = await updateMarketplace(book.primaryMarketplace, page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_5);

  // Update all other marketplace prices next.
  for (const marketplace of ALL_MARKETPLACES) {
    if (marketplace != book.primaryMarketplace) {
      wasUpdated ||= await updateMarketplace(marketplace, page, book, verbose);
    }
  }

  // Save
  if (wasUpdated) {
    clickSomething('#save-announce', 'Save', page, book, verbose);
    await page.waitForSelector(
      '#potter-success-alert-bottom div div', { visible: true });
    await page.waitForTimeout(Timeouts.SEC_1);  // Just in case.
  } else {
    debug(book, verbose, 'Saving - not needed, prices were not updated')
  }

  await maybeClosePage(params, page);
  return new ActionResult(true);
}

async function updateMarketplace(marketplace: string, page: Page, book: Book, verbose: boolean): Promise<boolean> {
  const id = `#data-pricing-print-${marketplace}-price-input input`;
  const newPrice = book.getPriceForMarketplace(marketplace);
  return await updateTextFieldIfChanged(id, '' + newPrice, 'price for ' + marketplace + " marketplace", page, book, verbose);
}