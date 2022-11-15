// let ws = new WebSocket('wss://gungame.zerotixdev.repl.co');
let ws = new WebSocket(location.origin.replace(/^http/, 'ws'))
ws.binaryType = 'arraybuffer'
let connected = false;

window.upstreambytes = 0;
window.downstreambytes = 0;

async function send(data) {
    if (!connected) return;
	if (!receive) return;
    if (extraLag > 0) {
        await sleep(extraLag);
    }
	const msg = msgpack.encode(data)
	upstreambytes += msg.byteLength;
	ws.send(msg)
    // ws.send(JSON.stringify(data));
}
let bulletCooldown = 1.75//2;
let currentBulletCooldown = bulletCooldown;
const width = 16 * 100;
const height = 9 * 100;
let receive = true;
let selfId = null;
let interp = true;
globalThis.onClient = true;
let showServer = false;
let arena = null;
let obstacles = null;
let cameraAngle = 0;
const bullets = {};
let state = 'menu';

let playerData = {x:0, y:0, r: 0}; // for tetsitng

const music = new Audio();
music.src = './frozen.mp3';
music.loop = true;
music.volume = 0;

let muted = localStorage.getItem('muted') === undefined ? false: localStorage.getItem('muted');
if (muted == false) {
	localStorage.setItem('muted', false)
}
if (muted) {
	// music.volume = 0.5;
}
let savedName = localStorage.getItem('name') ?? '';

function enterGame(name, armor, weapon) {
    state = 'game';
    window._joinData = { name, armor, weapon };
    localStorage.setItem('name', _joinData.name);
    document.querySelector('.menu').classList.add('hidden');
    document.querySelector('.game').classList.remove('hidden');
    // document.querySelector('.game').requestFullscreen();
    send({ join: true, name, armor, weapon });
}

ws.onopen = () => {
    console.log(
        'connected to game server in ',
        Math.round(window.performance.now()) + 'ms'
    );
    connected = true;
    if (state === 'game') {
        send({ join: true, name: _joinData.name, armor: _joinData.armor, weapon: _joinData.weapon });
    }
	
};

ws.onclose = () => {
    connected = false;
    alert('Lost connection to the game server');
};

ws.onmessage = handleMessage;


const chatContainer = document.querySelector('.chat-div')
const chatForm = document.querySelector('.chat-form')
const chatInput = document.querySelector('.chat-input')
const playerCountSpan = document.querySelector('.player-count');
const armors = document.querySelectorAll('.armor');
// const weapons = document.querySelectorAll('.gun');
const usernameInput = document.querySelector('.username-input');
const usernameForm = document.querySelector('.username-form');
const powerDiv = document.querySelector(".power-div")

usernameInput.value = savedName;
window.chatOpen = () => !chatContainer.classList.contains('hidden')
function getArmorType() {
    for (const armor of Array.from(armors)) {
        if (armor.classList.contains('a-select')) {
            return armor.getAttribute('data-type');
        }
    }
    return 0;
}
function getWeaponType() {
	const weapons = document.querySelectorAll('.gun');
	for (const weapon of Array.from(weapons)) {
		if (weapon.classList.contains('a-select')) {
			console.log(weapon.getAttribute('data-type'))
			return weapon.getAttribute('data-type')
		}
	}
	console.log('returnig pistol', Array.from(weapons))
	return 'Pistol'
}
usernameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let name = usernameInput.value.trim();
    let armor = getArmorType();
	let weapon = getWeaponType()
    enterGame(name, armor, weapon);
});

for (const armor of Array.from(armors)) {
    armor.addEventListener('mousedown', (e) => {
        if (!armor.classList.contains('a-select')) {
            for (const armor of Array.from(armors)) {
                if (armor.classList.contains('a-select')) {
                    armor.classList.remove('a-select');
                }
            }
            armor.classList.add('a-select');
        }
    });
}

let canvScale = 1;
const canvas = document.querySelector('.canvas');
const ctx = canvas.getContext('2d');
resize([canvas]);
window.onresize = () => resize([canvas]);

const players = {};

let timer = 0;
let currentTick = 0;
let serverTickRate;
let deltaTick;
let stateBuffer; //[<StatePayload>]
let inputBuffer; //<InputBuffer>
let latestServerState; //<StatePayload>
let lastProcessedState; //<StatePayload>
let bufferSize = Infinity;

let gotHitTimer = Infinity;
let gotHitStorm = false;

let fakeBullets = [];

let slow = false;
let fast = false;

let fps = 0;
let fpsCount = 0;
let lastServerUpdate = window.performance.now();
let camera = { x: null, y: null };

function me() {
    return players[selfId];
}
let xoff = 0;
let yoff = 0;

function offset(x, y) {
    return {
        x: x - camera.x + canvas.width / 2 + xoff,
        y: y - camera.y + canvas.height / 2 + yoff,
    };
}

function offsetX(x) {
    return offset(x, 0).x;
}
function offsetY(y) {
    return offset(0, y).y;
}

function handleTick() {
	return;
  // reconcilation test
	// this is where i reconcile errorenous predictions
  // but these arent error correction codes are they?
  // yes but server has to constantly send client data so that client can correct, right?
  // ok, so what if, in a game where a LOT of things need to be synced, 
  // instead of constantly sending all data to the player everytime
  // which is very heavy on the network, you instead send error codes
  // which are smaller than data but can see errors
  // and then when client realizes it has an error it can request a sync package from server
  // I guess that's kind of slow cause you need server to send client then client to server then server to client,
  // which is like one back and forth more than if you constantly send data
  // no this is what the client does to CORRECT any errors reported from server
  // the code pretty much explains for itself
	// this code isnt even used rn tho
	// server pretty much just sends new player data every change
	// theres no prediction happening rn, hence no corrections needed
	// comment is getting too long, my screen is smol
	// yeah thats another way to do networking
	// if u have a lotta things to network
	// u might want the client to simulate stuff then
	// ye theres tradeoffs though
	// gta online LMFAO
	// error codesz/ what exaclty do u mean by that
  // Yeah obviously, so the client would simulate as perfectly as it can
  // but if the error code sees an error it can sync back
  // without putting 10 times the strain on the network
  // I mean yeah, if the entire game somehow goes off the rails perfectly
  // then the error code wont function or something
  // but I think it's not impossible to circumvent
  // for example noita is a game where every pixel is simulated
  // so multiplayer would need insane data load from server every tick
  // but if every client simulates for themselves and server sends error codes?
  // much less lag? almost no tradeoffs? (except resync is slower)
  // of course theres the question of - how much smaller are rally the error codes?
  // I guess with one error the error code can literally be one bit, which is insane
  // obviously that doesnt account for everything
  // let me send you a vid
    if (
        latestServerState != undefined &&
        !equalState(latestServerState, lastProcessedState)
    ) {
        lastProcessedState = latestServerState;
        let serverStateBufferIndex = latestServerState.tick % bufferSize;
        const serverPos = { x: latestServerState.x, y: latestServerState.y };
        const bufferPos = {
            x: stateBuffer[serverStateBufferIndex].x,
            y: stateBuffer[serverStateBufferIndex].y,
        };
        let errX = serverPos.x - bufferPos.x;
        let errY = serverPos.y - bufferPos.y;
        const positionErr = Math.sqrt(errX * errX + errY * errY);
        if (positionErr > 0.0001) {
            me().x = latestServerState.x;
            me().y = latestServerState.y;
            me().xv = latestServerState.xv;
            me().yv = latestServerState.yv;
			// me().currentShift = latestServerState.currentShift;
			me().shiftRegenTimer = latestServerState.shiftRegenTimer;
            stateBuffer[serverStateBufferIndex] = latestServerState;
            let tickToProcess = latestServerState.tick + 1;
            console.log(
                'we gotta reconcile, position err: ',
                positionErr,
                'and resimulating ticks: ',
                currentTick - tickToProcess
            );
            while (tickToProcess < currentTick) {
                let bufferIndex = tickToProcess % bufferSize;
                const statePayload = simPlayer(
                    me(),
                    inputBuffer[bufferIndex],
                    deltaTick,
                    players,
                    arena
                );
                stateBuffer[bufferIndex] = statePayload;
                me().x = stateBuffer[bufferIndex].x;
                me().y = stateBuffer[bufferIndex].y;
                me().xv = stateBuffer[bufferIndex].xv;
                me().yv = stateBuffer[bufferIndex].yv;
				// me().currentShift = stateBuffer[bufferIndex].currentShift;
				me().shiftRegenTimer = stateBuffer[bufferIndex].shiftRegenTimer;
				me().shifting = inputBuffer[bufferIndex].input.shift && 
						stateBuffer[bufferIndex].currentShift > 0;
                tickToProcess++;
            }
        }
    }

    let bufferIndex = currentTick % bufferSize;
    const sentPayload = new InputPayload();
    sentPayload.tick = currentTick;
    sentPayload.input = copyInput();
	const currentPayload = new InputPayload();
	currentPayload.tick = currentTick;
	currentPayload.input =  copyInput()
    inputBuffer[bufferIndex] = currentPayload;
    stateBuffer[bufferIndex] = simPlayer(
        me(),
        currentPayload,
        deltaTick,
        players,
        arena
    );
	// other player prediction test
	// for (const playerId of Object.keys(players)) {
	// 	if (playerId == selfId) continue;
	// 	const player = players[playerId];
	// 	const py = new InputPayload();
	// 	py.tick = currentTick
	// 	py.input = player.lastSentInput ?? copyInput();
	// 	const state = simPlayer(player, py, deltaTick, players, arena);
	// 	player.interpX = state.x;
	// 	player.interpY = state.y;
	// 	player.name = `(${state.x}, ${state.y})`
	// }
	// input test
	// for (const playerId of Object.keys(players)) {
	// 	if (playerId == selfId) continue;
	// 	const player = players[playerId]
	// 	player.x = player.interpX;
	// 	player.y = player.interpY;
	// 	const state = simPlayer(player, payload, deltaTick, players, arena);
	// 	player.interpX = state.x;
	// 	player.interpY = state.y;
	// 	player.x = player.interpX;
	// 	player.y = player.interpY;
	// 	player.name = `(${state.x}, ${state.y})`
	// }

	
    me().x = stateBuffer[bufferIndex].x;
    me().y = stateBuffer[bufferIndex].y;
    me().xv = stateBuffer[bufferIndex].xv;
    me().yv = stateBuffer[bufferIndex].yv;
	// me().currentShift = stateBuffer[bufferIndex].currentShift;
	me().shiftRegenTimer = stateBuffer[bufferIndex].shiftRegenTimer;
	me().shifting = inputBuffer[bufferIndex].input.shift && 
						stateBuffer[bufferIndex].currentShift > 0;

	
    // console.log({ input: payload.pack() });
    
}

function equalState(state1, state2) {
    // { tick, x, y, xv, yv}
    if (state1 == undefined || state2 == undefined) return false;
    if (
        state1.tick == undefined ||
        state1.x == undefined ||
        state1.y == undefined
    )
        return false;
    if (
        state2.tick == undefined ||
        state2.x == undefined ||
        state2.y == undefined
    )
        return false;
    return (
        state1.tick === state2.tick &&
        state1.x === state2.x &&
        state1.y === state2.y &&
        state1.xv === state2.xv &&
        state1.yv === state2.yv
    );
}

function topPlayers() {
	return Object.keys(players).sort((a, b) => players[b].totalDamage - players[a].totalDamage).map((id) => players[id]);
}

window.serverGlobalTick = 0;
window.interpolationTick = 0;
let tickDivergeTolerance = 1;
let ticksBetween = 1;

function setInterpTick(_serverTick) {
    if (Math.abs(_serverTick - serverGlobalTick) > tickDivergeTolerance) {
        // console.log(
        //     'interp tick divergence exceeded: ',
        //     serverGlobalTick + ' -> ' + _serverTick
        // );
        serverGlobalTick = _serverTick;
        serverGlobalTick = Math.max(_serverTick, ticksBetween);
        interpolationTick = serverGlobalTick - ticksBetween;
    } else {
        // console.log(
        //     'interp tick convergence: ',
        //     serverGlobalTick + ' == ' + _serverTick
        // );
    }
}

window.extraLag = 0;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}



let mouseDown = false;

let hitDamage = 0;
let hitDamageActivate = false;
let hitDamageTimer = 0;
let hitDamageTimerMax = 4;

