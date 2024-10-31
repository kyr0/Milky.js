#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>

// set all pixels to transparent black
/*
void clearCanvas(uint8_t *canvas, size_t canvasSize) {
    for (size_t i = 0; i < canvasSize; i += 4) {
        canvas[i + 0] = 0;   // Red
        canvas[i + 1] = 0;   // Green
        canvas[i + 2] = 0;   // Blue
        canvas[i + 3] = 0;   // Alpha (fully transparent)
    }
}
*/


// Assume canvas is RGBA formatted; each pixel occupies 4 bytes.
void clearCanvas(uint8_t *canvas, size_t canvasSize) {
    memset(canvas, 0, canvasSize);
}

void setPixel(uint8_t *canvas, size_t width, size_t x, size_t y, uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    size_t index = (y * width + x) * 4;
    canvas[index] = r;
    canvas[index + 1] = g;
    canvas[index + 2] = b;
    canvas[index + 3] = a;
}