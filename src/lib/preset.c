#include "preset.h"

// Ordered list of well-known property names
const char *milky_presetWellKnownPropertyNames[MILKY_MAX_PROPERTY_COUNT_PER_PRESET] = {
    "damping", "effect_bar", "effect_chasers", "effect_dots", "effect_grid",
    "effect_nuclide", "effect_shadebobs", "effect_solar", "effect_spectral",
    "f1", "f2", "f3", "f4", "gamma", "magic", "mode", "pal_bFX",
    "pal_curve_id_1", "pal_curve_id_2", "pal_curve_id_3", "pal_FXpalnum",
    "pal_hi_oband", "pal_lo_band", "s1", "s2", "shift", "spectrum",
    "t1", "t2", "volpos", "wave", "x_center", "y_center"
};

// Struct for a preset, including properties and their names
typedef struct {
    int presetNumber;
    float properties[MILKY_MAX_PROPERTY_COUNT_PER_PRESET];
    const char *propertyNames[MILKY_MAX_PROPERTY_COUNT_PER_PRESET]; // Ordered property names
} Preset;

// Populate property names in each Preset
void initializePresetPropertyNames(Preset *preset) {
    for (size_t i = 0; i < MILKY_MAX_PROPERTY_COUNT_PER_PRESET; i++) {
        preset->propertyNames[i] = milky_presetWellKnownPropertyNames[i];
    }
}

Preset presets[MILKY_MAX_PRESETS];
size_t presetCount = 0;

/**
 * Parses a flattened buffer into a global list of Presets with ordered property names.
 * 
 * @param buffer       Pointer to the buffer containing preset data.
 * @param bufferLength The length of the buffer.
 */
void parseFlattenedPresetBuffer(const float *buffer, size_t bufferLength) {
    // calculate the number of properties per preset
    size_t sectionSize = MILKY_MAX_PROPERTY_COUNT_PER_PRESET;
    // determine the number of presets based on buffer length
    presetCount = bufferLength / sectionSize;

    // ensure the preset count does not exceed the maximum allowed
    if (presetCount > MILKY_MAX_PRESETS) {
        presetCount = MILKY_MAX_PRESETS;
    }

    // iterate over each preset to initialize and populate properties
    for (size_t i = 0; i < presetCount; i++) {
        // assign a unique preset number starting from 1
        presets[i].presetNumber = (int) i + 1;

        // initialize property names for the current preset
        initializePresetPropertyNames(&presets[i]);

        // copy properties from the buffer into the current preset
        memcpy(presets[i].properties, buffer + (i * sectionSize), sectionSize * sizeof(float));
    }
}

/**
 * Retrieves a property value by name for a specific preset.
 * 
 * @param presetIndex  The index of the preset.
 * @param propertyName The name of the property to retrieve.
 * @return             The value of the property, or 0.0f if not found.
 */
float getPresetPropertyByName(size_t presetIndex, const char *propertyName) {
    // check if the preset index is within the valid range
    if (presetIndex >= presetCount) {
        printf("Preset index out of range.\n");
        return 0.0f; // return default value if index is invalid
    }

    // search for the property name within the preset's properties
    for (size_t i = 0; i < MILKY_MAX_PROPERTY_COUNT_PER_PRESET; i++) {
        // compare the current property name with the target name
        if (strcmp(presets[presetIndex].propertyNames[i], propertyName) == 0) {
            // return the property value if a match is found
            return presets[presetIndex].properties[i];
        }
    }

    // notify if the property name is not found and return default value
    printf("Property name '%s' not found in preset %zu.\n", propertyName, presetIndex + 1);
    return 0.0f;
}
