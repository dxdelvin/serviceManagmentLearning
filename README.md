# Service Management Quiz

549 ITIL 4 Foundation practice questions with Learn, Quiz, and Practice Wrong modes.

## GitHub Pages

Deploy from the repository root — `index.html` is at the top level. In your repo settings, set **Pages → Build and deployment → Deploy from branch** to `main` and folder `/ (root)`.

## Local dev

```bash
python -m http.server 8765
```

Open http://localhost:8765

## Regenerate question data

```bash
python parse_questions.py
python generate_explanations.py
```