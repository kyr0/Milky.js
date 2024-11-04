#ifndef VIDEO_H
#define VIDEO_H

#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>

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
    size_t currentTime,             // Current time in milliseconds,
    size_t sampleRate               // Waveform sample rate (samples per second)
);

void reserveAndUpdateMemory(size_t canvasWidthPx, size_t canvasHeightPx,  uint8_t *frame, size_t frameSize);

#endif // VIDEO_H
