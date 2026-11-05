#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chốt chặn cho bản phát hành: dữ liệu phải do tools/build_data.py dựng lại (có nguồn + giấy phép), không phải bản cũ.
Thoát mã 1 nếu không đạt. Dùng trong build.yml trước khi dựng AAB."""
import json
import os
import sys

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app', 'src', 'main', 'assets', 'www', 'data')
MIN_WORDS = {'en': 3000, 'zh': 3000, 'ja': 2000, 'ko': 1000}
MAX_EMPTY = 0.05


def main(data=DATA):
    errs = []
    try:
        src = json.load(open(os.path.join(data, 'sources.json'), encoding='utf-8'))
        if src.get('generated_by') != 'tools/build_data.py' or not src.get('sources'):
            errs.append('sources.json không do tools/build_data.py tạo ra')
    except Exception as e:
        errs.append('Không đọc được sources.json: %s' % e)
    for lang, mn in MIN_WORDS.items():
        p = os.path.join(data, lang + '.json')
        try:
            d = json.load(open(p, encoding='utf-8'))
        except Exception as e:
            errs.append('%s.json: không đọc được (%s)' % (lang, e)); continue
        m = d.get('meta') or {}
        if m.get('generated_by') != 'tools/build_data.py':
            errs.append('%s.json là dữ liệu CŨ (thiếu meta do build_data.py tạo) - hãy chạy workflow "Build data" trước' % lang); continue
        n = len(d.get('words', []))
        if n < mn:
            errs.append('%s.json chỉ có %d từ (tối thiểu %d)' % (lang, n, mn))
        empty = sum(1 for w in d['words'] if not w.get('mean'))
        if n and empty / n > MAX_EMPTY:
            errs.append('%s.json: %d/%d từ chưa có nghĩa (> %d%%) - dịch chưa chạy?' % (lang, empty, n, MAX_EMPTY * 100))
        if not m.get('license') or not m.get('sources'):
            errs.append('%s.json thiếu thông tin giấy phép/nguồn trong meta' % lang)
    if errs:
        print('DỮ LIỆU CHƯA ĐỦ ĐIỀU KIỆN PHÁT HÀNH:')
        for e in errs:
            print(' -', e)
        return 1
    print('Dữ liệu hợp lệ cho bản phát hành.')
    return 0


if __name__ == '__main__':
    sys.exit(main(*(sys.argv[1:2] or [])))
