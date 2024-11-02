#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

void diminishCenter(
    uint8_t *screen,        
    float centerDwindle,    
    size_t canvasWidth,     
    size_t canvasHeight,    
    int isCenter,           
    uint8_t bitDepth        
) {
    if (centerDwindle >= 0.999f) return;

    int centerX = canvasWidth / 2;
    int centerY = canvasHeight / 2;
    int pixelSize = (bitDepth > 8) ? 4 : 1; // Determine pixel size based on bit depth

    for (size_t y = 0; y < canvasHeight; ++y) {
        for (size_t x = 0; x < canvasWidth; ++x) {
            if (isCenter) {
                // Apply to center and its immediate neighbors
                if ((x == centerX && y == centerY) ||
                    (x == centerX - 1 && y == centerY) ||
                    (x == centerX + 1 && y == centerY) ||
                    (x == centerX && y == centerY - 1) ||
                    (x == centerX && y == centerY + 1)) {
                    int offset = (y * canvasWidth + x) * pixelSize;
                    for (int i = 0; i < pixelSize - 1; ++i) {
                        if (screen[offset + i] > 1) {
                            screen[offset + i] = (uint8_t)(screen[offset + i] * centerDwindle);
                        }
                    }
                }
            } else {
                // Apply along a vertical line through the center
                if (x == centerX) {
                    int offset = (y * canvasWidth + x) * pixelSize;
                    for (int i = 0; i < pixelSize - 1; ++i) {
                        if (screen[offset + i] > 1) {
                            screen[offset + i] = (uint8_t)(screen[offset + i] * centerDwindle);
                        }
                    }
                }
            }
        }
    }
}
