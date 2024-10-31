import { drawInputSpectrum, drawInputWaveform, setupAudioInputSelector, init, captureAndAnalyzeAudioStream, Geiss, renderFrame, getCanvasContext, parsePreset, encodePreset, decodePreset, wellKnownIniPropertyNames, stringifyPreset, wellKnownBitDepths, geissDefaults, defaultPreset } from './lib';
import packageJson from "../package.json";
import './demo.css';

// vanilla JS user interface code (yes, 300 LoC FTW! -- keep it simple, stupid!)

let currentPresetEncoded: Float32Array = encodePreset(defaultPreset);

function setupBitdepthInput(inputEl: HTMLSelectElement, defaultValue: number, onChange: (bitdepth: number) => void) {
  inputEl.innerHTML = '';

  // render <options>
  wellKnownBitDepths.forEach((bitdepth) => {
    const option = document.createElement('option');
    option.value = bitdepth.toString();
    option.textContent = bitdepth.toFixed(0);
    inputEl.appendChild(option);
  });

  // after DOM is rendered, set the default input value and attach the change event listener
  requestAnimationFrame(() => {
    inputEl.value = defaultValue.toString();

    onChange(defaultValue);

    inputEl.addEventListener('change', () => {
      onChange(Number.parseInt(inputEl.value, 10));
    });
  });
}

function setupRenderDelayInput(inputEl: HTMLInputElement, defaultValue: number, onChange: (delayMs: number) => void) {
  inputEl.value = defaultValue.toFixed(0);

  onChange(defaultValue);

  inputEl.addEventListener('change', () => {
    onChange(Number.parseInt(inputEl.value, 10));
  });
}

function setupVideoResolutionInput(inputEl: HTMLInputElement, defaultValue: string, onChange: (width: number, height: number) => void) {
  inputEl.innerHTML = '';

  // parse a string like "320x200" into a tuple like [320, 200]
  const parseVideoResolution = (value: string): [number, number] => (value.split('x').map(n => Number.parseInt(n, 10))) as [number, number];

  // after DOM is rendered, set the default input value and attach the change event listener
  requestAnimationFrame(() => {
    
    inputEl.value = defaultValue;

    onChange(...parseVideoResolution(defaultValue));

    inputEl.addEventListener('change', () => {
      try {
        onChange(...parseVideoResolution(inputEl.value));
      } catch (error) {
        alert(`Invalid resolution: ${error}. Should be in format: 320x200 etc.`);
      }
    });
  });
}

