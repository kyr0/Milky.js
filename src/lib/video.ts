import getWasmModule from "./.gen/video";

// Hook console.log and console.error to detect messages starting with "native:SIGNAL:"
const originalConsoleLog = console.log;

console.log = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].startsWith('native:SIGNAL:')) {
    // split the message by 'native:SIGNAL:' and parse the rest
    const [, signalMessage] = args[0].split('native:SIGNAL:');

    // create a custom event with the signal message
    const event = new CustomEvent('SignalEvent', { detail: { signalMessage } });

    console.log('Detected signal:', signalMessage);
    // dispatch the custom event
    window.dispatchEvent(event);

    // handle the parsed signal message
    //originalConsoleLog('Detected signal:', signalMessage, ...args.slice(1));
  } else {
    originalConsoleLog(...args);
  }
};

export interface WasmModule {
  _malloc: (bytes: number) => number;
  _free: (ptr: number) => void;
  _render: (
    ptrFrame: number, 
    canvasWidthPx: number,
    canvasHeightPx: number, 
    ptrWaveformBuffer: number, 
    ptrSpectrumBuffer: number, 
    waveformBufferLength: number, 
    spectrumBufferLength: number,
    bitDepth: number,
    ptrPresetsBuffer: number,
    speed: number,
    currentTimestamp: number,
  ) => void;
  HEAPU8: {
    set: (data: Uint8Array, offset: number) => void;
    buffer: ArrayBuffer;
  };
  HEAPF32: {
    set: (data: Float32Array, offset: number) => void;
    buffer: ArrayBuffer;
  };
}

let Module: WasmModule;
let ptrFrame: number;
let ptrWaveform: number;
let ptrSpectrum: number;
let ptrPresets: number;
let currentWidthPx = 0;
let currentHeightPx = 0;

export const initWasm = async (module?: WasmModule): Promise<WasmModule> => {
  Module = module || await getWasmModule();

  // Allocate memory for the waveform, spectrum, and presets buffers once
  ptrWaveform = Module._malloc(2048 * Uint8Array.BYTES_PER_ELEMENT);
  ptrSpectrum = Module._malloc(1024 * Uint8Array.BYTES_PER_ELEMENT);
  ptrPresets = Module._malloc(100 * Float32Array.BYTES_PER_ELEMENT);

  return Module;
};

export const renderFrame = (
  context: CanvasRenderingContext2D,
  waveform: Uint8Array,
  spectrum: Uint8Array,
  widthPx: number,
  heightPx: number,
  bitDepth: number,
  presets: Float32Array,
  _fps: number,
): void => {
  /*
  const maxFps = 20;
  const frameInterval = Math.floor(fps / maxFps);

  // Return early if the current frame should be skipped
  if (frameInterval > 1 && Math.floor(performance.now() / (1000 / maxFps)) % frameInterval !== 0) {
    return;
  }
    */

  const frameSize = widthPx * heightPx * 4;

  // Reallocate if dimensions changed
  if (widthPx !== currentWidthPx || heightPx !== currentHeightPx) {
    if (ptrFrame) Module._free(ptrFrame);
    ptrFrame = Module._malloc(frameSize);
    currentWidthPx = widthPx;
    currentHeightPx = heightPx;
  }

  Module.HEAPU8.set(waveform, ptrWaveform / Uint8Array.BYTES_PER_ELEMENT);
  Module.HEAPU8.set(spectrum, ptrSpectrum / Uint8Array.BYTES_PER_ELEMENT);
  Module.HEAPF32.set(presets, ptrPresets / Float32Array.BYTES_PER_ELEMENT);

  // Call WebAssembly render
  Module._render(
    ptrFrame,
    widthPx,
    heightPx,
    ptrWaveform,
    ptrSpectrum,
    waveform.length,
    spectrum.length,
    bitDepth,
    ptrPresets,
    0.03,
    performance.now(),
  );

  // Draw to canvas
  context.putImageData(
    new ImageData(
      new Uint8ClampedArray(new Uint8Array(Module.HEAPU8.buffer, ptrFrame, frameSize)),
      widthPx,
      heightPx
    ),
    0,
    0
  );
  context.translate(0.5, 0.5);
  context.imageSmoothingEnabled = true;
};


export const wellKnownBitDepths = [8, 16, 24, 32];