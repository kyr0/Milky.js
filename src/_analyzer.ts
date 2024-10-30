/*
class AtanProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const atan = 10;
    for (let i = inputs.length; i--; )
      for (let j = inputs[i].length; j--; )
        for (let k = inputs[i][j].length; k--; )
          // apply atan curve to audio
          outputs[i][j][k] =
            Math.atan(atan * inputs[i][j][k]) / Math.atan(atan);
    return true;
  }
}
registerProcessor("atan-processor", AtanProcessor);
  */

/*

  // @ts-ignore
import { RingBuffer, AudioReader } from 'ringbuf.js';

class AnalyzerProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  private spectrumRingBuffer: RingBuffer;
  private waveformRingBuffer: RingBuffer;
  private fftSize: number;
  private bufferIndex: number;
  private analyser: AnalyserNode;

  constructor() {
    super();

    this.fftSize = 2048;
    this.bufferIndex = 0;

    // Initialize ring buffers for each channel (576 samples)
    const spectrumBufferSize = 576 * 2; // Two channels
    const waveformBufferSize = 576 * 2;

    const spectrumSharedBuffer = new SharedArrayBuffer(spectrumBufferSize * Float32Array.BYTES_PER_ELEMENT);
    const waveformSharedBuffer = new SharedArrayBuffer(waveformBufferSize * Float32Array.BYTES_PER_ELEMENT);

    this.spectrumRingBuffer = new RingBuffer(spectrumSharedBuffer, Float32Array);
    this.waveformRingBuffer = new RingBuffer(waveformSharedBuffer, Float32Array);

    // Transfer shared buffer references to the main thread
    this.port.postMessage({
      spectrumBuffer: spectrumSharedBuffer,
      waveformBuffer: waveformSharedBuffer,
    });
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    if (input && input[0]) {
      const inputChannelData = input[0]; // Mono or Left Channel

      // Analyze waveform data directly
      this.fillRingBuffer(this.waveformRingBuffer, inputChannelData);

      // Analyze frequency (spectrum) data
      const frequencyData = new Float32Array(this.fftSize / 2);
      this.analyser.getFloatFrequencyData(frequencyData);
      this.fillRingBuffer(this.spectrumRingBuffer, frequencyData);
    }
    return true;
  }

  // Fill ring buffer while managing index wrap-around
  private fillRingBuffer(buffer: RingBuffer, data: Float32Array) {
    for (let i = 0; i < data.length; i++) {
      buffer.push(data[i]);
    }
  }
}

registerProcessor("analyzer-processor", AnalyzerProcessor);


*/