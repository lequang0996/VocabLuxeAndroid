'use strict';
/* VocabLuxe (Android) – giao diện sáng/tối; bản chuyển từ tool PC (engine.py + app.py). Toàn bộ dữ liệu nằm trong app; chỉ nghĩa tiếng Anh
   và câu ví dụ còn thiếu mới tra online (có cache). Phát âm dùng TextToSpeech của máy, không tạo file. */
(() => {
  const $ = (id) => document.getElementById(id);
  const ANDROID = window.AndroidBridge || null;
  const ROW_H = 66;
  const ALL_LEVELS = 'Mọi cấp';
  const ic = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';

  const LANGS = {
    en: { code: 'en', name: 'Tiếng Anh', file: 'en.json', tts: 'en-US', gtx: 'en', tatoeba: 'eng', htmlLang: 'en',
          subLabel: 'LOẠI TỪ', levels: ['A1', 'A2', 'B1', 'B2', 'C1'] },
    zh: { code: 'zh', name: 'Tiếng Trung', file: 'zh.json', tts: 'zh-CN', gtx: 'zh-CN', tatoeba: 'cmn', htmlLang: 'zh-CN',
          subLabel: 'PINYIN', levels: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] },
  };
  const ORDER = ['en', 'zh'];
  const POS_NAMES = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', pron: 'pronoun',
    conj: 'conjunction', exclam: 'interjection', det: 'determiner', modal: 'verb', auxiliary: 'verb', number: 'noun', noun: 'noun' };
  const POS_VI = { noun: 'danh từ', verb: 'động từ', adjective: 'tính từ', adverb: 'trạng từ', preposition: 'giới từ',
    pronoun: 'đại từ', conjunction: 'liên từ', interjection: 'thán từ', determiner: 'từ hạn định' };

  /* ------------------------------------------------------------------ */
  /*  Tiện ích chuỗi                                                     */
  /* ------------------------------------------------------------------ */
  const nfc = (x) => {
    if (typeof x === 'string') return x.normalize('NFC');
    if (Array.isArray(x)) return x.map(nfc);
    if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x)) o[k] = nfc(x[k]); return o; }
    return x;
  };
  const fold = (s) => (s || '').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const escRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isEmpty = (v) => v == null || v === '' || (typeof v === 'object' && Object.keys(v).length === 0);
  const posTokens = (p) => (String(p || '').toLowerCase().match(/[a-z]+/g) || []);
  const posNames = (p) => { const out = []; for (const t of posTokens(p)) { const n = POS_NAMES[t]; if (n && !out.includes(n)) out.push(n); } return out; };

  /* ------------------------------------------------------------------ */
  /*  Lưu trữ: cache (IndexedDB), trạng thái & tiến độ (localStorage)    */
  /* ------------------------------------------------------------------ */
  const KV = (() => {
    const mem = new Map();
    let db = null;
    const ready = new Promise((resolve) => {
      try {
        const rq = indexedDB.open('vocabluxe', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
        rq.onerror = () => resolve();
        rq.onsuccess = () => {
          db = rq.result;
          try {
            const cur = db.transaction('kv').objectStore('kv').openCursor();
            cur.onsuccess = () => { const c = cur.result; if (c) { mem.set(c.key, c.value); c.continue(); } else resolve(); };
            cur.onerror = () => resolve();
          } catch (e) { resolve(); }
        };
      } catch (e) { resolve(); }
    });
    return {
      ready,
      get: (k) => (mem.has(k) ? mem.get(k) : null),
      set: (k, v) => { mem.set(k, v); if (db) { try { db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch (e) { /* bỏ qua */ } } },
    };
  })();

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } },
  };
  const state = Object.assign({ auto_play: false, review: false, lang: 'en', theme: null }, ls.get('vl_state', {}));
  const saveState = () => ls.set('vl_state', state);

  /* ---- Giao diện Sáng / Tối: lần đầu theo hệ thống, sau đó nhớ lựa chọn của người dùng ---- */
  const systemDark = () => {
    try { if (ANDROID && ANDROID.isSystemDark) return !!ANDROID.isSystemDark(); } catch (e) { /* bỏ qua */ }
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  };
  const currentTheme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  function applyTheme(t, persist) {
    document.documentElement.setAttribute('data-theme', t);
    const mc = document.querySelector('meta[name=theme-color]');
    if (mc) mc.setAttribute('content', t === 'dark' ? '#0E1018' : '#F4F5FB');
    const b = document.getElementById('btnTheme');
    if (b) b.setAttribute('aria-label', t === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
    if (persist) { state.theme = t; saveState(); }
    try { if (ANDROID && ANDROID.setTheme) ANDROID.setTheme(t === 'dark'); } catch (e) { /* bỏ qua */ }
  }

  const progRaw = ls.get('vl_progress', {});
  if (progRaw.ja || progRaw.ko) { delete progRaw.ja; delete progRaw.ko; ls.set('vl_progress', progRaw); } // bản cũ có tiếng Nhật/Hàn
  const prog = {};
  const progOf = (code) => {
    if (!prog[code]) {
      const r = progRaw[code] || {};
      prog[code] = { learned: new Set(r.learned || []), fav: new Set(r.fav || []) };
    }
    return prog[code];
  };
  const saveProgress = () => {
    const o = {};
    for (const c of Object.keys(prog)) o[c] = { learned: [...prog[c].learned], fav: [...prog[c].fav] };
    for (const c of Object.keys(progRaw)) if (!o[c]) o[c] = progRaw[c];
    ls.set('vl_progress', o);
  };

  /* ------------------------------------------------------------------ */
  /*  Mạng: qua cầu nối Android (không bị CORS), hoặc fetch khi chạy web  */
  /* ------------------------------------------------------------------ */
  const pending = new Map();
  let netId = 0;
  window.__net = (id, status, body) => {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    clearTimeout(p.t);
    if (status >= 200 && status < 300) p.res(body);
    else { const e = new Error(status > 0 ? 'HTTP ' + status : (body || 'Không kết nối được')); e.status = status; p.rej(e); }
  };
  function httpGet(url, timeout = 12000) {
    if (ANDROID) {
      return new Promise((res, rej) => {
        const id = ++netId;
        const t = setTimeout(() => { pending.delete(id); rej(new Error('Hết thời gian chờ')); }, timeout + 4000);
        pending.set(id, { res, rej, t });
        try { ANDROID.get(id, url); } catch (e) { pending.delete(id); clearTimeout(t); rej(e); }
      });
    }
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    return fetch(url, { signal: ctl.signal }).then((r) => {
      clearTimeout(t);
      if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.text();
    });
  }
  async function getJson(url, params, timeout) {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params || {})) (Array.isArray(v) ? v : [v]).forEach((x) => u.searchParams.append(k, x));
    return nfc(JSON.parse(await httpGet(u.toString(), timeout)));
  }

  /* ------------------------------------------------------------------ */
  /*  Dịch vụ tra cứu (port từ engine.py)                                */
  /* ------------------------------------------------------------------ */
  async function gtxTranslate(text, sl, tl = 'vi') {
    const j = await getJson('https://translate.googleapis.com/translate_a/single',
      { client: 'gtx', sl, tl, dt: ['t', 'bd'], q: text });
    const main = ((j[0] || []).filter((s) => s && typeof s[0] === 'string').map((s) => s[0]).join('')).trim();
    const byPos = {};
    if (j.length > 1 && j[1]) {
      for (const e of j[1]) {
        if (e && typeof e[0] === 'string' && e.length > 1 && Array.isArray(e[1])) byPos[e[0].toLowerCase()] = e[1].filter((t) => typeof t === 'string');
      }
    }
    if (!main) throw new Error('Google trả về rỗng');
    return { main, byPos };
  }
  async function myMemoryTranslate(text, sl, tl = 'vi') {
    const j = await getJson('https://api.mymemory.translated.net/get', { q: text, langpair: sl + '|' + tl });
    const main = (((j.responseData || {}).translatedText) || '').trim();
    if (!main || !['200', 'undefined', 'null'].includes(String(j.responseStatus))) throw new Error('MyMemory: ' + (j.responseDetails || 'rỗng'));
    return { main, byPos: {} };
  }
  async function translateVi(text, sl) {
    const errs = [];
    for (const [name, fn] of [['Google', gtxTranslate], ['MyMemory', myMemoryTranslate]]) {
      try { return await fn(text, sl); } catch (e) { errs.push(name + ': ' + String(e.message || e).slice(0, 70)); }
    }
    throw new Error(errs.join(' | '));
  }
  function buildMeaning(tr, posStr) {
    const wanted = posNames(posStr);
    const by = tr.byPos || {}, main = tr.main || '';
    let primary = [];
    for (const n of wanted) primary = primary.concat((by[n] || []).slice(0, 4));
    if (main && !primary.some((p) => p.toLowerCase() === main.toLowerCase())) primary.unshift(main);
    const seen = new Set(), mean = [];
    for (const p of primary) { const k = p.toLowerCase(); if (!seen.has(k)) { seen.add(k); mean.push(p); } }
    const more = Object.entries(by).filter(([n, terms]) => !wanted.includes(n) && terms.length)
      .map(([n, terms]) => (POS_VI[n] || n) + ': ' + terms.slice(0, 3).join(', '));
    return { mean: mean.slice(0, 4).join('; ') || main, more: more.slice(0, 3).join(' · ') };
  }
  async function dictLookup(word) {
    let txt;
    try { txt = await httpGet('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word), 10000); }
    catch (e) { if (e.status === 404) return { phon: '', defs: [] }; throw e; }
    const j = nfc(JSON.parse(txt));
    let phon = '';
    for (const e of j) {
      phon = e.phonetic || ((e.phonetics || []).find((p) => p.text) || {}).text || '';
      if (phon) break;
    }
    const defs = [];
    for (const e of j) for (const m of (e.meanings || [])) for (const d of (m.definitions || []).slice(0, 3)) {
      defs.push({ pos: m.partOfSpeech || '', def: d.definition || '', ex: d.example || '' });
    }
    return { phon, defs: defs.slice(0, 10) };
  }
  const flatten = (x) => (Array.isArray(x) ? x.flatMap(flatten) : (x && typeof x === 'object' ? [x] : []));
  async function tatoebaSearch(word, code, needVi) {
    const p = { from: LANGS[code].tatoeba, query: word, orphans: 'no', unapproved: 'no', sort: 'relevance' };
    if (needVi) { p.to = 'vie'; p.trans_filter = 'limit'; }
    return (await getJson('https://tatoeba.org/en/api_v0/search', p, 14000)).results || [];
  }
  async function tatoebaExample(word, code) {
    const cjk = code !== 'en';
    const base = word.replace(/^[～~]+/, '') || word;
    const rx = cjk ? null : new RegExp('\\b' + escRx(word) + '\\w{0,3}\\b', 'i');
    const [lo, hi] = cjk ? [5, 50] : [22, 110];
    const stems = [word];
    if (cjk) {
      const core = base;
      if (core !== word && core) stems.push(core);
    }
    for (const needVi of [true, false]) {
      let results;
      try { results = await tatoebaSearch(base, code, needVi); } catch (e) { if (needVi) continue; throw e; }
      const cands = [];
      for (const r of results) {
        const t = (r.text || '').trim();
        if (t.length < lo || t.length > hi) continue;
        let score;
        if (cjk) { if (!stems.some((s) => s && t.includes(s))) continue; score = t.includes(base) ? 0 : 15; }
        else { if (!rx.test(t)) continue; score = 0; }
        const d = flatten(r.translations || []).find((x) => x.lang === 'vie' && x.text);
        const vi = d ? d.text.trim() : '';
        score += Math.abs(t.length - (cjk ? 22 : 55)) - (vi ? 40 : 0);
        cands.push([score, t, vi]);
      }
      if (cands.length) { cands.sort((a, b) => a[0] - b[0]); return { ex: cands[0][1], vi: cands[0][2] }; }
    }
    return {};
  }

  /* ---- Engine: cache + ghép thông tin cho một từ ---- */
  async function cached(key, fn, storeEmpty = true) {
    const v = KV.get(key);
    if (v !== null && (!isEmpty(v) || storeEmpty)) return v;
    const r = await fn();
    if (!isEmpty(r) || storeEmpty) KV.set(key, r);
    return r;
  }
  const queryOf = (w) => w.w.split(',')[0].trim();
  const keyTail = (w) => w.w + '|' + (w.pos || w.py || '');
  const partTr = (lang, w) => cached('tr:' + lang.code + ':' + keyTail(w), async () => {
    const tr = await translateVi(queryOf(w), lang.gtx);
    return lang.code === 'en' ? buildMeaning(tr, w.pos || '') : { mean: tr.main, more: '' };
  });
  const partDic = (w) => cached('dic:en:' + w.w.toLowerCase(), () => dictLookup(queryOf(w)));
  const partEx = (lang, w) => cached('ex2:' + lang.code + ':' + w.w.toLowerCase() + '|' + (w.pos || w.py || ''), async () => {
    const ex = await tatoebaExample(queryOf(w), lang.code);
    if (!isEmpty(ex)) {
      if (!ex.vi) ex.vi = (await translateVi(ex.ex, lang.gtx)).main;
      return ex;
    }
    if (lang.code === 'en') {
      const d = await partDic(w);
      const names = posNames(w.pos);
      const pool = d.defs.filter((x) => x.ex).sort((a, b) => (names.includes(a.pos) ? 0 : 1) - (names.includes(b.pos) ? 0 : 1));
      if (pool.length) return { ex: pool[0].ex, vi: (await translateVi(pool[0].ex, 'en')).main };
    }
    return {};
  }, false);

  const localPhon = (code, w) => w.py || '';
  const localMore = (code, w) => (code === 'zh' && w.hv ? 'Âm Hán Việt: ' + w.hv : '');

  async function fetchInfo(lang, w, onPart) {
    const code = lang.code;
    const out = { mean: '', more: '', phon: '', def_en: '', ex: '', ex_phon: '', ex_vi: '', failed: [], done: [], err: '' };
    const snap = () => ({ ...out, failed: [...out.failed], done: [...out.done] });
    const tasks = [];
    const run = (kind, p) => tasks.push(p.then((r) => ({ kind, r }), (e) => ({ kind, e })));
    if (code === 'en') {
      run('tr', partTr(lang, w)); run('dic', partDic(w)); run('ex', partEx(lang, w));
    } else {
      Object.assign(out, { mean: w.mean || '', more: localMore(code, w), phon: localPhon(code, w),
        ex: w.ex || '', ex_phon: w.ex_py || '', ex_vi: w.ex_vi || '' });
      out.done.push('dic');
      if (out.mean) out.done.push('tr'); else run('tr', partTr(lang, w));
      if (out.ex) out.done.push('ex'); else run('ex', partEx(lang, w));
      if (onPart) onPart(snap());
    }
    const names = posNames(w.pos);
    await Promise.all(tasks.map(async (t) => {
      const { kind, r, e } = await t;
      if (e) { out.failed.push(kind); out.err = (out.err ? out.err + ' ' : '') + String(e.message || e).slice(0, 160); }
      else if (kind === 'tr') {
        out.mean = r.mean || '';
        if (code === 'en') out.more = r.more || '';
        else if (w.auto || !w.mean) out.more = (out.more ? out.more + '   ·   ' : '') + 'Nghĩa dịch tự động';
      } else if (kind === 'dic') {
        out.phon = r.phon || '';
        const defs = r.defs || [];
        const pick = defs.find((d) => names.includes(d.pos)) || defs[0];
        out.def_en = pick ? pick.def : '';
      } else if (kind === 'ex') { out.ex = r.ex || ''; out.ex_vi = r.vi || ''; }
      out.done.push(kind);
      if (onPart) onPart(snap());
    }));
    return out;
  }

  /* ------------------------------------------------------------------ */
  /*  Phát âm: TextToSpeech của Android (hoặc speechSynthesis khi chạy web) */
  /* ------------------------------------------------------------------ */
  function cleanTts(text) {
    let t = (text || '').replace(/\([^)]*\)/g, ' ').replace(/™/g, '').replace(/\//g, ' ').replace(/～/g, ' ').replace(/~/g, ' ');
    if (t.includes(',') && t.length < 20) t = t.split(',')[0];
    return t.replace(/\s+/g, ' ').trim();
  }
  function speak(lang, text, slow) {
    const t = cleanTts(text);
    if (!t) return;
    if (ANDROID) { try { ANDROID.speak(lang.tts, t, !!slow); } catch (e) { say('Không phát được âm thanh.', 6000); } return; }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang.tts; u.rate = slow ? 0.6 : 1;
      speechSynthesis.speak(u);
    } else say('Thiết bị không hỗ trợ phát âm.', 6000);
  }
  window.__ttsError = (msg) => say(msg, 9000);

  /* ------------------------------------------------------------------ */
  /*  Trạng thái giao diện                                               */
  /* ------------------------------------------------------------------ */
  const S = { lang: LANGS.en, words: [], view: [], levels: [], cur: null, curIndex: -1, info: {}, token: 0, topic: 'all',
    reveal: true, practice: false, filter: 'all', level: ALL_LEVELS, loading: 0 };
  let TOPICS = [], TOPIC_MAP = {};
  const dataCache = {};
  const isWide = () => window.matchMedia('(min-width: 900px)').matches;
  const body = document.body;

  let toastTimer = null;
  function say(msg, ms = 4000) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------------- ngôn ngữ / chủ đề / lọc ---------------- */
  function buildLangButtons() {
    const box = $('langs');
    box.innerHTML = '';
    for (const c of ORDER) {
      const b = document.createElement('button');
      b.textContent = LANGS[c].name;
      b.dataset.code = c;
      b.addEventListener('click', () => loadLanguage(c));
      box.appendChild(b);
    }
  }
  async function loadLanguage(code) {
    const cfg = LANGS[code];
    const my = ++S.loading;
    if (!dataCache[code]) {
      say('Đang mở dữ liệu ' + cfg.name + '…', 15000);
      try {
        const r = await fetch('data/' + cfg.file);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        for (const w of data.words) {
          for (const k of ['w', 'py', 'hv', 'mean', 'ex', 'ex_py', 'ex_vi', 'pos', 'note']) if (typeof w[k] === 'string') w[k] = w[k].normalize('NFC');
          w._h = fold([w.w, w.py, w.mean, w.pos, w.hv].filter(Boolean).join(' '));
        }
        dataCache[code] = data;
      } catch (e) { say('Không mở được dữ liệu ' + cfg.name + ': ' + e.message, 8000); return; }
    }
    if (my !== S.loading) return;
    const data = dataCache[code];
    S.lang = cfg;
    S.words = data.words;
    S.levels = data.levels && data.levels.length ? data.levels : cfg.levels;
    state.lang = code; saveState();
    $('detail').dataset.lang = code;
    $('word').lang = cfg.htmlLang; $('ex').lang = cfg.htmlLang;
    for (const b of $('langs').children) b.classList.toggle('on', b.dataset.code === code);
    S.topic = 'all'; S.filter = 'all'; S.level = ALL_LEVELS;
    for (const b of $('seg').children) b.classList.toggle('on', b.dataset.v === 'all');
    $('search').value = '';
    $('btnClear').hidden = true;
    updateLevelBtn();
    rebuildTopics();
    applyFilters();
    updateStats();
    $('toast').classList.remove('show');
  }

  function rebuildTopics() {
    const counts = {};
    for (const w of S.words) counts[w.topic] = (counts[w.topic] || 0) + 1;
    const rows = [{ id: 'all', name: 'Tất cả chủ đề', sym: null, n: S.words.length }];
    for (const t of TOPICS) if (counts[t.id]) rows.push({ id: t.id, name: t.name, sym: t.sym, n: counts[t.id] });
    const box = $('topics');
    box.innerHTML = rows.map((r) => '<button class="trow" data-t="' + esc(r.id) + '"><span class="tsym">' + (r.sym ? esc(r.sym) + '\uFE0E' : ic('grid')) + '</span><span class="tname">' +
      esc(r.name) + '</span><span class="tn">' + r.n + '</span></button>').join('');
    highlightTopic();
  }
  function highlightTopic(active = true) {
    for (const b of $('topics').children) b.classList.toggle('on', active && b.dataset.t === S.topic);
  }

  function applyFilters() {
    const code = S.lang.code, p = progOf(code);
    const q = fold($('search').value.trim());
    const lv = S.level || ALL_LEVELS;
    const res = [];
    for (const w of S.words) {
      if (S.topic !== 'all' && w.topic !== S.topic) continue;
      if (lv !== ALL_LEVELS && w.lvl !== lv) continue;
      const done = p.learned.has(w.id);
      if (S.filter === 'todo' && done) continue;
      if (S.filter === 'done' && !done) continue;
      if (S.filter === 'fav' && !p.fav.has(w.id)) continue;
      if (q && !w._h.includes(q)) continue;
      res.push(w);
    }
    const t = S.topic === 'all' ? { name: 'Tất cả chủ đề' } : (TOPIC_MAP[S.topic] || { name: 'Chủ đề' });
    S.practice = false;
    highlightTopic(true);
    showList(res, t.name, res.length.toLocaleString('vi-VN') + ' từ');
  }

  function showList(res, title, subtitle) {
    S.view = res;
    $('lTitle').textContent = title;
    $('lCount').textContent = subtitle;
    $('list').scrollTop = 0;
    S.curIndex = res.length ? 0 : -1;
    renderRows();
    if (res.length) selectIndex(0, { open: false }); else showEmpty();
  }

  /* ---------------- danh sách ảo (mượt với 17.000 từ) ---------------- */
  function rowHtml(i) {
    const w = S.view[i], p = progOf(S.lang.code);
    const done = p.learned.has(w.id), fav = p.fav.has(w.id);
    const sub = S.lang.code === 'en' ? (w.pos || '') : (w.py || '');
    return '<div class="row' + (i === S.curIndex ? ' sel' : '') + (done ? ' done' : '') + '" data-i="' + i + '" style="top:' + (i * ROW_H) + 'px"><div class="card">' +
      '<div class="rmain"><div class="rw" lang="' + S.lang.htmlLang + '">' + esc(w.w) + '</div><div class="rs">' + esc(sub) + '</div></div>' +
      '<div class="rtags">' + (fav ? ic('star', 'rf') : '') + '<span class="rl">' + esc(w.lvl) + '</span>' + (done ? ic('checkc', 'rc') : '') + '</div></div></div>';
  }
  function renderRows() {
    const list = $('list'), rows = $('rows');
    rows.style.height = S.view.length * ROW_H + 'px';
    if (!S.view.length) { rows.style.height = 'auto'; rows.innerHTML = '<div class="empty">Không có từ nào khớp bộ lọc.<br>Thử bỏ bớt bộ lọc hoặc đổi từ khóa.</div>'; return; }
    const top = list.scrollTop, h = list.clientHeight || 600;
    const a = Math.max(0, Math.floor(top / ROW_H) - 8), b = Math.min(S.view.length, Math.ceil((top + h) / ROW_H) + 8);
    let html = '';
    for (let i = a; i < b; i++) html += rowHtml(i);
    rows.innerHTML = html;
  }
  let raf = 0;
  $('list').addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; renderRows(); }); }, { passive: true });
  window.addEventListener('resize', renderRows);
  $('rows').addEventListener('click', (e) => {
    const r = e.target.closest('.row');
    if (r) selectIndex(parseInt(r.dataset.i, 10), { open: true });
  });
  function scrollToIndex(i) {
    const list = $('list'), top = i * ROW_H, h = list.clientHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + ROW_H > list.scrollTop + h) list.scrollTop = top + ROW_H - h;
  }

  function updateStats() {
    const code = S.lang.code, n = progOf(code).learned.size, total = Math.max(1, S.words.length);
    $('stats').textContent = 'Đã thuộc ' + n.toLocaleString('vi-VN') + ' / ' + S.words.length.toLocaleString('vi-VN') + ' từ · ' + Math.round((100 * n) / total) + '%';
    $('barFill').style.width = Math.min(100, (100 * n) / total) + '%';
  }

  /* ---------------- chọn / hiển thị một từ ---------------- */
  // Báo cho Android biết nút Back có việc để làm không (đóng chi tiết / đóng menu)
  function syncBack() {
    if (!ANDROID) return;
    const can = body.classList.contains('legal-open') || body.classList.contains('drawer-open') || body.classList.contains('sheet-open') || (!isWide() && body.classList.contains('detail-open'));
    try { ANDROID.canGoBack(can); } catch (e) { /* bỏ qua */ }
  }
  function openDetail() { body.classList.add('detail-open'); syncBack(); }
  function closeDetail() { body.classList.remove('detail-open'); syncBack(); }
  function openDrawer() { body.classList.add('drawer-open'); syncBack(); }
  function openLegal() { closeDrawer(); body.classList.add('legal-open'); $('legalScroll').scrollTop = 0; syncBack(); }
  function closeLegal() { body.classList.remove('legal-open'); syncBack(); }
  function closeDrawer() { body.classList.remove('drawer-open'); syncBack(); }

  /* ---- Bảng chọn cấp độ (thay cho dropdown mặc định của hệ thống) ---- */
  function updateLevelBtn() {
    const b = $('btnLevel');
    b.hidden = !S.levels.length;
    $('levelText').textContent = S.level;
    b.classList.toggle('active', S.level !== ALL_LEVELS);
  }
  function openSheet() {
    if (!S.levels.length) return;
    const cnt = {};
    for (const w of S.words) cnt[w.lvl] = (cnt[w.lvl] || 0) + 1;
    const opts = [[ALL_LEVELS, S.words.length]].concat(S.levels.map((l) => [l, cnt[l] || 0]));
    $('sheetList').innerHTML = opts.map(([l, n]) => '<button class="opt' + (l === S.level ? ' on' : '') + '" data-v="' + esc(l) + '">' +
      '<span>' + esc(l) + '</span><span class="cnt">' + n.toLocaleString('vi-VN') + ' từ</span>' + ic('check', 'oc') + '</button>').join('');
    body.classList.add('sheet-open'); syncBack();
  }
  function closeSheet() { body.classList.remove('sheet-open'); syncBack(); }
  window.matchMedia('(min-width: 900px)').addEventListener('change', syncBack);

  function selectIndex(i, { open }) {
    if (!S.view.length) return;
    i = Math.min(Math.max(i, 0), S.view.length - 1);
    S.curIndex = i;
    S.cur = S.view[i];
    renderRows();
    scrollToIndex(i);
    if (open) openDetail();
    if (open || isWide()) showWord(S.cur);
  }
  function move(d) { if (S.view.length) selectIndex(S.curIndex + d, { open: !isWide() }); }

  function showEmpty() {
    S.cur = null; S.token++;
    for (const id of ['chipTopic', 'chipLvl', 'chipPos', 'word', 'phon', 'mean', 'more', 'defEn', 'ex', 'exPhon', 'exVi']) $(id).textContent = '';
    $('btnReveal').style.display = 'none'; $('btnExPlay').style.display = 'none';
    $('btnLearn').textContent = ''; $('btnFav').textContent = '';
  }

  function showWord(w) {
    S.cur = w;
    const tok = ++S.token, lang = S.lang;
    S.info = {};
    S.reveal = !(state.review || S.practice);
    const t = TOPIC_MAP[w.topic] || TOPIC_MAP.general;
    $('chipTopic').textContent = t.name;
    $('chipLvl').textContent = w.lvl;
    let extra = w.pos || '';
    if (w.note) extra = (extra + '  (' + w.note + ')').trim();
    $('chipPos').textContent = extra;
    $('word').textContent = w.w;
    $('dscroll').scrollTop = 0;
    refreshMarks();
    render();
    fetchInfo(lang, w, (d) => { if (tok === S.token) { Object.assign(S.info, d); render(); } })
      .catch((e) => { if (tok === S.token) { Object.assign(S.info, { failed: ['tr', 'ex'], done: ['tr', 'dic', 'ex'], err: String(e.message || e).slice(0, 160) }); render(); } });
    if (state.auto_play) speak(lang, w.w, false);
  }

  function render() {
    const w = S.cur, d = S.info;
    if (!w) return;
    const done = d.done || [], failed = d.failed || [];
    const hidden = (state.review || S.practice) && !S.reveal;
    $('phon').textContent = d.phon ? d.phon : (!done.includes('dic') ? '…' : '');
    const mean = $('mean');
    if (hidden) {
      mean.textContent = '•  •  •  •  •'; mean.style.color = 'var(--muted)';
      $('more').textContent = ''; $('defEn').textContent = '';
      $('btnReveal').style.display = '';
    } else {
      $('btnReveal').style.display = 'none';
      let more = d.more || '';
      if (d.mean) { mean.textContent = d.mean; mean.style.color = ''; }
      else if (failed.includes('tr')) {
        if (d.def_en) { mean.textContent = '(Tiếng Anh) ' + d.def_en; mean.style.color = ''; }
        else {
          mean.textContent = 'Không tải được nghĩa.'; mean.style.color = 'var(--red)';
          more = 'Lý do: ' + (d.err || 'không kết nối được dịch vụ dịch') + '   —   Kiểm tra mạng rồi chọn lại từ.';
        }
      } else { mean.textContent = 'Đang tra nghĩa…'; mean.style.color = 'var(--muted)'; }
      $('more').textContent = more;
      $('defEn').textContent = d.mean ? (d.def_en || '') : '';
    }
    const ex = $('ex');
    if (d.ex) { ex.textContent = d.ex; ex.style.color = ''; $('btnExPlay').style.display = ''; }
    else {
      $('btnExPlay').style.display = 'none';
      if (failed.includes('ex')) { ex.textContent = 'Không tải được ví dụ (mất kết nối).'; ex.style.color = 'var(--red)'; }
      else if (done.includes('ex')) { ex.textContent = 'Chưa tìm thấy ngữ cảnh cho từ này.'; ex.style.color = 'var(--muted)'; }
      else { ex.textContent = 'Đang tìm ngữ cảnh…'; ex.style.color = 'var(--muted)'; }
    }
    $('exPhon').textContent = d.ex_phon || '';
    $('exVi').textContent = hidden ? '' : (d.ex_vi || '');
  }

  function refreshMarks() {
    const w = S.cur;
    if (!w) return;
    const p = progOf(S.lang.code);
    const l = $('btnLearn'), f = $('btnFav');
    const learned = p.learned.has(w.id), faved = p.fav.has(w.id);
    l.innerHTML = ic(learned ? 'checkc' : 'circle') + '<span>' + (learned ? 'Đã thuộc' : 'Thuộc rồi') + '</span>';
    l.classList.toggle('learned', learned);
    f.innerHTML = ic('star') + '<span>Yêu thích</span>';
    f.classList.toggle('faved', faved);
  }
  function toggleLearned() {
    const w = S.cur;
    if (!w) return;
    const p = progOf(S.lang.code);
    if (p.learned.has(w.id)) p.learned.delete(w.id); else p.learned.add(w.id);
    saveProgress(); refreshMarks(); renderRows(); updateStats();
  }
  function toggleFav() {
    const w = S.cur;
    if (!w) return;
    const p = progOf(S.lang.code);
    if (p.fav.has(w.id)) p.fav.delete(w.id); else p.fav.add(w.id);
    saveProgress(); refreshMarks(); renderRows();
  }

  function startPractice() {
    const code = S.lang.code, learned = progOf(code).learned;
    const pool = S.words.filter((w) => learned.has(w.id));
    if (!pool.length) { say('Chưa có từ nào đánh dấu "Đã thuộc" để luyện tập.', 6000); return; }
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const sample = pool.slice(0, Math.min(10, pool.length));
    S.practice = true;
    highlightTopic(false);
    showList(sample, 'Luyện tập', sample.length + ' / ' + pool.length + ' từ đã thuộc · nghĩa ẩn');
  }

  /* ---------------- sự kiện ---------------- */
  $('btnMenu').addEventListener('click', openDrawer);
  $('scrim').addEventListener('click', () => { closeDrawer(); closeSheet(); });
  $('btnBack').addEventListener('click', closeDetail);
  $('btnLegal').addEventListener('click', openLegal);
  $('btnLegalBack').addEventListener('click', closeLegal);
  $('btnPrivacy').addEventListener('click', () => {
    try { if (ANDROID && ANDROID.openPrivacyPolicy) { ANDROID.openPrivacyPolicy(); return; } } catch (e) { /* bỏ qua */ }
    say('Không mở được trình duyệt.', 5000);
  });
  $('topics').addEventListener('click', (e) => {
    const b = e.target.closest('.trow');
    if (!b) return;
    S.topic = b.dataset.t;
    closeDrawer();
    applyFilters();
  });
  let searchTimer = 0;
  $('search').addEventListener('input', () => { $('btnClear').hidden = !$('search').value; clearTimeout(searchTimer); searchTimer = setTimeout(applyFilters, 220); });
  $('btnClear').addEventListener('click', () => { $('search').value = ''; $('btnClear').hidden = true; $('search').focus(); applyFilters(); });
  $('search').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
  $('btnLevel').addEventListener('click', openSheet);
  $('sheetList').addEventListener('click', (e) => {
    const b = e.target.closest('.opt');
    if (!b) return;
    S.level = b.dataset.v;
    updateLevelBtn(); closeSheet(); applyFilters();
  });
  $('btnTheme').addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true));
  $('seg').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    S.filter = b.dataset.v;
    for (const x of $('seg').children) x.classList.toggle('on', x === b);
    applyFilters();
  });
  $('btnPractice').addEventListener('click', startPractice);
  $('btnPrev').addEventListener('click', () => move(-1));
  $('btnNext').addEventListener('click', () => move(1));
  $('btnLearn').addEventListener('click', toggleLearned);
  $('btnFav').addEventListener('click', toggleFav);
  $('btnPlay').addEventListener('click', () => { if (S.cur) speak(S.lang, S.cur.w, false); });
  $('btnSlow').addEventListener('click', () => { if (S.cur) speak(S.lang, S.cur.w, true); });
  $('btnExPlay').addEventListener('click', () => { if (S.info.ex) speak(S.lang, S.info.ex, false); });
  $('btnReveal').addEventListener('click', () => { S.reveal = true; render(); });
  $('swReview').addEventListener('change', (e) => { state.review = e.target.checked; saveState(); S.reveal = !state.review && !S.practice; render(); });
  $('swAuto').addEventListener('change', (e) => { state.auto_play = e.target.checked; saveState(); });

  // vuốt trái/phải để chuyển từ
  let tx = 0, ty = 0, tt = 0;
  const ds = $('dscroll');
  ds.addEventListener('touchstart', (e) => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; tt = Date.now(); }, { passive: true });
  ds.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (Date.now() - tt < 700 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) move(dx < 0 ? 1 : -1);
  }, { passive: true });

  // phím tắt (bàn phím rời / Chromebook)
  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { if (!window.__back()) closeSheet(); }
    else if (k === 'arrowleft') move(-1);
    else if (k === 'arrowright') move(1);
    else if (k === ' ') { e.preventDefault(); if (S.cur) speak(S.lang, S.cur.w, false); }
    else if (k === 's') { if (S.cur) speak(S.lang, S.cur.w, true); }
    else if (k === 'r') { S.reveal = true; render(); }
    else if (k === 'l') toggleLearned();
    else if (k === 'f') toggleFav();
  });

  // nút Back của Android: trả về true nếu giao diện đã tự xử lý
  window.__back = () => {
    if (body.classList.contains('legal-open')) { closeLegal(); return true; }
    if (body.classList.contains('sheet-open')) { closeSheet(); return true; }
    if (body.classList.contains('drawer-open')) { closeDrawer(); return true; }
    if (!isWide() && body.classList.contains('detail-open')) { closeDetail(); return true; }
    return false;
  };

  /* ---------------- khởi động ---------------- */
  (async () => {
    applyTheme(state.theme === 'light' || state.theme === 'dark' ? state.theme : (systemDark() ? 'dark' : 'light'), false);
    buildLangButtons();
    await KV.ready;
    try { TOPICS = await (await fetch('data/topics.json')).json(); } catch (e) { TOPICS = []; }
    if (!TOPICS.find((t) => t.id === 'general')) TOPICS.push({ id: 'general', name: 'Chung', sym: '•' });
    TOPIC_MAP = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
    $('swReview').checked = !!state.review;
    $('swAuto').checked = !!state.auto_play;
    await loadLanguage(LANGS[state.lang] ? state.lang : 'en');
  })();
})();
