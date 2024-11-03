#include "draw.h"

/**
 * Clears the entire frame buffer by setting all pixels to black and fully transparent.
 * This function uses memset to efficiently set all bytes in the frame buffer to 0.
 *
 * @param frame     The frame buffer to be cleared (RGBA format).
 * @param frameSize The size of the frame buffer in bytes.
 */
void clearFrame(uint8_t *frame, size_t frameSize) {
    memset(frame, 0, frameSize);
}

/**
 * Sets the RGBA values for a specific pixel in the frame buffer.
 * To do so, it modifies the color and transparency of a pixel located at
 * the specified (x, y) coordinates within the frame buffer. It ensures that
 * the pixel is within the bounds of the frame before setting the values.
 *
 * @param frame  The frame buffer where the pixel is to be set (RGBA format).
 * @param width  The width of the frame in pixels.
 * @param x      The x-coordinate of the pixel to set.
 * @param y      The y-coordinate of the pixel to set.
 * @param r      The red component value of the pixel.
 * @param g      The green component value of the pixel.
 * @param b      The blue component value of the pixel.
 * @param a      The alpha (transparency) component value of the pixel.
 */
void setPixel(uint8_t *frame, size_t width, size_t x, size_t y, uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    // check if the x and y coordinates are within the bounds of the frame
    if (x >= width) return;

    // calculate the index in the frame buffer for the pixel at (x, y)
    size_t index = (y * width + x) * 4;

    // set the RGBA values at the calculated index
    frame[index] = r;     // set red component
    frame[index + 1] = g; // set green component
    frame[index + 2] = b; // set blue component
    frame[index + 3] = a; // set alpha component
}

/**
 Optimized Bresenham's line algorithm.
 
 Credits go to Jack Elton Bresenham who developed it in 1962 at IBM.
 https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm

 Draws a line on a screen buffer using the Bresenham's line algorithm.
 It calculates the line's path from (x0, y0) to (x1, y1) and sets the pixel intensity
 directly on the screen buffer. The algorithm is optimized for performance by avoiding
 function calls and using direct memory access. It also ensures that the line stays
 within the bounds of the screen canvas by clamping the coordinates.

 @param screen The screen buffer to draw the line on.
 @param width  The width of the screen buffer in pixels.
 @param height The height of the screen buffer in pixels.
 @param x0     The x-coordinate of the starting point of the line.
 @param y0     The y-coordinate of the starting point of the line.
 @param x1     The x-coordinate of the ending point of the line.
 @param y1     The y-coordinate of the ending point of the line.
*/
void drawLine(uint8_t *screen, size_t width, size_t height, int x0, int y0, int x1, int y1, uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    int dx = abs(x1 - x0); // Calculate the absolute difference in x
    int dy = -abs(y1 - y0); // Calculate the negative absolute difference in y

    int sx = x0 < x1 ? 1 : -1; // Determine the step direction for x
    int sy = y0 < y1 ? 1 : -1; // Determine the step direction for y

    int err = dx + dy; // Initialize the error term

    size_t pitch = width * 4; // Calculate the pitch assuming 4 bytes per pixel (RGBA)

    int x = x0; // Start x position
    int y = y0; // Start y position

    while (1) {
        // Calculate the index in the screen buffer and set the pixel color
        size_t index = (size_t)y * pitch + (size_t)x * 4;
        screen[index]     = r; // Set Red channel
        screen[index + 1] = g; // Set Green channel
        screen[index + 2] = b; // Set Blue channel
        screen[index + 3] = a; // Set Alpha channel using the provided parameter

        if (x == x1 && y == y1) break; // Break if the end point is reached

        int e2 = err << 1; // Double the error term

        if (e2 >= dy) { // Adjust error and x position if necessary
            err += dy;
            x += sx;

            // Clamp x within bounds (0 to width-1; prevent rendering out of canvas; this makes the chaser move along corners)
            if (x < 0) x = 0;
            if (x >= (int)width) x = (int)width - 1;
        }
        if (e2 <= dx) { // Adjust error and y position if necessary
            err += dx;
            y += sy;

            // Clamp y within bounds (0 to height-1; prevent rendering out of canvas; this makes the chaser move along corners)
            if (y < 0) y = 0;
            if (y >= (int)height) y = (int)height - 1;
        }
    }
}
