const wss = require('./setupServer.js')();
const Player = require('./player.js');
const Bullet = require('./bullet.js');
const msgpack = require('msgpack-lite');
const { Weapons, Powers } = require('../shared/sim.js');
const Obstacle = require('./obstacle.js');
const clients = {};
const players = {};
const packedPlayers = {};
const bullets = {};
global.tickRate = 120;
global.sendRate = 120;
// global.gameSpeed = 0.5;
let timer = 0;
let globalTick = 0;
const arena = { r: 700 };
global.getBullets = () => bullets;
let perfAmount = 0;
// const obstacles = [
// 	new Obstacle(250, 300, 400, 50),
// 	new Obstacle(250, 700, 400, 50),
// ];
// lol u have dark mode right
// const obstacles = darrowsToMata('{"players":{},"arrows":{},"obstacles":[{"x":1100,"y":1000,"width":600,"height":50,"type":"obstacle"},{"x":1100,"y":1750,"width":600,"height":50,"type":"obstacle"},{"x":1350,"y":1350,"width":50,"height":100,"type":"obstacle"},{"x":1400,"y":1350,"width":50,"height":100,"type":"obstacle"},{"x":900,"y":1000,"width":50,"height":800,"type":"obstacle"},{"x":1850,"y":1000,"width":50,"height":800,"type":"obstacle"},{"x":1300,"y":1350,"width":50,"height":100,"type":"bounce"},{"x":1300,"y":1450,"width":150,"height":50,"type":"bounce"},{"x":1450,"y":1350,"width":50,"height":150,"type":"bounce"},{"x":1300,"y":1300,"width":200,"height":50,"type":"bounce"},{"x":0,"y":1750,"width":700,"height":50,"type":"obstacle"},{"x":2200,"y":1750,"width":600,"height":50,"type":"obstacle"},{"x":2200,"y":1000,"width":600,"height":50,"type":"obstacle"},{"x":0,"y":1000,"width":700,"height":50,"type":"obstacle"},{"x":650,"y":1400,"width":50,"height":350,"type":"obstacle"},{"x":2200,"y":1050,"width":50,"height":350,"type":"obstacle"},{"x":2750,"y":1050,"width":50,"height":700,"type":"bounce"},{"x":0,"y":1050,"width":50,"height":700,"type":"bounce"},{"x":50,"y":1700,"width":600,"height":50,"type":"bounce"},{"x":2250,"y":1050,"width":500,"height":50,"type":"bounce"},{"x":2100,"y":2100,"width":100,"height":700,"type":"obstacle"},{"x":600,"y":2100,"width":100,"height":700,"type":"obstacle"},{"x":900,"y":2300,"width":50,"height":450,"type":"obstacle"},{"x":900,"y":2100,"width":1000,"height":50,"type":"obstacle"},{"x":950,"y":2300,"width":50,"height":450,"type":"bounce"},{"x":1900,"y":2300,"width":50,"height":450,"type":"obstacle"},{"x":1850,"y":2300,"width":50,"height":450,"type":"bounce"},{"x":1000,"y":2700,"width":850,"height":50,"type":"obstacle"},{"x":1350,"y":2150,"width":50,"height":150,"type":"obstacle"},{"x":1400,"y":2150,"width":50,"height":150,"type":"obstacle"},{"x":1790,"y":2300,"width":60,"height":60,"type":"bounce"},{"x":1000,"y":2300,"width":50,"height":50,"type":"bounce"},{"x":2200,"y":2100,"width":500,"height":50,"type":"obstacle"},{"x":600,"y":1900,"width":100,"height":200,"type":"obstacle"},{"x":200,"y":1400,"width":450,"height":50,"type":"obstacle"},{"x":2250,"y":1350,"width":350,"height":50,"type":"obstacle"},{"x":1100,"y":1700,"width":600,"height":50,"type":"bounce"},{"x":1100,"y":1050,"width":600,"height":50,"type":"bounce"},{"x":900,"y":700,"width":1000,"height":100,"type":"obstacle"},{"x":900,"y":100,"width":100,"height":600,"type":"obstacle"},{"x":1800,"y":0,"width":100,"height":600,"type":"obstacle"},{"x":1000,"y":100,"width":50,"height":600,"type":"bounce"},{"x":1750,"y":0,"width":50,"height":600,"type":"bounce"},{"x":650,"y":0,"width":50,"height":500,"type":"obstacle"},{"x":2200,"y":200,"width":50,"height":500,"type":"obstacle"},{"x":400,"y":1900,"width":200,"height":50,"type":"obstacle"},{"x":400,"y":2100,"width":50,"height":500,"type":"obstacle"},{"x":150,"y":2100,"width":50,"height":500,"type":"obstacle"},{"x":450,"y":2100,"width":50,"height":500,"type":"bounce"},{"x":100,"y":2100,"width":50,"height":500,"type":"bounce"},{"x":100,"y":2600,"width":400,"height":50,"type":"bounce"},{"x":600,"y":0,"width":50,"height":500,"type":"bounce"},{"x":2250,"y":200,"width":50,"height":500,"type":"bounce"},{"x":0,"y":0,"width":600,"height":50,"type":"bounce"},{"x":2300,"y":650,"width":500,"height":50,"type":"bounce"},{"x":2200,"y":2750,"width":600,"height":50,"type":"bounce"},{"x":2200,"y":2150,"width":500,"height":50,"type":"bounce"},{"x":2300,"y":2350,"width":50,"height":200,"type":"obstacle"},{"x":2550,"y":2350,"width":50,"height":200,"type":"obstacle"},{"x":2300,"y":2550,"width":300,"height":50,"type":"obstacle"},{"x":2350,"y":2500,"width":200,"height":50,"type":"bounce"},{"x":0,"y":700,"width":700,"height":50,"type":"obstacle"},{"x":2200,"y":700,"width":600,"height":50,"type":"obstacle"}],"blocks":[],"arena":{"width":2800,"height":2800}}')
// const obstacles = darrowsToMata('{"players":{},"arrows":{},"obstacles":[{"x":1100,"y":1000,"width":600,"height":50,"type":"obstacle"},{"x":1100,"y":1750,"width":600,"height":50,"type":"obstacle"},{"x":1350,"y":1350,"width":50,"height":100,"type":"obstacle"},{"x":1400,"y":1350,"width":50,"height":100,"type":"obstacle"},{"x":900,"y":1000,"width":50,"height":800,"type":"obstacle"},{"x":1850,"y":1000,"width":50,"height":800,"type":"obstacle"},{"x":0,"y":1750,"width":700,"height":50,"type":"obstacle"},{"x":2200,"y":1750,"width":600,"height":50,"type":"obstacle"},{"x":2200,"y":1000,"width":600,"height":50,"type":"obstacle"},{"x":0,"y":1000,"width":700,"height":50,"type":"obstacle"},{"x":650,"y":1400,"width":50,"height":350,"type":"obstacle"},{"x":2200,"y":1050,"width":50,"height":350,"type":"obstacle"},{"x":900,"y":2300,"width":50,"height":450,"type":"obstacle"},{"x":900,"y":2100,"width":1000,"height":50,"type":"obstacle"},{"x":1900,"y":2300,"width":50,"height":450,"type":"obstacle"},{"x":1000,"y":2700,"width":850,"height":50,"type":"obstacle"},{"x":1350,"y":2150,"width":50,"height":150,"type":"obstacle"},{"x":1400,"y":2150,"width":50,"height":150,"type":"obstacle"},{"x":610,"y":2210,"width":100,"height":200,"type":"obstacle"},{"x":900,"y":700,"width":1000,"height":100,"type":"obstacle"},{"x":900,"y":100,"width":100,"height":600,"type":"obstacle"},{"x":650,"y":0,"width":50,"height":500,"type":"obstacle"},{"x":2200,"y":200,"width":50,"height":500,"type":"obstacle"},{"x":400,"y":2100,"width":50,"height":500,"type":"obstacle"},{"x":150,"y":2100,"width":50,"height":500,"type":"obstacle"},{"x":2300,"y":2350,"width":50,"height":200,"type":"obstacle"},{"x":2550,"y":2350,"width":50,"height":200,"type":"obstacle"},{"x":2200,"y":700,"width":600,"height":50,"type":"obstacle"},{"x":200,"y":300,"width":200,"height":200,"type":"obstacle"},{"x":1400,"y":100,"width":50,"height":500,"type":"obstacle"}],"blocks":[],"arena":{"width":2800,"height":2800}}')
// const obstacles = [
// 	new Obstacle(arena.r - 10, arena.r - 400, 20, 200),
// 	new Obstacle(arena.r - 100, arena.r - 200, 200, 200),
// 	new Obstacle(arena.r - 10, arena.r + 200, 20, 200),
	
