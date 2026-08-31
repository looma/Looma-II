# Branching-Scenario Authoring Guide (Looma First Aid)

This is the format for writing a **branching decision scenario** — the "Practice" game
that appears inside a first-aid topic (Emergency · Learn · **Practice**). A scenario is
pure data: a tree of decision points. You never touch code — you fill in this shape and
hand it back.

One scenario = one topic (snakebite, burns, choking, …). The scenario is built **from the
existing lesson** for that topic, so the decisions match the Emergency/Learn content.

---

## 1. The overall shape

```js
snakebite: {                          // <- key = the topic id (must match the lesson id)
  presentation_type: 'branching',
  ft: 'game',
  title: { en: 'Snakebite', np: '' }, // topic name, bilingual
  start: 'n0',                        // id of the first node
  nodes: {                            // every screen in the scenario, keyed by id
    'n0': { …node… },
    'n1': { …node… },
    'end_ok': { …ending… },
    …
  }
}
```

- **key** (`snakebite`) — must equal the topic's `id` in the `firstaid` collection.
- **title** — the topic name; shown at the top of the card. `np` = Nepali (leave `''` if not
  translated yet).
- **start** — which node the player sees first.
- **nodes** — a dictionary. Each entry is either a **decision node** or an **ending**.

---

## 2. A decision node

A situation the player faces, with 2–4 choices.

```js
'n0': {
  situation: {
    en: "You're walking in tall grass when a snake bites your friend's ankle. What do you do first?",
    np: ""                                   // Nepali translation (or "" for now)
  },
  image: "images/firstaid/xxxx.svg",         // OPTIONAL illustration (leave out if none)
  choices: [
    { label:   { en: "Move to a safe distance", np: "" },
      outcome: { en: "Right. Get clear so it can't strike again.", np: "" },
      correct: true,
      next: "n1" },
    { label:   { en: "Chase the snake to identify it", np: "" },
      outcome: { en: "Don't — that risks a second bite. Let's keep going.", np: "" },
      correct: false,
      next: "n1" }
  ]
}
```

**Node fields**
| field | required | meaning |
|---|---|---|
| `situation` | yes | The prompt, `{en, np}`. Ask a question. |
| `image` | no | Path to an illustration shown above the text. Omit if none. |
| `choices` | yes | 2 to 4 options (see below). |

**Choice fields**
| field | required | meaning |
|---|---|---|
| `label` | yes | Button text, `{en, np}`. |
| `outcome` | yes* | The feedback shown after the click, `{en, np}`. *See the three cases below.* |
| `correct` | yes | `true` = the right action; `false` = a wrong action. |
| `next` | yes | The id of the node to go to next. May point **backward** (loop) or to an ending. |

---

## 3. The three kinds of choice — THIS IS THE KEY PART

How a choice behaves is decided by **`correct`** + whether **`outcome`** has text:

1. **Correct choice** → `correct: true`, with an `outcome`.
   Shows a **green** panel with the "why", then a **Continue** button to `next`.

2. **Recoverable slip** → `correct: false`, **with** an `outcome`.
   A wrong-but-not-fatal action. Shows an **amber** correction panel explaining the mistake,
   then **Continue** to `next` (usually the same next step — the player recovers).

3. **Fatal mistake** → `correct: false`, with an **empty** `outcome` (`{ en: "", np: "" }`).
   The dangerous action. **Skips the feedback panel** and jumps straight to a **fatal ending
   node** (its explanation lives on that ending). Point `next` at an `end_dead_…` node.

So: put the explanation in the `outcome` for recoverable slips, but leave `outcome` **empty**
for fatal choices and let the ending node carry the "you didn't survive, here's why" message.

---

## 4. Endings

An ending is a node with `terminal: true` and no choices.

```js
'end_ok': {
  situation: { en: "You kept them calm, still, and got them to antivenom. Well done.", np: "" },
  terminal: true,
  choices: []
},
'end_dead_tourniquet': {
  situation: { en: "Your friend didn't survive. A tight tourniquet doesn't stop venom — it cuts off blood flow… Never tie anything tight around a snakebite. Start again.", np: "" },
  terminal: true,
  choices: []
}
```

- **Survival ending** → shows a **green** panel + a **Play again** button.
- **Fatal ending** → shows a **red** panel + a **Start again** button.

You do **not** label an ending green or red. The engine decides automatically:
an ending reached by any **correct or recoverable** choice is treated as **survival**;
an ending reached **only** by fatal (empty-outcome) choices is treated as **fatal**.

Write **one fatal ending per distinct fatal mistake**, each naming the specific error
(tourniquet, cutting the wound, etc.), and **one survival ending**.

---

## 5. Rules the scenario must follow (it's checked on import)

