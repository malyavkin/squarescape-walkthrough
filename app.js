var fs = require('fs');
var util = require('util');
const fn = "/map";
const types = {
	VOID : '#',
	FINISH: 'F',
	TARGET: '*',
	FREE: '.',
	START: 'S',
    DEATH: 'X',
    STOP : '+'
};
var world = [];
var start = [];
var finish = [];
var target = [];
var solutions = [];
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

fs.readFile( __dirname + fn, function (err, data) {
	if (err) {
		throw err;
	}
	var raw = data.toString();

	var strings = raw.split('\n');
	for(var i=0; i< strings.length;i++){
		strings[i] =strings[i].split('');
	}
	world = strings;
    console.log(world);
});
function ifReady() {
	if (world){
		clearInterval(readyInt);
		prepare();
		findWayOut();

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

    console.log(start,target,finish);
}

function findWayOut(c) {
    function createContext(currentPosition,stage,route,directions){
        return {
            route : route.clone(),
            currentPosition: currentPosition.clone(),
            directions:directions,
            stage: stage
        }
    }

    function analyzeMap(c) {
        if(!c) throw new Error("context is null");
        var possibleDestinations = [];
        function go(c,functor,pretty){
            var trace = "";
            var stops = 0;
            var cPos = {i: c.currentPosition[0],
                        j: c.currentPosition[1]};
            var lastPos = {i:0, j:0};
            var stage = c.stage;
            var newRoute = c.route.clone();
            newRoute.push(c.currentPosition);
            var newDirs = c.directions.clone();

            while(stops<2){
                lastPos = cPos.clone();
                cPos = functor(cPos);
                //looping through walls
                while(cPos.i<0) {++stops; cPos.i+=world.length; trace+="|";}
                while(cPos.j<0) {++stops; cPos.j+=world[0].length;trace+="|";}
                while(cPos.i>= world.length) {++stops; cPos.i-=world.length;trace+="|";}
                while(cPos.j>= world[0].length) {++stops; cPos.j-=world[0].length;trace+="|";}
                trace+=(world[cPos.i][cPos.j]).toString();
                switch (world[cPos.i][cPos.j]){
                    case types.STOP:{
                        possibleDestinations.push(createContext([cPos.i,cPos.j], stage, newRoute,newDirs.concat([pretty])));
                        stops = 2;
                        trace+="[";
                        break;
                    }
                    case types.VOID:{
                        possibleDestinations.push(createContext([lastPos.i,lastPos.j], stage, newRoute,newDirs.concat([pretty])));
                        stops = 2;
                        trace+="[";
                        break;
                    }
                    case types.TARGET:{
                        if(stage == 0) stage = 1;
                        else stops = 2;
                        trace+="*";
                        pretty+="*";
                        break;
                    }
                    case types.FINISH:{
                        if(stage == 1) {
                            stage = 2;
                            solutions.push(createContext([cPos.i,cPos.j], stage, newRoute,newDirs.concat([pretty])));
                            trace+="!";
                            stops = 2;
                        }
                        else stops = 2;
                        break;
                    }
                    case types.FREE:
                        break;
                    case types.START:
                        break;
                    case types.DEATH:
                        stops = 2;
                        break;
                    default:
                        trace+="?["+(world[cPos.i][cPos.j])+"]";
                        throw new Error("what is that");
                        break;
                }
            }
            console.log(trace);
        }
        // 4way
        //top (-i)  function(p){return {i:p.i-1, j:p.j}}
        console.log("up");
        go(c,function(p){return {i:p.i-1, j:p.j  }},"^");
        //right (+j)
        console.log("right");
        go(c,function(p){return {i:p.i  , j:p.j+1}},">");
        //bot (+i)
        console.log("down");
        go(c,function(p){return {i:p.i+1, j:p.j  }},"v");
        //left (-j)
        console.log("left");
        go(c,function(p){return {i:p.i  , j:p.j-1}},"<");

        return possibleDestinations;
    }

	if (!c){
		//creating default context
		c = createContext(start,0,[],[]);
	}

    var visitedEndpoints = [];
    var wavefront = [c.clone()];
    var counter = 0;
    while(wavefront.length != 0){
        console.log("Round "+counter++);
        console.log(util.inspect(wavefront, false, null));
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
    }

    console.log("done! Found solutions:");
    for(var s = 0;s<solutions.length;++s){
        console.log(s+"("+solutions[s].route.length+")");
        for(var ss = 0;ss<solutions[s].route.length;++ss){
            console.log(solutions[s].route[ss],solutions[s].directions[ss]);
            //console.log(solutions[s].route[ss]);
        }
        console.log("fin:",[solutions[s].currentPosition]);



    }


}