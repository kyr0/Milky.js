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
    ptrPrevFrame: number, 
    canvasWidthPx: number,
    canvasHeightPx: number, 
    ptrWaveformBuffer: number, 
    ptrSpectrumBuffer: number, 
    waveformBufferLength: number, 
    spectrumBufferLength: number,
    bitDepth: number,
    ptrPresetsBuffer: number
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
let ptrPrevFrame: number;
let ptrWaveform: number;
let ptrSpectrum: number;
let ptrPresets: number;
let currentWidthPx = 0;
let currentHeightPx = 0;

export const initWasm = async (module?: WasmModule): Promise<WasmModule> => {
  Module = module || await getWasmModule();


  // Allocate memory for the waveform, spectrum, and presets buffers once
  ptrWaveform = Module._malloc(576 * Uint8Array.BYTES_PER_ELEMENT);
  ptrSpectrum = Module._malloc(576 * Uint8Array.BYTES_PER_ELEMENT);
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
  presets: Float32Array
): void => {
  const frameSize = widthPx * heightPx * 4;

  // Check if width or height has changed
  if (widthPx !== currentWidthPx || heightPx !== currentHeightPx) {
    // Free previous frame buffers
    if (ptrFrame) Module._free(ptrFrame);
    if (ptrPrevFrame) Module._free(ptrPrevFrame);

    // Allocate new frame buffers
    ptrFrame = Module._malloc(frameSize);
    ptrPrevFrame = Module._malloc(frameSize);

    // Update current dimensions
    currentWidthPx = widthPx;
    currentHeightPx = heightPx;
  }

  Module.HEAPU8.set(waveform, ptrWaveform / Uint8Array.BYTES_PER_ELEMENT);
  Module.HEAPU8.set(spectrum, ptrSpectrum / Uint8Array.BYTES_PER_ELEMENT);
  Module.HEAPF32.set(presets, ptrPresets / Float32Array.BYTES_PER_ELEMENT);

  // Call the render function in WebAssembly module
  Module._render(
    ptrFrame,
    ptrPrevFrame,
    widthPx, 
    heightPx, 
    ptrWaveform, 
    ptrSpectrum, 
    waveform.length, 
    spectrum.length, 
    bitDepth,
    ptrPresets
  );

  // Draw the ImageData onto the canvas
  context.putImageData(
    new ImageData(
      new Uint8ClampedArray(Module.HEAPU8.buffer, ptrFrame, frameSize), 
      widthPx, 
      heightPx
    ), 
    0, 
    0
  );
}

export const wellKnownBitDepths = [8, 16, 24, 32];