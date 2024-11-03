#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

void clearFrame(uint8_t *frame, size_t frameSize);
void setPixel(uint8_t *frame, size_t width, size_t x, size_t y, uint8_t r, uint8_t g, uint8_t b, uint8_t a);
void drawLine(uint8_t *frame, size_t width, size_t height, int x0, int y0, int x1, int y1, uint8_t r, uint8_t g, uint8_t b, uint8_t a);
