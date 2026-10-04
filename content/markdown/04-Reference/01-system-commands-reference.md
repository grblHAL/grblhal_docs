---
slug: reference/commands
---

# System Commands Reference

This page details the system commands available in grblHAL. These commands are distinct from G-code and are used to configure the controller, control machine state, and request real-time information.

They are divided into two categories:
1.  **`$` System Commands**: Text-based commands starting with `$` and terminated by a newline. These interact with settings, memory, and high-level control.
2.  **Realtime Commands**: Single ASCII characters (or byte values) that execute immediately, even while the machine is moving.

---

# `$` System Commands

System commands allow you to view and change settings, control machine modes (like sleep or homing), and read non-volatile data.

> ℹ️ **Info**
> Most `$` commands are processed by the main protocol loop. Some commands (like `$H` for homing) may block other operations until they complete.  
> Plugins may add additional $-commands, send **$help commands** to list all available. 

## Configuration & Settings

### `$$` – View All Settings
Outputs the current value of all numbered settings.

**Syntax:** `$$`

> ℹ️ **Info**
> - Useful for backing up your configuration.
> - See the [Complete Settings Reference](/docs/reference/settings) for details on each setting ID.

---

### `$$=` – View Setting Help
Outputs the description, units, and range for a specific setting.

**Syntax:** `$$=`

**Example:**
-   `$$=100` returns `Travel resolution in steps per millimeter.`
-   `$$=10` Breakdown:
    ```text
    0 - Position in machine coordinate (1)
    1 - Buffer state (2)
    2 - Line numbers (4)
    3 - Feed & speed (8)
    4 - Pin state (16)
    5 - Work coordinate offset (32)
    6 - Overrides (64)
    7 - Probe coordinates (128)
    8 - Buffer sync on WCO change (256)
    9 - Parser state (512)
    10 - Alarm substatus (1024)
    11 - Run substatus (2048)
    12 - Enable when homing (4096)
    13 - Distance-to-go (8192)
    Specifies optional data included in status reports and if report is sent when homing.
    If Run substatus is enabled it may be used for simple probe protection.
    NOTE: Parser state will be sent separately after the status report and only on changes.
    ```

---

### `$x=` – Write Setting
Sets the value of a specific setting.

**Syntax:** `$=`

**Example:**
-   `$100=250.5` (Set X-axis steps/mm to 250.5)
-   `$1=255` (Set step idle delay to 255/always on)

> ⚠️ **Warning**
> Settings are stored in non-volatile memory (NVM - EEPROM/FRAM/Flash) and persist after power cycles. Avoid writing settings inside high-frequency loops to prevent wearing out the memory.

**Tip:**  
To reduce number of writes, and thus the wear and write delay, when updating many settings from a file encapsulate the settings with the `%` character as the first and last line.  
**Example:**
```text
%
$0=5.0
$1=25
...
$132=200.000
%
```

---

### `$x` – Read Setting
Outputs the value of a specific setting.

**Syntax:** `$x`

**Example:**
-   `$100` (Output X-axis steps/mm)
    ```text
	$100=250.5
	ok
    ```
---

> ℹ️ **Info**
> Outputs the build info string and version.

**Syntax:** `$I`

**Output Example:** `[VER:1.1f.20210101:]`

> ℹ️ **Info**
> Outputs extended build information, including axis configuration, firmware options, and driver details.

**Syntax:** `$I+`

**Output Details:**
-   `[AXS::]`: Number of axes and their letter designations (e.g., `XYZ`, `XYZABC`).
-   `[NEWOPT:...]`: Comma-separated list of enabled compile-time options (e.g., `ATC`, `WIFI`, `SD`, `ETH`).
-   `[FIRMWARE:grblHAL]`
-   `[SIGNALS:]`: List of enabled input signals (same codes as realtime report).
-   `[AUX IO:...]`: Counts of digital/analog inputs/outputs.
-   `[DRIVER:...]` and `[PLUGIN:...]`: Driver and plugin specific info.

---

> ℹ️ **Info**
> Sets a custom string in the build info. This can be used to store machine specific information and is added after the colon in the version string.

**Syntax:** `$I=MyMachine_v1.0`  

