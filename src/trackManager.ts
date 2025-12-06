// trackManager.ts
import { Graphics } from 'pixi.js';
import { HexTile } from './hexTile';

export class TrackManager {
    container: Graphics = new Graphics();
    permanent: Graphics = new Graphics(); // holds finalized tracks

    // current in-progress path (includes start tile as first element)
    path: HexTile[] = [];
    maxMoves = 5; // number of tile clicks allowed after start

    constructor() {
        // style for drawing
        this.permanent.clear();
        this.container.clear();
    }

    clearTemporary() {
        this.container.clear();
    }

    resetPath() {
        this.path = [];
        this.clearTemporary();
    }

    // called when a tile is clicked
    clickTile(tile: HexTile) {
        console.log('[TrackManager] clickTile called for', tile.q, tile.r);
        if (this.path.length === 0) {
            // start a new path
            this.path.push(tile);
            console.log('[TrackManager] started path at', tile.q, tile.r);
            tile.setCenterDot(true, 0xff0000);
            this.redraw();
            return;
        }

        const last = this.path[this.path.length - 1];
        // only allow adjacent tiles
        const dq = tile.q - last.q;
        const dr = tile.r - last.r;
        const neighbors = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
        const ok = neighbors.some(n => n[0] === dq && n[1] === dr);
        if (!ok) return; // ignore non-adjacent clicks

        console.log('[TrackManager] appended tile to path', tile.q, tile.r);

        this.path.push(tile);
        this.redraw();

        // if we've reached max moves, finalize
        if (this.path.length - 1 >= this.maxMoves) {
            // place end dot on final tile
            const end = this.path[this.path.length - 1];
            end.setCenterDot(true, 0xff0000);
            // commit current temporary drawing to permanent
            this.commitCurrentPath();
            // reset for a new path
            this.resetPath();
        }
    }

    commitCurrentPath() {
        if (this.container) {
            console.log('[TrackManager] commitCurrentPath: committing', this.path.map(t=>`(${t.q},${t.r})`).join(' -> '));
            // draw the temporary container into the permanent by copying its graphics commands
            // simplest approach: draw permanent lines again identical to temporary path
            // We'll reuse the same path drawing logic but target the permanent graphics
            this.drawPathToGraphics(this.permanent);
            this.clearTemporary();
        }
    }

    redraw() {
        this.clearTemporary();
        console.log('[TrackManager] redraw; path=', this.path.map(t=>`(${t.q},${t.r})`).join(','));
            this.drawPathToGraphics(this.container);
    }

    private midpoint(a: HexTile, b: HexTile) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    private isCollinear(a: HexTile, b: HexTile, c: HexTile) {
        const v1x = b.x - a.x;
        const v1y = b.y - a.y;
        const v2x = c.x - b.x;
        const v2y = c.y - b.y;
        const cross = v1x * v2y - v1y * v2x;
        return Math.abs(cross) < 0.001;
    }

    private drawPathToGraphics(g: Graphics) {
        const path = this.path;
        if (path.length < 2) return;

        console.log('[TrackManager] drawPathToGraphics; path length=', path.length);
        console.log('[TrackManager] tile centers:', path.map(t => ({q:t.q, r:t.r, x:t.x, y:t.y}))); 

        // draw style (use v8 API)
        if ((g as any).setStrokeStyle) {
            (g as any).setStrokeStyle({ width: 6, color: 0xff0000 });
        } else {
            g.lineStyle(6, 0xff0000, 1);
        }

        // compute midpoints between consecutive tiles
        const mids = [] as {x:number,y:number}[];
        for (let i = 1; i < path.length; i++) {
            mids.push(this.midpoint(path[i-1], path[i]));
        }

        // (no debug markers)

        // start from start tile center
        g.moveTo(path[0].x, path[0].y);

        // if only two tiles, draw straight from center to center
        if (path.length === 2) {
            console.log('[TrackManager] drawing straight line center->center', {from:path[0], to:path[1]});
            g.lineTo(path[1].x, path[1].y);
            // apply stroke for v8 style
            if ((g as any).stroke) (g as any).stroke();
            return;
        }

        // first segment to first midpoint
        g.lineTo(mids[0].x, mids[0].y);

        // for each interior tile (tile at index i), draw between mids[i-1] and mids[i]
        for (let i = 1; i < path.length - 1; i++) {
            const nextMid = mids[i];
            const center = { x: path[i].x, y: path[i].y };
            const col = this.isCollinear(path[i-1], path[i], path[i+1]);
            console.log(`[TrackManager] segment i=${i}, tile=(${path[i].q},${path[i].r}), collinear=${col}`, {prev:path[i-1], cur:path[i], next:path[i+1], prevMid: mids[i-1], nextMid});

            if (col) {
                // straight
                g.lineTo(nextMid.x, nextMid.y);
            } else {
                // smooth quadratic curve through the center of the tile
                g.quadraticCurveTo(center.x, center.y, nextMid.x, nextMid.y);
            }
        }

        // final segment from last midpoint to last center
        const last = path[path.length - 1];
        g.lineTo(last.x, last.y);

        // apply stroke (v8)
        if ((g as any).stroke) (g as any).stroke();
    }
}
