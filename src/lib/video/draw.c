#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

void clearFrame(uint8_t *frame, size_t frameSize) {
    memset(frame, 0, frameSize);
}

void setPixel(uint8_t *frame, size_t width, size_t x, size_t y, uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    if (x >= width || y >= width) return;
    size_t index = (y * width + x) * 4;
    frame[index] = r;
    frame[index + 1] = g;
    frame[index + 2] = b;
    frame[index + 3] = a;
}