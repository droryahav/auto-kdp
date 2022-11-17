import { Timeouts, Urls, debug, waitForElements } from './utils.js';

async function priceNeedsUpdate(newPrice, currency, id, page, verbose) {
  const oldPriceStr = (await page.$eval(id, x => x.value)) || '';
  const newPriceStr = '' + newPrice;
  let needsUpdate = newPriceStr != oldPriceStr;
  if (verbose) {
    if (needsUpdate) {
      console.log(`Price ${currency} - needs update from ${oldPriceStr} to ${newPriceStr}`);
    } else {
      console.log(`Price ${currency} - ok, got ${oldPriceStr}`);
    }
  }
  return needsUpdate;
}

export async function isPricingUpdateNeeded(book, params) {
  const verbose = params.verbose;

  if (params.dryRun) {
    debug(verbose, 'Checking if pricing needs update (dry run)');
    return true;
  }

  const url = Urls.EDIT_PAPERBACK_PRICING.replace('$id', book.id);
  debug(verbose, 'Checking if pricing needs update at url: ' + url);
  const page = await params.browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Timeouts.MIN_1 });
  await page.waitForTimeout(Timeouts.SEC_1);  // Just in case.

  // Wait for all selectors
  await waitForElements(page, [
    '#data-pricing-print-us-price-input input',
    '#data-pricing-print-uk-price-input input',
    '#data-pricing-print-de-price-input input',
    '#data-pricing-print-fr-price-input input',
    '#data-pricing-print-es-price-input input',
    '#data-pricing-print-it-price-input input',
    '#data-pricing-print-nl-price-input input',
    '#data-pricing-print-pl-price-input input',
    '#data-pricing-print-se-price-input input',
    '#data-pricing-print-jp-price-input input',
    '#data-pricing-print-ca-price-input input',
    '#data-pricing-print-au-price-input input',
  ]);

  let needsUpdate =
    (await priceNeedsUpdate(book.priceUsd, 'USD', '#data-pricing-print-us-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceGbp, 'GBP', '#data-pricing-print-uk-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceEur, 'DE/EUR', '#data-pricing-print-de-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceEur, 'FR/EUR', '#data-pricing-print-fr-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceEur, 'ES/EUR', '#data-pricing-print-es-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceEur, 'IT/EUR', '#data-pricing-print-it-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceEur, 'NL/EUR', '#data-pricing-print-nl-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.pricePl, 'PL', '#data-pricing-print-pl-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceSe, 'PL', '#data-pricing-print-se-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceJp, 'JP', '#data-pricing-print-jp-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceCa, 'CA', '#data-pricing-print-ca-price-input input', page, verbose)) ||
    (await priceNeedsUpdate(book.priceAu, 'AU', '#data-pricing-print-au-price-input input', page, verbose));

  debug(verbose, 'Needs update: ' + needsUpdate);

  if (!params.keepOpen) {
    await page.close();
  }

  return { success: true, nextActions: needsUpdate ? 'pricing:publish:scrape' : '' };
}

