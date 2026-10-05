---
slug: reference/gcode
---

# G-code & M-code Reference

This page is a comprehensive reference for all known grblHAL G-code and M-code commands. It is designed to be a single source of truth for machine operation and G-code programming.

Use the table of contents on the right to navigate, or use your browser's search function (`Ctrl+F`) to find a specific command.

---

## General Tips & Best Practices

1.  **Start Every File with a Safety Block:** Every G-code program should begin with a "safety block" or preamble that sets the machine to a known, predictable state. This prevents crashes and unexpected behavior.
    ```gcode
    G90 G21 G17 G40 G49 G80 G94 ; Absolute, MM, XY Plane, Cancel Comp/Offsets, Cancel Cycle, Units/Min
    M5 M9 ; Spindle and Coolant Off
    G53 G0 Z0 ; Retract Z to machine top safely
    ```

2.  **Explicit is Better Than Implicit:** Don't assume the machine is in the correct state. Explicitly command `G90`/`G91`, `G20`/`G21`, and select your work offset (`G54`, etc.) in your program.

3.  **Understand Modality:** Remember which commands are modal. Forgetting that a `G1` is active can lead to an unintended cutting move when you meant to make a rapid `G0` move. Forgetting a canned cycle (`G81`) is active can lead to unintended drilling. Always cancel modes (use `G80`, `G0`/`G1` can also be used ) when you are done with them.

4.  **Use `G53` for Safety:** When you need to move to a known, fixed machine position (like a tool change station or home), use `G53`. It bypasses all offsets and is the most reliable way to avoid collisions in these situations. A `G53 G0 Z0` is one of the safest commands in G-code.  NB! **only use if the machine is homed! as G53 depends on machine coordinates**

5.  **Comment Your Code:** Use parentheses `()` or semicolons `;` to add comments to your G-code. This is invaluable for documenting complex sections, manual tool changes, or special setups.
    ```gcode
    (*** Begin Finishing Pass for Part A ***)
    T2 M6 (Load 3mm Ball End Mill)
    G43.1 Z125.5 (Apply tool length offset)
    S18000 M3
    ```  
    or  
    ```gcode
    M3 S10000 ; Set spindle speed to 10,000RPM
    ```

---

## Modal Groups

| Group | Description                     | Commands |
|:-----:|:-------------------------------:|:---------|
| G0    | Non-modal                       | G4, G10, G28, G28.1, G30, G30.1, G53, G92, G92.1, G92.2, G92.3 |
| G1    | Motion mode                     | G0, G1, G2, G3, G33, G33.1, G38.2, G38.3, G38.4, G38.5, G76, G80, G81, G82, G83, G84, G85, G86, G89 |
| G2    | Plane selection                 | G17, G18, G19 |
| G3    | Distance mode                   | G90, G91 |
| G4    | Arc IJK distance mode           | G91.1 |
| G5    | Feed rate mode                  | G93, G94, G95 |
| G6    | Units                           | G20, G21 |
| G7    | Cutter radius compensation mode | G40, G41, G41.1, G42, G42.1 | 
| G8    | Tool length offset              | G43, G43.1, G49 |
| G10   | Return mode in canned cycles    | G98, G99 |
| G11   | Scaling                         | G50, G51 |
| G12   | Coordinate system selection     | G54, G55, G56, G57, G58, G59, G59.1, G59.2, G59.3 |
| G13   | Control mode                    | G61 |
| G14   | Spindle Speed Mode              | G96, G97 | 
| G15   | Lathe Diameter Mode             | G7, G8 |
| G16   | Subprogram call                 | G65, G66, G67, M98 | 
| M4    | Stopping                        | M0, M1, M2, M30, M99 |
| M5    | Aux I/O                         | M62, M63, M64, M65, M66, M67, M68 |
| M6    | Tool change                     | M6 |
| M7    | Spindle turning                 | M3, M4, M5 |
| M8    | Coolant control                 | M7, M8, M9 |
| M9    | Override control                | M49, M50, M51, M53, M56 |
| M10   | User defined M commands         | M words >= 100 |

---

## Syntax {#syntax}

#### `axisletters` - Axis letters {#axisletters}
One or more axis letter: `X`, `Y`, `Z`, `A`, `B`, `C`, `U`, `V` or `W` from the range supported by the firmware.  

#### `axes` - Axis words {#axes}
One or more axis letter: `X`, `Y`, `Z`, `A`, `B`, `C`, `U`, `V` or `W` from the range supported by the firmware followed by a value.

#### Required parameter
A command letter followed by a hyphen, e.g. `F-`. The hypen indicate a value is required.

#### Optional parameter
A command letter followed by a hyphen enclosed in angle brackets, e.g `<P->`. The hypen indicate a value is required.

<!-- add order of execution -->

---

## Single Meaning Command Words

These words have a specific, singular meaning in a G-code block. They can appear on their own or with other commands.

| Word | Description | Type |
|------|-------------|:-----|
| **`F-`** | Feed Rate. | Modal |
| **`S-`** | Spindle Speed. | Modal |
| **`T-`** | Tool Select. | Modal |
| **`O-`** | Label, Subprogram Name / Subprogram Number. | Non-modal |

### `F` – Feed Rate <!-- toc --> {#F}
Sets the velocity for motion (`G1`, `G2`, `G3`) in units per minute (`G94`) or units per revolution (`G95`).
#### Example
* _Set feed rate, then start the a move:_
	```gcode
	F500
	G1 X100
	```

### `S` – Spindle Speed <!-- toc --> {#S}
Sets the target RPM for the spindle. It is used by `M3` and `M4`.
#### Examples
* _Set spindle speed, then start the spindle:_
	```gcode
	S10000 
	M3
	```

### `T` – Tool Select <!-- toc --> {#T}
Pre-selects a tool number for a subsequent `M6` tool change command.
#### Examples
* _Pre-select tool number 5 for a later change:_
	```gcode
	T5
	( ... some cutting operations ... )
	M6 T5 (The `T5` here is optional if the tool is already pre-selected)
	```

### `O` – O-Code Labels and Subprograms <!-- toc -->

Documented [here](/docs/reference/o-code).

---

# G-Codes

G-codes primarily control the machine's motion, coordinate systems, and operational modes.

## `G0` – Rapid Positioning {#G0}

**Syntax:**  
> `G0 <axes>`  

Moves the machine at the maximum possible travel speed to a specified coordinate. `G0` is a non-cutting move intended to reduce job time by moving quickly between operations.

> ℹ️ **Info**
> - **Modal:** `G0` is part of the Motion Mode group. It remains active until another motion mode command (`G1`, `G2`, `G3`, etc.) is issued.
> - **Feed Rate:** The `F` word is ignored during a `G0` move; the machine always moves at its rapids rate, defined by settings `$110-$115` (Max rate) and `$120-$125` (Acceleration).
> - **Coordination:** All specified axes move together and will complete their travel at the same time.


