# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Looma is an offline-first educational platform for Nepali schools (Looma Education Company): the official
Nepali textbooks plus a large media library, a lesson builder/presenter, a bilingual English/Nepali
dictionary, and a set of teaching tools and games. It ships as a solar-powered "Looma Box" with a
projector, as a school-lab server, and online at looma.website. Everything is server-rendered PHP +
jQuery against MongoDB — no build step, no bundler, no package.json.

The 64+GB of media ("content") is **not** in this repo. It lives in a sibling directory referenced
throughout the code as `../content` (i.e. `/usr/local/var/www/content`).

## Running it

### This machine (the normal dev loop)

Homebrew Apache + PHP module + local mongod, serving the repo directly at `http://localhost/`:

```bash
brew services restart httpd     # after any httpd.conf change
brew services list              # check httpd / mongodb-community are running
mongosh --quiet looma           # inspect the database
tail -f /usr/local/var/log/httpd/error_log
```

Apache config is **outside the repo** at `/opt/homebrew/etc/httpd/httpd.conf`
(`DocumentRoot ${document_root}/Looma`, `ServerName looma-laptop`). `docker_httpd.conf` and
`includes/httpd.conf` in the repo are the container/production copies — editing them does nothing
locally. `AllowOverride None` is set everywhere, so **`.htaccess` files are ignored**.

Two consequences worth knowing before debugging a "broken" page:

- **Clean URLs come from RewriteRules in that httpd.conf**, not from the repo (`home` →
  `looma-home.php`, `lesson` → `looma-play-lesson.php`, `search` → `looma-library-search.php`, …).
  A new user-facing page needs a rule added there, or it must be linked as `looma-foo.php`.
- **The first request to any page returns a cookie bootstrap, not the page.** `includes/header.php`
  sets the `source` and `theme` cookies, sends `Refresh:0`, and `exit`s. So `curl` and headless-Chrome
  fetches look truncated unless you pass the cookies:

```bash
curl -s -b "source=looma-laptop;theme=looma-laptop" "http://localhost/looma-epaath.php?ole=are&lang=english&grade=3"
```

### Docker (what README.md documents for other people)

```bash
./looma build      # == make all; builds loomaweb + loomadb images
./looma run        # docker compose up -d
./looma status
./looma shutdown
make shell-web     # or: docker exec -ti looma-web /bin/bash
make logs-web
```

Web on `localhost:48080`, MongoDB on `localhost:47017`. `docker-compose.yml` bind-mounts the repo plus
`../content`, `../maps2018`, `../ePaath` read-only. The container sets `DOCKER=1`, which
`includes/mongo-connect.php` uses to switch the Mongo host to `looma-db:27017`.

### Tests, lint, build

There are none, and there is no CI. `looma-test-*.php`, `js/looma-*test*.js`, and `grid-test.php` are
hand-run scratch pages in the browser, not a suite. `.jshintrc` and `.jscsrc` exist but no runner is
wired up. Verification is: load the affected page in a browser and exercise it. `looma-info.php`
(`/info`) is the built-in diagnostics page — versions, screen size, IP, OS, Mongo/PHP/PDF.js versions.

Releases: bump `includes/looma-version` (a one-line string, displayed on `/info`) and add an entry to
`CHANGE LOG`.

## Architecture

### Every page has the same skeleton

`looma-template.php` is the canonical example; copy it when adding a page.

```php
<?php $page_title = '...'; include('includes/header.php');   // cookies, $LOOMA_SERVER, CSS, translate, logging
      require_once('includes/looma-utilities.php'); ?>       // makeButton(), thumbnail(), keyword() helpers
<body>
  <div id="main-container-horizontal"><div id="fullscreen"> ...page body, PHP-generated... </div></div>
  <?php include('includes/toolbar.php');      // global nav
        include('includes/js-includes.php');  // jQuery, looma-utilities.js, looma.js, screenfull, keyboard
  ?>
  <script src="js/looma-<page>.js"></script>
</body>
```

