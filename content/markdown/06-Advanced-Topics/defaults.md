# Defaults and Profile Configuration

grblHAL uses a layered default system. This document covers:

- **DEFAULT_ symbols** — compile-time defaults in `config.h` that set initial values for every `$` setting
- **Profile configuration symbols** — compile-time defines in `my_machine.h` that select hardware features, spindle types, motor count, ganging, and more
- **Machine profiles** — pre-baked `$` setting overrides used by the web builder and gsender

---

## 1. The Defaults Precedence Chain

Values are resolved in this order (last wins):

| Layer | Source | Example |
|:------|:-------|:--------|
| 1. Core default | `core/config.h` | `#define DEFAULT_STEP_PULSE_MICROSECONDS 5.0f` |
| 2. Runtime EEPROM | `$x` command or gsender profile | `$24=150.0` |
| 3. Startup script | `$N0` / `$N1` | `$N0=$24=150.0` |

The `DEFAULT_` symbols are baked into the firmware binary. After flashing, the runtime values are written to EEPROM (emulated in flash or FRAM). A `$RST=*` command restores a group of settings to their DEFAULT_ values.

---

## 2. Profile Configuration Symbols

These are `#define` statements placed in `my_machine.h` (or `platformio.ini` as `-D` flags) that select the machine's hardware capabilities at compile time. They are **not** `$` settings — they control which code paths are compiled and which driver modules are linked.

### Motor / Axis

| Symbol | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `N_AXIS` | integer | 3 | Total axes (3 = XYZ, 4 = XYZA, 6 = XYZABC, etc.). Max varies by platform. |
| `N_ABC_MOTORS` | integer | 0 | Number of extra motors beyond XYZ. Each adds an axis letter (A, B, C...) and optionally ganging. |
| `X_GANGED` | 0/1 | 0 | Use M3 as a second X motor |
| `Y_GANGED` | 0/1 | 0 | Use M4 as a second Y motor |
| `Z_GANGED` | 0/1 | 0 | Use M5 as a second Z motor |
| `N_GANGED` | derived | — | Calculated from `X_GANGED + Y_GANGED + Z_GANGED` |
| `X_AUTO_SQUARE` | 0/1 | 0 | Enable auto-square homing on X (requires `X_GANGED`) |
| `Y_AUTO_SQUARE` | 0/1 | 0 | Enable auto-square homing on Y (requires `Y_GANGED`) |
| `Z_AUTO_SQUARE` | 0/1 | 0 | Enable auto-square homing on Z (requires `Z_GANGED`) |

### Spindle Selection

Spindle type is selected by `SPINDLE0_ENABLE` through `SPINDLE3_ENABLE`. Each takes an **integer constant** from the `spindle_control.h` enum:

| Constant | Value | Type |
|:---------|:-----|:-----|
| `SPINDLE_NONE` | 0 | No spindle |
| `SPINDLE_HUANYANG1` | 1 | Huanyang VFD (Hy V6) over ModBus |
| `SPINDLE_HUANYANG2` | 2 | Huanyang VFD (V2) over ModBus |
| `SPINDLE_GS20` | 3 | Durapulse GS20 VFD over ModBus |
| `SPINDLE_YL620A` | 4 | YL620A VFD over ModBus |
| `SPINDLE_MODVFD` | 5 | ModVFD over ModBus |
| `SPINDLE_H100` | 6 | H100 VFD over ModBus |
| `SPINDLE_ONOFF0` | 7 | Simple on/off (typically driver.c) |
| `SPINDLE_ONOFF0_DIR` | 8 | On/off with direction (driver.c) |
| `SPINDLE_ONOFF1` | 9 | Second on/off spindle (plugin) |
| `SPINDLE_ONOFF1_DIR` | 10 | Second on/off with direction (plugin) |
| `SPINDLE_PWM0` | 11 | PWM spindle (driver.c) |
| `SPINDLE_PWM0_NODIR` | 12 | PWM spindle, no direction (driver.c) |
| `SPINDLE_PWM1` | 13 | Second PWM spindle (driver.c) |
| `SPINDLE_PWM1_NODIR` | 14 | Second PWM spindle, no direction |
| `SPINDLE_PWM2` | 15 | Third PWM spindle |
| `SPINDLE_PWM2_NODIR` | 16 | Third PWM spindle, no direction |
| `SPINDLE_PWM0_CLONE` | 17 | Cloned PWM spindle |
| `SPINDLE_SOLENOID` | 18 | Solenoid spindle |
| `SPINDLE_STEPPER` | 19 | Stepper-driven spindle |
| `SPINDLE_NOWFOREVER` | 20 | Nowforever VFD over ModBus |
| `SPINDLE_MY_SPINDLE` | 30 | Custom user spindle (plugin) |

**Convenience bitmasks:**

```c
#define SPINDLE_ALL_VFD ((1<<SPINDLE_HUANYANG1)|(1<<SPINDLE_HUANYANG2)|(1<<SPINDLE_GS20)|(1<<SPINDLE_YL620A)|(1<<SPINDLE_MODVFD)|(1<<SPINDLE_H100)|(1<<SPINDLE_NOWFOREVER))
#define SPINDLE_ALL      (SPINDLE_ALL_VFD|(1<<SPINDLE_PWM0))
```

