#include <stddef.h>
#include <stdint.h>
#include <string.h>

void smoothBassEmphasizedWaveform(
    const uint8_t *waveform, 
    size_t waveformLength, 
    float *formattedWaveform, 
    size_t canvasWidthPx
) {
    // smoothing shows the bass hits more than treble
    for (size_t i = 0; i < waveformLength - 2; i++) {
        formattedWaveform[i] = 0.8 * waveform[i] + 0.2 * waveform[i + 2];
    }
}

void renderWaveform(
    uint8_t *canvas,
    size_t canvasWidthPx,
    size_t canvasHeightPx,
    const float *emphasizedWaveform,
    size_t waveformLength
) {
    // Calculate horizontal scaling factor to map waveform samples to canvas x-coordinates
    float waveformScaleX = (float)canvasWidthPx / waveformLength;

    // Precompute half of the canvas height for vertical centering
    int32_t halfCanvasHeight = (int32_t)(canvasHeightPx / 2);

    // Render the waveform
    for (size_t i = 0; i < waveformLength; i++) {
        // Map waveform sample index to canvas x-coordinate
        size_t x = (size_t)(i * waveformScaleX);
        if (x >= canvasWidthPx) {
            x = canvasWidthPx - 1;
        }

        // Get the formatted waveform sample value
        float sampleValue = emphasizedWaveform[i];

        // Map the sample value to a y-coordinate on the canvas
        // Center the waveform vertically and invert the y-axis (as image origin is at the top-left corner)
        int32_t y = halfCanvasHeight - ((int32_t)(sampleValue - 128) * halfCanvasHeight) / 128;

        // clamp y-coordinate to canvas bounds
        if (y < 0) y = 0;
        if (y >= (int32_t)canvasHeightPx) y = canvasHeightPx - 1;

        // set the pixel at (x, y) to white color using setPixel function
        setPixel(canvas, canvasWidthPx, x, y, 255, 255, 255, 255);
    }
}