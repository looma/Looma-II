// filename: importGames.js
/*
  importGames.js is a MongoDB shell script that reads game JSON files from a local directory (data files/games), validates them, checks for duplicates, and inserts new games
  into both the games and activities collections. It supports a dry-run mode via a param variable.
*/
// script to read new game JSON files, verify them and load into "games" collection and "activities" collection
//      set a variable named "param" to "run" to actually make changes to the database, or "dryrun" to just print the changes
//          run in MONGO SHELL with: load('importGames.js')
//
//  author: Skip
//  2026 01 17, 2026 06 10
//
/*
    read files in "/Users/skip/Desktop/temp/games"
    for each file, verify the JSON using game format rules
        [only rudimentary checks are done for now. need to expand verify tests]
    check for previously existing game with this 'title'
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

function gameExists(gamejson) {
    print ('                TITLE is: ' +  gamejson.title);
    var existingActivity = db.games.findOne({title:gamejson.title});
    if ( existingActivity ) {
        print (" - - - - - - - game already exists: " + gamejson.title + ' with _ID ' + existingActivity._id);
        return true;
    }
    else return false;
}
function verifyGame(gamejson) {
    if (! gamejson.presentation_type) {
        print(" for " + gamejson.title + " presentation_type is missing");
        return false;
    }

    const gameTypes = db.games.distinct('presentation_type');
    if (! gameTypes.includes(gamejson.presentation_type)) {
        print (" for "  + gamejson.title + " presentation_type '" + gamejson.presentation_type + "' is not legal");
        return false;
    }

    //
    // put lots more game verification logic here
    //
    return true;
}; // end verifyGame()

function registerGame(gamejson) {

    print ("adding game: " + gamejson.title);

    var result = db.games.insertOne(gamejson);

    var gamelang = (gamejson['lang']) ? gamejson['lang'] : 'both';
    var newActivity = {dn:gamejson.title,mongoID:result.insertedId,
                   ft:'game',thumb:'images/games.png',ch_id:[gamejson.ch_id],
                   lang:gamelang,
                   date:today()};

    db.activities.insertOne(newActivity);

    //printjson(newActivity);
}; // end registerGame()

var count = 0; var good = 0; var bad = 0; var exists = 0;

const dirPath = 'data files/games';  // Replace with your directory path

const games = listFiles(dirPath);  // Returns array of file info objects [web:14]

games.forEach(function(file) {
    let game = {};
    var basename;
    count++;
    if (!file.isDirectory) {  // Skip subdirectories
        //const content = fs.readFileSync(file.name, 'utf8');  // Read file content [web:3][web:10]
        const content = cat(file.name);
        basename = file.name.split('/').pop();  // Extract filename
        try {
            print (count + ' processing file name ' + basename);
            game = JSON.parse(content);  // Parse to JSON object [web:10]
        }
        catch (e) {
            print('.    JSON parse error in ' + basename + ': ' + e.message);
            game = {};  // Keep as string if not valid JSON
        }

    if ( ! verifyGame(game)) {
        bad++;
        print('                Invalid game JSON in file named ' + basename);
    } else
    if (gameExists(game)) {
        exists++;
        print('                Existing game with title = '  + game.title);
    } else {
        good++;
      // printjson(game);  // Outputs the game object/variable
      if (param === 'run') {
          game['date'] = today();
          registerGame(game);
          print('processed New Game number' + count + ' with title ' + file.name);
      } else print('                OK');
    }
    }
});

print (' found ' + bad + ' invalid JSON files');
print (' found ' + exists + ' existing files');
if (param === 'run')  print (' processed ' + good + ' games');
else                  print ('DRYRUN: would have processed ' + good + ' new games');
