#!/usr/bin/env python3
"""
generate_subtitles.py -- build English (<name>.vtt) and Nepali (<name>_np.vtt)
subtitles for the videos on a Looma box, doing all the heavy work on this PC.

looma-play-video.php only shows a track when the file sits NEXT TO the video:
    content/<dir>/<name>.mp4
    content/<dir>/<name>.vtt        -> English track
    content/<dir>/<name>_np.vtt     -> Nepali track
so the output is a tree that mirrors content/ and holds only the new .vtt files.

Per video, only what is missing on the box is produced (existing files are never
replaced):
  English  1. existing <name>.vtt on the box (downloaded only as translation source)
           2. else an existing .srt (beside the video or in ../captions/) -> converted
           3. else Whisper (faster-whisper large-v3-turbo) on the audio.
              Nepali-speaking videos: transcribed in Nepali (-> _np.vtt) and
              Whisper-translated to English (-> .vtt).
  Nepali   English cues are merged into sentences and translated with NLLB-200
           (CTranslate2, eng_Latn -> npi_Deva), keeping the timings.

Media is read from a local content copy when the file there has the same size,
otherwise it is copied from the box into a temp file, the audio extracted, and
the copy deleted. Progress is kept in <out>/_state.jsonl, so the run can be
stopped and restarted at any time.

Usage (from the venv in /mnt/looma/Projectos/looma-subtitles):
    python generate_subtitles.py inventory          # scan the box -> <out>/_inventory.json
    python generate_subtitles.py run [--phase srt|translate|transcribe] [--limit N]
    python generate_subtitles.py report
Then push <out>/ to the box (see push_subtitles.sh).
"""

import argparse
import json
import os
import queue
import re
import shlex
import subprocess
import sys
import tempfile
import threading
import time

BASE = '/mnt/looma/Projectos/looma-subtitles'
DEFAULT_OUT = os.path.join(BASE, 'out')
DEFAULT_LOCAL_CONTENT = '/mnt/looma/Projectos/content'
DEFAULT_SSH = 'ssh -o ControlPath=/tmp/claude-1000/cm-%C -o ControlMaster=auto -o ControlPersist=4h odroid@192.168.1.146'
REMOTE_CONTENT = '/var/www/html/content'
NLLB_DIR = os.path.join(BASE, 'models', 'nllb-600m-ct2')
WHISPER_MODEL = 'large-v3-turbo'
VIDEO_EXT = ('.mp4', '.webm', '.m4v', '.mov')

# ---------------------------------------------------------------------------
# remote inventory: one JSON record per video on the box
# ---------------------------------------------------------------------------
REMOTE_SCAN = r'''
import os, json
root = %r
out = []
for d, _, fs in os.walk(root, followlinks=True):
    s = set(fs)
    for f in sorted(fs):
        if not f.lower().endswith(%r):
            continue
        p = f.rsplit('.', 1)[0]
        rel = os.path.relpath(os.path.join(d, f), root)
        reldir = os.path.dirname(rel)
        srt = None
        if p + '.srt' in s:
            srt = os.path.join(reldir, p + '.srt')
        else:
            cap = os.path.join(os.path.dirname(reldir), 'captions', p + '.srt')
            if os.path.exists(os.path.join(root, cap)):
                srt = cap
        try:
            size = os.path.getsize(os.path.join(d, f))
        except OSError:
            continue
        out.append({'path': rel, 'size': size, 'en': p + '.vtt' in s,
                    'np': p + '_np.vtt' in s, 'srt': srt})
print(json.dumps(out))
''' % (REMOTE_CONTENT, VIDEO_EXT)


def ssh_cmd(args):
    return shlex.split(args.ssh)


def cmd_inventory(args):
    res = subprocess.run(ssh_cmd(args) + ['python3', '-'], input=REMOTE_SCAN.encode(),
                         stdout=subprocess.PIPE, check=True)
    inv = json.loads(res.stdout)
    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, '_inventory.json'), 'w') as fh:
        json.dump(inv, fh, ensure_ascii=False, indent=0)
    print('videos on box: %d' % len(inv))
    for k in ('srt', 'translate', 'transcribe', 'complete'):
        print('  %-11s %d' % (k, sum(1 for v in inv if phase_of(v) == k)))


