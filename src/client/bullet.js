class Bullet {
    constructor(pack, ping = 0, thru=true, fake=false) {
        for (const key of Object.keys(pack)) {
            this[key] = pack[key];
        }
		if (fake) {
			this.speed *= 1.5;
		}
        this.interpX = this.x;
        this.interpY = this.y;
        // approx fast forward to sync with server
        this.pingTimer = 0;
        if (this.ping == undefined) {
            this.ping = 0;
        }
        // this.totalPing = ping + this.ping*1000;
		this.totalPing = 0;
        this.hist = [];
        this.histLength = 10;
		if (thru) {
			// this.x += Math.cos(this.angle) * this.speed * -this.ping;
			// this.y += Math.sin(this.angle) * this.speed * -this.ping;
		} else {
			this.x += Math.cos(this.angle) * this.speed * (this.totalPing)/1000;
			this.y += Math.sin(this.angle) * this.speed * (this.totalPing)/1000;
			this.totalPing = 0;
		}
    }
    recordHist() {
        this.hist.push({ x: this.x, y: this.y });
        if (this.hist.length > this.histLength) {
            this.hist.shift();
        }
    }
    packUpdate(pack) {
        if (interp) {
            let x = this.x;
            let y = this.y;
			let lifetimer = this.lifeTimer;
            for (const key of Object.keys(pack)) {
                this[key] = pack[key];
            }
            this.x = x;
            this.y = y;
			this.lifeTimer = lifetimer;
            this.interpX = pack.x;
            this.interpY = pack.y;
        } else {
            for (const key of Object.keys(pack)) {
                this[key] = pack[key];
            }
        }
    }
}