**Output Example:** `[VER:1.1f.20210101:MyMachine_v1.0]`

> ℹ️ **Info**
> Vendors supplying pre-compiled firmware can set and also disable modification of this string by changing
the symbols `BUILD_INFO` and/or `DISABLE_BUILD_INFO_WRITE_COMMAND` in _grbl/config.h_ or on the compiler command line.

**Example:**
-    `#define BUILD_INFO "MyMachine_v1.0".`
-    `#define DISABLE_BUILD_INFO_WRITE_COMMAND 1`.

---

### `$N` – View Startup Lines
Outputs the currently stored startup G-code blocks. These lines run automatically every time grblHAL powers up or resets.

**Syntax:** `$N`

---

### `$N=` – Set Startup Line
Saves a G-code block to one of the startup lines (typically `$N0` and `$N1`).

**Syntax:**
-   `$N0=G54 G20 G17` (Set first startup line)
-   `$N1=` (Clear second startup line)

Use the `|` (vertical bar) character to separate commands than cannot be put on a single line.

**Common Uses:**
-   Setting default modes (Absolute `G90`, Metric `G21`, Plane `G17`).
-   Resetting work offsets (careful!).

> 🔥 **Danger**
> Do not place motion commands (`G0`, `G1`, `G2`, `G3`) or tool changes (`M6`) in startup lines. This can be dangerous if the machine moves unexpectedly upon connection.
> On setting a startup line the code will be run to validate it before it is stored.

---

### `$RST` – Restore Settings
Restores groups of settings to their firmware defaults.

**Syntax:** `$RST=`

| Flag | Effect |
| :--- | :--- |
| **`$`** | Restores all core `$$` numbered settings to defaults. |
| **`&`** | Restores all driver and plugin defined `$$` numbered settings to defaults. |
| **`#`** | Restores all G-code parameters (`G54`-`G59`, `G28`, `G30`) to zero. |
| **`*`** | Restores **ALL** settings and parameters to defaults. |

---

## Machine Control

### `$J` – Jogging
Commands the machine to move freely. Jog commands are independent of the G-code parser state and can be canceled immediately by a Feed Hold or Jog Cancel command.

**Syntax:** `$J=axes F- ...`

**Requirements:**
-   Must include at least one axis coordinate.
-   Must include a Feed Rate (`F`).
-   Can include `G20`/`G21` (units), `G53` (move in the machine coordinate system) and `G90`/`G91` (distance mode).

**Examples:**
-   `$J=G91 X10 F500` (Move X +10mm relative at 500mm/min)
-   `$J=G90 Z5 F100` (Move Z to absolute 5mm at 100mm/min)

