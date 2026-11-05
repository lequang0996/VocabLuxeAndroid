#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VocabLuxe - dựng lại 4 file dữ liệu en/zh/ja/ko.json từ các nguồn có giấy phép mở.

Chạy trên GitHub Actions (workflow "Build data") hoặc trên máy có mạng:
    pip install -r tools/requirements.txt
    python tools/build_data.py --translator opus

Nguồn (xem sources.json được sinh ra cùng dữ liệu):
  en  CEFR-J Vocabulary Profile 1.5 (A1-B2) + Octanove Vocabulary Profile (C1/C2)
  zh  complete-hsk-vocabulary (HSK 2.0, cấp 1-6; nghĩa gốc từ CC-CEDICT)
  ja  open-anki-jlpt-decks (danh sách Tanos, N5-N1)
  ko  Từ điển cơ bản tiếng Hàn (krdict) - PHẢI tải tay 1 lần, xem tools/sources/README.md
  Hán-Việt: Unihan (kVietnamese)   Chủ đề: WordNet   Nghĩa tiếng Việt (en/zh/ja): dịch máy offline
"""
import argparse
import csv
import datetime
import hashlib
import html
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import zipfile
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from textutil import kana_to_romaji, hangul_to_romaja, has_cjk, is_cjk  # noqa: E402

SCRIPT_VERSION = 1
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www', 'data')
DEFAULT_CACHE = os.path.join(ROOT, 'tools', '.cache')
DEFAULT_KO = os.path.join(ROOT, 'tools', 'sources', 'krdict')
OVERRIDES = os.path.join(ROOT, 'tools', 'overrides', 'vi_overrides.json')

URLS = {
    'hsk': 'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json',
    'jlpt': 'https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/n{n}.csv',
    'cefrj': 'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv',
    'octanove': 'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv',
    'unihan': ['https://www.unicode.org/Public/UNIDATA/Unihan.zip', 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip'],
}

# Thông tin nguồn + giấy phép: ghi vào sources.json và hiển thị trong màn hình "Nguồn & giấy phép" của app.
# Các dòng giấy phép là theo lời từng nguồn tự công bố; đây không phải tư vấn pháp lý.
SOURCES = [
    {'id': 'cefrj', 'name': 'CEFR-J Vocabulary Profile 1.5', 'author': 'Tono Laboratory, Tokyo University of Foreign Studies',
     'url': 'http://www.cefr-j.org/download.html', 'license': 'Dùng miễn phí cho nghiên cứu và thương mại, yêu cầu ghi nguồn (theo thông báo của CEFR-J)',
     'langs': ['en'], 'used_for': 'Danh sách từ tiếng Anh cấp A1-B2, loại từ'},
    {'id': 'octanove', 'name': 'Octanove Vocabulary Profile C1/C2 1.0', 'author': 'Octanove Labs',
     'url': 'https://github.com/openlanguageprofiles/olp-en-cefrj', 'license': 'CC BY-SA 4.0',
     'license_url': 'https://creativecommons.org/licenses/by-sa/4.0/', 'langs': ['en'], 'used_for': 'Từ tiếng Anh cấp C1-C2'},
    {'id': 'hsk', 'name': 'complete-hsk-vocabulary (HSK 2.0)', 'author': 'Yanis Zafirópulos (Dr.Kameleon)',
     'url': 'https://github.com/drkameleon/complete-hsk-vocabulary', 'license': 'MIT', 'langs': ['zh'],
     'used_for': 'Danh sách từ HSK 1-6, phiên âm pinyin'},
    {'id': 'cedict', 'name': 'CC-CEDICT', 'author': 'MDBG / cộng đồng CC-CEDICT', 'url': 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict',
     'license': 'CC BY-SA 4.0', 'license_url': 'https://creativecommons.org/licenses/by-sa/4.0/', 'langs': ['zh'],
     'used_for': 'Nghĩa tiếng Anh (đi kèm complete-hsk-vocabulary) làm đầu vào cho bản dịch tiếng Việt'},
    {'id': 'jlpt', 'name': 'open-anki-jlpt-decks (dựa trên danh sách của tanos.co.uk)', 'author': 'jamsinclair; danh sách gốc: Jonathan Waller (Tanos)',
     'url': 'https://github.com/jamsinclair/open-anki-jlpt-decks', 'license': 'Dữ liệu từ vựng gốc Tanos: CC BY; mã nguồn kho: MIT',
     'license_url': 'https://creativecommons.org/licenses/by/4.0/', 'langs': ['ja'],
     'used_for': 'Danh sách từ JLPT N5-N1, cách đọc, nghĩa tiếng Anh'},
    {'id': 'krdict', 'name': 'Từ điển cơ bản tiếng Hàn (한국어기초사전)', 'author': 'Viện Quốc ngữ Hàn Quốc (국립국어원)',
     'url': 'https://krdict.korean.go.kr/', 'license': 'CC BY-SA 2.0 KR', 'license_url': 'https://creativecommons.org/licenses/by-sa/2.0/kr/',
     'langs': ['ko'], 'used_for': 'Từ vựng tiếng Hàn, cấp độ, loại từ, nghĩa tiếng Việt, Hán tự'},
    {'id': 'unihan', 'name': 'Unicode Han Database (Unihan), thuộc tính kVietnamese', 'author': 'Unicode, Inc.',
     'url': 'https://www.unicode.org/charts/unihan.html', 'license': 'Unicode Terms of Use', 'license_url': 'https://www.unicode.org/terms_of_use.html',
     'langs': ['zh', 'ja', 'ko'], 'used_for': 'Âm Hán Việt (tự động suy ra từ Hán tự, có thể có ngoại lệ)'},
    {'id': 'wordnet', 'name': 'Princeton WordNet 3.0', 'author': 'Princeton University', 'url': 'https://wordnet.princeton.edu/',
     'license': 'Giấy phép WordNet (cho phép dùng và phân phối kèm thông báo bản quyền)', 'license_url': 'https://wordnet.princeton.edu/license-and-commercial-use',
     'langs': ['en', 'zh', 'ja', 'ko'], 'used_for': 'Gán chủ đề cho từ (tự động)'},
    {'id': 'opus-mt-en-vi', 'name': 'Helsinki-NLP/opus-mt-en-vi', 'author': 'Language Technology Research Group, University of Helsinki',
     'url': 'https://huggingface.co/Helsinki-NLP/opus-mt-en-vi', 'license': 'Apache-2.0 (theo trang mô hình trên Hugging Face)', 'langs': ['en', 'zh', 'ja'],
     'used_for': 'Dịch tự động nghĩa tiếng Anh sang tiếng Việt (nghĩa này có nhãn "dịch tự động")'},
]
DATA_LICENSE = {
    'en': 'Gồm dữ liệu CC BY-SA 4.0 (C1-C2) và dữ liệu CEFR-J (ghi nguồn). Nghĩa tiếng Việt: dịch tự động.',
    'zh': 'CC BY-SA 4.0 (vì nghĩa phát sinh từ CC-CEDICT). Nghĩa tiếng Việt: dịch tự động.',
    'ja': 'CC BY (theo danh sách Tanos). Nghĩa tiếng Việt: dịch tự động.',
    'ko': 'CC BY-SA 2.0 KR (theo Từ điển cơ bản tiếng Hàn).',
}
LEVELS = {
    'en': ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    'zh': ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
    'ja': ['N5', 'N4', 'N3', 'N2', 'N1'],
    'ko': ['Sơ cấp', 'Trung cấp', 'Cao cấp'],
}


def log(*a):
    print(*a, flush=True)


# =============================================================================================
#  Tải nguồn
# =============================================================================================
def fetch(url, dest, offline=False, binary=False):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return dest
    if offline:
        raise SystemExit('Thiếu file nguồn (chế độ --offline): ' + dest)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    last = None
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'VocabLuxe-build/1.0'})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            with open(dest, 'wb') as f:
                f.write(data)
            log('  đã tải', url, '(%d KB)' % (len(data) // 1024))
            return dest
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = e
            time.sleep(2 * attempt)
    raise SystemExit('Không tải được %s: %s' % (url, last))


def read_csv_rows(path):
    with open(path, 'r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def pick_col(row_keys, names):
    low = {k.strip().lower(): k for k in row_keys}
    for n in names:
        if n in low:
            return low[n]
    return None


# =============================================================================================
#  Hán Việt (Unihan)
# =============================================================================================
class HanViet:
    def __init__(self, unihan_dir, offline=False):
        self.read, self.variants = {}, {}
        zpath = os.path.join(unihan_dir, 'Unihan.zip')
        rpath = os.path.join(unihan_dir, 'Unihan_Readings.txt')
        vpath = os.path.join(unihan_dir, 'Unihan_Variants.txt')
        if not (os.path.exists(rpath) and os.path.exists(vpath)):
            if not os.path.exists(zpath):
                err = None
                for u in URLS['unihan']:
                    try:
                        fetch(u, zpath, offline)
                        err = None
                        break
                    except SystemExit as e:
                        err = e
                if err:
                    raise err
            with zipfile.ZipFile(zpath) as z:
                for n in ('Unihan_Readings.txt', 'Unihan_Variants.txt'):
                    with z.open(n) as src, open(os.path.join(unihan_dir, n), 'wb') as dst:
                        dst.write(src.read())
        for line in open(rpath, encoding='utf-8'):
            if line.startswith('#') or '\tkVietnamese\t' not in line:
                continue
            cp, _, val = line.rstrip('\n').split('\t')
            self.read[chr(int(cp[2:], 16))] = val.split()
        for line in open(vpath, encoding='utf-8'):
            if line.startswith('#'):
                continue
            parts = line.rstrip('\n').split('\t')
            if len(parts) == 3 and parts[1] in ('kTraditionalVariant', 'kSimplifiedVariant', 'kZVariant'):
                vs = [chr(int(v.split('<')[0][2:], 16)) for v in parts[2].split() if v.startswith('U+')]
                self.variants.setdefault(chr(int(parts[0][2:], 16)), []).extend(vs)
        log('  Unihan: %d chữ có kVietnamese, %d chữ có biến thể' % (len(self.read), len(self.variants)))

    def char(self, c):
        if c in self.read:
            return self.read[c][0]
        for v in self.variants.get(c, []):
            if v in self.read:
                return self.read[v][0]
        return None

    def word(self, text, alt=None, title=False):
        """Âm Hán Việt của cả từ; trả về '' nếu có chữ Hán nào không tra được (không đoán)."""
        s = alt if alt and len(alt) == len(text) else text
        out, prev = [], None
        for c in s:
            if c == '々' and prev:
                c = prev
            if is_cjk(c):
                r = self.char(c)
                if r is None:
                    return ''
                out.append(r.title() if title else r)
            prev = c
        return ' '.join(out)


# =============================================================================================
#  Dịch máy + file sửa tay
# =============================================================================================
class StubTranslator:
    name = 'stub'

    def translate(self, texts):
        return ['vi:' + t for t in texts]


class OpusTranslator:
    name = 'opus-mt-en-vi'

    def __init__(self):
        from transformers import MarianMTModel, MarianTokenizer  # noqa
        import torch  # noqa
        n = 'Helsinki-NLP/opus-mt-en-vi'
        self.tok = MarianTokenizer.from_pretrained(n)
        self.model = MarianMTModel.from_pretrained(n).eval()

    def translate(self, texts):
        import torch
        out = []
        for i in range(0, len(texts), 64):
            enc = self.tok(texts[i:i + 64], return_tensors='pt', padding=True, truncation=True, max_length=64)
            with torch.no_grad():
                gen = self.model.generate(**enc, num_beams=3, max_new_tokens=48)
            out += self.tok.batch_decode(gen, skip_special_tokens=True)
        return out


class GoogleTranslator:
    """API chính thức Google Cloud Translation v2 (cần biến môi trường GOOGLE_TRANSLATE_API_KEY)."""
    name = 'google-cloud-translation'

    def __init__(self):
        self.key = os.environ.get('GOOGLE_TRANSLATE_API_KEY', '')
        if not self.key:
            raise SystemExit('Thiếu biến môi trường GOOGLE_TRANSLATE_API_KEY cho --translator google')

    def translate(self, texts):
        import urllib.parse
        out = []
        for i in range(0, len(texts), 100):
            body = [('q', t) for t in texts[i:i + 100]] + [('source', 'en'), ('target', 'vi'), ('format', 'text'), ('key', self.key)]
            req = urllib.request.Request('https://translation.googleapis.com/language/translate/v2',
                                         data=urllib.parse.urlencode(body).encode(), method='POST')
            with urllib.request.urlopen(req, timeout=60) as r:
                j = json.loads(r.read().decode('utf-8'))
            out += [html.unescape(x['translatedText']) for x in j['data']['translations']]
        return out


class Translator:
    """Dịch hàng loạt có cache trên đĩa (chạy lại chỉ dịch phần mới)."""

    def __init__(self, backend, cache_dir):
        self.backend = backend
        self.path = os.path.join(cache_dir, 'translations.json')
        self.cache = {}
        if backend and os.path.exists(self.path):
            allc = json.load(open(self.path, encoding='utf-8'))
            self.cache = allc.get(backend.name, {})
        self.todo = set()

    def want(self, text):
        if text and text not in self.cache:
            self.todo.add(text)

    def run(self):
        if not self.backend or not self.todo:
            return
        items = sorted(self.todo, key=len)
        log('  dịch %d cụm bằng %s …' % (len(items), self.backend.name))
        t0 = time.time()
        for i in range(0, len(items), 512):
            chunk = items[i:i + 512]
            for src, vi in zip(chunk, self.backend.translate(chunk)):
                self.cache[src] = vi.strip()
            log('    %d/%d (%.0fs)' % (min(i + 512, len(items)), len(items), time.time() - t0))
            self.save()
        self.todo.clear()

    def save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        allc = json.load(open(self.path, encoding='utf-8')) if os.path.exists(self.path) else {}
        allc[self.backend.name] = self.cache
        json.dump(allc, open(self.path, 'w', encoding='utf-8'), ensure_ascii=False)

    def get(self, text):
        return self.cache.get(text, '')


def clean_vi(src, vi):
    vi = (vi or '').strip().rstrip('.。').strip()
    if src.lower().startswith('to ') and vi.lower().startswith('để '):
        vi = vi[3:]
    if src[:1].islower() and vi[:1].isupper() and not vi[:2].isupper():
        vi = vi[:1].lower() + vi[1:]
    return vi


def clean_gloss(g):
    """Làm sạch một nghĩa tiếng Anh (kiểu CC-CEDICT / JMdict): bỏ chú thích, tham chiếu."""
    g = re.sub(r'\(.*?\)|\[.*?\]', ' ', g)
    g = re.sub(r'\bCL:\S+', ' ', g)
    g = re.sub(r'\s+', ' ', g).strip(' ;,.')
    if re.match(r'^(see |see also |variant of |also written |abbr\. |old variant|erhua variant|surname |used in )', g, re.I):
        return ''
    return g


def split_glosses(text, limit=3):
    parts = re.split(r'\s*[;/]\s*', text or '')
    out = []
    for p in parts:
        c = clean_gloss(p)
        if c and c.lower() not in [x.lower() for x in out]:
            out.append(c)
        if len(out) >= limit:
            break
    return out


def join_vi(glosses, tr):
    seen, out = set(), []
    for g in glosses:
        v = clean_vi(g, tr.get(g))
        if v and v.lower() not in seen:
            seen.add(v.lower())
            out.append(v)
    return '; '.join(out)


# =============================================================================================
#  Chủ đề bằng WordNet
# =============================================================================================
LEXNAME_TOPIC = {
    'noun.person': 'family', 'noun.body': 'body', 'noun.food': 'food', 'noun.animal': 'nature', 'noun.plant': 'nature',
    'noun.time': 'time', 'noun.quantity': 'number', 'noun.artifact': 'home', 'noun.location': 'place', 'noun.cognition': 'study',
    'noun.communication': 'comm', 'noun.feeling': 'feeling', 'noun.attribute': 'quality', 'noun.state': 'general',
    'noun.act': 'action', 'noun.group': 'society', 'noun.possession': 'work', 'noun.substance': 'science',
    'noun.phenomenon': 'nature', 'noun.event': 'general', 'noun.object': 'nature', 'noun.shape': 'color',
    'noun.process': 'science', 'noun.relation': 'general', 'noun.motive': 'feeling', 'noun.Tops': 'general',
    'verb.motion': 'action', 'verb.communication': 'comm', 'verb.cognition': 'study', 'verb.consumption': 'food',
    'verb.body': 'body', 'verb.contact': 'action', 'verb.creation': 'action', 'verb.change': 'action',
    'verb.competition': 'leisure', 'verb.social': 'society', 'verb.stative': 'general', 'verb.possession': 'work',
    'verb.weather': 'time', 'verb.emotion': 'feeling', 'adj.all': 'quality', 'adj.pert': 'quality', 'adj.ppl': 'quality',
    'adv.all': 'quality',
}
HYPERNYM_TOPIC = [  # (tên synset WordNet, chủ đề) - kiểm tra theo thứ tự; tên không tồn tại sẽ bị bỏ qua
    ('color.n.01', 'color'), ('chromatic_color.n.01', 'color'), ('garment.n.01', 'clothes'), ('clothing.n.01', 'clothes'),
    ('vehicle.n.01', 'travel'), ('beverage.n.01', 'food'), ('food.n.01', 'food'), ('food.n.02', 'food'),
    ('body_part.n.01', 'body'), ('disease.n.01', 'body'), ('kin.n.01', 'family'), ('relative.n.01', 'family'),
    ('worker.n.01', 'work'), ('professional.n.01', 'work'), ('building.n.01', 'home'), ('furniture.n.01', 'home'),
    ('room.n.01', 'home'), ('sport.n.01', 'leisure'), ('musical_instrument.n.01', 'leisure'), ('music.n.01', 'leisure'),
    ('computer.n.01', 'tech'), ('electronic_equipment.n.01', 'tech'), ('law.n.01', 'society'), ('government.n.01', 'society'),
    ('discipline.n.01', 'study'), ('school.n.01', 'study'), ('weather.n.01', 'time'), ('emotion.n.01', 'feeling'),
    ('animal.n.01', 'nature'), ('plant.n.02', 'nature'),
]
CEFRJ_TOPIC = {'education': 'study', 'travel': 'travel', 'ways of travelling': 'travel', 'health and body care': 'body',
               'work and jobs': 'work', 'nationalities and countries': 'place'}
TOPIC_IDS = {'family', 'body', 'food', 'nature', 'time', 'number', 'color', 'clothes', 'home', 'travel', 'place', 'study',
             'work', 'tech', 'leisure', 'feeling', 'society', 'science', 'comm', 'action', 'quality', 'grammar', 'idiom', 'general'}


class Topicizer:
    def __init__(self, wn=None):
        if wn is None:
            import nltk
            from nltk.corpus import wordnet as wn  # noqa
            try:
                wn.ensure_loaded()
            except LookupError:
                nltk.download('wordnet', quiet=True)
                nltk.download('omw-1.4', quiet=True)
                wn.ensure_loaded()
        self.wn = wn
        self.targets = []
        for name, topic in HYPERNYM_TOPIC:
            try:
                self.targets.append((wn.synset(name), topic))
            except Exception:  # tên synset không có trong bản WordNet này
                pass
        self.cache = {}

    def lemma_topic(self, lemma, pos):
        key = (lemma, pos)
        if key in self.cache:
            return self.cache[key]
        wpos = {'n': 'n', 'v': 'v', 'adj': 'a', 'adv': 'r'}.get(pos)
        res = None
        word = lemma.strip().lower().replace(' ', '_')
        syns = self.wn.synsets(word, pos=wpos) if wpos else self.wn.synsets(word)
        if not syns and ' ' in lemma.strip():
            toks = lemma.strip().lower().split()
            head = toks[-1] if pos == 'n' else toks[0]
            syns = self.wn.synsets(head, pos=wpos) if wpos else self.wn.synsets(head)
        if syns:
            s = syns[0]
            try:
                closure = set(s.closure(lambda x: x.hypernyms())) | {s}
            except Exception:
                closure = {s}
            for tsyn, topic in self.targets:
                if tsyn in closure:
                    res = topic
                    break
            if res is None:
                res = LEXNAME_TOPIC.get(s.lexname())
        self.cache[key] = res or 'general'
        return self.cache[key]

    def for_gloss(self, gloss, pos_hint=None):
        g = clean_gloss(gloss or '').lower()
        if not g:
            return 'general'
        pos = pos_hint
        if g.startswith('to '):
            g, pos = g[3:], 'v'
        g = re.sub(r'^(a|an|the) ', '', g)
        return self.lemma_topic(g, pos or 'n')


def en_pos_key(p):
    p = (p or '').lower()
    for k, v in (('noun', 'n'), ('verb', 'v'), ('adjective', 'adj'), ('adverb', 'adv')):
        if p == k or p.startswith(k):
            return v
    return None


# =============================================================================================
#  Từng ngôn ngữ
# =============================================================================================
POS_ABBR = {'noun': 'n.', 'verb': 'v.', 'adjective': 'adj.', 'adverb': 'adv.', 'preposition': 'prep.', 'pronoun': 'pron.',
            'conjunction': 'conj.', 'determiner': 'det.', 'modal verb': 'modal v.', 'auxiliary verb': 'aux. v.',
            'number': 'num.', 'interjection': 'interj.', 'be-verb': 'be-v.', 'do-verb': 'do-v.', 'have-verb': 'have-v.',
            'infinitive-to': 'inf. to'}
FUNCTION_POS = {'determiner', 'preposition', 'pronoun', 'conjunction', 'modal verb', 'auxiliary verb', 'be-verb', 'do-verb',
                'have-verb', 'infinitive-to', 'number'}


def read_profile(path, level_hint=None):
    rows = read_csv_rows(path)
    if not rows:
        raise SystemExit('File rỗng: ' + path)
    keys = list(rows[0].keys())
    c_w = pick_col(keys, ['headword', 'word', 'lemma'])
    c_p = pick_col(keys, ['pos', 'part of speech'])
    c_l = pick_col(keys, ['cefr', 'level', 'cefr level'])
    if not (c_w and c_l):
        raise SystemExit('Không nhận ra cột trong %s. Các cột tìm thấy: %s' % (os.path.basename(path), keys))
    c_t1 = pick_col(keys, ['coreinventory 1'])
    c_t2 = pick_col(keys, ['threshold'])
    out = []
    for r in rows:
        w = (r.get(c_w) or '').strip()
        lv = (r.get(c_l) or '').strip().upper()
        if not w or lv not in LEVELS['en']:
            continue
        hint = ''
        for c in (c_t1, c_t2):
            if c and (r.get(c) or '').strip():
                hint = CEFRJ_TOPIC.get((r.get(c) or '').strip().lower(), hint)
        out.append({'w': w, 'pos': (r.get(c_p) or '').strip().lower() if c_p else '', 'lvl': lv, 'hint': hint})
    return out


def build_en(cache, offline, tr, topicizer, overrides):
    log('[en] đọc CEFR-J + Octanove')
    cf = fetch(URLS['cefrj'], os.path.join(cache, 'cefrj', 'cefrj-vocabulary-profile-1.5.csv'), offline)
    oc = fetch(URLS['octanove'], os.path.join(cache, 'cefrj', 'octanove-vocabulary-profile-c1c2-1.0.csv'), offline)
    rows = read_profile(cf) + read_profile(oc)
    best = {}
    for r in rows:
        k = (r['w'].lower(), r['pos'])
        if k not in best or LEVELS['en'].index(r['lvl']) < LEVELS['en'].index(best[k]['lvl']):
            best[k] = r
    items = sorted(best.values(), key=lambda r: (r['w'].lower(), r['pos']))
    prepared = []
    for r in items:
        main = r['w'].split('/')[0].strip()
        q = 'to ' + main if r['pos'] == 'verb' else main
        prepared.append((r, main, q))
        tr.want(q)
    tr.run()
    words = []
    for r, main, q in prepared:
        abbr = POS_ABBR.get(r['pos'], r['pos'])
        wid = 'en:%s|%s' % (main, abbr)
        w = {'id': wid, 'w': main, 'pos': abbr, 'lvl': r['lvl'], 'note': ', '.join(x.strip() for x in r['w'].split('/')[1:]),
             'mean': '', 'auto': True}
        if r['pos'] in FUNCTION_POS and not r['hint']:
            w['topic'] = 'grammar'
        else:
            w['topic'] = r['hint'] or (topicizer.lemma_topic(main, en_pos_key(r['pos']) or 'n') if topicizer else 'general')
        vi = clean_vi(q, tr.get(q))
        if wid in overrides:
            vi, w['auto'] = overrides[wid], False
        w['mean'] = vi
        words.append(w)
    words.sort(key=lambda w: (LEVELS['en'].index(w['lvl']), w['w'].lower()))
    return words, ['cefrj', 'octanove', 'wordnet', 'opus-mt-en-vi']


def build_zh(cache, offline, tr, topicizer, hanviet, overrides):
    log('[zh] đọc complete-hsk-vocabulary')
    path = fetch(URLS['hsk'], os.path.join(cache, 'hsk', 'complete.json'), offline)
    data = json.load(open(path, encoding='utf-8'))
    ents = []
    for e in data:
        lv = [x for x in (e.get('level') or []) if str(x).startswith('old-')]
        forms = e.get('forms') or []
        if not lv or not forms or not e.get('simplified'):
            continue
        n = min(int(str(x).split('-')[1]) for x in lv)
        f = forms[0]
        py = ((f.get('transcriptions') or {}).get('pinyin') or '').strip()
        ents.append({'w': e['simplified'], 'py': py, 'trad': f.get('traditional') or '', 'n': n,
                     'freq': e.get('frequency') or 10 ** 9, 'gl': split_glosses('; '.join(f.get('meanings') or [])), 'pos': e.get('pos') or []})
    ents.sort(key=lambda e: (e['n'], e['freq']))
    for e in ents:
        for g in e['gl']:
            tr.want(g)
    tr.run()
    words, seen = [], {}
    for e in ents:
        wid = 'zh:' + e['w']
        if wid in seen:
            seen[wid] += 1
            wid += '#%d' % seen[wid]
        else:
            seen[wid] = 0
        pos_hint = 'v' if 'v' in e['pos'] else ('adj' if 'a' in e['pos'] else ('n' if 'n' in e['pos'] else None))
        w = {'id': wid, 'w': e['w'], 'py': e['py'], 'hv': hanviet.word(e['w'], e['trad']) if hanviet else '',
             'mean': join_vi(e['gl'], tr), 'auto': True, 'lvl': 'HSK%d' % e['n'],
             'topic': topicizer.for_gloss(e['gl'][0], pos_hint) if (topicizer and e['gl']) else 'general'}
        if wid in overrides:
            w['mean'], w['auto'] = overrides[wid], False
        words.append(w)
    return words, ['hsk', 'cedict', 'unihan', 'wordnet', 'opus-mt-en-vi']


def build_ja(cache, offline, tr, topicizer, hanviet, overrides):
    log('[ja] đọc open-anki-jlpt-decks')
    ents, seen = [], set()
    for n in (5, 4, 3, 2, 1):
        p = fetch(URLS['jlpt'].format(n=n), os.path.join(cache, 'jlpt', 'n%d.csv' % n), offline)
        rows = read_csv_rows(p)
        if not rows:
            log('  CẢNH BÁO: n%d.csv không có dòng dữ liệu nào' % n)
            continue
        keys = list(rows[0].keys())
        c_e, c_r, c_m = pick_col(keys, ['expression']), pick_col(keys, ['reading']), pick_col(keys, ['meaning'])
        if not (c_e and c_m):
            raise SystemExit('Không nhận ra cột trong n%d.csv. Các cột tìm thấy: %s' % (n, keys))
        for r in rows:
            expr = (r.get(c_e) or '').strip()
            read = ((r.get(c_r) if c_r else '') or '').strip() or expr
            if not expr or (expr, read) in seen:
                continue
            seen.add((expr, read))
            ents.append({'w': expr, 'py': read, 'n': n, 'gl': split_glosses(r.get(c_m) or '')})
    for e in ents:
        for g in e['gl']:
            tr.want(g)
    tr.run()
    words = []
    for e in ents:
        wid = 'ja:%s|%s' % (e['w'], e['py'])
        w = {'id': wid, 'w': e['w'], 'py': e['py'], 'ro': kana_to_romaji(e['py']),
             'hv': hanviet.word(e['w'], title=True) if (hanviet and has_cjk(e['w'])) else '',
             'mean': join_vi(e['gl'], tr), 'auto': True, 'lvl': 'N%d' % e['n'],
             'topic': topicizer.for_gloss(e['gl'][0]) if (topicizer and e['gl']) else 'general'}
        if wid in overrides:
            w['mean'], w['auto'] = overrides[wid], False
        words.append(w)
    return words, ['jlpt', 'unihan', 'wordnet', 'opus-mt-en-vi']


# ------------------------------------------------------------------ tiếng Hàn (krdict)
ALIAS = {
    'headword': ['word', 'writtenform', 'headword', 'lemma', 'hw'],
    'grade': ['word_grade', 'vocabularygrade', 'vocabularylevel', 'wordgrade', 'grade'],
    'pos': ['pos', 'partofspeech'],
    'origin': ['origin', 'originallanguage', 'original_language'],
    'pron': ['pronunciation', 'pronunciation_info', 'phoneticform', 'pron'],
    'code': ['target_code', 'targetcode', 'id'],
    'senses': ['sense', 'senses', 'meaning'],
    'trans': ['translation', 'equivalent', 'trans'],
    't_lang': ['trans_lang', 'language', 'lang'],
    't_word': ['trans_word', 'lemma', 'word', 'writtenform'],
}
GRADE_VI = {'초급': 'Sơ cấp', 'beginner': 'Sơ cấp', '중급': 'Trung cấp', 'intermediate': 'Trung cấp', '고급': 'Cao cấp', 'advanced': 'Cao cấp'}
POS_KO = {'명사': 'danh từ', '동사': 'động từ', '형용사': 'tính từ', '부사': 'phó từ', '대명사': 'đại từ', '수사': 'số từ',
          '조사': 'trợ từ', '관형사': 'định từ', '감탄사': 'thán từ', '접사': 'phụ tố', '의존 명사': 'danh từ phụ thuộc',
          '보조 동사': 'động từ bổ trợ', '보조 형용사': 'tính từ bổ trợ', '어미': 'vĩ tố', '품사 없음': ''}


def _norm(v):
    """Chuẩn hóa nút XML/JSON thành dict[str(khóa thường) -> list]; lá là str."""
    if isinstance(v, dict):
        o = {}
        for k, x in v.items():
            o.setdefault(str(k).lower(), []).extend(x if isinstance(x, list) else [x])
        return {k: [_norm(i) for i in xs] for k, xs in o.items()}
    if isinstance(v, list):
        return [_norm(i) for i in v]
    return '' if v is None else str(v)


def _xml_obj(el):
    obj = {}
    for k, val in el.attrib.items():
        obj.setdefault(k.lower(), []).append(val)
    for ch in el:
        if ch.tag.lower() == 'feat' and 'att' in ch.attrib:
            obj.setdefault(ch.attrib['att'].lower(), []).append(ch.attrib.get('val', ''))
        else:
            obj.setdefault(ch.tag.lower(), []).append(_xml_obj(ch))
    txt = (el.text or '').strip()
    if not len(el) and not el.attrib:
        return txt
    if txt:
        obj.setdefault('#text', []).append(txt)
    return obj


def _find(obj, names, depth=2):
    """Tìm giá trị chuỗi đầu tiên của một trong các khóa `names` (không phân biệt hoa thường), sâu tối đa `depth` cấp."""
    if not isinstance(obj, dict):
        return ''
    for n in names:
        for v in obj.get(n, []):
            if isinstance(v, str) and v.strip():
                return v.strip()
            if isinstance(v, dict) and v.get('#text'):
                return v['#text'][0]
    if depth > 0:
        for k, vs in obj.items():
            for v in vs:
                if isinstance(v, dict):
                    r = _find(v, names, depth - 1)
                    if r:
                        return r
    return ''


def _lang_of(s):
    s = (s or '').strip().lower()
    if s in ('베트남어', 'vietnamese', 'vi', 'vie', '7') or 'viet' in s:
        return 'vi'
    if s in ('영어', 'english', 'en', 'eng', '1') or s.startswith('engl'):
        return 'en'
    return ''


def parse_krdict_entry(obj):
    w = _find(obj, ALIAS['headword'])
    if not w:
        return None
    vi, en = [], []
    for sense in obj.get('sense', []) + obj.get('senses', []) + obj.get('meaning', []):
        if not isinstance(sense, dict):
            continue
        for key in ALIAS['trans']:
            for t in sense.get(key, []):
                if not isinstance(t, dict):
                    continue
                lang = _lang_of(_find(t, ALIAS['t_lang'], 0))
                word = _find(t, ['trans_word', 'lemma', 'word', 'writtenform'], 0)
                if lang == 'vi' and word:
                    vi.append(word)
                elif lang == 'en' and word:
                    en.append(word)
    origin = _find(obj, ALIAS['origin'], 1)
    return {'w': w, 'grade': _find(obj, ALIAS['grade'], 1), 'pos': _find(obj, ALIAS['pos'], 1), 'pron': _find(obj, ALIAS['pron'], 1),
            'hanja': origin if has_cjk(origin) else '', 'code': _find(obj, ALIAS['code'], 0), 'vi': vi, 'en': en}


ENTRY_TAGS = {'lexicalentry', 'item', 'entry'}


def iter_krdict(ko_dir):
    files = []
    for dp, _, fns in os.walk(ko_dir):
        for fn in sorted(fns):
            if fn.lower().endswith(('.xml', '.json', '.zip')):
                files.append(os.path.join(dp, fn))
    if not files:
        return
    log('  đọc %d file trong %s' % (len(files), ko_dir))

    def from_stream(name, data):
        if name.lower().endswith('.xml'):
            for _, el in ET.iterparse(io.BytesIO(data), events=('end',)):
                if el.tag.lower() in ENTRY_TAGS:
                    yield _xml_obj(el)
                    el.clear()
        elif name.lower().endswith('.json'):
            j = json.loads(data.decode('utf-8-sig'))
            stack = [j]
            while stack:
                x = stack.pop()
                if isinstance(x, list):
                    if x and all(isinstance(i, dict) for i in x) and any(_find(_norm(i), ALIAS['headword'], 1) for i in x[:3]):
                        for i in x:
                            yield _norm(i)
                    else:
                        stack.extend(x)
                elif isinstance(x, dict):
                    stack.extend(x.values())

    for f in files:
        if f.lower().endswith('.zip'):
            with zipfile.ZipFile(f) as z:
                for n in sorted(z.namelist()):
                    if n.lower().endswith(('.xml', '.json')):
                        for o in from_stream(n, z.read(n)):
                            yield o
        else:
            with open(f, 'rb') as fh:
                for o in from_stream(f, fh.read()):
                    yield o


def build_ko(ko_dir, tr, topicizer, hanviet, overrides, include_ungraded, inspect=False):
    log('[ko] đọc Từ điển cơ bản từ ' + ko_dir)
    has_files = os.path.isdir(ko_dir) and any(fn.lower().endswith(('.xml', '.json', '.zip'))
                                               for _, _, fns in os.walk(ko_dir) for fn in fns)
    if not has_files:
        raise SystemExit(
            'Chưa có dữ liệu tiếng Hàn. Tải tay "사전 전체 내려받기" (XML hoặc JSON) từ https://krdict.korean.go.kr/ , '
            'giải nén/chép vào %s rồi chạy lại. Xem tools/sources/README.md.' % ko_dir)
    raw, total = [], 0
    for obj in iter_krdict(ko_dir):
        total += 1
        e = parse_krdict_entry(_norm(obj))
        if inspect and total <= 3:
            log('  mẫu %d: %s' % (total, json.dumps(e, ensure_ascii=False)))
        if e:
            raw.append(e)
    log('  %d mục đọc được / %d nút mục' % (len(raw), total))
    if not raw:
        raise SystemExit('Không nhận ra cấu trúc file krdict (0 mục có từ chính). Chạy với --inspect-ko và gửi phần log để chỉnh lại bộ đọc.')
    ents = []
    for e in raw:
        lvl = GRADE_VI.get(e['grade'].strip().lower()) or GRADE_VI.get(e['grade'].strip())
        if not lvl and not include_ungraded:
            continue
        if not (e['vi'] or e['en']):
            continue
        ents.append(dict(e, lvl=lvl or 'Chưa xếp cấp'))
    log('  giữ lại %d mục (%s)' % (len(ents), 'gồm cả từ chưa xếp cấp' if include_ungraded else 'chỉ từ có cấp độ'))
    for e in ents:
        if not e['vi'] and e['en']:
            tr.want(e['en'][0])
    tr.run()
    order = {l: i for i, l in enumerate(LEVELS['ko'] + ['Chưa xếp cấp'])}
    ents.sort(key=lambda e: (order[e['lvl']], e['w']))
    words, used = [], set()
    for e in ents:
        wid = 'ko:' + (e['code'] or '%s|%s' % (e['w'], e['pos']))
        if wid in used:
            wid += '#%d' % len(used)
        used.add(wid)
        auto = False
        if e['vi']:
            vi, seen = [], set()
            for x in e['vi']:
                for part in re.split(r'\s*;\s*', x):
                    if part and part.lower() not in seen:
                        seen.add(part.lower())
                        vi.append(part)
            mean = '; '.join(vi[:4])
        else:
            mean, auto = clean_vi(e['en'][0], tr.get(e['en'][0])), True
        pron = re.sub(r'[\[\]ː:]', '', e['pron'].split(',')[0]).strip() if e['pron'] else ''
        rom = hangul_to_romaja(pron if re.search(r'[\uAC00-\uD7A3]', pron) else e['w'])
        w = {'id': wid, 'w': e['w'], 'py': rom, 'hanja': e['hanja'], 'hv': hanviet.word(e['hanja'], title=True) if (hanviet and e['hanja']) else '',
             'pos': POS_KO.get(e['pos'], e['pos']), 'mean': mean, 'auto': auto, 'lvl': e['lvl'],
             'topic': topicizer.for_gloss(e['en'][0], 'v' if e['pos'] == '동사' else ('adj' if e['pos'] == '형용사' else None)) if (topicizer and e['en']) else 'general'}
        if wid in overrides:
            w['mean'], w['auto'] = overrides[wid], False
        words.append(w)
    lv = [l for l in LEVELS['ko'] + ['Chưa xếp cấp'] if any(w['lvl'] == l for w in words)]
    return words, ['krdict', 'unihan', 'wordnet'], lv


# =============================================================================================
def write_lang(out_dir, lang, words, levels, source_ids, translator_name):
    words = [dict(w) for w in words]
    for w in words:
        if w.get('auto') is False:
            w.pop('auto')
        for k in [k for k, v in w.items() if v in ('', None)]:
            if k not in ('mean',):
                w.pop(k)
    empty = sum(1 for w in words if not w.get('mean'))
    meta = {'generated_by': 'tools/build_data.py', 'script_version': SCRIPT_VERSION,
            'generated_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'sources': source_ids, 'license': DATA_LICENSE[lang], 'word_count': len(words), 'no_meaning': empty,
            'machine_translator': translator_name if lang != 'ko' else None}
    data = {'lang': lang, 'levels': levels, 'meta': meta, 'words': words}
    path = os.path.join(out_dir, lang + '.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    auto = sum(1 for w in words if w.get('auto'))
    log('  → %s: %d từ, %d nghĩa dịch tự động, %d chưa có nghĩa, %d KB' % (os.path.basename(path), len(words), auto, empty, os.path.getsize(path) // 1024))
    return meta


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--langs', default='en,zh,ja,ko')
    ap.add_argument('--out', default=DEFAULT_OUT)
    ap.add_argument('--cache', default=DEFAULT_CACHE)
    ap.add_argument('--ko-dir', default=DEFAULT_KO)
    ap.add_argument('--translator', choices=['opus', 'google', 'stub', 'none'], default='opus')
    ap.add_argument('--topics', choices=['wordnet', 'none'], default='wordnet')
    ap.add_argument('--offline', action='store_true', help='không tải mạng, chỉ dùng file đã có trong --cache')
    ap.add_argument('--ko-include-ungraded', action='store_true', help='giữ cả các từ krdict chưa xếp cấp (file rất lớn)')
    ap.add_argument('--inspect-ko', action='store_true', help='in vài mục krdict đọc được để kiểm tra định dạng')
    a = ap.parse_args()

    langs = [x for x in a.langs.split(',') if x]
    os.makedirs(a.out, exist_ok=True)
    os.makedirs(a.cache, exist_ok=True)
    overrides = {}
    if os.path.exists(OVERRIDES):
        overrides = {k: v for k, v in json.load(open(OVERRIDES, encoding='utf-8')).items() if not k.startswith('_') and isinstance(v, str)}
        log('Đã nạp %d nghĩa sửa tay từ %s' % (len(overrides), os.path.relpath(OVERRIDES, ROOT)))

    backend = {'opus': lambda: OpusTranslator(), 'google': lambda: GoogleTranslator(), 'stub': lambda: StubTranslator(), 'none': lambda: None}[a.translator]()
    tr = Translator(backend, a.cache)
    topicizer = Topicizer() if a.topics == 'wordnet' else None
    os.makedirs(os.path.join(a.cache, 'unihan'), exist_ok=True)
    hanviet = HanViet(os.path.join(a.cache, 'unihan'), a.offline) if any(l in langs for l in ('zh', 'ja', 'ko')) else None

    metas = {}
    tname = backend.name if backend else None
    if 'en' in langs:
        words, src = build_en(a.cache, a.offline, tr, topicizer, overrides)
        metas['en'] = write_lang(a.out, 'en', words, LEVELS['en'], src, tname)
    if 'zh' in langs:
        words, src = build_zh(a.cache, a.offline, tr, topicizer, hanviet, overrides)
        metas['zh'] = write_lang(a.out, 'zh', words, LEVELS['zh'], src, tname)
    if 'ja' in langs:
        words, src = build_ja(a.cache, a.offline, tr, topicizer, hanviet, overrides)
        metas['ja'] = write_lang(a.out, 'ja', words, LEVELS['ja'], src, tname)
    if 'ko' in langs:
        words, src, lv = build_ko(a.ko_dir, tr, topicizer, hanviet, overrides, a.ko_include_ungraded, a.inspect_ko)
        metas['ko'] = write_lang(a.out, 'ko', words, lv, src, tname)

    # topics.json giữ nguyên; sources.json cho màn hình "Nguồn & giấy phép"
    used = {s for m in metas.values() for s in m['sources']}
    src_path = os.path.join(a.out, 'sources.json')
    prev = json.load(open(src_path, encoding='utf-8')) if os.path.exists(src_path) else {}
    built = dict(prev.get('built', {}))
    for l, m in metas.items():
        built[l] = {'generated_at': m['generated_at'], 'word_count': m['word_count'], 'license': m['license']}
    all_used = sorted(used | set(prev.get('used', [])))
    doc = {'generated_by': 'tools/build_data.py', 'script_version': SCRIPT_VERSION, 'built': built, 'used': all_used,
           'sources': [s for s in SOURCES if s['id'] in all_used],
           'notes': ['Nghĩa tiếng Việt của tiếng Anh/Trung/Nhật là bản DỊCH TỰ ĐỘNG, có thể sai ở từ nhiều nghĩa (app đánh nhãn "dịch tự động").',
                     'Âm Hán Việt và chủ đề được suy ra tự động, có thể có ngoại lệ.']}
    json.dump(doc, open(src_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    log('Xong. Đã ghi sources.json (%d nguồn).' % len(doc['sources']))


if __name__ == '__main__':
    main()
