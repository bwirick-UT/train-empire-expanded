import { Container } from "pixi.js";
import { HexTile } from "./hexTile";

export class HexGrid {
    container: Container;
    size: number;
    tiles: HexTile[] = [];
    showLabels: boolean = false;
    // optional callback set by consumer (Game) to receive tile clicks
    onTileClick?: (tile: HexTile) => void;

    constructor(size: number) {
        this.container = new Container();
        this.size = size;
    }

    build(radius: number = 5) {
        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);

            for (let r = r1; r <= r2; r++) {
                const tile = new HexTile(q, r, this.size);
                const { x, y } = this.axialToPixel(q, r);

                tile.x = x;
                tile.y = y;

                // hover highlight
                tile.on("pointerover", () => tile.highlight());
                tile.on("pointerout", () => tile.unhighlight());
                // use pointerup/tap so starting a drag doesn't also place a tile
                tile.on("pointerup", () => {
                    if (this.onTileClick) this.onTileClick(tile);
                });
                // label visibility according to grid setting
                if ((tile as any).coordLabel) {
                    (tile as any).coordLabel.visible = this.showLabels;
                }
                this.tiles.push(tile);
                this.container.addChild(tile);
                
            }
        }
    }

    centerGrid() {
        const bounds = this.container.getLocalBounds();

        this.container.x = -bounds.x + window.innerWidth / 2 - bounds.width / 2;
        this.container.y = -bounds.y + window.innerHeight / 2 - bounds.height / 2;
    }


    axialToPixel(q: number, r: number) {
        const size = this.size;
        const x = size * Math.sqrt(3) * (q + r / 2);
        const y = size * (3 / 2) * r;
        return { x, y };
    }

    // CAMERA ZOOM
    zoom(amount: number) {
        this.container.scale.x += amount;
        this.container.scale.y += amount;
    }

    setLabelsVisible(visible: boolean) {
        this.showLabels = visible;
        for (const t of this.tiles) {
            if ((t as any).coordLabel) (t as any).coordLabel.visible = visible;
        }
    }

    toggleLabels() {
        this.setLabelsVisible(!this.showLabels);
    }
}
