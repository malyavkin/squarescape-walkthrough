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
const passableTerrain = [types.FINISH,types.FREE,types.START,types.TARGET];
var readyInt =setInterval(ifReady,200);

////////// GENERALS
var clone = function () {
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
Object.prototype.clone = clone;
Array.prototype.clone = clone;
/*console.log(equals({x:20},{x:20}) == true);
console.log(equals([1,2,3],[1,2,3]) == true);
console.log(equals([[1,2,3],[4,5,6],[7,8,9]],[[1,2,3],[4,5,6]]) == false);
console.log(equals([1,2,{x:20}],[1,2,{y:20}]) == false);
console.log(equals([1,2,{x:20}],[1,2,{x:20}]) == true);
console.log(equals([1,2,{x:20}],[1,2,{y:20,x:20}]) == false);*/
function equals(obj1,obj2) {
    // if the other object is a false value, return
    if (obj1==null || obj2 == null) return false;
    // if we comparing numbers, booleans, strings, etc., then this:
    if(typeof (obj1) == typeof(obj2) && typeof(obj1) != "object" ){
        return obj1 == obj2;
    }
    // compare lengths of objects - can save a lot of time
    if(Object.keys(obj1).length != Object.keys(obj2).length) return false;
    for (var i in obj1) {
        if(obj1.hasOwnProperty(i)){
            if(!equals(obj1[i],obj2[i])) return false;
        }
    }
    return true;
}
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
    function createContext(currentPosition,stage,route){
        return {
            route : route.clone(),
            currentPosition: currentPosition.clone(),
            stage: stage
        }
    }

    function analyzeMap(c) {
        if(!c) throw new Error("context is null");
        var i=0, j=0,new_i=0, new_j=0, stops= 0, newRoute;
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
                //possibleDestinations.push([new_i,j]);
                newRoute = c.route.clone();
                newRoute.push(c.currentPosition);
                possibleDestinations.push(createContext([new_i,j], c.stage, newRoute));
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
                //possibleDestinations.push([i,new_j]);
                newRoute = c.route.clone();
                newRoute.push(c.currentPosition);
                possibleDestinations.push(createContext([i,new_j], c.stage, newRoute));
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
                //possibleDestinations.push([new_i,j]);
                newRoute = c.route.clone();
                newRoute.push(c.currentPosition);
                possibleDestinations.push(createContext([new_i,j], c.stage, newRoute));
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
                //possibleDestinations.push([i,new_j]);
                newRoute = c.route.clone();
                newRoute.push(c.currentPosition);
                possibleDestinations.push(createContext([i,new_j], c.stage, newRoute));
                stops = 2;
            }
        }


        return possibleDestinations;
    }

	if (!c){
		//creating default context
		c = createContext(start,0,[]);
	}

    var visitedEndpoints = [];
    var wavefront = [c.clone()];
    var cntr = 0;
    while(cntr<5){

        console.log("Round "+cntr);
        console.log(wavefront);
        var dest = [];
        for(var i = 0;i<wavefront.length;++i){
            visitedEndpoints.push(wavefront[i]);
            dest = dest.concat(analyzeMap(wavefront[i]));
        }
        //removing dupes in dest
        for(var j=0;j<dest.length;++j){
            var k=  j+1;
            while(k<dest.length){
                if(equals(dest[j].stage,dest[k].stage) &&
                   equals(dest[j].currentPosition,dest[k].currentPosition)){
                    dest.splice(k,1);
                } else ++k;
            }
        }
        //removing already visited points from dest
        for(var l=0;l<visitedEndpoints.length;++l){
            var m = 0;
            while(m<dest.length){
                if(equals(dest[m].stage,visitedEndpoints[l].stage) &&
                   equals(dest[m].currentPosition,visitedEndpoints[l].currentPosition)){
                    dest.splice(m,1);
                } else ++m;
            }
        }

        wavefront = dest.slice();
        ++cntr;
    }
}