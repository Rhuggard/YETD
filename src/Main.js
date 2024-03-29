
$(document).ready(function(){
	//Prep
	$("#secondText").hide();

	//First Screen
	$( "#begin" ).click(function() {
	  $("#begin .tapSquareAnimation .ts1").addClass('animate');
	  $("#begin .tapSquareAnimation .ts2").addClass('animate');
	  $("#begin .tapText").addClass('animate');

	  $("#TitleScreen").addClass( "exit");
	  $("#OpeningScreen").removeClass( "offScreen");
	  rpgText($("#OpeningScreen .textWrapper"),$("#OpeningScreen .TextScreenHeading"), $("#OpeningScreen #openingText"));
	});


	// Second Screen Next button
	$( "#OpeningScreen .rhsTapLine" ).click(function() {
		$("#secondText").show();
		rpgText($("#OpeningScreen .textWrapper"), null, $("#OpeningScreen #secondText"));
		$(this).unbind('click');
		$( "#OpeningScreen .rhsTapLine span").text("Close");
		$(this).one("click",third);
	});

	function third(){

		$("#OpeningScreen").addClass( "exit");
		$("#GameScreen").removeClass( "offScreen");
		new game();

		// get rid of hint
		$('#tapAdjacentHint').click(function() {
				$(this).addClass('exit');
			});
		}
});


var map;
var player = {};

// Game Code
class game{
	constructor(){
			gameSetup(game);
	}
}

// MAP VIEW
function updateMapView(){
	playerPosition = player.pos;
	for (i = 0; i < game.mapView.x; i++){
		for (j = 0; j < game.mapView.y; j++){
			cell = new Vec2(i,j);
			cell.setClass('mapCell');
			// Cell logic
			if(playerPosition.x == i && playerPosition.y == j){
				cell.setSymbol("@");
			}else{
				t = map.getTile(cell).symbol;
				if(t == 'Y'){ cell.addClass('wall') };
				cell.setSymbol(t);
			}

			d = playerPosition.distanceTo(cell);
			if(d <= 1) {
				cell.addClass('canMoveCell');
			}
		}
	}
	cameraTo(playerPosition);
}

//UTILITY
class Dice {
	constructor(sides){
		this.sides = sides;
	}
  roll() {
    var randomNumber = Math.floor(Math.random() * this.sides) + 1;
    return randomNumber;
  }

}

// Map
class GameMap extends Array{

	constructor(x,y){
		super();
		this.x = x;
		this.y = y;
		// this.startingMap(x,y,this.getRandomTile);
		this.startingMap(x,y,function(){return new Tile(' ')});
		// this.arenaMap(x,y,this);
		this.dungeonMap(x,y,this);
		// this.startingMap(x,y,);
		this.downstairs = false;

		var freeTiles = this.listFreeTiles();
		for (var i = freeTiles.length - 1; i >= 0; i--) {
			var v = freeTiles[i];
			v.getCellReference().css('background-color','red');
		}

		player.pos = freeTiles[new Dice(freeTiles.length).roll()];
		buildMapView(x, y); //TODO: Perhaps only show part of the map
	}


	listFreeTiles(){
		return this.listTilesCondition(function(tile){
			if(tile.symbol == ' '){
				return true;
			}
			return false;
		});
	}

	// WIP
	listTilesCondition(conditionFunction){
		var list = new Array();
		for (var ix = 0; ix < this.x; ix++) {
			for (var jy = 0; jy < this.y; jy++) {
				if(conditionFunction(this[ix][jy])){
					list.push(new Vec2(ix,jy));
				}
			}
		}
		return list;
	}

	userCallback(scope){
		return function(x, y, value) {
			// SHOW(ROT.Util.format("Value %s generated at [%s,%s]", value, x, y));
			// console.log(" X: " + x + " Y: " + y + "Value: " + value);
			if(value){
				scope[x][y] = new Wall('Y');
			} else {
				scope[x][y] = scope.getRandomTile(scope);
			}
		}
	}

