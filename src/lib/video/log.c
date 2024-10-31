#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <stdarg.h>
#include <stdio.h>

// custom printf-like function for logging messages through the provided message buffer (rendered via console.log in-browser)
void consoleLog(uint8_t *msg, const char *format, ...) {
    va_list args;
    va_start(args, format);
    // format the message with the provided arguments and ensure null-termination
    vsnprintf((char *)msg, 1024, format, args);
    va_end(args);
    msg[1023] = '\0'; // ensure null-termination
}