pMoving = false;
free = true;
Physics.behavior('constant-acceleration-mod', function( parent ){
        var defaults = {
    
            acc: { x : 0, y: 0.0004 }
        };
    
        return {
    
            // extended
            init: function( options ){
    
                parent.init.call( this );
                this.options.defaults( defaults );
                this.options( options );
    
                // extend options
                this._acc = new Physics.vector();
                this.setAcceleration( this.options.acc );
                delete this.options.acc;
            },
    

            setAcceleration: function( acc ){
    
                this._acc.clone( acc );
                return this;
            },
    
            // extended
            behave: function( data ){
    
                var bodies = this.getTargets();
    
                for ( var i = 0, l = bodies.length; i < l; ++i ){
                    if(bodies[i].name == 'player' && pAccing)bodies[i].state.vel.set({x:0,y:0});
					//else if(bodies[i].name == 'player')bodies[i].setAcceleration({ x : 0, y: 0.0004 });
                    bodies[ i ].accelerate( this._acc );
					//if(pAccing && bodies[i].name == 'player'){bodies[i].state.pos.set(playPos.x,playPos.y);}
                }
            }
        };
    });

Physics.behavior('interact', function( parent ){
    
        if ( !document ){
            // must be in node environment
            return {};
        }
    
        var defaults = {
                // the element to monitor
                el: null,
                // time between move events
                moveThrottle: 1000 / 100 | 0,
                // minimum velocity clamp
                minVel: { x: -5, y: -5 },
                // maximum velocity clamp
                maxVel: { x: 5, y: 5 }
            }
            ,getElementOffset = function( el ){
                var curleft = 0
                    ,curtop = 0
                    ;
    
                if (el.offsetParent) {
                    do {
                        curleft += el.offsetLeft;
                        curtop += el.offsetTop;
                    } while (el = el.offsetParent);
                }
    
                return { left: curleft, top: curtop };
            }
            ;
    
        return {
            // extended
            init: function( options ){
    
                var self = this;
    
                // call parent init method
                parent.init.call( this );
                this.options.defaults( defaults );
                this.options( options );
    
                // vars
                this.bodyData = {};
                this.bodyDataByUID = {};
    
                this.el = typeof this.options.el === 'string' ? document.getElementById(this.options.el) : this.options.el;
    
                if ( !this.el ){
                    throw "No DOM element specified";
                }
    
                // init events
                // when there are multiple touchdowns, grab is usually called separately for each,
                // but we loop through e.changedTouches just in case
                self.grab = function grab( e ){
                    var pos
                        ,body
                        ,touchId
                        ,touch
                        ,offset
                        ,data
                        ,touchIndex
                        ,l
                        ;
    
                    if ( self._world ){
    
                        // Adjust for PointerEvent and older browsers
                        if ( !e.changedTouches ) {
                            e.changedTouches = [ e ];
                        }
    
                        offset = getElementOffset( e.target );
    
                        for ( touchIndex = 0, l = e.changedTouches.length; touchIndex < l; touchIndex++) {
                            touch = e.changedTouches[touchIndex];
                            touchId = touch.identifier || touch.pointerId || "mouse";
                            pos = { idx: touchId, x: touch.pageX - offset.left, y: touch.pageY - offset.top };
                            body = self._world.findOne({ $at: new Physics.vector( pos ), $in: self.getTargets() });
    
                            if ( body && body.name == 'player'){
                                // we're trying to grab a body
                                // fix the body in place
                                body.state.vel.zero();
                                body.state.angular.vel = 0;
                                body.isGrabbed = true;
                                // remember the currently grabbed bodies
                                data = self.bodyData[touchId] || {};
                                data.body = body;
                                // wake the body up
                                body.sleep( false );
                                data.time = Physics.util.ticker.now();
    
                                // if we're grabbing the same body twice we don't want to remember the wrong treatment.
                                data.treatment = self.bodyDataByUID[ body.uid ] ? self.bodyDataByUID[ body.uid ].treatment : body.treatment;
                                // change its treatment but remember its old treatment
                                body.treatment = 'kinematic';
                                // remember the click/touch offset
                                data.pos = data.pos || new Physics.vector();
                                data.pos.clone( pos );
    
                                data.offset = data.offset || new Physics.vector();
                                data.offset.clone( pos ).vsub( body.state.pos );
                                // init touchPointsOld here, too, so we don't have to do it in "move"
                                data.oldPos = data.oldPos || new Physics.vector();
                                data.oldPos.clone( pos );
    
                                pos.body = body;
                                self.bodyData[touchId] = data;
                                self.bodyDataByUID[ body.uid ] = data;
                                self._world.emit('interact:grab', pos);
    
                            } else {
    
                                self._world.emit('interact:poke', pos);
                            }
                        }
                    }
                };
    
                // when there are multiple touchdowns, move is called once
                // and e.changedTouches will have one or more touches in it
                self.move = Physics.util.throttle(function move( e ){
                    var pos
                        ,state
                        ,body
                        ,touchId
                        ,touch
                        ,offset
                        ,data
                        ,touchIndex
                        ,l
                        ;
    
                    if ( self._world ){
    
                        // Adjust for PointerEvent and older browsers
                        if ( !e.changedTouches ) {
                            e.changedTouches = [ e ];
                        }
    
                        offset = getElementOffset( self.el );
    
                        for ( touchIndex = 0, l = e.changedTouches.length; touchIndex < l; touchIndex++) {
                            touch = e.changedTouches[touchIndex];
                            touchId = touch.identifier || touch.pointerId || "mouse";
                            pos = { idx: touchId, x: touch.pageX - offset.left, y: touch.pageY - offset.top };
                            data = self.bodyData[touchId];
                            if ( data ){
                                body = data.body;
								if(touch.pageY < window.innerHeight/10 || touch.pageY + window.innerHeight/8 > window.innerHeight || touch.pageX < screen.height / 10 || touch.pageX > lastWall.state.pos.x - window.innerWidth/5){self.release();return}
                                // wake the body up
                                body.sleep( false );
                                data.time = Physics.util.ticker.now();
    
                                // set old mouse position
                                data.oldPos.clone( data.pos );
                                // get new mouse position
                                data.pos.clone( pos );
								
                                pos.body = body;
                            }
    
                            self._world.emit('interact:move', pos);
                        }
                    }
    
                }, self.options.moveThrottle);
    
                // when there are multiple touchups, release is called once
                // and e.changedTouches will have one or more touches in it
                self.release = function release( e ){
                    var pos
                        ,body
                        ,touchId
                        ,touch
                        ,offset
                        ,data
                        ,dt
                        ,touchIndex
                        ,l
                        ;
    
                    if ( self._world ){
    
                        // Adjust for PointerEvent and older browsers
                        if ( !e.changedTouches ) {
                            e.changedTouches = [ e ];
                        }
    
                        for ( touchIndex = 0, l = e.changedTouches.length; touchIndex < l; touchIndex++) {
                            offset = getElementOffset( self.el );
                            touch = e.changedTouches[touchIndex];
                            touchId = touch.identifier || touch.pointerId || "mouse";
                            pos = { idx: touchId, x: touch.pageX - offset.left, y: touch.pageY - offset.top };
                            data = self.bodyData[touchId];
    
                            // release the body
                            if ( data ){
                                body = data.body;
                                // wake the body up
                                body.sleep( false );
                                // get new mouse position
                                data.pos.clone( pos );
    
                                dt = Math.max(Physics.util.ticker.now() - data.time, self.options.moveThrottle);
                                body.treatment = data.treatment;
                                // calculate the release velocity
                                body.state.vel.clone( data.pos ).vsub( data.oldPos ).mult( 0);
                                // make sure it's not too big
                                body.state.vel.clamp( self.options.minVel, self.options.maxVel );
    
                                body.isGrabbed = false;
                                pos.body = body;
    
                                delete body.isGrabbed;
                            }
    
                            // emit before we delete the vars in case
                            // the listeners need the body
                            self._world.emit('interact:release', pos);
    
                            // remove vars
                            delete self.bodyData[touchId];
                        }
                    }
                };
            },
    
            // extended
            connect: function( world ){
    
                // subscribe the .behave() method to the position integration step
                world.on('integrate:positions', this.behave, this);
    
                if ( window.PointerEvent ) {
    
                    this.el.addEventListener('pointerdown', this.grab);
                    window.addEventListener('pointermove', this.move);
                    window.addEventListener('pointerup', this.release);
    
                } else {
    
                    this.el.addEventListener('mousedown', this.grab);
                    this.el.addEventListener('touchstart', this.grab);
    
                    window.addEventListener('mousemove', this.move);
                    window.addEventListener('touchmove', this.move);
    
                    window.addEventListener('mouseup', this.release);
                    window.addEventListener('touchend', this.release);
    
                }
            },
    
            // extended
            disconnect: function( world ){
    
                // unsubscribe when disconnected
                world.off('integrate:positions', this.behave, this);
    
                if ( window.PointerEvent ) {
    
                    this.el.removeEventListener('pointerdown', this.grab);
                    window.removeEventListener('pointermove', this.move);
                    window.removeEventListener('pointerup', this.release);
    
                } else {
    
                    this.el.removeEventListener('mousedown', this.grab);
                    this.el.removeEventListener('touchstart', this.grab);
    
                    window.removeEventListener('mousemove', this.move);
                    window.removeEventListener('touchmove', this.move);
    
                    window.removeEventListener('mouseup', this.release);
                    window.removeEventListener('touchend', this.release);
    
                }
            },
    
            // extended
            behave: function( data ){
    
                var self = this
                    ,state
                    ,dt = Math.max(data.dt, self.options.moveThrottle)
                    ,body
                    ,d
                    ;
    
                // if we have one or more bodies grabbed, we need to move them to the new mouse/finger positions.
                // we'll do this by adjusting the velocity so they get there at the next step
                for ( var touchId in self.bodyData ) {
                    d = self.bodyData[touchId];
                    body = d.body;
                    state = body.state;
                    state.vel.clone( d.pos ).vsub( d.offset ).vsub( state.pos ).mult( 1/dt );
                }
            }
        };
    });

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
world.add(Physics.behavior('constant-acceleration-mod'));
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
player = Physics.body('compound',{name:'player',treatment:'kinematic',x:10,y:window.innerHeight-55,height:playW,width:playW,mass:100,children:[playerHead,peg1],treatment:'dynamic'});
world.add(player);
player.state.acc.recalc = false;
player.state.acc.y = 0;
playerHead.treatment = 'dynamic';
peg1.treatment='dynamic';
player.treatment = 'kinematic';
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
world.add(Physics.behavior('interact',{el: world.renderer().container}));
world.add(lastWall);
for(var i = 0;i < 10;i++){
	//points = [{x:0,y:0},{x:100,y:0},{x:0,y:100},{x:-10,y:50},{x:-10,y:50}];
	//world.add(Physics.body('convex-polygon',{x:window.innerWidth/2+Math.random()*100,vertices:points,styles:{fillStyle:'blue',angleIndicator:'tansparent'} }));
	var cb = Physics.body('circle',{x:window.innerWidth/3+Math.random()*100,radius:window.innerHeight/50,styles:{fillStyle:'blue',angleIndicator:'tansparent'} });
	balls.push(cb);
	world.add(cb);
	}
