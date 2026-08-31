# First Aid — content template (one per topic/activity)

Fill this in **per topic** (Snakebite, Burns, Choking, …). Give it to whoever sources
the content. Every user-facing string needs **English + Nepali (draft is fine, marked
for native-speaker review)**. All medical content must be traceable to a credible source
(WHO / IFRC / Nepal Red Cross) and reviewed by a qualified medical professional before real use.

Legend: `_en` = English, `_np` = Nepali. Lists can have as many items as you want.

---

## 1. Topic basics
| Field | What to write | Example |
|---|---|---|
| `id` | short lowercase slug, no spaces (permanent key) | `burns` |
| `title_en` / `title_np` | the topic name | `Burns` / `पोल्नु` |
| `order` | number for grid position (lower = earlier) | `4` |
| `illustration` | description of the topic-card picture (Hesperian slot) | `cool water running over burned hand` |
| `source_citation` | where the info comes from | `WHO burns first-aid guidance` |

## 2. Emergency view — the "do this now" steps
- `emergency_heading_en` / `emergency_heading_np` — usually **"What to do now" / "अहिले के गर्ने"**
- `emergency[]` — an **ordered list of actions**. One clear action per step. Each step:
  - `action_en` / `action_np` — the action. Tip: first sentence = the command, second sentence = the short "why/how" (the UI shows the 2nd sentence as muted supporting text).
  - `illustration` — description of that step's picture.

## 3. Emergency view — the "never do these"
- `never[]` — the **dangerous mistakes** (kept separate from the steps on purpose). Each:
  - `text_en` / `text_np` — one short "do NOT…" line.

## 4. Learn view — teaching cards
- `learn[]` — an **ordered list of teaching cards** (calmer, more depth, one idea per card). Each:
  - `action_en` / `action_np` — the step/idea (card heading)
  - `why_en` / `why_np` — **why it works** (a sentence or two of readable explanation)
  - `tip_en` / `tip_np` — a short **"remember this"** takeaway
  - `illustration` — description of the card's picture

## 5. Learn view — quiz (self-check at the end)
- `quiz[]` — **1–3 multiple-choice questions**. Each:
  - `question_en` / `question_np` — the question
  - `options[]` — 2–4 answer choices. Each:
    - `text_en` / `text_np` — the answer text
    - `isCorrect` — `true` for the right answer, `false` for the rest (usually exactly one `true`)
  - `feedback_en` / `feedback_np` — one line explaining the right answer (shown after they answer)

---

## Not per-topic (fill ONCE, shared by every topic): "Get care"
The emergency numbers + hospital message live in a **single shared config**, so you do **not**
collect these per topic:
- `get_care_message_en` / `get_care_message_np` — the "go to a hospital fast" line
- `numbers[]` — reference numbers, each: `label_en` / `label_np` / `number`
- (a local health-post / FCHV contact field exists in the data but is currently hidden)

---

## Copy-paste JSON (duplicate this block per topic)
Paste completed topics into `firstaid-seed.json` under `"topics"`, then an admin runs
`looma-firstaid-seed.php` to load them. Delete the `NP-DRAFT` notes when translations are reviewed.

```json
{
  "ft": "firstaid",
  "id": "REPLACE-slug",
  "order": 0,
  "status": "draft",
  "title_en": "",
  "title_np": "",
  "illustration": "describe the topic-card picture",
  "source_citation": "WHO / IFRC / Nepal Red Cross — pending medical review",

  "emergency_heading_en": "What to do now",
  "emergency_heading_np": "अहिले के गर्ने",
  "emergency": [
    { "action_en": "", "action_np": "", "illustration": "" }
  ],

  "never": [
    { "text_en": "", "text_np": "" }
  ],

  "learn": [
    { "action_en": "", "action_np": "", "why_en": "", "why_np": "", "tip_en": "", "tip_np": "", "illustration": "" }
  ],

  "quiz": [
    {
      "question_en": "", "question_np": "",
      "options": [
        { "text_en": "", "text_np": "", "isCorrect": true },
        { "text_en": "", "text_np": "", "isCorrect": false }
      ],
      "feedback_en": "", "feedback_np": ""
    }
  ]
}
```
