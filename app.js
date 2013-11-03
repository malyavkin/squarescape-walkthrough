var fs = require('fs');
const types = {
	VOID : '0',
	FINISH: '1',
	TARGET: '2',
	FREE: '3',
	START: '4'
};
var world = [];
var start = [];
var finish = [];
var target = [];
var visitedEndpoints = [];
const passableTerrain = [types.FINISH,types.FREE,types.START,types.TARGET];
var readyInt =setInterval(ifReady,200);

////////// GENERALS
Object.prototype.clone = function () {
    var clone = this instanceof Array ? [] : {};
    for (var i in this) {
        if(this.hasOwnProperty(i)){
            if (typeof(this[i]) == "object" && this[i] != null)
                clone[i] = this[i].clone();
            else
                clone[i] = this[i];
        }
    }
    return clone;
};
Array.prototype.equals = function (array) {
    // if the other array is a false value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0; i < this.length; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};
///////// END GENERALS

fs.readFile( __dirname + '/map2', function (err, data) {
	if (err) {
		throw err;
	}
	var raw = data.toString();
	var mapStr = raw.substring(raw.indexOf("layer 0")+9,raw.length-2);
	var strings = mapStr.split(',\r\n');
	strings.pop();
	for(var i=0; i< strings.length;i++){
		strings[i] =strings[i].split(',');
	}
	world = strings;
});

function ifReady() {
	if (world){
		clearInterval(readyInt);
		prepare();
		findWayOut();
		console.log();
	}
}

function prepare(){
	var i,j;
	//find start point
	for(i = 0;i<world.length;i++){
		j = world[i].lastIndexOf(types.START);
		if(j!=-1) break;
	}
	start = [i,j];
	//find target point
	for(i = 0;i<world.length;i++){
		j = world[i].lastIndexOf(types.TARGET);
		if(j!=-1) break;
	}
	target = [i,j];

	//find finish point
	for(i = 0;i<world.length;i++){
		j = world[i].lastIndexOf(types.FINISH);
		if(j!=-1) break;
	}
	finish = [i,j];
}

function findWayOut(c) {
    function analyzeMap(c) {
        if(!c) throw new Error("context is null");
        var i=0, j=0,new_i=0, new_j=0, stops=0;
        var possibleDestinations = [];
        function rewind(){
            i = c.currentPosition[0];
            j = c.currentPosition[1];
            stops = 0;
        }
        // 4way

        //top (-i)
        rewind();
        while(stops!=2){
            new_i = i;
            --i;
            if(i<0) {
                i = world.length-1;
                stops++;
            }
            if(passableTerrain.indexOf(world[i][j]) == -1){
                possibleDestinations.push([new_i,j]);
                stops = 2;
            }
        }

        //right (+j)
        rewind();
        while(stops!=2){
            new_j = j;
            ++j;
            if(j==world[0].length) {
                j = 0;
                ++stops;
            }
            if(passableTerrain.indexOf(world[i][j]) == -1){
                possibleDestinations.push([i,new_j]);
                stops = 2;
            }
        }
        //bot (+i)
        rewind();
        while(stops!=2){
            new_i = i;
            ++i;
            if(i==world.length) {
                i = 0;
                ++stops;
            }
            if(passableTerrain.indexOf(world[i][j]) == -1){
                possibleDestinations.push([new_i,j]);
                stops = 2;
            }
        }
        //left (-j)
        rewind();

        while(stops!=2){
            new_j = j;
            --j;
            if(j<0) {
                j = world[0].length-1;
                ++stops;
            }
            if(passableTerrain.indexOf(world[i][j]) == -1){
                possibleDestinations.push([i,new_j]);
                stops = 2;
            }
        }


        return possibleDestinations;
    }

	if (!c){
		//creating default context
		c = {
            route : [],
            length : 0,
			currentPosition : start.slice(),
			stage: 0 // 1 — got target , 2 — got finish
		}
	}
    visitedEndpoints.push(c.currentPosition);
    var possibleDestinations = analyzeMap(c);
    console.log("POSSIBLE");
    console.log(possibleDestinations);


    var newDestinations = [];
    for (var i = 0;i<possibleDestinations.length;++i){
        var found = false;
        for (var j=0;j<visitedEndpoints.length;++j){
            if (visitedEndpoints[j].equals(possibleDestinations[i])) {
                found = true;
                break;
            }
        }
        if (!found){
            newDestinations.push(possibleDestinations[i]);
        }
    }
    console.log("NEW");

    console.log(newDestinations);
    console.log("===============================================================");

    if(newDestinations.length == 0) console.log(c.route);
    for (var k = 0;k<newDestinations.length;++k){
        var cc = c.clone();
        cc.route.push(c.currentPosition);
        ++cc.length;
        cc.currentPosition = newDestinations[k];

        findWayOut(cc);
    }


}