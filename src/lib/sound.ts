import { type ErrorCallbackFn, Geiss, geissDefaults } from './global.ts';

export let activeAudioStream: MediaStream | null = null;
export let audioContext: AudioContext;
export let audioMerger: ChannelMergerNode | null = null;
export let audioStreamNode: MediaStreamAudioSourceNode | null = null;
export let fftAnalyzer: AnalyserNode | null = null;
let audioStreamCaptureListenerId = 0;

export type OnAudioFrameCallbackFn = (waveform: Uint8Array, spectrum: Uint8Array, sampleRate: number, audioCaptureListenerId: number) => void;

export interface AudioCaptureOptions {
  fftSize: number;
  bufferSize: number;
  delayMs: number;
}

export const defaultAudioCaptureOptions: AudioCaptureOptions = {
  fftSize: geissDefaults.fftSize,
  bufferSize: geissDefaults.waveformSamples,
  delayMs: geissDefaults.renderDelayMs,
};

let lastDrawTime = 0;

export const getAudioContext = (): AudioContext => { 
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function setupAudioInputSelector(
  element: HTMLSelectElement, 
  onSelect: (deviceId: string) => void, 
  onError: ErrorCallbackFn
) {
  const listAudioInputs = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      const currentDeviceIds = Array.from(element.options).map(option => option.value);
      const newDeviceIds = audioInputs.map(input => input.deviceId);

      const devicesChanged = currentDeviceIds.length !== newDeviceIds.length || 
                             !currentDeviceIds.every(id => newDeviceIds.includes(id));

      if (devicesChanged) {
        element.innerHTML = '';
        audioInputs.forEach(input => {
          const option = document.createElement('option');
          option.value = input.deviceId;
          option.textContent = input.label;
          element.appendChild(option);
        });

        const storedDeviceId = Geiss.get().audioInputDeviceId;
        const isStoredDeviceAvailable = audioInputs.some(input => input.deviceId === storedDeviceId);

        Geiss.set({
          ...Geiss.get(),
          audioInputDeviceId: isStoredDeviceAvailable ? storedDeviceId : audioInputs[0]?.deviceId // select first available device
        });

        element.value = Geiss.get().audioInputDeviceId;
      }
    } catch (error) {
      onError(error);
    }
  };

  try {
    await listAudioInputs();
    navigator.mediaDevices.addEventListener('devicechange', listAudioInputs);

    element.addEventListener('change', () => {
      Geiss.set({
        ...Geiss.get(),
        audioInputDeviceId: element.value
      });
      onSelect(element.value);
    });

    if (Geiss.get().audioInputDeviceId) {
      onSelect(Geiss.get().audioInputDeviceId);
    } else {
      console.error('No audio input device selected.');
    }
  } catch (error) {
    onError(error);
  }
}

export const validateAudioCaptureOptions = (opts: Partial<AudioCaptureOptions>): AudioCaptureOptions => {
  return {
    fftSize: opts.fftSize || defaultAudioCaptureOptions.fftSize,
    bufferSize: opts.bufferSize || defaultAudioCaptureOptions.bufferSize,
    delayMs: opts.delayMs || defaultAudioCaptureOptions.delayMs,
  };
}

export async function captureAndAnalyzeAudioStream(
  deviceId: string, 
  onFrame: OnAudioFrameCallbackFn, 
  opts: Partial<AudioCaptureOptions> = {}, 
  onError: ErrorCallbackFn = console.error
): Promise<number | undefined> {
  audioStreamCaptureListenerId++;

  const audioCaptureListenerId = audioStreamCaptureListenerId;

  const options = validateAudioCaptureOptions(opts);

  const spectrumData: Uint8Array = new Uint8Array(options.bufferSize);
  const waveformData: Uint8Array = new Uint8Array(options.bufferSize);
  
  try {
    // Disconnect in the correct order
    disconnectAudioNodes();

    activeAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        deviceId: { exact: deviceId },
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false
      }
    });

    audioStreamNode = getAudioContext().createMediaStreamSource(activeAudioStream);
    audioMerger = getAudioContext().createChannelMerger(1); // downmix all channels into a single channel (mono)

    audioStreamNode.connect(audioMerger);

    await analyzeAudioStream(audioMerger, spectrumData, waveformData, options, audioCaptureListenerId, onFrame);

    return audioStreamCaptureListenerId;
  
  } catch (error) {
    onError(error);
  }
}

