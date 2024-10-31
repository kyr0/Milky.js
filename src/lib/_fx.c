#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <time.h>
#include <stdbool.h>

#define TIME_SPEED 0.05
float time_seed = 0;

char as[2][2][2][2];

unsigned char DATA_1[57288];
unsigned char DATA_2[57288];
unsigned char DATA_3[57288];
unsigned char DATA_4[57288];
unsigned char DATA_5[57288];
unsigned char DATA_6[57288];
unsigned char *DATA_X = NULL;

void Solid_Line(float frame, unsigned char *VS2);
void Two_Chasers(float frame, unsigned char *VS2);
void PalGen();
void PalGen2();
void MadPalGen();
void VS_Ascii_Paste(const unsigned char *buf);

int main(int argc, char* argv[]) {
    as[0][0][0][0] = ' ';
    as[0][0][0][1] = '.';
    as[0][0][1][0] = ',';
    as[0][0][1][1] = '_';
    as[0][1][0][0] = '\'';
    as[0][1][0][1] = ']';
    as[0][1][1][0] = '/';
    as[0][1][1][1] = 'J';
    as[1][0][0][0] = '`';
    as[1][0][0][1] = '\\';
    as[1][0][1][0] = '[';
    as[1][0][1][1] = 'L';
    as[1][1][0][0] = '~';
    as[1][1][0][1] = '7';
    as[1][1][1][0] = 'P';
    as[1][1][1][1] = 'O';

    int effect_1 = 1, effect_2 = -1, sun_effect = -1;
    unsigned int a, b, addr, z1, z2, mode;
    long k, k1, k2, intframe = 0;
    float newx, newy, newx2, newy2, floatframe = 0;
    float scale1, scale2, turn1, turn2, x_trans = 0, y_trans = 0;
    bool quitnow = false;
    unsigned char p1, p2, p3;

    int x, y, solar_max, initial_sun = 0;
    float center_dwindle;
    unsigned int fx, z, A_offset, A_number, R_offset, D_offset;

    srand((unsigned int)time(NULL));

    printf("\nAllocating memory...\n");

    unsigned char VS1[64000];
    unsigned char VS2[64000];

    mode = 1 + rand() % 6;

    if (argc >= 2) {
        if (argv[1][0] == '1') mode = 1;
        else if (argv[1][0] == '2') mode = 2;
        else if (argv[1][0] == '3') mode = 3;
        else if (argv[1][0] == '4') mode = 4;
        else if (argv[1][0] == '5') mode = 5;
        else if (argv[1][0] == '6') mode = 6;
        else if (argv[1][0] == '9') mode = 9;
    }
    if (argc == 3) {
        srand((unsigned int)time(NULL) + atoi(argv[2]));
        floatframe = rand() % 1000 + (rand() % 1000) * 0.001f;
    }

    // Mode-specific settings
    if (mode == 1) {
        scale1 = 0.98f; turn1 = 0.01f;
        scale2 = 0.98f; turn2 = 0.01f;
        solar_max = 1100;
        center_dwindle = 1.00f;
        initial_sun = 1;
    } else if (mode == 2) {
        scale1 = 0.98f; turn1 = 0.02f;
        scale2 = 0.98f; turn2 = 0.03f;
        solar_max = 1100;
        sun_effect = 1;
        center_dwindle = 1.00f;
        initial_sun = 1;
    } else if (mode == 3) {
        scale1 = 0.9f; turn1 = 0.05f;
        scale2 = 0.9f; turn2 = 0.05f;
        solar_max = 400;
        sun_effect = 1;
        center_dwindle = 0.99f;
    } else if (mode == 4) {
        scale1 = 0.9f; turn1 = 0.02f;
        scale2 = 0.9f; turn2 = 0.02f;
        solar_max = 400;
        center_dwindle = 0.99f;
    } else if (mode == 5) {
        turn1 = 0.02f;
        turn2 = 0.02f;
        solar_max = 400;
        sun_effect = 1;
        center_dwindle = 0.985f;
    } else if (mode == 6) {
        turn1 = 0.02f;
        turn2 = 0.02f;
        solar_max = 400;
        sun_effect = 1;
        center_dwindle = 0.985f;
    } else if (mode == 9) {
        turn1 = 0.02f;
        turn2 = 0.02f;
        solar_max = 400;
        sun_effect = 1;
        center_dwindle = 0.985f;
    }

    if (mode == 9) {
        srand((unsigned int)time(NULL));
        p1 = rand() % 10;
        p2 = rand() % 10;
        p3 = rand() % 4;
    }

    k = 0;
    for (y = 7; y <= 192; y++) {
        for (x = 6; x <= 313; x++) {
            R_offset = 64000;
            A_offset = (k % 9548) * 6;
            A_number = k / 9548;

            newx2 = x - 159;
            newy2 = y - 99;

            if (mode == 5) {
                scale1 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.008f;
                scale2 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.008f;
            }

            if (mode == 6) {
                scale1 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0028f;
                scale2 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0028f;
            }

            if (mode == 9) {
                if (p3 == 0) {
                    scale1 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0018f * cosf(newx2 * 0.04f + p1);
                    scale2 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0018f * sinf(newy2 * 0.04f + p2);
                } else if (p3 == 1) {
                    scale1 = 0.95f;
                    scale2 = 0.95f;
                    turn1 = -sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0018f * cosf(newx2 * 0.04f + p1);
                    turn2 = -sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0018f * sinf(newy2 * 0.04f + p2);
                } else if (p3 == 2) {
                    scale1 = 0.97f;
                    scale2 = 0.97f;
                    turn1 = -sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.003f * cosf(newx2 * 0.03f + p1);
                    turn2 = -sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.003f * sinf(newy2 * 0.03f + p2);
                } else if (p3 == 3) {
                    scale1 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0005f * cosf(newx2 * 0.04f + p2);
                    scale2 = 0.9f - sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0005f * sinf(newy2 * 0.04f + p1);
                    turn1 = -sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0005f * cosf(newx2 * 0.03f + p1);
                    turn2 = -sqrtf(newx2 * newx2 + newy2 * newy2 * 1.2f) * 0.0005f * sinf(newy2 * 0.03f + p2);
                }
            }

            if ((x % 2 == 1) == (y % 2)) {
                newx = newx2 * cosf(turn1) - newy2 * sinf(turn1);
                newy = newx2 * sinf(turn1) + newy2 * cosf(turn1);
                newx = (newx) * scale1 + 159 + x_trans;
                newy = (newy) * scale1 + 99 + y_trans;
            } else {
                newx = newx2 * cosf(turn2) - newy2 * sinf(turn2);
                newy = newx2 * sinf(turn2) + newy2 * cosf(turn2);
                newx = (newx) * scale2 + 159 + x_trans;
                newy = (newy) * scale2 + 99 + y_trans;
            }

            if (((newx < 6) || (newx > 313)) || ((newy < 7) || (newy > 192))) {
                a = 320;
                b = 200;
                R_offset = 500;
            } else {
                a = (unsigned int)newx;
                b = (unsigned int)newy;
                R_offset = b * 320 + a + 4;

                newx2 = (newx - a);
                newy2 = (newy - b);
            }

            if (A_number == 0) {
                DATA_1[A_offset + 0] = (unsigned char)((1 - newx2) * (1 - newy2) * 255);
                DATA_1[A_offset + 1] = (unsigned char)((newx2) * (1 - newy2) * 255);
                DATA_1[A_offset + 2] = (unsigned char)((1 - newx2) * (newy2) * 255);
                DATA_1[A_offset + 3] = (unsigned char)((newx2) * (newy2) * 255);
                DATA_1[A_offset + 4] = (unsigned char)(R_offset % 256);
                DATA_1[A_offset + 5] = (unsigned char)(R_offset / 256);
            } else if (A_number == 1) {
                DATA_2[A_offset + 0] = (unsigned char)((1 - newx2) * (1 - newy2) * 255);
                DATA_2[A_offset + 1] = (unsigned char)((newx2) * (1 - newy2) * 255);
                DATA_2[A_offset + 2] = (unsigned char)((1 - newx2) * (newy2) * 255);
                DATA_2[A_offset + 3] = (unsigned char)((newx2) * (newy2) * 255);
                DATA_2[A_offset + 4] = (unsigned char)(R_offset % 256);
                DATA_2[A_offset + 5] = (unsigned char)(R_offset / 256);
            } else if (A_number == 2) {
                DATA_3[A_offset + 0] = (unsigned char)((1 - newx2) * (1 - newy2) * 255);
                DATA_3[A_offset + 1] = (unsigned char)((newx2) * (1 - newy2) * 255);
                DATA_3[A_offset + 2] = (unsigned char)((1 - newx2) * (newy2) * 255);
                DATA_3[A_offset + 3] = (unsigned char)((newx2) * (newy2) * 255);
                DATA_3[A_offset + 4] = (unsigned char)(R_offset % 256);
                DATA_3[A_offset + 5] = (unsigned char)(R_offset / 256);
            } else if (A_number == 3) {
                DATA_4[A_offset + 0] = (unsigned char)((1 - newx2) * (1 - newy2) * 255);
                DATA_4[A_offset + 1] = (unsigned char)((newx2) * (1 - newy2) * 255);
                DATA_4[A_offset + 2] = (unsigned char)((1 - newx2) * (newy2) * 255);
                DATA_4[A_offset + 3] = (unsigned char)((newx2) * (newy2) * 255);
                DATA_4[A_offset + 4] = (unsigned char)(R_offset % 256);
                DATA_4[A_offset + 5] = (unsigned char)(R_offset / 256);
            } else if (A_number == 4) {
                DATA_5[A_offset + 0] = (unsigned char)((1 - newx2) * (1 - newy2) * 255);
                DATA_5[A_offset + 1] = (unsigned char)((newx2) * (1 - newy2) * 255);
                DATA_5[A_offset + 2] = (unsigned char)((1 - newx2) * (newy2) * 255);
                DATA_5[A_offset + 3] = (unsigned char)((newx2) * (newy2) * 255);
                DATA_5[A_offset + 4] = (unsigned char)(R_offset % 256);
                DATA_5[A_offset + 5] = (unsigned char)(R_offset / 256);
            } else {
                DATA_6[A_offset + 0] = (unsigned char)((1 - newx2) * (1 - newy2) * 255);
                DATA_6[A_offset + 1] = (unsigned char)((newx2) * (1 - newy2) * 255);
                DATA_6[A_offset + 2] = (unsigned char)((1 - newx2) * (newy2) * 255);
                DATA_6[A_offset + 3] = (unsigned char)((newx2) * (newy2) * 255);
                DATA_6[A_offset + 4] = (unsigned char)(R_offset % 256);
                DATA_6[A_offset + 5] = (unsigned char)(R_offset / 256);
            }

            if (initial_sun) {
                newx = sqrtf((newx - 160) * (newx - 160) + (newy - 100) * (newy - 100) * 1.2f);
                if (newx < 65) VS1[y * 320 + x] = 195 - newx * 3;
                else VS1[y * 320 + x] = 0;
                if ((mode == 4) || (mode == 3)) VS1[y * 320 + x] *= 0.6f;
            }

            k++;
        }
    }

    // Main loop
    while (!quitnow) {
        intframe++;
        time_seed += TIME_SPEED;

        for (A_number = 0; A_number <= 5; A_number++) {
            if (A_number == 0) DATA_X = DATA_1;
            else if (A_number == 1) DATA_X = DATA_2;
            else if (A_number == 2) DATA_X = DATA_3;
            else if (A_number == 3) DATA_X = DATA_4;
            else if (A_number == 4) DATA_X = DATA_5;
            else DATA_X = DATA_6;

            z = 0;

            for (y = 7 + A_number * 31; y < 7 + (A_number + 1) * 31; y++) {
                D_offset = y * 320 + 6;

                for (x = 6; x <= 313; x++) {
                    // Simulate the assembly block with C logic
                    unsigned char cl = DATA_X[z + 0];
                    unsigned char ch = DATA_X[z + 1];
                    unsigned char bl = DATA_X[z + 2];
                    unsigned char bh = DATA_X[z + 3];
                    unsigned int read_offset = DATA_X[z + 4] + (DATA_X[z + 5] << 8);

                    unsigned char color = VS1[read_offset];
                    unsigned int result = color * cl + color * ch + color * bl + color * bh;
                    VS2[D_offset] = (unsigned char)(result >> 8);

                    D_offset++;
                    z += 6;
                }
            }
        }

        // Effects
        if (effect_1 == 1) Two_Chasers(floatframe, VS2);
        if (effect_2 == 1) Solid_Line(floatframe, VS2);

        if (sun_effect == 1) {
            for (k = solar_max; k > 0; k--) {
                y = rand() % (192 - 7 + 1) + 7;
                x = rand() % (313 - 6 + 1) + 7;

                newy = y;
                newx = x;

                newx = sqrtf((newx - 160) * (newx - 160) + (newy - 100) * (newy - 100) * 1.2f);
                if (newx < 65) z = 195 - newx * 3;
                else z = 0;
                if (VS2[y * 320 + x] < z) VS2[y * 320 + x] = z;
            }
        }

        if (VS2[159 + 99 * 320] > 1) VS2[159 + 99 * 320] *= center_dwindle;
        if (VS2[158 + 99 * 320] > 1) VS2[158 + 99 * 320] *= center_dwindle;
        if (VS2[160 + 99 * 320] > 1) VS2[160 + 99 * 320] *= center_dwindle;
        if (VS2[159 + 100 * 320] > 1) VS2[159 + 100 * 320] *= center_dwindle;
        if (VS2[159 + 98 * 320] > 1) VS2[159 + 98 * 320] *= center_dwindle;

        // Swap buffers
        unsigned char *temp = VS1;
        VS1 = VS2;
        VS2 = temp;

        // Handle input (simplified for WebAssembly)
        // In a real WebAssembly environment, input handling would be different
        // Here, we simulate a quit condition
        if (intframe > 1000) quitnow = true;

        floatframe += 1.6f;
    }

    printf("\nFX v2.30 - a subpixel blur engine written by Ryan Geiss in C++/asm, 2/98\n");
    printf("Fully optimized for Intel Pentium.\n\n");
    printf("Add a number 1-6 as a command-line parameter to specify which of the\n");
    printf("six modes to use; otherwise one is selected randomly.  Add a second\n");
    printf("parameter for a random seed.  Hotkeys are:\n\n");
    printf("   1: toggle chaser_1 on/off\n");
    printf("   2: toggle chaser_2 on/off\n");
    printf("   s: toggle solar particles on/off\n");
    printf("   p: change palette (1 of 4 duotones)\n");
    printf("   P: change palette (1 of 4 semi-chaotic duotones)\n");
    printf("   c: crazy palette (random)\n");
    printf("\n");
    printf("mode:   %u\n", mode);
    printf("fps:    %7.5f\n\n", intframe / (float)(clock() / CLOCKS_PER_SEC));

    return 0;
}

