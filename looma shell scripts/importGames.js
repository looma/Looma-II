// filename: importGames.js
//
// ONE TIME read new game JSON files, verify them and load into "games" collection and "activities" collection
//          run in MONGO SHELL with: load('importGames.js')
//
//  author: Skip
//  2026 01 17
//
/*
    read files in "/Users/skip/Desktop/temp/games"
    for each file, verify the JSON using game format rules
    load the game into db.games collection
    register the game into db.activities collection with ch_id's from the JSON
 */


function verifyGame(gamejson) {
    const gameTypes = ['matching','sort','concentration',
         'spoken matching','picture matching','multiple choice',
         'picture concentration','spoken to picture','spoken picture concentration',
         'spoken concentration','map'];

    if (! gameTypes.includes(gamejson.presentation_type)) return false;

    //
    // put lots more game verification lagic here
    //
    return true;
}; // end verifyGame()

function registerGame(gamejson) {
    print ("adding game: " + gamejson.title);
    var result = db.games.insertOne(gamejson);
    newActivity = {dn:gamejson.title,mongoID:result.insertedId,lang:'en',
                   ft:'game',thumb:'images/games.png',ch_id:[gamejson.ch_id],
                   lot:'WRP II Lot 2'};
    db.activities.insertOne(newActivity);
    printjson(newActivity);
}; // end registerGame()

var count = 0;
const dirPath = '/Users/skip/Desktop/temp/games';  // Replace with your directory path

const games = listFiles(dirPath);  // Returns array of file info objects [web:14]

const game = {};

games.forEach(function(file) {
    var basename;
    count++;
    if (!file.isDirectory) {  // Skip subdirectories
        const content = fs.readFileSync(file.name, 'utf8');  // Read file content [web:3][web:10]
        basename = file.name.split('/').pop();  // Extract filename
        try {
            game[basename] = EJSON.parse(content);  // Parse to JSON object [web:10]
        } catch (e) {
            game[basename] = content;  // Keep as string if not valid JSON
        }
    }
    print(count + ' ' + file.name);
  if (verifyGame(game[basename])) {
      printjson(game[basename]);  // Outputs the game object/variable
      if (param = 'run') {
        registerGame(game[basename]);
      }
    }
  else
        print('Invalid game JSON');
});

print (' processed ' + count + ' games');