These bitmasks serve two purposes:

1. **In raw C code** (`driver_opts.h`): gates compilation of VFD plugin code:
```c
#if SPINDLE_ENABLE & SPINDLE_ALL_VFD
#define VFD_ENABLE 1
#endif
```

2. **As SPINDLE0_ENABLE value**: `SPINDLE_ALL_VFD` or `SPINDLE_ALL` can be used in any context — `#define` in `my_machine.h`, `-D` in platformio.ini, or the web builder profile. The firmware registers all VFD types (or all VFDs + PWM0) at runtime, with the first available spindle as the default.

**All valid SPINDLE0_ENABLE values:**

| Value | Applies in |
|:------|:-----------|
| `SPINDLE_NONE` (0) | C, PIO, builder |
| `SPINDLE_HUANYANG1` (1) | C, PIO, builder |
| `SPINDLE_HUANYANG2` (2) | C, PIO, builder |
| `SPINDLE_GS20` (3) | C, PIO, builder |
| `SPINDLE_YL620A` (4) | C, PIO, builder |
| `SPINDLE_MODVFD` (5) | C, PIO, builder |
| `SPINDLE_H100` (6) | C, PIO, builder |
| `SPINDLE_ONOFF0` (7) | C, PIO, builder |
| `SPINDLE_ONOFF0_DIR` (8) | C, PIO, builder |
| `SPINDLE_ONOFF1` (9) | C, PIO, builder |
| `SPINDLE_ONOFF1_DIR` (10) | C, PIO, builder |
| `SPINDLE_PWM0` (11) | C, PIO, builder |
| `SPINDLE_PWM0_NODIR` (12) | C, PIO, builder |
| `SPINDLE_PWM1` (13) | C, PIO, builder |
| `SPINDLE_PWM1_NODIR` (14) | C, PIO, builder |
| `SPINDLE_PWM2` (15) | C, PIO, builder |
| `SPINDLE_PWM2_NODIR` (16) | C, PIO, builder |
| `SPINDLE_PWM0_CLONE` (17) | C, PIO, builder |
| `SPINDLE_SOLENOID` (18) | C, PIO, builder |
| `SPINDLE_STEPPER` (19) | C, PIO, builder |
| `SPINDLE_NOWFOREVER` (20) | C, PIO, builder |
| `SPINDLE_MY_SPINDLE` (30) | C, PIO, builder |
| `SPINDLE_ALL_VFD` (bitmask) | C, PIO, builder — registers all VFD types available |
| `SPINDLE_ALL` (bitmask) | C, PIO, builder — registers all VFDs + PWM0 |

**How SPINDLE0_ENABLE is set in each context:**

| Context | Form | Example |
|:--------|:-----|:--------|
| C source (`my_machine.h`) | Macro name (single constant) | `#define SPINDLE0_ENABLE SPINDLE_H100` |
| PlatformIO build flag | Numeric value | `-DSPINDLE0_ENABLE=6` |
| Web builder profile JSON | String (single constant or bitmask) | `"SPINDLE0_ENABLE": "SPINDLE_ALL_VFD"` |

**Symbol reference:**

| Symbol | Default | Description |
|:-------|:--------|:------------|
| `SPINDLE0_ENABLE` | `DEFAULT_SPINDLE` | Primary spindle type constant |
| `SPINDLE1_ENABLE` | 0 | Second spindle type constant |
| `SPINDLE2_ENABLE` | 0 | Third spindle type constant |
| `SPINDLE3_ENABLE` | 0 | Fourth spindle type constant |
| `N_SPINDLE` | derived | Number of spindles configured |
| `DRIVER_SPINDLE_ENABLE` | derived | Bitmask (ENA/PWM/DIR signals) for primary native spindle |
| `DRIVER_SPINDLE1_ENABLE` | derived | Bitmask for second native spindle |
| `VFD_ENABLE` | derived | Set to 1 when any `SPINDLE_ALL_VFD` type is enabled |

### Trinamic Stepper Drivers

| Symbol | Default | Description |
|:-------|:--------|:------------|
| `TRINAMIC_ENABLE` | 0 | Trinamic driver family: `2208`, `2209`, `5160`, `2130`, `2660`, or bitmask |
| `TRINAMIC_UART_ENABLE` | auto | Set automatically for UART-capable drivers |
| `TRINAMIC_SPI_ENABLE` | auto | Set automatically for SPI-capable drivers |
| `TRINAMIC_MOTOR_ENABLE` | 0 | Bitmask for which motors have Trinamic drivers |
| `TRINAMIC_DEV` | 0 | Trinamic hardware interface variant |

### Network

| Symbol | Default | Description |
|:-------|:--------|:------------|
| `ETHERNET_ENABLE` | 0 | Enable Ethernet networking |
| `WIFI_ENABLE` | 0 | Enable WiFi networking |
| `WEBUI_ENABLE` | 0 | Enable web UI |
| `WEBUI_AUTH_ENABLE` | 0 | Require authentication for web UI |
| `TELNET_ENABLE` | 0 | Enable Telnet protocol |
| `HTTP_ENABLE` | 0 | Enable HTTP protocol |
| `WEBSOCKET_ENABLE` | 0 | Enable WebSocket protocol |
| `FTP_ENABLE` | 0 | Enable FTP protocol |
| `MQTT_ENABLE` | 0 | Enable MQTT protocol |
| `MDNS_ENABLE` | 0 | Enable mDNS service discovery |
| `SSDP_ENABLE` | 0 | Enable SSDP discovery |
| `BLUETOOTH_ENABLE` | 0 | Enable Bluetooth SPP |
| `HOSTNAME` | `"grblHAL"` | Default network hostname |

