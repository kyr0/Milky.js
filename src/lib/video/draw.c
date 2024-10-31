#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

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

#define CHASER_COUNT 20
#define CHASER_INTENSITY 255


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

// The renderTwoChasers function draws two oscillating chasers based on frame time
void renderTwoChasers(float frame, uint8_t *canvas, size_t width, size_t height) {
    for (int k = 0; k < CHASER_COUNT; k++) {
        frame += 0.08f;

        // First chaser position
        int x1 = width / 2 + (int)(54 * cosf(frame * 0.1102f + 10) + 45 * cosf(frame * 0.1312f + 20));
        int y1 = height / 2 + (int)(34 * cosf(frame * 0.1204f + 40) + 35 * cosf(frame * 0.1715f + 30));

        // Draw first chaser
        setPixel(canvas, width, x1, y1, CHASER_INTENSITY, CHASER_INTENSITY, CHASER_INTENSITY, 255);

        // Second chaser position
        int x2 = width / 2 + (int)(44 * cosf(frame * 0.1213f + 33) + 35 * cosf(frame * 0.1408f + 15));
        int y2 = height / 2 + (int)(32 * cosf(frame * 0.1304f + 12) + 31 * cosf(frame * 0.1103f + 21));

        // Draw second chaser
        setPixel(canvas, width, x2, y2, CHASER_INTENSITY, CHASER_INTENSITY, CHASER_INTENSITY, 255);
    }
}

void applyDitheringWithCarry(uint8_t *row, size_t length) {
    int carry = 0;
    for (size_t i = 0; i < length; i++) {
        int value = row[i] + carry;

        // Right shift with carry preservation
        int shiftedValue = value >> 1;
        carry = value & 1;  // Keep the lowest bit as carry

        row[i] = (uint8_t)shiftedValue;
        if (i + 1 < length) {
            row[i + 1] += carry;  // Carry the lowest bit to the next pixel
        }
    }
}

void applyDitheringAcrossCanvas(uint8_t *frame, size_t width, size_t height) {
    for (size_t y = 0; y < height; y++) {
        applyDitheringWithCarry(&frame[y * width * 4], width);  // Apply to each row
    }
}