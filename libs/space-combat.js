var Key = {
  _pressed: {},

  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  FIRE: 32,
  
  isDown: function(keyCode) {
    return this._pressed[keyCode];
  },
  
  onKeydown: function(event) {
	event.preventDefault();
    this._pressed[event.keyCode] = true;
    return false;
  },
  
  onKeyup: function(event) {
	event.preventDefault();
    delete this._pressed[event.keyCode];
    return false;
  }
};

window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

function Actor (vel, actor_class) {
	this.x = 0;
	this.y = 0;
	this.stage = null;
	this.vel = vel;
	actor_class = actor_class || "player";
	
	this.actor = $("<div class='"+actor_class+"' />");
	$(".actors").append(this.actor);

	this.w = function () {
		return this.actor.width();
	};
	
	this.h = function () {
		return this.actor.height();
	};
	
	this.setPosition = function (x, y) {
		this.actor.css({"left" : x, "top": y});
	};
	
	this.setup = function (stage) {
		this.stage = stage;
	};
	
	this.destroy = function () {
		this.stage.delActor (this);
		this.actor.remove();
	};
	
	this.moveUp = function () {
		this.y =-this.vel;
	};
	
	this.moveDown = function () {
		this.y = this.vel;
	};
	
	this.moveLeft = function () {
		this.x =-this.vel;
	};
	
	this.moveRight = function () {
		this.x = this.vel;
	};
	
	this.fire = function () {
		console.log("bang bang");
	};
	
	this.check = function (minx, maxx) {
		return true;
	};
	
	this.update = function () {
		var xx=0, yy=0;
		var frame = 13;
		if (this.x < 0) {xx = -frame;}
		if (this.y < 0) {yy = -frame;}
		
		if (this.x > 0) {xx = frame;}
		if (this.y > 0) {yy = frame;}

		this.x -= xx; this.y -= yy;
		
		if (xx || yy) {
			var p = this.actor.position();
			this.actor.css({"left" : p.left + xx, "top": p.top + yy});
		}
	};
	
	this.colision = function (actor) {
	};
};

function Enemy () {
	Actor.call(this, 1, "enemy");
	
	var _update = this.update;
	var frame_count = 0;
	var hits = 3;
	
	this.check = function (minx, maxx, miny, maxy) {
		var p = this.actor.position();
		
		if (p.top < miny+10 || p.top < maxy-10) {
			this.y = 0;
		}
		
		if (p.left < 10) {
			this.destroy();
			return false;
		}
		
		return true;
	};
	
	this.update = function () {
		var x = Math.floor(Math.random()*100)%10;
		var y = Math.floor(Math.random()*100)%3;
		
		if (x >= 2) {
			this.moveLeft();
		}
		else if (x===0) {
			this.moveRight();
		}
		
		if (y === 0) {
			this.moveUp();
		}
		else if (y === 1) {
			this.moveDown();
		}
		
		if (frame_count === 0) {
			this.stage.addActor(new Bullet(this, -1, "enemy_shoot"));
		}
		
		frame_count = (frame_count + 1) % 50;
		
		_update.apply(this);
	};

	this.hit = function (player) {
		hits--;

		if (hits === 0) {
			player.points++;
			this.destroy();
		}
	};
};

function Player () {
	Actor.call(this, 10);
	var _update = this.update;
	var fire_frame = 0;
	var fire_interval = 10; 
	
	var hits = 10;
	this.points = 0;
	
	this.check = function (minx, maxx, miny, maxy) {
		var p = this.actor.position();
		
		if (p.left < minx+10 || p.left < maxx-10) {
			this.x = 0;
		}
		
		if (p.top < miny+10 || p.top < maxy-10) {
			this.y = 0;
		}
		
		return true;
	};
	
	
	
	this.update = function () {
		if (Key.isDown(Key.UP)) this.moveUp();
		if (Key.isDown(Key.LEFT)) this.moveLeft();
		if (Key.isDown(Key.DOWN)) this.moveDown();
		if (Key.isDown(Key.RIGHT)) this.moveRight();
		if (Key.isDown(Key.FIRE) && fire_frame == 0) {
			this.stage.addActor(new Bullet(this, 1,'player_shoot'));
			fire_frame = fire_interval;
		}
		
		if (fire_frame > 0) fire_frame--;
		
		_update.apply(this);
	};
	
	this.hit = function () {
		hits--;
		if (hits <= 0) {
			alert("GAME OVER!!! KILLS: " + this.points);
			hits = 100;
			this.x = 0;
			this.y = 0;
			this.points = 0;
		}
	};
	
	this.colision = function (b) {
		if (b instanceof Enemy) {
			var pa = this.actor.position ();
			var pb = b.actor.position ();
			var pw = this.w() / 2;
			var ph = this.h() / 2;
			var bw = b.w();
			var bh = b.h();

			if (pa.left+pw >= pb.left && pa.top+ph >= pb.top && pa.left+pw <= pb.left+bw && pa.top+ph <= pb.top+bh) {
				this.stage.addActor(new Explosion (this, 1));
				this.hit();
				b.hit(this);
			}
		}
	};
};

function Explosion (father, dir) {
	Actor.call(this, 10, "explosion");

	dir = dir || 1;
	this.x = dir*620;
	
	var p = father.actor.position();
	this.setPosition(p.left, p.top);

	var destroy_counter=30;
	
	this.update = function () {
		destroy_counter--;

		if (destroy_counter === 0) {
			this.destroy();
			return false;
		}
		
		return true;
	};
};

