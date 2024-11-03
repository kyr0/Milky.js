#include "bitdepth.h"

/**
 * Quantizes a color value using the PNUQ (Perceptually Non-Uniform Quantization) method.
 * Therefore, reduces the color depth of a given color value based on the specified bit depth.
 * It supports common bit depths such as 24, 16, and 8 bits, and defaults to no quantization for unsupported bit depths.
 *
 * @param color    The original color value to be quantized (0-255).
 * @param bitDepth The target bit depth for quantization (e.g., 24, 16, 8).
 * @return         The quantized color value adjusted to the specified bit depth.
 */
uint8_t quantize_pnuq(uint8_t color, uint8_t bitDepth) {
  // determine the number of quantization levels based on the bit depth
  uint8_t levels;
  switch (bitDepth) {
      case 24:
          levels = 255;  // 24-bit color uses full 8-bit per channel, no reduction
          break;
      case 16:
          levels = 31;   // 16-bit color typically uses 5 bits for red/blue, 6 for green
          break;
      case 8:
          levels = 7;    // 8-bit color uses 3 bits per channel
          break;
      default:
          levels = 255;  // unsupported bit depths default to no quantization
  }

  // perform quantization by scaling the color to the reduced level and back to 0-255
  uint8_t quantized = (color * levels / 255) * (255 / levels);
  return quantized;
}

/**
 * Reduces the bit depth of an RGBA frame.
 * Iterates over each pixel in the frame and quantizes the red, green, and blue channels
 * using the Perceptually Non-Uniform Quantization (PNUQ) method. It then applies dithering to the quantized
 * colors to reduce banding effects.
 *
 * @param frame     The frame buffer containing the RGBA pixel data.
 * @param frameSize The size of the frame buffer in bytes.
 * @param bitDepth  The target bit depth for quantization (e.g., 24, 16, 8).
 */
void reduceBitDepth(uint8_t *frame, size_t frameSize, uint8_t bitDepth) {
  // iterate over each pixel in the frame
  for (size_t i = 0; i < frameSize; i += 4) {
      // quantize the red, green, and blue channels using PNUQ
      uint8_t r = quantize_pnuq(frame[i], bitDepth);
      uint8_t g = quantize_pnuq(frame[i + 1], bitDepth);
      uint8_t b = quantize_pnuq(frame[i + 2], bitDepth);

      // apply dithering to the quantized colors to reduce banding
      r = dither(r, frame[i]);
      g = dither(g, frame[i + 1]);
      b = dither(b, frame[i + 2]);

      // store the quantized and dithered values back into the frame
      frame[i] = r;
      frame[i + 1] = g;
      frame[i + 2] = b;
  }
}

/**
 * Applies dithering using the Floyd-Steinberg method.
 * Calculates the error between the original and quantized color, then adjusts the quantized
 * color by diffusing the error. The adjusted color is clamped to ensure it remains within the valid range.
 *
 * @param quantized_color The quantized color value.
 * @param original_color  The original color value before quantization.
 * @return                The dithered color value.
 */
uint8_t dither(uint8_t quantized_color, uint8_t original_color) {
  // calculate the error between the original and quantized color
  int16_t error = (int16_t)original_color - (int16_t)quantized_color;

  // adjust the quantized color by diffusing the error
  int16_t adjusted_color = quantized_color + (error * 7 / 16);

  // clamp the adjusted color to ensure it remains within the valid range
  if (adjusted_color > 255) adjusted_color = 255;
  if (adjusted_color < 0) adjusted_color = 0;

  // return the adjusted color as a uint8_t
  return (uint8_t)adjusted_color;
}
