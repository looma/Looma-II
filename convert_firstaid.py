#!/usr/bin/env python3
"""
Convert firstaid-source.json (nested {en,np}, authored combined) -> firstaid-seed.json
(flat _en/_np, the shape the Looma module reads).

Also SPLITS two combined authoring topics into four live topics:
  - spinal-injury (Head, neck and back) -> head-injury  +  spinal-injury (Neck and back)
  - heat-and-cold (Heatstroke and hypothermia) -> heatstroke  +  hypothermia
Learn/emergency/never/quiz content is distributed automatically, so you can keep
editing the combined topics in the source and the split re-happens on every reload.
Derived pieces (head-injury emergency/never/quiz, hypothermia quiz, heatstroke extra
never) are marked in source_citation for the medical reviewer.
"""
import json, sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(ROOT, 'firstaid-source.json')))

def pair(o, b):
    return {f'{b}_en': o.get('en', ''), f'{b}_np': o.get('np', '')}

def conv_emergency(lst):
    return [{**pair(e['action'], 'action'), 'illustration': e.get('illustration', '')} for e in lst]
def conv_never(lst):
    return [{'text_en': n.get('en', ''), 'text_np': n.get('np', '')} for n in lst]
def conv_learn(lst):
    return [{**pair(c['action'], 'action'), **pair(c['why'], 'why'), **pair(c['tip'], 'tip'),
             'illustration': c.get('illustration', '')} for c in lst]
def conv_quiz(lst):
    return [{**pair(q['question'], 'question'),
             'options': [{'text_en': o['text'].get('en', ''), 'text_np': o['text'].get('np', ''),
                          'isCorrect': bool(o.get('isCorrect'))} for o in q.get('options', [])],
             **pair(q['feedback'], 'feedback')} for q in lst]

def base(t, **over):
    d = {'ft': 'firstaid', 'id': t['id'], 'order': t['order'], 'status': 'draft',
         **pair(t['title'], 'title'), 'illustration': t.get('illustration', ''),
         'source_citation': t.get('source_citation', ''),
         'emergency_heading_en': 'What to do now', 'emergency_heading_np': 'अहिले के गर्ने',
         'emergency': conv_emergency(t.get('emergency', [])),
         'never': conv_never(t.get('never', [])),
         'learn': conv_learn(t.get('learn', [])),
         'quiz': conv_quiz(t.get('quiz', []))}
    d.update(over)
    return d

# ---- derived pieces for the split halves that the source doesn't provide ----
HEAD_EMERGENCY = [
    {'action_en': "After a knock to the head, sit or lie the person down, keep them still, and watch them closely.", 'action_np': "टाउकोमा चोट लागेपछि, व्यक्तिलाई बसाल्नुहोस् वा सुताउनुहोस्, स्थिर राख्नुहोस्, र नजिकबाट हेरिरहनुहोस्।", 'illustration': 'person sat down after a head knock'},
    {'action_en': "Watch for danger signs in the hours after: confusion, repeated vomiting, unequal pupils, clear fluid from the nose or ears, a fit, or increasing drowsiness.", 'action_np': "त्यसपछिका घण्टाहरूमा खतराका संकेत हेर्नुहोस्: अलमल, बारम्बार बान्ता, आँखाका नानी असमान हुनु, नाक वा कानबाट सफा तरल बग्नु, कम्पन (फिट), वा बढ्दो निद्रालुपन।", 'illustration': 'checking pupils and alertness'},
    {'action_en': "Anyone knocked unconscious even briefly, or showing any danger sign, must see a doctor urgently.", 'action_np': "छोटो समयका लागि भए पनि बेहोस भएको, वा कुनै खतराको संकेत देखिने जोसुकैले तुरुन्त डाक्टरलाई देखाउनैपर्छ।", 'illustration': 'person taken to a doctor'},
    {'action_en': "If they become unresponsive but are breathing, lay them on their side (recovery position) and watch their breathing.", 'action_np': "उनी बेहोस भए तर सास फेरिरहेका छन् भने, छेउ फर्काएर सुताउनुहोस् (रिकभरी पोजिसन) र सास फेराइ हेरिरहनुहोस्।", 'illustration': 'person on their side, recovery position'},
]
HEAD_NEVER = [
    {'text_en': "Do NOT let someone who was knocked out 'sleep it off' without being checked by a doctor.", 'text_np': "बेहोस भएको व्यक्तिलाई डाक्टरले जाँच नगरी 'सुतेर सन्चो हुन' नदिनुहोस्।"},
    {'text_en': "Do NOT give alcohol after a head injury — it can hide worsening symptoms.", 'text_np': "टाउकोमा चोट लागेपछि रक्सी नदिनुहोस् — यसले बिग्रँदै गएका लक्षण लुकाउन सक्छ।"},
    {'text_en': "Do NOT assume a person is fine just because they got up and walked — bleeding in the brain can appear hours later.", 'text_np': "व्यक्ति उठेर हिँडेकै भरमा ठीक छ भनी नठान्नुहोस् — मस्तिष्कमा रक्तस्राव केही घण्टापछि देखिन सक्छ।"},
]
HEAD_QUIZ = [{'question_en': "After a fall, a person was knocked out for a moment but now seems fine. What should you do?", 'question_np': "लडेपछि, व्यक्ति क्षणभर बेहोस भए तर अहिले ठीक देखिन्छन्। तपाईंले के गर्नुपर्छ?",
    'options': [{'text_en': "Have them checked by a doctor and watch for danger signs", 'text_np': "डाक्टरलाई जँचाउनुहोस् र खतराका संकेत हेरिरहनुहोस्", 'isCorrect': True},
                {'text_en': "Let them rest and assume it's fine", 'text_np': "आराम गर्न दिनुहोस् र ठीकै छ भनी ठान्नुहोस्", 'isCorrect': False}],
    'feedback_en': "Even a brief loss of consciousness needs medical review — dangerous bleeding in the brain can develop hours later.", 'feedback_np': "छोटो बेहोसीलाई पनि चिकित्सा जाँच चाहिन्छ — मस्तिष्कको खतरनाक रक्तस्राव केही घण्टापछि विकसित हुन सक्छ।"}]
