#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

#define PALETTE_SIZE 256
#define MAX_COLOR 63

// Define a palette as an array of 256 RGB color values
uint8_t palette[PALETTE_SIZE][3];

// Function to set an RGB color in the palette at a specific index
void setRGB(uint8_t index, uint8_t r, uint8_t g, uint8_t b) {
    // `index` is guaranteed to be in the range 0-255 since it's uint8_t
    palette[index][0] = r; // Set red component
    palette[index][1] = g; // Set green component
    palette[index][2] = b; // Set blue component
}

// Palette generator function
void generatePalette() {
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
            for (int a = 64; a < PALETTE_SIZE; a++) setRGB(a, MAX_COLOR, MAX_COLOR, MAX_COLOR);
            break;

        case 3: // "frosty"
            for (int a = 0; a < 64; a++) setRGB(a, a * a / 64, a, (uint8_t)(sqrtf(a) * 8));
            for (int a = 64; a < PALETTE_SIZE; a++) setRGB(a, MAX_COLOR, MAX_COLOR, MAX_COLOR);
            break;
    }
}

// Function to apply the current palette to the canvas
void applyPaletteToCanvas(uint8_t *canvas, size_t width, size_t height) {
    size_t frameSize = width * height;
    
    for (size_t i = 0; i < frameSize; i++) {
        uint8_t colorIndex = canvas[i * 4]; // Use the red channel as intensity, assuming it’s within bounds.

        // Map palette colors to the RGBA format
        canvas[i * 4] = palette[colorIndex][0];       // R
        canvas[i * 4 + 1] = palette[colorIndex][1];   // G
        canvas[i * 4 + 2] = palette[colorIndex][2];   // B
        canvas[i * 4 + 3] = 255;                      // A (fully opaque)
    }
}
