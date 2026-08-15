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
    // below are the author's tree, used verbatim. Nepali (np) pending translation.
    snakebite: {
        presentation_type: 'branching',
        ft: 'game',
        title: { en: 'Snakebite', np: '' },
        start: 'n0',
        nodes: {
            n0: {
                situation: { en: "You're walking in tall grass with a friend when a snake bites their ankle and slithers away. Your friend is scared and starting to panic. What do you do first?", np: '' },
                choices: [
                    { label:   { en: 'Move both of you a safe distance from where the snake went', np: '' },
                      outcome: { en: "Right. Get clear so it can't strike again — then help safely.", np: '' },
                      correct: true, next: 'n1' },
                    { label:   { en: 'Chase and kill the snake so doctors can identify it', np: '' },
                      outcome: { en: "Don't — chasing it risks a second bite, and hospitals treat based on symptoms, not the snake. Let's keep going.", np: '' },
                      correct: false, next: 'n1' }
                ]
            },
            n1: {
                situation: { en: "You're both safe now. Your friend is panicking and wants to run to the village for help. What do you tell them?", np: '' },
                choices: [
                    { label:   { en: "Stay calm and completely still — I'll bring help to you", np: '' },
                      outcome: { en: 'Correct. Fear and movement pump venom faster. Staying calm and still is the single most important thing.', np: '' },
                      correct: true, next: 'n2' },
                    { label:   { en: 'Run together to the village as fast as possible', np: '' },
                      outcome: { en: "Running speeds venom through the body — but this isn't fatal on its own. Get them to stay still now. Let's continue.", np: '' },
                      correct: false, next: 'n2' }
                ]
            },
            n2: {
                situation: { en: "Your friend is calm and sitting down. Their ankle is beginning to swell, and they're wearing an anklet and a tight sock on that leg. What now?", np: '' },
                choices: [
                    { label:   { en: 'Gently remove the anklet and loosen the sock before swelling traps them', np: '' },
                      outcome: { en: 'Good. Remove tight items early — once swelling sets in they can cut off blood flow.', np: '' },
                      correct: true, next: 'n3' },
                    { label:   { en: 'Tie a tight band above the bite to stop the venom spreading', np: '' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_dead_tourniquet' }
                ]
            },
            n3: {
                situation: { en: 'The bitten leg needs to be kept still. How do you position and secure it?', np: '' },
                choices: [
                    { label:   { en: 'Keep the leg still at about heart level and splint it like a broken bone', np: '' },
                      outcome: { en: 'Exactly right. A still limb at heart level slows the spread of venom.', np: '' },
                      correct: true, next: 'n4' },
                    { label:   { en: 'Cut the bite open and suck the venom out', np: '' },
                      outcome: { en: '', np: '' },
                      correct: false, next: 'end_dead_cut' }
                ]
            },
            n4: {
                situation: { en: 'The limb is splinted. How does your friend get to the hospital with antivenom?', np: '' },
                choices: [
                    { label:   { en: "Carry them or arrange transport — don't let them walk", np: '' },
                      outcome: { en: 'Correct. Get to antivenom fast, but keep them still — walking pumps venom. Carry them if you can.', np: '' },
                      correct: true, next: 'end_ok' },
                    { label:   { en: 'Give them strong coffee to keep them alert on the walk', np: '' },
                      outcome: { en: "No coffee, alcohol, or stimulants — and don't let them walk. Carry them. Let's get them there.", np: '' },
                      correct: false, next: 'end_ok' }
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
