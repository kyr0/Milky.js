import { getCanvasContext } from "./global";

export function drawInputWaveform(dataArray: Uint8Array) {
  const canvasCtx = getCanvasContext('input-waveform');
  const canvas = canvasCtx.canvas;
  canvas.style.display = 'block';

  // Clear the canvas with transparency for a fresh frame
  canvasCtx.globalCompositeOperation = 'destination-out';
  canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // semi-transparent black
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  canvasCtx.globalCompositeOperation = 'source-over';
  canvasCtx.beginPath();

  const sliceWidth = canvas.width / (dataArray.length / 2);
  let x = 0;

  // Start the path at the middle of the canvas height for centering
  canvasCtx.moveTo(0, canvas.height / 2);
  
  for (let i = 0; i < dataArray.length; i += 2) {
    // Average two consecutive data points for smoother scaling
    const avgValue = (dataArray[i] + dataArray[i + 1]) / 2;
    // Map 0-255 range to -1 to 1, then scale to full canvas height for more pronounced drawing
    const v = (avgValue - 128) / 16.0; // normalize to -1 to 1, scale further
    const y = (canvas.height / 2) + v * (canvas.height / 2); // center and scale vertically
    x += sliceWidth;
    canvasCtx.lineTo(x, y);
  }
  
  // Set stroke color to white and apply stroke to draw the waveform
  canvasCtx.strokeStyle = 'white';
  canvasCtx.stroke();
}

export function drawInputSpectrum(dataArray: Uint8Array) {
  const canvasCtx = getCanvasContext('input-spectrum');
  const canvas = canvasCtx.canvas;

  // Clear the canvas with transparency for a fresh frame
  canvasCtx.globalCompositeOperation = 'destination-out';
  canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // semi-transparent black
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  canvasCtx.globalCompositeOperation = 'source-over';
  
  canvas.style.display = 'block';

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = (canvas.width / dataArray.length) * 2.5;
  let x = 0;

  canvasCtx.fillStyle = 'white';
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = dataArray[i];
    canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
    x += barWidth + 1;
  }
}