`includes/header.php` derives a global `$LOOMA_SERVER` from `$_SERVER['SERVER_NAME']`
(`looma.website`, `learning.cehrd.edu.np` → `CEHRD`, `india.looma.website` → `INDIA`,
`test.looma.website`, else local). That one variable drives the theme stylesheet
(`css/looma-theme-<server>.css`), the timezone, `error_reporting` (on for local/test, off for
production), and content filtering (`CEHRDfilter()` in mongo-connect.php hides `../content/CEHRD/*`
from non-CEHRD servers). Convention is `looma-foo.php` (markup + server-side data) paired with
`js/looma-foo.js` (behavior) and `css/looma-foo.css`.

### Database access goes through one shim

`includes/mongo-connect.php` is the only place that touches the driver. It:

- picks the autoloader at runtime — `vendorPHP8/` for PHP ≥ 8.1, `vendor/` otherwise (`vendorPHP7/` is
  dead). `composer*.json` variants are historical; don't re-run composer casually.
- exposes `mongoFind/FindOne/FindRandom/Distinct/Count/Insert/Upsert/Update/UpdateMany/FindAndModify/
  DeleteOne/DeleteMany/Regex/Id`, each branching on `$mongo_level` (major driver version) to support
  old and new Mongo.
- **gates every write on `loggedIn()`** (a `login` cookie; `login-level` for privilege). Write helpers
  silently `return null` when not logged in, except for the logging collections. A save that
  "does nothing" is usually this.
- creates globals for every collection (`$activities_collection`, `$chapters_collection`, …) plus the
  `$collections` / `$localcollections` name→collection maps.

Four databases: **looma** (content: activities, chapters, textbooks, dictionary, lessons, slideshows,
games, maps, text_files, histories, edited_videos…), **loomalocal** (school-authored copies of the same
shapes — many endpoints take a `db` request param selecting `looma` vs `loomalocal`), **activitylog**
(usage counters written by `logPageHit()` / `logFiletypeHit()` from `includes/looma-log-user-activity.php`),
**loomausers** (logins).

### The `activities` collection is the index; `ft` is the dispatch key

An `activities` document is a lightweight pointer/button record. Common fields:

| field | meaning |
|---|---|
| `ft` | filetype — the central discriminator (`video`, `pdf`, `epaath`/`EP`, `html`, `lesson`, `slideshow`, `game`, `map`, `text`, `chapter`, `worksheet`, `evi`, `history`, …) |
| `fp`, `fn` | file path (`../content/videos/`) and filename, for file-backed types |
| `mongoID`, `db` | for DB-backed types: the `_id` of the real document in `lessons`/`slideshows`/`games`/… and which database it's in |
| `dn`, `ndn` | display name in English / Nepali |
| `ch_id` | chapter this is registered to |

Chapters are keyed by `ch_id` as `_id` (e.g. `5M01`, `3M05.01`): grade + subject code
(`EN M S SS N H V CS`, `a` suffix for "additional") + chapter number. The regex lives in
`js/looma-utilities.js` as `LOOMA.CH_IDregex`.

Lessons hold an ordered `data[]` timeline whose entries are either inline rich-text
(`{ft:'inline', html, nepali}`) or references (`{collection:'activities', id:'<oid>'}`).
`looma-play-lesson.php` renders the timeline of buttons; `js/looma-play-lesson.js`'s `play($item)`
switch instantiates the right viewer into `#viewer` when one is clicked.

**Adding or changing a filetype means touching several parallel switch statements** that must stay in
agreement — the PHP and JS copies of the same logic:

- `includes/looma-utilities.php` — `makeButton()` default paths, `thumbnail()`
- `js/looma-utilities.js` — `LOOMA.filepath()`, `LOOMA.thumbnail()`, `LOOMA.fallbackIcon()`, `LOOMA.typename()`
- `js/looma-play-lesson.js` — the `play()` switch
- plus a `looma-play-<type>.php` standalone viewer and usually a RewriteRule

