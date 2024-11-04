#include "video.h"

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
static int milky_videoIsLastFrameInitialized = 0;

// global variable to store the previous time
static size_t milky_videoPrevTime = 0;
static size_t milky_videoPrevFrameSize = 0;
static float milky_videoSpeedScalar = 0.01f;

// static buffer to be reused across render calls
static uint8_t *milky_videoTempBuffer = NULL;
static uint8_t *milky_videoPrevFrame = NULL;
static size_t milky_videoTempBufferSize = 0;
static size_t milky_videoLastCanvasWidthPx = 0;
static size_t milky_videoLastCanvasHeightPx = 0;

/**
 * Renders one visual frame based on audio waveform and spectrum data.
 *
 * @param frame           Canvas frame buffer (RGBA format).
 * @param canvasWidthPx   Canvas width in pixels.
 * @param canvasHeightPx  Canvas height in pixels.
 * @param waveform        Waveform data array, 8-bit unsigned integers, 576 samples.
 * @param spectrum        Spectrum data array.
 * @param waveformLength  Length of the waveform data array.
 * @param spectrumLength  Length of the spectrum data array.
 * @param bitDepth        Bit depth of the rendering.
 * @param presetsBuffer   Preset data.
 * @param speed           Speed factor for the rendering.
 * @param currentTime     Current time in milliseconds.
 * @param sampleRate      Waveform sample rate (samples per second)
 */
void render(
    uint8_t *frame,
    size_t canvasWidthPx,
    size_t canvasHeightPx,
    const uint8_t *waveform,
    const uint8_t *spectrum,
    size_t waveformLength,
    size_t spectrumLength,
    uint8_t bitDepth,
    float *presetsBuffer,
    float speed,
    size_t currentTime,
    size_t sampleRate
) {
    // calculate the size of the frame buffer based on canvas dimensions and RGBA format
    size_t frameSize = canvasWidthPx * canvasHeightPx * 4;

    // initialize previous frame size if not set
    if (milky_videoPrevFrameSize == 0) {
        milky_videoPrevFrameSize = frameSize;
    }

    // ensure memory is allocated and updated for the current canvas size
    reserveAndUpdateMemory(canvasWidthPx, canvasHeightPx, frame, frameSize);

    // create an array to store the emphasized waveform
    float emphasizedWaveform[waveformLength];

    // apply smoothing and bass emphasis to the waveform
    smoothBassEmphasizedWaveform(waveform, waveformLength, emphasizedWaveform, canvasWidthPx, 0.7f);

    // calculate the time frame for rendering based on the elapsed time
    float timeFrame = ((milky_videoPrevTime == 0) ? 0.01f : (currentTime - milky_videoPrevTime) / 1000.0f);

    // check if the last frame is initialized; if not, clear the frames
    if (!milky_videoIsLastFrameInitialized) {
        clearFrame(frame, frameSize);
        clearFrame(milky_videoPrevFrame, milky_videoPrevFrameSize);
        milky_videoIsLastFrameInitialized = 1;
    } else {
        // update speed scalar with the current speed
        milky_videoSpeedScalar += speed;

        // apply blur effect to the previous frame
        blurFrame(milky_videoPrevFrame, frameSize);
        
        // preserve mass fade effect on the temporary buffer
        preserveMassFade(milky_videoPrevFrame, milky_videoTempBuffer, frameSize);

        // copy the previous frame to the current frame as a base for drawing
        memcpy(milky_videoTempBuffer, milky_videoPrevFrame, frameSize);
        memcpy(frame, milky_videoTempBuffer, frameSize);
    }

    // apply color palette to the canvas based on the current time
    applyPaletteToCanvas(currentTime, frame, canvasWidthPx, canvasHeightPx);

    // render the waveform on the canvas with different emphasis levels
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.85f, 2, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.95f, 1, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 5.0f, 0, 1);
    renderWaveformSimple(timeFrame, frame, canvasWidthPx, canvasHeightPx, emphasizedWaveform, waveformLength, 0.95f, -1, 1);

    // detect energy spikes in the audio data
    detectEnergySpike(waveform, spectrum, waveformLength, spectrumLength, sampleRate);

    // render chasers effect on the frame
    renderChasers(milky_videoSpeedScalar, frame, speed * 20, 2, canvasWidthPx, canvasHeightPx, 42, 2);

    // rotate the frame to create a dynamic visual effect
    rotate(timeFrame, milky_videoTempBuffer, frame, 0.02 * currentTime, 0.85, canvasWidthPx, canvasHeightPx);
    
    // scale the frame to hide edge artifacts
    scale(frame, milky_videoTempBuffer, 1.35f, canvasWidthPx, canvasHeightPx);

    // reduce the bit depth of the frame if necessary
    if (bitDepth < 32) {
        reduceBitDepth(frame, frameSize, bitDepth);
    }

    // update the previous frame with the current frame data
    memcpy(milky_videoPrevFrame, frame, frameSize);

    // update the previous time and frame size for the next rendering cycle
    milky_videoPrevTime = currentTime;
    milky_videoPrevFrameSize = frameSize;
}

/**
 * Reserves and updates memory dynamically for rendering based on canvas size.
 *
 * @param canvasWidthPx  Canvas width in pixels.
 * @param canvasHeightPx Canvas height in pixels.
 * @param frame          Frame buffer to be updated.
 * @param frameSize      Size of the frame buffer.
 */
void reserveAndUpdateMemory(size_t canvasWidthPx, size_t canvasHeightPx, uint8_t *frame, size_t frameSize) {
    // check if the canvas size has changed and reinitialize buffers if necessary
    if (canvasWidthPx != milky_videoLastCanvasWidthPx || canvasHeightPx != milky_videoLastCanvasHeightPx) {
        clearFrame(frame, frameSize);
        if (milky_videoPrevFrame) {
            free(milky_videoPrevFrame);
        }
        milky_videoPrevFrame = (uint8_t *)malloc(frameSize);
        if (!milky_videoPrevFrame) {
            fprintf(stderr, "Failed to allocate prevFrame buffer\n");
            return;
        }
        milky_videoLastCanvasWidthPx = canvasWidthPx;
        milky_videoLastCanvasHeightPx = canvasHeightPx;

        // free and reallocate the temporary buffer if canvas size changes
        if (milky_videoTempBuffer) {
            free(milky_videoTempBuffer);
        }
        milky_videoTempBuffer = (uint8_t *)malloc(frameSize);
        if (!milky_videoTempBuffer) {
            fprintf(stderr, "Failed to allocate temporary buffer\n");
            return;
        }
        milky_videoTempBufferSize = frameSize;
    }

    // allocate or reuse the prevFrame buffer
    if (!milky_videoPrevFrame || milky_videoTempBufferSize < frameSize) {
        if (milky_videoPrevFrame) {
            free(milky_videoPrevFrame);
        }
        milky_videoPrevFrame = (uint8_t *)malloc(frameSize);
        if (!milky_videoPrevFrame) {
            fprintf(stderr, "Failed to allocate prevFrame buffer\n");
            return;
        }
    }

    // allocate or reuse the temporary buffer
    if (!milky_videoTempBuffer || milky_videoTempBufferSize < frameSize) {
        if (milky_videoTempBuffer) {
            free(milky_videoTempBuffer);
        }
        milky_videoTempBuffer = (uint8_t *)malloc(frameSize);
        if (!milky_videoTempBuffer) {
            fprintf(stderr, "Failed to allocate temporary buffer\n");
            return;
        }
        milky_videoTempBufferSize = frameSize;
    }
}
