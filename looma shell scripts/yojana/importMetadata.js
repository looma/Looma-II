// mongo terminal program "importMetadata."
// YOJANA version
/*
importMetadata.js updates (and conditionally inserts) documents in the activities collection
  from a TSV file.

  LOOKUP - a fallback chain. Each present value is matched (plus ft) in priority order, stopping
  at the first that matches an activity (only a ZERO-result lookup falls through to the next):

      filename values, tried first (most unique):  fn column -> nfn column -> fn from url
          each matched against BOTH the fn and nfn fields.
      display-name values, tried next:             dn column -> ndn column
          each matched against BOTH the dn and ndn fields.

  All matching is CASE-INSENSITIVE and treats runs of space/underscore as interchangeable, so
  "Haat Bazaar.jpg", "Haat_Bazaar.JPG" and "haat_bazaar.jpg" are the same key. ft must match too
  (and the extension's case never matters).

      exactly 1 match -> UPDATE (stamps modified_date)
      2+ matches      -> DUPLICATE (logged, skipped)
      no match        -> INSERT (stamps created_date), but ONLY if the row has an fn or nfn COLUMN;
                         otherwise SKIPPED (a new activity needs a real filename in the sheet).

  param: 'run' writes to the DB, otherwise dry run.   allowInsert: false -> update-only.
*/
//      core columns:
//        fields[0..1]: dn ndn | [2..6] ch_id.1-5 | [7..9] cl_lo cl_hi lang
//        [10..13] key1-4 | [14..16] fn nfn ft | [17+] fp, src, ... url (scanned for ?fn=)
//
//  start MONGO in LOOMA db with: 'mongo looma'
//  run with: load('importMetadata_New.js')
//
//"use strict";

var requestcount = 0;
var changecount  = 0;   // existing activities updated
var insertcount  = 0;   // new activities inserted
var duplicates   = 0;
var skippedcount = 0;   // rows that did nothing (no key, or no-match with no fn/nfn to insert)

var allowInsert = true;   // set false for update-only behaviour

//  OPTIONAL: set a lot before loading, and every inserted/updated activity gets a "lot" prop:
//      var lot = 'SPHS II Lot 4';  var param = 'dryrun';  load('importMetadata_New.js')
//  Leave it undefined (or '') and no lot field is written, and any existing lot is left alone.
var LOT = (typeof lot !== 'undefined' && lot !== null) ? ('' + lot).trim() : '';

//  OPTIONAL (used by the batch wrapper batchImportTsv.js):
//    quiet=true          -> suppress the header, per-row lines, and summary (wrapper prints its own)
//    show_duplicates='yes' -> still print the duplicate lines even when quiet
//  When run directly (quiet not set) the script prints everything as before.
var QUIET    = (typeof quiet !== 'undefined' && quiet === true);
var SHOW_DUP = (typeof show_duplicates !== 'undefined' && show_duplicates === 'yes');


function today () {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    return `${yyyy} ${mm} ${dd}`;
};


//  date AND time, e.g. "2026 07 13 14:35:07"  (same date format as today(), plus a clock)
function nowStamp () {
    const n = new Date();
    const yyyy = n.getFullYear();
    const mm   = String(n.getMonth() + 1).padStart(2, '0');
    const dd   = String(n.getDate()).padStart(2, '0');
    const HH   = String(n.getHours()).padStart(2, '0');
    const MI   = String(n.getMinutes()).padStart(2, '0');
    const SS   = String(n.getSeconds()).padStart(2, '0');
    return `${yyyy} ${mm} ${dd} ${HH}:${MI}:${SS}`;
};


//  Spreadsheets export any field containing a comma (or a quote/newline) wrapped in double
//  quotes, CSV-style:   सामान्य_धातु,_...jpg   ->   "सामान्य_धातु,_...jpg"
//  Strip that wrapping, and un-double any escaped quotes inside ("" -> ").
//  Without this, a comma in a filename or title silently breaks every lookup.
function dequote (s) {
    if (s === undefined || s === null) return '';
    var v = ('' + s).trim();
    if (v.length >= 2 && v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') {
        v = v.substring(1, v.length - 1).replace(/""/g, '"');
    }
    return v.trim();
};


//  tidy a display name: strip leading/trailing whitespace and collapse any internal
//  run of whitespace down to a single space.   "  a   b  " -> "a b"
function cleanName (s) {
    if (s === undefined || s === null) return '';
    return ('' + s).replace(/\s+/g, ' ').trim();
};


