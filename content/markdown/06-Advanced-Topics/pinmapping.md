---
slug: advanced/pin-mapping
---

# Pin Mapping

Pin mapping (pinmapping) in grblHAL is done at compile time through C preprocessor macros in board map header files. Each supported MCU platform has its own driver repository with a set of `*_map.h` files under a `boards/` directory, one per supported physical board.

The user selects a board by uncommenting a `#define BOARD_xxx` line in `my_machine.h`. The `driver.h` for that platform then `#include`s the corresponding map header. If no board is selected, a `generic_map.h` fallback is used.

---

## 1. Four Pin Numbering Models

grblHAL uses four different pin numbering conventions depending on the MCU platform:

### Model A: Direct GPIO Numbers

Used by **ESP32** and **iMXRT1062 (Teensy 4.x)**. Pins are specified as a single numeric value.

**ESP32** uses `GPIO_NUM_x` constants from the ESP-IDF:

```c
#define X_STEP_PIN              GPIO_NUM_12
#define X_DIRECTION_PIN         GPIO_NUM_26
```

**iMXRT1062** (Teensy 4.x) uses raw pin numbers with a `u` suffix:

```c
#define X_STEP_PIN              (2u)
#define X_DIRECTION_PIN         (3u)
#define Y_STEP_PIN              (4u)
```

### Model B: GPIO Port + Pin Pairs

Used by **STM32F4xx**, **STM32F7xx**, **STM32H7xx**, **SAM3X8E (Arduino Due)**, and **LPC176x**. Signals split into a `_PORT` and a `_PIN` macro to allow any GPIO port and pin combination.

**STM32F4xx example** (per-axis step on individual ports):

```c
#define X_STEP_PORT             GPIOC
#define X_STEP_PIN              0
#define Y_STEP_PORT             GPIOC
#define Y_STEP_PIN              5
#define Z_STEP_PORT             GPIOC
#define Z_STEP_PIN              9

#define X_DIRECTION_PORT        GPIOA
#define X_DIRECTION_PIN         0
#define Y_DIRECTION_PORT        GPIOA
#define Y_DIRECTION_PIN         4

#define X_ENABLE_PORT           GPIOA
#define X_ENABLE_PIN            1
#define Y_ENABLE_PORT           GPIOB
#define Y_ENABLE_PIN            12
```

**STM32F4xx with shared step port** (all step pins on the same port):

```c
#define STEP_PORT               GPIOC
#define X_STEP_PIN              0
#define Y_STEP_PIN              5
#define Z_STEP_PIN              9
```

**LPC176x example:**

```c
#define X_STEP_PORT             0
#define X_STEP_PIN              17
#define Y_STEP_PORT             0
#define Y_STEP_PIN              21
```

**SAM3X8E (Due) example** (uses PIO_PORT):

```c
#define STEP_PORT               PIO_PORT_A
#define X_STEP_PIN              11
#define Y_DIRECTION_PORT        PIO_PORT_A
#define Y_DIRECTION_PIN         29
```

### Model C: GPIO Port Constants (RP2040/RP2350)

The **RP2040** driver defines symbolic port constants in `driver.h` that abstract the I/O technology used:

| Constant     | Meaning |
|:-------------|:--------|
| `GPIO_OUTPUT` | Direct GPIO output |
| `GPIO_INPUT`  | Direct GPIO input |
| `GPIO_PIO`    | PIO state machine for step pulses (consecutive pins) |
| `GPIO_PIO_1`  | PIO1, per-axis step pins |
| `GPIO_MAP`    | GPIO register mapping mode |
| `GPIO_SR8`    | 8-bit shift register for step/dir |
| `GPIO_SR16`   | 16-bit shift register for output expansion |
| `GPIO_IOEXPAND` | External I/O expander |
| `GPIO_SHIFT0`..`GPIO_SHIFT28` | Bit-shifted GPIO output mode |
| `GPIO_DIRECT` | Direct GPIO output |
| `EXPANDER_PORT` | Output via external expander (e.g. 74HCT595) |

**RP2040 PIO stepping** (all step pins driven by a PIO state machine):

```c
#define STEP_PORT               GPIO_PIO   // N_AXIS consecutive pins
#define STEP_PINS_BASE          2          // First pin used by PIO
// X_STEP_PIN = 2, Y_STEP_PIN = 3, Z_STEP_PIN = 4 (auto-assigned)

#define DIRECTION_PORT          GPIO_OUTPUT
#define X_DIRECTION_PIN         5
#define Y_DIRECTION_PIN         6
#define Z_DIRECTION_PIN         7
#define DIRECTION_OUTMODE       GPIO_SHIFT5
```

**RP2040 per-axis PIO stepping** (separate PIO instances):

```c
#define STEP_PORT               GPIO_PIO_1
#define X_STEP_PIN              12
#define Y_STEP_PIN              14
#define Z_STEP_PIN              16
```

**RP2040 with shift register step/dir:**

```c
#define SD_SHIFT_REGISTER       8
#define SD_SR_DATA_PIN          14
#define SD_SR_SCK_PIN           15
#define STEP_PORT               GPIO_SR8
#define DIRECTION_PORT          GPIO_SR8
```

### Model D: I2S Output Expansion (ESP32)

ESP32 boards that use a 74HCT595 shift register driven by the I2S peripheral define step/dir pins via the `I2SO(n)` macro. This maps logical bit positions on the shift register to pin numbers above a base (default 64).

```c
#include "use_i2s_out.h"

#define I2S_OUT_BCK             GPIO_NUM_22
#define I2S_OUT_WS              GPIO_NUM_17
#define I2S_OUT_DATA            GPIO_NUM_21

#define X_STEP_PIN              I2SO(0)
#define X_DIRECTION_PIN         I2SO(1)
#define Y_STEP_PIN              I2SO(2)
#define Y_DIRECTION_PIN         I2SO(3)
```

The `I2SO(n)` macro expands to `(I2S_OUT_PIN_BASE + n)`. The base is 64 by default. The `use_i2s_out.h` header reroutes `DIGITAL_OUT()` calls for pins >= 64 through the I2S expander.

---

## 2. Motor and Axis Mapping

### Primary Axes (X, Y, Z)

Every board map defines step and direction pins for the three primary axes:

```c
#define X_STEP_PIN              ...
#define X_DIRECTION_PIN         ...
#define Y_STEP_PIN              ...
#define Y_DIRECTION_PIN         ...
#define Z_STEP_PIN              ...
#define Z_DIRECTION_PIN         ...
```

