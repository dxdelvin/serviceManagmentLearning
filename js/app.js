let questions = [];
let progress = loadProgress();
let learnQueue = [];
let learnPointer = 0;
let learnAnswered = false;
let examQuestions = [];
let examAnswers = {};
let examIndex = 0;
let examStartTime = null;
let examTimerInterval = null;
let learnMode = 'normal';
let reviewNoticeTimer = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function initStaticIcons() {
  const map = {
    'ico-brand': 'book',
    'ico-hud-star': 'star',
    'ico-stat-star': 'star',
    'ico-hero': 'homeScene',
    'ico-learn': 'learn',
    'ico-quiz': 'quiz',
    'ico-topics-link': 'folder',
    'ico-progress-link': 'star',
    'ico-back-learn': 'arrowLeft',
    'ico-back-exam': 'arrowLeft',
    'ico-back-progress': 'arrowLeft',
    'ico-back-topics': 'arrowLeft',

    'ico-next': 'arrowRight',
    'ico-shuffle': 'shuffle',
    'ico-exam-intro': 'quiz',
    'ico-clock': 'clock',
    'ico-topic-home': 'folder',
    'ico-topic-learn': 'folder',
    'ico-topic-exam-intro': 'folder',
    'ico-topic-exam': 'folder',
    'ico-stat-wrong': 'cross',
    'ico-practice-wrong': 'target',
    'ico-wrong-link': 'cross',
    'ico-learn-wrong': 'cross',
    'ico-back-wrong': 'arrowLeft',
    'ico-wrong-empty': 'check',
    'ico-review-notice': 'badgeCheck',
  };
  for (const [id, name] of Object.entries(map)) {
    setIcon(document.getElementById(id), name);
  }
}

async function init() {
  initStaticIcons();

  try {
    const res = await fetch('data/questions.json');
    questions = await res.json();
    questions.forEach(q => {
      q.options.forEach(o => {
        o.text = o.text.replace(/diƯicult/gi, 'difficult').replace(/oƯ/g, 'off').replace(/eƯ/g, 'eff');
      });
    });
  } catch (e) {
    document.getElementById('app').innerHTML = '<p style="text-align:center;padding:3rem">Could not load questions. Please use a local server.</p>';
    return;
  }

  migrateWrongIds(progress, questions);
  initLearnQueue();
  bindEvents();
  updateStars();
  updateWrongDisplay();
  updateTopicDisplay();
  showScreen('screen-home');
}

function getWrongPool() {
  return getWrongQuestions(progress, questions, progress.topicFilter);
}

function getFilteredQuestions() {
  return getPoolQuestions(questions, progress.topicFilter);
}

function getCoverageStats() {
  const pool = getFilteredQuestions();
  const seen = getSeenCount(progress, questions, progress.topicFilter);
  const total = pool.length;
  const pct = getCoveragePercent(progress, questions, progress.topicFilter);
  return { pool, seen, total, pct };
}

function getExamPoolSize() {
  return Math.min(15, getFilteredQuestions().length);
}

function updateTopicDisplay() {
  const filter = progress.topicFilter;
  const count = getFilteredQuestions().length;
  const examCount = getExamPoolSize();
  const badgeText = filter ? `${filter} only · ${count} questions` : '';

  const { seen, pct } = getCoverageStats();
  const heroSub = $('#hero-sub');
  if (heroSub) {
    if (filter) {
      const reviewed = isPoolFullySeen(progress, questions, filter);
      heroSub.textContent = reviewed
        ? `${filter} reviewed · ${count} questions · practice again anytime`
        : `${count} questions in this topic · ${pct}% seen so far`;
    } else {
      heroSub.textContent = `${questions.length} questions · ${pct}% seen · learn or quiz`;
    }
  }

  const badges = [
    ['home', true],
    ['learn', false],
    ['exam-intro', false],
    ['exam', false],
  ];

  badges.forEach(([id, showLabel]) => {
    const el = $(`#topic-filter-${id}`);
    if (!el) return;
    el.hidden = !filter;
    if (!filter) return;

    const textEl = $(`#topic-filter-${id}-text`);
    if (!textEl) return;
    textEl.textContent = showLabel
      ? `${filter} · ${count} questions`
      : badgeText;
  });

  const examIntro = $('#exam-intro-text');
  if (examIntro) {
    if (filter) {
      examIntro.textContent = examCount < 15
        ? `${examCount} random questions from this topic only. Answers show up when you finish.`
        : '15 random questions from this topic only. Answers show up when you finish.';
    } else {
      examIntro.textContent = '15 random questions. Answers show up when you finish.';
    }
  }

  const examPass = $('#exam-intro-pass');
  if (examPass) {
    examPass.textContent = !examCount
      ? 'No questions in this topic.'
      : `Need ${Math.ceil(examCount * 0.65)} right to pass.`;
  }
}

