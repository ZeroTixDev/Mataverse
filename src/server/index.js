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
const arena = { r: 2000, baseR: 2000, minR: 300 };
// battle royale: 1-minute rounds (with overtime up to 2:00), 10s intermissions.
// 'lobby' = fewer than 2 players; joiners play freely and no round runs.
const INTERMISSION_TIME = 10;
let phase = 'lobby'; // 'lobby' | 'intermission' | 'live'
let phaseTimer = 0;
let roundStarters = 0;
global.gamePhase = () => phase;
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

// 4000x4000 arena, regenerated with variation each round: ring walls, corner
// blocks, and cardinal pillars. Everything snaps to the 50px grid and stays
// well away from the center so the endgame circle is always clear.
const obstacles = [];
let roundHue = Math.floor(Math.random() * 360);

function snap50(v) {
	return Math.round(v / 50) * 50;
}
function randRange(a, b) {
	return a + Math.random() * (b - a);
}
function regenerateObstacles() {
	obstacles.length = 0;
	const S = arena.baseR * 2;
	// inner ring walls (offset along their axis, never near the center),
	// often L-shaped with a stub pointing away from the center
	const wallLen = snap50(randRange(900, 1400));
	const wallDist = snap50(randRange(1000, 1250));
	const wallJitter = () => snap50(randRange(-200, 200));
	const ringWall = (horizontal, nearSide) => {
		const along = snap50(arena.baseR - wallLen / 2) + wallJitter();
		const edge = nearSide ? wallDist : S - wallDist - 50;
		if (horizontal) {
			obstacles.push(new Obstacle(along, edge, wallLen, 50));
		} else {
			obstacles.push(new Obstacle(edge, along, 50, wallLen));
		}
		if (Math.random() < 0.6) {
			const stubLen = snap50(randRange(150, 400));
			const stubAlong = Math.random() < 0.5 ? along : along + wallLen - 50;
			const stubEdge = nearSide ? edge - stubLen : edge + 50;
			if (horizontal) {
				obstacles.push(new Obstacle(stubAlong, stubEdge, 50, stubLen));
			} else {
				obstacles.push(new Obstacle(stubEdge, stubAlong, stubLen, 50));
			}
		}
	};
	ringWall(true, true);
	ringWall(true, false);
	ringWall(false, true);
	ringWall(false, false);
	// loose scatter cover in the outer band
	for (let i = 0; i < 6; i++) {
		const sSize = snap50(randRange(100, 300));
		const sAng = Math.random() * Math.PI * 2;
		const sDist = randRange(1150, 1650);
		obstacles.push(new Obstacle(
			snap50(arena.baseR + Math.cos(sAng) * sDist - sSize / 2),
			snap50(arena.baseR + Math.sin(sAng) * sDist - sSize / 2),
			sSize, sSize
		));
	}
	// corner blocks
	for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
		const size = snap50(randRange(250, 400));
		const px = snap50(randRange(600, 850));
		const py = snap50(randRange(600, 850));
		obstacles.push(new Obstacle(
			sx === 0 ? px : S - px - size,
			sy === 0 ? py : S - py - size,
			size, size
		));
	}
	// mid-field cover: one block per quadrant, close to the action,
	// but the inner 500px around the center always stays clear
	for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
		const size = snap50(randRange(100, 250));
		let dx = snap50(randRange(400, 750));
		let dy = snap50(randRange(400, 750));
		while (dx * dx + dy * dy < 500 * 500) {
			dx += 50;
		}
		obstacles.push(new Obstacle(
			sx === 0 ? arena.baseR - dx - size : arena.baseR + dx,
			sy === 0 ? arena.baseR - dy - size : arena.baseR + dy,
			size, size
		));
	}
	// second ring of smaller blocks hugging the clear zone (never inside 500px)
	for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
		const size = snap50(randRange(100, 200));
		let dx = snap50(randRange(350, 600));
		let dy = snap50(randRange(350, 600));
		while (dx * dx + dy * dy < 500 * 500) {
			dy += 50;
		}
		obstacles.push(new Obstacle(
			sx === 0 ? arena.baseR - dx - size : arena.baseR + dx,
			sy === 0 ? arena.baseR - dy - size : arena.baseR + dy,
			size, size
		));
	}
	// two short mid walls just outside the clear zone
	for (let i = 0; i < 2; i++) {
		const len = snap50(randRange(250, 450));
		const d = snap50(randRange(550, 800)) * (Math.random() < 0.5 ? -1 : 1);
		const along = snap50(randRange(-400, 400));
		const edge = arena.baseR + d - (d > 0 ? 0 : 50);
		if (Math.random() < 0.5) {
			obstacles.push(new Obstacle(snap50(arena.baseR - len / 2) + along, edge, len, 50));
		} else {
			obstacles.push(new Obstacle(edge, snap50(arena.baseR - len / 2) + along, 50, len));
		}
	}
	// cardinal pillars
	const northLen = snap50(randRange(350, 550));
	const southLen = snap50(randRange(350, 550));
	const westLen = snap50(randRange(350, 550));
	const eastLen = snap50(randRange(350, 550));
	obstacles.push(new Obstacle(arena.baseR - 50, snap50(randRange(350, 500)), 100, northLen));
	obstacles.push(new Obstacle(arena.baseR - 50, S - snap50(randRange(350, 500)) - southLen, 100, southLen));
	obstacles.push(new Obstacle(snap50(randRange(350, 500)), arena.baseR - 50, westLen, 100));
	obstacles.push(new Obstacle(S - snap50(randRange(350, 500)) - eastLen, arena.baseR - 50, eastLen, 100));
}
regenerateObstacles();