On platforms using the port+pin model, each motor signal may have a unique port:

```c
#define X_STEP_PORT             GPIOF
#define X_STEP_PIN              13
#define Y_STEP_PORT             GPIOG
#define Y_STEP_PIN              0
```

### ABC Motors (M3, M4, M5, M6, M7)

Additional motors beyond XYZ are ganged/secondary axes controlled by the `N_ABC_MOTORS` setting. Each motor is gated by preprocessor conditionals:

```c
#if N_ABC_MOTORS >= 1
#define M3_AVAILABLE
#define M3_STEP_PIN             ...
#define M3_DIRECTION_PIN        ...
#define M3_LIMIT_PIN            ...
#define M3_ENABLE_PIN           ...
#endif

#if N_ABC_MOTORS >= 2
#define M4_AVAILABLE
...
#endif

#if N_ABC_MOTORS >= 3
#define M5_AVAILABLE
...
#endif
```

Maximum supported motors varies by platform:

| Platform  | Max Motors | Typical Boards               |
|:----------|:-----------|:-----------------------------|
| STM32H7xx | 8          | Octopus Pro, Dresco Octave   |
| STM32F4xx | 8          | Octopus Pro (F446/F429)      |
| RP2040    | 8          | generic 8-axis map           |
| LPC176x   | 4          | BTT SKR 1.4 Turbo            |
| ESP32     | 6          | BDRING I2S, Root CNC Pro     |
| iMXRT1062 | 5          | T41U5XBB, GRBLHAL2000        |
| SAM3X8E   | 3          | tinyg2_due, RAMPS            |

### Per-Axis Enable vs Shared Enable

Boards can use either a single shared stepper enable or individual per-motor enables:

**Shared enable** (ESP32 generic, LPC176x generic):

```c
#define STEPPERS_ENABLE_PIN     GPIO_NUM_13
```

**Per-axis enable** (STM32F4xx Octopus Pro, iMXRT1062 T41U5XBB, RP2040 BTT SKR Pico):

```c
#define X_ENABLE_PIN            GPIO_NUM_10
#define Y_ENABLE_PIN            GPIO_NUM_40
#define Z_ENABLE_PIN            GPIO_NUM_39
#if N_ABC_MOTORS > 0
#define M3_ENABLE_PIN           GPIO_NUM_38
#endif
```

The shared or per-axis pattern is determined by the board map and cannot be changed at runtime.

### Ganged Axes and Auto-Square

When `N_ABC_MOTORS >= 1`, the extra motor can be used either as an ABC axis or as a **ganged** (second) motor for an existing axis. Ganging and auto-squaring are enabled in `my_machine.h`:

```c
#define X_GANGED            1
#define X_AUTO_SQUARE       1
#define Y_GANGED            1
```

When an axis is ganged, its extra motor follows the primary motor's step commands. Auto-squaring adds homing logic to re-synchronize ganged motors at startup.

---

## 3. Limit Switch Pins

### Minimum Limits

```c
#define X_LIMIT_PIN             GPIO_NUM_2
#define Y_LIMIT_PIN             GPIO_NUM_4
#define Z_LIMIT_PIN             GPIO_NUM_15
```

On port+pin platforms:

```c
#define X_LIMIT_PORT            GPIOG
#define X_LIMIT_PIN             6
```

### ABC Motor Limits

Only enabled when `N_ABC_MOTORS` is high enough and the board defines them:

```c
#if N_ABC_MOTORS >= 1
#define M3_LIMIT_PIN            ...
#endif
```

Some boards conditionally enable ABC motor limits with `M3_LIMIT_ENABLE`:

```c
#if M3_LIMIT_ENABLE
#define M3_LIMIT_PORT           GPIOC
#define M3_LIMIT_PIN            11
#endif
```

### Shared Limits for Auto-Square

Auto-squared axes share limit pins between the primary and secondary motor. For example, the BlackBox X32 uses a shared Z limit pin that is routed to M3 during auto-square homing via `board_init()`:

```c
// BlackBoxX32.c board_init() routes shared Z limit to M3
```

### Limit Input Mode

Port+pin platforms define how the limit port is read:

```c
#define LIMIT_INMODE            GPIO_MAP     // or GPIO_BITBAND, GPIO_SHIFT12
```

For RP2040:

```c
#define LIMIT_PORT              GPIO_INPUT
#define LIMIT_INMODE            GPIO_MAP
```

---

## 4. IO Expanders

grblHAL supports several types of IO expanders to increase the number of available outputs.

### HC595 SPI Shift Register (ESP32 Ooznest)

The 74HCT595 is driven via SPI chip select. Outputs are accessed through the `EXPANDER_PORT` mechanism:

```c
#define USE_EXPANDERS
#define HC595_CS_PIN            GPIO_NUM_8

#define STEPPERS_ENABLE_PORT    EXPANDER_PORT
#define STEPPERS_ENABLE_PIN     3
#define SPINDLE_ENABLE_PORT     EXPANDER_PORT
#define SPINDLE_ENABLE_PIN      0

#define COOLANT_FLOOD_PORT      EXPANDER_PORT
#define COOLANT_FLOOD_PIN       2
```

The `EXPANDER_OUT(pin, state)` macro writes to the shift register:

```c
#define EXPANDER_OUT(pin, state) { if(iox_out[pin]) iox_out[pin]->set_value(iox_out[pin], (float)state); }
```

### PCA9654E I2C I/O Expander (CNC BoosterPack)

The PCA9654E is an I2C-based 8-bit I/O expander. Enabled via `PCA9654E_ENABLE`:

```c
#define PCA9654E_ENABLE         1
#define USE_EXPANDERS

#define STEPPERS_ENABLE_PORT    EXPANDER_PORT
#define STEPPERS_ENABLE_PIN     6      // PCA9654E output bit
#define SPINDLE_ENABLE_PORT     EXPANDER_PORT
#define SPINDLE_ENABLE_PIN      7
```

The default I2C address is `0x40`.

### OUT_SHIFT_REGISTER (RP2040 PicoCNC)

The RP2040 PicoCNC board uses a dedicated 16-bit shift register (`sr16_out.c`) for output expansion:

```c
#define USE_EXPANDERS
#define OUT_SHIFT_REGISTER       16
#define OUT_SR_DATA_PIN          17
#define OUT_SR_SCK_PIN           18   // includes next pin (19) automatically as latch

#define ENABLE_PORT             EXPANDER_PORT
#define X_ENABLE_PIN            0
#define Y_ENABLE_PIN            1
#define Z_ENABLE_PIN            2
#define M3_ENABLE_PIN           3

#define SPINDLE_PORT            EXPANDER_PORT
#define COOLANT_PORT            EXPANDER_PORT
```