HYPO_QUIZ = [{'question_en': "Someone is pulled from cold water, shivering and confused. How should you warm them?", 'question_np': "कसैलाई चिसो पानीबाट निकालियो, काम्दै र अलमलमा छन्। तपाईंले उनलाई कसरी न्यानो बनाउनुपर्छ?",
    'options': [{'text_en': "Remove wet clothes, wrap them warmly, and warm them gradually", 'text_np': "भिजेको लुगा हटाउनुहोस्, न्यानोसँग बेर्नुहोस्, र बिस्तारै न्यानो बनाउनुहोस्", 'isCorrect': True},
                {'text_en': "Rub their limbs hard and warm them as fast as possible", 'text_np': "उनका हातखुट्टा जोडले मल्नुहोस् र सकेसम्म छिटो न्यानो बनाउनुहोस्", 'isCorrect': False}],
    'feedback_en': "Warm gently and gradually — rough handling or fast rewarming can trigger a dangerous heart rhythm.", 'feedback_np': "बिस्तारै र क्रमशः न्यानो बनाउनुहोस् — नराम्रो सम्हालाइ वा छिटो न्यानो बनाउँदा खतरनाक मुटुको धड्कन निम्त्याउन सक्छ।"}]
HEAT_EXTRA_NEVER = {'text_en': "Do NOT give alcohol or caffeine — they worsen dehydration.", 'text_np': "रक्सी वा क्याफिन नदिनुहोस् — यसले शरीरमा पानीको कमी अझ बिगार्छ।"}

def split_spinal(t):
    """Head, neck and back -> head-injury (7) + spinal-injury/Neck & back (8)."""
    learn = conv_learn(t.get('learn', []))
    head_learn = [c for c in learn if 'concussion' in c['action_en'].lower() or 'head injury' in c['action_en'].lower()]
    neck_learn = [c for c in learn if c not in head_learn]
    head = {'ft': 'firstaid', 'id': 'head-injury', 'order': 7, 'status': 'draft',
        'title_en': 'Head injury', 'title_np': 'टाउकोको चोट',
        'illustration': 'checking a dazed person after a head knock',
        'source_citation': "IFRC Guidelines 2025 'Head injury and concussion'; WHO / Red Cross concussion guidance. NOTE: emergency steps, 'never' items and quiz here are derived from the danger-sign guidance in the combined source topic — medical reviewer to confirm.",
        'emergency_heading_en': 'What to do now', 'emergency_heading_np': 'अहिले के गर्ने',
        'emergency': HEAD_EMERGENCY, 'never': HEAD_NEVER, 'learn': head_learn, 'quiz': HEAD_QUIZ}
    neck = base(t, id='spinal-injury', order=8, title_en='Neck and back injury', title_np='घाँटी र ढाडको चोट',
        source_citation="IFRC Guidelines 2025 'Spinal injury'; ILCOR/ANZCOR spinal guidance (manual head support, avoid rigid collars by lay providers).",
        learn=neck_learn)
    return [head, neck]