	arenaMap(x,y,scope){
		var ROTMap = new ROT.Map.Arena(x, y);
		ROTMap.create(scope.userCallback(scope));
	}

	dungeonMap(x,y,scope){
		ROT.RNG.setSeed(1234);
		var DMap = new ROT.Map.Digger(x,y);

		var addDoor = function(x, y) {
		    scope[x][y] = new Door('D');
		}

		var rooms = DMap.getRooms();
		for (var i=0; i<rooms.length; i++) {
		    var room = rooms[i];
		    SHOW(ROT.Util.format("Room #%s: [%s, %s] => [%s, %s]",
		        (i+1),
		        room.getLeft(), room.getTop(),
		        room.getRight(), room.getBottom()
		    ));

		    room.getDoors(addDoor);
		}
		DMap.create(scope.userCallback(scope));
	}

	startingMap(x,y, createTileFunc){
		// Build Map
		for (var i = 0; i < x; i++) {
			this[i] = new Array();
			for (var j = 0; j < y; j++) {
				this[i][j] = createTileFunc(this);
			}
		}
	}

	getRandomTile(scope){
		var t;
		var n = new Dice(20).roll();
		switch(n){
			case 1: t = new Chest('c');break;
			case 2: t = new Monster('e');break;
			case 3: if(!scope.downstairs){
				t = new Stairs('>');
				scope.downstairs = true;
			} else {
				t = new Tile(' ');
			}; break;
			case 4: t = new Wall(' ');
			default: t = new Tile(' ');
		}
		return t;
	}

	getTile(v){
		if(this.inBounds(v)){
			return this[v.x][v.y];
		} else {
			return new Wall('x');
		}
	}

	inBounds(v){
		if(v.x < 0 || v.y < 0 || v.x >= this.x || v.y >= this.y){
			return false;
		}else {
			return true;
		}
	}

}

class Tile{
	constructor(symbol){
		this.type = 'tile';
		this.symbol = symbol;
		this.passable = true;
		this.class = '';
	}

	runEncounter(){
		// Abstract for when player collides
	}
}

class Monster extends Tile{
	constructor(symbol){
		super(symbol);
		this.type = 'Monster';
		this.passable = false;
	}

	runEncounter(){
		this.class = 'death';
		this.passable = true;
	}
}

class Door extends Tile{
	constructor(symbol){
		super(symbol);
		this.type = 'door';
		this.passable = false;
	}

	runEncounter(){
		console.log('you walk into a door');
	}
}

class Stairs extends Tile{
	constructor(symbol){
		super(symbol);
		this.type = 'stairs';
		this.passable = true;
	}

	runEncounter(){
		alert('You WIN!');
	}
}

class Chest extends Tile{
	constructor(symbol){
		super(symbol);
		this.type = 'chest';
		this.passable = false;
	}

	runEncounter(){
		this.class = 'loot';
		this.passable = true;
	}
}

class Wall extends Tile{
	constructor(symbol){
		super(symbol);
		this.passable = false;
		this.class = 'wall';
	}
}

// Cache cell references as they rarely change and take a while to lookup
lookupCache = {};
// For performance testing and debugging caching
forceCacheOff = false;

// Vector Helpers
class Vec2 {

	constructor(x,y){
		this.x = x;
		this.y = y;
	}

	toString(){
		return " x: " + this.x + " y: " + this.y;
	}

	distanceTo(v){
		var dx = v.x - this.x;
		var dy = v.y - this.y;
		return Math.pow(dx,2) + Math.pow(dy,2);
	}

	setClass(c){
		this.getCellReference().attr('class', c);
	}

	cacheLookup(s){
		var key = s;
		var value = lookupCache[key];
		if(value == undefined || forceCacheOff){
			value = $(key);
			lookupCache[key] = value;
		}
		return value;
	}

