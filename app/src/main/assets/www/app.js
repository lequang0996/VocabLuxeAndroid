'use strict';
/* VocabLuxe (Android) – giao diện sáng/tối; bản chuyển từ tool PC (engine.py + app.py). Toàn bộ dữ liệu nằm trong app; chỉ nghĩa tiếng Anh
   và câu ví dụ còn thiếu mới tra online (có cache). Phát âm dùng TextToSpeech của máy, không tạo file. */
(() => {
  const $ = (id) => document.getElementById(id);
  const ANDROID = window.AndroidBridge || null;
  const ROW_H = 66;
    const ic = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';

  const LANGS = {
    en: { code: 'en', file: 'en.json', tts: 'en-US', gtx: 'en', tatoeba: 'eng', htmlLang: 'en',
          levels: ['A1', 'A2', 'B1', 'B2', 'C1'] },
    zh: { code: 'zh', file: 'zh.json', tts: 'zh-CN', gtx: 'zh-CN', tatoeba: 'cmn', htmlLang: 'zh-CN',
          levels: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] },
  };
  const ORDER = ['en', 'zh'];
  const POS_NAMES = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', pron: 'pronoun',
    conj: 'conjunction', exclam: 'interjection', det: 'determiner', modal: 'verb', auxiliary: 'verb', number: 'noun', noun: 'noun' };

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
  const state = Object.assign({ auto_play: true, review: false, lang: 'en', theme: null, ui: null, guided: false }, ls.get('vl_state', {}));
  const saveState = () => ls.set('vl_state', state);
  if (!state.ap2) { state.auto_play = true; state.ap2 = 1; saveState(); } // "Tự phát âm" mặc định BẬT (áp dụng một lần cho bản cài cũ)

  /* ---- Đa ngôn ngữ giao diện (i18n.js) ---- */
  const I = window.I18N;
  // Mặc định luôn là tiếng Anh; chỉ đổi khi người dùng tự chọn trong menu Ngôn ngữ (lưu ở state.ui)
  let UI = I.codes.includes(state.ui) ? state.ui : 'en';
  const L = (k, vars) => {
    let s = (I.T[UI] && I.T[UI][k] != null) ? I.T[UI][k] : (I.T.en[k] != null ? I.T.en[k] : k);
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] != null ? vars[n] : m));
    return s;
  };
  const fmtN = (n) => Number(n).toLocaleString(I.LOC[UI]);
  const langName = (c) => L('lang_' + c);
  const posLabel = (n) => ((I.POS[UI] || I.POS.en)[n]) || n;
  const topicName = (id) => ((I.TOPIC[UI] || {})[id]) || ((TOPIC_MAP[id] || {}).name) || L('topic');
  const hayOf = (w) => fold([w.w, w.py, UI === 'vi' ? w.mean : '', w.pos, UI === 'vi' ? w.hv : ''].filter(Boolean).join(' '));

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
    const mi = document.getElementById('miTheme'); // mục "sáng / tối" trong menu thả xuống
    if (mi) {
      mi.querySelector('span').textContent = L(t === 'dark' ? 'toLight' : 'toDark');
      mi.querySelector('use').setAttribute('href', t === 'dark' ? '#i-sun' : '#i-moon');
    }
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
    else { const e = new Error(status > 0 ? 'HTTP ' + status : (body || 'Network error')); e.status = status; p.rej(e); }
  };
  function httpGet(url, timeout = 12000) {
    if (ANDROID) {
      return new Promise((res, rej) => {
        const id = ++netId;
        const t = setTimeout(() => { pending.delete(id); rej(new Error('Timeout')); }, timeout + 4000);
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
    if (!main) throw new Error('Empty response');
    return { main, byPos };
  }
  async function myMemoryTranslate(text, sl, tl = 'vi') {
    const j = await getJson('https://api.mymemory.translated.net/get', { q: text, langpair: sl + '|' + tl });
    const main = (((j.responseData || {}).translatedText) || '').trim();
    if (!main || !['200', 'undefined', 'null'].includes(String(j.responseStatus))) throw new Error('MyMemory: ' + (j.responseDetails || 'empty'));
    return { main, byPos: {} };
  }
  async function translateTo(text, sl, tl) {
    const errs = [];
    for (const [name, fn] of [['Google', gtxTranslate], ['MyMemory', myMemoryTranslate]]) {
      try { return await fn(text, sl, tl); } catch (e) { errs.push(name + ': ' + String(e.message || e).slice(0, 70)); }
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
      .map(([n, terms]) => posLabel(n) + ': ' + terms.slice(0, 3).join(', '));
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
  /* Ngôn ngữ đích của nghĩa / bản dịch câu ví dụ = ngôn ngữ giao diện đang chọn */
  const TL = { vi: 'vi', en: 'en', zh: 'zh-CN', es: 'es', pt: 'pt', ru: 'ru', ja: 'ja', ko: 'ko' };
  const TATO = { vi: 'vie', en: 'eng', zh: 'cmn', es: 'spa', pt: 'por', ru: 'rus', ja: 'jpn', ko: 'kor' };
  function target(lang) {
    if (UI !== lang.code) return { tl: TL[UI], tat: TATO[UI], def: false };
    // đang học đúng ngôn ngữ của giao diện: tiếng Anh -> dùng định nghĩa tiếng Anh; tiếng Trung -> dịch sang tiếng Anh
    return lang.code === 'en' ? { tl: null, tat: null, def: true } : { tl: 'en', tat: 'eng', def: false };
  }
  const tkey = (tg) => (tg.def ? 'def:' : (tg.tl === 'vi' ? '' : tg.tl + ':'));

  async function tatoebaSearch(word, code, tg, needTr) {
    const p = { from: LANGS[code].tatoeba, query: word, orphans: 'no', unapproved: 'no', sort: 'relevance' };
    if (needTr && tg.tat) { p.to = tg.tat; p.trans_filter = 'limit'; }
    return (await getJson('https://tatoeba.org/en/api_v0/search', p, 14000)).results || [];
  }
  async function tatoebaExample(word, code, tg) {
    const cjk = code !== 'en';
    const base = word.replace(/^[～~]+/, '') || word;
    const rx = cjk ? null : new RegExp('\\b' + escRx(word) + '\\w{0,3}\\b', 'i');
    const [lo, hi] = cjk ? [5, 50] : [22, 110];
    const stems = [word];
    if (cjk && base !== word && base) stems.push(base);
    for (const needTr of tg.tat ? [true, false] : [false]) {
      let results;
      try { results = await tatoebaSearch(base, code, tg, needTr); } catch (e) { if (needTr) continue; throw e; }
      const cands = [];
      for (const r of results) {
        const x = (r.text || '').trim();
        if (x.length < lo || x.length > hi) continue;
        let score;
        if (cjk) { if (!stems.some((s) => s && x.includes(s))) continue; score = x.includes(base) ? 0 : 15; }
        else { if (!rx.test(x)) continue; score = 0; }
        const d = tg.tat ? flatten(r.translations || []).find((y) => y.lang === tg.tat && y.text) : null;
        const tr = d ? d.text.trim() : '';
        score += Math.abs(x.length - (cjk ? 22 : 55)) - (tr ? 40 : 0);
        cands.push([score, x, tr]);
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
  const partTr = (lang, w, tg) => cached('tr:' + lang.code + ':' + tkey(tg) + keyTail(w), async () => {
    const tr = await translateTo(queryOf(w), lang.gtx, tg.tl);
    return lang.code === 'en' ? buildMeaning(tr, w.pos || '') : { mean: tr.main, more: '' };
  });
  const partDic = (w) => cached('dic:en:' + w.w.toLowerCase(), () => dictLookup(queryOf(w)));
  const partEx = (lang, w, tg) => cached('ex2:' + lang.code + ':' + tkey(tg) + w.w.toLowerCase() + '|' + (w.pos || w.py || ''), async () => {
    const ex = await tatoebaExample(queryOf(w), lang.code, tg);
    if (!isEmpty(ex)) {
      if (!ex.vi && tg.tl) ex.vi = (await translateTo(ex.ex, lang.gtx, tg.tl)).main;
      return ex;
    }
    if (lang.code === 'en') {
      const d = await partDic(w);
      const names = posNames(w.pos);
      const pool = d.defs.filter((x) => x.ex).sort((a, b) => (names.includes(a.pos) ? 0 : 1) - (names.includes(b.pos) ? 0 : 1));
      if (pool.length) return { ex: pool[0].ex, vi: tg.tl ? (await translateTo(pool[0].ex, 'en', tg.tl)).main : '' };
    }
    return {};
  }, false);
  // dịch câu ví dụ có sẵn (tiếng Trung) sang ngôn ngữ giao diện khi không phải tiếng Việt
  const partExTr = (w, tg) => cached('exT:zh:' + tg.tl + ':' + w.id, async () => ({ t: (await translateTo(w.ex, 'zh-CN', tg.tl)).main }));

  const localPhon = (code, w) => w.py || '';
  const localMore = (code, w) => (code === 'zh' && UI === 'vi' && w.hv ? L('hv') + ': ' + w.hv : '');

  async function fetchInfo(lang, w, onPart) {
    const code = lang.code, tg = target(lang);
    const bundled = code === 'zh' && UI === 'vi'; // nghĩa + ví dụ tiếng Việt có sẵn trong dữ liệu
    const out = { mean: '', more: '', phon: '', def_en: '', ex: '', ex_phon: '', ex_vi: '', failed: [], done: [], err: '' };
    const snap = () => ({ ...out, failed: [...out.failed], done: [...out.done] });
    const tasks = [];
    const run = (kind, p) => tasks.push(p.then((r) => ({ kind, r }), (e) => ({ kind, e })));
    if (code === 'en') {
      if (tg.def) out.done.push('tr'); else run('tr', partTr(lang, w, tg));
      run('dic', partDic(w)); run('ex', partEx(lang, w, tg));
    } else {
      Object.assign(out, { mean: bundled ? (w.mean || '') : '', more: localMore(code, w), phon: localPhon(code, w),
        ex: w.ex || '', ex_phon: w.ex_py || '', ex_vi: bundled ? (w.ex_vi || '') : '' });
      out.done.push('dic');
      if (out.mean) out.done.push('tr'); else run('tr', partTr(lang, w, tg));
      if (out.ex) { out.done.push('ex'); if (!out.ex_vi && tg.tl) run('exTr', partExTr(w, tg)); } else run('ex', partEx(lang, w, tg));
      if (onPart) onPart(snap());
    }
    const names = posNames(w.pos);
    await Promise.all(tasks.map(async (job) => {
      const { kind, r, e } = await job;
      if (e) {
        out.failed.push(kind);
        if (kind === 'dic' && tg.def) out.failed.push('tr');
        out.err = (out.err ? out.err + ' ' : '') + String(e.message || e).slice(0, 160);
      } else if (kind === 'tr') {
        out.mean = r.mean || '';
        if (code === 'en') out.more = r.more || '';
        else if (!bundled || w.auto || !w.mean) out.more = (out.more ? out.more + '   ·   ' : '') + L('autoTrans');
      } else if (kind === 'dic') {
        out.phon = r.phon || '';
        const defs = r.defs || [];
        const pick = defs.find((d) => names.includes(d.pos)) || defs[0];
        if (tg.def) {
          out.mean = pick ? pick.def : '';
          if (!out.mean) { out.failed.push('tr'); out.err = out.err || 'No definition'; }
        } else out.def_en = pick ? pick.def : '';
      } else if (kind === 'ex') { out.ex = r.ex || ''; out.ex_vi = r.vi || ''; }
      else if (kind === 'exTr') out.ex_vi = (r && r.t) || '';
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
    if (ANDROID) { try { ANDROID.speak(lang.tts, t, !!slow); } catch (e) { say(L('ttsFail'), 6000); } return; }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang.tts; u.rate = slow ? 0.6 : 1;
      speechSynthesis.speak(u);
    } else say(L('ttsNone'), 6000);
  }
  window.__ttsError = (code, arg) => {
    if (code === 'missing') say(L('ttsMissing', { lang: langName(String(arg || '').toLowerCase().startsWith('zh') ? 'zh' : 'en') }), 9000);
    else if (code === 'init') say(L('ttsInit'), 9000);
    else if (code === 'browser') say(L('ttsBrowser'), 6000);
  };
  // khởi động sẵn bộ đọc giọng + nạp sẵn ngôn ngữ để lần bấm đầu tiên phát âm ngay
  function warmTts(lang) { try { if (ANDROID && ANDROID.warmTts) ANDROID.warmTts(lang.tts); } catch (e) { /* bỏ qua */ } }

  /* ------------------------------------------------------------------ */
  /*  Trạng thái giao diện                                               */
  /* ------------------------------------------------------------------ */
  const S = { lang: LANGS.en, words: [], view: [], levels: [], cur: null, curIndex: -1, info: {}, token: 0, topic: 'all',
    reveal: true, practice: false, filter: 'all', loading: 0 };
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
      b.textContent = langName(c);
      b.dataset.code = c;
      b.addEventListener('click', () => loadLanguage(c));
      b.classList.toggle('on', c === S.lang.code);
      box.appendChild(b);
    }
  }
  async function loadLanguage(code) {
    const cfg = LANGS[code];
    const my = ++S.loading;
    if (!dataCache[code]) {
      say(L('loadingData', { lang: langName(code) }), 15000);
      try {
        const r = await fetch('data/' + cfg.file);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        for (const w of data.words) {
          for (const k of ['w', 'py', 'hv', 'mean', 'ex', 'ex_py', 'ex_vi', 'pos', 'note']) if (typeof w[k] === 'string') w[k] = w[k].normalize('NFC');
          w._h = hayOf(w);
        }
        dataCache[code] = data;
      } catch (e) { say(L('loadFail', { lang: langName(code), err: e.message }), 8000); return; }
    }
    if (my !== S.loading) return;
    const data = dataCache[code];
    S.lang = cfg;
    warmTts(cfg);
    S.words = data.sorted || (data.sorted = sortWords(data, cfg));
    S.levels = data.levels && data.levels.length ? data.levels : cfg.levels;
    state.lang = code; saveState();
    $('detail').dataset.lang = code;
    $('word').lang = cfg.htmlLang; $('ex').lang = cfg.htmlLang;
    for (const b of $('langs').children) b.classList.toggle('on', b.dataset.code === code);
    S.topic = 'all'; S.filter = 'all';
    for (const b of $('seg').children) b.classList.toggle('on', b.dataset.v === 'all');
    $('search').value = '';
    $('btnClear').hidden = true;
    rebuildTopics();
    applyFilters();
    updateStats();
    $('toast').classList.remove('show');
  }

  /* Thứ tự chủ đề: thông dụng trước. Từ được xếp theo mức dùng nhiều (cấp độ dữ liệu từ thấp đến cao), rồi theo chủ đề thông dụng. */
  const TOPIC_PRIORITY = ['family', 'food', 'home', 'time', 'number', 'body', 'color', 'clothes', 'travel', 'place', 'study', 'work',
    'feeling', 'nature', 'money', 'comm', 'tech', 'leisure', 'society', 'science', 'action', 'quality', 'grammar', 'idiom', 'general'];
  const topicRank = (id) => { const i = TOPIC_PRIORITY.indexOf(id); return i < 0 ? 99 : i; };
  function sortWords(data, cfg) {
    const lv = data.levels && data.levels.length ? data.levels : cfg.levels;
    const lr = (w) => { const i = lv.indexOf(w.lvl); return i < 0 ? 99 : i; };
    return data.words.map((w, i) => [w, i])
      .sort((x, y) => lr(x[0]) - lr(y[0]) || topicRank(x[0].topic) - topicRank(y[0].topic) || x[1] - y[1])
      .map((x) => x[0]);
  }

  function rebuildTopics() {
    const counts = {};
    for (const w of S.words) counts[w.topic] = (counts[w.topic] || 0) + 1;
    const rows = [{ id: 'all', name: L('allTopics'), sym: null, n: S.words.length }];
    const symOf = {};
    for (const tp of TOPICS) symOf[tp.id] = tp.sym;
    Object.keys(counts).sort((x, y) => topicRank(x) - topicRank(y)).forEach((id) => rows.push({ id, name: topicName(id), sym: symOf[id], n: counts[id] }));
    S.topicRows = rows;
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
    const res = [];
    for (const w of S.words) {
      if (S.topic !== 'all' && w.topic !== S.topic) continue;
      const done = p.learned.has(w.id);
      if (S.filter === 'todo' && done) continue;
      if (S.filter === 'done' && !done) continue;
      if (S.filter === 'fav' && !p.fav.has(w.id)) continue;
      if (q && !w._h.includes(q)) continue;
      res.push(w);
    }
    S.practice = false;
    $('btnTopic').classList.toggle('active', S.topic !== 'all');
    highlightTopic(true);
    showList(res, S.topic === 'all' ? L('allTopics') : topicName(S.topic), L('wordsN', { n: fmtN(res.length) }));
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
      '<div class="rtags">' + (fav ? ic('star', 'rf') : '') + '<span class="rl">' + esc(topicName(TOPIC_MAP[w.topic] ? w.topic : 'general')) + '</span>' + (done ? ic('checkc', 'rc') : '') + '</div></div></div>';
  }
  function renderRows() {
    const list = $('list'), rows = $('rows');
    rows.style.height = S.view.length * ROW_H + 'px';
    if (!S.view.length) { rows.style.height = 'auto'; rows.innerHTML = '<div class="empty">' + esc(L('emptyA')) + '<br>' + esc(L('emptyB')) + '</div>'; return; }
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
    if (r) selectIndex(parseInt(r.dataset.i, 10), { open: true, user: true });
  });
  function scrollToIndex(i) {
    const list = $('list'), top = i * ROW_H, h = list.clientHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + ROW_H > list.scrollTop + h) list.scrollTop = top + ROW_H - h;
  }

  function updateStats() {
    const code = S.lang.code, n = progOf(code).learned.size, total = Math.max(1, S.words.length);
    $('stats').textContent = L('statsFmt', { n: fmtN(n), total: fmtN(S.words.length), p: Math.round((100 * n) / total) });
    $('barFill').style.width = Math.min(100, (100 * n) / total) + '%';
  }

  /* ---------------- chọn / hiển thị một từ ---------------- */
  // Báo cho Android biết nút Back có việc để làm không (đóng chi tiết / đóng menu)
  function syncBack() {
    if (!ANDROID) return;
    const can = body.classList.contains('lp-open') || body.classList.contains('menu-open') || body.classList.contains('guide-open') || body.classList.contains('legal-open') || body.classList.contains('drawer-open') || body.classList.contains('sheet-open') || (!isWide() && body.classList.contains('detail-open'));
    try { ANDROID.canGoBack(can); } catch (e) { /* bỏ qua */ }
  }
  function ensureDetail() { // chi tiết đang mở mà trống (hoặc lỗi thời) -> vẽ lại từ đang chọn
    if (!S.view.length) return;
    if (!S.cur) { S.curIndex = 0; S.cur = S.view[0]; S.dirty = true; }
    if (S.dirty || !$('word').textContent) showWord(S.cur);
  }
  function openDetail() { body.classList.add('detail-open'); syncBack(); try { ensureDetail(); } catch (e) { /* bỏ qua */ } }
  function closeDetail() { body.classList.remove('detail-open'); syncBack(); }
  function openMenu() {
    const r = $('btnMore').getBoundingClientRect(), m = $('menuPop');
    m.style.top = (r.bottom + 8) + 'px'; m.style.left = 'auto';
    m.style.right = Math.max(10, document.documentElement.clientWidth - r.right) + 'px';
    m.hidden = false; body.classList.add('menu-open'); $('btnMore').setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => m.classList.add('show')); syncBack();
  }
  function closeMenu() {
    const m = $('menuPop');
    m.classList.remove('show'); m.hidden = true; body.classList.remove('menu-open'); $('btnMore').setAttribute('aria-expanded', 'false'); syncBack();
  }
  function openDrawer() { body.classList.add('drawer-open'); syncBack(); }
  function openLegal() { closeMenu(); closeDrawer(); renderLegal(); body.classList.add('legal-open'); $('legalScroll').scrollTop = 0; syncBack(); }
  function closeLegal() { body.classList.remove('legal-open'); syncBack(); }
  function closeDrawer() { body.classList.remove('drawer-open'); syncBack(); }

  /* ---- Bảng chọn cấp độ (thay cho dropdown mặc định của hệ thống) ---- */
  function openSheet() { // bảng chọn chủ đề (thay cho chọn cấp độ)
    $('sheetTitle').textContent = L('topics');
    $('sheetList').innerHTML = (S.topicRows || []).map((r) => '<button class="opt' + (r.id === S.topic ? ' on' : '') + '" data-t="' + esc(r.id) + '">' +
      '<span class="tsym">' + (r.sym ? esc(r.sym) + '\uFE0E' : ic('grid')) + '</span><span class="oname">' + esc(r.name) + '</span><span class="cnt">' + r.n + '</span>' + ic('check', 'oc') + '</button>').join('');
    body.classList.add('sheet-open'); syncBack();
  }
  function closeSheet() { body.classList.remove('sheet-open'); syncBack(); }

  /* ---- Chọn ngôn ngữ giao diện: "cờ - Tên bản ngữ (tên theo ngôn ngữ đang dùng)" ---- */
  function openLangSheet() {
    closeDrawer();
    $('sheetTitle').textContent = '🌐 ' + L('language');
    $('sheetList').innerHTML = I.ORDER.map((c) => '<button class="opt' + (c === UI ? ' on' : '') + '" data-ui="' + c + '">' +
      '<span class="flag" aria-hidden="true">' + I.FLAG[c] + '</span><span class="oname">- ' + esc(I.NATIVE[c]) +
      (c === UI ? '' : ' (' + esc(I.NAMES[UI][c]) + ')') + '</span>' + ic('check', 'oc') + '</button>').join('');
    body.classList.add('sheet-open'); syncBack();
  }
  function setUi(c) {
    if (!I.codes.includes(c) || c === UI) return;
    UI = c; state.ui = c; saveState();
    if (body.classList.contains('lp-open')) renderLangPick();
    for (const k of Object.keys(dataCache)) for (const w of dataCache[k].words) w._h = hayOf(w);
    applyI18n();
    applyTheme(currentTheme(), false);
    buildLangButtons();
    rebuildTopics();
    applyFilters();
    updateStats();
    if (body.classList.contains('guide-open')) renderGuide();
  }
  function applyI18n() {
    document.documentElement.lang = UI;
    for (const e of document.querySelectorAll('[data-i18n]')) e.textContent = L(e.dataset.i18n);
    for (const e of document.querySelectorAll('[data-i18n-aria]')) e.setAttribute('aria-label', L(e.dataset.i18nAria));
    for (const e of document.querySelectorAll('[data-i18n-ph]')) e.setAttribute('placeholder', L(e.dataset.i18nPh));
    $('guide').setAttribute('aria-label', L('guideBtn'));
    $('legal').setAttribute('aria-label', L('legalTitle'));
    if (body.classList.contains('legal-open')) renderLegal();
  }

  /* ---- Popup chọn ngôn ngữ giao diện (lần đầu mở app) ---- */
  const deviceUi = () => {
    const l = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase().slice(0, 2);
    return I.codes.includes(l) ? l : 'en';
  };
  function renderLangPick() {
    $('lpGrid').innerHTML = I.ORDER.map((c) => {
      const on = c === UI, sub = I.NAMES[UI][c];
      return '<button class="lp-opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-ui="' + c + '">' +
        '<span class="lp-flag" aria-hidden="true">' + I.FLAG[c] + '</span>' +
        '<span class="lp-names"><b lang="' + c + '">' + esc(I.NATIVE[c]) + '</b>' + (sub && sub !== I.NATIVE[c] ? '<small>' + esc(sub) + '</small>' : '') + '</span>' +
        '<span class="lp-tick" aria-hidden="true">' + ic('check') + '</span></button>';
    }).join('');
  }
  function openLangPick() {
    const d = deviceUi();
    if (d !== UI) setUi(d); // gợi ý sẵn ngôn ngữ của thiết bị (nếu app hỗ trợ)
    renderLangPick();
    body.classList.add('lp-open'); syncBack();
  }
  function closeLangPick() {
    body.classList.remove('lp-open');
    state.langPicked = true; saveState();
    syncBack();
    if (!state.guided) openGuide(); // chọn xong → sang phần hướng dẫn sử dụng
  }

  /* ---- Giấy phép & quyền riêng tư (nội dung theo ngôn ngữ giao diện) ---- */
  function renderLegal() {
    const d = I.LEGAL[UI] || I.LEGAL.en;
    $('legalBody').innerHTML = d.sections.map((sec) => '<div class="lpanel"><h2>' + esc(sec.h) + '</h2>' +
      (sec.p || []).map((x) => '<p>' + esc(x) + '</p>').join('') +
      (sec.li ? '<ul>' + sec.li.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + '</div>').join('');
  }

  /* Quyền riêng tư: mở thẳng trang Chính sách (GitHub Pages) bằng trình duyệt */
  function openPrivacy() {
    closeDrawer();
    try { if (ANDROID && ANDROID.openPrivacyPolicy) { ANDROID.openPrivacyPolicy(); return; } } catch (err) { /* bỏ qua */ }
    say(L('ttsBrowser'), 5000);
  }

  /* ---- Hướng dẫn sử dụng ---- */
  const GUIDE_ICONS = ['grid', 'search', 'vol', 'eye', 'shuffle', 'globe'];
  let gStep = 0;
  function renderGuide() {
    $('gicon').innerHTML = ic(GUIDE_ICONS[gStep]);
    $('gtitle').textContent = L('guideT' + (gStep + 1));
    $('gtext').textContent = L('guideX' + (gStep + 1));
    $('gdots').innerHTML = GUIDE_ICONS.map((_, i) => '<i' + (i === gStep ? ' class="on"' : '') + '></i>').join('');
    $('btnGuidePrev').style.visibility = gStep ? 'visible' : 'hidden';
    $('gnextText').textContent = L(gStep === GUIDE_ICONS.length - 1 ? 'guideDone' : 'guideNext');
  }
  function openGuide() { closeMenu(); closeDrawer(); gStep = 0; renderGuide(); body.classList.add('guide-open'); syncBack(); }
  function closeGuide() { body.classList.remove('guide-open'); if (!state.guided) { state.guided = true; saveState(); } syncBack(); }
  window.matchMedia('(min-width: 900px)').addEventListener('change', syncBack);

  function selectIndex(i, { open, user }) {
    if (!S.view.length) return;
    i = Math.min(Math.max(i, 0), S.view.length - 1);
    S.curIndex = i;
    S.cur = S.view[i];
    // người dùng chọn từ: phát âm NGAY, trước khi vẽ lại giao diện
    if (user && state.auto_play && (open || isWide())) { try { speak(S.lang, S.cur.w, false); } catch (e) { /* bỏ qua */ } }
    try { renderRows(); scrollToIndex(i); } catch (e) { /* bỏ qua */ }
    if (open || isWide()) showWord(S.cur); else S.dirty = true; // màn hình hẹp: vẽ chi tiết khi người dùng mở
    if (open) openDetail();
  }
  function move(d) { if (S.view.length) selectIndex(S.curIndex + d, { open: !isWide(), user: true }); }

  function showEmpty() {
    S.cur = null; S.token++;
    for (const id of ['chipTopic', 'chipPos', 'word', 'phon', 'mean', 'more', 'defEn', 'ex', 'exPhon', 'exVi']) $(id).textContent = '';
    $('btnReveal').style.display = 'none'; $('btnExPlay').style.display = 'none';
    $('btnLearn').textContent = ''; $('btnFav').textContent = '';
    S.dirty = false;
    if (!isWide() && body.classList.contains('detail-open')) closeDetail();
  }

  function showWord(w) {
    S.cur = w;
    const tok = ++S.token, lang = S.lang;
    S.info = {};
    S.reveal = !(state.review || S.practice);
    S.dirty = false;
    $('word').textContent = w.w; // luôn hiện từ trước, dù các bước bên dưới có lỗi
    try { $('chipTopic').textContent = topicName(TOPIC_MAP[w.topic] ? w.topic : 'general'); } catch (e) { $('chipTopic').textContent = ''; }
    let extra = w.pos || '';
    if (w.note) extra = (extra + '  (' + w.note + ')').trim();
    $('chipPos').textContent = extra;
    try { $('dscroll').scrollTop = 0; refreshMarks(); render(); } catch (e) { /* bỏ qua */ }
    fetchInfo(lang, w, (d) => { if (tok === S.token) { Object.assign(S.info, d); render(); } })
      .catch((e) => { if (tok === S.token) { Object.assign(S.info, { failed: ['tr', 'ex'], done: ['tr', 'dic', 'ex'], err: String(e.message || e).slice(0, 160) }); render(); } });
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
        if (d.def_en) { mean.textContent = L('enPrefix') + ' ' + d.def_en; mean.style.color = ''; }
        else {
          mean.textContent = L('noMeaning'); mean.style.color = 'var(--red)';
          more = L('reason', { err: d.err || L('noService') });
        }
      } else { mean.textContent = L('lookingMeaning'); mean.style.color = 'var(--muted)'; }
      $('more').textContent = more;
      $('defEn').textContent = d.mean ? (d.def_en || '') : '';
    }
    const ex = $('ex');
    if (d.ex) { ex.textContent = d.ex; ex.style.color = ''; $('btnExPlay').style.display = ''; }
    else {
      $('btnExPlay').style.display = 'none';
      if (failed.includes('ex')) { ex.textContent = L('exFail'); ex.style.color = 'var(--red)'; }
      else if (done.includes('ex')) { ex.textContent = L('exNone'); ex.style.color = 'var(--muted)'; }
      else { ex.textContent = L('exLoading'); ex.style.color = 'var(--muted)'; }
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
    l.innerHTML = ic(learned ? 'checkc' : 'circle') + '<span>' + L(learned ? 'learned' : 'markLearn') + '</span>';
    l.classList.toggle('learned', learned);
    f.innerHTML = ic('star') + '<span>' + esc(L('favorite')) + '</span>';
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
    if (!pool.length) { say(L('noLearned'), 6000); return; }
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const sample = pool.slice(0, Math.min(10, pool.length));
    S.practice = true;
    highlightTopic(false);
    showList(sample, L('practice'), L('practiceSub', { n: sample.length, m: pool.length }));
  }

  /* ---------------- sự kiện ---------------- */
  $('btnMenu').addEventListener('click', openDrawer);
  $('btnMore').addEventListener('click', () => (body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  $('btnLegal').addEventListener('click', openLegal);
  $('scrim').addEventListener('click', () => { closeDrawer(); closeSheet(); });
  $('btnBack').addEventListener('click', closeDetail);
  $('btnLegalBack').addEventListener('click', closeLegal);
  $('btnPrivacy').addEventListener('click', openPrivacy);
  $('menuPop').addEventListener('click', (e) => {
    const b = e.target.closest('.mitem');
    if (!b) return;
    closeMenu();
    if (b.id === 'miLang') openLangSheet();
    else if (b.id === 'miTheme') applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    else if (b.id === 'miGuide') openGuide();
  });
  document.addEventListener('pointerdown', (e) => { if (body.classList.contains('menu-open') && !e.target.closest('#menuPop') && !e.target.closest('#btnMore')) closeMenu(); }, true);
  $('lpGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.lp-opt');
    if (b) setUi(b.dataset.ui);
  });
  $('btnLpGo').addEventListener('click', closeLangPick);
  $('btnGuideSkip').addEventListener('click', closeGuide);
  $('btnGuidePrev').addEventListener('click', () => { if (gStep > 0) { gStep--; renderGuide(); } });
  $('btnGuideNext').addEventListener('click', () => { if (gStep < GUIDE_ICONS.length - 1) { gStep++; renderGuide(); } else closeGuide(); });
  $('btnRestart').addEventListener('click', () => { try { if (ANDROID && ANDROID.completeUpdate) ANDROID.completeUpdate(); } catch (e) { /* bỏ qua */ } });
  window.__updateReady = () => { $('updateBar').hidden = false; };
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
  $('btnTopic').addEventListener('click', openSheet);
  $('sheetList').addEventListener('click', (e) => {
    const b = e.target.closest('.opt');
    if (!b) return;
    if (b.dataset.ui) { closeSheet(); setUi(b.dataset.ui); return; }
    if (b.dataset.t) { S.topic = b.dataset.t; closeSheet(); applyFilters(); }
  });
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
    if (body.classList.contains('lp-open')) return true; // bắt buộc chọn ngôn ngữ ở lần đầu
    if (body.classList.contains('menu-open')) { closeMenu(); return true; }
    if (body.classList.contains('guide-open')) { closeGuide(); return true; }
    if (body.classList.contains('legal-open')) { closeLegal(); return true; }
    if (body.classList.contains('sheet-open')) { closeSheet(); return true; }
    if (body.classList.contains('drawer-open')) { closeDrawer(); return true; }
    if (!isWide() && body.classList.contains('detail-open')) { closeDetail(); return true; }
    return false;
  };

  const healDetail = () => { if (document.visibilityState !== 'hidden' && (isWide() || body.classList.contains('detail-open'))) { try { ensureDetail(); } catch (e) { /* bỏ qua */ } } };
  document.addEventListener('visibilitychange', healDetail);
  window.addEventListener('pageshow', healDetail);

  /* ---------------- khởi động ---------------- */
  (async () => {
    applyTheme(state.theme === 'light' || state.theme === 'dark' ? state.theme : (systemDark() ? 'dark' : 'light'), false);
    applyI18n();
    warmTts(LANGS[state.lang] || LANGS.en);
    buildLangButtons();
    await Promise.race([KV.ready, new Promise((r) => setTimeout(r, 2500))]);
    try { TOPICS = await (await fetch('data/topics.json')).json(); } catch (e) { TOPICS = []; }
    if (!TOPICS.find((t) => t.id === 'general')) TOPICS.push({ id: 'general', name: 'Chung', sym: '•' });
    TOPIC_MAP = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
    $('swReview').checked = !!state.review;
    $('swAuto').checked = !!state.auto_play;
    const startLang = LANGS[state.lang] ? state.lang : 'en';
    try { await loadLanguage(startLang); } catch (e) { /* thử lại bên dưới */ }
    if (!S.words.length) { await new Promise((r) => setTimeout(r, 800)); try { await loadLanguage(startLang); } catch (e) { say(L('loadFail', { lang: langName(startLang), err: String(e.message || e) }), 8000); } }
    try { if (ANDROID && ANDROID.updateReady && ANDROID.updateReady()) window.__updateReady(); } catch (e) { /* bỏ qua */ }
    if (!state.langPicked && !state.guided) openLangPick(); // lần đầu mở app: chọn ngôn ngữ trước,
    else if (!state.guided) openGuide(); // rồi mới đến hướng dẫn sử dụng
  })();
})();