### Features (Enable Flags)

| Symbol | Default | Description |
|:-------|:--------|:------------|
| `PROBE_ENABLE` | 1 | Enable probe input |
| `PROBE2_ENABLE` | 0 | Enable second probe input |
| `TOOLSETTER_ENABLE` | 0 | Enable tool setter input |
| `SAFETY_DOOR_ENABLE` | 0 | Enable safety door input |
| `COOLANT_ENABLE` | 3 | Bitmask: `COOLANT_FLOOD` (1) + `COOLANT_MIST` (2) |
| `ESTop_ENABLE` | 1* | Enable E-Stop input (*0 if `COMPATIBILITY_LEVEL > 1`) |
| `MOTOR_FAULT_ENABLE` | 0 | Enable motor fault inputs |
| `MOTOR_WARNING_ENABLE` | 0 | Enable motor warning inputs |
| `SDCARD_ENABLE` | 0 | Enable SD card support |
| `FS_ENABLE` | derived | Enable file system (set when any `SDCARD_ENABLE` or `LITTLEFS_ENABLE`) |
| `LITTLEFS_ENABLE` | 0 | Enable LittleFS internal flash filesystem |
| `SPINDLE_SYNC_ENABLE` | 0 | Enable spindle sync (rigid tapping) |
| `SPINDLE_ENCODER_ENABLE` | derived | Enable spindle encoder |
| `ENCODER_ENABLE` | 0 | Enable general encoder support |
| `QEI_ENABLE` | derived | Enable quadrature encoder |
| `PLASMA_ENABLE` | 0 | Enable plasma torch height control |
| `FANS_ENABLE` | 0 | Enable fan outputs |
| `ODOMETER_ENABLE` | 0 | Enable runtime odometer tracking |
| `NEOPIXELS_ENABLE` | 0 | Enable NeoPixel RGB strip |
| `KEYPAD_ENABLE` | 0 | Enable I2C keypad |
| `MPG_ENABLE` | 0 | Enable MPG handwheel mode |
| `DISPLAY_ENABLE` | 0 | Enable display module |
| `LIMITS_OVERRIDE_ENABLE` | 0 | Enable limits override |
| `MACROS_ENABLE` | 0 | Enable macro support |
| `FORCE_HARD_LIMITS_MASK` | 0 | Axismask forced to hard limit |
| `SERIAL_STREAM` | 0 | Enable serial stream |

### CoreXY / Kinematics

| Symbol | Default | Description |
|:-------|:--------|:------------|
| `COREXY` | 0 | Set to 1 for CoreXY kinematics |
| `COREXY_U` | 0 | Set to 1 for CoreXY-U kinematics |
| `COREXZ` | 0 | Set to 1 for CoreXZ kinematics |

### Rotary Axis

| Symbol | Default | Description |
|:-------|:--------|:------------|
| `ROTARY_FIX` | 0 | Enable rotary axis fix (shortest-rotation moves) |

---

## 3. Complete DEFAULT_ Reference by $ Setting

Each entry shows the `DEFAULT_` symbol, its `$` setting number, the type/range, factory default, and a brief description.

### Stepper Output ($0–$4, $8, $29, $37, $680)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 0 | `DEFAULT_STEP_PULSE_MICROSECONDS` | float | 5.0 | Step pulse length in microseconds |
| 1 | `DEFAULT_STEPPER_IDLE_LOCK_TIME` | uint8 | 25 | Idle lock delay in milliseconds (255 = always on) |
| 2 | `DEFAULT_STEP_SIGNALS_INVERT_MASK` | axismask | 0 | Invert step signal per axis |
| 3 | `DEFAULT_DIR_SIGNALS_INVERT_MASK` | axismask | 0 | Invert direction signal per axis |
| 4 | `DEFAULT_ENABLE_SIGNALS_INVERT_MASK` | axismask | all | Invert stepper enable per axis |
| 8 | `DEFAULT_GANGED_DIRECTION_INVERT_MASK` | axismask | 0 | Invert direction on ganged motor |
| 29 | `DEFAULT_STEP_PULSE_DELAY` | float | 0.0 | Step pulse delay in microseconds |
| 37 | `DEFAULT_STEPPER_DEENERGIZE_MASK` | axismask | 0 | Axes NOT disabled when idle |
| 680 | `DEFAULT_STEPPER_ENABLE_DELAY` | uint8 | 0 | Enable delay in ms (0–250) |

### Limits ($5, $18, $20–$21)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 5 | `DEFAULT_LIMIT_SIGNALS_INVERT_MASK` | axismask | 0 | Invert limit switch signal per axis |
| 18 | `DEFAULT_LIMIT_SIGNALS_PULLUP_DISABLE_MASK` | axismask | 0 | Disable internal pull-up per axis |
| 20 | `DEFAULT_SOFT_LIMIT_ENABLE` | bool | 0 | Enable soft limit checking |
| 21 | `DEFAULT_HARD_LIMIT_ENABLE` | bool | 0 | Enable hard limit switch checking |