The SR16 driver in `sr16_out.c` uses a PIO state machine to clock data out to the shift register chain.

### FlexGPIO Expander (FlexiHAL 2350)

The FlexiHAL RP2350 board uses an external RP2040-based FlexGPIO I/O expander over I2C:

```c
#define USE_EXPANDERS           1
#define IOX_PIN_COUNT           48

#define ENABLE_PORT             EXPANDER_PORT
#define X_ENABLE_PIN            29
#define Y_ENABLE_PIN            28
#define Z_ENABLE_PIN            27
```

The `FLEXGPIO_ENABLE` must be defined to activate FlexGPIO communication.

### IOEXPAND Generic Pattern (ESP32-S3 BoosterPack)

Some board maps use a generic `IOEXPAND` symbolic pin that gets resolved at runtime:

```c
#define STEPPERS_ENABLE_PIN     IOEXPAND
#define SPINDLE_DIRECTION_PIN   IOEXPAND
#define SPINDLE_ENABLE_PIN      IOEXPAND
```

This is handled at startup by `aux_ctrl_claim_ports()` which matches symbolic expander pins to available physical expander ports.

---

## 5. Auxiliary Output Pool (AUXOUTPUT)

grblHAL maintains a pool of auxiliary output pins that other features (spindle, coolant, etc.) can reference.

### Defining AUXOUTPUT Pins

```c
#define AUXOUTPUT0_PIN          GPIO_NUM_17   // Model A
#define AUXOUTPUT1_PIN          GPIO_NUM_18

#define AUXOUTPUT0_PORT         GPIOB         // Model B
#define AUXOUTPUT0_PIN          15
```

### AUXOUTPUT Count by Platform

| Platform  | Typical Range | Example Board              |
|:----------|:--------------|:---------------------------|
| ESP32     | 0-7           | Root CNC Pro (up to 9)     |
| RP2040    | 0-7           | generic_map (0-7)          |
| STM32F4xx | 0-10          | Octopus Pro (0-11)         |
| iMXRT1062 | 0-8           | E5XMCS_T41 (up to 8)       |
| LPC176x   | 0-7           | BTT SKR 1.4 Turbo          |

### Cross-Referencing AUXOUTPUTs

Spindle and coolant pins typically reference AUXOUTPUT pins rather than using raw GPIO numbers:

```c
#define AUXOUTPUT0_PIN          GPIO_NUM_17   // Spindle PWM
#define AUXOUTPUT1_PIN          GPIO_NUM_18   // Spindle enable
#define AUXOUTPUT2_PIN          GPIO_NUM_5    // Spindle direction
#define AUXOUTPUT3_PIN          GPIO_NUM_16   // Coolant flood
#define AUXOUTPUT4_PIN          GPIO_NUM_21   // Coolant mist

#if DRIVER_SPINDLE_ENABLE & SPINDLE_PWM
#define SPINDLE_PWM_PIN         AUXOUTPUT0_PIN
#endif
```

This allows the spindle plugin to claim the pin at runtime. If AUXOUTPUT0 is used for something else, spindle PWM checks for the macro and silently skips if not defined.

### PWM-Capable AUX Outputs

Some boards define `AUXOUTPUTn_PWM_PIN` for servo/PWM output:

```c
#define AUXOUTPUT0_PWM_PIN      29   // BLTouch servo output
#define AUXOUTPUT0_PWM_PORT     GPIOA
```

These are used by `BLTOUCH_ENABLE` and `PWM_SERVO_ENABLE` plugins.

---

## 6. Auxiliary Input Pool (AUXINPUT)

The auxiliary input pool supplies pins for control signals, probes, and other inputs.

### Defining AUXINPUT Pins

```c
#define AUXINPUT0_PIN           GPIO_NUM_35
#define AUXINPUT1_PIN           GPIO_NUM_32
#define AUXINPUT2_PIN           GPIO_NUM_34   // Reset/EStop
#define AUXINPUT3_PIN           GPIO_NUM_36   // Feed hold
#define AUXINPUT4_PIN           GPIO_NUM_39   // Cycle start
```

Port+pin form:

```c
#define AUXINPUT0_PORT          GPIOB
#define AUXINPUT0_PIN           14
```

### Cross-Referencing Control and Probe Pins

```c
#if CONTROL_ENABLE & CONTROL_HALT
#define RESET_PIN               AUXINPUT2_PIN
#endif
#if CONTROL_ENABLE & CONTROL_FEED_HOLD
#define FEED_HOLD_PIN           AUXINPUT3_PIN
#endif
#if CONTROL_ENABLE & CONTROL_CYCLE_START
#define CYCLE_START_PIN         AUXINPUT4_PIN
#endif
#if PROBE_ENABLE
#define PROBE_PIN               AUXINPUT1_PIN
#endif
#if SAFETY_DOOR_ENABLE
#define SAFETY_DOOR_PIN         AUXINPUT0_PIN
#endif
```

### Shared AUXINPUT Pins for Optional Features

Many board maps conditionally assign AUXINPUT pins based on feature conflicts:

```c
#if SPINDLE_ENCODER_ENABLE
#define SPINDLE_PULSE_PIN       21
#define SPINDLE_INDEX_PIN       22
#else
#define AUXINPUT0_PIN           22
#define AUXINPUT1_PIN           21
#endif
```

```c
#ifndef M3_LIMIT_PIN
#define AUXINPUT2_PIN           11   // Repurpose ABC limit pin as aux input
#endif
```

---

## 7. Claiming Pins from the Aux Pool

grblHAL has a runtime pin claiming system that assigns features (probe, safety door, motor fault, etc.) to available auxiliary pins.

### Input Pin Claiming

The `aux_claim_explicit()` callback iterates over enabled features and matches them to available AUXINPUT pins by port number:

```c
static bool aux_claim_explicit (aux_ctrl_t *aux_ctrl)
{
    // Match aux_ctrl->port to inputpin[] entries with PinGroup_AuxInput
    // Then call aux_ctrl_claim_port() to bind the function
    switch(aux_ctrl->function) {
        case Input_Probe:        probe_add(Probe_Default, ...); break;
        case Input_Probe2:       probe_add(Probe_2, ...); break;
        case Input_Toolsetter:   probe_add(Probe_Toolsetter, ...); break;
        case Input_SafetyDoor:   safety_door = ...; break;
        // etc.
    }
}
```

### Output Pin Claiming