function initLearnQueue() {
  learnMode = 'normal';
  if (progress.learnOrder.length !== questions.length) {
    progress.learnOrder = questions.map(q => q.id);
    saveProgress(progress);
  }
  learnQueue = progress.learnOrder.map(id => questions.find(q => q.id === id)).filter(Boolean);
  if (progress.topicFilter) {
    learnQueue = learnQueue.filter(q => q.topic === progress.topicFilter);
  }
  if (learnQueue.length === 0) {
    learnPointer = 0;
    return;
  }
  learnPointer = Math.min(progress.learnIndex, learnQueue.length - 1);
}

function initWrongLearnQueue(startId = null) {
  learnMode = 'wrong';
  learnQueue = getWrongPool();
  if (startId) {
    const idx = learnQueue.findIndex(q => q.id === startId);
    learnPointer = idx >= 0 ? idx : 0;
  } else if (learnQueue.length) {
    learnPointer = Math.min(progress.wrongLearnIndex, learnQueue.length - 1);
  } else {
    learnPointer = 0;
  }
}

function updateWrongDisplay() {
  const wrongPool = getWrongPool();
  const totalWrong = getWrongQuestions(progress, questions).length;
  const count = wrongPool.length;

  const chip = $('#home-wrong-chip');
  if (chip) chip.hidden = totalWrong === 0;
  const statWrong = $('#stat-wrong');
  if (statWrong) statWrong.textContent = totalWrong;

  const practiceBtn = $('#btn-practice-wrong');
  if (practiceBtn) practiceBtn.disabled = count === 0;

  const practiceCount = $('#practice-wrong-count');
  if (practiceCount) practiceCount.textContent = count;

  const practiceDesc = $('#practice-wrong-desc');
  if (practiceDesc) {
    if (!count) {
      practiceDesc.textContent = 'Answer questions wrong and they appear here';
    } else if (progress.topicFilter) {
      practiceDesc.textContent = `${count} wrong in your current topic`;
    } else {
      practiceDesc.textContent = `${count} question${count === 1 ? '' : 's'} to practice`;
    }
  }

  const wrongBadge = $('#learn-wrong-badge');
  const wrongBadgeText = $('#learn-wrong-badge-text');
  if (wrongBadge) wrongBadge.hidden = learnMode !== 'wrong';
  if (wrongBadgeText && learnMode === 'wrong') {
    wrongBadgeText.textContent = `Practicing wrong answers · ${learnQueue.length} left`;
  }
}

function startPracticeWrong(startId = null) {
  initWrongLearnQueue(startId);
  if (!learnQueue.length) {
    showToast(progress.topicFilter
      ? `No wrong questions in "${progress.topicFilter}"`
      : 'No wrong questions to practice');
    return;
  }
  showScreen('screen-learn');
  renderLearnQuestion();
}

