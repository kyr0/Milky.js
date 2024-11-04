#include "energy.h"

int milky_energyEnergySpikeDetected = 0;

// State preservation across function calls
static float milky_energyAvgEnergy = 0.0f;
static float milky_energyAvgFlux = 0.0f;
static int milky_energyDetectionCooldownCounter = MILKY_COOLDOWN_PERIOD; // Counter for cooldown period
static float milky_energyPreviousSpectrum[MILKY_MAX_SPECTRUM_LENGTH] = {0};
static float milky_energyWeights[MILKY_MAX_SPECTRUM_LENGTH] = {0};
static size_t milky_energyMaxBin = 0;
static float milky_energyFrequencyBinWidth = 0.0f;
static int milky_energyEnergySpikeDetectionInitialized = 0;

/**
 * Initializes a low-pass biquad filter with a strong Q factor for sharp cutoff at 500 Hz.
 * 
 * @param filter     pointer to the BiquadFilter structure to initialize.
 * @param cutoffFreq the cutoff frequency for the filter.
 * @param sampleRate the sample rate of the audio data.
 * @param Q          the quality factor for the filter, affecting the sharpness of the cutoff.
 */
void initLowPassFilter(BiquadFilter *filter, float cutoffFreq, float sampleRate, float Q) {
    // calculate the angular frequency
    float omega = 2.0f * MILKY_PI * cutoffFreq / sampleRate;
    // calculate the filter's alpha value, which determines the bandwidth
    float alpha = sinf(omega) / (2.0f * Q);
    // calculate the cosine of the angular frequency
    float cos_omega = cosf(omega);
    
    // set the biquad low-pass filter coefficients
    filter->a0 = (1.0f - cos_omega) / 2.0f;
    filter->a1 = 1.0f - cos_omega;
    filter->a2 = filter->a0;
    filter->b1 = -2.0f * cos_omega;
    filter->b2 = 1.0f - alpha;
    
    // normalize coefficients to ensure the filter's stability
    float a0_inv = 1.0f / (1.0f + alpha);
    filter->a0 *= a0_inv;
    filter->a1 *= a0_inv;
    filter->a2 *= a0_inv;
    filter->b1 *= a0_inv;
    filter->b2 *= a0_inv;
    
    // initialize delay elements to zero for the filter's state
    filter->z1 = 0.0f;
    filter->z2 = 0.0f;
}

/**
 * Applies the biquad filter to a sample and returns the filtered output.
 * 
 * @param filter pointer to the BiquadFilter structure.
 * @param input  the input sample to be filtered.
 * @return       the filtered output sample.
 */
float processSample(BiquadFilter *filter, float input) {
    // calculate the output using the filter coefficients and delay elements
    float output = filter->a0 * input + filter->a1 * filter->z1 + filter->a2 * filter->z2
                   - filter->b1 * filter->z1 - filter->b2 * filter->z2;
    
    // update delay elements for the next sample
    filter->z2 = filter->z1;
    filter->z1 = input;

    return output;
}

/**
 * Applies the low-pass filter to an entire waveform.
 * 
 * @param filter  pointer to the BiquadFilter structure.
 * @param samples array of samples to be filtered.
 * @param length  the number of samples in the array.
 */
void applyLowPassFilter(BiquadFilter *filter, float *samples, size_t length) {
    // iterate over each sample and apply the filter
    for (size_t i = 0; i < length; i++) {
        samples[i] = processSample(filter, samples[i]);
    }
}

/**
 * Analyzes the given waveform and spectrum data to detect
 * significant energy spikes, which are indicative of beat /energy spikes.
 *
 * @param emphasizedWaveform pointer to the waveform data array (8-bit unsigned integers).
 * @param spectrum           pointer to the spectrum data array.
 * @param waveformLength     length of the waveform data array.
 * @param spectrumLength     length of the spectrum data array.
 * @param sampleRate         the sample rate of the audio data.
 */
