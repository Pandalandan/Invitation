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

  /* ---------- NO BUTTON: full-screen teleport dodge ---------- */
  const noExcuses = [
    "nice try 🙃", "nope, try again", "you can't catch me",
    "wrong button, friend", "the universe says yes", "so close!",
    "keep trying...", "not today 😌", "getting warmer? nope.", "almost had it!"
  ];
  let dodgeCount = 0;
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const caption = document.getElementById('noCaption');

  function dodge(e) {
    if (e) e.preventDefault();
    dodgeCount++;
    sfxNo();

    noBtn.style.position = 'fixed';
    const btnW = noBtn.offsetWidth;
    const btnH = noBtn.offsetHeight;
    const maxX = window.innerWidth - btnW - 20;
    const maxY = window.innerHeight - btnH - 20;
    const randX = 10 + Math.random() * maxX;
    const randY = 10 + Math.random() * maxY;
    noBtn.style.left = randX + 'px';
    noBtn.style.top = randY + 'px';
    noBtn.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;

    caption.textContent = noExcuses[Math.min(dodgeCount - 1, noExcuses.length - 1)];

    const scale = Math.min(1 + dodgeCount * 0.05, 1.6);
    yesBtn.style.transform = `scale(${scale})`;
    yesBtn.style.fontSize = (1.05 + dodgeCount * 0.03) + 'rem';

    const shrink = Math.max(1 - dodgeCount * 0.04, 0.55);
    noBtn.style.padding = `${14 * shrink}px ${32 * shrink}px`;
    noBtn.style.fontSize = (1.05 * shrink) + 'rem';
  }

  function sayYes() {
    sfxWin();
    document.getElementById('askScreen').classList.remove('active');
    document.getElementById('result').classList.add('show');
    card.classList.add('yes-state');
    launchHearts();
  }

  function launchHearts() {
    const emojis = ['💙', '🌸', '💐', '✨', '🩵'];
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.fontSize = (16 + Math.random() * 22) + 'px';
        heart.style.animationDuration = (3 + Math.random() * 3) + 's';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 6000);
      }, i * 90);
    }
  }

  /* ---------- CURSOR SPARKLE TRAIL ---------- */
  let lastSparkle = 0;
  function spawnSparkle(x, y) {
    const now = Date.now();
    if (now - lastSparkle < 60) return;
    lastSparkle = now;
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    const icons = ['✨', '🩵', '·'];
    sparkle.textContent = icons[Math.floor(Math.random() * icons.length)];
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
    sparkle.style.setProperty('--dy', (Math.random() * -30 - 10) + 'px');
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 900);
  }
  document.addEventListener('mousemove', (e) => spawnSparkle(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) spawnSparkle(t.clientX, t.clientY);
  });

  /* ---------- BACKGROUND SCENERY: clouds + clickable flowers ---------- */
  function makeScenery() {
    const scenery = document.getElementById('scenery');

    for (let i = 0; i < 5; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud';
      const w = 80 + Math.random() * 100;
      const h = w * 0.4;
      cloud.style.width = w + 'px';
      cloud.style.height = h + 'px';
      cloud.style.top = (5 + Math.random() * 40) + '%';
      cloud.style.animationDuration = (30 + Math.random() * 25) + 's';
      cloud.style.animationDelay = (-Math.random() * 30) + 's';
      scenery.appendChild(cloud);
    }

    const positions = [
      {top: '8%', left: '6%', size: 0.8},
      {top: '18%', left: '88%', size: 1},
      {top: '75%', left: '4%', size: 1.1},
      {top: '82%', left: '90%', size: 0.9},
      {top: '4%', left: '45%', size: 0.6},
      {top: '92%', left: '50%', size: 0.7},
      {top: '55%', left: '2%', size: 0.7},
      {top: '60%', left: '94%', size: 0.8},
    ];

    positions.forEach((pos, idx) => {
      const flower = document.createElement('div');
      flower.className = 'flower';
      flower.style.top = pos.top;
      flower.style.left = pos.left;
      flower.style.transform = `scale(${pos.size})`;
      flower.style.animationDuration = (4 + idx * 0.5) + 's';
      flower.style.animationDelay = (idx * 0.3) + 's';
      flower.innerHTML = babysBreathSVG();
      flower.addEventListener('click', () => bloomFlower(flower));
      scenery.appendChild(flower);
    });
  }

  function bloomFlower(flower) {
    sfxClick();
    flower.classList.remove('bloom');
    void flower.offsetWidth;
    flower.classList.add('bloom');
    const rect = flower.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.textContent = ['✨','🩵','🌸'][Math.floor(Math.random()*3)];
      sparkle.style.left = (rect.left + rect.width/2) + 'px';
      sparkle.style.top = (rect.top + rect.height/2) + 'px';
      sparkle.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
      sparkle.style.setProperty('--dy', (Math.random() * -60 - 10) + 'px');
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 900);
    }
  }

  function babysBreathSVG() {
    return `
    <svg width="70" height="90" viewBox="0 0 70 90">
      <line x1="35" y1="90" x2="35" y2="35" stroke="#8fae8b" stroke-width="2"/>
      <line x1="35" y1="55" x2="20" y2="40" stroke="#8fae8b" stroke-width="1.5"/>
      <line x1="35" y1="50" x2="50" y2="38" stroke="#8fae8b" stroke-width="1.5"/>
      <g fill="#fdfdfb" stroke="#e8e0d5" stroke-width="0.5">
        <circle cx="35" cy="15" r="4"/>
        <circle cx="22" cy="24" r="3.2"/>
        <circle cx="48" cy="22" r="3.2"/>
        <circle cx="35" cy="30" r="3"/>
        <circle cx="20" cy="38" r="2.8"/>
        <circle cx="50" cy="36" r="2.8"/>
        <circle cx="14" cy="20" r="2.5"/>
        <circle cx="56" cy="18" r="2.5"/>
        <circle cx="30" cy="8" r="2.5"/>
        <circle cx="42" cy="8" r="2.5"/>
      </g>
    </svg>`;
  }

  makeScenery();