function bindEvents() {
  $('#brand-home').onclick = () => showScreen('screen-home');
  $('#btn-learn').onclick = () => { initLearnQueue(); showScreen('screen-learn'); renderLearnQuestion(); };
  $('#btn-practice-wrong').onclick = () => startPracticeWrong();
  $('#btn-wrong-list').onclick = () => { renderWrongList(); showScreen('screen-wrong'); };
  $('#btn-wrong-practice-all').onclick = () => startPracticeWrong();
  $('#btn-exam').onclick = () => showScreen('screen-exam-intro');
  $('#btn-exam-start').onclick = startExam;
  $('#btn-progress').onclick = () => { renderProgress(); showScreen('screen-progress'); };
  $('#btn-topics').onclick = () => { renderTopics(); showScreen('screen-topics'); };
  $('#btn-topic-change-home').onclick = () => { renderTopics(); showScreen('screen-topics'); };
  $('#btn-learn-next').onclick = nextLearnQuestion;
  $('#btn-learn-shuffle').onclick = shuffleLearn;
  $('#btn-learn-skip').onclick = () => {
    if (!learnQueue.length) return;
    advanceLearnPointer();
  };
  $('#btn-exam-prev').onclick = () => navigateExam(-1);
  $('#btn-exam-next').onclick = () => navigateExam(1);
  $('#btn-exam-finish').onclick = finishExam;
  $('#btn-exam-retry').onclick = () => showScreen('screen-exam-intro');
  $('#btn-results-practice-wrong').onclick = () => startPracticeWrong();
  $('#btn-reset').onclick = resetProgress;

  $$('[data-back]').forEach(btn => {
    btn.onclick = () => showScreen('screen-home');
  });
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(`#${id}`).classList.add('active');
  $('#topbar-hud').hidden = id === 'screen-home';
  if (id !== 'screen-learn') hideLearnReviewNotice();
  updateTopicDisplay();
  updateWrongDisplay();
  updateCoverageDisplay();
  window.scrollTo(0, 0);
}

function updateCoverageDisplay() {
  const { seen, total, pct } = getCoverageStats();
  const pctEl = $('#hud-progress-pct');
  const detailEl = $('#hud-progress-detail');
  const statCoverage = $('#stat-coverage');

  if (pctEl) pctEl.textContent = `${pct}%`;
  if (detailEl) {
    detailEl.textContent = progress.topicFilter
      ? `${seen}/${total} topic`
      : `${seen}/${total}`;
  }
  if (statCoverage) statCoverage.textContent = `${pct}%`;
}

function updateStars() {
  const stars = progress.totalCorrect;
  const done = progress.totalAnswered;
  $('#hud-stars').textContent = stars;
  $('#stat-stars').textContent = stars;
  $('#stat-done').textContent = done;
  updateCoverageDisplay();
}

function hideLearnReviewNotice() {
  const notice = $('#learn-review-notice');
  if (notice) notice.hidden = true;
  if (reviewNoticeTimer) {
    clearTimeout(reviewNoticeTimer);
    reviewNoticeTimer = null;
  }
}

function showLearnReviewNotice() {
  if (learnMode !== 'normal') return;

  const notice = $('#learn-review-notice');
  const textEl = $('#learn-review-notice-text');
  if (!notice || !textEl) return;

  const label = progress.topicFilter
    ? `"${progress.topicFilter}" reviewed`
    : 'All questions reviewed';

  textEl.textContent = `${label} — starting from the beginning again!`;
  notice.hidden = false;

  if (reviewNoticeTimer) clearTimeout(reviewNoticeTimer);
  reviewNoticeTimer = setTimeout(() => {
    notice.hidden = true;
    reviewNoticeTimer = null;
  }, 5000);

  showToast(progress.topicFilter
    ? `${progress.topicFilter} reviewed!`
    : 'Full set reviewed!');
}

