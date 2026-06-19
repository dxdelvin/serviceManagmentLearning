# ITIL 4 Quest — Gamified MCQ Trainer

549 ITIL 4 Foundation practice questions with gamified Learn and Exam modes.

## Quick Start

```bash
cd quiz-app
python -m http.server 8080
```

Open http://localhost:8080

## Modes

- **Quest Mode** — Learn one question at a time with instant feedback, XP, streaks, and ITIL explanations
- **Boss Battle** — 15-question exam simulation; answers revealed at the end

## Features

- XP, levels, coins, streaks, 14 unlockable badges
- Topic filtering and progress tracking (localStorage)
- Confetti, toasts, and animated feedback
- Pre-generated ITIL 4 explanations for every question

## Data

Questions extracted from the attached PDF bank. Regenerate with:

```bash
python parse_questions.py
python generate_explanations.py
```