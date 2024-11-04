#ifndef BITDEPTH_H
#define BITDEPTH_H

#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

uint8_t quantize_pnuq(uint8_t color, uint8_t bitDepth);
void reduceBitDepth(uint8_t *frame, size_t frameSize, uint8_t bitDepth);
uint8_t dither(uint8_t quantized_color, uint8_t original_color);

#endif // BITDEPTH_H