> ℹ️ **Info**
> -   Jogging is "safer" than `G0`/`G1` because it checks soft limits (if enabled) *before* moving and can be smoothly aborted by the user.
> -   If the machine is homed set [$40=1](/docs/reference/settings#40) to automatically limit jog motion to be within machine limits.

---

### `$H` – Homing Cycle
Initiates the homing sequence to find the machine origin.

**Syntax:** `$H` (Homes all configured axes in standard sequence)

**Extended Syntax (Single Axis):**
-   `$HX` (Home X only)
-   `$HY` (Home Y only)
-   `$HZ` (Home Z only)
-   `$HA` ... `$HW` (Home rotary/secondary axes)

> ⚠️ **Warning**
> Requires limit switches to be installed and configured unless [configured](/docs/reference/settings#22) to allow manually homed axes.

---

### `$SLP` – Sleep Mode
Puts the machine into a low-power sleep state.

**Syntax:** `$SLP`

**Behavior:**
-   Disables spindle and coolant.
-   Disables stepper motors (they lose holding torque!).
-   Requires a Reset (`ctrl-x`) to wake up.

---

### `$C` – Check Mode
Toggles "Check Mode". In this mode, grblHAL parses and validates G-code but **does not move** the machine or turn on the spindle.

**Syntax:** `$C`

**Usage:**
-   Send `$C` to enable.
-   Stream your G-code file. grblHAL will report verifying lines or errors (`error:xx`).
-   Send `ctrl-x` (Reset) to exit Check Mode.

---

### `$X` – Unlock / Kill Alarm
Disables the alarm lock state.

**Syntax:** `$X`

**Usage:**
-   If the machine is in an Alarm state (e.g., hard limit hit, or unhomed with `$22=1`), it often locks motion.
-   `$X` overrides this lock, allowing you to jog away from a switch or move the machine.
-   **Caution:** This does not fix the underlying issue (e.g., machine position may be lost).

---

## Diagnostics & Reporting

### `$G` – View G-code Parser State
Outputs the currently active G-code modal states.

**Syntax:** `$G`

**Output Example:** `[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0]`
-   Shows: Motion mode, WCS, Plane, Units, Distance, Feed mode, Spindle/Coolant state, Tool, Feed rate, RPM.

**grblHAL Extensions:**
-   Includes extended G-codes when available: `G5`, `G7`, `G8`, `G43`/`G49` (TLO), `G96`/`G97` (Spindle Mode), `G98`/`G99` (Retract), `M50`/`M51`/`M53` (Overrides), `M56` (Parking), `M60` (Pallet) etc.

---

### `$#` – View Parameters
Outputs the stored offsets for work coordinate systems, tool offsets, and pre-defined positions.

**Syntax:** `$#`

**Output Example:**
`[G54:0.000,0.000,0.000]`
`[G28:0.000,0.000,0.000]`
`[TLO:0.000]`
`[PRB:0.000,0.000,0.000:0]`

**grblHAL Extensions:**
-   `[G51:]`: if scaling active.
-   `[HOME::]`: Axis home positions.
-   `[T:,]`: Tool table entries.
-   `[TLR:]`: Tool length reference.
-   `[TLR@:]`: Tool length reference details: where probed, tool axis, probed at G59.3.

---

### `$PINS` – Report Pin Status
Debug command to show the current hardware mapping of input/output pins.

**Syntax:** `$PINS`

**Output Example:**
```text
[PIN:PB12,Emergency stop]
[PIN:PC4,Probe]
[PIN:PA15,X motor fault]
...
[PIN:PE13,Spindle on]
[PIN:PB1,Spindle direction]
[PIN:PA8,Spindle PWM]
...
[PIN:PD6,RX,Modbus]
[PIN:PD5,TX,Modbus]
```

---

### `$PINSTATE` – Detailed Pin Enumeration
Enumerates auxiliary pins with type, description, mode (input/output, inverted, pull-up/down), and capabilities.

**Syntax:** `$PINSTATE`

**Output Format:**
```text
[PINSTATE:|||||]
```

**Example:**
```text
$pinstate
[PINSTATE:DIN|P0|0|NU--|IB--|1]
[PINSTATE:DIN|P1|1|NU--|IB--|1]
[PINSTATE:DIN|P2|2|NU--|IBED|1]
[PINSTATE:DIN|Toolsetter|3|NU--|IBED|1]
[PINSTATE:DIN|Emergency stop|12|NUR-|IBED|0]
[PINSTATE:DOUT|P0 ||,RX|,TX|...]
```

**Example:**
```text
$PORTS 
[PORT:0|UART1|PC5,RX|PD8,TX|115200,8,N,1|F]
[PORT:1|Modbus|PD6,RX|PD5,TX|19200,8,N,1|C]
```

---

### `$SPINDLES` / `$SPINDLESH` – Enumerate Spindles
Lists available spindles. 
-   `$SPINDLES`: Human readable format.
    ```text
    2 - H-100, enabled as spindle 0, active
    0 - PWM
    1 - PWM2
    ```
-   `$SPINDLESH`: Machine readable format:
    ```text
    [SPINDLE:|||||,]
    ```
    
    **Example:**
    ```text
    [SPINDLE:2|0|2|*SDVE|H-100|7500.0,24000.0]
    [SPINDLE:0|-|0|DIRV|PWM|7500.0,24000.0]
    [SPINDLE:1|-|0|IRV|PWM2|0.0,255.0]
    ```

---

## Help & Enumeration

System commands to discover capabilities.

| Command | Description |
| :--- | :--- |
| **`$HELP`** | List help topics. |
| **`$EA`** | Enumerate all alarms. Returns `[ALARMCODE:val|message|description]`. |
| **`$EAG`** | Enumerate alarms in Grbl CSV format (for senders). |
| **`$EE`** | Enumerate all error codes. Returns `[ERRORCODE:val|message|description]`. |
| **`$EEG`** | Enumerate errors in Grbl CSV format. |
| **`$ES`** | Enumerate settings. Returns `[SETTING:id|group|name|unit|type|format|min|max...]`. |
| **`$ESG`** | Enumerate settings in Grbl CSV format. |
| **`$ESH`** | Enumerate settings in grblHAL tab-separated format. |
| **`$EG`** | Enumerate setting groups. Returns `[SETTINGGROUP:id|parent|name]`. |

---

## Additional Commands

Extended functionality for machine control and debugging found in the source.

| Command | Description |
| :--- | :--- |
| **`$B`** | Toggle **Block Delete** switch. |
| **`$S`** | Toggle **Single Block** mode. |
| **`$O`** | Toggle **Optional Stop** switch. |
| **`$HX`..`$HW`** | Home individual axes (`X`, `Y`, `Z`, `A`, `B`, `C`, `U`, `V`, `W`). |
| **`$HSS`** | Report **Homing Switch Status**. |
| **`$TPW`** | **Tool Probe Workpiece**. Probes the tool plate. |
| **`$TLR`** | **Set Tool Length Reference**. Sets the current tool offset reference. |
| **`$LEV`** | Output **Last Signals Event**. Useful for debugging input glitches. |
| **`$LIM`** | Output **Current Limit State**. Shows which limit pins are currently active. |
| **`$SD`** | Report **Spindle Data**. |
| **`$SR`** | Reset **Spindle Data**. |
| **`$SDS`** | Report **Stepper Status**. |
| **`$REBOOT`** | **Reboot System**. Soft reboots the controller. |
| **`$RTC`** | **Real Time Clock** action. |
| **`$DWNGRD`** | Toggle **Downgrade** setting flags. |
| **`$TTLOAD`** | **Reload Tool Table**. Reloads tool data from `tooltable.tbl` (if file-based tool table is active). |
| **`$MODBUSSTATS`** | **Modbus Statistics**. Returns communication stats (sent/retries). Use `$MODBUSSTATS=R` to reset. |
| **`$BL`** | Enter **Bootloader**. Jumps to the bootloader (e.g., Teensy Loader) if supported by the driver. |

---

# System Commands ($)

System commands are special real-time or near-real-time commands that start with `$`. They are used to configure, control, and query the machine state.

## Core Commands

| Command | Description |
|---------|-------------|
| **`$$`** | View current settings. |
| **`$#`** | View G-code parameters (WCS offsets, probe positions, tool offsets). |
| **`$G`** | View G-code parser state (active modes like G54, G17, G90, etc.). |
| **`$I`** | View build info string. |
| **`$N`** | View startup blocks. |
| **`$X`** | **Kill Alarm Lock.** Unlocks the machine from an alarm state (e.g., hard limit). Use with caution! |
| **`$H`** | **Run Homing Cycle.** Homes all axes specified in `$23`. |
| **`$HX`** | **Home Individual Axis.** Homes only the X axis (replace X with Y, Z, etc.). |
| **`$J=...`** | **Jogging.** Execute a jogging motion. |
| **`$SLP`** | **Sleep.** Put the machine to sleep. |

## Tool Change Extensions

These commands are specific to manual and semi-automatic tool change modes.

| Command | Description |
|---------|-------------|
| **`$TLR`** | **Set Tool Length Reference.** Sets the current tool length offset as the reference. Used after a successful probe for the first tool in a job. |
| **`$TPW`** | **Tool Probe Workpiece.** Initiates a probing sequence to set the dynamic tool offset for a new tool. Only available in Tool Change Modes 1 and 2. |

## Reporting & Enumeration (grblHAL Extensions)

grblHAL provides advanced reporting commands for Senders to query up to date data, there is no need for them to rely on hardcoded lists.

| Command | Description |
|---------|-------------|
| **`$EA`** | **Enumerate Alarms.** Lists all supported alarm codes and descriptions. |
| **`$EE`** | **Enumerate Errors.** Lists all supported error codes and descriptions. |
| **`$ES`** | **Enumerate Settings.** Lists all supported settings with types, ranges, and descriptions. |
| **`$EG`** | **Enumerate Setting Groups.** Lists the hierarchy of setting groups. |
| **`$PINS`** | **Enumerate Pins.** Lists processor pin mappings. |
| **`$PINSTATE`** | **Enumerate Pin States.** Lists current state of auxiliary pins. |
| **`$PORTS`** | **Enumerate Serial Ports.** Lists available UART ports. |
| **`$SPINDLES`** | **Enumerate Spindles.** Lists available spindles. |


## File handling

grblHAL utilizes a **Virtual File System (VFS)** layer that allows it to interact with different storage media through a unified set of commands and programming interfaces.
It is a [hierarchical file system ](https://en.wikipedia.org/wiki/Hierarchical_file_system) where different media is mounted as directories,
either as the root directoy (/) or as a subdirectory under it.

### SD Card (FatFs)
The SD card is the primary high-capacity storage for G-code files, typically formatted as **FAT32**.
- **Mount Point:** Usually mounted at the root (`/`).
- **Performance:** Ideal for large 3D carving jobs or complex laser engraving.
- **Hot-Swapping:** Supported on boards with SD detect support.

#### `$FM` – Mount SD card
Mount the SD card, typically as the root (`/`) file system.

**Syntax:** `$FM`

#### `$FU` – Unmount SD card
Unmounts the SD card.

**Syntax:** `$FU`

#### `$FF` – Format SD Card
Formats the SD card. **All data will be lost.**

**Syntax:** `$FF=yes`

### Internal Flash or EEPROM (LittleFS)
LittleFS is a fail-safe file system designed for microcontrollers, using the controllers internal flash memory or part of large EEPROMs (>= 32K) for storage.
- **Mount Point:** Often used as a fallback if no SD card is present, typically mounted at `/littlefs`. It may also be mounted as the root (`/`) file system if SD Card is not available.
- **Use Case:** Best for small macro files, tool tables (`tool.tbl`), and persistent system configuration.
- **Reliability:** Resistant to power loss during write operations.

### Internal flash (Embedded)
The Embedded filing system is read only and is added to flash at compile time.

- **Mount Point:** Typically mounted at `/embedded`.
- **Use Case:** Best for persistent system configurations/data that does not change often. 
- **Reliability:** Read only, can only be changed by reflashing the firmware.

### RAM
The RAM filing system uses the heap to store transient data. Typically files are automatically deleted after first read.

### File System Commands {#file-system}
These commands allow navigation and management of the file system.

| Command           | Description |
|:-----------------:|:------------|
| **`$F`**          | **List Files.** Lists CNC-compatible files (`.nc`, `.gcode`, etc.) in the current working directory. |
| **`$F+`**         | **List All Files.** Lists all files in the current working directory regardless of extension. |
| **`$F=[file]`**   | **Run File.** Starts execution of the specified G-code file. |
| **`$F<=[file]`**  | **Copy file to output.** Copies/streams the specified file to the current output. |
| **`$FR`**         | **Rewind file.** Enables rewind mode for next file to run. When finished it can be rerun by issuing a Cycle Start command |
| **`$FD=[file]`**  | **Delete File.** Permanently removes a file from the storage. |
| **`$CWD=[path]`** | **Change Directory.** Sets the Current Working Directory. Usage: `$CWD=/` (root), `$CWD=..` (up), `$CWD=subdir` (down). If called without arguments, it reports the current path. |
| **`$PWD`**        | **Print Working Directory.** Reports the current working directory in the format `[CWD:/path/to/dir]`. |
| **`$FMD=[path]`** | **Create directory.** |
| **`$FRD=[path]`** | **Remove directory.** |
| **`$FI`**         | **Mount info.** Outputs information about mounted filing systems. |

#### Navigation & Usage
grblHAL keeps track of a **Current Working Directory (CWD)**. By default, this is the root `/`. When you use `$F` to list files or `$F=` to run one, grblHAL looks inside the CWD. You can navigate into subfolders using `$CWD=foldername` and back up using `$CWD=..`.

> [!TIP]
> You can use `$PWD` at any time to verify where you are in the file system. This is particularly useful when managing complex folder structures for different projects.

---

## YModem protocol

TBC

The YModem protocol is part of the [file system plugins](/docs/reference/plugins#ymodem).

---

## Advanced System Commands

| Command | Description |
|---------|-------------|
| **`$REBOOT`**     | **System Reboot.** Hard resets the controller. Connection will be lost. (Build 20251208) |
| **`$DFU`**        | **Enter Bootloader.** Reboots the controller into DFUootloader mode for firmware flashing. Connection will be lost. |
| **`$BL`**         | **Enter Bootloader.** Reboots the controller into native bootloader mode for firmware flashing. Connection will be lost. |
| **`$BOOTLOADER`** | **Enter Bootloader.** Reboots the controller into native bootloader mode for firmware flashing. Connection will be lost. |
| **`$MODBUSCMD`**  | **Modbus Command.** Send raw Modbus commands. (Build 20260215) |
| **`$TTLOAD`**     | **Reload Tool Table.** Reloads file based tool table from storage. (Build 20251111) |

---

# Realtime Commands

Realtime commands are single control characters that can be sent to grblHAL at any time. They are intercepted from the input stream and executed immediately, often within tens of milliseconds, bypassing the normal G-code planner buffer.

> ℹ️ **Info**
> -   **No Newline Needed:** These are _single byte/character_ command bytes. Do not send a `CR` or `LF` after them.
> -   **Immediate Execution:** They work even if the input buffer is full.
> -   **State Dependent:** Some commands (like `!` Feed Hold) are only valid in certain states (e.g., Run, Jog).
> -   **Ignored if Invalid:** If a command cannot be executed (e.g., toggling spindle stop while moving), it is silently ignored to prevent unsafe conditions.

## Basic Control Commands

These are the standard Grbl control characters found in most senders. The _Alt._ column contains a grblHAL alternative which are outside the 'printable' ASCII characters range, some senders may not support/use these.

| Char  | Hex   | Alt.  | Name | Description |
| :---: | :---: | :---: | :--- | :--- |
| **`?`** | `0x3F` | `0x80` | **Status&nbsp;Report** | Immediately generates and sends a runtime status report (see Realtime Report section below).  - Can be sent at any time, except during critical system alarms. - The content of the report is configured by the `$10` setting. |
| **`~`** | `0x7E` | `0x81` | **Cycle Start / Resume** | - **In Hold:** Resumes the cycle after a Feed Hold (`!`) or Program Stop (`M0`). - **In Door:** Resumes from a safety door state (if closed). - **Otherwise:** Ignored. |
| **`!`** | `0x21` | `0x82` | **Feed Hold** | - **In Motion:** Decelerates the machine to a controlled stop and enters a `Hold` state.  - **In Jog:** Cancels the jog and flushes the buffer. - **Spindle/Coolant:** Remain **ON** during a feed hold.  - **Ignored:** In Idle or Alarm states. |
| **`^x`** | `0x18` |   | **Soft Reset** | (Ctrl-X) - **Immediate Halt:** Stops all pulse generation, turns off spindle/coolant, and flushes the planner buffer. - **State:** Resets grblHAL to the `Alarm` state (if in motion) or `Idle` state (if stopped). - **Position:** If reset during motion, position is considered lost (requires re-homing). If reset while idle, position is retained. |
| **`^y`** |  | `0x19` | **Stop** | (Ctrl-Y) - **Halt:** Executes a fast hold if in motion, turns off spindle/coolant, and flushes the planner buffer. - **State:** Resets grblHAL to the `Idle` state. - **Position:** Position is _not_ lost. |
|          |  | `0x9F` | **Soft E-stop** | **E-stop:** Executes a fast hold if in motion, turns off spindle/coolant, and flushes the planner buffer. - **State:** Resets grblHAL to the E-stop `Alarm` state. - **Position:** Position is _not_ lost. This is **not** a safe alternative to a proper hardware based E-stop system. |

---

## Overrides

Overrides allow you to fine-tune the machine's operation in real-time.

### Feed Rate Overrides
Alters the programmed feed rate (`F`) for `G1`, `G2`, `G3` moves.
-   **Range:** 10% to 200%.
-   **Limits:** Commands that would push the value outside this range are ignored.
-   **Scope:** Does **not** affect Rapid (`G0`) or Jog motions.
-   **Latency:** Changes take effect immediately (within the current planner block).

| Hex | Command | Description |
| :---: | :--- | :--- |
| `0x90` | **Set 100%** | Restores feed rate to the programmed value. |
| `0x91` | **+10%** | Increases feed override by 10%. |
| `0x92` | **-10%** | Decreases feed override by 10%. |
| `0x93` | **+1%** | Increases feed override by 1%. |
| `0x94` | **-1%** | Decreases feed override by 1%. |

### Rapid Rate Overrides
Scales the speed of `G0`, `G28`, and `G30` rapid motions.
-   **Scope:** Affects rapid motions only. Does not affect cutting moves (`G1`, etc.).
-   **State:** Can be changed at any time.

| Hex | Command | Description |
| :---: | :--- | :--- |
| `0x95` | **100%** | Sets rapids to full speed (Max Rate). |
| `0x96` | **50%** | Sets rapids to 50% of max rate. |
| `0x97` | **25%** | Sets rapids to 25% of max rate. |
| `0x98` | **5%** | Sets rapids to 5% of max rate. Available since build 20260831. |

### Spindle Speed Overrides
Alters the programmed spindle speed (`S`).
-   **Range:** 10% to 200%.
-   **Limits:** Commands that would push the value outside this range are ignored.
-   **State:** Can be changed even if the spindle is currently stopped (will take effect when started).

| Hex | Command | Description |
| :---: | :--- | :--- |
| `0x99` | **Set 100%** | Restores spindle speed to the programmed value. |
| `0x9A` | **+10%** | Increases spindle override by 10%. |
| `0x9B` | **-10%** | Decreases spindle override by 10%. |
| `0x9C` | **+1%** | Increases spindle override by 1%. |
| `0x9D` | **-1%** | Decreases spindle override by 1%. |

### Spindle Stop Override {#spindle-stop-override}
| Hex | Command | Description |
| :---: | :--- | :--- |
| `0x9E` | **Toggle&nbsp;Spindle&nbsp;Stop** | - **Only valid in HOLD state.** - Toggles the spindle On/Off while paused. - **Safety:** Ignored during motion to prevent crashing. - **Resume:** When Cycle Start (`~`) is issued, the spindle automatically restores its previous state. The system waits 4.0 seconds (configurable) for the spindle to spin up before resuming motion. |

### Coolant Overrides {#coolant-overrides}
Toggles coolant states directly.
-   **State:** Valid in standard states (Idle, Run, Hold).
-   **Parser Update:** These commands **update the modal state** of the G-code parser. A `$G` report will reflect the change.

| Hex | Command | Description |
| :---: | :--- | :--- |
| `0xA0` | **Toggle Flood** | Toggles M8 Flood Coolant on/off. |
| `0xA1` | **Toggle Mist** | Toggles M7 Mist Coolant on/off. |

---

## Extended Commands

These functionality codes are specific extensions or part of the extended ASCII set.

| Hex | Name | Description |
| :---: | :--- | :--- |
| `0x84` | **Safety&nbsp;Door** | - Simulates opening the safety door. - **Action:** Enters `Door:0` state. Retracts mode is optional (if enabled). Spindle/Coolant turn off. - **Resume:** Requires closing the door (or re-sending `0x84` in some sims) and sending Cycle Start (`~`). |
| `0x85` | **Jog Cancel** | - **Only valid in JOG state.** - Effectively brings the machine to a smooth stop during a jog command. - Flushes the input and planner buffers for any pending jog commands. |
| `0x87` | **Report All** | (grblHAL specific) Acts like `?` but returs **all** available data fields. Useful for senders to fully synchronize state. |
| `0x88` | **Optional stop toggle** | (grblHAL specific) Toggles optional stop mode, when enabled `M1` 'pause' commands in the gcode will be ignored. |
| `0x89` | **Single block toggle** | (grblHAL specific) Toggles single block mode, when enabled grblHAL will enter `Hold` state after each gcode block (line) waiting for a cycle start command to continue. |
| `0x8A` | **Toggle FAN0 on/off** | (grblHAL specific) Toggles fan 0 on/off, only available when firmware has fan support enabled. |
| `0x8B` | **Toggle MPG mode** | (grblHAL specific) Switches MPG/pendant in/out of full control, sent by the MPG/pendant and only available when firmware has MPG support enabled. |
| `0xA3` | **Tool ACK** | (grblHAL specific) Acknowledge tool change state, sent by the sender when `TOOL` state is reported. |

---

# Realtime Report

When you send `?`, status reports are streamed back. The format is a structured text string enclosed in ``, with fields separated by pipe `|` characters.

```text
[{:}|{|Bf:,}{|Ln:}{|FS:,{,}}{|Pn:}{|WCO:}{|WCS:G}{|Ov:}{|A:}{|MPG:}{|H:{,}}{|D:}{|Sc:}{|TLR:}{|FW:}{|In:}]
```

> ℹ️ **Info**
> In the definitions below:
> - `{ }` indicates optional items.
> - `` indicates variables or constants.
> - `|` separates literal values.

## Core States

`Idle`, `Run`, `Hold`, `Jog`, `Alarm`, `Door`, `Check`, `Home`, `Sleep`
-   **New in grblHAL:** `Tool` (for [Tool Change Protocol](https://github.com/grblHAL/core/wiki/Manual-tool-change-protocol)).
-   **Substatuses:**
    -   `Run:`: `1`=Feed hold pending, `2`=Probing.
    -   `Alarm:`: Current alarm code (always added for `0x87` report).

## Report Fields

| Field | Description | Format/Details |
|:------------:| :--- | :--- |
| **Position** | Current&nbsp;axis&nbsp;positions. | `MPos:x,y,z...` (Machine) or `WPos:x,y,z...` (Work). |
| **Bf** | Buffer status. | `Bf:,` |
| **Ln** | Line Number. | `Ln:` |
| **FS** | Feed and Speed. | `FS:,{,}` |
| **Pn** | Input Signals. | `Pn:`  **P**: Probe, **O**: Probe disconnected, **X/Y/Z/A/B/C/U/V/W**: Limits **D**: Door, **R**: Reset, **H**: Feed Hold, **S**: Cycle Start **E**: E-Stop, **L**: Block Delete, **T**: Optional Stop **M**: Motor Warning, **F**: Motor Fault, **Q**: Single Step |
| **WCO** | Work Coordinate Offset. | `WCO:x,y,z...` |
| **WCS** | Active Work System. | `WCS:G54`, `WCS:G59.3`, etc. (Sent on change) |
| **Ov** | Overrides. | `Ov:,,` |
| **A** | Accessory State. | `A:` **S**: Spindle CW, **C**: Spindle CCW **M**: Mist (M7), **F**: Flood (M8) **T**: Tool Change Pending (M6) |
| **MPG** | Pendant Status. | `MPG:0` (Released), `MPG:1` (Taken). |
| **H** | Homing Status. | `H:0` (Not homed), `H:1` (Homed). Optional `,` for axis-specific. |
| **P** | Active Probe. | `P:` (0=Primary, 1=Toolsetter, 2=Secondary). Reported when switching probes. |
| **D** | Diameter Mode. | `D:0` (Radius/G8), `D:1` (Diameter/G7). (Lathe only). |
| **Sc** | Scaling Status. | `Sc:` (e.g., `Sc:XY`). |
| **TLR** | Tool Length Reference. | `TLR:offset`, only reported when set. |
| **TLR@** | Tool Length Reference position. | `TLR@:a,b:tool axis:atG53`, only reported when set. |
| **FW** | Firmware Identity. | `FW:grblHAL` (Full report `0x87` only, this is the only way to detect which controller firmware when in `Hold` state). |
| **In** | Input Result (M66). | `In:0`/`In:1` (Digital state), `In:-1` (Error, not requested), `In:value ` (Analog state). |
| **SD** | SD Card Status. | `SD:0` (Unmounted) `SD:1` (Mounted) `SD:2` (Unmounted, auto-detect) `SD:3` (Mounted, auto-detect) `SD:pct completed,filename` (Streaming) `SD:Pending` (Suspended) |
| **$C** | Blocking event active. | `$C:1` (Full report `0x87` only). |

> 📝 **Note**
> When a full status (`0x87`) is requested the `SD:x` mount status is always reported, **not** the streaming state. Plugins may add additional fields to the report.