def phase_of(v):
    if v['en'] and v['np']:
        return 'complete'
    if v['en']:
        return 'translate'
    if v['srt']:
        return 'srt'
    return 'transcribe'


# ---------------------------------------------------------------------------
# cue helpers
# ---------------------------------------------------------------------------
TS = re.compile(r'(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})')


def parse_ts(s):
    m = TS.search(s)
    h, mi, se, ms = m.groups()
    return int(h or 0) * 3600 + int(mi) * 60 + int(se) + int(ms.ljust(3, '0')) / 1000.0


def fmt_ts(t):
    t = max(0.0, t)
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return '%02d:%02d:%02d.%03d' % (h, m, s, ms)


def parse_cues(text):
    """Parse SRT or WebVTT text into [(start, end, text)]."""
    text = text.replace('﻿', '').replace('\r\n', '\n').replace('\r', '\n')
    cues = []
    for block in re.split(r'\n\s*\n', text):
        lines = [l for l in block.split('\n') if l.strip()]
        for i, line in enumerate(lines):
            if '-->' in line:
                a, b = line.split('-->', 1)
                body = ' '.join(lines[i + 1:])
                body = re.sub(r'<[^>]+>', '', body)          # strip <c>, <i>, voice tags
                body = re.sub(r'\s+', ' ', body).strip()
                if body:
                    cues.append((parse_ts(a), parse_ts(b.strip().split(' ')[0]), body))
                break
    return cues


def wrap(text, width=48):
    """Break a long cue into two lines at the space nearest the middle."""
    if len(text) <= width or '\n' in text:
        return text
    mid = len(text) // 2
    spaces = [i for i, c in enumerate(text) if c == ' ']
    if not spaces:
        return text
    cut = min(spaces, key=lambda i: abs(i - mid))
    return text[:cut] + '\n' + text[cut + 1:]


def split_long(cues, limit=90):
    """Split cues longer than two lines into several, sharing the time by length."""
    out = []
    for a, b, t in cues:
        if len(t) <= limit:
            out.append((a, b, t))
            continue
        chunks, cur = [], ''
        for w in t.split(' '):
            if cur and len(cur) + 1 + len(w) > limit * 0.85:
                chunks.append(cur)
                cur = w
            else:
                cur = (cur + ' ' + w).strip()
        if cur:
            chunks.append(cur)
        total = float(sum(len(c) for c in chunks))
        x = a
        for c in chunks:
            y = x + (b - a) * len(c) / total
            out.append((x, y, c))
            x = y
    return out


def write_vtt(path, cues):
    cues = split_long(cues)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.part'
    with open(tmp, 'w', encoding='utf-8') as fh:
        fh.write('WEBVTT\n\n')
        for a, b, t in cues:
            fh.write('%s --> %s\n%s\n\n' % (fmt_ts(a), fmt_ts(b), wrap(t)))
    os.replace(tmp, path)


def sentence_groups(cues, max_cues=4, max_dur=12.0):
    """Merge fragment cues (SRT style) into sentence-sized cues for translation."""
    groups, cur = [], []
    for c in cues:
        cur.append(c)
        txt = cur[-1][2]
        if (re.search(r'[.?!:;]["\')]?$', txt) or len(cur) >= max_cues
                or cur[-1][1] - cur[0][0] >= max_dur):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return [(g[0][0], g[-1][1], ' '.join(c[2] for c in g)) for g in groups]


INDIC = ('ne', 'hi', 'mr', 'gu', 'bn', 'sa', 'pa', 'ur', 'as', 'or', 'si')

HALLUCINATIONS = re.compile(
    r'(thank(s| you) for watching|subscribe|subtitles? by|amara\.org|transcri(bed|ption) by|'
    r'please like|www\.|\.com\b)', re.I)