The `aux_out_claim_explicit()` callback handles output claiming:

```c
bool aux_out_claim_explicit (aux_ctrl_out_t *aux_ctrl)
{
#ifdef USE_EXPANDERS
    if(aux_ctrl->gpio.port == (void *)EXPANDER_PORT) {
        // Allocate in iox_out[] array
        iox_out[aux_ctrl->gpio.pin] = malloc(sizeof(xbar_t));
    } else
#endif
        // Claim digital output pin
        pin = ioport_claim(Port_Digital, Port_Output, &aux_ctrl->port, NULL);
        ioport_set_function(pin, aux_ctrl->function, NULL);
}
```

### Silent Failure

If a required pin is not available (not defined in the board map), the assignment silently fails. The feature is compiled out:

```c
#if SAFETY_DOOR_ENABLE && !defined(SAFETY_DOOR_PIN)
#warning "Safety door input is not available!"
#undef SAFETY_DOOR_ENABLE
#define SAFETY_DOOR_ENABLE 0
#endif
```

### Custom Pin Claiming in board_init()

Boards that need to claim or repurpose pins at startup implement `board_init()`:

```c
#define HAS_BOARD_INIT

void board_init (void)
{
    uint8_t port;
    // Enumerate and claim an output pin
    if(ioports_enumerate(Port_Digital, Port_Output, (pin_cap_t){}, find_port, &port))
        ioport_claim(Port_Digital, Port_Output, &port, "N/A");
}
```

### Inspecting Claimed Pins

At runtime, `$PINS` lists all pins with their assignments, and `$PINSTATE` shows detailed state. This is the primary debugging tool for verifying pin claims.

---

## 8. Control Input Pins

Control inputs (Reset, Feed Hold, Cycle Start) are defined by the `CONTROL_ENABLE` bitmask:

```c
#ifndef CONTROL_ENABLE
#define CONTROL_ENABLE (CONTROL_HALT|CONTROL_FEED_HOLD|CONTROL_CYCLE_START)
#endif
```

Each bit in the mask enables the corresponding control:

| Bit            | Macro             | Pin Define      |
|:---------------|:------------------|:----------------|
| `(1<<0)`       | `CONTROL_HALT`    | `RESET_PIN`     |
| `(1<<1)`       | `CONTROL_FEED_HOLD` | `FEED_HOLD_PIN` |
| `(1<<2)`       | `CONTROL_CYCLE_START` | `CYCLE_START_PIN` |

Boards that do not have all three control inputs can set a reduced mask:

```c
#undef CONTROL_ENABLE
#define CONTROL_ENABLE CONTROL_HALT  // Only reset available
```

On port+pin platforms, each control signal has both `_PORT` and `_PIN`:

```c
#define RESET_PORT              AUXINPUT7_PORT
#define RESET_PIN               AUXINPUT7_PIN
#define FEED_HOLD_PORT          AUXINPUT8_PORT
#define FEED_HOLD_PIN           AUXINPUT8_PIN
```

---

## 9. Spindle Pins

### Primary Spindle

Spindle signals use a bitmask (`DRIVER_SPINDLE_ENABLE`) to select which signals are active:

```c
#if DRIVER_SPINDLE_ENABLE & SPINDLE_PWM
#define SPINDLE_PWM_PIN         AUXOUTPUT0_PIN
#define SPINDLE_PWM_PORT        AUXOUTPUT0_PORT   // port+pin platforms
#endif
#if DRIVER_SPINDLE_ENABLE & SPINDLE_DIR
#define SPINDLE_DIRECTION_PIN   AUXOUTPUT2_PIN
#endif
#if DRIVER_SPINDLE_ENABLE & SPINDLE_ENA
#define SPINDLE_ENABLE_PIN      AUXOUTPUT1_PIN
#define SPINDLE_ENABLE_PORT     EXPANDER_PORT      // if on expander
#endif
```

On ESP32, when I2S is used and a spindle signal is not physically mapped, dummy pins are defined:

```c
#define SPINDLE_ENABLE_DUMMY_PIN    (I2S_OUT_PIN_BASE - 2)
#define SPINDLE_DIRECTION_DUMMY_PIN (I2S_OUT_PIN_BASE - 1)
```

### Second Spindle (SPINDLE1 / PWM2)

A second PWM spindle is supported on some platforms. The `DRIVER_SPINDLE1_ENABLE` bitmask works identically to the primary:

**RP2040 and iMXRT1062** (select boards):

```c
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_PWM
#define SPINDLE1_PWM_PIN        AUXOUTPUT2_PIN
#endif
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_ENA
#define SPINDLE1_ENABLE_PIN     AUXOUTPUT1_PIN
#endif
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_DIR
#define SPINDLE1_DIRECTION_PIN  AUXOUTPUT0_PIN
#endif
```

**STM32F4xx** (Nucleo Morpho, Longboard32):

```c
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_ENA
#define SPINDLE1_ENABLE_PORT     AUXOUTPUT6_PORT
#define SPINDLE1_ENABLE_PIN      AUXOUTPUT6_PIN
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_PWM
#define SPINDLE1_PWM_PORT        AUXOUTPUT4_PORT
#define SPINDLE1_PWM_PIN         AUXOUTPUT4_PIN
#endif
```

Platforms known to support SPINDLE1: RP2040, ESP32, STM32F4xx, iMXRT1062. The `SPINDLE1_ENABLE` setting in `my_machine.h` selects the spindle type.

### Spindle Encoder / Sync

Some boards support spindle encoder inputs for spindle synchronization:

```c
#if SPINDLE_ENCODER_ENABLE
#define SPINDLE_PULSE_PIN       21   // Must be an odd pin on RP2040
#define SPINDLE_INDEX_PIN       22
#endif
```

---

## 10. Coolant Pins

Coolant uses a similar bitmask (`COOLANT_ENABLE`):

```c
#if COOLANT_ENABLE & COOLANT_FLOOD
#define COOLANT_FLOOD_PIN       AUXOUTPUT3_PIN
#define COOLANT_FLOOD_PORT      AUXOUTPUT3_PORT
#endif
#if COOLANT_ENABLE & COOLANT_MIST
#define COOLANT_MIST_PIN        AUXOUTPUT4_PIN
#define COOLANT_MIST_PORT       AUXOUTPUT4_PORT
#endif
```

On the RP2040, coolant can be placed on the expander port:

```c
#if COOLANT_ENABLE
#define COOLANT_PORT            EXPANDER_PORT
#endif
#if COOLANT_ENABLE & COOLANT_FLOOD
#define COOLANT_FLOOD_PIN       12
#endif
```

