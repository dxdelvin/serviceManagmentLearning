const STORAGE_KEY = 'itil4quest_progress';

const defaultProgress = () => ({
  xp: 0,
  coins: 0,
  streak: 0,
  bestStreak: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  examsTaken: 0,
  examsPassed: 0,
  questionStats: {},
  bookmarks: [],
  badges: [],
  learnIndex: 0,
  learnOrder: [],
  topicFilter: null,
  wrongIds: [],
  wrongLearnIndex: 0,
});

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const progress = { ...defaultProgress(), ...JSON.parse(raw) };
    if (!Array.isArray(progress.wrongIds)) progress.wrongIds = [];
    return progress;
  } catch {
    return defaultProgress();
  }
}

function migrateWrongIds(progress, questions) {
  if (progress.wrongIds.length) return;
  for (const q of questions) {
    const stat = progress.questionStats[q.id];
    if (stat && stat.attempts > 0 && stat.correct === 0 && !progress.wrongIds.includes(q.id)) {
      progress.wrongIds.push(q.id);
    }
  }
  if (progress.wrongIds.length) saveProgress(progress);
}

function getWrongQuestions(progress, questions, topicFilter = null) {
  const ids = new Set(progress.wrongIds);
  let pool = questions.filter(q => ids.has(q.id));
  if (topicFilter) pool = pool.filter(q => q.topic === topicFilter);
  return pool;
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function recordAnswer(progress, questionId, correct, topic) {
  if (!progress.questionStats[questionId]) {
    progress.questionStats[questionId] = { attempts: 0, correct: 0, topic };
  }
  const stat = progress.questionStats[questionId];
  stat.attempts++;
  if (correct) stat.correct++;
  progress.totalAnswered++;
  if (correct) {
    progress.totalCorrect++;
    progress.streak++;
    if (progress.streak > progress.bestStreak) progress.bestStreak = progress.streak;
  } else {
    progress.streak = 0;
    if (!progress.wrongIds.includes(questionId)) {
      progress.wrongIds.push(questionId);
    }
  }
  if (correct) {
    progress.wrongIds = progress.wrongIds.filter(id => id !== questionId);
  }
  saveProgress(progress);
}

function getMasteredCount(progress) {
  return Object.values(progress.questionStats).filter(s => s.correct >= 2).length;
}

function getAccuracy(progress) {
  if (progress.totalAnswered === 0) return null;
  return Math.round((progress.totalCorrect / progress.totalAnswered) * 100);
}

function getTopicStats(progress, questions) {
  const topics = {};
  for (const q of questions) {
    const t = q.topic || 'General ITIL';
    if (!topics[t]) topics[t] = { total: 0, correct: 0, attempted: 0 };
    topics[t].total++;
    const stat = progress.questionStats[q.id];
    if (stat) {
      topics[t].attempted++;
      topics[t].correct += stat.correct;
    }
  }
  return topics;
}