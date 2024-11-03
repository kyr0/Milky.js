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

void generatePalette();
void applyPaletteToCanvas(size_t currentTime, uint8_t *canvas, size_t width, size_t height);