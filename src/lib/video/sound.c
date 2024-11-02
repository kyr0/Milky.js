#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <math.h>
#include <stdint.h>
#include <stddef.h>

// Global variable to store the average offset introduced by smoothing
static float averageOffset = 0.0f;

void smoothBassEmphasizedWaveform(
    const uint8_t *waveform, 
    size_t waveformLength, 
    float *formattedWaveform, 
    size_t canvasWidthPx,
    float volumeScale // added volume scaling factor
) {
    float totalOffset = 0.0f;
    // smoothing shows the bass hits more than treble
    for (size_t i = 0; i < waveformLength - 2; i++) {
        float smoothedValue = volumeScale * (0.8 * waveform[i] + 0.2 * waveform[i + 2]);
        formattedWaveform[i] = smoothedValue;
        totalOffset += smoothedValue - waveform[i];
    }
    // Calculate the average offset
    averageOffset = totalOffset / (waveformLength - 2);
}

void setPixel(uint8_t *frame, size_t width, size_t x, size_t y, uint8_t r, uint8_t g, uint8_t b, uint8_t a);

// Cache for the last rendered waveform
static float cachedWaveform[2048]; // Assuming a fixed size for simplicity

// static variable to keep track of frame count
static int frameCounter = 0;

void renderWaveformSimple(
    float timeFrame,
    uint8_t *frame,
    size_t canvasWidthPx,
    size_t canvasHeightPx,
    const float *emphasizedWaveform, // precomputed emphasized waveform, 576 samples
    size_t waveformLength,
    float globalAlphaFactor,
    int32_t yOffset, // new parameter for y offset
    int32_t lineThickness // new parameter for line thickness
) {
    // Calculate horizontal scaling factor to map waveform samples to canvas x-coordinates
    float waveformScaleX = (float)canvasWidthPx / waveformLength;

    // Correct the vertical centering by using the full canvas height
    int32_t halfCanvasHeight = (int32_t)(canvasHeightPx / 2);

    // Update the cached waveform every 4 frames
    if (frameCounter % 2 == 0) {
        memcpy(cachedWaveform, emphasizedWaveform, waveformLength * sizeof(float));
    }
    frameCounter++;

    // Render only the waveform pixels
    for (size_t i = 0; i < waveformLength - 1; i++) {
        // Map waveform sample index to canvas x-coordinate
        size_t x1 = (size_t)(i * waveformScaleX);
        size_t x2 = (size_t)((i + 1) * waveformScaleX);

        if (x1 >= canvasWidthPx) x1 = canvasWidthPx - 1;
        if (x2 >= canvasWidthPx) x2 = canvasWidthPx - 1;

        // Get the formatted waveform sample values
        float sampleValue1 = cachedWaveform[i];
        float sampleValue2 = cachedWaveform[i + 1];

        // Adjust the y-coordinate calculation to account for the smoothing offset and yOffset
        // Reduce the height of the waveform by scaling down the sample values
        int32_t y1 = halfCanvasHeight - ((int32_t)((sampleValue1 - 128 - averageOffset) * canvasHeightPx) / 512) + yOffset;
        int32_t y2 = halfCanvasHeight - ((int32_t)((sampleValue2 - 128 - averageOffset) * canvasHeightPx) / 512) + yOffset;

        // Calculate alpha intensity with reduced impact for lower sample values
        uint8_t alpha1 = (uint8_t)(255 * (1.0f - (sampleValue1 / 255.0f)) * globalAlphaFactor);
        uint8_t alpha2 = (uint8_t)(255 * (1.0f - (sampleValue2 / 255.0f)) * globalAlphaFactor);

        // Interpolate between the two points
        int dx = (int)x2 - (int)x1;
        int dy = (int)y2 - (int)y1;
        int steps = (abs(dx) > abs(dy)) ? abs(dx) : abs(dy);

        for (int j = 0; j <= steps; j++) {
            float t = (float)j / steps;
            int x = (int)(x1 + t * dx);
            int y = (int)(y1 + t * dy);
            uint8_t alpha = (uint8_t)(alpha1 + t * (alpha2 - alpha1));

            // Draw the line with the specified thickness
            for (int thicknessOffset = -lineThickness / 2; thicknessOffset <= lineThickness / 2; thicknessOffset++) {
                int currentY = y + thicknessOffset;
                uint8_t finalAlpha = alpha;

                // Apply anti-aliasing only at the top and bottom edges
                if (thicknessOffset == -lineThickness / 2 || thicknessOffset == lineThickness / 2) {
                    finalAlpha = (uint8_t)(finalAlpha * 0.5f); // 50% of color value, alpha
                }

                // Set the pixel at (x, currentY) with interpolated alpha intensity using setPixel function
                setPixel(frame, canvasWidthPx, x, currentY, 255, 255, 255, finalAlpha);
            }
        }
    }
}