#ifndef SOUND_H
#define SOUND_H

#include <stdint.h>
#include <string.h>
#include <math.h>
#include <stddef.h>
#include <stdlib.h>

// Global variable to store the average offset introduced by smoothing
extern float averageOffset;

// Cache for the last rendered waveform
extern float cachedWaveform[2048];

// Static variable to keep track of frame count
extern int frameCounter;

// Function to smooth the bass-emphasized waveform
void smoothBassEmphasizedWaveform(
    const uint8_t *waveform, 
    size_t waveformLength, 
    float *formattedWaveform, 
    size_t canvasWidthPx,
    float volumeScale
);

// Function to set a pixel in the frame buffer
void setPixel(
    uint8_t *frame, 
    size_t width, 
    size_t x, 
    size_t y, 
    uint8_t r, 
    uint8_t g, 
    uint8_t b, 
    uint8_t a
);

// Function to render a simple waveform with specified parameters
void renderWaveformSimple(
    float timeFrame,
    uint8_t *frame,
    size_t canvasWidthPx,
    size_t canvasHeightPx,
    const float *emphasizedWaveform,
    size_t waveformLength,
    float globalAlphaFactor,
    int32_t yOffset,
    int32_t lineThickness
);

#endif // SOUND_H