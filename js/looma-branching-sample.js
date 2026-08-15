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

    choking: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Someone is choking', np: 'कसैको घाँटीमा अड्कियो' },
        start: 'n0',
        nodes: {
            n0: {
                situation: {
                    en: 'A friend is choking at lunch and cannot speak. What do you do first?',
                    np: 'खाजा खाँदा तपाईंको साथीको घाँटीमा केही अड्कियो र बोल्न सक्दैनन्। तपाईं पहिले के गर्नुहुन्छ?'
                },
                choices: [
                    { label:   { en: 'Encourage them to cough hard', np: 'जोडले खोक्न प्रोत्साहन दिनुहोस्' },
                      outcome: { en: 'Good — coughing can push the object out.', np: 'राम्रो — खोक्दा वस्तु बाहिर निस्कन सक्छ।' },
                      correct: true,  next: 'n2' },
                    { label:   { en: 'Give them water to drink', np: 'पिउनका लागि पानी दिनुहोस्' },
                      outcome: { en: 'No — water can make the choking worse.', np: 'होइन — पानीले अड्किएको झन् बिगार्न सक्छ।' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: {
                    en: 'That did not help and they are still choking. Try again.',
                    np: 'त्यसले मद्दत गरेन र अझै अड्किएकै छ। फेरि प्रयास गर्नुहोस्।'
                },
                choices: [
                    { label:   { en: 'Encourage them to cough hard', np: 'जोडले खोक्न प्रोत्साहन दिनुहोस्' },
                      outcome: { en: 'Yes — back on the right track.', np: 'हो — सही बाटोमा फर्कियो।' },
                      correct: true,  next: 'n2' },
                    { label:   { en: 'Slap their back randomly', np: 'बेतर्तिब तरिकाले ढाड हिर्काउनुहोस्' },
                      outcome: { en: 'Not yet — first get them to try coughing.', np: 'अहिले होइन — पहिले खोक्न लगाउनुहोस्।' },
                      correct: false, next: 'n1' }
                ]
            },
            n2: {
                situation: {
                    en: 'They still cannot cough it out. What do you do next?',
                    np: 'अझै खोकेर निकाल्न सकेनन्। अब तपाईं के गर्नुहुन्छ?'
                },
                choices: [
                    { label:   { en: 'Give 5 firm back blows between the shoulder blades', np: 'कुमको बीचमा ५ पटक बलियोसँग ढाडमा हिर्काउनुहोस्' },
                      outcome: { en: 'Correct first-aid response.', np: 'सही प्राथमिक उपचार प्रतिक्रिया।' },
                      correct: true,  next: 'end_ok' },
                    { label:   { en: 'Do nothing and wait', np: 'केही नगरी पर्खनुहोस्' },
                      outcome: { en: 'Dangerous — you must act quickly.', np: 'खतरनाक — तपाईंले छिटो कार्य गर्नुपर्छ।' },
                      correct: false, next: 'end_bad' }
                ]
            },
            end_ok: {
                terminal: true,
                situation: {
                    en: 'The airway clears and your friend can breathe again. Well done!',
                    np: 'श्वासनली खुल्यो र तपाईंको साथीले फेरि सास फेर्न सक्छन्। धेरै राम्रो!'
                }
            },
            end_bad: {
                terminal: true,
                situation: {
                    en: 'The situation got worse. Restart and try a safer set of choices.',
                    np: 'अवस्था झन् बिग्रियो। फेरि सुरु गरी बढी सुरक्षित छनोटहरू प्रयास गर्नुहोस्।'
                }
            }
        }
    }

};
