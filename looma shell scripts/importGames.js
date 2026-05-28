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
        [rudimentary for now. need to expand verify tests]
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
    const gameTypes = ['matching','sort','concentration',
         'spoken matching','picture matching','multiple choice',
         'picture concentration','spoken to picture','spoken picture concentration',
         'spoken concentration','map'];

    if (! gameTypes.includes(gamejson.presentation_type)) return false;

    //
    // put lots more game verification logic here
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
                   date:today()};

    db.activities.insertOne(newActivity);

    //printjson(newActivity);
}; // end registerGame()

var count = 0; good = 0; var bad = 0; var exists = 0;

const dirPath = 'data files/games';  // Replace with your directory path

const games = listFiles(dirPath);  // Returns array of file info objects [web:14]
var good = 0;

games.forEach(function(file) {
    let game = {};
    var basename;
    count++;
    if (!file.isDirectory) {  // Skip subdirectories
        const content = fs.readFileSync(file.name, 'utf8');  // Read file content [web:3][web:10]
        basename = file.name.split('/').pop();  // Extract filename
        try {
            print (count + ' processing file name ' + basename);
            game = EJSON.parse(content);  // Parse to JSON object [web:10]
        }
        catch (e) {
            game = content;  // Keep as string if not valid JSON
        }
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
});

print (' found ' + bad + ' invalid JSON files')p;
print (' found ' + exists + ' existing files');
if (param === 'run')  print (' processed ' + good + ' games');
else                  print ('DRYRUN: would have processed ' + good + ' new games');
