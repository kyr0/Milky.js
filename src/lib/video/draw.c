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

// Forward declarations for quantization and dithering
uint8_t quantize_pnuq(uint8_t color, uint8_t bitDepth);
uint8_t dither(uint8_t quantized_color, uint8_t original_color);

void reduceBitDepth(uint8_t *frame, size_t frameSize, uint8_t bitDepth) {

    
    for (size_t i = 0; i < frameSize; i += 4) {
        // Apply PNUQ or other quantization techniques
        uint8_t r = quantize_pnuq(frame[i], bitDepth);
        uint8_t g = quantize_pnuq(frame[i + 1], bitDepth);
        uint8_t b = quantize_pnuq(frame[i + 2], bitDepth);

        // Apply dithering (optional)
        r = dither(r, frame[i]);
        g = dither(g, frame[i + 1]);
        b = dither(b, frame[i + 2]);

        // Store the quantized and dithered values back in the frame
        frame[i] = r;
        frame[i + 1] = g;
        frame[i + 2] = b;
    }
}

// PNUQ quantization function
uint8_t quantize_pnuq(uint8_t color, uint8_t bitDepth) {
    // Scale down to the nearest quantized value based on bit depth
    // E.g., for 16-bit (5-6-5), we reduce red/blue to 5 bits, green to 6 bits
    uint8_t levels;
    switch (bitDepth) {
        case 24:
            levels = 255;  // No reduction
            break;
        case 16:
            levels = 31;   // Approximation for 5-bit quantization
            break;
        case 8:
            levels = 7;    // Approximation for 3-bit quantization
            break;
        default:
            levels = 255;  // Default to no quantization if unsupported
    }

    // Quantize by scaling color to the reduced level and then back to 0-255
    uint8_t quantized = (color * levels / 255) * (255 / levels);
    return quantized;
}

// Dithering function (Floyd-Steinberg example)
uint8_t dither(uint8_t quantized_color, uint8_t original_color) {
    // Calculate error between original and quantized color
    int16_t error = (int16_t)original_color - (int16_t)quantized_color;

    // Apply error diffusion (basic implementation, spread error to adjacent channels)
    int16_t adjusted_color = quantized_color + (error * 7 / 16);

    // Clamp to ensure it stays within uint8_t range
    if (adjusted_color > 255) adjusted_color = 255;
    if (adjusted_color < 0) adjusted_color = 0;

    return (uint8_t)adjusted_color;
}