---

## 11. Trinamic Driver Integration

When Trinamic stepper drivers are used, additional pins are needed for SPI chip select or UART communication.

### Trinamic SPI (per-motor chip select)

```c
#define TRINAMIC_SPI_ENABLE

#define MOTOR_CSX_PORT          GPIOC
#define MOTOR_CSX_PIN           4
#define MOTOR_CSY_PORT          GPIOD
#define MOTOR_CSY_PIN           11
#define MOTOR_CSZ_PORT          GPIOC
#define MOTOR_CSZ_PIN           6

#ifdef M3_AVAILABLE
#define MOTOR_CSM3_PORT         GPIOC
#define MOTOR_CSM3_PIN          7
#endif
```

### Trinamic UART (single-wire UART per motor)

```c
#define TRINAMIC_UART_ENABLE

#define MOTOR_UARTX_PORT        GPIOC
#define MOTOR_UARTX_PIN         4
#define MOTOR_UARTY_PORT        GPIOD
#define MOTOR_UARTY_PIN         11
#define MOTOR_UARTZ_PORT        GPIOC
#define MOTOR_UARTZ_PIN         6
```

### Trinamic Software SPI

Some boards use software SPI for Trinamic when hardware SPI is occupied:

```c
#define TRINAMIC_SOFT_SPI

#define TRINAMIC_MOSI_PORT      GPIOA
#define TRINAMIC_MOSI_PIN       7
#define TRINAMIC_SCK_PORT       GPIOA
#define TRINAMIC_SCK_PIN        5
#define TRINAMIC_MISO_PORT      GPIOA
#define TRINAMIC_MISO_PIN       6
```

### Trinamic on I2S (ESP32)

On ESP32 I2S boards, Trinamic chip select pins are assigned from the I2S shift register bits:

```c
#define X_CS_PIN                I2SO(3)    // Chip select on I2S bit 3
#define Y_CS_PIN                I2SO(6)
#define Z_CS_PIN                I2SO(9)
```

### DAC Motor Current Control

Some boards (MKS SBASE, Smoothieboard on LPC176x) use I2C digital potentiometers for Trinamic current control:

```c
// MKS SBASE: MCP44XX I2C digital pot for Vref
// Implemented in board_init() via mks_sbase.c
```

The Ooznest CNC (ESP32) uses an MCP4728 I2C DAC for the same purpose, programmed in `board_init()`.

---

## 12. Step Pulse Generation Technologies

Each platform uses a different mechanism to generate step pulses:

| Platform  | Mechanism                                     |
|:----------|:----------------------------------------------|
| ESP32 (GPIO)  | RMT peripheral (remote control module)    |
| ESP32 (I2S)   | I2S peripheral -> 74HCT595 shift register |
| RP2040        | PIO state machine                         |
| STM32F4/F7/H7 | GPIO direct write via BSRR register       |
| iMXRT1062     | GPIO direct write via DR_SET/DR_CLEAR     |
| LPC176x       | GPIO direct write via FIOSET/FIOCLR       |
| SAM3X8E       | PIO direct write via PIO_SODR/PIO_CODR    |

### RMT Step Pulse Generation (ESP32)

When using direct GPIO stepping, the ESP32 RMT peripheral generates step pulses. Configuration is in `driver.c`:

```c
// Each axis gets a dedicated RMT channel
// RMT configured for TX mode, carrier disabled, idle low
rmt_ll_tx_reset_pointer();
rmt_ll_tx_start();
```

All non-I2S ESP32 boards use RMT stepping automatically.

### PIO Step Generation (RP2040)

The RP2040 PIO state machine generates step pulses in hardware. The PIO program (`step_pulse.pio`) is loaded at startup. `STEP_PINS_BASE` defines the first pin in a consecutive block used by the PIO.

### GPIO Output Modes (RP2040)

The `_OUTMODE` macros control how multiple signals on the same GPIO port are written:

```c
#define DIRECTION_OUTMODE       GPIO_SHIFT5   // Direction bits shifted by 5
#define DIRECTION_OUTMODE       GPIO_MAP      // Direct register map
#define STEP_OUTMODE            GPIO_BITBAND  // Bit-band memory access
```

---

## 13. Platform-Specific Pin Features

### ESP32 Input-Only Pins

GPIO 34-39 on ESP32 are input-only and cannot be used for output signals. The driver enforces this:

```c
#if ((DIRECTION_MASK|STEPPERS_DISABLE_MASK|SPINDLE_MASK|COOLANT_MASK) & 0xC00000000ULL)
#error "Pins 34 - 39 are input only!"
#endif
```

### RP2040 Odd-Pin Requirement for Encoder

Spindle encoder pulse inputs on RP2040 must be on an odd-numbered pin (PIO requirement):

```c
#if SPINDLE_ENCODER_ENABLE
#define SPINDLE_PULSE_PIN       21  // Must be an odd pin
#define SPINDLE_INDEX_PIN       22
#endif
```

### STM32 Pin Mode Configuration

STM32 platforms allow per-signal pin mode configuration:

```c
#define STEP_PINMODE            PINMODE_OUTPUT
#define DIRECTION_PINMODE       PINMODE_OUTPUT
#define STEPPERS_ENABLE_PINMODE PINMODE_OUTPUT
#define STEPPERS_ENABLE_PINMODE PINMODE_OD     // Open drain
```

### iMXRT1062 Quadrature Encoder

iMXRT1062 boards that support encoder input define QEI pins:

```c
#if ENCODER_ENABLE
#define QEI_A_PIN               AUXINPUT1_PIN
#define QEI_B_PIN               AUXINPUT2_PIN
#if (ENCODER_ENABLE & 1)
#define QEI_SELECT_PIN          AUXINPUT3_PIN
#endif
#endif
```

---

## 14. Custom Board Configuration

### Workflow

1. Copy an existing `*_map.h` from the `boards/` directory to a new file, e.g. `my_machine_map.h`
2. Edit the pin assignments to match your hardware
3. In `my_machine.h`, uncomment:
   ```c
   #define BOARD_MY_MACHINE   // Add my_machine_map.h in the boards directory before enabling this!
   ```
4. Build and flash

### Build System Integration

The map header alone (no build system changes) works on all platforms because every `driver.h` already has a `BOARD_MY_MACHINE` case in its preprocessor ladder and the `boards/` directory is already in the compiler include path.

Only add the companion `.c` file to the build system if your map uses `HAS_BOARD_INIT`:

