var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var uuid = require('node-uuid');
var html = fs.readFileSync('./public/index.html', 'utf8');

function handler(req, res) {
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
	res.write(html);
	res.end();
}


//work with game logic
var maxPlayers = 2;
var numberOfPlayers = 0;
var players = [];
var grid = [];
var activePlayerID;

io.sockets.on('connection', function(socket) {
	socket.userID = uuid.v1(); // generate unique userID
	console.log(players.length);
	players.push(new Player(socket.userID, getSide(players)));

	activePlayerID = players[0].id;
	
	
	socket.emit('setUserId', socket.userID);
	console.log(players);

	if(players.length == 2) {
		io.sockets.emit('startGame', activePlayerID)
	}

	socket.on('move', function(newX, newY, playerID) {
		console.log("x: " + newX + " y: " + newY + " id: " + playerID);
		if(playerID != activePlayerID) {
			return;
		}

		for(var i = 0; i < grid.length; i++) {
			if(grid[i].x === newX && grid[i].y === newY) {
				return;
			}
		}
		grid.push(new Move(newX, newY, activePlayerID));

		if(players[0].id === playerID) {
			activePlayerID = players[1].id;
		} else {
			activePlayerID = players[0].id;
		}

		//change active player and redraw game field
		io.sockets.emit('changeActivePlayer', activePlayerID, grid[grid.length - 1].x, grid[grid.length - 1].y, grid[grid.length - 1].playerID,
			players[0].id, players[1].id);
		console.log("active player id: " + activePlayerID);
		console.log(grid);
	});
	
});



//constructor for Player
function Player(id, side) {
	this.id = id;
	this.side = side;
}

function Move(x, y, playerID) {
	this.x = x,
	this.y = y,
	this.playerID = playerID
}
//return side based on number of players
// ' ' - spectators
var getSide = function(array){
	switch(array.length) {
		case 0: 
			return 'X';
			break;
		case 1:
			return 'O';
			break;
		default:
			return ' ';
	}
}
 
app.listen(8000);
console.log("Server started");