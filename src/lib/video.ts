import getWasmModule from "./.gen/video";

export interface WasmModule {
  _malloc: (bytes: number) => number;
  _free: (ptr: number) => void;
  _render: (
    ptrCanvasFlatBuffer: number, 
    canvasWidthPx: number,
    canvasHeightPx: number, 
    ptrWaveformBuffer: number, 
    ptrSpectrumBuffer: number, 
    waveformBufferLength: number, 
    spectrumBufferLength: number,
    ptrDebugMessageBuffer: number,
  ) => void;
  HEAPU8: {
    set: (data: Uint8Array, offset: number) => void;
    buffer: ArrayBuffer;
  };
}

let Module: WasmModule;

export const initWasm = async (module?: WasmModule): Promise<WasmModule> => {
  if (module) {
    Module = module;
  }

  if (!Module) {
    Module = await getWasmModule();
  }
  return Module;
};

let lastDebugMessage = '';

export const renderFrame = (
  context: CanvasRenderingContext2D,
  waveform: Uint8Array,
  spectrum: Uint8Array,
  widthPx: number,
  heightPx: number,
): void => {

  const maxLogMessageLength = 1024; // characters
  // 4 bytes per pixel for RGBA each 0-255 (one byte)
  const canvasSize = widthPx * heightPx * 4;  
  const waveformByteSize = waveform.length * Uint8Array.BYTES_PER_ELEMENT;
  const spectrumByteSize = spectrum.length * Uint8Array.BYTES_PER_ELEMENT;
  const debugMessageByteSize = maxLogMessageLength * Uint8Array.BYTES_PER_ELEMENT;

  // Allocate memory for the canvas buffer
  const ptrCanvas = Module._malloc(canvasSize);

  const ptrWaveform = Module._malloc(waveformByteSize);
  const ptrSpectrum = Module._malloc(spectrumByteSize);
  const ptrDebugMessage = Module._malloc(debugMessageByteSize);

  Module.HEAPU8.set(waveform, ptrWaveform / Uint8Array.BYTES_PER_ELEMENT);
  Module.HEAPU8.set(spectrum, ptrSpectrum / Uint8Array.BYTES_PER_ELEMENT);

  // Call the render function in WebAssembly module
  Module._render(ptrCanvas, widthPx, heightPx, ptrWaveform, ptrSpectrum, waveform.length, spectrum.length, ptrDebugMessage);

  const debugMessage = (new TextDecoder()).decode(new Uint8Array(Module.HEAPU8.buffer, ptrDebugMessage, maxLogMessageLength));

  if (debugMessage && debugMessage !== lastDebugMessage) {
    console.log(`WASM: ${debugMessage}`);
    lastDebugMessage = debugMessage;
  }

  // Draw the ImageData onto the canvas
  context.putImageData(new ImageData(new Uint8ClampedArray(Module.HEAPU8.buffer, ptrCanvas, canvasSize), widthPx, heightPx), 0, 0);

  Module._free(ptrWaveform);
  Module._free(ptrSpectrum);
  Module._free(ptrCanvas);
};