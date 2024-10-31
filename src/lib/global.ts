import { persistentAtom } from '@nanostores/persistent'
import { initWasm } from './video';

// fast lookup map (access by reference)
export const canvasContexts: Map<string, CanvasRenderingContext2D> = new Map();

export type ErrorCallbackFn = (error: unknown) => void;

export interface Geiss {
  audioInputDeviceId: string;
  
  isInDebugMode: boolean;

  renderWidth: number;
  renderHeight: number;

  bitDepth: number;

  waveformSamples: number;
  fftSize: number; // power of 2

  renderDelayMs: number;

  displayWidth: number;
  displayHeight: number;
}

export const geissDefaults: Geiss = {
  audioInputDeviceId: '',

  isInDebugMode: true,

  bitDepth: 8,

  waveformSamples: 576,
  fftSize: 2048,

  renderDelayMs: 14,
  
  renderWidth: 320,
  renderHeight: 180,

  // 16:9 aspect ratio
  displayWidth: 640,
  displayHeight: 360,
};

export const Geiss = persistentAtom<Geiss>('geiss', geissDefaults, {
  // persistene encoding and decoding
  encode: JSON.stringify,
  decode: JSON.parse,
})

export function initializeCanvasContexts() {
  const canvasIds = ['input-waveform', 'input-spectrum', 'screen'];
  canvasIds.forEach(id => {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvasContexts.set(id, context);
      } else {
        throw new Error(`Failed to get 2D context for canvas: ${id}`);
      }
    } else {
      throw new Error(`Canvas not found: ${id}`);
    }
  });
}

export function getCanvasContext(id: string): CanvasRenderingContext2D {
  const canvasCtx = canvasContexts.get(id);
  if (!canvasCtx) {
    throw new Error(`getCanvasContext: Canvas context for ${id} not found`);
  }
  return canvasCtx;
}

export async function requestMediaPermission() {
  await navigator.mediaDevices.getUserMedia({ audio: true });
}

export async function init(onError: ErrorCallbackFn = console.error) {

  try {
    
    initializeCanvasContexts();
    await requestMediaPermission();
    await initWasm();

  } catch (error) {
    onError(error);
  }
}