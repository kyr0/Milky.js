import * as nanostores from 'nanostores';

declare const canvasContexts: Map<string, CanvasRenderingContext2D>;
type ErrorCallbackFn = (error: unknown) => void;
declare const geissDefaults: Geiss;
interface Geiss {
    audioInputDeviceId: string;
    isInDebugMode: boolean;
    renderWidth: number;
    renderHeight: number;
    bitDepth: number;
    waveformSamples: number;
    fftSize: number;
    renderDelayMs: number;
    displayWidth: number;
    displayHeight: number;
}
declare const Geiss: nanostores.WritableAtom<Geiss>;
declare function initializeCanvasContexts(): void;
declare function getCanvasContext(id: string): CanvasRenderingContext2D;
declare function requestMediaPermission(): Promise<void>;
declare function init(onError?: ErrorCallbackFn): Promise<void>;

declare let activeAudioStream: MediaStream | null;
declare let audioContext: AudioContext;
declare let audioMerger: ChannelMergerNode | null;
declare let audioStreamNode: MediaStreamAudioSourceNode | null;
declare let fftAnalyzer: AnalyserNode | null;
type OnAudioFrameCallbackFn = (waveform: Uint8Array, spectrum: Uint8Array, audioCaptureListenerId: number) => void;
interface AudioCaptureOptions {
    fftSize: number;
    bufferSize: number;
    delayMs: number;
}
declare const defaultAudioCaptureOptions: AudioCaptureOptions;
declare const getAudioContext: () => AudioContext;
declare function setupAudioInputSelector(element: HTMLSelectElement, onSelect: (deviceId: string) => void, onError: ErrorCallbackFn): Promise<void>;
declare const validateAudioCaptureOptions: (opts: Partial<AudioCaptureOptions>) => AudioCaptureOptions;
declare function captureAndAnalyzeAudioStream(deviceId: string, onFrame: OnAudioFrameCallbackFn, opts?: Partial<AudioCaptureOptions>, onError?: ErrorCallbackFn): Promise<number | undefined>;
declare function analyzeAudioStream(audioStreamNode: AudioNode, spectrumData: Uint8Array, waveformData: Uint8Array, options: AudioCaptureOptions, audioCaptureListenerId: number, onFrame: OnAudioFrameCallbackFn): Promise<void>;

interface WasmModule {
    _malloc: (bytes: number) => number;
    _free: (ptr: number) => void;
    _render: (ptrFrame: number, canvasWidthPx: number, canvasHeightPx: number, ptrWaveformBuffer: number, ptrSpectrumBuffer: number, waveformBufferLength: number, spectrumBufferLength: number, bitDepth: number, ptrPresetsBuffer: number, speed: number, currentTimestamp: number) => void;
    HEAPU8: {
        set: (data: Uint8Array, offset: number) => void;
        buffer: ArrayBuffer;
    };
    HEAPF32: {
        set: (data: Float32Array, offset: number) => void;
        buffer: ArrayBuffer;
    };
}
declare const initWasm: (module?: WasmModule) => Promise<WasmModule>;
declare const renderFrame: (context: CanvasRenderingContext2D, waveform: Uint8Array, spectrum: Uint8Array, widthPx: number, heightPx: number, bitDepth: number, presets: Float32Array, _fps: number) => void;
declare const wellKnownBitDepths: number[];

declare function drawInputWaveform(dataArray: Uint8Array): void;
declare function drawInputSpectrum(dataArray: Uint8Array): void;

interface PresetSection {
    presetNumber: number;
    [key: string]: number;
}
type Preset = Array<PresetSection>;
declare const wellKnownIniPropertyNames: string[];
declare function parsePreset(text: string): Preset;
declare function encodePreset(iniResult: Preset): Float32Array;
declare function decodePreset(floatArray: Float32Array, propertyNames: Array<string>): Preset;
declare function stringifyPreset(iniResult: Preset): string;
declare const defaultPreset: Preset;

export { type AudioCaptureOptions, type ErrorCallbackFn, Geiss, type OnAudioFrameCallbackFn, type Preset, type PresetSection, type WasmModule, activeAudioStream, analyzeAudioStream, audioContext, audioMerger, audioStreamNode, canvasContexts, captureAndAnalyzeAudioStream, decodePreset, defaultAudioCaptureOptions, defaultPreset, drawInputSpectrum, drawInputWaveform, encodePreset, fftAnalyzer, geissDefaults, getAudioContext, getCanvasContext, init, initWasm, initializeCanvasContexts, parsePreset, renderFrame, requestMediaPermission, setupAudioInputSelector, stringifyPreset, validateAudioCaptureOptions, wellKnownBitDepths, wellKnownIniPropertyNames };
