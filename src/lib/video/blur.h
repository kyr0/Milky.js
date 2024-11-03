#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <wasm_simd128.h>

void blurFrame(uint8_t *prevFrame, size_t frameSize);
void preserveMassFade(uint8_t *prevFrame, uint8_t *frame, size_t frameSize);