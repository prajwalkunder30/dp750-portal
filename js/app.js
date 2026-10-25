(() => {
  const DOMAINS = {
    1: { name: 'Set up and configure an Azure Databricks environment', pct: '15–20%', w: 0.175 },
    2: { name: 'Secure and govern Unity Catalog objects', pct: '15–20%', w: 0.175 },
    3: { name: 'Prepare and process data', pct: '30–35%', w: 0.325 },
    4: { name: 'Deploy and maintain data pipelines and workloads', pct: '30–35%', w: 0.325 }
  };
  const SRC = { scenario: 'Scenario', goal: 'Meets the goal', order: 'Ordering', hotspot: 'Hotspot / code', generated: 'Concept', yesno: 'Yes / No', case: 'Case study' };
  const CONCEPT = ['generated', 'yesno'];

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const pad = n => String(n).padStart(3, '0');
  const hash = s => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shuffle = (arr, r = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const shuffleOpts = (q, r) => { const idx = shuffle(q.opts.map((_, i) => i), r); return { ...q, opts: idx.map(i => q.opts[i]), ans: q.ans.map(a => idx.indexOf(a)).sort() }; };
  const isCorrect = (q, sel) => q.type === 'order' || q.type === 'hotspot'
    ? sel.length === q.ans.length && q.ans.every((a, i) => sel[i] === a)
    : sel.length === q.ans.length && sel.every(x => q.ans.includes(x));
  const answered = (q, sel) => q.type === 'hotspot' ? q.ans.every((_, i) => sel[i] != null) : sel.length > 0;

  // ---------- question bank ----------
  const BANK = [];
  QB.forEach((q, i) => {
    const r = rng(hash('S' + i)), b = { ...q, id: 'S' + pad(i + 1) };
    if (q.type === 'order') b.display = shuffle(q.opts.map((_, j) => j), r);
    BANK.push(q.type || q.noShuffle ? b : shuffleOpts(b, r));
  });

  FACTS.forEach((f, i) => {
    const r = rng(hash(f.term + i));
    const same = shuffle(FACTS.filter(x => x !== f && x.d === f.d && x.topic === f.topic), r);
    const other = shuffle(FACTS.filter(x => x !== f && x.d === f.d && x.topic !== f.topic), r);
    const dis = same.concat(other).slice(0, 3);
    const base = { d: f.d, topic: f.topic, ref: f.ref, src: 'generated' };
    const id = 'F' + pad(i + 1);
    BANK.push(shuffleOpts({ ...base, id: id + 'a', q: `Requirement: ${f.desc}\n\nWhich feature, object, or setting meets the requirement?`,
      opts: [f.term, ...dis.map(x => x.term)], ans: [0], exp: `**${f.term}**: ${f.desc}\n\nDistractors: ` + dis.map(x => `**${x.term}** – ${x.desc}`).join(' ') }, r));
    BANK.push(shuffleOpts({ ...base, id: id + 'b', q: `Which statement correctly describes **${f.term}**?`,
      opts: [f.desc, ...dis.map(x => x.desc)], ans: [0], exp: `**${f.term}**: ${f.desc}` }, r));
    const truth = r() < 0.5;
    BANK.push({ ...base, src: 'yesno', id: id + 'c', q: `Evaluate the statement. Select Yes if it is correct.\n\n**${f.term}**: ${truth ? f.desc : dis[0].desc}`,
      opts: ['Yes', 'No'], ans: [truth ? 0 : 1],
      exp: truth ? `Correct. **${f.term}**: ${f.desc}` : `Incorrect – that describes **${dis[0].term}**. **${f.term}**: ${f.desc}` });
  });

  CASES.forEach(c => c.questions.forEach((q, i) =>
    BANK.push({ ...q, id: `C-${c.id}-${i + 1}`, topic: 'Case: ' + c.title, src: 'case', caseId: c.id })));

  // ---------- persistence ----------
  let store;
  try { store = JSON.parse(localStorage.getItem('dp750')) || {}; } catch { store = {}; }
  store.stats ||= {}; store.exams ||= [];
  const save = () => localStorage.setItem('dp750', JSON.stringify(store));
  const record = (q, ok) => { const s = store.stats[q.id] ||= { c: 0, w: 0 }; ok ? s.c++ : s.w++; s.last = ok; };

  // ---------- question rendering ----------
  function qHTML(q, sel, reveal) {
    const multi = q.ans.length > 1 && !q.type;
    let body, answer;
    if (q.type === 'hotspot') {
      const code = esc(q.code).replace(/\{(\d+)\}/g, (_, n) => {
        const b = +n, v = sel[b], cls = reveal ? (v === q.ans[b] ? 'ok' : 'bad') : '';
        return `<select data-blank="${b}" class="hs ${cls}" ${reveal ? 'disabled' : ''}><option value="">select…</option>${q.blanks[b].map((o, i) =>
          `<option value="${i}" ${v === i ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      });
      body = `<pre class="hot"><code>${code}</code></pre>`;
      answer = q.ans.map((a, i) => `<code>${esc(q.blanks[i][a])}</code>`).join(', ');
    } else if (q.type === 'order') {
      const avail = (q.display || q.opts.map((_, i) => i)).filter(i => !sel.includes(i));
      body = `<div class="order"><div><div class="muted">Actions</div>${avail.map(i =>
        `<button class="item" data-add="${i}" ${reveal ? 'disabled' : ''}>${fmt(q.opts[i])}</button>`).join('')}</div>
        <div><div class="muted">Answer area (in order)</div>${sel.map((i, p) =>
        `<button class="item placed ${reveal ? (q.ans[p] === i ? 'ok' : 'bad') : ''}" data-rem="${i}" ${reveal ? 'disabled' : ''}>${p + 1}. ${fmt(q.opts[i])}</button>`).join('')
        || '<div class="muted">Click actions to move them here. Click a placed action to remove it.</div>'}</div></div>`;
      answer = '<br>' + q.ans.map((a, i) => `${i + 1}. ${fmt(q.opts[a])}`).join('<br>');
    }
    const opts = q.type ? '' : q.opts.map((o, i) => {
      let cls = 'opt';
      if (sel.includes(i)) cls += ' sel';
      if (reveal) { if (q.ans.includes(i)) cls += ' ok'; else if (sel.includes(i)) cls += ' bad'; }
      return `<label class="${cls}" data-opt="${i}"><input type="${multi ? 'checkbox' : 'radio'}" ${sel.includes(i) ? 'checked' : ''} ${reveal ? 'disabled' : ''}>
        <span class="letter">${q.opts.length > 2 ? String.fromCharCode(65 + i) : ''}</span><span>${fmt(o)}</span></label>`;
    }).join('');
    let ex = '';
    if (reveal) {
      const ok = isCorrect(q, sel);
      const link = q.ref && R[q.ref] ? `<div>Learn more: <a href="${esc(R[q.ref])}" target="_blank" rel="noopener">${esc(R[q.ref])}</a></div>` : '';
      answer ||= q.opts.length > 2 ? q.ans.map(a => String.fromCharCode(65 + a)).join(', ') : q.ans.map(a => q.opts[a]).join(', ');
      ex = `<div class="explain ${ok ? 'good' : 'wrong'}"><b>${ok ? 'Correct' : 'Incorrect'}</b> – answer: ${answer}
        <div>${fmt(q.exp)}</div>${link}</div>`;
    }
    return `<div class="qmeta"><span class="tag d${q.d}">Domain ${q.d}</span><span class="tag">${esc(q.topic)}</span><span class="tag">${SRC[q.src]}</span>
      ${multi ? `<span class="tag warn">Choose ${q.ans.length}</span>` : ''}${q.type === 'order' ? `<span class="tag warn">Arrange ${q.ans.length} in order</span>` : ''}<span class="qid">${q.id}</span></div>
      <div class="qtext">${fmt(q.q)}</div>${body || `<div class="opts">${opts}</div>`}${ex}`;
  }

  function toggle(q, sel, i) {
    if (q.ans.length > 1) return sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i];
    return [i];
  }

  // Returns the new selection if the event changed the answer, otherwise undefined.
  function interact(e, q, sel, locked) {
    if (locked) return;
    const t = e.target;
    if (e.type === 'change') {
      const b = t.closest('[data-blank]');
      if (!b) return;
      const s = sel.slice(); s[+b.dataset.blank] = b.value === '' ? undefined : +b.value; return s;
    }
    if (t.closest('select')) return;
    const o = t.closest('[data-opt]');
    if (o) { e.preventDefault(); return toggle(q, sel, +o.dataset.opt); }
    const a = t.closest('[data-add]');
    if (a) return [...sel, +a.dataset.add];
    const r = t.closest('[data-rem]');
    if (r) return sel.filter(x => x !== +r.dataset.rem);
  }

  // ---------- views ----------
  function viewHome() {
    const answered = BANK.filter(q => store.stats[q.id]);
    const correct = answered.filter(q => store.stats[q.id].last).length;
    const counts = (...s) => BANK.filter(q => s.includes(q.src)).length;
    const cards = Object.entries(DOMAINS).map(([d, D]) => {
      const qs = BANK.filter(q => q.d == d), a = qs.filter(q => store.stats[q.id]), c = a.filter(q => store.stats[q.id].last).length;
      const pct = a.length ? Math.round(100 * c / a.length) : 0;
      return `<div class="card domain" style="--c:var(--d${d})"><h3>${d}. ${D.name}</h3><div class="muted">Weight ${D.pct} · ${qs.length} questions</div>
        <div class="bar"><span style="width:${Math.round(100 * a.length / qs.length)}%"></span></div>
        <div class="muted">${a.length}/${qs.length} attempted · accuracy ${a.length ? pct + '%' : '–'}</div>
        <div class="row" style="margin-top:10px"><a class="btn" href="#/practice?d=${d}">Practice</a><a class="btn" href="#/practice?d=${d}&status=incorrect">Mistakes</a></div></div>`;
    }).join('');
    const hist = store.exams.length ? `<table><tr><th>Date</th><th>Score</th><th>Correct</th><th>Result</th></tr>${store.exams.map(e =>
      `<tr><td>${esc(new Date(e.date).toLocaleString())}</td><td>${e.score}</td><td>${e.correct}/${e.total}</td><td class="${e.score >= 700 ? 'pass' : 'fail'}">${e.score >= 700 ? 'Pass' : 'Fail'}</td></tr>`).join('')}</table>`
      : '<p class="muted">No exams taken yet.</p>';
    app.innerHTML = `<section class="hero"><h1>DP-750: Azure Databricks Data Engineering</h1>
      <div class="muted">Original practice questions mapped to the exam skills outline, with explanations and Microsoft Learn links.</div>
      <div class="stats"><div class="stat"><b>${BANK.length}</b>questions</div><div class="stat"><b>${counts('scenario', 'goal', 'order', 'hotspot')}</b>exam-style</div>
      <div class="stat"><b>${counts(...CONCEPT)}</b>concept / yes-no</div><div class="stat"><b>${counts('case')}</b>case study</div>
      <div class="stat"><b>${answered.length ? Math.round(100 * correct / answered.length) + '%' : '–'}</b>accuracy</div></div>
      <div class="row" style="margin-top:18px"><a class="btn accent" href="#/exam">Start exam simulation</a>
        <a class="btn" href="#/practice${store.last ? '?' + esc(store.last) : ''}">${store.pos && Object.keys(store.pos).length ? 'Continue practice where you left off' : 'Practice mode'}</a></div></section>
      <h2>Domains</h2><div class="grid">${cards}</div>
      <h2>Exam history</h2>${hist}
      <p style="margin-top:20px"><button class="btn danger" id="reset">Reset all progress</button></p>`;
    $('#reset').onclick = () => { if (confirm('Delete all saved progress and exam history?')) { store = { stats: {}, exams: [] }; save(); viewHome(); } };
  }

  let P = null;
  const ORDER = new Map();
  function viewPractice(params) {
    if (!ORDER.size) BANK.forEach((q, i) => ORDER.set(q.id, i));
    if (![...params.keys()].length && store.last) params = new URLSearchParams(store.last);
    const topics = [...new Set(BANK.map(q => q.topic))].sort();
    const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
    const f = { d: params.get('d') || '', topic: params.get('topic') || '', src: params.get('src') || '', status: params.get('status') || '' };
    app.innerHTML = `<h1>Practice</h1><p class="muted">Questions run in a fixed order and your position is saved, so you continue where you stopped next time. Progress is saved in this browser.</p>
      <div class="filters">
        <select id="fd">${opt('', 'All domains', f.d)}${Object.entries(DOMAINS).map(([d, D]) => opt(d, `${d}. ${D.name}`, f.d)).join('')}</select>
        <select id="ft">${opt('', 'All topics', f.topic)}${topics.map(t => opt(t, t, f.topic)).join('')}</select>
        <select id="fs">${opt('', 'All types', f.src)}${Object.entries(SRC).map(([k, l]) => opt(k, l, f.src)).join('')}</select>
        <select id="fst">${opt('', 'All questions', f.status)}${opt('unanswered', 'Not attempted', f.status)}${opt('incorrect', 'Last answer wrong', f.status)}</select>
        <label><input type="checkbox" id="fsh" ${store.shuffle ? 'checked' : ''}> Shuffle (no resume)</label>
        <button class="btn primary" id="go">Start</button></div><div id="pq"></div>`;
    const start = (fromStart) => {
      const d = $('#fd').value, t = $('#ft').value, s = $('#fs').value, st = $('#fst').value;
      let list = BANK.filter(q => (!d || q.d == d) && (!t || q.topic === t) && (!s || q.src === s) &&
        (!st || (st === 'unanswered' ? !store.stats[q.id] : store.stats[q.id] && !store.stats[q.id].last)));
      const shuf = $('#fsh').checked;
      list = shuf ? shuffle(list) : list.sort((a, b) => a.d - b.d || ORDER.get(a.id) - ORDER.get(b.id));
      const key = [d, t, s, st].join('|');
      store.last = new URLSearchParams(Object.entries({ d, topic: t, src: s, status: st }).filter(([, v]) => v)).toString();
      store.shuffle = shuf;
      store.pos ||= {};
      if (fromStart === true) delete store.pos[key];
      let i = 0;
      const saved = !shuf && store.pos[key];
      if (saved) {
        // Resume at the saved question, or the next one after it if it no longer matches the filter.
        const rank = q => [q.d, ORDER.get(q.id)];
        const target = BANK[ORDER.get(saved)];
        if (target) {
          const [td, to] = rank(target);
          i = list.findIndex(q => q.d > td || (q.d === td && ORDER.get(q.id) >= to));
          if (i < 0) i = list.length - 1;
        }
      }
      save();
      P = { list, i: Math.max(0, i), sel: [], rev: false, right: 0, done: 0, key: shuf ? null : key, resumed: i > 0 };
      drawPractice();
    };
    $('#go').onclick = start;
    ['#fd', '#ft', '#fs', '#fst', '#fsh'].forEach(s => $(s).onchange = start);
    start();
  }

  function savePos(i) {
    if (!P.key || !P.list[i]) return;
    store.pos[P.key] = P.list[i].id; save();
  }

  function drawPractice(keepSavedPos) {
    const el = $('#pq');
    if (!P.list.length) { el.innerHTML = '<div class="card">No questions match these filters.</div>'; return; }
    const q = P.list[P.i], hist = store.stats[q.id];
    const prev = hist ? `<span class="tag ${hist.last ? 'd3' : 'warn'}">Previously ${hist.last ? 'correct' : 'wrong'} · ${hist.c}/${hist.c + hist.w}</span>` : '<span class="tag">Not attempted yet</span>';
    const attempted = P.list.filter(x => store.stats[x.id]).length;
    el.innerHTML = `<div class="filters" style="margin-bottom:12px">
        ${P.resumed ? '<b>Resumed where you left off.</b>' : ''}
        <span class="muted">Question ${P.i + 1} of ${P.list.length} · ${attempted} attempted in this set</span>
        <span class="row" style="margin-left:auto"><label>Go to # <input type="number" id="jump" min="1" max="${P.list.length}" style="width:80px"></label>
        ${P.key ? '<button class="btn" data-act="restart">Restart from #1</button>' : ''}</span>
        <div class="bar" style="flex-basis:100%"><span style="width:${Math.round(100 * (P.i + 1) / P.list.length)}%"></span></div></div>
      <div class="card"><div class="qmeta">${prev}</div>${qHTML(q, P.sel, P.rev)}
      <div class="row spread" style="margin-top:16px">
        <button class="btn" data-act="prev" ${P.i === 0 ? 'disabled' : ''}>Previous</button>
        <span class="muted">session ${P.right}/${P.done} correct</span>
        <span class="row">${P.rev ? '' : `<button class="btn" data-act="skip" ${P.i === P.list.length - 1 ? 'disabled' : ''}>Skip</button>`}
        ${P.rev ? `<button class="btn primary" data-act="next" ${P.i === P.list.length - 1 ? 'disabled' : ''}>Next</button>`
               : `<button class="btn primary" data-act="check" ${answered(q, P.sel) ? '' : 'disabled'}>Check answer</button>`}</span>
      </div></div>`;
    if (!keepSavedPos) savePos(P.i);
    $('#jump').onchange = e => {
      const n = Math.min(P.list.length, Math.max(1, +e.target.value || 1));
      P.i = n - 1; P.sel = []; P.rev = false; drawPractice();
    };
    el.onclick = el.onchange = e => {
      if (e.target.id === 'jump') return;
      const s = interact(e, q, P.sel, P.rev);
      if (s) { P.sel = s; return drawPractice(); }
      if (e.type !== 'click') return;
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'restart') { P.i = 0; P.sel = []; P.rev = false; P.resumed = false; return drawPractice(); }
      if (act === 'check') {
        P.rev = true; const ok = isCorrect(q, P.sel); record(q, ok); save(); P.done++; if (ok) P.right++;
        // Next visit should start after this answered question.
        if (P.i < P.list.length - 1) savePos(P.i + 1);
        return drawPractice(true);
      }
      if (act === 'next' || act === 'prev' || act === 'skip') { P.i += act === 'prev' ? -1 : 1; P.sel = []; P.rev = false; }
      if (act) drawPractice();
    };
  }

  let E = null, timer = null;
  function viewExam() {
    if (E && !E.done) return drawExam();
    if (E && E.done) return drawResults();
    app.innerHTML = `<h1>Exam simulator</h1>
      <p class="muted">Questions are drawn per domain weight. Score is scaled to 1000; 700 is the passing mark. Answers are revealed only after submitting.</p>
      <div class="card"><div class="row">
        <label>Questions <input type="number" id="en" value="50" min="10" max="150"></label>
        <label>Minutes <input type="number" id="em" value="100" min="5" max="240"></label>
        <label><input type="checkbox" id="eg"> Include auto-generated concept and Yes/No questions</label>
      </div><p><button class="btn accent" id="es">Start exam</button></p></div>`;
    $('#es').onclick = () => startExam(Math.min(150, Math.max(10, +$('#en').value || 50)), Math.min(240, Math.max(5, +$('#em').value || 100)), $('#eg').checked);
  }

  function startExam(n, mins, gen) {
    const pool = BANK.filter(q => q.src !== 'case' && (gen || !CONCEPT.includes(q.src)));
    let qs = [];
    for (const d of [1, 2, 3, 4]) qs.push(...shuffle(pool.filter(q => q.d === d)).slice(0, Math.round(n * DOMAINS[d].w)));
    if (qs.length < n) qs.push(...shuffle(pool.filter(q => !qs.includes(q))).slice(0, n - qs.length));
    qs = shuffle(qs.slice(0, n));
    E = { qs, sel: qs.map(() => []), flag: qs.map(() => false), i: 0, end: Date.now() + mins * 60000, done: false };
    clearInterval(timer); timer = setInterval(tick, 1000);
    drawExam();
  }

  function tick() {
    if (!E || E.done) return clearInterval(timer);
    const left = Math.max(0, E.end - Date.now());
    const t = $('#timer');
    if (t) { t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`; t.classList.toggle('low', left < 300000); }
    if (!left) submitExam(true);
  }

  function drawExam() {
    const q = E.qs[E.i], n = E.qs.length;
    app.innerHTML = `<div class="examhead"><span>Question ${E.i + 1} of ${n}</span><span class="timer" id="timer"></span>
      <span class="row"><button class="btn" data-act="flag">${E.flag[E.i] ? 'Unflag' : 'Flag for review'}</button><button class="btn accent" data-act="submit">Submit exam</button></span></div>
      <div class="card">${qHTML(q, E.sel[E.i], false)}
      <div class="row spread" style="margin-top:16px"><button class="btn" data-act="prev" ${E.i ? '' : 'disabled'}>Previous</button>
      <button class="btn primary" data-act="next" ${E.i < n - 1 ? '' : 'disabled'}>Next</button></div>
      <div class="navgrid">${E.qs.map((x, i) => `<button data-go="${i}" class="${answered(x, E.sel[i]) ? 'ans' : ''} ${E.flag[i] ? 'flag' : ''} ${i === E.i ? 'cur' : ''}">${i + 1}</button>`).join('')}</div></div>`;
    tick();
    app.onclick = app.onchange = e => {
      if (location.hash.slice(2).split('?')[0] !== 'exam' || !E || E.done) return;
      const s = interact(e, q, E.sel[E.i], false);
      if (s) { E.sel[E.i] = s; return drawExam(); }
      if (e.type !== 'click') return;
      const g = e.target.closest('[data-go]');
      if (g) { E.i = +g.dataset.go; return drawExam(); }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'prev') E.i--;
      if (act === 'next') E.i++;
      if (act === 'flag') E.flag[E.i] = !E.flag[E.i];
      if (act === 'submit') return submitExam(false);
      if (act) drawExam();
    };
  }

  function submitExam(timeout) {
    const unanswered = E.qs.filter((q, i) => !answered(q, E.sel[i])).length;
    if (!timeout && !confirm(unanswered ? `${unanswered} unanswered question(s). Submit anyway?` : 'Submit the exam?')) return;
    clearInterval(timer);
    const by = {};
    let correct = 0;
    E.qs.forEach((q, i) => {
      const ok = isCorrect(q, E.sel[i]);
      if (ok) correct++;
      if (E.sel[i].length) record(q, ok);
      (by[q.d] ||= { c: 0, t: 0 }).t++; if (ok) by[q.d].c++;
    });
    const score = Math.round(1000 * correct / E.qs.length);
    E.done = true; E.result = { score, correct, total: E.qs.length, by, timeout };
    store.exams.unshift({ date: Date.now(), score, correct, total: E.qs.length });
    store.exams = store.exams.slice(0, 20);
    save();
    app.onclick = app.onchange = null;
    if (location.hash !== '#/exam') location.hash = '#/exam'; else drawResults();
  }

  function drawResults() {
    const r = E.result;
    app.innerHTML = `<h1>Exam results</h1><div class="card"><div class="score ${r.score >= 700 ? 'pass' : 'fail'}">${r.score} / 1000</div>
      <div>${r.correct} of ${r.total} correct · ${r.score >= 700 ? 'PASS' : 'FAIL'}${r.timeout ? ' · time expired' : ''}</div>
      <table style="margin-top:12px"><tr><th>Domain</th><th>Correct</th><th>%</th></tr>${Object.entries(r.by).sort().map(([d, v]) =>
        `<tr><td>${d}. ${DOMAINS[d].name}</td><td>${v.c}/${v.t}</td><td>${Math.round(100 * v.c / v.t)}%</td></tr>`).join('')}</table>
      <p class="row"><button class="btn accent" id="again">New exam</button><a class="btn" href="#/practice?status=incorrect">Practice mistakes</a></p></div>
      <h2>Review</h2>${E.qs.map((q, i) => `<div class="card" style="margin-bottom:12px"><div class="muted">Question ${i + 1}</div>${qHTML(q, E.sel[i], true)}</div>`).join('')}`;
    $('#again').onclick = () => { E = null; viewExam(); };
  }

  const CS = {};
  function viewCases(params) {
    const id = params.get('id') || CASES[0].id;
    const c = CASES.find(x => x.id === id) || CASES[0];
    const st = CS[c.id] ||= { tab: Object.keys(c.sections)[0], sel: c.questions.map(() => []), rev: false };
    const qs = BANK.filter(q => q.caseId === c.id);
    app.innerHTML = `<h1>Case studies</h1><div class="row" style="margin-bottom:14px">${CASES.map(x =>
      `<a class="btn ${x.id === c.id ? 'primary' : ''}" href="#/cases?id=${esc(x.id)}">${esc(x.title)}</a>`).join('')}</div>
      <div class="card"><h2 style="margin-top:0">${esc(c.title)}</h2><div class="tabs">${Object.keys(c.sections).map(k =>
        `<button data-tab="${esc(k)}" class="${k === st.tab ? 'on' : ''}">${esc(k)}</button>`).join('')}</div>
      <div class="casebody">${c.sections[st.tab]}</div></div>
      ${qs.map((q, i) => `<div class="card" style="margin-top:12px" data-q="${i}">${qHTML(q, st.sel[i], st.rev)}</div>`).join('')}
      <p class="row">${st.rev ? `<b>${qs.filter((q, i) => isCorrect(q, st.sel[i])).length} / ${qs.length} correct</b><button class="btn" data-act="retry">Try again</button>`
        : '<button class="btn accent" data-act="submit">Submit answers</button>'}</p>`;
    app.onclick = app.onchange = e => {
      if (!location.hash.startsWith('#/cases')) return;
      const t = e.target.closest('[data-tab]');
      if (t) { st.tab = t.dataset.tab; return viewCases(params); }
      const qEl = e.target.closest('[data-q]');
      if (qEl) {
        const i = +qEl.dataset.q, s = interact(e, qs[i], st.sel[i], st.rev);
        if (s) { st.sel[i] = s; return viewCases(params); }
      }
      if (e.type !== 'click') return;
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'submit') { st.rev = true; qs.forEach((q, i) => st.sel[i].length && record(q, isCorrect(q, st.sel[i]))); save(); }
      if (act === 'retry') { st.rev = false; st.sel = qs.map(() => []); }
      if (act) viewCases(params);
    };
  }

  function viewResources() {
    const label = k => k.replace(/^./, c => c.toUpperCase());
    app.innerHTML = `<h1>Study resources</h1>
      <div class="notice">Always confirm the current skills outline and weights on the official DP-750 exam page on Microsoft Learn, as Microsoft updates outlines periodically.</div>
      ${Object.entries(DOMAINS).map(([d, D]) => {
        const qs = BANK.filter(q => q.d == d);
        const topics = [...new Set(qs.map(q => q.topic))];
        const refs = [...new Set(qs.map(q => q.ref).filter(k => R[k]))];
        return `<h2>${d}. ${esc(D.name)} <span class="muted">(${D.pct})</span></h2><div class="card">
          <div class="row">${topics.map(t => `<a class="tag d${d}" href="#/practice?d=${d}&topic=${encodeURIComponent(t)}">${esc(t)} (${qs.filter(q => q.topic === t).length})</a>`).join('')}</div>
          <ul class="skills">${refs.map(k => `<li><a href="${esc(R[k])}" target="_blank" rel="noopener">${esc(label(k))}</a> <span class="muted">${esc(R[k])}</span></li>`).join('')}</ul></div>`;
      }).join('')}`;
  }

  // ---------- router ----------
  function route() {
    const [path, qs] = (location.hash.slice(2) || 'home').split('?');
    const params = new URLSearchParams(qs || '');
    document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + path));
    if (path !== 'exam' && path !== 'cases') app.onclick = app.onchange = null;
    ({ practice: viewPractice, exam: viewExam, cases: viewCases, resources: viewResources }[path] || viewHome)(params);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
