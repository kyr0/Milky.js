#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>

// #include "./preset.c"

#include "./audio/sound.c"
#include "./audio/energy.c"

#include "./video/bitdepth.c"
#include "./video/transform.c"
#include "./video/draw.c"
#include "./video/palette.c"
#include "./video/effects/chaser.c"
#include "./video/blur.c"

#define RESERVED_MEMORY_SIZE 2560 * 1400 * 4 // reserve memory

// global cache to store the last frame
static uint8_t prevFrame[RESERVED_MEMORY_SIZE];

// flag to check if lastFrame is initialized
static int isLastFrameInitialized = 0;

// global variable to store the previous time
size_t prevTime = 0;
static float speedScalar = 0.01f;

void render(
    uint8_t *frame,                 // Canvas frame buffer (RGBA format)
    size_t canvasWidthPx,           // Canvas width in pixels
    size_t canvasHeightPx,          // Canvas height in pixels
    const uint8_t *waveform,        // Waveform data array, 8-bit unsigned integers, 576 samples
    const uint8_t *spectrum,        // Spectrum data array
    size_t waveformLength,          // Length of the waveform data array
    size_t spectrumLength,          // Length of the spectrum data array
    uint8_t bitDepth,               // Bit depth of the rendering
    float *presetsBuffer,           // Preset data
    float speed,                    // Speed factor for the rendering
    size_t currentTime              // Current time in milliseconds
) {
    size_t frameSize = canvasWidthPx * canvasHeightPx * 4; // Each pixel has 4 components (RGBA)

    // ensure frameSize does not exceed reserved memory
    if (frameSize > RESERVED_MEMORY_SIZE) {
        fprintf(stderr, "Frame size exceeds reserved memory size\n");
        return;
    }

    // allocate a temporary buffer for local use
    uint8_t *tempBuffer = (uint8_t *)malloc(frameSize);
    if (!tempBuffer) {
        fprintf(stderr, "Failed to allocate temporary buffer\n");
        return;
    }

    // parse presets; NOT IN USE YET
    //parseFlattenedPresetBuffer(presetsBuffer, MAX_PRESETS * MAX_PROPERTY_COUNT_PER_PRESET);

    // test receiving some value for preset 1
    //float xCenterValue = getPresetPropertyByName(0, "x_center");
    //fprintf(stdout, "x_center value: %f\n", xCenterValue);

    float emphasizedWaveform[waveformLength];
    smoothBassEmphasizedWaveform(waveform, waveformLength, emphasizedWaveform, canvasWidthPx, 0.7f);

    // calculate timeFrame based on the difference between currentTime and prevTime
    float timeFrame = ((prevTime == 0) ? 0.01f : (currentTime - prevTime) / 1000.0f);

    // check if lastFrame is initialized using a separate flag
    if (!isLastFrameInitialized) {
        clearFrame(frame, frameSize);
        clearFrame(prevFrame, RESERVED_MEMORY_SIZE);
        isLastFrameInitialized = 1; 

    } else {
        speedScalar += speed;

        blurFrame(prevFrame, frameSize);
        
        preserveMassFade(prevFrame, tempBuffer, frameSize);

        // rotate the previous frame before copying it to the current frame
        //rotate(timeFrame, tempBuffer, prevFrame, 0.2, -8, canvasWidthPx, canvasHeightPx);

        // scale the rotated frame to fit the canvas (zoom in)
        //scale(prevFrame, 1.002f, canvasWidthPx, canvasHeightPx);
        
        // copy last frame's data to canvas buffer as a base to overdraw
        memcpy(tempBuffer, prevFrame, frameSize);
        memcpy(frame, tempBuffer, frameSize);
    }

    // colorizes the canvas based on a selected palette
    applyPaletteToCanvas(currentTime, frame, canvasWidthPx, canvasHeightPx);

    // render two different versions of the waveform with varying emphasis
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.85f, 2, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.95f, 1, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 5.0f, 0, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.95f, -1, 1);

    // spectral audio energy spike detection
    detectEnergySpike(waveform, spectrum, waveformLength, spectrumLength, 44100);

    // chasers effect rendering
    renderChasers(speedScalar, frame, speed * 20, 2, canvasWidthPx, canvasHeightPx, 42, 2);

    // rotate the previous frame before copying it to the current frame
    rotate(timeFrame, tempBuffer, frame, 0.02 * currentTime, 0.85, canvasWidthPx, canvasHeightPx);
    
    // scale in to hide the edge artifacts
    scale(frame, tempBuffer, 1.35f, canvasWidthPx, canvasHeightPx);

    // reduce bit depth before saving the frame
    if (bitDepth < 32) {
        reduceBitDepth(frame, frameSize, bitDepth);
    }

    // boxBlurAndPerspective(frame, prevFrame , canvasWidthPx, canvasHeightPx);
    // boxBlurAndPerspective2(frame, prevFrame , canvasWidthPx, canvasHeightPx);

    // update the cache with the new frame data, limited to RESERVED_MEMORY_SIZE
    memcpy(prevFrame, frame, frameSize);

    // free the temporary buffer
    free(tempBuffer);

    prevTime = currentTime; // update prevTime for the next frame
}
