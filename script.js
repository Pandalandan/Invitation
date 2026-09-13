/* ---------- SOUND (Web Audio API, procedural, no external files) ---------- */
  let audioCtx = null;
  let muted = false;
 
  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
 
  function playTone(freq, duration = 0.12, type = 'sine', vol = 0.15) {
    if (muted) return;
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
 
  function sfxClick() { playTone(500, 0.08, 'sine', 0.08); }
  function sfxCorrect() {
    [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 'triangle', 0.12), i * 100));
  }
  function sfxWrong() { playTone(200, 0.15, 'sawtooth', 0.08); }
  function sfxWin() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.25, 'sine', 0.14), i * 130);
    });
  }
  function sfxNo() { playTone(300, 0.08, 'square', 0.06); }
 
  function toggleMute() {
    muted = !muted;
    document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
    if (!muted) ensureAudio();
  }
 
  document.body.addEventListener('click', ensureAudio, { once: true });
 

  /* ---------- WORD SCRAMBLE PUZZLE ---------- */
  const puzzleWords = [
    { word: "SWEET", hint: "Like you, honestly" },
    { word: "FUNNY", hint: "You always crack me up" },
    { word: "GORGEOUS", hint: "You, every single day" },
    { word: "LOYAL", hint: "Always by my side" },
    { word: "ADORABLE", hint: "In every single way" }
  ];
 
  let puzzleIndex = 0;
  let currentLetters = [];   // array of {char, used}
  let currentAnswer = [];    // array of indices into currentLetters, in chosen order
 
  const progressEl = document.getElementById('puzzleProgress');
  const hintEl = document.getElementById('puzzleHint');
  const slotsEl = document.getElementById('answerSlots');
  const bankEl = document.getElementById('letterBank');
  const feedbackEl = document.getElementById('puzzleFeedback');
 
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
 
  function startPuzzle() {
    puzzleIndex = 0;
    loadWord();
  }
 
  function loadWord() {
    feedbackEl.textContent = '\u00A0';
    const entry = puzzleWords[puzzleIndex];
    progressEl.textContent = `Word ${puzzleIndex + 1} of ${puzzleWords.length}`;
    hintEl.textContent = `Hint: ${entry.hint}`;
 
    let letters = entry.word.split('');
    let shuffled = shuffle(letters);
    // make sure it's not accidentally already in order (for words > 1 letter)
    let tries = 0;
    while (shuffled.join('') === entry.word && tries < 10) {
      shuffled = shuffle(letters);
      tries++;
    }
 
    currentLetters = shuffled.map(ch => ({ char: ch, used: false }));
    currentAnswer = [];
 
    renderSlots(entry.word.length);
    renderBank();
  }
 
  function renderSlots(len) {
    slotsEl.innerHTML = '';
    for (let i = 0; i < len; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot empty';
      slot.dataset.pos = i;
      slot.addEventListener('click', () => removeFromAnswer(i));
      slotsEl.appendChild(slot);
    }
    updateSlots();
  }
 
  function updateSlots() {
    const slotEls = slotsEl.querySelectorAll('.slot');
    slotEls.forEach((slot, i) => {
      if (i < currentAnswer.length) {
        const letterIdx = currentAnswer[i];
        slot.textContent = currentLetters[letterIdx].char;
        slot.classList.remove('empty');
      } else {
        slot.textContent = '';
        slot.classList.add('empty');
      }
    });
  }
 
  function renderBank() {
    bankEl.innerHTML = '';
    currentLetters.forEach((letterObj, idx) => {
      const tile = document.createElement('div');
      tile.className = 'letter-tile' + (letterObj.used ? ' used' : '');
      tile.textContent = letterObj.char;
      tile.addEventListener('click', () => addToAnswer(idx));
      bankEl.appendChild(tile);
    });
  }
 
  function addToAnswer(idx) {
    if (currentLetters[idx].used) return;
    if (currentAnswer.length >= currentLetters.length) return;
    sfxClick();
    currentLetters[idx].used = true;
    currentAnswer.push(idx);
    renderBank();
    updateSlots();
  }
 
  function removeFromAnswer(pos) {
    if (pos >= currentAnswer.length) return;
    sfxClick();
    const letterIdx = currentAnswer[pos];
    currentLetters[letterIdx].used = false;
    currentAnswer.splice(pos, 1);
    renderBank();
    updateSlots();
  }
 
  function clearAnswer() {
    sfxClick();
    currentAnswer.forEach(idx => currentLetters[idx].used = false);
    currentAnswer = [];
    renderBank();
    updateSlots();
  }
 
  function showAsk() {
    sfxClick();
    document.getElementById('messageScreen').classList.remove('active');
    document.getElementById('askScreen').classList.add('active');
  }
 
  function checkAnswer() {
    const entry = puzzleWords[puzzleIndex];
    if (currentAnswer.length !== entry.word.length) {
      feedbackEl.style.color = '#e08a8a';
      feedbackEl.textContent = "Use all the letters first!";
      sfxWrong();
      return;
    }
    const built = currentAnswer.map(idx => currentLetters[idx].char).join('');
    if (built === entry.word) {
      sfxCorrect();
      feedbackEl.style.color = 'var(--sky-deep)';
      feedbackEl.textContent = "That's it! 🎉";
      puzzleIndex++;
      setTimeout(() => {
        if (puzzleIndex >= puzzleWords.length) {
          document.getElementById('puzzleScreen').classList.remove('active');
          document.getElementById('messageScreen').classList.add('active');
        } else {
          loadWord();
        }
      }, 900);
    } else {
      sfxWrong();
      feedbackEl.style.color = '#e08a8a';
      feedbackEl.textContent = "Not quite — try rearranging!";
    }
  }
 
  /* ---------- INTRO CAROUSEL ---------- */
  function buildSlides() {
    return [
      `Hey ${herName}... I have something to ask.`,
      "But first, a few reasons why...",
      `You make ordinary days feel like sky-blue ones, ${herName}.`,
      "You're kind, you're funny, and you smell like flowers (probably).",
      "One more thing before I ask..."
    ];
  }
  let slides = buildSlides();
  let slideIndex = 0;
  const introText = document.getElementById('introText');
  const dotsContainer = document.getElementById('dots');
  const nextBtn = document.getElementById('nextBtn');
 
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dotsContainer.appendChild(dot);
  });
 
  function typeText(text, el, speed = 35) {
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
  }
 
  function updateDots() {
    document.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === slideIndex);
    });
  }
 
  function nextSlide() {
    sfxClick();
    slideIndex++;
    if (slideIndex >= slides.length) {
      document.getElementById('introScreen').classList.remove('active');
      document.getElementById('puzzleScreen').classList.add('active');
      startPuzzle();
      return;
    }
    typeText(slides[slideIndex], introText);
    updateDots();
    nextBtn.textContent = slideIndex === slides.length - 1 ? "Let's go →" : "Next →";
  }

  /* ---------- BLACK OPENING + NAME CAPTURE ---------- */
  let herName = 'you';
  const overlay = document.getElementById('introOverlay');
  const nameStep = document.getElementById('nameStep');
  const nameInput = document.getElementById('nameInput');
  const card = document.getElementById('card');
 
  setTimeout(() => {
    nameStep.classList.add('visible');
    nameInput.focus();
  }, 1900);
 
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitName();
  });
 
  function submitName() {
    ensureAudio();
    const raw = nameInput.value.trim();
    if (raw) {
      herName = raw.replace(/[<>]/g, '');
    }
    sfxClick();
 
    // personalize text now that we have her name
    document.getElementById('mainQuestion').textContent = `Will you be my Valentine, ${herName}?`;
    document.getElementById('resultHeading').textContent = `Yay! I knew you'd say yes, ${herName}.`;
 
    slides = buildSlides();
 
    overlay.classList.add('fade-out');
    card.style.visibility = 'visible';
    setTimeout(() => {
      overlay.style.display = 'none';
      typeText(slides[0], introText);
    }, 1100);
  }


  