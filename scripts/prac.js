Physics(function(world){
	targetx = window.innerWidth/3;
	targety = window.innerWidth/3;
	pAccing = false;
	pMoving = false;
	playerAngAcc = 0;
	if(localStorage.count)document.getElementById('high').innerHTML = localStorage.count;
	lastCount = 0;
	balls = [];
	var renderer = Physics.renderer('canvas',{el:'viewport',width:window.innerWidth,height:window.innerHeight});
	world.add(renderer);

var square = Physics.body('rectangle',{x:250,y:250,width:50,height:50,vx:0.01});
//world.add(square);
world.render();
Physics.util.ticker.on(function(time,dt){world.step(time);});
Physics.util.ticker.start();
world.on('step',function(){world.render();})
world.add(Physics.behavior('constant-acceleration'));
var bounds = Physics.aabb(0,0,window.innerWidth,window.innerHeight);
world.add(Physics.behavior('edge-collision-detection',{
	aabb: bounds,
	restitution: 0.2,
	cof : 0
}));
world.add(Physics.behavior('body-impulse-response'));
world.add(Physics.behavior('body-collision-detection') );
world.add(Physics.behavior('sweep-prune'));
var floor = {
	height : 10,
	width : window.innerWidth,
	x : window.innerWidth/2,
	y : window.innerHeight - 5,
	treatment: 'static',
	styles : {
	fillStyle: 'green',
	angleIndicator : 'transparent'}
}
floor = Physics.body('rectangle',floor);
world.add(floor);
playW = window.innerHeight / 2;
playerHead = Physics.body('circle',{treatment:'kinematic',x:0,y:0,radius:0.1*playW,styles:{fillStyle:'red',angleIndicator:'transparent'}});
peg1 = Physics.body('rectangle',{treatment:'kinematic',x:0,y:0,height:window.innerHeight/2,width:0.02*playW,angle: Math.PI/1.5});
//peg2 = Physics.body('rectangle',{x:0,y:0,height:100,width:2,angle: Math.PI / 3});
//peg3 = Physics.body('rectangle',{x:0,y:0,height:100,width:2,angle: Math.PI / 2});
//peg4 = Physics.body('rectangle',{x:0,y:0,height:100,width:2,angle: Math.PI});
//peg6 = Physics.body('rectangle',{x:0,y:0,height:100,width:2,angle: Math.PI/0.5});
player = Physics.body('compound',{treatment:'kinematic',x:10,y:window.innerHeight-55,height:playW,width:playW,mass:100,children:[playerHead,peg1],treatment:'dynamic'});
world.add(player);
player.treatment = 'kinematic';
playerHead.treatment = 'static';
peg1.treatment='static';
player.restitution = 0;
playerHead.restitution = 0;
peg1.restitution = 0;
player.cof = 0;
playerHead.cof = 0;
peg1.cof = 0;
player.state.angular.acc = 0;
//firstWall = Physics.body('rectangle',{treatment:'kinematic',vy:0.5,x:window.innerWidth/2,y: 0,height:100,width:100,mass:10,styles:{fillColor:'green',angleIndicator:'transparent'}})
lastWall = Physics.body('rectangle',{treatment:'static',vy:1,x:window.innerWidth - 105,y: 0.5*(window.innerHeight - 10 + 2*window.innerHeight/50),height:window.innerHeight - 4*window.innerHeight /50,width:window.innerWidth/20,})
//world.add(firstWall);
world.add(lastWall);
for(var i = 0;i < 30;i++){
	//points = [{x:0,y:0},{x:100,y:0},{x:0,y:100},{x:-10,y:50},{x:-10,y:50}];
	//world.add(Physics.body('convex-polygon',{x:window.innerWidth/2+Math.random()*100,vertices:points,styles:{fillStyle:'blue',angleIndicator:'tansparent'} }));
	var cb = Physics.body('circle',{x:window.innerWidth/3+Math.random()*100,radius:window.innerHeight/50,styles:{fillStyle:'blue',angleIndicator:'tansparent'} });
	balls.push(cb);
	world.add(cb);
	}
world.on('step',function(){
	if(pMoving){
	var px = parseInt(player.state.x);
	var py = parseInt(player.state.y);
	var dx = Math.abs(px - targetx);
	var dy = Math.abs(py - targety);
	var nx = 0;
	var ny = 0;
	if(player.state.pos.x < targetx)nx = 1;//player.state.vel.x = 0.1;
	if(player.state.pos.x > targetx)nx = -1;//player.state.vel.x = -0.1;
	if(player.state.pos.y < targety)ny = 1;//player.state.vel.y = 0.1;
	if(player.state.pos.y > targety)ny = -1;//player.state.vel.y = -0.1;
	player.state.vel.set(nx,ny);
	
	player.recalc();
	}
	if(pAccing)player.state.angular.acc = playerAngAcc;
	scoreCheck();
		
});

document.onkeydown = function(e){
	e = e || event;
	console.log(e.keyCode);
	if(e.keyCode == 87 && player.state.pos.y + 25 >= window.innerHeight-50)player.state.vel.y = window.innerHeight/1000;
	if(e.keyCode == 68 && player.state.vel.x <= 0.05)player.state.vel.x = 1;
	if(e.keyCode == 65 && player.state.vel.x >= -0)player.state.vel.x = -01;
	if(e.keyCode == 67 /*&& player.state.pos.y + 20 <= window.innerHeight-15*/)player.state.angular.acc = 0.003;
	if(e.keyCode == 90 /*&& player.state.pos.y + 20 <= window.innerHeight-15*/)player.state.angular.acc = -0.003;
}
ts = function(e){
	console.log('touchStart');
	e = e || event;
	xc = e.changedTouches[0].pageX;
	yc = e.changedTouches[0].pageY;
	px = parseInt(player.state.pos.x);
	py = parseInt(player.state.pos.y);
	dist = Math.sqrt( Math.pow(px-xc,2)+Math.pow(yc - py,2));
	console.log(xc);
	console.log(player.state.pos.x);
	if(dist > window.innerHeight/4)pAccing = true;
	else{ pMoving = true;
	targetx = xc;
	targety = yc;}
	if(pAccing){playerAngAcc = -0.0005;
	if(xc > player.state.pos.x){playerAngAcc = 0.0005;console.log('clicked Right')}
	player.recalc();}
	}
tm = function(e){
	console.log('touchMove');
	e = e || event;
	xc = e.changedTouches[0].pageX;
	yc = e.changedTouches[0].pageY;
	targetx = xc;
	targety = yc;
}
te = function(e){
	player.state.angular.vel = 0;
	player.state.angular.acc = 0;
	player.state.vel.set(0,0);
	player.sleep(false);
	if(pAccing){
		playerAngAcc = 0;
	}
	console.log('touchEnd');
	pAccing = false;
	pMoving = false;
	e = e || event;
}
});
function scoreCheck(){
	localStorage.count = localStorage.count || 0;
	count = 0;
	for(var i = 0; i<balls.length;i++)if(balls[i].state.pos.x > window.innerWidth - 105 + 50)count++;
	if(count > localStorage.count){localStorage.count = count;document.getElementById('high').innerHTML =localStorage.count;}
	if(count > lastCount)document.getElementById('count').innerHTML = count;
	lastCount = count;
}
window.onload = function(){
	document.getElementById('viewport').addEventListener("touchstart", ts, false);
  document.getElementById('viewport').addEventListener("touchend", te, false);
  document.getElementById('viewport').addEventListener("touchmove", tm, false);
}