function Bullet (father, dir, bullet_class) {
	bullet_class = bullet_class || 'player_shoot';
	Actor.call(this, 10, bullet_class);
	var _update = this.update;

	this.father = father;
	dir = dir || 1;
	
	this.x = dir*620;

	var p = father.actor.position();	
	this.setPosition(p.left+(dir>0?father.w():0), p.top+father.h()/2);

	this.colision = function (b) {
		if (this.father instanceof Player) {
			if (b instanceof Enemy) {
				var pa = this.actor.position ();
				var pb = b.actor.position ();
				var pw = this.w() / 2;
				var ph = this.h() / 2;
				var bw = b.w();
				var bh = b.h();

				if (pa.left+pw >= pb.left && pa.top+ph >= pb.top && pa.left+pw <= pb.left+bw && pa.top+ph <= pb.top+bh) {
					this.stage.addActor(new Explosion (this, 1));
					b.hit(this.father);
					this.destroy();
				}
			}
		}
		else if (this.father instanceof Enemy) {
			if (b instanceof Player) {
				var pa = this.actor.position ();
				var pb = b.actor.position ();
				var pw = this.w() / 2;
				var ph = this.h() / 2;
				var bw = b.w() / 2;
				var bh = b.h() / 2;

				if (pa.left+pw >= pb.left && pa.top+ph >= pb.top && pa.left+pw <= pb.left+bw && pa.top+ph <= pb.top+bh) {
					this.stage.addActor(new Explosion (this, -1));
					b.hit();
					this.destroy();
				}
			}
		}
	};
	
	this.check = function (minx, maxx) {
		var p = this.actor.position();

		if ((p.left < minx || p.left > maxx)) {
			this.destroy ();
			return false;
		}
		
		return true;
	};
};

function Stage() {
	var stage = $(".stage");
	var background = $(".stage .background");
	var layer_1 = $(".stage .layer_1");
	var layer_2 = $(".stage .layer_2");

	var actors = [];
	var frame_count = 0;
	
	this.addActor = function (actor) {
		actor.setup(this);
		actors.push(actor);
	};
	
	this.delActor = function (actor) {
		for (i in actors) {
			if (actor === actors[i]) {
				actors.splice(i, 1);
			}
		}
	};

	var player = new Player();

	this.addActor (player);

	this.levels = [
		{
			name: "Genesis",
			author: "Filipe Vieira",
			images: [
				{name: "stage_1", msg: "Genesis"},
			/*	{name: "stage_2", msg: "STAGE 2"},*/
			]
		},/*
		{
			name: "TEST LEVEL",
			author: "Filipe Vieira (2)",
			images: [
				{name: "stage_1", msg: "STAGE 1"},
				{name: "stage_2", msg: "STAGE 2"},
			]
		},*/
	];
	
	this.index = 0;
	this.sub_index = 0;
	this.load = true;
	this.count = 0;
	
	this.update = function (pos) {
		if (pos%1000 == 0) {
			this.sub_index = (this.sub_index + 1) % this.levels[this.index].images.length;

			if (this.sub_index == 0) {
				this.index = (this.index + 1) % this.levels.length;
			}
			
			var level = this.levels[this.index].images[this.sub_index];
			
			$("body").addClass(level.name);
			
			$(".background .imgs").append("<div class='" + level.name + "_bkg'/>");
			$(".layer_1 .imgs").append("<div class='" + level.name + "_back' />");
			$(".layer_2 .imgs").append("<div class='" + level.name + "_front' />");

			this.count++;
			
			$(".author").html("Author: " + this.levels[this.index].author);
			$(".stage_msg").html("Status: " + level.msg + ", KILLS: " + player.points);
			
			if (this.count > 2) {
				pos -=1000;
				$(".background .imgs img").first().remove();
				$(".layer_1 .imgs img").first().remove();
				$(".layer_2 .imgs img").first().remove();
				this.count--;
			}
		}
		
		this.colision ();
		
		for (i in actors) {
			var actor = actors[i];
			if (actor.check(0, 620, 0, 465)) {
				actor.update();
			}
		}
		
		background.scrollLeft(pos*3);
		layer_1.scrollLeft(pos*2);
		layer_2.scrollLeft(pos);
		
		if (frame_count === 0) {
			var enemy = new Enemy ();
			var y = Math.floor(Math.random()*(465-30));
			enemy.setPosition(620, y + 10);
			this.addActor(enemy);
		}
		
		frame_count = (frame_count + 1) % 100;
		
		return pos + 2;
	};

	this.colision = function () {
		for (var i=0; i<actors.length; i++) {
			var a = actors[i];

			for (var j=i+1; j<actors.length; j++) {
				var b = actors[j];
				
				a.colision(b, player);
				b.colision(a, player);
			}
		}
	}
	
};

$(document).ready(function(){
	
	var stage_w = 2000;
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	
	window.requestAnimationFrame = requestAnimationFrame;
	 
	var player=0, front=0; bkg=0;

	var x=0, y=0;
	var stage = new Stage();
	stage.update(0);
	var pos = 0;
	
	function mainLoop () {
		setTimeout (function () {
			pos = stage.update(pos);
			requestAnimationFrame(mainLoop);
		}, 1000/30);
	};
	
	requestAnimationFrame(mainLoop);
});

