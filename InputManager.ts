import { Config } from './config';

export class InputManager {
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    }

    handlePointerDown(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const col = Math.floor(x / Config.TILE_SIZE);
        const row = Math.floor(y / Config.TILE_SIZE);
        
        const customEvent = new CustomEvent('gridClick', { detail: { col, row } });
        this.canvas.dispatchEvent(customEvent);
    }
}
