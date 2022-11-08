/*
his.shiftLength = 3;
		this.currentShift = 3;
		this.shiftRegenTimer = 0;
		this.shiftRegenTime = 1.5
*/
if (!globalThis.onClient) {
	global.SAT = require('sat');
}
// lol
const Weapons = {
	Pistol: { cooldown: 0.55, gunWidth: 4, gunHeight: 1.4, ammo: 12, reloadTime: 2, err: 20, color: '#000000', recoil: 2},
	Shotgun: { cooldown: 1.2, gunWidth: 6, gunHeight: 2, ammo: 6, reloadTime: 3 , err: 10, color: '#611f04', recoil: 7},
	Rifle: {cooldown: 1.6, gunWidth: 2.5, gunHeight: 2.7, ammo: 7, reloadTime: 2.25, err: 5, color: '#49004f', recoil: 0},
	Burst: { cooldown: 1.1, gunWidth: 4, gunHeight: 2.4, ammo: 18, reloadTime: 2.75, err: 20, color: '#6e0400', recoil: 1},
	SMG: { cooldown: 0.07, gunWidth: 3, gunHeight: 1.6, ammo: 24, reloadTime: /*1.75*/1.75, err: 40, color: '#090152'/*'#043f7a'*/, recoil: 0.5},
	LMG: { cooldown: 0.13, gunWidth: 6.5, gunHeight: 2, ammo: 75, reloadTime: 4.5, err: 35, color: '#00332d', recoil: 0},
}

const Powers = {
	'Magz of War': {
		color: '#6775cf',
		type: 'Passive',
		desc: 'After reloading, your bullets will have a damage multiplier (1.5x) for one second. During this, your player and bullets will be light blue. This ability will also make reloading take one second longer.'
	},
	'Shadow Reload': {
		color: '#ff661f',
		type: 'Passive',
		desc: 'Upon reloading with ammo left, you will become invisible for the last second of the reload while leaving an identical hologram behind you. You will reappear [0.25s] before your reload is finished.'
	},
	'Angelic Lunge': {
		color: '#ff1f1f',
		type: 'Active',
		desc: 'Upon activation, you will charge for [1s] while losing 30 health and then lunge in the direction of your gun but lose all of your sprint. You need a full sprint bar for activation. This ability can kill you.',
	},
	'Quantum Field': {
		color: '#ffffff',
		type: 'Active',
		desc: 'Upon activation, you will create a quantum field at your position that lasts [5s]. Inside this quantum field, bullets can go through walls but bullets created inside a wall will be destroyed. [12s]'
	},
	'Bullet Boomerang': {
		color: '#1fff5a',
		type: 'Active',
		desc: 'Upon activation, your bullets will reverse their velocity and go in the opposite direction with 1.5x damage boost. The lifespan of the bullets are extended. [0.5s]',
	},
	'War Tank': {
		color: '#545454',
		type: 'Passive',
		desc: 'You gain 50 armor with this passive but your sprint duration is halved.',
	},
	'Bended Barrel': {
		color: '#8cff78',//'#9900ff',
		type: 'Active',
		desc: 'Upon activation, your bullets will curve to the nearest target. The curve will be fixed on new bullets and will only reset after you reload. [5s]',
	},
	'Accuracy Reload': {
		color: 'blue',
		type: 'Passive',
		desc: 'Upon reloading with no ammo left, you will have enhanced accuracy on your next magazine. These reloads will take [2s] longer and your player will be indicated blue while you have enhanced accuracy.'
	}
}

globalThis.gameSpeed = 1;