$21 bit flags:
- Bit 0: Enable hard limits
- Bit 1: Check limits at initialization
- Bit 2: Disable hard limits for rotary axes

### Homing ($22–$27, $43–$49, $671, $347–$349)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 22 | `DEFAULT_HOMING_ENABLE` | bitmask | 0 | Homing configuration flags |
| 23 | `DEFAULT_HOMING_DIR_MASK` | axismask | 0 | Homing direction (0 = positive, 1 = negative) |
| 24 | `DEFAULT_HOMING_FEED_RATE` | float | 25.0 | Homing locate feed rate (mm/min) |
| 25 | `DEFAULT_HOMING_SEEK_RATE` | float | 500.0 | Homing search seek rate (mm/min) |
| 26 | `DEFAULT_HOMING_DEBOUNCE_DELAY` | uint16 | 250 | Homing debounce delay (ms) |
| 27 | `DEFAULT_HOMING_PULLOFF` | float | 1.0 | Homing pull-off distance (mm) |
| 43 | `DEFAULT_N_HOMING_LOCATE_CYCLE` | uint8 | 1 | Number of homing locate cycles |
| 44 | `DEFAULT_HOMING_CYCLE_0` | axismask | Z | Axis mask for 1st homing cycle |
| 45 | `DEFAULT_HOMING_CYCLE_1` | axismask | X+Y | Axis mask for 2nd homing cycle |
| 46 | `DEFAULT_HOMING_CYCLE_2` | axismask | 0 | Axis mask for 3rd homing cycle |
| 47 | `DEFAULT_HOMING_CYCLE_3` | axismask | 0 | Axis mask for 4th homing cycle |
| 48 | `DEFAULT_HOMING_CYCLE_4` | axismask | 0 | Axis mask for 5th homing cycle |
| 49 | `DEFAULT_HOMING_CYCLE_5` | axismask | 0 | Axis mask for 6th homing cycle |
| 671 | `DEFAULT_HOME_SIGNALS_INVERT_MASK` | axismask | 0 | Invert home switch signal per axis |
| 347 | `DEFAULT_DUAL_AXIS_HOMING_FAIL_AXIS_LENGTH_PERCENT` | float | 5.0 | Dual axis homing fail % of other axis travel |
| 348 | `DEFAULT_DUAL_AXIS_HOMING_FAIL_DISTANCE_MIN` | float | 2.5 | Dual axis homing fail min (mm) |
| 349 | `DEFAULT_DUAL_AXIS_HOMING_FAIL_DISTANCE_MAX` | float | 25.0 | Dual axis homing fail max (mm) |

$22 bit flags:
- Bit 0: Enable homing
- Bit 1: Enable single-axis homing commands ($HX, $HY, etc.)
- Bit 2: Force alarm state on startup (require homing)
- Bit 3: Set machine origin at homed location
- Bit 5: Allow setting home position with $-commands
- Bit 6: Allow soft reset to override init lock
- Bit 8: Force using limit switches for homing
- Bit 10: Run startup scripts only when homed

### Spindle – Primary ($9, $16, $30–$36, $38, $80–$85, $340, $394, $395, $539)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 9 | `DEFAULT_SPINDLE_ENABLE_OFF_WITH_ZERO_SPEED` + flags | bitmask | 0 | Spindle PWM options |
| 16 | `DEFAULT_INVERT_SPINDLE_ENABLE_PIN` + flags | bitmask | 0 | Invert spindle control pins |
| 30 | `DEFAULT_SPINDLE_RPM_MAX` | float | 1000.0 | Maximum spindle RPM |
| 31 | `DEFAULT_SPINDLE_RPM_MIN` | float | 0.0 | Minimum spindle RPM |
| 32 | `DEFAULT_LASER_MODE` / `DEFAULT_LATHE_MODE` | uint8 | 0 | 0=normal, 1=laser, 2=lathe |
| 33 | `DEFAULT_SPINDLE_PWM_FREQ` | uint32 | 5000 | PWM frequency in Hz |
| 34 | `DEFAULT_SPINDLE_PWM_OFF_VALUE` | float | 0.0 | PWM value when spindle is off (%) |
| 35 | `DEFAULT_SPINDLE_PWM_MIN_VALUE` | float | 0.0 | Minimum PWM duty cycle |
| 36 | `DEFAULT_SPINDLE_PWM_MAX_VALUE` | float | 100.0 | Maximum PWM duty cycle (%) |
| 38 | `DEFAULT_SPINDLE_PPR` | uint16 | 0 | Spindle encoder pulses per revolution (0 = disabled) |
| 80 | `DEFAULT_SPINDLE_P_GAIN` | float | 1.0 | Closed-loop spindle P gain |
| 81 | `DEFAULT_SPINDLE_I_GAIN` | float | 0.01 | Closed-loop spindle I gain |
| 82 | `DEFAULT_SPINDLE_D_GAIN` | float | 0.0 | Closed-loop spindle D gain |
| 85 | `DEFAULT_SPINDLE_I_MAX` | float | 10.0 | Closed-loop spindle I max error |
| 340 | `DEFAULT_SPINDLE_AT_SPEED_TOLERANCE` | float | 0.0 | Spindle at-speed tolerance (%) |
| 394 | `DEFAULT_SPINDLE_ON_DELAY` | uint16 | 0 | Spindle-on delay in ms (0 or 500–20000) |
| 395 | `DEFAULT_SPINDLE` | uint8 | 0 | Default spindle type number |
| 539 | `DEFAULT_SPINDLE_OFF_DELAY` | uint16 | 0 | Spindle-off delay in ms (0 or 500–20000) |