- `start` must be a real node id.
- Every `next` must point to a real node id.
- Every non-terminal node has **2–4 choices**; every terminal node has **`choices: []`**.
- No unreachable nodes (everything reachable from `start`).
- Every `situation`, `label`, and `outcome` has an `en` value. `np` may be `""` for now
  (Nepali is a later translation pass — leave it empty, don't guess).

Automatic, you don't set them:
- **"Step X of N"** counter — computed from the tree (distance from `start`).
- Ending colours (green/red) — from the rule in §4.

---

## 6. What NOT to do

- Don't give choice buttons any hint of right/wrong in the **label** — the player must reason.
- Don't invent Nepali. Leave `np: ""`; a native speaker fills it later.
- Don't write medical content that isn't in (or consistent with) the topic's lesson. The
  scenario should reinforce the lesson, and every scenario needs clinical sign-off, same as
  the lessons.

---

## 7. Full worked example — snakebite

The current live scenario, for reference. Structure: 5 correct-path decisions
(move to safety → keep calm/still → remove tight items → splint → carry to hospital),
2 fatal traps (tourniquet, cut-and-suck → their own death endings), and 3 recoverable
slips (chase snake, run, coffee → correction then continue).

```js
snakebite: {
  presentation_type: 'branching', ft: 'game',
  title: { en: 'Snakebite', np: '' },
  start: 'n0',
  nodes: {
    n0: {
      situation: { en: "You're walking in tall grass with a friend when a snake bites their ankle and slithers away. Your friend is scared and starting to panic. What do you do first?", np: '' },
      choices: [
        { label: { en: 'Move both of you a safe distance from where the snake went', np: '' },
          outcome: { en: "Right. Get clear so it can't strike again — then help safely.", np: '' },
          correct: true, next: 'n1' },
        { label: { en: 'Chase and kill the snake so doctors can identify it', np: '' },
          outcome: { en: "Don't — chasing it risks a second bite, and hospitals treat based on symptoms, not the snake. Let's keep going.", np: '' },
          correct: false, next: 'n1' }
      ]
    },
    n1: {
      situation: { en: "You're both safe now. Your friend is panicking and wants to run to the village for help. What do you tell them?", np: '' },
      choices: [
        { label: { en: "Stay calm and completely still — I'll bring help to you", np: '' },
          outcome: { en: 'Correct. Fear and movement pump venom faster. Staying calm and still is the single most important thing.', np: '' },
          correct: true, next: 'n2' },
        { label: { en: 'Run together to the village as fast as possible', np: '' },
          outcome: { en: "Running speeds venom through the body — but this isn't fatal on its own. Get them to stay still now. Let's continue.", np: '' },
          correct: false, next: 'n2' }
      ]
    },
    n2: {
      situation: { en: "Your friend is calm and sitting down. Their ankle is beginning to swell, and they're wearing an anklet and a tight sock on that leg. What now?", np: '' },
      choices: [
        { label: { en: 'Gently remove the anklet and loosen the sock before swelling traps them', np: '' },
          outcome: { en: 'Good. Remove tight items early — once swelling sets in they can cut off blood flow.', np: '' },
          correct: true, next: 'n3' },
        { label: { en: 'Tie a tight band above the bite to stop the venom spreading', np: '' },
          outcome: { en: '', np: '' },                       // empty -> fatal, jumps to death node
          correct: false, next: 'end_dead_tourniquet' }
      ]
    },
    n3: {
      situation: { en: 'The bitten leg needs to be kept still. How do you position and secure it?', np: '' },
      choices: [
        { label: { en: 'Keep the leg still at about heart level and splint it like a broken bone', np: '' },
          outcome: { en: 'Exactly right. A still limb at heart level slows the spread of venom.', np: '' },
          correct: true, next: 'n4' },
        { label: { en: 'Cut the bite open and suck the venom out', np: '' },
          outcome: { en: '', np: '' },                       // empty -> fatal
          correct: false, next: 'end_dead_cut' }
      ]
    },
    n4: {
      situation: { en: 'The limb is splinted. How does your friend get to the hospital with antivenom?', np: '' },
      choices: [
        { label: { en: "Carry them or arrange transport — don't let them walk", np: '' },
          outcome: { en: 'Correct. Get to antivenom fast, but keep them still — walking pumps venom. Carry them if you can.', np: '' },
          correct: true, next: 'end_ok' },
        { label: { en: 'Give them strong coffee to keep them alert on the walk', np: '' },
          outcome: { en: "No coffee, alcohol, or stimulants — and don't let them walk. Carry them. Let's get them there.", np: '' },
          correct: false, next: 'end_ok' }                   // recoverable: still ends OK
      ]
    },
    end_ok: {
      situation: { en: 'You kept your friend calm, still, and got them to antivenom quickly. This gives them the best possible chance. Well done.', np: '' },
      terminal: true, choices: []
    },
    end_dead_tourniquet: {
      situation: { en: "Your friend didn't survive. A tight tourniquet doesn't stop venom — it cuts off blood flow and can destroy the limb, and the delay cost their life. Never tie anything tight around a snakebite. Start again and try to save them.", np: '' },
      terminal: true, choices: []
    },
    end_dead_cut: {
      situation: { en: "Your friend didn't survive. Cutting and sucking the wound doesn't remove venom — it causes bleeding, infection, and wastes the time that antivenom needed. Never cut a snakebite. Start again and try to save them.", np: '' },
      terminal: true, choices: []
    }
  }
}
```

---

## 8. How a finished scenario gets added (dev step, not the author's)

1. Paste the scenario object into `js/looma-branching-sample.js`, keyed by the topic id.
2. Add that topic id to `$branchingTopics` in `looma-health-topic.php`.

The **Practice** tab then appears automatically on that topic, playing the scenario.
