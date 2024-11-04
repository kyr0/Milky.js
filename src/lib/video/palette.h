#ifndef PALETTE_H
#define PALETTE_H

#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <time.h>

#include "../audio/energy.h"

#define MILKY_PALETTE_SIZE 256
#define MILKY_MAX_COLOR 63

void generatePalette(void);
void applyPaletteToCanvas(size_t currentTime, uint8_t *canvas, size_t width, size_t height);

#endif // PALETTE_H
