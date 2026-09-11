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
 