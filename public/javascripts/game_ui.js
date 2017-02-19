var socket = io.connect();
var activePlayerID;
var players = [];
var inputSide = ["#sideX", "#sideO"];
var gameOver = false;


	
	//drawing game field
	function drawGrid(canvas, gridStep) {

		var ctx = canvas.getContext("2d");
		ctx.beginPath();

		//drawing grid						
		for(var i = gridStep; i < 570; i+=gridStep) {
			ctx.moveTo(i, 0);
			ctx.lineTo(i, 570);
			ctx.moveTo(0, i);
			ctx.lineTo(570, i);
		}
		ctx.strokeStyle="#a3a3a3";
		ctx.stroke();
	}

	//drawing moves


	function drawMove(grid, canvas, gridStep) {
		//erase previous figures
		var context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);

		drawGrid(canvas, gridStep);

		for(var i = 0; i < grid.length; i++) {
			var shape = canvas.getContext("2d");
			var playerId = grid[i].playerID;
			var x = grid[i].x;
			var y = grid[i].y;
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

			if(i === grid.length - 1) {
				//indicate last move and draw it bolder
				shape.lineWidth=3;
			}
			shape.stroke();
			shape.lineWidth=1;
		}

		
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

		//remove previous elements
		$("#gameContainer h3").remove();
		$("#gameContainer div").remove();
		$("#canvasContainer canvas").remove();

		//add html elements
		$('<h3>Choose a side:</h3>').appendTo("#gameContainer");

		if(!players[0]) {
			$('<div id="sideX"><input type="radio" name="side" ><strong>X</strong></div>').appendTo("#gameContainer");
		}

		if(!players[1]) {
			$('<div id="sideO"><input type="radio"name="side" ><strong>O</strong></div>').appendTo("#gameContainer");
		}

		$('<p id="sideInfo"></p>').appendTo("#gameContainer");
		$('<canvas id="gameField" width="570" height="570" style="border: 1px solid #c3c3c3;"></canvas>').appendTo("#canvasContainer");

		var canvas = document.getElementById("gameField");
		var gridStep = canvas.width/19;

		var grid = answer.grid;
		drawGrid(canvas, gridStep);

		console.log(grid);

		//drawMove
		drawMove(grid, canvas, gridStep);

		//calculate canvas position and mouse position
		canvas.addEventListener('click', function(e) {			
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

			if(	positionX > 0 && positionX < 20 &&
				positionY > 0 && positionY < 20) {
				socket.emit('move', socket.userID, positionX, positionY);
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
	});

	socket.on('moveDone', function(answer) {

		var canvas = document.getElementById("gameField");
		var gridStep = canvas.width/19;
		console.log(answer);
		var prevActivePlayer = answer.userId;
		activePlayerID = answer.activePlayerID;
		var grid = answer.grid;
		gameOver = answer.gameOver;

		//draw last move
		drawMove(grid, canvas, gridStep);

		if(gameOver) {
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = "red";
			ctx.font = "70px Arial";			
			ctx.lineWidth=10;
			ctx.fillText("GAME OVER", 75, 300);
		}
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



	

	//create New Game
	$("#newGame").click(function() {
		//delete joinrResult listener
		socket.emit('createNewGame', socket.userID);
	});

	//watch curren Rooms	
	socket.on('rooms', function(rooms) {
    	$('#room-list').empty();
	    for(var room in rooms) {
	      room = room.substring(1, room.length);
	      if (room != '') {
	      	var roomMessage = "<div>" + room + "</div>";   	
	      	$(roomMessage).appendTo("#room-list");
	      }
	    }

		//join to Game
	    $('#room-list div').click(function(e) {
	    	//delete joinResult listener
	        socket.emit('joinGame', socket.userID, $(e.target).text());
	    });
	});

	socket.emit('rooms');


	

