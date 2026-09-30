---
slug: advanced/macros
---

# Macros, Expressions & Flow Control

grblHAL supports advanced G-code features allowing for **parametric programming**, **conditional logic**, and **math expressions**. This brings capabilities similar to LinuxCNC's O-codes and RS274NGC standards to your microcontroller.

## 1. Expressions & Math

You can use math expressions anywhere a numeric value is expected by enclosing them in `[]`.

### Operators & Precedence
Expressions are evaluated based on standard precedence rules:

| Priority | Operators | Description |
| :--- | :--- | :--- |
| **1 (Highest)** | `**` | Exponentiation (Power) |
| **2** | `*`, `/`, `MOD` | Multiplication, Division, Modulo |
| **3** | `+`, `-` | Addition, Subtraction |
| **4** | `EQ`, `NE`, `GT`, `GE`, `LT`, `LE` | Comparison (Equal, Not Equal, Greater Than, etc.) |
| **5 (Lowest)** | `AND`, `OR`, `XOR` | Bitwise Logic |

**Examples:**
- `[1 + 2 * 3]` evaluates to `7`.
- `[[1 + 2] * 3]` evaluates to `9`.
- `[# GT 100]` returns `1` (true) or `0` (false).

### Functions
| Function | Description | Example |
| :--- | :--- | :--- |
| **`SQRT[n]`** | Square Root | `G1 X[SQRT[100]]` (= X10) |
| **`SIN[n]`, `COS[n]`, `TAN[n]`** | Trigonometry (Degrees) | `G1 Y[SIN[45]*10]` |
| **`ASIN[n]`, `ACOS[n]`, `ATAN[n]`** | Inverse Trig | `# = ASIN[0.5]` (= 30) |
| **`ABS[n]`** | Absolute Value | `# = ABS[-5]` (= 5) |
| **`ROUND[n]`, `FIX[n]`, `FUP[n]`** | Rounding functions | `FIX[3.9]` (= 3), `FUP[3.1]` (= 4) |
| **`LN[n]`, `EXP[n]`** | Base-e log / exponential | `EXP[1]` (= 2.71828) |
| **`PRM[n]`** | Read grblHAL Setting | `# = PRM[110]` |

---

## 2. Parameters (Variables)

Variables in G-code are called **Parameters**. They start with `#`.

### Numbered Parameters
- **`#1 - #30`**: Local subroutine arguments (passed via `G65`).
- **`#31 - #5000`**: Global user variables (non-persistent).
- **`#5000+`**: Read-only system variables.

### Named Parameters
You can create readable variable names. System named parameters are read-only and start with `_`.

**User Variables:**
- **Syntax:** `#<name>`
- **Assignment:** `#<myvar> = 100.5`
- **Usage:** `G1 X#<myvar>`

### System Parameters Reference
These are automatically updated by grblHAL.

