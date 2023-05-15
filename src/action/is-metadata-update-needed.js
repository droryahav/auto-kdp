import { debug, arraysEqual, removeSpacesInHtml } from '../utils.js';
import { Timeouts, Urls, maybeClosePage } from './utils.js';

export async function isMetadataUpdateNeeded(book, params) {
  const verbose = params.verbose;

  if (params.dryRun) {
    debug(book, verbose, 'Checking if metadata needs update (dry run)');
    return new ActionResult(true);
  }

  const url = Urls.EDIT_PAPERBACK_DETAILS.replace('$id', book.id);
  debug(book, verbose, 'Checking if metadata needs update at url: ' + url);
  const page = await params.browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Timeouts.MIN_1 });
  await page.waitForTimeout(Timeouts.SEC_2);  // Should not be needed, but just to be sure.

  let needsUpdate = false;

  // Title.
  const title = await page.$eval('#data-print-book-title', x => x.value)
  const titleNeedsUpdate = title != book.title;
  needsUpdate ||= titleNeedsUpdate;

  if (params.verbose) {
    debug(book, verbose, 'Checking title: ' + (titleNeedsUpdate ?
      "NEEDS UPDATE: got '" + title + "' but expecting '" + book.title + "'" : "OK"));
  }

  // Subtitle
  const subtitle = await page.$eval('#data-print-book-subtitle', x => x.value)
  const subtitleNeedsUpdate = subtitle != book.subtitle;
  needsUpdate ||= subtitleNeedsUpdate;

  if (params.verbose) {
    debug(book, verbose, 'Checking subtitle: ' + (subtitleNeedsUpdate ?
      "NEEDS UPDATE: got '" + subtitle + "' but expecting '" + book.subtitle + "'" : "OK"));
  }

  // Series title.
  const seriesTitle = (await page.$eval('#series_title', x => x.value)) || '';
  const seriesTitleNeedsUpdate = seriesTitle != book.seriesTitle;
  needsUpdate ||= seriesTitleNeedsUpdate;

  if (params.verbose) {
    debug(book, verbose, 'Checking series title: ' + (seriesTitleNeedsUpdate ?
      "NEEDS UPDATE: got '" + seriesTitle + "' but expecting '" + book.seriesTitle + "'" : "OK"));
  }

  // Author first name.
  const authorFirstName = await page.$eval('#data-print-book-primary-author-first-name', x => x.value);
  const authorFirstNameNeedsUpdate = authorFirstName != book.authorFirstName;
  needsUpdate ||= authorFirstNameNeedsUpdate;
  debug(book, verbose, 'Checking author first name: ' + (authorFirstNameNeedsUpdate ?
    "NEEDS UPDATE: got '" + authorFirstName + "' but expecting '" + book.authorFirstName + "'" : "OK"));

  // Author last name.
  const authorLastName = await page.$eval('#data-print-book-primary-author-last-name', x => x.value);
  const authorLastNameNeedsUpdate = authorLastName != book.authorLastName;
  needsUpdate ||= authorLastNameNeedsUpdate;
  debug(book, verbose, 'Checking author last name: ' + (authorLastNameNeedsUpdate ?
    "NEEDS UPDATE: got '" + authorLastName + "' but expecting '" + book.authorLastName + "'" : "OK"));

  // Illustrator first name.
  const illustratorFirstName = await page.$eval('#data-print-book-contributors-0-first-name', x => x.value);
  const illustratorFirstNameNeedsUpdate = illustratorFirstName != book.illustratorFirstName;
  needsUpdate ||= illustratorFirstNameNeedsUpdate;
  debug(book, verbose, 'Checking illustrator first name: ' + (illustratorFirstNameNeedsUpdate ?
    "NEEDS UPDATE: got '" + illustratorFirstName + "' but expecting '" + book.illustratorFirstName + "'" : "OK"));

  // Illustrator last name.
  const illustratorLastName = await page.$eval('#data-print-book-contributors-0-last-name', x => x.value);
  const illustratorLastNameNeedsUpdate = illustratorLastName != book.illustratorLastName;
  needsUpdate ||= illustratorLastNameNeedsUpdate;
  debug(book, verbose, 'Checking illustrator last name: ' + (illustratorLastNameNeedsUpdate ?
    "NEEDS UPDATE: got '" + illustratorLastName + "' but expecting '" + book.illustratorLastName + "'" : "OK"));

  // Illustrator role.
  const expectedIllustratorRole = 'illustrator';
  const illustratorRole = await page.$eval('#data-print-book-contributors-0-role-native', x => x.value);
  const illustratorRoleNeedsUpdate = illustratorRole != expectedIllustratorRole;
  needsUpdate ||= illustratorRoleNeedsUpdate;
  debug(book, verbose, 'Checking illustrator role: ' + (illustratorRoleNeedsUpdate ?
    "NEEDS UPDATE: got '" + illustratorRole + "' but expecting '" + expectedIllustratorRole + "'" : "OK"));

  // Description.
  await page.click('#cke_18'); // Click button 'source'
  const description = await page.$eval('#cke_1_contents > textarea', x => x.value);
  const gotDescription = removeSpacesInHtml(description);
  const expDescription = removeSpacesInHtml(book.description);
  const descriptionNeedsUpdate = gotDescription != expDescription;
  needsUpdate ||= descriptionNeedsUpdate;
  debug(book, verbose, 'Checking description: ' + (descriptionNeedsUpdate ?
    "NEEDS UPDATE: got description:\n--\n" + gotDescription + "\n--\nbut expecting description\n--\n" + expDescription + "\n--\n" : "OK"));

  // TODO: Check Whether public domain

  // Keywords
  const keyword0 = await page.$eval('#data-print-book-keywords-0', x => x.value);
  const keyword0NeedsUpdate = keyword0 != book.keyword0;
  needsUpdate ||= keyword0NeedsUpdate;
  debug(book, verbose, 'Checking keyword0: ' + (keyword0NeedsUpdate ?
    "NEEDS UPDATE: got '" + keyword0 + "' but expecting '" + book.keyword0 + "'" : "OK"));

  const keyword1 = await page.$eval('#data-print-book-keywords-1', x => x.value);
  const keyword1NeedsUpdate = keyword1 != book.keyword1;
  needsUpdate ||= keyword1NeedsUpdate;
  debug(book, verbose, 'Checking keyword1: ' + (keyword1NeedsUpdate ?
    "NEEDS UPDATE: got '" + keyword1 + "' but expecting '" + book.keyword1 + "'" : "OK"));

  const keyword2 = await page.$eval('#data-print-book-keywords-2', x => x.value);
  const keyword2NeedsUpdate = keyword2 != book.keyword2;
  needsUpdate ||= keyword2NeedsUpdate;
  debug(book, verbose, 'Checking keyword2: ' + (keyword2NeedsUpdate ?
    "NEEDS UPDATE: got '" + keyword2 + "' but expecting '" + book.keyword2 + "'" : "OK"));

  const keyword3 = await page.$eval('#data-print-book-keywords-3', x => x.value);
  const keyword3NeedsUpdate = keyword3 != book.keyword3;
  needsUpdate ||= keyword3NeedsUpdate;
  debug(book, verbose, 'Checking keyword3: ' + (keyword3NeedsUpdate ?
    "NEEDS UPDATE: got '" + keyword3 + "' but expecting '" + book.keyword3 + "'" : "OK"));

  const keyword4 = await page.$eval('#data-print-book-keywords-4', x => x.value);
  const keyword4NeedsUpdate = keyword4 != book.keyword4;
  needsUpdate ||= keyword4NeedsUpdate;
  debug(book, verbose, 'Checking keyword4: ' + (keyword4NeedsUpdate ?
    "NEEDS UPDATE: got '" + keyword4 + "' but expecting '" + book.keyword4 + "'" : "OK"));

  const keyword5 = await page.$eval('#data-print-book-keywords-5', x => x.value);
  const keyword5NeedsUpdate = keyword5 != book.keyword5;
  needsUpdate ||= keyword5NeedsUpdate;
  debug(book, verbose, 'Checking keyword5: ' + (keyword5NeedsUpdate ?
    "NEEDS UPDATE: got '" + keyword5 + "' but expecting '" + book.keyword5 + "'" : "OK"));

  const keyword6 = await page.$eval('#data-print-book-keywords-6', x => x.value);
  const keyword6NeedsUpdate = keyword6 != book.keyword6;
  needsUpdate ||= keyword6NeedsUpdate;
  debug(book, verbose, 'Checking keyword6: ' + (keyword6NeedsUpdate ?
    "NEEDS UPDATE: got '" + keyword6 + "' but expecting '" + book.keyword6 + "'" : "OK"));

  const category1 = (await page.$eval('#data-print-book-categories-1-bisac', x => x.value)) || '';
  const category2 = (await page.$eval('#data-print-book-categories-2-bisac', x => x.value)) || '';

  const hasCategoriesSorted = [category1, category2].filter((x) => x != null && x != '').sort();
  const needCategoriesSorted = [book.category1, book.category2].filter((x) => x != null && x != '').sort();
  const categoryNeedsUpdate = !arraysEqual(hasCategoriesSorted, needCategoriesSorted);
  needsUpdate ||= categoryNeedsUpdate;
  debug(book, verbose, 'Checking categories: ' + (categoryNeedsUpdate ?
    "NEEDS UPDATE: got categories '" + hasCategoriesSorted.toString() +
    " but expecting '" + needCategoriesSorted + "'" : "OK"));

  debug(book, verbose, 'Needs update: ' + needsUpdate);

  await maybeClosePage(params, page);
  return new ActionResult(true).setNextActions('book-metadata:pricing:publish:scrape');
}

