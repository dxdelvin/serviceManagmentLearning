let questions = [];
let examSets = [];
let activeExamSet = null;
let progress = loadProgress();
let learnQueue = [];
let learnPointer = 0;
let learnAnswered = false;
let examQuestions = [];
let examAnswers = {};
let examIndex = 0;
let examAnswered = false;
let examSetFinishTimer = null;
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
    'ico-exam-sets-home': 'quiz',
    'ico-back-exam-sets': 'arrowLeft',
    'ico-exam-set-next': 'arrowRight',
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
    const setsRes = await fetch('data/exam-sets.json');
    examSets = await setsRes.json();
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

    if (activeExamSet && (id === 'exam-intro' || id === 'exam')) {
      el.hidden = false;
      const textEl = $(`#topic-filter-${id}-text`);
      if (textEl) textEl.textContent = `${activeExamSet.label} · ${activeExamSet.practice}`;
      return;
    }

    el.hidden = !filter;
    if (!filter) return;

    const textEl = $(`#topic-filter-${id}-text`);
    if (!textEl) return;
    textEl.textContent = showLabel
      ? `${filter} · ${count} questions`
      : badgeText;
  });

  updateExamIntroDisplay();
}

function updateExamIntroDisplay() {
  const filter = progress.topicFilter;
  const examCount = getExamPoolSize();
  const titleEl = $('#exam-intro-title');
  const badgeEl = $('#exam-set-badge');
  const examIntro = $('#exam-intro-text');
  const examPass = $('#exam-intro-pass');
  const topicBadge = $('#topic-filter-exam-intro');

  if (activeExamSet) {
    const setCount = activeExamSet.questionIds.length;
    const passAt = Math.ceil(setCount * 0.65);
    if (titleEl) titleEl.textContent = activeExamSet.title;
    if (badgeEl) {
      badgeEl.hidden = false;
      badgeEl.textContent = `${activeExamSet.practice} · ${setCount} questions`;
    }
    if (topicBadge) topicBadge.hidden = true;
    if (examIntro) {
      examIntro.textContent = `${setCount} questions on this practice. See each answer right after you pick — score at the end.`;
    }
    if (examPass) examPass.textContent = `Need ${passAt} right to pass.`;
    return;
  }

  if (titleEl) titleEl.textContent = 'Quiz time';
  if (badgeEl) badgeEl.hidden = true;
  if (topicBadge) topicBadge.hidden = !filter;

  if (examIntro) {
    if (filter) {
      examIntro.textContent = examCount < 15
        ? `${examCount} random questions from this topic only. Answers show up when you finish.`
        : '15 random questions from this topic only. Answers show up when you finish.';
    } else {
      examIntro.textContent = '15 random questions. Answers show up when you finish.';
    }
  }

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
  $('#btn-exam').onclick = () => {
    activeExamSet = null;
    updateExamIntroDisplay();
    showScreen('screen-exam-intro');
  };
  $('#btn-exam-sets').onclick = () => { renderExamSets(); showScreen('screen-exam-sets'); };
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
  $('#btn-exam-set-next').onclick = () => {
    if (examSetFinishTimer) clearTimeout(examSetFinishTimer);
    examIndex++;
    renderExamQuestion();
  };
  $('#btn-exam-set-back').onclick = () => { renderExamSets(); showScreen('screen-exam-sets'); };
  $('#btn-exam-retry').onclick = () => {
    if (activeExamSet) updateExamIntroDisplay();
    showScreen('screen-exam-intro');
  };
  $('#btn-results-practice-wrong').onclick = () => startPracticeWrong();
  $('#btn-reset').onclick = resetProgress;

  $$('[data-back]').forEach(btn => {
    btn.onclick = () => showScreen('screen-home');
  });
}