| Parameter | Description | Equivalent # |
| :--- | :--- | :--- |
| **State & Modes** | | |
| `#<_metric>` | `1` if Metric (G21), `0` if Imperial | |
| `#<_absolute>` | `1` if Absolute (G90), `0` if Relative | |
| `#<_incremental>` | `1` if Relative (G91), `0` if Absolute | |
| `#<_imperial>` | `1` if Imperial (G20), `0` if not | |
| `#<_spindle_on>` | `1` if Spindle is ON | |
| `#<_flood>` | `1` if Flood Coolant (M8) ON | |
| `#<_mist>` | `1` if Mist Coolant (M7) ON | |
| `#<_tool_offset>` | `1` if Tool Offset (G43) Active | |
| `#<_feed_override>` | `1` if Feed Override (M48/M50P2) ON | |
| `#<_speed_override>` | `1` if Speed Override (M48/M50P1) ON | |
| `#<_feed_hold>` | `1` if Feed Hold (M53.1) Active | |
| `#<_homed_state>` | `1` if machine is Homed | |
| `#<_homed_axes>` | Bitmask of Homed Axes (X=1, Y=2, Z=4...) | |
| **Tools & Pockets** | | |
| `#<_current_tool>` | Current Tool Number | `#5400` |
| `#<_selected_tool>` | Selected Tool Number (T word) | |
| `#<_current_pocket>` | Current Pocket Number | |
| `#<_selected_pocket>` | Selected Pocket Number | |
| `#<_tool_table_size>` | Number of tools in table (0 if disabled) | |
| **Probes** | | |
| `#<_probe_state>` | State of Primary Probe Input (-1 if N/A) | |
| `#<_probe2_state>` | State of Secondary Probe Input (-1 if N/A) | |
| `#<_toolsetter_state>` | State of Toolsetter Input (-1 if N/A) | |
| `#<_active_probe>` | ID of currently active probe (-1 if none) | |
| **System Info** | | |
| `#<_free_memory>` | Free Heap Memory (KBytes, -1 if N/A) | |
| `#<_call_level>` | Current Subroutine Nesting Level | |
| `#<_value>` | Return value from G65/M98 calls (reset to 0 on entry) | |
| `#<_value_returned>` | `1` if last G65/macro call returned a value | |
| `#<_line>` | Current G-Code line number | |
| **Coordinates (Current WCS — includes all offsets)** | | |
| `#<_x>`, `#<_y>`, `#<_z>` | Current WorkPos X, Y, Z | `#5420`–`#5422` |
| `#<_a>`, `#<_b>`, `#<_c>` | Current WorkPos A, B, C | `#5423`–`#5425` |
| `#<_u>`, `#<_v>`, `#<_w>` | Current WorkPos U, V, W | `#5426`–`#5428` |
| **Coordinates (Machine — G53 absolute)** | | |
| `#<_abs_x>`, `#<_abs_y>`, `#<_abs_z>` | Machine Position X, Y, Z | |
| `#<_abs_a>`, `#<_abs_b>`, `#<_abs_c>` | Machine Position A, B, C | |
| `#<_abs_u>`, `#<_abs_v>`, `#<_abs_w>` | Machine Position U, V, W | |
| **Probe Results** | | |
| `#5061`–`#5069` | Probe Contact Position (X, Y, Z, A, B, C, U, V, W) | |
| `#5070` | Probe Success (`1`=Hit, `0`=Miss) | |
| **Work Offsets** | | |
| `#5221`–`#5229` | G54 (CS 1) Offset | |
| `#5241`–`#5249` | G55 (CS 2) Offset | |
| `#5261`–`#5269` | G56 (CS 3) Offset | |
| `#5281`–`#5289` | G57 (CS 4) Offset | |
| `#5301`–`#5319` | G58 (CS 5) Offset | |
| `#5321`–`#5329` | G59 (CS 6) Offset | |
| `#5341`–`#5349` | G59.1 (CS 7) Offset | |
| `#5361`–`#5369` | G59.2 (CS 8) Offset | |
| `#5381`–`#5389` | G59.3 (CS 9) Offset | |
| `#5220` | Active Coordinate System number (1=G54 … 9=G59.3) | |
| **G92 / G28 / G30** | | |
| `#5210` | `1` if G92 offset is active, `0` if not | |
| `#5211`–`#5219` | G92 offset (X, Y, Z, A, B, C, U, V, W) | |
| `#5161`–`#5169` | G28 home position | |
| `#5181`–`#5189` | G30 home position | |
| **Motion Mode** | | |
| `#<_motion_mode>` | Current G motion mode (1=G1, 2=G2, 3=G3, 80=G80…) | |

---

## 3. Flow Control (O-Codes)

Logic statements allow your G-code to make decisions. These are essential for **Automatic Tool Changers (ATC)** and complex probing macro scripts.

**Important:** Flow control commands (`if`, `while`, `goto`) are best supported when running **Macro Files** from the SD card. Streaming them line-by-line from a sender can be unreliable depending on the sender's implementation.