function simPlayer(player, inputPayload, delta, players, arena, obstacles=[]) {
	let dt = delta * global.gameSpeed;
    let _input = inputPayload.input;
    let _x = player.x;
    let _y = player.y;
    let _xv = player.xv;
    let _yv = player.yv;
	let _currentShift = player.currentShift;
	let _shiftRegenTimer = player.shiftRegenTimer;
    let armorDec = 1 - (player.maxArmor / 100) * 0.4;
    let speed = player.speed * armorDec;
	_shiftRegenTimer += dt;
	if (_shiftRegenTimer >= player.shiftRegenTime) {
		_currentShift += dt*1.2;
		_shiftRegenTimer = player.shiftRegenTime;
	}
	_currentShift = Math.min(_currentShift, player.shiftLength);
	if (_input.shift && _currentShift > 0) {
		_shiftRegenTimer = 0;
		_currentShift -= dt*1.5;
		_currentShift = Math.max(_currentShift, 0);
		speed *= 1.5
	}
    _xv += (_input.right - _input.left) * dt * speed;
    _yv += (_input.down - _input.up) * dt * speed;
    _xv *= 0.94;
    _yv *= 0.94;
    _x += player.xv;
    _y += player.yv;
    // if (!globalThis.onClient) {
    // reconciliation test
    // if (_x - player.r < 0) {
    //     _x = player.r;
    // }
    // if (_x + player.r > arena.w) {
    //     _x = arena.w - player.r;
    // }
    // if (_y - player.r < 0) {
    //     _y = player.r;
    // }
    // if (_y + player.r > arena.h) {
    //     _y = arena.h - player.r;
    // }
    // }
	// if (!globalThis.onClient) {
	    for (const key of Object.keys(players)) {
	        const player2 = players[key];
			let p2x = player2.x;
			let p2y = player2.y;
	        if (player2.id === player.id) continue;
			if (globalThis.onClient) {
				// player x/ys in client are smoothed, must use server pos
				p2x = player2.serverX;
				p2y = player2.serverY;
			}
	        const distX = _x - p2x;
	        const distY = _y - p2y;
	        if (
	            distX * distX + distY * distY <
	            (player.r + player2.r) * (player.r + player2.r)
	        ) {
	            // is colliding with player !!! lets do something interesting
	            const magnitude = Math.sqrt(distX * distX + distY * distY) || 1;
	            const xv = distX / magnitude;
	            const yv = distY / magnitude;
	            const angle = Math.atan2(yv, xv);
				let old = { x: _x, y: _y }
	            _x = p2x + (player2.r + player.r + 0.001) * (Math.cos(angle));
	            _y = p2y + (player2.r + player.r + 0.001) * (Math.sin(angle));
				player2.x = _x - (player2.r + player.r + 0.001) * (Math.cos(angle));
				player2.y = _y - (player2.r + player.r + 0.001) * (Math.sin(angle))
				// player2.xv = _xv;
				// player2.yv = _yv;
				// _xv += xv*0.005
				// _yv += yv*0.005
				// player2.xv -= xv*0.005
				// player2.yv -= yv*0.005
	            // _xv += xv * 15;
	            // _yv += yv * 15
	        }
	    }

	if (!globalThis.onClient) {
		for (const ob of obstacles) {
			const p = boundPlayerObstacle({x: _x, y: _y, xv: _xv, yv: _yv, r: player.r}, ob);
			_x = p.x;
			_y = p.y;
			_xv = p.xv;
			_yv = p.yv;
		}
	}
							
	
	// }
    return new StatePayload(inputPayload.tick, _x, _y, _xv, _yv, _currentShift, _shiftRegenTimer);
}

function boundPlayerObstacle({x, y, xv, yv, r}, obstacle) {
	// if (!globalThis.SAT) return;
	const { Circle, Vector, Response, testPolygonCircle } = SAT
    // console.log(player)
    const rectHalfSizeX = obstacle.w / 2;
    const rectHalfSizeY = obstacle.h / 2;
    const rectCenterX = obstacle.x + rectHalfSizeX;
    const rectCenterY = obstacle.y + rectHalfSizeY;
    const distX = Math.abs(x - rectCenterX);
    const distY = Math.abs(y - rectCenterY);
    if (
        distX < rectHalfSizeX + r &&
        distY < rectHalfSizeY + r
    ) {
        const playerSat = new Circle(
            new Vector(x, y),
            r
        );
        const res = new Response();
        const collision = testPolygonCircle(obstacle.sat, playerSat, res);
        if (collision) {
			x += res.overlapV.x;
			y += res.overlapV.y;
			if (Math.abs(res.overlapV.y) > Math.abs(res.overlapV.x)) {
				yv = 0
			} else {
				xv = 0
			}
        }
    }
	return {x, y, xv, yv}
}

function InputPayload(tick = undefined, input = undefined) {
    return {
        tick,
        input,
        pack: function () {
            return { tick: this.tick, input: this.input };
        },
    };
}

function StatePayload(
    tick = undefined,
    x = undefined,
    y = undefined,
    xv = undefined,
    yv = undefined,
	currentShift = undefined,
	shiftRegenTimer = undefined,
) {
    return { tick, x, y, xv, yv, currentShift, shiftRegenTimer };
}

function compareStates(state1, state2) { // ^ corresponds to state payload
	let sameState = true;
	const reqs = Object.keys(StatePayload())
	for (const key of Object.keys(state1)) {
		if (reqs.includes(key) && Math.round(state1[key]) !== Math.round(state2[key])) {
			sameState = false;
			// console.log('diff state', key, state1[key] - state2[key])
			break;
		}
	}
	if (sameState) {
		// console.log('nothing changed' + Math.random())
	}
	return { same: sameState }
}

module.exports = { simPlayer, StatePayload, InputPayload, Weapons, compareStates, Powers };
