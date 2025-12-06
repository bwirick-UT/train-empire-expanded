import { Graphics, Text, TextStyle } from "pixi.js";

export class HexTile extends Graphics {
    q: number;
    r: number;
    size: number;
    centerDot?: Graphics;

    constructor(q: number, r: number, size: number) {
        super();
        this.q = q;
        this.r = r;
        this.size = size;

        this.eventMode = "static";
        this.cursor = "pointer";

        this.drawTile(0x444444);
        this.createLabel();
    }

    coordLabel?: Text;

    createLabel() {
        const style = new TextStyle({
            fontFamily: 'Arial',
            fontSize: Math.max(10, Math.round(this.size / 3)),
            fill: 0xffffff,
            stroke: 0x000000,
        });

        this.coordLabel = new Text(`(${this.q},${this.r})`, style);
        // center the label
        if ((this.coordLabel as any).anchor) {
            (this.coordLabel as any).anchor.set(0.5);
        } else {
            // fallback positioning
            this.coordLabel.x = -this.coordLabel.width / 2;
            this.coordLabel.y = -this.coordLabel.height / 2;
        }

        this.coordLabel.x = 0;
        this.coordLabel.y = 0;

        this.coordLabel.visible = false; // default off; grid controls visibility
        this.addChild(this.coordLabel);
    }

    setCenterDot(visible: boolean, color: number = 0xff0000) {
        if (!this.centerDot) {
            this.centerDot = new Graphics();
            // draw a circle centered at 0,0
            const radius = Math.max(4, Math.round(this.size / 6));
            this.centerDot.beginFill(color);
            this.centerDot.drawCircle(0, 0, radius);
            this.centerDot.endFill();
            this.centerDot.visible = false;
            this.addChild(this.centerDot);
        }

        this.centerDot.visible = visible;
        if (visible) {
            // update color/size in case
            this.centerDot.clear();
            const radius = Math.max(4, Math.round(this.size / 6));
            this.centerDot.beginFill(color);
            this.centerDot.drawCircle(0, 0, radius);
            this.centerDot.endFill();
        }
    }

    drawTile(color: number) {
        this.clear();

        const s = this.size;
        const angle = Math.PI / 3; // 60° segments

        const points: number[] = [];

        // pointy-top hex orientation (top vertex at angle -30°)
        for (let i = 0; i < 6; i++) {
            const a = angle * i - Math.PI / 6; // rotate -30°
            points.push(Math.cos(a) * s, Math.sin(a) * s);
        }

        this.poly(points).fill({ color });

        this.setStrokeStyle({
            width: 2,
            color: 0x777777,
        });
        this.stroke();
    }

    highlight() {
        this.drawTile(0x66ccff);
    }

    unhighlight() {
        this.drawTile(0x444444);
    }
}
