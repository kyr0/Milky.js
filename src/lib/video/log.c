#include <stddef.h>
#include <stdint.h>
#include <string.h>

void log(uint8_t *msg, const char *message) {
    // fill the buffer with 0 and copy the message into the buffer
    strncpy((char *)msg, message, 1024);
    msg[1023] = '\0'; // ensure null-termination
}