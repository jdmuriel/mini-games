(function () {
  'use strict';

  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;
  const FLIP_MS = 300; // retardo entre casillas al revelar
  const STORAGE_PREFIX = 'mini-games:wordle:';

  const SOLUTIONS = window.WORDS.SOLUTIONS;
  const VALID = new Set(window.WORDS.VALID.concat(SOLUTIONS));

  const KEY_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
  ];

  // ---------- Almacenamiento (localStorage puede fallar en modo privado) ----------

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      } catch (e) { /* sin persistencia */ }
    },
  };

  // ---------- Lógica del juego ----------

  // Quita tildes y diéresis, conserva la ñ.
  function normalize(word) {
    return word
      .toLowerCase()
      .replace(/ñ/g, '\u0000')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\u0000/g, 'ñ');
  }

  // Devuelve 'correct' | 'present' | 'absent' para cada letra,
  // respetando las letras repetidas.
  function evaluate(guess, answer) {
    const result = Array(WORD_LENGTH).fill('absent');
    const remaining = {};
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === answer[i]) {
        result[i] = 'correct';
      } else {
        remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
      }
    }
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i] !== 'correct' && remaining[guess[i]] > 0) {
        result[i] = 'present';
        remaining[guess[i]]--;
      }
    }
    return result;
  }

  function dayNumber(date) {
    const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor(utc / 86400000);
  }

  // Multiplicar por un primo permuta la lista, así la palabra del día no sigue el orden alfabético.
  function dailyAnswer(day) {
    return SOLUTIONS[(day * 7919) % SOLUTIONS.length];
  }

  function randomAnswer() {
    return SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
  }

  // ---------- Estado ----------

  let mode = storage.get('mode', 'daily');
  let game;          // { answer, guesses, done, won, day? }
  let current = '';  // intento en curso
  let busy = false;  // bloquea la entrada durante animaciones

  function loadGame() {
    if (mode === 'daily') {
      const today = dayNumber(new Date());
      const saved = storage.get('daily', null);
      game = saved && saved.day === today
        ? saved
        : { day: today, answer: dailyAnswer(today), guesses: [], done: false, won: false };
    } else {
      const saved = storage.get('free', null);
      game = saved && !saved.done
        ? saved
        : { answer: randomAnswer(), guesses: [], done: false, won: false };
    }
    current = '';
    saveGame();
  }

  function saveGame() {
    storage.set(mode, game);
  }

  function defaultStats() {
    return { played: 0, wins: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0] };
  }

  function recordResult(won, attempts) {
    const stats = storage.get('stats', defaultStats());
    stats.played++;
    if (won) {
      stats.wins++;
      stats.streak++;
      stats.best = Math.max(stats.best, stats.streak);
      stats.dist[attempts - 1]++;
    } else {
      stats.streak = 0;
    }
    storage.set('stats', stats);
  }

  // ---------- DOM ----------

  const boardEl = document.getElementById('board');
  const keyboardEl = document.getElementById('keyboard');
  const toastEl = document.getElementById('toast');
  const statsDialog = document.getElementById('stats');

  function buildBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'row';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', 'Intento ' + (r + 1));
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    for (const keys of KEY_ROWS) {
      const row = document.createElement('div');
      row.className = 'kb-row';
      for (const k of keys) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'key';
        btn.dataset.key = k;
        if (k === 'enter') {
          btn.textContent = 'Enviar';
          btn.classList.add('wide');
        } else if (k === 'back') {
          btn.textContent = '⌫';
          btn.classList.add('wide');
          btn.setAttribute('aria-label', 'Borrar');
        } else {
          btn.textContent = k;
        }
        row.appendChild(btn);
      }
      keyboardEl.appendChild(row);
    }
  }

  function tileAt(r, c) {
    return boardEl.children[r].children[c];
  }

  function paintRow(r, word, result) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = tileAt(r, c);
      tile.textContent = word[c] || '';
      tile.className = 'tile' + (word[c] ? ' filled' : '');
      if (result) tile.classList.add(result[c]);
    }
    if (result) {
      boardEl.children[r].setAttribute('aria-label',
        'Intento ' + (r + 1) + ': ' + word.toUpperCase() + ', ' + describe(word, result));
    }
  }

  function describe(word, result) {
    const names = { correct: 'correcta', present: 'en otra posición', absent: 'no está' };
    return result.map((s, i) => word[i].toUpperCase() + ' ' + names[s]).join('; ');
  }

  const RANK = { absent: 1, present: 2, correct: 3 };

  function paintKeyboard() {
    const best = {};
    for (const guess of game.guesses) {
      const result = evaluate(guess, game.answer);
      for (let i = 0; i < WORD_LENGTH; i++) {
        const l = guess[i];
        if (!best[l] || RANK[result[i]] > RANK[best[l]]) best[l] = result[i];
      }
    }
    for (const btn of keyboardEl.querySelectorAll('.key')) {
      btn.classList.remove('correct', 'present', 'absent');
      const state = best[btn.dataset.key];
      if (state) btn.classList.add(state);
    }
  }

  function render() {
    for (let r = 0; r < MAX_GUESSES; r++) {
      if (r < game.guesses.length) {
        paintRow(r, game.guesses[r], evaluate(game.guesses[r], game.answer));
      } else if (r === game.guesses.length && !game.done) {
        paintRow(r, current);
      } else {
        paintRow(r, '');
      }
    }
    paintKeyboard();
    for (const btn of document.querySelectorAll('.mode')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
    }
  }

  let toastTimer;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 1500);
  }

  function shakeRow() {
    const row = boardEl.children[game.guesses.length];
    row.classList.remove('shake');
    void row.offsetWidth; // reinicia la animación
    row.classList.add('shake');
  }

  // ---------- Entrada ----------

  function onKey(key) {
    if (busy || game.done) return;
    if (key === 'enter') return submit();
    if (key === 'back') {
      current = current.slice(0, -1);
    } else if (/^[a-zñ]$/.test(key) && current.length < WORD_LENGTH) {
      current += key;
    } else {
      return;
    }
    paintRow(game.guesses.length, current);
  }

  function submit() {
    if (current.length < WORD_LENGTH) {
      shakeRow();
      return toast('Faltan letras');
    }
    if (!VALID.has(current)) {
      shakeRow();
      return toast('No está en la lista de palabras');
    }

    const guess = current;
    const r = game.guesses.length;
    const result = evaluate(guess, game.answer);
    game.guesses.push(guess);
    current = '';
    const won = guess === game.answer;
    if (won || game.guesses.length === MAX_GUESSES) {
      game.done = true;
      game.won = won;
      recordResult(won, game.guesses.length);
    }
    saveGame();

    reveal(r, guess, result, () => {
      paintKeyboard();
      if (!game.done) return;
      if (won) {
        boardEl.children[r].classList.add('win');
        const praise = ['¡Genio!', '¡Magnífico!', '¡Impresionante!', '¡Muy bien!', '¡Bien!', '¡Por los pelos!'];
        toast(praise[r], 1800);
      } else {
        toast(game.answer.toUpperCase(), 2500);
      }
      setTimeout(showStats, 1800);
    });
  }

  function reveal(r, guess, result, done) {
    busy = true;
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = tileAt(r, c);
      setTimeout(() => {
        tile.classList.add('flip');
        // cambia el color a mitad del giro
        setTimeout(() => tile.classList.add(result[c]), 250);
      }, c * FLIP_MS);
    }
    setTimeout(() => {
      paintRow(r, guess, result);
      busy = false;
      done();
    }, (WORD_LENGTH - 1) * FLIP_MS + 500);
  }

  // ---------- Estadísticas y compartir ----------

  function showStats() {
    const stats = storage.get('stats', defaultStats());
    document.getElementById('s-played').textContent = stats.played;
    document.getElementById('s-winpct').textContent =
      stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
    document.getElementById('s-streak').textContent = stats.streak;
    document.getElementById('s-best').textContent = stats.best;

    const max = Math.max(1, ...stats.dist);
    const dist = document.getElementById('dist');
    dist.innerHTML = '';
    stats.dist.forEach((n, i) => {
      const row = document.createElement('div');
      row.className = 'dist-row';
      const bar = document.createElement('div');
      bar.className = 'dist-bar';
      if (game.done && game.won && game.guesses.length === i + 1) bar.classList.add('current');
      bar.style.width = Math.max(8, (n / max) * 100) + '%';
      bar.textContent = n;
      row.append(String(i + 1), bar);
      dist.appendChild(row);
    });

    const msg = document.getElementById('result-msg');
    if (game.done) {
      msg.textContent = game.won
        ? '¡Acertaste en ' + game.guesses.length + (game.guesses.length === 1 ? ' intento!' : ' intentos!')
        : 'La palabra era ' + game.answer.toUpperCase();
    } else {
      msg.textContent = '';
    }
    document.getElementById('share-btn').hidden = !game.done;
    document.getElementById('new-btn').hidden = mode === 'daily';

    if (!statsDialog.open) statsDialog.showModal();
  }

  function shareText() {
    const emoji = { correct: '🟩', present: '🟨', absent: '⬜' };
    const title = mode === 'daily' ? 'Wordle #' + game.day : 'Wordle (libre)';
    const score = (game.won ? game.guesses.length : 'X') + '/' + MAX_GUESSES;
    const grid = game.guesses
      .map((g) => evaluate(g, game.answer).map((s) => emoji[s]).join(''))
      .join('\n');
    return title + ' ' + score + '\n\n' + grid;
  }

  async function share() {
    const text = shareText();
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toast('Copiado al portapapeles');
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      toast('No se pudo compartir');
    }
  }

  // ---------- Arranque ----------

  function switchMode(newMode) {
    if (busy) return;
    mode = newMode;
    storage.set('mode', mode);
    loadGame();
    render();
  }

  function newFreeGame() {
    storage.set('free', null);
    statsDialog.close();
    switchMode('free');
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || statsDialog.open) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      onKey('enter');
    } else if (e.key === 'Backspace') {
      onKey('back');
    } else {
      const k = normalize(e.key);
      if (/^[a-zñ]$/.test(k)) onKey(k);
    }
  });

  keyboardEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    btn.blur(); // evita que Enter físico vuelva a pulsar el botón
    onKey(btn.dataset.key);
  });

  for (const btn of document.querySelectorAll('.mode')) {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  }
  document.getElementById('stats-btn').addEventListener('click', showStats);
  document.getElementById('share-btn').addEventListener('click', share);
  document.getElementById('new-btn').addEventListener('click', newFreeGame);

  buildBoard();
  buildKeyboard();
  loadGame();
  render();
  if (game.done) setTimeout(showStats, 400);
})();
