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