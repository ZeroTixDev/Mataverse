function Interpolator() {
    this.timeElapsed = 0;
    this.timeToReachTarget = 1 / (serverTickRate ?? 60);
    this.movementThreshold = this.timeToReachTarget;
    this.futureTransformUpdates = []; //<TransformUpdate>
    this.squareMovementThreshold = this.movementThreshold ** 2;
    this.start = function () {
        // this.to = new TransformUpdate(serverGlobalTick, );
        this.from = null;
        this.previous = null;
    };
}
function TransformUpdate(tick, x, y) {
    return { tick, x, y };
}

class Player {
    constructor(pack) {
        for (const key of Object.keys(pack)) {
            this[key] = pack[key];
        }
        this.isx = this.x;
        this.isy = this.y; // interp server x/y
        this.lx = this.x;
        this.ly = this.y;
        this.ix = this.x;
        this.iy = this.y;
		this.cshift = this.currentShift;
		this.hp = this.health;
        this.interpAngle = this.angle;
		this.serverAngle = this.angle;
        if (this.id !== selfId) {
            this.timeElapsed = 0;
            this.timeToReachTarget = 1 / (serverTickRate ?? 60);
            this.movementThreshold = this.timeToReachTarget;
            this.futureTransformUpdates = []; //<TransformUpdate>
            this.squareMovementThreshold = this.movementThreshold ** 2;
            this.to = new TransformUpdate(serverGlobalTick, this.x, this.y);
            this.from = new TransformUpdate(interpolationTick, this.x, this.y);
            this.prev = new TransformUpdate(interpolationTick, this.x, this.y);
        }
    }
    updateInterp(dt) {
        if (this.id === selfId) return;
        console.log('updating lerp');
        for (let i = 0; i < this.futureTransformUpdates.length; i++) {
            if (serverGlobalTick >= this.futureTransformUpdates[i].tick) {
                this.prev = this.to;
                this.to = this.futureTransformUpdates[i];
                this.from = new TransformUpdate(
                    interpolationTick,
                    this.x,
                    this.y
                );
                this.futureTransformUpdates.splice(i, 1);
                i--;
                this.timeElapsed = 0;
                this.timeToReachTarget =
                    (this.to.tick - this.from.tick) * (1 / serverTickRate);
                console.log(this.to.tick - this.from.tick);
            }
        }
        this.timeElapsed += dt;
        this.interpolate(this.timeElapsed / this.timeToReachTarget);
    }
    interpolate(lerpAmount) {
        // let dx = this.to.x - this.prev.x;
        // let dy = this.to.y - this.prev.y;
        // if (dx * dx + dy * dy < this.squareMovementThreshold) {
        // object isnt moving but hasnt finished lerping to target
        if (this.to.x != this.from.x || this.to.y != this.from.y) {
            this.x = Lerp(this.from.x, this.to.x, lerpAmount);
            this.y = Lerp(this.from.y, this.to.y, lerpAmount);
        }
        //     return;
        // }

        // this.x = LerpNoClamp(this.from.x, this.to.x, lerpAmount);
        // this.y = LerpNoClamp(this.from.y, this.to.y, lerpAmount);
    }
    otherUpdate(pack, interpTick = 0) {
        if (interp) {
            // if (interpTick <= interpolationTick) {
            //     return;
            // }
            // // console.log(this.futureTransformUpdates);
            // for (let i = 0; i < this.futureTransformUpdates.length; i++) {
            //     if (interpTick < this.futureTransformUpdates[i].tick) {
            //         this.futureTransformUpdates.splice(
            //             i,
            //             0,
            //             new TransformUpdate(interpTick, pack.x, pack.y)
            //         );
            //         return;
            //     }
            // }
            // this.futureTransformUpdates.push(
            //     new TransformUpdate(interpTick, pack.x, pack.y)
            // );
            let x = this.x;
            let y = this.y;  
            for (const key of Object.keys(pack)) {
                this[key] = pack[key];
            }
            this.x = x;
            this.y = y;
			if (pack.x != undefined) {
            	this.lx = this.interpX;
			}
			if (pack.y != undefined) {
            	this.ly = this.interpY;
			}
			if (pack.x != undefined) {
            	this.interpX = pack.x;
			}
			if (pack.y != undefined) {
            	this.interpY = pack.y;
			}
        } else {
			// ironic isn't it
			// so essentially this will happen for every player
			//thats not you
			// any new data will be automatically inputed
            for (const key of Object.keys(pack)) {
                this[key] = pack[key];
            }
          //what does it mean??
            // this.timeElapsed = 0;
            // this.timeToReachTarget = 1 / (serverTickRate ?? 60);
            // this.movementThreshold = this.timeToReachTarget;
            // this.futureTransformUpdates = []; //<TransformUpdate>
            // this.squareMovementThreshold = this.movementThreshold ** 2;
            // this.to = new TransformUpdate(serverGlobalTick, this.x, this.y);
            // this.from = new TransformUpdate(interpolationTick, this.x, this.y);
            // this.prev = new TransformUpdate(interpolationTick, this.x, this.y);
        }
    }
}

function clamp01(v) {
    if (v < 0) {
        return 0;
    } else if (v > 1) {
        return 1;
    }
    return v;
}

function Lerp(a, b, t) {
    return a + (b - a) * clamp01(t);
}

function LerpNoClamp(a, b, t) {
    return a + (b - a) * t;
}
