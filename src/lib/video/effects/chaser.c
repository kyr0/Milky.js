#include "chaser.h"

// structure to represent a chaser, which is a moving point on the screen
typedef struct {
    float coeff1; // coefficient for x-axis movement calculation
    float coeff2; // coefficient for x-axis movement calculation
    float coeff3; // coefficient for y-axis movement calculation
    float coeff4; // coefficient for y-axis movement calculation
    float pathLengthX; // length of the path on the x-axis
    float pathLengthY; // length of the path on the y-axis
    int prevX; // previous x-coordinate of the chaser
    int prevY; // previous y-coordinate of the chaser
} Chaser;

// array to store the chasers (precomputed coefficients, path lenghts, position cache), limited to MAX_CHASERS
static Chaser chasers[MILKY_MAX_CHASERS];

// variables to track the last known canvas dimensions
// used to determine if the chasers need reinitialization
// this is necessary on sudden canvas size changes
static size_t lastWidth = 0;
static size_t lastHeight = 0;

/**
 Renders a set of "chasers" on a screen buffer. 

 Each chaser is a moving point that leaves a trail as it moves across the screen. 
 The function takes into account the current time frame, speed, and the number of chasers to render. 
 It also ensures that the chasers are reinitialized if the canvas size changes. 
 For each chaser, it calculates a new position based on trigonometric functions to create a smooth and varied movement pattern. t
 The new position is then used to draw a line from the chaser's previous position to its new position on the screen buffer. 
 The previous position is updated for the next frame.

 @param timeFrame The current time frame for animation (used to create variation in chaser movement).
 @param screen    The screen buffer to render the chasers on.
 @param speed     The speed factor for chaser movement (higher values result in faster movement).
 @param count     The number of chasers to render.
 @param width     The width of the screen buffer in pixels.
 @param height    The height of the screen buffer in pixels.
 @param seed      The seed value for random number generation (used to ensure reproducibility).
*/
void renderChasers(float timeFrame, uint8_t *screen, float speed, unsigned int count, size_t width, size_t height, unsigned int seed, int thickness) {
    // reinitialize chasers if canvas size changes
    // needed to ensure chasers are correctly positioned on canvas resize
    if (lastWidth != width || lastHeight != height) {
        initializeChasers(count, width, height, seed);
        lastWidth = width;
        lastHeight = height;
    }

    for (int k = 0; k < count; k++) {
        Chaser *chaser = &chasers[k];

        // update frame for this chaser to create variation
        float chaserTimeFrame = (timeFrame * speed + k) * 50;

        // calculate new position
        int x1 = (int)(width / 2 + chaser->pathLengthX * (cosf(chaserTimeFrame * 0.1102f * chaser->coeff1 + 10.0f) + cosf(chaserTimeFrame * 0.1312f * chaser->coeff2 + 20.0f)));
        int y1 = (int)(height / 2 + chaser->pathLengthY * (cosf(chaserTimeFrame * 0.1204f * chaser->coeff3 + 40.0f) + cosf(chaserTimeFrame * 0.1715f * chaser->coeff4 + 30.0f)));

        // ensure coordinates are within canvas bounds
        x1 = (x1 < 0) ? 0 : (x1 >= (int)width ? (int)width - 1 : x1);
        y1 = (y1 < 0) ? 0 : (y1 >= (int)height ? (int)height - 1 : y1);

        // draw line from previous position to new position with specified thickness
        for (int offset = -thickness / 2; offset <= thickness / 2; offset++) {
            drawLine(screen, width, height, chaser->prevX, chaser->prevY + offset, x1, y1 + offset, MILKY_CHASER_INTENSITY, MILKY_CHASER_INTENSITY, MILKY_CHASER_INTENSITY, 255);

            // add antialiasing effect at the edges
            if (offset == -thickness / 2 || offset == thickness / 2) {
                // apply a lighter intensity for antialiasing
                drawLine(screen, width, height, chaser->prevX, chaser->prevY + offset - 1, x1, y1 + offset - 1, MILKY_CHASER_INTENSITY, MILKY_CHASER_INTENSITY, MILKY_CHASER_INTENSITY, 127);
                drawLine(screen, width, height, chaser->prevX, chaser->prevY + offset + 1, x1, y1 + offset + 1, MILKY_CHASER_INTENSITY, MILKY_CHASER_INTENSITY, MILKY_CHASER_INTENSITY, 127);
            }
        }

        // update previous position
        chaser->prevX = x1;
        chaser->prevY = y1;
    }
}

/**
 Initializes an array of 'Chaser' structures with random coefficients and path lengths
 based on the given canvas dimensions. it seeds the random number generator with a specified seed
 to ensure reproducibility. Each chaser is assigned random coefficients that influence its movement
 pattern. the path length for each chaser is calculated as a percentage of the canvas size, ensuring
 that the chaser's movement is proportional to the canvas dimensions. Initially, all chasers are
 positioned at the center of the canvas.

 @param count  The number of chasers to initialize.
 @param width  The width of the canvas in pixels.
 @param height The height of the canvas in pixels.
 @param seed   The seed value for random number generation.
*/
void initializeChasers(unsigned int count, size_t width, size_t height, unsigned int seed) {
    srand(seed); // seed the random number generator for stable randomness

    for (int k = 0; k < count; k++) {
        // generate random coefficients for the chasers
        chasers[k].coeff1 = ((float)(rand() % 100)) * 0.01f;
        chasers[k].coeff2 = ((float)(rand() % 100)) * 0.01f;
        chasers[k].coeff3 = ((float)(rand() % 100)) * 0.01f;
        chasers[k].coeff4 = ((float)(rand() % 100)) * 0.01f;

        // calculate the chaser path length as a percentage of the canvas size
        chasers[k].pathLengthX = ((float)(rand() % 61 + 20)) * 0.01f * width / 4;  // 20% to 80% of width
        chasers[k].pathLengthY = ((float)(rand() % 61 + 20)) * 0.01f * height / 4; // 20% to 80% of height

        // initialize previous positions at the center
        chasers[k].prevX = (int) width / 2;
        chasers[k].prevY = (int) height / 2;
    }
}