function endRound(victor) {
	phase = 'intermission';
	phaseTimer = INTERMISSION_TIME;
	const roundEnd = {
		name: victor != null ? victor.name : null,
		kills: victor != null ? victor.kills : 0,
		dmg: victor != null ? Math.round(victor.totalDamage) : 0,
	};
	arena.r = arena.baseR;
	roundHue = Math.floor(Math.random() * 360);
	regenerateObstacles();
	for (const id of Object.keys(clients)) {
		if (clients[id].menu) continue;
		send(id, { roundEnd });
		send(id, { obstacles: packObstacles() });
	}
}

function startRound() {
	phase = 'live';
	phaseTimer = 0;
	for (const p of Object.values(players)) {
		// respawn with nothing: fresh health, no kills, no powers
		p.eliminated = false;
		p.killedBy = null;
		p.kills = 0;
		p.totalDamage = 0;
		p.armor = p.maxArmor;
		p.powers = [];
		p.passiveUpgrade = true;
		p.activeUpgrade = true;
		p.respawn();
		p.dataChange = true;
	}
	roundStarters = Object.keys(players).length;
}
// const obstacles = darrowsToMata('{"players":{},"arrows":{},"obstacles":[{"x":600,"y":1200,"width":200,"height":200,"type":"obstacle"},{"x":0,"y":600,"width":200,"height":200,"type":"obstacle"},{"x":600,"y":0,"width":200,"height":200,"type":"obstacle"},{"x":1200,"y":600,"width":200,"height":200,"type":"obstacle"},{"x":650,"y":650,"width":100,"height":100,"type":"obstacle"}],"blocks":[],"arena":{"width":1400,"height":1400}}')

