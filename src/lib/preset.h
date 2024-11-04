#ifndef PRESET_H
#define PRESET_H

#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>

#define MILKY_MAX_PRESETS 100
#define MILKY_MAX_PROPERTY_COUNT_PER_PRESET 64

void parseFlattenedPresetBuffer(const float *buffer, size_t bufferLength);
float getPresetPropertyByName(size_t presetIndex, const char *propertyName);

#endif // PRESET_H
