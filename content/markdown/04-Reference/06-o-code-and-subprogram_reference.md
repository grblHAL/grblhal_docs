---
slug: reference/o-code
---

# O-code and Subprograms

## O-code

grblHAL supports [parameters](https://linuxcnc.org/docs/html/gcode/overview.html#_parameters), [expressions](https://linuxcnc.org/docs/html/gcode/overview.html#gcode:expressions) and
[flow control](http://www.linuxcnc.org/docs/html/gcode/o-code.html#ocode:looping), LinuxCNC style \(with some limitations\), if enabled
in the [config file](https://github.com/grblHAL/core/blob/ce7c3592b45fe9b5b1909f22cced15201bc72da6/config.h#L481-L497)
or in builds made with the [Web Builder](https://webbuilder.grblhal.org/) when _RS274 NGC expression support_ is enabled in the _Advanced features_ tab.

The `O`-word serves as a label for [flow control statements](#flow-control-statements). It is important that the `O`-numbers match at the beginning and end of a control segment and that they are unique within a file.

> [!IMPORTANT]
> - Subprograms and `O`-words can only be used in files stored in a local file system with the exception of `CALL` to named subprograms and the forward branching [flow control statements](#flow-control-statements) `IF`, `ELSE`, `ELSEIF`, `ENDIF` in data streamed from a sender (if the sender permits them).

## Subprograms

There are five kinds of subprograms available in grblHAL, callable via `G65`, `G66`, `M98`, `O<number> CALL` and `O<name> CALL`.

> ℹ️ **Info**
> - External subprograms are stored in files located by searching the following directories in order `/` (root), `/littlefs` and finally `/embedded`.

## G65 and G66

#### Numbered parameters passed as arguments to G65 and G66 subprograms {#G65-G66-arguments}

| Word | Parameter | Word | Parameter | Word | Parameter |
|------|-----------|------|-----------|------|-----------|
|  A   | #1        |  I   | #4        |  T   | #20       |
|  B   | #2        |  J   | #5        |  U   | #21       |
|  C   | #3        |  K   | #6        |  V   | #22       |
|  D   | #7        |  M   | #13       |  W   | #23       |
|  E   | #8        |  Q   | #17       |  X   | #24       |
|  F   | #9        |  R   | #18       |  Y   | #25       |
|  H   | #11       |  S   | #19       |  Z   | #26       |

> ℹ️ **Info**
> Parameters not set by the caller are set to 0 by the parser prior to the call.

## G65 {#G65}

Syntax: `G65 P- <L-> <A- B- C- ...>`

| Parameter | Description |
|-----------|-------------|
| **`P`** | The number of the subprogram (e.g., `P100` runs the `P100.macro`). |
| **`L`** | **Optional:** Repeat count, default `1`. The macro will be run `L` times. (Available since build 20260125). |
| **`A`, `B`, `C`, `...`** | Values to be passed to the subprogram. These become [local parameters](#G65-G66-arguments) inside the macro. |

`G65` is non-modal and is executed by running the external subprogram `P<number>.macro` `L` number of times.

## G66 {#G66}

`G66 P- <A- B- C- ...>`

| Parameter | Description |
|:---------:|:------------|
| **`P`** | The number of the subprogram (e.g., `P100` runs the `P100.macro`). |
| **`A`, `B`, `C`, `...`** | Values to be passed to the subprogram. These become [local parameters](#G65-G66-arguments) inside the macro. |

`G66` is modal, it will run `P<number>.macro` for each block _following_ the `G66` block until a `G67` block is encountered. The initial `G66` will only set the local parameters from the arguments passed, and each subsequent execution will run the actual code with the supplied parameter values even if they are changed within the subprogram.

## M98 {#M98}

Syntax: `M98 P- <L->`

| Parameter | Description |
|-----------|-------------|
| **`P`** | The number of the internal subprogram. |
| **`L`** | **Optional:** Repeat count, default `1`. The macro will be run `L` times. (Available from build 20260125). |

`M98` will run a subprogram embedded in the main program or an external program depending on the [$700](/docs/reference/settings#700) setting. When configured for running an embedded routine the whole program is scanned for subprograms which are to be delimited by `O<number>` and `M99`. Embedded subprograms may be placed anywhere in the program but normal practice is to embed them after the main program code. If not configured for running an embedded routine it will run the external program `P<number>.macro`.

> ℹ️ **Info**
> - When configured for running an embedded routine `M98` can only be used in programs stored in a local file system.

<sup>1</sup> In check mode non-inbuilt `G65` macros will not be run, only file availability will be checked.

## `M99` – Return from Subprogram {#M99}

**Syntax:**  
> `M99`

Marks the end of a subprogram and returns execution to the main program or the calling subprogram.

> ℹ️ **Info**
> - **Purpose:** This command is essential for controlling program flow when using subprograms.
> - **`G65` Calls:** `M99` is used to return from a `G65` subprogram call, restoring the modal state and returning to the line immediately after the `G65` call.
> - **`tc.macro`:** If your tool change (`M6`) logic is implemented as a macro (e.g., `tc.macro` or `P200.macro` for RapidChange ATC), `M99` is 
> - Do not use `M99` to return from `O SUB` ... `O ENDSUB` subprograms or subprograms called by `O CALL`, it may lead to unpredicable results.

#### Example
* _Returning from a tool change macro:_
	```gcode
	(Inside tc.macro or P200.macro) 
	...
	G53 G0 X-50 Y-50 Z-5 (Move to tool change position)  
	...
	M99 (Return to main program after tool change)
	```

## O CALL  {#O-CALL}

Subprogram code must be delimited by `O- SUB` and `O- ENDSUB`. To exit a subprogram early, or return a value, use the `RETURN[]` statement. Do **not** terminate a subprogram with `M2` or `M30` as this will likely cause issues.  
If a value is returned the parameter `_value_returned` is set to `1` and `_value` to the returned value, if not `_value_returned` is set to `0`.  
`[arguments]` must be expressions, to pass constant values enclose them in square brackets, e.g. `o100 call [1] [2] [#<_xpos>]`. Up to 30 arguments can be passed and they will be assigned to the local parameters in ascending order (`#1, #2, #3, ...`). The values of remaining local parameters will be assigned from the callers context and all will be restored to their original values on return.

### Numbered O CALL

**Syntax** `O- call [arguments]`

| Parameter | Description |
|-----------|-------------|
| **O** | The number of the internal subprogram. |
| **arguments** | **Optional:** Values to pass to the called subprogram, assigned as local parameters `#1`, `#2`, ... |

Numbered subprograms must be embedded in the same program as the call is made from and they must located prior to any `CALL` statements.

**Simple example:**

```gcode
o123 sub
  ( Code for a specific operation, e.g., )
  G1 X10 Y10 F500
  G1 Z-2 F100
o123 endsub

; Main program

G53 G0 Z0
O123 call
M2
```

**Advanced example, with parameter passing, expressions and recursion:**

```gcode
(Program to mill a flowsnake)
(K. Lerman)

o1000 sub
  #<level> = #1
  #<startX> = #2
  #<startY> = #3
  #<endX> = #4
  #<endY> = #5

  o1001 if [#<level> EQ 0]
    g1 f10 x#<endX> y#<endY>
  o1001 else
    #<p1X> = [[#<startX> * 2 + #<endX>]/3]
    #<p1Y> = [[#<startY> * 2 + #<endY>]/3]

    #<p2X> = [[#<startX> + #<endX>]/2 + [#<endY> - #<startY>]/[SQRT[12.0]]]
    #<p2Y> = [[#<startY> + #<endY>]/2 - [#<endX> - #<startX>]/[SQRT[12.0]]]

    #<p3X> = [[#<startX> + 2 * #<endX>]/3]
    #<p3Y> = [[#<startY> + 2 * #<endY>]/3]

    o1000 call [#<level>-1] [#<startX>] [#<startY>] [#<p1X>] [#<p1Y>]
    o1000 call [#<level>-1] [#<p1X>] [#<p1Y>] [#<p2X>] [#<p2Y>]
    o1000 call [#<level>-1] [#<p2X>] [#<p2Y>] [#<p3X>] [#<p3Y>]
    o1000 call [#<level>-1] [#<p3X>] [#<p3Y>] [#<endX>] [#<endY>]
  o1001 endif
o1000 endsub

; Main program

S100M3
g0 z1
g0 x.25 y1.0
g1 f10 z0
#<level> = 5
o1000 call [#<level>] [.25] [1.0] [3.75] [1.0]
o1000 call [#<level>] [3.75] [1.0] [2.0] [3.95]
o1000 call [#<level>] [2.0] [3.95] [.25] [1.0]
g0 z1
M30
```

### Named O CALL

**Syntax:** `O<-> call [arguments]`  

| Parameter | Description |
|-----------|-------------|
| **O** | The name of the external subprogram enclosed in angle brackets. It will run the named file with a `.macro` extension. |
| **arguments** | **Optional:** Values to pass to the called subprogram, assigned as local parameters `#1`, `#2`, ... |


> ℹ️ **Info**
> - The name is converted to lowercase, be sure to save the file with a lower case file name to ensure it can be found.
> - The subprogram file must contain a single subprogram definition, enclosed by `o<name> sub` and `o<name> endsub` with the name matching the file name (excluding the extension).

**Example**:

A file named `namedsub.macro` in a local file system containing:

```gcode
o<namedsub> sub
(print, Hi, I am namedsub)
X1
Y1
Z1
X0Y0Z0
G4P.1
(print, Done!)
o<namedsub> endsub
```

Call from the senders MDI or gcode program:

`o<namedsub> call`

## Operators, functions and flow control

### Operators and precedence {#operators}

| Operators                 | Precedence |
|---------------------------|------------|
| \*\*                      | Highest    |
| \*, / and MOD             |            |
| + and -                   |            |
| EQ, NE, GT, GE, LT and LE |            |
| AND, OR and XOR           | Lowest     |

### Functions

| Name            | Result                                       | Comment                        |
|-----------------|----------------------------------------------|--------------------------------|
| ABS[arg]        | Absolute value.                              |                                |
| ACOS[arg]       | Inverse cosine.                              |                                |
| ASIN[arg]       | Inverse sine.                                |                                |
| ATAN[arg]/[arg] | Four quadrant inverse tangent.               |                                |
| COS[arg]        | Cosine.                                      |                                |
| EXISTS[arg]     | Named parameter exists.                      |                                |
| EXP[arg]        | e raised to the given power.                 |                                |
| FIX[arg]        | Round down to integer.                       |                                |
| FUP[arg]        | Round up to integer.                         |                                |
| LN[arg]         | Base-e logarithm.                            |                                |
| ROUND[arg]      | Round to nearest integer.                    |                                |
| SIN[arg]        | Sine.                                        |                                |
| SQRT[arg]       | Square root.                                 |                                |
| TAN[arg]        | Tanget.                                      |                                |
| PRM[arg]        | Value of numeric setting.<sup>1</sup>        | Available from build 20241025. |
| PRM[arg,bit]    | Value of bit in integer setting.<sup>1</sup> | Available from build 20241025. |

### Flow control statements {#flow-control}

| Statement         | Local file | Streamed G-Code | Comment                                                  |
|-------------------|------------|-----------------|----------------------------------------------------------|
| if \<expr\>       | yes        | yes             |                                                          |
| elseif \<expr\>   | yes        | yes             |                                                          |
| else              | yes        | yes             |                                                          |
| endif             | yes        | yes             |                                                          |
| do                | yes        | no              |                                                          |
| continue          | yes        | no              |                                                          |
| break             | yes        | no              |                                                          |
| while \<expr\>    | yes        | no              |                                                          |
| endwhile          | yes        | no              |                                                          |
| repeat \<expr\>   | yes        | no              |                                                          |
| sub               | yes        | no              |                                                          |
| endsub            | yes        | no              |                                                          |
| call (numbered)   | yes        | no              |                                                          |
| call (named)      | yes        | yes             |                                                          |
| return \[<expr\>] | yes        | no              |                                                          |
| alarm  \<expr\>   | yes        | no              | \<expr\> must evaluate to a valid alarm code<sup>1</sup> |
| error  \<expr\>   | yes        | no              | \<expr\> must evaluate to a valid error code<sup>1</sup> |

<sup>1</sup> grblHAL specific extension.

## Built in G65 subprograms

### G65P1 {#G65P1}

**Syntax:** `G65P1Q-`

Read numeric setting value. Alternatively the `PRM[]` function can be used.

| Parameter | Description         |
|-----------|---------------------|
| **`Q`**   | The setting number. |

If the setting exists and is numerical `_value_returned` is set to `1` and `_value` to the setting value, if not `_value_returned` is set to `0`.  
**Examples:**
```gcode
; Read current X-axis max rate ($110)
G65 P1 Q110
(PRINT, X-axis max rate: #<_value> mm/min)
```
```gcode
; Read current X-axis max rate ($110)
#100 = PRM[110]
(PRINT, X-axis max rate: #100 mm/min)
```
```gcode
; Check if homing is enabled (bit 0 of $22)
#100=PRM[22, 0]
(PRINT, Homing enabled: #100)
```

**Syntax:** `G65P1Q-S-`

Set numeric setting value. Available from build 20251028.

| Parameter | Description         |
|-----------|---------------------|
| **`Q`**   | The setting number. |
| **`S`**   | The new value.      |

If the setting exists, is numerical, and the value is allowed `_value_returned` is set to `1` and `_value` to the new setting value, if not `_value_returned` is set to `0`.  

**Example:**
```gcode
; Set X-axis max rate to 5000 mm/min
G65 P1 Q110 S5000
#100 = PRM[110]
(PRINT, X-axis max rate: #100 mm/min)
```

### G65P2 {#G65P2}

**Syntax:** `G65P2Q-R-`

Read tool offset from tool table.

| Parameter | Description                    |
|-----------|--------------------------------|
| **`Q`**   | The tool number.               |
| **`R`**   | Axis number. 0 = X, 1 = Y, ... |

If a tool table is present and the tool is available `_value_returned` is set to `1` and `_value` to the axis offset, if not `_value_returned` is set to `0`.  

**Example:**
```gcode
; Read Z-axis offset for Tool 3
G65 P2 Q3 R2
#100 = _value
(PRINT, Tool 3 Z offset: #100 mm)
```

### G65P4 {#G65P4}

**Syntax:** `G65P4`

 Get current machine state, available from build 20250107.

| State | Description              |
|-------|--------------------------|
| 0     | Idle                     |
| 2     | Check mode<sup>1</sup>   |
| 4     | Cycle \(motion ongoing\) |
| 10    | Tool change              |

On return `_value_returned` is set to `1` and `_value` to the current state as listed above.

**Example:**
```gcode
; Check if machine is idle before starting operation
G65 P4
o100 IF [#<_value> NE 0]
  (MSG, ERROR: Machine not idle!)
  M0
o100 ENDIF
```

### G65P5 {#G65P5}

**Syntax:** `G65P5Q-`

Select probe input, available from build 20250514.

| Parameter | Description   |
|-----------|---------------|
| **`Q`**   | The probe id. |

| Probe id | Description     |
|----------|-----------------|
| 0        | Primary probe   |
| 1        | Toolsetter      |
| 2        | Secondary probe |

> ℹ️ **Info**
> Selecting a probe input that is not available will raise an error.

**Examples:**
```gcode
; Use primary probe for workpiece probing
G65 P5 Q0
G38.2 Z-50 F100  ; Probe down
```
```gcode
; Switch to toolsetter for tool measurement
G65 P5 Q1
G38.2 Z-100 F50  ; Probe tool length
```

### G65P6 {#G65P6}

**Syntax:** `G65P6`

Disable spindle on/off delays for the next `M3`, `M4` or `M5` command, available from build 20250922.

**Example:**
```gcode
; Normal spindle start with delay when $374, spindle on delay, is set > 0
M3 S10000 ; Start spindle and wait for it to spin up
G1X100F300 ; Starts cutting after spin up delay

; Quick spindle restart without delay
M5
G65 P6  ; Disable delays for next spindle command
M3 S10000  ; Start spindle
G1X100F300  ; Starts cutting immediately, no delay
```

### G65P7 {#G65P7}

**Syntax:**  
`G65P7 S- F- R- <X->` for function codes 1-4.  
`G65P7 S- F- R- A-` for function code 5 and 6.  
`G65P7 S- F-` for function code 7.  
`G65P7 S- F- R- A- <B-> <C->` for function codes 16 and 17.  

Send Modbus message, available from build 20260215.

| Parameter | Description                    |
|-----------|--------------------------------|
| **`S`**   | Modbus server address |
| **`F`**   | Modbus function code, 1-7, 16 and 17 are supported  |
| **`R`**   | Register base address  |
| **`X`**   | Number of registers or bits to read or write |
| **`A`**   | First value |
| **`B`**   | Second value |
| **`C`**   | Third value |

Allowed range the X parameter is for 1 - 3 for function codes 3 and 4 and 1 - 16 for function codes 1, 2 and 15. Defaults to 1.  

On exceptions `_value_returned` is set to `0` and `_value` to the exception code.  
On success `_value_returned` is set to the number of values received and `_value`, `_value2` and `_value3` is set accordingly.

#### Supported Modbus Function Codes:  

Resources:
- [Modbus Protocol Specification](https://www.modbustools.com/modbus.html)
- [Modbus Function Codes Reference](https://www.productinfo.schneider-electric.com/powerpactmodbuscommguide/)

_**Function Code 1 (0x01): Read Coils**_

Reads the ON/OFF status of discrete output coils (digital outputs) from the slave device.

**Use Case:** Reading the state of relay outputs, digital I/O pins, or binary flags.

**Example:**
```gcode
; Read 8 coils starting from address 100 on slave device 1
G65 P7 S1 F1 R100 X8
; _value will contain the coil states as a bitmask
```

_**Function Code 2 (0x02): Read Discrete Inputs**_

Reads the ON/OFF status of discrete input contacts (digital inputs) from the slave device.

**Use Case:** Reading the state of limit switches, sensors, or other digital input signals.

**Example:**
```gcode
; Read status of 4 discrete inputs starting from address 200 on slave 1
G65 P7 S1 F2 R200 X4
; Check if input is active
#100 = [#<_value> AND 1]  ; Check bit 0
```

_**Function Code 3 (0x03): Read Holding Registers**_

Reads the contents of holding registers (read/write registers) from the slave device. This is the most commonly used function for reading configuration, setpoints, and status values.

**Use Case:** Reading VFD speed setpoints, temperature values, counters, configuration parameters.

**Example:**
```gcode
; Read current spindle speed from VFD at slave address 1, register 1000
G65 P7 S1 F3 R1000 X1
#100 = #<_value>

; Read 3 consecutive registers (e.g., X, Y, Z position from a controller)
G65 P7 S2 F3 R500 X3
#100 = #<_value>
#101 = #<_value2>
#102 = #<_value3>
```

_**Function Code 4 (0x04): Read Input Registers**_

Reads the contents of input registers (read-only registers) from the slave device. These typically contain sensor readings, measurements, or status information.

**Use Case:** Reading analog sensor values, measurement data, device status codes.

**Example:**
```gcode
; Read temperature sensor value from register 300 on slave 3
G65 P7 S3 F4 R300 X1
#100 = #<_value>

; Read multiple sensor values
G65 P7 S3 F4 R400 X3
#100 = #<_value>
#101 = #<_value2>
#102 = #<_value3>
```

_**Function Code 5 (0x05): Write Single Coil**_

Writes (forces) a single coil (digital output) to either ON or OFF.

**Use Case:** Controlling relays, solenoids, indicator lights, or digital outputs.

**Parameters:**
*   `A`: Value to write (0 = OFF, 65280 or 0xFF00 = ON)

**Example:**
```gcode
; Turn ON coil at address 50 on slave device 1
G65 P7 S1 F5 R50 A65280

; Turn OFF coil at address 50
G65 P7 S1 F5 R50 A0

; Practical example: Activate a clamp
G65 P7 S1 F5 R100 A65280  ; Clamp ON
G4 P0.5                    ; Wait 0.5 seconds
; ... perform machining ...
G65 P7 S1 F5 R100 A0       ; Clamp OFF
```

_**Function Code 6 (0x06): Write Single Register**_

Writes a value to a single holding register. This is the most common function for setting parameters, setpoints, and configuration values.

**Use Case:** Setting VFD speed, writing configuration parameters, updating setpoints.

**Syntax:** `G65 P7 S F6 R A`

**Example:**
```gcode
; Set VFD spindle speed to 12000 RPM (register 2000 on slave 1)
G65 P7 S1 F6 R2000 A12000

; Set a temperature setpoint to 75°C (register 500 on slave 2)
G65 P7 S2 F6 R500 A75

; Practical example: Variable spindle speed based on material
#100 = 1  ; 1=aluminum, 2=steel
o100 IF [#100 EQ 1]
  #101 = 18000
o100 ELSE
  #101 = 12000
o100 ENDIF
G65 P7 S1 F6 R2000 A#101
M3  ; Start spindle
```

_**Function Code 7 (0x07): Read Exception Status**_

Reads the exception status (8 coils/bits) from the slave device. This is a specialized diagnostic function.

**Use Case:** Reading device error flags, alarm states, or diagnostic information.

**Syntax:** `G65 P7 S F7`

**Example:**
```gcode
; Read exception status from slave 1
G65 P7 S1 F7
#100 = #<_value>

; Check for specific error conditions
o100 IF [#<_value> GT 0]
  (MSG, ERROR: Device exception detected!)
  M0  ; Stop program
o100 ENDIF
```

_**Function Code 16 (0x10): Write Multiple Registers**_

Writes values to multiple consecutive holding registers in a single transaction. More efficient than multiple Function Code 6 calls.

**Use Case:** Setting multiple parameters simultaneously, writing coordinate data, bulk configuration updates.

**Syntax:** `G65 P7 S F16 R A > >`

**Example:**
```gcode
; Write 3 values to consecutive registers starting at 1000 on slave 1
G65 P7 S1 F16 R1000 A100 B200 C300
; Register 1000 = 100
; Register 1001 = 200
; Register 1002 = 300

; Practical example: Set XYZ position setpoints
#100 = 150.5
#101 = 200.0
#102 = 50.0
G65 P7 S2 F16 R500 A#100 B#101 C#102
```

_**Function Code 17 (0x11): Report Server ID**_

Reads the identification and additional information from the slave device (serial line only).

**Use Case:** Device identification, firmware version checking, diagnostic information retrieval.

**Example:**
```gcode
; Get server ID from slave device 1
G65 P7 S1 F17
; _value will contain device identification data
```

### Error Handling

When a Modbus transaction fails or the slave device returns an exception, grblHAL sets:
*   `_value_returned = 0`
*   `_value` = Modbus exception code

**Common Modbus Exception Codes:**
*   `1`: Illegal Function (function code not supported by device)
*   `2`: Illegal Data Address (register address doesn't exist)
*   `3`: Illegal Data Value (value out of range)
*   `4`: Slave Device Failure (device malfunction)
*   `5`: Acknowledge (device accepted but needs time to process)
*   `6`: Slave Device Busy (device is processing another request)
*   `7`: Negative Acknowledge (device cannot perform the function)
*   `8`: Memory Parity Error (data corruption detected)

**Example Error Handling:**
```gcode
; Attempt to read register with error checking
G65 P7 S1 F3 R1000 X1

o100 IF [#<_value_returned> EQ 0]
  (PRINT, Modbus Error! Exception Code: #<_value>)
  o101 IF [#<_value> EQ 2]
	(MSG, ERROR: Invalid register address)
  o101 ENDIF
  o102 IF [#<_value> EQ 4]
	(MSG, ERROR: Device failure)
  0102 ENDIF
  M0  ; Stop program on error
o100 ELSE
  #100 = #<_value>
  (MSG, Spindle RPM: #)
o100 ENDIF
```

### Practical Application Examples

#### Example 1: VFD Spindle Control
```gcode
; Read current VFD frequency
G65 P7 S1 F3 R1000 X1
(MSG, Current Frequency: #<_value> Hz)

; Set new frequency to 400 Hz (24000 RPM for 2-pole motor)
G65 P7 S1 F6 R1000 A400

; Start VFD
G65 P7 S1 F5 R100 A65280  ; Write coil to start
G4 P2  ; Wait 2 seconds for spindle to spin up
```

#### Example 2: Reading Multiple Sensors
```gcode
; Read 3 temperature sensors from a monitoring device
G65 P7 S3 F4 R100 X3
#100 = #<_value>
#101 = #<_value2>
#102 = #<_value3>

; Check for overheating
o100 IF [#100 GT 80]
  (MSG, WARNING: Spindle temperature high!)
  M5  ; Stop spindle
  M0  ; Pause program
o100 ENDIF
```

#### **Example 3: Automated Tool Measurement**
```gcode
; Trigger tool measurement on external probe system
G65 P7 S2 F5 R200 A65280  ; Activate measurement
G4 P1  ; Wait for measurement

; Read measured tool length
G65 P7 S2 F3 R500 X1
; Apply tool offset
o100 if[#<_value_returned> EQ 0]
G43.1 Z#<_value>
(PRINT, Tool length: #<_value> mm)
o100 else
(abort, Tool sensor failed with exception #<_value>)
o100 endif
```

---

> ℹ️ **Warning** 
This feature has only been tested with a Modbus simulator. Use with caution in production environments and report any issues to the grblHAL development team.

> ℹ️ **Tip** 
Ensure your grblHAL firmware is compiled with Modbus support enabled and that the Modbus communication parameters (baud rate, parity, stop bits) match your slave devices. Modbus settings are typically configured via grblHAL settings `$3xx` range.

> ℹ️ **Info**  
> Additional resources:
> - [grblHAL Modbus Plugin Documentation](https://github.com/grblHAL/Plugins_spindle)