world.on('step',function(){
	/*if(pMoving){
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
	}*/
	if(pAccing){player.treatment='dynamic';player.state.pos.set(playPos.x,playPos.y);player.state.angular.acc=playerAngAcc;peg1.treatment='dynamic';peg1.state.angular.acc = playerAngAcc;playerHead.state.angular.acc = playerAngAcc;playerHead.treatment='dynamic';}
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
	free = false;
	player.treatment = 'static';
	console.log('touchStart');
	e = e || event;
	xc = e.changedTouches[0].pageX;
	yc = e.changedTouches[0].pageY;
	px = parseInt(player.state.pos.x);
	py = parseInt(player.state.pos.y);
	playPos = {
		x : px,
		y : py
	}
	dist = Math.sqrt( Math.pow(px-xc,2)+Math.pow(yc - py,2));
	console.log(xc);
	console.log(player.state.pos.x);
	if(dist > window.innerHeight/4){pAccing = true;playPos.x = px;playPos.y = py;}
	else pMoving = true;
	if(pAccing){playerAngAcc = -0.0005;
	if(xc > player.state.pos.x){playerAngAcc = 0.0005;console.log('clicked Right')}}
	}
tm = function(e){
	console.log('touchMove');
	e = e || event;
	xc = e.changedTouches[0].pageX;
	yc = e.changedTouches[0].pageY;
	if(pAccing){playPos = {
		x : xc,
		y : yc
		
	}}
}
te = function(e){
	player.treatment = 'static';
	player.state.angular.vel = 0;
	player.state.angular.acc = 0;
	xc = e.changedTouches[0].pageX;
	yc = e.changedTouches[0].pageY;
	playPos = {
		x : xc,
		y : yc
		
	}
	if(pAccing){
		playerAngAcc = 0;
	}
	console.log('touchEnd');
	pAccing = false;
	pMoving = false;
	free = true;
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