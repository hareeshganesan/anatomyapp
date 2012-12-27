/*

phases:
	1) loading
	2) actual game
	3) correction

user flow:
	1) allow user to select the type of match that they want
		a) select and display columns
		b) selection of multiple choice or exact answer
	2) query the database for a pairing and display
		a) for exact answer, display a text box
		b) for multiple choice, display the match and the choices
	3) tell the user if they were correct or incorrect
		a) maintain a system of whether the user gets the answer correct or not
*/

// Set up a collection to contain muscle information. On the server,
// it is backed by a MongoDB collection named "muscles".

Muscles = new Meteor.Collection("muscles");
var potentialData=null;


function CSVToArray( strData, strDelimiter ){
    	// Check to see if the delimiter is defined. If not,
    	// then default to comma.
    	strDelimiter = (strDelimiter || ",");
    	// Create a regular expression to parse the CSV values.
    	var objPattern = new RegExp(
    		(
    			// Delimiters.
    			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

    			// Quoted fields.
    			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

    			// Standard fields.
    			"([^\"\\" + strDelimiter + "\\r\\n]*))"
    		),
    		"gi"
    		);


    	// Create an array to hold our data. Give the array
    	// a default empty first row.
    	var arrData = [[]];

    	// Create an array to hold our individual pattern
    	// matching groups.
    	var arrMatches = null;


    	// Keep looping over the regular expression matches
    	// until we can no longer find a match.
    	while (arrMatches = objPattern.exec( strData )){

    		// Get the delimiter that was found.
    		var strMatchedDelimiter = arrMatches[ 1 ];

    		// Check to see if the given delimiter has a length
    		// (is not the start of string) and if it matches
    		// field delimiter. If id does not, then we know
    		// that this delimiter is a row delimiter.
    		if (
    			strMatchedDelimiter.length &&
    			(strMatchedDelimiter != strDelimiter)
    			){

    			// Since we have reached a new row of data,
    			// add an empty row to our data array.
    			arrData.push( [] );

    		}


    		// Now that we have our delimiter out of the way,
    		// let's check to see which kind of value we
    		// captured (quoted or unquoted).
    		if (arrMatches[ 2 ]){

    			// We found a quoted value. When we capture
    			// this value, unescape any double quotes.
    			var strMatchedValue = arrMatches[ 2 ].replace(
    				new RegExp( "\"\"", "g" ),
    				"\""
    				);

    		} else {

    			// We found a non-quoted value.
    			var strMatchedValue = arrMatches[ 3 ];

    		}


    		// Now that we have our value string, let's add
    		// it to the data array.
    		arrData[ arrData.length - 1 ].push( strMatchedValue );
    	}

    	// Return the parsed data.
    	return( arrData );
    }

function readData(name){
    var fs = __meteor_bootstrap__.require('fs');   
    var path = __meteor_bootstrap__.require('path');   
    var base = path.resolve('.');
    var data = fs.readFileSync(path.join(base, '/server/data/', name));
    return CSVToArray(data,"|");
}



if (Meteor.isClient) {
  Template.leaderboard.muscles = function () {
    return Muscles.find({}, {sort: {origin: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var muscle = Muscles.findOne(Session.get("selected_muscle"));
    return muscle && muscle.name;
  };

  Template.muscle.selected = function () {
    return Session.equals("selected_muscle", this._id) ? "selected" : '';
  };

  Template.leaderboard.events({
    'click input.inc': function () {
      Muscles.update(Session.get("selected_muscle"), {$inc: {score: 5}});
    }
  });

  Template.muscle.events({
    'click': function () {
      Session.set("selected_muscle", this._id);
    }
  });
}

// On server startup, create some muscles if the database is empty.
if (Meteor.isServer) {
  
  Meteor.startup(function () {
    if (Muscles.find().count() === 0) {
      var names = ["Semitendinosus",
					"Biceps Femoris - Long Head",
					"Flexor Hallucis Longus",
					"Psoas",
					"Gracilis"];
	  var origins = ["From common tendon with long head of biceps femoris from superior medial quadrant of the posterior portion of the ischial tuberosity",
						"Common tendon with semitendinosus from superior medial quadrant of the posterior portion of the ischial tuberosity",
						"Inferior 2/3 of posterior surface of fibula, lower part of interosseous membrane",
						"Anterior surfaces and lower borders of transverse processes of L1 - L5 and bodies and discs of T12 - L5",
						"Inferior margin of pubic symphysis, inferior ramus of pubis, and adjacent ramus of ischium"]
	  //insert the columns here
      for (var i = 0; i < names.length; i++)
        Muscles.insert({name: names[i], origin: origins[i]});
    }
	
	potentialData = readData("lower-body.csv");
	Muscles.insert({name:potentialData[0], origin: potentialData[1]});
	Muscles.insert({name:potentialData[2], origin: potentialData[3]});
	Muscles.insert({name:potentialData[4], origin: potentialData[5]});
  });
}

