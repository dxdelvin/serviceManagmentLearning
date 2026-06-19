const BADGES = [
  { id: 'first_blood', icon: 'sprout', name: 'First try', check: p => p.totalAnswered >= 1 },
  { id: 'streak_5', icon: 'flame', name: 'Hot streak', check: p => p.bestStreak >= 5 },
  { id: 'streak_10', icon: 'spark', name: 'Super streak', check: p => p.bestStreak >= 10 },
  { id: 'master_10', icon: 'books', name: '10 mastered', check: p => getMasteredCount(p) >= 10 },
  { id: 'master_50', icon: 'book', name: '50 mastered', check: p => getMasteredCount(p) >= 50 },
  { id: 'master_100', icon: 'medal', name: '100 mastered', check: p => getMasteredCount(p) >= 100 },
  { id: 'exam_first', icon: 'target', name: 'Quiz done', check: p => p.examsTaken >= 1 },
  { id: 'exam_pass', icon: 'badgeCheck', name: 'Passed', check: p => p.examsPassed >= 1 },
  { id: 'exam_perfect', icon: 'star', name: 'Perfect score', check: p => p.badges.includes('exam_perfect') },
  { id: 'xp_500', icon: 'star', name: 'Star collector', check: p => p.xp >= 500 },
  { id: 'xp_2000', icon: 'spark', name: 'Star master', check: p => p.xp >= 2000 },
  { id: 'accuracy_80', icon: 'brain', name: 'Sharp mind', check: p => p.totalAnswered >= 50 && getAccuracy(p) >= 80 },
];

const WIN_LINES = [
  'You got it!',
  'Nice one!',
  'Nailed it!',
  'That\'s right!',
  'Yes! Correct!',
  'Crushed it!',
  'Spot on!',
  'Brilliant!',
  'Boom!',
  'Winner!',
  'So good!',
];

const MINI_PRAISE = ['Nice!', 'Boom!', 'Yes!', 'Star!', 'Woo!'];

function awardXp(progress, amount) {
  progress.xp += amount;
  saveProgress(progress);
  return amount;
}

function checkBadges(progress) {
  const newBadges = [];
  for (const badge of BADGES) {
    if (!progress.badges.includes(badge.id) && badge.check(progress)) {
      progress.badges.push(badge.id);
      newBadges.push(badge);
    }
  }
  if (newBadges.length) saveProgress(progress);
  return newBadges;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickExamQuestions(questions, count = 15) {
  return shuffleArray(questions).slice(0, count);
}

function getWinMessage(streak, learnMode) {
  if (learnMode === 'wrong') return 'Fixed it!';
  if (streak >= 10) return 'Unstoppable!';
  if (streak >= 7) return `${streak} in a row — amazing!`;
  if (streak >= 5) return `${streak} streak — on fire!`;
  if (streak >= 3) return `${streak} in a row — keep going!`;
  if (streak === 2) return 'Two in a row!';
  return WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)];
}

function getWinSubline(streak, learnMode) {
  if (learnMode === 'wrong') return '+10 stars — crossed off your wrong list';
  if (streak >= 10) return '+10 stars — legendary run';
  if (streak >= 5) return '+10 stars — you\'re on a hot streak';
  if (streak >= 3) return '+10 stars — momentum building';
  if (streak === 2) return '+10 stars — two for two!';
  return '+10 stars — great start!';
}

function getMiniWinToast(streak, learnMode) {
  if (learnMode === 'wrong') return 'Wrong answer crushed!';
  if (streak === 2) return 'Back-to-back wins!';
  return MINI_PRAISE[Math.floor(Math.random() * MINI_PRAISE.length)];
}

function getMiniPraise() {
  return MINI_PRAISE[Math.floor(Math.random() * MINI_PRAISE.length)];
}

function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ` toast-${type}` : '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function showFloatReward(text, anchorEl, opts = {}) {
  const rect = anchorEl?.getBoundingClientRect?.();
  const x = (rect ? rect.left + rect.width / 2 : window.innerWidth / 2) + (opts.offsetX || 0);
  const y = (rect ? rect.top + rect.height / 2 : window.innerHeight / 2) + (opts.offsetY || 0);

  const el = document.createElement('div');
  el.className = 'float-reward' + (opts.alt ? ' float-reward-alt' : '');
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), opts.alt ? 800 : 950);
}

function pulseHudStars() {
  const hud = document.querySelector('.topbar-score');
  if (!hud) return;
  hud.classList.remove('star-pop');
  void hud.offsetWidth;
  hud.classList.add('star-pop');
}

function flashCorrectScreen(strong = false) {
  const frame = document.querySelector('.page-frame');
  if (!frame) return;
  frame.classList.add(strong ? 'correct-flash-strong' : 'correct-flash');
  setTimeout(() => frame.classList.remove('correct-flash', 'correct-flash-strong'), strong ? 500 : 400);
}

