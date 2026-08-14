// batchImportTsv.js
//
// Runs importMetadata_New.js once per .tsv file found in a folder.
// The LOT for each file is the file's name without ".tsv"
//     "the lot iv.tsv"  ->  lot = "the lot iv"
//
// It drives the main importer (importMetadata_New.js) - it does NOT re-implement it.
//
// VARIABLES you can set before loading:
//   var param = 'dryrun'|'run'      dryrun (default) writes nothing; 'run' applies changes.
//   var tsv_dir = '.'               folder to scan for .tsv files (default: current directory).
//   var show_duplicates = 'yes'     print every duplicate found per file (default: no, summary only).
//
// USAGE:
//   var param = 'dryrun'; load('batchImportTsv.js')                 <- see files + counts
//   var param = 'dryrun'; var show_duplicates = 'yes'; load('batchImportTsv.js')
//   var param = 'run';    load('batchImportTsv.js')                 <- apply, all files
//
// REQUIRES the legacy mongo shell (listFiles / cat).  BACK UP before 'run'.
//

var IMPORTER = 'importMetadata_New.js';
var DIR      = (typeof tsv_dir !== 'undefined' && tsv_dir) ? ('' + tsv_dir) : '.';
var RUN      = (typeof param !== 'undefined' && param === 'run');
var SHOW_DUP = (typeof show_duplicates !== 'undefined' && show_duplicates === 'yes');

print(RUN ? '*** BATCH MODE: RUN - changes WILL be written ***'
    : '*** BATCH MODE: DRYRUN - nothing will be written ***');
print('scanning folder: ' + DIR + '   (duplicates: ' + (SHOW_DUP ? 'shown' : 'counted only') + ')');
print('');

// ---------------------------------------------------------------------------
// enumerate .tsv files
// ---------------------------------------------------------------------------
if (typeof listFiles !== 'function') {
    print('!! listFiles() is not available in this shell - this needs the legacy `mongo` shell.');
    print('   (You can still run the importer per file by hand: var infile=..; var lot=..; load(\'' + IMPORTER + '\'))');
} else {

    var entries = listFiles(DIR);
    var tsvs = [];
    entries.forEach(function (e) {
        if (e.isDirectory) return;
        var base = e.baseName || ('' + e.name).replace(/^.*\//, '');
        if (/\.tsv$/i.test(base)) tsvs.push({ path: e.name, base: base });
    });
    tsvs.sort(function (a, b) { return a.base < b.base ? -1 : (a.base > b.base ? 1 : 0); });

    print('found ' + tsvs.length + ' .tsv file(s):');
    for (var i = 0; i < tsvs.length; i++) {
        print('  ' + (i + 1) + '. ' + tsvs[i].base + '   -> lot "' + tsvs[i].base.replace(/\.tsv$/i, '') + '"');
    }
    print('');

    if (tsvs.length === 0) {
        print('  nothing to do.');
    } else {

        // ---------------------------------------------------------------
        // run the importer for each file, quietly, and aggregate
        // ---------------------------------------------------------------
        var totUpd = 0, totIns = 0, totDup = 0, totSkip = 0, totLines = 0, filesRun = 0;

        // per-file column header
        print('per-file result' + (RUN ? '' : ' (dryrun - would-be counts)') + ':');
        print('  ' + pad('file', 34) + pad('lines', 8) + pad('upd', 7) + pad('ins', 7) + pad('dup', 7) + pad('skip', 7));

        for (var i = 0; i < tsvs.length; i++) {
            // hand these to the importer via globals it already reads
            infile = tsvs[i].path;                       // input file override
            lot    = tsvs[i].base.replace(/\.tsv$/i, ''); // lot = filename without .tsv
            quiet  = true;                                // suppress the importer's own per-row/summary noise
            // param and show_duplicates are already global and read by the importer

            if (SHOW_DUP) { print(''); print('--- duplicates in "' + tsvs[i].base + '" ---'); }

            load(IMPORTER);                               // <-- runs the real importer for this file

            // the importer leaves its counters in these globals; read them before the next file
            filesRun++;
            totLines += requestcount;
            totUpd   += changecount;
            totIns   += insertcount;
            totDup   += duplicates;
            totSkip  += skippedcount;

            print('  ' + pad(tsvs[i].base, 34) + pad('' + requestcount, 8)
                + pad('' + changecount, 7) + pad('' + insertcount, 7)
                + pad('' + duplicates, 7) + pad('' + skippedcount, 7));
        }

        // ---------------------------------------------------------------
        // grand total
        // ---------------------------------------------------------------
        print('');
        print('=========================================================');
        print('  files processed:    ' + filesRun);
        print('  lines processed:    ' + totLines);
        if (RUN) {
            print('  activities updated: ' + totUpd);
            print('  activities inserted:' + totIns);
        } else {
            print('  would update:       ' + totUpd);
            print('  would insert:       ' + totIns);
        }
        print('  duplicates found:   ' + totDup + (SHOW_DUP ? '' : '   (set show_duplicates=\'yes\' to list them)'));
        print('  skipped:            ' + totSkip);
        if (!RUN) print('  --- DRYRUN: nothing was written. Set param=\'run\' to apply. ---');
        print('=========================================================');
    }
}

// right-pad helper for the little table
function pad(s, n) { s = '' + s; while (s.length < n) s += ' '; return s; }