| Platform   | Build system   | Action needed for new `.c` file                          |
|:-----------|:---------------|:----------------------------------------------------------|
| ESP32      | ESP-IDF        | Add `boards/my_machine.c` to the `SRCS` list in `main/CMakeLists.txt` |
| RP2040     | Pico SDK       | Add `boards/my_machine.c` to `add_executable()` in `CMakeLists.txt`   |
| STM32F4xx  | PlatformIO     | None (picks up `Src/boards/` files automatically)         |
| iMXRT1062  | PlatformIO     | None (picks up `src/boards/` files automatically)         |

**ESP32 special case — `BOARD_BLACKBOX_X32`:** This board must be enabled in `main/CMakeLists.txt` via `OPTION(BOARD_BLACKBOX_X32 ...)` and `target_compile_definitions(... BOARD_BLACKBOX_X32)` because it also sets board-specific core defaults. All other boards are defined purely in `my_machine.h`.

### Required Defines

At minimum, a board map must define:

| Define          | Purpose                     |
|:----------------|:----------------------------|
| `X_STEP_PIN`    | X axis step pulse output    |
| `X_DIRECTION_PIN` | X axis direction output   |
| `Y_STEP_PIN`    | Y axis step pulse output    |
| `Y_DIRECTION_PIN` | Y axis direction output   |
| `Z_STEP_PIN`    | Z axis step pulse output    |
| `Z_DIRECTION_PIN` | Z axis direction output   |
| `STEPPERS_ENABLE_PIN` or per-axis enables | Motor enable |
| `X_LIMIT_PIN` (or `LIMIT_PORT` + `X_LIMIT_PIN`) | Limit inputs |
| `AUXOUTPUT0_PIN` + spindle/coolant cross-references | Spindle/coolant |

### board_init() Custom Startup

If the board needs custom initialization (I2C DAC setup, pin repurposing, etc.), define `HAS_BOARD_INIT` in the map header and implement `board_init()` in a companion `.c` file in the same `boards/` directory:

```c
// boards/my_machine_map.h
#define HAS_BOARD_INIT

// boards/my_machine.c
#include "driver.h"

void board_init (void)
{
    // Custom hardware initialization
    // Pin claiming, I2C setup, etc.
}
```

If you add a companion `.c` file, you may need to register it in the build system (see the table in the Workflow section above). On ESP32 (ESP-IDF), add it to `SRCS` in `main/CMakeLists.txt`. On RP2040 (Pico SDK), add it to `add_executable()` in `CMakeLists.txt`. PlatformIO-based platforms (STM32F4xx, iMXRT1062) pick up files automatically.

---

## 15. Platform-Specific Examples

### ESP32 with I2S Shift Register (6-Axis)

```c
#include "use_i2s_out.h"

#define I2S_OUT_BCK             GPIO_NUM_22
#define I2S_OUT_WS              GPIO_NUM_17
#define I2S_OUT_DATA            GPIO_NUM_21

#define X_STEP_PIN              I2SO(0)
#define X_DIRECTION_PIN         I2SO(1)
#define Y_STEP_PIN              I2SO(2)
#define Y_DIRECTION_PIN         I2SO(3)

#if N_ABC_MOTORS >= 1
#define M3_AVAILABLE
#define M3_STEP_PIN             I2SO(4)
#define M3_DIRECTION_PIN        I2SO(5)
#endif

#define Z_STEP_PIN              I2SO(6)
#define Z_DIRECTION_PIN         I2SO(7)
```

### ESP32 with RMT Step + GPIO Dir (Ooznest CNC)

```c
#define X_STEP_PIN              GPIO_NUM_38
#define X_DIRECTION_PIN         GPIO_NUM_42
#define Y_STEP_PIN              GPIO_NUM_39
#define Y_DIRECTION_PIN         GPIO_NUM_45

#if N_ABC_MOTORS >= 1
#define M3_AVAILABLE
#define M3_STEP_PIN             GPIO_NUM_40
#define M3_DIRECTION_PIN        GPIO_NUM_46
#define M3_LIMIT_PIN            GPIO_NUM_11
#endif

#define Z_STEP_PIN              GPIO_NUM_41
#define Z_DIRECTION_PIN         GPIO_NUM_47
```

### ESP32 with HC595 Expander (Ooznest CNC)

```c
#define USE_EXPANDERS
#define HC595_CS_PIN            GPIO_NUM_8

#define STEPPERS_ENABLE_PORT    EXPANDER_PORT
#define STEPPERS_ENABLE_PIN     3

#define SPINDLE_ENABLE_PORT     EXPANDER_PORT
#define SPINDLE_ENABLE_PIN      0

// Second spindle (laser)
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_PWM
#define SPINDLE1_PWM_PIN        AUXOUTPUT2_PIN
#endif
```

### RP2040 with PIO Step + Shift Register Outputs

```c
#define STEP_PORT               GPIO_PIO
#define STEP_PINS_BASE          2

#define DIRECTION_PORT          GPIO_OUTPUT
#define X_DIRECTION_PIN         5
#define Y_DIRECTION_PIN         6
#define Z_DIRECTION_PIN         7

#define USE_EXPANDERS
#define OUT_SHIFT_REGISTER      16
#define OUT_SR_DATA_PIN         17
#define OUT_SR_SCK_PIN          18

#define ENABLE_PORT             EXPANDER_PORT
#define X_ENABLE_PIN            0
#define Y_ENABLE_PIN            1
#define Z_ENABLE_PIN            2
```

### RP2040 with SR8 Step/Dir (PicoCNC)

```c
#define SD_SHIFT_REGISTER       8
#define SD_SR_DATA_PIN          14
#define SD_SR_SCK_PIN           15

#define STEP_PORT               GPIO_SR8
#define DIRECTION_PORT          GPIO_SR8
#define ENABLE_PORT             EXPANDER_PORT

#define OUT_SHIFT_REGISTER      16
#define OUT_SR_DATA_PIN         17
#define OUT_SR_SCK_PIN          18

#define X_ENABLE_PIN            0
#define Y_ENABLE_PIN            1
#define Z_ENABLE_PIN            2
```

### STM32F4xx with GPIO Port+Pins (Nucleo Morpho)

