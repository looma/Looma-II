// checker.module.js

const fs = require("fs");
const Typo = require("typo-js");

// Point this to where your Hunspell files are located
const dictionary = new Typo("en_US", false, false, {
  dictionaryPath: "/Users/skip/Desktop/dictionary" // contains en_US.aff, en_US.dic
});

// Core API: check a single word
function checkWord(word) {
  return dictionary.check(word);
}

// Optional helper: check a list of words
function checkWords(words) {
  return words.map(w => ({
    word: w,
    ok: dictionary.check(w)
  }));
}

// Export as a Node module
module.exports = {
  checkWord,
  checkWords
};

// If run directly (node checker.module.js), process files
if (require.main === module) {
  const inputFile = "wordlist.txt";
  const goodFile = "goodwords.txt";
  const badFile = "badwords.txt";

  // Read words from "wordlist" (one per line)
  const content = fs.readFileSync(inputFile, "utf8");
  const words = content
    .split(/\r?\n/)
    .map(w => w.trim())
    .filter(w => w.length > 0);

  const goodWords = [];
  const badWords = [];

  for (const w of words) {
    if (checkWord(w)) {
      goodWords.push(w);
    } else {
      badWords.push(w);
    }
  }

  // Write outputs, one word per line
  fs.writeFileSync(goodFile, goodWords.join("\n"), "utf8");
  fs.writeFileSync(badFile, badWords.join("\n"), "utf8");
}