// ];
// const obstacles = darrowsToMata('{"players":{},"arrows":{},"obstacles":[{"x":300,"y":300,"width":200,"height":200,"type":"obstacle"},{"x":1100,"y":300,"width":200,"height":200,"type":"obstacle"},{"x":700,"y":700,"width":200,"height":200,"type":"obstacle"},{"x":300,"y":1100,"width":200,"height":200,"type":"obstacle"},{"x":1100,"y":1100,"width":200,"height":200,"type":"obstacle"},{"x":700,"y":500,"width":50,"height":200,"type":"obstacle"},{"x":850,"y":900,"width":50,"height":200,"type":"obstacle"}],"blocks":[],"arena":{"width":1600,"height":1600}}')

const obstacles = darrowsToMata('{"players":{},"arrows":{},"obstacles":[{"x":690,"y":600,"width":20,"height":200,"type":"obstacle"},{"x":600,"y":290,"width":200,"height":20,"type":"obstacle"},{"x":190,"y":400,"width":20,"height":200,"type":"obstacle"},{"x":920,"y":820,"width":160,"height":160,"type":"obstacle"},{"x":620,"y":1200,"width":160,"height":200,"type":"obstacle"},{"x":800,"y":190,"width":160,"height":160,"type":"obstacle"}],"blocks":[],"arena":{"width":1400,"height":1400}}')
// const obstacles = darrowsToMata('{"players":{},"arrows":{},"obstacles":[{"x":600,"y":1200,"width":200,"height":200,"type":"obstacle"},{"x":0,"y":600,"width":200,"height":200,"type":"obstacle"},{"x":600,"y":0,"width":200,"height":200,"type":"obstacle"},{"x":1200,"y":600,"width":200,"height":200,"type":"obstacle"},{"x":650,"y":650,"width":100,"height":100,"type":"obstacle"}],"blocks":[],"arena":{"width":1400,"height":1400}}')

