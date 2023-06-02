
import { Page } from 'puppeteer';

import { ActionResult } from '../util/action-result.js';
import { debug, error, arraysEqual, cleanupHtmlForAmazonDescription, clipLen } from '../util/utils.js';
import { updateTextFieldIfChanged, clickSomething, Timeouts, Urls, clearTextField, maybeClosePage, waitForElements, selectValue, updateTextAreaIfChanged, getTextFieldValue, hasElement, updateHiddenTextField } from './action-utils.js';
import { Book } from '../book/book.js';
import { ActionParams } from '../util/action-params.js';

// This function also creates a book.
export async function updateBookMetadata(book: Book, params: ActionParams): Promise<ActionResult> {
  const verbose = params.verbose;

  if (params.dryRun) {
    debug(book, verbose, 'Updating book (dry run)');
    return new ActionResult(true);
  }

  if (!book.canBeCreated()) {
    error(book, 'Fields missing - cannot create/update the book');
    return new ActionResult(false).doNotRetry();
  }

  const isNew = book.id == '';
  const url = isNew ? Urls.CREATE_PAPERBACK : Urls.EDIT_PAPERBACK_DETAILS.replace('$id', book.id);

  debug(book, verbose, (isNew ? 'Creating' : 'Updating') + ' at url: ' + url);

  const page = await params.browser.newPage();
  let response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Timeouts.MIN_1 });

  if (response.status() == 500) {
    error(book, 'KDP returned internal erorr (500).');
    await maybeClosePage(params, page);
    return new ActionResult(false).doNotRetry();
  }

  await page.waitForTimeout(Timeouts.SEC_1); // Just in case.

  if (!book.wasEverPublished) {

    // This fields can only be updated if the book
    // has never been published. After publishing, they
    // are set in stone.
    await selectValue('#data-print-book-language-native', book.language.toLowerCase(), 'language', page, book, verbose);
    await updateTextFieldIfChanged('#data-print-book-title', book.title, 'title', page, book, verbose);
    await updateTextFieldIfChanged('#data-print-book-subtitle', book.subtitle, 'title', page, book, verbose);
    await updateTextFieldIfChanged('#data-print-book-primary-author-first-name', book.authorFirstName, 'author\'s first name', page, book, verbose);
    await updateTextFieldIfChanged('#data-print-book-primary-author-last-name', book.authorLastName, 'author\'s last name', page, book, verbose);
    await updateTextFieldIfChanged('#data-print-book-contributors-0-first-name', book.illustratorFirstName, 'illustrator\'s first name', page, book, verbose);
    await updateTextFieldIfChanged('#data-print-book-contributors-0-last-name', book.illustratorLastName, 'illustrator\'s last name', page, book, verbose);
    if (book.illustratorFirstName != '' || book.illustratorLastName != '') {
      await selectValue('#data-print-book-contributors-0-role-native', 'illustrator', 'illustrator\'s role', page, book, verbose);
    }
  }

  // Description
  await clickSomething('#cke_18', 'Source button', page, book, verbose);
  await updateTextAreaIfChanged('#cke_1_contents > textarea', book.description, cleanupHtmlForAmazonDescription, 'description', page, book, verbose);

  // Whether public domain
  // TODO: support public domain works
  await clickSomething('#non-public-domain', 'whether public domain', page, book, verbose);

  // Keywords
  await updateTextFieldIfChanged('#data-print-book-keywords-0', book.keyword0, "keyword 0", page, book, verbose);
  await updateTextFieldIfChanged('#data-print-book-keywords-1', book.keyword1, "keyword 1", page, book, verbose);
  await updateTextFieldIfChanged('#data-print-book-keywords-2', book.keyword2, "keyword 2", page, book, verbose);
  await updateTextFieldIfChanged('#data-print-book-keywords-3', book.keyword3, "keyword 3", page, book, verbose);
  await updateTextFieldIfChanged('#data-print-book-keywords-4', book.keyword4, "keyword 4", page, book, verbose);
  await updateTextFieldIfChanged('#data-print-book-keywords-5', book.keyword5, "keyword 5", page, book, verbose);
  await updateTextFieldIfChanged('#data-print-book-keywords-6', book.keyword6, "keyword 6", page, book, verbose);


  // Categories. First figure out which categories should be used.
  let categoryNeedsUpdate = false;
  let hasNewCategories = book.newCategory1 != '' || book.newCategory2 != '' || book.newCategory3 != '';

  if (hasNewCategories) {
    if (await getTextFieldValue("#section-categories ul li:nth-child(1) input[type='hidden']", page) == '' ||
      await getTextFieldValue("#section-categories ul li:nth-child(2) input[type='hidden']", page) == '' ||
      await getTextFieldValue("#section-categories ul li:nth-child(3) input[type='hidden']", page) == '') {
      debug(book, verbose, "Need to init categories");
      await initCategories(page, book, verbose);
      categoryNeedsUpdate = true;
    }
    if (await updateHiddenTextField("#section-categories ul li:nth-child(1) input[type='hidden']", book.newCategory1, 'category 1', page, book, verbose)) {
      categoryNeedsUpdate = true;
    }
    if (await updateHiddenTextField("#section-categories ul li:nth-child(2) input[type='hidden']", book.newCategory2, 'category 2', page, book, verbose)) {
      categoryNeedsUpdate = true;
    }
    if (await updateHiddenTextField("#section-categories ul li:nth-child(3) input[type='hidden']", book.newCategory3, 'category 3', page, book, verbose)) {
      categoryNeedsUpdate = true;
    }
  } else {
    // Old categories - this field is unusual. We just fill the value we need in a hidden field
    // because manually navigating throught the selection tree woudl be tons of work.
    await waitForElements(page, [
      '#data-print-book-categories-1-bisac',
      '#data-print-book-categories-2-bisac',
    ]);
    const category1 = isNew ? '' : (await page.$eval('#data-print-book-categories-1-bisac', x => (x as HTMLInputElement).value)) || '';
    const category2 = isNew ? '' : (await page.$eval('#data-print-book-categories-2-bisac', x => (x as HTMLInputElement).value)) || '';
    const hasCategoriesSorted = [category1, category2].filter((x) => x != null && x != '').sort();
    const needCategoriesSorted = [book.category1, book.category2].filter((x) => x != null && x != '').sort();
    categoryNeedsUpdate = !arraysEqual(hasCategoriesSorted, needCategoriesSorted);

    if (isNew || categoryNeedsUpdate) {
      debug(book, verbose, 'Updating categories');
      let id = '#data-print-book-categories-1-bisac';
      await page.$eval(id, (el: HTMLInputElement, book: Book) => {
        if (el) {
          el.value = book.category1;
        } else {
          error(book, 'Could not update category 1');
          throw Error('Could not update category 1');
        }
      }, book);
      id = '#data-print-book-categories-2-bisac';
      await page.$eval(id, (el: HTMLInputElement, book: Book) => {
        if (el) {
          el.value = book.category2;
        } else {
          error(book, 'Could not update category 2');
          throw Error('Could not update category 2');
        }
      }, book);
    } else {
      debug(book, verbose, `Selecting categories - not needed, got ${category1}, ${category2}`);
    }
  }

  // Whether adult content
  // TODO: We only support non-adult content.
  await clickSomething('#data-print-book-is-adult-content input[value=\'false\']', 'non-adult content', page, book, verbose);

  // Check status of the book metadata
  {
    const id = '#book-setup-navigation-bar-details-link .a-alert-content';
    await page.waitForSelector(id);
    const metadataStatus = await page.$eval(id, x => x.textContent.trim()) || '';
    let isMetadataStatusOk = metadataStatus == 'Complete';
    debug(book, verbose, 'Book metadata status: ' + (isMetadataStatusOk ? 'OK' : metadataStatus));
  }

  // Save
  let isSuccess = true;
  await clickSomething('#save-announce', 'Save', page, book, verbose);
  if (isNew) {
    await page.waitForNavigation();
  } else {
    await page.waitForSelector('#potter-success-alert-bottom div div', { visible: true });
    await page.waitForTimeout(Timeouts.SEC_2);
  }

  if (isNew) {
    // Get id.
    const url = page.url();
    const splits = url.split('/');
    let index = splits.indexOf('paperback');
    if (index >= 0 && index + 1 < splits.length) {
      book.id = splits[index + 1];
      debug(book, verbose, 'Got book id: ' + book.id);
    } else {
      error(book, 'ERROR: could not get paperback id from url: ' + url);
      isSuccess = false;
    }
  }

  await maybeClosePage(params, page);
  return new ActionResult(isSuccess);
}

