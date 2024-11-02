#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <time.h>

#define PALETTE_SIZE 256
#define MAX_COLOR 63

// Define a palette as an array of 256 RGB color values
uint8_t palette[PALETTE_SIZE][3];
static clock_t lastPaletteInitTime = 0;

void setRGB(uint8_t index, uint8_t r, uint8_t g, uint8_t b) {
    palette[index][0] = r; // Set red component
    palette[index][1] = g; // Set green component
    palette[index][2] = b; // Set blue component
}

void generatePalette() {
    // Seed the random number generator with the current time
    srand((unsigned int)time(NULL));

    int paletteType = rand() % 4;

    switch (paletteType) {
        case 0: // "purple majik"
            for (int a = 0; a < 64; a++) setRGB(a, a, a * a / 64, (uint8_t)(sqrtf(a) * 8));
            for (int a = 64; a < PALETTE_SIZE; a++) setRGB(a, MAX_COLOR, MAX_COLOR, MAX_COLOR);
            break;

        case 1: // "green lantern II"
            for (int a = 0; a < 64; a++) setRGB(a, a * a / 64, (uint8_t)(sqrtf(a) * 8), a);
            for (int a = 64; a < PALETTE_SIZE; a++) setRGB(a, MAX_COLOR, MAX_COLOR, MAX_COLOR);
            break;

        case 2: // "amber sun"
            for (int a = 0; a < 64; a++) setRGB(a, (uint8_t)(sqrtf(a) * 8), a, a * a / 64);
            for (int a = 64; a < PALETTE_SIZE; a++) {
                uint8_t fadeValue = (uint8_t)((PALETTE_SIZE - a) * MAX_COLOR / (PALETTE_SIZE - 64));
                setRGB(a, fadeValue, fadeValue, fadeValue); // Gradually fade to darkness
            }
            break;

        case 3: // "frosty"
            for (int a = 0; a < 64; a++) setRGB(a, a * a / 64, a, (uint8_t)(sqrtf(a) * 8));
            for (int a = 64; a < PALETTE_SIZE; a++) setRGB(a, MAX_COLOR, MAX_COLOR, MAX_COLOR);
            break;
    }
}


void applyPaletteToCanvas(size_t currentTime, uint8_t *canvas, size_t width, size_t height) {
    size_t frameSize = width * height;

    // Skip palette generation every 11 beats and 80% of the time
    if ((energySpikeDetected && currentTime - lastPaletteInitTime > 10 * 1000) || lastPaletteInitTime == 0) {
        generatePalette(); // Reinitialize the palette
        lastPaletteInitTime = currentTime; // Update the last initialization time
    }
    
    for (size_t i = 0; i < frameSize; i++) {
        uint8_t colorIndex = canvas[i * 4]; // Use the red channel as intensity, assuming it’s within bounds.

        // Map palette colors to the RGBA format
        canvas[i * 4] = palette[colorIndex][0];       // R
        canvas[i * 4 + 1] = palette[colorIndex][1];   // G
        canvas[i * 4 + 2] = palette[colorIndex][2];   // B
        canvas[i * 4 + 3] = 255;                      // A (fully opaque)
    }
}