// let obstacles = darrowsToMata('{"players":{},"arrows":{},"obstacles":[{"x":1150,"y":750,"width":100,"height":100,"type":"obstacle"},{"x":1050,"y":850,"width":100,"height":100,"type":"obstacle"},{"x":400,"y":550,"width":50,"height":100,"type":"obstacle"},{"x":200,"y":920,"width":200,"height":30,"type":"obstacle"},{"x":730,"y":320,"width":250,"height":30,"type":"obstacle"},{"x":900,"y":250,"width":150,"height":70,"type":"obstacle"},{"x":720,"y":1230,"width":50,"height":50,"type":"obstacle"}],"blocks":[],"arena":{"width":1600,"height":1600}}')
function darrowsToMata(string) {
	const data = JSON.parse(string);
	arena.r = (data.arena.width+data.arena.height)/4;
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
				if (phase === 'live') {
					// BR: mid-round joiners spectate until the next intermission
					players[clientId].eliminated = true;
				}
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
				// global chat: relay to everyone in game (commands stay private)
				if (players[clientId] != undefined && typeof data.chatMessage === 'string' && !data.chatMessage.startsWith('/')) {
					const text = String(data.chatMessage).slice(0, 60);
					if (text.trim().length > 0) {
						for (const id of Object.keys(clients)) {
							if (clients[id].menu) continue;
							send(id, { chat: { name: players[clientId].name, text } });
						}
					}
				}
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
				if (players[clientId].powers.includes('Low Profile') && players[clientId].reloading === true) {
					const bullets = global.getBullets()
					for (const bulletId of Object.keys(bullets)) {
						const bullet = bullets[bulletId];
						if (bullet.parent != clientId) continue;
						bullet.life += 0.5;
						bullet.invis = true;
						bullet.pChanged = true;
					}
				}
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
							450,
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
							450,
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
							450,
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
							450,
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
							450,
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
							425,
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
							540,
							1.2,
		                );
					} else if (players[clientId].weapon === 'Burst') {
						players[clientId].burstTally = (players[clientId].burstTally + 1) % 3;
						let tally = players[clientId].burstTally;
						let speed = 355;
						let life = 1.2;
						// 0 - 1 - 2
						if (tally === 0) {
							// same
						} else if (tally === 1) {
							speed = 400;
							life = 1.07
						} else if (tally === 2) {
							speed = 445;
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
							425,
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
							370,
							1.3,
						)
					} else if (players[clientId].weapon === 'Energy') {
						bullets[bId] = new Bullet(
							bId,
							data.cx,
							data.cy,
							6,
							players[clientId].angle,
							clientId,
							data.approxPing,
							data.uid,
							430,
							0.9,
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

	// battle royale cycle
	if (phase === 'live') {
		phaseTimer += dt;
		const t = phaseTimer;
		if (t < 50) {
			// close in on the 300px final circle by 0:50
			arena.r = arena.baseR - (arena.baseR - arena.minR) * (t / 50);
		} else if (t < 60) {
			arena.r = arena.minR;
		} else {
			// overtime: the final circle slowly shrinks to nothing by 2:00
			arena.r = Math.max(arena.minR * (1 - (t - 60) / 60), 0);
		}
		const alive = Object.values(players).filter((p) => !p.eliminated);
		if ((roundStarters >= 2 && alive.length <= 1) || t >= 120 || Object.keys(players).length === 0) {
			endRound(alive.length === 1 ? alive[0] : null);
		}
	} else if (phase === 'intermission') {
		phaseTimer -= dt;
		arena.r = arena.baseR;
		if (Object.keys(players).length < 2) {
			// lost the second player: back to the open lobby
			phase = 'lobby';
			phaseTimer = 0;
		} else if (phaseTimer <= 0) {
			startRound();
		}
	} else {
		// lobby: free play, no round; a second player kicks off the countdown
		arena.r = arena.baseR;
		if (Object.keys(players).length >= 2) {
			phase = 'intermission';
			phaseTimer = INTERMISSION_TIME;
		}
	}

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
			if (player.eliminated) continue;
            if (bullet.toDelete) continue;
			// const playerData = player.getRelativeTickState(-bullet.ping*2)
			// if (playerData == undefined) continue;
			const { x, y } = player;
			send(bullet.parent, {
				playerData: { x, y, r: player.r },
			})
            const distX = x - bullet.x;
            const distY = y - bullet.y;
			const touchingPlayer = (
                distX * distX + distY * distY <
                (player.r + bullet.r) * (player.r + bullet.r)
            );
			if (player.powers.includes('Reflective Reload') && player.reflecting && !touchingPlayer) {
				if (distX * distX + distY* distY < 
				   (player.reflectRadius + bullet.r) * (player.reflectRadius + bullet.r)) {
						const angle = Math.atan2(player.y - bullet.y, player.x - bullet.x);// bullet to player
						// console.log(angle, player.angle)
						if (angle < player.angle - Math.PI/2 || angle > player.angle + Math.PI/2) {
							// console.log('successfculyl reflected')
							bullet.angle = player.angle;
							bullet.parent = player.id;
							bullet.curveFactor = 0;
							bullet.lifeTimer = 0;
							continue;
						}
				   }
			}
            if (touchingPlayer) {
				
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
				} else if (players[bullet.fromParent].weapon === 'Energy') {
					damage = 12;
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
					if (phase === 'live') {
						// battle royale: eliminated for the rest of the round;
						// remember the killer so the victim can spectate them
						player.killedBy = bullet.parent;
						player.eliminated = true;
					} else {
						player.respawn();
					}
                    if (players[bullet.parent] != undefined) {
                        players[bullet.parent].kills++;
                        players[bullet.parent].dataChange = true;
						players[bullet.parent].health = players[bullet.parent].maxHealth;
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
		// packedPlayers[playerId] = player.pack()
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
    // if (changePack.length > 0) {
		const round = {
			phase: phase === 'live' ? 1 : (phase === 'intermission' ? 0 : 2),
			t: Math.round(Math.max(phaseTimer, 0) * 10) / 10,
			r: Math.round(arena.r),
			hue: roundHue,
		};
        for (const clientId of Object.keys(clients)) {
            send(clientId, { changePack,  bulletPack, round });
        }
    // } else if (bulletPack.length > 0) {
    //     for (const clientId of Object.keys(clients)) {
    //         send(clientId, { bulletPack });
    //     }
    // }
	perfAmount += (Date.now() - perfStart);
}

setInterval(() => {
	console.log('took', perfAmount, 'ms');
	perfAmount = 0;
}, 1000);
