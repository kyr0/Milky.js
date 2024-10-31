#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include "./video/log.c"
#include "./video/preset.c"
#include "./video/draw.c"
#include "./video/sound.c"
#include "./video/warp.c"

void render(
    uint8_t *canvas,                // Canvas buffer (RGBA format)
    size_t canvasWidthPx,           // Canvas width in pixels
    size_t canvasHeightPx,          // Canvas height in pixels
    const uint8_t *waveform,        // Waveform data array, 8-bit unsigned integers, 576 samples
    const uint8_t *spectrum,        // Spectrum data array
    size_t waveformLength,          // Length of the waveform data array
    size_t spectrumLength,          // Length of the spectrum data array
    uint8_t bitDepth,               // Bit depth of the rendering
    uint8_t *msg,                   // Message buffer
    float *presetsBuffer            // Preset data
) {
    size_t canvasSize = canvasWidthPx * canvasHeightPx * 4; // Each pixel has 4 components (RGBA)
    
    // parse presets
    parseFlattenedPresetBuffer(presetsBuffer, MAX_PRESETS * MAX_PROPERTY_COUNT_PER_PRESET);

    // test receiving some value for preset 1
    float xCenterValue = getPresetPropertyByName(0, "x_center");
    consoleLog(msg, "x_center value: %f", xCenterValue);

    float emphasizedWaveform[waveformLength];
    smoothBassEmphasizedWaveform(waveform, waveformLength, emphasizedWaveform, canvasWidthPx);

    clearCanvas(canvas, canvasSize);

    renderWaveform(canvas, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength);

    // Create a temporary buffer to store the warped image
    uint8_t *warpedCanvas = (uint8_t *)malloc(canvasSize);
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

/*
    initializeWarpMap(warpMap, canvasWidthPx, canvasHeightPx);

    // Apply the warp using the warp map
    warpFrame(canvas, warpedCanvas, warpMap, canvasWidthPx, canvasHeightPx);

    // Copy the warped image back to the original canvas
    memcpy(canvas, warpedCanvas, canvasSize);
*/

    // Free allocated memory
    free(warpedCanvas);
    free(warpMap);
}