function setField(document, key, raw) {
    if (raw === undefined || raw === null) return;
    var v = ('' + raw).trim();
    if (v) document[key] = v;
}


function fnFromUrl(fields) {
    for (var i = 17; i < fields.length; i++) {
        var c = fields[i];
        if (c && /[?&]fn=/.test(c)) {
            var m = c.match(/[?&]fn=([^&]+)/);
            if (m) { try { return decodeURIComponent(m[1]).trim(); } catch (e) { return m[1].trim(); } }
        }
    }
    return '';
}


//  normalized comparison key: lowercase, runs of space/underscore -> single underscore
function normKey(s) {
    return ('' + s).toLowerCase().replace(/[ _]+/g, '_');
}


//  add a value to a list once (de-duplicated on its normalized key, blanks skipped)
function addUnique(arr, val, seen) {
    if (!val) return;
    var k = normKey(val);
    if (seen[k]) return;
    seen[k] = true;
    arr.push(val);
}


//  anchored, case-insensitive regex that also treats runs of space/underscore as interchangeable.
//  used so a sheet value matches the DB regardless of letter case or space-vs-underscore.
function looseRegex(name) {
    var esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');   // escape regex metacharacters
    esc = esc.replace(/[ _]+/g, '[ _]+');                    // space/underscore runs -> flexible
    return new RegExp('^' + esc + '$', 'i');                 // anchored, case-insensitive
}


//  write all metadata columns onto a document (used by both update and insert).
function applyMetadata(document, fields) {
    document['date'] = today();

    //  display names: trimmed, internal whitespace runs collapsed to one space
    setField(document, 'dn',  cleanName(fields[0]));
    setField(document, 'ndn', cleanName(fields[1]));

    //  optional lot, written only when the caller set one
    if (LOT) document['lot'] = LOT;

    //  ch_id is SET exactly from the sheet's ch_id1..ch_id5 (fields 2-6), not appended:
    //    - the non-blank ch_id cells (de-duplicated, order preserved) become the ch_id array
    //    - if the sheet has NO ch_id values for this row, ch_id is removed from the document
    var chids = [];
    var chseen = {};
    for (var ci = 2; ci <= 6; ci++) {
        var cv = ('' + (fields[ci] || '')).trim();
        if (cv && !chseen[cv]) { chseen[cv] = true; chids.push(cv); }
    }
    if (chids.length) document['ch_id'] = chids;
    else              delete document['ch_id'];

    setField(document, 'cl_lo', fields[7]);
    setField(document, 'cl_hi', fields[8]);
    setField(document, 'lang',  fields[9]);

    setField(document, 'key1', fields[10]);
    setField(document, 'key2', fields[11]);
    setField(document, 'key3', fields[12]);
    setField(document, 'key4', fields[13]);

    setField(document, 'nfn', fields[15]);

    return document;
}


var input = (typeof infile !== 'undefined' && infile) ? ('' + infile)
                                                       : 'data files/metadataToImport_New.tsv';
if (!QUIET) {
    print ('Importing from file: ' + input);
    print (LOT ? 'lot: "' + LOT + '"  (written to every inserted/updated activity)'
               : 'lot: (not set - no lot field will be written)');
}

