---
slug: reference/settings
---

# Settings Reference

This page is a comprehensive reference for all known grblHAL settings. It is designed to be a single source of truth for configuration. Use the table of contents on the right to navigate to a specific section, or use your browser's search function (`Ctrl+F`) to find a specific setting.

### Basic concepts

#### Bitmask setting {#bitmask}

Bitmask settings are using the separate bits of a setting [value](https://en.wikipedia.org/wiki/Byte) to control options. Add values from the value column to get the settings value to use.

#### Axis id {#axisid}

Axis settings are indexed with the tree basic axes X, Y and Z always corresponding to index `0`, `1` and `2`. Additional axes are assigned consecutive indices from `3`, based on their lettter, in the order A, B, C, U, V and W. E.g. a four axis machine configuted as `XYZC` will have indices `0` - `3` assigned.

---

## `$0` – Step Pulse Time {#0}

Controls the length of the step signal pulse (in microseconds) sent to all stepper drivers.  
If too short, drivers may **miss steps**. If too long, it can **limit maximum step rate**.


> ℹ️ **Info**
> - Applies to **all axes**.
> - Works together with `$2` (Step Pulse Invert) and `$29` (Pulse Delay).
> - Adjust only if your drivers require longer pulses.


| Value (µs) | Effect |
|------------|--------|
| **1–2**    | Typical for modern drivers (Trinamic, TB6600, Leadshine, etc.). |
| **3–5**    | Safer setting for slower opto-isolated inputs. |
| **10+**    | Rare, but sometimes required by old/slow external drivers. |

#### Common Examples
* **Modern Digital Drivers (default):**  
  `$0=2`

* **Opto-Isolated Drivers (slow input stage):**  
  `$0=5`

* **Debugging Missed Steps:**  
  `$0=10`

#### Tips & Tricks
- Always start **low** (e.g. 2 µs) and only increase if you see reliability issues.  
- A higher value reduces maximum achievable step frequency.  
- If `$29` (Pulse Delay) is used, the **effective pulse width** is `$29 (Pulse Delay) + $0 (Pulse on time) + $0 (Pulse off time)`.  
- Pulse off time is variable, it is the time between the pulses. This is capped to a minimum of 2 µs. So 1 / ($29+ $0 + 2) is the max theoretical step frequency - which may be higher than what the controller is capable of.
- Pulse Off Time is hard-coded to 2 µs minimum. It is only relevant when approaching the maximum possible step rate. Later versions of most drivers will limit the max rate instead of lowering the the off-time, where earlier drivers would break down.

---

## `$1` – Step Idle Delay {#1}

Controls how long (in milliseconds) the stepper motors remain energized after motion stops.  
This affects whether motors **hold position** when idle or are allowed to release torque.


> ℹ️ **Info**
> - Applies to **all axes**.
> - The delay starts counting **after the last motion command finishes**.
> - A value of `255` keeps steppers always enabled.  (Maintains compatibility with legacy Grbl)



> ⚠️ **Warning**
> If you do require motors to be disabled - it may be better to use `$37` - as it allows per-axis control over which motors are enabled/disabled during Idle state. This allows you to keep Z enabled for example, which may drop under the mass of a heavy spindle, but still allows disabling of X and Y for example.


| Value (ms) | Effect |
|------------|--------|
| **0**      | Disable motors immediately when motion stops. |
| **1–65535**  | Keep motors energized for the given time, then disable. |
| **255**    | Keep motors **always enabled** (no timeout). |

#### Common Examples
* **Power Saving, Light Machine:**  
  Release motors quickly to reduce heat.  
  `$1=25`

* **Medium Hold Needed:**  
  Keep motors on briefly to prevent drift, but still allow cooldown.  
  `$1=100`

* **Heavy Machines / Critical Position Hold:**  
  Always keep motors enabled to maintain position.  
  `$1=255`

#### Tips & Tricks
- For small hobby machines, a short delay can reduce **motor heat and power use**.  
- For heavy gantries or machines with **gravity-loaded axes (like Z)**, keeping motors **always on** (`255`) is safest.  
- If you notice motors “dropping” or losing zero when idle, increase this value.  

---

## `$2` – Step Pulse Invert [(bitmask)](#bitmask) {#2}

Controls the polarity of the **step pulses** for each axis.  
Some stepper drivers require the step signal to be inverted (active-low instead of active-high).  
This setting allows you to configure that per axis.


> ℹ️ **Info**
> - Applies **individually per axis** (X, Y, Z, ...).
> - Related settings:
>   - [$3](#3) – Direction Invert
>   - [$4](#4) – Invert Stepper Enable


| Axis  | Value | Description |
|-------|-------|-------------|
| X     | 1     | Invert X step pulse |
| Y     | 2     | Invert Y step pulse |
| Z     | 4     | Invert Z step pulse |
| Other axes | 2^[axis index](#axisid) | Invert axis step pulse |

#### Common Examples
* **All normal (default):**  
  `$2=0`

* **Invert X only:**  
  `1` → `$2=1`

* **Invert X and Y:**  
  `1 + 2 = 3` → `$2=3`

* **Invert all six axes:**  
  `1+2+4+8+16+32 = 63` → `$2=63`

> [!TIP]
> - Only change this if your **drivers require inverted pulses**.  
> - If motors don’t move even though steps are being sent, check this setting.  
> - Do **not confuse** with `$3` (Direction Invert) — `$2` affects the **pulse signal polarity**, not movement direction.  

---

## `$3` – Direction Invert [(bitmask)](#bitmask) {#3}

Controls the polarity of the **direction signal** for each axis.  
If an axis moves in the opposite direction than expected, invert it here instead of rewiring the motor.


> ℹ️ **Info**
> - Applies **individually per axis**
> - Related settings:
>   - [$2](#2) – Step Pulse Invert
>   - [$23](#23) – Homing Direction Invert

| Axis  | Value | Description |
|-------|-------|-------------|
| X     | 1     | Invert X step direction |
| Y     | 2     | Invert Y step pulse |
| Z     | 4     | Invert Z step pulse |
| Other axes | 2^[axis index](#axisid) | Invert axis step pulse |

#### Common Examples
* **Default (no inversion):**  
  `$3=0`

* **Invert Y only:**  
  `2` → `$3=2`

* **Invert X and Z:**  
  `1 + 4 = 5` → `$3=5`

* **Invert all six axes:**  
  `1+2+4+8+16+32 = 63` → `$3=63`

#### Tips & Tricks
- If an axis jogs in the **wrong direction**, flip it here.  
- `$23` (Homing Direction Invert) is **separate** — `$3` affects **normal motion**, `$23` affects **homing only**.  
- Prefer changing this setting instead of swapping motor wires, so configs are **self-documented** and repeatable.  


---

## `$4` – Invert Stepper Enable [(bitmask)](#bitmask) {#4}

Controls the polarity of the **enable signal** for stepper drivers.  
Some drivers expect an **active-low** enable, while others expect **active-high**.  
This setting lets you match the signal to what your driver requires.


> ℹ️ **Info**
> - Related settings:
>   - [$2](#2) – Step Pulse Invert
>   - [$3](#3) – Homing Direction Invert

| Axis  | Value | Description |
|-------|-------|-------------|
| X     | 1     | Invert X step pulse |
| Y     | 2     | Invert Y step pulse |
| Z     | 4     | Invert Z step pulse |
| Other axes | 2^[axis index](#axisid) | Invert axis step pulse |

#### Common Examples
* **Default (active-high, all axes same):**  
  `$4=0`

* **Invert all axes (active-low enable):**  
  `$4=255` (or `$4=63` if only 6 axes are defined)

* **Invert Z only:**  
  `4` → `$4=4`

#### Tips & Tricks
- If your motors **never engage** (drivers always disabled), try toggling this.  
- Some driver boards **share a single enable line** — use `$4=0` or `$4=1`
- On multi-axis boards with **independent enables**, masking per axis can help if different driver types are used together.  
- If `$4` is set incorrectly, and `$1` is not set to 255 you may notice a thumping noise coming from the motors when you try to jog, but no movement. That is a good troubleshooting indicator that `$4` is set incorrectly.

---

## `$5` – Invert Limit Inputs [(bitmask)](#bitmask) {#5}

Controls the polarity of the **limit switch inputs**.  
If your limit switches trigger in reverse (always “on” when idle, “off” when pressed), invert them here.


> ℹ️ **Info**
> - Expressed as a **bitmask** (X, Y, Z, A, B, C).
> - Related to `$18` (Pull-up Disable Limit Inputs).

| Axis  | Value | Description |
|-------|-------|-------------|
| X     | 1     | Invert X step pulse |
| Y     | 2     | Invert Y step pulse |
| Z     | 4     | Invert Z step pulse |
| Other axes | 2^[axis index](#axisid) | Invert axis step pulse |

#### Common Examples
* **Default (normally-closed switches):**  
  `$5=0`

* **Normally-open switches on all X, Y and Z:**  
  `$5=7`

* **Normally-open switches on all axes:**  
  `$5=63`

* **Invert Z only:**  
  `$5=4`

#### Tips & Tricks
- Normally-closed (NC) switches are safer (detect wire breaks) and more EMI resistant, so ideally try to use Normally Closed switches.  
---

## `$6` – Invert Probe Input (boolean/[bitmask](#bitmask)) {#6}

Controls the polarity of the **probe input pin(s)**.  
If your probe shows **triggered when it's not making contact**, invert it here.


> ℹ️ **Info**
> - In most builds: `$6` is a simple **boolean** (0=normal, 1=invert).
> - In grblHAL builds with **multiple probes enabled**, `$6` becomes a [bitmask](#bitmask): each probe input can be inverted independently.
> - Related settings:
>   - [$65](#65) – Probing Options (mask)


### Single-Probe Mode (default)
| Value | Description |
|-------|-------------|
| **0** | Normal (active-high probe trigger) |
| **1** | Inverted (active-low probe trigger) |

### Multi-Probe Mode ([bitmask](#bitmask))
| Probe           | Bit Value | Description |
|-----------------|-----------|-------------|
| Primary Probe   | 1   | Invert Primary Probe input |
| Toolsetter      | 2   | Invert Toolsetter input |
| Secondary Probe | 4   | Invert Secondary Probe input |

#### Common Examples
* **Default wiring (NO probe):**  
  `$6=0`

* **NC probe, triggers “off” when idle:**  
  `$6=1`

* **Multiple probes, invert Probe 2 only:**  
  `2` → `$6=2`

* **Invert Probes 1 and 3:**  
  `1 + 4 = 5` → `$6=5`

#### Tips & Tricks
- If `$6` is wrong, probing will either **alarm immediately** or **never trigger**.  
- Multi-probe configs are common in **toolsetter + touch plate** setups.  
- With Multi Probe configs, checkout `G65P5` in [https://github.com/grblHAL/core/wiki/Expressions-and-flow-control#inbuilt-g65-macros](https://github.com/grblHAL/core/wiki/Expressions-and-flow-control#inbuilt-g65-macros)

---

## `$8` – Ganged Axes Direction Invert ([bitmask](#bitmask)) {#8}

Controls the direction of the **secondary motor** in a ganged (dual-motor) axis.  
For example, on a dual-Y gantry machine, you may need one motor to spin in the opposite direction in a belted configuration.

> ℹ️ **Info**
> - Only applies if you have **ganged axes** (e.g., dual-Y or dual-Z).
> - This inversion is applied after any configured inversions in `$3 - Direction Invert (mask)`
> - Expressed as a bitmask **per axis**
> - Only **X**, **Y** and **Z** can be ganged

| Axis | Bit Value | Description |
|------|-----------|-------------|
| X    | 1         | Invert secondary X motor direction |
| Y    | 2         | Invert secondary Y motor direction |
| Z    | 4         | Invert secondary Z motor direction |

#### Common Examples
* **Dual-Y axis, invert second Y motor:**  
  `$8=2`

* **Dual-Z gantry, invert second Z motor:**  
  `$8=4`

#### Tips & Tricks
- Use this setting if the machine tries running the ganged motors in opposite directions to each other.
- Always check squaring after changing this.  

---

## `$9` – Primary PWM Spindle Options ([bitmask](#bitmask)) {#9}

Controls behavior for the **primary PWM spindle** if available (spindle type 11 or 12).  


> ℹ️ **Info**
> - Only applies if you have a **PWM spindle**.
> - Related settings:
>   - [$709](#709) – PWM Spindle Options (Secondary)


| Bit | Value | Description |
|-----|-------|-------------|
| 0   | 1     | Disable PWM output entirely |
| 1   | 2     | Let RPM control spindle **on/off** signal (S0 disables spindle, S>0 enables) |
| 2   | 4     | Disable laser capability. In multi-spindle setups, this allows $32 (laser mode) to remain permanently on while selecting a non-laser spindle. |
| 3   | 8     | Enable ramping PWM output on RPM changes: ($394 > 0, enables ramp up for spindle on and on RPM changes while spindle is enabled. $339 > 0, enables ramp down for spindle off. $392 > 0, enables ramp up on door close and/or restore from parked.) |

#### Common Examples
* **Enable PWM output with RPM controlling spindle enable:**  
  `$9=3` (bit 0 + bit 1)

* **Enable PWM, RPM control, and disable laser mode:**  
  `$9=7` (bits 0, 1, 2)

#### Tips & Tricks
- If you use **M3 or M4 with S0**, the spindle enable output will follow `$9` bit 1 if set.  
- Useful for CO2 laser engraving: `$9` bit 1 can allow "overdriving" the PWM signal for short pulses or pixels.  (See https://github.com/grblHAL/core/issues/721#issuecomment-2776210888)
- **Laser mode management:** `$9` bit 2 prevents Laser Mode from being active while using this spindle. This allows $32 (laser mode) to stay permanently on for dual-spindle/laser machines, Laser Mode activates dynamically based on whether the PWM spindle or the PWM Laser is the current tool.
- Switching between spindles/toolheads can be done using `M104 Qx` where `x` is the index of the spindle in a `$spindles` output

---

## `$10` – Status Report Options ([bitmask](#bitmask)) {#10}

Configures what information is included in the **real-time status reports** (`?` command).  
This allows you to customize what grblHAL streams back to the host.


> ℹ️ **Info**
> - grblHAL extends this beyond classic Grbl.
> - Common usage: enable only the fields your sender needs _and_ supports.


| Bit | Value | Option |
|-----|-------|--------|
| 0   | 1     | Position in **machine coordinates** (MPos) |
| 1   | 2     | **Buffer state** (planner / RX) |
| 2   | 4     | **Line numbers** |
| 3   | 8     | **Feed & speed** |
| 4   | 16    | **Pin state** (limit, probe, etc.) |
| 5   | 32    | **Work coordinate offset** (WCO) |
| 6   | 64    | **Overrides** (feed, spindle, rapid) |
| 7   | 128   | **Probe coordinates** |
| 8   | 256   | **Buffer sync on WCO change** |
| 9   | 512   | **Parser state** (sent separately, only on changes) |
| 10  | 1024  | **Alarm substatus** |
| 11  | 2048  | **Run substatus** (can be used to implement simple sender side probe protection) |
| 12  | 4096  | **Enable during homing** (report also sent while homing) |
| 13  | 8192  | **Distance to Go**

#### Common Examples

* **Default:**  
  `$10=511`

* **Classic Grbl behavior:**  
  `$10=255` (first 8 flags)

* **Full report (all flags):**  
  `$10=8191`

#### Tips and Trick
- Enabling more fields = more **serial traffic**.  
- Some GUIs may rely on specific fields (e.g. offsets, parser state).  
- `Parser state` is not included inline, but sent separately on changes.  
- `Run substatus` can be used as a simple **probe protection** indicator.  

> 🔥 **Danger**
> - Do not enable the `Run Substatus` option unless the sender can handle it.

> 💡 **Tip**
> - The `Run Substatus` option adds `:` to the status where `` can be `1` for feed hold pending and `2` for probing. E.g. `Run:2` indicates that the current motion is for probing.
> - Feed hold pending (`Run:1`) is output when a feed hold is asked for during spindle synchronized motion, the hold will be executed after the synced motion is complete.
> - If used for probe protection the sender will have to cancel the current motion if the probe is triggered when the substate is not `Run:2`.

---

## `$11` – Junction Deviation {#11}

Controls the path blending tolerance when the toolpath changes direction.  
It affects **cornering speed** and **smoothness**.

> ℹ️ **Info**
> - Units: millimeters.

#### Common Examples
* **Default:**  
  `$11=0.010`


#### Tips & Tricks
- This is an advanced tuning parameter — defaults are perfectly fine.  Please do not change these values unless specifically requested to do so

---

## `$12` – Arc Tolerance {#12}

Defines the maximum error allowed when interpolating arcs (G2/G3).  
Smaller values = more precise arcs, but more segments.

> ℹ️ **Info**
> - Units: millimeters.
> - Controls how finely arcs are broken into small line segments.

#### Common Examples
* **Default:**  
  `$12=0.002`

#### Tips & Tricks
- This is an advanced tuning parameter — defaults are perfectly fine.  Please do not change these values unless specifically requested to do so

---

## `$13` – Report in Inches (boolean) {#13}

Switches between metric and imperial units in **status reports only**.  
Does **not** affect G-code commands.


> ℹ️ **Info**
> - G-code units are set with `G20` (inches) and `G21` (mm).
> - `$13` affects only the report format to the host.

| Value | Effect |
|-------|--------|
| 0     | Reports in millimeters |
| 1     | Reports in inches |

#### Common Examples
* **Default (metric):**  
  `$13=0`

* **For imperial-based senders:**  
  `$13=1`

#### Tips & Tricks
- Leave at `0` unless your sender specifically requires inches.  Most G-code senders prefer the reports to be in metric, and handle imperial conversions locally, as most of grblHAL is metric in nature

---

## `$14` – Invert Control Inputs ([bitmask](#bitmask)) {#14}
Controls the polarity of the various control input signals. Use this to match the controller to your button or sensor wiring, such as Normally Open (NO) vs. Normally Closed (NC).

> ℹ️ **Info**
> - This setting is crucial for correctly wiring physical control buttons and safety signals like E-Stop and Safety Door.
> - It is related to [$17](#17) (Pull-up Disable Control Inputs), which controls the electrical state of the pins.

| Bit | Value | Input to Invert | Common Use |
|:---:|:-----:|:----------------|:-----------|
| 0   | 1     | Reset | A button that triggers a soft-reset. |
| 1   | 2     | Feed Hold | A button or switch to pause the current job. |
| 2   | 4     | Cycle Start | A button to start or resume a G-code program. |
| 3   | 8     | Safety Door | A switch on the enclosure door that pauses the job when opened. |
| 4   | 16    | Block Delete | A switch to enable the block delete (`/`) G-code function. |
| 5   | 32    | Optional Stop | A switch to enable the optional stop (`M1`) G-code command. |
| 6   | 64    | E-Stop | A dedicated emergency stop button. **Must be wired NC.** |
| 7   | 128   | Probe Connected | A signal indicating that a detachable probe is connected. |
| 8   | 256   | Motor Fault | An input from external drivers indicating a motor or driver fault. |
| 9   | 512   | Motor Warning | An input from external drivers indicating a non-critical warning. |
| 10  | 1024  | Limits Override | A switch to temporarily disable hard limits for jogging off a switch. |
| 11  | 2048  | Single Step Blocks | A switch to enable single-block execution mode. |

#### Common Examples
*   **Default (All inputs wired NO - Normally Open):**
    *   This is the default electrical configuration.
    *   `$14=0`
*   **Safety Switches Wired NC (Recommended):**
    *   Inverting Feed Hold, Safety Door, and E-Stop buttons which are wired Normally Closed for safety.
    *   `2` (Feed Hold) + `8` (Safety Door) + `64` (E-Stop) → `$14=74`
*   **All Common Buttons Wired NC:**
    *   Inverting Reset, Feed Hold, Cycle Start, and Safety Door.
    *   `1` (Reset) + `2` (Feed Hold) + `4` (Start) + `8` (Door) → `$14=15`

#### Tips & Tricks
- It is highly recommended to use **Normally Closed (NC) switches** for all safety-critical inputs like E-Stop, Safety Door, and Feed Hold. This is a failsafe design, as a broken or disconnected wire will immediately trigger the alarm, just like pressing the button would.
- If a button seems to be "stuck on," it almost certainly needs to have its logic inverted with this setting.
- Use the real-time status report (`?`) to check the state of some of these inputs for easier debugging.
- E-Stop instead of Reset is default for many boards. Currently no boards can have both enabled at the same time

---

## `$15` – Invert Coolant Outputs ([bitmask](#bitmask)) {#15}

Inverts the logic of the **coolant outputs** (Flood, Mist).  
Some relays expect an active-low signal.

> ℹ️ **Info**
> - Bit 0 = Flood
> - Bit 1 = Mist

#### Common Examples
* **Default (active-high relays):**  
  `$15=0`

* **Invert Flood only:**  
  `$15=1`

* **Invert Flood + Mist:**  
  `$15=3`

#### Tips & Tricks
- If coolant relays **toggle backwards**, change this instead of rewiring. 
 
---

## `$16` – Invert Primary Spindle Outputs ([bitmask](#bitmask)) {#16}

Controls polarity of the **spindle control outputs** (PWM, enable, direction).  
Some spindle drivers expect inverted logic.

> ℹ️ **Info**
> - For spindle types 11, 12 and 13
> - Bit 0 = Spindle Enable
> - Bit 1 = Spindle Direction
> - Bit 2 = Spindle PWM
> - Related settings:
>   - [$716](#716) – Invert Secondary Spindle Outputs (mask)

#### Common Examples
* **Default:**  
  `$16=0`

* **Invert Spindle Enable only:**  
  `$16=1`

* **Invert all signals:**  
  `$16=7`

#### Tips & Tricks
- If the spindle **runs when it should stop**, check `$16`.  
- Combine with `$33–$36` for full PWM control tuning.  

---

## `$17` – Pull-up Disable Control Inputs ([bitmask](#bitmask)) {#17}
Disables the internal pull-up resistors on the control input pins (Cycle Start, Feed Hold, Reset).

> ℹ️ **Info**
> - Most control buttons are simple switches that connect an input pin to Ground. For this to work, the pin needs a "pull-up" resistor to keep it at a high voltage when the button isn't pressed.
> - Disabling this is only necessary if you have **external pull-up resistors** or are using **active drivers** for these inputs.

| Bit | Value | Input to Invert | Common Use |
|:---:|:-----:|:----------------|:-----------|
| 0   | 1     | Reset | A button that triggers a soft-reset. |
| 1   | 2     | Feed Hold | A button or switch to pause the current job. |
| 2   | 4     | Cycle Start | A button to start or resume a G-code program. |
| 3   | 8     | Safety Door | A switch on the enclosure door that pauses the job when opened. |
| 4   | 16    | Block Delete | A switch to enable the block delete (`/`) G-code function. |
| 5   | 32    | Optional Stop | A switch to enable the optional stop (`M1`) G-code command. |
| 6   | 64    | E-Stop | A dedicated emergency stop button. **Must be wired NC.** |
| 7   | 128   | Probe Connected | A signal indicating that a detachable probe is connected. |
| 8   | 256   | Motor Fault | An input from external drivers indicating a motor or driver fault. |
| 9   | 512   | Motor Warning | An input from external drivers indicating a non-critical warning. |
| 10  | 1024  | Limits Override | A switch to temporarily disable hard limits for jogging off a switch. |
| 11  | 2048  | Single Step Blocks | A switch to enable single-block execution mode. |

#### Common Examples
*   **Default (Internal Pull-ups Enabled):**
    *   This is correct for 99% of setups.
    *   `$17=0`
*   **Disable Pull-up for Feed Hold Only:**
    *   You have an external circuit providing the signal for the Feed Hold pin.
    *   `$17=2`

##### Tips & Tricks
- If a control input seems "stuck" or doesn't respond, do **not** change this setting first. Check your wiring and the `$14` (Invert Control Inputs) setting.
- For most hobbyist setups, you should never need to change this from `0`.
- Note: For boards with proper signal conditioning and onboard physical pullups, this feature is slated for removal
---

## `$18` – Pull-up Disable Limit Inputs ([bitmask](#bitmask)) {#18}
Disables the internal pull-up resistors on the limit switch input pins.

> ℹ️ **Info**
> - This works exactly like [$17](#17), but applies to the limit switch pins.
> - It is extremely rare to disable this, as nearly all limit switches (NO or NC) rely on these internal pull-ups.

| Bit | Value | Input |
|:---:|:-----:|:------|
| 0   | 1     | X-Limit |
| 1   | 2     | Y-Limit |
| 2   | 4     | Z-Limit |
| 3   | 8     | A-Limit |
| 4   | 16    | B-Limit |
| 5   | 32    | C-Limit |

#### Common Examples
*   **Default (Internal Pull-ups Enabled):**
    *   This is the correct setting for standard mechanical or optical limit switches.
    *   `$18=0`

##### Tips & Tricks
- Only disable this if your limit switches are part of an active circuit (e.g., a buffer board) that provides its own pull-ups.
- Disabling this with standard switches will cause the inputs to "float," leading to random limit triggers.
- Note: For boards with proper signal conditioning and onboard physical pullups, this feature is slated for removal
---

## `$19` – Pull-up Disable Probe Inputs ([bitmask](#bitmask)) {#19}
Disables the internal pull-up resistors on the probe input pins.

> ℹ️ **Info**
> - This works exactly like [$17](#17), but applies to the probe inputs.
> - You might disable this if you are using an optically-isolated probe or a powered probe interface that provides its own clean signal, or you are using a board that has proper signal conditioning and does not rely on MCU pullups

| Bit | Value | Input |
|:---:|:-----:|:------|
| 0   | 1     | Primary Probe (PRB) |
| 1   | 2     | Secondary Probe / Toolsetter (TLS) |
| 1   | 2     | Third Probe |

#### Common Examples
*   **Default (Internal Pull-ups Enabled):**
    *   Correct for simple touch plates and most common probes.
    *   `$19=0`
*   **Disable Pull-up for Primary Probe:**
    *   Your main probe has a powered interface board.
    *   `$19=1`

##### Tips & Tricks
- If your probe input seems noisy or unreliable, ensuring the pull-up is **enabled** (`$19=0`) is the first step.
- Disabling the pull-up for a passive switch/touch plate will make probing completely non-functional.
- Note: For boards with proper signal conditioning and onboard physical pullups, this feature is slated for removal
---

## `$20` – Soft Limits Enable (boolean) {#20}
Enables a safety feature that prevents the machine from moving beyond its configured travel limits.


> ℹ️ **Info**
> - This is a **software** check. It monitors G-code commands and jogging to see if a move would exceed the axis travel defined in `$130` - `$135`.
> - It is a critical feature for preventing crashes.
> - It **requires a successful homing cycle** to know where the machine's boundaries are.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| No software travel limits are enforced. |
| 1     | Enabled | grblHAL will throw an error if a move exceeds the max travel for a homed axis. |

#### Common Examples
*   **Machine Unable to Home / New Uncalibrated setup:**
    *   Keep soft limits off until homing is working perfectly.
    *   `$20=0`
*   **Production Use (Highly Recommended):**
    *   Enable soft limits for safe operation.
    *   `$20=1`

##### Tips & Tricks
- Always enable soft limits once your machine is properly configured. It's free insurance against typos in G-code or jogging mistakes.
- Avoid jogging mistakes by also setting `$40=1` - this will limit jogging commands to remain within the working area
- If you get a `Alarm 2`, it means your G-code is trying to move outside the machine's work area defined by `$130-$135`.  It usually means you either forgot to home, Homing isn't working correctly, or your job/jog move really does exceed the machine's working envelope

---

## `$21` – Hard Limits Enable ([bitmask](#bitmask)) {#21}
Enables a safety feature that uses the physical limit switches to stop the machine instantly in an emergency.

> ℹ️ **Info**
> - This is a **hardware** check. If any limit switch is triggered *during* a move, grblHAL will immediately halt all axes and enter an alarm state.
> - This is your last line of defense against a crash if soft limits fail or are not active.

| Bit | Value | Meaning | Description |
|:---:|:-----:|:--------|:------------|
| 0   | 1     | Enable  | The master switch to turn on hard limit detection. |
| 1   | 2     | Strict Mode | When a switch is engaged, only a homing cycle is allowed to clear the state. Jogging away is disabled. |
| 2   | 4     | Disable for Rotary | Hard limits will be ignored for rotary axes (A, B, C), but remain active for linear axes (X, Y, Z). |

#### Common Examples
*   **No Limit Switches Installed (or Disabled):**
    *   You must keep this disabled.
    *   `$21=0`
*   **Standard Hard Limits (Recommended):**
    *   Enables hard limits for all axes.
    *   `1` → `$21=1`
*   **Strict Mode Enabled:**
    *   For maximum safety, forcing a re-home after a limit trigger.
    *   `1` (Enable) + `2` (Strict) → `$21=3`
*   **Hard Limits for Linear Axes Only:**
    *   Useful if your rotary axis has no limit switches or is designed to rotate continuously.
    *   `1` (Enable) + `4` (Disable Rotary) → `$21=5`

#### Tips & Tricks
- Hard limits can sometimes be triggered by electrical noise. If you get false alarms, check the shielding on your limit switch wires and consider adding a small capacitor (e.g., 0.1uF) across the switch input pins.
- In "Strict Mode," you cannot simply jog off a triggered switch. You must reset and perform a homing cycle, which is safer as it re-establishes the machine's true position.
- Normally-closed (NC) switches are safer (detect wire breaks) and more EMI resistant, so ideally try to use Normally Closed switches.  

---

## `$22` – Homing Options ([bitmask](#bitmask)) {#22}
Configures the behavior of the homing cycle.

> ℹ️ **Info**
> - This setting **enables and configures homing options only**.
> - It does **not** control which axes are homed. That is managed by the Homing Phase settings, starting with `$44`.

| Value | Bit | Option Description |
| :--- | :--- | :--- |
| **1** | 0 | **Enable Homing Cycle:** This is the master switch. It must be enabled to allow the `$H` command to run. |
| **2** | 1 | **Enable Single Axis Homing Commands:** Allows use of single-axis homing commands like ``$HX``, ``$HY`` or ``$HA`` etc |
| **4** | 2 | **Homing on Startup Required:** Forces the user to run a homing cycle before any G-code motion is allowed. A key safety feature. |
| **8** | 3 | **Set Machine Origin to 0:** After homing, sets the machine position at the switch trigger point to `0`. If disabled, it's set to the axis maximas - also known as  HOMING_FORCE_SET_ORIGIN|
| **16**| 4 | **Two Switches Share One Input:** Informs grblHAL that two homing switches are wired in parallel to a single input pin. |
| **32**| 5 | **Allow Manual Homing:** Allows homing (via single axis commands like ``$HX``, ``$HY`` or ``$HA``) for axes not part of homing sequences (`$44-$47`) |
| **64**| 6 | **Override Locks:** Allows jogging motion even when the machine is in an alarm state that normally requires homing. |
| **256**| 8 | **Use Limit Switches:** Allows homing switches to also function as hard limit switches when the homing cycle is not active. |
| **512**| 9 | **Per-Axis Feedrates:** Allows using separate feed rates for each axis during homing. |
| **1024**| 10 | **Run Startup Scripts on Homing Complete:** If enabled, startup scripts will only execute after a successful homing cycle. |

#### Common Examples
*   **Simple Homing Enabled:**
    *   Enables the `$H` command only, standard homing setup
    *   `1` → `$22=1`

##### Tips & Tricks
- Homing is one of the most important features to configure for a reliable machine.  All offsets and coordinate systems depends on a reliably established Machine coordinate system.  Without homing several features will feel like they don't work quite correctly.
- For a new machine, start with just `$22=1` and then add more options once you have confirmed the basic cycle works.
- The machine can be homed **without homing switches** by setting bit 0, 1 and 5 and setting all homing sequences to 0. Jog to the home position and send $H. Operations relying on axes homed (soft limits, …) will now work as if the machine has been homed

> 💡 **Tip**
> - Per-Axis Feedrates enables axis settings `$18x` and `$19x`, `$24` and `$25` will be disabled (not reported).
> - You may have to restart the sender to make the change visible.

---

## `$23` – Homing Direction Invert ([bitmask](#bitmask)) {#23}
Defines the location of the homing switch for each axis, which in turn determines the direction of travel during a homing cycle.

> ℹ️ **Info**
> - By default, grblHAL assumes all homing switches are located at the **maximum** (`+`) end of each axis's travel. The default homing cycle therefore moves in the positive direction.
> - This setting is a **bitmask** used to override that default assumption. Setting a bit for an axis tells grblHAL its switch is at the **minimum** (`-`) end of travel instead.
> - This setting is **only** for the homing cycle (`$H`). It does not affect normal jogging or G-code motion.

| Value | Axis | Switch Location Assumed |
|:-----:|:-----|:------------------------|
| 1     | X    | Invert to assume switch is at X-minimum (left). |
| 2     | Y    | Invert to assume switch is at Y-minimum (front). |
| 4     | Z    | Invert to assume switch is at Z-minimum (bottom, rare, bad-practice). |
| 8     | A    | Invert to assume switch is at A-minimum. |
| 16    | B    | Invert to assume switch is at B-minimum. |
| 32    | C    | Invert to assume switch is at C-minimum. |

#### Common Examples
*   **Default (Switches at X, Y, Z maxima):**
    *   The machine will home to the back-right-top corner.
    *   `$23=0`
*   **Switches at X-min and Y-min (front-left homing location):**
    *   A very common setup for machines that home to the front-left.
    *   `1` (X-min) + `2` (Y-min) → `$23=3`

#### Tips & Tricks
- The primary symptom of an incorrect `$23` setting is an axis moving **away** from its switch during the `$H` command.
- Do not confuse this with `$3` (Direction Invert). `$3` flips the direction for **all** motion to match your motor wiring. `$23` flips the homing direction to match your **switch location**.
- Set this mask to match the **physical location** of your switches relative to the desired machine origin.
- Note: Unless HOMING_FORCE_ORIGIN is used, the position of the switch does change the machine origin (Not recommended)

---

## `$24` – Homing Locate Rate (mm/min) {#24}
Sets the slower feed rate used to precisely locate the switch trigger point on the 2nd approach

> ℹ️ **Info**
> - After the initial fast search (`$25`) finds the switch, the machine backs off (`$27`) and then re-approaches slowly at this rate.
> - A slower rate here results in a more accurate and repeatable machine zero position.

| Value (mm/min) | Meaning | Description |
|:--------------:|:--------|:------------|
| 10-50          | Precise | Good for most machines, ensures a very accurate zero. |
| 50-100         | Faster  | A good compromise if homing cycles are too slow. |

#### Common Examples
*   **High-Precision Machine:**
    *   `$24=25`
*   **Standard Hobby CNC:**
    *   `$24=100`

##### Tips & Tricks
- This value should always be significantly slower than your `$25` search rate.
- If your homing position is inconsistent between cycles, try lowering this value, or add homing passes with `$43`

---

## `$25` – Homing Search Rate (mm/min) {#25}
Sets the faster feed rate used to initially find the homing switches during the 1st approach

> ℹ️ **Info**
> - This is the speed the machine moves at the start of the homing cycle (`$H`).
> - Setting it too high can cause a crash if the switch fails, but setting it too low makes the homing cycle take a long time.

| Value (mm/min) | Meaning | Description |
|:--------------:|:--------|:------------|
| 200-500        | Safe    | A conservative speed for initial setup. |
| 500-1500+      | Fast    | A typical speed for a well-tuned machine. |

#### Common Examples
*   **Initial Machine Setup:**
    *   `$25=400`
*   **Tuned Production Machine:**
    *   `$25=1000`

##### Tips & Tricks
- This rate should never be higher than the axis maximum rate (`$110` - `$115`). A value of 50-70% of the maximum rate is a good starting point.
- If the motor slams violently into the limit switches during the homing search, this value is too high.

---

## `$26` – Homing Switch Debounce Delay (ms) {#26}
Sets a delay *after* a homing switch is triggered and released to prevent mechanical switch bounce from causing a false re-trigger.

> ℹ️ **Info**
> - Most grblHAL boards use hardware interrupts to detect the switch press instantly. After the initial trigger is processed and the machine backs off the switch (`$27`), the controller will wait for this delay time (`$26`) before it is allowed to sense the switch again.
> - This prevents the mechanical "bounce" that occurs when the switch physically settles from immediately causing a false second trigger.


| Value (ms) | Meaning | Description |
|:----------:|:--------|:------------|
| 1-5       | Low Bounce | For high-quality microswitches or electronic switches with clean signals. |
| 10-50     | Standard Bounce | A safe value for typical mechanical limit switches. |

#### Common Examples
*   **Typical Mechanical Switches (Default):**
    *   A good starting point that provides enough settling time for most switches.
    *   `$26=25`
*   **High-Quality Optical/Inductive Switches:**
    *   Optical switches have no mechanical bounce, so a minimal delay can be used.
    *   `$26=1`

#### Tips & Tricks
- If your homing cycle fails intermittently, or an axis immediately alarms after backing off the switch, it is likely due to switch bounce. Increasing this value is the correct fix.
- Unlike a traditional debounce filter, this setting does **not** cause an inaccuracy in the homed position, because the delay happens *after* the initial position has already been latched by the interrupt.
- Setting this value too high will simply make the homing cycle take slightly longer, but it is otherwise safe.

## `$27` – Homing Pull-off Distance (mm) {#27}
Sets the distance each axis moves *away* from the limit switches after they have been triggered.

> ℹ️ **Info**
> - This ensures that the switches are not left in a pressed state after the homing cycle completes.
> - It defines the small gap between your machine's physical limit and the established Machine Zero (`Mpos:0`).

| Value (mm) | Meaning | Description |
|:----------:|:--------|:------------|
| 1-3        | Typical | A small, safe distance that works for most machines. |
| 3-5+       | Large   | Useful for machines with less accurate switches to ensure they are fully released. |

#### Common Examples
*   **Standard CNC:**
    *   `$27=2.0`
*   **Machine with Roller Switches:**
    *   `$27=5.0`

##### Tips & Tricks
- This value must be large enough to fully release your mechanical switches.
- Pulloff is not taken into account for manually homed axes, only axes homed using homing switches

---

## `$28` – G73 Retract Distance (mm) {#28}
Sets the retract distance for the `G73` high-speed peck drilling cycle.


> ℹ️ **Info**
> - `G73` is a specific canned cycle for drilling where the drill bit makes small "pecks" to break chips, but only retracts a very small amount between each peck.
> - This setting defines that small retract distance.

| Value (mm) | Meaning | Description |
|:----------:|:--------|:------------|
| 0.5 - 2.0  | Typical | A small value to quickly break the chip without fully retracting from the hole. |

#### Common Examples
*   **Default for General Use:**
    *   `$28=1.0`

##### Tips & Tricks
- This is a specialized setting only used for `G73`. It does not affect standard `G81` or `G82` cycles.
- The full retract for other cycles is controlled by the `G98`/`G99` command in your G-code.

---

## `$29` – Pulse Delay (microseconds) {#29}
Adds an extra delay between the direction pin being set and the step pulse being sent.

> ℹ️ **Info**
> - Some older or slower stepper drivers require a "setup time" — a brief pause after the direction is commanded before they can accept a step pulse.
> - This setting provides that pause. For most modern drivers, it is not needed.

| Value (µs) | Meaning | Description |
|:----------:|:--------|:------------|
| 0          | None    | Correct for nearly all modern drivers (Trinamic, TB6600, etc.). |
| 1-10       | Short Delay | May be required for some drivers with opto-isolators (DMA420A, DQ542MA, DM556T) |

> ⚠️ **Warning**
> When set > 0 and less than 2 the value is rounded up to 2 microseconds.

#### Common Examples
*   **Modern Digital Drivers (Default):**
    *   `$29=0`

##### Tips & Tricks
- Only add a delay here if you are experiencing randomly missed steps on fast direction changes and have already ruled out mechanical issues and acceleration (`$12x`) being too high.
- This delay can slightly limit the maximum achievable step rate.

> ℹ️ **Info**
> - From the `DM556T` documentation (Stepperonline version): DIR signal: This signal has low/high voltage levels to represent two directions of motor rotation. Minimal direction setup time of `5μs`.
> - Chinese knock-offs like `DMA420A` and `DQ542MA` may require even longer setup times
> - Complicating this is that the AMASS algorithm will often output the direction change before the next step - possibly masking that this delay is required - but it is good practice to configure required delay correctly

---

## `$30` – Maximum Spindle Speed (RPM) {#30}
Sets the spindle speed that corresponds to the maximum PWM output signal (100% duty cycle).

> ℹ️ **Info**
> - This setting is for the **primary PWM spindle** (or devices controlled by a PWM signal, such as a 0-10V converter for a VFD).
> - It is the key to scaling your spindle speed. It links a G-code `S` value to the PWM output.
> - For example, if `$30=24000`, then an `S24000` command will result in 100% PWM, and an `S12000` command will result in 50% PWM.
> - **Note:** For most **Modbus-controlled VFDs**, this setting is ignored, as the min/max RPM is read directly from the VFD's parameters.
> - Related settings:
> - `$730`

| Value (RPM) | Meaning | Description |
|:-----------:|:--------|:------------|
| 1 - 100000+ | Max RPM | The maximum rated speed of your spindle. |

#### Common Examples
*   **24,000 RPM Spindle with 0-10V Control:**
    *   `$30=24000`
*   **Laser Engraver (0-1000 Power Scale):**
    *   A common convention is to treat power as a percentage from 0-1000.
    *   `$30=1000` (Now `S500` means 50% power).

#### Tips & Tricks
- For a VFD using a 0-10V converter, this value should match the max frequency/RPM setting in your VFD for accurate speed control.
- If you command `S` values higher than `$30`, the PWM output will simply be clamped to 100%.

---

## `$31` – Minimum Spindle Speed (RPM) {#31}
Sets the minimum spindle speed that can be commanded for a PWM-controlled spindle.

> ℹ️ **Info**
> - For VFDs controlled by a 0-10V signal, this setting prevents `S` commands from going below a safe limit where the spindle might stall or overheat.
> - If a G-code command requests a speed lower than this value (but not zero), the PWM output will be set to the minimum value defined by `$35`. A value of `0` disables this feature.
> - **Note:** For most **Modbus-controlled VFDs**, this setting is ignored, as the min RPM is read directly from the VFD.
> - Related settings:
> - `$731`

| Value (RPM) | Meaning | Description |
|:-----------:|:--------|:------------|
| 0           | Disabled| Allows any `S` command, including very low speeds. |
| 100 - 8000+ | Min RPM | The minimum safe operating speed of your spindle. |

#### Common Examples
*   **Laser Engraver (where S0 is valid):**
    *   `$31=0`
*   **VFD-controlled Spindle (0-10V) with 6000 RPM Min Speed:**
    *   `$31=6000`

#### Tips & Tricks
- This setting is crucial for preventing VFD faults at low RPMs when using 0-10V control.
- If `$31` is set to a value greater than `0`, it is important to also set `$35` (PWM Min Value) correctly to ensure the RPM-to-PWM scale is accurate.

---

## `$32` – Controller Mode {#32}
Enables or disables Laser or Lathe Mode, which fundamentally changes motion control to suit laser cutting and engraving.

> ℹ️ **Info**
> - This is a **global setting**. When enabled, it affects the currently active tool unless overridden by the tool-specific settings (`$9` and `$709`).
> - When enabled (`1`), it eliminates spindle "spin-up" delays and automatically scales laser power with feed rate overrides to ensure consistent burn intensity.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Standard CNC operation for spindles. Motion pauses for `M3`/`M5`. |
| 1     | Enabled | Optimized for lasers. Motion is continuous, and power scales with speed. |
| 2     | Enabled | Optimized for lathe... |

#### Common Examples
*   **Spindle-Only Machine:**
    *   `$32=0`
*   **Laser-Only Machine:**
    *   `$32=1`
*   **Dual Spindle/Laser Machine:**
    *   `$32=1` (and use `$9=4` on the spindle to disable laser capability for that tool).

#### Tips & Tricks
- **Never** use a physical spindle when laser mode is active for that tool. The machine will not pause for the spindle to get up to speed, which is dangerous. Use the [$9](#9) and [$709](#709) settings to manage this safely on dual-purpose machines.

---

## `$33` – Primary Spindle PWM Frequency (Hz) {#33}
Sets the frequency of the **primary** PWM signal, used for spindle, laser, or servo control.


> ℹ️ **Info**
> - The correct frequency depends entirely on the receiving device (VFD converter, laser driver, or servo). An incorrect value can lead to poor control or no response.
> - Related settings:
>   - [$733](#733)

| Value (Hz) | Common Use Case |
|:----------:|:----------------|
| **50**     | **Standard R/C Servos** |
| ~1000      | Many laser diode drivers. |
| 5000       | Often recommended for VFD 0-10V PWM-to-analog converters. |

#### Tips & Tricks
- **Always** check the documentation for your specific hardware. There is no "universal" correct value.
- If your spindle speed is erratic or a servo jitters, this is one of the first settings to verify.
- The response time increases with lower frequencies, e.g. for high speed grayscale laser engravings a higher frequency may be beneficial.

---

## `$34` – Primary Spindle PWM Off Value {#34}
The raw PWM value to be output from the **primary** channel when the spindle is off (`M5`).

> ℹ️ **Info**
> - This setting is part of a group (`$34`, `$35`, `$36`) that maps the `S` command range to a raw PWM output range. The size of this range is driver-dependent (e.g., 0-255 or 0-1000).
> - This value corresponds to 0% duty cycle, which should be `0` for most applications.
> - Related settings:
>   - [$734](#734) PWM2 Spindle PWM Off Values`


#### Common Examples
*   **VFD/Laser (Universal Default):**
    *   `$34=0`

---

## `$35` – Primary Spindle PWM Min Value {#35}
The raw PWM value for the **primary** channel corresponding to the minimum spindle speed (`$31`).


> ℹ️ **Info**
> - This sets the lower limit of the PWM duty cycle range.
> - **For VFDs/Lasers:** It linearizes the output for controllers that have a "dead zone" at the low end.
> - **For R/C Servos:** This value creates the minimum pulse width (e.g., 1.0ms).
> - Related settings:
>   - [$735](#735) PWM2 Spindle PWM Min Values`


#### Common Examples
*   **VFD Ignores Low Voltages:**
    *   Your spindle doesn't start until 15% power. On a 0-1000 scale, this is `150`.
    *   `$35=150`

---

## `$36` – Primary Spindle PWM Max Value {#36}
The raw PWM value for the **primary** channel corresponding to the maximum spindle speed (`$30`).

> ℹ️ **Info**
> - This sets the upper limit of the PWM duty cycle range.
> - For VFDs/Lasers, this should almost always be the maximum value of the PWM range (e.g., 255 or 1000) to allow for 100% power.
> - For R/C Servos, this value creates the maximum pulse width (e.g., 2.0ms).
> - Related settings:
> - [$736}(#736) PWM2 Spindle PWM Max Values`

#### Common Examples
*   **VFD/Laser (Universal Default):**
    *   Assuming a 0-1000 PWM range.
    *   `$36=1000`
*   **R/C Servo Control (0-180°):**
    *   **Goal:** Map `S0`-`S180` to a 1-2ms pulse within a 20ms window (50Hz).
    *   `$30=180` (S-range)
    *   `$33=50` (50Hz)
    *   `$35=50` (1ms pulse = 5% of 20ms. 5% of 1000 = 50)
    *   `$36=100` (2ms pulse = 10% of 20ms. 10% of 1000 = 100)

---

## `$37` – Steppers to Keep Enabled [(bitmask)](#bitmask) {#37}
Specifies which axes should ignore the `$1` idle delay and remain energized at all times.

> ℹ️ **Info**
> - This is a grblHAL-specific feature that provides per-axis control over the motor idle state.
> - It is useful for axes that must resist external forces even when idle (e.g., a Z-axis subject to gravity, or a heavy gantry).

| Axis  | Value | Description |
|-------|-------|-------------|
| X     | 1     | Keep X axis enabled |
| Y     | 2     | Keep Y axis enabled |
| Z     | 4     | Keep Z axis enabled |
| Other axes | 2^[axis index](#axisid) | Keep axis enabled |

#### Common Examples
*   **Default (All axes use `$1` delay):**
    *   No axes are forced to stay on.
    *   `$37=0`
*   **Keep Z-Axis Enabled:**
    *   Prevents the Z-axis from dropping under gravity when idle. X and Y will disable as normal.
    *   `4` → `$37=4`

##### Tips & Tricks
- This setting is an **override**. If `$1=255` (always enabled), this setting has no effect.
- Use this to save power and reduce motor heat on axes that don't need holding torque, while keeping critical axes locked.

---

## `$38` – Spindle Pulses Per Revolution (PPR) {#38}
Informs grblHAL how many pulses it will receive from a spindle encoder for one full revolution.

> ℹ️ **Info**
> - This is an advanced feature required for **spindle-synchronized motion**, such as G33 spindle synchronized motion and lathe threading.
> - It does **not** control spindle speed; it provides high-resolution positional feedback of the spindle's rotation.
> - It requires a physical encoder mounted to the spindle.
> - It can also be used for **Spindle at Speed** automatic spin up/spin down delay if `$340` is set `> 0`.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Spindle synchronization features are turned off. |
| 1-N   | PPR/CPR | The number of Pulses (or Counts) Per Revolution of your encoder. |

#### Common Examples
*   **Feature Disabled (Default):**
    *   `$38=0`
*   **Using a 1024-PPR Encoder:**
    *   `$38=1024`

##### Tips & Tricks
- This setting is mainly relevant to lathe threading in grblHAL.
- Do not enable this unless you have a properly configured spindle encoder connected to the correct input pins on your controller.

---

## `$39` – Enable Legacy Realtime Commands (boolean) {#39}
Enables compatibility for older G-code senders that use legacy printable, single-byte real-time commands.

> ℹ️ **Info**
> - Legacy real-time commands were ASCII characters like `?`, `!`, `~`. Some older control programs may still send these.
> - Modern commands are non-printable characters (e.g., `0x80` to `0x87`).
> - This setting is purely for backward compatibility.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Only legacy non-printable real-time commands are accepted. |
| 1     | Enabled | Both modern and legacy single-byte commands are accepted. |

#### Common Examples
*   **Default:**
    *   Maintain compatibility with older senders.
    *   `$39=1`

##### Tips & Tricks
- For most users with up-to-date software, this setting can be set to disabled (`0`).

---

## `$40` – Limit Jog Commands (boolean) {#40}
Prevents jogging moves from exceeding the machine's software travel limits (`$13x`).

> ℹ️ **Info**
> - This is a safety feature
> - It checks the target position of any manual jog command and will clamp/trim it to stay within the boundaries. This elegantly clamps the jog instead of raising soft/hard limit errors
> - It **requires a successful homing cycle** to be effective.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Jogging commands can be sent regardless of software limits. |
| 1     | Enabled | Jogging commands that would exceed the machine's workspace are clamped/trimmed. |

#### Common Examples
*   **During Initial Setup (before homing works):**
    *   `$40=0`
*   **For Safe Operation (Recommended):**
    *   `$40=1`

##### Tips & Tricks
- It is highly recommended to enable this (`$40=1`) along with Soft Limits (`$20=1`) to prevent accidental crashes while jogging.

---

## `$41` – Parking Cycle [(bitmask)](#bitmask) {#41}
Configures and enables the single-axis parking motion.

> ℹ️ **Info**
> - **Important:** The parking feature in grblHAL is a **single-axis motion** that retracts one axis to a predefined safe location.
> - The axis to move is selected with **`$42`**.
> - **How it’s triggered:** Parking motion is executed automatically when certain events occur:
> - `0x84` Realtime command
> - Safety door open (if configured)
> - When the Event Plugin calls a Park Event
> - If bit 2 is set, you can use **M56** to enable/disable parking override control at runtime.
> - Related settings:
>   - [$61](#61) Safety Door Options

| Bit | Value | Option |
|:---:|:-----:|:-------|
| 0   | 1     | Enable parking motion |
| 1   | 2     | Deactivate upon init |
| 2   | 4     | Enable parking override control (via M56) |

#### Common Examples
* **Enable parking (simple):**  
  `$41=1`

* **Enable parking with M56 override control:**  
  `$41=5` (1 + 4)

#### Tips & Tricks
- For most users, `$41=1` is sufficient: parking will automatically retract the tool on `0x84`  or door open.  
- Use `$41=5` if you want to toggle parking on/off dynamically with M56.  

---

## `$42` – Parking Axis [(bitmask)](#bitmask) {#42}
Selects which single axis will be moved during a parking cycle.

> ℹ️ **Info**
> - This setting determines which axis executes the pull-out/plunge and fast move when parking is triggered.
> - For most machines, Z-axis (`2`) is used to retract the spindle/tool safely upward.

| Axis  | Value | Description |
|-------|-------|-------------|
| X     | 1     | Park X axis |
| Y     | 2     | Park Y axis  |
| Z     | 4     | Park Z axis  |
| Other axes | 2^[axis index](#axisid) | Park axis |

#### Common Examples
* **Standard CNC (Retract Z-axis up):**  
  `$42=2`

#### Tips & Tricks
- The entire parking config (`$56` through `$59`) applies **only** to the axis selected here.  

## `$43` – Homing Passes {#43}
Configures the number of homing passes to perform during the homing cycle.

> ℹ️ **Info**
> - **Purpose:** The `$43` setting determines how many times each axis will move during the homing cycle. This is particularly useful for ensuring precise homing.
> - **Default Value:** The default value is typically `1`, meaning each axis will only home one cycle during the homing cycle.

| Value | Description |
|:-----:|:-----------|
| 0     | Disable homing |
| 1     | Perform one homing pass |
| 2     | Perform two homing passes |
| 3     | Perform three homing passes |
| 4     | Up to a maximum of 4 passes |

#### Common Examples
* **Standard Homing:**
  * `$43=1` → Each axis homes once during the homing cycle.
* **Enhanced Precision:**
  * `$43=2` → Each axis homes twice during the homing cycle
* **Maximum Precision:**
  * `$43=3` → Each axis homes three times during the homing cycle, for machines requiring the highest precision.

#### Tips & Tricks
- **Machine Type Considerations:** Machines with high precision requirements or those that experience mechanical flexing may benefit from additional homing passes.
- **Performance Impact:** More homing passes will increase the time it takes to complete the homing cycle; balance the need for precision with the desired homing speed.

---

## `$44` - `$49` – Axes Homing Phases [(bitmask)](#bitmask) {#44--49}
Defines which axes move during each pass of the homing cycle. You can have up to 6 separate phases in your homing cycle.

> ℹ️ **Info**
> - Each setting is a [bitmask](#bitmask): add together the values of the axes you want to move **simultaneously** in that pass.

| Axis  | Value | Description |
|-------|-------|-------------|
| X     | 1     | Home X axis |
| Y     | 2     | Home Y axis  |
| Z     | 4     | Home Z axis  |
| Other axes | 2^[axis index](#axisid) | Home axis |

#### Common Examples
* **Standard 3-Axis CNC (Z first, then XY):**  
  - `$44=4` → Pass 1: Home Z only.  
  - `$45=3` → Pass 2: Home X and Y together.  

* **XY-only machines (lasers, plotters):**  
  - `$44=3` → Home X and Y together.

* **Optional third axis (A-axis) as a separate pass:**  
  - `$44=4` → Pass 1: Home Z.  
  - `$45=3` → Pass 2: Home X and Y.  
  - `$46=8` → Pass 3: Home A-axis.  

#### Tips & Tricks
- Homing Z first is recommended for most machines to prevent the tool from dragging across clamps or the workpiece.
- Plan your homing sequence carefully, especially on multi-axis machines, to avoid collisions or mechanical stress.
- Set all to zero to allow enabling manual "homing" on machines without limit switches.

---

## `$50` - `$55` – Keypad jogging speed and distances {#50--55}
 
These settings are provided by the [Keypad plugin](/docs/reference/plugins#keypad).

---

## `$56` – Parking Pull-out / Plunge Distance {#56}
Sets an incremental distance for a pull-out move when parking, and a corresponding plunge move when resuming.

> ℹ️ **Info**
> - This setting defines a two-part motion used with the parking cycle.
> - **When Parking is triggered:**
> 1. The selected parking axis (`$42`) first **retracts slowly** by this incremental distance, at the feed rate defined by `$57`.
> 2. Then it **moves quickly** at the parking rate (`$59`) to the machine coordinate defined in `$58`.
> - **When Resuming (Cycle Start):**
> 1. The axis **rapids quickly** back from the parked coordinate to the plunge height (the retracted offset defined by `$56`).
> 2. It then **plunges slowly** by this same distance at the pull-out/plunge rate (`$57`) to return to the original depth before resuming motion.

| Value (mm) | Meaning |
|:----------:|:--------|
| -N to +N   | The incremental distance for the pull-out and plunge moves. |

#### Common Examples
* **No Pull-out/Plunge (Default):**  
  `$56=0.0` → parking goes directly to the target (`$58`), resuming goes directly back without any slow retract/plunge.

* **Gentle 5mm Lift:**  
  `$56=5.0` When parking is triggered, Z lifts 5mm slowly, then rapids to the parking coordinate. On resume it rapids back near the work, then slowly plunges down 5mm to resume cutting.

#### Tips & Tricks
- This is ideal for safely disengaging and re-engaging the tool without gouging.  
- The pull-out happens *before* the main parking rapid, the plunge happens *after* the return rapid.  

---

## `$57` – Parking Pull-out / Plunge Rate {#57}
Sets the feed rate for both the initial pull-out move and the final plunge move.

> ℹ️ **Info**
> - This rate applies only to the **incremental retract and plunge distance** set in `$56`.
> - It ensures the tool leaves and re-enters the work zone under controlled, slow conditions.

| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | Feed rate for the pull-out and plunge moves. |

#### Common Examples
* **Slow, Careful Move:**  
  `$57=100`

#### Tips & Tricks
- Should be safe for moving out of (or back into) material contact.  

---

## `$58` – Parking Axis Target {#58}
Sets the absolute machine coordinate for the final parking position.

> ℹ️ **Info**
> - This is the **final machine coordinate** the parking axis will rapid to after the slow pull-out.
> - Defined in machine coordinates (`MPos` / G53 system).
> - Typically set to a clear, safe height (for Z) or retracted position (for another axis).

| Value | Meaning |
|:------|:--------|
| -N to 0 | Target machine coordinate for the selected axis. |

#### Common Examples
* **Park Z-Axis at Safe Height:**  
  `$58=-5.0` → Z goes to 5mm below home.

* **Fully Retract Z-Axis:**  
  `$58=-2.0` (with `$27=2.0` pull-off) → Z goes all the way up, just off the switch.  

#### Tips & Tricks
- Jog to the desired machine position, check `MPos`, and copy it into `$58`.  

---

## `$59` – Parking Fast Rate {#59}
Sets the feed rate for the main fast move to and from the parking coordinate.

> ℹ️ **Info**
> - **Parking:** After the slow pull-out (`$56/$57`), the axis moves at this speed to the parking target (`$58`).
> - **Resuming:** The axis rapids back at this speed from the parked coordinate to the plunge height.
> - This is the "fast" portion of the parking cycle.

| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | Feed rate for the main rapid to/from the park position. |

#### Common Examples
* **Moderate Speed:**  
  `$59=800.0`

* **High Speed (tuned Z):**  
  `$59=1500.0`

#### Tips & Tricks
- This setting affects only the long travel, not the careful pull-out or plunge.  

---

## `$60` – Restore Overrides (boolean) {#60}
Controls whether feed, rapid, and spindle overrides are restored to their previous values when a G-code program ends.

> ℹ️ **Info**
> - Overrides allow you to adjust speeds and feeds in real-time (e.g., with a pendant or GUI slider).
> - If this setting is enabled, the override values you set during a job will be remembered for the next job.
> - If disabled, all overrides are reset to 100% after a program (`M2`/`M30`) finishes.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Overrides are reset to 100% after each job. (Safer) |
| 1     | Enabled | Override values persist between jobs. (Convenient) |

#### Common Examples
*   **Safety First (Default):**
    *   Ensures every new job starts at the programmed feed and speed.
    *   `$60=1`
*   **Production Use with Consistent Setups:**
    *   Useful if you always run a certain material at 80% feed, for example.
    *   `$60=0`

##### Tips & Tricks
- For beginners, it is highly recommended to leave this enabled (`$60=1`) to avoid surprise-fast or surprise-slow movements at the start of a new job.
- If you find your jobs are always starting slower or faster than programmed, check if this setting has been enabled.

---

## `$61` – Safety Door Options [(bitmask)](#bitmask) {#61}
Configures runtime behaviour for the safety-door input.

> ℹ️ **Info**
> - **Note:** the safety-door *input itself* is a compile-time / board-map feature (it must be enabled and wired in the driver/board map). `$61` only controls run-time behaviour *once* the door input exists.
> - Typical behaviour when the door opens: grblHAL enters a DOOR/hold state (pauses the job and optionally runs the parking sequence). `$61` does **not** enable/disable the door input — it only modifies how door events are handled. Use `$41` (parking) and `$63` (hold actions) to control parking/hold behaviour.


| Bit | Value |  Description |
|:---:|:-----:|:------------|
| 0   | 1     | When set, **ignore** door-open events while the controller is in **IDLE**. Useful so you can open the enclosure for jogging/setup when the controller isn't running. |
| 1   | 2     | When set, do **not** turn off coolant outputs when the door opens — preserve the current coolant/spindle state across the door event. |

#### Common Examples
* **Default (door active):**  
  `$61=0` → Door-open events are handled normally (door will trigger DOOR/hold actions).

* **Allow opening the door while IDLE (for jogging/setup):**  
  `$61=1` → Door-open is ignored when the controller is IDLE (but still acts when running).

* **Keep coolant/spindle state across door events:**  
  `$61=2` → Do not turn off coolant when the door opens.

* **Both behaviours:**  
  `$61=3` → Ignore door when IDLE *and* keep coolant state on open.

#### Tips & Tricks
- **Retract / park / abort behaviour is not set by `$61`.** Use the parking settings (`$41` … `$60`) and feed-hold actions (`$63`) to control whether the machine performs a pull-out/park, power-down, or abort when the door opens.
- **Delays for restarting spindle/coolant after a door event** are controlled by the door delay settings (e.g. `$392` / `$393`).

---

## `$62` – Sleep Enable (boolean) {#62}
Enables the `$SLP` command, which allows the controller to enter a low-power sleep state.

> ℹ️ **Info**
> - This is an advanced power-saving feature.
> - When the `$SLP` command is received, grblHAL will shut down most peripherals and disable stepper motors.
> - A reset is required to bring the controller back online.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| The `$SLP` command is ignored. |
| 1     | Enabled | The `$SLP` command will put the controller to sleep. |

#### Common Examples
*   **Default for most machines:**
    *   `$62=0`

##### Tips & Tricks
- This setting is rarely used in typical CNC applications.
- It is more relevant for custom machines or battery-powered applications where minimizing power consumption is critical.

---

## `$63` – Feed Hold Actions  [(bitmask)](#bitmask) {#63}
Configures additional actions that occur during a Feed Hold and on resume.

> ℹ️ **Info**
> - Applies to Feed Hold commands, or input signal on the Feed Hold input pin (button, etc)
> - A standard Feed Hold smoothly decelerates the machine and pauses the G-code program.
> - `$63` allows you to modify how the **laser or spindle/coolant** behaves during the hold and when resuming.

| Bit | Value | Action |
|:---:|:-----:|:------|
| 0   | 1     | Disable laser (or spindle) during feed hold |
| 1   | 2     | Restore spindle and coolant state on resume |

#### Common Examples
* **Default: Disable laser during hold, restore on resume**  
  `$63=3` → Laser/spindle is disabled during feed hold, and restored automatically when resuming.  

* **Disable laser only, do not restore automatically**  
  `$63=1` → Laser/spindle stops during feed hold, but the previous state is not restored on resume.

* **Restore spindle/coolant on resume without disabling during hold**  
  `$63=2` → Laser/spindle continues running during hold, and previous states are restored when resuming.  

#### Tips & Tricks
- `$63` is primarily used for **laser or spindle setups** where you want controlled behavior during pauses.  
- For CNC mills, the Z-axis, parking, or coolant behavior is controlled separately (e.g., `$41–$60` for parking, `$7X` for coolant control).  
- Always test the behavior on your machine to avoid unexpected motion or spindle/laser state changes during feed hold.

---

## `$64` – Force Init Alarm (boolean) {#64}
Forces the controller to start up in an ALARM state.

> ℹ️ **Info**
> - This is a safety feature that ensures the machine cannot be moved until the user explicitly clears the alarm.
> - It is useful for machines where an immediate, uncommanded motion on startup could be dangerous.


| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Controller starts in an IDLE state, ready for commands. |
| 1     | Enabled | Controller starts in an ALARM state. An unlock command (`$X`) is required before any motion. |

#### Common Examples
*   **Default:**
    *   `$64=0`
*   **Safety-Critical Machine:**
    *   `$64=1`

##### Tips & Tricks
- This adds an extra layer of safety, requiring deliberate action from the operator before the machine can be moved.
- It is often used in combination with `$22` (Homing on Startup Required) to enforce a strict "unlock then home" workflow.

---

## `$65` – Probing Options  [(bitmask)](#bitmask) {#65}
Configures advanced options for probing cycles (`G38.x`).

> ℹ️ **Info**
> - This setting fine-tunes the behavior of probing operations.
> - Options mainly control **feed override during probing**, **soft-limit enforcement**, and **automatic toolsetter selection**.

| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | Allow Feed Override | Permits feed override (`F` adjustment) during probing commands. |
| 1   | 2     | Apply Soft Limits | Enforces soft-limit boundaries during probing to prevent leaving the machine workspace. |
| 3   | 8     | Auto Select Toolsetter | Automatically selects a toolsetter if one is configured for the probe operation. |
| 4   | 16    | Auto Select Probe 2 | Automatically selects the Secondary Probe |

#### Common Examples
* **Default:**  
  `$65=0` → No feed override, soft limits not applied, auto toolsetter disabled.

* **Allow feed override and soft-limit enforcement:**  
  `$65=3` → Bits 0 + 1 set; feed can be overridden, and probe stays within workspace.

* **Enable all options:**  
  `$65=11` → Bits 0 + 1 + 3; feed override allowed, soft limits applied, auto toolsetter selected.

#### Tips & Tricks
- Most users can leave `$65=0` for simple probing cycles.  
- Disable soft limits during probing can be helpful where you are probing unknown distances which may require a command that exceeds the max travel in Z for example, but you do know the probe will make contact before it actually reaches end of travel
- Use Auto Select Toolsetter only if your machine has a compatible toolsetter configured.
- Auto Select Toolsetter requires the machine to be homed and will probe at the G59.3 position. To facilitate the switch the G-Code program has to move to the G59.3 position (Preferable via Z-home for safety) before sending G38.
- Auto select probe 2 is implemented by the BLTouch plugin and is activated when it is configured to auto-deploy on G38 with M401D1. See https://github.com/grblHAL/Plugins_misc/tree/main#bltouch-probe

---

## `$66` - `$69` – Piecewise Linear Spindle Compensation {#66--69}
Configures a multi-point calibration curve to correct a non-linear speed response from a PWM-controlled spindle or VFD.

> ℹ️ **Info**
> - This is an advanced feature for fine-tuning spindle speed accuracy, especially when using PWM-to-analog (0-10V) converters or direct PWM drivers that exhibit non-linear behavior.
> - It allows you to create a "correction map" by defining multiple calibration points. Each point corrects a specific input `S` value (RPM) to its corresponding desired raw PWM output.
> - The settings (`$66`, `$67`, `$68`, `$69`) are **strings, where each string contains a comma-separated list of values** representing the calibration points.
> - The format for each point within the string is `RPM,PWM_VALUE`, allowing for a piecewise linear interpolation.

#### Example of String Format (Conceptual)
*   `$66=5000,100,10000,200`
    *   This sets two calibration points:
        *   At `S=5000 RPM`, output raw PWM `100`.
        *   At `S=10000 RPM`, output raw PWM `200`.

#### Tips & Tricks
- This is a highly advanced feature. For most users, ensuring `$30` (Max Spindle Speed), `$31` (Min Spindle Speed), `$35` (PWM Min Value), and `$36` (PWM Max Value) are set correctly is sufficient.
- To generate the precise values for these settings, you would typically:
    1.  Measure your spindle's actual RPM at various PWM outputs.
    2.  Use a calibration script, such as the [fit_nonlinear_spindle.py script from grbl's documentation](https://github.com/gnea/grbl/blob/master/doc/script/fit_nonlinear_spindle.py), to calculate the optimal correction points based on your measurements.
- The `fit_nonlinear_spindle.py` script calculates the string values for these settings.

---

## `$70` – Enable Network Services {#70}
The master switch for enabling or disabling network-related services (daemons), it is provided by the [networking plugin](/docs/reference/plugins#network-settings).

---

## `$71` – Bluetooth Device Name {#71}
Sets the broadcast name for the controller's Bluetooth interface.

> ℹ️ **Info**
> - This is the name that will appear in the list of available Bluetooth devices on your computer or phone.
> - This setting is only available on boards with a Bluetooth module.

| Value | Meaning |
|:------|:--------|
| String| The name for the Bluetooth device, e.g., "grblHAL-BT". |

---

## `$72` – Bluetooth Service Name {#72}
Sets the name of the Bluetooth serial port profile (SPP) service.


> ℹ️ **Info**
> - A technical setting for the Bluetooth service. In almost all cases, the default value should not be changed.

---

## `$73` – WiFi Mode {#73}
The master switch to select the operating mode for the [WiFi radio](/docs/reference/plugins#wifi-settings).

---

## `$74`and `$75` – WiFi Station SSID and Password {#74-75}
The data for connecting to a [WiFi](/docs/reference/plugins#wifi-sta-settings) router.

---

## `$76` - `$79` – WiFi Access Point Configuration {#76--79}
[WiFi](/docs/reference/plugins#wifi-ap-settings) configuration data for AP mode.

---

<!--

## `$80` – Spindle P-Gain {#80}
Sets the Proportional gain for the closed-loop spindle speed controller.


> ℹ️ **Info**
> - An advanced feature that requires a spindle with an encoder (`$38`) for RPM feedback.
> - The P-Gain is the primary driver of the correction. It applies a correction proportional to the current RPM error.
> - A higher P-Gain results in a faster response but can lead to instability and oscillation if too high.
> - Part of the PID control loop (`$80`, `$81`, `$82`).


#### Tips & Tricks
- Tuning a PID controller is an advanced topic. Start with the default values provided by your driver and adjust in small increments.

---

## `$81` – Spindle I-Gain
Sets the Integral gain for the closed-loop spindle speed controller.


> ℹ️ **Info**
> - An advanced PID tuning parameter for closed-loop spindle control.
> - The I-Gain works to eliminate small, steady-state errors over time by "integrating" the error. It pushes the system towards the exact target RPM.
> - A higher I-Gain can reduce steady-state error but can also cause overshoot.


---

## `$82` – Spindle D-Gain
Sets the Derivative gain for the closed-loop spindle speed controller.


> ℹ️ **Info**
> - An advanced PID tuning parameter for closed-loop spindle control.
> - The D-Gain works to dampen the system's response, reducing the overshoot and oscillation caused by the P and I terms.
> - It acts based on the rate of change of the error.


---

## `$83` – Spindle Deadband
Sets an RPM range around the target where no PID correction is applied.


> ℹ️ **Info**
> - A tuning parameter for the closed-loop spindle controller.
> - This prevents the PID loop from constantly making tiny, unnecessary adjustments ("hunting") when the RPM is very close to the target.


| Value (RPM) | Description |
|:-----------:|:------------|
| 0 - N       | The +/- RPM value from the target to consider "in position". |

#### Common Examples
*   **A small deadband of 10 RPM:**
    *   If the target is 10000 RPM, the controller will not make any corrections as long as the actual speed is between 9990 and 10010 RPM.
    *   `$83=10`

---

## `$84` - `$86` – Spindle Speed Max Error
Defines the maximum allowable error for each component of the speed PID controller before a fault may be triggered.


> ℹ️ **Info**
> - An advanced safety feature for the closed-loop spindle speed PID loop (`$80`-`$83`).
> - If the difference between commanded and actual RPM exceeds these limits, the system can trigger an alarm to prevent issues.
> - `$84`: Max Proportional Error
> - `$85`: Max Integral Error
> - `$86`: Max Derivative Error


---
-->

## `$90` – Position P-Gain 
Sets the Proportional gain for the spindle-synchronized motion controller.

> ℹ️ **Info**
> - This tunes the PID loop that controls the motion axes (e.g., Z and X on a lathe) to keep them perfectly in sync with the spindle's rotational **position**.
> - This is essential for lathe threading (`G33`) and rigid tapping.
> - The P-Gain is the primary driver for keeping the tool's position locked to the thread pitch.

---

## `$91` – Position I-Gain
Sets the Integral gain for the synchronized motion controller.

> ℹ️ **Info**
> - The I-Gain helps eliminate any "following error," ensuring the tool does not lag behind the spindle's rotation over the length of the thread.
> - Part of the Position PID loop (`$90`-`$96`).

---

## `$92` – Position D-Gain
Sets the Derivative gain for the synchronized motion controller.

> ℹ️ **Info**
> - The D-Gain helps to dampen oscillations and improve the stability of the synchronized motion, especially during acceleration.
> - Part of the Position PID loop (`$90`-`$96`).

---

## `$93` – Position Deadband
Sets a position error range (in encoder counts) where no PID correction is applied.


> ℹ️ **Info**
> - This defines the tolerance window for the synchronized motion.
> - It prevents the motion axes from constantly "hunting" or jittering in response to tiny fluctuations in the encoder signal.

---

## `$94` - `$96` – Position Max Error
Defines the maximum allowable following error for each component of the position PID controller.

> ℹ️ **Info**
> - An advanced safety feature for the synchronized motion loop.
> - If the tool's position deviates from the target by more than these values, a fault can be triggered.
> - `$94`: Max Proportional Error
> - `$95`: Max Integral Error
> - `$96`: Max Derivative Error

---

## `$100` – `$107` – Axis Travel Resolution {#100--107}

Defines the number of motor steps required to move an axis by **1 mm** (for linear axes) or **1 degree** (for rotary axes).
The last digit in the setting number corresponds to the [axis id](#axisid).

> ℹ️ **Info**
> - This is the most important setting for dimensional accuracy.
> - The value depends on your motor, driver microstepping, and mechanical transmission (belt, leadscrew, ballscrew, or rotary gear reduction).
> - A/B/C axes can be configured as **linear** or **rotary** with `$376`.
> - Related settings:
> - `$110`–`$117` (Max Rate)
> - `$120`–`$127` (Acceleration)

---

#### Formulae

- **Linear axes (steps/mm):**  
  - steps_per_mm = (Motor Steps/Rev × Microsteps) / Lead
  - *Lead = distance moved per motor revolution*  
  - For belts: `Lead = Pulley Teeth × Belt Pitch`  
  - For screws: `Lead = screw lead (mm/rev)`  

- **Rotary axes (steps/deg):**  
  - steps_per_deg = (Motor Steps/Rev × Microsteps × Gear Ratio) / 360

#### Common Linear Motion Values

| Transmission | Lead (mm/rev) | 8 µsteps | 16 µsteps | 32 µsteps |
|--------------|---------------|----------|-----------|-----------|
| **Belts (GT2) 16T Pulley** | 32 | 50 | 100 | 200 |
| **Belts (GT2) 20T Pulley** | 40 | 40 | 80 | 160 |
| **Belts (GT2) 32T Pulley** | 64 | 25 | 50 | 100 |
| **Belts (GT3) 20T Pulley** | 60 | 26.67 | 53.33 | 106.67 |
| **Belts (HTD5) 20T Pulley** | 100 | 16 | 32 | 64 |
| **Lead screw TR8x2** | 2 | 800 | 1600 | 3200 |
| **Lead screw TR8x4** | 4 | 400 | 800 | 1600 |
| **Lead screw TR8x8** | 8 | 200 | 400 | 800 |
| **Lead screw TR10x10** | 10 | 160 | 320 | 640 |
| **Ballscrew 1204** | 4 | 400 | 800 | 1600 |
| **Ballscrew 1605** | 5 | 320 | 640 | 1280 |
| **Ballscrew 1610** | 10 | 160 | 320 | 640 |

---

#### Common Rotary Motion Values

| Motor | Gear Ratio | 8 µsteps | 16 µsteps | 32 µsteps |
|-------|------------|----------|-----------|-----------|
| 1.8° (200 steps) | 1:1 (direct) | 4.44 | 8.89 | 17.78 |
| 1.8° (200 steps) | 6:1 | 26.67 | 53.33 | 106.67 |
| 1.8° (200 steps) | 10:1 | 44.44 | 88.89 | 177.78 |
| 1.8° (200 steps) | 18:1 | 80 | 160 | 320 |
| 1.8° (200 steps) | 72:1 | 320 | 640 | 1280 |
| 0.9° (400 steps) | 1:1 (direct) | 8.89 | 17.78 | 35.56 |
| 0.9° (400 steps) | 50:1 | 444.44 | 888.89 | 1777.78 |

---

#### Tips & Tricks
- Always verify by commanding a long move (`G91 G1 X100 F500` or similar) and measuring actual distance or angle.  
- Adjust `$100`–`$105` proportionally based on the error. See [**Calibrating Steps per mm**](/docs/calibration/steps).
- For rotary axes, ensure `$376` is set correctly to mark the axis as **rotary** (steps/deg) or **linear** (steps/mm).  

---

## `$110` – `$117` – Axis Maximum Rate {#110--117}

Sets the maximum speed for each axis in **mm/min** (linear) or **degrees/min** (rotary).
The last digit in the setting number corresponds to the [axis id](#axisid).

> ℹ️ **Info**
> - This acts as a hard speed limit for each motor to prevent it from stalling due to lost torque at high speeds.
> - The value should be determined through testing to find the highest *reliable* speed.
> - This is related to `$120`–`$127` (Acceleration). An axis can often reach a higher max rate if the acceleration is not too aggressive.

#### Typical Value Ranges

| Axis Type | Machine Type | Typical Max Rate (mm/min or deg/min) |
|:----------|:-------------|:-------------------------------------|
| **Linear**| Hobby Screw-Drive | 500 - 3000 |
| **Linear**| Hobby Belt-Drive | 2000 - 10000+ |
| **Linear (Z)**| Screw-Drive | 500 - 2000 (Usually much lower than X/Y) |
| **Rotary**| Hobby 4th-Axis | 1000 - 10000 (3600 = 10 RPM) |

#### Common Examples
*   **Hobby CNC Router (X, Y, Z):**
    *   `$110=5000`
    *   `$111=5000`
    *   `$112=1500`
*   **Small Rotary Table (A-axis):**
    *   `$113=3600` (10 RPM)

#### Tips & Tricks
- To find the true maximum, start low and incrementally increase the value, commanding long rapid moves (e.g., `G0 X200`). Listen for the motor stalling (a loud buzzing/grinding sound), then back the value off by 20-30% for a safety margin.
- The effective speed of a diagonal (`XY`) move is limited by the lower of the two axes' max rate settings.
- See our detailed guide: [**Tuning Motion**](/docs/calibration/motion).

---

## `$120` – `$127` – Axis Acceleration {#120--127}

Sets how quickly each axis can change its speed, in **mm/s²** (linear) or **degrees/s²** (rotary).
The last digit in the setting number corresponds to the [axis id](#axisid).

> ℹ️ **Info**
> - This is one of the most important settings for balancing performance and reliability.
> - Low acceleration is "soft" and reliable. High acceleration is "snappy" but requires significantly more motor torque.
> - If set too high, motors will lose steps on direction changes or short, fast moves, causing positional errors.

#### Typical Value Ranges

| Axis Type | Machine Type | Typical Acceleration (mm/s² or deg/s²) |
|:----------|:-------------|:---------------------------------------|
| **Linear (X/Y)**| Light, Rigid Machine | 250 - 1000+ |
| **Linear (X/Y)**| Heavy Gantry | 50 - 200 |
| **Linear (Z)**| Standard Spindle | 50 - 150 (Usually much lower than X/Y) |
| **Rotary**| Hobby 4th-Axis | 100 - 500 |

#### Common Examples
*   **Hobby CNC Router (X, Y, Z):**
    *   `$120=500`
    *   `$121=400` (Y-gantry is heavier)
    *   `$122=100`
*   **Standard 4th-Axis Add-on:**
    *   `$123=300`

#### Tips & Tricks
- A "jerk test" is the best way to tune this. Command many short, rapid, back-and-forth moves (e.g., `G0 X1`, `G0 X0` in a loop). Increase acceleration until the motor stalls, then back the value off by 20-30%.
- Setting Z-acceleration too high is a primary cause of lost steps, leading to incorrect cutting depths. Be conservative.

---

## `$130` – `$137` – Axis Maximum Travel {#130--137}

Defines the total travel distance for each axis in **mm** (linear) or **degrees** (rotary).
The last digit in the setting number corresponds to the [axis id](#axisid).

> ℹ️ **Info**
> - This value defines the size of your machine's work envelope.
> - It is measured from the point where the homing switch triggers (`MPos:0`) to the opposite end of physical travel.
> - This setting is **essential** for the **Soft Limits (`$20`)** feature to work correctly.

#### Common Examples
*   **300x400x80mm CNC:**
    *   `$130=300`
    *   `$131=400`
    *   `$132=80` (or `-80` if Z homes at the top)
*   **Continuously Rotating 4th Axis:**
    *   Set to a 0 to allow unlimited rotations.
    *   `$133=0`
*   **Limited Trunnion (B-axis, 0-110°):**
    *   `$134=110.0`

#### Tips & Tricks
- To set this accurately, home the machine (`$H`). Then, jog an axis to its furthest physical limit. The machine position (`MPos`) displayed is the value to enter for that axis.
- Always set the value slightly less than the absolute maximum physical travel to provide a safety margin.

---
## `$140` - `$147` – Motor Current {#140--147}
A placeholder setting for motor current on some drivers.
The last digit in the setting number corresponds to the [axis id](#axisid).


> ℹ️ **Info**
> - In many modern grblHAL drivers (especially Trinamic), motor current is set via other, more specific settings (e.g., in the `$2xx` range).
> - This setting is often a legacy placeholder or used by simpler driver implementations.
> - The units are driver-dependent and may not be amps.

#### Tips & Tricks
- For most users, this setting will have no effect. Check your board's documentation to see how motor current is configured.

---

## `$150` - `$157` – Axis Microsteps {#150--157}
A placeholder setting for microstepping on some drivers.
The last digit in the setting number corresponds to the [axis id](#axisid).


> ℹ️ **Info**
> - On most controller boards, microstepping is set via physical jumpers or DIP switches on the stepper driver itself.
> - This software setting is only used by drivers that support programmable microstepping (like Trinamic drivers).
> - Even with Trinamic drivers, this setting may be superseded by other, more advanced configuration methods.

#### Tips & Tricks
- Always set the physical jumpers on your drivers first. Only change this setting if your board's documentation explicitly states it is used.
- Your Travel Resolution (`$100`-`$107`) must be updated if you change your microstepping.

---

## `$160` - `$167` – Backlash Compensation {#160--167}
Applies a small, extra move when an axis changes direction to compensate for mechanical backlash.
The last digit in the setting number corresponds to the [axis id](#axisid).


> ℹ️ **Info**
> - Backlash causes dimensional inaccuracy, making circles oval and squares have misaligned corners.
> - This is a **software fix** for a **mechanical problem**. The best solution is always to reduce mechanical backlash first with anti-backlash nuts or tight belts.

| Value (mm) | Description |
|:----------:|:------------|
| 0.0 - N    | The measured amount of backlash in the axis. |

#### Common Examples
*   **Well-tuned machine:**
    *   `$160=0.0`
*   **Hobby machine with some lead screw wear:**
    *   `$160=0.05`

#### Tips & Tricks
- To measure backlash, use a dial indicator. Command a small move in one direction (`G91 G1 X1 F100`), zero the indicator, then command a move in the opposite direction (`X-1`). The amount the indicator *doesn't* move is your backlash value.

---

## `$170` - `$172` – X, Y, Z-axis Dual-axis Offset {#170--172}
An advanced setting for adjusting the offset in a dual-motor (ganged) setup after homing.
The last digit in the setting number corresponds to the [axis id](#axisid).

> ℹ️ **Info**
> - Used with auto-squaring gantries that use two homing switches.
> - After the initial homing finds both switches, this value applies a tiny electronic offset to correct for minor physical misalignment of the switches, ensuring perfect squareness.

| Value (mm) | Description |
|:----------:|:------------|
| -N to +N   | The small offset to apply to the slave motor after homing. |

#### Tips & Tricks
- This is an advanced setting. For most users, ensuring the homing switches are physically aligned is the primary method of squaring the gantry.

---

## `$200` - `$227` – Trinamic driver settings
These are settings for Trinamic drivers, they are provided by the [Trinamic plugin](/docs/reference/plugins#trinamic-settings).

---

## `$300` - `$308` – Ethernet settings
These are settings for ethernet, they are provided by the [ethernet plugin](/docs/reference/plugins#ethernet-settings).

---

## `$310` - `$328` – WiFi settings
These are settings for WiFi, they are provided by the [WiFi plugin](/docs/reference/plugins#wifi-settings).

---

## `$330` - `$332` – WebUI settings
These are settings for the WebUI, they are provided by the [WebUI plugin](/docs/reference/plugins#webui-settings).

---

## `$332` – NTP Server URI 1
Sets the address of the primary Network Time Protocol (NTP) server.

> ℹ️ **Info**
> - NTP is an internet protocol used to automatically synchronize the controller's internal clock.
> - An accurate clock is useful for timestamping files on an SD card.
> - This setting provides the address of the primary time server to contact.

| Value | Meaning | Description |
|:------|:--------|:------------|
| URI   | The address of an NTP server. |

#### Common Examples
*   **Use the public NTP pool (recommended):**
    *   This is a resilient, distributed time source.
    *   `$332=pool.ntp.org`

#### Tips & Tricks
- The controller must have a valid internet connection (Gateway `$303` and DNS) for NTP to work.
- `$333` and `$334` can be used to specify secondary and tertiary backup NTP servers.

---

## `$333` – NTP Server URI 2
Sets the address of the secondary (backup) Network Time Protocol (NTP) server.


> ℹ️ **Info**
> - If the primary NTP server (`$332`) is unreachable, the controller will try to contact this server instead.
> - This provides redundancy for the time-syncing feature.

| Value | Meaning | Description |
|:------|:--------|:------------|
| URI   | The address of an NTP server. |

#### Common Examples
*   **Use a government time server as a backup:**
    *   `$333=time.nist.gov`

---

## `$334` – NTP Server URI 3
Sets the address of the tertiary (backup) Network Time Protocol (NTP) server.

> ℹ️ **Info**
> - If both the primary (`$332`) and secondary (`$333`) NTP servers are unreachable, the controller will try this server.

| Value | Meaning | Description |
|:------|:--------|:------------|
| URI   | The address of an NTP server. |

---

## `$335` – Timezone / Timezone ID {#335}
Sets the local timezone to correctly offset the UTC time received from NTP servers.

> ℹ️ **Info**
> - NTP servers provide time in Coordinated Universal Time (UTC). This setting applies an offset to display the correct local time.
> - This ensures that file timestamps on the SD card are accurate for your geographic location.
> - The format is a POSIX TZ string, which can be complex.

| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The POSIX TZ string for your timezone. |

#### Common Examples
*   **USA Eastern Time (EST/EDT):**
    *   `$335=EST5EDT,M3.2.0,M11.1.0`
*   **Central European Time (CET/CEST):**
    *   `$335=CET-1CEST,M3.5.0,M10.5.0/3`

#### Tips & Tricks
- Searching online for "POSIX TZ string" for your specific location is the best way to find the correct value.

---

## `$336` – DST Active (boolean) {#336}
Indicates if Daylight Saving Time (DST) is currently active.

> ℹ️ **Info**
> - This setting is often managed automatically by the system when a full POSIX timezone string is used in `$335`.
> - In some simpler implementations, it may need to be set manually.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Standard time is in effect. |
| 1     | Enabled | Daylight Saving Time is in effect. |

---

## `$337` – WiFi AP BSSID {#337}
Stores the BSSID (MAC address) of the WiFi access point.

> ℹ️ **Info**
> - This is a technical setting for WiFi-enabled controllers.
> - It can be used to force the controller to connect to a specific access point, even if multiple access points have the same network name (SSID).

#### Tips & Tricks
- For most users on a simple home WiFi network, this setting can be left blank.

---

## `$338` – Trinamic Driver Enable {#338}
## `$339` – Trinamic ensorless Homing {#339}
These are settings for Trinamic drivers, they are provided by the [Trinamic plugin](/docs/reference/plugins#trinamic-settings).

---

## `$340` – Spindle at Speed Tolerance (%) {#340}
The tolerance used for the "spindle at speed" input signal.

> ℹ️ **Info**
> - For advanced spindles with RPM feedback, this tells grblHAL how close the actual speed must be to the commanded speed before it considers the spindle "at speed" and continues.
> - This is a percentage of the commanded `S` value.

| Value (%) | Description |
|:---------:|:------------|
| 0 - 100   | The allowable percentage deviation. |

#### Common Examples
*   **A 5% Tolerance:**
    *   If you command `S10000`, the spindle is considered "at speed" between 9500 and 10500 RPM.
    *   `$340=5`

*   **Disable Tolerance:**
    *   Ignore spindle at speed, use Spindle Delay instead.
    *   `$340=0`


> 🔥 **Danger**
> You may get **"Error 14"** errors if spindle is either unable to reach or stay within tolerance, or if communication is not working (Incorrect Modbus settings for example)

---

## `$341` – Tool Change Mode {#341}
Selects the procedure to be used for an `M6` tool change command.

> ℹ️ **Info**
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| `M6` commands are ignored. |
| 1     | Manual  | Pauses the machine and waits for the user to change the tool and press Cycle Start. |
| 2+    | Semi automatic | Initiates a predefined tool change sequence |

#### Common Examples
*   **Simple Manual Tool Change:**
    *   `$341=1`
*   **A predefined tool change sequence**
    *   `$341=2`

#### Tips & Tricks
- Semi Automatic tool change sequences are hardcoded in the core
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$342` – Tool Change Probing Distance (mm) {#342}
Sets the maximum distance the Z-axis will travel when searching for the toolsetter during a tool change.

> ℹ️ **Info**
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change
> - When using an automated toolsetter, this is a safety setting to prevent a crash if the probe fails.
> - The value should be large enough to account for the difference between your longest and shortest tools.

| Value (mm)| Description |
|:---------:|:------------|
| 1 - N     | The maximum probing distance. Typically negative for a Z-axis moving down. |

#### Common Examples
*   **Typical Toolsetter Setup:**
    *   `$342=-50.0`

#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$343` – Tool Change Probe Feed (Locate Feed) {#343}
Sets the slower "locate" feed rate for the final, precise touch on the toolsetter.


> ℹ️ **Info**
> - After the initial fast search, the machine will retract and re-approach slowly at this rate for maximum accuracy.
> - This is analogous to the `$24` (Homing Locate Rate).
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change

| Value (mm/min)| Description |
|:-------------:|:------------|
| 10 - 100      | A slow, precise speed for accurate tool measurement. |

#### Common Examples
*   **High-Precision Toolsetter:**
    *   `$343=25`

#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$344` – Tool Change Seek Rate {#344}
Sets the faster feed rate for the initial search for the toolsetter.

> ℹ️ **Info**
> - This is the speed the machine moves at the start of the tool measurement probe.
> - This is analogous to the `$25` (Homing Search Rate).
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change

| Value (mm/min)| Description |
|:-------------:|:------------|
| 200 - 1000+   | A safe but efficient speed to find the toolsetter. |

#### Common Examples
*   **Standard Toolsetter Setup:**
    *   `$344=400`

#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$345` – Tool Change Probe Pull-off / Retract {#345}
Sets the distance the Z-axis retracts after the probe is complete.

> ℹ️ **Info**
> - This moves the tool clear of the toolsetter after the measurement is complete.
> - This is analogous to the `$27` (Homing Pull-off Distance).
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change

| Value (mm)| Description |
|:---------:|:------------|
| 1 - N     | The distance to retract after probing. |

#### Common Examples
*   **Standard Toolsetter Setup:**
    *   `$345=2.0`

#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$346` – Tool Change Options (mask) {#346}
Configures advanced options for the tool change process.


> ℹ️ **Info**
> - This is a **bitmask** that enables or disables specific behaviors during an `M6` sequence.
> - The available options depends on the tool change mode selected by `$341`.
> - This setting applies to Manual/Semi-Automatic Toolchanges, they are not used when the ATC is enabled.
> - It requires the sender to handle the new TOOL state: https://github.com/grblHAL/core/wiki/Manual,-semi-automatic-and-automatic-tool-change

#### Tips & Tricks
- `$341` - `$346` are not available if an ATC is configured. See `$675`.

---

## `$347` - `$349` – Dual Axis Length Fail {#347--349}
A safety feature for ganged axes to detect if the gantry has become skewed or racked.

> ℹ️ **Info**
> - This feature is for machines with two motors driving a single axis (e.g., a dual-Y gantry).
> - It compares the positions of the two motors. If they differ by more than the allowed amount, it triggers an alarm.
> - `$347`: **Fail Percent:** The maximum allowed difference as a percentage of the move length.
> - `$348`: **Fail Min:** A minimum move length before this check is activated.
> - `$349`: **Fail Max:** A maximum difference in mm, regardless of percentage.

---

## `$350` - `$369` – Plasma/THC settings {#350--359}
These are settings for Plasma, they are provided by the [Plasma plugin](/docs/reference/plugins#plasma-settings).

---

## `$370` – Invert I/O Port Inputs [(bitmask)](#bitmask) {#370}
Inverts the logic for the generic digital input pins.

> ℹ️ **Info**
> - This is a grblHAL-specific feature for advanced I/O control.
> - It allows you to invert the signal for any of the general-purpose input pins that are not already assigned to a specific function like limits or controls.

| Bit | Value | Input to Invert |
|:---:|:-----:|:----------------|
| 0   | 1     | I/O Port 0      |
| 1   | 2     | I/O Port 1      |
| 2   | 4     | I/O Port 2      |
| ... | ...   | And so on...    |

#### Tips & Tricks
- This is an advanced setting used when integrating custom hardware or macros that read digital inputs.
- You must know the I/O port number that corresponds to the physical pin on your controller.
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.

---

## `$371` – IO Port Pull-up Disable [(bitmask)](#bitmask) {#371}
Disables the internal pull-up resistors on the generic digital input pins.

> ℹ️ **Info**
> - This works exactly like [$17](#17) (Control Inputs) and `$18` (Limit Inputs), but applies to the general-purpose I/O ports.
> - Only disable this if your external hardware provides its own pull-up or is an "active" (push-pull) driver.

| Bit | Value | Input Pull-up to Disable |
|:---:|:-----:|:-------------------------|
| 0   | 1     | I/O Port 0               |
| 1   | 2     | I/O Port 1               |
| 2   | 4     | I/O Port 2               |
| ... | ...   | And so on...             |

#### Tips & Tricks
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.
- [M62, M63, M64 and M65 – Synchronized and Asynchronous I/O](/docs/reference/gcode#m62-m65)
-  [M66 – Wait for Input Signal](/docs/reference/gcode#m66)
-  [M67, M68 – Set Analog Output](/docs/reference/gcode#m67-m68)

---

## `$372` – Invert I/O Port Outputs  [(bitmask)](#bitmask) {#372}
Inverts the logic for the generic digital output pins.


> ℹ️ **Info**
> - This allows you to flip the signal for general-purpose outputs, for example, to control a relay that requires an active-low signal to turn on.

| Bit | Value | Output to Invert |
|:---:|:-----:|:-----------------|
| 0   | 1     | I/O Port 0       |
| 1   | 2     | I/O Port 1       |
| 2   | 4     | I/O Port 2       |
| ... | ...   | And so on...     |

#### Tips & Tricks
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.
- [M62, M63, M64 and M65 – Synchronized and Asynchronous I/O](/docs/reference/gcode#m62-m65)
-  [M66 – Wait for Input Signal](/docs/reference/gcode#m66)
-  [M67, M68 – Set Analog Output](/docs/reference/gcode#m67-m68)

---

## `$373` – IO Open-Drain Enable {#373}
Configures generic output pins to operate in "open-drain" mode.

> ℹ️ **Info**
> - This is an advanced electrical configuration. In open-drain mode, the pin can only pull the signal to Ground (low). It cannot drive it High. An external pull-up resistor is required.
> - This is useful for interfacing with devices that operate at a different voltage level or for connecting multiple devices to a single signal line.

#### Tips & Tricks
- Use the `$PINS` command to list all pins including auxiliary I/O ports.
- `$PINSTATE` command can be used to check pin capabilities and current state.
- [M62, M63, M64 and M65 – Synchronized and Asynchronous I/O](/docs/reference/gcode#m62-m65)
-  [M66 – Wait for Input Signal](/docs/reference/gcode#m66)
-  [M67, M68 – Set Analog Output](/docs/reference/gcode#m67-m68)

---

## `$374` – ModBus Baud Rate (index) {#374}
Configures the serial communication speed for the built-in Modbus RTU interface.

> ℹ️ **Info**
> - This setting must **exactly** match the baud rate configured in your VFD or other Modbus device.
> - The value is an index, not the baud rate itself.

| Index | Baud Rate |
|:-----:|:----------|
| 0     | 9600      |
| 1     | 19200     |
| 2     | 38400     |
| 3     | 57600     |
| 4     | 115200    |

#### Common Examples
*   **Many VFDs default to 9600 baud:**
    *   `$374=0`
*   **Faster communication:**
    *   `$374=1` (for 19200 baud)

#### Tips & Tricks
  *   Check your VFDs manual, or go into the VFD settings and check what the Modbus Baud Rate is set to

---

## `$375` – ModBus RX Timeout (ms) {#375}
Sets the time grblHAL will wait for a response from a Modbus device before flagging an error.

> ℹ️ **Info**
> - If a response from the VFD is not received within this time, grblHAL will report a communication error.

| Value (ms) | Description |
|:----------:|:------------|
| 1 - N      | The timeout in milliseconds. |

#### Common Examples
*   **Default Timeout:**
    *   `$375=200`

#### Tips & Tricks
- If you are on a very slow or noisy serial line, you may need to increase this value slightly, but for most setups, the default is fine.

---

## `$376` – Rotary Axes Mask {#376}
Identifies which axes are rotary axes, as opposed to linear axes.


> ℹ️ **Info**
> - This is a crucial setting for machines with a 4th or 5th axis. It tells the G-code interpreter that coordinates for these axes are in degrees.
> - It also affects feed rate calculations when using Inverse Time Feed Mode (`G93`).
> - This is a **bitmask**: add together the values of your rotary axes.

| Bit | Value | Axis is Rotary |
|:---:|:-----:|:---------------|
| 0   | 1     | A-Axis |
| 1   | 2    | B-Axis |
| 2   | 4    | C-Axis |

#### Common Examples
*   **Standard 3-Axis Mill (No Rotary):**
    *   `$376=0`
*   **4-Axis Mill with a Rotary A-Axis:**
    *   `$376=1`
*   **5-Axis Mill with A and C Rotary Axes:**
    *   `1` (A) + `4` (C) → `$376=5`

#### Tips & Tricks
- The first three axes (X, Y, Z) are always assumed to be linear and cannot be set as rotary.

---

## `$377` – Bluetooth Module Status (Config Flag for Auto-Configuration) {#377}
Manages the initialization state of an external Bluetooth module

> ℹ️ **Info**
> - This setting is specifically for external UART-connected Bluetooth modules. It is **not** applicable for Bluetooth functionality provided directly by the controller's chipset.
> - It is used by the Bluetooth plugin to control and report on the module's initialization status.
> - Setting it to `0` typically signals the plugin to attempt (or re-attempt) auto-configuration of the external Bluetooth module. A successful auto-configuration process will then set this value to `1`.

> ℹ️ **Info**
> To achieve this an UART port and an interrupt capable auxillary input pin is required - the input pin has to be connected to the module STATE pin (See `$385`). The plugin will claim the highest numbered Aux input pin, this can be found by either checking the board map file or listing the available pins with the $pins system command.

| Value | Meaning |
|:-----:|:--------|
| 0     | Signals the Bluetooth plugin to attempt auto-configuration/initialization of the external module. |
| 1     | Indicates the external Bluetooth module has been successfully initialized (set by the plugin). |

#### Auto configuration

Ensure the $377 setting is set to 0 (it can be found in the Bluetooth group if your sender supports grouping of settings). Power up the controller and the module while pressing down the AT-mode switch on the module. This will change the controller baud rate to 38400 and it will then send the AT commands required for configuration. Reports will be sent to the default com port indicating success or failure. Success is also indicated by $377 beeing set to 1. After auto configuration is completed cycle power to both the module and the controller to start normal operation.

#### Manual configuration
If the module is already configured for correct operation (baud rate set to 115200 baud) then automatic switching can be enabled by setting $377 to 1.

#### Tips & Tricks
- For a comprehensive guide, refer to the [grblHAL Bluetooth Plugin documentation](https://github.com/grblHAL/Plugins_Bluetooth/#auto-configure).

---

## `$384` – G92 Persistence {#384}
TBC

---

## `$385` – Keep Last Tool {#385}
Enables the persistence of the last used tool number across restarts.

---

## `$385` – Keep Last Tool {#385}
Enables the persistence of the last used tool number across restarts.


> ℹ️ **Info**
> - If enabled (`1`), the controller will remember which tool was active (`T` number) before a power cycle or reset and restore it on startup.

| Value | Meaning |
|:-----:|:--------|
| 0     | Disabled |
| 1     | Enabled |

---

## `$386` - `$389` – Fan settings {#386--389}
These are settings for fans, they are provided by the [Fan plugin](/docs/reference/plugins#fan-settings).

---

## `$390` and `$391` – Laser plugin settings {#390-391}
These are settings for (CO2) lasers, they are provided by the [Laser plugin](/docs/reference/plugins#laser-settings).

---

## `$392` – Door Spindle On Delay (sec) {#392}
Adds a delay after the safety door is closed before the spindle is automatically restarted.


> ℹ️ **Info**
> - A safety feature used with the Safety Door (`$61`) system.
> - Provides a "grace period" after the door is closed before the spindle automatically turns back on.
> - **Spindle Ramp Up:** If `$9` bit 3 is set, this setting (`$392 > 0`) enables Spindle Ramp Up on door close and/or restore from parked.

---

## `$393` – Door Coolant On Delay (sec) {#393}
Adds a mandatory delay after the safety door is closed before coolant outputs are re-activated.


> ℹ️ **Info**
> - This is a safety feature, similar to `$392` (Door Spindle On Delay).
> - It prevents coolant from spraying unexpectedly immediately after the door is closed, giving the operator time to clear the area.

| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds. |

---

## `$394` – Spindle On Delay (sec) {#394}
Adds a mandatory delay after a spindle start command is executed, before motion resumes.


> ℹ️ **Info**
> - This is a critical setting for machines with VFDs or large spindles that require time to accelerate to the commanded speed.
> - It forces grblHAL to pause for a specified time after an `M3` or `M4` command.
> - **Spindle Ramp Up:** If `$9` bit 3 is set, this setting (`$394 > 0`) enables Spindle Ramp Up for spindle on and on RPM changes while spindle is enabled.

> 💡 **Tip**
> When "spindle-at-speed" is configured by `$340` this setting is ignored

| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds. |

#### Common Examples
*   **CNC with a VFD-controlled Spindle:**
    *   It might take 3-4 seconds for the spindle to reach 18000 RPM.
    *   `$394=4.0`
*   **Simple router with instant-on:**
    *   `$394=0.5` (a small safety delay)

#### Tips & Tricks
- Using this setting is much safer than relying on `G4` dwell commands in G-code, as it prevents the tool from plunging into the material before the spindle is at full speed.
- Time how long it takes for your spindle to reach its typical operating speed and set this value accordingly, adding a small safety margin.
- Also see `G65P6` which turns off all spindle delays for the next M3, M4 and M5 command. Useful for ATCs which use the spindle to lock/unlock the spindle collet nut.
- The reason for having both a general delay and a door open delay is that the general delay is not needed (nor wanted) if G4 is used for spindle delay in the g-code.

---

## `$395` – Default Spindle Index/Type {#394}
Selects the default spindle to be used if not otherwise specified by a command.

> ℹ️ **Info**
> - grblHAL supports multiple spindle types (e.g., PWM, Modbus VFD, Relay) that can coexist.
> - This setting determines which spindle is considered the "default" and will respond to standard `M3`/`M4`/`M5` commands.

| Value | Meaning |
|:-----:|:--------|
| 0     | Spindle 0 |
| 1     | Spindle 1 |
| ...   | ... |

#### Tips & Tricks
- This is an advanced setting for machines with multiple or complex spindle configurations. For most users with a single spindle or laser, the default value (`0`) is correct.

---

## `$396`, `$397` – WebUI Settings {#396-397}
These are settings for the WebUI, they are provided by the [WebUI plugin](/docs/reference/plugins#webui-settings).

---

## `$398` – Planner Buffer Blocks {#398}
Configures the size of the motion planner buffer.

> ℹ️ **Info**
> - The planner buffer is where grblHAL stores upcoming motion blocks. This allows it to "look ahead" to calculate smooth accelerations and manage cornering speeds.
> - A larger buffer allows for smoother motion on complex paths with many small line segments (like 3D carving or raster engraving).
> - The maximum size is limited by the available RAM on your controllerm or capped to a max of 1000 blocks

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 16-1000  | The number of motion blocks to buffer. |

#### Common Examples
*   **Standard Controller (e.g., STM32F4xx):**
    *   `$398=32`
*   **High-Performance Controller (e.g., iMXRT1062 / Teensy 4.1):**
    *   `$398=64`

#### Tips & Tricks
- The maximum useful value depends on the processor speed and whether it has a FPU or not. This since the planner buffer is continuously processed to determine the optimal feed rate. Since a larger buffer takes longer to process there will be a point where increasing the buffer size will lead to reduced performance.

---

## `$399` – CANbus Baud Rate {#399}
Sets the communication speed for an integrated CAN bus interface.

> ℹ️ **Info**
> - This is for controllers that communicate with external devices (e.g., smart motor drivers, I/O expanders) over a CAN bus network.
> - The value must match the baud rate of all other devices on the CAN bus.

| Index | Baud Rate |
|:-----:|:----------|
| 0     | 125 kbps  |
| 1     | 250 kbps  |
| 2     | 500 kbps  |
| 3     | 1 Mbps    |

---

## `$400` - `$449` – Encoder Settings {#400-449}
These are settings for the Encoders, they are provided by the [Encoder plugin](/docs/reference/plugins#encoder-settings).

---

## `$450 - $459` – User Defined Slots {#450--459}
Ten general-purpose "slots" that are for private custom settings values implemented by plugins

> ℹ️ **Info**
> - These settings (`$450`-`$459`) are provided as persistent storage for use within custom plugins
> - The most common use is to store settings that are then read or used by the plugin.

| Value | Meaning |
|:-----:|:--------|
| Any   | Can store floating-point numbers or integers for use in plugins. The data type and meaning of each setting is declared by the plugin itself |

> [!WARNING]
> Do _not_ use for plugins/customizations that are published and thus available for wide use.

---

## `$460` - `$479` – Spindle {#460--479}
These are settings for spindles, they are provided by the [Spindle plugin](/docs/reference/plugins#spindle-settings).

## `$480` – Fan 0 Off Delay
Sets an "off delay" timer for a connected fan.

> ℹ️ **Info**
> - This can be used as a "run-on" timer. After the fan is commanded to turn off, it will continue to run for this duration.

| Value (seconds) | Description |
|:---------------:|:------------|
| 0 - N           | The run-on time in seconds. |

#### Tips & Tricks
- Useful for ensuring a component (like a spindle or laser) is fully cooled down after the job is complete.
- Can be used to ensure all the smoke is ventilated from an enclosed laser machine for example

---

## `$481` – Auto Report Interval (ms) {#481}
Sets the interval for the automatic, unsolicited streaming of status reports.

> ℹ️ **Info**
> - This is an advanced feature primarily for network-based connections.
> - When set to a non-zero value, the controller will automatically send a `?` status report at this interval without the GUI needing to request it.
> - This can reduce network traffic compared to a constant polling loop from the sender.

| Value (ms) | Meaning | Description |
|:----------:|:--------|:------------|
| 0          | Disabled| Status reports are only sent when requested with `?`. (Default) |
| 100 - N    | Interval | The time in milliseconds between each automatic report. |

#### Common Examples
*   **Stream a report 5 times per second:**
    *   `$481=200`

#### Tips & Tricks
- This should only be enabled if your G-code sender is specifically designed to work with an auto-reporting stream. Using it with a standard polling sender will result in a flood of duplicate messages.
- May also be useful for pendants (pendant firmware needs ability to be configured not to send realtime polls)
- `0x8C` Realtime command can be used to toggle auto real time report mode on/off, available when the auto real time report is enabled. The current state can be queried. ioSender turns it off when connected and restores it on disconnect.

---

## `$482` – Timezone Offset {#482}
Sets the timezone as a simple offset from UTC in minutes.

> ℹ️ **Info**
> - This is a simpler alternative to the full POSIX TZ string in `$335`.
> - It is used to correct the UTC time from an NTP server to your local time.
> - It does **not** automatically handle Daylight Saving Time.

| Value | Meaning |
|:------|:--------|
| -N to +N| The offset from UTC in minutes. |

#### Common Examples
*   **USA Eastern Standard Time (EST is UTC-5):**
    *   -5 hours * 60 minutes/hour = -300 minutes.
    *   `$482=-300`
*   **Central European Time (CET is UTC+1):**
    *   +1 hour * 60 minutes/hour = 60 minutes.
    *   `$482=60`

---

## `$483` – Fan To Spindle Link
Links a fan's operation directly to the spindle or laser's state.

> ℹ️ **Info**
> - This setting allows a fan to be automatically turned on whenever the spindle/laser is running (`M3`/`M4`) and turned off when the spindle stops (`M5`).
> - This is commonly used for a spindle/laser cooling fan or a dust collection vacuum that should only run when cutting.
> - The value is a **bitmask** linking a fan number to a spindle/tool head number.

---

## `$484` – Unlock Required After E-Stop {#484}
A safety feature that requires an explicit unlock command after an E-stop has been cleared by a reset.


> ℹ️ **Info**
> - This prevents the machine from becoming immediately active after a reset that follows an alarm condition.
> - It forces the operator to deliberately unlock the machine (`$X`) before any motion is possible.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| The machine is IDLE and ready for commands immediately after reset. |
| 1     | Enabled (Default) | The machine enters an ALARM state after reset, requiring `$X` to unlock. (Safer) |

#### Common Examples
*   **For Enhanced Safety:**
    *   `$484=1`

---

## `$485` – Enable Tool Persistence {#485}
Controls whether the last used tool number is remembered after a reset.


> ℹ️ **Info**
> - If enabled, the controller will save the last active tool (`T` number) to memory.
> - When the controller reboots, that tool will be automatically re-activated, along with its associated offsets.

| Value | Meaning |
|:-----:|:--------|
| 0     | Disabled |
| 1     | Enabled |

---

## `$486` – Offset Lock (mask) {#486}
A safety feature that prevents G-code commands from modifying specific work coordinate systems.

> ℹ️ **Info**
> - When enabled, this setting blocks any G-code command (e.g., `G10 Lx`) that attempts to change the offset of selected work coordinate systems.
> - This is a safety feature to prevent a running G-code program from accidentally overwriting your carefully set work zero positions for critical coordinate systems.
> - This is a **bitmask**: add together the values of the G59.x work coordinate systems you want to protect from modification.

| Bit | Value | Work Coordinate System to Lock |
|:---:|:-----:|:-------------------------------|
| 0   | 1     | Lock G59.1 offset             |
| 1   | 2     | Lock G59.2 offset             |
| 2   | 4     | Lock G59.3 offset             |

#### Common Examples
*   **Default (No offsets locked):**
    *   `$486=0`
*   **Lock G59.3 (often used for toolsetter):**
    *   `$486=4`
*   **Lock G59.1 and G59.2:**
    *   `$486=3` (1 for G59.1 + 2 for G59.2)

#### Tips & Tricks
- This is particularly useful if G59.3 is designated for your toolsetter location, preventing accidental changes to its reference point during a job.
- If a `G10` command attempts to modify a locked offset, it will trigger an error.

---

## `$487`, `$488` – Spindle I/O Port Remapping
Allows remapping of the optional on/off spindle (type 9 and 10) control pins to different physical I/O ports.

> ℹ️ **Info**
> - This is an advanced hardware configuration setting.
> - It allows you to override the default board pinout and assign the spindle control signals to different pins.
> - This is useful for custom machine builds or when a default pin has been damaged.

| Setting | Signal to Remap |
|:--------|:----------------|
| `$487`  | Spindle On/Enable Port |
| `$488`  | Spindle Direction Port |

#### Tips & Tricks
- You must know the I/O Port numbers for your specific controller.
- Changing these without understanding your board's hardware can prevent your spindle from working.

---

## `$490` - `$499` – Macro M-Code Mapping (EEPROM/Flash)
## `$500` - `$509` – Macro M-Code Mapping (EEPROM/Flash)
These are provided by the [networking plugin](/docs/reference/plugins#keypad-macros-settings).

---

## `$510` - `$517` – Spindle Enable Mapping
Assigns a specific spindle type to each of the 8 available spindle slots.

> ℹ️ **Info**
> - grblHAL can support up to 8 different spindles (e.g., PWM, Relay, Modbus, etc.).
> - This block of settings determines which "driver" or type of spindle is assigned to each slot.
> - `$510`: Configuration for Spindle 0
> - `$511`: Configuration for Spindle 1
> - ... and so on.

---

## `$518` – Reserved
This is an unused slot in the settings enum.

---

## `$519` – Encoder-to-Spindle Mapping
Links a specific encoder to a specific spindle for closed-loop control.


> ℹ️ **Info**
> - This setting tells the closed-loop spindle PID controller (`$80`-`$86`) which encoder to use as its feedback source.
> - For example, you might link Encoder 0 to Spindle 0.

| Value | Meaning |
|:-----:|:--------|
| 0-N   | The index of the encoder to use. |

---

## `$520` - `$527` – Spindle Tool Start Offset
Assigns a starting tool number for each spindle.

> ℹ️ **Info**
> - This is used in multi-spindle or ATC setups.
> - It allows you to define a range of tool numbers that belong to a specific spindle.
> - For example, you could assign tools 1-10 to Spindle 0 and tools 11-20 to Spindle 1.

---

## `$530-533` – MQTT Broker Settings {#530--533}
These are provided by the [networking plugin](/docs/reference/plugins#network-settings).

---

## `$534` – Output RS274/NGC Debug Messages {#534}
Enables debugging messages from the RS274/NGC Expressions inside Macros.

> ℹ️ **Info**
> - This is a diagnostic tool for developers and advanced users writing Macros that uses **RS274/NGC expressions**.
> - The RS274/NGC interpreter is what enables powerful features like `O-words` (macros/subprogram), variables (e.g., `#100`), mathematical expressions, and flow control (`IF/ELSE`, `WHILE`).
> - When enabled, this setting allows `(debug, ...)` logs from within your macros to print to the Serial console
> - Debug output should be **disabled** during normal operation as it may confuse the end user, but is invaluable while developing/troubleshooting Macros

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Standard operation. No debug messages are printed to the Serial console. (Default) |
| 1     | Enabled | Debugging messages for the RS274/NGC interpreter are sent to the console. |

#### Common Examples
*   **Normal Operation:**
    *   This should be the setting for all regular jobs.
    *   `$534=0`
*   **Debugging a Complex Macro:**
    *   You are writing a tool-change macro with `IF` statements and want to see your `(debug, ...)` logs
    *   `$534=1`

#### Tips & Tricks
- This setting is your best friend when trying to figure out why a complex macro or `O-word` subroutine isn't working as expected.

---

## `$535` – Network MAC Address Override {#535}
This is provided by the [networking plugin](/docs/reference/plugins#network-settings).

---

## `$536` – RGB Strip Length 0 {#536}
## `$537` – RGB Strip Length 1 {#537}
Sets the number of LEDs in a connected RGB LED strip for two separate channels.

> ℹ️ **Info**
> - These settings are for controlling addressable RGB LED strips, often used for machine status indicators or ambient lighting.
> - Each setting defines the length of a specific strip, allowing the controller to address individual LEDs.

| Value | Meaning |
|:-----:|:--------|
| 0-N   | The number of LEDs in the strip. |

---

## `$538` – Fast Rotary "Go to G28" Behaviour {#538}

Controls the behavior of rotary axes, particularly when executing a G28 command, to ensure the shortest path is taken or to manage continuous rotation.

> ℹ️ **Info**
> - `G28` sends axes to a pre-defined home position.
> - This setting can modify how rotary axes handle this move, for example, by always taking the shortest path.

#### Common Example
```gcode
G91G28A0
G90
```
Return move should complete in half a rotation or less if enabled by setting `$538=1`

---

## `$539` – Spindle Off Delay (sec) {#539}
Adds a mandatory delay after the spindle is turned off (`M5`).

> ℹ️ **Info**
> - This complements `$394` (Spindle On Delay).
> - It forces a pause to allow the spindle to fully spin down before the machine moves again.
> - This is a critical safety feature to prevent tool crashes or workpiece damage if the machine moves while the spindle is still coasting to a stop.

| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds after an `M5` command. |

#### Common Examples
*   **Heavy Spindle:**
    *   A large spindle might take 5-10 seconds to come to a complete stop.
    *   `$539=10.0`
*   **Small Spindle with a VFD Brake:**
    *   `$539=2.0`

---

## `$541` – `$579` Control panel settings {#541--579}
These are settings reserved for third party control panel plugins, [grblPANEL](https://github.com/dresco/grblPANEL) is the current implementation.

---

## `$590` - `$599` – Button Action Mapping (MacroPort)
These are provided by the [networking plugin](/docs/reference/plugins#keypad-macros-settings).

---

## `$600` – `$639` – Modbus TCP Settings
These are provided by the [networking plugin](/docs/reference/plugins#network-settings).

---

## `$640` - `$649` – Kinematics Slots
Settings used to pass parameters to a specialized machine kinematics module.

> ℹ️ **Info**
> - Most CNC machines use a simple "Cartesian" kinematic model where X, Y, and Z are independent.
> - grblHAL can support more complex machine types, such as **CoreXY**, SCARA, or robotic arms, through a kinematics module.
> - These settings are used to pass the necessary geometric parameters (like arm lengths, motor positions, or belt paths) to the active kinematics module.

| Setting | Example Use |
|:--------|:------------|
| `$640`  | Parameter 0 | For a SCARA arm, this might be the length of the first arm segment. |
| `$641`  | Parameter 1 | For a SCARA arm, this might be the length of the second arm segment. |

#### Tips & Tricks
- For standard Cartesian machines, these settings have no effect and can be ignored.
- If you are using a special kinematics build of grblHAL (like CoreXY), you must configure these settings according to the documentation for that specific kinematic model.

---

## `$650` – Filesystem Options [(bitmask)](#bitmask) {#650}
Configures various options related to the controller's filesystem, typically involving SD card and LittleFS behavior.

> ℹ️ **Info**
> - The exact options available are dependent on the available and configured file systems (e.g., SD card, internal LittleFS).
> - It is particularly useful for managing how macros, configuration files, and other machine-critical data are handled.

| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | **Auto Mount SD Card** | Automatically mounts the SD card on controller startup. This is highly useful if tool change macros, startup scripts, or other essential files are stored on an SD card that is permanently inserted into the controller. |
| 1   | 2     | **Hide LittleFS** | When set, the content of the internal LittleFS filesystem will not be listed (e.g., via the `$F` command or in the WebUI). |
| 2   | 4     | **Hierarchical Listing** | (Build 20251111+) Enables directory support. Files are listed per directory, and directories are shown with size `-1`. Use `$F=subdir` to navigate down and `$F=..` to go up. |

#### Common Examples
*   **Auto-mount SD & Enable Directories:**
    *   `1 + 4 = 5` → `$650=5`

#### Tips & Tricks
- Hierarchical listing is essential for organizing large numbers of G-code files into folders.
- If your machine relies on macros stored on an SD card for automatic operation (e.g., on startup or for tool changes), enabling `Auto Mount SD Card` is essential.

---

## `$651` – `$670` – Stepper Driver Settings {#651--670}
This range is reserved for individual stepper driver-specific configurations. This might include settings for motor current, microstepping, stealthChop/spreadCycle modes, or other advanced Trinamic features that are applied per individual driver rather than per axis. The exact parameters and their meaning are dependent on the specific stepper driver plugin.

---

## `$671` – Invert Home Pins (mask) {#671}
Inverts the logic for the homing switch inputs

> ℹ️ **Info**
> - For machines that have separate homing and limit switches. Few controllers support this.

---

## `$672` – Reserved 672 {#672}
This is a reserved setting slot.

---

## `$673` – Coolant On Delay (sec) {#673}
Adds a mandatory delay after a generic coolant M-command (`M7`, `M8`) is executed, before motion resumes.


> ℹ️ **Info**
> - Some coolant systems, especially mist systems or those with long hoses, need time for the coolant to reach the cutting tool.
> - This setting forces grblHAL to pause for a specified time after an `M7` or `M8` command is processed.

| Value (sec) | Description |
|:-----------:|:------------|
| 0.0 - N     | The pause duration in seconds. |

#### Tips & Tricks
- This provides a more reliable way to ensure coolant is present than adding `G4` dwell commands to your G-code.
- If this is a non-zero value, there will be a noticeable pause after every `M7`/`M8`.
- This is distinct from `$393` (Door Coolant On Delay), which is specifically triggered by a safety door event.

---

## `$674` – THC Options {#674}
These are settings for Plasma, they are provided by the [Plasma plugin](/docs/reference/plugins#plasma-settings).

---

## `$675` – Macro ATC Options [(bitmask)](#bitmask) {#675}
Configures advanced options for an Automatic Tool Changer (ATC) that is controlled by G-code macros.

> ℹ️ **Info**
> - It becomes available when tc.macro is found on the SD card / in LittleFS
> - It provides fine-grained control over specific behaviors during the macro-driven tool change process, such as handling `M6 T0` commands and error reporting for missing macros.

| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | Execute M6 T0 | By default, an `M6 T0` command (tool change to tool 0) is not sent to the `tc.macro`. Setting this bit enables the `tc.macro` to execute for `M6 T0`. |
| 1   | 2     | Fail M6 if tc.macro not found | If this bit is set, grblHAL will raise an error (alarm) on an `M6` command if the `tc.macro` file is not found on the SD card or if the SD card is not mounted. |

#### Common Examples
*   **Default behavior (M6T0 is not routed to tc.macro, it silently selects tool 0 - which may mean no tool):**
    *   `$675=0`
*   **Allow M6 T0 to trigger macro, and fail if macro not found:**
    *   `$675=3` (1 for Execute M6 T0 + 2 for Fail M6 if tc.macro not found)

#### Tips & Tricks
- Use the "Fail M6 if tc.macro not found" option (`$675=2` or `3`) to ensure robust error handling in production environments where tool change macros are critical.
- Ensure your `tc.macro` file is correctly named and located on the SD card if you are using macro-based ATC.

---

## `$676` – Reset Actions [(bitmask)](#bitmask) {#676}
Configures additional actions to be performed automatically when the controller undergoes a soft or hard reset.

> ℹ️ **Info**
> - It is useful for ensuring the machine returns to a predictable and safe state, such as clearing specific status flags or overrides.

| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | Clear homed status if position was lost | If set, the machine's "homed" status will be cleared upon reset if the controller detects that its position may have been lost (e.g., due to a power cycle). |
| 1   | 2     | Clear offsets (except G92) | If set, all work coordinate system offsets (G54-G59.3) will be cleared upon reset, **except** for the G92 temporary offset. This forces the user to re-establish work zeros. |
| 2   | 4     | Clear rapids override | Resets the rapid feed rate override to 100% upon reset. |
| 3   | 8     | Clear feed override | Resets the programmed feed rate override to 100% upon reset. |

#### Common Examples
*   **Default (no options enabled, standard reset behavior):**
    *   `$676=0`
*   **Clear homed status if position lost, and clear all offsets (except G92):**
    *   `$676=3` (1 for Clear homed status + 2 for Clear offsets)
*   **Reset all overrides to 100% on reset:**
    *   `$676=12` (4 for Clear rapids override + 8 for Clear feed override)

#### Tips & Tricks
- Carefully consider which options to enable based on your machine's safety requirements and workflow. Clearing offsets ensures a fresh start but requires re-zeroing.
- Enabling "Clear homed status if position was lost" is a good safety measure, forcing a re-homing cycle if the machine's absolute position is uncertain.

---

## `$677` – Stepper Spindle Options {#677}
These are settings for spindles, they are provided by the [Spindle plugin](/docs/reference/plugins#spindle-settings).

---

## `$678` – Relay Port for Toolsetter {#678}
## `$679` – Relay Port for Secondary Probe {#679}
These are settings for probes, they are provided by the [Probe plugin](/docs/reference/plugins#probe-relay-settings)

## `$680` – Stepper Enable Delay (ms) {#680}
Sets a delay (in milliseconds) after the stepper motors are enabled before any motion is allowed.

> ℹ️ **Info**
> - Some stepper drivers or motor configurations might require a short stabilization time after receiving the enable signal before they can reliably accept step pulses.
> - This delay is in addition to a standard 2 ms delay that drivers typically enforce.

| Value (ms) | Description |
|:----------:|:------------|
| 0 - N      | The delay duration in milliseconds. |

---

## `$681` – Modbus Serial Format {#681}
Configures the data bit and parity settings for Modbus RTU serial communication.

> ℹ️ **Info**
> - This is an advanced setting for Modbus-enabled systems, specifically defining the serial port parameters for Modbus RTU.
> - It is crucial that this setting **matches the serial communication settings of the Modbus slave device** (e.g., your VFD) to ensure proper data exchange and prevent communication errors.

| Value | Description |
|:-----:|:------------|
| **0** | **8-bit No Parity:** Data is transmitted in 8 bits with no parity bit. |
| **1** | **8-bit Even Parity:** Data is transmitted in 8 bits with an even parity bit for error checking. |
| **2** | **8-bit Odd Parity:** Data is transmitted in 8 bits with an odd parity bit for error checking. |

#### Common Examples
*   **Default for many Modbus devices (no parity):**
    *   `$681=0`
*   **If your VFD specifies 8-bit even parity:**
    *   `$681=1`

#### Tips & Tricks
- Always consult the manual for your Modbus device (e.g., VFD, control panel) to determine the correct serial format settings. Mismatched settings will lead to communication failures.
- This setting works in conjunction with `$374` (Modbus Baud Rate) to establish a stable Modbus RTU link.

---

## `$682` – THC Feed Factor {#682}
This is a setting for Plasma, it is are provided by the [Plasma plugin](/docs/reference/plugins#plasma-settings).

---

## `$683` – `$687` – Sienci ATCi Keepout Zone Configuration {#683--689}
Defines the rectangular safety zone around the tool rack in machine coordinates.

These settings are provided by the [Sienci ATCi plugin](/docs/reference/plugins#sienci-atci-settings).

---

## `$700` – Subprogram Scanning {#700}
Controls how the `M98` command searches for subprogram.

> ℹ️ **Info**
> - Determines whether the controller looks for subprogram within the current file before looking for external files.
> - Useful for keeping subprogram and main program in a single file.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | External Only | Always looks for an external file `P.macro` on the SD card/filesystem. |
| 1     | Scan Current | (Default) Precans the current file for matching `O number` blocks first. If not found, looks for external file. |

#### Tips & Tricks
- Use `$700=1` if you want to use "internal" subprogram defined in the same G-code file.

---

## `$709` – Secondary PWM Spindle Options [(bitmask)](#bitmask) {#709}

Functions the same as [$9](#9), but applies to the **secondary PWM spindle** if available (spindle type 15 or 16).  

> ℹ️ **Info**
> - Only applies if a **secondary PWM spindle** is configured.
> - Uses the same bitmask definitions as `$9`.
> - Related settings:
>   - [$9](#9) – PWM Spindle Options (Primary)

| Bit | Value | Description |
|-----|-------|-------------|
| 0   | 1     | Disable PWM output entirely |
| 1   | 2     | Let RPM control spindle **on/off** signal (S0 disables spindle, S>0 enables) |
| 2   | 4     | Disable laser capability (does not affect $32 when primary spindle is controlling laser) |

#### Common Examples
* **Enable secondary PWM with RPM control:**  
  `$709=3`

* **Disable secondary PWM output:**  
  `$709=1`

#### Tips & Tricks
- Mirrors `$9` functionality but for the secondary spindle.  
- Allows keeping the primary spindle in laser mode while using the secondary spindle for normal PWM tasks.

---

## `$716` – Invert Secondary Spindle Outputs [(bitmask)](#bitmask) {#716}

Controls polarity of the **spindle control outputs** (PWM, enable, direction).  
Some spindle drivers expect inverted logic.

> ℹ️ **Info**
> - For spindle types 11, 12 and 13
> - Bit 0 = Spindle Enable
> - Bit 1 = Spindle Direction
> - Bit 2 = Spindle PWM
> - Related settings:
>   - [$16](#16) – Invert Primary Spindle Outputs (mask)

#### Common Examples
* **Default:**  
  `$716=0`

* **Invert Spindle Enable only:**  
  `$716=1`

* **Invert all signals:**  
  `$716=7`

#### Tips & Tricks
- If the spindle **runs when it should stop**, check `$716`.  
- Combine with `$33–$36` for full PWM control tuning.  

---

## `$730` – Secondary PWM Spindle Max Speed (RPM) {#730}
## `$731` – Secondary PWM Spindle Min Speed (RPM) {#731}
Sets the speed limits for the **secondary** PWM spindle.

> ℹ️ **Info**
> - These are the direct equivalents of [$30](#30) and [$31](#31), but for the secondary PWM output.
> - They are used to scale the `S` command to the PWM output for a second device like a laser or servo.

#### Common Examples
*   **Laser on Secondary Channel (0-1000 Power Scale):**
    *   `$730=1000`
    *   `$731=0`

---

## `$733` – Secondary PWM Spindle PWM Frequency (Hz) {#732}
Sets the frequency of the **secondary** PWM signal.

> ℹ️ **Info**
> - This is the direct equivalent of [$33](#33). It must be set correctly for the device connected to the second channel.

#### Common Examples
*   **Laser on Secondary Channel:**
    *   `$733=1000`

---

## `$734`, `$735`, `$736` – Secondary PWM Spindle PWM Off, Min, Max Values {#734--736}
Sets the raw PWM output range for the **secondary** channel.

> ℹ️ **Info**
> - These are the direct equivalents of [$34](#34), [$35]((#35), and [$$36].
> - They map the `S` command range (`$730`/`$731`) to the hardware's PWM duty cycle range for the second channel.

#### Common Examples
*   **Laser on Secondary Channel (Full 0-100% Power):**
    *   Assuming a 0-1000 PWM range.
    *   `$734=0`
    *   `$735=0`
    *   `$736=1000`

---

## `$737` – Linear Spindle 1 Piece 1 {#737--740}
## `$738` – Linear Spindle 1 Piece 2
## `$739` – Linear Spindle 1 Piece 3
## `$740` – Linear Spindle 1 Piece 4
Configures a multi-point calibration curve to correct a non-linear response from a **secondary** spindle controller or VFD.

> ℹ️ **Info**
> - These are the direct equivalents of `$66` - `$69`, but for the secondary PWM output.
> - They define correction points for the secondary spindle's PWM-to-RPM (or PWM-to-voltage) linearity.

## `$741` & `$742` – Motor Warning Enable & Invert [(bitmask)](#bitmask) {#744-745}
Configures the inputs for critical motor fault detection.

> ℹ️ **Info**
> - Some advanced motor drivers provide a "warning" signal that can indicate a potential issue (like high temperature) before it becomes a critical fault.
> - grblHAL can monitor these signals.

| Setting | Description |
|:--------|:------------|
| `$742`  | **Motor Warnings Enable (mask):** A bitmask to enable monitoring for each axis. |
| `$743`  | **Motor Warnings Invert (mask):** A bitmask to invert the logic of the warning signal. |

---

## `$744` & `$745` – Motor Faults Enable & Invert [(bitmask)](#bitmask) {#744-745}
Configures the inputs for critical motor fault detection.


> ℹ️ **Info**
> - Many industrial stepper and servo drivers provide a "fault" or "alarm" output signal that activates on critical errors (over-voltage, stall, etc.).
> - grblHAL can monitor these signals and trigger an immediate machine alarm.
> - This is a critical safety feature for high-reliability machines.


| Setting | Description |
|:--------|:------------|
| `$744`  | **Motor Faults Enable (mask):** A bitmask to enable monitoring for each axis. (X=1, Y=2, Z=4, etc.) |
| `$745`  | **Motor Faults Invert (mask):** A bitmask to invert the logic of the fault signal (active-high vs. active-low). |

#### Common Examples
*   **Enable Fault Detection on X, Y, Z:**
    *   `$744=7`
*   **Fault Signal is Active-Low (Needs Inversion) on X, Y, Z:**
    *   `$745=7`

#### Tips & Tricks
- You must have the fault output from your motor drivers wired to the correct input pins on your controller for this feature to work.
- Consult your controller's documentation for the motor fault pin assignments.

---

## `$750` - `$759` – Event Trigger Source Selection (Eventout Plugin) {#750--759}
## `$760` - `$769` – Event I/O Port Assignment (Eventout Plugin) {#760--769}
These are settings for eventout, they are provided by the [Event out plugin](/docs/reference/plugins#eventout-settings)

---

## `$770` – Spindle (laser) X Offset {#770}
## `$771` – Spindle (laser) Y Offset {#771}
## `$772` – Spindle (laser) Offset Options {#772}

These are settings for spindle offset, they are provided by the [Spindle offset plugin](/docs/reference/plugins#spindle-offset-settings)

---