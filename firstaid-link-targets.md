# First Aid ↔ Library material — link targets

Goal: on existing library materials, link the matching **First Aid tab** lesson (`firstaid`
collection topic) as a resource.

Source of truth for this list: `looma shell scripts/data files/activities.json` (dump — live
MongoDB was not running when this was compiled). Each target below gives the material's display
name, file type, Mongo `_id`, and chapter id(s) so it can be located in the live DB.

First Aid topics (firstaid `id`): `snakebite`, `severe-bleeding`, `burns`, `choking`, `drowning`,
`fractures`, `head-injury`, `spinal-injury`, `road-traffic-injury`, `poisoning`, `heatstroke`,
`hypothermia`.

**Honest coverage note:** materials strictly under the **Health (H) subject** are health-education
/ biology (HIV, body systems, nutrition, hygiene), NOT emergency response. The best first-aid
overlaps come from Science / Social Studies chapters and the **Hesperian guides**
(Where There Is No Doctor / Disabled Village Children / A Book for Midwives). Tier reflects how
directly the material maps to the first-aid topic.

Legend: **A** = strong/topic-for-topic · **B** = reasonable/conceptual · **C** = loose/thematic.

---

## By First Aid topic

### burns  ← good coverage
- **A** `First Aid for a Burn` — mp4 — `_id 5f2218695c9304f25c313401` — ch `7SS02.04`
- **A** `Burns And Burn Deformities` — pdf (Hesperian) — `_id 5dddd31fd5ea4f83745141cb` — ch none

### poisoning  ← good
- **A** `Pesticides Are Poison` — pdf (Hesperian) — `_id 5dd9c1a9d5ea4f8374514148` — ch none

### spinal-injury (Neck and back injury)  ← good
- **A** `Spinal Cord Injury` — pdf (Hesperian) — `_id 5dddd31fd5ea4f83745141c6` — ch none
- **B** `Cervical Spine Protection in Airway Management` — mp4 — `_id 58ffbe36cc33e6f897d63b91` — ch none
      (also touches choking/airway; note the video's own "not a substitute for formal training" caveat)

### head-injury  ← ok
- **A** `What Is A Concussion` — mp4 — `_id 5aa46f88a003a90704855605` — ch `5S02.09`

### road-traffic-injury  ← good (safety/prevention angle)
- **A** `2S02.08 Let's Avoid Accidents` — lesson — `_id 5d13b1255c9304f25c30eb59` — ch `2S02.08`
- **A** `(4S02.10) Safety against accident` — lesson — `_id 608f29585c9304f25c31495c` — ch `4S02.10`
- **B** `4SS04.06 Traffic Rules` — lesson — `_id 5f1f21945c9304f25c313207` — ch `4SS04.06`
- **B** `Traffic Signs and Rules for Kids` — mp4 — `_id 5f1f2f435c9304f25c313227` — ch `4SS04.06`

### severe-bleeding  ← conceptual
- **B** `Circulatory System` — EP — `_id 5c7472d6cd55f229e3ac585c` — ch `8H01.01`  *(under Health)*
- **B** `A Book for Midwives` — book — `_id 5de8407e5c9304f25c311b0b` — ch `6H01.02, 7H01.02, 8H01.02…`
      *(under Health; postpartum hemorrhage; also relevant to choking = newborn airway)*

### fractures  ← loose (bone health, not fracture first aid)
- **C** `Bone Infections` — pdf (Hesperian) — `_id 5dddd31fd5ea4f83745141c2` — ch none
- **C** `Small Or Weak-boned Children` — pdf (Hesperian) — `_id 5dddd31fd5ea4f83745141bc` — ch none

### choking  ← loose
- **C** `A Book for Midwives` (newborn resuscitation/airway) — see severe-bleeding entry
- **C** `Cervical Spine Protection in Airway Management` — see spinal-injury entry

### snakebite  ← topical only (biology, no first-aid content)
- **C** snake images / `Mongoose Versus Cobra` etc. — skip unless you want a thematic cross-link.

### drowning / heatstroke / hypothermia  ← NO existing material found
- Nothing in the library maps to these. If you want them linked, they'd need new content.

---

## General first-aid "hubs" (link the whole First Aid tab, not one topic)
- `First Aid Kit` — jpg — `_id 5723cdfa3bfb5a7a58a578fd` — ch `5S02.10`
- `4S02.11 First Aid` — lesson — `_id 5f1e53cb5c9304f25c3131bf` — ch `4S02.11`
- `First Aid` — pdf (Hesperian) — Medicine ▸ Healthcare — (browse via looma-book.php)
- `6H01.01 Human Body` — lesson — `_id 5d03ee9f5c9304f25c30e212` — ch `6H01.01`  *(under Health; general body hub)*
- `Common Health Problems` — pdf (Hesperian) — `_id 5ec444d85c9304f25c311c28` — ch `6H01.04…`  *(under Health; covers many emergencies)*

---

## Recommended first pass (highest confidence, clean 1:1)
1. `First Aid for a Burn`            → **burns**
2. `Burns And Burn Deformities`      → **burns**
3. `Pesticides Are Poison`           → **poisoning**
4. `Spinal Cord Injury`              → **spinal-injury**
5. `What Is A Concussion`            → **head-injury**
6. `Let's Avoid Accidents`           → **road-traffic-injury**
7. `Safety against accident`         → **road-traffic-injury**

Open question for the wiring step: where does a "resource link" live — a field on the library
material (activities/lessons doc), a field on the firstaid topic doc, or a separate mapping? TBD.
