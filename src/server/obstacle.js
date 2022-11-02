const { Box, Vector } = require('sat');

module.exports = class Obstacle {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		// padding
		this.padding = 0;
		this.sat = new Box(new Vector(x, y), w, h).toPolygon()
		this.pSat = new Box(new Vector(x + this.padding/2, y + this.padding/2), w - this.padding, h - this.padding).toPolygon();
	}
	pack() {
		return {
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h,
		}
	}
}