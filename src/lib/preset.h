#include <stddef.h>
#include <stdint.h>
#include <string.h>

#define MAX_PRESETS 100
#define MAX_PROPERTY_COUNT_PER_PRESET 64

// Ordered list of well-known property names
const char *wellKnownPropertyNames[MAX_PROPERTY_COUNT_PER_PRESET] = {
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
    float properties[MAX_PROPERTY_COUNT_PER_PRESET];
    const char *propertyNames[MAX_PROPERTY_COUNT_PER_PRESET]; // Ordered property names
} Preset;

// Populate property names in each Preset
void initializePresetPropertyNames(Preset *preset) {
    for (size_t i = 0; i < MAX_PROPERTY_COUNT_PER_PRESET; i++) {
        preset->propertyNames[i] = wellKnownPropertyNames[i];
    }
}

Preset presets[MAX_PRESETS];
size_t presetCount = 0;

void parseFlattenedPresetBuffer(const float *buffer, size_t bufferLength);
float getPresetPropertyByName(size_t presetIndex, const char *propertyName);