function disconnectAudioNodes() {
  if (fftAnalyzer) {
    fftAnalyzer.disconnect();
    fftAnalyzer = null;
    console.log('fftAnalyzer disconnected');
  }

  if (audioStreamNode) {
    audioStreamNode.disconnect();
    audioStreamNode = null;
    console.log('audioStreamNode disconnected');
  }

  if (audioMerger) {
    audioMerger.disconnect();
    audioMerger = null;
    console.log('audioMerger disconnected');
  }

  if (activeAudioStream) {
    activeAudioStream.getTracks().forEach(track => track.stop());
    activeAudioStream = null;
    console.log('activeAudioStream disconnected');
  }
}

export async function analyzeAudioStream(
  audioStreamNode: AudioNode,
  spectrumData: Uint8Array, 
  waveformData: Uint8Array, 
  options: AudioCaptureOptions, 
  audioCaptureListenerId: number,
  onFrame: OnAudioFrameCallbackFn
) {
  if (fftAnalyzer) {
    fftAnalyzer.disconnect(); // disconnect previous analyzer
    fftAnalyzer = null;
    console.log('fftAnalyzer disconnected');
  }

  // create a new AnalyserNode for audio analysis
  fftAnalyzer = getAudioContext().createAnalyser();
  fftAnalyzer.fftSize = options.fftSize;
  audioStreamNode.connect(fftAnalyzer);

  const frequencySpectrumData = new Uint8Array(fftAnalyzer.frequencyBinCount);
  const timeDomainWaveformData = new Uint8Array(fftAnalyzer.fftSize);

  const analyze = () => {
    requestAnimationFrame(analyze);

    if (!fftAnalyzer) {
      return;
    }

    // fill the arrays with the current audio frame's data
    fftAnalyzer!.getByteFrequencyData(frequencySpectrumData);
    fftAnalyzer!.getByteTimeDomainData(timeDomainWaveformData);

    const bufferSize = options.bufferSize;
    const freqLength = frequencySpectrumData.length;
    const waveLength = timeDomainWaveformData.length;

    // JIT-optimization; Unrolled loop for performance - 4x less iteration; JIT vector intrinsics
    let i = 0;
    for (; i <= bufferSize - 4; i += 4) {
      spectrumData[i] = frequencySpectrumData[i % freqLength];
      waveformData[i] = timeDomainWaveformData[i % waveLength];

      spectrumData[i + 1] = frequencySpectrumData[(i + 1) % freqLength];
      waveformData[i + 1] = timeDomainWaveformData[(i + 1) % waveLength];

      spectrumData[i + 2] = frequencySpectrumData[(i + 2) % freqLength];
      waveformData[i + 2] = timeDomainWaveformData[(i + 2) % waveLength];

      spectrumData[i + 3] = frequencySpectrumData[(i + 3) % freqLength];
      waveformData[i + 3] = timeDomainWaveformData[(i + 3) % waveLength];
    }

    // handle remaining elements if bufferSize is not a multiple of 4
    for (; i < bufferSize; i++) {
      spectrumData[i] = frequencySpectrumData[i % freqLength];
      waveformData[i] = timeDomainWaveformData[i % waveLength];
    }

    const now = performance.now();

    // throttle frame updates to the specified delayMs
    if (now - lastDrawTime >= options.delayMs) {
      // ensure the listener is still valid before calling onFrame
      if (audioCaptureListenerId === audioStreamCaptureListenerId) {
        onFrame(timeDomainWaveformData, frequencySpectrumData, getAudioContext().sampleRate, audioCaptureListenerId);
        lastDrawTime = now; // update last draw time
      }
    }
  };
  analyze();
}
