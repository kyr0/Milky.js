#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>

// config/state
// #include "./preset.c"

// audio
#include "./audio/sound.c"
#include "./audio/energy.c"

// video
#include "./video/bitdepth.c"
#include "./video/transform.c"
#include "./video/draw.c"
#include "./video/palette.c"
#include "./video/effects/chaser.c"
#include "./video/blur.c"

// flag to check if lastFrame is initialized
static int isLastFrameInitialized = 0;

// global variable to store the previous time
size_t prevTime = 0;
size_t prevFrameSize = 0;
static float speedScalar = 0.01f;

// static buffer to be reused across render calls
static uint8_t *tempBuffer = NULL;
static uint8_t *prevFrame = NULL;
static size_t tempBufferSize = 0;
static size_t lastCanvasWidthPx = 0;
static size_t lastCanvasHeightPx = 0;

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