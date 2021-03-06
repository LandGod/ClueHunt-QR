
const dbi = {
    database: firebase.database(),

    saveNewGame: function (gameName, clueList, hintList) {
        // Method that creates a new directory in the database, which will hold all the info we need about our game

        // First let's grab the currently logged-in user's user ID since we'll want to store the game info inside a folder of that name for authentication purposes
        let gameOwner = authentication.uID();

        // Create new directory, inside a folder named after the creator's user ID, in database containing the name of the game under 'gameName'
        // Save name of new directory to variable gameID (use gameID.key for actual directory name)
        gameID = this.database.ref(gameOwner).push({ 'gameName': gameName });

        // Add list of clues to the unordered clue repository and grab the location for each
        // then add the location to the game directory under directory/'clues'/cluenumber (indexed from zero)

        // Iterate through list of clues
        for (let i = 0; i < clueList.length; i++) {
            // Construct unique path using current game directory and current list index (indexed from zero) for clue reference location
            let gamePath = `${gameOwner}/${gameID.key}/clues/${i}`;

            // Store clue in clue bucket and grab firebase generated memory location that it was put into
            let clueLocation = this.database.ref('clues').push(clueList[i]);

            // Add clue location refence to game clue list
            this.database.ref(gamePath).set(clueLocation.key);
        };

        // Add list of clue hints to directory under directory/'hints'/cluenumber (indexed from zero)
        // Same as above
        for (let i = 0; i < hintList.length; i++) {
            let path = `${gameOwner}/${gameID.key}/hints/${i}`;
            this.database.ref(path).set(hintList[i]);
        };

        // Return game's server location so that we can reference it again easily after creation
        return gameID.key;
    },

    updateGame: function (gameID, clueList, hintList, callback = function () { }) {
        // Method that updates an existing directory in the database, which will holds all the info we need about our game

        // First let's grab the currently logged-in user's user ID since we'll want to store the game info inside a folder of that name for authentication purposes
        let gameOwner = authentication.uID();

        // Grab the list of clue locations from the existing database 
        this.database.ref(`${gameOwner}/${gameID}/clues/`).once('value', (snapshot) => {

            let clueHandle = snapshot.val();

            // Create an object to hold all updates we'll make
            let updates = {};

            // Figure out which is longer, updated or old list and use that length for iteration
            let longerListLength;
            if (clueHandle.length > clueList.length) { longerListLength = clueHandle.length }
            else { longerListLength = clueList.length };

            // Iterate through new list of clues
            for (let i = 0; i < longerListLength; i++) {

                // For each item, check to see if a database already contains an entry
                // If so, replace it, if not, create it
                if (clueHandle[i] && clueList[i]) {

                    // For updates, we'll add them all to one objects that we'll push to the db all at once later
                    updates[`clues/${clueHandle[i]}`] = clueList[i];
                    updates[`${gameOwner}/${gameID}/hints/${i}`] = hintList[i];
                }
                else if (clueList[i]) {
                    // For additions, we'll push new clue text now, then add the referce id that gets stored with the rest of the game
                    // to the update object
                    let thatID = this.database.ref('clues').push(clueList[i]).key;
                    updates[`${gameOwner}/${gameID}/clues/${i}`] = thatID;
                    updates[`${gameOwner}/${gameID}/hints/${i}`] = hintList[i];
                }
                else if (clueHandle[i]) {
                    // And if the update has removed a clue, the we set it to null in the database
                    updates[`${gameOwner}/${gameID}/clues/${i}`] = null;
                    updates[`${gameOwner}/${gameID}/hints/${i}`] = null;
                    updates[`clues/${clueHandle[i]}`] = null;
                }
                else { throw ('Something is very broken and you should show this error to Dan.') };
            };

            // After doing all of that, we need to push our big fat object full of all of our updates to the server
            this.database.ref().update(updates).then(callback);

        });


    },

    getGames: function (callback) {
        // Queries the database for games owned by the specified user
        // Returns a list of game names and directory names for the games in the form of {name: 'game name', id : 'directoryID'} to a callback function
        // Returns null to the callback function if user hase no saved games in the database

        // Start by grabbing the contents of the directory
        // Note that because we will need to use this.database again with this function,
        // we need to setup our callback using arrow notation so that the 'this' keyword retains the same value inside the
        // callback function despite that callback being invoked elsewhere
        this.database.ref(authentication.uID()).once('value', (snapshot) => {

            // If user has no games saved, then abort the rest of this function and return null
            if (!snapshot.val()) {
                callback(null)
            }

            // If, however, the user does have at least one saved game, we can get into the actual meat of this function
            else {

                // For storing our output
                let userGames = [];

                // Generates a list of the database locations for every user game
                let gameIDs = Object.keys(snapshot.val())

                // Iterate through database locations to grab the user set name for each game
                for (let i = 0; i < gameIDs.length; i++) {

                    // Then we construct an object with our two values, before pushing it to our userGames list
                    userGames.push({ name: snapshot.val()[gameIDs[i]].gameName, id: gameIDs[i] });

                };

                // Once we're all finished grabbing values out of our snapshot and appending them to our userGames array
                // in object form, we'll return the array.
                callback(userGames);
            }
        });
    },

    getSingleGame: function (gameID, callback) {
        // Using an already known game ID, attempt to retrieve all information for a game under 
        // that game ID, under the given user's files
        // An object will be returned to the callback function in the following format:
        // {name: 'Name of Game', clues: ['array', 'of', 'clue', 'text', 'in', 'order'], hint: ['array', 'of', 'hint', 'text', 'in', 'order']}
        // ie: {name: 'string', clues: ['strings'], hints: ['strings']}

        this.database.ref(`${authentication.uID()}/${gameID}`).once('value', (snapshot) => {

            // If the game does not exist, return null
            if (!snapshot.val()) {
                callback(null)
            }

            // If, however, the user does have info saved under this gameID, contruct an object from the returned snapshot
            else {

                // First lets get the useable object out of the snapshot
                let snapVal = snapshot.val();

                // Create return object with value for name and empty lists for clues and hints
                let singleGame = { name: snapVal.gameName, clues: [], hints: [], clueCodes: [] };

                // Iterate through clue and hints list at the same time (since they must be the same length anyway)
                for (let i = 0; i < snapVal.clues.length; i++) {

                    // Grab hint straight from snapshot and add to hint list in singleGame object
                    singleGame.hints.push(snapVal.hints[i]);
                    singleGame.clueCodes.push(snapVal.clues[i]);

                    // Then asynchronously grab the clue text using the codes from our snapshot
                    this.database.ref(`clues/${snapVal.clues[i]}`).once('value', (subSnapshot) => {

                        // add clue text to list in singleGame object via index
                        singleGame.clues[i] = (subSnapshot.val());

                        // If all other asynchronous callback have already resolved, then pass the 
                        // completed object to the callback function
                        if (singleGame.clues.length === snapVal.clues.length) {
                            callback(singleGame);
                        };
                    });
                };
            }
        });
    },

    getClue: function (clueID, callback) {
        // takes the big long random number specifying the directory that our clue text is stored in
        // adds the leading '-' to it and then
        // plugs that in to a database GET and then returns the .val (which is just the text of our clue)
        // to our callback function
        this.database.ref(`clues/-${clueID}`).once('value', (snapshot) => {
            callback(snapshot.val());

        });

    },

    getClueFromGame: function (gameID, clueNumber, callback) {
        // Basically we just plug our arguments into a path and that leads straight to our clue refer code.
        // Then we just call .val() on our snapshot and pass that to a new database get, which should then return a snapshot with the actual
        // clue text, which we then pass to the callback with .val to grab the actual text from the snapshot object
        this.database.ref(`${authentication.uID()}/${gameID}/clues/${clueNumber}`).once('value', (snapshot) => {
            this.database.ref(`clues/${snapshot.val()}`).once('value', (subSnapshot) => {
                callback(subSnapshot.val())
            });
        });
    },

    getHint: function (gameID, hintNumber, callback) {
        // takes the big long random number specifying the directory that data for a game is stored in,
        // the number (indexed from zero) of the clue/hint desired,
        // and a callback function
        // Queries the database for the specified clue, and returns the clue text to the callback function


        // Basically we just plug our arguments into a path and that leads straight to our clue text.
        // Then we just call .val() on our snapshot and pass that to the callback
        this.database.ref(`${authentication.uID()}/${gameID}/hints/${hintNumber}`).once('value', (snapshot) => {
            callback(snapshot.val())
        });


    },

}
