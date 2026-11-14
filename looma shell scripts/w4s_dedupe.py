"""Step 2 of the W4S de-duplication, run on the box 2026-11-09 (as root).
Backs up, relinks every W4S page that pointed at a duplicate to its W4S2013
twin (13648 links in 4512 pages), redirects or removes the Mongo activities
(31 redirected, 251 removed because the 2013 button existed), deletes the 1086
duplicate files. Backups: ~odroid/w4s-duplicates-backup-20261109.tgz and
~odroid/w4s-activities-backup-20261109.json.
usage: w4s_dedupe.py /tmp/w4s_final.json [--apply]"""
import json, os, re, sys, tarfile, urllib.parse, subprocess
ROOT = '/var/www/html/content'
APPLY = '--apply' in sys.argv
dup = json.load(open(sys.argv[1]))['dup']            # 'W4S/wp/g/X.htm' -> 'W4S2013/wp/g/Y.htm'
dup = {k: v for k, v in dup.items() if os.path.exists(os.path.join(ROOT, v))}
print('duplicates with an existing 2013 target:', len(dup))

# 1. backup
if APPLY:
    with tarfile.open('/home/odroid/w4s-duplicates-backup-20261109.tgz', 'w:gz') as t:
        for p in dup:
            t.add(os.path.join(ROOT, p), arcname=p)

# 2. rewrite links in every W4S page that points at a duplicate
href_re = re.compile(r'href="([^"#?:]+\.htm)(#[^"]*)?"')
files_changed = links_changed = 0
for d, _, fs in os.walk(os.path.join(ROOT, 'W4S')):
    for f in fs:
        if not f.endswith('.htm'):
            continue
        fp = os.path.join(d, f)
        rel_self = os.path.relpath(fp, ROOT)
        if rel_self in dup:
            continue
        try:
            src = open(fp, 'rb').read().decode('utf-8')
        except UnicodeDecodeError:
            continue
        n = 0
        def repl(m):
            global n
            raw = m.group(1)
            for cand in (raw, urllib.parse.unquote(raw)):
                target = os.path.normpath(os.path.join(os.path.dirname(rel_self), cand))
                if target in dup:
                    new = os.path.relpath(os.path.join(ROOT, dup[target]), d)
                    n += 1
                    return 'href="' + urllib.parse.quote(new, safe='/.') + (m.group(2) or '') + '"'
            return m.group(0)
        out = href_re.sub(repl, src)
        if n:
            files_changed += 1; links_changed += n
            if APPLY:
                open(fp, 'wb').write(out.encode('utf-8'))
print('pages relinked:', files_changed, 'links:', links_changed)

# 3. Mongo activities
mongo = r'''
const dup = %s; let upd=0, del=0, keep=0;
db.activities.find({fp: /W4S\//}).forEach(a => {
  const rel = (a.fp||'').replace('../content/','') + (a.fn||'');
  const t = dup[rel]; if (!t) { keep++; return; }
  const fp = '../content/' + t.substring(0, t.lastIndexOf('/')+1), fn = t.substring(t.lastIndexOf('/')+1);
  const twin = db.activities.findOne({fp: fp, fn: fn});
  if (twin) { del++; if (%s) db.activities.deleteOne({_id: a._id}); }
  else { upd++; if (%s) db.activities.updateOne({_id: a._id}, {$set: {fp: fp, fn: fn}}); }
});
print('mongo W4S activities: redirected', upd, 'removed (2013 button exists)', del, 'untouched', keep);
''' % (json.dumps(dup), 'true' if APPLY else 'false', 'true' if APPLY else 'false')
if APPLY:
    subprocess.run(['mongoexport', '--quiet', '-d', 'looma', '-c', 'activities', '-q', '{"fp":{"$regex":"W4S/"}}',
                    '-o', '/home/odroid/w4s-activities-backup-20261109.json'], check=True)
open('/tmp/w4s_mongo.js', 'w').write(mongo)
subprocess.run(['mongosh', '--quiet', 'looma', '/tmp/w4s_mongo.js'], check=True)

# 4. delete the duplicate files
if APPLY:
    for p in dup:
        os.remove(os.path.join(ROOT, p))
print('files deleted:', len(dup) if APPLY else 0, '(dry run)' if not APPLY else '')
json.dump(sorted(dup), open('/tmp/w4s_deleted_paths.json', 'w'))
