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

/**
 * Initializes a low-pass biquad filter with a strong Q factor for sharp cutoff at 500 Hz.
 */
void initLowPassFilter(BiquadFilter *filter, float cutoffFreq, float sampleRate, float Q) {
    float omega = 2.0f * PI * cutoffFreq / sampleRate;
    float alpha = sinf(omega) / (2.0f * Q);
    float cos_omega = cosf(omega);
    
    // Biquad low-pass filter coefficients
    filter->a0 = (1.0f - cos_omega) / 2.0f;
    filter->a1 = 1.0f - cos_omega;
    filter->a2 = filter->a0;
    filter->b1 = -2.0f * cos_omega;
    filter->b2 = 1.0f - alpha;
    
    // Normalize coefficients
    float a0_inv = 1.0f / (1.0f + alpha);
    filter->a0 *= a0_inv;
    filter->a1 *= a0_inv;
    filter->a2 *= a0_inv;
    filter->b1 *= a0_inv;
    filter->b2 *= a0_inv;
    
    // Initialize delay elements
    filter->z1 = 0.0f;
    filter->z2 = 0.0f;
}

/**
 * Applies the biquad filter to a sample and returns the filtered output.
 */
float processSample(BiquadFilter *filter, float input) {
    float output = filter->a0 * input + filter->a1 * filter->z1 + filter->a2 * filter->z2
                   - filter->b1 * filter->z1 - filter->b2 * filter->z2;
    
    // Update delay elements
    filter->z2 = filter->z1;
    filter->z1 = input;

    return output;
}

/**
 * Applies the low-pass filter to an entire waveform.
 */
void applyLowPassFilter(BiquadFilter *filter, float *samples, size_t length) {
    for (size_t i = 0; i < length; i++) {
        samples[i] = processSample(filter, samples[i]);
    }
}

/**
 * Analyzes the given waveform and spectrum data to detect
 * significant energy spikes, which are indicative of beats.
 *
 * @param emphasizedWaveform Pointer to the waveform data array (8-bit unsigned integers).
 * @param spectrum Pointer to the spectrum data array.
 * @param waveformLength Length of the waveform data array.
 * @param spectrumLength Length of the spectrum data array.
 * @param sampleRate The sample rate of the audio data.
 */
void detectEnergySpike(
    const uint8_t *emphasizedWaveform,
    const uint8_t *spectrum,
    size_t waveformLength,
    size_t spectrumLength,
    size_t sampleRate
) {
    // Constants for adaptive energy and flux
    const float energy_alpha = 0.85f;          // Smoothing factor for energy
    const float flux_alpha = 0.85f;            // Smoothing factor for flux
    const float energy_threshold = 1.3f;       // Threshold for energy ratio
    const float flux_threshold = 1.4f;         // Threshold for flux ratio
    const float min_volume_threshold = 0.15f;  // Minimum volume threshold for detection

    // Initialize detection parameters and filter if not already done
    static BiquadFilter lpFilter;
    if (!energySpikeDetectionInitialized) {
        frequency_bin_width = sampleRate / (2.0f * spectrumLength);
        
        // Initialize low-pass filter for 500 Hz cutoff
        initLowPassFilter(&lpFilter, CUTOFF_FREQUENCY_HZ, sampleRate, 1.0f); // Q factor of 1.0 for strong cutoff

        // Determine the low-frequency maximum bin (under 500 Hz)
        max_bin = (size_t)(CUTOFF_FREQUENCY_HZ / frequency_bin_width);
        if (max_bin > spectrumLength) max_bin = spectrumLength;
        if (max_bin > MAX_SPECTRUM_LENGTH) max_bin = MAX_SPECTRUM_LENGTH;

        // Emphasize low frequencies in weights
        for (size_t i = 0; i < max_bin; i++) {
            float frequency = (i + 1) * frequency_bin_width;
            weights[i] = 1.0f / (frequency + 1e-6f); // Avoid division by zero
        }
        energySpikeDetectionInitialized = 1;
    }

    // Apply low-pass filter to the waveform
    float filtered_waveform[MAX_WAVEFORM_LENGTH];
    size_t length = (waveformLength < MAX_WAVEFORM_LENGTH) ? waveformLength : MAX_WAVEFORM_LENGTH;
    for (size_t i = 0; i < length; i++) {
        filtered_waveform[i] = processSample(&lpFilter, (float)emphasizedWaveform[i] - 128.0f); // Center the waveform data
    }

    // Calculate filtered energy using the low-pass filtered waveform
    float filtered_energy = 0.0f;
    for (size_t i = 0; i < length; i++) {
        filtered_energy += filtered_waveform[i] * filtered_waveform[i]; // Accumulate energy
    }

    float current_energy = sqrtf(filtered_energy / length); // Compute RMS energy
    
    // Apply a noise gate: skip detection if the signal is below the noise threshold
    if (current_energy < NOISE_GATE_THRESHOLD) {
        energySpikeDetected = 0;
        return; // Exit early for low-amplitude sections
    }

    // Update average energy using exponential moving average
    avg_energy = avg_energy * energy_alpha + current_energy * (1.0f - energy_alpha);
    float energy_ratio = current_energy / (avg_energy + 1e-6f); // Calculate energy ratio

    // Calculate spectral flux with adaptive frequency emphasis
    float spectral_flux = 0.0f;
    float sum_weights = 0.0f;
    size_t bins = (spectrumLength < MAX_SPECTRUM_LENGTH) ? spectrumLength : MAX_SPECTRUM_LENGTH;

    for (size_t i = 0; i < bins; i++) {
        float diff = (float)spectrum[i] - previous_spectrum[i]; // Spectrum difference
        previous_spectrum[i] = (float)spectrum[i]; // Update previous spectrum

        if (diff > 0) {
            spectral_flux += diff * weights[i]; // Positive flux
        }
        sum_weights += weights[i];
    }

    if (sum_weights > 0.0f) spectral_flux /= sum_weights; // Normalize spectral flux
    avg_flux = avg_flux * flux_alpha + spectral_flux * (1.0f - flux_alpha); // Update flux average
    float flux_ratio = spectral_flux / (avg_flux + 1e-6f); // Calculate flux ratio

    // Check cooldown counter before allowing a beat detection
    if (detectionCooldownCounter >= COOLDOWN_PERIOD &&
        energy_ratio > energy_threshold && 
        flux_ratio > flux_threshold && 
        current_energy > min_volume_threshold) 
    {
        printf("native:SIGNAL:SIG_BEAT_DETECTED\n"); // Signal beat detection
        energySpikeDetected = 1;
        detectionCooldownCounter = 0; // Reset cooldown counter after detection
    } else {
        energySpikeDetected = 0;
        detectionCooldownCounter++; // Increment counter when no detection occurs
    }
}