function showScreen(id) {
  if (id !== 'screen-exam' && id !== 'screen-exam-results' && examSetFinishTimer) {
    clearTimeout(examSetFinishTimer);
    examSetFinishTimer = null;
  }
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
  const feedback = $('#learn-feedback');
  feedback.hidden = true;
  feedback.classList.remove('correct-win', 'correct-win-big');
  const sub = $('#feedback-sub');
  if (sub) sub.hidden = true;
  const sparkles = $('#learn-win-sparkles');
  if (sparkles) sparkles.innerHTML = '';

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

  const feedbackEl = $('#learn-feedback');
  const iconEl = $('#feedback-icon');
  setIcon(iconEl, correct ? 'check' : 'cross');
  const header = $('#feedback-header');
  header.className = `answer-msg ${correct ? 'correct' : 'wrong'}`;

  const selectedBtn = [...buttons].find((btn, i) => q.options[i].id === selected);

  if (correct) {
    header.textContent = getWinMessage(progress.streak, learnMode);
    const subEl = $('#feedback-sub');
    if (subEl) {
      subEl.textContent = getWinSubline(progress.streak, learnMode);
      subEl.hidden = false;
    }
    celebrateCorrect({
      streak: progress.streak,
      learnMode,
      originEl: selectedBtn,
      cardEl: $('#learn-card'),
      feedbackEl,
      iconEl,
    });
  } else {
    header.textContent = `Not this time — it's ${q.correct}`;
    const subEl = $('#feedback-sub');
    if (subEl) subEl.hidden = true;
    feedbackEl.classList.remove('correct-win', 'correct-win-big');
    $('#learn-card').classList.add('shake');
    setTimeout(() => $('#learn-card').classList.remove('shake'), 400);
  }

  feedbackEl.hidden = false;

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
    showToast('All wrong questions cleared!', 'win');
    fireConfetti('mega');
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

/* ─── EXAM SETS ─── */
const EXAM_PRACTICE_ORDER = [
  'Continual Improvement',
  'Change Management',
  'Incident Management',
  'Problem Management',
  'Service Request Management',
  'Service Desk',
  'Service Level Management',
];

function getExamSetRecord(setId) {
  if (!progress.examSetStats) progress.examSetStats = {};
  if (!progress.examSetStats[setId]) {
    progress.examSetStats[setId] = { taken: 0, passed: 0, best: 0 };
  }
  return progress.examSetStats[setId];
}

function recordExamSetResult(setId, score, total) {
  const stat = getExamSetRecord(setId);
  stat.taken++;
  if (score > stat.best) stat.best = score;
  if (score >= Math.ceil(total * 0.65)) stat.passed++;
  saveProgress(progress);
}

function openExamSetIntro(examSet) {
  activeExamSet = examSet;
  updateExamIntroDisplay();
  showScreen('screen-exam-intro');
}

function renderExamSets() {
  const list = $('#exam-set-list');
  if (!list) return;
  list.innerHTML = '';

  const ordered = EXAM_PRACTICE_ORDER
    .map(practice => examSets.find(s => s.practice === practice))
    .filter(Boolean);

  ordered.forEach(examSet => {
    const stat = getExamSetRecord(examSet.id);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'exam-set-item';
    item.innerHTML = `
      <span class="exam-set-item-body">
        <span class="exam-set-item-title">${examSet.title}</span>
      </span>
      <span class="exam-set-item-meta">
        ${stat.passed ? '<span class="exam-set-item-passed">Passed</span>' : ''}
        <span class="exam-set-item-count">${examSet.questionIds.length} Q</span>
      </span>
    `;
    item.onclick = () => openExamSetIntro(examSet);
    list.appendChild(item);
  });
}

/* ─── EXAM ─── */
function startExam() {
  if (activeExamSet) {
    const pool = activeExamSet.questionIds
      .map(id => questions.find(q => q.id === id))
      .filter(Boolean);
    if (!pool.length) {
      showToast('Could not load this exam set');
      return;
    }
    examQuestions = pool;
  } else {
    const pool = getFilteredQuestions();
    const examCount = Math.min(15, pool.length);
    if (!examCount) {
      showToast(progress.topicFilter
        ? `No questions in "${progress.topicFilter}"`
        : 'No questions available');
      return;
    }
    examQuestions = pickExamQuestions(pool, examCount);
  }
  examAnswers = {};
  examIndex = 0;
  examAnswered = false;
  if (examSetFinishTimer) clearTimeout(examSetFinishTimer);
  examSetFinishTimer = null;
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

function isExamSetMode() {
  return !!activeExamSet;
}

function renderExamQuestion() {
  const q = examQuestions[examIndex];
  const isSetMode = isExamSetMode();
  const selected = examAnswers[q.id];
  examAnswered = isSetMode && !!selected;

  $('#exam-progress').textContent = `${examIndex + 1} / ${examQuestions.length}`;
  $('#exam-qnum').textContent = `Question ${q.id}`;
  $('#exam-question').textContent = q.question;

  const feedback = $('#exam-feedback');
  const setNextBtn = $('#btn-exam-set-next');
  const examNav = $('#exam-nav');
  if (feedback) feedback.hidden = !examAnswered;
  if (setNextBtn) setNextBtn.hidden = true;
  if (examNav) examNav.hidden = isSetMode;

  const container = $('#exam-options');
  container.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    let cls = 'option-btn';
    if (isSetMode && examAnswered) {
      if (opt.id === q.correct) cls += ' correct';
      else if (opt.id === selected && selected !== q.correct) cls += ' wrong';
    } else if (selected === opt.id) {
      cls += ' selected';
    }
    btn.className = cls;
    btn.disabled = isSetMode && examAnswered;
    btn.innerHTML = `<span class="option-letter">${opt.id}</span><span>${opt.text}</span>`;
    btn.onclick = () => {
      if (isSetMode) handleExamSetAnswer(q, opt.id);
      else {
        examAnswers[q.id] = opt.id;
        renderExamQuestion();
      }
    };
    container.appendChild(btn);
  });

  if (isSetMode && examAnswered) {
    showExamSetFeedback(q, selected);
    const isLast = examIndex === examQuestions.length - 1;
    if (!isLast && setNextBtn) setNextBtn.hidden = false;
  } else if (feedback) {
    const expl = $('#exam-explanation');
    if (expl) expl.hidden = true;
  }

  if (!isSetMode) {
    $('#btn-exam-prev').disabled = examIndex === 0;
    const isLast = examIndex === examQuestions.length - 1;
    $('#btn-exam-next').hidden = isLast;
    $('#btn-exam-finish').hidden = !isLast;
  }
}