	setSymbol(s){
		this.cacheLookup('#cell_' + this.x + '_' + this.y + ' .symbol').text(s);
	}

	addClass(c){
		this.getCellReference().addClass(c);
	}

	getCellReference(){
		return this.cacheLookup('#cell_' + this.x + '_' + this.y );
	}
}

// center view on square x,y
function cameraTo(v){
	x = v.x;
	y = v.y;
	spacing = {};
	spacing.initialOffset = {};
	spacing.x = -96;
	spacing.y = spacing.x;
	spacing.initialOffset.x = ($(window).width() + spacing.x)/2;
	spacing.initialOffset.y = ($(window).height() + spacing.y)/2;

	$('#map').css({'left': x*spacing.x + spacing.initialOffset.x + 'px',
		'top': y*spacing.y + spacing.initialOffset.y + 'px'});
}

function gameSetup(game){

	map = new GameMap(50,50);

	// First draw!
	updateMapView();

	player.move = function(v){
		movingTo = new Vec2(player.pos.x + v.x,player.pos.y + v.y);
		t = map.getTile(movingTo);
		if(t.passable){
			player.pos = movingTo
			// Incremenet move counter?
		} 
		t.runEncounter();
		updateMapView();
	}

	player.left = function(){
		player.move(new Vec2(-1,0));
	}

	player.up = function(){
		player.move(new Vec2(0,-1));
	}

	player.right = function(){
		player.move(new Vec2(1,0));
	}

	player.down = function(){
		player.move(new Vec2(0,1));
	}

	// Bind Keys
	$(document).keydown(function(e) {
	    switch(e.which) {
	        case 37: // left
	        player.left();
	        break;

	        case 38: // up
	        player.up();
	        break;

	        case 39: // right
	        player.right();
	        break;

	        case 40: // down
	        player.down();
	        break;

	        case 13: //enter
	        map.
	        break;

	        default: return; // exit this handler for other keys
	    }
	    e.preventDefault(); // prevent the default action (scroll / move caret)
	});
}

function buildMapView(x, y){
game.mapView = {};
game.mapView.x = x;
game.mapView.y = y;

	for (var iy = 0; iy < y; iy++){
		var myRow = $('<div></div>');
		myRow.attr('id', 'row_' + iy);
		myRow.addClass('row');
		$("#map").append(myRow);
		for (jx = 0; jx < x; jx++){
			var myCell = $('<div><span class="symbol"></symbol><div class="fx"></div></div>');
			myCell.attr('id', 'cell_' + jx + '_' + iy);
			myCell.addClass('mapCell');
			$("#row_" + iy).append(myCell);
		}
	}
}

// UTILTITIES

// Typing delays in milliseconds.
var textDelay = 5; //delay between each letter
var speedBetweenLines = 400; //delay between heading and main text

// Fix size so typing doesn't resize element
function fixDimensions(e){
  e.width(e.width());
  e.height(e.height());
}

// UnFix dimensions so window resizing works again.
function unFixDimensions(e){
  e.width("");
  e.height("");
}

function rpgText(element, heading, body){
  //Fix Height
  fixDimensions(element);

  if(heading != null){
  	headingText = heading.text();
  	heading.text("");
  }

  bodyText = body.text();
  body.text("");

  if(heading != null){
	  typeWriter(headingText, heading, function(){
	  	setTimeout(typeBody(element), speedBetweenLines);
		});
	} else {
		typeBody(element);
	}

  function typeBody(element){
    typeWriter(bodyText, body, function(){
			unFixDimensions(element);
    });
  };
}

function typeWriter(str, target, callback){
  quickType(str, target, 0, callback);
}

function quickType(str, target, i, callback) {
    // If full string hasn't yet been typed out, continue typing
    if (i < str.length) {
        target.text(target.text() + str.charAt(i));
        i++;
        setTimeout(function(){ quickType(str, target, i, callback); }, textDelay);
    } else {
      // Done so callback time
      if(callback)
        callback();
    }
}