# ---------------------------------------------------------------------------
# models
# ---------------------------------------------------------------------------
class Models:
    def __init__(self, need_whisper):
        import ctranslate2
        import sentencepiece as spm
        self.sp = spm.SentencePieceProcessor(model_file=os.path.join(NLLB_DIR, 'sentencepiece.bpe.model'))
        self.nllb = ctranslate2.Translator(NLLB_DIR, device='cuda', compute_type='int8_float16')
        self.whisper = None
        if need_whisper:
            from faster_whisper import WhisperModel, BatchedInferencePipeline
            self.whisper = WhisperModel(WHISPER_MODEL, device='cuda', compute_type='int8_float16')
            self.batched = BatchedInferencePipeline(model=self.whisper)

    def translate(self, texts, batch=24, src='eng_Latn', tgt='npi_Deva'):
        out = []
        for i in range(0, len(texts), batch):
            chunk = texts[i:i + batch]
            toks = [[src] + self.sp.encode(t, out_type=str)[:400] + ['</s>'] for t in chunk]
            res = self.nllb.translate_batch(toks, target_prefix=[[tgt]] * len(toks),
                                            beam_size=4, max_decoding_length=300,
                                            repetition_penalty=1.2, max_batch_size=batch)
            out.extend(self.sp.decode(r.hypotheses[0][1:]) for r in res)
        return out

    def transcribe(self, wav, name=None, batch=4):
        """Returns (lang, prob, en_cues, np_cues). np_cues only for Nepali speech."""
        import numpy as np
        import wave as wavemod
        with wavemod.open(wav, 'rb') as w:      # 16 kHz mono s16 from ffmpeg; skips PyAV
            audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768.0
        _, _, all_probs = self.whisper.detect_language(audio, vad_filter=True,
                                                       language_detection_segments=4)
        probs = dict(all_probs)
        # Whisper scatters Nepali speech over hi/mr/gu/bn...; Looma content is either
        # English or Nepali, so compare English against the whole Indic family.
        # Anything else (ja, cy, ...) is nearly always music: treated as English and
        # left to the no-speech filter.
        p_en = probs.get('en', 0.0)
        p_indic = sum(probs.get(l, 0.0) for l in INDIC)
        nepali_name = bool(re.search('[ऀ-ॿ]', name or '')) or 'nepali' in (name or '').lower()
        lang = 'ne' if p_indic > p_en or (nepali_name and p_en < 0.8) else 'en'
        prob = p_indic if lang == 'ne' else p_en
        # GTX 1650 (4 GB) with NLLB also loaded: the encoder runs out of memory at batch 8.
        segs, _ = self.batched.transcribe(audio, language=lang, batch_size=batch, beam_size=1,
                                          without_timestamps=False, word_timestamps=True,
                                          vad_filter=True, condition_on_previous_text=False)
        cues = self._clean(segs)
        if lang == 'ne':
            # large-v3-turbo cannot translate, so NE -> EN goes through NLLB.
            groups = sentence_groups(cues)
            en = self.translate([g[2] for g in groups], src='npi_Deva', tgt='eng_Latn')
            return 'ne', prob, [(g[0], g[1], t) for g, t in zip(groups, en)], cues
        return 'en', prob, cues, None

    @staticmethod
    def _clean(segs):
        cues = []
        for s in segs:
            t = s.text.strip()
            if not t or HALLUCINATIONS.search(t):
                continue
            if s.no_speech_prob > 0.6 and s.avg_logprob < -0.8:
                continue
            if cues and cues[-1][2] == t:            # repeated-line loop
                continue
            # segment bounds include surrounding silence/music; trust the words instead,
            # and never leave a line up longer than it takes to read it.
            a, b = s.start, s.end
            if s.words:
                a, b = s.words[0].start, s.words[-1].end
            b = min(b, a + 2.0 + 0.09 * len(t))
            cues.append((a, max(b, a + 1.0), t))
        return cues


