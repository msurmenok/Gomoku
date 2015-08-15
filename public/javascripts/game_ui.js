var socket = io.connect();
var activePlayerID;
var players = [];
var inputSide = ["#sideX", "#sideO"];
var gameOver = false;

var canvas = document.getElementById("gameField");
	
	//drawing game field
	function drawGrid() {		
		var ctx = canvas.getContext("2d");
		ctx.beginPath();

		//drawing grid
		var gridStep = canvas.width/20;
						
		for(var i = gridStep; i < 600; i+=gridStep) {
			ctx.moveTo(i, 0);
			ctx.lineTo(i, 600);
			ctx.moveTo(0, i);
			ctx.lineTo(600, i);
		}
		ctx.strokeStyle="#a3a3a3";
		ctx.stroke();
	}

	//drawing moves
	function drawMove(x, y, playerId) {

		var shape = canvas.getContext("2d");

		shape.beginPath();

		if(playerId === players[0]) {
			shape.moveTo((x-1)*gridStep + 5, (y-1)*gridStep + 5);
			shape.lineTo(x*gridStep -5, y*gridStep - 5);
			shape.moveTo(x*gridStep - 5, (y-1)*gridStep + 5);
			shape.lineTo((x-1)*gridStep + 5, y*gridStep - 5);
			shape.strokeStyle = "green";					
		} else if(playerId === players[1]) {
			shape.arc(x*gridStep - gridStep/2, y*gridStep - gridStep/2, gridStep/2 - 5, 0, 2 * Math.PI);
			shape.strokeStyle = "blue";
		}

		shape.stroke();
	}

	//give user new user id
	socket.on('setUserID', function(newId) {
		socket.userID = newId;
		$("#info").text("new userID = " + newId);
		//socket.emit('join', socket.userID)
	});	

	//join to room
	socket.on('joinResult', function(answer) {
		var room = answer.room;
		$("#roomName").text("You are in the room: " + room);

		activePlayerID = answer.activePlayerID;
		players = answer.players;
		gameOver = answer.gameOver;

		var grid = answer.grid;
		drawGrid();

		for(var i = 0; i < grid.length; i++) {
			drawMove(grid.x, grid.y, grid.playerID);
		}

	});



	//Choose side 
	//Check if current side is available
	$("#sideX").click(function() {
		socket.emit('verifySide', {id: socket.userID, side: 0});
	});

	$("#sideO").click(function() {
		socket.emit('verifySide', {id: socket.userID, side: 1});
	});


	socket.on('attemptSide', function(answer) {
		if(answer.success) {
			var id = answer.id;
			var side = answer.side;
			players[side] = id;
			var message = "You are " + (side === 0 ? "X" : "O");
			$("#sideInfo").text(message);
			$(inputSide[0]).remove();
			$(inputSide[1]).remove();
		}
		else {
			var message = "Sorry, side " + (answer.side === 0 ? "X" : "O") + " has already choosen";
			$("#sideInfo").text(message);
		}
	});

	//erase side if it had already choosen
	socket.on('playerChoosen', function(answer) {
		var id = answer.userId;
		var side = answer.side;
		players[side] = id;
		$(inputSide[side]).remove();
	})

	//assign active player and start the game
	socket.on('gameStarted', function(answer) {
		activePlayerID = answer.activePlayerID;
	});

	canvas.addEventListener('click', function(e) {
		//calculate canvas position and mouse position
		var canvasPosition = {
			x: $("#gameField").offset().left,
			y: $("#gameField").offset().top
		}

		var mouse = {
			x: e.pageX - canvasPosition.x,
			y: e.pageY - canvasPosition.y 
		}

		var positionX = Math.ceil(mouse.x / gridStep);
		var positionY = Math.ceil(mouse.y / gridStep);
		//emit new move

		if(/*socket.userID === activePlayerID &&*/
			positionX > 0 && positionX < 21 &&
			positionY > 0 && positionY < 21) {
			socket.emit('move', socket.userID, positionX, positionY);
		}
	});

	//move
	socket.on('moveDone', function(answer) {
		//{ userId: userId, activePlayerID: this.activePlayerID, x: x, y: y }
		console.log(answer);
		var prevActivePlayer = answer.userId;
		activePlayerID = answer.activePlayerID;
		var x = answer.x;
		var y = answer.y;
		gameOver = answer.gameOver;

		var shape = canvas.getContext("2d");

		shape.beginPath();

		if(prevActivePlayer === players[0]) {
			shape.moveTo((x-1)*gridStep + 5, (y-1)*gridStep + 5);
			shape.lineTo(x*gridStep -5, y*gridStep - 5);
			shape.moveTo(x*gridStep - 5, (y-1)*gridStep + 5);
			shape.lineTo((x-1)*gridStep + 5, y*gridStep - 5);
			shape.strokeStyle = "green";					
		} else if(prevActivePlayer === players[1]) {
			shape.arc(x*gridStep - gridStep/2, y*gridStep - gridStep/2, gridStep/2 - 5, 0, 2 * Math.PI);
			shape.strokeStyle = "blue";
		}

		shape.stroke();

		if(gameOver) {
			alert("Game over");
		}
	});

	//create New Game
	$("#newGame").click(function() {
		socket.emit('createNewGame', socket.userID);
	});

	//watch curren Rooms	
	socket.on('rooms', function(rooms) {
    	$('#room-list').empty();
	    for(var room in rooms) {
	      room = room.substring(1, room.length);
	      if (room != '') {
	      	var roomMessage = "<p> " + room + "</p>";
	        $('#room-list').append(roomMessage);
	      }
	    }
	});


	