$9 bit flags:
- Bit 1: Disable spindle enable at zero speed
- Bit 2: Disable laser mode on PWM spindle
- Bit 3: Enable PWM ramping
- Bit 4: Ignore spindle on/off delays

$16 bit flags:
- Bit 0: Invert spindle enable pin
- Bit 1: Invert spindle direction (CCW) pin
- Bit 2: Invert spindle PWM pin

### Spindle – Second ($709, $716, $730–$736)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 709 | `DEFAULT_PWM_SPINDLE1_ENABLE_OFF_WITH_ZERO_SPEED` + flags | bitmask | 0 | Spindle1 PWM options |
| 716 | `DEFAULT_INVERT_SPINDLE1_ENABLE_PIN` + flags | bitmask | 0 | Invert spindle1 control pins |
| 730 | `DEFAULT_SPINDLE1_RPM_MAX` | float | 1000.0 | Spindle1 max RPM |
| 731 | `DEFAULT_SPINDLE1_RPM_MIN` | float | 0.0 | Spindle1 min RPM |
| 733 | `DEFAULT_SPINDLE1_PWM_FREQ` | uint32 | 5000 | Spindle1 PWM frequency |
| 734 | `DEFAULT_SPINDLE1_PWM_OFF_VALUE` | float | 0.0 | Spindle1 PWM off value |
| 735 | `DEFAULT_SPINDLE1_PWM_MIN_VALUE` | float | 0.0 | Spindle1 PWM min value |
| 736 | `DEFAULT_SPINDLE1_PWM_MAX_VALUE` | float | 100.0 | Spindle1 PWM max value |

$709 and $716 use the same bit assignments as $9 and $16 respectively.

### Coolant ($15, $673)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 15 | `DEFAULT_INVERT_COOLANT_FLOOD_PIN` / `DEFAULT_INVERT_COOLANT_MIST_PIN` | bitmask | 0 | Invert coolant control pins |
| 673 | `DEFAULT_COOLANT_ON_DELAY` | uint16 | 0 | Coolant-on delay in ms |

$15 bits: bit 0 = coolant flood, bit 1 = coolant mist.

### Tool Change ($341–$346, $485)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 341 | `DEFAULT_TOOLCHANGE_MODE` | uint8 | 0 | 0=none, 1=manual, 2=manual@G59.3, 3=semi-auto, 4=ignore |
| 342 | `DEFAULT_TOOLCHANGE_PROBING_DISTANCE` | float | 30.0 | Max probing distance for mode 3 (mm) |
| 343 | `DEFAULT_TOOLCHANGE_FEED_RATE` | float | 25.0 | Tool change feed rate (mm/min) |
| 344 | `DEFAULT_TOOLCHANGE_SEEK_RATE` | float | 200.0 | Tool change seek rate (mm/min) |
| 345 | `DEFAULT_TOOLCHANGE_PULLOFF_RATE` | float | 200.0 | Tool change pull-off rate (mm/min) |
| 346 | `DEFAULT_TOOLCHANGE_NO_RESTORE_POSITION` + flags | bitmask | 0 | Tool change options |
| 485 | `DEFAULT_PERSIST_TOOL` | bool | 0 | Persist tool number across resets |

$346 bits: bit 0 = don't restore position, bit 1 = tool change at G30, bit 2 = fast probe pull-off.

### Probing ($6, $19, $65)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 6 | `DEFAULT_PROBE_SIGNAL_INVERT` / `DEFAULT_TOOLSETTER_SIGNAL_INVERT` | bitmask | 0 | Invert probe/toolsetter input |
| 19 | `DEFAULT_PROBE_SIGNAL_DISABLE_PULLUP` / `DEFAULT_TOOLSETTER_SIGNAL_DISABLE_PULLUP` | bitmask | 0 | Disable probe/toolsetter pull-up |
| 65 | probing flags | bitmask | 0 | Allow feed override during probe / soft limits during probe |

$6 bits: bit 0 = probe, bit 1 = toolsetter.
$19 bits: bit 0 = probe, bit 1 = toolsetter.
$65 bits: bit 0 = allow feed override during probe, bit 1 = soft limits during probe.

### Status Report ($10)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 10 | `DEFAULT_REPORT_MACHINE_POSITION` + flags | bitmask | all on | Status report contents |

$10 bits:
- Bit 0: Report machine position (MPos)
- Bit 1: Report buffer state (Bf)
- Bit 2: Report line numbers (Ln)
- Bit 3: Report feed and speed (FS)
- Bit 4: Report pin state (Pn)
- Bit 5: Report work coordinate offset (WCO)
- Bit 6: Report overrides
- Bit 7: Report probe coordinates
- Bit 8: Sync planner on WCO change
- Bit 9: Auto-report parser state (default: off)
- Bit 10: Report alarm substate (default: off)
- Bit 11: Report run substate (default: off)
- Bit 12: Report while homing (default: off)
- Bit 13: Report distance to go (default: off)

