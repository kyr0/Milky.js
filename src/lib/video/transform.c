#include <math.h>
#include <stdint.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

// global variable to store the last theta value
static float lastTheta = 0.0f;
static float targetTheta = 0.0f;

void rotate(float timeFrame, uint8_t *tempBuffer, uint8_t *screen, float speed, float angle, size_t width, size_t height) {
    // calculate the rotation angle based on speed and angle
    float theta = speed * angle;

    // update targetTheta if lastTheta is close enough
    if (fabs(lastTheta - targetTheta) < 0.01f) {
        targetTheta = (rand() % 90 - 45) * (M_PI / 180.0f);
    }

    // interpolate theta towards targetTheta
    theta = lastTheta + (targetTheta - lastTheta) * 0.005f;
    lastTheta = theta;

    float sin_theta = sinf(theta), cos_theta = cosf(theta);
    float cx = width * 0.5f, cy = height * 0.5f;

    memset(tempBuffer, 0, width * height * 4); // clear tempBuffer

    for (size_t y = 0; y < height; y++) {
        for (size_t x = 0; x < width; x++) {
            float xt = x - cx, yt = y - cy;
            int src_xi = (int)(cos_theta * xt - sin_theta * yt + cx);
            int src_yi = (int)(sin_theta * xt + cos_theta * yt + cy);

            if (src_xi >= 0 && src_xi < (int)width && src_yi >= 0 && src_yi < (int)height) {
                size_t src_index = (src_yi * width + src_xi) * 4;
                size_t dst_index = (y * width + x) * 4;
                memcpy(&tempBuffer[dst_index], &screen[src_index], 4); // copy pixel
            }
        }
    }

    float alpha = 0.7f;
    for (size_t i = 0; i < width * height * 4; i++) {
        screen[i] = (uint8_t)(screen[i] * (1 - alpha) + tempBuffer[i] * alpha);
    }
}

void scale(
    unsigned char *screen,     // Frame buffer (RGBA format)
    unsigned char *tempBuffer, // Temporary buffer for scaled image
    float scale,               // Scale factor
    size_t width,              // Frame width
    size_t height              // Frame height
) {
    // Initialize the temporary buffer to transparent black
    size_t frameSize = width * height * 4;
    memset(tempBuffer, 0, frameSize);

    // Calculate center of the frame
    float centerX = width / 2.0f;
    float centerY = height / 2.0f;

    // Loop through each pixel in the target buffer
    for (size_t y = 0; y < height; y++) {
        for (size_t x = 0; x < width; x++) {
            // Calculate the original position in the unscaled image
            float originalX = (x - centerX) / scale + centerX;
            float originalY = (y - centerY) / scale + centerY;

            // Round to the nearest neighbor in the source buffer
            int srcX = (int)roundf(originalX);
            int srcY = (int)roundf(originalY);

            // Copy pixel color from source if within bounds
            if (srcX >= 0 && srcX < (int)width && srcY >= 0 && srcY < (int)height) {
                size_t srcIndex = (srcY * width + srcX) * 4;
                size_t dstIndex = (y * width + x) * 4;
                
                tempBuffer[dstIndex + 0] = screen[srcIndex + 0]; // Red
                tempBuffer[dstIndex + 1] = screen[srcIndex + 1]; // Green
                tempBuffer[dstIndex + 2] = screen[srcIndex + 2]; // Blue
                tempBuffer[dstIndex + 3] = screen[srcIndex + 3]; // Alpha
            }
        }
    }

    // Copy the scaled image back to the original screen buffer
    memcpy(screen, tempBuffer, frameSize);
}