"""Hand-run evaluation of the assistant's answers (/rag_query).

There is no test suite in this repo; this is the yardstick used when changing
app/rag/answer.py or retrieval. Each case is a question, the words a correct
answer must contain (every group must match; any word of a group will do), and
whether Looma's content can answer it at all. For the unanswerable ones the
only acceptable reply is "not found": any answer counts as hallucinated.

    python scripts/eval_answers.py http://127.0.0.1:8089            # all sets
    python scripts/eval_answers.py http://192.168.1.146:8089 en_new  # one set

Sets: en, ne (used while tuning the checks), en_new, ne_new (held out, written
afterwards). Read the answers, not only the score: a keyword can match a quote
that does not answer the question.
"""

import json
import sys
import time
import urllib.request

SETS = {
    'en': [
    ('What is photosynthesis?', [['food', 'glucose', 'starch'], ['sunlight', 'light']], True),
    ('Where is Mount Everest?', [['nepal', 'himalaya', 'solukhumbu', 'khumbu', 'tibet']], True),
    ('How high is Mount Everest?', [['8848', '8,848', '8850', '8,850']], True),
    ('Who was Prithvi Narayan Shah?', [['king', 'gorkha', 'unif']], True),
    ('When did Nepal become a federal democratic republic?', [['2008', '2065', '2063', '2015', '2072']], True),
    ('What is the capital of Nepal?', [['kathmandu']], True),
    ('Why do we see lightning before thunder?', [['light'], ['faster', 'speed', 'travels']], True),
    ('How do plants make food?', [['photosynthesis', 'sunlight', 'carbon dioxide']], True),
    ('What is an atom?', [['smallest', 'particle', 'unit']], True),
    ('Who wrote the national anthem of Nepal?', [['pradeep', 'byakul', 'rai']], True),
    ('What causes earthquakes?', [['plate', 'fault', 'rock', 'tectonic']], True),
    ('How many districts are there in Nepal?', [['77', '75']], True),
    ('What is democracy?', [['people', 'govern', 'rule']], True),
    ('Where is Lumbini?', [['nepal', 'rupandehi']], True),
    ('Why is the sky blue?', [['scatter', 'light', 'atmosphere']], True),
    ('What is a mammal?', [['milk', 'hair', 'fur', 'warm', 'young', 'feed']], True),
    ('Where was Gautam Buddha born?', [['lumbini']], True),
    ('What is the largest planet in the solar system?', [['jupiter']], True),
    ('What is the boiling point of water?', [['100']], True),
    ('What is the function of the heart?', [['blood', 'pump']], True),
    ('Who invented the telephone?', [['bell']], True),
    ('What is a noun?', [['name', 'naming', 'person', 'place', 'thing']], True),
    ('How many bones are in the human body?', [['206']], True),
    ('What is the longest river in Nepal?', [['karnali', 'koshi', 'kosi']], True),
    ('Why do leaves fall in autumn?', [['water', 'chlorophyll', 'cold', 'winter', 'light']], True),
    ('What is gravity?', [['force', 'attract', 'pull']], True),
    ('Who was the first king of unified Nepal?', [['prithvi']], True),
    ('What are the three states of matter?', [['solid'], ['liquid'], ['gas']], True),
    ('What is the national flower of Nepal?', [['rhododendron', 'lali gurans', 'laligurans']], True),
    ('What is evaporation?', [['vapour', 'vapor', 'gas'], ['water', 'liquid']], True),
    ('When did the Rana regime end?', [['1951', '2007']], True),
    ('What is the speed of light?', [['300', '3 x', '3x', '186', '299']], True),
    # not in the box / false premise -> must not invent
    ('Who was the first president of Nepal to visit Mars?', [], False),
    ('When did Prithvi Narayan Shah fight the British in London?', [], False),
    ('How many moons does the Looma box have?', [], False),
    ('What is the phone number of the Kathmandu zoo?', [], False),
    ('Why did Buddha play football?', [], False),
    ('Who won the 2026 football world cup?', [], False),
    ],
    'ne': [
    ('प्रकाश संश्लेषण भनेको के हो?', [['खाना', 'खाद्य', 'भोजन'], ['प्रकाश', 'सूर्य']], True),
    ('नेपालको राजधानी कहाँ हो?', [['काठमाडौं', 'काठमाडौँ']], True),
    ('पृथ्वीनारायण शाह को हुन्?', [['राजा', 'गोरखा', 'एकीकरण']], True),
    ('सगरमाथाको उचाइ कति छ?', [['८८४८', '8848', '८,८४८', '8,848']], True),
    ('गौतम बुद्ध कहाँ जन्मिएका थिए?', [['लुम्बिनी']], True),
    ('पानी कति डिग्री सेल्सियसमा उम्लन्छ?', [['१००', '100']], True),
    ('लोकतन्त्र भनेको के हो?', [['जनता', 'शासन', 'जनताको']], True),
    ('भूकम्प किन आउँछ?', [['प्लेट', 'चट्टान', 'ऊर्जा', 'हल्लिन']], True),
    ('२०२६ को विश्वकप फुटबल कसले जित्यो?', [], False),
    ('पृथ्वीनारायण शाहले लन्डनमा कहिले युद्ध गरे?', [], False),
    ],
    'en_new': [
    ('What is a volcano?', [['magma', 'lava', 'opening', 'mountain', 'rupture']], True),
    ('Where is Pokhara?', [['nepal', 'gandaki', 'kaski', 'west']], True),
    ('Who was Tribhuvan?', [['king']], True),
    ('What is the chemical formula of water?', [['h2o', 'h 2 o', 'h₂o']], True),
    ('How many continents are there?', [['seven', '7']], True),
    ('What is a computer?', [['machine', 'device', 'electronic']], True),
    ('Why do we need to drink water?', [['body', 'health', 'blood', 'temperature', 'waste']], True),
    ('What is the largest ocean?', [['pacific']], True),
    ('Who discovered gravity?', [['newton']], True),
    ('What is a fraction?', [['part', 'whole', 'numerator', 'divid']], True),
    ('When did the first person climb Mount Everest?', [['1953']], True),
    ('What is erosion?', [['soil', 'rock', 'wear', 'carried', 'remov']], True),
    ('What is the function of the lungs?', [['breath', 'oxygen', 'air', 'respir']], True),
    ('Where is the Kathmandu valley?', [['nepal', 'himalaya', 'central', 'bagmati']], True),
    ('What is a verb?', [['action', 'doing', 'word']], True),
    ('What is pollution?', [['harm', 'contamin', 'dirty', 'environment']], True),
    ('How do vaccines work?', [['immune', 'antibod', 'disease']], True),
    ('What is the currency of Nepal?', [['rupee']], True),
    ('Who wrote Muna Madan?', [['devkota', 'laxmi prasad']], True),
    ('What is an ecosystem?', [['organism', 'living', 'environment', 'community']], True),
    # not in the box / false premise
    ('Who was the first Nepali astronaut on the Moon?', [], False),
    ('When did Pokhara become the capital of Nepal?', [], False),
    ('What is the population of Mars?', [], False),
    ('Why do fish climb trees in Nepal?', [], False),
    ('How many legs does a snake have in the Terai?', [], False),
    ('Who invented the Looma box in 1850?', [], False),
    ],
    'ne_new': [
    ('ज्वालामुखी भनेको के हो?', [['लाभा', 'म्याग्मा', 'पहाड', 'प्वाल', 'पग्लिएको']], True),
    ('नेपालको राष्ट्रिय फूल कुन हो?', [['लालीगुराँस', 'गुराँस']], True),
    ('त्रिभुवन को थिए?', [['राजा']], True),
    ('मुनामदन कसले लेखे?', [['देवकोटा']], True),
    ('पोखरा कहाँ छ?', [['कास्की', 'गण्डकी', 'पश्चिम']], True),
    ('भिन्न भनेको के हो?', [['भाग', 'अंश', 'हर']], True),
    ('चन्द्रमामा पहिलो नेपाली अन्तरिक्षयात्री को थिए?', [], False),
    ('माछाहरू रुख किन चढ्छन्?', [], False),
    ],
    # Written 2026-11-10 before the second round of changes; not looked at
    # while tuning them.
    'en_v3': [
    ('What is a solar eclipse?', [['moon'], ['sun']], True),
    ('What is the main function of roots?', [['water', 'absorb', 'anchor', 'minerals', 'hold']], True),
    ('Who was Bhimsen Thapa?', [['prime minister', 'mukhtiyar', 'minister', 'general']], True),
    ('Where is Chitwan National Park?', [['chitwan', 'terai', 'inner terai', 'narayani', 'nepal']], True),
    ('What is a habitat?', [['live', 'home', 'place', 'environment']], True),
    ('Why do we need food?', [['energy', 'grow', 'growth', 'health', 'body']], True),
    ('How is soil formed?', [['rock', 'weathering', 'break']], True),
    ('What is the largest country in the world?', [['russia']], True),
    ('What is an adjective?', [['describ', 'noun', 'qualit', 'modif']], True),
    ('When did Nepal adopt its current constitution?', [['2015', '2072']], True),
    ('What is the function of the kidney?', [['urine', 'filter', 'waste', 'blood']], True),
    ('Who was Mahatma Gandhi?', [['india', 'leader', 'independence', 'nonviolen', 'non-violen']], True),
    ('What is a democracy?', [['people', 'govern', 'rule', 'elect']], True),
    ('What is the highest mountain in the world?', [['everest', 'sagarmatha']], True),
    ('Why do we have day and night?', [['rotat', 'spin', 'axis', 'turn']], True),
    ('What is condensation?', [['vapour', 'vapor', 'gas'], ['liquid', 'water', 'cool']], True),
    ('What is a carnivore?', [['meat', 'flesh', 'animals']], True),
    ('What is a triangle?', [['three', '3']], True),
    ('Where do tigers live?', [['forest', 'jungle', 'grassland', 'asia', 'india', 'chitwan', 'bardiya']], True),
    ('What is malaria?', [['mosquito', 'parasite', 'plasmodium', 'disease', 'fever']], True),
    ('How do we prevent diarrhoea?', [['water', 'wash', 'hand', 'clean', 'boil', 'toilet']], True),
    ('What is an insect?', [['six', '6', 'legs', 'three body', 'thorax']], True),
    ('Who was Araniko?', [['architect', 'artist', 'pagoda', 'china', 'kublai']], True),
    ('What is the speed of sound?', [['343', '332', '330', '340', '1,235', '767']], True),
    ('Who was the first king of the Shah dynasty to rule Kathmandu?', [['prithvi']], True),
    ('What is the population of Kathmandu in 2090?', [], False),
    ('Who was the first Nepali to walk on the Moon?', [], False),
    ('Why do elephants fly south in winter?', [], False),
    ('When did Lumbini become the capital of India?', [], False),
    ('How many wheels does a Looma box have?', [], False),
    ],
    'ne_v3': [
    ('प्रकाश संश्लेषण भनेको के हो?', [['खाना', 'सूर्य', 'प्रकाश', 'हरितकण', 'ग्लुकोज']], True),
    ('नेपालको राजधानी कुन हो?', [['काठमाडौं', 'काठमाडौँ']], True),
    ('पृथ्वीनारायण शाह को थिए?', [['राजा', 'गोरखा', 'एकीकरण']], True),
    ('लुम्बिनी कहाँ छ?', [['रुपन्देही', 'नेपाल', 'लुम्बिनी प्रदेश']], True),
    ('पानी किन आवश्यक छ?', [['जीवन', 'शरीर', 'बाँच', 'आवश्यक']], True),
    ('सगरमाथाको उचाइ कति छ?', [['८८४८', '८,८४८', '8848', '8,848', '८८४९', '८,८४९']], True),
    ('मंगल ग्रहमा कति नेपाली बस्छन्?', [], False),
    ('हात्तीहरू किन उड्छन्?', [], False),
    ],
    # Written 2026-11-10 after the second round of changes, as the final check.
    'en_v4': [
    ('What is a herbivore?', [['plant', 'grass', 'vegetation']], True),
    ('What is respiration?', [['oxygen', 'energy', 'breath', 'carbon dioxide']], True),
    ('Who was Laxmi Prasad Devkota?', [['poet', 'writer', 'author']], True),
    ('Where is Kathmandu?', [['nepal', 'valley', 'bagmati']], True),
    ('What is the capital of India?', [['delhi']], True),
    ('What is a prime number?', [['divisible', 'factor', 'itself', 'divisors']], True),
    ('How do bees make honey?', [['nectar', 'flower']], True),
    ('What is a pronoun?', [['noun', 'replace', 'instead']], True),
    ('What is the smallest planet in the solar system?', [['mercury']], True),
    ('Why do plants need sunlight?', [['food', 'photosynthesis', 'energy']], True),
    ('What is an earthquake?', [['shak', 'vibrat', 'tremor', 'ground']], True),
    ('Who was Buddha?', [['siddhartha', 'teacher', 'founder', 'buddhism', 'lumbini', 'enlighten']], True),
    ('What is erosion?', [['soil', 'wear', 'remov', 'rock']], True),
    ('What is the largest desert in the world?', [['sahara', 'antarctic']], True),
    ('What is a virus?', [['infect', 'cell', 'microorganism', 'germ', 'agent']], True),
    ('What is a map?', [['represent', 'drawing', 'picture', 'earth', 'area']], True),
    ('When did World War II end?', [['1945']], True),
    ('What is an ecosystem?', [['living', 'organism', 'environment']], True),
    ('What is a rainbow?', [['light', 'colour', 'color', 'spectrum', 'arc']], True),
    ('Where is the Sahara desert?', [['africa']], True),
    ('What is digestion?', [['food', 'break', 'absorb']], True),
    ('Who invented the light bulb?', [['edison', 'swan']], True),
    ('What is a molecule?', [['atom']], True),
    ('What is the national animal of Nepal?', [['cow']], True),
    ('Who was the first man on the Moon?', [['armstrong']], True),
    ('What is the capital of Mars?', [], False),
    ('Who was the first king of the Moon?', [], False),
    ('When did Pokhara host the Olympic Games?', [], False),
    ('Why do rivers flow uphill in Nepal?', [], False),
    ('How many legs does a fish have?', [], False),
    ],
    'ne_v4': [
    ('पर्यावरण भनेको के हो?', [['वातावरण', 'जीव', 'वरिपरि', 'प्राकृतिक']], True),
    ('नेपालको राष्ट्रिय जनावर कुन हो?', [['गाई']], True),
    ('लक्ष्मीप्रसाद देवकोटा को हुन्?', [['कवि', 'महाकवि', 'लेखक', 'साहित्यकार']], True),
    ('भूकम्प भनेको के हो?', [['कम्पन', 'हल्लिने', 'जमिन', 'पृथ्वी']], True),
    ('सौर्यमण्डलको सबैभन्दा ठूलो ग्रह कुन हो?', [['बृहस्पति']], True),
    ('बिरुवालाई किन पानी चाहिन्छ?', [['खाना', 'बाँच', 'वृद्धि', 'पोषण']], True),
    ('चन्द्रमाको राजधानी कुन हो?', [], False),
    ('माछाका कति खुट्टा हुन्छन्?', [], False),
    ],
}


def ask(url, q):
    req = urllib.request.Request(url + '/rag_query', data=json.dumps({'question': q, 'debug': True}).encode(),
                                 headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=600))


def run(url, name, cases):
    ok = bad = 0
    times = []
    for q, groups, answerable in cases:
        t = time.time()
        d = ask(url, q)
        times.append(time.time() - t)
        a = (d.get('answer') or '').lower()
        src = d.get('answer_source')
        answered = src in ('llm', 'extract')
        good = (answered and all(any(k in a for k in g) for g in groups)) if answerable else not answered
        ok += good
        bad += (not answerable) and answered
        tag = 'OK ' if good else ('HAL' if (not answerable and answered) else 'XX ')
        print(f'{tag} {times[-1]:5.1f}s [{src:7}] {q}\n      -> {(d.get("answer") or "")[:230]}')
    times.sort()
    print(f'== {name}: {ok}/{len(cases)}  hallucinated={bad}  median={times[len(times) // 2]:.1f}s  max={times[-1]:.1f}s\n')


def main():
    url = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8089').rstrip('/')
    names = sys.argv[2:] or list(SETS)
    for n in names:
        run(url, n, SETS[n])


if __name__ == '__main__':
    main()
