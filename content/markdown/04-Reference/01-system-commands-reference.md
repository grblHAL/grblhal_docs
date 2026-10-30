---
slug: reference/commands
---

# System Commands Reference

This page details the system commands available in grblHAL. These commands are distinct from G-code and are used to configure the controller, control machine state, and request information.

They are divided into two categories:
1.  **$ Prefixed System Commands**: Text-based commands starting with `$` and terminated by a newline. These interact with settings, memory, and high-level control.
2.  **Realtime Commands**: Single ASCII characters (or byte values) that queued for immediate execution, even while the machine is moving or in a critical [`Alarm`](#rtstate-alarm) state.

> [!NOTE]
> - Senders will typically use and 'hide' many if these commands behind UI elements such as buttons.
> - Plugins may add additional $-commands, send **$help commands** to list all available. 

---

## System Commands Overview

### Basic Commands <!--toc-->

| Command | Action | Description |
|:-------:|:-------|:------------|
| **`$HELP`** | List help topics ||
| [**`$$`**](#settings-list) | Output current settings ||
| [**`$$=<n>`**](#setting-help) | View help for setting `<n>` ||
| [**`$#`**](#hash) | Output G-code parameters| WCS offsets, probe positions, tool offsets. |
| [**`$G`**](#parser-state) | Output G-code parser state | Active modes like G54, G17, G90, etc. |
| [**`$I`**](#firmware-info) | Output firmware information ||
| [**`$I=`**](#set-build-string) | Set custom build string ||
| [**`$N`**](#startup-blocks) | Output startup blocks ||
| [**`$N<n>=`**](#set-startup-block) | Set startup block ||
| [**`$X`**](#unlock) | Kill Alarm Lock. | Unlocks the machine from an alarm state (e.g., hard limit). |
| [**`$H`**](#homing) | Run Homing Cycle. | Homes all axes specified in `$23`. |
| [**`$H-`**](#homing) | Home Individual Axis. | Homes only the given axis (replace - with X, Y, Z, etc.). |
| [**`$J=-`**](#jog) | Jogging | Execute a jogging motion. |
| [**`$RST=`**](#restore-settings) | Restore settings ||
| [**`$SLP`**](#sleep) | Enter Sleep | Put the machine to sleep |
| [**`$SD`**](#spindle-data) | Output spindle encoder data ||
| [**`$SR`**](#spindle-data-reset) | Reset spindle encoder data ||

### Additional Commands <!--toc-->

Extended functionality for machine control and debugging found in the source.

| Command | Description |
| :--- | :--- |
| **`$B`** | Toggle **Block Delete** switch. |
| **`$S`** | Toggle **Single Block** mode. |
| **`$O`** | Toggle **Optional Stop** switch. |
| **`$HSS`** | Report **Homing Switch Status**. |
| **`$TPW`** | **Tool Probe Workpiece**. Probes the tool plate. |
| **`$TLR`** | **Set Tool Length Reference**. Sets the current tool offset reference. |
| **`$LEV`** | Output **Last Signals Event**. Useful for debugging input glitches. |
| **`$LIM`** | Output **Current Limit State**. Shows which limit pins are currently active. |
| **`$SD`** | Report **Spindle Data**. |
| **`$SR`** | Reset **Spindle Data**. |
| **`$SDS`** | Report **Stepper Status**. |
| [**`$REBOOT`**](#reboot) | **Reboot System**. Soft reboots the controller. |
| **`$RTC`** | **Real Time Clock** action. |
| **`$DWNGRD`** | Toggle **Downgrade** setting flags. |
| **`$TTLOAD`** | **Reload Tool Table**. Reloads tool data from `tooltable.tbl` (if file-based tool table is active). |
| **`$MODBUSSTATS`** | **Modbus Statistics**. Returns communication stats (sent/retries). Use `$MODBUSSTATS=R` to reset. |
| **`$BL`** | Enter **Bootloader**. Jumps to the bootloader (e.g., Teensy Loader) if supported by the driver. |

---

### Tool Change Extensions <!--toc-->

These commands are specific to manual and semi-automatic tool change modes.

| Command | Description |
|---------|-------------|
| **`$TLR`** | **Set Tool Length Reference.** Sets the current tool length offset as the reference. Used after a successful probe for the first tool in a job. |
| **`$TPW`** | **Tool Probe Workpiece.** Initiates a probing sequence to set the dynamic tool offset for a new tool. Only available in Tool Change Modes 1 and 2. |

### Reporting & Enumeration <!--toc-->
grblHAL provides commands for senders to query up to date data such as alarm and error codes, documented [here](#enumerations).

## System Commands Reference {#reference}

### Configuration & Settings <!--toc--> {#settings}

### `$$` – Output All Settings {#settings-list}
Outputs the current value of all numbered settings.

**Syntax:** `$$`

> ℹ️ **Info**
> - Useful for backing up your configuration.
> - See the [Complete Settings Reference](/docs/reference/settings) for details on each setting ID.

---

### `$$=` – Output Setting Help {#setting-help}
Outputs the description and details such as units and allowed range for a specific setting.

**Syntax:**  
`$$=`

**Examples**
* _Output info for travel resolution in steps per millimeter fox X-axis:_
	```gcode
	$$=100
	```
	outputs
    ```text
	$100: X-axis travel resolution in step/mm

	Travel resolution in steps per millimeter.
	ok
	```
* _Output info for status report options:_
	```gcode
	$$=10
	```
	outputs
    ```text
	$10: Status report options as bitfield:
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
		14 - Extended (16384)

	Specifies optional data included in status reports and if report is sent when homing.
	If Run substatus is enabled it may be used for simple probe protection.

	NOTE: Parser state will be sent separately after the status report and only on changes.
	ok
    ```

> [!TIP]
> Bitfield settings like `$10` in the example above are special: to enable _one_ option set the setting to the value enclosed in  parentheses for the option, to enable more than one sum the values for each option.

> [!NOTE]
> The output is plain text, not "Grbl" formatted, some senders may not tolerate it. Use a terminal program, like puTTY, when using this command to be on the safe side.

---

### `$x=` – Write Setting
Sets the value of a specific setting.

**Syntax:** `$=`

**Example:**
-   `$100=250.5` (Set X-axis steps/mm to 250.5)
-   `$1=255` (Set step idle delay to 255/always on)

> [!WARNING]
> Settings are stored in non-volatile storage (NVS - EEPROM/FRAM/Flash) and persist after power cycles. Avoid writing settings inside high-frequency loops to prevent wearing out the memory.

> [!TIP]
> To reduce number of writes, and thus the wear and write delay, when updating many settings from a file encapsulate the settings with the `%` character as the first and last line. An example:
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

### `$I` - Output Firmware Infomation {#firmware-info}
Outputs firmware information, including version, build date, axis configuration, firmware options, and driver details.

**Syntax:** `$I`

**Output Details:**
-   `[VER..:]` - Dot separated major version, minor version and build date in YYYYMMDD format followed by semicolon and optional build string.
- <a id="firmware-axes"/>  `[AXS::]` - Number of axes and their letter designations (e.g., `XYZ`, `XYZABC`).
-   `[NEWOPT:,,,...]` - Comma-separated list of enabled compile-time options (e.g., `ATC`, `WIFI`, `SD`, `ETH`).
-   `[FIRMWARE:grblHAL]`
-   `[SIGNALS:]` - List of enabled input signals (same codes as realtime report).
-   `[DRIVER:@]` - Driver name followed by a `@` and MCU clock frequency.
-   `[DRIVER VERSION:]` - Date in YYMMDD format.
-   `[BOARD:]` - Driver name followed by a `@` and MCU clock frequency.
- <a id="firmware-aux-io"/>   `[AUX IO:,,,]` - Comma separated list with number of digital/analog inputs/outputs.
-   `[PLUGIN:]`: - Plugin name and version, one line for each installed.

**Example**

```text
[VER:1.1f.20261008:My machine]
[OPT:VNMSL,100,1024,4,10]
[AXS:4:XYZA]
[NEWOPT:ENUMS,RT+,RF,ES,REBOOT,EXPR,TC,SED,RTC,YM,SD]
[FIRMWARE:grblHAL]
[SIGNALS:HSEP]
[NVS STORAGE:*FLASH 16K]
[FREE MEMORY:84K]
[DRIVER:STM32F446@180MHz]
[DRIVER VERSION:261006]
[BOARD:Nucleo-64 CNC Breakout]
[AUX IO:12,10,0,0]
[PLUGIN:FS stream v1.16]
[PLUGIN:FS macro plugin v0.25]
[PLUGIN:MODBUS v0.25]
[PLUGIN:HUANYANG VFD v0.20]
[PLUGIN:SDCARD v1.29]
[SPINDLE:PWM]
ok
```

> [!TIP]
> When reporting issues the build date, driver name and board name are the most important to add.

---

### `$I=` Set Build String {#set-build-string}
Sets a custom string in the [firmware information](#firmware-info) version info. This can be used to store machine specific information and is added after the colon in the version string.

**Syntax:** `$I=<string>`  

**Example**
* _Set build string to "My machine":_
	```gcode
	I=My machine
	```

> [!NOTE]
>  Vendors supplying pre-compiled firmware can set and also disable modification of this string by changing
> the symbols `BUILD_INFO` and/or `DISABLE_BUILD_INFO_WRITE_COMMAND` in _grbl/config.h_ or on the compiler command line.

**Example:**
-    `#define BUILD_INFO "MyMachine_v1.0".`
-    `#define DISABLE_BUILD_INFO_WRITE_COMMAND 1`.

---

### `$N` – Output Startup Lines {#startup-blocks}
Outputs the currently stored startup G-code blocks. These lines run automatically every time grblHAL powers up or resets.

**Syntax:**
`$N`

---

### `$N=` – Set Startup Line {#set-startup-block}
Saves a G-code block to one of the startup lines (typically `$N0` and `$N1`).

**Syntax:**  
`$N0=<string>` (Set first startup line)  
`$N1=<string>` (Set second startup line)

Use the `|` (vertical bar) character to separate commands than cannot be put on a single line.

> [!WARNING]]
> - Do not place motion commands (`G0`, `G1`, `G2`, `G3`) or tool changes (`M6`) in startup lines. This can be dangerous if the machine moves unexpectedly upon connection.
> - On setting a startup line the code will be run to validate it before it is stored.

**Example:**
* _Set startup mode to absolute, metric and XY plane:_
	```gcode
	$N0=G90G21G17
	```

---

### `$RST` – Restore Settings {#restore-settings}
Restores groups of settings to their firmware defaults.

**Syntax:** `$RST=<flag>`

| Flag | Effect |
| :--- | :--- |
| **`$`** | Restores all core `$$` numbered settings to defaults. |
| **`&`** | Restores all driver and plugin defined `$$` numbered settings to defaults. |
| **`#`** | Restores all G-code parameters (`G54`-`G59`, `G28`, `G30`) to zero. |
| **`*`** | Restores _all_ settings and parameters to defaults. |

**Example**
* _Reset all settings to default:_
	```gcode
	$RST=*
	```

---

## Machine Control

### `$J` – Jogging <!-- toc --> {#jog} 
Commands the machine to move freely. Jog commands are independent of the G-code parser state and can be canceled immediately by a [`Jog Cancel`](#rtcmd-jog-cancel) command.

**Syntax:** `$J=axes F- ...`

**Requirements:**
-   Must include at least one axis coordinate.
-   Must include a Feed Rate (`F`).
-   Can include `G20`/`G21` (units), `G53` (move in the machine coordinate system) and `G90`/`G91` (distance mode).

**Examples:**
-   `$J=G91 G21 X10 F500` (Move X +10mm relative at 500mm/min)
-   `$J=G90 Z5 F100` (Move Z to absolute 5 units at 100units/min - uses the current units mode - metric/imperial)

> [!TIP]
> - Jogging is "safer" than `G0`/`G1` because it checks soft limits (if enabled) *before* moving and can be smoothly aborted by the user.
> - If the machine is homed set [$40=1](/docs/reference/settings#40) to automatically limit jog motion to be within machine limits.

---

### `$H` and `$H-` – Homing Cycle <!-- toc --> {#homing} 
Initiates the homing sequence to set the machine origin.

**Syntax:**  
`$H` - homes all [configured axes](./settings#44--49) in the specified sequence.

**Extended Syntax (Single Axis):**
- `$HX` (Home X only)
- `$HY` (Home Y only)
- `$HZ` (Home Z only)
- `$HA` ... `$HW` (Home rotary/secondary axes)

> [!NOTE]
> The extended syntax is not available by default, enable it with a [`$22`](./settings#22) setting option.
 
> [!WARNING]
>  Requires limit switches to be installed and configured unless [configured](./settings#22) to allow manually homed axes.

---

### `$SLP` – Sleep Mode <!-- toc --> {#sleep} 
Puts the machine into a low-power sleep state.

**Syntax:** `$SLP`

**Behavior:**
- Disables spindle and coolant.
- Disables stepper motors (they lose holding torque!).
- Requires a [Reset](#rtcmd-reset) (`ctrl-x`) to wake up.

---

### `$C` – Check Mode <!-- toc --> {#check-mode} 
Toggles "Check Mode". In this mode, grblHAL parses and validates G-code but **does not move** the machine or turn on the spindle.

**Syntax:** `$C`

**Usage:**
-   Send `$C` to enable.
-   Stream your G-code file. grblHAL will report verifying lines or errors (`error:xx`).
-   Send [Reset](#rtcmd-reset) (`ctrl-x`) to exit Check Mode.

---

### `$X` – Unlock / Kill Alarm <!-- toc --> {#unlock} 
Disables the alarm lock state.

**Syntax:**  
`$X`

**Usage:**
-   If the machine is in an [`Alarm`](#rtstate-alarm) state (e.g., hard limit hit, or unhomed with `$22=1`), it often locks motion.
-   `$X` overrides this lock, allowing you to jog away from a switch or move the machine.
-   **Caution:** This does not fix the underlying issue (e.g., machine position may be lost).

---

## Diagnostics & Reporting

### `$SD` – Output Spindle Encoder Data {#spindle-data}
When a spindle encoder is installed data from the encoder can be output with this command.  

**Syntax:** `$SD`

Output format: `[SPINDLEENCODER:<index count>,<pulse count>, <error count>,<angular position>]`

| Element | Description |
| :--- | :--- |
| **`<index count>`** | Number of full revolutions since the last reset. |
| **`<pulse count>`** | Number of encoder pulses since the last reset. |
| **`<error count>`** | Number of full revolutions where the pulse count differed from the configured [pulses per revolutions](./settings#38) (PPR). |
| **`<angular position>`** | The number of revolutions since last reset in decimal representation. |

> [!TIP]
> The current RPM calculated from the encoder data is added to the real time report when an encoder is installed. Some senders, like [ioSender](https://github.com/terjeio/ioSender#readme), may display the live spindle RPM in its UI.

**Example:**
* _Send `$SD` to get the current spindle encoder data, PPR setting is 200:_
	```text
	$SD
	[SPINDLEENCODER:1,300,0,1.5]
	```

### `$SR` – Reset Spindle Encoder Data {#spindle-data-reset}
Resets spindle encoder data.

**Syntax:** `$SR`

---

### `$G` – Output G-code Parser State <!-- toc --> {#parser-state} 
Outputs the currently active G-code modal states.

**Syntax:** `$G`

**Output Example:** `[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0]`
-   Shows: Motion mode, WCS, Plane, Units, Distance, Feed mode, Spindle/Coolant state, Tool, Feed rate, RPM.

**grblHAL Extensions:**
-   Includes extended G-codes when available: `G5`, `G7`, `G8`, `G43`/`G49` (TLO), `G96`/`G97` (Spindle Mode), `G98`/`G99` (Retract), `M50`/`M51`/`M53` (Overrides), `M56` (Parking), `M60` (Pallet) etc.

---

### `$#` – Output Parameters <!-- toc --> {#hash}
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

**Syntax:** `$#=`  
Output value of [numbered](./parameters#numbered) or [named](./parameters#named) parameter.

**Examples**
* _Output current coordinate system, 1 = G54, 2 = G55, ... :_
	```gcode
	$#=5220
	```
	outputs 
	```text
	[PARAM:5220=1]
	```
* _Output homed status, 0 = not homed, 1 = homed:_
	```gcode
	$#=_homed_state
	```
	outputs 
	```text
	[PARAM:_homed_state=0]
	```

---

### `$PINS` – Report Pin Mappings {#pins}
Command to show the current hardware mapping of input/output pins. One of the uses is to identify auxiliary pins and their state\/availability.

**Syntax:** `$PINS`

Auxiliary ports are identified by the text `Aux in <n>` or `Aux out <n>` for digital pins and `Aux analog in <n>` or `Aux analog out <n>` for analog pins. `<n>` is the base port number and this is the number to use for settings that binds a port to the desired function.  
Auxiliary ports that are not claimed by plugins for private use will be added to the pool of ports that can be controlled by
[M62-M65](./gcode#M62--M65) and [M67-M68]((./gcode#M67-M68)) and read by [M66]((./gcode#M66)), these can be identified by having a `P<n>` or `E<n>` designation. Again `<n>` is a port number and it is the one to use with the aforementioned M-commands, note that this port number may differ from the base port number used for settings.

> [!IMPORTANT]
> * When a port is claimed by a plugin the port numbers assigned for use by M-commands will be changed to make them consequtive.
> * After configuring ports for use by plugins a reboot is required to reset the port bindings. Either power cycle the controller or use the [$REBOOT](#reboot) command.

> [!TIP]
> * To unclaim a port for a plugin the usual way to do that is to set the port number to `-1`.
> * If the sender supports grouping of settings the _Aux ports_ group is where all plugin port settings should live.

**Example:**
* _The controller has three auxiliary digital inputs and two outputs, port 0 is claimed by the Plasma plugin for 'Arc ok' by setting $367=0:_
	```gcode
	$pins
	...
	[PIN:PC12,Y limit min]
	[PIN:PC10,Z limit min]
	[PIN:PB14,Aux in 0,Arc ok]
	[PIN:PA15,Aux in 1,P0]
	[PIN:PC11,Aux in 2,P1]
	...
	[PIN:PB10,Flood]
	[PIN:PB15,Aux out 0,P0]
	[PIN:PB2,Aux out 1,P1]
	[PIN:PA6,MISO]
	...
	```

---

### `$PINSTATE` – Report Pin States {#pinstate}
Enumerates auxiliary pins with type, description, mode (input/output, inverted, pull-up/down), and capabilities.

**Syntax:**  
`$PINSTATE`

Output format:  
`[PINSTATE:<type>|<description>|<id>|<mode>|<capabilities>|<state>{|<resolution}]`  

* `<type>` - string designating the type: `AIN` - analog in, `AOUT` - analog out, `DIN` - digital in, `DOUT` - digital out.
* `<description>` - string, may be set by plugin code. If the pin is available for use via M62-M68 or by plugins it will be labeled `P<n>` or `E<n>`, `<n>` is the port number.
* `<id>` - numeric id, used internally.
* `<mode>` - current mode as a string consisting of the following characters:  
For digital pins, in the first position:  
&emsp;`I` - inverted.  
&emsp;`N` - normal or non inverted.  
In the second position, digital input pins only:  
&emsp;`-` - floating.  
&emsp;`D` - pulldown enabled.  
&emsp;`U` - pullup enabled.  
&emsp;&emsp;This is the state at the MCU pin, not neccesarily at the physical pin connection on the board which may be buffered.  
In the third position, digital input pins only:  
&emsp;`-` - interrupt disabled.  
&emsp;`C` - change interrupt enabled.  
&emsp;`F` - falling edge interrupt enabled.  
&emsp;`H` - high state interrupt interrupt enabled.  
&emsp;`L` - low state interrupt enabled.  
&emsp;`R` - rising edge enabled.  
&emsp;&emsp;For analog input pins this element is left empty.  
For analog output pins a single character:  
&emsp;`N` - normal \(DAC\) mode enabled.  
&emsp;`P` - PWM mode enabled.  
&emsp;`S` - PWM servo mode enabled.

* `<capabilities>` - capabilities as a string consisting of the following characters:  
For digital pins, in the first position:  
&emsp;`-` - inversion not available.  
&emsp;`I` - inversion available.  .  
In the second position, digital input pins only:  
&emsp;`-` - pull up/down not available.  
&emsp;`B` - both pull up/down available.   
&emsp;`D` - pulldown available.  
&emsp;`U` - pullup available.    
In the third position, digital input pins only:  
&emsp;`-` - not interrupt capable.  
&emsp;`A` - all interrupt modes are available.  
&emsp;`C` - change interrupts \(rising/falling\) available. The MCU does not provide information about the initial state change.   
&emsp;`E` - change, rising and falling edge interrupts available.  
&emsp;`F` - falling edge interrupt available.  
&emsp;`H` - high state interrupt interrupt available.  
&emsp;`L` - low state interrupt available.  
&emsp;`R` - rising edge available.  
For analog input pins this element is left empty.  
For analog output pins a single character:  
&emsp;`N` - normal \(DAC\) mode available.  
&emsp;`P` - PWM mode available.  
&emsp;`S` - PWM servo mode available. This typically requires a plugin that reconfigures PWM capable pins.

* `<state>` - current state. For digital pins `0` or `1` for low and high respectively, for analog pins the input or output value.  
If the driver does not support reading the state `?` is reported.

* `<resolution>` - optional, for analog pins ADC or DAC resolution in bits.

**Example:**
```text
$pinstate
...
[PINSTATE:DIN|Cycle start|4|NUR-|IBED|1]
[PINSTATE:DIN|P0|0|NU--|IB--|1]
[PINSTATE:DIN|P1|1|NU--|IB--|1]
[PINSTATE:DIN|P2|2|NU--|IBED|1]
[PINSTATE:DIN|Toolsetter|3|NU--|IBED|1]
[PINSTATE:DIN|Emergency stop|12|NUR-|IBED|0]
...
[PINSTATE:DOUT|P0|15|N|I|0]
[PINSTATE:DOUT|P1|2|N|I|0]
[PINSTATE:DOUT|Spindle PWM|8|N|I|0]
[PINSTATE:DOUT|Spindle direction|5|N|I|0]
...
```

### `$PORTS` – List Serial (UART) Ports {#uart-ports}
Enumerates serial ports with port number, description, pin binding, current mode and claimed status.

**Syntax:**  
`$PORTS`

Output format:  
`[PORT:<port>|<description>|<pin,RX>|pin,TX>|<mode>|<status>]`  

* `<port>` - port number (or UART stream number).
* `<description>` - string, may be set by plugin code when claiming a port.
* `<pin,RX>` - MCU input pin name followed by the literal `,RX`.
* `<pin,RX>` - MCU output pin name followed by the literal `,TX`.
* `<mode>` - current mode as a comma separated list with the following entries:  
baud rate.  
number of data bits.  
parity: `N` for none, `E` for even, `O` for odd.  
number of stop bits.   
* `<status>` - `F` for free or unused, `C` for claimed or used    

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

## File handling

grblHAL utilizes a _Virtual File System (VFS)_ layer that allows it to interact with different storage media through a unified set of commands and programming interfaces.
It is a [hierarchical file system ](https://en.wikipedia.org/wiki/Hierarchical_file_system) where different media is mounted as directories,
either as the root directoy (/) or as a subdirectory under it.

### SD Card (FatFs)
The SD card is the primary high-capacity storage for G-code files, typically formatted as _FAT32_.
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

| Command           | Action | Description |
|:-----------------:|:-------|:------------|
| **`$F`**          | List Files | Lists CNC-compatible files (`.nc`, `.gcode`, etc.) in the current working directory. |
| **`$F+`**         | List All Files | Lists all files in the current working directory regardless of extension. |
| **`$F=[file]`**   | Run File | Starts execution of the specified G-code file. |
| **`$F<=[file]`**  | Copy file to output | Copies/streams the specified file to the current output. |
| **`$FR`**         | Rewind file | Enables rewind mode for next file to run. When finished it can be rerun by issuing a Cycle Start command |
| **`$FD=[file]`**  | Delete File | Permanently removes a file from the storage. |
| **`$CWD=[path]`** | Change Directory | Sets the Current Working Directory. Usage: `$CWD=/` (root), `$CWD=..` (up), `$CWD=subdir` (down). If called without arguments, it reports the current path. |
| **`$PWD`**        | Print Working Directory | Reports the current working directory in the format `[CWD:/path/to/dir]`. |
| **`$FMD=[path]`** | Create directory ||
| **`$FRD=[path]`** | Remove directory ||
| **`$FI`**         | Mount info | Outputs information about mounted filing systems. |

#### Navigation & Usage
grblHAL keeps track of a current working directory (_CWD_). By default, this is the root directory `/`. When you use `$F` to list files or `$F=` to run one, grblHAL looks inside the CWD. You can navigate into subfolders using `$CWD=foldername`, back up on level using `$CWD=..` or back to the root using `$CWD=/`.

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


### `$REBOOT` – Reboot Controller {#reboot}
Hard resets the controller. Sender connection will be likely lost unless it is UART based.

> [!NOTE]
> This command is not implemented for all driver types. If not power cycle the controller instead.

---

## For developers and integrators

### Real time commands <!--toc--> {#realtime-commands}

Realtime commands are single control characters that can be sent to grblHAL at any time. They are intercepted from the input stream and executed immediately, typically within milliseconds, bypassing the input buffer.

> [!NOTE]
> - **No Newline Needed:** These are _single byte/character_ command bytes. Do _not_ send a `CR` or `LF` after them.
> - **Immediate Execution:** They work even if the input buffer is full.
> - **State Dependent:** Some commands (like `!` Feed Hold) are only valid in certain states (e.g., Run, Jog).
> - **Ignored if Invalid:** If a command cannot be executed (e.g., toggling spindle stop while moving), it is silently ignored to prevent unsafe conditions.

#### Basic Control Commands <!--toc-->

The  _Grbl_ column flags command characters compatible with legacy Grbl. The _Alt._ column contains a grblHAL alternative which are outside the 'printable' ASCII characters range, some senders may not support/use these. Finally, the _Input_ column flags commands that may have a corresponding physical input that allows the action to be triggered by a button or a switch.

| Key | Hex | Alt. | Grbl | Input | Action | Description  |
|:----|:---:|:----:|:----:|:-----:|:-------|:-------------|
|<a id="rtcmd-status"/>**`?`** | **`0x3F`** | **`0x80`** |*|-| Status&nbsp;Report | Immediately generates and outputs a [runtime status report](#realtime-report). It can be requested at any time unlike for legacy Grbl which blocks it during critical alarms. The content of the report is configured by the [`$10`](./settings#10) setting. Plugins may add fields to the report. |
|<a id="rtcmd-cycle-start"/>**`~`** | **`0x7E`** | **`0x81`** |*|*| Cycle Start (Resume) | Resumes from a [`Hold`](#rtstate-hold), [`Door`](#rtstate-door) or [`Tool`](#rtstate-door) state. |
| **`!`** | **`0x21`** | **`0x82`** |*|*| Feed Hold | Enters the [`Hold`](#rtstate-hold) state, if in motion decelerates the machine to a controlled stop. The command is ignored in [`Alarm`](#rtstate-alarm) state. |
|<a id="rtcmd-reset"/>**`^x`** |**`0x18`**||*|*| Soft Reset | (Ctrl-X) - Stops motion abruptly, turns off spindle/coolant, and flushes the motion buffer. Sets the state to [`Alarm`](#rtstate-alarm) if in motion or [`Idle`](#rtstate-idle) if not. If reset during motion, position is considered lost and the machine must be re-homed. If reset while [`Idle`](#rtstate-idle), homed status is retained depending on a [`$676`](./settings#676) option. Some [`Alarm`](#rtstate-alarm) substates require this command to be sent before the controller can be [unlocked](#unlock). |
|**`^y`**|**`0x19`**||-|-| Stop | (Ctrl-Y) - Executes a fast hold, flushes the motion buffer and sets the state to [`Idle`](#rtstate-idle) if in motion or in [`Hold`](#rtstate-hold) state. Spindle and coolant is turned off. |
||**`0x84`** ||*|*| Safety Door Ajar | Simulates opening the safety door. Halts motion and turns off spindle and coolant, retracts to the parking position, if [enabled](./settings#41), before changing the state to [`Door:0`](#rtstate-door). Resume by sending a [`Cycle Start`](#rtcmd-cycle-start) command. |
|<a id="rtcmd-jog-cancel"/>|**`0x85`**||*|-| Jog Cancel | Halts motion, flushes input and motion buffers for any pending commands. Ignored if the state is not [`Jog`](#rtstate-jog). |
||<a id="rtcmd-full-status"/>**`0x87`** ||-|-| Report All | Acts like [`?`](#rtcmd-status) but returs [_all_ available fields](#realtime-report-fields) including some not available for the `?` request. Useful for senders to fully synchronize state on connect. |
||**`0x88`**||-|*| Optional Stop Toggle | Toggles optional stop mode, when enabled [`M1`](./gcode#M0-M1-M2-M30-M60) optional pause commands in the gcode will be ignored. |
||**`0x89`**||-|*| Single Block Toggle | Toggles single block mode, when enabled [`Hold`](#rtstate-hold) state will be entered after each gcode block (line) waiting for a [`Cycle Start`](#rtcmd-cycle-start) command to continue. |
||**`0x8A`**||-|-| Toggle FAN0 State | Toggles fan 0 on/off, only available when firmware has fan support enabled and configured. |
||**`0x8B`**||-|*| Toggle MPG Mode | Switches MPG/pendant in/out of full control, sent by the MPG/pendant and only available when firmware has MPG support enabled. |
||**`0x9F`**||-|-| Soft E-stop | Executes a fast hold if in motion, turns off spindle/coolant, flushes the motion buffer and sets the [`Alarm`](#rtstate-alarm) state with substate `10` - _E-Stop_. This is **not** a safe alternative to a proper hardware based E-stop system. |
||**`0xA3`**||-|-| Tool ACK | Acknowledge [`Tool`](#rtstate-tool) state, sent by the sender when it is able to handle the [tool change protocol](../developers/senders#tool-change-protocol). |

---

#### Overrides <!--toc-->

Overrides allow you to fine-tune the machine's operation in real-time.

#### Feed Rate Overrides <!--toc-->
Alters the programmed feed rate (`F`) for `G1`, `G2`, `G3` moves.
-   **Range:** 10% to 200%.
-   **Limits:** Commands that would push the value outside this range are ignored.
-   **Scope:** Does **not** affect Rapid (`G0`) or Jog motions.
-   **Latency:** Changes take effect immediately.

| Hex | Command | Description |
| :---: | :--- | :--- |
| `0x90` | **Set 100%** | Restores feed rate to the programmed value. |
| `0x91` | **+10%** | Increases feed override by 10%. |
| `0x92` | **-10%** | Decreases feed override by 10%. |
| `0x93` | **+1%** | Increases feed override by 1%. |
| `0x94` | **-1%** | Decreases feed override by 1%. |

#### Rapid Rate Overrides <!--toc-->
Scales the speed of `G0`, `G28`, and `G30` rapid motions.
- **Scope:** Affects rapid motions only. Does not affect cutting moves (`G1`, etc.).
- **State:** Can be changed at any time.

| Hex | Command | Description |
| :---: | :--- | :--- |
| `0x95` | **100%** | Sets rapids to full speed (Max Rate). |
| `0x96` | **50%** | Sets rapids to 50% of max rate. |
| `0x97` | **25%** | Sets rapids to 25% of max rate. |
| `0x98` | **5%** | Sets rapids to 5% of max rate. Available since build 20260831. |

#### Spindle Speed Overrides <!--toc-->
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

#### Spindle Stop Override {#spindle-stop-override}
| Hex | Command | Description |
| :---: | :--- | :--- |
| `0x9E` | **Toggle&nbsp;Spindle&nbsp;Stop** | - **Only valid in HOLD state.** - Toggles the spindle On/Off while paused. - **Safety:** Ignored during motion to prevent crashing. - **Resume:** When Cycle Start (`~`) is issued, the spindle automatically restores its previous state. The system waits 4.0 seconds (configurable) for the spindle to spin up before resuming motion. |

#### Coolant Overrides {#coolant-overrides}
Toggles coolant states directly.
-   **State:** Valid in standard states (Idle, Run, Hold).
-   **Parser Update:** These commands **update the modal state** of the G-code parser. A `$G` report will reflect the change.

| Hex | Command | Description |
| :---: | :--- | :--- |
| `0xA0` | **Toggle Flood** | Toggles M8 Flood Coolant on/off. |
| `0xA1` | **Toggle Mist** | Toggles M7 Mist Coolant on/off. |

---

### Realtime Report  <!--toc--> {#realtime-report}

When you send `?`, a status report is streamed back. The format is a structured text string enclosed in chevrons (angle brackets), with fields separated by pipe `|` characters.

```text
<state{:substate}|{|Bf:-}{|Ln:-}{|FS:-}{|Pn:-}{|WCO:-}{|WCS:-}{|Ov:-}{|A:-}{|MPG:-}{|H:-}{|D:-}{|Sc:-}{|TLR:-}{|DTG:-}{|FW:-}{|In:-}{|THC:-}>
```

<!-- ADD: |Fan:, |Enc: |TCT: (laser) | |TMCMON: (motors) |Sl: (VFD spindle load) -->

> [!NOTE]
> In the definitions below:
> - `{ }` indicates optional items.
> - `` indicates variables or constants.
> - `|` separates literal values.

#### Report Fields {#realtime-report-fields}

| Field | Description | Optional | When | Format/Details |
|:-----:| :---------- | :------- | :--- |:----|
| [state](#controller-states) | Current controller state. || Always | `<Idle\|Run\|Hold\|Jog\|Alarm\|Door\|Check\|Home\|Sleep\|Tool>{:<substatus>}` The optional substate can be enabled by a [$10](./settings#10) option. |
|<a id="rtfield-mpos"/>**`MPos:`** | Current absolute (machine) position. |yes |Always<sup>1</sup>| `MPos:<axis positions>`, [`<axis positions>`](#axis-positions) are in the base machine coordinate system. |
|<a id="rtfield-wpos"/>**`WPos:`** | Current relative (work) position. | yes |Always<sup>1</sup>| `WPos:<axis positions>`, [`<axis positions>`](#axis-positions) are in the base machine coordinate system plus any offsets. |
|<a id="rtfield-bf"/>**`Bf:`** | Buffer status. | yes | Always | `Bf:<planner buffers available>,<RX buffer space available>`<br>`<planner buffers available>`: # of planner buffers available, during motion it is ideal that this approches 0.<br> `<RX buffer space available>`: # of available character slots in the input buffer. |
|<a id="rtfield-ln"/>**`Ln:`** | Line Number. | yes | Always | `Ln:<n>`, `<n>`: block/line number, only output if the [N-word](./gcode#single-meaning-words) is present in the G-code. |
|<a id="rtfield-fs"/>**`FS:`** | Feed and Speed. | yes |Always| `FS:<feed rate>,<spindle RPM>{,<actual spindle RPM>}`<br>`<feed rate>` - current feed rate.<br>`<spindle RPM>` - current spindle speed.<br>`<actual spindle RPM>` - as reported from a spindle encoder or from a VFD. |
|<a id="rtfield-pn"/> **`Pn:`** | Input Signals. | yes |Always| `Pn:<signals>`, a combination of [`<signals>`](#signal-letters) letters. |
|<a id="rtfield-wco"/> **`WCO:`** | Work Coordinate Offset. | yes |Periodic| `WCO:<axis positions>`, a list of [`<axis positions>`](#axis-positions) with the sum of all active offsets. |
| **`WCS:`** | Active Work System. | yes |Change| `WCS:<csys>`, `<csys>`: the currently selected [coordinate system](./gcode#G5x_WCS). |
|<a id="rtfield-ov"/>**`Ov:`** | Overrides. | yes | Periodic | `Ov:<feed rate>,<rapid rate>,<spindle RPM>` |
| **`A:`** | Accessory State. ||Change| `A:<accessories>`, a combination of [`<accessories>`](#accessory-letters) letters. If there is a transition from any on to all off a empty field (`A:`) is output. |
| **`MPG:`** | Pendant Status. ||Change| `MPG:<status>`, `<status>`: `0` - pendant listening, `1` - pendant in control. |
| **`H:`** | Homing Status. ||Change| `H:<status>{,<axismask>}`, `<status>`: `0`= not homed, `1`= homed according to the [configured axes](./settings#44--49). [`<axismask>`](./settings/#axismask) is added if single axis homing commands is [enabled](./settings#22). |
| **`P:`** | Active Probe. ||Change| `P:<probe>{,P}`, `<probe>`: `0`=Primary, `1`=Toolsetter, `2`=Secondary. The letter `P` is added when probe protection is enabled and active. |
| **`D:`** | Lathe Diameter Mode. ||Change| `D:<mode>`, `<mode>`: `0` - Radius ([G8](./gcode#G7-G8)), `1` - ([G7](./gcode#G7-G8)). |
| **`Sc:`** | Scaling Status. ||Change| `Sc:<axisletters>`, a combination of [`<axisletters>`](./gcode#axisletters) for the axes where scaling is active. If none is scaled `Sc:` is output. |
| **`TLR:`** | Tool Length Reference. ||Change| `TLR:<axismask>`, an [`<axismask>`](./settings/#axismask) if set, if not then `0` for the mask. |
| **`TLR@:`** | Tool Length Reference position. ||Change| `TLR@:<a>,<b>:<tool axis>:<atG53>`<br>`<a>` and `<b>`: position in the [plane](./gcode#G17-G18-G19) where the offset was measured, typically XY.<br>`<tool axis>`: axis id of the linear (spindle) axis, typically `2` (Z).<br>`<atG53>`: `0` - not measured at G59.3 (toolsetter) coordinate, `1` - measured at [G59.3](./gcode#G5x_WCS) coordinate. |
|<a id="rtfield-thc"/>**`THC:`** | Plasma Plugin Status. | | Always | `THC:<voltage>,<status>`, `<voltage>`: arc voltage, [`<status>`](#plasma-status-letters): a combination of plasma status letters. |
|<a id="rtfield-dtg"/>**`DTG:`** | Distance To Go. ||Always| `DTG:<axis positions>`, a list of [`<axis positions>`](#axis-positions) with the remaing distance to move for the current executing block. |
| **`FW:`** | Firmware Identity. ||Requested<sup>2</sup>| `FW:grblHAL` This is the only data one can use to detect which controller firmware when in `Hold` state. |
|<a id="rtfield-in"/>**`In:`** | [M66](./gcode#M66) Wait for Input Result. ||Requested| `In:<state>`, `<state>`: `-1` not requested or timeout/error, `0` or `1` for digtal inputs, read value for analog inputs. |
| **`SD:`** | SD Card Plugin Status. ||Change| `SD:<mount status>`, `SD:<pct completed>,<filename>` or `SD:Pending`<br>`<mount status>`: `0` - unmounted, `1` - mounted, `2` - auto-detected unmount, `3` auto-detected mount<br>`<pct completed>`: streaming, percent complete. `filename`: name of streaming file.<br>`SD:Pending`: streaming is suspended. |
| **`$C:`** | Blocking event active. ||Requested<sup>2</sup>| `$C:1` |

<sup>1</sup> **`Mpos`** and **`WPos`** are mutually exclusive, which one is reported depends on a [$10](./settings#10) option.  
<sup>2</sup> Only output for full [`0x87`](#rtcmd-full-status) status requests.

> [!NOTE]
> - Positional values reported are either in metric or imperial, controlled by the [$13](./settings#13) setting, independent of the current [G20/G21](./gcode#G20-G21) mode.
> - When a full status (`0x87`) is requested the `SD:` mount status is always reported, _not_ the streaming state.
> - Plugins may add additional fields to the report.

> [!TIP]
> Since many grblHAL controllers are not reset on connect, unlike most legacy Grbl controllers, a regular status report request may not reveal
> the current status since some are sent on changes only. To work around that a grblHAL specific status request, [`0x87`](#rtcmd-full-status), can be sent
> on connect that will output all available fields.

#### Controller States {#controller-states}

| State | Substates | Description |
|:-----:|:---------:|:------------|
|<a id="rtstate-idle"/>**`Idle`** | - | Idle state typically means the controller is ready to accept commands, it may also occur during [G4](./gcode#G4) delays. |
|<a id="rtstate-run"/>**`Run`** | 1,2 | Machine is executing motion. Optional substates, enabled by a [$10](./settings#10) option: `1`=Feed hold pending, `2`=Probing |
|<a id="rtstate-hold"/>**`Hold`** | 0,1,2  | Motion is halted. Substates: `0`=Holding, `1`=Decelerate complete `2`=Decelerating |
|<a id="rtstate-jog"/>**`Jog`** | - | Machine is executing jog motion. |
|<a id="rtstate-alarm"/>**`Alarm`** | Alarm code | G-code execution is blocked, only some $-commands are allowed. Optional substate, enabled by a [$10](./settings#10) option is the alarm code. |
|<a id="rtstate-door"/> **`Door`** | 0,1,2,3,4 | Safety door ajar. Substates: `0`=Closed, `1`=Ajar, `2`=Retracting, `3`=Cancelling, `4`=Resuming |
| **`Check`** | - | Controller passes G-code blocks through the parser for validation, no action taken other than reporting any errors. |
| **`Home`** | - | Homing sequence is executing. Real time report requests are not responded to unless enabled by a [$10](./settings#10) option. |
| **`Sleep`** | - | In sleep mode . Send a reset command to wake it up. |
|<a id="rtstate-tool"/> **`Tool`** | - | grblHAL extension, a [tool change](../developers/senders#tool-change-protocol) operation is ongoing. |

> [!NOTE]
> - The optional **`Run`** substates can be used by senders for advanced funtionality. `1` means that a feed hold request was received during  
> spindle synchronized motion and will not be executed before it completes, `2` means that a probing motion is ongoing, if probe triggered  
> is reported when not probing the sender may stop motion to protect the probe.
> - When in **`Hold`** state no commands except some [realtime](#realtime-commands) commands are accepted.
> - When in **`Alarm`** state alarm codes `1`, `2`, `10`, `17` and `20` are designated as critical, legacy Grbl does not respond to realtime    
> report requests when these are active even if the documentation states it will, grblHAL does and will also accept some $-commands.
> - Legacy Grbl never reports the **`Home`** state, grblHAL outputs a realtime report with the state when the homing sequence starts.  
> Unlike legcay Grbl GrblHAL _can_ be configured to allow realtime reporting during homing even if this is considered to be a bad idea.

#### Axis positions {#axis-positions}
Axis positions are a comma separated list of positions whe the first is for the X-axis, the second for the Y-axis and so on.  
If the controller is configured for more than three axes then the axis letter for a given position in the list is the one corresponding to the letter in the [`$I`](#firmware-axes) element `[AXS::]`.

#### Input Signal Letters {#signal-letters}
A string containing any combination of the following letters:
| Letter(s) | Description |
|:-------:|:------------|
| **`P`** | Probe triggered. |
| **`O`** | Probe disconnected. |
| **`XYZABCUVW`** | Corresponding axis limit switch asserted. |
| **`D`** | Door switch asserted. |
| **`R`** | Reset switch asserted. |
| **`H`** | Feed hold switch asserted. |
| **`S`** | Cycle start switch asserted. |
| **`E`** | E-Stop switch asserted. |
| **`L`** | Block delete switch asserted. |
| **`T`** | Optional program stop switch asserted. |
| **`M`** | Motor warning, was `W` in builds <= 20220922. |
| **`F`** | Motor fault, was `M` in builds <= 20220922. |
| **`Q`** | Single step blocks asserted, from builds >= 20240110. |

> [!TIP]
> grblHAL will report the Cycle Start signal `S` at least once even if the cycle start input was asserted between status report requests, legacy Grbl will only report it if asserted when the report is prepared.

#### Accessory Status Letters {#accessory-letters}
A string containing any combination of the following letters:
| Letter  | Description |
|:-------:|:------------|
| **`S`** | Spindle is running in a clockwise direction \(M3\). |
| **`C`** | Spindle is running in a counterclockwise direction \(M4\). |
| **`O`** | Spindle encoder error. |    
| **`M`** | Mist coolant is on \(M7\). |
| **`F`** | Flood coolant is on \(M8\).  |
| **`T`** | Tool change is pending \(M6\). |


#### Plasma Status Letters {#plasma-status-letters}
A string containing any combination of the following letters:
| Letter  | Description            |
|:-------:|:-----------------------|
| **`A`** | Arc ok                 |
| **`T`** | Torch on               |
| **`E`** | THC enabled            |
| **`O`** | Ohmic probe triggered  |
| **`F`** | Float switch triggered |
| **`B`** | Breakaway detected     |
| **`R`** | THC active             |
| **`V`** | Velocity lock          |
| **`H`** | Void lock              |
| **`U`** | Toch up                |
| **`D`** | Torch down             |

---

## Enumerations <!--toc-->

Code sets and translations can be fetched from the controller, superseding the use of files that has to be kept in sync.
Since grblHAL supports plugins and driver specific extensions it will be hard to keep senders up to date via files that has to be updated.

| Command | Description |
|---------|-------------|
| [**`$EA`**](#enumerate-alarms) | Outputs all supported alarm codes and descriptions in grblHAL format. |
| [**`$EAG`**](#enumerate-grbl-alarms) | Outputs all supported alarm codes and descriptions in legacy Grbl format. |
| [**`$EE`**](#enumerate-errors) | Outputs all supported error codes and descriptions in grblHAL format. |
| [**`$EEG`**](#enumerate-grbl-errors) | Outputs all supported error codes and descriptions in legacy Grbl format. |
| [**`$ES`**](#enumerate-settings) | Outputs all supported settings with name, type, format, unit, ranges, and description in grblHAL format. |
| [**`$ESG`**](#enumerate-grbl-settings) | Outputs all supported settings with name, unit, and description in legacy Grbl format. |
| [**`$ESH`**](#enumerate-tab-settings) | Outputs all supported settings in grblHAL tab separated format. |
| [**`$EG`**](#enumerate-groups) | Outputs the setting groups. |
| [**`$E*`**](#enumerate-all) | Outputs all supported alarm, error codes and settings in grblHAL format. |

### `$E*` – Enumerate all {#enumerate-all}
Outputs [alarm](#enumerate-alarms), [error](#enumerate-errors), [setting groups](#enumerate-groups) and [setting](#enumerate-settings) codes in one combined `ok` terminated transaction.

**Syntax:**  
`$E*`

---

### `$EA` – Enumerate and output alarms {#enumerate-alarms}
Outputs alarm codes with a short message and a longer description.

**Syntax:**  
`$EA`

**Format:**  
`[ALARMCODE:<code>|<v1.0->|<description>]`

| Element | Description |
|:-------:|:------------|
| **`<code>`** | The numeric alarm code. |
| **`<v1.0->`** | Always empty, for compatability with legacy Grbl. |
| **`<description>`** | A longer form description of the alarm, it may include action to take to clear it. |

**Example:**
* _Output alarm codes:_
	```text
	[ALARMCODE:1||Hard limit has been triggered. Machine position is likely lost due to sudden halt. Re-homing is highly recommended.]
	[ALARMCODE:2||Soft limit alarm. G-code motion target exceeds machine travel. Machine position retained. Alarm may be safely unlocked.]
	...
	ok
	```

---

### `$EAG` – Enumerate and output alarms in legacy Grbl file format {#enumerate-grbl-alarms}
Outputs alarm codes in legacy [Grbl comma separated file](https://github.com/gnea/grbl/blob/master/doc/csv/alarm_codes_en_US.csv) format.

**Syntax:**  
`$EAG`

**Format:**  
`"<code>","<v1.0->","<description>"`

| Element | Description |
|:-------:|:------------|
| **`<code>`** | The numeric alarm code. |
| **`<v1.0->`** | Always "N/A" for Not Available, Grbl 1.0 and earlier format is not supported. |
| **`<description>`** | A description of the alarm code, it may include action to take to clear it. |

**Example:**
* _Output alarm codes:_
	```text
	"Alarm Code in v1.1+"," Alarm Message in v1.0-"," Alarm Description"
	"1","N/A","Hard limit has been triggered. Machine position is likely lost due to sudden halt. Re-homing is highly recommended."
	"2","N/A","Soft limit alarm. G-code motion target exceeds machine travel. Machine position retained. Alarm may be safely unlocked."
	...
	ok
	```

---

### `$EE` – Enumerate and output error codes {#enumerate-errors}
Outputs error (status) codes with a description.

**Syntax:**  
`$EE`

**Format:**  
`[ERRORCODE:<code>|<v1.0->|<description>]`

| Element | Description |
|:-------:|:------------|
| **`<code>`** | The numeric error code. |
| **`<v1.0->`** | Always empty, for compatability with legacy Grbl. |
| **`<description>`** | A description of the error. |

**Example:**
* _Output error codes:_
	```text
	[ERRORCODE:0||]
	[ERRORCODE:1||G-code words consist of a letter and a value. Letter was not found.]
	[ERRORCODE:2||Missing the expected G-code word value or numeric value format is not valid.]
	...
	ok
	```

---

### `$EEG` – Enumerate and output error codes in legacy Grbl file format {#enumerate-grbl-errors}
Outputs error (status) codes in legacy [Grbl comma separated file](https://github.com/gnea/grbl/blob/master/doc/csv/error_codes_en_US.csv) format.

**Syntax:**  
`$EEG`

**Format:**  
`"<code>","<v1.0->","<description>"`

| Element | Description |
|:-------:|:------------|
| **`<code>`** | The numeric alarm code. |
| **`<v1.0->`** | Always "N/A" for Not Available, Grbl 1.0 and earlier format is not supported. |
| **`<description>`** | A description of the alarm code, it may include action to take to clear it. |

**Example:**
* _Output alarm codes:_
	```text
	"Error Code in v1.1+","Error Message in v1.0-","Error Description"
	"0","N/A",""
	"1","N/A","G-code words consist of a letter and a value. Letter was not found."
	"2","N/A","Missing the expected G-code word value or numeric value format is not valid."
	...
	ok
	```

---

### `$EE` – Enumerate and output $-setting codes {#enumerate-settings}
Outputs error (status) codes with a description.

**Syntax:**  
`$EE`

**Format:**  
`[SETTING:<id>|<group id>|<name>|{<unit>}|<data type>|{<format}]|{<min>}|{<max>}|{<reboot required>}|{<null allowed>}]`

| Element | Description |
|:-------:|:------------|
| **`<id>`** | The numeric setting number. |
| **`<group id>`** | Group id of the [setting group](#enumerate-groups) the setting belongs to. For advanced settings handling. |
| **`<name>`** | Name or short description of setting. |
| **`<unit>`** | Optional unit for setting. |
| [**`<data type>`**](#setting-data-types) | Code for data type. |
| **`<format>`** | Format string or comma separated list of allowed values/labels for data type 1, 2, and 3. |
| **`<min>`** | Optional minimum value allowed. |
| **`<max>`** | Optional maximum value allowed. |
| **`<reboot required>`** | `0` - reboot not required, `1` - required for the setting to take effect |
| **`<null allowed>`** | `0` - blank or `0` not not allowed if a `<min>` - `<max>` range is defined, `1` - allowed in addition to the `<min>` - `<max>` range of values. |

#### Data types {#setting-data-types}

| Code | Description |
|:----:|:------------|
| **`0`** | Boolean, typically rendered as a check box.|
| **`1`** | Bitfield, typically rendered as a column of check boxes. The `<format>` field contains a comma separated list of labels: the first corresponds to bit 0, second to bit 1 and so on. Labels named "N/A" are for unavailable fields and should not be shown in the UI.|
| **`2`** | Exclusive bitfield, typically rendered as a column of check boxes.The `<format>` field contains a comma separated list of labels: the first corresponds to bit 0, second to bit 1 and so on. Labels named "N/A" are for unavailable fields and should not be shown in the UI. When bit 0 is not set checkboxes for other bits should be disabled.|
| **`3`** | Radio buttons. The `<format>` field contains a comma separated list of labels: the first corresponds to the value 0, second to value 1 and so on. Labels named "N/A" are for unavailable options and should not be shown in the UI.|
| **`4`** | [Axis mask](settings#axismask), a bit field typically rendered as a column of check boxes. Number of check boxes corresponds to number of axes. Letters assigned to the axes is available in the [`$I`](#firmware-axes) element `[AXS::]` |
| **`5`** | Integer, typically rendered as a numeric input field. |
| **`6`** | Decimal, typically rendered as a numeric input field. |
| **`7`** | String. |
| **`8`** | Password, as string except data entry could be hidden. |
| **`9`** | IPv4, IP v4 address as a string in dot notation. |

#### Data types {#setting-data-formats}

* Numeric data types (5 and 6):  start with `-` if negative values are allowed, a number of `#` or `0` characters, `.` for decimal point followed by a number of `0` characters.  
`#` - suppress if character in position is `0`  
`0` - do not suppress if character in position is `0`
* Strings: `x(<n>)` where `<n>` is the maximum number of characters allowed. E.g. `x(32)`.

**Example:**
* _Output setting codes:_
	```text
	$ES
	[SETTING:0|35|Step pulse time|microseconds|6|#0.0|2.0||0|0]
	[SETTING:1|35|Step idle delay|milliseconds|5|####0||65535|0|0]
	[SETTING:2|35|Step pulse invert||4||||0|0]
	...
	ok
	```

---

### `$ESG` Enumerate and output $-setting codes  in legacy Grbl file format {#enumerate-grbl-settings}
Outputs error (status) codes in legacy [Grbl comma separated file](https://github.com/gnea/grbl/blob/master/doc/csv/setting_codes_en_US.csv) format.

**Syntax:**  
`$ESG`

**Format:**  
`"<code>","<name>","<unit>","<description>"`

| Element | Description |
|:-------:|:------------|
| **`<code>`** | The numeric $-setting number. |
| **`<name>`** | Name of setting. |
| **`<unit>`** | Optional unit for setting. |
| **`<description>`** | Optional description of the setting. |

**Example:**
* _Output alarm codes:_
	```text
	$ESG
	"$-Code"," Setting"," Units"," Setting Description"
	"0","Step pulse time","microseconds","Step pulse length in microseconds.\nMinimum depends on the processor and is typically in the range of 1 - 2.5.\n\nThe length has to be reduced from the default value of 5 when max. step rate exceed approximately 140 kHz.",
	"1","Step idle delay","milliseconds","Sets a short hold delay when stopping to let dynamics settle before disabling steppers. Value 255 keeps motors enabled.",
	"2","Step pulse invert","","Inverts the step signals (active low).",
	...
	ok
	```

---

### `$ESG` – Enumerate and output $-setting codes in tab separated file format {#enumerate-tab-settings}
Outputs error (status) codes in tab separated format, with header.  
The format is identical to the [$ES]() format minus the `[SETTING:...]` encapsulation and with the `|` element separator replaced with the ASCII tab character (`0x09`).

### `$EG` – Enumerate and output setting groups {#enumerate-groups}
Outputs setting with name and hierarchical relationship.

**Syntax:**  
`$EG`

**Format:**  
`[SETTINGGROUP:<id>|<parent id>|<name>]`

| Element | Description |
|:-------:|:------------|
| **`<id>`** | The numeric group id. |
| **`<parent id>`** | The numeric group id of the parent group. |
| **`<name>`** | Group name. |

**Example:**
* _Output setting groups codes:_
	```text
	$EG
	[SETTINGGROUP:0|0|Root]
	[SETTINGGROUP:1|0|General]
	[SETTINGGROUP:2|0|Control signals]
	[SETTINGGROUP:3|0|Limits]
	...
	ok
	```
---

### `$EM` – Enumerate and output plasma materials {#enumerate-plasma-materials}
Outputs Plasma materials, requires the [plasma plugin](./plugins#plasma-materials) and a material file loaded.

**Syntax:**  
`$EM`

**Format:**  
`[MATERIAL:<magic comment>]`

| Element | Description |
|:-------:|:------------|
| **`<magic comment>`** | Data in LinuxCNC [magic comment](./plugins#plasma-materials-example) format with `\|` separated elements instead of comma separated and `=` replaced with `:`. |

**Example:**
* _Output materials:_
	```text
	$EM
	[MATERIAL:o:2|nu:0|na:Basic default Material|th:1|ph:3|pd:0.1|fr:1000|ch:1|cv:100|pe:0|jh:0|jd:0|kw:1|ca:45|gp:0|cm:1]
	[MATERIAL:o:2|nu:1|na:Mild Steel - 45 A - 2 MM|th:1|ph:3.8|pd:0.2|fr:5560|ch:1.5|cv:128|pe:0|jh:0|jd:0|kw:1.4|ca:45|gp:0|cm:1]
	...
	ok
	```