function darrowsToMata(string) {
	const data = JSON.parse(string);
	const oX = (arena.r*2) - data.arena.width
	const oY = (arena.r*2) - data.arena.height;
	const obs = [];
	for (const ob of data.obstacles) {
		if (ob.type != undefined && ob.type != 'obstacle') continue;
		obs.push(new Obstacle(ob.x + oX/2, ob.y + oY/2, ob.width, ob.height));
	}
	// console.log(obs)
	return obs;
} 


let c = 0;
function createId() {
    c++;
    return c;
}

function packPlayers() {
    let pack = [];
    for (const player of Object.values(players)) {
        pack.push(player.pack());
    }
    return pack;
}

function packBullets() {
    let pack = [];
    for (const bullet of Object.values(bullets)) {
        pack.push(bullet.pack());
    }
    return pack;
}
function packObstacles() {
	let pack = [];
	for (const obstacle of Object.values(obstacles)) {
		pack.push(obstacle.pack());
	}
	return pack;
}

function send(id, data) {
    // clients[id]?.send(JSON.stringify(data));
	clients[id]?.send(msgpack.encode(data));
}

wss.on('connection', (socket, req) => {
    const clientId = createId();
	socket.binaryType = 'arraybuffer'
    clients[clientId] = socket;
    clients[clientId].menu = true;
	// console.log(Powers)
    send(clientId, {
        playerCount: Object.keys(players).length,
		powerMenu: Powers,
    });
    console.log('new client', clientId);

    socket.on('message', (msg) => {
		try {
			let data;
			try { 
	        	// data = JSON.parse(msg);
				data = msgpack.decode(new Uint8Array(msg))
			} catch(err) {
				throw new Error('INVALID DATA')
				console.log(err)
			}
	        // if (data.inputType != undefined) {
	        //     players[clientId]?.newInput(data);
	        // }
	        if (data.join != undefined && clients[clientId].menu) {
	            clients[clientId].menu = false;
	            players[clientId] = new Player(
	                clientId,
	                arena,
	                data.name,
	                data.armor,
					data.weapon,
	            );
	            send(clientId, {
	                selfId: clientId,
	                players: packPlayers(),
	                tickRate: sendRate,
	                globalTick,
	                arena,
					obstacles: packObstacles(),
	                bullets: packBullets(),
	            });
	            // console.log(Object.keys(clients))
	            for (const id of Object.keys(clients)) {
	                if (Number(id) !== clientId) {
	                    send(id, {
	                        newPlayer: players[clientId].pack(),
	                    });
	                }
	            }
	        }
			if (data.mousedown != undefined && players[clientId]) {
				players[clientId].mouseDown = true;
			}
			if (data.mouseup != undefined && players[clientId]) {
				players[clientId].mouseDown = false;
			}
			if (data.chatMessage != undefined) {
				players[clientId]?.sendChat(data.chatMessage)
				console.log(players[clientId].name, data.chatMessage)
			}
			if (data.activate != undefined && players[clientId]) {
				players[clientId].activate(players);
			}
			if (data.passiveUpgrade != undefined && players[clientId] && players[clientId].passiveUpgrade) {
				const power = Powers[data.passiveUpgrade];
				if (power != null) {
					players[clientId].addPower(data.passiveUpgrade);
					// players[clientId].passiveUpgrade = false;
				}
			}	
			if (data.activeUpgrade != undefined && players[clientId] && players[clientId].activeUpgrade) {
				const power = Powers[data.activeUpgrade];
				if (power != null) {
					players[clientId].addPower(data.activeUpgrade);
					// players[clientId].activeUpgrade = false;
				}
			}
			if (data.reloading != undefined && players[clientId]) {
				players[clientId].reloading = Boolean(data.reloading);
				if (players[clientId].powers.includes('Magz of War') && players[clientId].reloading === false) {
					players[clientId].magzTime = 1;
				}
				if (players[clientId].powers.includes('Shadow Reload')) {
					players[clientId].invis = false;//players[clientId].reloading;
					players[clientId].invisX = players[clientId].x;
					players[clientId].invisY = players[clientId].y;
					if (players[clientId].reloading && data.reloadTime != undefined) {
						players[clientId].iTimer = data.reloadTime;
					}
				}
				if (players[clientId].powers.includes('Accuracy Reload')) {
					if (players[clientId].reloading && data.reloadTime != undefined) {
						players[clientId].accurateNext = false;
					} else if (players[clientId].reloading && data.reloadTime == undefined) {
						// ^reloadTime as an identifier if player manually pressed R to reload
						players[clientId].accurateNext = true;
					}
				}
				if (players[clientId].powers.includes('Bended Barrel') && players[clientId].reloading) {
					players[clientId].bending = false;
					players[clientId].dataChange = true;
				}
				if (players[clientId].powers.includes('Reflective Reload') && players[clientId].reloading && data.reloadTime != undefined && data.ammo <= (Weapons[players[clientId].weapon].rrAmmo ?? 0)) {
					players[clientId].reflecting = true;
					players[clientId].reflectTimer = 0;
				}
				players[clientId].dataChange = true;
			}
	        if (data.angle != undefined) {
	            players[clientId].angle = data.angle;
				players[clientId].dataChange = true;
				// return;
	            if (data.shoot != undefined && players[clientId].bendCooldownTimer <= 0) {
					// if (players[clientId].lastShot != undefined) {
					// 	const cooldown = players[clientId].weapon === 'Burst' ? 0.1: Weapons[players[clientId].weapon].cooldown
					// 	if ((Date.now() / 1000) - players[clientId].lastShot > cooldown + 1) {
					// 		// good
					// 	} else {
					// 		players[clientId].lastShot = (Date.now()/1000)
					// 		return console.log('dropped a shot')
					// 	}
					// }
					// players[clientId].lastShot = (Date.now()/1000)
					let dAngle = players[clientId].angle - Math.PI / 2;
	                let bId = `${createId()}b`;
					let bIds = [];
					bIds.push(bId)
					const gunWidth = Weapons[players[clientId].weapon].gunWidth ?? 6;
					const gunHeight = players[clientId].r * (Weapons[players[clientId].weapon].gunHeight ?? 2);
					const err = Math.random() * ((Weapons[players[clientId].weapon].err ?? 0)*2) - (Weapons[players[clientId].weapon].err ?? 0);
					const recoil = Weapons[players[clientId].weapon].recoil ?? 0;
					data.cx = players[clientId].x +
	                Math.cos(dAngle) * (players[clientId].r - gunWidth) /*+ 2 + (players[clientId].armor / 100) * 13)*/ +  Math.cos(players[clientId].angle) * (gunHeight*1.5)
            		data.cy = players[clientId].y +
	                Math.sin(dAngle) * (players[clientId].r - gunWidth) /*+ 2 + (players[clientId].armor / 100) * 13)*/ +
	                Math.sin(players[clientId].angle) * (gunHeight*1.5);
					// players[clientId].xv += Math.cos(players[clientId].angle)*recoil;
					// players[clientId].yv += Math.sin(players[clientId].angle)*recoil;
					let ogAngle = players[clientId].angle;
					let errMult = 1;
					if (players[clientId].powers.includes('Accuracy Reload') && players[clientId].accurateNext) {
						errMult = 0;
					}
					players[clientId].angle += (err*errMult)/360;
					if (players[clientId].weapon === 'Shotgun') {
		                bullets[bId] = new Bullet(
		                    bId,
		                    data.cx,
		                    data.cy,
		                    7,
		                    players[clientId].angle,
		                    clientId,
		                    data.approxPing,
		                    data.uid,
							400,
							0.6,
		                );
						bId = `${createId()}b`;
						bIds.push(bId)
		                bullets[bId] = new Bullet(
		                    bId,
		                    data.cx,
		                    data.cy,
		                    7,
		                    players[clientId].angle - 0.1,
		                    clientId,
		                    data.approxPing,
		                    data.uid - 1,
							400,
							0.6,
		                );
						bId = `${createId()}b`;
						bIds.push(bId)
		                bullets[bId] = new Bullet(
		                    bId,
		                    data.cx,
		                    data.cy,
		                    7,
		                    players[clientId].angle + 0.1,
		                    clientId,
		                    data.approxPing,
		                    data.uid + 1,
							400,
							0.6,
		                );
						bId = `${createId()}b`;
						bIds.push(bId)
		                bullets[bId] = new Bullet(
		                    bId,
		                    data.cx,
		                    data.cy,
		                    7,
		                    players[clientId].angle - 0.1/2,
		                    clientId,
		                    data.approxPing,
		                    data.uid - 2,
							400,
							0.6,
		                );
						bId = `${createId()}b`;
						bIds.push(bId)
		                bullets[bId] = new Bullet(
		                    bId,
		                    data.cx,
		                    data.cy,
		                    7,
		                    players[clientId].angle + 0.1/2,
		                    clientId,
		                    data.approxPing,
		                    data.uid + 2,
							400,
							0.6,
		                );
					} else if (players[clientId].weapon === 'Pistol') {
						bullets[bId] = new Bullet(
		                    bId,
		                    data.cx,
		                    data.cy,
		                    7.5,
		                    players[clientId].angle,
		                    clientId,
		                    data.approxPing,
		                    data.uid,
							375,
							0.9,
		                );
					} else if (players[clientId].weapon === 'Rifle') {
						bullets[bId] = new Bullet(
		                    bId,
		                    data.cx,
		                    data.cy,
		                    7,
		                    players[clientId].angle,
		                    clientId,
		                    data.approxPing,
		                    data.uid,
							475,
							1.2,
		                );
					} else if (players[clientId].weapon === 'Burst') {
						players[clientId].burstTally = (players[clientId].burstTally + 1) % 3;
						let tally = players[clientId].burstTally;
						let speed = 310;
						let life = 1.2;
						// 0 - 1 - 2
						if (tally === 0) {
							// same
						} else if (tally === 1) {
							speed = 350;
							life = 1.07
						} else if (tally === 2) {
							speed = 390;
							life = 0.96;
						}
						bullets[bId] = new Bullet(
							bId,
							data.cx,
							data.cy,
							6.5,
							players[clientId].angle,
							clientId,
							data.approxPing,
							data.uid,
							speed,
							life,
						)
					} else if (players[clientId].weapon === 'SMG') {
						bullets[bId] = new Bullet(
							bId,
							data.cx,
							data.cy,
							5,
							players[clientId].angle,
							clientId,
							data.approxPing,
							data.uid,
							375,
							0.6,
						)
					} else if (players[clientId].weapon === 'LMG') {
						bullets[bId] = new Bullet(
							bId,
							data.cx,
							data.cy,
							7,
							players[clientId].angle,
							clientId,
							data.approxPing,
							data.uid,
							325,
							1.3,
						)
					}
					players[clientId].angle = ogAngle;
					if (bullets[bId] != undefined) {
						for (const bid of bIds) {
							if (data.magz != undefined) {
								bullets[bid].magz = true;
							}
							if (players[clientId].powers.includes('Bended Barrel') && players[clientId].bending && players[clientId]._bendCurve != undefined) {
								// calculate curve factor eq
								// dist = muzzle (or parent player center for now because lazy) and center of nearest player
								// rot = angle of rotation of gun relative to player -180 to 180
								// spd = bullet speed every tick (bullet.speed*(1/120))
								// (rot*-2)/(((csc(rot) * dist/2)*rot*2)/ spd)
								// bullets[bid].curveFactor = -(players[clientId].angle - players[clientId].bendCurveFactor) * (1/bullets[bid].life);
								// bullets[bid].curveFactor = players[clientId].bendCurveFactor;
								// bullets[bid].curveFactor = ( (2 * (bullets[bid].speed) * Math.sin(players[clientId]._bendCurve.rotation * Math.PI/180)) / players[clientId]._bendCurve.dist ) * 1.15
								// bullets[bid].curveFactor = ((2 * bullets[bid].speed * Math.sin(players[clientId]._bendCurve.rotation * (Math.PI/180))) / players[clientId]._bendCurve.dist);
								// csc = 1/sinx
								const rot = players[clientId]._bendCurve.rotation * (Math.PI/180);
								const dist = players[clientId]._bendCurve.dist;
								const spd = bullets[bid].speed;
								const csc = (x) => 1/Math.sin(x)
								bullets[bid].curveFactor = -( (rot * -2) / (
									( (csc(rot) * dist/2) * rot * 2 ) / spd
								))
								players[clientId]._bendCurve.factor = bullets[bid].curveFactor;
								players[clientId].dataChange = true;
								// console.log(bullets[bid].curveFactor, players[clientId]._bendCurve)
							}
						}
		                for (const id of Object.keys(clients)) {
		                    const client = clients[id];
		                    if (client.menu) continue;
							for (const bid of bIds) {
			                    send(id, {
			                        newBullet: bullets[bid].pack(),
			                    });
							}
		                }
					}
	            }
	        }
	        if (data.input != undefined) {
	            if (players[clientId]?.processInput(data.input) == 'kick') {
					throw new Error('Invalid input again lmao')
				}
	        }
			if (data.typing != undefined) {
				players[clientId]?.changeTyping(data.typing)
			}
	        if (data.ping != undefined) {
	            send(clientId, { pong: data.ping });
	        }
		} catch(err) {
			console.log(clientId+ ' user sent invalid data, and will be kicked gracefully');
			console.log(err)
			clients[clientId].terminate()
			console.log('messgae: ', msg)
		}
    });

    socket.on('close', (event) => {
		console.log(
			`player [${players[clientId]?.name}] disconnect: code ${event}`
		);
        delete clients[clientId];
        delete players[clientId];
        for (const id of Object.keys(clients)) {
            send(id, {
                removePlayer: clientId,
            });
        }
		 
    });
});

