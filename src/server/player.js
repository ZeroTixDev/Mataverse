const {
    simPlayer,
    handleTick,
    StatePayload,
    InputPayload,
	Weapons,
	compareStates,
	Powers,
} = require('../shared/sim.js');

const circleCircleContains = (p1x, p1y, r1, p2x, p2y, r2) => {
	if (((r1 + r2) ** 2 > (p1x - p2x) ** 2 + (p1y - p2y) ** 2)) {
		// circle is completely with each other,
		// now lets check if c2 is completely inside c1
		const dist = Math.sqrt((p2x - p1x)**2 + (p2y-p1y)**2);
		return r1 > (dist + r2);
	}
	return false;
}

const objectsEqual = (o1, o2) => 
    typeof o1 === 'object' && Object.keys(o1).length > 0 
        ? Object.keys(o1).length === Object.keys(o2).length 
            && Object.keys(o1).every(p => objectsEqual(o1[p], o2[p]))
        : o1 === o2;

const arraysEqual = (a1, a2) => 
   a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));


module.exports = class Player {
    constructor(id, { r }, name, armor, weapon='Pistol') {
        this.id = id;
        this.r = 32//35//125; //35;
        this._arena = { r };
		const angle = Math.random() * 2 * Math.PI
		const strength = Math.random() * this._arena.r
		this.x = r + Math.cos(angle) * (strength - this.r);
		this.y = r + Math.sin(angle) * (strength - this.r)
        // this.x = this.r + Math.random() * (this._arena.w - this.r * 2);
        // this.y = this.r + Math.random() * (this._arena.h - this.r * 2);
        this.xv = 0;
        this.yv = 0;
		this.weapon = weapon;
        this.speed = 11//30//75; //55;
        this.input = { up: false, right: false, down: false, left: false, shift: false };
        this.changed = false;
		this.totalDamage = 0;
        this.name =
            name.length > 0
                ? name
                : 'Tester ' +
                  Math.floor(Math.random() * 10) +
                  Math.floor(Math.random() * 10);
        this.armor = armor * 50;
        this.maxArmor = this.armor;
        this.health = 100;
        this.timer = 0;
        this.currentTick = 0;
        this.deltaTick = 1 / global.tickRate;
        this.bufferSize = Infinity;
        this.stateBuffer = []; //[<StatePayload>]
		this.inputBuffer = [] // <InputBuffer>[]
        this.inputQueue = []; //<Queue><InputPayload>
        this.sims = 0;
        this.angle = 0;
        this.kills = 0;
		this.lastProcessedTick = 0;
		this.respawnUnprocessed = false;
		this.shiftLength = 4.5;
		this.currentShift = 4.5;
		this.shiftRegenTimer = 0;
		this.shiftRegenTime = 1;
		this.chatMessage = '';
		this.chatMessageTimer = 0;
		this.chatMessageTime = 8;
		this.shifting = false;
		this.inStorm = false;
		this.typing = false;
		this.regenTimer = 3;
		this.regenTime = 3;
		this.authTick = 0;
		// this.lastProcessedInputPayload = null;
		this.lastSentInput = null;
		this.reloading = false;
		// this.powers = ['Magz of War', 'Shadow Reload']// of 4;
		// this.powers = ['Bullet Boomerang']
		this.powers = []
		
		// this.powers = ['Shadow Reload']
		// this.powers = ['Magz of War']
		// this.powers = ['Angelic Lunge', 'Magz of War', 'Shadow Reload']
		// this.powers = ['Magz of War', 'Shadow Reload', 'Angelic Lunge'];
		// this.powers = ['Angelic Lunge']
		// this.powers = ['Magz of War', 'Quantum Field', 'Shadow Reload']
		this.activeCooldown = 0;
		this.activeCooldownTimer = 0;
		// magz of war
		this.magzTime = 0;
		this.magz = false;

		// shadow reload
		this.iTimer = Infinity;
		this.invis = false;
		this.invisX = this.x;
		this.invisY = this.y;

		// angelic lunge
		this.lTimer = Infinity;
		this.lCharge = false;

		//accuracy reload
		this.accurateNext = false;

		// quantum field
		this._qf = null;
		// bended barrel
		this.bendTimer = Infinity;
		this.bendCurveFactor = 0;
		this._bendCurve = {};
		this.bending = false;

		this.usePassives([])
		// each ability has special properties
		// and since each player could have all abilities
		// its just listed lol
		// most arent sent though (only inits)
		// we need 2 different keys to trigger them
		// i mean it could differntiate from abilitykey1 and 2
		// mobile?
		// oh replit mobiel
		// no im on pc
		// thats why im typing so fast
		// im on discord MOBILE
		// ye but i have to go to sleep soon
		// im just showing u code
		// what else u wanna see
		//12h
		// wanna see simulation?
		// shared/sim.js
		// idk maybe u could, the code is kinda hard to understand if u dont how eerything works tho
		// i can make quantum field easily tmrw morning
		// The quick borwn fox jumps over the lazy dog.
		// The quick brown fox jumps over the layz dog.
		// around 150wpm
		// The quick brown fox jumps over the lazy dog
		//yes so technically its on the site domain
		// u could do
		// gungame.zerotixdev.repl.co/shared/sim.js 
		// and anyone can access code from sahred
		// ye ofc game is server sided rn but it also 
		// can support predictions (remmeber og version)
		//yes u wanna see it?
    // yes to ok
		// ye observe me
    // what if we later have a way of getting 2 tacticals?
    // yeah obv, but your code wouldnt work would it, I mean I guess its easy to fix
    // anyway even if you're on mobile quantum field should be makeable lmao
    // it's seriously easy
    // are you not on mobile? can you not code?
    // so you can code?? come on you can literally make quantum field in like 15 minutes, oh, when?
    // morning is in how many hours for u?
    // oh ok, sure
    // it would be cool if I could figure this out and make QF myself but nahhh
    // yeah
    // shared means both client and server does it right? but server still sends player positions so it can't desync
    // I wonder what happens if we use the, how were they called
    // what if we use error correction codes to see if player and server are desynced and only send a full correction if the error correction code activates?
    // has that been done?
    // because error correction codes are easier to send
    } 
	activate(players) {
		// ability activation on space - sent from clietn
		if (this.powers.includes('Bended Barrel') && this.activeCooldownTimer >= this.activeCooldown) {
			
			// this.bendTimer = 3;
			// this.bending = true;
			let bestId = null;
			let bestDist = Infinity;
			for (const pId of Object.keys(players)) {
				if (pId == this.id) continue;
				const player = players[pId];
				const distX = this.x - player.x;
				const distY = this.y - player.y;
				const dist = Math.sqrt(distX * distX + distY * distY);
				if (dist < bestDist) {
					bestDist = dist;
					bestId = pId;
				}
			}
			// calculate curve factor eq
			// dist = muzzle (or parent player center for now because lazy) and center of nearest player
			// rot = angle of rotation of gun relative to player -180 to 180
			// spd = bullet speed every tick (bullet.speed*(1/120))
			// (rot*-2)/(((csc(rot) * dist/2)*rot*2)/ spd)
			if (bestId != null) {
				const nearestPlayer = players[bestId];
				const _oppAngle = this.angle - Math.PI / 2;
				const gunWidth = Weapons[this.weapon].gunWidth ?? 6;
				const gunHeight = this.r * (Weapons[this.weapon].gunHeight ?? 2);
				const muzzleX = this.x + Math.cos(_oppAngle) * (this.r - gunWidth) 
					+ Math.cos(this.angle) * (gunHeight * 1.5);
				const muzzleY = this.y + Math.sin(_oppAngle) * (this.r - gunWidth)
					+ Math.sin(this.angle) * (gunHeight * 1.5); 
				const distX = players[bestId].x - muzzleX;
				const distY = players[bestId].y - muzzleY;
				const dist = Math.sqrt(distX * distX + distY * distY); // absolute dist between players
				let rotation = Math.atan2(players[bestId].y - muzzleY, players[bestId].x - muzzleX)
					* (180/Math.PI) //- 90;
				// rotation range (-180, 180) ideally?
				if (rotation < -180) {
					rotation = 180 + (rotation + 180);
				}
				let gunRotation = this.angle * (180/Math.PI);
				if (gunRotation > 180) {
					gunRotation = -180 + (gunRotation - 180)
				}
				gunRotation = rotation - gunRotation;
				if (gunRotation < -180) {
					gunRotation = 180 + (gunRotation + 180);
				}
				if (gunRotation > 180) {
					gunRotation = -180 + (gunRotation - 180)
				}
				rotation = gunRotation;
				this._bendCurve = {}
				this._bendCurve.rotation = rotation;
				this._bendCurve.dist = dist;
				this.bending = true;
				this.activeCooldown = 5;
				this.activeCooldownTimer = 0;
				// this.bendCurveFactor = ((2 * ))	
			} else {
				this._bendCurve = undefined;
			}
			// this.bendCurveFactor = 0;
			this.dataChange = true;
		}
		if (this.powers.includes('Angelic Lunge') && this.currentShift >= this.shiftLength) {
			this.xv = 0;
			this.yv = 0;
			this.lTimer = 1;
			this.lCharge = true;
			this.dataChange = true;
		}
		// if (this.powers.includes('Overflowing Sprint') && this.currentShift <= this.shiftLength/10) {
		// 	this.currentShift = this.shiftLength;
		// 	this.dataChange = true;
		// 	this.shiftRegenTimer = 0;
		// 	this.activeCooldown = 10;
		// 	this.activeCooldownTimer = 0;
		// }
		if (this.powers.includes('Quantum Field') && this.activeCooldownTimer >= this.activeCooldown) {
			this.activeCooldown = 12;
			this.activeCooldownTimer = 0;
			this._qf = {
				x: this.x,
				y: this.y,
				// r: 256,
				r:288,
				t: 0,
			}
			this.dataChange = true;
			// this.takeDamage(50)
		}
		if (this.powers.includes('Bullet Boomerang') && this.activeCooldownTimer >= this.activeCooldown) {
			let reversed = false;
			const bullets = global.getBullets()
			for (const bulletId of Object.keys(bullets)) {
				const bullet = bullets[bulletId];
				if (bullet.parent != this.id) continue;
				bullet.angle += Math.PI;
				bullet.curveFactor *= -1;
				bullet.pChanged = true;
				// if (!bullet.rev) {
					bullet.life*= 2
				// }
				bullet.rev = true;
				bullet.lifeTimer = 0;
				reversed = true;
			}
			if (reversed) {
				this.activeCooldown = 0;	
				this.activeCooldownTimer = 0;
			}
		}
	}
	sendChat(text) {
		let powers = [...this.powers]
		if (text.startsWith('/power')) {
			const power = text.split('/power ')[1]
			console.log(power)
			if (Powers[power]) {
				// this.usePassives(powers);
				this.powers.push(power)
				this.usePassives(powers);
				this.dataChange = true;
				return;
			}
		}
		this.chatMessage = text;
		this.chatMessageTimer = this.chatMessageTime;
		this.dataChange = true;
	}
	usePassives(powers=[]) {
		console.log(this.powers)
		// if (this.powers.includes('War Tank')) {
		// 	console.log('tank works!')
		// 	this.armor = 50;
		// 	this.maxArmor = 50;
		// 	this.shiftLength /= 2;
		// }
	}
	changeTyping(typingState) {
		if (typingState === true) {
			this.typing = true
		} else {
			this.typing = false;
		}
		this.dataChange = true;
	}
    // newInput(data) {
    //     this.input[data.inputType] = data.inputState;
    //     // this.inputQueue.push({ inputType: data.inputType, inputState: data.inputState });
    // }
    respawn() {
		const angle = Math.random() * 2 * Math.PI
		const strength = Math.random() * this._arena.r
		this.x = this._arena.r + Math.cos(angle) * (strength - this.r);
		this.y = this._arena.r + Math.sin(angle) * (strength - this.r)
        // this.x = this.r + Math.random() * (this._arena.w - this.r * 2);
        // this.y = this.r + Math.random() * (this._arena.h - this.r * 2);
        this.health = 100;
        this.armor = this.maxArmor;
		this.respawnUnprocessed = true;
		// this.currentShift = this.shiftLength;
		this.shiftRegenTimer = 0;
		// this.lastSentInput = null;
    }
    processInput(payload) {
		if (payload == undefined) return 'kick'
		if (typeof payload == 'object' && payload.tick != undefined && payload.input != undefined) {
        	this.inputQueue.push(payload);
		} else {
			console.log(payload, 'invalid input');
			return 'kick'
		}
    }
	moduloNegative(n, m) {
		return ((n % m) + m) % m;
	}
	getRelativeTickState(time) {
		if (this.stateBuffer.length <= 0) return;
		let rtick = Math.ceil(time * global.tickRate)
		let currentTick = this.lastProcessedTick % this.bufferSize;
		// console.log(rtick, currentTick)
		if (this.stateBuffer.length <= this.bufferSize) {
			let tick = Math.max(currentTick + rtick, 0) % this.bufferSize;
			if (this.stateBuffer[tick] == undefined) {
				let currentMtick = currentTick + rtick;
				// if (this.stateBuffer[this.moduloNegative(currentMtick, this.bufferSize)] == undefined) {
				// 	tick = this.lastProcessedTick % this.bufferSize;
				// } else {
				// 	tick = this.moduloNegative(currentMtick, this.bufferSize);
				// }
				// while (this.stateBuffer[this.moduloNegative(currentMtick, this.bufferSize)] == undefined && this.stateBuffer.length > 0) {
				// 	currentMtick -= 1;
				// }
				tick = this.moduloNegative(currentMtick, this.bufferSize);
			}
			// console.log(tick)
			if (this.respawnUnprocessed) {
				const state =  {...this.stateBuffer[tick]};
				state.x = this.x;
				state.y = this.y;
				return state;
			} else {
				return this.stateBuffer[tick]
			}
		} else {
			let tick = this.moduloNegative(currentTick + rtick, this.bufferSize);
			if (this.stateBuffer[tick] == undefined) {
				let currentMtick = currentTick + rtick;
				// if(this.stateBuffer[this.moduloNegative(currentMtick, this.bufferSize)] == undefined) {
				// 	tick = this.lastProcessedTick % this.bufferSize;
				// } 
				// while (this.stateBuffer[this.moduloNegative(currentMtick, this.bufferSize)] == undefined && this.stateBuffer.length > 0) {
				// 	currentMtick -= 1;
				// }
					tick = this.moduloNegative(currentMtick, this.bufferSize);
				
			}
			// console.log(tick)
			if (this.respawnUnprocessed) {
				const state =  {...this.stateBuffer[tick]};
				state.x = this.x;
				state.y = this.y;
				return state;
			} else {
				return this.stateBuffer[tick]
			}
		}
	}
    handleTick(players, obstacles) {
        let bufferIndex = -1;
		const initState = this.payloadify();
        while (this.inputQueue.length > 0) {
            // draining the queue
            const inputPayload = this.inputQueue[0];
            this.inputQueue.shift(); // (inefficient for huge inputs)
            bufferIndex = inputPayload.tick % this.bufferSize;
			this.lastProcessedTick = inputPayload.tick;
			this.respawnUnprocessed = false;
			this.input = inputPayload.input;
		}
		const inputPayload = new InputPayload(this.currentTick, this.input);
		const statePayload = simPlayer(
			this,
			inputPayload,
			this.deltaTick,
			players,
			this._arena,
			obstacles,
		)
		this.stateBuffer[this.currentTick] = statePayload;
		this.inputBuffer[this.currentTick] = inputPayload;
		this.shifting = inputPayload.input.shift && this.stateBuffer[this.currentTick].currentShift > 0;
		this.x = this.stateBuffer[this.currentTick].x;
		this.y = this.stateBuffer[this.currentTick].y;
		this.xv = this.stateBuffer[this.currentTick].xv;
		this.yv = this.stateBuffer[this.currentTick].yv;
		this.currentShift = this.stateBuffer[this.currentTick].currentShift;
		this.shiftRegenTimer = this.stateBuffer[this.currentTick].shiftRegenTimer;
		this.sims++;
			// go back in time to change the predicted tick
   //          const statePayload = simPlayer(
   //              this,
   //              inputPayload,
   //              this.deltaTick,
   //              players,
   //              this._arena
   //          );
   //          this.stateBuffer[bufferIndex] = statePayload;
			// this.inputBuffer[bufferIndex] = inputPayload
			// this.authTick = bufferIndex;
			// this.lastSentInput = inputPayload.input;
			// const extrapInput = inputPayload.input;
			// this.shifting = inputPayload.input.shift && this.stateBuffer[bufferIndex].currentShift > 0;
   //          this.x = this.stateBuffer[bufferIndex].x;
   //          this.y = this.stateBuffer[bufferIndex].y;
   //          this.xv = this.stateBuffer[bufferIndex].xv;
   //          this.yv = this.stateBuffer[bufferIndex].yv;
			// this.currentShift = this.stateBuffer[bufferIndex].currentShift;
			// this.shiftRegenTimer = this.stateBuffer[bufferIndex].shiftRegenTimer;
   //          this.sims++;
			// this.lastSentInput = inputPayload.input;
			// this.lastProcessedInputPayload = inputPayload;
			// while (extrapInput != undefined && this.lastProcessedTick < this.currentTick) {
			// 	console.log(this.currentTick - this.lastProcessedTick)
			// 	this.lastProcessedTick++;
			// 	bufferIndex = this.lastProcessedTick % this.bufferSize;
			// 	const statePayload = simPlayer(
			// 		this,
			// 		new InputPayload(this.lastProcessedTick, extrapInput),
			// 		this.deltaTick,
			// 		players,
			// 		this._arena,
			// 	)
			// 	this.stateBuffer[bufferIndex] = statePayload;
			// 	this.inputBuffer[bufferIndex] = new InputPayload(this.lastProcessedTick, extrapInput);
			// 	this.shifting = extrapInput.shift && this.stateBuffer[bufferIndex].currentShift > 0;
	  //           this.x = this.stateBuffer[bufferIndex].x;
	  //           this.y = this.stateBuffer[bufferIndex].y;
	  //           this.xv = this.stateBuffer[bufferIndex].xv;
	  //           this.yv = this.stateBuffer[bufferIndex].yv;
			// 	this.currentShift = this.stateBuffer[bufferIndex].currentShift;
			// 	this.shiftRegenTimer = this.stateBuffer[bufferIndex].shiftRegenTimer;
	  //           // this.sims++;
			// }
			
   //      }


		
		// const extrapInput = this.lastSentInput
		// console.log(extrapInput, this.lastProcessedTick, this.currentTick)
		// while (extrapInput != undefined && this.lastProcessedTick < this.currentTick) {
		// 	this.lastProcessedTick++;
		// 	bufferIndex = this.lastProcessedTick % this.bufferSize;
		// 	const statePayload = simPlayer(
		// 		this,
		// 		new InputPayload(this.lastProcessedTick, extrapInput),
		// 		this.deltaTick,
		// 		players,
		// 		this._arena,
		// 	)
		// 	this.stateBuffer[bufferIndex] = statePayload;
		// 	this.inputBuffer[bufferIndex] = new InputPayload(this.lastProcessedTick, extrapInput);
		// 	this.shifting = extrapInput.shift && this.stateBuffer[bufferIndex].currentShift > 0;
  //           this.x = this.stateBuffer[bufferIndex].x;
  //           this.y = this.stateBuffer[bufferIndex].y;
  //           this.xv = this.stateBuffer[bufferIndex].xv;
  //           this.yv = this.stateBuffer[bufferIndex].yv;
		// 	this.currentShift = this.stateBuffer[bufferIndex].currentShift;
		// 	this.shiftRegenTimer = this.stateBuffer[bufferIndex].shiftRegenTimer;
  //           this.sims++;
		// }
        // if (bufferIndex != -1) {
		if (!compareStates(this.payloadify(), initState).same || bufferIndex != -1) {
            // this.changed = true;
			this.dataChange = true;
            // this.changePayload = this.stateBuffer[this.lastProcessedTick];
		}
        // }
    }
	payloadify() {
		return new StatePayload(this.currentTick, this.x, this.y, this.xv, this.yv, this.currentShift,this.shiftRegenTimer);
	}
    takeDamage(dmg, health=false) {
        if (dmg > 0) {
            this.dataChange = true;
			this.regenTimer = 0;
        }
        let dmgLeft = dmg;
        if (this.armor > 0 && !health) {
            if (this.armor < dmgLeft) {
                dmgLeft = dmgLeft - this.armor;
                this.armor = 0;
            } else {
                this.armor -= dmgLeft;
                return;
            }
        }
        this.health -= dmgLeft;
        this.health = Math.max(this.health, 0);
    }
    simulate(dt, players, obstacles) {
        // let oldX = this.x;
        // let oldY = this.y;

		this.activeCooldownTimer += dt;
		if (this.activeCooldownTimer >= this.activeCooldown) {
			this.activeCooldownTimer = this.activeCooldown;
		} else {
			this.dataChange = true;
		}
		if (this._qf != null) {
			this._qf.t += dt;
			if (this._qf.t >= 5) {
				this._qf = null;
				this.dataChange = true;
			}
		}
        this.timer += dt;
		this.regenTimer += dt;
		this.chatMessageTimer -= dt;
		this.magzTime -= dt;
		this.iTimer -= dt;
		this.lTimer -= dt;
		// this.bendTimer -= dt;
		// if (this.bendTimer <= 0) {
		// 	this.bendTimer = Infinity;
		// 	this.bendCurveFactor = 0;
		// }
		if (this.lTimer >= 0 && this.lTimer != Infinity) {
			this.takeDamage(30 * dt)
		}
		if (this.lTimer <= 0) {
			this.xv = Math.cos(this.angle) * 40;
			this.yv = Math.sin(this.angle) * 40;
			this.currentShift = 0;
			this.shiftRegenTimer = 0;
			this.lCharge = false;
			this.dataChange = true;
			// if (this.lTimer <= -0.1) {
				this.lTimer = Infinity;
			// }
		}
		if (this.lTimer != Infinity && this.lTimer > 0) {
			this.xv = 0;
			this.yv = 0;
		}
		if (this.iTimer <= 1) {
			if (!this.invis) {
				this.invisX = this.x;
				this.invisY = this.y;
			}
			this.invis = true;
			this.dataChange = true;
		}
		if (this.iTimer <= 0.25) {
			this.invis = false;
			this.dataChange = true;
		}
		let m = this.magz;
		if (this.magzTime <= 0) {
			this.magz = false
		} else {
			this.magz = true;
		}
		if (m !== this.magz) {
			this.dataChange = true
		}
		if (this.chatMessageTimer <= 0) {
			this.chatMessage = ''
		}
        while (this.timer >= this.deltaTick) {
            this.timer -= this.deltaTick;
            this.handleTick(players, obstacles);
            this.currentTick++;
        }
		

		// fast forward to current tick
		// const extrapInput = this.lastSentInput;
		// let tick = this.lastProcessedTick;
		// while (extrapInput != undefined && tick < this.currentTick) {
		// 	tick++;
		// 	let bufferIndex = tick % this.bufferSize;
		// 	const statePayload = simPlayer(
		// 		this,
		// 		new InputPayload(tick, extrapInput),
		// 		this.deltaTick,
		// 		players,
		// 		this._arena,
		// 	)
		// 	this.stateBuffer[bufferIndex] = statePayload;
		// 	this.inputBuffer[bufferIndex] = new InputPayload(tick, extrapInput);
		// 	this.shifting = extrapInput.shift && this.stateBuffer[bufferIndex].currentShift > 0;
		// 	this.x = this.stateBuffer[bufferIndex].x;
		// 	this.y = this.stateBuffer[bufferIndex].y;
		// 	this.xv = this.stateBuffer[bufferIndex].xv;
		// 	this.yv = this.stateBuffer[bufferIndex].yv;
		// 	this.currentShift = this.stateBuffer[bufferIndex].currentShift;
		// 	this.shiftRegenTimer = this.stateBuffer[bufferIndex].shiftRegenTimer;
		// 	this.sims++;
		// }

		
        let h = this.health;
        let a = this.armor;
		if (this.regenTimer > this.regenTime) {
	        if (this.health < 100) {
	            this.health += dt * 8;
	        }
	        this.health = Math.min(this.health, 100);
	        if (this.armor < this.maxArmor) {
	            this.armor += dt * 8;
	        }
	        this.armor = Math.min(this.armor, this.maxArmor);
		}
		// let outOfBounds = false;
		// if (this.x - this.r < 0) {
		// 	outOfBounds = true;
		// }
		// if (this.x + this.r > this._arena.w) {
		//     outOfBounds = true;
		// }
		// if (this.y - this.r < 0) {
		//     outOfBounds = true;
		// }
		// if (this.y + this.r > this._arena.h) {
		//     outOfBounds = true;
		// }
		this.inStorm = false;
		const outOfBounds = !circleCircleContains(this._arena.r, this._arena.r, this._arena.r, this.x, this.y, this.r);
		if (outOfBounds) {
			this.takeDamage(dt * 15, true)
			this.inStorm = true;
		}
		if (this.health <= 0) {
			// dead
			this.respawn();
			this.dataChange = true;
		}
        if (Math.abs(this.health - h) > 0 || Math.abs(this.armor - a) > 0) {
            this.dataChange = true;
        }

        // const { x, y } = simPlayer(this, InputPayload(0, this.input), dt);
        // this.x = x;
        // this.y = y;
        // if (this.x !== oldX || this.y !== oldY) {
        //     this.changed = true;
        // }
    }
	diffPack(player) {
		if (!player) {
			return this.pack()
		}
		const pack = this.pack();
		const diffPack = { id: this.id };
		for (const key of Object.keys(pack)) {
			let equal = false;
			if (Array.isArray(pack[key])) {
				if (arraysEqual(pack[key], player[key])) {
					equal = true;
				}
			} else if (typeof pack[key] == 'object' && !Array.isArray(pack[key])) {
				if (objectsEqual(pack[key], player[key])) {
					equal = true;
				}
			} else if (pack[key] == player[key]) {
				equal = true;
			}
			if (equal || this.dont_send_in_updates.includes(key)) {
				// if (typeof pack[key] == 'object') {
				// 	console.log(pack[key], player[key], key)
				// }
				continue;
			}
			diffPack[key] = pack[key];
		}
		// console.log(diffPack)
		return diffPack;
		// return this.pack()
	}
	get dont_send_in_updates() {
		return ['xv', 'yv']
	}
    pack() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            r: this.r,
            id: this.id,
            speed: this.speed,
            name: this.name,
            xv: this.xv,
            yv: this.yv,
            armor: Math.round(this.armor),
            angle: this.angle,
            health: Math.round(this.health),
            maxArmor: this.maxArmor,
            kills: this.kills,
			shiftLength: this.shiftLength,
			currentShift: this.currentShift,
			shiftRegenTimer: this.shiftRegenTimer, 
			shiftRegenTime: this.shiftRegenTime,
			chatMessage: this.chatMessage,
			chatMessageTimer: Math.round(this.chatMessageTimer),
			shifting: this.shifting,
			typing: this.typing,
			weapon: this.weapon,
			reloading: this.reloading,
			totalDamage: this.totalDamage,
			powers: [...this.powers],
			magz: this.magz,
			invis: this.invis,
			invisX: this.invisX,
			invisY: this.invisY,
			lCharge: this.lCharge,
			activeCooldown: this.activeCooldown,
			activeCooldownTimer: this.activeCooldownTimer,
			accurateNext: this.accurateNext,
			_qf: {...this._qf},
			bending: this.bending,
			_bendCurve: {...this._bendCurve},
			// lastSentInput: this.lastSentInput,
			// lastProcessedInputPayload: this.lastProcessedInputPayload,
        };
    }
};