void detectEnergySpike(
    const uint8_t *emphasizedWaveform,
    const uint8_t *spectrum,
    size_t waveformLength,
    size_t spectrumLength,
    size_t sampleRate
) {
    // constants for adaptive energy and flux
    const float energy_alpha = 0.85f;          // smoothing factor for energy
    const float flux_alpha = 0.85f;            // smoothing factor for flux
    const float energy_threshold = 1.3f;       // threshold for energy ratio
    const float flux_threshold = 1.4f;         // threshold for flux ratio
    const float min_volume_threshold = 0.15f;  // minimum volume threshold for detection

    // initialize detection parameters and filter if not already done
    static BiquadFilter lpFilter;
    if (!milky_energyEnergySpikeDetectionInitialized) {
        // calculate the frequency bin width for the spectrum
        milky_energyFrequencyBinWidth = sampleRate / (2.0f * spectrumLength);
        
        // initialize low-pass filter for 500 Hz cutoff
        initLowPassFilter(&lpFilter, MILKY_CUTOFF_FREQUENCY_HZ, sampleRate, 1.0f); // Q factor of 1.0 for strong cutoff

        // determine the low-frequency maximum bin (under 500 Hz)
        milky_energyMaxBin = (size_t)(MILKY_CUTOFF_FREQUENCY_HZ / milky_energyFrequencyBinWidth);
        if (milky_energyMaxBin > spectrumLength) milky_energyMaxBin = spectrumLength;
        if (milky_energyMaxBin > MILKY_MAX_SPECTRUM_LENGTH) milky_energyMaxBin = MILKY_MAX_SPECTRUM_LENGTH;

        // emphasize low frequencies in weights
        for (size_t i = 0; i < milky_energyMaxBin; i++) {
            float frequency = (i + 1) * milky_energyFrequencyBinWidth;
            milky_energyWeights[i] = 1.0f / (frequency + 1e-6f); // avoid division by zero
        }
        milky_energyEnergySpikeDetectionInitialized = 1;
    }

    // apply low-pass filter to the waveform
    float filtered_waveform[MILKY_MAX_WAVEFORM_LENGTH];
    size_t length = (waveformLength < MILKY_MAX_WAVEFORM_LENGTH) ? waveformLength : MILKY_MAX_WAVEFORM_LENGTH;
    for (size_t i = 0; i < length; i++) {
        // center the waveform data and apply the filter
        filtered_waveform[i] = processSample(&lpFilter, (float)emphasizedWaveform[i] - 128.0f);
    }

    // calculate filtered energy using the low-pass filtered waveform
    float filtered_energy = 0.0f;
    for (size_t i = 0; i < length; i++) {
        // accumulate energy by squaring the filtered samples
        filtered_energy += filtered_waveform[i] * filtered_waveform[i];
    }

    // compute RMS energy from the accumulated energy
    float current_energy = sqrtf(filtered_energy / length);
    
    // apply a noise gate: skip detection if the signal is below the noise threshold
    if (current_energy < MILKY_NOISE_GATE_THRESHOLD) {
        milky_energyEnergySpikeDetected = 0;
        return; // exit early for low-amplitude sections
    }

    // update average energy using exponential moving average
    milky_energyAvgEnergy = milky_energyAvgEnergy * energy_alpha + current_energy * (1.0f - energy_alpha);
    // calculate energy ratio for detection
    float energy_ratio = current_energy / (milky_energyAvgEnergy + 1e-6f);

    // calculate spectral flux with adaptive frequency emphasis
    float spectral_flux = 0.0f;
    float sum_weights = 0.0f;
    size_t bins = (spectrumLength < MILKY_MAX_SPECTRUM_LENGTH) ? spectrumLength : MILKY_MAX_SPECTRUM_LENGTH;

    for (size_t i = 0; i < bins; i++) {
        // calculate the difference in spectrum values
        float diff = (float)spectrum[i] - milky_energyPreviousSpectrum[i];
        // update previous spectrum for the next iteration
        milky_energyPreviousSpectrum[i] = (float)spectrum[i];

        if (diff > 0) {
            // accumulate positive flux weighted by frequency emphasis
            spectral_flux += diff * milky_energyWeights[i];
        }
        // accumulate weights for normalization
        sum_weights += milky_energyWeights[i];
    }

    // normalize spectral flux if weights are non-zero
    if (sum_weights > 0.0f) spectral_flux /= sum_weights;
    // update flux average using exponential moving average
    milky_energyAvgFlux = milky_energyAvgFlux * flux_alpha + spectral_flux * (1.0f - flux_alpha);
    // calculate flux ratio for detection
    float flux_ratio = spectral_flux / (milky_energyAvgFlux + 1e-6f);

    // check cooldown counter before allowing a beat detection
    if (milky_energyDetectionCooldownCounter >= MILKY_COOLDOWN_PERIOD &&
        energy_ratio > energy_threshold && 
        flux_ratio > flux_threshold && 
        current_energy > min_volume_threshold) 
    {
        // signal energy spike detection
        printf("native:SIGNAL:SIG_ENERGY\n");
        milky_energyEnergySpikeDetected = 1;
        // reset cooldown counter after detection
        milky_energyDetectionCooldownCounter = 0;
    } else {
        milky_energyEnergySpikeDetected = 0;
        // increment counter when no detection occurs
        milky_energyDetectionCooldownCounter++;
    }
}