/* ─── LEARN ─── */
function renderLearnQuestion() {
  learnAnswered = false;
  updateWrongDisplay();

  if (!learnQueue.length) {
    $('#learn-progress-text').textContent = '0 / 0';
    $('#learn-qnum').textContent = '';
    if (learnMode === 'wrong') {
      $('#learn-question').textContent = 'You fixed them all! Nice work.';
      setIcon($('#feedback-icon'), 'check');
      const header = $('#feedback-header');
      header.className = 'answer-msg correct';
      header.textContent = 'All cleared!';
      $('#learn-feedback').hidden = false;
    } else {
      $('#learn-question').textContent = progress.topicFilter
        ? `No questions found for "${progress.topicFilter}". Pick another topic.`
        : 'No questions available.';
      $('#learn-feedback').hidden = true;
    }
    $('#learn-options').innerHTML = '';
    return;
  }

  const q = learnQueue[learnPointer];
  if (!q) return;

  const { seen, total, pct } = getCoverageStats();
  const passLabel = learnMode === 'wrong'
    ? `${learnPointer + 1} / ${learnQueue.length}`
    : `${learnPointer + 1} / ${learnQueue.length} · ${pct}% seen`;
  $('#learn-progress-text').textContent = passLabel;

  const reviewed = learnMode === 'normal' && isPoolFullySeen(progress, questions, progress.topicFilter);
  $('#learn-qnum').textContent = reviewed
    ? `Question ${q.id} · reviewing again`
    : `Question ${q.id}`;
  $('#learn-question').textContent = q.question;
  $('#learn-feedback').hidden = true;

  const container = $('#learn-options');
  container.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${opt.id}</span><span>${opt.text}</span>`;
    btn.onclick = () => handleLearnAnswer(q, opt.id);
    container.appendChild(btn);
  });
}

function handleLearnAnswer(q, selected) {
  if (learnAnswered) return;
  learnAnswered = true;
  const correct = selected === q.correct;
  const buttons = $$('#learn-options .option-btn');

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    const letter = q.options[i].id;
    if (letter === q.correct) btn.classList.add('correct');
    else if (letter === selected && !correct) btn.classList.add('wrong');
  });

  const wasFullySeen = learnMode === 'normal' && isPoolFullySeen(progress, questions, progress.topicFilter);
  recordAnswer(progress, q.id, correct, q.topic);
  if (correct) {
    awardXp(progress, 10);
    if (learnMode === 'wrong') {
      const idx = learnQueue.findIndex(item => item.id === q.id);
      if (idx >= 0) {
        learnQueue.splice(idx, 1);
        if (learnPointer >= learnQueue.length) learnPointer = 0;
        progress.wrongLearnIndex = learnPointer;
        saveProgress(progress);
      }
    }
  }

  setIcon($('#feedback-icon'), correct ? 'check' : 'cross');
  const header = $('#feedback-header');
  header.className = `answer-msg ${correct ? 'correct' : 'wrong'}`;
  header.textContent = correct
    ? 'You got it!'
    : `Not this time — it's ${q.correct}`;

  $('#learn-feedback').hidden = false;

  if (!correct) $('#learn-card').classList.add('shake');
  setTimeout(() => $('#learn-card').classList.remove('shake'), 400);

  if (correct) fireConfetti();

  checkBadges(progress).forEach(b => showToast(`New sticker: ${b.name}!`));

  updateStars();
  updateWrongDisplay();
  updateCoverageDisplay();

  if (learnMode === 'normal' && !wasFullySeen && isPoolFullySeen(progress, questions, progress.topicFilter)) {
    const notice = $('#learn-review-notice');
    const textEl = $('#learn-review-notice-text');
    if (notice && textEl) {
      const label = progress.topicFilter ? `"${progress.topicFilter}" complete` : 'All questions seen';
      textEl.textContent = `${label} — nice! Keep going to review.`;
      notice.hidden = false;
      if (reviewNoticeTimer) clearTimeout(reviewNoticeTimer);
      reviewNoticeTimer = setTimeout(() => {
        notice.hidden = true;
        reviewNoticeTimer = null;
      }, 5000);
      showToast(progress.topicFilter
        ? `${progress.topicFilter} — all questions seen!`
        : 'You\'ve seen every question!');
    }
  }

  if (learnMode === 'wrong' && correct && !learnQueue.length) {
    showToast('All wrong questions cleared!');
    fireConfetti();
  }
}