const hits = [];

window.onTab = true;
addEventListener('visibilitychange', (event) => { 	
	if (document.visibilityState === 'visible') {
		onTab = true
		document.title = 'GunGame';
	} else {
		onTab = false
		document.title = 'GunGame: Off Tab'
	}
});

let updatetimestamp = 0;
let pThreshold = 1/20;

function rectContainsPoint(x1, y1, w1, h1, x, y) {
	this.x = x1;
	this.y = y1;
	this.w = w1;
	this.h = h1;
	return this.x <= x && x <= this.x + this.w && this.y <= y && y <= this.y + this.h;
}

let kTimer = 0;
let kName = '';
let kAdj = '';
let kArr = ['DESTROYED', 'MURDERED', 'EXECUTED', 'SLAUGHTERED', 'ERADICATED', 'ANNIHILATED', 'OBLITERATED', 'EXTINGUISHED', 'CRUSHED', 'SQUASHED', 'SMASHED']


function hexToRGB(h) {
  let r = 0, g = 0, b = 0;

  // 3 digits
  if (h.length == 4) {
    r = "0x" + h[1] + h[1];
    g = "0x" + h[2] + h[2];
    b = "0x" + h[3] + h[3];

  // 6 digits
  } else if (h.length == 7) {
    r = "0x" + h[1] + h[2];
    g = "0x" + h[3] + h[4];
    b = "0x" + h[5] + h[6];
  }
  return [r, g, b]
}
function RGBToHSL(r,g,b) {
  // Make r, g, and b fractions of 1
  r /= 255;
  g /= 255;
  b /= 255;

  // Find greatest and smallest channel values
  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;
	 if (delta == 0)
    h = 0;
  // Red is max
  else if (cmax == r)
    h = ((g - b) / delta) % 6;
  // Green is max
  else if (cmax == g)
    h = (b - r) / delta + 2;
  // Blue is max
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);
    
  // Make negative hues positive behind 360°
  if (h < 0)
      h += 360;
l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    
  // Multiply l and s by 100
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
	return [h, s, l]
}
function hexToHSL(h) {
	const rgb = hexToRGB(h);
	return RGBToHSL(rgb[0], rgb[1], rgb[2]);
}

async function handleMessage(event, lag = true) {
    if (!receive) return;
    if (lag && extraLag > 0) {
        await sleep(extraLag);
    }
	const data = msgpack.decode(new Uint8Array(event.data));
	downstreambytes += event.data.byteLength;
	
    // const data = JSON.parse(event.data);
    if (data.playerCount != undefined) {
        playerCountSpan.innerText = `(${data.playerCount} players online)`;
    }
	if (data.powerMenu != undefined) {
		console.log(data.powerMenu)
		powerDiv.innerHTML = ''
		powerDiv.style.width = 75 * Object.keys(data.powerMenu).length + 25 + 'px'
		const powerNames = Object.keys(data.powerMenu)
		powerNames.sort((a, b) => hexToHSL(data.powerMenu[a].color)[0] - hexToHSL(data.powerMenu[b].color)[0]);
		// console.log(hexToHSL(Weapons[sortedWeapons[0]].color))
		for (const powerName of powerNames) {
			powerDiv.innerHTML += `
		 		<span class="power" style="color: black;background: ${data.powerMenu[powerName].color} !important;">${powerName[0]}</span>`
		}
		let first = true;
		const gunDiv = document.querySelector('.gun-div')
		gunDiv.innerHTML = ''
		const sortedWeapons = Object.keys(Weapons);
		
		for (const weaponName of sortedWeapons) {
			if (weaponName == 'LMG') continue;
			gunDiv.innerHTML += `
   				 <span class="gun ${first ? 'a-select': ''}" data-type="${weaponName}" style="background: ${Weapons[weaponName].color}; color: white;">${weaponName[0]}<span class="smol">${weaponName.slice(1)}</span></span>
			`;
			first = false;
		}
		const guns = document.querySelectorAll('.gun');
		for (const weapon of Array.from(guns)) {
			weapon.addEventListener('mousedown', (e) => {
				if (!weapon.classList.contains('a-select')) {
					for (const w of Array.from(guns)) {
						if (w.classList.contains('a-select')) {
							w.classList.remove('a-select')
						}
					}
					weapon.classList.add('a-select')
					document.body.style.background = Weapons[weapon.getAttribute('data-type')].color;
				}
			})
		}
		// for (const weapon of Array.from(weapons)) {
		// 	const gunName = weapon.getAttribute('data-type');
		// 	weapon.style.background = Weapons[gunName].color;
		// 	weapon.style.color = 'white';
		// }
	}
    if (state != 'game') return;
    if (data.hitDamage) {
        hitDamageActivate = true;
        hitDamage += data.hitDamage;
        hitDamageTimer = 0;
		for (let i = 0; i < hits.length; i++) {
			const hit = hits[i];
			if (!hit.server && hit.uid === data.uid) {
				hits.splice(i, 1);
				i++;
			}
		}
        hits.push({ x: data.hitX, y: data.hitY, dmg: data.hitDamage, t: 0, server: true, uid: data.uid});
    }
	
	if (data.killed != undefined) {
		kTimer = 3;
		kName = data.killed;
		kAdj = kArr[Math.floor(Math.random() * kArr.length)]
	}
    if (data.selfId != undefined) {
        selfId = data.selfId;
    }
    if (data.arena != undefined) {
        arena = data.arena;
        music.play();
    }
	if (data.obstacles != undefined) {
		obstacles = data.obstacles;
	}
	if (data.playerData != undefined) {
		playerData = data.playerData;
	}
    if (data.serverPayload != undefined) {
        // console.log(data.serverPayload, 'server payload');
        latestServerState = data.serverPayload;
    }
	if (data.gotHit != undefined) {
		gotHitTimer = 0;
		gotHitStorm = false;
		if (data.storm != undefined) {
			gotHitStorm = data.storm;
		}
	}
    if (data.tickRate != undefined) {
        console.log('established server tick rate as ', data.tickRate);
        serverTickRate = data.tickRate;
        deltaTick = 1 / serverTickRate;
        stateBuffer = []
        inputBuffer = []
		window.mx = 0;
		window.my = 0;
        window.addEventListener('mousemove', (e) => {
            const bound = canvas.getBoundingClientRect();
            mx = Math.round((e.pageX - bound.left) / canvScale);
            my = Math.round((e.pageY - bound.top) / canvScale);
            const angle = Math.atan2(my - 450, mx - 800);
			// me().angle = angle;
            send({ angle  });
        });
        window.addEventListener('mousedown', (e) => {
            mouseDown = true;
            const bound = canvas.getBoundingClientRect();
            mx = Math.round((e.pageX - bound.left) / canvScale);
            my = Math.round((e.pageY - bound.top) / canvScale);
			const angle = Math.atan2(my-450, mx-800);
			// me().angle = angle;
			send({ angle, mousedown: true })
            // me().angle = Math.atan2(my - 450, mx - 800);
        });
        window.addEventListener('mouseup', () => {
            mouseDown = false;
			send({ mouseup: true })
        });
    }
    if (data.players != undefined) {
        lastServerUpdate = window.performance.now();
        for (const pack of data.players) {
            players[pack.id] = new Player(pack);
            if (pack.id === selfId) {
                camera.x = pack.x;
                camera.y = pack.y;
            }
        }
    }
    if (data.bullets != undefined) {
        for (const pack of data.bullets) {
            bullets[pack.id] = new Bullet(pack, rrt / 2);
        }
    }
    if (data.changePack != undefined) {
        // interp tick -> data.changeTick
        lastServerUpdate = window.performance.now();
		updatetimestamp = window.performance.now()/1000;
        for (const pack of data.changePack) {
            if (pack.id != selfId) {
                players[pack.id].otherUpdate(pack, data.changeTick);
            }
			if (pack.x != undefined) {
            	players[pack.id].serverX = pack.x;
			}
			if (pack.y != undefined) {
            	players[pack.id].serverY = pack.y;
			}
			if (pack.health != undefined) {
            	players[pack.id].health = pack.health;
			}
			if (pack.armor != undefined) {
            	players[pack.id].armor = pack.armor;
			}
			if (pack.kills != undefined) {
            	players[pack.id].kills = pack.kills;
			}
			if (pack.chatMessage != undefined) {
				players[pack.id].chatMessage = pack.chatMessage;
			}
			if (pack.powers != undefined) {
				players[pack.id].powers = pack.powers;
			}
			if (pack.chatMessageTimer != undefined) {
				players[pack.id].chatMessageTimer = pack.chatMessageTimer;
			}
			if (pack.shifting != undefined) {
				players[pack.id].shifting = pack.shifting;
			}
			if (pack.currentShift != undefined) {
				players[pack.id].currentShift = pack.currentShift;
			}
			if (pack.totalDamage != undefined) {
				players[pack.id].totalDamage = pack.totalDamage;
			}
			if (pack.magz != undefined) {
				players[pack.id].magz = pack.magz;
			}
			if (pack.invis != undefined) {
				players[pack.id].invis = pack.invis;
			}
			if (pack.invisX != undefined) {
				players[pack.id].invisX = pack.invisX;
			}
			if (pack.invisY != undefined) {
				players[pack.id].invisY = pack.invisY;
			}
			if (pack.lCharge != undefined) {
				players[pack.id].lCharge = pack.lCharge;
			}
			if (pack.activeCooldown != undefined) {
				players[pack.id].activeCooldown = pack.activeCooldown;
			}
			if (pack.activeCooldownTimer != undefined) {
				players[pack.id].activeCooldownTimer = pack.activeCooldownTimer;
			}
			if (pack._qf !== undefined) {
				players[pack.id]._qf = pack._qf;
			}
			if (pack.accurateNext != undefined) {
				players[pack.id].accurateNext = pack.accurateNext;
			}
			if (pack.angle != undefined) {
				players[pack.id].serverAngle = pack.angle;
			}
			if (pack._bendCurve != undefined) {
				players[pack.id]._bendCurve = pack._bendCurve;
			}
			if (pack.bending != undefined) {
				players[pack.id].bending = pack.bending;
			}
        }
    }
    if (data.newBullet != undefined) {
        let delIndex = null;
        for (let i = 0; i < fakeBullets.length; i++) {
            const bullet = fakeBullets[i];
            if (bullet.uid === data.newBullet.uid) {
                delIndex = i;
                break;
            }
        }
        if (delIndex == null) {
            // fakeBullets.splice(delIndex, 1);
            // fake bullets should always be right xD
            bullets[data.newBullet.id] = new Bullet(data.newBullet, rrt / 2);
        } else {
            // fakeBullets[delIndex].id = data.newBullet.id;
			bullets[data.newBullet.id] = new Bullet(data.newBullet, rrt / 2, false);
			bullets[data.newBullet.id].x = fakeBullets[delIndex].x;
			bullets[data.newBullet.id].y = fakeBullets[delIndex].y; // for interp from predict to server
			fakeBullets.splice(delIndex, 1);
        }
		if (bullets[data.newBullet.id].parent == selfId) {
			// cameraAngle += (Math.random() - 0.5)*0.05;
		}
    }
    if (data.bulletPack != undefined) {
        for (const pack of data.bulletPack) {
            if (pack.remove != undefined) {
                if (bullets[pack.remove] == undefined) {
                    let d = null;
                    for (let i = 0; i < fakeBullets.length; i++) {
                        const bullet = fakeBullets[i];
                        if (bullet.id === pack.remove) {
                            d = i;
                            break;
                        }
                    }
                    if (d != null) {
                        fakeBullets.splice(d, 1);
                        console.log('removed fake bullet');
                    }
                } else {
                    delete bullets[pack.remove];
                }
            } else {
                // bullet might not exist?
                bullets[pack.id]?.packUpdate(pack);
            }
        }
    }
    if (data.newPlayer != undefined) {
        players[data.newPlayer.id] = new Player(data.newPlayer);
    }
    if (data.removePlayer != undefined) {
        delete players[data.removePlayer];
    }
    if (data.pong != undefined) {
        rrt = Math.round(window.performance.now() - data.pong);
    }
    if (data.globalTick != undefined) {
        setInterpTick(data.globalTick);
    }
}

window.addEventListener('keydown', trackKeys);
window.addEventListener('keyup', trackKeys);

