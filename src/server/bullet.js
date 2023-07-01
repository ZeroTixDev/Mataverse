const { Circle, Vector, Response, testPolygonCircle } = require('sat')

module.exports = class Bullet {
    constructor(id, x, y, r = 30, angle, parent, approx = 0, uid, spd = 700, life=1) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.r = r*0.9;
        this.angle = angle;
        this.speed = spd*1.9
		// this.speed = 0;
        this.life = life*0.9;
        this.lifeTimer = 0;
		this.curveFactor = 0;
        this.uid = uid;
        this.parent = parent;
		this.fromParent = parent;
        // this.ping = approx / 1000;
        // this.totalPing = this.ping * 1000;
		this.totalPing = 0;
		this.ping = 0;
		this.magz = false;
		this.rev = false;
		this.invis = false;
		
        this.pingSim = 0;
		this.firstSim = false;
        // this.update(approx / 1000);
		this.pChanged = false;
    }
	touchingObstacles(obstacles) {
		const { x, y, r } = this;
		for (const obstacle of obstacles) {
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
		        const collision = testPolygonCircle(obstacle.pSat, playerSat, res);
		        if (collision) {
					return true;
		        }
			}
		}
		return false;
	}
    update(delta, obstacles, players) {
        let dt = delta * globalThis.gameSpeed;
		let throughWall = false;
		let speedMult = 1;
		for (const playerId of Object.keys(players)) {
			const player = players[playerId];
			if (player._qf != null) {
				const distX = player._qf.x - this.x;
				const distY = player._qf.y - this.y;
				if (distX * distX + distY * distY < (this.r + player._qf.r) * (this.r + player._qf.r)) {
					throughWall = true;	
					speedMult = 1.5;
				}
			}
		}
		if (this.touchingObstacles(obstacles)) {
			if (!throughWall || !this.firstSim) {
				this.toDelete = true;
			}
			if (throughWall) {
				speedMult = 0.75;
			}
		}
	
		this.x += Math.cos(this.angle) * this.speed * speedMult * dt;
        this.y += Math.sin(this.angle) * this.speed * speedMult * dt;
        this.lifeTimer += dt * speedMult;
		this.angle += this.curveFactor * dt;
        // if (this.pingSim < this.totalPing && this.firstSim) {
        //     let a = this.pingSim;
        //     this.pingSim += 7;
        //     this.pingSim = Math.min(this.pingSim, this.totalPing);
        //     const tempDt = (this.pingSim - a) / 1000;
        //     this.x += Math.cos(this.angle) * this.speed * tempDt;
        //     this.y += Math.sin(this.angle) * this.speed * tempDt;
        //     this.lifeTimer += tempDt;
        // }
		this.firstSim = true;
        if (this.lifeTimer > this.life) {
            this.toDelete = true;
        }
    }
    updatePack() {
        return {
            id: this.id,
            x: Math.round(this.x),
            y: Math.round(this.y),
			angle: this.angle,
			lifeTimer: this.lifeTimer,
        };
    }
    pack() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            r: this.r,
            angle: this.angle,
            speed: this.speed,
            life: this.life,
            lifeTimer: this.lifeTimer,
            parent: this.parent,
            uid: this.uid,
            ping: this.ping,
			magz: this.magz,
			rev: this.rev,
			curveFactor: this.curveFactor,
			invis: this.invis,
        };
    }
};