function spawnWinSparkles(container) {
  const layer = container?.querySelector?.('.win-sparkles') || container;
  if (!layer) return;
  layer.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'win-sparkle';
    s.style.left = `${8 + Math.random() * 84}%`;
    s.style.top = `${5 + Math.random() * 70}%`;
    s.style.animationDelay = `${Math.random() * 0.15}s`;
    layer.appendChild(s);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 750);
}

function showWinBurst(cardEl, streak) {
  if (!cardEl) return;
  const burst = document.createElement('div');
  burst.className = 'win-burst';
  burst.textContent = streak === 2 ? 'NICE!' : 'YES!';
  cardEl.appendChild(burst);
  setTimeout(() => burst.remove(), 850);
}

function pulseHudProgress() {
  const pct = document.querySelector('.topbar-progress');
  if (!pct) return;
  pct.classList.remove('progress-pop');
  void pct.offsetWidth;
  pct.classList.add('progress-pop');
}

function fireConfetti(intensity = 'normal', origin = null) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const counts = { sparkle: 40, fun: 115, normal: 95, big: 130, mega: 190 };
  const count = counts[intensity] || counts.normal;
  const ox = origin?.x ?? canvas.width / 2;
  const oy = origin?.y ?? canvas.height / 2;
  const colors = ['#6ec6ff', '#7ee08a', '#ffe566', '#ffb3c6', '#c4a8ff', '#ff7b7b', '#2d9a42'];

  const speedMul = intensity === 'mega' ? 1.35
    : intensity === 'big' ? 1.15
    : intensity === 'fun' ? 1.12
    : intensity === 'sparkle' ? 1.25
    : 1;

  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 7 + 4) * speedMul;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 4 + 2),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: intensity === 'sparkle' ? Math.random() * 4 + 2 : Math.random() * 7 + 3,
      life: 1,
      gravity: intensity === 'sparkle' ? 0.07 : 0.1 + Math.random() * 0.06,
      spin: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * Math.PI,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
    };
  });

  let frame = 0;
  const maxFrames = intensity === 'mega' ? 170
    : intensity === 'big' ? 150
    : intensity === 'fun' ? 145
    : intensity === 'sparkle' ? 90
    : 130;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rotation += p.spin;
      p.life -= intensity === 'mega' ? 0.011 : 0.013;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
      }
      ctx.restore();
    }
    frame++;
    if (alive && frame < maxFrames) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

function celebrateCorrect({ streak, learnMode, originEl, cardEl, feedbackEl, iconEl }) {
  const intensity = streak >= 10 ? 'mega'
    : streak >= 5 ? 'big'
    : streak >= 3 ? 'normal'
    : 'fun';
  const isEarlyWin = streak < 3;
  const rect = originEl?.getBoundingClientRect?.();
  const origin = rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : null;

  fireConfetti(intensity, origin);
  setTimeout(() => fireConfetti('sparkle', origin), 160);
  if (isEarlyWin) {
    setTimeout(() => fireConfetti('sparkle', origin), 320);
  }

  showFloatReward('+10 stars', originEl || cardEl);
  setTimeout(() => {
    showFloatReward(getMiniPraise(), originEl || cardEl, { alt: true, offsetX: 36, offsetY: -12 });
  }, 100);

  pulseHudStars();
  pulseHudProgress();
  flashCorrectScreen(isEarlyWin);

  if (cardEl) {
    cardEl.classList.remove('correct-pop', 'correct-pop-big', 'shake');
    void cardEl.offsetWidth;
    cardEl.classList.add(isEarlyWin ? 'correct-pop-big' : 'correct-pop');
    setTimeout(() => cardEl.classList.remove('correct-pop', 'correct-pop-big'), 700);
    spawnWinSparkles(cardEl);
    if (isEarlyWin) showWinBurst(cardEl, streak);
  }

  if (feedbackEl) {
    feedbackEl.classList.add('correct-win');
    if (isEarlyWin) feedbackEl.classList.add('correct-win-big');
    setTimeout(() => feedbackEl.classList.remove('correct-win-big'), 700);
  }

  if (iconEl) {
    iconEl.classList.add('celebrate');
    setTimeout(() => iconEl.classList.remove('celebrate'), 750);
  }

  if (originEl) {
    originEl.classList.add('correct-pick');
    setTimeout(() => originEl.classList.remove('correct-pick'), 550);
  }

  showToast(getMiniWinToast(streak, learnMode), 'win');
}

function gradeExam(score, total) {
  const pct = score / total;
  if (pct >= 0.93) return { title: 'Amazing!', pass: true };
  if (pct >= 0.8) return { title: 'Great job!', pass: true };
  if (pct >= 0.65) return { title: 'You passed!', pass: true };
  if (pct >= 0.5) return { title: 'Almost there!', pass: false };
  return { title: 'Keep going!', pass: false };
}