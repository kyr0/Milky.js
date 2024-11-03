#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

// maximum number of chasers that can be rendered simultaneously
#define MAX_CHASERS 20 

// intensity of the chaser's trail on the screen
#define CHASER_INTENSITY 255

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
static Chaser chasers[MAX_CHASERS];

// variables to track the last known canvas dimensions
// used to determine if the chasers need reinitialization
// this is necessary on sudden canvas size changes
static size_t lastWidth = 0;
static size_t lastHeight = 0;

// Function prototypes
void initializeChasers(unsigned int count, size_t width, size_t height, unsigned int seed);
void renderChasers(float timeFrame, uint8_t *screen, float speed, unsigned int count, size_t width, size_t height, unsigned int seed, int thickness);