import { Timeouts, Urls, debug } from './utils.js';

export async function scrapeAmazonCoverImageUrl(book, params) {
  const verbose = params.verbose;

  if (params.dryRun) {
    debug(verbose, 'Scraping cover (dry run)');
    return true;
  }
  const url = Urls.AMAZON_PRODUCT_URL + book.asin;
  debug(verbose, 'Scraping cover at product url: ' + url);

  if (book.asin == '') {
    debug(verbose, 'NOT scaraping cover: no ASIN');
    return false;
  }

  const page = await params.browser.newPage();

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Timeouts.MIN_3 });
  await page.waitForTimeout(Timeouts.SEC_1);  // Just in case.

  // Get raw content
  const text = await response.text();
  debug(verbose, 'Got response of length ' + text.length);
  const mainUrlRe = /"mainUrl":"([^"]+?)"/;
  const mainUrls = text.match(mainUrlRe);
  for (let i = 0; i < mainUrls.length; ++i) {
    debug(verbose, "    Matched: " + mainUrls[i]);
  }
  const mainUrl = mainUrls && mainUrls.length > 1 && mainUrls[1] && mainUrls[1] != '' &&
    mainUrls[1].startsWith(Urls.AMAZON_IMAGE_URL) ? mainUrls[1].substr(Urls.AMAZON_IMAGE_URL.length) : null;

  const success = mainUrl != null && mainUrl != '';

  if (success) {
    debug(verbose, 'Cover image url: ' + mainUrl);
    book.coverImageUrl = mainUrl;
  } else {
    console.error("Cover image url not found!");
  }

  if (!params.keepOpen) {
    await page.close();
  }

  return success;
}
