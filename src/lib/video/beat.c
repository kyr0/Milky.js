#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

#define MAX_SPECTRUM_LENGTH 1024
#define MAX_WAVEFORM_LENGTH 1024

// Global static variables for state preservation
static float avg_energy = 0.0f;
static float avg_flux = 0.0f;
static float previous_spectrum[MAX_SPECTRUM_LENGTH] = {0};
static float prev_filtered_sample1 = 0.0f;
static float prev_filtered_sample2 = 0.0f;
static float prev_output1 = 0.0f;
static float prev_output2 = 0.0f;

// Precomputed filter coefficients for second-order Butterworth low-pass filter
static float b0;
static float b1;
static float b2;
static float a1;
static float a2;

// Precompute constants for spectral flux calculation
static size_t max_bin = 0;
static float frequency_bin_width = 0.0f;
static float weights[MAX_SPECTRUM_LENGTH] = {0};

// Initialization flag
static int beatDetectionInitialized = 0;

void detectBeats(
    const uint8_t *emphasizedWaveform,
    const uint8_t *spectrum,
    size_t waveformLength,
    size_t spectrumLength
) {
    // Constants
    const float energy_alpha = 0.85f;          // Smoothing factor for energy
    const float flux_alpha = 0.85f;            // Smoothing factor for spectral flux
    const float energy_threshold = 1.4f;       // Threshold factor for energy
    const float flux_threshold = 1.4f;         // Threshold factor for spectral flux

    // Sampling rate and cutoff frequency
    const float sample_rate = 44100.0f;        // Adjust to actual sampling rate
    const float cutoff_frequency = 400.0f;     // Cutoff frequency for low-pass filter

    // Perform initialization only once
    if (!beatDetectionInitialized) {
        // Precompute filter coefficients
        const float pi = 3.14159265f;
        float omega_c = 2.0f * pi * cutoff_frequency / sample_rate;
        float cos_omega_c = cosf(omega_c);
        float sin_omega_c = sinf(omega_c);
        float alpha = sin_omega_c / (2.0f * sqrtf(2.0f)); // Q factor of sqrt(2)/2 for Butterworth

        float a0 = 1.0f + alpha;
        a1 = -2.0f * cos_omega_c / a0;
        a2 = (1.0f - alpha) / a0;
        b0 = ((1.0f - cos_omega_c) / 2.0f) / a0;
        b1 = (1.0f - cos_omega_c) / a0;
        b2 = b0;

        // Precompute frequency bin width and weights
        frequency_bin_width = sample_rate / (2.0f * spectrumLength); // Assuming spectrumLength is half of FFT size

        // Determine the number of bins corresponding to cutoff frequency
        max_bin = (size_t)(cutoff_frequency / frequency_bin_width);
        if (max_bin > spectrumLength) {
            max_bin = spectrumLength;
        }
        if (max_bin > MAX_SPECTRUM_LENGTH) {
            max_bin = MAX_SPECTRUM_LENGTH;
        }

        // Precompute weights for spectral flux
        for (size_t i = 0; i < max_bin; i++) {
            float frequency = (i + 1) * frequency_bin_width; // Avoid zero frequency bin
            weights[i] = 1.0f / (frequency + 1e-6f); // Emphasize low frequencies
        }

        beatDetectionInitialized = 1;
    }

    // Apply second-order low-pass filter to the waveform
    float filtered_energy = 0.0f;
    size_t length = (waveformLength < MAX_WAVEFORM_LENGTH) ? waveformLength : MAX_WAVEFORM_LENGTH;

    // Loop unrolling by factor of 4
    size_t i = 0;
    for (; i + 3 < length; i += 4) {
        float samples[4];
        float filtered_samples[4];

        // Load and center samples
        samples[0] = (float)emphasizedWaveform[i] - 128.0f;
        samples[1] = (float)emphasizedWaveform[i + 1] - 128.0f;
        samples[2] = (float)emphasizedWaveform[i + 2] - 128.0f;
        samples[3] = (float)emphasizedWaveform[i + 3] - 128.0f;

        // Filter sample 0
        filtered_samples[0] = b0 * samples[0] + b1 * prev_filtered_sample1 + b2 * prev_filtered_sample2
                              - a1 * prev_output1 - a2 * prev_output2;
        filtered_energy += filtered_samples[0] * filtered_samples[0];

        // Update previous samples and outputs
        prev_filtered_sample2 = prev_filtered_sample1;
        prev_filtered_sample1 = samples[0];

        prev_output2 = prev_output1;
        prev_output1 = filtered_samples[0];

        // Filter sample 1
        filtered_samples[1] = b0 * samples[1] + b1 * prev_filtered_sample1 + b2 * prev_filtered_sample2
                              - a1 * prev_output1 - a2 * prev_output2;
        filtered_energy += filtered_samples[1] * filtered_samples[1];

        // Update previous samples and outputs
        prev_filtered_sample2 = prev_filtered_sample1;
        prev_filtered_sample1 = samples[1];

        prev_output2 = prev_output1;
        prev_output1 = filtered_samples[1];

        // Filter sample 2
        filtered_samples[2] = b0 * samples[2] + b1 * prev_filtered_sample1 + b2 * prev_filtered_sample2
                              - a1 * prev_output1 - a2 * prev_output2;
        filtered_energy += filtered_samples[2] * filtered_samples[2];

        // Update previous samples and outputs
        prev_filtered_sample2 = prev_filtered_sample1;
        prev_filtered_sample1 = samples[2];

        prev_output2 = prev_output1;
        prev_output1 = filtered_samples[2];

        // Filter sample 3
        filtered_samples[3] = b0 * samples[3] + b1 * prev_filtered_sample1 + b2 * prev_filtered_sample2
                              - a1 * prev_output1 - a2 * prev_output2;
        filtered_energy += filtered_samples[3] * filtered_samples[3];

        // Update previous samples and outputs
        prev_filtered_sample2 = prev_filtered_sample1;
        prev_filtered_sample1 = samples[3];

        prev_output2 = prev_output1;
        prev_output1 = filtered_samples[3];
    }

    // Process remaining samples
    for (; i < length; i++) {
        float sample = (float)emphasizedWaveform[i] - 128.0f;

        float filtered_sample = b0 * sample + b1 * prev_filtered_sample1 + b2 * prev_filtered_sample2
                                - a1 * prev_output1 - a2 * prev_output2;
        filtered_energy += filtered_sample * filtered_sample;

        // Update previous samples and outputs
        prev_filtered_sample2 = prev_filtered_sample1;
        prev_filtered_sample1 = sample;

        prev_output2 = prev_output1;
        prev_output1 = filtered_sample;
    }

    // Calculate current RMS energy from filtered waveform
    float current_energy = sqrtf(filtered_energy / length);

    // Update average energy using exponential moving average
    avg_energy = avg_energy * energy_alpha + current_energy * (1.0f - energy_alpha);

    // Calculate energy ratio
    float energy_ratio = current_energy / (avg_energy + 1e-6f); // Prevent division by zero

    // Apply weighting to spectral flux to emphasize low frequencies
    float spectral_flux = 0.0f;
    float sum_weights = 0.0f;

    size_t spectrumLen = (spectrumLength < MAX_SPECTRUM_LENGTH) ? spectrumLength : MAX_SPECTRUM_LENGTH;
    size_t bins = (max_bin < spectrumLen) ? max_bin : spectrumLen;

    // Loop unrolling by factor of 4
    i = 0;
    for (; i + 3 < bins; i += 4) {
        float diffs[4];
        float weights_sum = weights[i] + weights[i + 1] + weights[i + 2] + weights[i + 3];

        diffs[0] = (float)spectrum[i] - previous_spectrum[i];
        diffs[1] = (float)spectrum[i + 1] - previous_spectrum[i + 1];
        diffs[2] = (float)spectrum[i + 2] - previous_spectrum[i + 2];
        diffs[3] = (float)spectrum[i + 3] - previous_spectrum[i + 3];

        // Update previous spectrum
        previous_spectrum[i] = (float)spectrum[i];
        previous_spectrum[i + 1] = (float)spectrum[i + 1];
        previous_spectrum[i + 2] = (float)spectrum[i + 2];
        previous_spectrum[i + 3] = (float)spectrum[i + 3];

        // Accumulate spectral flux
        if (diffs[0] > 0) spectral_flux += diffs[0] * weights[i];
        if (diffs[1] > 0) spectral_flux += diffs[1] * weights[i + 1];
        if (diffs[2] > 0) spectral_flux += diffs[2] * weights[i + 2];
        if (diffs[3] > 0) spectral_flux += diffs[3] * weights[i + 3];

        sum_weights += weights_sum;
    }

    // Process remaining bins
    for (; i < bins; i++) {
        float diff = (float)spectrum[i] - previous_spectrum[i];

        // Update previous spectrum
        previous_spectrum[i] = (float)spectrum[i];

        // Accumulate spectral flux
        if (diff > 0) spectral_flux += diff * weights[i];
        sum_weights += weights[i];
    }

    // Normalize spectral flux
    if (sum_weights > 0.0f) {
        spectral_flux /= sum_weights;
    }

    // Update average spectral flux
    avg_flux = avg_flux * flux_alpha + spectral_flux * (1.0f - flux_alpha);

    // Calculate flux ratio
    float flux_ratio = spectral_flux / (avg_flux + 1e-6f);

    // Detect beat based on thresholds
    if (energy_ratio > energy_threshold && flux_ratio > flux_threshold) {
        printf("native:SIGNAL:SIG_BEAT_DETECTED\n");
    }
}