void Two_Chasers(float frame, unsigned char *VS2) {
    unsigned int k, a, b;

    for (k = 0; k < 20; k++) {
        frame = frame + 0.08f;
        a = 159 + (int)(54 * cosf(frame * 0.1102f + 10) + 45 * cosf(frame * 0.1312f + 20));
        b = 99 + (int)(34 * cosf(frame * 0.1204f + 40) + 35 * cosf(frame * 0.1715f + 30));
        VS2[b * 320 + a] = 255;

        a = 159 + (int)(44 * cosf(frame * 0.1213f + 33) + 35 * cosf(frame * 0.1408f + 15));
        b = 99 + (int)(32 * cosf(frame * 0.1304f + 12) + 31 * cosf(frame * 0.1103f + 21));
        VS2[b * 320 + a] = 255;
    }
}

void Solid_Line(float frame, unsigned char *VS2) {
    unsigned int k, a, b, k2;
    float newx, newy, newx2, newy2;

    frame = frame * 0.55f / (0.08f * 20);
    newx = 159 + (int)(16 * cosf(frame * 0.1102f + 10) + 15 * cosf(frame * 0.1312f + 20));
    newy = 99 + (int)(15 * cosf(frame * 0.1204f + 40) + 10 * cosf(frame * 0.1715f + 30));
    newx2 = 159 + (int)(14 * cosf(frame * 0.1213f + 33) + 13 * cosf(frame * 0.1408f + 15));
    newy2 = 99 + (int)(13 * cosf(frame * 0.1304f + 12) + 11 * cosf(frame * 0.1103f + 21));

    for (k = 0; k < 50; k++) {
        a = (unsigned int)(newx * (k / 50.0f) + newx2 * (1 - k / 50.0f));
        b = (unsigned int)(newy * (k / 50.0f) + newy2 * (1 - k / 50.0f));
        k2 = b * 320 + a;
        if (VS2[k2] < 230) VS2[k2] += 20;
    }
}

