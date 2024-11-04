#ifndef ENERGY_H
#define ENERGY_H

#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

#define MILKY_MAX_SPECTRUM_LENGTH 1024
#define MILKY_MAX_WAVEFORM_LENGTH 1024
#define MILKY_CUTOFF_FREQUENCY_HZ 500
#define MILKY_ADAPTIVE_SCALE_THRESHOLD 0.75f // Adaptive threshold for selecting dominant scales
#define MILKY_NOISE_GATE_THRESHOLD 0.5f     // Minimum energy threshold for beat detection
#define MILKY_COOLDOWN_PERIOD 3            // Minimum number of calls between detections
#define MILKY_PI 3.14159265358979323846

extern int milky_energyEnergySpikeDetected;

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

#endif // ENERGY_H
