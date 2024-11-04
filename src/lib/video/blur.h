#ifndef BLUR_H
#define BLUR_H

#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

void blurFrame(uint8_t *prevFrame, size_t frameSize);
void preserveMassFade(uint8_t *prevFrame, uint8_t *frame, size_t frameSize);

#endif // BLUR_H