var file = cat(input);
var lines = file.split(/[\r\n]+/);
if (!QUIET) print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    if (!doc.trim()) return; // skip empty lines
    requestcount++;

    //  split on tabs, then strip CSV-style quoting from EVERY field.
    //  (a comma anywhere in a cell makes the spreadsheet wrap that cell in double quotes)
    var fields = doc.split('\t');
    for (var q = 0; q < fields.length; q++) fields[q] = dequote(fields[q]);

    var dn  = cleanName(fields[0]);
    var ndn = cleanName(fields[1]);
    var ft  = (fields[16] || '').trim().toLowerCase(); if (ft === 'ep') ft = "EP";
    var fn  = (fields[14] || '').trim();   // English filename column
    var nfn = (fields[15] || '').trim();   // Nepali filename column
    var urlFn = fnFromUrl(fields);         // filename recovered from the url, if any

    //  collect the values to try, de-duplicated. filename values first, then display-name values.
    var seen = {};
    var fileVals = [];
    addUnique(fileVals, fn,    seen);      // 1. English filename column
    addUnique(fileVals, nfn,   seen);      // 2. Nepali filename column
    addUnique(fileVals, urlFn, seen);      // 3. filename recovered from the url
    var nameVals = [];
    addUnique(nameVals, dn,    seen);      // 4. English display name
    addUnique(nameVals, ndn,   seen);      // 5. Nepali display name

    var label = fn || nfn || urlFn || dn || ndn || '';

    if ((fileVals.length === 0 && nameVals.length === 0) || !ft) {
        print(requestcount + '   SKIPPED: no fn/nfn/url/dn/ndn or no ft  (dn="'+dn+'" ndn="'+ndn+'" ft="'+ft+'")');
        skippedcount++;
        return;
    }

    //  ordered lookups: filename values matched against {fn|nfn}, then name values against {dn|ndn}.
    var lookups = [];
    for (var i = 0; i < fileVals.length; i++) lookups.push({ 'kind': 'file', 'value': fileVals[i] });
    for (var i = 0; i < nameVals.length; i++) lookups.push({ 'kind': 'name', 'value': nameVals[i] });

    //  walk the chain: the first lookup that returns >=1 activity decides the outcome.
    var matched = null, multi = false, matchedOn = '';
    for (var i = 0; i < lookups.length; i++) {
        var rx = looseRegex(lookups[i]['value']);
        var q;
        if (lookups[i]['kind'] === 'file') q = { 'ft': ft, '$or': [ { 'fn': rx }, { 'nfn': rx } ] };
        else                               q = { 'ft': ft, '$or': [ { 'dn': rx }, { 'ndn': rx } ] };

        var cur = db.activities.find(q);
        if (cur.hasNext()) {
            matchedOn = lookups[i]['kind'] + ' "' + lookups[i]['value'] + '"';
            if (cur.count() > 1) { multi = true; }
            else { matched = cur.next(); }
            break;                       // stop at first lookup with any result; only 0 falls through
        }
    }

    if (multi) {
        if (!QUIET || SHOW_DUP)
            print('*************NOTE: duplicate ACTIVITY FOUND, id = ' + label + '  (matched on ' + matchedOn + ', ft ' + ft + ', 2+ docs, skipped)');
        duplicates++;

    } else if (matched) {
        applyMetadata(matched, fields);
        matched['modified_date'] = nowStamp();          // stamp on every update (date + time)
        if (param === 'run') db.activities.replaceOne({_id: matched._id}, matched);
        changecount++;

    } else {
        //  no key matched -> candidate for insert, but ONLY if the row has a real filename column
        if (fn || nfn) {
            if (allowInsert) {
                var seed = { 'ft': ft };
                if (fn) seed['fn'] = fn;                 // English filename column (nfn set by applyMetadata)
                var newDoc = applyMetadata(seed, fields);
                newDoc['created_date'] = today();        // stamp once, at creation
                // print(JSON.stringify(newDoc, null, 2));   // uncomment to inspect the doc to be inserted

                if (param === 'run') {
                    db.activities.insertOne(newDoc);
                    if (!QUIET) print(requestcount + ' + + ' + label + ' + + ft: ' + ft + '       INSERTED new activity');
                } else {
                    if (!QUIET) print(requestcount + ' + + ' + label + ' + + ft: ' + ft + '       WOULD INSERT (dryrun)');
                }
                insertcount++;
            } else {
                if (!QUIET) print(requestcount + ' - - ' + label + ' - - ft: ' + ft + '       NOT FOUND (insert disabled)');
                skippedcount++;
            }
        } else {
            if (!QUIET) print(requestcount + '   SKIPPED: not found and no fn/nfn column to insert  (id="' + label + '" ft="' + ft + '")');
            skippedcount++;
        }
    }
});  // end foreach doc

if (!QUIET) {
    print('');
    print('+++++  ' + requestcount + '  lines processed');
    if (param === 'run') {
        print('+++++  ' + changecount + '  existing activities updated');
        print('+++++  ' + insertcount + '  new activities inserted');
    } else {
        print('+++++  DRYRUN: ' + changecount + '  updates would have been made');
        print('+++++  DRYRUN: ' + insertcount + '  inserts would have been made');
    }
    print('+++++  ' + duplicates   + '  duplicates found');
    print('+++++  ' + skippedcount + '  skipped (no key, or no-match with no fn/nfn)');
}