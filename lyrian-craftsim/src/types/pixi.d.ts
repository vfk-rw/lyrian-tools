declare module 'pixi.js' {
  export class Application {
    constructor(options?: {
      width?: number;
      height?: number;
      backgroundColor?: number;
      resolution?: number;
      autoDensity?: boolean;
      antialias?: boolean;
      preserveDrawingBuffer?: boolean;
      clearBeforeRender?: boolean;
      resizeTo?: HTMLElement | Window;
    });
    renderer: any;
    stage: Container;
    screen: { width: number; height: number };
    view: HTMLCanvasElement;
    ticker: Ticker;
    destroy(removeView?: boolean, stageOptions?: any): void;
  }
  
  export class Container {
    children: any[];
    position: { x: number; y: number; set: (x: number, y: number) => void };
    scale: { x: number; y: number };
    addChild(...children: DisplayObject[]): DisplayObject;
    removeChild(...children: DisplayObject[]): DisplayObject;
    removeChildren(beginIndex?: number, endIndex?: number): DisplayObject[];
  }
  
  export class Graphics extends Container {
    beginFill(color?: number, alpha?: number): Graphics;
    endFill(): Graphics;
    lineStyle(width?: number, color?: number, alpha?: number, alignment?: number): Graphics;
    drawCircle(x: number, y: number, radius: number): Graphics;
    drawRect(x: number, y: number, width: number, height: number): Graphics;
    drawPolygon(path: Point[] | number[]): Graphics;
    moveTo(x: number, y: number): Graphics;
    lineTo(x: number, y: number): Graphics;
    closePath(): Graphics;
    clear(): Graphics;
    
    eventMode: string;
    tileKey?: string;
    tileData?: any;
    poiData?: any;
  }
  
  export class Ticker {
    add(fn: (deltaTime: number) => void, context?: any): void;
    remove(fn: Function, context?: any): void;
    start(): void;
    stop(): void;
    readonly lastTime: number;
  }
  
  export class Point {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y: number): void;
  }
  
  export class EventSystem {
    constructor(renderer: any);
  }
  
  export type DisplayObject = Container | Graphics;

  export interface InteractionEvent {
    data: {
      global: Point;
      originalEvent: Event;
    };
    stopped: boolean;
    target: DisplayObject;
    type: string;
    stopPropagation(): void;
  }
}
