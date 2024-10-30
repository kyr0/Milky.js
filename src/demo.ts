import { setupAudioInputSelector, init, captureAndAnalyzeAudioStream, Geiss, renderFrame, getCanvasContext, parseIni, encodeIni, decodeIni, wellKnownIniPropertyNames, stringifyIni } from './lib';
import { drawInputSpectrum, drawInputWaveform } from './lib/debug';
import geissIni from './geiss.ini?raw';
import './demo.css'

async function setupStartButton(startButtonEl: HTMLButtonElement) {

  const fpsEl = document.querySelector<HTMLDivElement>('#fps')!;
  const screenEl = document.querySelector<HTMLCanvasElement>('#screen')!;    
  const toolbarEl = document.querySelector<HTMLDivElement>('#toolbar')!;
  const audioInputSelector = document.querySelector<HTMLSelectElement>('#audio-input-selector')!

  startButtonEl.addEventListener('click', async () => {
    
    // prevent multiple clicks
    startButtonEl.disabled = true;

    // request media permissions, initialize canvas contexts, load WASM module
    // side effect: meanwhile, the DOM is re-rendered with the audio input selector
    await init((error) => {
      alert(`Initialization Error: ${error}`);
    });

    // populate the audio input selector with audio sources (pass a HTMLSelectElement by reference)
    setupAudioInputSelector(audioInputSelector, (deviceId: string) => {

      // show the toolbar and screen
      toolbarEl.style.display = 'flex';
      screenEl.style.display = 'block';

      const screenContext = getCanvasContext('screen');

      let lastFrameTime = performance.now();
      let frameCount = 0;

      // audio source has been selected, start capturing the audio stream
      captureAndAnalyzeAudioStream(deviceId, (waveform, spectrum) => {

        // render the input waveform and spectrum at full resolution
        if (Geiss.get().isInDebugMode) {  
          drawInputWaveform(waveform);
          drawInputSpectrum(spectrum);
        }

        // render the actual visualizer frame
        renderFrame(screenContext, waveform.slice(0, 576), spectrum, 320, 200);

        // calculate FPS after rendering
        const now = performance.now();
        frameCount++;
        const delta = now - lastFrameTime;

        if (delta >= 1000) {
          fpsEl.textContent = ((frameCount / delta) * 1000).toFixed(0)
          frameCount = 0;
          lastFrameTime = now;
        }

      }, {
        // optional settings (defaults shown below)
        // fftSize: 2048,
        // delayMs: 16,
        // bufferSize: 576,
      }, (error) => {

        // handle error (usually an Error object, but can be string)
        alert(`Audio Analyzation Error: ${error}`);
      });
    }, (error) => {

      // handle error (usually an Error object, but can be string)
      alert(`Audio Capture Error: ${error}`);
    });

    // hide the start button
    startButtonEl.style.display = 'none';

    setupDebug();
  });
}

function setupDebug() {

  const debugElement = document.querySelector<HTMLDivElement>('#debug')!;
  const debugModeCheckbox = document.querySelector<HTMLInputElement>('#debug-mode')!;
  const geissIniElement = document.querySelector<HTMLTextAreaElement>('#geiss-ini')!;

  const updateDebugVisibility = (checked: boolean) => {
    debugElement.style.display = checked ? 'block' : 'none';
  }

  geissIniElement.textContent = geissIni;

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
    const newIni = geissIniElement.value;

    try {

      // full validaton run, parser, encoder, decoder, and stringifier
      const sections = parseIni(newIni);
      const encoded = encodeIni(sections);
      const decoded = decodeIni(encoded, wellKnownIniPropertyNames);
      const reprintedIni = stringifyIni(decoded);

      console.log(reprintedIni);

      geissIniElement.value = reprintedIni;

    } catch (error) {
      alert(`Failed to process INI: ${error}`);
    }
  });
}

setupStartButton(document.querySelector<HTMLButtonElement>('#start')!)