### `IF` / `ELSE` / `ENDIF`
Execute code only if a condition is true.

```gcode
o100 if [#<_metric> EQ 0]
  (print, Error: Please switch to Metric G21)
  M2
o100 else
  (print, Metric mode confirmed)
o100 endif
```

### `WHILE` Loop
Repeat code while a condition is true.

```gcode
#<count> = 0
o101 while [#<count> LT 5]
  G1 X10
  G0 X0
  #<count> = [#<count> + 1]
o101 endwhile
```

### `DO` / `WHILE`
Execute at least once, then check condition.

```gcode
o102 do
  (probe logic...)
o102 while [#5070 EQ 0] (Repeat until probe hits)
```

### `SUB` / `ENDSUB` / `CALL` / `RETURN`
Define reusable subroutines.

**Defining a Sub (e.g., file `probe_z.macro`):**
```gcode
o sub
  G91 G38.2 Z-20 F100
  o103 if [#5070 EQ 0]
     (abort, Probe failed!)
  o103 endif
  G0 Z2
o endsub
```

**Calling a Sub:**
```gcode
O100 call         (calls o100.macro)
Omyprobe call     (calls myprobe.macro)
```

---

## 4. Automatic Tool Change (ATC) Macros
grblHAL allows remaping the `M6` command to a macro file. This works perfectly for DIY tool changers (Rack/Umbrella) or manual changes with auto-touchoff.

### Enabling M6 Remap
1.  Enable ATC support in `config.h` (or Web Builder).
2.  Set `$341` (Tool Change Mode) to match your logic.
3.  When `M6 T` is issued, grblHAL can call a macro named `tc.macro` (or similar) from the SD card.

### Example `tc.macro` Structure
This macro handles the physical act of changing the tool.

```gcode
o sub
  (Save current state)
  M70

  (Move to Safe Z)
  G53 G0 Z0

  (Check if tool is already loaded)
  o100 if [# EQ #]
    (print, Tool already loaded)
    M72
    M99
  o100 endif

  (Move to Old Tool Slot)
  G53 G0 X# Y#
  (Drop Tool Logic...)
  M64 P1 (Open Drawbar)

  (Move to New Tool Slot)
  G53 G0 X# Y#
  M65 P1 (Close Drawbar)

  (Restore State)
  M72
o endsub
M99
```

**RapidChange ATC / Sienci ATC:**
These systems often use standardized macros (e.g., `M6` calls `P200.macro`) that handle the complex logic of rack management, calibration, and tool offsets.

---

## 5. Advanced G65 Macro Calls

`G65` macro calls allow passing arguments into a subroutine, mapping P/Q/R words to local variables.

**Syntax:** `G65 P [L] A- B- C-...`

| Word | Variable | Word | Variable |
| :--- | :--- | :--- | :--- |
| **A** | #1 | **I** | #4 |
| **B** | #2 | **J** | #5 |
| **C** | #3 | **K** | #6 |
| **D** | #7 | **S** | #19 |
| **E** | #8 | **T** | #20 |
| **F** | #9 | **X/Y/Z** | #24/#25/#26 |

**Inbuilt grblHAL Functions:**
- **`G65 P1 Q`**: Read Setting `` value.
- **`G65 P1 Q S`**: Set Setting `` to `` (Build 20251108+).
- **`G65 P2 Q R`**: Read Tool Offset.
- **`G65 P3 I Q`**: Set Parameter `` to ``.

---

## 6. Modal Macros (G66 / G67)

**Available from Build 20260125.**

Modal macros are called automatically after every motion command.

- **`G66 P [L] `**: Enable modal macro.
- **`G67`**: Cancel modal macro.

**Example:**
```gcode
; Drill a hole pattern
G66 P100 Z-5 R2 (Enable Macro 100, pass arguments)
X10 Y10 (Macro 100 runs here)
X20 Y10 (Macro 100 runs here)
G67 (Cancel)
```
