# -*- coding: utf-8 -*-
"""Tiện ích chữ viết dùng chung cho build_data.py: kana → romaji, Hangul → romaja (Romanization hiện hành), Hán tự."""
import re

# ---------------------------------------------------------------- kana -> romaji
_MONO = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'i', 'ゑ': 'e', 'を': 'o', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'ゎ': 'wa', 'ゔ': 'vu',
}
_DI = {}
# sh/ch/j + ゃゅょ → sha/shu/sho, cha/chu/cho, ja/ju/jo
for _k, _r in {'し': 'sh', 'ち': 'ch', 'じ': 'j', 'ぢ': 'j'}.items():
    _DI[_k + 'ゃ'] = _r + 'a'; _DI[_k + 'ゅ'] = _r + 'u'; _DI[_k + 'ょ'] = _r + 'o'
for _k, _r in {'き': 'ky', 'ぎ': 'gy', 'に': 'ny', 'ひ': 'hy', 'び': 'by', 'ぴ': 'py', 'み': 'my', 'り': 'ry'}.items():
    _DI[_k + 'ゃ'] = _r + 'a'; _DI[_k + 'ゅ'] = _r + 'u'; _DI[_k + 'ょ'] = _r + 'o'
# âm ngoại lai: ファ, ティ, ウィ, チェ …
_DI.update({'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo', 'てぃ': 'ti', 'でぃ': 'di', 'とぅ': 'tu', 'どぅ': 'du',
            'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo', 'ちぇ': 'che', 'しぇ': 'she', 'じぇ': 'je', 'ゔぁ': 'va', 'ゔぃ': 'vi',
            'ゔぇ': 've', 'ゔぉ': 'vo', 'つぁ': 'tsa', 'つぃ': 'tsi', 'つぇ': 'tse', 'つぉ': 'tso', 'いぇ': 'ye'})


def to_hiragana(s):
    out = []
    for ch in s:
        o = ord(ch)
        out.append(chr(o - 0x60) if 0x30A1 <= o <= 0x30F6 else ch)
    return ''.join(out)


def kana_to_romaji(s):
    """Phiên âm máy móc (ほうたい → houtai, コーヒー → koohii). Ký tự không phải kana được giữ nguyên."""
    s = to_hiragana(s or '')
    out, i, small_tsu = [], 0, False
    while i < len(s):
        c = s[i]
        if c == 'っ':
            small_tsu = True; i += 1; continue
        if c == 'ー':
            if out and out[-1] and out[-1][-1] in 'aiueo':
                out.append(out[-1][-1])
            i += 1; continue
        if s[i:i + 2] in _DI:
            r = _DI[s[i:i + 2]]; i += 2
        elif c in _MONO:
            r = _MONO[c]; i += 1
        else:
            out.append(c); i += 1; small_tsu = False
            continue
        if small_tsu:
            r = ('t' + r) if r.startswith('ch') else (r[0] + r)
            small_tsu = False
        out.append(r)
    return ''.join(out)


# ---------------------------------------------------------------- Hangul -> romaja (Romanization hiện hành, chuyển tự từng âm tiết)
_L = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
_V = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
_T = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']
assert len(_L) == 19 and len(_V) == 21 and len(_T) == 28


def hangul_to_romaja(s):
    """Chuyển tự Hangul → chữ La-tinh. Nên đưa vào chuỗi PHÁT ÂM (đã biến âm) để ra âm gần đúng nhất."""
    out, prev_final = [], 0
    for ch in s or '':
        o = ord(ch) - 0xAC00
        if 0 <= o < 11172:
            l, v, t = o // 588, (o % 588) // 28, o % 28
            init = _L[l]
            if l == 5 and prev_final == 8:  # ㄹ + ㄹ → ll
                init = 'l'
            out.append(init + _V[v] + _T[t])
            prev_final = t
        else:
            out.append(ch)
            prev_final = 0
    return ''.join(out)


# ---------------------------------------------------------------- Hán tự
_CJK = re.compile(r'[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\U00020000-\U0002FFFF]')


def is_cjk(ch):
    return bool(_CJK.fullmatch(ch))


def has_cjk(s):
    return bool(_CJK.search(s or ''))
