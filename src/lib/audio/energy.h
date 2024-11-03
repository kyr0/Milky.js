#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

#define MAX_SPECTRUM_LENGTH 1024
#define MAX_WAVEFORM_LENGTH 1024
#define CUTOFF_FREQUENCY_HZ 500
#define ADAPTIVE_SCALE_THRESHOLD 0.75f // Adaptive threshold for selecting dominant scales
#define NOISE_GATE_THRESHOLD 0.5f     // Minimum energy threshold for beat detection
#define COOLDOWN_PERIOD 3            // Minimum number of calls between detections

// State preservation across function calls
static float avg_energy = 0.0f;
static float avg_flux = 0.0f;
static int energySpikeDetected = 0;
static int detectionCooldownCounter = COOLDOWN_PERIOD; // Counter for cooldown period
static float previous_spectrum[MAX_SPECTRUM_LENGTH] = {0};
static float weights[MAX_SPECTRUM_LENGTH] = {0};
static size_t max_bin = 0;
static float frequency_bin_width = 0.0f;
static int energySpikeDetectionInitialized = 0;

#define PI 3.14159265358979323846

typedef struct {
    float a0, a1, a2, b1, b2; // Filter coefficients
    float z1, z2;             // Filter delay elements
} BiquadFilter;


void initLowPassFilter(BiquadFilter *filter, float cutoffFreq, float sampleRate, float Q);
float processSample(BiquadFilter *filter, float input);
void applyLowPassFilter(BiquadFilter *filter, float *samples, size_t length);
void detectEnergySpike(
    const uint8_t *emphasizedWaveform,
    const uint8_t *spectrum,
    size_t waveformLength,
    size_t spectrumLength,
    size_t sampleRate
);