### Motion Planning ($11, $12, $28, $32)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 11 | `DEFAULT_JUNCTION_DEVIATION` | float | 0.01 | Junction deviation (mm) |
| 12 | `DEFAULT_ARC_TOLERANCE` | float | 0.002 | Arc tolerance (mm) |
| 28 | `DEFAULT_G73_RETRACT` | float | 0.1 | G73 chip-breaking retract (mm) |
| 32 | `DEFAULT_LASER_MODE` / `DEFAULT_LATHE_MODE` | uint8 | 0 | 0=normal, 1=laser, 2=lathe |

### Jogging ($40)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 40 | `DEFAULT_JOG_LIMIT_ENABLE` | bool | 0 | Enable soft limit checking during jog |

### Parking and Safety Door ($41, $42, $56–$61, $392, $393)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 41 | `DEFAULT_PARKING_ENABLE` + flags | bitmask | 0 | Parking enable and options |
| 42 | `DEFAULT_PARKING_AXIS` | uint8 | Z | Axis used for parking motion |
| 56 | `DEFAULT_PARKING_PULLOUT_INCREMENT` | float | 5.0 | Parking pullout increment (mm) |
| 57 | `DEFAULT_PARKING_PULLOUT_RATE` | float | 100.0 | Parking pullout rate (mm/min) |
| 58 | `DEFAULT_PARKING_TARGET` | float | -5.0 | Parking target position (mm) |
| 59 | `DEFAULT_PARKING_RATE` | float | 500.0 | Parking fast rate (mm/min) |
| 60 | `DEFAULT_RESET_OVERRIDES` | bool | 0 | Restore overrides on reset |
| 61 | `DEFAULT_DOOR_IGNORE_WHEN_IDLE` / `DEFAULT_DOOR_KEEP_COOLANT_ON` | bitmask | 0 | Safety door behavior |
| 392 | `DEFAULT_SAFETY_DOOR_SPINDLE_DELAY` | float | 4.0 | Spindle delay after door close (s) |
| 393 | `DEFAULT_SAFETY_DOOR_COOLANT_DELAY` | float | 1.0 | Coolant delay after door close (s) |

$41 bits: bit 0 = enable parking, bit 1 = deactivate upon init, bit 2 = enable parking override control.
$61 bits: bit 0 = ignore door when idle, bit 1 = keep coolant on when door open.

### Control Signals ($14, $17)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 14 | `DEFAULT_CONTROL_SIGNALS_INVERT_MASK` | bitmask | 0 | Invert control input signals |
| 17 | `DEFAULT_DISABLE_CONTROL_PINS_PULL_UP_MASK` | bitmask | 0 | Disable pull-up on control inputs |

$14/17 bit assignments: bit 0 = Reset, bit 1 = Feed Hold, bit 2 = Cycle Start, bit 3 = Safety Door, bit 4 = Block Delete, bit 5 = Single Block, bit 6 = Motor Fault, bit 7 = Motor Warning, bit 8 = E-Stop, bit 9 = Probe, bit 10 = Probe 2, bit 11 = Tool Setter, bit 12 = Stop Disable, bit 13 = Limits Override, bit 14 = Macro 0, bit 15 = Macro 1.

### Motor Fault/Warning ($742–$745)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 742 | `DEFAULT_MOTOR_WARNING_SIGNALS_ENABLE` | axismask | 0 | Enable motor warning by axis |
| 743 | `DEFAULT_MOTOR_WARNING_SIGNALS_INVERT` | axismask | 0 | Invert motor warning by axis |
| 744 | `DEFAULT_MOTOR_FAULT_SIGNALS_ENABLE` | axismask | 0 | Enable motor fault by axis |
| 745 | `DEFAULT_MOTOR_FAULT_SIGNALS_INVERT` | axismask | 0 | Invert motor fault by axis |

### Filesystem ($650)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 650 | `DEFAULT_FS_SD_AUTOMOUNT` / `DEFAULT_FS_LITLLEFS_HIDDEN` / `DEFAULT_FS_HIERACHICAL_LISTING` | bitmask | 0 | Filesystem options |

$650 bits: bit 0 = auto-mount SD, bit 1 = hide LittleFS from listings, bit 2 = hierarchical listing.

### Rotary Axes ($376, $538)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 376 | `DEFAULT_AXIS_ROTATIONAL_MASK` | axismask | auto | Designate axes as rotary |
| 538 | `DEFAULT_AXIS_ROTARY_WRAP_MASK` | axismask | 0 | Enable fast G28 return for rotary axes |

### RGB / NeoPixel ($536, $537)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 536 | `DEFAULT_RGB_STRIP0_LENGTH` | uint8 | 0 | NeoPixel strip 0 LED count |
| 537 | `DEFAULT_RGB_STRIP1_LENGTH` | uint8 | 0 | NeoPixel strip 1 LED count |

### ModBus ($374, $681)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 374 | `DEFAULT_MODBUS_STREAM_BAUD` | uint8 | 3 | ModBus RTU baud rate index |
| 681 | `DEFAULT_MODBUS_STREAM_DATA_BITS` / `DEFAULT_MODBUS_STREAM_STOP_BITS` / `DEFAULT_MODBUS_STREAM_PARITY` | packed | 0 | ModBus stream format |

