var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/Gomoku"

module.exports = function() {

	this.insertGame = function(gameId, moves) {
		MongoClient.connect(url, function(err, db) {
			var collection = db.collection('games');			
			collection.insert({
				_id: gameId,
				moves: moves
			}, function(err, result) {
				if(err) {
					console.log("MongoDB error: " + err);
				}
				db.close();
			});
		});
	};

	this.printAllGames = function() {
		MongoClient.connect(url, function(err, db) {
			var collection = db.collection('games');
			collection.find({}).toArray(function(err, docs) {
				if(err) {
					console.log("MongoDB error: " + err);
				}
				console.log(docs);
			});
			if(err) {
				console.log("MongdoDB error: " + err);
			}
		});
	}
	
}