setInterval(ServerTick, Math.round(1000 / sendRate));

setInterval(() => {
    // menu player updates
    const playerCount = Object.keys(players).length;
    for (const clientId of Object.keys(clients)) {
        if (clients[clientId].menu) {
            send(clientId, { playerCount });
        }
    }
}, 1000);

let lastTime = Date.now();

function ServerTick() {
	let perfStart = Date.now()
    const dt = (Date.now() - lastTime) / 1000;
    lastTime = Date.now();

    timer += dt;
    while (timer >= 1 / tickRate) {
        timer -= 1 / tickRate;
        globalTick++;
        for (const bullet of Object.values(bullets)) {
            bullet.update(1 / tickRate, obstacles, players);
        }
        // if (globalTick % (tickRate * 3) === 0) {
        //     for (const clientId of Object.keys(clients)) {
        //         send(clientId, {
        //             globalTick,
        //         });
        //     }
        // }
    }

	

    for (const playerId of Object.keys(players)) {
        const player = players[playerId];
        player.simulate(dt, players, obstacles);
		continue;
		let clientId = playerId;
		let data = {}
		if (player.mouseDown && player.currentBulletCooldown >= player.bulletCooldown) {
			player.currentBulletCooldown = 0;
			let dAngle = players[clientId].angle - Math.PI / 2;
			let bId = `${createId()}b`;
			let bIds = [];
			bIds.push(bId)
			const gunWidth = Weapons[players[clientId].weapon].gunWidth ?? 6;
			const gunHeight = players[clientId].r * (Weapons[players[clientId].weapon].gunHeight ?? 2);
			const err = Math.random() * ((Weapons[players[clientId].weapon].err ?? 0)*2) - (Weapons[players[clientId].weapon].err ?? 0);
			const recoil = Weapons[players[clientId].weapon].recoil ?? 0;
			data.cx = players[clientId].x +
			Math.cos(dAngle) * (players[clientId].r - gunWidth) /*+ 2 + (players[clientId].armor / 100) * 13)*/ +  Math.cos(players[clientId].angle) * (gunHeight*1.5)
			data.cy = players[clientId].y +
			Math.sin(dAngle) * (players[clientId].r - gunWidth) /*+ 2 + (players[clientId].armor / 100) * 13)*/ +
			Math.sin(players[clientId].angle) * (gunHeight*1.5);
			// players[clientId].xv += Math.cos(players[clientId].angle)*recoil;
			// players[clientId].yv += Math.sin(players[clientId].angle)*recoil;
			let ogAngle = players[clientId].angle;
			let errMult = 1;
			if (players[clientId].powers.includes('Accuracy Reload') && players[clientId].accurateNext) {
				errMult = 0;
			}
			players[clientId].angle += (err*errMult)/360;
			if (players[clientId].weapon === 'Shotgun') {
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7,
					players[clientId].angle,
					clientId,
					data.approxPing,
					data.uid,
					400,
					0.6,
				);
				bId = `${createId()}b`;
				bIds.push(bId)
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7,
					players[clientId].angle - 0.1,
					clientId,
					data.approxPing,
					data.uid - 1,
					400,
					0.6,
				);
				bId = `${createId()}b`;
				bIds.push(bId)
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7,
					players[clientId].angle + 0.1,
					clientId,
					data.approxPing,
					data.uid + 1,
					400,
					0.6,
				);
				bId = `${createId()}b`;
				bIds.push(bId)
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7,
					players[clientId].angle - 0.1/2,
					clientId,
					data.approxPing,
					data.uid - 2,
					400,
					0.6,
				);
				bId = `${createId()}b`;
				bIds.push(bId)
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7,
					players[clientId].angle + 0.1/2,
					clientId,
					data.approxPing,
					data.uid + 2,
					400,
					0.6,
				);
			} else if (players[clientId].weapon === 'Pistol') {
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7.5,
					players[clientId].angle,
					clientId,
					data.approxPing,
					data.uid,
					375,
					1.2,
				);
			} else if (players[clientId].weapon === 'Rifle') {
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7,
					players[clientId].angle,
					clientId,
					data.approxPing,
					data.uid,
					475,
					1.5,
				);
			} else if (players[clientId].weapon === 'Burst') {
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					6.5,
					players[clientId].angle,
					clientId,
					data.approxPing,
					data.uid,
					375,
					1,
				)
			} else if (players[clientId].weapon === 'SMG') {
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					5,
					players[clientId].angle,
					clientId,
					data.approxPing,
					data.uid,
					375,
					0.6,
				)
			} else if (players[clientId].weapon === 'LMG') {
				bullets[bId] = new Bullet(
					bId,
					data.cx,
					data.cy,
					7,
					players[clientId].angle,
					clientId,
					data.approxPing,
					data.uid,
					325,
					1.3,
				)
			}
			players[clientId].angle = ogAngle;
			if (bullets[bId] != undefined) {
				for (const bid of bIds) {
					if (data.magz != undefined) {
						bullets[bid].magz = true;
					}
					if (players[clientId].powers.includes('Bended Barrel') && players[clientId].bending && players[clientId]._bendCurve != undefined) {
						// calculate curve factor eq
						// dist = muzzle (or parent player center for now because lazy) and center of nearest player
						// rot = angle of rotation of gun relative to player -180 to 180
						// spd = bullet speed every tick (bullet.speed*(1/120))
						// (rot*-2)/(((csc(rot) * dist/2)*rot*2)/ spd)
						// bullets[bid].curveFactor = -(players[clientId].angle - players[clientId].bendCurveFactor) * (1/bullets[bid].life);
						// bullets[bid].curveFactor = players[clientId].bendCurveFactor;
						// bullets[bid].curveFactor = ( (2 * (bullets[bid].speed) * Math.sin(players[clientId]._bendCurve.rotation * Math.PI/180)) / players[clientId]._bendCurve.dist ) * 1.15
						// bullets[bid].curveFactor = ((2 * bullets[bid].speed * Math.sin(players[clientId]._bendCurve.rotation * (Math.PI/180))) / players[clientId]._bendCurve.dist);
						// csc = 1/sinx
						const rot = players[clientId]._bendCurve.rotation * (Math.PI/180);
						const dist = players[clientId]._bendCurve.dist;
						const spd = bullets[bid].speed;
						const csc = (x) => 1/Math.sin(x)
						bullets[bid].curveFactor = -( (rot * -2) / (
							( (csc(rot) * dist/2) * rot * 2 ) / spd
						))
						players[clientId]._bendCurve.factor = bullets[bid].curveFactor;
						players[clientId].dataChange = true;
						// console.log(bullets[bid].curveFactor, players[clientId]._bendCurve)
					}
				}
				for (const id of Object.keys(clients)) {
					const client = clients[id];
					if (client.menu) continue;
					for (const bid of bIds) {
						send(id, {
							newBullet: bullets[bid].pack(),
						});
					}
				}
			}
		}
    }

	for (const playerId of Object.keys(players)) {
		const player = players[playerId];
		player.denied = (players[player.denyER]?.denying || player.denying) ?? false;
	}
    // hit detection/collision/bullet-player
    for (const bK of Object.keys(bullets)) {
        const bullet = bullets[bK];
        if (bullet.toDelete) continue;
        let removed = false;
        for (const pK of Object.keys(players)) {
            const player = players[pK];
            if (pK == bullet.parent) continue;
            if (bullet.toDelete) continue;
			// const playerData = player.getRelativeTickState(-bullet.ping*2)
			// if (playerData == undefined) continue;
			const { x, y } = player;
			send(bullet.parent, {
				playerData: { x, y, r: player.r },
			})
            const distX = x - bullet.x;
            const distY = y - bullet.y;
			if (player.powers.includes('Reflective Reload') && player.reflecting) {
				if (distX * distX + distY* distY < 
				   (player.reflectRadius + bullet.r) * (player.reflectRadius + bullet.r)) {
						const angle = Math.atan2(player.y - bullet.y, player.x - bullet.x);// bullet to player
						// console.log(angle, player.angle)
						if (angle < player.angle - Math.PI/2 || angle > player.angle + Math.PI/2) {
							// console.log('successfculyl reflected')
							bullet.angle = player.angle;
							bullet.parent = player.id;
							bullet.lifeTimer = 0;
							continue;
						}
				   }
			}
            if (
                distX * distX + distY * distY <
                (player.r + bullet.r) * (player.r + bullet.r)
            ) {
				
				// player.xv += Math.cos(bullet.angle)*10;
				// player.yv += Math.sin(bullet.angle)*10
				let damage;
				if (players[bullet.fromParent] == undefined) {
					damage = 0
				} else if (players[bullet.fromParent].weapon === 'Shotgun') {
					damage = Math.round(5 + 11 * (1-(bullet.lifeTimer / bullet.life)))
				} else if (players[bullet.fromParent].weapon === 'Pistol') {
					damage = 30
					// damage = Math.round(30 + 8 * (1-(bullet.lifeTimer/bullet.life)));
				} else if (players[bullet.fromParent].weapon === 'Rifle') {
					damage = 70
					// damage = Math.round(65 + 10* (1-(bullet.lifeTimer/bullet.life)));
				} else if (players[bullet.fromParent].weapon === 'Burst') {
					damage = Math.round(20 + 30	* (bullet.lifeTimer/bullet.life));
					damage = Math.min(damage, 30);
					// damage = Math.round(20 + 10 * (1-(bullet.lifeTimer/bullet.life)));
				} else if (players[bullet.fromParent].weapon === 'SMG') {
					damage = Math.round(7 + 2 * ((bullet.lifeTimer/bullet.life)));
					// damage = Math.round(3 + 3 * (1-(bullet.lifeTimer/bullet.life)));
				} else if (players[bullet.fromParent].weapon === 'LMG') {
					damage = Math.round(8 + 4 * (1-(bullet.lifeTimer/bullet.life)));
				}
				let mult = 1;
				if (bullet.magz || bullet.rev) {
					mult = 1.5;
				}
				damage *= mult;
				damage = Math.round(damage)
                player.takeDamage(damage);
                send(bullet.parent, {
                    hitDamage: damage,
                    hitX: bullet.x,
                    hitY: bullet.y,
					uid: bullet.uid,
                });
				if (players[bullet.parent] != undefined) {
					players[bullet.parent].totalDamage += damage;
					// if (players[bullet.parent].totalDamage - damage < 200 && players[bullet.parent].totalDamage >= 200) {
					// 	// passive upgrade
					// 	let passives = ['Magz of War', 'Shadow Reload'];
					// 	players[bullet.parent].powers.push(passives[Math.floor(Math.random() * passives.length)]);
					// 	players[bullet.parent].dataChange = true;
					// }
					// if (players[bullet.parent].totalDamage - damage < 400 && players[bullet.parent].totalDamage >= 400) {
					// 	// active upgrade
					// 	let actives = ['Quantum Field', 'Bended Barrel'];
					// 	players[bullet.parent].powers.push(actives[Math.floor(Math.random() * actives.length)]);
					// 	players[bullet.parent].dataChange = true;
					// }
				}
				send(pK, {
					gotHit: true,
				})
                if (player.health <= 0) {
                    // dead
					players[bullet.parent].currentShift += players[bullet.parent].shiftLength / 2;
					players[bullet.parent].currentShift = Math.min(players[bullet.parent].currentShift, players[bullet.parent].shiftLength)
					send(bullet.parent, {
						killed: player.name,
					});
                    player.respawn();
                    if (players[bullet.parent] != undefined) {
                        players[bullet.parent].kills++;
                        players[bullet.parent].dataChange = true;
						players[bullet.parent].health = 100;
						players[bullet.parent].armor = players[bullet.parent].maxArmor;
                        player.dataChange = true;
                    }
                }
                bullet.toDelete = true;
                removed = true;
                break;
            }
        }
    }
	// can u see this? YES
	// ok cool

    const changePack = [];
    for (const playerId of Object.keys(players)) {
        const player = players[playerId];
		if (player.inStorm) {
			send(playerId, {
				gotHit: true,
				storm: true,
			})
		}
		// this is where the main change pcks are sent
        if (player.changed || player.dataChange) {
            if (player.changed) {
                // send(playerId, { serverPayload: player.changePayload });
                // player.changed = false;
                // player.changePayload = null;
            }
            if (player.dataChange) {
                player.dataChange = false;
            }
            // changePack.push(player.diffPack(packedPlayers[playerId]));
        }
		changePack.push(player.pack())
		packedPlayers[playerId] = player.pack()
    }
    const bulletPack = [];
    const bDel = [];
    for (const bulletId of Object.keys(bullets)) {
        const bullet = bullets[bulletId];
        if (bullet.toDelete) {
            bDel.push(bulletId);
            bulletPack.push({ remove: bulletId });
        } else if (bullet.pChanged) {
            bulletPack.push(bullet.pack());
			bullet.pChanged = false;
        } else {
			bulletPack.push(bullet.updatePack())
		}
    }
    for (const id of bDel) {
        delete bullets[id];
    }
    if (changePack.length > 0) {
        for (const clientId of Object.keys(clients)) {
            send(clientId, { changePack, changeTick: globalTick, bulletPack });
        }
    } else if (bulletPack.length > 0) {
        for (const clientId of Object.keys(clients)) {
            send(clientId, { bulletPack });
        }
    }
	perfAmount += (Date.now() - perfStart);
}

setInterval(() => {
	// console.log('took', perfAmount, 'ms');
	perfAmount = 0;
}, 1000);