$374 baud rate mapping: 0=9600, 1=14400, 2=19200, 3=38400.

### Reset Actions ($676)

| $ | Symbol | Default | Description |
|:-:|:-------|:--------|:------------|
| 676 | `DEFAULT_HOMING_KEEP_STATUS_ON_RESET` / `DEFAULT_KEEP_OFFSETS_ON_RESET` / `DEFAULT_KEEP_RAPIDS_OVR_ON_RESET` / `DEFAULT_KEEP_FEED_OVR_ON_RESET` | 0 | Behavior on soft reset |

$676 bits: bit 0 = keep homed status, bit 1 = keep offsets, bit 2 = keep rapids override, bit 3 = keep feed override.

### Per-Axis Settings ($100–$199, $800+)

Each axis (X, Y, Z, A, B, C...) has a block of settings at a base offset:

| Base $ | Offset | Symbol | Type | Default | Description |
|:------:|:------|:-------|:----|:--------|:------------|
| 100 | +0 | `DEFAULT_X_STEPS_PER_MM` | float | 250.0 | Steps per mm |
| 110 | +0 | `DEFAULT_X_MAX_RATE` | float | 500.0 | Max feed rate (mm/min) |
| 120 | +0 | `DEFAULT_X_ACCELERATION` | float | 10.0 | Acceleration (mm/s²) |
| 130 | +0 | `DEFAULT_X_MAX_TRAVEL` | float | 200.0 | Max travel (mm) |
| 140 | +0 | `DEFAULT_X_CURRENT` | float | 500.0 | Stepper current (mA RMS, driver-dependent) |
| 160 | +0 | (no symbol) | float | 0.0 | Backlash (mm) |
| 170 | +0 | (no symbol) | float | 0.0 | Dual axis offset (mm) |
| 180 | +0 | `DEFAULT_HOMING_FEED_RATE` (per-axis) | float | 25.0 | Axis homing feed rate |
| 190 | +0 | `DEFAULT_HOMING_SEEK_RATE` (per-axis) | float | 500.0 | Axis homing seek rate |
| 800 | +0 | (jerk, plugin) | float | 100.0 | Jerk (mm/s³) |

For axis Y, add 1 to each offset; Z +2, A +3, B +4, C +5, U +6, V +7, W +8.

### Spindle Linearization ($66–$69, plugin)

These are only available when `ENABLE_SPINDLE_LINEARIZATION` is defined:

| $ | Symbol | Default |
|:-:|:-------|:--------|
| 66 | `DEFAULT_RPM_POINT01` | NAN |
| 66 | `DEFAULT_RPM_LINE_A1` | 3.1971e-03 |
| 66 | `DEFAULT_RPM_LINE_B1` | -3.5261e-01 |
| 67 | `DEFAULT_RPM_POINT12` | NAN |
| 67 | `DEFAULT_RPM_LINE_A2` | 1.7230e-02 |
| 67 | `DEFAULT_RPM_LINE_B2` | 1.0000 |
| 68 | `DEFAULT_RPM_POINT23` | NAN |
| 68 | `DEFAULT_RPM_LINE_A3` | 5.9015e-02 |
| 68 | `DEFAULT_RPM_LINE_B3` | 4.8819e+02 |
| 69 | `DEFAULT_RPM_POINT34` | NAN |
| 69 | `DEFAULT_RPM_LINE_A4` | 1.2034e-01 |
| 69 | `DEFAULT_RPM_LINE_B4` | 1.1514e+03 |

### Miscellaneous ($13, $39, $62, $63, $64, $384, $398, $481, $482, $484)

| $ | Symbol | Type | Default | Description |
|:-:|:-------|:----|:--------|:------------|
| 13 | `DEFAULT_REPORT_INCHES` | bool | 0 | Report in inches instead of mm |
| 39 | `DEFAULT_LEGACY_RTCOMMANDS` | bool | 1 | Enable legacy realtime command characters |
| 62 | `DEFAULT_SLEEP_ENABLE` | bool | 0 | Enable sleep mode |
| 63 | `DEFAULT_DISABLE_LASER_DURING_HOLD` / `DEFAULT_RESTORE_AFTER_FEED_HOLD` | bitmask | 3 | Behavior during feed hold |
| 64 | `DEFAULT_FORCE_INITIALIZATION_ALARM` | bool | 0 | Force alarm state on startup |
| 384 | `DEFAULT_DISABLE_G92_PERSISTENCE` | bool | 0 | Disable G92 coordinate persistence |
| 398 | `DEFAULT_PLANNER_BUFFER_BLOCKS` | uint16 | 100 | Number of planner buffer blocks |
| 481 | `DEFAULT_AUTOREPORT_INTERVAL` | uint16 | 0 | Auto status report interval (ms, 0=off) |
| 482 | `DEFAULT_TIMEZONE_OFFSET` | float | 0.0 | UTC offset in hours |
| 484 | `DEFAULT_NO_UNLOCK_AFTER_ESTOP` | bool | 0 | Require unlock after E-Stop |

$63 bits: bit 0 = disable laser during hold, bit 1 = restore spindle/coolant after hold.

---

## 4. Network Defaults (driver_opts.h)