function advanceLearnPointer() {
  if (!learnQueue.length) return false;

  const atEnd = learnPointer === learnQueue.length - 1;
  learnPointer = (learnPointer + 1) % learnQueue.length;

  if (learnMode === 'normal' && atEnd && learnPointer === 0) {
    showLearnReviewNotice();
  }

  if (learnMode === 'wrong') {
    progress.wrongLearnIndex = learnPointer;
  } else {
    progress.learnIndex = learnPointer;
  }
  saveProgress(progress);
  renderLearnQuestion();
  return true;
}

function nextLearnQuestion() {
  if (!learnQueue.length) {
    showScreen('screen-home');
    return;
  }
  advanceLearnPointer();
}

function shuffleLearn() {
  if (!learnQueue.length) return;

  if (learnMode === 'wrong') {
    learnQueue = shuffleArray(learnQueue);
    learnPointer = 0;
    progress.wrongLearnIndex = 0;
    saveProgress(progress);
    showToast('Mixed up!');
    renderLearnQuestion();
    return;
  }

  if (progress.topicFilter) {
    const filteredIds = new Set(learnQueue.map(q => q.id));
    const shuffledIds = shuffleArray(learnQueue.map(q => q.id));
    let i = 0;
    progress.learnOrder = progress.learnOrder.map(id =>
      filteredIds.has(id) ? shuffledIds[i++] : id
    );
    learnQueue = shuffledIds.map(id => questions.find(q => q.id === id)).filter(Boolean);
  } else {
    learnQueue = shuffleArray(learnQueue);
    progress.learnOrder = learnQueue.map(q => q.id);
  }

  learnPointer = 0;
  progress.learnIndex = 0;
  saveProgress(progress);
  showToast('Mixed up!');
  renderLearnQuestion();
}

/* ─── EXAM ─── */
function startExam() {
  const pool = getFilteredQuestions();
  const examCount = Math.min(15, pool.length);
  if (!examCount) {
    showToast(progress.topicFilter
      ? `No questions in "${progress.topicFilter}"`
      : 'No questions available');
    return;
  }
  examQuestions = pickExamQuestions(pool, examCount);
  examAnswers = {};
  examIndex = 0;
  examStartTime = Date.now();
  if (examTimerInterval) clearInterval(examTimerInterval);
  examTimerInterval = setInterval(updateExamTimer, 1000);
  showScreen('screen-exam');
  renderExamQuestion();
}

function updateExamTimer() {
  const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  $('#exam-timer').textContent = `${m}:${String(s).padStart(2, '0')}`;
}

function renderExamQuestion() {
  const q = examQuestions[examIndex];
  $('#exam-progress').textContent = `${examIndex + 1} / ${examQuestions.length}`;
  $('#exam-qnum').textContent = `Question ${q.id}`;
  $('#exam-question').textContent = q.question;

  const container = $('#exam-options');
  container.innerHTML = '';
  const selected = examAnswers[q.id];
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn' + (selected === opt.id ? ' selected' : '');
    btn.innerHTML = `<span class="option-letter">${opt.id}</span><span>${opt.text}</span>`;
    btn.onclick = () => {
      examAnswers[q.id] = opt.id;
      renderExamQuestion();
    };
    container.appendChild(btn);
  });

  $('#btn-exam-prev').disabled = examIndex === 0;
  const isLast = examIndex === examQuestions.length - 1;
  $('#btn-exam-next').hidden = isLast;
  $('#btn-exam-finish').hidden = !isLast;
}

function navigateExam(dir) {
  examIndex = Math.max(0, Math.min(examQuestions.length - 1, examIndex + dir));
  renderExamQuestion();
}