```c
#define STEP_PORT               GPIOC
#define X_STEP_PIN              0
#define Y_STEP_PIN              5
#define Z_STEP_PIN              9

#define DIRECTION_PORT          GPIOA
#define X_DIRECTION_PIN         0
#define Y_DIRECTION_PIN         4
#define Z_DIRECTION_PIN         11

#define X_ENABLE_PORT           GPIOA
#define X_ENABLE_PIN            1
#define Y_ENABLE_PORT           GPIOB
#define Y_ENABLE_PIN            12

#define AUXOUTPUT4_PORT         GPIOA   // Spindle PWM
#define AUXOUTPUT4_PIN          8
#define AUXOUTPUT5_PORT         GPIOB   // Spindle direction
#define AUXOUTPUT5_PIN          5
#define AUXOUTPUT6_PORT         GPIOB   // Spindle enable
#define AUXOUTPUT6_PIN          3
```

### STM32F4xx with Dual Spindle (Longboard32)

```c
// Primary spindle
#if DRIVER_SPINDLE_ENABLE & SPINDLE_PWM
#define SPINDLE_PWM_PIN         AUXOUTPUT0_PIN
#endif
#if DRIVER_SPINDLE_ENABLE & SPINDLE_ENA
#define SPINDLE_ENABLE_PORT     EXPANDER_PORT
#define SPINDLE_ENABLE_PIN      AUXOUTPUT4_PIN
#endif

// Second spindle
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_PWM
#define SPINDLE1_PWM_PIN        AUXOUTPUT8_PIN
#endif
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_DIR
#define SPINDLE1_DIRECTION_PIN  AUXOUTPUT5_PIN
#endif
```

### iMXRT1062 with Direct Pin Numbers (T41U5XBB)

```c
#define X_STEP_PIN              (2u)
#define X_DIRECTION_PIN         (3u)
#define X_ENABLE_PIN            (10u)
#define X_LIMIT_PIN             (20u)

#define Y_STEP_PIN              (4u)
#define Y_DIRECTION_PIN         (5u)

#define M3_STEP_PIN             (8u)
#define M3_DIRECTION_PIN        (9u)

#define AUXOUTPUT3_PIN          (12u)  // Spindle enable
#define AUXOUTPUT5_PIN          (13u)  // Spindle PWM
#define AUXOUTPUT6_PIN          (19u)  // Coolant flood

// Second spindle
#if DRIVER_SPINDLE1_ENABLE & SPINDLE_PWM
#define SPINDLE1_PWM_PIN        AUXOUTPUT2_PIN
#endif
```

### iMXRT1062 with Quadrature Encoder (E5XMCS_T41)

```c
#if ENCODER_ENABLE
#define QEI_A_PIN               AUXINPUT1_PIN
#define QEI_B_PIN               AUXINPUT2_PIN
#define QEI_SELECT_PIN          AUXINPUT3_PIN
#endif
```

---

## 16. Per-Platform Reference

### ESP32 Board Maps

`main/boards/` in the ESP32 repo contains 32 board files:

| Board Map File               | Stepping     | N_ABC_MOTORS | Features                          |
|:-----------------------------|:-------------|:-------------|:----------------------------------|
| `generic_map.h`              | RMT GPIO     | 0            | Default 3-axis                    |
| `generic_s3_map.h`           | RMT GPIO     | 0            | ESP32-S3 variant                  |
| `generic_i2s_s3_map.h`       | I2S          | 6            | S3 with I2S shift register        |
| `bdring_i2s_6_axis_map.h`    | I2S          | 6            | BDRING 6-axis with Trinamic SPI   |
| `bdring_i2s_6x_v3_map.h`     | I2S          | 6            | Per-axis Trinamic CS, aux up to 7 |
| `btt_rodent_map.h`           | I2S          | 4            | BTT Rodent, TMC SPI chain         |
| `cnc_boosterpack_map.h`      | RMT GPIO     | 0            | PCA9654E I2C expander             |
| `jackpot_map.h`              | I2S          | 6            | Jackpot, TMC UART, Modbus         |
| `mks_dlc32_2_0_map.h`        | I2S          | 5            | MKS DLC32, dual spindle           |
| `ooznest_cnc_map.h`          | RMT GPIO     | 3            | HC595 expander, dual spindle      |
| `root_cnc_pro_map.h`         | I2S          | 6            | I2SO up to index 31, aux up to 9  |

### RP2040/RP2350 Board Maps

`boards/` in the RP2040 repo contains 18 board files:

| Board Map File               | Step Port    | N_ABC_MOTORS | Features                          |
|:-----------------------------|:-------------|:-------------|:----------------------------------|
| `generic_map.h`              | GPIO_PIO     | 0            | Default 3-axis                    |
| `generic_map_4axis.h`        | GPIO_PIO     | 1            | 4-axis variant                    |
| `generic_map_8axis.h`        | GPIO_PIO     | 7            | 8-axis example                    |
| `picobob_map.h`              | GPIO_PIO     | 2            | PicoBOB                           |
| `picohal_map.h`              | GPIO_PIO     | 1            | PicoHAL with Modbus               |
| `btt_skr_pico_10_map.h`      | GPIO_PIO_1   | 1            | BTT SKR Pico, Trinamic UART       |
| `pico_cnc_map.h`             | GPIO_SR8     | 1            | Shift register step+dir+outputs   |
| `flexihal2350_map.h`         | GPIO_PIO_1   | 3            | RP2350, FlexGPIO expander         |
| `RP2350B_5X_map.h`           | GPIO_PIO     | 2            | RP2350 5-axis                     |

### STM32F4xx Board Maps

`boards/` in the STM32F4xx repo contains 29 board files:

| Board Map File               | N_ABC_MOTORS | Features                          |
|:-----------------------------|:-------------|:----------------------------------|
| `generic_map.h`              | 1            | Default map                       |
| `blackpill_map.h`            | 1            | F411 BlackPill, dual spindle PWM  |
| `btt_octopus_pro_map.h`      | 8            | 8 motors, Trinamic SPI/UART, CAN  |
| `btt_skr_2.0_map.h`          | 2            | SKR 2.0, Trinamic SPI             |
| `flexi_hal_map.h`            | 2            | F446, Trinamic mixed drivers      |
| `st_morpho_map.h`            | 1            | Dual spindle, Trinamic headers    |
| `longboard32_map.h`          | 0            | F412 Sienci, dual spindle, TMC2660, W5500 |

### STM32H7xx Board Maps

`boards/` in the STM32H7xx repo contains 10 board files:

| Board Map File               | N_ABC_MOTORS | Features                          |
|:-----------------------------|:-------------|:----------------------------------|
| `btt_octopus_max_map.h`      | 5            | 6 motors, Trinamic UART+SPI       |
| `btt_octopus_pro_map.h`      | 7            | 8 motors, CAN, analog I/O         |
| `btt_scylla_map.h`           | 3            | 4 motors, Trinamic SPI, ESP_AT    |
| `dresco_octave_map.h`        | 7            | 8 motors, spindle encoder, CAN    |
| `reference_map.h`            | 7            | 8 axes, dual spindle, WIZnet      |

