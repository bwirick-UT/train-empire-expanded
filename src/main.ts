import { Application, Ticker } from "pixi.js";
import { Game } from "./game";

async function main() {
    const app = new Application();

    // Pixi v8 requires async initialization
    await app.init({
        resizeTo: window,
        backgroundColor: 0x222222,
        antialias: true,
    });

    // Attach canvas
    document.body.appendChild(app.canvas);

    // Create game instance
    const game = new Game(app);

    // Update loop
    app.ticker.add((ticker: Ticker) => {
      game.update(ticker.deltaTime);
    });
}

main();
