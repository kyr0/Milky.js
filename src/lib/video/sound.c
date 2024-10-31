#include <stddef.h>
#include <stdint.h>
#include <string.h>

void smoothBassEmphasizedWaveform(
    const uint8_t *waveform, 
    size_t waveformLength, 
    float *formattedWaveform, 
    size_t canvasWidthPx,
    float volumeScale // added volume scaling factor
) {
    // smoothing shows the bass hits more than treble
    for (size_t i = 0; i < waveformLength - 2; i++) {
        formattedWaveform[i] = volumeScale * (0.8 * waveform[i] + 0.2 * waveform[i + 2]);
    }
}

#include <math.h>
#include <stdint.h>
#include <stddef.h>

void setPixel(uint8_t *frame, size_t width, size_t x, size_t y, uint8_t r, uint8_t g, uint8_t b, uint8_t a);

void renderWaveform(
    float timeFrame,
    uint8_t *frame,
    size_t canvasWidthPx,
    size_t canvasHeightPx,
    const float *emphasizedWaveform, // precomputed emphasized waveform, 576 samples
    size_t waveformLength
) {
    // Calculate horizontal scaling factor to map waveform samples to canvas x-coordinates
    float waveformScaleX = (float)canvasWidthPx / waveformLength;

    // Precompute half of the canvas height for vertical centering
    int32_t halfCanvasHeight = (int32_t)(canvasHeightPx / 2);

    // Apply scaling to timeFrame for controlled motion
    float adjustedFrame = timeFrame * 0.55f / (0.08f * 20.0f);

    // Render the waveform with dynamic movement
    for (size_t i = 0; i < waveformLength; i++) {
        // Map waveform sample index to canvas x-coordinate with added movement
        size_t x = (size_t)(i * waveformScaleX + 20 * cosf(adjustedFrame * 0.1102f + i * 0.05f));
        if (x >= canvasWidthPx) {
            x = canvasWidthPx - 1;
        }

        // Get the formatted waveform sample value
        float sampleValue = emphasizedWaveform[i];

        // Map the sample value to a y-coordinate with dynamic warping
        int32_t y = halfCanvasHeight - ((int32_t)(sampleValue - 128) * halfCanvasHeight) / 128;

        // Add time-based movement to the y-coordinate to introduce a warping effect
        y += (int32_t)(10 * sinf(adjustedFrame * 0.1715f + i * 0.07f));

        // Clamp y-coordinate to canvas bounds
        if (y < 0) y = 0;
        if (y >= (int32_t)canvasHeightPx) y = canvasHeightPx - 1;

        // Set the pixel at (x, y) to white color using setPixel function
        setPixel(frame, canvasWidthPx, x, y, 255, 255, 255, 255);
    }
}


/* non-trigonometric 
void renderWaveform(
    uint8_t *frame,
    size_t canvasWidthPx,
    size_t canvasHeightPx,
    const float *emphasizedWaveform, // precomputed emphasized waveform, 576 samples
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
        setPixel(frame, canvasWidthPx, x, y, 255, 255, 255, 255);
    }
}
*/