function finishExam() {
  const unanswered = examQuestions.filter(q => !examAnswers[q.id]);
  if (unanswered.length && !confirm(`You skipped ${unanswered.length}. Finish anyway?`)) return;

  clearInterval(examTimerInterval);
  let score = 0;
  const review = [];

  examQuestions.forEach(q => {
    const userAns = examAnswers[q.id] || '—';
    const correct = userAns === q.correct;
    if (correct) score++;
    review.push({ q, userAns, correct });
    recordAnswer(progress, q.id, correct, q.topic);
  });

  progress.examsTaken++;
  const result = gradeExam(score, examQuestions.length);
  if (result.pass) progress.examsPassed++;
  if (score === examQuestions.length && !progress.badges.includes('exam_perfect')) {
    progress.badges.push('exam_perfect');
  }
  saveProgress(progress);
  awardXp(progress, score * 10);

  const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  setIcon($('#results-icon'), result.pass ? 'trophy' : 'sprout');
  $('#results-title').textContent = result.title;
  $('#results-score').textContent = score;
  $('#results-total').textContent = examQuestions.length;
  const passScore = Math.ceil(examQuestions.length * 0.65);
  $('#results-subtitle').textContent = result.pass
    ? `You passed! Finished in ${m}m ${s}s.`
    : `Keep practicing — you need ${passScore} to pass.`;

  const reviewEl = $('#results-review');
  reviewEl.innerHTML = '';

  const wrongItems = review.filter(r => !r.correct);
  const rightItems = review.filter(r => r.correct);

  function appendReviewItem({ q, userAns, correct }) {
    const item = document.createElement('div');
    item.className = `review-item ${correct ? 'correct-item' : 'wrong-item'}`;
    const correctOpt = q.options.find(o => o.id === q.correct);
    item.innerHTML = `
      <div class="review-q">${q.question}</div>
      <div class="review-ans">
        ${correct
          ? `<span class="ico review-mark">${ICONS.check}</span><strong>${q.correct}) ${correctOpt.text}</strong>`
          : `You picked ${userAns}. Answer: <strong>${q.correct}) ${correctOpt.text}</strong>`
        }
      </div>
    `;
    reviewEl.appendChild(item);
  }

  if (wrongItems.length) {
    const label = document.createElement('p');
    label.className = 'review-section-label wrong-label';
    label.textContent = `Got wrong (${wrongItems.length})`;
    reviewEl.appendChild(label);
    wrongItems.forEach(appendReviewItem);
  }

  if (rightItems.length) {
    const label = document.createElement('p');
    label.className = 'review-section-label right-label';
    label.textContent = `Got right (${rightItems.length})`;
    reviewEl.appendChild(label);
    rightItems.forEach(appendReviewItem);
  }

  const practiceWrongBtn = $('#btn-results-practice-wrong');
  if (practiceWrongBtn) practiceWrongBtn.hidden = wrongItems.length === 0;

  if (result.pass) fireConfetti();
  checkBadges(progress).forEach(b => showToast(`New sticker: ${b.name}!`));
  updateStars();
  updateWrongDisplay();
  updateCoverageDisplay();
  showScreen('screen-exam-results');
}

/* ─── PROGRESS ─── */
function renderProgress() {
  setIcon(
    $('#profile-avatar'),
    progress.totalCorrect >= 50 ? 'faceStar' : 'faceHappy'
  );
  $('#profile-stars').textContent = progress.totalCorrect;
  const { seen, total, pct } = getCoverageStats();
  $('#profile-done').textContent = progress.topicFilter
    ? `${seen}/${total} seen in this topic (${pct}%)`
    : `${seen}/${total} questions seen (${pct}%)`;

  const grid = $('#badges-grid');
  grid.innerHTML = '';
  BADGES.forEach(badge => {
    const unlocked = progress.badges.includes(badge.id);
    const card = document.createElement('div');
    card.className = `badge-card ${unlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <span class="badge-icon ico">${ICONS[badge.icon] || ICONS.sticker}</span>
      <span class="badge-name">${badge.name}</span>
    `;
    grid.appendChild(card);
  });
}