| Parameter | Description |
|-----------|-------------|
| [axes](#axes) | Target coordinates. If no axis words are supplied the motion modal state is set. |

#### Examples
* _Move to X=100, Y=50 in machine rapids (absolute mode):_
	```gcode
	G90 G0 X100 Y50
	```
* _Move Z axis up by 10mm and rotate A axis to 90 degrees rapidly (incremental mode):_
	```gcode
	G91 G0 Z10 A90
	```
* _Full rapid move of a 5-axis machine:_
	```gcode
	G90 G0 X15.5 Y32.75 Z-2.0 B45 C-180
	```

> [!TIP]
> - Always ensure the path is clear before executing a `G0` command to avoid collisions. It's common practice to retract the Z-axis to a safe height first.
> - `G0` is functionally similar to a `G1` move with the feed rate set to maximum, but `G0` is the standard, more explicit, and safer way to command a rapid move.

---

## `G1` – Linear Interpolation {#G1}

**Syntax:**  
> `G1 <axes>`  

Moves the machine in a straight line at a defined feed rate (`F`). This is the primary command for cutting, engraving, printing, and any other material-affecting process.

> ℹ️ **Info**
> - **Modal:** `G1` is part of the Motion Mode group and will stay active until another motion command is issued.
> - **Feed Rate:** A feed rate ([F](#F) word) must be active for `G1` to execute. This can be set on the same line or a preceding line.
> - **Coordination:** All specified axes move in a synchronized straight line to their destination.

| Parameter | Description |
|-----------|-------------|
| [axes](#axes) | Target coordinates. If no axis words are supplied the motion modal state is set. |

#### Examples
* _Cut a straight line to X=200 at a feed rate of 500 mm/min:_  
	```gcode
	G1 X200 F500
	```
* _Perform a 4-axis tapered cut:_
	```gcode
	G1 X100 A30 F300
	```
* _Complex 6-axis move:_
	```gcode
	F150
	G1 X50 Y25 Z-5 A90 B45 C180
	```

> [!TIP]
> - The `F` value is modal. Once you set it, all subsequent `G1` moves will use that feed rate until a new `F` value is commanded.
> - To cut a simple line, you only need to specify the axes that are changing. `G1 X100` will move only the X-axis if the machine is already at the correct Y and Z position.

---

## `G2` & `G3` – Arc / Helical Interpolation {#G1-G2}

**Syntax:**  
> `G2 axes offsets <P-> (center format)`  
> `G2 axes R- (radius format)`  
> `G3 axes offsets <P-> (center format)`  
> `G3 axes R- (radius format)`  

Moves the machine along a circular arc (`G2` = Clockwise, `G3` = Counter-Clockwise) at the current feed rate. If a linear axis (like Z) is also commanded, it creates a helical motion.

> ℹ️ **Info**
> - **Modal:** Part of the Motion Mode group.
> - **Plane Selection:** Arcs are performed on the currently active plane (`G17` XY, `G18` XZ, `G19` YZ). The default is `G17` (XY plane).
> - **Two Forms:** Can be defined using either `R` (radius) or `I, J, K` (center offset) parameters.

| Parameter | Description |
|-----------|-------------|
| **`X, Y, Z`** | The destination coordinates of the arc on the selected plane. |
| **`I, J, K`** | **Offset Mode:** The X, Y, or Z offset from the *start point* to the arc's *center point*. `I` for X, `J` for Y, `K` for Z. Only the two axes on the active plane are used (e.g., `I` and `J` for the [G17](#G17-G18-G19) XY plane). |
| **`R`** | **Radius Mode:** The radius of the arc. Positive `R` for arcs  180°. |
| **`P`** | **Optional:** Number of full circles to make. See also the LinuxCNC documentation - the initial circle does not have to be complete. http://linuxcnc.org/docs/html/gcode/g-code.html#gcode:g2-g3 |

#### `IJK` (Offset) Mode Example
* _Cut a 90° clockwise arc in the XY plane from (0,0) to (10,10) with the center at (10,0):_
	```gcode
	G17 G90 (Select XY plane, absolute mode)  
	G0 X0 Y0 (Start at origin)  
	G2 X10 Y10 I10 J0 F200
	```

#### `R` (Radius) Mode Example
* _Cut a semicircle clockwise in the XY plane from (0,0) to (20,0) with a radius of 10:_
	```gcode
	G17 G90
	G0 X0 Y0
	G2 X20 Y0 R10 F200
	```

#### Helical Motion Example
* _Create a thread-like motion by adding a Z move to an arc:_
	```gcode
	G17 G21 G90
	F150
	G0 X0Y0Z0
	G2 X10 Y10 Z-5 I10 J0 P3 (Moves in an arc on XY while also moving down on Z)
	```

> [!TIP]
> - `IJK` mode is generally preferred as it's mathematically unambiguous. `R` mode can sometimes describe two possible arcs between two points; grblHAL follows the standard convention (positive `R` for the shorter arc, negative `R` for the longer arc).
> - Using `IJK` in `G91` (incremental) mode is very powerful for creating repeating patterns. The offsets are still calculated from the start point of the arc.

---

## `G4` – Dwell {#G4}

**Syntax:**  
> `G4 P-`  

Pauses the machine for a specified period of time. Any buffered motion is completed before the pause is executed.

> ℹ️ **Info**
> - **Non-Modal:** `G4` is active only for the block in which it appears.
> - **Purpose:** Useful for clearing chips at the bottom of a hole, allowing a spindle to reach full speed, etc.

| Parameter | Description |
|-----------|-------------|
| **`P`**   | Dwell time in seconds. |

#### Examples
* _Pause for 2.5 seconds:_  
  `G4 P2.5`

* _Drill a hole, then dwell at the bottom to break the chip:_
	```gcode
	G1 Z-10 F100  
	G4 P0.5  
	G0 Z5
	```

> [!TIP]
> - The `P` value can be a decimal.
> - Dwell commands are executed in order, so the machine will finish any preceding motion before the pause begins.

---

## `G5`, `G5.1` – Spline Interpolation {#G5-G5_1}

**Syntax:**  
> `G5 X- Y- Z- I- J- P-` (Quadratic Spline)  
> `G5.1 X- Y- Z- I- J- K- L-` (Cubic Spline)  

These commands enable the machine to move along complex curves defined by control points, rather than simple arcs. This is used for generating very smooth, fluid paths in advanced machining.


> ℹ️ **Info**
> - **Modal:** Part of the Motion Mode group.
> - **`G5` (Quadratic Spline):** Defines a quadratic spline segment. The path passes through the start point, the specified control point (often `I`, `J`), and the endpoint (`X`, `Y`, `Z`).
> - **`G5.1` (Cubic Spline):** Defines a cubic spline segment. This provides even greater control over the curve's shape, often using multiple control points.
> - **Reference:** For more detailed syntax and usage, refer to the [LinuxCNC documentation](http://linuxcnc.org/docs/html/gcode/g-code.html#gcode:g5).

| Parameter | Description |
|-----------|-------------|
| **`X, Y, Z`** | End point of the spline segment. |
| **`I, J, K, L`** | Control points for shaping the spline. The specific combination depends on the spline type and implementation. |
| **`P`** | For `G5`, defines the second control point (intermediate point). |

#### Example
* _Creating smooth curves using quadratic splines:_
	```gcode
	G90 G17
	G0 X0 Y0
	G5 I0 J30 P0 Q-30 X10 Y10 F500
	P0 Q-30 X20 Y20
	G0
	M30
	```

> [!TIP]
> - Spline commands are typically generated by CAM software for free-form surface machining (e.g., 3D carving, mold making) where smooth transitions are critical.
> - Manual programming of splines is complex due to the mathematical nature of control points.
> - Although `G5` and `G5.1` are supported, elliptical arcs cannot be generated using scaling with `G51`.

---

## `G7`, `G8` – Lathe Diameter / Radius Mode {#G7-G8}

**Syntax:**  
> `G7` (Diameter Mode)  
> `G8` (Radius Mode)  

These commands are used exclusively in lathe operations to define whether X-axis movements are interpreted as changes in the workpiece's radius or diameter.

> ℹ️ **Info**
> - **Modal:** Part of the Lathe Diameter Mode group. Only active if grblHAL is configured with lathe support (setting [$32=2](settings#32)).
> - **`G7` (Diameter Mode):** All X-axis coordinates and movements are interpreted as diameters. If you command `G1 X50`, the tool moves to a position where the workpiece diameter will be 50 units.
> - **`G8` (Radius Mode):** All X-axis coordinates and movements are interpreted as radii. If you command `G1 X25`, the tool moves to a position where the workpiece radius will be 25 units (meaning a 50-unit diameter).

#### Examples
* _Turn a shaft to a 20mm diameter:_
	```gcode
	G7 (Ensure diameter mode is active)  
	G0 X20 Z0` 
	G1 Z-50 F0.1
	```
* _Face a part, defining moves by radius:_
	```gcode
	G8 (Ensure radius mode is active)  
	G0 X25 Z0 (Move to 25mm radius, 50mm diameter)  
	G1 X0 F0.1 (Face to center)
	```

> [!TIP]
> - Always explicitly set the plane to [G18](#G17-G18-G19) and `G7` or `G8` at the beginning of a lathe program to avoid misinterpreting X-axis movements.
> - Most CAM software for lathes will output G-code in diameter mode (`G7`).
> - The machine coordinates always display in terms of radius.

---

## `G10 L2` & `G10 L20` – Set Coordinate System Data {#G10L2-G10L20}

**Syntax:**  
> `G10 L2 P- axes` (absolute)  
> `G10 L20 P- axes` (relative)  

Provides a way to programmatically set and offset work coordinate systems (G54-G59.3). This is an advanced feature that allows for precise, repeatable fixture setups without manually touching off each time.

> ℹ️ **Info**
> - **Non-Modal.**
> - `L2` sets the specified coordinate system's origin *relative to the machine origin*.
> - `L20` sets the specified coordinate system's origin *based on the current position*.

| Parameter | Description |
|-----------|-------------|
| **L2** or **L20** | Specifies the "set data" mode. `L2` for absolute, `L20` for relative. |
| **P** | The work coordinate system to modify (1=`G54`, 2=`G55`, ... 9=`G59.3`). |
| [axes](#axes)| The coordinate values to set for the origin of the selected system. |

#### `G10 L2` Example
* _Set the G55 origin to X=100, Y=250.5, Z=-20 from the machine's home position:_  
  `G10 L2 P2 X100 Y250.5 Z-20`  
  (Now, when `G55` is active, a `G0 X0 Y0` command will move the machine to machine coordinates X=100, Y=250.5)

#### `G10 L20` Example
* _Move to a fixture location and set G56 to that exact spot:_  
	```gcode
	G53 G0 X300 Y150 (Move to the desired origin in machine coordinates)  
	G10 L20 P3 X0 Y0 Z5 (Set the G56 origin. The current XY is now G56's X0Y0. Z is set to 5)
	```

> [!TIP]
> - `G10` is extremely powerful for automated setups, especially with multiple identical fixtures.
> - The values are stored persistently so they survive a reset.
> - You can omit axes. `G10 L2 P1 X50` will only change the X value for `G54` and leave Y, Z, etc., unchanged.
> - `G59.1`, `G59.2` and `G59.3` can be [locked](./settings/#486) against accidental change.

---

## `G10 L0`, `G10 L1`, `G10 L10` and `G10 L11` – Reload/Set Tool table Data {#G10L0-G10L1-G10L10-G10L11}

**Syntax:**  
> `G10 L0` (reload tool table)
> `G10 L1 P- axes <R->` (set tool table data)
> `G10 L10 P- axes <R->` (set tool table data from current offsets)
> `G10 L11 P- axes <R->` (set tool table data from G59.3 offset)

Provides a way to programmatically set and reload tool table data.
Requires grblHAL to be compile with tool table support.

> ℹ️ **Info**
> - **Non-Modal.**
> - `L2` sets the specified coordinate system's origin *relative to the machine origin*.
> - `L20` sets the specified coordinate system's origin *based on the current position*.

| Parameter | Description |
|-----------|-------------|
| **P**     | Tool number, must be > 0. |
| **R**     | Optional radius of tool.  |
| [axes](#axes)| The coordinate values to set for the origin of the selected system. |

#### `G10 L2` Example
* _Set the G55 origin to X=100, Y=250.5, Z=-20 from the machine's home position:_  
  `G10 L2 P2 X100 Y250.5 Z-20`  
  (Now, when `G55` is active, a `G0 X0 Y0` command will move the machine to machine coordinates X=100, Y=250.5)

#### `G10 L20` Example
* _Move to a fixture location and set G56 to that exact spot:_  
	```gcode
	G53 G0 X300 Y150 (Move to the desired origin in machine coordinates)  
	G10 L20 P3 X0 Y0 Z5 (Set the G56 origin. The current XY is now G56's X0Y0. Z is set to 5)
	```

> [!TIP]
> - Setting tool offsets or reloading the tool table does _not_ change the offset of the current tool. Use G43 or G43.1 to do that.
> - The values are stored persistently so they survive a reset.
> - You can omit axes. `G10 L2 P1 X50` will only change the X value for `G54` and leave Y, Z, etc., unchanged.

---

## `G17`, `G18`, `G19` – Plane Selection {#G17-G18-G19}

**Syntax:**  
> `G17` (XY plane)  
> `G18` (XZ plane)  
> `G19` (YZ plane)  

Selects the active plane for circular interpolation (`G2`/`G3`), cutter compensation, and some canned cycles. This determines which pair of axes an arc will be drawn on.

> [!TIP]
> - **Modal:** Belongs to the Plane Select modal group. `G17` is the default on startup.
> - **`G17`**: XY Plane (most common for 2.5D CNC work). Arcs use `I` (X offset) and `J` (Y offset).
> - **`G18`**: XZ Plane (used for lathes or profiling on the side of a part). Arcs use `I` (X offset) and `K` (Z offset).
> - **`G19`**: YZ Plane. Arcs use `J` (Y offset) and `K` (Z offset).


| Command | Selected Plane | Arc Center Offsets |
|---------|----------------|--------------------|
| **`G17`** | **XY**         | `I` (for X), `J` (for Y) |
| **`G18`** | **XZ**         | `I` (for X), `K` (for Z) |
| **`G19`** | **YZ**         | `J` (for Y), `K` (for Z) |

#### Examples
* _Standard milling operation in the XY plane:_
	```gcode
	G17
	G2 X10 Y15 I5 J0 F300
	```
* _Creating an arc on the front face of a part (XZ plane):_
	```gcode
	G18
	G3 X20 Z-5 I10 K0 F250
	```

> [!TIP]
> - Always explicitly set your plane at the beginning of a program or after a tool change to avoid unexpected arc movements.
> - Even if you are not cutting arcs, some canned cycles may behave differently depending on the active plane.
> - The non-selected axis can still be moved during an arc command, resulting in helical motion. For example, `G17 G2 X10 Y10 I10 J0 Z-5` creates a circular ramp.

---

## `G20`, `G21` – Unit Selection {#G20-G21}

**Syntax:**  
> `G20` (inches)  
> `G21` (millimeters)  

Sets the G-code interpreter's units for all position, feed rate, and offset data.

> ℹ️ **Info**
> - **Modal:** Part of the Units modal group. The setting is persistent and will remain active until changed.
> - **`G20`**: Inches. All values are interpreted as inches, and feed rates are in inches/minute.
> - **`G21`**: Millimeters. All values are interpreted as millimeters, and feed rates are in mm/minute.

#### Examples
* _Set the machine to work in millimeters:_ 
	```gcode
	G21
	G1 X100 F500  (Moves to X=100mm at 500mm/min)
	```
* _Set the machine to work in inches:_
	```gcode
	G20
	G1 X4 F20 (Moves to X=4in at 20in/min)
	```

> [!TIP]
> - It is critical safety practice to include either `G20` or `G21` at the very beginning of every G-code file. This prevents misinterpreting a 10mm move as a 10-inch move, which could cause a crash.
> - This setting affects how *grblHAL interprets G-code*, but does not change the machine's internal step/mm settings (`$100`, etc.).
> - Also checkout `$13` [Report in Inches (boolean)](./settings#13)

---

## `G28`, `G30` – Go to Pre-Defined Position {#G28-G30}

**Syntax:**  
> `G28 <axes>`  
> `G30 <axes>`  

Commands the machine to perform a rapid move to a stored, user-defined position. This is often used as a safe "home" or tool change position.

> [!WARNING]
> Do not use `G28` or `G30` unless the machine has been homed (`$H`) or its absolute machine position is otherwise reliably known. Executing these commands on an unhomed machine can lead to unexpected movements and potential crashes.

> ℹ️ **Info**
> - **Non-Modal.**
> - The command is a two-part move. First, it moves to the specified intermediate coordinate (`X`, `Y`, `Z`, etc.), then it moves to the final stored position for all axes.
> - If no intermediate coordinate is given, it moves all axes directly to the stored position.
> - The positions for `G28` and `G30` are set with `G28.1` and `G30.1`, respectively.
> - The values persist after E-stop resets, settings updates, and power-offs. They are based on the machine coordinates and relate to your homing position.

| Command | Parameter(s) | Description |
|---------|----------------|-------------|
| **`G28`** | `X,Y,Z..` (optional) | Moves to the `G28` stored position. |
| **`G30`** | `X,Y,Z..` (optional) | Moves to the `G30` stored position. |

#### Examples
* _Go directly to the G28 position:_  
	```gcode
	G28
	```
* _Go to the G28 position via an intermediate point (e.g., to lift Z first for safety):_  
	```gcode
	G28 Z0 (First moves Z to 0 in the current WCS, then moves all axes to the stored `G28` position)
	```
* _Go to the second saved position, G30:_  
	```gcode
	G30
	```

> [!TIP]
> - The pre-defined positions are stored in machine coordinates.
> - A common use case is `G53 G0 Z0` followed by `G28`. This ensures the Z-axis is fully retracted in machine coordinates before moving to the `G28` XY position, which is a very safe sequence.

---

## `G28.1`, `G30.1` – Set Pre-Defined Position {#G28_1-G30_1}

**Syntax:**  
> `G28.1`  
> `G30.1`

Stores the machine's current absolute position as the `G28` or `G30` pre-defined location.

> ℹ️ **Info**
> - **Non-Modal.**
> - This command captures the machine's current coordinates at the moment of execution and saves them persistently.

#### Examples
* _Move to a safe tool change location and store it as G28:_
	```gcode
	G53 G0 X-50 Y-50 Z-5 (Move to a safe spot in machine coordinates)
	G28.1 (Store this position)
	```
* _Set a position at the front of the machine for easy access as G30:_
	```gcode
	G53 G0 X-200 Y-400 Z-10
	G30.1
	```

> [!TIP]
>  Before running `G28.1` or `G30.1`, it's best to move the machine using `G53` (move in machine coordinates) to ensure you are setting the position precisely where you want it, independent of any work offsets.

---

## `G38.2`, `G38.3`, `G38.4`, `G38.5` – Probing {#G38_2-G38_3-G38_4-G38_5}

**Syntax:**  
> `G38.2 axes`  
> `G38.3 axes`  
> `G38.4 axes`  
> `G38.5 axes`  

Performs a straight probing operation. The machine moves along a specified path until a connected probe input changes state (e.g., makes or breaks contact). The machine stops and records the trigger coordinate.

> ℹ️ **Info**
> - **Non-Modal.**
> - **`G38.2`**: Probe toward workpiece, stop on contact, signal error if no contact.
> - **`G38.3`**: Probe toward workpiece, stop on contact, no error if no contact.
> - **`G38.4`**: Probe away from workpiece, stop on loss of contact, signal error if it starts un-triggered.
> - **`G38.5`**: Probe away from workpiece, stop on loss of contact, no error if it starts un-triggered.

| Parameters | Description |
|------------|-------------|
| [axes](#axes) | The destination coordinates of the probe move. The probe will stop short if it triggers. |

#### Examples
* _Probe down in Z to find the top of a workpiece:_
	```gcode
	G91 G38.2 Z-20 F100 (Probe down 20mm at 100mm/min. Will stop when the probe touches.)
	```
* _Find the center of a bore by probing in two directions:_
	```gcode
	G38.2 X-10 F50 (Probe left)
	; Record position
	G0 X1 (Move away slightly)
	G38.2 X10 F50 (Probe right)
	; Record position and calculate center
	```

<!-- add subprogram example -->

> [!TIP]
> - Upon successful probing, grblHAL reports the trigger position, it can also be accessed via the `$#` system command.
> - Probing result and coordinates is also stored in [parameters](./parameters/#predefined-numbered-parameters) `5070` and `5060 - 5069`.
> - Use a slow feed rate (`F`) for probing to get accurate results and prevent damage to the probe tip. A common practice is to perform a fast probe to find the surface, back off slightly, then perform a second, much slower probe for high accuracy.
> - `G38.3` is useful for checking if a tool is present or finding the edge of a part when you don't know exactly where it is.

---

## `G40` – Cancel Cutter Radius Compensation {#G40}

**Syntax:**  
> `G40`  

Disables cutter radius compensation (`G41`/`G42`). This is the default state.

> ℹ️ **Info**
> - **Modal:** Part of the Cutter Compensation group.
> - It is recommended to issue a `G40` at the beginning and end of all CNC programs to ensure a known state.

> [!NOTE]
> If grblHAL is compiled without cutter compensation support this command does nothing, it is included for compatibility and to ensure a known state.

---

## `G41, G42` – Cutter Compensation {#G41-G42}

**Syntax:**  
> `G41 <D->` (left of programmed path)  
> `G42 <D->` (right of programmed path)

| Parameter | Description                                                                               |
|-----------|-------------------------------------------------------------------------------------------|
| **D**     | Optional tool number, if not provided the radius of the currenly loaded tool will be used |

> ℹ️ **Info**
> - **Modal:** Part of the Cutter Compensation group.
> - Require firmware with tool table support enabled.
> - Currenly [available as a plugin](https://github.com/JasonTitcomb/grblHALCutterComp#readme), made by @JasonTitcomb.

---

## `G41.1, G42.2` – Dynamic Cutter Compensation {#G41_1-G42_1}

**Syntax:**  
> `G41.1 D-` (left of programmed path)  
> `G42.1 D-` (right of programmed path)

| Parameter | Description     |
|-----------|-----------------|
| **D**     | Cutter diameter |

> ℹ️ **Info**
> - **Modal:** Part of the Cutter Compensation group.
> - Currenly [available as a plugin](https://github.com/JasonTitcomb/grblHALCutterComp#readme), made by @JasonTitcomb.

---
## `G43` – Tool Length Offset {#G43}

**Syntax:**  
> `G43 <H->`  

Apply tool length offset from tool table data.

> ℹ️ **Info**
> - **Modal:** Part of the Tool Length Offset group.
> - `G43` is only available if grblHAL is compiled with tool table support.

| Parameter | Description |
|-----------|-------------|
| **`H`**   | Tool number, must be a tool number in the tool or if left out the current tool number is used. |

#### Examples
* _Cancel the tool offset before a tool change:_
	```gcode
	G49
	M6 T2
	```
* _Apply the Z-length offset for tool #1 from the tool table:_
	```gcode
	T1 M6 (Change to tool 1)
	G43 H1 (Apply its stored offset)
	```

> [!TIP]
> - `G49` should be commanded before any tool change (`M6`) and at the end of a program.

---

## `G43.1`, `G43.2`, `G49` – Tool Length Offsets

**Syntax:**  
> `G43.1 axes`  
> `G43.2 axes`  
> `G49`  

Applies or removes a tool length offset, primarily along the Z-axis. This allows the machine to compensate for tools of different lengths without changing the G-code program.

> ℹ️ **Info**
> - **Modal:** Part of the Tool Length Offset group.
> - **`G43.1`**: Dynamic Tool Length Offset. Applies the offset specified by the `Z`, `A`, `B`, `C`, or other axis word. This is a powerful, flexible way to manage tool lengths.
> - **`G43.2`**: Additional Tool Length Offset. Applies a secondary offset, which can be stacked on top of the current offset.
> - **`G49`**: Cancel Tool Length Offset. Removes any active tool length offset.
> - **Tool Table Integration (`G43 H-`):** If a tool table is enabled, `G43` (without `.1` or `.2`) can be used with an `H` word (e.g., `G43 H1`) to apply the Z-length offset stored for the tool number specified by the `H` word. The `H` word generally should match the active tool number.

| Command | Description |
|---------|-------------|
| **`G43.1`** | Applies a dynamic offset to the specified axis. For example `G43.1 Z10` shifts the Z-axis origin by 10 units. |
| **`G43.2`** | Applies an additional (additive) offset. |
| **`G49`**   | Cancels all active tool length offsets. |

| Parameters | Description |
|------------|-------------|
| [axes](#axes) | The coordinate values to set. |

#### Examples
* _Load a tool that is 5.2mm longer than the master tool:_
	```gcode
	G43.1 Z5.2 (All subsequent Z moves will be adjusted by +5.2mm)
	```
* _Cancel the tool offset before a tool change:_
	```gcode
	G49
	M6 T2
	```

> [!TIP]
> - `G49` should be commanded before any tool change (`M6`) and at the end of a program.
> - `G43.1` in grblHAL applies the offset directly. For example, after probing a new tool, a macro can calculate the difference and issue the correct `G43.1` command.
> - When a tool table is used, `G43 H` becomes the normal way to apply offsets as it looks up the offsets to use from the tool table.

---

## `G50`, `G51` – Coordinate System Scaling {#G50-G51}

**Syntax:**  
> `G50` (cancel scaling)  
> `G51 axes` (apply scaling)  

These commands enable or disable scaling of coordinate systems. This allows G-code programs to be run at different sizes or even mirrored, without modifying the original program.

> ℹ️ **Info**
> - **Modal:** Part of the Scaling group. `G50` is the default.
> - **grblHAL Implementation:** grblHAL implements the Mach3 version of `G50`/`G51`. There is a compile-time option to enable a different (Fanuc-style) version.
> - **`G51` (Apply Scaling):** Scales subsequent motion commands by a factor specified for each axis. A value of `-1` for an axis will mirror (flip) that axis. It is not permitted to use unequal scale factors to produce elliptical arcs with [G2](#G2) or [G3](#G3).
> - **`G50` (Cancel Scaling):** Disables any active scaling, returning the coordinate system to its unscaled state.
> - **Visual Cue:** When scaling is active, some senders like ioSender may display a yellow dot behind the axis DRO (Digital ReadOut).

| Parameters | Description |
|------------|-------------|
| [axes](#axes) | The scaling values to set. |

#### Examples
* _Run a job at half size:_
	```gcode
	G51 X0.5 Y0.5 Z0.5
	(G-code for the part)  
	G50 (Cancel scaling)
	```
* _Mirror a PCB drilling pattern along the X-axis:_
	```gcode
	G51 X-1  
	(G-code for drilling holes)` 
	G50
	```

> [!TIP]
> - Scaling applies to all subsequent motion commands until `G50` is issued.
> - It's a powerful feature for design adjustments or creating mirrored parts without complex CAM operations.

---

## `G53` – Move in Machine Coordinates {#G53}

**Syntax:**  
> `G53 G0 axes`  
> `G53 G1 axes `

Executes a linear or rapid move in the absolute machine coordinate system, temporarily ignoring any work coordinate systems (`G54`, etc.) and offsets.

> ℹ️ **Info**
> - **Non-Modal:** `G53` is only active for the block in which it is commanded.
> - It must be combined with a motion command like [G0](#G0) or [G1](#G1).

| Parameters | Description |
|------------|-------------|
| [axes](#axes) | The target coordinates in the machine's absolute reference frame. |

#### Examples
* _Rapidly move the Z-axis to its highest point (machine Z=0) regardless of work offsets:_ 
	```gcode
	G53 G0 Z0  (A very common safety move)
	```
* _Move to a specific fixture point for a tool probe, using machine coordinates for consistency:_
	```gcode
	G53 G0 X-10 Y-10
	```

> [!WARNING]
> Machine should be homed before using this command.

> [!TIP]
> - `G53` is the most reliable way to move to a known, fixed position on the machine (like a tool change station or probing location) because it is not affected by any offsets.
> - The next block of G-code will revert to the previously active work coordinate system.

---

## `G54` to `G59.3` – Work Coordinate Systems (WCS) {#G5x_WCS}

**Syntax:**  
> `G54`  
> `G55`  
> `G56`  
> `G57`  
> `G58`  
> `G59`  
> `G59.1`  
> `G59.2`  
> `G59.3`  

Selects one of the available work coordinate systems. A WCS defines a user-programmable origin (X0, Y0, Z0, etc.) for a specific job or fixture. This separates the program's zero point from the machine's home position.

> ℹ️ **Info**
> - **Modal:** Part of the WCS group. `G54` is typically the default.
> - grblHAL supports 9 work coordinate systems:
> - `G54` (P1)
> - `G55` (P2)
> - `G56` (P3)
> - `G57` (P4)
> - `G58` (P5)
> - `G59` (P6)
> - `G59.1` (P7)
> - `G59.2` (P8)
> - `G59.3` (P9) - **Note:** Used by Tool Change Modes 2 & 3 as the toolsetter position.

#### Example
* _Running a job on two different vices on the machine bed:_
	```gcode
	G10 L20 P1 X0 Y0 Z0 (Set G54 origin on the first vice)  
	G10 L20 P2 X150 Y0 Z0 (Set G55 origin on the second vice, 150mm to the right)

	G54  
	(run g-code for part 1)

	G55
	(run the same g-code for part 2)
	```

> [!TIP]
> - The origins for each WCS are set using the `G10 L2` or `G10 L20` commands or through the GUI by "zeroing" the axes.
> - WCS values are stored persistently.
> - Use different WCS for different fixtures, or even for different sides of the same part in a multi-stage operation.

---

## `G61` – Path Control Mode {#G61}

**Syntax:**  
> `G61` (exact stop)  

<!-- add proper documentation -->

These commands control how the machine handles corners and transitions between sequential motion commands. This choice is a trade-off between speed and accuracy.

> ℹ️ **Info**
> - **Modal:** Part of the Control Mode group.
> - **`G61` (Exact Stop Mode):** The machine comes to a full stop at the end of each programmed move before starting the next. This ensures every corner is perfectly sharp but can cause jerky motion and slow down jobs significantly.

#### Examples
* _Engraving a precise technical drawing with sharp corners:_
	```gcode
	G61
	(G-code for drawing)
	```

> [!TIP]
> - For most applications (2D profiling, 3D carving), `G64` is the preferred mode as it results in faster and smoother operation.
> - Use `G61` only when absolute corner sharpness is required, such as inlays or mechanical parts with tight tolerances. Be aware that it can leave "witness marks" or small circular divots at each corner on some materials due to the momentary stop.

---

## `G65` – Subprogram Call with Arguments {#G65}

**Syntax:**  
> `G65 P- <L-> <A- B- C- ...>`  

`G65` allows calling a subprogram (macro) and passing arguments to it. This is a common feature in industrial controllers, enabling highly parameterized and reusable code.

> ℹ️ **Info**
> - **User-provided macros should generally start with a `P` word value of 100 or greater** to avoid conflicts with [built-in subprograms](/docs/reference/o-code#built-in-g65-subprograms) (currently P1-P7).
> - **Argument Passing:** Arguments (e.g., `A`, `B`, `C`, `X`, `Y`, `Z`, etc.) passed with `G65` are assigned to named variables within the called subprogram.
> - **Nesting:** Nesting of `G65` macros is allowed.
> - **Reference:** For more details on G65 macros, refer to the [G65 and G66 documentation](./o-code#g65-and-g66). Also, a reference for G65 in other systems: [cnczone.com](https://www.cnczone.com/forums/attachments/2/0/6/1/9/22462.attach).

#### Subprogram Example (P100+)

* _Call a custom macro `P100.macro` to drill a hole with a specific depth and feed rate:_  
Content of P100.macro, stored in a local (controller based) file system:  
	```gcode
	#<depth> = #1 ; A argument (drill depth)
	#<feed> = #2 ; B argument (feed rate)  
	G91 G1 Z-#<depth> F#<feed>
	G0 Z#<depth>
	M99` (Return from subprogram)
	```
	Main program, can be sent from a sender or run from a local file system:  
	```gcode
	G0 X10 Y10`  
	G65 P100 A5.0 B200` (Call P100.macro, drill 5mm deep at 200mm/min)  
	G0 X20 Y20`  
	G65 P100 A8.0 B150` (Call P100.macro, drill 8mm deep at 150mm/min)
	M30
	```

> [!TIP]
> - `G65` is a powerful tool for creating reusable, modular G-code for complex operations.
> - Variables are assigned to [numbered parameters](./o-code#g65-and-g66) based on their letter, e.g., `A` maps to `#1`, `B` to `#2`, `X` to `#24`, etc.
> - **Reserve P1-P99 for built-in macros** - Start your custom macros at P100 or higher.

---

## `G66`, `G67` – Modal Subprogram Call {#G66-G66}

**Syntax:**
> `G66 P <L-> <A- B- C- ...>`
> `G67`

`G66` acts like `G65` but is **modal**. The specified macro is called after every subsequent motion command (`G0`, `G1`, `G2`, `G3`, etc.) until cancelled by `G67`.

See [Subprograms](./o-code#g65-and-g66).

---
## `G76`, `G81` to `G89` – Canned Cycles {#canned-cycles}

**Syntax:**  
> `G81 Z- R-`  
> `G82 Z- R- P-`  
> `G83 Z- R- Q-`  
> `G73 Z- R- Q-`  
> `G85 Z- R-`  
> `G86 Z- R-`  
> `G89 Z- R- P-`  
> `G76 Z- R- I- J- K- L- P- Q- F-` (Lathe Threading)  
<!--- G76 should be documented separately --->
<!--- Add modal behaviour --->

Canned cycles are powerful shortcuts that combine several distinct movements into a single G-code command, typically for hole-making operations like drilling, boring, and tapping. Instead of programming each feed, retract, and rapid move manually, you define the cycle's parameters once. The cycle then repeats at every new coordinate provided until a `G80` (Cancel Canned Cycle) is issued.

> ℹ️ **Info**
> - **Modal:** Once a canned cycle is active, it remains active. Every new position command for the axes on the active plane (`X` and `Y` in `G17`) will execute the full cycle at that location.

| Parameters | Description |
|:-----------|:------------|
| **`Z`** | The final depth of the hole (absolute or incremental).|
| **`R`** | The retract position (the Z-height to which the tool rapids before starting the feed move).|
| **`P`** | Dwell time (in seconds) at the bottom of the hole (used in `G82`, `G89`).|
| **`Q`** | The peck depth for each cutting feed in `G73` and `G83`.|
| **`F`** | The feed rate for the cutting portions of the cycle.|
| **`L`** | **Optional:** Number of repeats (?).|

> - **Return Behavior:** The return height after the cycle is controlled by [G98 and G99](#G98-G99).
> - **`G76` (Threading Cycle) and `G33` (Spindle Synced Motion):** These specialized lathe threading and spindle-synchronized cycles require a **spindle encoder** to synchronize spindle rotation with axis motion. Few grblHAL drivers/boards currently support this hardware requirement.

#### Available Cycles in grblHAL
*   **`G81`**: Simple Drilling Cycle. Rapids to R, feeds to Z, rapids out.
*   **`G82`**: Drilling Cycle with Dwell. Same as `G81` but dwells at the bottom of the hole for time `P`.
*   **`G83`**: Peck Drilling Cycle (Deep Hole). After each peck of depth `Q`, the drill fully retracts out of the hole to clear chips.
*   **`G73`**: Peck Drilling Cycle (Chip Breaking). After each peck of depth `Q`, the drill retracts a small, fixed amount to break the chip, but does not exit the hole.
*   **`G85`**: Boring Cycle. Feeds to Z, then feeds back out to R. Leaves a high-quality surface finish.
*   **`G86`**: Boring Cycle. Feeds to Z, stops spindle, rapids out.
*   **`G89`**: Boring Cycle with Dwell. Feeds to Z, dwells for time `P`, feeds back out to R.
*   **`G76`**: Threading Cycle (Lathe). A specialized cycle for cutting threads.

#### Example (`G81`)
* _Drill three holes at X10, X20, and X30:_
	```gcode
	G90 G21 (Absolute mode, millimeters)
	G0 X0 Y0 Z5 (Start above the workpiece)
	G99 (Set return plane to R-level)
	G81 Z-10 R2 F150 (Define the cycle: drill to Z-10, retract plane is Z+2, feed 150)
	X10 Y10 (Drills the first hole here)
	X20 (Drills the second hole at X20, Y10)
	X30 (Drills the third hole at X30, Y10)
	G80 (Cancel the cycle)
	G0 Z5 (Safely retract Z)
	```

---

## `G80` – Cancel Canned Cycle {#G80}

**Syntax:**  
> `G80`

Immediately cancels any active canned cycle mode (`G81`-`G89`). It is a critical safety command to ensure that subsequent motion commands are not interpreted as part of a cycle.

> ℹ️ **Info**
> - **Modal:** Part of the Motion Mode group. It reverts the machine to `G1` (Linear Motion) behavior.
> - Always use `G80` after a series of canned cycle operations.
> - Issuing any new motion command from the Motion Mode group (e.g., `G0`, `G1`, `G2`, `G3`) will also cancel an active canned cycle. For `G0` and `G1` commands, axis parameters are optional, meaning `G0` or `G1` on a line by itself will also cancel the canned cycle.

#### Example
* _Drill a series of holes and then cancel the cycle to move to a new area:_ 
	```gcode
	G81 Z-10 R2 F100` (Start drilling cycle)  
	X10  
	X20  
	G80 (Cancel the drilling cycle)
	G0 X50 Y50 (Now a normal rapid move)
	```

---

## `G90`, `G91` – Distance Mode {#G90-G91}

**Syntax:**  
> `G90` (absolute)  
> `G91` (incremental)  

Controls how coordinate values (`X`, `Y`, `Z`, etc.) are interpreted by the machine. This is one of the most fundamental G-code concepts.

> ℹ️ **Info**
> - **Modal:** Part of the Distance Mode group. This setting is persistent. `G90` is the default.
> - **`G90` (Absolute Mode):** All coordinate values are interpreted as a position relative to the current work coordinate system's origin (e.g., `X10` means "move to the X=10 line").
> - **`G91` (Incremental Mode):** All coordinate values are interpreted as a distance *from the current position* (e.g., `X10` means "move 10 units in the positive X direction from where you are now").

#### Examples
* _Moving to a specific point (10, 20) using Absolute mode:_
	```gcode
	G90
	G0 X10 Y20
	```
* _Moving a rectangle 50 units wide and 30 units tall using Incremental mode:_
	```gcode
	G91
	G1 X50 F300 (Move right 50)
	G1 Y30 (Move up 30)
	G1 X-50 (Move left 50)
	G1 Y-30 (Move down 30)
	```

> [!TIP]
> - Most CAM software generates code in `G90` (Absolute) mode.
> - `G91` is extremely useful for writing simple, repeatable subroutines and macros, such as probing routines or patterns, because they work correctly regardless of where they are started.
> - It is good practice to explicitly state `G90` or `G91` at the beginning of a program.

---

## `G92`, `G92.1`, `G92.2` and `G92.3` – Coordinate System Offset {#G92-G92_1-G92_2-G92_3}

**Syntax:**  
> `G92 axes`  
> `G92.1` (cancel offset)  
> `G92.2` (suspend offset)  
> `G92.3` (restore offset)  

`G92` applies a temporary, "volatile" offset to the machine's coordinate system. It makes the machine believe its current position is the value specified in the command. This is an older method of setting a work zero and is often discouraged in favor of `G10` and the persistent `G54-G59` work coordinate systems.

> ℹ️ **Info**
> - **Modal.**
> - **`G92`**: Apply an offset. For example, `G92 X0 Y0` tells the machine "your current location is now X0, Y0".
> - **`G92.1` or `G92.2`**: Clear any active `G92` offset, restoring the original coordinate system.
> - **`G92.3`**: Restore a previously-cleared `G92` offset.

#### Example
* _Temporarily set the corner of a workpiece as the origin:_
	```gcode
	G0 X100 Y50 (Move to the physical corner)  
	G92 X0 Y0 Z0 (Tell grblHAL this spot is now the origin)  
	(All subsequent moves are relative to this new temporary zero)
	...
	G92.1 (Clear the offset and return to the underlying G54/etc. system)
	```

> [!WARNING]
> `G92` offsets are easy to forget about and can lead to unexpected crashes. It's often safer to use a dedicated Work Coordinate System like `G55` for temporary setups.

> [!TIP]
> - A `G92` offset is applied *on top of* the active G54-G59 WCS.
> - Some legacy CAM posts still use `G92`, particularly for multi-axis machines to reset a rotary axis's position (e.g., `G92 A0`).
> - Setting [$384](./settings#384) controls `G92` offset persistence.

---

## `G93`, `G94`, `G95` – Feed Rate Mode {#G93-G94-G95}

**Syntax:**  
> `G93` (inverse time)  
> `G94` (units per minute)  
> `G95` (units per revolution)  

Determines how the [F](#F) word (feed rate) is interpreted.

> ℹ️ **Info**
> - **Modal:** Part of the Feed Rate Mode group. `G94` is the default and most common mode for milling.
> - **`G93` (Inverse Time Mode):** The `F` word represents "1 / minutes". The feed rate is calculated so that the move completes in `1/F` minutes. This is mainly used in 5-axis simultaneous motion where maintaining a constant tool-tip speed is complex.
> - **`G94` (Units Per Minute Mode):** The `F` word is interpreted directly as linear units (mm or inches) per minute. This is the standard for most CNC mills, routers, and 3D printers.
> - **`G95` (Units Per Revolution Mode):** The `F` word is interpreted as linear units per spindle revolution. This is the standard for CNC lathes, where chip load is directly tied to RPM.

| Command | Feed Rate Interpretation | Primary Use |
|---------|--------------------------|-------------|
| **`G93`** | 1 / minutes (Inverse Time) | 5-Axis Simultaneous Machining |
| **`G94`** | Units / Minute           | Milling, Routing, 3D Printing |
| **`G95`** | Units / Revolution       | Lathes, Threading |

#### Examples
* _Standard milling at 500 mm/min:_ 
	```gcode
	G94 
	G1 X100 F500
	```
* _Lathe turning at 0.2 mm per revolution:_
	```gcode
	G95
	S1000 M3 (Spindle at 1000 RPM)
	G1 Z-50 F0.2 (The effective feed rate is 1000 RPM * 0.2 mm/rev = 200 mm/min)
	```
---

## `G96`, `G97` – Spindle Speed Mode {#G96-G97}

**Syntax:**  
> `G96` (constant surface speed)  
> `G97` (constant RPM)  

Controls how the [S](#S) word (spindle speed) is interpreted. This is primarily for CNC lathes but can be useful in other specialized applications.

> ℹ️ **Info**
> - **Modal:** Part of the Spindle Speed Mode group. `G97` is the default.
> - **Lathe Mode Only:** `G96` and `G97` are only available if grblHAL is compiled with lathe support.
> - **`G96` (Constant Surface Speed - CSS):** The `S` word defines a desired surface speed (e.g., meters per minute in mm mode or feet per minute in inch mode). The controller will continuously adjust the spindle RPM based on the X-axis diameter to maintain this speed at the cutting edge. A maximum RPM must be set using `G50 S-` (Mach3 syntax) or by a `D` word on the `G96` line (e.g., `G96 S150 D1000`).
> - **`G97` (Constant RPM Mode):** The `S` word is interpreted directly as revolutions per minute. The spindle speed is fixed until a new `S` command is issued. This is used for operations like drilling and tapping where a constant RPM is required.

#### Example (Lathe)
* _Facing a part on a lathe with a surface speed of 150 m/min:_
	```gcode
	G50 S4000 (Limit the spindle to a max of 4000 RPM for safety)
	G96 S150 M3 (Turn on CSS mode at 150 m/min)
	G1 X0 F0.2 (As X moves from a large diameter to zero, RPM will increase to maintain S150)
	```

> [!TIP]
> - Always use `G97` for drilling, tapping, and threading operations, as a constant, known RPM is required. `G97 S800 M3`.
> - `G96` provides a better surface finish and improved tool life on lathes when diameter is changing significantly.
> - Set a prudent RPM limit (with `G50 S-` or `D-` word) when using `G96` to prevent the spindle from exceeding safe speeds at small diameters.

---

## `G98`, `G99` – Canned Cycle Return Mode {#G98-G99}

**Syntax:**  
> `G98` (return to initial level)  
> `G99` (return to R level)  

Controls the Z-height that the tool retracts to *between holes* during a canned cycle sequence.

> ℹ️ **Info**
> - **Modal:** Part of the Canned Cycle Return group.
> - **`G98` (Return to Initial Z):** At the end of each cycle, the tool retracts all the way to the Z-position that it was at *just before* the canned cycle was initiated. This is the safest mode, as it can clear clamps and other obstructions between hole locations.
> - **`G99` (Return to R-Level):** At the end of each cycle, the tool retracts only to the R-level specified in the canned cycle block. This is faster when drilling a series of holes on a flat, unobstructed surface, as it minimizes Z-axis travel.

#### Example
* _Drilling two holes, one of which has a clamp in between:_
  ```gcode
  G90 G0 X10 Y10 Z20 (Start high above the part, Z=20 is the "initial height")

  G98 (Use G98 to retract fully to Z=20, clearing the clamp)
  G81 Z-5 R2 F100 (Define cycle)
  X10 Y10 (Drill first hole, tool retracts to Z=20)
  X50 Y10 (Drill second hole across the clamp, tool retracts to Z=20)
  G80
  ```
* _Drilling a fast pattern on a flat plate:_
  ```gcode
  G90 G0 X10 Y10 Z5 (Start just above the part)

  G99 (Use G99 to retract only to R-level for speed)
  G81 Z-5 R2 F100 (R-level is Z=2)
  X10 Y10 (Drill hole, retracts to Z=2)
  X20 Y10 (Drill hole, retracts to Z=2)
  G80
  ```

---

# M-Codes

M-codes control miscellaneous machine functions. These are actions that are not related to axis motion, such as controlling the spindle, coolant, program flow, and I/O.

## `M0`, `M1`, `M2`, `M30` – Program Flow & Stopping {#M0-M1-M2-M30-M60}

**Syntax:**  
> `M0` (program pause)  
> `M1` (optional pause)  
> `M2` (program end)  
> `M30` (program end & rewind)  

These commands control the execution and termination of a G-code program.

> ℹ️ **Info**
> - **`M0` (Program Pause):** Unconditionally pauses the program. The operator must press the cycle start button to resume the program.
> - **`M1` (Optional Pause):** Behaves exactly like `M0`, but only if the "Optional Stop" input or switch on the machine/GUI is enabled. If the switch is off, the controller ignores `M1` and continues execution. This is useful for inspection points that are not needed on every run.
> - **`M2` (Program End):** Ends the program. Typically performs a reset of the controller, clears offsets, and puts the machine in an idle state. Behavior can vary slightly.
> - **`M30` (Program End):** The most common command to end a program. It does everything `M2` does but also typically rewinds the G-code file back to the beginning, ready for the next part.

| Command   | Action | Resumption |
|-----------|--------|------------|
| **`M0`**  | Unconditional Program Pause | Requires operator intervention (Cycle Start) |
| **`M1`**  | Optional Program Pause      | Requires operator intervention if enabled |
| **`M2`**  | Program End and Reset       | Program ends |
| **`M30`** | Program End and Rewind      | Program ends |

> [!IMPORTANT]
> `M0` and `M1` leaves the spindle and coolant on if enabled. To turn off use the [spindle stop](./commands#spindle-stop-override) and/or [coolant](./commands#coolant-overrides) real-time commands. Spindle and coolant state will be restored on resume.  
>
> `M2` and `M30` resets some modal states to default:
> - Motion mode is set to [G0](#G0).
> - Plane is set to [G17](#G17-G18-G19).
> - Distance mode is set to [G90](#G90-G91).
> - Feed rate mode is set to [G94](#G93-G94-G95).
> - Work Coordinate System is set to [G54](#G5x_WCS).
> - Spindle and coolant is turned off ([M5](#M3-M4-M5) and [M9](#M7-M8-M9)).
> - Cutter compensation is turned off ([G40](#G40)).
> - Overrides are enabled ([M48](#M48-M49)).

#### Examples
* _Stop the program to allow for manual chip clearing:_
  ```gcode
  G0 Z20  
  M0 
  G0 X50 Y50
  ```

* _Place an optional stop after a critical feature for inspection:_
  ```gcode
  (G-code for a finishing pass)  
  M1 (If Optional Stop is on, machine will pause here)
  ```
* _Common way to end a G-code file:_   
  ```gcode
  G0 Z20 (Retract to a safe height)  
  M30
  ```

> [!TIP]
> If ending a program running from an SD card with `M30`, you can enable rewind mode with [$FR](./commands#file-system) prior to starting it. A cycle start command (realtime or via a button) can then be used to restart it. A message is typically output at program end prompting for this.

---

## `M3`, `M4`, `M5` – Spindle Control {#M3-M4-M5}

**Syntax:**  
> `M3` (spindle on CW)  
> `M4` (spindle on CCW)  
> `M5` (spindle off)  

These are the fundamental commands for controlling the spindle's rotation.

<!--- add $ parameter for specifying the spindle? --->

> ℹ️ **Info**
> - **`M3` (Spindle On, Clockwise - CW):** Starts the spindle rotating in the clockwise direction (the standard direction for most right-hand tools). The speed is determined by the last active `S` word.
> - **`M4` (Spindle On, Counter-Clockwise - CCW):** Starts the spindle rotating in the counter-clockwise direction. This is used for left-hand tools, such as some taps and specialty cutters.
> - **`M5` (Spindle Off):** Stops the spindle's rotation.

#### Examples
* _Start the spindle at 10,000 RPM in the forward direction:_
	```gcode
	M3 S10000
	```
* _Stop the spindle:_ 
	```gcode
	M5
	```
* _Start the spindle for a left-hand thread tapping operation at 500 RPM:_
	```gcode
	S500
	M4
	```

> [!TIP]
> - It's good practice to command the [S](#S) word on the same line or just before the `M3`/`M4` command.
> - The controller will wait for the spindle to reach the commanded speed before executing the next motion command if "Wait for Spindle at Speed" is enabled in the settings. This is crucial for tapping and heavy cuts.

---

## `M6` – Tool Change {#M6}

**Syntax:**  
> `M6`

Initiates a tool change sequence. The behavior of `M6` is highly dependent on the machine's configuration and whether an automatic tool changer (ATC) is present, or if manual tool change protocols are enabled.


> ℹ️ **Info**
> - **`M6` is a Tool Change command.** An Automatic Tool Changer (ATC) is a *special case* of how `M6` can be implemented.
> - **With ATC:** An `M6` command, typically combined with a tool number (`T` word), will trigger a pre-defined macro (often `tc.macro` or `P200.macro` for RapidChange ATC) that executes the physical tool change sequence.
> - **Without ATC (Manual Tool Change):**
> - `M6` typically functions as a programmed stop (`M0`). It moves the machine to a safe tool change position, turns off the spindle, and waits for the operator to manually change the tool and press "Cycle Start" to continue.
> - If the sender supports the grblHAL tool change protocol extension, various manual tool change modes can be configured using setting `$341`.
> - If no specific protocol or macro is configured, `M6` may be handled directly by the sender application, or grblHAL can be configured to ignore `M6` commands.
> - **Reference:** For more general information about M6, see [LinuxCNC documentation](https://linuxcnc.org/docs/2.5/html/gcode/m-code.html#sec:M6-Tool-Change).

#### Examples
* _Command a change to Tool #5:_
	```gcode
	T5 M6
	```
* _Simple manual tool change sequence:_
	```gcode
	M5 (Stop spindle)  
	G53 G0 Z0 (Move Z to machine home)  
	G53 G0 X0 Y0 (Move to front for access)  
	T2 M6 (MSG, Change to tool 2) ; Select tool 2 and pause. A message "Change to tool 2" may appear in the GUI
	M0
	```

> [!TIP]
> - The `T` word only *selects* the tool. `M6` is the command that *executes* the change.
> - The logic for the tool change process (both manual and automatic) is often defined in a system macro file, typically named `tc.macro` (tool change) or `P200.macro` (for RapidChange ATC) located on the controller's SD card or accessible by the sender. This allows for extensive customization of the tool change procedure. For an example, see projects like [Rapidchange ATC](https://services.rapidchangeatc.com/docs/).
> - After a tool change, a [G43](#G43) or `G43.1` command may be used to apply the new tool's length offset.

---

## `M7`, `M8`, `M9` – Coolant Control {#M7-M8-M9}

**Syntax:**  
> `M7` (mist coolant on)  
> `M8` (flood coolant on)  
> `M9` (all coolant off)  

These commands control the machine's coolant systems. In grblHAL, these are typically mapped to specific output pins which can control relays for pumps or solenoids.

> ℹ️ **Info**
> - **`M7` (Mist Coolant On):** Activates the mist coolant output pin. This is intended for an air/oil mist system.
> - **`M8` (Flood Coolant On):** Activates the flood coolant output pin. This is the primary coolant command for most machines.
> - **`M9` (Coolant Off):** Deactivates *both* the mist (`M7`) and flood (`M8`) outputs.

#### Examples
* _Turn on the flood coolant before a cutting move:_
	```gcode
	M8
	G1 Z-5 F300
	```
* _Turn on both mist and flood (if the machine is equipped):_
	```gcode
	M7
	M8 ; M7 and M8 cannot be in the same block since they are both in the same modal group
	```
* _Turn off all coolant at the end of the job:_
	```gcode
	G0 Z20
	M9
	```

> [!TIP]
> - The specific physical pins used for coolant are defined in the driver board's configuration file.
> - These outputs can be repurposed to control other accessories, like a vacuum clamp or an air blast, if coolant is not used.

---

## `M42` – Set digital output {#M42}

This command is provided by the [OpenPNP](./plugins#openpnp-mcodes) plugin.

---

## `M48`, `M49` – Override Control {#M48-M49}

**Syntax:**  
> `M48` (enable overrides)  
> `M49` (disable overrides)

Enables or disables the real-time feed rate, spindle speed, and rapid override switches. This allows the G-code program to enforce a specific speed or feed, preventing accidental changes by the operator.

> ℹ️ **Info**
> - **`M48` (Enable Overrides):** Allows the physical override switches/dials and GUI sliders to function normally. This is the default state.
> - **`M49` (Disable Overrides):** Ignores all override controls. The machine will run at 100% of the programmed feed, rapid, and spindle speeds.

#### Example
* _Ensure a critical finishing pass is run at the exact programmed feed rate:_
	```gcode
	... (roughing passes with M48 active) ...`  
	M49 (Disable overrides)  
	G1 X100 F150 (This move will be exactly 150 units/min)  
	... (finishing path) ...`  
	M48 (Re-enable overrides for the next operation)
	```
	
---

## `M50`, `M51`, `M53` – Feed, Spindle, Rapid Override Control {#M50-M51-M53}

**Syntax:**  
> `M50` (turn feed override off)  
> `M51` (turn spindle speed override off)  
> `M53` (turn rapid override off)  

These commands provide granular control over enabling or disabling specific override functions (feed rate, spindle speed, rapid rate). This is in contrast to `M48`/`M49` which enable/disable all overrides simultaneously.

> ℹ️ **Info**
> - **Non-Modal:** These commands are executed immediately upon being read.
> - **Purpose:** Allow a G-code program to selectively prevent operator override of feed rate, spindle speed, or rapid rate for critical operations. This ensures predictable machine behavior.
> - **`M50` (Feed Override Off):** Disables the feed rate override. The machine will run at 100% of the programmed `F` value.
> - **`M51` (Spindle Speed Override Off):** Disables the spindle speed override. The spindle will run at 100% of the programmed `S` value.
> - **`M53` (Rapid Override Off):** Disables the rapid override. `G0` moves will execute at 100% of the configured maximum rapid rate.
> - **Re-enabling:** To re-enable these overrides, the corresponding `M48` command (Enable Overrides) would typically be used, or a specific override enable M-code if supported by a plugin. In a standard grblHAL configuration, `M48` re-enables all of them.
> - **Reference:** For more details, see the [LinuxCNC M-code documentation on M50-M53](https://linuxcnc.org/docs/2.5/html/gcode/m-code.html#sec:M50-Feed-Override).

#### Examples
* _Run a critical finishing pass with exact programmed feed and spindle speed:_
	```gcode
	M50 M51 (Disable feed and spindle overrides)  
	G1 X100 F150 S5000 M3 (Ensures exact feed and speed)  
	(Finishing path)`  
	M48 (Re-enable all overrides)
	```
* _Prevent rapid moves from being slowed down during a tool change sequence:_
	```gcode
	M53  
	G53 G0 X0 Y0 Z0 (Rapid moves will be at full speed)  
	M48
	```

> [!TIP]
> - Use these commands sparingly and only when absolute control over speed or feed is required, as they limit operator intervention.
> - Always remember to re-enable overrides with `M48` after the critical operation is complete.

---

## `M56` – Parking Motion Override {#M56}

**Syntax:**  
> `M56 P-`  

This is a special grblHAL extension command used to enable or disable the controller's parking motion behavior. This command is only available when both the parking feature and this specific override option are enabled in the grblHAL firmware.


> ℹ️ **Info**
> - **Legacy Grbl Extension:** Originally a Grbl legacy extension for park override.
> - **grblHAL specific:** In grblHAL, `M56` with `P1` enables parking motion, while `P0` disables it.
> - **Requirements:** Requires grblHAL to be compiled with parking support and the `M56` override feature specifically enabled.
> - **Parking Motion:** Refers to the automatic movement of axes to a safe or designated "park" position, often configured for events like program pauses, spindle stops, or tool changes.


| Parameter | Description |
|-----------|-------------|
| **`P`**   | `0` - disable parking motion, `1` - enable parking motion. |

#### Example
* _Temporarily disable parking motion during a critical part of a program:_
	```gcode
	M56 P0 (Disable parking)  
	(Critical cutting moves)`  
	M56 P1 (Re-enable parking)
	```

> [!TIP]
> - Use `M56` when you need to prevent the machine from automatically moving to a park position during operations where such a move would be undesirable or unsafe.
> - Always re-enable parking motion when it's safe and beneficial, such as before tool changes or at program end.

---

## `M62`, `M63`, `M64` and  `M65` – Synchronized and Asynchronous I/O {#m62-m65}

**Syntax:**  
> `M62 P-` (sync output on)  
> `M63 P-` (sync output off)  
> `M64 P-` (async output on)  
> `M65 P-` (async output off)  

These are advanced commands for controlling digital output pins, either synchronized with motion or immediately.

> ℹ️ **Info**
> - **`P`**: The digital output pin number to control.
> - **`M62`/`M63` (Synchronized):** The output pin change is queued with motion commands. The pin will switch its state at the *exact moment* the next motion command begins. This is perfect for laser firing or triggering a camera.
> - **`M64`/`M65` (Asynchronous):** The output pin change happens immediately when the command is read, without waiting for motion. This is for general-purpose I/O.

| Command | Action | Timing |
|---------|--------|----------|
| **`M62 P`** | Turn Output `n` ON | Synchronized with next motion |
| **`M63 P`** | Turn Output `n` OFF | Synchronized with next motion |
| **`M64 P`** | Turn Output `n` ON | Immediate |
| **`M65 P`** | Turn Output `n` OFF | Immediate |

#### Synchronized Example (Laser Engraving)
* _Turn on the laser just as the cut starts, and turn it off just as it ends:_
	```gcode
	G0 X10 Y10 (Move to start position)  
	M62 P1 (Queue "Laser ON" for output pin 1)  
	G1 X20 F500 (Laser turns on at the start of this move)  
	M63 P1 (Queue "Laser OFF")  
	G0 X30 (Laser turns off at the start of this rapid move)
	```

> [!IMPORTANT]
> The plasma plugin may shadow some outputs when its [virtual outputs](/docs/reference/plugins#virtual-ports) are enabled.

---

## `M66` – Wait for Input {#m66}

**Syntax:**  
> `M66 E- <L->`  
> `M66 P- L- <Q->`  

This command pauses program execution until a specified input pin changes state, or a timeout occurs. It is supported if auxiliary inputs (analog or digital) are available and configured. The value read is stored in parameter [5399](./parameters/#predefined-numbered-parameters) and output in the next [status report](./commands#status-report-fields) in the `In:` field. If the read failed the value is set to `-1`.

> ℹ️ **Info**
> - **Non-Modal:** Executed when encountered.
> - **Requires Input:** This command is only functional if your grblHAL setup has auxiliary inputs (analog or digital) available and configured.

| Parameter | Description |
|-----------|-------------|
| **`E`**   | Analog input pin number. |
| **`P`**   | Digital input pin number. |
| **`L`**   | Event/state to wait for: `0` - immediate (no wait), `1` - rise event, `2` - fall event, `3` - high state, `4` - low state |
| **`Q`**   | Timeout in seconds. |

> [!NOTE]
> - The `Q` parameter is ignored if the `L` parameter is 0.
> - The `Q` parameter must be > 0 if the `L` parameter is > 0.
> - The `L` parameter must be 0 for analog inputs.

#### Example
* _Wait for a part sensor (connected to pin 2) to go high, with a 10-second timeout:_
	```gcode
	M66 P2 L3 Q10` 
	(Program will pause here until pin 2 goes high or 10s passes)
	```

---

## `M67`, `M68` – Set Analog Output {#m67-m68}

**Syntax:**  
> `M67 E- Q-` (synchronized analog output)  
> `M68 E- Q-` (asynchronous analog output)  

These commands control analog output pins, either synchronized with motion or immediately. They are supported if analog outputs are available and configured.

> ℹ️ **Info**
> - **Non-Modal:** Executed when encountered.
> - **Requires Analog Output:** These commands are only functional if your grblHAL setup has auxiliary analog outputs available and configured.
> - **`E`**: The analog output pin number to control.
> - **`Q`**: The target analog value. Typically, `Q0` is minimum, and `Q255` (for 8-bit) or `Q1023` (for 10-bit) is maximum, depending on the DAC resolution.
> - **`M67` (Synchronized):** The analog output change is queued with motion commands. The output will switch its state at the *exact moment* the next motion command begins. This is useful for laser power control or material flow.
> - **`M68` (Asynchronous):** The analog output change happens immediately when the command is read, without waiting for motion. This is for general-purpose analog control.


| Parameter | Description |
|:---------:|:------------|
| **`E`**   | Analog output pin number |
| **`Q`**   | Value to set   |

#### Synchronized Example (Laser Power Control)
* _Set laser power (on analog output 0) just as the cut starts, and turn it off just as it ends:_
	```gcode
	G0 X10 Y10 (Move to start position)  
	M67 E0 Q150 (Queue "Laser Power 150" for analog output 0)  
	G1 X20 F500 (Laser power sets to 150 at the start of this move)  
	M67 E0 Q0 (Queue "Laser Power OFF")  
	G0 X30 (Laser turns off at the start of this rapid move)
	```

> [!IMPORTANT]
> The plasma plugin may shadow some outputs when its [virtual outputs](/docs/reference/plugins#virtual-ports) are enabled.

---

## `M70`, `M71`, `M72`, `M73` – Modal State Save/Restore {#M70-M71-M72-M73}

**Syntax:**  
> `M70` (save state)  
> `M71` (invalidate state)  
> `M72` (restore state)  
> `M73` (save & auto-restore)  

These are powerful but advanced M-codes that allow the controller to save and restore its current modal state. This includes the active G-codes (like `G0`/`G1`, `G17`/`G18`, `G54`, `G90`/`G91`), feed rate, spindle speed, etc.

> ℹ️ **Info**
> - These are part of the grblHAL core but are considered advanced features.
> - They are extremely useful for writing "safe" subroutines or macros that can perform an action without permanently altering the machine's state from the main G-code program.
> - **`M70` (Save Modal State):** Pushes the current modal state onto a memory stack.
> - **`M71` (Invalidate Modal State):** Marks the saved state as invalid (less common).
> - **`M72` (Restore Modal State):** Pops the last saved state from the memory stack, restoring the machine to exactly how it was before the `M70` call.
> - **`M73` (Save and Auto-Restore):** A more advanced feature used for subprograms.

#### Example: A Safe Probing Macro
Imagine you have a macro to find the center of a hole. This macro needs to use `G91` (incremental mode) and `G1` with a specific feed rate. However, the main program might be running in `G90` with a different feed rate. Using `M70`/`M72` ensures the macro doesn't mess up the main program's state.
* _Macro G-code (`find_center.nc`):_
	```gcode
	M70 (Save the state of the main program)

	G91 G1 F100 (Switch to incremental, set a slow feed rate for probing)  
	(G-code for probing in X and Y to find the center...)`

	M72 (Restore the original state. The machine is now back in G90/G91, G54, etc., with its original feed rate)
	```

---

## `M98` – Subprogram Call {#M98}

**Syntax:**
> `M98 P- <L->`

Call a [subprogram](./o-code#M98).

---

## `M99` – Return from Subprogram {#M98}

**Syntax:**  
> `M99 `

Marks the [end of a subprogram](./o-code#M98) and returns execution to the main program or the calling subprogram.

---

# Plugin Specific G-codes & M-codes

This section provides a comprehensive list of G-code and M-code commands introduced or specifically extended by grblHAL's official plugins. These commands augment the core G-code and M-code functionality, enabling specialized features for various hardware and applications.

Also see the grblHAL [plugin reference](/docs/reference/plugins).

## `M104` – Select spindle (Spindle) {#M104}

This command is provided by the [Spindle](./plugins#spindle-mcode) plugin.

---

## `M106` and `M107` – Fan Control (Fan)

These commands are provided by the [fan plugin](/docs/reference/plugins#fan-mcodes).

---

## `M114` and `M115` – Report Position and Report Firmware (OpenPNP) {#M114-M115}

These commands are provided by the [OpenPNP](./plugins#openpnp-mcodes) plugin.

---

## `M122` – Stepper Driver Init/Report (Trinamic) {#M122}

This command is provided by the [Trinamic](./plugins#trinamic-mcodes) plugin.

---

## `M143` - `M145` – Read/Scale Input (OpenPNP) {#M143--M145}

These commands are provided by the [OpenPNP](./plugins#openpnp-mcodes) plugin.

---

## `M150` - RGB LED Strip Control (RGB) {#M150}

This command is provided by the [RGB LED plugin](/docs/reference/plugins#rgb-led-mcode).

---

## `M204` and `M205` – Acceleration and Jerk Override (OpenPNP) {#M204-M205}

These commands are provided by the [OpenPNP](./plugins#openpnp-mcodes) plugin.

---

## `M220` - Feed Override {#M220}

This command is provided by the [Feed override plugin](/docs/reference/plugins#feed-override-mcode).

---

## `M280` – Set Servo Position (Servo) {#M280}

This command is provided by the [PWM servo plugin](/docs/reference/plugins#pwm-servo-mcode).

---

## `M400` – Finish Moves (OpenPNP) {#M400}

This command is provided by the [OpenPNP](./plugins#openpnp-mcodes) plugin.

---

## `M401` and `M402` – BLTouch Probe Control (BLTouch) {#M401-M402}

These commands are provided by the [BLTouch probe plugin](/docs/reference/plugins#bltouch-mcodes).

---

## `M569` – Stepper Driver Mode (Trinamic) {#M569}

This command is provided by the [Trinamic](./plugins#trinamic-mcodes) plugin.

---

## `M906` – Set Stepper Driver Current (Trinamic) {#M906}
## `M911` and `M912` – Report/Clear Prewarn Flags (Trinamic) {#M911-M912}
## `M913` – Set Hybrid Threshold (Trinamic) {#M913}
## `M914` – Set Homing Sensitivity (Trinamic) {#M906}

These commands are provided by the [Trinamic](./plugins#trinamic-mcodes) plugin.

---

## `M960` - Keepout Zone Control (Scienci ATCi) {#M960}

This command is provided by the [Sienci ATCi plugin](./plugins#sienci-atci-mcode).

---