function showExamSetFeedback(q, selected) {
  const correct = selected === q.correct;
  const correctOpt = q.options.find(o => o.id === q.correct);
  const feedback = $('#exam-feedback');
  const iconEl = $('#exam-feedback-icon');
  const header = $('#exam-feedback-header');
  const explEl = $('#exam-explanation');

  setIcon(iconEl, correct ? 'check' : 'cross');
  header.className = `answer-msg ${correct ? 'correct' : 'wrong'}`;
  header.textContent = correct
    ? `Correct — ${q.correct}) ${correctOpt.text}`
    : `Answer: ${q.correct}) ${correctOpt.text}`;

  if (explEl) {
    if (q.explanation) {
      explEl.innerHTML = q.explanation;
      explEl.hidden = false;
    } else {
      explEl.innerHTML = '';
      explEl.hidden = true;
    }
  }

  if (feedback) feedback.hidden = false;

  if (!correct) {
    $('#exam-card')?.classList.add('shake');
    setTimeout(() => $('#exam-card')?.classList.remove('shake'), 400);
  }
}

function handleExamSetAnswer(q, selected) {
  if (examAnswered) return;
  examAnswered = true;
  examAnswers[q.id] = selected;
  const correct = selected === q.correct;
  recordAnswer(progress, q.id, correct, q.topic);

  renderExamQuestion();

  const isLast = examIndex === examQuestions.length - 1;
  if (isLast) {
    examSetFinishTimer = setTimeout(() => finishExam(), 1400);
  }
}

function navigateExam(dir) {
  examIndex = Math.max(0, Math.min(examQuestions.length - 1, examIndex + dir));
  renderExamQuestion();
}

function finishExam() {
  if (examSetFinishTimer) {
    clearTimeout(examSetFinishTimer);
    examSetFinishTimer = null;
  }

  const isSetMode = isExamSetMode();
  const unanswered = examQuestions.filter(q => !examAnswers[q.id]);
  if (!isSetMode && unanswered.length && !confirm(`You skipped ${unanswered.length}. Finish anyway?`)) return;

  clearInterval(examTimerInterval);
  let score = 0;
  const review = [];

  examQuestions.forEach(q => {
    const userAns = examAnswers[q.id] || '—';
    const correct = userAns === q.correct;
    if (correct) score++;
    review.push({ q, userAns, correct });
    if (!isSetMode) recordAnswer(progress, q.id, correct, q.topic);
  });

  progress.examsTaken++;
  const result = gradeExam(score, examQuestions.length);
  if (result.pass) progress.examsPassed++;
  if (activeExamSet) recordExamSetResult(activeExamSet.id, score, examQuestions.length);
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
  if (isSetMode) {
    $('#results-subtitle').textContent = result.pass
      ? `Passed — ${score} out of ${examQuestions.length}`
      : `${score} out of ${examQuestions.length} — need ${passScore} to pass`;
  } else {
    $('#results-subtitle').textContent = result.pass
      ? `You passed! Finished in ${m}m ${s}s.`
      : `Keep practicing — you need ${passScore} to pass.`;
  }

  const reviewEl = $('#results-review');
  reviewEl.innerHTML = '';
  reviewEl.hidden = isSetMode;

  const wrongItems = review.filter(r => !r.correct);

  if (!isSetMode) {
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
  }

  const practiceWrongBtn = $('#btn-results-practice-wrong');
  if (practiceWrongBtn) practiceWrongBtn.hidden = isSetMode || wrongItems.length === 0;

  const retryBtn = $('#btn-exam-retry');
  if (retryBtn) retryBtn.textContent = isSetMode ? 'Try this set again' : 'Try again';

  const setBackBtn = $('#btn-exam-set-back');
  if (setBackBtn) setBackBtn.hidden = !isSetMode;

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