const Control = {
    KeyW: 'up',
    KeyA: 'left',
    KeyS: 'down',
    KeyD: 'right',
	ArrowUp: 'up',
    ArrowLeft: 'left',
    ArrowDown: 'down',
    ArrowRight: 'right',
	ShiftLeft: 'shift'
};

const input = { left: false, right: false, down: false, up: false, shift: false };

function copyInput() {
    return {
        left: input.left,
        right: input.right,
        down: input.down,
        up: input.up,
		shift: input.shift,
    };
}

chatForm.addEventListener('submit', (e) => {
	e.preventDefault()
	const text = chatInput.value.trim();
	chatInput.value = '';
	if (text.length > 0) {
		send({ chatMessage: text });
	}
})

function trackKeys(event) {
    if (event.repeat || state != 'game' ) return;
    if (Control[event.code] != undefined && !chatOpen()) {
        input[Control[event.code]] = event.type === 'keydown';
		const payload = new InputPayload(currentTick, input);
		send({ input: payload.pack() });
        // const pack = {
        //     inputType: Control[event.code],
        //     inputState: event.type === 'keydown',
        // };
        // send(pack);
    }
    if (event.code === 'KeyP' && event.type === 'keydown' && !chatOpen())  {
        receive = !receive;
    }
    // if (event.code === 'KeyJ' && event.type === 'keydown') {
    //     slow = !slow;
    // }
    // if (event.code === 'KeyK' && event.type === 'keydown') {
    //     fast = !fast;
    // }
	if (event.code === 'KeyL' && event.type === 'keydown' && !chatOpen()) {
		extraLag = 0;
	}
	if (event.code === 'KeyK' && event.type === 'keydown' && !chatOpen()) {
		extraLag += 50;
	}
    if (event.code === 'KeyG' && event.type === 'keydown' && !chatOpen()) {
        showServer = !showServer;
    }
	if (event.code === 'KeyM' && event.type === 'keydown' && !chatOpen()) {
		if (muted) {
			muted = false;
			localStorage.setItem('muted', false);
			music.volume = 0.5;
		} else {
			localStorage.setItem('muted', true);
			muted = true;
			music.volume = 0;
		}
	}
	if (event.code === 'KeyR' && event.type === 'keydown' && !chatOpen()) {
		if (!me().reloading && me().ammo !== Weapons[me().weapon].ammo) {
			me().reloading = true;
			me().reloadTimer = 0;
			send({ reloading: true, reloadTime: me().reloadTime, })
		}
	}
	if (event.code === 'Space' && event.type === 'keydown' && !chatOpen() && state == 'game') {
		send({ activate: true });
	}
	if (event.code === 'Enter' && state == 'game' && event.type === 'keydown') {
		chatContainer.classList.toggle('hidden')
		if (!chatContainer.classList.contains('hidden')) {
			chatInput.focus()
			send({ typing: true })
			me().typing = true;
		} else {
			me().typing = false
			send({ typing: false })
		}
	}
}

		let tileImgs = {};

function createTileImg(color) {
    const tileSize = (100/3);
    const w = canvas.width + tileSize;
    const h = canvas.height + tileSize;

    const canv = document.createElement('canvas');
    const cx = canv.getContext('2d');
    canv.width = w//size / scale;
    canv.height = h//size / scale;
    // cx.imageSmoothingEnabled = false;

    // tile background
    cx.globalAlpha = 0.06;
    cx.strokeStyle = color;
    cx.lineWidth = 2;
    for (let y = 0; y <= /*size / scale*/h; y += tileSize) {
        for (let x = 0; x <= /*size / scale*/w; x += tileSize) {
            cx.strokeRect(x, y, tileSize, tileSize);
        }
    }
    cx.globalAlpha = 1;
    return canv;
}

function drawTiles(color) {
    if (tileImgs[color] === undefined) {
        tileImgs[color] = createTileImg(color);
    }
    // render the image
    // draw it at the top left of the screen - some offset
    const img = tileImgs[color];
    const pos = offset(camera.x, camera.y);
    const gridOffset = offset(-canvas.width/2,-canvas.height/2);
    //ctx.translate(pos.x , pos.y + (gridOffset.y % 50));
    ctx.drawImage(img, 0 + ((gridOffset.x) % (100/3)), 0 + ((gridOffset.y) % (100/3)));
    //ctx.translate(-pos.x - (gridOffset.x % 50), -pos.y - (gridOffset.y % 50));
}

// function drawTiles(color) {
// 	// return;
//     const tileSize = 50;
//     const maxDistToCamera = 1500;
//     const pos = offset(0, 0);

//     ctx.strokeStyle = color;
//     ctx.lineWidth = 2; //0.5;
//     ctx.globalAlpha = 0.2;
//     for (let y = 0; y < arena.r*2; y += tileSize) {
//         for (let x = 0; x < arena.r*2; x += tileSize) {
//             if (
//                 Math.abs(x - camera.x) > maxDistToCamera ||
//                 Math.abs(y - camera.y) > maxDistToCamera
//             ) {
//                 continue;
//             }
//             ctx.strokeRect(pos.x + x, pos.y + y, tileSize, tileSize);
//         }
//     }
//     ctx.globalAlpha = 1;
// }

function resize(elements) {
    for (const element of elements) {
        if (element.width !== width) {
            element.width = width;
            element.style.width = `${width}px`;
        }
        if (element.height !== height) {
            element.height = height;
            element.style.height = `${height}px`;
        }
        let scaleMult = element?._scaleMult ?? 1;
        element.style.transform = `scale(${
            Math.min(window.innerWidth / width, window.innerHeight / height) *
            scaleMult
        })`;
        element.style.left = `${(window.innerWidth - width) / 2}px`;
        element.style.top = `${(window.innerHeight - height) / 2}px`;
    }
    canvScale = Math.min(
        window.innerWidth / width,
        window.innerHeight / height
    );
}
let rrt = 0;

setInterval(() => {
    send({ ping: window.performance.now() });
}, 250);

let upstreamdisplay = 0;
let downstreamdisplay = 0;
setInterval(() => {
    fpsCount = fps;
    fps = 0;
	upstreamdisplay = upstreambytes;
	downstreamdisplay = downstreambytes;
	upstreambytes = 0;
	downstreambytes = 0;
}, 1000);

setInterval(() => {
	if (!onTab) {
		const dt = (window.performance.now() - lastTime) / 1000;
    	lastTime = window.performance.now();
		update(dt);
	}
}, 1000/60)