### AJAX endpoints are `?cmd=` switches

There is no REST layer. Server-side commands live in a handful of `looma-*-utilities.php` files, each a
big `switch ($_REQUEST['cmd'])` that `echo json_encode(...)`:

- `looma-database-utilities.php` — the workhorse: `search`, `open`/`openByID`/`openByName`, `save`,
  `updateByID`, `deleteField`, `rename`, `delete`, `exists`, `bookList`, `keywordAdd`,
  `addChapterID`/`removeChapterID`, `uploadFile`, `download`, `sendMail`, `getLogData`…
- `looma-library-utilities.php` — filesystem browsing of `../content` (`open`, `list`), and whether each
  file `isRegistered()` in `activities`
- `looma-dictionary-utilities.php` — word lookup/list/update/delete
- `looma-game-utilities.php`

Client-side wrappers are methods on the `LOOMA` namespace object in `js/looma-utilities.js` (`LOOMA.wordlist`,
`LOOMA.dictionaryUpdate`, `LOOMA.download`, …) — prefer adding a wrapper there over a raw `$.ajax` in a page.
`js/looma-utilities.js` also owns the shared UI vocabulary: `LOOMA.alert/confirm/prompt` (in-page popups,
never `window.alert`), `LOOMA.speak` (TTS), `LOOMA.toggleFullscreen`, `LOOMA.makeTransparent/makeOpaque`
(dimming behind popups), `LOOMA.setStore/readStore` (cookie / localStorage / sessionStorage),
`LOOMA.makeActivityButtonFromId`.

### Bilingual UI is structural, not a lookup at render time

Every label is emitted as *both* languages and toggled with CSS classes:

- PHP: `keyword('Chapters')` / `tooltip('Home')` (`includes/looma-translate.php`) emit paired
  `.english-keyword` / `.native-keyword` spans, looking the Nepali up in the `$TKW` array in
  `includes/looma-translations.php`.
- JS: `LOOMA.translatableSpans(english, nepali)` for strings built at runtime.
- The toolbar flag button calls `LOOMA.translate(language)`, which flips visibility of the two span
  classes page-wide, swaps video caption tracks, and persists `language` in a cookie.

So: **never hardcode a bare user-facing English string.** Add it to `$TKW` and use `keyword()`, or build
it with `LOOMA.translatableSpans()`. Content documents carry their own `ndn`/`nepali` fields for the
same reason.

### Onscreen keyboard

`js/looma-keyboard.js` adds a Devanagari/English keyboard for touch and projector use on any page that
has typable inputs. It writes into a "destination" input, and reaches into **same-origin iframes** so it
can fill in the answer boxes of ePaath/HTML activities — which is why activities must be hosted in an
`<iframe>` rather than an `<embed>`. It also relocates itself into `document.fullscreenElement` while
fullscreen is active.

## Working in this codebase

- **Check which copy of a file is actually live before editing.** The repo carries many parallel
  versions: `*NEW.php` (`looma-historyNEW.php`, `includes/mongo-connectNEW.php`,
  `includes/headerNEW.php`), `*GOOD`, `*SKIP`, `*OLD`, `includes/looma-search copy.php`, and four
  jQuery builds in `js/`. Grep for the include/`<script src>` that references it — some `*NEW` files
  are abandoned drafts that point at paths which no longer exist.
- Style follows `.editorconfig` / `.jscsrc`: 4-space indent, LF, UTF-8, single-quoted JS,
  trailing newline. The existing code is ES5-era jQuery with `var` and comment banners per function —
  match it rather than modernizing.
- PHP pages freely use globals set up by the includes (`$activities_collection`, `$LOOMA_SERVER`,
  `$TKW`, `$documentroot`); that's the established pattern here.
- `looma shell scripts/` holds one-off `mongosh`/shell content-migration scripts and data files from
  past bulk imports — useful as precedent for data surgery, not part of the running app.
