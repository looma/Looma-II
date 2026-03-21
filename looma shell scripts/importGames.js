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
    for each file, verify the JSON using game format rules [rudimentary for now. need to expand verify tests
    load the game into db.games collection
    register the game into db.activities collection with ch_id's from the JSON
 */

function today () {
        const today = new Date();

        const yyyy = today.getFullYear();
        const mm   = String(today.getMonth() + 1).padStart(2, '0'); // 01-12
        const dd   = String(today.getDate()).padStart(2, '0');      // 01-31
        return `${yyyy} ${mm} ${dd}`;
};  // end today()

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
    var gamelang = (gamejson['lang']) ? gamejson['lang'] : 'both';
    newActivity = {dn:gamejson.title,mongoID:result.insertedId,
                   ft:'game',thumb:'images/games.png',ch_id:[gamejson.ch_id],
                   lang:gamelang,
                   date:gamedate};
    db.activities.insertOne(newActivity);

    //printjson(newActivity);
}; // end registerGame()

var count = 0;
const dirPath = 'data files/games';  // Replace with your directory path

const games = listFiles(dirPath);  // Returns array of file info objects [web:14]

const game = {};
const gamedate = today();


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
  if (verifyGame(game[basename])) {
      // printjson(game[basename]);  // Outputs the game object/variable
      if (param === 'run') {
          game[basename]['date'] = gamedate;
          registerGame(game[basename]);
          print('processed ' + count + ' ' + file.name);
      } else print('DRYRUN: checking ' + count + ' ' + file.name);
    }
  else
        print('Invalid game JSON');
});

if (param === 'run')  print (' processed ' + count + ' games');
else                  print ('DRYRUN: would have processed ' + count + ' games');