let lastTime = window.performance.now();
function update(dt) {
	fps++;
    if (fast) {
        if (me().actualSpeed == undefined) {
            me().actualSpeed = me().speed;
        }
        me().speed = me().actualSpeed * 5;
    } else if (slow) {
        if (me().actualSpeed == undefined) {
            me().actualSpeed = me().speed;
        }
        me().speed = me().actualSpeed / 5;
    } else if (me() && me().actualSpeed != undefined) {
        me().speed = me().actualSpeed;
    }

    timer += dt;
    while (timer >= deltaTick) {
        timer -= deltaTick;
        handleTick();
        currentTick++;
        serverGlobalTick++; // for interpolation syncing
        interpolationTick = serverGlobalTick - ticksBetween;
    }

	kTimer -= dt;

    if (hitDamageActivate) {
        hitDamageTimer += dt;
        if (hitDamageTimer > hitDamageTimerMax) {
            hitDamageTimer = 0;
            hitDamageActivate = false;
            hitDamage = 0;
        }
    }

    for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i];
        hit.t += dt;
        if (hit.t > 1) {
            hits.splice(i, 1);
        }
    }

	bulletCooldown = Weapons[me().weapon]?.cooldown;
	// ammo and reloadTime impl
	if (me().ammo == undefined) {
		me().ammo = Weapons[me().weapon].ammo;
	}
	me().reloadTime = Weapons[me().weapon].reloadTime;
	if (me().powers.includes('Magz of War')) {
		me().reloadTime += 1;
	}
	if (me().powers.includes('Accuracy Reload') && me().ammo <= 0) {
		me().reloadTime += 2;
	}
	
	if (me().ammo === 0 && !me().reloading) {
		me().reloading = true;
		me().reloadTimer = 0;
		send({ reloading: true });
	}
	me().reloadTimer += dt;
	if (me().reloading) {
		// me().reloadTimer += dt;
		if (me().reloadTimer > me().reloadTime) {
			me().reloading = false;
			send({ reloading: false })
			currentBulletCooldown = bulletCooldown;
			me().ammo = Weapons[me().weapon].ammo;
		}
	}
	if (!me().reloading) {
		currentBulletCooldown += dt;
		currentBulletCooldown = Math.min(currentBulletCooldown, bulletCooldown);
	}
	let shoot = false;
	if (me().weapon === 'Burst' && me().burstTally >= 1 && me().burstTally < 3 && (window.performance.now() - me().lastShot)/1000 >= 0.25) {
		shoot = true;
	}
	if (me().weapon === 'Burst' && me().burstTally === 3) {
		me().burstTally = 0;
	}
    if (shoot || ((mouseDown) && (!me().reloading ) && (currentBulletCooldown >= bulletCooldown)) && me().ammo >= 1) {
		
		shoot = true;
        let dAngle = me().angle - Math.PI / 2;
		const gunWidth = Weapons[me().weapon].gunWidth ?? 6;
		const gunHeight = me().r * (Weapons[me().weapon].gunHeight ?? 2);
		// if (me().weapon === 'Burst' && me().reloading && (window.performance.now() - me().lastShot)/1000 >= 0.1 && (me().burstTally <= 2 || me().burstTally == undefined)) {
		// 	shoot = true;
		// } else 
		
		// } else if (me().weapon === 'Burst') {
		// 	shoot = false;
		// }
        // const pack = {
        //     angle: me().angle,
        //     shoot: true,
        //     cx:
        //         me().x +
        //         Math.cos(dAngle) * (me().r + gunWidth + 2 + (me().armor / 100) * 13) +
        //         Math.cos(me().angle) * (gunHeight),
        //     cy:
        //         me().y +
        //         Math.sin(dAngle) * (me().r + gunWidth + 2 + (me().armor / 100) * 13) +
        //         Math.sin(me().angle) * (gunHeight),
        //     approxPing: rrt / 2,
        //     uid: Math.random(),
        // };
		if (shoot) {
			me().ammo--;
			const pack = {	
				angle: me().angle,
				shoot: true,
				uid: Math.random()
			}
			if (me().powers.includes('Magz of War') && me().reloadTimer > me().reloadTime && 
				me().reloadTimer < me().reloadTime + 1) {
				pack.magz = true;
			}
	        send(pack);
			me().lastShot = window.performance.now()
			if (me().weapon === 'Burst') {
				if (me().burstTally == undefined) {
					me().burstTally = 0;
				}
				me().burstTally++;
			}
		}
		// if (me().weapon === 'Shotgun') {
	 //        fakeBullets.push(
	 //            new Bullet(
	 //                {
	 //                    id: null,
	 //                    x: pack.cx,
	 //                    y: pack.cy,
	 //                    r: 7,
	 //                    angle: pack.angle - 0.1,
	 //                    speed: 400,//700,
	 //                    life: 0.7,
	 //                    lifeTimer: 0,
	 //                    parent: selfId,
	 //                    uid: pack.uid - 1,
	 //                },
	 //                0,
		// 			true, 
		// 			true,
	 //            )
	 //        );
		// 	fakeBullets.push(
	 //            new Bullet(
	 //                {
	 //                    id: null,
	 //                    x: pack.cx,
	 //                    y: pack.cy,
	 //                    r: 7,
	 //                    angle: pack.angle + 0.1,
	 //                    speed: 400,
	 //                    life: 0.7,
	 //                    lifeTimer: 0,
	 //                    parent: selfId,
	 //                    uid: pack.uid + 1,
	 //                },
	 //                0,
		// 			true, 
		// 			true,
	 //            )
	 //        );
		// 	fakeBullets.push(
	 //            new Bullet(
	 //                {
	 //                    id: null,
	 //                    x: pack.cx,
	 //                    y: pack.cy,
	 //                    r: 7,
	 //                    angle: pack.angle,
	 //                    speed: 400,
	 //                    life: 0.7,
	 //                    lifeTimer: 0,
	 //                    parent: selfId,
	 //                    uid: pack.uid,
	 //                },
	 //                0,
		// 			true, 
		// 			true,
	 //            )
	 //        );
		// } else if (me().weapon === 'Pistol') {
		// 	fakeBullets.push(
	 //            new Bullet(
	 //                {
	 //                    id: null,
	 //                    x: pack.cx,
	 //                    y: pack.cy,
	 //                    r: 8,
	 //                    angle: pack.angle,
	 //                    speed: 400,
	 //                    life: 2,
	 //                    lifeTimer: 0,
	 //                    parent: selfId,
	 //                    uid: pack.uid,
	 //                },
	 //                0,
		// 			true, 
		// 			true,
	 //            )
	 //        );
		// } else if (me().weapon === 'Rifle') {
		// 	fakeBullets.push(
	 //            new Bullet(
	 //                {
	 //                    id: null,
	 //                    x: pack.cx,
	 //                    y: pack.cy,
	 //                    r: 7,
	 //                    angle: pack.angle,
	 //                    speed: 475,
	 //                    life: 1.5,
	 //                    lifeTimer: 0,
	 //                    parent: selfId,
	 //                    uid: pack.uid,
	 //                },
	 //                0,
		// 			true, 
		// 			true,
	 //            )
	 //        );
		// } else if (me().weapon === 'Assault') {
		// 	fakeBullets.push(
	 //            new Bullet(
	 //                {
	 //                    id: null,
	 //                    x: pack.cx,
	 //                    y: pack.cy,
	 //                    r: 6,
	 //                    angle: pack.angle,
	 //                    speed: 425,
	 //                    life: 1.75,
	 //                    lifeTimer: 0,
	 //                    parent: selfId,
	 //                    uid: pack.uid,
	 //                },
	 //                0,
		// 			true, 
		// 			true,
	 //            )
	 //        );
		// } 
		// else if (me().weapon === 'Dual') {
		// 	fakeBullets.push(
		// 		new Bullet({
		// 			id: null,
		// 			x: pack.cx,
		// 			y: pack.cy,
		// 			r: 8, 
		// 			angle: pack.angle,
		// 			speed: 425,
		// 			life: 0.6,
		// 			lifeTimer: 0,
		// 			parent: selfId,
		// 			uid: pack.uid,
		// 		},
		// 		0, true, true )
		// 	)
		// 	dAngle = me().angle + Math.PI / 2;
		// 	const dcx = 
		// 		me().x +
  //               Math.cos(dAngle) * (me().r + gunWidth + 2 + (me().armor / 100) * 13) +
  //               Math.cos(me().angle) * (gunHeight);
		// 	const dcy = 
		// 		me().y +
  //               Math.sin(dAngle) * (me().r + gunWidth + 2 + (me().armor / 100) * 13) +
  //               Math.sin(me().angle) * (gunHeight);
		// 	fakeBullets.push(
		// 		new Bullet({
		// 			id: null,
		// 			x: dcx,
		// 			y: dcy,
		// 			r: 8, 
		// 			angle: pack.angle,
		// 			speed: 425,
		// 			life: 0.6,
		// 			lifeTimer: 0,
		// 			parent: selfId,
		// 			uid: pack.uid,
		// 		},
		// 		0, true, true )
		// 	)
		// 	 // cx:
  //   //             me().x +
  //   //             Math.cos(dAngle) * (me().r + gunWidth + 2 + (me().armor / 100) * 13) +
  //   //             Math.cos(me().angle) * (gunHeight),
  //   //         cy:
  //   //             me().y +
  //   //             Math.sin(dAngle) * (me().r + gunWidth + 2 + (me().armor / 100) * 13) +
  //   //             Math.sin(me().angle) * (gunHeight),
		// }
		fakeBullets = []
        currentBulletCooldown = 0;
    }
	// hit detection/collision/bullet-player
    for (let i = 0; i < fakeBullets.length; i++) {
		const bullet = fakeBullets[i];
        if (bullet.toDelete) continue;
        // let removed = false;
        for (const pK of Object.keys(players)) {
            const player = players[pK];
            if (pK == bullet.parent) continue;
            if (bullet.toDelete) continue;
            const distX = player.x - bullet.x;
            const distY = player.y - bullet.y;
            if (
                distX * distX + distY * distY <
                (player.r + bullet.r) * (player.r + bullet.r)
            ) {
				// hits.push({ x: bullet.x, y: bullet.y, t: 0, server: false, uid: bullet.uid })
                bullet.toDelete = true;
                // removed = true;
                break;
            }
        }
    }
	for (const bulletId of Object.keys(bullets)) {
		const bullet = bullets[bulletId];
		// if (bullet.hit) {
		// 	bullet.hitTimer += dt;
		// 	if (bullet.hitTimer >= (rrt/2)/1000 + 75/1000) {
		// 		bullet.hit = false;
		// 	}
		// 	// if (bullet.hitTimer > 0.1 + ping*2) {
		// 	// 	bullet.hit = false;
		// 	// 	bullet.hitTimer = 0;
		// 	// }
		// }
		// if (bullet.hit) continue;
		// for (const pK of Object.keys(players)) {
  //           const player = players[pK];
  //           if (pK == bullet.parent) continue;
  //           if (bullet.hit) continue;
		// 	if (pK == selfId) continue;
  //           const distX = player.x - bullet.x;
  //           const distY = player.y - bullet.y;
  //           if (
  //               distX * distX + distY * distY <
  //               (player.r + bullet.r) * (player.r + bullet.r)
  //           ) {
		// 		// hits.push({ x: bullet.x, y: bullet.y, t: 0, server: false, uid: bullet.uid })
  //               bullet.hit = true;
		// 		bullet.hitTimer = 0;
  //               // removed = true;
  //               break;
  //           }
  //       }
	}

    if (interp) {
	 const dtheta = -cameraAngle;
      if (dtheta > Math.PI) {
         cameraAngle += 2 * Math.PI;
      } else if (dtheta < -Math.PI) {
         cameraAngle -= 2 * Math.PI;
      }
      cameraAngle = lerp(cameraAngle, 0, dt * 15);
		for (const bulletId of Object.keys(bullets)) {
			const bullet = bullets[bulletId];
			bullet.x = lerp(bullet.x, bullet.interpX, dt*40);
			bullet.y = lerp(bullet.y, bullet.interpY, dt*40)
		}
        for (const playerId of Object.keys(players)) {
            const player = players[playerId];
            // if (playerId == selfId) {
			let px = player.serverX ?? player.isx;
			let py = player.serverY ?? player.isy;
			// if ((window.performance.now() / 1000) - updatetimestamp > pThreshold) {
				// let ostate = stateBuffer[currentTick - Math.ceil((Math.round(rrt)/1000) * serverTickRate)]
				// px = ostate.x;
				// py = ostate.y;
			// }
			player.cshift = lerp(player.cshift, player.currentShift, dt*20)
            player.isx = lerp(
                player.isx,
                px,
                dt * 20
            );
            player.isy = lerp(
                player.isy,
                py,
                dt * 20
            );
            if (playerId == selfId) {
				player.ix = player.x
				player.iy = player.y;
                // player.ix = lerp(player.ix, player.x, dt * 20);
                // player.iy = lerp(player.iy, player.y, dt * 20);
                continue;
            }
            const dtheta = player.angle - player.interpAngle;
            if (dtheta > Math.PI) {
                player.interpAngle += 2 * Math.PI;
            } else if (dtheta < -Math.PI) {
                player.interpAngle -= 2 * Math.PI;
            }
            player.interpAngle = lerp(
                player.interpAngle,
                player.angle,
                dt * 20
            );

            if (player.interpX != undefined) {
                // console.log('lerping', player.x, player.interpX, dt);
                // let idt = Math.min(((window.performance.now() - lastServerUpdate) / 1000) / (1/serverTickRate), 5)
                // player.x = LerpNoClamp(player.x, player.interpX, idt);
                // player.y = LerpNoClamp(player.y, player.interpY, idt);
                player.x = lerp(player.x, player.interpX, dt * 20)
                player.y = lerp(player.y, player.interpY, dt * 20);
                // let idt = Math.min((window.performance.now() - lastServerUpdate) / 1000, 2);

                // let dx = (player.interpX - player.lx) ?? 0;
                // player.interpX = lerp(player.interpX, player.interpX + dx * idt, dt * 15);
                // let dy = (player.interpY - player.ly) ?? 0;
                // player.interpY = lerp(player.interpY, player.interpY + dy * idt, dt * 15);
                // console.log(idt, dx, dy)
                // console.log(player.interpX, dx, idt)
            }
        }
    } else {
        // me().isx = me().serverX;
        // me().isy = me().serverY;
        me().ix = me().x;
        me().iy = me().y;

        for (const playerId of Object.keys(players)) {
            const player = players[playerId];
            player.isx = player.serverX;
            player.isy = player.serverY;
        }
    }

	for (const playerId of Object.keys(players)) {
		const player = players[playerId];
		player.chatMessageTimer -= dt;
	}

    // prediction
    for (const bulletId of Object.keys(bullets)) {
        const bullet = bullets[bulletId];
  //       bullet.x += Math.cos(bullet.angle) * bullet.speed * dt * globalThis.gameSpeed;
  //       bullet.y += Math.sin(bullet.angle) * bullet.speed * dt * globalThis.gameSpeed;
		// bullet.lifeTimer += dt * globalThis.gameSpeed;
		// bullet.angle += bullet.curveFactor * dt * globalThis.gameSpeed;
   //      if (bullet.pingTimer < bullet.totalPing) {
   //          let p = bullet.pingTimer;
   //          bullet.pingTimer += 7;
   //          bullet.pingTimer = Math.min(bullet.pingTimer, bullet.totalPing);
   //          let tempDt = (bullet.pingTimer - p) / 1000;
   //          bullet.x += Math.cos(bullet.angle) * bullet.speed * tempDt;
   //          bullet.y += Math.sin(bullet.angle) * bullet.speed * tempDt;
			// bullet.lifeTimer += tempDt;
   //      }
		if (bullet.lifeTimer > bullet.life) {
			bullet.hit = true;
		}
        // bullet.recordHist();
    }
  //   for (let i = 0; i < fakeBullets.length; i++) {
  //       let bullet = fakeBullets[i];
		// if (bullet.toDelete == undefined) {
  //       	// bullet.x += Math.cos(bullet.angle) * bullet.speed * dt;
  //       	// bullet.y += Math.sin(bullet.angle) * bullet.speed * dt;
		// }
  //       bullet.lifeTimer += dt;
  //       // bullet.recordHist();
  //       if (bullet.lifeTimer > bullet.life) {
  //           fakeBullets.splice(i, 1);
  //           i++;
  //       }
  //   }

	if (gotHitTimer < 0.3) {
		gotHitTimer += dt;
	}

}
function run() {
    requestAnimationFrame(run);
    const dt = (window.performance.now() - lastTime) / 1000;
    lastTime = window.performance.now();
    if (state != 'game') return;
	me().angle = Math.atan2(window.my - 450, window.mx - 800);
	xoff = lerp(xoff, -Math.cos(me().angle) * 75, dt * 5)
	yoff = lerp(yoff, -Math.sin(me().angle) * 75, dt * 5)
    update(dt)

    // ctx.fillStyle = '#002905';
	// ctx.fillStyle = '#041e45'
	ctx.fillStyle = '#363636'
	// ctx.fillStyle = '#7d463d'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!arena) {
        // loading screen
        ctx.fillStyle = '#2b2b2b';
        ctx.font = '100px Work Sans, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Joining game...', canvas.width / 2, canvas.height / 2);
		
        return;
    }
	document.body.style.background = '#363636'
    me().interpAngle = me().angle;
    // camera.x = (me().x + me().isx)/2;
    // camera.y = (me().y + me().isy)/2;
	camera.x = me().isx
	camera.y = me().isy
	ctx.save()
	ctx.translate(canvas.width / 2, canvas.height / 2);
  	ctx.rotate(cameraAngle);
  	ctx.translate(-canvas.width / 2, -canvas.height / 2);
    const a = offset(arena.r, arena.r);
    // ctx.fillStyle = '#d4d4d4';
	// ctx.fillStyle = '#1b8014'
	// ctx.fillStyle = '#1c3094'
	// ctx.fillStyle = '#919191'
	
	ctx.fillStyle = '#919191'
	// ctx.fillStyle = '#816f5a'
	ctx.beginPath();
	ctx.arc(a.x, a.y, arena.r, 0, Math.PI * 2)
	ctx.fill()
    // ctx.fillRect(a.x, a.y, arena.w, arena.h);
    // drawTiles('#6e6e6e');
	// drawTiles('#002905')
	// drawTiles('#041e45')
	drawTiles('#363636')
	// drawTiles('#7d463d')

	 // ability effects and stuff
	

	
	
	if (obstacles != undefined) {
		for (const { x, y, w, h } of obstacles) {
			ctx.lineWidth = 6;
			ctx.fillStyle = '#363636'
			// ctx.fillStyle = '#ffa340'
			// ctx.strokeStyle = '#363636'
			// if (w < 25 || h < 25) {
			// 	ctx.fillStyle = '#91a7ff'
			// }
			const pos = offset(x, y);
			ctx.fillRect(Math.round(pos.x) - 1, Math.round(pos.y) - 1, w + 2, h + 2);
			// ctx.strokeRect(Math.round(pos.x) - 1, Math.round(pos.y) - 1, w + 2, h + 2);
		}
	}
	for (const playerId of Object.keys(players)) {
		const player = players[playerId];
		if (player.powers.includes('Quantum Field')) {
			if (!player._qf) continue;
			ctx.fillStyle = '#ffeded'
			ctx.globalAlpha = 0.5 //- ((player._qf.t/5)*0.4);
			ctx.beginPath();
			ctx.arc(offsetX(player._qf.x), offsetY(player._qf.y), player._qf.r, 0, Math.PI * 2);
			ctx.fill()
		}
	}
	ctx.globalAlpha = 1;
	
	for (const bulletId of Object.keys(bullets)) {
        const bullet = bullets[bulletId];
		if (bullet.hit) continue;
        if (showServer) {
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(
                offsetX(bullet.interpX),
                offsetY(bullet.interpY),
                bullet.r,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
		if (bullet.life - bullet.lifeTimer <= 0.3) {
			ctx.globalAlpha = (bullet.life - bullet.lifeTimer) / 0.3;
		}
		ctx.globalAlpha = 1;
		ctx.fillStyle = 'black'
        let x = offsetX(bullet.x) 
        let y = offsetY(bullet.y)
  //       ctx.fillStyle = 'blue';
		// ctx.beginPath()
  //       ctx.arc(x, y, bullet.r, 0, Math.PI * 2);
  //       ctx.fill();
		// ctx.globalAlpha = 1;
		
		ctx.fillStyle = 'black';
		if (bullet.magz) {
			// ctx.fillStyle = Powers['Magz of War'].color;
			ctx.fillStyle = '#071eb0'
		}
		if (Math.abs(bullet.curveFactor) > 0) {
			ctx.fillStyle = '#51ff33'//'#d878ff'
		}
		if (bullet.rev) {
			ctx.fillStyle = Powers['Bullet Boomerang'].color;
		}
		ctx.beginPath();
		ctx.arc(x, y, bullet.r, 0, Math.PI * 2);
		ctx.fill()
		// ctx.translate(x, y);
		// ctx.rotate(bullet.angle);
		// ctx.fillRect(-bullet.r - 2.5, -bullet.r/3, bullet.r*2 + 5, bullet.r/(3/2));
		// if (bullet.magz) {
		// 	ctx.strokeStyle = 'black'
		// 	ctx.lineWidth = 1;
		// 	// ctx.strokeRect(-bullet.r - 2.5 + 1, -bullet.r/3 + 1, bullet.r*2 + 5 - 2, bullet.r/(3/2) - 2);
		// }
		// ctx.rotate(-bullet.angle);
		// ctx.translate(-x, -y)
		ctx.globalAlpha = 1;
        // for (let i = bullet.hist.length - 1; i >= 0; i--) {
        //     let { x, y } = bullet.hist[i];
        //     let pos = offset(x, y);
        //     ctx.globalAlpha = (i / bullet.hist.length) * 0.9;
        //     ctx.translate(pos.x, pos.y);
        //     ctx.fillStyle = 'black';
        //     ctx.arc(0, 0, bullet.r, 0, Math.PI * 2);
        //     ctx.fill();
        //     ctx.globalAlpha = 1;
        //     ctx.translate(-pos.x, -pos.y);
        // }
    }
	// ctx.fillStyle = '#696969';
	// ctx.fillStyle = '#013600'
	// ctx.fillStyle = '#000a36'
	
    
    for (const bullet of fakeBullets) {
		if (bullet.toDelete) continue;
		if (bullet.life - bullet.lifeTimer <= 0.3) {
			ctx.globalAlpha = (bullet.life - bullet.lifeTimer) / 0.3;
		}
        ctx.beginPath();
        let x = offsetX(bullet.x);
        let y = offsetY(bullet.y);
        ctx.fillStyle = showServer ? 'blue': 'black';
        ctx.arc(x, y, bullet.r, 0, Math.PI * 2);
        ctx.fill();
		ctx.globalAlpha = 1;
        // for (let i = bullet.hist.length - 1; i >= 0; i--) {
        //     let { x, y } = bullet.hist[i];
        //     let pos = offset(x, y);
        //     ctx.globalAlpha = (i / bullet.hist.length) * 0.9;
        //     ctx.translate(pos.x, pos.y);
        //     ctx.fillStyle = 'black';
        //     ctx.arc(0, 0, bullet.r, 0, Math.PI * 2);
        //     ctx.fill();
        //     ctx.globalAlpha = 1;
        //     ctx.translate(-pos.x, -pos.y);
        // }
    }
 //    if (showServer) {
 //        for (const playerId of Object.keys(players)) {
 //            const player = players[playerId];
 //            // ctx.fillStyle = '#c92a2a';
 //            // ctx.globalAlpha = 0.8;
 //            // ctx.beginPath();
 //            // ctx.arc(
 //            //     offsetX(player.isx),
 //            //     offsetY(player.isy),
 //            //     player.r,
 //            //     0,
 //            //     Math.PI * 2
 //            // );
 //            // ctx.fill();
 //            // ctx.globalAlpha = 1;
 //            if (playerId == selfId) {
 //                ctx.fillStyle = 'green';
 //                ctx.globalAlpha = 0.8;
 //                ctx.beginPath();
 //                ctx.arc(
 //                    offsetX(player.serverX),
 //                    offsetY(player.serverY),
 //                    player.r,
 //                    0,
 //                    Math.PI * 2
 //                );
 //                ctx.fill();
 //                ctx.globalAlpha = 1;
 //            }
	// 		if (playerId == selfId) {
 //                ctx.fillStyle = 'red';
 //                ctx.globalAlpha = 0.8;
 //                ctx.beginPath();
 //                ctx.arc(
 //                    offsetX(player.x),
 //                    offsetY(player.y),
 //                    player.r,
 //                    0,
 //                    Math.PI * 2
 //                );
 //                ctx.fill();
 //                ctx.globalAlpha = 1;
 //            }
	// 		let ostate = stateBuffer[currentTick - Math.ceil((Math.round(rrt)/1000) * serverTickRate) ]
	// 		if (playerId == selfId) {
 //                ctx.fillStyle = 'blue';
 //                ctx.globalAlpha = 0.8;
 //                ctx.beginPath();
 //                ctx.arc(
 //                    offsetX(ostate.x),
 //                    offsetY(ostate.y),
 //                    player.r,
 //                    0,
 //                    Math.PI * 2
 //                );
 //                ctx.fill();
 //                ctx.globalAlpha = 1;
 //            }
 //        }
 //    }
	// if (showServer) {
	// 	ctx.fillStyle = 'orange';
	// 	ctx.globalAlpha = 0.8;
	// 	ctx.beginPath();
	// 	ctx.arc(
	// 		offsetX(playerData.x),
	// 		offsetY(playerData.y),
	// 		playerData.r,
	// 		0,
	// 		Math.PI * 2
	// 	);
	// 	ctx.fill();
	// 	ctx.globalAlpha = 1;
	// }

	// ABOVE PLAYER EFFECTS - bended barrel for now
	for (const playerId of Object.keys(players)) {
		const player = players[playerId]
		let x = offsetX(player.x);
        let y = offsetY(player.y);
		// if (playerId == selfId && (window.performance.now() / 1000) - updatetimestamp > pThreshold) {
		// 	let ostate = stateBuffer[currentTick - Math.ceil((Math.round(rrt)/1000) * serverTickRate)]
		// 	x = offsetX(ostate.x);
		// 	y = offsetY(ostate.y);
		// } else 
		if (playerId == selfId) {
			x = offsetX(player.isx);
			y = offsetY(player.isy);
		}
		if (player.powers.includes('Shadow Reload') && player.invis && playerId != selfId) {
			x = offsetX(player.invisX);
			y = offsetY(player.invisY);
		}
		// if (player.powers.includes('Bended Barrel') && playerId == selfId) {
		// 	ctx.strokeStyle = player.bending ? '#d878ff' : Powers['Bended Barrel'].color;
		// 	ctx.lineWidth = 5;
		// 	ctx.lineCap = 'round'
		// 	let bestId = null;
		// 	let bestDist = Infinity;
		// 	for (const pId of Object.keys(players)) {
		// 		if (pId == player.id) continue;
		// 		const p = players[pId];
		// 		const distX = player.isx - p.x;
		// 		const distY = player.isy - p.y;
		// 		const dist = Math.sqrt(distX * distX + distY * distY);
		// 		if (dist < bestDist) {
		// 			bestDist = dist;
		// 			bestId = pId;
		// 		}
		// 	}
		// 	if (bestId != null) {
		// 		const p = players[bestId];
		// 		ctx.globalAlpha = player.bending ? 1: 0.2;
		// 		ctx.beginPath();
		// 		ctx.lineTo(x, y);
		// 		ctx.lineTo(offsetX(p.isx ?? p.x), offsetY(p.isy ?? p.y));
		// 		ctx.stroke()
		// 		ctx.globalAlpha = 1;
		// 	}
		// }
	}
	
    for (const playerId of Object.keys(players)) {
        // ctx.globalAlpha = 0.7;
        const player = players[playerId];
		let x = offsetX(player.x);
        let y = offsetY(player.y);
		// if (playerId == selfId && (window.performance.now() / 1000) - updatetimestamp > pThreshold) {
		// 	let ostate = stateBuffer[currentTick - Math.ceil((Math.round(rrt)/1000) * serverTickRate)]
		// 	x = offsetX(ostate.x);
		// 	y = offsetY(ostate.y);
		// } else 
		if (playerId == selfId) {
			x = offsetX(player.isx);
			y = offsetY(player.isy);
		}
		if (player.powers.includes('Shadow Reload') && player.invis && playerId != selfId) {
			x = offsetX(player.invisX);
			y = offsetY(player.invisY);
		}
        ctx.fillStyle = '#d11d1d';
		if (player.shifting) {
			ctx.fillStyle = '#ff5900'
		}
        ctx.globalAlpha = 0.3;
		// if (topPlayers()[0].id == selfId) {
		// 	ctx.shadowBlur = 20;
		// 	ctx.shadowColor = '#ffcc00';
		// } else {
		// 	ctx.shadowBlur = 0;
		// }
		
		if (topPlayers()[0].id == playerId) {
			ctx.shadowBlur = 0
			ctx.shadowColor = '#ffcc00';
		} else {
			ctx.shadowBlur = 0;
		}
		// ctx.fillStyle = 'black'
		if (player.powers.includes('Magz of War')) {
			if (player.magz) {
				ctx.fillStyle = 'black'
			}
			// if (player.reloadTimer > player.reloadTime && player.reloadTimer < player.reloadTime + 1) {
			// 	ctx.fillStyle = Powers['Magz of War'].color
			// }
		}
		
		

		if (player.lCharge) {
			ctx.fillStyle = 'red'
		}

        ctx.beginPath();
        ctx.arc(x, y, player.r, 0, Math.PI * 2);
        ctx.fill();
		
        ctx.globalAlpha = 1;
		if (player.powers.includes('Shadow Reload') && player.invis && playerId == selfId) {
			// ctx.fillStyle = 'black'
			ctx.globalAlpha = 0
		}
		if (player.invis && player.powers.includes('Shadow Reload')) {
			ctx.globalAlpha = 0.25;
		}
		if (player.powers.includes('Magz of War')) {
			if (player.magz) {
				ctx.fillStyle = Powers['Magz of War'].color;
			}
			// if (player.reloadTimer > player.reloadTime && player.reloadTimer < player.reloadTime + 1) {
			// 	ctx.fillStyle = Powers['Magz of War'].color
			// }
		}
        ctx.beginPath();
        ctx.arc(x, y, player.r * (player.health / 100), 0, Math.PI * 2);
        ctx.fill();
		
		
        ctx.strokeStyle = '#303030';
		if (player.lCharge) {
			ctx.strokeStyle = 'red'
		}
		if (player.accurateNext) {
			ctx.strokeStyle = 'blue'
		}
		if (player.bending) {
			// ctx.strokeStyle = '#d878ff'//Powers['Bended Barrel'].color;
		}
        ctx.lineWidth = 2 + (player.armor / 100) * 13; // + armor
        ctx.beginPath();
        ctx.arc(x, y, player.r - ctx.lineWidth/2 + 1, 0, Math.PI * 2);
        ctx.stroke();
        // ctx.fillStyle = '#303030';
		ctx.fillStyle = 'black'

		if (player.invis && playerId == selfId) {
			x = offsetX(player.invisX);
			y = offsetY(player.invisY);
			 ctx.fillStyle = '#d11d1d';
			if (player.shifting	) {
				ctx.fillStyle = '#ff5900'
			}
	        ctx.globalAlpha = 0.3;
			ctx.beginPath();
        	ctx.arc	(x, y, player.r, 0, Math.PI * 2);
	        ctx.fill();
			ctx.globalAlpha = 1;
			ctx.beginPath();
        	ctx.arc(x, y, player.r * (player.health / 100), 0, Math.PI * 2);
	        ctx.fill();
			 ctx.strokeStyle = '#303030';
       	 	ctx.lineWidth = 2 + (player.armor / 100) * 13; // + armor
	        ctx.beginPath();
	        ctx.arc(x, y, player.r - ctx.lineWidth/2 + 1, 0, Math.PI * 2);
	        ctx.stroke();
	        // ctx.fillStyle = '#303030';
			ctx.fillStyle = 'black'
			x = offsetX(player.isx);
			y = offsetY(player.isy);
		}
		// if (player.shifting) {
		// 	ctx.fillStyle = '#7d7d7d'
		// }
		ctx.globalAlpha = 1;
        ctx.font = '18px Work Sans, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
		if (player.lCharge) {
			ctx.fillStyle = 'red'
		}
		if (playerId != selfId) {
        	ctx.fillText(	
	            player.name/* + '' + player.kills + ''*/,
	            x,
	            y + player.r * (1.5 /*+ 0.2 * (player.armor / 100)*/)
	        );
		}
	
        ctx.fillStyle = 'white';
        // ctx.fillText(player.kills, x, y);
        // if (playerId == selfId) {
        // ctx.strokeStyle = 'black';
        // ctx.lineWidth = 5;
        let currentAngle = player.interpAngle;
        // ctx.beginPath();
        // ctx.lineTo(
        //     x + Math.cos(currentAngle) * player.r,
        //     y + Math.sin(currentAngle) * player.r
        // );
        // ctx.lineTo(
        //     x + Math.cos(currentAngle) * (player.r + 200),
        //     y + Math.sin(currentAngle) * (player.r + 200)
        // );
        // ctx.stroke();
        ctx.fillStyle = Weapons[player.weapon].color ?? 'black';
		if (player.lCharge) {
			ctx.fillStyle = 'red'
		}
		if (player.bending) {
			ctx.fillStyle = Powers['Bended Barrel'].color//'#d878ff'
		}
	// ctx.fillStyle = '#303030'
		const gunWidth = Weapons[player.weapon].gunWidth ?? 6;
		const gunHeight = player.r * (Weapons[player.weapon].gunHeight ?? 2);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(currentAngle - Math.PI / 2);
		let mult = playerId == selfId ? /*(currentBulletCooldown/bulletCooldown)*/ 
			(bulletCooldown > 0.3 ? (currentBulletCooldown < bulletCooldown ? 0: 1) :1): 1;
		if (!player.reloading) {
			let cmult = playerId == selfId ? Math.min((currentBulletCooldown/bulletCooldown)*(5/3) , 1): 1;
      	  ctx.globalAlpha = 0.5;
	        ctx.fillRect(
	            player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2,
	            -player.r * 0 + cmult*5 - 5,
	            gunWidth*2,
	            gunHeight * 1.5,
	        );
			
			// player.name = cmult;
			// player.name = Math.round(c*10)/10
			ctx.globalAlpha = 1;
			 ctx.fillRect(
	            player.r/*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2,
	            -player.r * 0 + cmult*5 - 5,
	            gunWidth*2,
	            gunHeight * 1.5 * mult,
	        );
			// if (player.powers.includes('Magz of War')) {
				// if () {
					// ctx.strokeStyle = 'white';
					// ctx.lineWidth = 2;
					// ctx.strokeRect(
	    //         		player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2,
			  //           -player.r * 0,
			  //           gunWidth*2,
			  //           gunHeight * 1.5 * mult,
			  //       );
				// }
			// }
			ctx.fillStyle = 'black';
			ctx.font = '20px Work Sans, Arial';
			ctx.textAlign = 'center';
			if (player.lCharge) {
				ctx.fillStyle = 'red'
			}
			if (player.bending) {
				ctx.fillStyle = Powers['Bended Barrel'].color;//'#d878ff'
			}
			if (playerId == selfId) {
				ctx.rotate(-(currentAngle - Math.PI / 2))
				ctx.fillText(me().ammo, player.r + 4 /*+ (player.armor / 100) * 13*/ - gunWidth, player.r+2);
			}
		} else if (player.reloading) {
			mult = playerId == selfId ? (player.reloadTimer/player.reloadTime): 1;
			// const c = playerId == selfId ? 1 - (currentBulletCooldown/bulletCooldown): 1;
			let c = ctx.fillStyle;
			// if ()
			ctx.globalAlpha = 0.4;
	        ctx.fillRect(
	            player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2 + 30,
	            -player.r * 0 - 30,
	            gunWidth*2,
	            gunHeight * 1.5,
	        );
			ctx.globalAlpha = 0.8;
			 ctx.fillRect(
	            player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2 + 30,
	            -player.r * 0 - 30 ,
	            gunWidth*2,
	            gunHeight * 1.5 * mult,
	        );
			// if (player.powers.includes('Magz of War')) {
			// 	if (player.reloadTimer > player.reloadTime - 1) {
			// 		ctx.strokeStyle = '#030017'
			// 		ctx.lineWidth = 4;
			// 		ctx.strokeRect(
	  //           		player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2 + 30,
			//             -player.r * 0 - 30,
			//             gunWidth*2,
			//             gunHeight * 1.5 * mult,
			//         );
			// 	}
			// }
			ctx.fillStyle = 'black';
			ctx.font = '20px Work Sans, Arial';
			ctx.textAlign = 'center';
			if (player.lCharge) {
				ctx.fillStyle = 'red'
			}
			if (player.bending) {
				// haha no color change because bending doesnt work after reload
			}
			if (playerId == selfId) {
				ctx.rotate(-(currentAngle - Math.PI / 2))
				ctx.fillText('...' + Math.floor(mult*Weapons[player.weapon].ammo), player.r + 4/*+ 2 + (player.armor / 100) * 13*/ - gunWidth, player.r);
			}
		}
		// ctx.globalAlpha = 0.6
		// ctx.fillRect(
  //           player.r + 2 + (player.armor / 100) * 13,
  //           -player.r * 1,
  //           gunWidth*2,
  //           gunHeight * 1.5 * mult
  //       );
        ctx.globalAlpha = 1;
		// if (player.weapon === 'Dual') {
		// 	// ctx.rotate(Math.PI)
		// 	ctx.globalAlpha = 0.2;
	 //        ctx.fillRect(
	 //            -player.r - player.r - gunWidth*2 + player.r -2 - (player.armor / 100) * 13,
	 //            -player.r * 1,
	 //            gunWidth*2,
	 //            gunHeight * 1.5,
	 //        );
		// 	ctx.globalAlpha = 0.6
		// 	ctx.fillRect(
	 //            -player.r - player.r - gunWidth*2 + player.r  -2- (player.armor / 100) * 13,
	 //            -player.r * 1,
	 //            gunWidth*2,
	 //            gunHeight * 1.5 * mult
	 //        );
	 //        ctx.globalAlpha = 1;
		// }
        ctx.restore();
		ctx.shadowBlur = 0;
		if (showServer && playerId == selfId && player._bendCurve != undefined) {
			const rotation = player._bendCurve.rotation * (Math.PI/180);
			ctx.fillStyle = 'blue';
			// ctx.beginPath()
			ctx.fillText(Math.round(player._bendCurve.rotation), x + Math.cos(rotation) * player.r, y + Math.sin(rotation) * player.r)
			// ctx.fill()
			if (player._bendCurve.factor != undefined) {
				player.name = player._bendCurve.factor;
			}
		}
		ctx.fillStyle = Weapons[player.weapon].color ?? 'black';
		if (playerId == selfId && showServer) {
			currentAngle = player.serverAngle;
			ctx.save();
        	ctx.translate(x, y);
	        ctx.rotate(currentAngle - Math.PI / 2);
			let mult = playerId == selfId ? /*(currentBulletCooldown/bulletCooldown)*/ 
				(bulletCooldown > 0.3 ? (currentBulletCooldown < bulletCooldown ? 0: 1) :1): 1;
			if (!player.reloading) {
				let cmult = playerId == selfId ? Math.min((currentBulletCooldown/bulletCooldown)*(5/3) , 1): 1;
	      	  ctx.globalAlpha = 0.25;
		        ctx.fillRect(
		            player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2,
		            -player.r * 0 + cmult*5 - 5,
		            gunWidth*2,
		            gunHeight * 1.5,
		        );
				
				// player.name = cmult;
				// player.name = Math.round(c*10)/10
				ctx.globalAlpha = 0.5;
				 ctx.fillRect(
		            player.r/*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2,
		            -player.r * 0 + cmult*5 - 5,
		            gunWidth*2,
		            gunHeight * 1.5 * mult,
		        );
				// if (player.powers.includes('Magz of War')) {
					// if () {
						// ctx.strokeStyle = 'white';
						// ctx.lineWidth = 2;
						// ctx.strokeRect(
		    //         		player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2,
				  //           -player.r * 0,
				  //           gunWidth*2,
				  //           gunHeight * 1.5 * mult,
				  //       );
					// }
				// }
				// ctx.fillStyle = 'black';
				// ctx.font = '20px Work Sans, Arial';
				// ctx.textAlign = 'center';
				// if (player.lCharge) {
				// 	ctx.fillStyle = 'red'
				// }
				// if (playerId == selfId) {
				// 	ctx.rotate(-(currentAngle - Math.PI / 2))
				// 	ctx.fillText(me().ammo, player.r + 4 /*+ (player.armor / 100) * 13*/ - gunWidth, player.r+2);
				// }
			} else if (player.reloading) {
				mult = playerId == selfId ? (player.reloadTimer/player.reloadTime): 1;
				// const c = playerId == selfId ? 1 - (currentBulletCooldown/bulletCooldown): 1;
				let c = ctx.fillStyle;
				// if ()
				ctx.globalAlpha = 0.2;
		        ctx.fillRect(
		            player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2 + 30,
		            -player.r * 0 - 30,
		            gunWidth*2,
		            gunHeight * 1.5,
		        );
				ctx.globalAlpha = 0.4;
				 ctx.fillRect(
		            player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2 + 30,
		            -player.r * 0 - 30 ,
		            gunWidth*2,
		            gunHeight * 1.5 * mult,
		        );
				// if (player.powers.includes('Magz of War')) {
				// 	if (player.reloadTimer > player.reloadTime - 1) {
				// 		ctx.strokeStyle = '#030017'
				// 		ctx.lineWidth = 4;
				// 		ctx.strokeRect(
		  //           		player.r /*+ 2 + (player.armor / 100) * 13*/ - gunWidth*2 + 30,
				//             -player.r * 0 - 30,
				//             gunWidth*2,
				//             gunHeight * 1.5 * mult,
				//         );
				// 	}
				// }
				// ctx.fillStyle = 'black';
				// ctx.font = '20px Work Sans, Arial';
				// ctx.textAlign = 'center';
				// if (player.lCharge) {
				// 	ctx.fillStyle = 'red'
				// }
				// if (playerId == selfId) {
				// 	ctx.rotate(-(currentAngle - Math.PI / 2))
				// 	ctx.fillText('...' + Math.floor(mult*Weapons[player.weapon].ammo), player.r + 4/*+ 2 + (player.armor / 100) * 13*/ - gunWidth, player.r);
				// }
			}
			// ctx.globalAlpha = 0.6
			// ctx.fillRect(
	  //           player.r + 2 + (player.armor / 100) * 13,
	  //           -player.r * 1,
	  //           gunWidth*2,
	  //           gunHeight * 1.5 * mult
	  //       );
	        ctx.globalAlpha = 1;
			// if (player.weapon === 'Dual') {
			// 	// ctx.rotate(Math.PI)
			// 	ctx.globalAlpha = 0.2;
		 //        ctx.fillRect(
		 //            -player.r - player.r - gunWidth*2 + player.r -2 - (player.armor / 100) * 13,
		 //            -player.r * 1,
		 //            gunWidth*2,
		 //            gunHeight * 1.5,
		 //        );
			// 	ctx.globalAlpha = 0.6
			// 	ctx.fillRect(
		 //            -player.r - player.r - gunWidth*2 + player.r  -2- (player.armor / 100) * 13,
		 //            -player.r * 1,
		 //            gunWidth*2,
		 //            gunHeight * 1.5 * mult
		 //        );
		 //        ctx.globalAlpha = 1;
			// }
	        ctx.restore();
			ctx.shadowBlur = 0;
		}
		// if (topPlayers()[0].id == playerId && playerId != selfId) {
		// 	ctx.shadowBlur = 0;
		// }
		if (player.chatMessageTimer > 0) {
			ctx.globalAlpha = Math.min(player.chatMessageTimer < 1 ? player.chatMessageTimer/1: 0.9, 0.9);
			ctx.fillStyle = '#303030';
			ctx.font = '20px Work Sans, Arial';
	        ctx.textAlign = 'center';
	        ctx.textBaseline = 'middle';
			const width = ctx.measureText(player.chatMessage).width;
			ctx.fillRect(x - width/2 - 10, y - player.r - 50, width + 20, 30);
			ctx.globalAlpha = 1;
			ctx.fillStyle = 'white';
			ctx.fillText(player.chatMessage, x, y - player.r - 35);
			ctx.globalAlpha = 1;
		} else if (player.typing) {
			ctx.globalAlpha = 0.9;
			ctx.fillStyle = '#303030';
			ctx.font = '20px Work Sans, Arial';
	        ctx.textAlign = 'center';
	        ctx.textBaseline = 'middle';
			const width = ctx.measureText('...').width;
			ctx.fillRect(x - width/2 - 10, y - player.r - 50, width + 20, 30);
			ctx.globalAlpha = 1;
			ctx.fillStyle = 'white';
			ctx.fillText('...', x, y - player.r - 35);
		}
        // }
    }

    for (const { x, y, server, t, dmg } of hits) {
        // ctx.fillStyle = server ? 'black': 'white';
		ctx.fillStyle = 'black'
		if (!server || t > 0.4) continue;
        ctx.font = '30px Work Sans, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`X`, offsetX(x), offsetY(y));
        ctx.globalAlpha = 1;
    }
	// ctx.restore()

	// ctx.translate(-canvas.width / 2, -canvas.height / 2);
 //  	ctx.rotate(-cameraAngle);
 //  	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.restore()
	// if (topPlayers()[0].id == selfId) {
	// 	ctx.shadowBlur = 20;
	// 	ctx.shadowColor = '#ffcc00';
	// }
	
	// ctx.fillStyle = 'red'
	// ctx.globalAlpha = 0.6 - (me().health / 100)*0.6
	// ctx.fillRect(0, 0, canvas.width, canvas.height)
	// ctx.globalAlpha = 1;
 	ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    const outerRadius = canvas.height*1;
    const innerRadius = canvas.width*0.01;
    const grd = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        innerRadius,
        canvas.width / 2,
        canvas.height / 2,
        outerRadius
    );
    grd.addColorStop(0, 'rgba(255,0,0,0)');
    grd.addColorStop(1, 'rgba(255,0,0,' + (1 - (me().health / 100)*1) + ')');
    ctx.fillStyle = grd;
    ctx.fill();

	if (gotHitTimer < 0.3) {
		// ctx.fillStyle = gotHitStorm || me().armor <= 0 ? '#e62929': '#303030'
		ctx.fillStyle = 'black'
		ctx.globalAlpha = 0.5 - (gotHitTimer / 0.3)*0.5
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		ctx.globalAlpha = 1;
	}
	if (kTimer >= 2.75) {
		// 3 - 2
		ctx.fillStyle = 'white';
		ctx.globalAlpha = ((kTimer-2.75)*4)*0.3
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1;
	}
	if (hitDamageTimer <= 0.25 && hitDamageActivate) {
		ctx.fillStyle = 'white';
		ctx.globalAlpha = 0.05 - (hitDamageTimer*4)*0.05
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1;
	}

    ctx.fillStyle = 'black';
    ctx.font = '15px Work Sans, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        Math.round(rrt / 2) +
            ' ms' +
		(showServer ? (
			' [' +
            fpsCount +
            'fps] [' +
            Object.keys(players).length +
            ' players]') : '') ,
    	2,
        canvas.height - 8
    );
	if (showServer) {
		ctx.fillText('upstream: ' + (upstreamdisplay/1000).toFixed(2) + ' kb.s' +
				' | downstream: ' + (downstreamdisplay/1000).toFixed(2) + ' kb/s', 10,
					canvas.height - 40)
	}
	// ctx.textAlign = 'right';
	// ctx.fillText(`[${me().weapon}]`, canvas.width-5, canvas.height - 15)
	// // ctx.font = '35px Work Sans, Arial';
	// // ctx.fillText(`${me().ammo} / ${Weapons[me().weapon].ammo}`, canvas.width - 50, canvas.height - 50);
	// ctx.font = '20px Work Sans, Arial';
	// ctx.fillStyle = '#757575';
	// ctx.globalAlpha = 0.6;
	// ctx.fillRect(canvas.width / 2 - 200, canvas.height - 40, 400, 40);
	// ctx.globalAlpha = 1;
 //    ctx.fillStyle = '#c20000';
 //    ctx.textAlign = 'center';
 //    ctx.fillText(
 //        'Health: ' +
 //            Math.round(me().health) +
 //            ' (' +
 //            Math.round(me().health) +
 //            '%)',
 //        canvas.width / 2 - 100,
 //        canvas.height - 20
 //    );
 //    ctx.fillStyle = '#303030';
 //    ctx.fillText(
 //        'Armor: ' +
 //            Math.round(me().armor) +
 //            ' (' +
 //            Math.round((me().armor / (me().maxArmor ?? 1)) * 100) +
 //            '%)',
 //        canvas.width / 2 + 100,
 //        canvas.height - 20
 //    );
	// ctx.fillStyle = '#a8a8a8';
	// ctx.globalAlpha = 0.5;
	// ctx.fillRect(canvas.width / 2  - 150, canvas.height - 70, 300, 30);
	// ctx.globalAlpha = 1;
	// ctx.fillStyle = me().shifting ? '#dedede': '#a8a8a8'
	// ctx.fillRect(canvas.width / 2 - 150, canvas.height - 70, 300 * (me().currentShift / me().shiftLength), 30)
 //    ctx.strokeStyle = '#757575';
	// ctx.fillStyle = 'black'
	// ctx.font = '20px Work Sans, Arial';
	// ctx.fillText(`${Math.round((me().currentShift/me().shiftLength)*100)}%`, canvas.width / 2, canvas.height - 55)
	// ctx.lineWidth = 3;
	// ctx.strokeRect(canvas.width / 2  - 150, canvas.height - 70, 300, 30);
	playerUI()
	ctx.fillStyle = 'gray';
	
	let playerNames = topPlayers()
	playerNames.length = Math.min(playerNames.length, 5);
	let height = (playerNames.length) * 30
	ctx.fillStyle = 'white';
	ctx.font = '20px Work Sans, Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle'
	const playerCount = Object.keys(players).length;
	ctx.fillText(`Leaderboard: ${playerCount} player${playerCount === 1 ? '': 's'}`, canvas.width - 125, 10)
	ctx.fillStyle = 'black'
	ctx.globalAlpha = 0.6;
	ctx.fillRect(canvas.width - 250 + 25/2, 20, 225, height);
	ctx.globalAlpha = 1;
	ctx.fillStyle = 'white';
	let y = 35;
	ctx.font = '18px Work Sans, Arial';
	let number = 1;
	for (const player of playerNames) {
		const name = player.name;
		const kills = player.kills;
		const dmg = player.totalDamage;
		if (number === 1) {
			ctx.fillStyle = '#ffcc00'
		} else {
			ctx.fillStyle = 'white'
		}
		// [${kills}] (${dmg})
		ctx.fillText(`${name} [${kills}-${dmg}]`, canvas.width - 125, y);
		y += 30;
		number++;
	}
	if (hitDamageActivate) {
        ctx.font = '35px Work Sans, Arial';
        ctx.fillStyle = 'black';
		const hWidth = ctx.measureText('Hit Damage: ').width + ctx.measureText(`${hitDamage}`).width;
		const dWidth = ctx.measureText(`${hitDamage}`).width
		const tWidth = ctx.measureText(`+`).width
        ctx.fillText('Hit Damage: ' + hitDamage, canvas.width / 2, 100);
		ctx.font = '30px Work Sans, Arial';
		let currentY = 100 + 35;
		// hits = hits.sort((a, b) => a.t - b.t)
		ctx.fillStyle = 'red'
		for (const { x, y, server, t, dmg } of hits) {
			ctx.globalAlpha = t <= 0.1 ? (t/0.1): (t >= 0.9 ? 1-(t-0.9)/0.1: 1)
			ctx.fillText(`+${dmg}`, canvas.width / 2 + hWidth/2 - dWidth/2 - tWidth/2, currentY);
			ctx.globalAlpha = 1;
			currentY += 35
		}
    }
	if (kTimer >= 0) {
		ctx.fillStyle = 'black';
		ctx.font = '25px Work Sans, Arial';
		ctx.globalAlpha = kTimer <= 1 ? (kTimer/1): 1;
		let adj = kAdj.charAt(0) + kAdj.slice(1).toLowerCase();
		ctx.fillText(`${adj} ${kName}`, canvas.width / 2, canvas.height - 175)
		ctx.globalAlpha = 1;
	}

}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = ctx.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
function playerUI() {
	// return;
	const player = me();
	ctx.fillStyle = '#7a7a7a';
	ctx.fillRect(canvas.width /2 - 250, canvas.height - 30, 500, 25);
	ctx.fillStyle = 'white';
	ctx.fillRect(canvas.width /2 - 250, canvas.height - 30, 500 * (player.cshift/player.shiftLength), 25)
	ctx.lineWidth = 3;
	ctx.strokeStyle = 'black'
	ctx.strokeRect(canvas.width /2 - 250, canvas.height - 30, 500, 25);

	ctx.globalAlpha = 0.75
	ctx.fillStyle = 'black';
	// ctx.globalAlpha = 0.4;
	ctx.fillRect(canvas.width /2 - 400, canvas.height - 60, 800, 15);
	const len = Math.min((player.totalDamage/400), 1);
	ctx.fillStyle = '#0077ff';
	// ctx.globalAlpha = 0.
	ctx.fillRect(canvas.width /2 - 400, canvas.height - 60, 800*len, 15);
	// ctx.globalAlpha = 1;
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 2;
	ctx.globalAlpha = 1;
	ctx.strokeRect(canvas.width /2 - 400, canvas.height - 60, 800, 15);
	ctx.beginPath();
	ctx.lineTo(canvas.width / 2, canvas.height - 60);
	ctx.lineTo(canvas.width / 2, canvas.height - 45);
	ctx.stroke()

	ctx.fillStyle = '#292929'
	ctx.globalAlpha = 0.75
	ctx.fillRect(canvas.width - 300, canvas.height - 75, 300, 75);
	ctx.globalAlpha = 1;
	ctx.fillStyle = '#b0b0b0';
	const powers = me().powers;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	
	// 4 -> 100px for each  25px padding 
	if (powers[0] != undefined) {
		ctx.fillStyle = Powers[powers[0]].color;
	}
	ctx.fillRect(canvas.width - 300 + 25/2, canvas.height - 75 + 25/2, 50, 50);
	if (powers[0] && Powers[powers[0]].type === 'Active') {
		ctx.fillRect(canvas.width - 300 + 25/2, canvas.height - 75 + 25/2 - 25, 50*(1 - me().activeCooldownTimer/me().activeCooldown), 25/2)
	}
	ctx.fillStyle = '#292929';
	if (powers[0] != undefined) {
		if (rectContainsPoint(canvas.width - 300 + 25/2 , canvas.height - 75+ 25/2, 50, 50, window.mx, window.my)) {
			ctx.globalAlpha = 0.9;
			ctx.fillRect(canvas.width - 450 + 25/2, canvas.height - 300 + 25/2, 350, 200);
			ctx.globalAlpha = 1;
			ctx.fillStyle = Powers[powers[0]].color;
			ctx.font = '25px Work Sans'
			ctx.fillText(powers[0], canvas.width - 400 + 25/2 + 250/2, canvas.height - 300 + 25/2 + 25)
			ctx.font = '20px Work Sans'
			ctx.fillText(`[${Powers[powers[0]].type}]`, canvas.width - 400 + 25/2 + 250/2, canvas.height - 200 + 25/2 + 100 - 20)
			ctx.fillStyle = 'white';
			ctx.font = '16px Work Sans';
			wrapText(ctx, Powers[powers[0]].desc, canvas.width - 450 + 25/2 + 350/2, canvas.height - 300 + 25/2 + 50 + 25/4, 325, 25);
		}
	}
	ctx.fillStyle = '#b0b0b0';
	if (powers[1] != undefined) {
		ctx.fillStyle = Powers[powers[1]].color;
	}
	ctx.fillRect(canvas.width - 225 + 25/2, canvas.height - 75 + 25/2, 50, 50);
	if (powers[1] && Powers[powers[1]].type === 'Active') {
		ctx.fillRect(canvas.width - 225 + 25/2, canvas.height - 75 + 25/2 - 25, 50*(1 - me().activeCooldownTimer/me().activeCooldown), 25/2)
	}
	ctx.fillStyle = '#292929';
	if (powers[1] != undefined) {
		if (rectContainsPoint(canvas.width - 300 + 25/2 + 75 , canvas.height - 75+ 25/2, 50, 50, window.mx, window.my)) {
			ctx.globalAlpha = 0.9;
			ctx.fillRect(canvas.width - 450 + 25/2 + 75, canvas.height - 300 + 25/2, 350, 200);
			ctx.globalAlpha = 1;
			ctx.fillStyle = Powers[powers[1]].color;
			ctx.font = '25px Work Sans'
			ctx.fillText(powers[1], canvas.width - 400 + 25/2 + 250/2 + 75, canvas.height - 300 + 25/2 + 25)
			ctx.font = '20px Work Sans'
			ctx.fillText(`[${Powers[powers[1]].type}]`, canvas.width - 400 + 75 + 25/2 + 250/2, canvas.height - 200 + 25/2 + 100 - 20)
			ctx.fillStyle = 'white';
			ctx.font = '16px Work Sans';
			wrapText(ctx, Powers[powers[1]].desc, canvas.width - 450 + 75 + 25/2 + 350/2, canvas.height - 300 + 25/2 + 50 + 25/4, 325, 25);
		}
	}
	ctx.fillStyle = '#b0b0b0'
	if (powers[2] != undefined) {
		ctx.fillStyle = Powers[powers[2]].color;
	}
	ctx.fillRect(canvas.width - 150 + 25/2, canvas.height - 75 + 25/2, 50, 50);
	if (powers[2] && Powers[powers[2]].type === 'Active') {
		ctx.fillRect(canvas.width - 150 + 25/2, canvas.height - 75 + 25/2 - 25, 50*(1 - me().activeCooldownTimer/me().activeCooldown), 25/2)
	}
	ctx.fillStyle = '#292929';
	if (powers[2] != undefined) {
		if (rectContainsPoint(canvas.width - 300 + 25/2 + 150 , canvas.height - 75+ 25/2, 50, 50, window.mx, window.my)) {
			ctx.globalAlpha = 0.9;
			ctx.fillRect(canvas.width - 450 + 25/2 + 75, canvas.height - 300 + 25/2, 350, 200);
			ctx.globalAlpha = 1;
			ctx.fillStyle = Powers[powers[2]].color;
			ctx.font = '25px Work Sans'
			ctx.fillText(powers[2], canvas.width - 400 + 25/2 + 250/2 + 75, canvas.height - 300 + 25/2 + 25)
			ctx.font = '20px Work Sans'
			ctx.fillText(`[${Powers[powers[2]].type}]`, canvas.width - 400 + 75 + 25/2 + 250/2, canvas.height - 200 + 25/2 + 100 - 20)
			ctx.fillStyle = 'white';
			ctx.font = '16px Work Sans';
			wrapText(ctx, Powers[powers[2]].desc, canvas.width - 450 + 75 + 25/2 + 350/2, canvas.height - 300 + 25/2 + 50 + 25/4, 325, 25);
		}
	}
	ctx.fillStyle = '#b0b0b0'
	ctx.fillRect(canvas.width - 75 + 25/2, canvas.height - 75 + 25/2, 50, 50);
	ctx.fillStyle = 'black';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '40px Work Sans'

	
	if (powers[0] != undefined) {
		ctx.fillText(powers[0][0], canvas.width - 300 + 25/2 + 25, canvas.height - 75/2);
	}
	if (powers[1] != undefined) {
		ctx.fillText(powers[1][0], canvas.width - 300 + 25/2 + 25 + 75, canvas.height - 75/2);
	}
	if (powers[2] != undefined) {
		ctx.fillText(powers[2][0], canvas.width - 300 + 25/2 + 25 + 150, canvas.height - 75/2);
	}

      // background of health and armor bar
      // ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
      // ctx.fillRect(canvas.width - 375, canvas.height - 45, 285, 20);
      // ctx.fillStyle = 'rgba(20, 20, 20)';
      // ctx.fillRect(canvas.width - 373, canvas.height - 25, 285, 2);
      // ctx.fillRect(canvas.width - 375 + 285, canvas.height - 43, 2, 18);

      // health bar
      // const gradient = ctx.createLinearGradient(
      //    canvas.width - 100 - (player.health / 100) * 285,
      //    canvas.height - 25,
      //    canvas.width - 100 - (player.health / 100) * 285 + (player.health / 100) * 285,
      //    canvas.height - 25
      // );
      // gradient.addColorStop(0, '#178527');
      // gradient.addColorStop(0.5, '#43bf56');
      // gradient.addColorStop(1, '#178527');
      // ctx.fillStyle = gradient;
      // ctx.fillRect(
      //    canvas.width - 100 - (player.health / 100) * 275,
      //    canvas.height - 45,
      //    (player.health / 100) * 285,
      //    15
      // );
      // ctx.fillStyle = '#006aff';
      // ctx.fillRect(
      //    canvas.width - 100 - (1) * 275,
      //    canvas.height - 45,
      //    (1) * 285,
      //    15
      // );

      // // sprint bar
      // // ctx.fillStyle = 'rgba(50, 50, 50)';
      // // ctx.fillRect(
      // //    canvas.width - 100 - (player.currentShift / player.shiftLength) * 225,
      // //    canvas.height - 53,
      // //    (player.currentShift / player.shiftLength) * 237,
      // //    6
      // // );
      // ctx.fillStyle = 'white';
      // ctx.fillRect(
      //    canvas.width - 100 - (player.currentShift / player.shiftLength) * 275,
      //    canvas.height - 56 - 7,
      //    (player.currentShift / player.shiftLength) * 285,
      //    15
      // );
	
	// const w = 80
	// const h = 25
	// const rad = h / 2;
	// ctx.shadowColor = 'transparent';
	// ctx.font = `${20}px Work Sans`;
 //      ctx.textAlign = 'center';
 //      ctx.textBaseline = 'middle';
	// ctx.fillRect(canvas.width - 210 - 100 / 2 - w / 2, canvas.height - 74 - h / 2, w, h);
	// ctx.beginPath();
	// ctx.arc(canvas.width - 210 - 100 / 2 - w / 2, canvas.height - 74, rad, 0, Math.PI * 2);
	// ctx.fill();
	// ctx.beginPath();
	// ctx.arc(canvas.width - 210 - 100 / 2 + w / 2, canvas.height - 74, rad, 0, Math.PI * 2);
	// ctx.fill();
	// ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	// ctx.fillText(player.weapon, canvas.width - 210 - 100 / 2, canvas.height - 70);
	
	return;

      // gun
      ctx.font = `${30}px Work Sans`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'black';
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;
      const width = 80;
      const height = 25;
      const radius = height / 2;
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	return;
      // if only have one weapon
      if (
         (this.primaryGun == null && this.secondaryGun != null) ||
         (this.primaryGun != null && this.secondaryGun == null)
      ) {
         const gun = this.primaryGun == null ? this.secondaryGun : this.primaryGun;
         if (!this.selectedGun) {
            ctx.fillText(gun.data.name, canvas.width - 200 + 100 / 2, canvas.height - 70);
         } else {
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'transparent';
            ctx.fillRect(canvas.width - 200 + 100 / 2 - width / 2, canvas.height - 74 - height / 2, width, height);
            ctx.beginPath();
            ctx.arc(canvas.width - 200 + 100 / 2 - width / 2, canvas.height - 74, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(canvas.width - 200 + 100 / 2 + width / 2, canvas.height - 74, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillText(gun.data.name, canvas.width - 200 + 100 / 2, canvas.height - 70);
         }
         // ctx.fillStyle = 'gray';

         // ctx.fillText('---', canvas.width - 240 + 100 / 2, canvas.height - 100);
      }
      ctx.fillStyle = 'white';
      // if you have two guns
      if (this.primaryGun != null && this.secondaryGun != null) {
         if (this.currentSelectedGun === 'secondary' && this.selectedGun) {
            ctx.shadowColor = 'transparent';
            ctx.fillRect(canvas.width - 200 + 100 / 2 - width / 2, canvas.height - 74 - height / 2, width, height);
            ctx.beginPath();
            ctx.arc(canvas.width - 200 + 100 / 2 - width / 2, canvas.height - 74, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(canvas.width - 200 + 100 / 2 + width / 2, canvas.height - 74, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillText(this.secondaryGun.data.name, canvas.width - 200 + 100 / 2, canvas.height - 70);
         } else {
            ctx.fillStyle = 'white';
            ctx.shadowOffsetX = 1.5;
            ctx.shadowOffsetY = 1.5;
            ctx.fillText(this.secondaryGun.data.name, canvas.width - 200 + 100 / 2, canvas.height - 70);
         }
         if (this.currentSelectedGun === 'primary' && this.selectedGun) {
            ctx.shadowColor = 'transparent';
            ctx.fillRect(canvas.width - 210 - 100 / 2 - width / 2, canvas.height - 74 - height / 2, width, height);
            ctx.beginPath();
            ctx.arc(canvas.width - 210 - 100 / 2 - width / 2, canvas.height - 74, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(canvas.width - 210 - 100 / 2 + width / 2, canvas.height - 74, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillText(this.primaryGun.data.name, canvas.width - 210 - 100 / 2, canvas.height - 70);
         } else {
            ctx.shadowOffsetX = 1.5;
            ctx.shadowOffsetY = 1.5;
            ctx.fillStyle = 'white';
            ctx.fillText(this.primaryGun.data.name, canvas.width - 210 - 100 / 2, canvas.height - 70);
         }
      }
      // if you have no guns
      if (this.primaryGun == null && this.secondaryGun == null) {
         ctx.fillText('---', canvas.width - 200 + 100 / 2, canvas.height - 70);
         ctx.fillStyle = 'gray';
         ctx.fillText('---', canvas.width - 240 + 100 / 2, canvas.height - 100);
      }
      ctx.shadowColor = 'transparent';
}

requestAnimationFrame(run);

function lerp(start, end, t) {
    //  return a + (b - a) * t;
    // return start + (end - start) * time;
	const time = Math.min(t, 1)
    return start * (1 - time) + end * time;
}
