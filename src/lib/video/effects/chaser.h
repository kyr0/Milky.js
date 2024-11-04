#ifndef CHASER_H
#define CHASER_H

#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

#include "../draw.h"

// maximum number of chasers that can be rendered simultaneously
#define MILKY_MAX_CHASERS 20

// intensity of the chaser's trail on the screen
#define MILKY_CHASER_INTENSITY 255

// Function prototypes
void initializeChasers(unsigned int count, size_t width, size_t height, unsigned int seed);
void renderChasers(float timeFrame, uint8_t *screen, float speed, unsigned int count, size_t width, size_t height, unsigned int seed, int thickness);

#endif // CHASER_H