async function initCategories(page: Page, book: Book, verbose: boolean) {
  // Determine the dummy value first. It depends on book language.

  let dummyCategory = '';
  switch (book.language) {
    // The exact category does not matter. This is only to initialize to anything,
    // and will be overridden immediately. Pick anything that has at least 3 subcategories,
    // and ideally is notthing embarrasing, just in case due to some mistake it
    // becomes visible to users.
    case "English": dummyCategory = '{"level":0,"key":"Calendars","nodeId":"3248857011"}'; break;
    case "Polish": dummyCategory = '{"level":0,"key":"Beletrystyka","nodeId":"20788878031"}'; break;
    case "Spanish": dummyCategory = '{"level":0,"key":"Arte y fotografía","nodeId":"902486031"}'; break;
    case "German": dummyCategory = '{"level":0,"key":"Biografien & Erinnerungen","nodeId":"187254"}'; break;
    case "French": dummyCategory = '{"level":0,"key":"Beaux livres","nodeId":"293136011"}'; break;
    case "Italian": dummyCategory = '{"level":0,"key":"Diritto","nodeId":"508785031"}'; break;
    default:
      throw new Error("Setting categories for a book written in " + book.language + " is not supported yet");
  }

  await clickSomething('#categories-modal-button', 'Choose/Edit categories', page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_HALF);
  await selectValue('.a-popover-inner #react-aui-modal-content-1 select', dummyCategory, "First dummy Category", page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_HALF);
  await clickSomething('.a-popover-inner #react-aui-modal-content-1 .a-checkbox:nth-child(1) input', "First dummy Category", page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_HALF);
  await clickSomething('.a-popover-inner #react-aui-modal-content-1 .a-checkbox:nth-child(2) input', "Second dummy Category", page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_HALF);
  await clickSomething('.a-popover-inner #react-aui-modal-content-1 .a-checkbox:nth-child(3) input', "Third dummy Category", page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_HALF);
  await clickSomething('.a-popover-footer #react-aui-modal-footer-1 .a-button-primary button', 'Save', page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_HALF);
  await clickSomething('.a-popover-footer #react-aui-modal-footer-2 .a-button-primary button', 'Continue (to remove existing categories)', page, book, verbose);
  await page.waitForTimeout(Timeouts.SEC_HALF);
}