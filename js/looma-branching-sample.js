'use strict';
/*
 * looma-branching-sample.js
 *
 * Hardcoded sample scenario(s) for the "branching" presentation_type template,
 * so the engine can be demonstrated before any database content exists.
 * Real scenarios will be stored as game records in the same generalized shape.
 *
 * ---- GENERALIZED BRANCHING SCHEMA (any scenario is just data in this shape) ----
 *
 *   {
 *     presentation_type: 'branching',      // makes looma-game.js dispatch to runBranching()
 *     ft: 'game',
 *     title: { en, np },                   // bilingual (a plain string also works)
 *     start: '<node id>',                  // entry node
 *     nodes: {                             // dictionary keyed by node id
 *       '<id>': {
 *         situation: { en, np },           // bilingual prompt text  (required)
 *         image: '<path>',                 // optional illustration
 *         terminal: true,                  // OPTIONAL: marks an endpoint (no choices; shows Restart)
 *         choices: [                       // 2-4 per non-terminal node
 *           {
 *             label:   { en, np },         // bilingual button text
 *             outcome: { en, np },         // bilingual feedback shown after the click
 *             correct: true | false,       // colours the feedback; usable for scoring later
 *             next: '<node id>'            // node to go to next (may loop back for "try again")
 *           }
 *         ]
 *       }
 *     }
 *   }
 *
 * Validation rules (enforced later at import time):
 *   - start exists in nodes
 *   - every choice.next resolves to a real node id
 *   - every non-terminal node has 2-4 choices; terminal nodes have none
 *   - both en and np present on every situation / label / outcome
 *
 * ---- CONTENT PROVENANCE (health-critical) ----
 * Every scenario below is authored strictly from the matching first-aid topic in
 * firstaid-seed.json — its Emergency steps, Learn cards, and "Never" list. Those
 * topics cite IFRC Guidelines 2025, WHO, American/British/Nepal Red Cross, and
 * ILCOR/Resuscitation Council. No medical claim here goes beyond that sourced
 * content. Correct choices follow the Emergency sequence; wrong choices are drawn
 * from each topic's "Never" list, with the outcome text explaining the risk in the
 * topic's own words.
 * TODO: native-speaker review of all Nepali (np) — AI-translated first pass.
 */

