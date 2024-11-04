#include "transform.h"

// global variable to store the last theta value
static float milky_transformLastTheta = 0.0f;
static float milky_transformTargetTheta = 0.0f;

/**
 * Rotates the given frame buffer by a calculated angle and blends the result back into the frame.
 * Therefore, applies a smooth rotation transformation to the frame buffer using a temporary buffer.
 * The rotation angle is determined by the speed and angle parameters, and it smoothly transitions
 * towards a randomly set target angle. The rotated image is then blended back into the original frame
 * with a specified alpha value for smooth visual effects.
 *
 * @param timeFrame The time frame for the current rendering cycle.
 * @param tempBuffer A temporary buffer used for storing the rotated image.
 * @param frame The frame buffer (RGBA format) to be rotated.
 * @param speed The speed factor influencing the rotation angle.
 * @param angle The base angle for rotation.
 * @param width The width of the frame buffer in pixels.
 * @param height The height of the frame buffer in pixels.
 */
void rotate(float timeFrame, uint8_t *tempBuffer, uint8_t *frame, float speed, float angle, size_t width, size_t height) {
    // calculate the initial rotation angle based on speed and angle
    float theta = speed * angle;

    // if the difference between lastTheta and targetTheta is small, update targetTheta
    // this ensures that the rotation direction changes smoothly and randomly
    if (fabs(milky_transformLastTheta - milky_transformTargetTheta) < 0.01f) {
        // set a new targetTheta randomly between -45 and 45 degrees
        milky_transformTargetTheta = (rand() % 90 - 45) * (M_PI / 180.0f);
    }

    // interpolate theta towards targetTheta for smooth transition
    theta = milky_transformLastTheta + (milky_transformTargetTheta - milky_transformLastTheta) * 0.005f;
    milky_transformLastTheta = theta; // update lastTheta for the next frame

    // precompute sine and cosine of the current theta for rotation
    float sin_theta = sinf(theta), cos_theta = cosf(theta);
    // calculate the center of the frame for rotation
    float cx = width * 0.5f, cy = height * 0.5f;

    // clear the temporary buffer to prepare for the new rotated frame
    memset(tempBuffer, 0, width * height * 4);

    // iterate over each pixel in the frame
    for (size_t y = 0; y < height; y++) {
        for (size_t x = 0; x < width; x++) {
            // translate coordinates to the center for rotation
            float xt = x - cx, yt = y - cy;
            // apply rotation transformation
            int src_xi = (int)(cos_theta * xt - sin_theta * yt + cx);
            int src_yi = (int)(sin_theta * xt + cos_theta * yt + cy);

            // check if the source pixel is within bounds
            if (src_xi >= 0 && src_xi < (int)width && src_yi >= 0 && src_yi < (int)height) {
                // calculate source and destination indices in the buffer
                size_t src_index = (src_yi * width + src_xi) * 4;
                size_t dst_index = (y * width + x) * 4;
                // copy the pixel from the source to the destination in the temp buffer
                memcpy(&tempBuffer[dst_index], &frame[src_index], 4);
            }
        }
    }

    // blend the rotated image back into the frame with a specified alpha
    float alpha = 0.7f;
    for (size_t i = 0; i < width * height * 4; i++) {
        // apply alpha blending to combine the original and rotated images
        frame[i] = (uint8_t)(frame[i] * (1 - alpha) + tempBuffer[i] * alpha);
    }
}

/**
 * Scales the image in the frame buffer by the specified `scale` factor,
 * using the `tempBuffer` as a temporary storage for the scaled image. The scaling is
 * performed around the center of the image, and the result is copied back to the `frame`.
 *
 * @param frame      The frame buffer containing the image to be scaled (RGBA format).
 * @param tempBuffer A temporary buffer used to store the scaled image.
 * @param scale      The scale factor to apply to the image.
 * @param width      The width of the frame in pixels.
 * @param height     The height of the frame in pixels.
 */
void scale(
    unsigned char *frame,      // Frame buffer (RGBA format)
    unsigned char *tempBuffer, // Temporary buffer for scaled image
    float scale,               // Scale factor
    size_t width,              // Frame width
    size_t height              // Frame height
) {
    // initialize the temporary buffer to transparent black
    size_t frameSize = width * height * 4;
    memset(tempBuffer, 0, frameSize);

    // calculate the center of the frame to use as a pivot for scaling
    float centerX = width / 2.0f;
    float centerY = height / 2.0f;

    // loop through each pixel in the target buffer to apply scaling
    for (size_t y = 0; y < height; y++) {
        for (size_t x = 0; x < width; x++) {
            // calculate the original position in the unscaled image
            // this is done by reversing the scaling transformation
            float originalX = (x - centerX) / scale + centerX;
            float originalY = (y - centerY) / scale + centerY;

            // round to the nearest neighbor in the source buffer
            // this helps in determining the pixel to copy from the original image
            int srcX = (int)roundf(originalX);
            int srcY = (int)roundf(originalY);

            // copy pixel color from source if within bounds
            // ensure that the calculated source position is valid
            if (srcX >= 0 && srcX < (int)width && srcY >= 0 && srcY < (int)height) {
                size_t srcIndex = (srcY * width + srcX) * 4;
                size_t dstIndex = (y * width + x) * 4;
                
                // copy the RGBA values from the source to the destination
                tempBuffer[dstIndex + 0] = frame[srcIndex + 0]; // Red
                tempBuffer[dstIndex + 1] = frame[srcIndex + 1]; // Green
                tempBuffer[dstIndex + 2] = frame[srcIndex + 2]; // Blue
                tempBuffer[dstIndex + 3] = frame[srcIndex + 3]; // Alpha
            }
        }
    }

    // copy the scaled image back to the original frame buffer
    // this final step updates the frame with the newly scaled image
    memcpy(frame, tempBuffer, frameSize);
}
