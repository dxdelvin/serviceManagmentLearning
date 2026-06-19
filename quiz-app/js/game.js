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

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#6ec6ff', '#7ee08a', '#ffe566', '#ffb3c6', '#c4a8ff', '#ff7b7b'];
  const particles = Array.from({ length: 70 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 11,
    vy: (Math.random() - 0.5) * 11 - 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 4,
    life: 1,
    gravity: 0.11,
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= 0.014;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size * 0.7);
    }
    frame++;
    if (alive && frame < 140) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

function gradeExam(score, total) {
  const pct = score / total;
  if (pct >= 0.93) return { title: 'Amazing!', pass: true };
  if (pct >= 0.8) return { title: 'Great job!', pass: true };
  if (pct >= 0.65) return { title: 'You passed!', pass: true };
  if (pct >= 0.5) return { title: 'Almost there!', pass: false };
  return { title: 'Keep going!', pass: false };
}