async function setupStartButton(startButtonEl: HTMLButtonElement) {
  let currentDeviceId = Geiss.get().audioInputDeviceId || '';
  const audioStreamListenerIds: number[] = [];
  const versionTagEl = document.querySelector<HTMLSpanElement>('#version-tag')!;
  const repositoryLinkEl = document.querySelector<HTMLAnchorElement>('#repository-link')!;
  const fpsEl = document.querySelector<HTMLDivElement>('#fps')!;
  const screenEl = document.querySelector<HTMLCanvasElement>('#screen')!;    
  const toolbarEl = document.querySelector<HTMLDivElement>('#toolbar')!;
  const audioInputSelectorEl = document.querySelector<HTMLSelectElement>('#audio-input-selector')!
  const videoRenderResolutionEl = document.querySelector<HTMLInputElement>('#video-render-resolution')!
  const videoDisplayResolutionEl = document.querySelector<HTMLInputElement>('#video-display-resolution')!
  const fullscreenButtonEl = document.querySelector<HTMLButtonElement>('#fullscreen-button')!
  const renderDelayInputEl = document.querySelector<HTMLInputElement>('#delay')!

  versionTagEl.innerText = `v${packageJson.version}`;
  repositoryLinkEl.href = packageJson.repository.url;

  startButtonEl.addEventListener('click', async () => {

    // prevent multiple clicks
    startButtonEl.disabled = true;

    // request media permissions, initialize canvas contexts, load WASM module
    // side effect: meanwhile, the DOM is re-rendered with the audio input selector
    await init((error) => {
      alert(`Initialization Error: ${error}`);
    });

    const screenContext = getCanvasContext('screen');

    setupVideoResolutionInput(
      videoRenderResolutionEl, 
      Geiss.get().renderWidth && Geiss.get().renderHeight ? `${Geiss.get().renderWidth}x${Geiss.get().renderHeight}` : "320x200", 
      (width, height) => {

        // actual canvas resolution
        screenEl.width = width;
        screenEl.height = height;

        Geiss.set({
          ...Geiss.get(),
          renderWidth: width,
          renderHeight: height,
        });
      }
    );

    setupBitdepthInput(
      document.querySelector<HTMLSelectElement>('#video-render-bitdepth-selector')!,
      Geiss.get().bitDepth || geissDefaults.bitDepth,
      (bitDepth) => {
        Geiss.set({
          ...Geiss.get(),
          bitDepth,
        });
      }
    );

    setupVideoResolutionInput(
      videoDisplayResolutionEl, 
      Geiss.get().displayWidth && Geiss.get().displayHeight ? `${Geiss.get().displayWidth}x${Geiss.get().displayHeight}` : "320x200", 
      (width, height) => {

        // canvas CSS resolution (scaling)
        screenEl.style.width = `${width}px`;
        screenEl.style.height = `${height}px`;

        Geiss.set({
          ...Geiss.get(),
          displayWidth: width,
          displayHeight: height,
        });
      }
    );

    const startRenderLoop = async(screenContext: CanvasRenderingContext2D, deviceId: string) => {
      let lastFrameTime = performance.now();
      let frameCount = 0;

      // audio source has been selected, start capturing the audio stream
      const listenerId = await captureAndAnalyzeAudioStream(deviceId, (waveform, spectrum, _audioCaptureListenerId) => {

        // --- RENDER LOOP
        //console.log('audioCaptureListenerId:', audioCaptureListenerId);

        // render the input waveform and spectrum at full resolution
        if (Geiss.get().isInDebugMode) {  
          drawInputWaveform(waveform);
          drawInputSpectrum(spectrum);
        }

        // render the actual visualizer frame
        renderFrame(
          screenContext, 
          waveform.slice(0, Geiss.get().waveformSamples || geissDefaults.waveformSamples), 
          spectrum, 
          Geiss.get().renderWidth || geissDefaults.renderWidth, 
          Geiss.get().renderHeight || geissDefaults.renderHeight,
          Geiss.get().bitDepth || geissDefaults.bitDepth,
          currentPresetEncoded,
        );

        // calculate FPS after rendering
        const now = performance.now();
        frameCount++;
        const delta = now - lastFrameTime;

        if (delta >= 1000) { // update every second
          fpsEl.textContent = ((frameCount / delta) * 1000).toFixed(0)
          frameCount = 0;
          lastFrameTime = now;
        }

        // --- END OF RENDER LOOP

      }, {
        // optional settings (defaults shown below)
        fftSize: Geiss.get().fftSize || geissDefaults.fftSize, // usually 2048
        bufferSize: Geiss.get().waveformSamples || geissDefaults.waveformSamples, // usually 576
        delayMs: Geiss.get().renderDelayMs || geissDefaults.renderDelayMs, // usually 14
      }, (error) => {

        // handle error (usually an Error object, but can be string)
        alert(`Audio Analyzation Error: ${error}`);
      });

      if (typeof listenerId === 'number') {
        audioStreamListenerIds.push(listenerId);
      }
    }

    // populate the audio input selector with audio sources (pass a HTMLSelectElement by reference)
    setupAudioInputSelector(audioInputSelectorEl, async(deviceId: string) => {

      currentDeviceId = deviceId;

      // show the toolbar and screen
      toolbarEl.style.display = 'flex';
      screenEl.style.display = 'block';
      
      await startRenderLoop(screenContext, currentDeviceId);

      // hide the start button
      startButtonEl.style.display = 'none'; 
    }, (error) => {

      // handle error (usually an Error object, but can be string)
      alert(`Audio Capture Error: ${error}`);
    });

    setupRenderDelayInput(
      renderDelayInputEl,
      Geiss.get().renderDelayMs || geissDefaults.renderDelayMs,
      (delayMs) => {
        Geiss.set({
          ...Geiss.get(),
          renderDelayMs: delayMs,
        });

        startRenderLoop(screenContext, currentDeviceId);
      }
    );

    setupDebug();
  });

  fullscreenButtonEl.addEventListener('click', () => {
    screenEl.requestFullscreen();
  });
}

function setupDebug() {

  const debugElement = document.querySelector<HTMLDivElement>('#debug')!;
  const debugModeCheckbox = document.querySelector<HTMLInputElement>('#debug-mode')!;
  const geissIniElement = document.querySelector<HTMLTextAreaElement>('#geiss-ini')!;
  const debugModeLabelEl = document.querySelector<HTMLLabelElement>('#debug-mode-label')!;
  
  debugModeLabelEl.style.display = 'flex';

  const updateDebugVisibility = (checked: boolean) => {
    debugElement.style.display = checked ? 'block' : 'none';
  }

  geissIniElement.textContent = stringifyPreset(defaultPreset);

  // set the initial state of the debug mode checkbox
  const isInDebugMode = Geiss.get().isInDebugMode;
  debugModeCheckbox.checked =isInDebugMode;
  updateDebugVisibility(isInDebugMode);

  // update the persistent state when the checkbox is toggled
  debugModeCheckbox.addEventListener('change', (evt) => {
    updateDebugVisibility((evt.target as HTMLInputElement).checked); 
    Geiss.set({
      ...Geiss.get(),
      isInDebugMode: debugModeCheckbox.checked,
    });
  });

  geissIniElement.addEventListener('change', () => {
    const presetIniText = geissIniElement.value;

    try {
      // full validaton run, parser, encoder, decoder, and stringifier
      const sections = parsePreset(presetIniText);
      const encoded = encodePreset(sections);
      
      currentPresetEncoded = encoded;

      const decoded = decodePreset(encoded, wellKnownIniPropertyNames);
      const reprintedPreset = stringifyPreset(decoded);

      console.log('reprintedPreset', reprintedPreset);

      geissIniElement.value = reprintedPreset;

    } catch (error) {
      alert(`Failed to process INI: ${error}`);
    }
  });
}

setupStartButton(document.querySelector<HTMLButtonElement>('#start')!)