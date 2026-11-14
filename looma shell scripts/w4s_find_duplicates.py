"""Step 1 of the W4S (2007) / W4S2013 de-duplication, run on the box 2026-11-09.
Finds W4S articles that also exist in W4S2013, matching by <title>, by
filename and by the bold subject of the first paragraph (2013 renamed many
articles: "Gottfried Leibniz" -> "Gottfried Wilhelm Leibniz").
Result 2026-11-09: 2733 W4S articles, 1086 with a 2013 twin, 1647 W4S-only.
Writes /tmp/w4s_final.json for w4s_dedupe.py."""
import os,re,json,html,urllib.parse,collections
root='/var/www/html/content'
N=lambda t: re.sub(r'[^a-z0-9]','',html.unescape(t).lower())
def keys(p):
    try: s=open(os.path.join(root,p),'rb').read(60000).decode('utf-8','ignore')
    except Exception: return set(),''
    ks=set()
    m=re.search(r'<title>(.*?)</title>',s,re.I|re.S)
    if m: ks.add(N(m.group(1)))
    ks.add(N(urllib.parse.unquote(urllib.parse.unquote(os.path.basename(p).rsplit('.',1)[0]))))
    body=s[s.find('<p'):] if '<p' in s else s
    b=re.search(r'<b>(.*?)</b>',body[:3000],re.S)
    if b:
        bt=re.sub(r'<[^>]+>','',b.group(1))
        if 3<len(bt)<80: ks.add(N(bt))
    txt=re.sub(r'<[^>]+>',' ',body[:4000]); txt=re.sub(r'\s+',' ',html.unescape(txt)).strip()
    return {k for k in ks if len(k)>=4}, txt[:300]
idx=collections.defaultdict(list)
for d,_,fs in os.walk(root+'/W4S2013/wp'):
    for f in fs:
        if f.endswith('.htm'):
            p=os.path.relpath(os.path.join(d,f),root)
            for k in keys(p)[0]: idx[k].append(p)
arts=[]
for d,_,fs in os.walk(root+'/W4S/wp'):
    for f in fs:
        if f.endswith('.htm'): arts.append(os.path.relpath(os.path.join(d,f),root))
dup={}; only=[]
for p in arts:
    ks,_=keys(p)
    hit=next((idx[k][0] for k in ks if k in idx),None)
    if hit: dup[p]=hit
    else: only.append(p)
print('W4S articles',len(arts),'| with a 2013 twin',len(dup),'| W4S-only',len(only))
print('sample twins', list(dup.items())[:6])
print('sample only', only[:20])
json.dump({'dup':dup,'only':only},open('/tmp/w4s_final.json','w'))
