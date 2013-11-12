var fs = require('fs');
var util = require('util');
const fn = "/map3";
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
var portals = [];
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
	var raw = data.toString().replace(/\r/g,"");
	var strings = raw.split('\n');
	for(var i=0; i< strings.length;++i){
		strings[i] =strings[i].split('');
	}
	world = strings;
    console.log(raw);
});
function ifReady() {
	if (world){
		clearInterval(readyInt);
        var valid = prepare();
        if(valid) findWayOut();
        else console.log("Map is broken");
	}
}
function prepare(){
    /**
     * Need to:
     *  - find start, target and finish points
     *  - ensure that there is only one point of each kind
     *  - find all portals
     *  - ensure that there are exactly two or none of each kind
     *  - ensure that all rows have equal length
     */
    var i,j;
    var portals_tmp = [];
    var map_correct = true;
    for(i=0;i<world.length && map_correct;++i){
        for(j=0;j<world[0].length && map_correct;++j){
            if (/[0-9]/.test(world[i][j])){
                if(!portals_tmp[world[i][j]]){
                    portals_tmp[world[i][j]] = [[i,j]];
                } else portals_tmp[world[i][j]].push([i,j]);
                if(portals_tmp[world[i][j]] >2) map_correct=false;
            } else switch(world[i][j]){
                case types.START:{
                    if(start.length) map_correct=false;
                    else start = [i,j];
                    break;
                }
                case types.TARGET:{
                    if(target.length) map_correct=false;
                    else target = [i,j];
                    break;
                }
                case types.FINISH:{
                    if(finish.length) map_correct=false;
                    else finish = [i,j];
                    break;
                }
            }
        }
    }
    for(var k=0;k<portals_tmp.length;++k){
        if(portals_tmp[k].length != 0 && portals_tmp[k].length != 2  ){
            map_correct = false;
        }
    }
    if(!(start.length && target.length && finish.length)) map_correct = false;
    portals = portals_tmp;
    console.log(start,target,finish);
    return map_correct;
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
            var trace = pretty+" ";
            var stops = 0;
            var passed_portals = [];
            var cPos = {i: c.currentPosition[0],
                        j: c.currentPosition[1]};
            var lastPos = {i:0, j:0};
            var stage = c.stage;
            var newRoute = c.route.clone();
            newRoute.push(c.currentPosition);
            while(stops<2){
                lastPos = cPos.clone();
                cPos = functor(cPos);
                //looping through walls
                while(cPos.i<0) {++stops; cPos.i+=world.length; trace+="|";}
                while(cPos.j<0) {++stops; cPos.j+=world[0].length;trace+="|";}
                while(cPos.i>= world.length) {++stops; cPos.i-=world.length;trace+="|";}
                while(cPos.j>= world[0].length) {++stops; cPos.j-=world[0].length;trace+="|";}
                trace+=(world[cPos.i][cPos.j]).toString();
                if (/[0-9]/.test(world[cPos.i][cPos.j])){
                    //portal
                    if(passed_portals.indexOf(world[cPos.i][cPos.j])!=-1){
                        //we've been here
                        stops = 2;
                    }else{
                        passed_portals.push(world[cPos.i][cPos.j]);
                        stops = 0;
                        //warping...//
                        var selected_portal = portals[world[cPos.i][cPos.j]];
                        if(cPos.i == selected_portal[0][0] && cPos.j == selected_portal[0][1]){

                            cPos.i = selected_portal[1][0];
                            cPos.j = selected_portal[1][1];
                        } else {
                            cPos.i = selected_portal[0][0];
                            cPos.j = selected_portal[0][1];
                        }
                        trace+="~";
                        pretty+="("+world[cPos.i][cPos.j]+")";

                    }

                } else switch (world[cPos.i][cPos.j]){
                    case types.STOP:{
                        possibleDestinations.push(createContext([cPos.i,cPos.j], stage, newRoute,c.directions+pretty));
                        stops = 2;
                        trace+="[";
                        break;
                    }
                    case types.VOID:{
                        possibleDestinations.push(createContext([lastPos.i,lastPos.j], stage, newRoute,c.directions+pretty));
                        stops = 2;
                        trace+="[";
                        break;
                    }
                    case types.TARGET:{
                        if(stage == 0) stage = 1;
                        else stops = 2;
                        trace+="!";
                        pretty+="*";
                        break;
                    }
                    case types.FINISH:{
                        if(stage == 1) {
                            stage = 2;
                            trace+="!";
                            pretty+="!";
                            solutions.push(createContext([cPos.i,cPos.j], stage, newRoute,c.directions+pretty));
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
                        throw new Error("what is that"+"["+(world[cPos.i][cPos.j])+"]");
                        break;
                }
            }
            console.log(trace);
        }
        // 4way
        //top (-i)  function(p){return {i:p.i-1, j:p.j}}
        go(c,function(p){return {i:p.i-1, j:p.j  }},"^");
        //right (+j)
        go(c,function(p){return {i:p.i  , j:p.j+1}},">");
        //bot (+i)
        go(c,function(p){return {i:p.i+1, j:p.j  }},"v");
        //left (-j)
        go(c,function(p){return {i:p.i  , j:p.j-1}},"<");

        return possibleDestinations;
    }

	if (!c){
		//creating default context
		c = createContext(start,0,[],"");
	}
    var visitedEndpoints = [];
    var solutions = [];
    var wavefront = [c.clone()];
    var counter = 0;
    while(wavefront.length != 0){
        console.log("====================");
        console.log("Round "+ ++counter);
        console.log(util.inspect(wavefront, false, null));
        var dest = [];
        for(var i = 0;i<wavefront.length;++i){
            console.log(counter+"."+i);
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
    console.log("====================");
    console.log("done! Found solutions:");
    for(var s = 0;s<solutions.length;++s){
        console.log(s+"(length "+solutions[s].route.length+")");
        console.log(solutions[s].directions);
        //console.log(solutions[s].directions.join(""));
        for(var ss = 0;ss<solutions[s].route.length;++ss){
            console.log(solutions[s].route[ss]);
            //console.log(solutions[s].route[ss]);
        }
        console.log("fin:",[solutions[s].currentPosition]);
    }
    if(solutions.length == 0){
        console.log("    none")
    }
}