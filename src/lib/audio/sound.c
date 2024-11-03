#include "sound.h"

// Global variable to store the average offset introduced by smoothing
float averageOffset = 0.0f;

// Cache for the last rendered waveform
float cachedWaveform[2048]; // Assuming a fixed size for simplicity

// static variable to keep track of frame count
int frameCounter = 0;

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
    // pre-calculate constants to avoid repeated calculations
    float waveformScaleX = (float)canvasWidthPx / waveformLength;
    int32_t halfCanvasHeight = (int32_t)(canvasHeightPx / 2);
    float inverse255 = 1.0f / 255.0f;

    // update the cached waveform every 4 frames
    if (frameCounter % 2 == 0) {
        memcpy(cachedWaveform, emphasizedWaveform, waveformLength * sizeof(float));
    }
    frameCounter++;

    // render only the waveform pixels
    for (size_t i = 0; i < waveformLength - 1; i++) {
        // map waveform sample index to canvas x-coordinate
        size_t x1 = (size_t)(i * waveformScaleX);
        size_t x2 = (size_t)((i + 1) * waveformScaleX);

        x1 = (x1 >= canvasWidthPx) ? canvasWidthPx - 1 : x1;
        x2 = (x2 >= canvasWidthPx) ? canvasWidthPx - 1 : x2;

        // get the formatted waveform sample values
        float sampleValue1 = cachedWaveform[i];
        float sampleValue2 = cachedWaveform[i + 1];

        // adjust the y-coordinate calculation to account for the smoothing offset and yOffset
        int32_t y1 = halfCanvasHeight - ((int32_t)((sampleValue1 - 128 - averageOffset) * canvasHeightPx) / 512) + yOffset;
        int32_t y2 = halfCanvasHeight - ((int32_t)((sampleValue2 - 128 - averageOffset) * canvasHeightPx) / 512) + yOffset;

        // calculate alpha intensity with reduced impact for lower sample values
        uint8_t alpha1 = (uint8_t)(255 * (1.0f - (sampleValue1 * inverse255)) * globalAlphaFactor);
        uint8_t alpha2 = (uint8_t)(255 * (1.0f - (sampleValue2 * inverse255)) * globalAlphaFactor);

        // interpolate between the two points
        int dx = (int)x2 - (int)x1;
        int dy = (int)y2 - (int)y1;
        int steps = (abs(dx) > abs(dy)) ? abs(dx) : abs(dy);

        float stepFactor = 1.0f / steps;
        float t = 0.0f;
        for (int j = 0; j <= steps; j++, t += stepFactor) {
            int x = (int)(x1 + t * dx);
            int y = (int)(y1 + t * dy);
            uint8_t alpha = (uint8_t)(alpha1 + t * (alpha2 - alpha1));

            // draw the line with the specified thickness
            int halfThickness = lineThickness / 2;
            for (int thicknessOffset = -halfThickness; thicknessOffset <= halfThickness; thicknessOffset++) {
                int currentY = y + thicknessOffset;
                uint8_t finalAlpha = alpha;

                // apply anti-aliasing only at the top and bottom edges
                if (thicknessOffset == -halfThickness || thicknessOffset == halfThickness) {
                    finalAlpha = (uint8_t)(finalAlpha * 0.5f); // 50% of color value, alpha
                }

                // set the pixel at (x, currentY) with interpolated alpha intensity using setPixel function
                setPixel(frame, canvasWidthPx, x, currentY, 255, 255, 255, finalAlpha);
            }
        }
    }
}