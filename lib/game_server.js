var socketio = require('socket.io');
var uuid = require('node-uuid');

var currentRoom = {};
var io;

exports.listen = function(server) {

	 io = socketio.listen(server);

	//class Game
	function Game(callback) {		
		this.grid = [];
		this.users = [];
		this.players = [false, false];
		this.activePlayerID;
		this.gameOver = false;

		var self = this;
		
		this.join = function(userId) {
			this.users.push(userId);
 		}

		this.move = function(userId, x, y) {
   			if(this.gameOver) {
   				return;
   			}

   			if(this.activePlayerID != userId) {
   				console.log('It is not an active player');
   				return;
   			}

   			for(var i = 0; i < this.grid.length; i++) {
   				if(this.grid[i].x === x && this.grid[i].y === y) {
   					return;
   				}
   			}

   			this.grid.push(new Move(x, y, userId));

   			if(this.players[0] === userId) {
   				this.activePlayerID = this.players[1];
   			}
   			else {
   				this.activePlayerID = this.players[0];
   			}

   			//check win
   			this.gameOver = this.isGameOverAccordingToTheMagnificentPavel(x, y, userId);

   			callback('moveDone', { userId: userId, activePlayerID: this.activePlayerID, gameOver: this.gameOver, x: x, y: y });
		}

		this.isGameOverAccordingToTheMagnificentPavel = function(x, y, userId) {
			if(this.doesLineContainWinSequence(x, y, userId, 
				function(x, y, i, j) 
				{ 
					return self.grid[j].x === (x + i) &&
						self.grid[j].y === (y + i);
				})) {
				return true;
			}

			if(this.doesLineContainWinSequence(x, y, userId, 
				function(x, y, i, j) 
				{ 
					return self.grid[j].x === (x - i) &&
						self.grid[j].y === (y + i);
				})) {
				return true;
			}

			if(this.doesLineContainWinSequence(x, y, userId, 
				function(x, y, i, j) 
				{ 
					return self.grid[j].x === x &&
						self.grid[j].y === (y + i);
				})) {
				return true;
			}

			if(this.doesLineContainWinSequence(x, y, userId, 
				function(x, y, i, j) 
				{ 
					return self.grid[j].x === (x - i) &&
						self.grid[j].y === y;
				})) {
				return true;
			}

			return false;
		};

		this.doesLineContainWinSequence = function(x, y, userId, condition) {
			count = 0;

			for(var i = -4; i < 5; i++) {
				isFound = false;

				for(var j = 0; j < this.grid.length; j++) {
					if(condition(x, y, i, j) &&
						this.grid[j].playerID === userId) {
						count++;
						isFound = true;
						break;
					}
				}

				if(count === 5) {
					return true;
				}

				if(!isFound) {
					count = 0;
				}
			}

			return false;
		};

		this.chooseSide = function(userId, side) {
			if(!this.players[side]) {
				this.players[side] = userId;
				callback('playerChoosen', {userId: userId, side: side});

				if(this.players[0] && this.players[1]) {
					this.activePlayerID = this.players[0];
					console.log("\nACTIVE PLAYER IS " + this.activePlayerID);
					console.log("\n players: " + this.players);
					callback('gameStarted', {userId: userId, activePlayerID: this.activePlayerID});
				}
				return true;
			}
			else {
				return false;
			}
		} 
	}


	//---------------------------------

	function Move(x, y, playerID) {
		this.x = x,
		this.y = y,
		this.playerID = playerID
	}

	function createNewGame() {
		var game = new Game(function(eventName, eventValue) {
			switch(eventName) {
				case 'moveDone':
					io.sockets.in(currentRoom[eventValue.userId].room).emit('moveDone', eventValue);
					break;
				case 'playerChoosen':
					io.sockets.in(currentRoom[eventValue.userId].room).emit('playerChoosen', eventValue);
					break;
				case 'gameStarted':
					io.sockets.in(currentRoom[eventValue.userId].room).emit('gameStarted', eventValue);
					break;

			}
		});
		return game;
	}

	//---------------------------------

	io.on('connection', function(socket) {
		var newUserID = uuid.v1();
		socket.emit('setUserID', newUserID);

		/*socket.on('join', function(userId) {
			game.join(userId);
		});*/
		
		//create new game
		socket.on('createNewGame', function(userId) {
			var newRoom = uuid.v1();
			var newGame = createNewGame();

			socket.join(newRoom);

			currentRoom[userId] = {
				room: newRoom,
				game: newGame
			}

			currentRoom[userId].game.join(userId);
			
			socket.emit('rooms', io.sockets.manager.rooms);
			socket.emit('joinResult', {
						 room: currentRoom[userId].room,
						 grid: currentRoom[userId].game.grid,
						 players: currentRoom[userId].game.players, 
						 activePlayerID: currentRoom[userId].game.activePlayerID,
						 gameOver: currentRoom[userId].game.gameOver});
		});

		socket.on('move', function(userId, x, y) {
			currentRoom[userId].game.move(userId, x, y);
		});

		
		socket.on('verifySide', function(answer) {
			var id = answer.id;
			var side = answer.side;
			if(currentRoom[id].game.chooseSide(id, side)) {
				socket.emit('attemptSide', {id: id, side: side, success: true});
			}
			else {
				console.log("attemptSide send success: false");
				socket.emit('attemptSide', {id: id, side: side, success: false});
			}

		});

		//send list of rooms
		socket.on('rooms', function() {
      		socket.emit('rooms', io.sockets.manager.rooms);
    	});
		
	});


}