void PalGen() {
    int a, k = rand() % 4;

    if (k == 0) {
        for (a = 0; a < 64; a++) setRGB(a, a, a * a / 64.0f, sqrtf(a) * 8);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    } else if (k == 1) {
        for (a = 0; a < 64; a++) setRGB(a, a * a / 64.0f, sqrtf(a) * 8, a);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    } else if (k == 2) {
        for (a = 0; a < 64; a++) setRGB(a, sqrtf(a) * 8, a, a * a / 64.0f);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    } else if (k == 3) {
        for (a = 0; a < 64; a++) setRGB(a, a * a / 64.0f, a, sqrtf(a) * 8);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    }
}

void MadPalGen() {
    int j1, j2, j3, a;

    j1 = rand() % 5 + 2;
    j2 = rand() % 5 + 2;
    j3 = rand() % 5 + 2;
    for (a = 0; a < 64; a++) setRGB(a, a * j1, a * j2, a * j3);
    for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
}

void PalGen2() {
    int a, k = rand() % 5;

    if (k == 0) {
        for (a = 0; a < 64; a++) setRGB(a, a, sqrtf(a) * 8, sinf(a / 63.0f * 6.2f - 1.6f) * 31 + 32);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    } else if (k == 1) {
        for (a = 0; a < 64; a++) setRGB(a, sinf(a / 63.0f * 6.2f - 1.6f) * 31 + 32, a, sqrtf(a) * 8);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    } else if (k == 2) {
        for (a = 0; a < 64; a++) setRGB(a, a, sinf(a / 63.0f * 6.2f - 1.6f) * 31 + 32, a * a / 64.0f);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    } else if (k == 3) {
        for (a = 0; a < 64; a++) setRGB(a, sqrtf(a) * 8, a * a / 64.0f, sinf(a / 63.0f * 6.2f - 1.6f) * 31 + 32);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    } else if (k == 4) {
        for (a = 0; a < 32; a++) setRGB(a, 0, 0, 0);
        for (a = 0; a < 32; a++) setRGB(a + 32, sqrtf(a) * 10, a * 2, a * 2);
        for (a = 64; a < 256; a++) setRGB(a, 63, 63, 63);
    }
}

void VS_Ascii_Paste(const unsigned char *buf) {
    printf("\n");

    int a, b, w, x, y, z;

    for (a = 0; a < 25; a++) {
        for (b = 0; b < 80; b++) {
            w = buf[b * 2 + a * 2] > 50;
            x = buf[b * 2 + a * 2 + 1] > 50;
            y = buf[b * 2 + a * 2 + 160] > 50;
            z = buf[b * 2 + a * 2 + 161] > 50;
            printf("%c", as[w][x][y][z]);
        }
    }
}