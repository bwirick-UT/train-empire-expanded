import { Application, Container, FederatedPointerEvent } from "pixi.js";
import { HexGrid } from "./hexGrid";
import { TrackManager } from "./trackManager";

export class Game {
    app: Application;
    grid: HexGrid;
    camera: Container;
    trackManager: TrackManager;
    // current tool mode: 'hand' for panning, 'track' for placing tracks
    tool: 'hand' | 'track' = 'hand';

    private dragging = false;
    private lastPos = { x: 0, y: 0 };

    constructor(app: Application) {
        this.app = app;

        // camera container
        this.camera = new Container();
        this.app.stage.addChild(this.camera);

        // build grid
        this.grid = new HexGrid(40);
        this.grid.build(6);
        this.camera.addChild(this.grid.container);

        // track manager (draws temporary and permanent tracks)
        this.trackManager = new TrackManager();
        // add track graphics to the same container as tiles so coordinates match
        this.grid.container.addChild(this.trackManager.permanent);
        this.grid.container.addChild(this.trackManager.container);

        // hook tile clicks and respect current tool
        this.grid.onTileClick = (t) => {
            if (this.tool === 'track') {
                this.trackManager.clickTile(t);
            } else {
                // ignore tile click while in hand mode
                // console.log('tile click ignored; tool=', this.tool);
            }
        };

        // center grid
        //this.camera.x = app.renderer.width / 2;
        //this.camera.y = app.renderer.height / 2;
        this.grid.centerGrid();


        this.setupCameraControls();
        this.setupLabelToggle();
        // initialize tool cursor
        this.setTool(this.tool);
        this.setupToolUI();
    }

    setupLabelToggle() {
        // Hotkey: 'L' to toggle labels
        window.addEventListener('keydown', (e) => {
            if (e.key === 'l' || e.key === 'L') {
                this.grid.toggleLabels();
            }
            if (e.key === 'h' || e.key === 'H') {
                this.setTool('hand');
            }
            if (e.key === 't' || e.key === 'T') {
                this.setTool('track');
            }
        });

        // Button if present in DOM
        const btn = document.getElementById('toggle-labels');
        if (btn) {
            btn.addEventListener('click', () => {
                this.grid.toggleLabels();
                // update button text
                (btn as HTMLButtonElement).textContent = this.grid.showLabels ? 'Hide Labels (L)' : 'Show Labels (L)';
            });
            // initialize button text
            (btn as HTMLButtonElement).textContent = this.grid.showLabels ? 'Hide Labels (L)' : 'Show Labels (L)';
        }
    }

    // attach UI handlers for the tool indicator
    private setupToolUI() {
        const el = document.getElementById('tool-indicator');
        if (!el) return;
        el.addEventListener('click', () => {
            const next = this.tool === 'hand' ? 'track' : 'hand';
            this.setTool(next);
        });
    }

    setTool(tool: 'hand' | 'track') {
        this.tool = tool;
        // update cursor
        if (tool === 'hand') {
            this.app.view.style.cursor = 'grab';
        } else {
            this.app.view.style.cursor = 'crosshair';
        }
        // update DOM indicator if present
        const el = document.getElementById('tool-indicator');
        if (el) {
            el.textContent = tool === 'hand' ? 'Tool: Hand (H)' : 'Tool: Track (T)';
            el.className = tool === 'hand' ? 'tool-hand' : 'tool-track';
        }
    }

    setupCameraControls() {
        // Pointer down
        this.app.stage.eventMode = "static";
        this.app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
            // only start dragging when tool is hand
            if (this.tool !== 'hand') return;
            this.dragging = true;
            this.lastPos = { x: e.globalX, y: e.globalY };
        });

        // Pointer move
        this.app.stage.on("pointermove", (e: FederatedPointerEvent) => {
            if (!this.dragging) return;

            const dx = e.globalX - this.lastPos.x;
            const dy = e.globalY - this.lastPos.y;

            this.camera.x += dx;
            this.camera.y += dy;

            this.lastPos = { x: e.globalX, y: e.globalY };
        });

        // Pointer up
        this.app.stage.on("pointerup", () => {
            this.dragging = false;
        });

        this.app.stage.on("pointerupoutside", () => {
            this.dragging = false;
        });

        // ZOOM
        window.addEventListener("wheel", (e) => {
            const zoomFactor = e.deltaY > 0 ? -0.05 : 0.05;
            this.grid.zoom(zoomFactor);
        });
    }

    update(_delta: number) {}
}
