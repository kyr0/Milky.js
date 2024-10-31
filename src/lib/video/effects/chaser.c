#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

#define MAX_CHASERS 20 
#define CHASER_INTENSITY 255

typedef struct {
    float coeff1;
    float coeff2;
    float coeff3;
    float coeff4;
    float pathLengthX;
    float pathLengthY;
    int prevX;
    int prevY;
} Chaser;

static Chaser chasers[MAX_CHASERS];
static size_t lastWidth = 0;
static size_t lastHeight = 0;

// Function prototypes
void initializeChasers(unsigned int count, size_t width, size_t height, unsigned int seed);
void drawLine(uint8_t *screen, size_t width, size_t height, int x0, int y0, int x1, int y1);

void renderChasers(float timeFrame, uint8_t *screen, float speed, unsigned int count, size_t width, size_t height, unsigned int seed) {
    // Reinitialize chasers if canvas size changes
    if (lastWidth != width || lastHeight != height) {
        initializeChasers(count, width, height, seed);
        lastWidth = width;
        lastHeight = height;
    }

    for (int k = 0; k < count; k++) {
        Chaser *chaser = &chasers[k];

        // Update frame for this chaser to create variation
        float chaserTimeFrame = timeFrame * speed + k * 0.1f;

        // Calculate new position
        int x1 = (int)(width / 2 + chaser->pathLengthX * (cosf(chaserTimeFrame * 0.1102f * chaser->coeff1 + 10.0f) + cosf(chaserTimeFrame * 0.1312f * chaser->coeff2 + 20.0f)));
        int y1 = (int)(height / 2 + chaser->pathLengthY * (cosf(chaserTimeFrame * 0.1204f * chaser->coeff3 + 40.0f) + cosf(chaserTimeFrame * 0.1715f * chaser->coeff4 + 30.0f)));

        // Ensure coordinates are within canvas bounds
        x1 = (x1 < 0) ? 0 : (x1 >= (int)width ? (int)width - 1 : x1);
        y1 = (y1 < 0) ? 0 : (y1 >= (int)height ? (int)height - 1 : y1);

        // Draw line from previous position to new position
        drawLine(screen, width, height, chaser->prevX, chaser->prevY, x1, y1);

        // Update previous position
        chaser->prevX = x1;
        chaser->prevY = y1;
    }
}

void initializeChasers(unsigned int count, size_t width, size_t height, unsigned int seed) {
    srand(seed); // Seed the random number generator for stable randomness

    for (int k = 0; k < count; k++) {
        // Generate random coefficients for the chasers
        chasers[k].coeff1 = ((float)(rand() % 100)) * 0.01f;
        chasers[k].coeff2 = ((float)(rand() % 100)) * 0.01f;
        chasers[k].coeff3 = ((float)(rand() % 100)) * 0.01f;
        chasers[k].coeff4 = ((float)(rand() % 100)) * 0.01f;

        // Calculate the chaser path length as a percentage of the canvas size
        chasers[k].pathLengthX = ((float)(rand() % 61 + 20)) * 0.01f * width / 4;  // 20% to 80% of width
        chasers[k].pathLengthY = ((float)(rand() % 61 + 20)) * 0.01f * height / 4; // 20% to 80% of height

        // Initialize previous positions at the center
        chasers[k].prevX = width / 2;
        chasers[k].prevY = height / 2;
    }
}

// Optimized Bresenham's line algorithm
void drawLine(uint8_t *screen, size_t width, size_t height, int x0, int y0, int x1, int y1) {
    int dx = abs(x1 - x0);
    int dy = -abs(y1 - y0);

    int sx = x0 < x1 ? 1 : -1;
    int sy = y0 < y1 ? 1 : -1;

    int err = dx + dy;

    size_t pitch = width * 4; // Assuming 4 bytes per pixel (RGBA)

    int x = x0;
    int y = y0;

    while (1) {
        // Set pixel directly without function call
        size_t index = (size_t)y * pitch + (size_t)x * 4;
        screen[index]     = CHASER_INTENSITY; // R
        screen[index + 1] = CHASER_INTENSITY; // G
        screen[index + 2] = CHASER_INTENSITY; // B
        screen[index + 3] = 255;              // A

        if (x == x1 && y == y1) break;

        int e2 = err << 1;

        if (e2 >= dy) {
            err += dy;
            x += sx;

            // Clamp x within bounds
            if (x < 0) x = 0;
            if (x >= (int)width) x = (int)width - 1;
        }
        if (e2 <= dx) {
            err += dx;
            y += sy;

            // Clamp y within bounds
            if (y < 0) y = 0;
            if (y >= (int)height) y = (int)height - 1;
        }
    }
}