window.BRANCHING_SAMPLES = {

    // ---- First real scenario: authored from the existing "snakebite" first-aid lesson. ----
    // Envelope (presentation_type/ft/title) added for the engine; the `start` + `nodes`
    // below are the author's tree, used verbatim. Nepali (np) translated.
    // TODO: native-speaker review — health-critical first-aid wording, AI-translated.
    snakebite: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Snakebite', np: 'सर्पदंश' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: "You're walking in tall grass with a friend when a snake bites their ankle and slithers away. Your friend is scared and starting to panic. What do you do first?", np: 'तपाईं साथीसँग अग्लो घाँसमा हिँडिरहनुभएको छ, त्यत्तिकैमा एउटा सर्पले उनको गोलीगाँठोमा टोक्छ र सुइँकुच्च हुन्छ। तपाईंको साथी डराएका छन् र आत्तिन थालेका छन्। तपाईं सबैभन्दा पहिले के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Move both of you a safe distance from where the snake went', np: 'सर्प गएको ठाउँबाट दुवैजना सुरक्षित दूरीमा सर्नुहोस्' },
                      outcome: { en: "Right. Get clear so it can't strike again — then help safely.", np: 'ठीक। सर्पले फेरि टोक्न नसकोस् भनेर टाढा जानुहोस् — त्यसपछि सुरक्षित तरिकाले मद्दत गर्नुहोस्।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Chase and kill the snake so doctors can identify it', np: 'डाक्टरले चिन्न सकून् भनेर सर्पलाई खेदेर मार्नुहोस्' },
                      outcome: { en: "Don't — chasing it risks a second bite, and hospitals treat based on symptoms, not the snake. Let's keep going.", np: 'नगर्नुहोस् — खेद्दा फेरि टोक्ने खतरा हुन्छ, र अस्पतालले सर्प होइन, लक्षण हेरेर उपचार गर्छ। अगाडि बढौं।' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: { en: "You're both safe now. Your friend is panicking and wants to run to the village for help. What do you tell them?", np: 'अब दुवैजना सुरक्षित हुनुहुन्छ। तपाईंको साथी आत्तिएर मद्दतका लागि गाउँतिर दौडन खोज्दैछन्। तपाईं उनलाई के भन्नुहुन्छ?' },
                choices: [
                    { label:   { en: "Stay calm and completely still — I'll bring help to you", np: 'शान्त रहनुहोस् र बिलकुलै नचल्नुहोस् — म तपाईंकहाँ मद्दत ल्याउँछु' },
                      outcome: { en: 'Correct. Fear and movement pump venom faster. Staying calm and still is the single most important thing.', np: 'सही। डर र चलहलले विष झन् छिटो फैलाउँछ। शान्त र स्थिर रहनु नै सबैभन्दा महत्त्वपूर्ण कुरा हो।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Run together to the village as fast as possible', np: 'सकेसम्म छिटो सँगै गाउँतिर दौडनुहोस्' },
                      outcome: { en: "Running speeds venom through the body — but this isn't fatal on its own. Get them to stay still now. Let's continue.", np: 'दौड्दा विष शरीरभरि छिटो फैलिन्छ — तर यो आफैंमा घातक होइन। अब उनलाई स्थिर रहन लगाउनुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: "Your friend is calm and sitting down. Their ankle is beginning to swell, and they're wearing an anklet and a tight sock on that leg. What now?", np: 'तपाईंको साथी शान्त भएर बसेका छन्। उनको गोलीगाँठो सुन्निन थालेको छ, र त्यही खुट्टामा पाउजु र कसिलो मोजा लगाएका छन्। अब के गर्ने?' },
                choices: [
                    { label:   { en: 'Gently remove the anklet and loosen the sock before swelling traps them', np: 'सुन्निएर अठ्याउनुअघि बिस्तारै पाउजु निकाल्नुहोस् र मोजा खुकुलो पार्नुहोस्' },
                      outcome: { en: 'Good. Remove tight items early — once swelling sets in they can cut off blood flow.', np: 'राम्रो। कसिला चीजहरू चाँडै निकाल्नुहोस् — सुन्निएपछि तिनले रगतको बहाव रोक्न सक्छन्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Tie a tight band above the bite to stop the venom spreading', np: 'विष फैलिन नदिन टोकेको ठाउँमाथि कसेर पट्टी बाँध्नुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_dead_tourniquet' }
                ]
            },
            n3: {
                situation: { en: 'The bitten leg needs to be kept still. How do you position and secure it?', np: 'टोकिएको खुट्टा स्थिर राख्नुपर्छ। तपाईं यसलाई कसरी मिलाएर राख्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Keep the leg still at about heart level and splint it like a broken bone', np: 'खुट्टालाई मुटुको तह जति उचाइमा स्थिर राख्नुहोस् र भाँचिएको हड्डीलाई झैँ खपटा (स्प्लिन्ट) लगाउनुहोस्' },
                      outcome: { en: 'Exactly right. A still limb at heart level slows the spread of venom.', np: 'एकदम सही। मुटुको तहमा स्थिर राखिएको अंगले विष फैलिने गति घटाउँछ।' },
                      correct: true, next: 'n4' },
                    { label:   { en: 'Cut the bite open and suck the venom out', np: 'टोकेको ठाउँ काटेर विष चुसेर निकाल्नुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_dead_cut' }
                ]
            },
            n4: {
                situation: { en: 'The limb is splinted. How does your friend get to the hospital with antivenom?', np: 'खुट्टामा खपटा लगाइयो। तपाईंको साथी प्रतिविष (एन्टिभेनम) भएको अस्पतालसम्म कसरी पुग्ने?' },
                choices: [
                    { label:   { en: "Carry them or arrange transport — don't let them walk", np: 'उनलाई बोक्नुहोस् वा सवारीको बन्दोबस्त गर्नुहोस् — हिँड्न नदिनुहोस्' },
                      outcome: { en: 'Correct. Get to antivenom fast, but keep them still — walking pumps venom. Carry them if you can.', np: 'सही। छिटो प्रतिविषसम्म पुग्नुहोस्, तर उनलाई स्थिर राख्नुहोस् — हिँड्दा विष फैलिन्छ। सके उनलाई बोक्नुहोस्।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Give them strong coffee to keep them alert on the walk', np: 'हिँड्दा सचेत रहून् भनेर उनलाई कडा कफी दिनुहोस्' },
                      outcome: { en: "No coffee, alcohol, or stimulants — and don't let them walk. Carry them. Let's get them there.", np: 'कफी, रक्सी वा उत्तेजक पदार्थ नदिनुहोस् — र हिँड्न नदिनुहोस्। उनलाई बोक्नुहोस्। अस्पतालसम्म पुर्‍याऔं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You kept your friend calm, still, and got them to antivenom quickly. This gives them the best possible chance. Well done.', np: 'तपाईंले साथीलाई शान्त र स्थिर राख्नुभयो, र छिटै प्रतिविषसम्म पुर्‍याउनुभयो। यसले उनलाई बाँच्ने सबैभन्दा राम्रो सम्भावना दिन्छ। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_dead_tourniquet: {
                situation: { en: "Your friend didn't survive. A tight tourniquet doesn't stop venom — it cuts off blood flow and can destroy the limb, and the delay cost their life. Never tie anything tight around a snakebite. Start again and try to save them.", np: 'तपाईंको साथी बाँच्न सकेनन्। कसेर बाँधेको पट्टीले विष रोक्दैन — यसले रगतको बहाव रोक्छ र अंगै नष्ट गर्न सक्छ, अनि ढिलाइले उनको ज्यान गयो। सर्पदंशमा कहिल्यै कसेर केही नबाँध्नुहोस्। फेरि सुरु गरेर उनलाई बचाउने प्रयास गर्नुहोस्।' },
                terminal: true, choices: []
            },
            end_dead_cut: {
                situation: { en: "Your friend didn't survive. Cutting and sucking the wound doesn't remove venom — it causes bleeding, infection, and wastes the time that antivenom needed. Never cut a snakebite. Start again and try to save them.", np: 'तपाईंको साथी बाँच्न सकेनन्। घाउ काटेर चुस्दा विष निस्कँदैन — यसले रगत बग्ने, संक्रमण गराउँछ र प्रतिविषलाई चाहिने समय खेर जान्छ। सर्पदंशलाई कहिल्यै नकाट्नुहोस्। फेरि सुरु गरेर उनलाई बचाउने प्रयास गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Severe bleeding (ABC: Alert–Bleeding–Compress). Sourced: IFRC 2025, Red Cross, ILCOR 'Stop the Bleed'. ----
    'severe-bleeding': {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Severe bleeding', np: 'धेरै रक्तस्राव' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'A worker cuts their forearm on sheet metal. Blood is flowing heavily and pulsing. What do you do first?', np: 'एक जना कामदारको पाखुरामा जस्ताले गहिरो चोट लाग्यो। धेरै रगत बगिरहेको र फ्वाँ-फ्वाँ गरी निस्किरहेको छ। तपाईं पहिले के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Press hard and directly on the wound with a clean cloth, and shout for help', np: 'सफा कपडाले घाउमा सिधै जोडले थिच्नुहोस्, र मद्दतका लागि कराउनुहोस्' },
                      outcome: { en: 'Right. Firm, direct pressure is the fastest way to stop bleeding. Alert help, find the Bleeding, Compress it — the ABCs.', np: 'ठीक। सिधै बलियोसँग थिच्नु नै रगत रोक्ने सबैभन्दा छिटो उपाय हो। मद्दत बोलाउनुहोस्, रगत कहाँबाट आइरहेको छ पत्ता लगाउनुहोस्, र थिच्नुहोस् — यही ABC हो।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Rush to find water to wash the wound clean first', np: 'पहिले घाउ धुन पानी खोज्न हतारिनुहोस्' },
                      outcome: { en: "Washing comes later — stopping the flow comes first. Heavy bleeding can be fatal in minutes. Press now. Let's continue.", np: 'धुने काम पछि — पहिले रगत रोक्नुपर्छ। धेरै रगत बगे केही मिनेटमै ज्यान जान सक्छ। अहिले थिच्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: { en: "You're pressing firmly, but blood soaks through the cloth. What now?", np: 'तपाईं बलियोसँग थिचिरहनुभएको छ, तर रगतले कपडा भिजाएर बाहिर निस्क्यो। अब के गर्ने?' },
                choices: [
                    { label:   { en: 'Add another clean cloth on top and keep pressing', np: 'माथि अर्को सफा कपडा थपेर थिचिरहनुहोस्' },
                      outcome: { en: 'Correct. Never remove a soaked cloth — lifting it disturbs the forming clot. Add on top and keep pressing.', np: 'सही। भिजेको कपडा कहिल्यै नहटाउनुहोस् — हटाउँदा जम्न लागेको रगत बिथोलिन्छ। माथि थपेर थिचिरहनुहोस्।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Remove the soaked cloth to check how deep the wound is', np: 'घाउ कति गहिरो छ हेर्न भिजेको कपडा हटाउनुहोस्' },
                      outcome: { en: "Don't peek — lifting the pad restarts the bleeding. Add fresh cloth on top instead. Let's keep going.", np: 'नचियाउनुहोस् — कपडा उठाउँदा रगत फेरि बग्न थाल्छ। बरु माथि नयाँ कपडा थप्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: 'As you press, you notice a shard of glass embedded deep in the wound. What do you do?', np: 'थिच्दै गर्दा घाउभित्र गहिरोसँग सिसाको टुक्रा गाडिएको देख्नुहुन्छ। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Leave it in place, pad around it, and press on either side of it', np: 'त्यसलाई त्यहीँ छोड्नुहोस्, वरिपरि कपडा राख्नुहोस्, र दुवैतिरबाट थिच्नुहोस्' },
                      outcome: { en: 'Right. An embedded object may be plugging the wound. Press around it, never on it.', np: 'ठीक। गाडिएको वस्तुले घाउ थुनिरहेको हुन सक्छ। त्यसमाथि होइन, वरिपरि थिच्नुहोस्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Pull the glass out so you can press directly on the cut', np: 'सिधै घाउमा थिच्न सकियोस् भनेर सिसा तानेर निकाल्नुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_object' }
                ]
            },
            n3: {
                situation: { en: 'The bleeding is now controlled, but the person looks pale, feels cold and clammy, and is breathing fast. What do you do?', np: 'अब रगत नियन्त्रणमा आयो, तर बिरामी फुस्रो देखिन्छन्, चिसो र चिट्चिट् पसिना आएका छन्, र छिटो-छिटो सास फेरिरहेका छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Help them lie down, keep them warm and still, and maintain pressure while help comes', np: 'उनलाई पल्टाउनुहोस्, न्यानो र स्थिर राख्नुहोस्, र मद्दत नआउँदासम्म थिचिरहनुहोस्' },
                      outcome: { en: 'Correct. These are signs of shock from blood loss. Lying down, warm and still helps protect their vital organs.', np: 'सही। यी रगत बगेर हुने सक (shock) का लक्षण हुन्। पल्टाएर, न्यानो र स्थिर राख्दा महत्त्वपूर्ण अंगहरू जोगिन्छन्।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Sit them up and give them water to drink', np: 'उनलाई उठाएर बसाल्नुहोस् र पिउन पानी दिनुहोस्' },
                      outcome: { en: 'Keep them lying down and warm instead — this is shock. Maintain pressure and get help. Let\'s finish.', np: 'बरु उनलाई पल्टाएर न्यानो राख्नुहोस् — यो सक हो। थिचिरहनुहोस् र मद्दत बोलाउनुहोस्। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You stopped the bleeding with firm pressure, left the embedded object alone, and treated for shock. This gives them the best chance until medical help arrives. Well done.', np: 'तपाईंले बलियोसँग थिचेर रगत रोक्नुभयो, गाडिएको वस्तु नछोई राख्नुभयो, र सकको उपचार गर्नुभयो। चिकित्सा मद्दत नआउँदासम्म यसले उनलाई सबैभन्दा राम्रो सम्भावना दिन्छ। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_object: {
                situation: { en: "Pulling the glass out released much heavier bleeding you couldn't control. A stuck object may be pressing against the cut vessel and plugging it. Never remove an embedded object — pad around it. Start again.", np: 'सिसा तान्दा अझ धेरै रगत बग्न थाल्यो जुन तपाईंले नियन्त्रण गर्न सक्नुभएन। गाडिएको वस्तुले काटिएको नसामा थिचेर घाउ थुनिरहेको हुन सक्छ। गाडिएको वस्तु कहिल्यै ननिकाल्नुहोस् — वरिपरि कपडा राख्नुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Burns and scalds. Sourced: IFRC 2025, WHO, Global First Aid Centre (cool 20+ min). ----
    burns: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Burns and scalds', np: 'पोल्नु र डढ्नु' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'A child spills a pot of boiling water over their arm and is crying in pain. What do you do first?', np: 'एउटा बच्चाको हातमा उम्लिरहेको पानी पोखियो र पीडाले रोइरहेको छ। तपाईं पहिले के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Move them from the hot water and cool the burn under cool running water', np: 'उनलाई तातो पानीबाट पर सार्नुहोस् र पोलेको ठाउँ चिसो बगिरहेको पानीमा राख्नुहोस्' },
                      outcome: { en: 'Right. Stop the burning, then cool with running water — the single most helpful thing you can do.', np: 'ठीक। पहिले पोल्ने कुरा रोक्नुहोस्, त्यसपछि बगिरहेको पानीमा चिसो पार्नुहोस् — यो नै सबैभन्दा उपयोगी काम हो।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Rub toothpaste or butter on the burn to soothe it', np: 'आराम मिलोस् भनेर पोलेको ठाउँमा दन्तमञ्जन वा मक्खन दल्नुहोस्' },
                      outcome: { en: 'Never — toothpaste, butter, oil, honey and ash trap heat and feed infection. Cool it with water instead. Let\'s continue.', np: 'कहिल्यै होइन — दन्तमञ्जन, मक्खन, तेल, मह र खरानीले तापलाई थुन्छ र संक्रमण बढाउँछ। बरु पानीले चिसो पार्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: { en: 'The burn is under cool water. How long should you keep cooling it?', np: 'पोलेको ठाउँ चिसो पानीमुनि छ। कति बेरसम्म चिसो पार्ने?' },
                choices: [
                    { label:   { en: 'For at least 20 minutes', np: 'कम्तीमा २० मिनेटसम्म' },
                      outcome: { en: 'Correct. At least 20 minutes limits how deep the burn goes and eases pain — it even helps hours later.', np: 'सही। कम्तीमा २० मिनेटले पोलाइ कति गहिरो हुन्छ भन्ने घटाउँछ र पीडा कम गर्छ — घण्टौंपछि सुरु गरे पनि फाइदा गर्छ।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Pack it in ice to cool it faster', np: 'छिटो चिसो होस् भनेर बरफमा राख्नुहोस्' },
                      outcome: { en: 'No ice — it freezes the damaged skin and harms it further. Use cool running water. Let\'s go on.', np: 'बरफ होइन — यसले बिग्रिएको छालालाई जमाएर अझ बिगार्छ। चिसो बगिरहेको पानी प्रयोग गर्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: "While you cool the arm, what else should you do — remembering it's a small child?", np: 'हात चिसो पार्दै गर्दा, सानो बच्चा हो भन्ने सम्झेर अरू के गर्नुपर्छ?' },
                choices: [
                    { label:   { en: 'Gently remove any rings or tight clothing near the burn, and keep the child warm overall', np: 'पोलेको नजिकका औंठी वा कसिला लुगा बिस्तारै हटाउनुहोस्, र बच्चालाई समग्रमा न्यानो राख्नुहोस्' },
                      outcome: { en: 'Good. Remove tight items before swelling, but 20 minutes of water can chill a small child — keep the body warm.', np: 'राम्रो। सुन्निनुअघि कसिला चीज हटाउनुहोस्, तर २० मिनेट पानीले सानो बच्चालाई चिसो बनाउन सक्छ — शरीरलाई न्यानो राख्नुहोस्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Peel off the sleeve that is stuck to the burnt skin', np: 'पोलेको छालामा टाँसिएको बाहुला तानेर निकाल्नुहोस्' },
                      outcome: { en: "Don't peel off clothing stuck to a burn — you tear the skin. Leave it and keep cooling around it. Let\'s continue.", np: 'पोलेको ठाउँमा टाँसिएको लुगा नतान्नुहोस् — छाला च्यातिन्छ। त्यसलाई छोडेर वरिपरि चिसो पारिरहनुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'Cooling is done. The burn is blistered and larger than the child\'s palm. How do you cover it, and what next?', np: 'चिसो पार्ने काम सकियो। पोलेको ठाउँमा फोका उठेको छ र बच्चाको हत्केलाभन्दा ठूलो छ। यसलाई कसरी छोप्ने, अनि अब के गर्ने?' },
                choices: [
                    { label:   { en: 'Cover it loosely with clean plastic or a clean non-fluffy cloth and get medical help', np: 'सफा प्लास्टिक वा सफा नरौंदार कपडाले खुकुलोसँग छोप्नुहोस् र चिकित्सा मद्दत खोज्नुहोस्' },
                      outcome: { en: 'Correct. A loose clean cover keeps germs out. Blistered burns bigger than the palm, and any burn on a child, need a doctor.', np: 'सही। खुकुलो सफा छोपले किटाणु टाढा राख्छ। हत्केलाभन्दा ठूला फोकादार पोलाइ, र बच्चाको जुनसुकै पोलाइलाई डाक्टर चाहिन्छ।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Burst the blisters and wrap fluffy cotton wool tightly around the arm', np: 'फोका फुटाएर हातमा नरम कपास कसेर बेर्नुहोस्' },
                      outcome: { en: 'Never burst blisters, and fluffy cotton sticks to the wound. Cover loosely with clean plastic instead. Let\'s finish.', np: 'फोका कहिल्यै नफुटाउनुहोस्, र नरम कपास घाउमा टाँसिन्छ। बरु सफा प्लास्टिकले खुकुलोसँग छोप्नुहोस्। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You stopped the burning, cooled with water for 20 minutes, kept the child warm, covered it cleanly, and sought care. This gives the best healing and lowest infection risk. Well done.', np: 'तपाईंले पोल्ने कुरा रोक्नुभयो, २० मिनेट पानीले चिसो पार्नुभयो, बच्चालाई न्यानो राख्नुभयो, सफासँग छोप्नुभयो, र उपचार खोज्नुभयो। यसले सबैभन्दा राम्रो निको हुने र सबैभन्दा कम संक्रमणको सम्भावना दिन्छ। धेरै राम्रो।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Choking (escalating cough -> back blows -> abdominal thrusts). Sourced: IFRC 2025, Red Cross, Resus Council UK 2025. ----
    choking: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Someone is choking', np: 'कसैको घाँटीमा अड्कियो' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'At lunch, a friend suddenly grabs their throat. They are coughing forcefully and can still make some sound. What do you do?', np: 'खाजा खाँदा तपाईंको साथीले अचानक घाँटी समाते। उनी जोडले खोकिरहेका छन् र अझै केही आवाज निकाल्न सक्छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Encourage them to keep coughing hard', np: 'जोडले खोकिरहन प्रोत्साहन दिनुहोस्' },
                      outcome: { en: 'Right. If they can cough, speak or breathe, air is still moving — a strong cough is the best tool. Let them use it.', np: 'ठीक। खोक्न, बोल्न वा सास फेर्न सक्छन् भने हावा अझै चलिरहेको छ — जोडको खोकी नै सबैभन्दा राम्रो उपाय हो। खोक्न दिनुहोस्।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Give them water to wash it down', np: 'निल्न सजिलो होस् भनेर पानी दिनुहोस्' },
                      outcome: { en: 'No — water can make choking worse. Let them cough while they still can. Let\'s continue.', np: 'होइन — पानीले अड्किएको झन् बिगार्न सक्छ। सक्दासम्म खोक्न दिनुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: { en: 'Now they go silent, cannot speak or breathe, and make a high-pitched squeaky sound. The airway is blocked. What do you do?', np: 'अब उनी चुप लागे, बोल्न वा सास फेर्न सक्दैनन्, र सिठ्ठीजस्तो चर्को आवाज आउँछ। श्वासनली बन्द भयो। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Bend them well forward and give up to 5 firm back blows between the shoulder blades', np: 'उनलाई राम्ररी अगाडि निहुराएर कुमको बीचमा ५ पटकसम्म बलियोसँग ढाडमा हिर्काउनुहोस्' },
                      outcome: { en: 'Correct. Bent forward, a dislodged object falls out of the mouth. Check after each blow — you may not need all five.', np: 'सही। अगाडि निहुरिँदा निस्केको वस्तु मुखबाटै झर्छ। हरेक हिर्काइपछि जाँच्नुहोस् — पाँचै पटक चाहिँदैन होला।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Sweep your finger blindly around inside their mouth', np: 'उनको मुखभित्र नदेखी औंलाले घुमाएर खोतल्नुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_sweep' }
                ]
            },
            n2: {
                situation: { en: 'Five back blows did not clear it and they still cannot breathe. What next?', np: 'पाँच पटक ढाड हिर्काउँदा पनि निस्केन र उनी अझै सास फेर्न सक्दैनन्। अब के गर्ने?' },
                choices: [
                    { label:   { en: 'Give up to 5 abdominal thrusts: a fist just above the navel, pulled sharply inward and upward', np: '५ पटकसम्म पेट थिच्नुहोस्: नाइटोमाथि मुठ्ठी राखेर भित्रतिर र माथितिर झट्का दिँदै तान्नुहोस्' },
                      outcome: { en: 'Correct. Then keep alternating 5 back blows and 5 abdominal thrusts until it clears or they become unresponsive.', np: 'सही। त्यसपछि नखुल्दासम्म वा उनी बेहोस नहुँदासम्म ५ पटक ढाड हिर्काउने र ५ पटक पेट थिच्ने पालैपालो गर्नुहोस्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Do nothing and wait to see if it clears on its own', np: 'केही नगरी आफैं खुल्छ कि भनेर पर्खनुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_wait' }
                ]
            },
            n3: {
                situation: { en: 'Before it clears, the person goes limp and unresponsive. What do you do?', np: 'खुल्नुअघि नै बिरामी लल्याकलुलुक भएर बेहोस हुन्छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Lower them gently to the ground, get emergency help, and start CPR if you know how', np: 'उनलाई बिस्तारै भुइँमा सुताउनुहोस्, आपत्कालीन मद्दत बोलाउनुहोस्, र आउँछ भने CPR सुरु गर्नुहोस्' },
                      outcome: { en: 'Correct. When they collapse the muscles relax; chest compressions can also shift the object. See a doctor afterwards — thrusts can injure inside.', np: 'सही। ढल्दा मांसपेशी खुकुलो हुन्छन्; छाती थिच्दा वस्तु पनि सर्न सक्छ। पछि डाक्टरलाई देखाउनुहोस् — पेट थिच्दा भित्री चोट लाग्न सक्छ।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Keep giving hard abdominal thrusts while they lie there', np: 'उनी त्यहीँ सुतिरहेकै बेला जोडले पेट थिचिरहनुहोस्' },
                      outcome: { en: 'Once unresponsive, switch to CPR and get help — that\'s what can save them now. Let\'s finish.', np: 'बेहोस भएपछि CPR मा जानुहोस् र मद्दत बोलाउनुहोस् — अब त्यसैले उनलाई बचाउन सक्छ। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You let them cough while they could, escalated to back blows and thrusts, and moved to CPR and help when they collapsed. That is exactly the right sequence. Well done.', np: 'सक्दासम्म खोक्न दिनुभयो, अनि ढाड हिर्काउने र पेट थिच्नेसम्म बढ्नुभयो, र ढलेपछि CPR र मद्दततिर लाग्नुभयो। यही नै सही क्रम हो। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_sweep: {
                situation: { en: 'The blind finger-sweep pushed the object deeper and fully sealed the airway. Never sweep a finger blindly — only remove an object you can clearly see. Start again with back blows.', np: 'नदेखी औंलाले खोतल्दा वस्तु अझ भित्र गयो र श्वासनली पूरै बन्द भयो। नदेखी औंलाले कहिल्यै नखोतल्नुहोस् — स्पष्ट देखिएको वस्तु मात्र निकाल्नुहोस्। ढाड हिर्काउनेबाट फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            },
            end_bad_wait: {
                situation: { en: 'Waiting was dangerous — a fully blocked airway means they lose consciousness within minutes. You must act at once with back blows and abdominal thrusts. Start again.', np: 'पर्खनु खतरनाक भयो — श्वासनली पूरै बन्द भएपछि केही मिनेटमै बेहोस भइहाल्छन्। तुरुन्तै ढाड हिर्काउने र पेट थिच्ने गर्नुपर्छ। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Drowning (hypoxic arrest -> breaths-first if trained, compressions-only fallback). Sourced: IFRC 2025, WHO, Resus Council UK 2025. ----
    drowning: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Drowning rescue', np: 'डुब्नबाट उद्धार' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'You see someone struggling in a fast-moving river, head tilted back, unable to call out. What is the safest first action?', np: 'तपाईं देख्नुहुन्छ — कोही छिटो बगिरहेको खोलामा संघर्ष गरिरहेका छन्, टाउको पछाडि ढल्किएको, बोलाउनै नसक्ने अवस्थामा। सबैभन्दा सुरक्षित पहिलो काम के हो?' },
                choices: [
                    { label:   { en: 'Reach with a pole or branch, or throw something that floats', np: 'लट्ठी वा हाँगाले पुर्‍याउनुहोस्, वा पौडने कुनै चीज फ्याँक्नुहोस्' },
                      outcome: { en: 'Right — "reach or throw, don\'t go." A rope, pole or float can pull them to safety without risking you.', np: 'ठीक — "पुर्‍याउनुहोस् वा फ्याँक्नुहोस्, आफैं नजानुहोस्।" डोरी, लट्ठी वा पौडने चीजले तपाईंलाई जोखिममा नपारी उनलाई बचाउँछ।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Jump straight in to pull them out', np: 'सिधै हाम फालेर उनलाई तान्न जानुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_jump' }
                ]
            },
            n1: {
                situation: { en: "You get them out of the water. They are not breathing normally. You've been trained in rescue breaths. What do you do?", np: 'तपाईंले उनलाई पानीबाट निकाल्नुभयो। उनी सामान्य रूपमा सास फेरिरहेका छैनन्। तपाईंले rescue breath (सास दिने) तालिम लिनुभएको छ। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Give 2 rescue breaths first, then cycles of 30 chest compressions and 2 breaths', np: 'पहिले २ पटक सास दिनुहोस्, त्यसपछि ३० पटक छाती थिच्ने र २ पटक सास दिने चक्र दोहोर्‍याउनुहोस्' },
                      outcome: { en: 'Correct. Drowning kills through lack of oxygen, so getting air in matters most — this differs from a sudden heart attack.', np: 'सही। डुब्दा अक्सिजनको अभावले ज्यान जान्छ, त्यसैले हावा भित्र पुर्‍याउनु सबैभन्दा महत्त्वपूर्ण हो — यो अचानकको हृदयघातभन्दा फरक हो।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Hold them upside down to push the water out of their lungs first', np: 'पहिले फोक्सोको पानी निकाल्न उनलाई उल्टो झुण्ड्याउनुहोस्' },
                      outcome: { en: "Don't try to empty the lungs — it doesn't work, wastes time, and causes vomiting. Start CPR. Let\'s continue.", np: 'फोक्सो खाली गर्ने प्रयास नगर्नुहोस् — यो काम गर्दैन, समय खेर जान्छ, र बान्ता गराउँछ। CPR सुरु गर्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: "You're doing CPR alone with bystanders nearby. What should you arrange?", np: 'वरिपरि मानिस छन् र तपाईं एक्लै CPR गरिरहनुभएको छ। तपाईं के मिलाउनुपर्छ?' },
                choices: [
                    { label:   { en: 'Send a specific person to call emergency services while you continue', np: 'तपाईं जारी राख्दै एक जना निश्चित व्यक्तिलाई आपत्कालीन सेवामा फोन गर्न पठाउनुहोस्' },
                      outcome: { en: 'Correct. Naming one person to call means it actually happens while you keep giving care.', np: 'सही। एक जनालाई तोकेर फोन गर्न पठाउँदा तपाईं उपचार जारी राख्दै फोन पनि साँच्चै हुन्छ।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Stop CPR to make the call yourself', np: 'आफैं फोन गर्न CPR रोक्नुहोस्' },
                      outcome: { en: 'Don\'t stop CPR — send someone else. Compressions and breaths must continue. Let\'s go on.', np: 'CPR नरोक्नुहोस् — अरूलाई पठाउनुहोस्। छाती थिच्ने र सास दिने जारी रहनुपर्छ। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'The person starts breathing again on their own. They are soaked and it is windy. What now?', np: 'बिरामीले फेरि आफैं सास फेर्न थाल्छन्। उनी पूरै भिजेका छन् र बतास चलिरहेको छ। अब के गर्ने?' },
                choices: [
                    { label:   { en: 'Lay them on their side, keep them warm, and make sure they see a doctor', np: 'उनलाई कोल्टे पारेर सुताउनुहोस्, न्यानो राख्नुहोस्, र डाक्टरलाई अवश्य देखाउनुहोस्' },
                      outcome: { en: 'Correct. The side position protects the airway; wet skin loses heat fast. Everyone rescued from drowning must be checked — lung problems can appear hours later.', np: 'सही। कोल्टे स्थितिले श्वासनली जोगाउँछ; भिजेको छालाले छिटो न्यानो गुमाउँछ। डुब्नबाट बचेका सबैलाई जाँच गराउनैपर्छ — फोक्सोको समस्या घण्टौंपछि देखिन सक्छ।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Let them go home since they seem fine now', np: 'अहिले ठीक देखिएकाले उनलाई घर जान दिनुहोस्' },
                      outcome: { en: "Don't let them just go home — dangerous lung problems can appear hours later. They must see a doctor. Let\'s finish.", np: 'घर मात्रै जान नदिनुहोस् — फोक्सोको खतरनाक समस्या घण्टौंपछि देखिन सक्छ। उनले डाक्टरलाई देखाउनैपर्छ। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You rescued without becoming a victim, got air in first, kept care going while help was called, and made sure they were checked. Excellent work.', np: 'तपाईं आफैं जोखिममा नपरी उद्धार गर्नुभयो, पहिले हावा भित्र पुर्‍याउनुभयो, मद्दत बोलाउँदै उपचार जारी राख्नुभयो, र जाँच गराउने सुनिश्चित गर्नुभयो। उत्कृष्ट काम।' },
                terminal: true, choices: []
            },
            end_bad_jump: {
                situation: { en: 'Jumping into fast water, you were pulled under by the current and the panicking person. Many drowning deaths are would-be rescuers. Never enter dangerous water untrained — reach or throw instead. Start again.', np: 'छिटो बगिरहेको पानीमा हाम फाल्दा बहाव र आत्तिएको व्यक्तिले तपाईंलाई पनि तल तान्यो। डुबेर मर्नेमा धेरै त बचाउन खोज्नेहरू नै हुन्छन्। तालिम नलिई खतरनाक पानीमा कहिल्यै नछिर्नुहोस् — बरु पुर्‍याउनुहोस् वा फ्याँक्नुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Fractures and falls (splint in position found). Sourced: IFRC 2025, ILCOR/AHA splinting guidance. ----
    fractures: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Fractures and falls', np: 'हाड भाँचिनु र लड्नु' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'Someone falls hard and their forearm is now bent at a wrong angle, very painful and swelling. What do you do?', np: 'कोही जोडले लड्छन् र उनको नाडी अप्ठ्यारो कोणमा बाङ्गिएको छ, धेरै दुख्छ र सुन्निँदै छ। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Tell them to keep it still and support it in the position you found it', np: 'त्यसलाई नचलाउन भन्नुहोस् र जुन स्थितिमा भेट्नुभयो त्यहीँ अड्याएर राख्नुहोस्' },
                      outcome: { en: 'Right. Treat it as a fracture and immobilise it as found — swelling, odd angle and severe pain are clear signs.', np: 'ठीक। यसलाई भाँचिएको मानेर जस्ताको तस्तै अड्याउनुहोस् — सुन्निने, अप्ठ्यारो कोण र तीव्र पीडा स्पष्ट संकेत हुन्।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Gently straighten the arm back to its normal shape', np: 'हातलाई बिस्तारै सोझ्याएर सामान्य आकारमा फर्काउनुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_straighten' }
                ]
            },
            n1: {
                situation: { en: 'You need to move them to reach help. How do you protect the injured arm on the way?', np: 'मद्दतसम्म पुग्न उनलाई सार्नुपर्छ। बाटोमा चोट लागेको हात कसरी जोगाउने?' },
                choices: [
                    { label:   { en: 'Splint it with padded soft cloth, tying above and below the break, not over it', np: 'नरम कपडाले प्याडिङ गरेर खपटा (स्प्लिन्ट) लगाउनुहोस्, भाँचिएको ठाउँमाथि र तल बाँध्नुहोस्, त्यसमाथि होइन' },
                      outcome: { en: 'Correct. Padding and tying above and below the break steadies it and eases pain without pressing on the injury.', np: 'सही। प्याडिङ गरी भाँचिएको ठाउँको माथि र तल बाँध्दा चोटमा नथिची स्थिर हुन्छ र पीडा कम हुन्छ।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Tie the splint as tight as you can right over the break', np: 'खपटालाई सकेसम्म कसेर भाँचिएकै ठाउँमाथि बाँध्नुहोस्' },
                      outcome: { en: "Don't tie over the break or so tight it cuts off blood. Tie above and below, and check the fingers stay warm and pink. Let\'s continue.", np: 'भाँचिएकै ठाउँमाथि वा रगत रोकिने गरी नबाँध्नुहोस्। माथि र तल बाँध्नुहोस्, र औंला न्यानो र गुलाबी रहेको जाँच्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: 'After splinting, you check the hand beyond the injury. It is turning pale and cold. What does this mean and what do you do?', np: 'खपटा लगाएपछि चोटभन्दा पर हातको पन्जा जाँच्नुहुन्छ। त्यो फुस्रो र चिसो हुँदैछ। यसको अर्थ के हो र तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'The splint is too tight — loosen it at once to restore blood flow', np: 'खपटा धेरै कसिलो भयो — रगत बहाव फर्काउन तुरुन्तै खुकुलो पार्नुहोस्' },
                      outcome: { en: 'Correct. Pale, cold, numb fingers mean blood flow is cut off — an emergency that can cost the limb. Loosen immediately.', np: 'सही। फुस्रो, चिसो, सुन्निएको औंलाले रगत बहाव रोकिएको बुझाउँछ — यो अंगै गुम्न सक्ने आपत् हो। तुरुन्तै खुकुलो पार्नुहोस्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: "It's normal after an injury — leave the splint as it is", np: 'चोटपछि सामान्य हो — खपटा जस्ताको तस्तै छोड्नुहोस्' },
                      outcome: { en: 'No — pale and cold means lost blood supply. Loosen the splint now. Let\'s go on.', np: 'होइन — फुस्रो र चिसो भनेको रगत पुगेन भन्ने हो। अहिले नै खपटा खुकुलो पार्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'Circulation is restored. They ask for tea and biscuits while waiting. It may need surgery. What do you say?', np: 'रगत बहाव फर्कियो। पर्खंदै गर्दा उनले चिया र बिस्कुट मागे। शल्यक्रिया चाहिन सक्छ। तपाईं के भन्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'No food or drink for now, in case they need surgery — just keep resting and get to care', np: 'शल्यक्रिया चाहिन सक्ने भएकाले अहिले केही नखानुहोस् — आराम गर्दै उपचारमा पुगौं' },
                      outcome: { en: 'Correct. Food or drink can delay surgery. Rest, support the arm, and get them to medical care.', np: 'सही। खाना वा पेयले शल्यक्रिया ढिलो बनाउन सक्छ। आराम गर्नुहोस्, हात अड्याउनुहोस्, र चिकित्सा उपचारमा पुर्‍याउनुहोस्।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Sure, give them tea and biscuits to keep their strength up', np: 'हुन्छ, बल रहोस् भनेर चिया र बिस्कुट दिनुहोस्' },
                      outcome: { en: 'Hold off — food and drink can delay surgery they may need. Just rest and get to care. Let\'s finish.', np: 'नदिनुहोस् — चाहिन सक्ने शल्यक्रिया खाना-पेयले ढिलो बनाउँछ। आराम गरी उपचारमा पुगौं। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You immobilised the arm as found, splinted it safely, caught the loss of circulation, and kept them ready for surgery. That protects the limb and eases the injury. Well done.', np: 'तपाईंले हात जस्ताको तस्तै अड्याउनुभयो, सुरक्षितसँग खपटा लगाउनुभयो, रगत बहाव रोकिएको पत्ता लगाउनुभयो, र शल्यक्रियाका लागि तयार राख्नुभयो। यसले अंग जोगाउँछ र चोट कम गर्छ। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_straighten: {
                situation: { en: 'Straightening the arm tore the nerves and blood vessels near the sharp broken ends, causing lasting damage. Never try to straighten or push a broken bone back — support it exactly as found. Start again.', np: 'हात सोझ्याउँदा भाँचिएका धारिला छेउनजिकका नसा र रक्तनलीहरू च्यातिए र दीर्घकालीन क्षति भयो। भाँचिएको हाड कहिल्यै सोझ्याउने वा फर्काउने प्रयास नगर्नुहोस् — जस्ताको तस्तै अड्याउनुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Head injury / concussion. Sourced: IFRC 2025, WHO/Red Cross concussion guidance. ----
    'head-injury': {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Head injury', np: 'टाउकोको चोट' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'A player is knocked out for a few seconds after a hard fall, then gets up and says they feel fine. What do you do?', np: 'जोडले लडेपछि एक खेलाडी केही सेकेन्ड बेहोस हुन्छन्, त्यसपछि उठेर "ठीकै छु" भन्छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Sit them down, keep them still, and watch them closely', np: 'उनलाई बसाल्नुहोस्, स्थिर राख्नुहोस्, र नजिकबाट नियाल्नुहोस्' },
                      outcome: { en: 'Right. Anyone knocked unconscious even briefly needs watching — bleeding or swelling inside the skull can build over hours.', np: 'ठीक। छोटो समय भए पनि बेहोस भएका जोकोहीलाई नियाल्नुपर्छ — खोपडीभित्रको रगत बग्ने वा सुन्निने कुरा घण्टौंमा बढ्न सक्छ।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Let them get straight back to playing since they feel fine', np: 'ठीक छु भनेकाले सीधै खेल्न फर्कन दिनुहोस्' },
                      outcome: { en: "Don't assume they're fine just because they got up — brain bleeding can appear hours later. Watch them. Let\'s continue.", np: 'उठे भन्दैमा ठीक छन् भन्ने नठान्नुहोस् — मस्तिष्कको रक्तस्राव घण्टौंपछि देखिन सक्छ। नियाल्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: { en: 'Over the next hour, what danger signs are you watching for?', np: 'अर्को एक घण्टामा तपाईं कस्ता खतराका संकेत नियाल्दै हुनुहुन्छ?' },
                choices: [
                    { label:   { en: 'Confusion, repeated vomiting, unequal pupils, clear fluid from nose or ears, a fit, or increasing drowsiness', np: 'अलमल, बारम्बार बान्ता, आँखाका नानी असमान हुनु, नाक वा कानबाट सफा तरल आउनु, कम्पन (fit), वा झन्झन् निद्रा लाग्दै जानु' },
                      outcome: { en: 'Correct. These are red flags of serious injury inside the skull. Any one of them means urgent medical help.', np: 'सही। यी खोपडीभित्रको गम्भीर चोटका खतराका संकेत हुन्। यीमध्ये कुनै एक देखिए तुरुन्त चिकित्सा मद्दत चाहिन्छ।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Nothing in particular — just wait for the headache to pass', np: 'खासै केही होइन — टाउको दुखाइ हराउन पर्खनुहोस्' },
                      outcome: { en: 'Watch actively for confusion, vomiting, unequal pupils and drowsiness — these signal danger. Let\'s go on.', np: 'अलमल, बान्ता, असमान नानी र निद्रा लाग्दै जानु सक्रिय रूपमा नियाल्नुहोस् — यी खतराका संकेत हुन्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: 'Half an hour later they become confused and vomit twice. What do you do?', np: 'आधा घण्टापछि उनी अलमलिन्छन् र दुई पटक बान्ता गर्छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Get them to a doctor urgently', np: 'तुरुन्तै डाक्टरकहाँ पुर्‍याउनुहोस्' },
                      outcome: { en: 'Correct. Confusion and repeated vomiting after a head injury are danger signs needing urgent care.', np: 'सही। टाउकोको चोटपछि अलमल र बारम्बार बान्ता खतराका संकेत हुन्, तुरुन्त उपचार चाहिन्छ।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Give them some alcohol to calm them and let them sleep it off', np: 'शान्त बनाउन अलिकति रक्सी दिएर सुतेर बिसाउन दिनुहोस्' },
                      outcome: { en: "Never give alcohol after a head injury — it hides worsening symptoms — and don't let a knocked-out person just 'sleep it off'. Get a doctor. Let\'s continue.", np: 'टाउकोको चोटपछि रक्सी कहिल्यै नदिनुहोस् — यसले बिग्रँदै गएका लक्षण लुकाउँछ — र बेहोस भएकालाई "सुतेर बिसाउन" मात्र नदिनुहोस्। डाक्टरकहाँ लैजानुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'On the way, they become unresponsive but are still breathing. What do you do?', np: 'बाटोमा उनी बेहोस हुन्छन् तर अझै सास फेरिरहेका छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Lay them on their side (recovery position) and watch their breathing', np: 'उनलाई कोल्टे पारेर सुताउनुहोस् र सास फेरेको नियाल्नुहोस्' },
                      outcome: { en: 'Correct. The side position keeps the airway clear while you keep a close watch on their breathing.', np: 'सही। कोल्टे स्थितिले श्वासनली खुला राख्छ, अनि तपाईं सास फेरेको नजिकबाट नियाल्न सक्नुहुन्छ।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Sit them upright and shake them to wake them', np: 'उनलाई सीधा बसाएर हल्लाएर ब्युँझाउने कोसिस गर्नुहोस्' },
                      outcome: { en: 'Lay them on their side instead and watch their breathing. Get to the doctor fast. Let\'s finish.', np: 'बरु कोल्टे पारेर सुताउनुहोस् र सास नियाल्नुहोस्। छिटो डाक्टरकहाँ पुग्नुहोस्। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You watched instead of assuming, spotted the danger signs, avoided alcohol and "sleeping it off", and protected the airway on the way to care. That is exactly right. Well done.', np: 'तपाईंले अनुमान नगरी नियाल्नुभयो, खतराका संकेत पत्ता लगाउनुभयो, रक्सी र "सुतेर बिसाउने" कुरा टार्नुभयो, र उपचारमा जाँदा श्वासनली जोगाउनुभयो। यही नै सही हो। धेरै राम्रो।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Neck and back (spinal) injury (manual head support, avoid rigid collars by lay providers). Sourced: IFRC 2025, ILCOR/ANZCOR. ----
    'spinal-injury': {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Neck and back injury', np: 'घाँटी र ढाडको चोट' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'A rider is thrown from a motorbike. They are awake but complain of neck pain and want to stand up. What do you do?', np: 'एक चालक मोटरसाइकलबाट बाहिर हुत्तिन्छन्। उनी होसमा छन् तर घाँटी दुखेको गुनासो गर्दै उठ्न खोज्छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Tell them to stay completely still and not move', np: 'उनलाई बिलकुलै नचली स्थिर रहन भन्नुहोस्' },
                      outcome: { en: 'Right. After a crash or fall from height, suspect a spine injury — neck pain is a warning sign. Keep them still.', np: 'ठीक। दुर्घटना वा अग्लो ठाउँबाट खस्दा मेरुदण्डको चोटको आशंका गर्नुहोस् — घाँटी दुख्नु चेतावनीको संकेत हो। उनलाई स्थिर राख्नुहोस्।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Help them sit up and walk to the roadside to rest', np: 'उनलाई उठाएर बसाल्नुहोस् र सडक किनारमा गएर बिसाउन हिँडाउनुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_move' }
                ]
            },
            n1: {
                situation: { en: 'They are lying still. How do you protect the neck while you wait for help?', np: 'उनी स्थिर सुतिरहेका छन्। मद्दत नआउँदासम्म घाँटी कसरी जोगाउने?' },
                choices: [
                    { label:   { en: 'Kneel behind their head and gently hold it still, keeping head, neck and body in one straight line', np: 'उनको टाउकोपछाडि घुँडा टेकेर टाउको बिस्तारै स्थिर समाउनुहोस्, टाउको, घाँटी र शरीर एउटै सीधा रेखामा राख्नुहोस्' },
                      outcome: { en: 'Correct. Cradling the head in line is the single most useful thing a bystander can safely do — it protects the spinal cord.', np: 'सही। टाउकोलाई सीधा रेखामा अड्याउनु नै एक बटुवाले सुरक्षितसँग गर्न सक्ने सबैभन्दा उपयोगी काम हो — यसले मेरुदण्डको नसा जोगाउँछ।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Prop their head up on a folded jacket to make them comfortable', np: 'आराम होस् भनेर पट्याएको ज्याकेटले टाउको अड्याएर उठाउनुहोस्' },
                      outcome: { en: 'Don\'t bend the neck forward — keep head, neck and body in one straight line and hold it still. Let\'s continue.', np: 'घाँटी अगाडि ननिहुराउनुहोस् — टाउको, घाँटी र शरीर एउटै सीधा रेखामा राखेर स्थिर समाउनुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: 'They are wearing a full-face motorbike helmet and breathing normally. What about the helmet?', np: 'उनले पूरा अनुहार ढाक्ने मोटरसाइकल हेलमेट लगाएका छन् र सामान्य रूपमा सास फेरिरहेका छन्। हेलमेटको के गर्ने?' },
                choices: [
                    { label:   { en: 'Leave the helmet on — they are breathing fine', np: 'हेलमेट लगाएकै छोड्नुहोस् — उनी राम्ररी सास फेरिरहेका छन्' },
                      outcome: { en: 'Correct. Removing a helmet can twist an injured neck. Leave it on unless you must open the airway and know how.', np: 'सही। हेलमेट निकाल्दा चोट लागेको घाँटी बटारिन सक्छ। श्वासनली खोल्नै पर्ने र त्यो कसरी गर्ने थाहा नभएसम्म लगाएकै छोड्नुहोस्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Pull the helmet off quickly so they can breathe more easily', np: 'सजिलो सास फेरून् भनेर हेलमेट छिटो तानेर निकाल्नुहोस्' },
                      outcome: { en: "They're already breathing fine — pulling the helmet off can twist the injured neck. Leave it on. Let\'s go on.", np: 'उनी पहिले नै राम्ररी सास फेरिरहेका छन् — हेलमेट तान्दा चोट लागेको घाँटी बटारिन्छ। लगाएकै छोड्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'While you hold the head, when is the only time you should move them?', np: 'तपाईं टाउको समाइरहँदा, उनलाई सार्नुपर्ने एक मात्र अवस्था कहिले हो?' },
                choices: [
                    { label:   { en: 'Only if they are in immediate danger (fire, water) or stop breathing and need CPR', np: 'तत्काल खतरा (आगो, पानी) मा परे वा सास रोकिएर CPR चाहिएमा मात्र' },
                      outcome: { en: 'Correct. Otherwise, steady and wait. If you must move them, keep head, neck and body moving together as one unit.', np: 'सही। नत्र, स्थिर राखेर पर्खनुहोस्। सार्नैपरे टाउको, घाँटी र शरीरलाई एउटै एकाइका रूपमा सँगै सार्नुहोस्।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Whenever they ask to be moved because they are uncomfortable', np: 'असजिलो भयो भनेर सार्न मागेको जहिले पनि' },
                      outcome: { en: 'Only move for immediate danger or to give CPR — otherwise keep them still. Let\'s finish.', np: 'तत्काल खतरा वा CPR दिनुपर्दा मात्र सार्नुहोस् — नत्र स्थिर राख्नुहोस्। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You kept them still, held the head in line, left the helmet on, and knew the rare reasons to move them. This protects the spinal cord and can prevent lifelong paralysis. Well done.', np: 'तपाईंले उनलाई स्थिर राख्नुभयो, टाउको सीधा रेखामा समाउनुभयो, हेलमेट लगाएकै छोड्नुभयो, र सार्नुपर्ने विरलै अवस्था थाहा पाउनुभयो। यसले मेरुदण्डको नसा जोगाउँछ र आजीवन पक्षाघातबाट बचाउन सक्छ। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_move: {
                situation: { en: 'Sitting them up and walking them bent the injured spine, and loose bone pressed on the spinal cord — causing paralysis. Never move a suspected spine injury unless life is in immediate danger. Start again.', np: 'उठाएर हिँडाउँदा चोट लागेको मेरुदण्ड बाङ्गियो र खुकुलो हाडले मेरुदण्डको नसामा थिच्यो — जसले पक्षाघात गरायो। जीवनमा तत्काल खतरा नभएसम्म मेरुदण्ड चोटको आशंकामा कहिल्यै नसार्नुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Road traffic injury (scene safety first, breathing then bleeding, assume spinal). Sourced: IFRC 2025, WHO road-safety/post-crash. ----
    'road-traffic-injury': {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Road traffic injury', np: 'सडक दुर्घटनाको चोट' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'You come upon a motorbike crash on a busy road with fast traffic. A rider is down in the road. What comes first?', np: 'व्यस्त सडकमा छिटो गुड्ने ट्राफिकबीच मोटरसाइकल दुर्घटना भेट्नुहुन्छ। एक चालक सडकमा लडेका छन्। पहिले के गर्ने?' },
                choices: [
                    { label:   { en: 'Make the scene safe and warn oncoming traffic before you approach', np: 'नजिक जानुअघि घटनास्थल सुरक्षित बनाउनुहोस् र आउँदै गरेको ट्राफिकलाई सचेत गराउनुहोस्' },
                      outcome: { en: 'Right. Rescuers struck by traffic are a real danger. Your safety comes first — a second casualty helps no one.', np: 'ठीक। ट्राफिकले ठक्कर दिने बटुवाहरू साँचो खतरा हुन्। तपाईंको सुरक्षा पहिले — अर्को घाइते भए कसैलाई फाइदा हुँदैन।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Run straight into the road to reach the rider', np: 'चालककहाँ पुग्न सीधै सडकको बीचमा दौडनुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_traffic' }
                ]
            },
            n1: {
                situation: { en: 'The scene is safer now. There is a crowd of bystanders. What do you do about calling for help?', np: 'अब घटनास्थल अलि सुरक्षित छ। वरिपरि धेरै मानिस जम्मा छन्। मद्दत बोलाउने विषयमा तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Send one specific person to call an ambulance and give a clear location', np: 'एक जना निश्चित व्यक्तिलाई एम्बुलेन्स बोलाउन र स्पष्ट ठाउँ बताउन पठाउनुहोस्' },
                      outcome: { en: 'Correct. Naming one person means the call actually gets made. A clear landmark gets the ambulance moving.', np: 'सही। एक जनालाई तोक्दा फोन साँच्चै हुन्छ। स्पष्ट चिनारीले एम्बुलेन्स छिटो हिँड्छ।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Assume someone in the crowd has already called', np: 'भीडमा कसैले पहिले नै फोन गरिसक्यो होला भन्ने ठान्नुहोस्' },
                      outcome: { en: 'In a crowd the call often gets lost — point to one person and tell them to call. Let\'s continue.', np: 'भीडमा फोन प्रायः छुट्छ — एक जनालाई देखाएर फोन गर्न भन्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: 'The rider is unresponsive but breathing, still wearing a helmet. Bystanders want to drag them off the road. What do you do?', np: 'चालक बेहोस छन् तर सास फेरिरहेका छन्, हेलमेट लगाएकै छन्। मानिसहरू उनलाई घिसारेर सडकबाट हटाउन खोज्छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Stop them — assume a neck injury and do not move the rider unless there is fire or other immediate danger', np: 'उनीहरूलाई रोक्नुहोस् — घाँटीको चोट मानेर, आगो वा अन्य तत्काल खतरा नभएसम्म चालकलाई नसार्नुहोस्' },
                      outcome: { en: 'Correct. Crash victims often have neck and back injuries; dragging them can cause permanent paralysis. Steady them in place.', np: 'सही। दुर्घटनाका बिरामीलाई प्रायः घाँटी र ढाडको चोट हुन्छ; घिसार्दा स्थायी पक्षाघात हुन सक्छ। जहाँ छन् त्यहीँ स्थिर राख्नुहोस्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Help them drag the rider to the side and pull the helmet off', np: 'चालकलाई किनारमा घिसार्न र हेलमेट तानेर निकाल्न मद्दत गर्नुहोस्' },
                      outcome: { en: "Don't drag them or remove the helmet needlessly — assume a spine injury. They're breathing, so protect the neck. Let\'s go on.", np: 'बिनाकारण नघिसार्नुहोस् न हेलमेट निकाल्नुहोस् — मेरुदण्ड चोट मान्नुहोस्। उनी सास फेरिरहेका छन्, त्यसैले घाँटी जोगाउनुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'You now see two people hurt: one is screaming loudly, the other is silent and still. Who do you check first?', np: 'अब तपाईं दुई जना घाइते देख्नुहुन्छ: एक जना चर्को कराइरहेका छन्, अर्का चुपचाप र निश्चल छन्। तपाईं पहिले कसलाई हेर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Check the silent, still person first', np: 'चुपचाप, निश्चल व्यक्तिलाई पहिले हेर्नुहोस्' },
                      outcome: { en: 'Correct. The person screaming can breathe and has a pulse. The silent one may have a blocked airway or be bleeding to death — check breathing, then bleeding.', np: 'सही। कराइरहेका व्यक्तिले सास फेर्न सक्छन् र नाडी छ। चुपचाप व्यक्तिको श्वासनली बन्द वा धेरै रगत बगिरहेको हुन सक्छ — पहिले सास, त्यसपछि रगत हेर्नुहोस्।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Help the screaming person first because they seem in the most distress', np: 'सबैभन्दा बढी छट्पटाएको देखिएकाले कराइरहेका व्यक्तिलाई पहिले हेर्नुहोस्' },
                      outcome: { en: 'The one who can scream is breathing — the quiet, still person is in greater danger. Check them first. Let\'s finish.', np: 'कराउन सक्ने त सास फेरिरहेका छन् — चुपचाप, निश्चल व्यक्ति बढी खतरामा छन्। पहिले उनलाई हेर्नुहोस्। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You made the scene safe, got the right help coming, protected the neck instead of dragging, and checked the quiet casualty first. That is exactly the right order at a crash. Well done.', np: 'तपाईंले घटनास्थल सुरक्षित बनाउनुभयो, सही मद्दत बोलाउनुभयो, घिसार्नुको सट्टा घाँटी जोगाउनुभयो, र चुपचाप घाइतेलाई पहिले हेर्नुभयो। दुर्घटनामा यही नै सही क्रम हो। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_traffic: {
                situation: { en: 'Running into fast traffic, you were struck — now there are two casualties and fewer helpers. Never rush into traffic; make the scene safe first. Start again.', np: 'छिटो गुड्ने ट्राफिकमा दौड्दा तपाईंलाई ठक्कर लाग्यो — अब दुई घाइते भए र मद्दत गर्ने कम। ट्राफिकमा कहिल्यै नदौडनुहोस्; पहिले घटनास्थल सुरक्षित बनाउनुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Poisoning (protect self, don't induce vomiting, bring the container). Sourced: IFRC 2025, WHO poisoning/organophosphate. ----
    poisoning: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Poisoning', np: 'विषाक्तता' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'You find a family member collapsed in a closed shed that smells strongly of pesticide fumes. What do you do first?', np: 'बन्द गोठभित्र कीटनाशकको बाक्लो गन्ध आइरहेको ठाउँमा परिवारका सदस्य ढलेका भेट्टाउनुहुन्छ। तपाईं पहिले के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Protect yourself — get fresh air in and move them out without breathing the fumes, or call for trained help', np: 'आफूलाई जोगाउनुहोस् — ताजा हावा छिराउनुहोस् र धुवाँ नतानी उनलाई बाहिर सार्नुहोस्, वा तालिमप्राप्त मद्दत बोलाउनुहोस्' },
                      outcome: { en: 'Right. Fumes that harmed them can harm you too. If you collapse beside them, no one is left to help. Protect yourself first.', np: 'ठीक। उनलाई हानि गरेको धुवाँले तपाईंलाई पनि हानि गर्न सक्छ। तपाईं पनि ढले, मद्दत गर्ने कोही रहँदैन। पहिले आफूलाई जोगाउनुहोस्।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Rush straight into the shed and pull them out immediately', np: 'सीधै गोठभित्र दौडेर उनलाई तुरुन्तै तानेर निकाल्नुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_fumes' }
                ]
            },
            n1: {
                situation: { en: 'They are in fresh air now. Beside them you find an open pesticide container — it looks like they swallowed some. What do you do?', np: 'अब उनी ताजा हावामा छन्। छेउमा खुला कीटनाशकको भाँडो भेट्टाउनुहुन्छ — केही निलेजस्तो देखिन्छ। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Do not make them vomit; keep the container to take with you', np: 'बान्ता नगराउनुहोस्; भाँडो सँगै लैजान राख्नुहोस्' },
                      outcome: { en: 'Correct. Never force vomiting — corrosive and petroleum poisons burn again coming up and can enter the lungs. The container tells doctors what to treat.', np: 'सही। कहिल्यै जबरजस्ती बान्ता नगराउनुहोस् — क्षयकारी र पेट्रोलियम विषले फर्किंदा फेरि पोल्छ र फोक्सोमा जान सक्छ। भाँडोले डाक्टरलाई के उपचार गर्ने बताउँछ।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Make them vomit to get the poison out, and give milk to settle it', np: 'विष निकाल्न बान्ता गराउनुहोस्, र सन्चो होस् भनेर दूध दिनुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_vomit' }
                ]
            },
            n2: {
                situation: { en: 'What is the plan to get them treated?', np: 'उनको उपचारको योजना के हो?' },
                choices: [
                    { label:   { en: 'Call a poison centre or get to hospital immediately, and take the container with you', np: 'विष केन्द्रमा फोन गर्नुहोस् वा तुरुन्तै अस्पताल पुग्नुहोस्, र भाँडो सँगै लैजानुहोस्' },
                      outcome: { en: 'Correct. Some pesticides (organophosphates) have hospital antidotes, so speed to care saves lives. The label guides treatment.', np: 'सही। केही कीटनाशक (अर्गानोफस्फेट) का अस्पतालमा प्रतिविष हुन्छन्, त्यसैले छिटो उपचारले ज्यान बचाउँछ। लेबलले उपचारमा मार्गदर्शन गर्छ।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Wait at home to see if they get better on their own', np: 'आफैं निको हुन्छन् कि भनेर घरमै पर्खनुहोस्' },
                      outcome: { en: 'Don\'t wait — swallowed pesticide is fast-acting. Get to hospital now with the container. Let\'s continue.', np: 'नपर्खनुहोस् — निलेको कीटनाशक छिटो असर गर्छ। भाँडो लिएर अहिले नै अस्पताल जानुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'On the way, they become unresponsive but are still breathing. What do you do?', np: 'बाटोमा उनी बेहोस हुन्छन् तर अझै सास फेरिरहेका छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Lay them on their side and be ready to start CPR', np: 'उनलाई कोल्टे पारेर सुताउनुहोस् र CPR सुरु गर्न तयार रहनुहोस्' },
                      outcome: { en: 'Correct. The side position keeps vomit from blocking the airway. Watch their breathing and be ready to act.', np: 'सही। कोल्टे स्थितिले बान्ताले श्वासनली बन्द हुन दिँदैन। सास फेरेको नियाल्नुहोस् र कार्य गर्न तयार रहनुहोस्।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Sit them up and pour water into their mouth to dilute the poison', np: 'विष पातलो होस् भनेर उनलाई उठाएर मुखमा पानी खन्याउनुहोस्' },
                      outcome: { en: "Don't give an unresponsive person anything by mouth — it can go into the lungs. Lay them on their side. Let\'s finish.", np: 'बेहोस व्यक्तिलाई मुखबाट केही नदिनुहोस् — फोक्सोमा जान सक्छ। कोल्टे पारेर सुताउनुहोस्। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You protected yourself, resisted the myth of forcing vomiting, brought the container, rushed to care, and protected the airway. That gives them the best chance. Well done.', np: 'तपाईंले आफूलाई जोगाउनुभयो, बान्ता गराउने भ्रमलाई टार्नुभयो, भाँडो ल्याउनुभयो, छिटो उपचारमा पुग्नुभयो, र श्वासनली जोगाउनुभयो। यसले उनलाई सबैभन्दा राम्रो सम्भावना दिन्छ। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_fumes: {
                situation: { en: 'Breathing the fumes, you collapsed too — now there are two victims and no one to help. Never enter a fume-filled space to pull someone out; ventilate or call trained help. Start again.', np: 'धुवाँ तानेर तपाईं पनि ढल्नुभयो — अब दुई जना बिरामी भए र मद्दत गर्ने कोही रहेन। कसैलाई निकाल्न धुवाँले भरिएको ठाउँमा कहिल्यै नछिर्नुहोस्; हावा छिराउनुहोस् वा तालिमप्राप्त मद्दत बोलाउनुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            },
            end_bad_vomit: {
                situation: { en: 'Forcing vomiting made things far worse — the corrosive pesticide burned again on the way up and some was breathed into the lungs. Never make someone vomit, and skip milk and home antidotes. Start again.', np: 'जबरजस्ती बान्ता गराउँदा अवस्था झन् बिग्रियो — क्षयकारी कीटनाशक फर्किंदा फेरि पोल्यो र केही फोक्सोमा गयो। कसैलाई कहिल्यै बान्ता नगराउनुहोस्, र दूध वा घरेलु उपचार नदिनुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Heatstroke (rapid cooling; fluids only if fully alert). Sourced: IFRC 2025 'Hyperthermia', WHO, ILCOR cooling. ----
    heatstroke: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Heatstroke', np: 'लू लाग्नु' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'A farmworker collapses in extreme midday heat. Their skin is very hot, and they are confused. What is this, and what do you do first?', np: 'कडा दिउँसोको गर्मीमा एक किसान ढल्छन्। उनको छाला निकै तातो छ, र अलमलिएका छन्। यो के हो, र तपाईं पहिले के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'This is heatstroke — a life-threatening emergency. Move them into shade or a cool place at once', np: 'यो लू हो — ज्यान जोखिममा पार्ने आपत्। तुरुन्तै छायाँ वा चिसो ठाउँमा सार्नुहोस्' },
                      outcome: { en: 'Right. Very hot skin plus confusion or collapse in the heat is heatstroke — the body has lost temperature control. Act now.', np: 'ठीक। निकै तातो छाला र गर्मीमा अलमल वा ढल्नु लू हो — शरीरले तापक्रम नियन्त्रण गुमायो। अहिले नै कार्य गर्नुहोस्।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Wrap them warmly and give them hot tea to recover', np: 'सन्चो होस् भनेर न्यानोसँग बेर्नुहोस् र तातो चिया दिनुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_warm' }
                ]
            },
            n1: {
                situation: { en: 'They are in the shade. How do you cool them?', np: 'उनी छायाँमा छन्। तपाईं उनलाई कसरी चिसो पार्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Remove extra clothing, pour cool water over them, fan them, and put cool wet cloths on neck, armpits and groin', np: 'बढी लुगा हटाउनुहोस्, चिसो पानी खन्याउनुहोस्, बतास हान्नुहोस्, र घाँटी, काखी र जांघमा चिसो भिजेको कपडा राख्नुहोस्' },
                      outcome: { en: 'Correct. Rapid cooling is the single priority — every minute of high temperature damages the brain and organs. Those spots have big blood vessels.', np: 'सही। छिटो चिसो पार्नु नै मुख्य प्राथमिकता हो — उच्च तापक्रमको हरेक मिनेटले मस्तिष्क र अंगलाई क्षति गर्छ। ती ठाउँमा ठूला रक्तनली हुन्छन्।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Let them rest quietly and wait for the heat to pass on its own', np: 'चुपचाप बिसाउन दिनुहोस् र गर्मी आफैं घट्ने पर्खनुहोस्' },
                      outcome: { en: 'Heatstroke needs active, rapid cooling — waiting lets the brain and organs keep taking damage. Cool them now. Let\'s continue.', np: 'लूलाई सक्रिय, छिटो चिसो चाहिन्छ — पर्खंदा मस्तिष्क र अंगमा क्षति भइरहन्छ। अहिले चिसो पार्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: 'They are still confused and drowsy. Should you give them water to drink?', np: 'उनी अझै अलमलिएका र निद्रामग्न छन्। पिउन पानी दिने कि नदिने?' },
                choices: [
                    { label:   { en: 'No — while confused they could choke; focus everything on cooling and getting help', np: 'नदिनुहोस् — अलमलिएको बेला निल्दा घाँटीमा अड्किन सक्छ; सबै ध्यान चिसो पार्ने र मद्दत बोलाउनेमा दिनुहोस्' },
                      outcome: { en: 'Correct. Give small sips of water only if they are fully alert and can swallow safely. If not, cooling comes first.', np: 'सही। पूरै होसमा भई सुरक्षित रूपमा निल्न सक्ने भए मात्र थोरै-थोरै पानी दिनुहोस्। नत्र, पहिले चिसो पार्नुहोस्।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Yes — pour water into their mouth to rehydrate them quickly', np: 'दिनुहोस् — छिटो पानीको मात्रा पुगोस् भनेर मुखमा पानी खन्याउनुहोस्' },
                      outcome: { en: 'Not while they\'re confused — drink can go into the lungs. Give fluids only if fully alert. Keep cooling. Let\'s go on.', np: 'अलमलिएको बेला होइन — पानी फोक्सोमा जान सक्छ। पूरै होसमा भए मात्र पानी दिनुहोस्। चिसो पारिरहनुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n3' }
                ]
            },
            n3: {
                situation: { en: 'They remain confused. What do you do about getting more help?', np: 'उनी अझै अलमलिएकै छन्। थप मद्दतका लागि तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Get emergency help urgently while you keep cooling them', np: 'चिसो पारिरहँदै तुरुन्त आपत्कालीन मद्दत बोलाउनुहोस्' },
                      outcome: { en: 'Correct. A confused or unconscious heatstroke victim needs urgent medical help — keep cooling until it arrives.', np: 'सही। अलमलिएका वा बेहोस लू लागेका बिरामीलाई तुरुन्त चिकित्सा मद्दत चाहिन्छ — नआउँदासम्म चिसो पारिरहनुहोस्।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Stop cooling now that they are in the shade and just watch', np: 'छायाँमा पुगेकाले चिसो पार्न रोकेर हेर्दै बस्नुहोस्' },
                      outcome: { en: 'Keep cooling and call for urgent help — shade alone is not enough for heatstroke. Let\'s finish.', np: 'चिसो पारिरहनुहोस् र तुरुन्त मद्दत बोलाउनुहोस् — लूका लागि छायाँ मात्र पर्याप्त छैन। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You recognised heatstroke, cooled rapidly, held off fluids while they were confused, and got urgent help. Fast cooling like this is what saves lives. Well done.', np: 'तपाईंले लू चिन्नुभयो, छिटो चिसो पार्नुभयो, अलमलिएको बेला पानी नदिनुभयो, र तुरुन्त मद्दत बोलाउनुभयो। यस्तो छिटो चिसो पार्नुले नै ज्यान बचाउँछ। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_warm: {
                situation: { en: 'Wrapping them warmly and giving hot tea drove their temperature higher, and the delay let the heat keep damaging the brain and organs. Heatstroke needs rapid cooling, not warming. Start again.', np: 'न्यानोसँग बेरेर तातो चिया दिँदा तापक्रम अझ बढ्यो, र ढिलाइले गर्मीले मस्तिष्क र अंगमा क्षति गरिरह्यो। लूलाई न्यानो होइन, छिटो चिसो चाहिन्छ। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    },

    // ---- Hypothermia (gradual, gentle rewarming). Sourced: IFRC 2025 'Hypothermia', WHO cold-health. ----
    hypothermia: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Hypothermia', np: 'शरीर अत्यधिक चिसो हुनु' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: 'A trekker is pulled from cold water on a chilly evening. They are shivering, their skin is cold and pale, and they seem confused. What do you do first?', np: 'चिसो साँझमा एक यात्रीलाई चिसो पानीबाट निकालियो। उनी काँपिरहेका छन्, छाला चिसो र फुस्रो छ, र अलमलिएजस्तो देखिन्छन्। तपाईं पहिले के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: 'Move them somewhere warm and dry', np: 'उनलाई न्यानो र सुक्खा ठाउँमा सार्नुहोस्' },
                      outcome: { en: 'Right. Shivering, cold pale skin and confusion after cold exposure is hypothermia. Getting out of the cold is the first step.', np: 'ठीक। चिसोमा परेपछि काँप्नु, चिसो फुस्रो छाला र अलमल हुनु हाइपोथर्मिया हो। चिसोबाट बाहिर निस्कनु पहिलो कदम हो।' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Give them alcohol to warm them up from the inside', np: 'भित्रबाट न्यानो होस् भनेर रक्सी दिनुहोस्' },
                      outcome: { en: "Never give alcohol to a cold person — it feels warming but actually speeds heat loss. Get them warm and dry instead. Let\'s continue.", np: 'चिसो भएको व्यक्तिलाई कहिल्यै रक्सी नदिनुहोस् — न्यानो लागेजस्तो हुन्छ तर वास्तवमा तापक्रम झन् छिटो घटाउँछ। बरु न्यानो र सुक्खा बनाउनुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: { en: 'They are sheltered now, but still in wet clothes. How do you warm them?', np: 'अब उनी ओतमा छन्, तर अझै भिजेका लुगामा छन्। तपाईं कसरी न्यानो बनाउनुहुन्छ?' },
                choices: [
                    { label:   { en: 'Remove wet clothes, wrap them in dry blankets including the head, insulate from the cold ground, and warm gradually', np: 'भिजेका लुगा हटाउनुहोस्, टाउकोसमेत सुक्खा कम्बलले बेर्नुहोस्, चिसो भुइँबाट छुट्याउनुहोस्, र बिस्तारै न्यानो पार्नुहोस्' },
                      outcome: { en: 'Correct. Steady, gentle rewarming is safest — dry layers, cover the head, and get them off the cold ground.', np: 'सही। स्थिर, कोमल तरिकाले बिस्तारै न्यानो पार्नु सुरक्षित हुन्छ — सुक्खा लुगा, टाउको छोप्ने, र चिसो भुइँबाट अलग गर्ने।' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Leave the wet clothes on and put them right next to a roaring fire to warm fast', np: 'भिजेकै लुगामा छोडेर छिटो न्यानो होस् भनेर ठूलो आगोको छेवैमा राख्नुहोस्' },
                      outcome: { en: "Wet clothes keep chilling them, and warming a very cold body too fast is dangerous. Remove wet clothes and rewarm gradually. Let\'s go on.", np: 'भिजेको लुगाले चिसो पारिरहन्छ, र निकै चिसो शरीरलाई एकदमै छिटो न्यानो पार्नु खतरनाक हुन्छ। भिजेका लुगा हटाएर बिस्तारै न्यानो पार्नुहोस्। अगाडि बढौं।' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: 'Their hands look very cold and stiff. Someone suggests rubbing them hard to get the blood moving. What do you do?', np: 'उनका हात निकै चिसो र अररो देखिन्छन्। कसैले रगत चल्न जोडले मल्नुपर्छ भन्छन्। तपाईं के गर्नुहुन्छ?' },
                choices: [
                    { label:   { en: "Don't rub the cold limbs — just keep them wrapped and warming gently", np: 'चिसो अंगहरू नमल्नुहोस् — बेरेर कोमलसँग न्यानो पारिरहनुहोस्' },
                      outcome: { en: 'Correct. Rubbing frozen or very cold limbs damages the tissue. Gentle, steady rewarming is the safe way.', np: 'सही। जमेका वा निकै चिसो अंग मल्दा तन्तु बिग्रन्छ। कोमल, स्थिर तरिकाले न्यानो पार्नु सुरक्षित उपाय हो।' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Rub and massage their hands and feet hard and quickly', np: 'उनका हात-खुट्टा जोडले र छिटो-छिटो मल्नुहोस् र मालिस गर्नुहोस्' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_bad_rub' }
                ]
            },
            n3: {
                situation: { en: 'You notice their shivering has stopped, but they are still cold and more confused. What does this mean?', np: 'उनको काँप्ने बन्द भएको तर अझै चिसो र बढी अलमलिएको देख्नुहुन्छ। यसको अर्थ के हो?' },
                choices: [
                    { label:   { en: 'This is more serious, not less — treat it as severe and get medical help while rewarming gently', np: 'यो कम होइन, बढी गम्भीर हो — गम्भीर मानेर, कोमलसँग न्यानो पार्दै चिकित्सा मद्दत बोलाउनुहोस्' },
                      outcome: { en: 'Correct. When shivering stops but the person is still cold and confused, hypothermia is severe. Handle gently — rough handling can trigger dangerous heart rhythms.', np: 'सही। काँप्ने बन्द भए पनि व्यक्ति चिसो र अलमलिएकै छन् भने हाइपोथर्मिया गम्भीर हो। कोमलसँग व्यवहार गर्नुहोस् — रुखो व्यवहारले खतरनाक मुटुको धड्कन ल्याउन सक्छ।' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Good news — they have warmed up, so you can relax now', np: 'राम्रो खबर — न्यानो भइसके, अब ढुक्क हुन सक्नुहुन्छ' },
                      outcome: { en: 'No — shivering stopping while still cold and confused means it is worse, not better. Treat as severe and get help. Let\'s finish.', np: 'होइन — चिसो र अलमलिएकै अवस्थामा काँप्ने बन्द हुनु सुध्रेको होइन, बिग्रेको हो। गम्भीर मानेर मद्दत बोलाउनुहोस्। अन्त्यतिर बढौं।' },
                      correct: false, next: 'end_ok' }
                ]
            },
            end_ok: {
                situation: { en: 'You got them out of the cold and wet, rewarmed gradually and gently, avoided alcohol and rubbing, and recognised when it turned severe. That gentle, steady care is exactly right. Well done.', np: 'तपाईंले उनलाई चिसो र भिजेकोबाट निकाल्नुभयो, बिस्तारै र कोमलसँग न्यानो पार्नुभयो, रक्सी र मल्ने कुरा टार्नुभयो, र कहिले गम्भीर भयो भनी चिन्नुभयो। यस्तो कोमल, स्थिर हेरचाह नै सही हो। धेरै राम्रो।' },
                terminal: true, choices: []
            },
            end_bad_rub: {
                situation: { en: 'Rubbing the frozen limbs damaged the cold tissue, and the rough, hurried handling risked a dangerous heart rhythm. Never rub frozen limbs or warm a very cold person too fast. Start again.', np: 'जमेका अंग मल्दा चिसो तन्तु बिग्रियो, र रुखो, हतारको व्यवहारले खतरनाक मुटुको धड्कनको जोखिम बढायो। जमेका अंग कहिल्यै नमल्नुहोस् न निकै चिसो व्यक्तिलाई एकदमै छिटो न्यानो पार्नुहोस्। फेरि सुरु गर्नुहोस्।' },
                terminal: true, choices: []
            }
        }
    }

};