# ---------------------------------------------------------------------------
# remote file access
# ---------------------------------------------------------------------------
def remote_read(args, rel):
    res = subprocess.run(ssh_cmd(args) + ['cat', shlex.quote(os.path.join(REMOTE_CONTENT, rel))],
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode:
        raise RuntimeError('cannot read %s: %s' % (rel, res.stderr.decode(errors='replace')))
    return res.stdout


def fetch_audio(args, v, tmpdir):
    """Return path of a 16 kHz mono wav for video v (or raise)."""
    local = os.path.join(args.local_content, v['path'])
    src, delete = None, False
    if os.path.isfile(local) and os.path.getsize(local) == v['size']:
        src = local
    else:
        src = os.path.join(tmpdir, 'video' + os.path.splitext(v['path'])[1])
        with open(src, 'wb') as fh:
            res = subprocess.run(ssh_cmd(args) + ['cat', shlex.quote(os.path.join(REMOTE_CONTENT, v['path']))],
                                 stdout=fh, stderr=subprocess.PIPE)
        if res.returncode:
            raise RuntimeError('copy failed: ' + res.stderr.decode(errors='replace'))
        delete = True
    wav = os.path.join(tmpdir, 'audio.wav')
    res = subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', src,
                          '-vn', '-ac', '1', '-ar', '16000', wav], stderr=subprocess.PIPE)
    if delete:
        os.remove(src)
    if res.returncode or not os.path.exists(wav):
        raise RuntimeError('no audio: ' + res.stderr.decode(errors='replace')[-300:])
    return wav


# ---------------------------------------------------------------------------
# run
# ---------------------------------------------------------------------------
def load_state(out):
    done = {}
    p = os.path.join(out, '_state.jsonl')
    if os.path.exists(p):
        with open(p, encoding='utf-8') as fh:
            for line in fh:
                try:
                    r = json.loads(line)
                    done[r['path']] = r
                except ValueError:
                    pass
    return done


def out_paths(args, v):
    prefix = os.path.splitext(v['path'])[0]
    return os.path.join(args.out, prefix + '.vtt'), os.path.join(args.out, prefix + '_np.vtt')


def process(args, models, v, wav_getter, batch=4):
    en_path, np_path = out_paths(args, v)
    rec = {'path': v['path'], 'phase': phase_of(v)}
    en_cues = np_cues = None

    if v['en']:
        en_cues = parse_cues(remote_read(args, os.path.splitext(v['path'])[0] + '.vtt').decode('utf-8', 'replace'))
        rec['en'] = 'existing'
    elif v['srt']:
        en_cues = parse_cues(remote_read(args, v['srt']).decode('utf-8', 'replace'))
        write_vtt(en_path, en_cues)
        rec['en'] = 'srt'
    else:
        wav = wav_getter()
        lang, prob, en_cues, np_cues = models.transcribe(wav, name=v['path'], batch=batch)
        rec.update(lang=lang, lang_prob=round(prob, 2))
        if len(en_cues) < 2 and not np_cues:
            rec['status'] = 'no-speech'
            return rec
        write_vtt(en_path, en_cues)
        rec['en'] = 'whisper+nllb' if lang == 'ne' else 'whisper'

    if not v['np']:
        if np_cues:
            write_vtt(np_path, np_cues)
            rec['np'] = 'whisper'
        elif en_cues:
            groups = sentence_groups(en_cues)
            nep = models.translate([g[2] for g in groups])
            write_vtt(np_path, [(g[0], g[1], t) for g, t in zip(groups, nep)])
            rec['np'] = 'nllb'
    rec['status'] = 'ok' if en_cues else 'empty'
    rec['cues'] = len(en_cues or [])
    return rec