### iMXRT1062 Board Maps

`grblHAL_Teensy4/src/boards/` contains 8 board files:

| Board Map File               | N_ABC_MOTORS | Features                          |
|:-----------------------------|:-------------|:----------------------------------|
| `T41U5XBB_map.h`             | 2            | 5 axes, dual spindle, encoder     |
| `T41BB5X_Pro_map.h`          | 2            | 5 axes, dual spindle, THCAD2      |
| `T40X101_map.h`              | 1            | 4 axes, Teensy 4.0                |
| `GRBLHAL2000_map.h`          | 2            | Spindle sync, THCAD2, HAS_BOARD_INIT |
| `E5XMCS_T41_map.h`           | 2            | 5 axes, 8 aux outputs, motor fault/warning |
| `generic_map.h`              | 2            | 3+2 ABC, QEI encoder              |
| `cnc_boosterpack_map.h`      | 0            | CNC BoosterPack                   |

### LPC176x Board Maps

`src/boards/` in the LPC176x repo contains 10 board files:

| Board Map File               | N_ABC_MOTORS | Features                          |
|:-----------------------------|:-------------|:----------------------------------|
| `generic_map.h`              | 0            | Default, 5 ABC max                 |
| `ramps_1.6_map.h`            | 2            | RAMPS 1.6 on Re-ARM               |
| `btt_skr_1.3_map.h`          | 2            | SKR 1.3, Trinamic SPI or UART      |
| `btt_skr_1.4_turbo_map.h`    | 2            | SKR 1.4 Turbo, Trinamic            |
| `btt_skr_e3_turbo_map.h`     | 2            | E3 Turbo, TMC2209 UART forced     |
| `mks_sbase_map.h`            | 2            | MKS SBASE, I2C current control     |
| `smoothieboard_map.h`        | 1            | Smoothieboard, I2C current control |

---

## 17. Step Output Mode Options

### Port+Pin Platforms (STM32, LPC176x, SAM3X8E)

The `STEP_OUTMODE` and `DIRECTION_OUTMODE` macros control how GPIO writes are performed:

| Mode              | Description                       |
|:------------------|:----------------------------------|
| `GPIO_MAP`        | Direct GPIO register write        |
| `GPIO_BITBAND`    | Bit-band memory access (atomic)   |
| `GPIO_SHIFT12`    | Shifted register write            |

### RP2040

The `DIRECTION_OUTMODE` and `LIMIT_INMODE` macros select between GPIO access methods:

| Mode              | Description                           |
|:------------------|:--------------------------------------|
| `GPIO_MAP`        | Direct register write                 |
| `GPIO_SHIFTn`     | Shifted by n bits                     |
| `GPIO_DIRECT`     | Single pin write via `gpio_put()`     |

---

## 18. Driver Capabilities Checklist

When designing a new board map, the following features should be considered. Each requires specific pin definitions in the map header and the corresponding `#define FEATURE_ENABLE` in `my_machine.h`:

| Feature               | Required Defines                    |
|:----------------------|:------------------------------------|
| Spindle PWM           | `SPINDLE_PWM_PIN`                   |
| Spindle Direction     | `SPINDLE_DIRECTION_PIN`             |
| Spindle Enable        | `SPINDLE_ENABLE_PIN`                |
| Coolant Flood         | `COOLANT_FLOOD_PIN`                 |
| Coolant Mist          | `COOLANT_MIST_PIN`                  |
| Probe                 | `PROBE_PIN`                         |
| Second Probe          | `PROBE2_PIN`                        |
| Toolsetter            | `TOOLSETTER_PIN`                    |
| Safety Door           | `SAFETY_DOOR_PIN`                   |
| Motor Fault           | `MOTOR_FAULT_PIN`                   |
| Motor Warning         | `MOTOR_WARNING_PIN`                 |
| I2C Keypad            | `I2C_STROBE_PIN` (plus I2C port)    |
| MPG Mode              | `MPG_MODE_PIN`                      |
| BLTouch               | `AUXOUTPUTn_PWM_PIN` (servo capable)|
| Second Spindle (PWM2) | `SPINDLE1_PWM_PIN` + driver spindle |
| Spindle Encoder       | `SPINDLE_PULSE_PIN`, `SPINDLE_INDEX_PIN` |
| Quadrature Encoder    | `QEI_A_PIN`, `QEI_B_PIN`           |
| SD Card               | `SD_CS_PIN` + SPI pins              |
| Ethernet              | `SPI_CS_PIN`, `SPI_IRQ_PIN` + SPI   |

If a pin is not defined in the board map, the corresponding feature is silently disabled with a compiler warning.

---

## 19. Troubleshooting Pin Assignments

### Compile-Time Checks

The driver validates pin assignments at compile time:

```c
// ESP32: input-only pins check
#if ((DIRECTION_MASK|STEPPERS_DISABLE_MASK|SPINDLE_MASK|COOLANT_MASK) & 0xC00000000ULL)
#error "Pins 34 - 39 are input only!"
#endif

// Feature availability warning
#if DRIVER_SPINDLE_PWM_ENABLE && !defined(SPINDLE_PWM_PIN)
#warning "PWM spindle is not supported by board map!"
#undef DRIVER_SPINDLE_PWM_ENABLE
#define DRIVER_SPINDLE_PWM_ENABLE 0
#endif

// Feature unavailable error
#if SAFETY_DOOR_ENABLE && !defined(SAFETY_DOOR_PIN)
#warning "Safety door input is not available!"
#undef SAFETY_DOOR_ENABLE
#define SAFETY_DOOR_ENABLE 0
#endif

// Board-specific errors
#if N_ABC_MOTORS > 2
#error "Axis configuration is not supported!"
#endif
```

### Runtime Pin Inspection

Use the `$PINS` command to enumerate all pins with their assigned functions:

```text
[PIN:PB12,Emergency stop]
[PIN:PC4,Probe]
[PIN:PA0,X step]
[PIN:PA1,X direction]
...
```

Use `$PINSTATE` for detailed state including mode, capabilities, and current logic level.

### Silent Failures

Pin claiming is silent. If `$PINS` does not show a feature you enabled, the board map likely does not define a pin for it. Check that the corresponding `#define FEATURE_PIN` exists in the board map or that the AUXINPUT/AUXOUTPUT pool has a spare pin that can be claimed.