/* ─── WRONG QUESTIONS ─── */
function renderWrongList() {
  const pool = getWrongPool();
  const totalWrong = getWrongQuestions(progress, questions).length;

  const summary = $('#wrong-summary');
  const empty = $('#wrong-empty');
  const list = $('#wrong-list');

  if (!pool.length) {
    summary.hidden = true;
    empty.hidden = false;
    list.innerHTML = '';
    return;
  }

  summary.hidden = false;
  empty.hidden = true;
  $('#wrong-summary-count').textContent = `${pool.length} to fix`;
  $('#wrong-summary-text').textContent = progress.topicFilter
    ? `Wrong answers in "${progress.topicFilter}" — tap one to practice it.`
    : 'Tap any question to practice it one at a time.';

  list.innerHTML = '';
  pool.forEach(q => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'wrong-item';
    const preview = q.question.length > 120 ? `${q.question.slice(0, 120)}…` : q.question;
    item.innerHTML = `
      <span class="wrong-item-num">Q${q.id}</span>
      <span class="wrong-item-body">
        <span class="wrong-item-q">${preview}</span>
        <span class="wrong-item-meta">${q.topic || 'General ITIL'}</span>
      </span>
    `;
    item.onclick = () => startPracticeWrong(q.id);
    list.appendChild(item);
  });

  if (totalWrong > pool.length && progress.topicFilter) {
    const note = document.createElement('p');
    note.className = 'card-text';
    note.style.marginTop = '0.75rem';
    note.style.textAlign = 'center';
    note.textContent = `${totalWrong - pool.length} more wrong in other topics. Clear topic filter to see all.`;
    list.appendChild(note);
  }
}

/* ─── TOPICS ─── */
function renderTopics() {
  const topics = {};
  questions.forEach(q => {
    const t = q.topic || 'General ITIL';
    topics[t] = (topics[t] || 0) + 1;
  });

  const list = $('#topic-list');
  list.innerHTML = '';

  const allSeen = getSeenCount(progress, questions);
  const allPct = getCoveragePercent(progress, questions);
  const allReviewed = isPoolFullySeen(progress, questions);

  const allItem = document.createElement('div');
  allItem.className = 'topic-item' + (progress.topicFilter ? '' : ' active');
  allItem.innerHTML = `
    <span class="topic-item-name">All topics</span>
    <span class="topic-item-meta">
      <span class="topic-item-pct">${allPct}%</span>
      ${allReviewed ? '<span class="topic-item-reviewed">Reviewed</span>' : ''}
      <span class="topic-item-count">${allSeen}/${questions.length}</span>
    </span>
  `;
  allItem.onclick = () => {
    progress.topicFilter = null;
    progress.learnIndex = 0;
    saveProgress(progress);
    initLearnQueue();
    updateTopicDisplay();
    updateWrongDisplay();
    showScreen('screen-home');
  };
  list.appendChild(allItem);

  Object.entries(topics).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
    const seen = getSeenCount(progress, questions, name);
    const pct = getCoveragePercent(progress, questions, name);
    const reviewed = isTopicReviewed(progress, questions, name);
    const item = document.createElement('div');
    item.className = 'topic-item' + (progress.topicFilter === name ? ' active' : '');
    item.innerHTML = `
      <span class="topic-item-name">${name}</span>
      <span class="topic-item-meta">
        <span class="topic-item-pct">${pct}%</span>
        ${reviewed ? '<span class="topic-item-reviewed">Reviewed</span>' : ''}
        <span class="topic-item-count">${seen}/${count}</span>
      </span>
    `;
    item.onclick = () => {
      progress.topicFilter = name;
      progress.learnIndex = 0;
      saveProgress(progress);
      initLearnQueue();
      updateTopicDisplay();
      updateWrongDisplay();
      showScreen('screen-home');
    };
    list.appendChild(item);
  });
}

function resetProgress() {
  if (!confirm('Start over? All your progress will be reset.')) return;
  progress = defaultProgress();
  saveProgress(progress);
  initLearnQueue();
  updateStars();
  updateTopicDisplay();
  updateWrongDisplay();
  renderProgress();
  showToast('Fresh start!');
}

init();