def cmd_run(args):
    with open(os.path.join(args.out, '_inventory.json')) as fh:
        inv = json.load(fh)
    done = load_state(args.out)
    order = {'srt': 0, 'translate': 1, 'transcribe': 2}
    # --retry-failed also re-runs videos given up on after repeated GPU OOMs
    retry = ('error', 'failed-oom') if args.retry_failed else ('error',)
    todo = [v for v in inv if phase_of(v) in order
            and done.get(v['path'], {}).get('status', 'error') in retry
            and (not args.phase or phase_of(v) == args.phase)
            and (not args.only or args.only in v['path'])]
    todo.sort(key=lambda v: (order[phase_of(v)], v['path']))
    if args.limit:
        todo = todo[:args.limit]
    print('to process: %d' % len(todo), flush=True)
    if not todo:
        return
    models = Models(need_whisper=any(phase_of(v) == 'transcribe' for v in todo))

    # prefetch audio for transcribe items in a background thread
    q = queue.Queue(maxsize=2)
    tmproot = tempfile.mkdtemp(prefix='subs-', dir=BASE)

    def producer():
        for v in todo:
            if phase_of(v) != 'transcribe':
                continue
            d = tempfile.mkdtemp(dir=tmproot)
            try:
                q.put((v['path'], fetch_audio(args, v, d), d, None))
            except Exception as e:  # noqa
                q.put((v['path'], None, d, str(e)))
    threading.Thread(target=producer, daemon=True).start()

    state = open(os.path.join(args.out, '_state.jsonl'), 'a', encoding='utf-8')
    t0 = time.time()
    for i, v in enumerate(todo, 1):
        t = time.time()
        cleanup = None
        # A video that ran the GPU out of memory is retried at batch 1. OOM can also
        # come from other GPU users (Chrome playing video), so it is given up on
        # only after 3 OOMs, which keeps the restart loop finite.
        prev = done.get(v['path'], {})
        ooms = prev.get('ooms', 1 if 'out of memory' in prev.get('error', '') else 0)
        if prev.get('status') == 'failed-oom':
            ooms = 1        # fresh start for --retry-failed, still at batch 1
        batch = 1 if ooms else 4
        cuda_broken = False
        try:
            if phase_of(v) == 'transcribe':
                path, wav, cleanup, err = q.get()
                assert path == v['path']
                if err:
                    raise RuntimeError(err)
                if ooms >= 3:
                    rec = {'path': v['path'], 'phase': 'transcribe', 'status': 'failed-oom'}
                else:
                    rec = process(args, models, v, lambda: wav, batch)
            else:
                rec = process(args, models, v, None)
        except Exception as e:  # noqa
            rec = {'path': v['path'], 'phase': phase_of(v), 'status': 'error',
                   'error': str(e)[:500], 'batch': batch,
                   'ooms': ooms + ('out of memory' in str(e))}
            # a video without an audio track (silent animation) is final, not an error
            if str(e).startswith('no audio'):
                rec = {'path': v['path'], 'phase': phase_of(v), 'status': 'no-audio'}
            # after a CUDA failure (usually OOM) the context is unusable and every
            # later video fails too: stop, and let run_all.sh restart a fresh process
            cuda_broken = 'cuda' in str(e).lower()
        finally:
            if cleanup:
                subprocess.run(['rm', '-rf', cleanup])
        rec['secs'] = round(time.time() - t, 1)
        state.write(json.dumps(rec, ensure_ascii=False) + '\n')
        state.flush()
        print('[%d/%d %s] %s %s %s' % (i, len(todo), time.strftime('%H:%M:%S'), rec['status'],
                                       rec.get('lang', ''), v['path']), flush=True)
        if cuda_broken:
            print('CUDA error -> exiting for a restart', flush=True)
            subprocess.run(['rm', '-rf', tmproot])
            os._exit(3)
    subprocess.run(['rm', '-rf', tmproot])
    print('done in %.0f min' % ((time.time() - t0) / 60))


def cmd_report(args):
    done = load_state(args.out)
    from collections import Counter
    c = Counter((r['phase'], r['status']) for r in done.values())
    for k, n in sorted(c.items()):
        print('%-11s %-10s %d' % (k[0], k[1], n))
    errs = [r for r in done.values() if r['status'] == 'error']
    for r in errs[:20]:
        print('ERR', r['path'], r['error'][:150])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['inventory', 'run', 'report'])
    ap.add_argument('--out', default=DEFAULT_OUT)
    ap.add_argument('--ssh', default=os.environ.get('LOOMA_BOX_SSH', DEFAULT_SSH))
    ap.add_argument('--local-content', default=DEFAULT_LOCAL_CONTENT)
    ap.add_argument('--phase', choices=['srt', 'translate', 'transcribe'])
    ap.add_argument('--only', help='substring filter on video path')
    ap.add_argument('--limit', type=int)
    ap.add_argument('--retry-failed', action='store_true',
                    help='also retry videos marked failed-oom (given up after 3 GPU OOMs)')
    args = ap.parse_args()
    {'inventory': cmd_inventory, 'run': cmd_run, 'report': cmd_report}[args.cmd](args)


if __name__ == '__main__':
    sys.exit(main())
