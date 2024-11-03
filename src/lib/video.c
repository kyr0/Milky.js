#include "video.h"

/**
 * Renders one visual frame based on audio waveform and spectrum data.
 *
 * @param frame           Canvas frame buffer (RGBA format).
 * @param canvasWidthPx   Canvas width in pixels.
 * @param canvasHeightPx  Canvas height in pixels.
 * @param waveform        Waveform data array, 8-bit unsigned integers, 576 samples.
 * @param spectrum        Spectrum data array.
 * @param waveformLength  Length of the waveform data array.
 * @param spectrumLength  Length of the spectrum data array.
 * @param bitDepth        Bit depth of the rendering.
 * @param presetsBuffer   Preset data.
 * @param speed           Speed factor for the rendering.
 * @param currentTime     Current time in milliseconds.
 */
void render(
    uint8_t *frame,
    size_t canvasWidthPx,
    size_t canvasHeightPx,
    const uint8_t *waveform,
    const uint8_t *spectrum,
    size_t waveformLength,
    size_t spectrumLength,
    uint8_t bitDepth,
    float *presetsBuffer,
    float speed,
    size_t currentTime
) {
    // calculate the size of the frame buffer based on canvas dimensions and RGBA format
    size_t frameSize = canvasWidthPx * canvasHeightPx * 4;

    // initialize previous frame size if not set
    if (prevFrameSize == 0) {
        prevFrameSize = frameSize;
    }

    // ensure memory is allocated and updated for the current canvas size
    reserveAndUpdateMemory(canvasWidthPx, canvasHeightPx, frame, frameSize);

    // create an array to store the emphasized waveform
    float emphasizedWaveform[waveformLength];

    // apply smoothing and bass emphasis to the waveform
    smoothBassEmphasizedWaveform(waveform, waveformLength, emphasizedWaveform, canvasWidthPx, 0.7f);

    // calculate the time frame for rendering based on the elapsed time
    float timeFrame = ((prevTime == 0) ? 0.01f : (currentTime - prevTime) / 1000.0f);

    // check if the last frame is initialized; if not, clear the frames
    if (!isLastFrameInitialized) {
        clearFrame(frame, frameSize);
        clearFrame(prevFrame, prevFrameSize);
        isLastFrameInitialized = 1; 
    } else {
        // update speed scalar with the current speed
        speedScalar += speed;

        // apply blur effect to the previous frame
        blurFrame(prevFrame, frameSize);
        
        // preserve mass fade effect on the temporary buffer
        preserveMassFade(prevFrame, tempBuffer, frameSize);

        // copy the previous frame to the current frame as a base for drawing
        memcpy(tempBuffer, prevFrame, frameSize);
        memcpy(frame, tempBuffer, frameSize);
    }

    // apply color palette to the canvas based on the current time
    applyPaletteToCanvas(currentTime, frame, canvasWidthPx, canvasHeightPx);

    // render the waveform on the canvas with different emphasis levels
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.85f, 2, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.95f, 1, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 5.0f, 0, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.95f, -1, 1);

    // detect energy spikes in the audio data
    detectEnergySpike(waveform, spectrum, waveformLength, spectrumLength, 44100);

    // render chasers effect on the frame
    renderChasers(speedScalar, frame, speed * 20, 2, canvasWidthPx, canvasHeightPx, 42, 2);

    // rotate the frame to create a dynamic visual effect
    rotate(timeFrame, tempBuffer, frame, 0.02 * currentTime, 0.85, canvasWidthPx, canvasHeightPx);
    
    // scale the frame to hide edge artifacts
    scale(frame, tempBuffer, 1.35f, canvasWidthPx, canvasHeightPx);

    // reduce the bit depth of the frame if necessary
    if (bitDepth < 32) {
        reduceBitDepth(frame, frameSize, bitDepth);
    }

    // update the previous frame with the current frame data
    memcpy(prevFrame, frame, frameSize);

    // update the previous time and frame size for the next rendering cycle
    prevTime = currentTime;
    prevFrameSize = frameSize;
}

/**
 * Reserves and updates memory dynamically for rendering based on canvas size.
 *
 * @param canvasWidthPx  Canvas width in pixels.
 * @param canvasHeightPx Canvas height in pixels.
 * @param frame          Frame buffer to be updated.
 * @param frameSize      Size of the frame buffer.
 */
void reserveAndUpdateMemory(size_t canvasWidthPx, size_t canvasHeightPx, uint8_t *frame, size_t frameSize) {
    // check if the canvas size has changed and reinitialize buffers if necessary
    if (canvasWidthPx != lastCanvasWidthPx || canvasHeightPx != lastCanvasHeightPx) {
        clearFrame(frame, frameSize);
        if (prevFrame) {
            free(prevFrame);
        }
        prevFrame = (uint8_t *)malloc(frameSize);
        if (!prevFrame) {
            fprintf(stderr, "Failed to allocate prevFrame buffer\n");
            return;
        }
        lastCanvasWidthPx = canvasWidthPx;
        lastCanvasHeightPx = canvasHeightPx;

        // free and reallocate the temporary buffer if canvas size changes
        if (tempBuffer) {
            free(tempBuffer);
        }
        tempBuffer = (uint8_t *)malloc(frameSize);
        if (!tempBuffer) {
            fprintf(stderr, "Failed to allocate temporary buffer\n");
            return;
        }
        tempBufferSize = frameSize;
    }

    // allocate or reuse the prevFrame buffer
    if (!prevFrame || tempBufferSize < frameSize) {
        if (prevFrame) {
            free(prevFrame);
        }
        prevFrame = (uint8_t *)malloc(frameSize);
        if (!prevFrame) {
            fprintf(stderr, "Failed to allocate prevFrame buffer\n");
            return;
        }
    }

    // allocate or reuse the temporary buffer
    if (!tempBuffer || tempBufferSize < frameSize) {
        if (tempBuffer) {
            free(tempBuffer);
        }
        tempBuffer = (uint8_t *)malloc(frameSize);
        if (!tempBuffer) {
            fprintf(stderr, "Failed to allocate temporary buffer\n");
            return;
        }
        tempBufferSize = frameSize;
    }
}