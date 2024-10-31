#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>

#include "./video/beat.c"
#include "./video/preset.c"
#include "./video/draw.c"
#include "./video/sound.c"
#include "./video/warp.c"
#include "./video/palette.c"
#include "./video/effects/chaser.c"

// local variable to track if it's the initial render
static int isInitialRender = 1;  
#define SPEED 0.6f
float timeFrame = SPEED;


void render(
    uint8_t *frame,                 // Canvas frame buffer (RGBA format)
    uint8_t *prevFrame,             // Previous canvas frame buffer (RGBA format, backbuffer)
    size_t canvasWidthPx,           // Canvas width in pixels
    size_t canvasHeightPx,          // Canvas height in pixels
    const uint8_t *waveform,        // Waveform data array, 8-bit unsigned integers, 576 samples
    const uint8_t *spectrum,        // Spectrum data array
    size_t waveformLength,          // Length of the waveform data array
    size_t spectrumLength,          // Length of the spectrum data array
    uint8_t bitDepth,               // Bit depth of the rendering
    float *presetsBuffer            // Preset data
) {
    size_t frameSize = canvasWidthPx * canvasHeightPx * 4; // Each pixel has 4 components (RGBA)
  
    detectBeats(waveform, spectrum, waveformLength, spectrumLength);

    // parse presets
    parseFlattenedPresetBuffer(presetsBuffer, MAX_PRESETS * MAX_PROPERTY_COUNT_PER_PRESET);

    // test receiving some value for preset 1
    float xCenterValue = getPresetPropertyByName(0, "x_center");
    //fprintf(stdout, "x_center value: %f\n", xCenterValue);

    float emphasizedWaveform[waveformLength];
    smoothBassEmphasizedWaveform(waveform, waveformLength, emphasizedWaveform, canvasWidthPx, 1.2f);

    if (isInitialRender) {
        clearFrame(frame, frameSize);
        isInitialRender = 0;
    } else {
        timeFrame += SPEED;

        // Copy last frame's data to canvas buffer as a base to overdraw
        memcpy(frame, prevFrame, frameSize);
    
        // Apply a slight fade to simulate decay and create trails
        for (size_t i = 0; i < frameSize; i += 4) {
            frame[i] = (uint8_t)(frame[i] * 0.95);         // R
            frame[i + 1] = (uint8_t)(frame[i + 1] * 0.95); // G
            frame[i + 2] = (uint8_t)(frame[i + 2] * 0.95); // B
            // TODO: Alpha channel could be used for transparency effects
        }
    }

    generatePalette();    

    renderChasers(timeFrame, frame, 1.5, 2, canvasWidthPx, canvasHeightPx, 42);
    renderWaveform(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength);

    // Dithering after effects are rendered
    //applyDitheringAcrossCanvas(frame, canvasWidthPx, canvasHeightPx);

    // Copy the result back to prevFrame for the next render cycle if needed
    memcpy(prevFrame, frame, frameSize);
}



/*

    // Create a temporary buffer to store the warped image
    uint8_t *warpedCanvas = (uint8_t *)malloc(frameSize);
    if (!warpedCanvas) {
        consoleLog(msg, "Failed to allocate memory for warped canvas");
        return;
    }

    // Initialize warp map (this should be precomputed in practice)
    WarpMapEntry *warpMap = (WarpMapEntry *)malloc(canvasWidthPx * canvasHeightPx * sizeof(WarpMapEntry));
    if (!warpMap) {
        consoleLog(msg, "Failed to allocate memory for warp map");
        free(warpedCanvas);
        return;
    }

    initializeWarpMap(warpMap, canvasWidthPx, canvasHeightPx);

    // Apply the warp using the warp map
    warpFrame(canvas, warpedCanvas, warpMap, canvasWidthPx, canvasHeightPx);

    // Copy the warped image back to the original canvas
    memcpy(canvas, warpedCanvas, canvasSize);


    // Free allocated memory
    free(warpedCanvas);
    free(warpMap);
    */