Network configuration defaults are defined in `driver_opts.h`, not as `DEFAULT_` symbols. They are compile-time values used when the network stack initializes.

| Symbol | Default | Description |
|:-------|:--------|:------------|
| `NETWORK_HOSTNAME` | `"grblHAL"` | mDNS / NetBIOS hostname |
| `NETWORK_IPMODE` | 1 (DHCP) | 0=static, 1=DHCP |
| `NETWORK_IP` | `"192.168.5.1"` | Static IP address |
| `NETWORK_GATEWAY` | `"192.168.5.1"` | Gateway address |
| `NETWORK_MASK` | `"255.255.255.0"` | Subnet mask |
| `NETWORK_TELNET_PORT` | 23 | Telnet port |
| `NETWORK_HTTP_PORT` | 80 | HTTP port |
| `NETWORK_WEBSOCKET_PORT` | 81 (if HTTP) else 80 | WebSocket port |
| `NETWORK_FTP_PORT` | 21 | FTP port |
| `NETWORK_MQTT_PORT` | 1883 | MQTT port |
| `NETWORK_MODBUS_PORT` | 502 | ModBus TCP port |
| `NETWORK_STA_SSID` | `""` | WiFi STA SSID |
| `NETWORK_STA_PASSWORD` | `""` | WiFi STA password |
| `NETWORK_AP_SSID` | `"grblHAL_AP"` | WiFi AP SSID |
| `NETWORK_AP_PASSWORD` | `"grblHALpwd"` | WiFi AP password |

---

## 5. Machine Profiles

Machine profiles bundle a complete machine configuration (compile-time symbols + setting overrides) for a specific machine model. Two systems ship them:

- **Web builder** — JSON profiles with `default_symbols` (compiler defines) and `setting_defaults` (DEFAULT_ overrides)
- **gsender client** — JavaScript modules exporting `{ $key: value }` EEPROM setting objects

### Web Builder Profiles

Profiles live in the `grblhal-profiles` repository (e.g. `profiles/altmill.json`). Each profile has two sections:

- `default_symbols` — compile-time defines (`N_AXIS`, `SPINDLE0_ENABLE`, `N_TOOLS`, etc.)
- `setting_defaults` — `DEFAULT_*` symbol overrides baked into the firmware binary

**Web builder profile values are stored as JSON strings or numbers** and are translated to C defines by the builder's code generator. For example, `"SPINDLE0_ENABLE": "SPINDLE_ALL_VFD"` causes the generator to emit multiple C defines that register all VFD spindle types.

### gsender Client Profiles

gsender ships per-machine `$` setting presets as JavaScript modules. These are applied at the EEPROM layer after flashing. For example, the Altmill gsender profile exports an `ALTMILL_DEFAULT` object with overrides like:

| $ | Value | Meaning |
|:-:|:------|:--------|
| 1 | 255 | Stepper idle lock always on |
| 3 | 6 | Invert Y and Z direction |
| 5 | 15 | Invert all limit switches |
| 20 | 1 | Soft limits enabled |
| 21 | 1 | Hard limits enabled |
| 22 | 79 | Homing flags (init lock + single axis + force origin + two switches + override locks) |
| 24 | 150.0 | Homing feed rate |
| 25 | 4300.0 | Homing seek rate |
| 30 | 24000 | Max spindle RPM |
| 100 | 320.000 | X steps/mm |
| 110 | 15000.0 | X max rate |
| 112 | 6000.0 | Z max rate |
| 130 | 1260.0 | X max travel |
| 131 | 1248.0 | Y max travel |
| 132 | 170.0 | Z max travel |
| 398 | 128 | Planner buffer blocks |
| 744 | 15 | Motor fault enable (all axes) |

Derived variants adjust travel and steps for larger machines:
- **Altmill 2x4**: `$131=648`
- **Altmill 4x8**: `$8=2`, `$101=214.44`, `$111=25000`, `$131=2661`, `$132=220`

---

## 6. Overriding DEFAULT_ at Compile Time

### Via build flags (platformio.ini)

```ini
build_flags =
    -D DEFAULT_STEP_PULSE_MICROSECONDS=3.0f
    -D DEFAULT_HOMING_ENABLE=1
    -D DEFAULT_X_MAX_TRAVEL=800.0f
```

### Via ESP-IDF or RP2040/RP2350 CMakeLists.txt

```cmake
target_compile_definitions(grblHAL PRIVATE
    DEFAULT_STEP_PULSE_MICROSECONDS=4.0f
    DEFAULT_HOMING_ENABLE=1
)
```

### Via Eclipse based IDE

Add settings in the projects _Properties > C/C++ General > Paths and Symbols > Symbols_ tab.

### In grbl/config.h

Edit settings to match preferences. Only do this as the last option since _grbl/config.h_ will be overwritten on updates.

---

## 7. Restoring Defaults at Runtime

Use `$RST=` to reset groups to their compiled-in `DEFAULT_` values:

| Command | Effect |
|:--------|:-------|
| `$RST=*` | Reset all settings |
| `$RST=$` | Reset core `$` settings only |
| `$RST=#` | Reset offsets and tool database if enabled |
| `$RST=&` | Reset driver and plugin settings (network settings etc.) |

> ℹ️ **Info**
> Some of the reset options may be disabled at compile time.  
