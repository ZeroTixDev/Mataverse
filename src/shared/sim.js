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
	Pistol: { cooldown: 0.55, gunWidth: 4, gunHeight: 1.4, ammo: 12, reloadTime: 2, err: 20, color: '#000000', recoil: 2, rrAmmo: 6},
	Shotgun: { cooldown: 1.2, gunWidth: 6, gunHeight: 2, ammo: 6, reloadTime: 3 , err: 10, color: '#611f04', recoil: 7, rrAmmo: 2, },
	Rifle: {cooldown: 1.6, gunWidth: 2.5, gunHeight: 2.7, ammo: 7, reloadTime: 2.25, err: 5, color: '#49004f', recoil: 0, rrAmmo: 3},
	Burst: { cooldown: 1.1, gunWidth: 4, gunHeight: 2.4, ammo: 18, reloadTime: 2.75, err: 20, color: '#6e0400', recoil: 1, rrAmmo: 6},
	SMG: { cooldown: 0.07, gunWidth: 3, gunHeight: 1.6, ammo: 24, reloadTime: /*1.75*/1.75, err: 40, color: '#090152'/*'#043f7a'*/, recoil: 0.5, rrAmmo: 0},
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
		exp: true,
		desc: 'Upon activation, you will charge for [1s] while losing 30 health and then lunge in the direction of your gun but lose all of your sprint. You need a full sprint bar for activation. This ability can kill you.',
	},
	'Quantum Field': {
		color: '#ff4242',
		// color: '#ffffff',
		type: 'Active',
		desc: 'Upon activation, you will create a quantum field at your position that lasts [5s]. Inside this quantum field, bullets can go through walls but bullets created inside a wall will be destroyed. [12s]'
	},
	'Bullet Boomerang': {
		color: '#1fff5a',
		type: 'Active',
		exp: true,
		desc: 'Upon activation, your bullets will reverse their velocity and go in the opposite direction with 1.5x damage boost. The lifespan of the bullets are extended. [0.5s]',
	},
	'War Tank': {
		color: '#ffe14d',
		type: 'Passive',
		exp: true,
		desc: 'You gain 50 armor with this passive but your sprint duration is halved.',
	},
	'Bended Barrel': {
		color: '#8cff78',//'#9900ff',
		type: 'Active',
		desc: 'Upon activation, your bullets will curve to the nearest target. The curve will be fixed on new bullets and will only reset after you reload. [5s]',
	},
	'Accuracy Reload': {
		color: '#0077ff',
		type: 'Passive',
		exp: true,
		desc: 'Upon reloading with no ammo left, you will have enhanced accuracy on your next magazine. These reloads will take [2s] longer and your player will be indicated blue while you have enhanced accuracy.'
	},
	'Denial of Sprint': {
		color: '#ff5900',
		type: 'Active',
		desc: 'Upon activation, you will create a visible line in the direction of your gun. Opponents who touch this line cannot sprint or regenerate (same for you). The line lasts 4s max. [12s]'
	},
	'Reflective Reload': {
		color: '#fff01f',
		type: 'Passive',
		desc: 'Upon reloading with no ammo left, you will parry any bullets that hit you from the front side for the next 0.75s. Parried bullets will be reflected in your gun direction. You cannot auto reload.',
	},
	'Ice Skate': {
		color: '#00d9ff',
		type: 'Passive',
		desc: 'Upon sprinting for under 0.6s but more than 0.1s, you will begin skating.'
	},
	'Low Profile': {
		color: '#ff4040',
		type: 'Passive',
		desc: 'Upon reloading, all your current bullets will be low-profile and last 0.5s longer than normal. While reloading, your player is 25% smaller.'
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
	if (player.shiftTime == undefined) {
		player.shiftTime = 0;
	}
	// console.log(player.denied)
	if (player.denied) {
		speed = speed * 0.5;
	}

	_shiftRegenTimer += dt;
		if (_shiftRegenTimer >= player.shiftRegenTime) {
			_currentShift += dt*1.2;
			_shiftRegenTimer = player.shiftRegenTime;
		}
		_currentShift = Math.min(_currentShift, player.shiftLength);
	player.preSkating = false;
	if (!player.denied && !player.denying) {
		if (_input.shift && _currentShift > 0) {
			_shiftRegenTimer = 0;
			let mult = 1;
			if (player.powers.includes('Ice Skate')) {
				// mult = 1.5;
			}
			_currentShift -= dt*1.5*mult;
			_currentShift = Math.max(_currentShift, 0);
			player.shiftTime += dt;
			let acc = 1;
			if (player.powers.includes('Ice Skate')
			   && player.shiftTime >= 0 && player.shiftTime <= 0.4) {
				// player.skating = true;
				player.preSkating = true;
				acc = 0.4;
				// acc = player.shiftTime + 1.5;
			} else if (player.powers.includes('Ice Skate')
				&& player.shiftTime >= 0.4) {
				acc = 0.4;
				if (!player.skating) {
					_xv *= 1.5;
					_yv *= 1.5;
				}
				player.skating = true;
			} else {
				player.skating = false;
			}
			speed *= 1.5*acc;
		} else {
			player.shiftTime = 0;
			player.skating = false;
		}
	} else {
		player.shiftTime = 0;
		player.skating = false;
		player.preSkating = false;
	}
    _xv += (_input.right - _input.left) * dt * speed;
    _yv += (_input.down - _input.up) * dt * speed;
	if (!player.skating) {
    	_xv *= 0.94;	
	    _yv *= 0.94
	}
	if (player.denying || player.denied) {
		const speedLimit = 1;
		player.xv = Math.min(player.xv, speedLimit);
		player.yv = Math.min(player.yv, speedLimit);
		_xv = Math.min(_xv, speedLimit);
		_yv = Math.min(_yv, speedLimit)
	}
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
				// player2.xv = -_xv/2;
				// player2.yv = -_yv/2;
				
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
	// special effects - denial of sprint
	player.denying = false;
	if (player.powers.includes('Denial of Sprint') && player.denialAngle != null) {
		for (const key of Object.keys(players)) {
			const player2 = players[key];
			if (player.id == player2.id) continue;
			if (doesLineInterceptCircle(
				{x: player.x + Math.cos(player.denialAngle) * player.r,
				y: player.y + Math.sin(player.denialAngle) * player.r },
				{x: player.x + Math.cos(player.denialAngle) * (player.r + player.denialLength),
				y:player.y + Math.sin(player.denialAngle) * (player.r + player.denialLength)},
				{x: player2.x, y: player2.y}, player2.r)) {
				// _shiftRegenTimer = 0;
				// player2.shiftRegenTimer = 0;
				if (!player2.denied && player.activeCooldownTimer <= 0.5) { // first 0.5s of ability
					player2.xv += _xv*3;
					player2.yv += _yv*3;
				}
				player.denying = true;
				player2.denied = true;
				player2.denyER = player.id;
				// if (player2.denie)
				
			}
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
	// player.r += 1;
	// player.r = 100;
	// console.log(player.r)
	
							
	
	// }
    return new StatePayload(inputPayload.tick, _x, _y, _xv, _yv, _currentShift, _shiftRegenTimer);
}

 function doesLineInterceptCircle(A, B, C, radius) {
        let dist;
        const v1x = B.x - A.x;
        const v1y = B.y - A.y;
        const v2x = C.x - A.x;
        const v2y = C.y - A.y;
        // get the unit distance along the line of the closest point to
        // circle center
        const u = (v2x * v1x + v2y * v1y) / (v1y * v1y + v1x * v1x);
        
        
        // if the point is on the line segment get the distance squared
        // from that point to the circle center
        if(u >= 0 && u <= 1){
            dist  = (A.x + v1x * u - C.x) ** 2 + (A.y + v1y * u - C.y) ** 2;
        } else {
            // if closest point not on the line segment
            // use the unit distance to determine which end is closest
            // and get dist square to circle
            dist = u < 0 ?
                  (A.x - C.x) ** 2 + (A.y - C.y) ** 2 :
                  (B.x - C.x) ** 2 + (B.y - C.y) ** 2;
        }
        return dist < radius * radius;
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