def split_heat(t):
    """Heatstroke and hypothermia -> heatstroke (11) + hypothermia (12)."""
    em = conv_emergency(t.get('emergency', []))
    def strip(pfx, s): return s[len(pfx):].strip() if s.startswith(pfx) else s
    heat_em, cold_em = [], []
    for e in em:
        a = e['action_en']
        if a.startswith('HEATSTROKE'):
            heat_em.append({**e, 'action_en': strip('HEATSTROKE —', a)})
        elif a.startswith('HYPOTHERMIA'):
            cold_em.append({**e, 'action_en': strip('HYPOTHERMIA —', a)})
        else:
            heat_em.append(e)
    nev = conv_never(t.get('never', []))
    heat_nev = [n for n in nev if 'heatstroke' in n['text_en'].lower()] + [HEAT_EXTRA_NEVER]
    cold_nev = [n for n in nev if 'heatstroke' not in n['text_en'].lower()]
    learn = conv_learn(t.get('learn', []))
    heat_learn = learn[:3]   # heat-exhaustion, cool rapidly, fluids
    cold_learn = learn[3:]   # recognise hypothermia, warm gradually, what makes both worse
    heat = {'ft': 'firstaid', 'id': 'heatstroke', 'order': 11, 'status': 'draft',
        'title_en': 'Heatstroke', 'title_np': 'लू लाग्नु', 'illustration': 'person collapsing under a hot sun',
        'source_citation': "IFRC Guidelines 2025 'Hyperthermia'; WHO heat-health guidance; ILCOR cooling guidance (rapid cooling for heatstroke). NOTE: one 'never' (alcohol/caffeine) is derived — reviewer to confirm.",
        'emergency_heading_en': 'What to do now', 'emergency_heading_np': 'अहिले के गर्ने',
        'emergency': heat_em, 'never': heat_nev, 'learn': heat_learn, 'quiz': conv_quiz(t.get('quiz', []))}
    cold = {'ft': 'firstaid', 'id': 'hypothermia', 'order': 12, 'status': 'draft',
        'title_en': 'Hypothermia', 'title_np': 'हाइपोथर्मिया', 'illustration': 'person shivering by a snowy mountain',
        'source_citation': "IFRC Guidelines 2025 'Hypothermia'; WHO cold-health guidance. NOTE: the quiz here is derived from the topic's own guidance — reviewer to confirm.",
        'emergency_heading_en': 'What to do now', 'emergency_heading_np': 'अहिले के गर्ने',
        'emergency': cold_em, 'never': cold_nev, 'learn': cold_learn, 'quiz': HYPO_QUIZ}
    return [heat, cold]

# ---- build output, applying splits and renumbering ----
out = []
for t in src['topics']:
    if t['id'] == 'spinal-injury':
        out += split_spinal(t)
    elif t['id'] == 'heat-and-cold':
        out += split_heat(t)
    elif t['id'] == 'road-traffic-injury':
        out.append(base(t, order=9))
    elif t['id'] == 'poisoning':
        out.append(base(t, order=10))
    else:
        out.append(base(t))
out.sort(key=lambda d: d['order'])

gc = src['getCare']
# Nepali for the get-care config. Phone labels keyed by English so the order in
# firstaid-source.json can change without breaking the mapping.
GET_CARE_MSG_NP = ("सर्पदंश, धेरै रक्तस्राव, गम्भीर पोलाइ, वा सास फेर्न गाह्रो भइरहेको व्यक्ति — "
    "यी समयसँगको दौड हुन्। सुरक्षित तरिकाले सकेसम्म छिटो नजिकको स्वास्थ्य चौकी वा अस्पताल पुग्नुहोस्। "
    "छिटो उपचार पाउनु नै तपाईंले गर्न सक्ने सबैभन्दा महत्त्वपूर्ण काम हो — कुनै घरेलु उपचारले यसको ठाउँ लिन सक्दैन।")
LABEL_NP = {
    'Ambulance': 'एम्बुलेन्स',
    'Nepal Police / emergency': 'नेपाल प्रहरी / आपतकालीन',
    'Nepal Red Cross Society (HQ)': 'नेपाल रेडक्रस सोसाइटी (मुख्यालय)',
    'Poison Information (TU Teaching Hospital)': 'विष जानकारी (त्रिवि शिक्षण अस्पताल)',
}
LOCAL_CONTACT_HINT_NP = ("स्थानीय सम्पर्क — आफ्नो गाउँका लागि भर्नुहोस्: जस्तै तपाईंको नजिकको स्वास्थ्य चौकी, "
    "वा स्थानीय महिला सामुदायिक स्वास्थ्य स्वयंसेविका (FCHV)। सञ्चालन गर्ने विद्यालय/समुदायले यो भर्छ।")
config = {'ft': 'firstaid-config', 'id': 'firstaid-config',
    'get_care_message_en': gc.get('message', ''), 'get_care_message_np': GET_CARE_MSG_NP,
    'numbers': [{'label_en': n['label'], 'label_np': LABEL_NP.get(n['label'], ''), 'number': n['number']} for n in gc.get('numbers', [])],
    'local_contact_label_en': 'LOCAL contact — fill in for your village', 'local_contact_label_np': 'स्थानीय सम्पर्क — आफ्नो गाउँका लागि भर्नुहोस्',
    'local_contact_hint_en': gc.get('localContactPrompt', ''), 'local_contact_hint_np': LOCAL_CONTACT_HINT_NP, 'local_contact': ''}

seed = {'_comment': 'Generated by convert_firstaid.py from firstaid-source.json (splits applied). DRAFT, pending medical sign-off. Nepali is a first-pass translation pending native-speaker review.',
        'config': config, 'topics': out}
json.dump(seed, open(os.path.join(ROOT, 'firstaid-seed.json'), 'w'), ensure_ascii=False, indent=2)

print(f'topics: {len(out)}')
for t in out:
    print(f"  {t['order']:>2} {t['id']:<20} steps={len(t['emergency'])} never={len(t['never'])} learn={len(t['learn'])} quiz={len(t['quiz'])}")
