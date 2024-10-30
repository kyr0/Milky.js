#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include "./video/log.c"

void render(
    uint8_t *canvas,                // Canvas buffer (RGBA format)
    size_t canvasWidthPx,           // Canvas width in pixels
    size_t canvasHeightPx,          // Canvas height in pixels
    const uint8_t *waveform,        // Waveform data array
    const uint8_t *spectrum,        // Spectrum data array
    size_t waveformLength,          // Length of the waveform data array
    size_t spectrumLength,          // Length of the spectrum data array
    uint8_t *msg                    // Message buffer
    // TODO: Geiss.ini encoded data
) {

    log(msg, "test");

    // Clear the canvas buffer (set all pixels to transparent black)
    size_t canvasSize = canvasWidthPx * canvasHeightPx * 4; // Each pixel has 4 components (RGBA)
    for (size_t i = 0; i < canvasSize; i += 4) {
        canvas[i + 0] = 0;   // Red
        canvas[i + 1] = 0;   // Green
        canvas[i + 2] = 0;   // Blue
        canvas[i + 3] = 0;   // Alpha (fully transparent)
    } 
   
    // *** Waveform Rendering ***

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

        // Get the waveform sample value (0-255)
        uint8_t sampleValue = waveform[i];

        // Map the sample value to a y-coordinate on the canvas
        // Center the waveform vertically and invert the y-axis (as image origin is at the top-left corner)
        int32_t y = halfCanvasHeight - ((int32_t)(sampleValue - 128) * halfCanvasHeight) / 128;

        // Clamp y-coordinate to canvas bounds
        if (y < 0) y = 0;
        if (y >= (int32_t)canvasHeightPx) y = canvasHeightPx - 1;

        // Set the pixel at (x, y) to white color
        size_t pixelIndex = (y * canvasWidthPx + x) * 4;
        canvas[pixelIndex + 0] = 255; // Red
        canvas[pixelIndex + 1] = 255; // Green
        canvas[pixelIndex + 2] = 255; // Blue
        canvas[pixelIndex + 3] = 255; // Alpha (fully opaque)
    }
}


    // *** Spectrum Rendering ***
    /*

    // Calculate the width of each bar in the spectrum
    float spectrumScaleX = (float)canvasWidth / spectrumLength;

    // Render the spectrum
    for (size_t i = 0; i < spectrumLength; i++) {
        // Get the spectrum value (0-255)
        uint8_t value = spectrum[i];

        // Calculate the height of the bar based on the spectrum value
        size_t barHeight = (size_t)((value * canvasHeight) / 255);

        // Calculate the x-coordinate range for the bar
        size_t xStart = (size_t)(i * spectrumScaleX);
        size_t xEnd = (size_t)((i + 1) * spectrumScaleX);

        // Clamp xEnd to canvas width
        if (xEnd > canvasWidth) {
            xEnd = canvasWidth;
        }

        // Draw the bar as a vertical rectangle
        for (size_t x = xStart; x < xEnd; x++) {
            for (size_t y = canvasHeight - barHeight; y < canvasHeight; y++) {
                size_t pixelIndex = (y * canvasWidth + x) * 4;
                canvas[pixelIndex + 0] = 0;    // Red
                canvas[pixelIndex + 1] = 255;  // Green (green bars)
                canvas[pixelIndex + 2] = 0;    // Blue
                canvas[pixelIndex + 3] = 255;  // Alpha (fully opaque)
            }
        }
    }
    */