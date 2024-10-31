#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

typedef struct {
    int16_t offsetX; // Relative x offset for the source pixel
    int16_t offsetY; // Relative y offset for the source pixel
    uint8_t weights[4]; // Weights for bilinear interpolation
} WarpMapEntry;

void warpFrame(const uint8_t* oldFrame, uint8_t* newFrame, const WarpMapEntry* warpMap, size_t width, size_t height) {
    size_t index = 0;
    for (size_t y = 0; y < height; ++y) {
        for (size_t x = 0; x < width; ++x) {
            const WarpMapEntry* entry = &warpMap[index];
            int srcX = x + entry->offsetX;
            int srcY = y + entry->offsetY;

            // Ensure source coordinates are within bounds
            srcX = srcX < 0 ? 0 : (srcX >= width - 1 ? width - 2 : srcX);
            srcY = srcY < 0 ? 0 : (srcY >= height - 1 ? height - 2 : srcY);

            // Sample the 2x2 pixel block
            uint8_t p00 = oldFrame[(srcY * width + srcX) * 4];
            uint8_t p01 = oldFrame[(srcY * width + srcX + 1) * 4];
            uint8_t p10 = oldFrame[((srcY + 1) * width + srcX) * 4];
            uint8_t p11 = oldFrame[((srcY + 1) * width + srcX + 1) * 4];

            // Compute the weighted average
            uint32_t newValue = (p00 * entry->weights[0] + p01 * entry->weights[1] +
                                 p10 * entry->weights[2] + p11 * entry->weights[3]) >> 8;

            // Store the new pixel value
            newFrame[(y * width + x) * 4] = (uint8_t)newValue;

            ++index;
        }
    }
}

void initializeWarpMap(WarpMapEntry* warpMap, size_t width, size_t height) {
    for (size_t y = 0; y < height; ++y) {
        for (size_t x = 0; x < width; ++x) {
            WarpMapEntry* entry = &warpMap[y * width + x];
            entry->offsetX = 0; // No offset for testing
            entry->offsetY = 0; // No offset for testing
            entry->weights[0] = 64; // Example weights for bilinear interpolation
            entry->weights[1] = 64;
            entry->weights[2] = 64;
            entry->weights[3] = 64;
        }
    }
}
