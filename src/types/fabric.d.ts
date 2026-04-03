declare module 'fabric' {
  export = fabric;
}

declare namespace fabric {
  class Canvas {
    constructor(element: HTMLCanvasElement | string | null, options?: ICanvasOptions);
    add(...objects: Object[]): Canvas;
    remove(...objects: Object[]): Canvas;
    clear(): Canvas;
    renderAll(): Canvas;
    getPointer(e: Event): { x: number; y: number };
    getActiveObject(): Object | null;
    setActiveObject(object: Object): Canvas;
    setWidth(value: number): Canvas;
    setHeight(value: number): Canvas;
    sendToBack(object: Object): Canvas;
    dispose(): Canvas;
    selection: boolean;
  }

  interface ICanvasOptions {
    selection?: boolean;
    preserveObjectStacking?: boolean;
  }

  class Object {
    set(options: Record<string, any>): Object;
    left: number;
    top: number;
    width: number;
    height: number;
    selectable?: boolean;
    evented?: boolean;
  }

  class Rect extends Object {
    constructor(options?: any);
  }

  class Image extends Object {
    static fromURL(url: string, callback: (img: Image) => void, options?: any): void;
  }
}
