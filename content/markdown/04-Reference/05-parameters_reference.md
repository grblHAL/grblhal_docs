---
slug: reference/parameters
---

# Parameters (variables)

grblHAL supports parameters in the format defined by RS247/NGC. There are three basic types of parameters: numbered, named with local scope and named with global scope. Numbered parameters in the range 1 - 5000 are volatile and will not survive a reboot, 5001 - 5599 are predefined and are read-only. There are also a number of global predefined read-only named parameters.

All predefined parameters defined in NIST RS274NGC version 3 (ref section 3.2.1) are implemented.  
Most additional predefined parameters defined by LinuxCNC (ref section 5.2.3.1) are implemented.

**Syntax, examples:**  
> `#5400` - numbered. 5400 is the current tool number.  
> `#<myvalue>` - named, local scope.  
> `#<_current_tool>` - named, global scope.  

To set a parameter use the `#` character followed by `=` and a value, a parameter or an expression returning a value. Multiple parameters can be set in a single block, assignment will take place after the whole block is parsed so do not reference a parameter that is set in the same block.

**Examples:**  
```
#100=50
#myvalue=30.5
#_avalue=#100
```

### Scope

Non-global named parameters and numbered parameters in the range 1-31 defined within a subroutine (call level) are local to the subroutine and goes out of scope when the the routine exits. Numbered parameters in the range 1-31 passed to a subroutine (`G65`, `G66` or `O- CALL`) are local to the called routine and will return to their original values when it returns.

### Default value

Uninitialized numbered parameters returns 0, uninitialized named parameters an error.  
Presence of named parameters can be checked for by the `EXIST[]` [function](/docs/reference/o-code#functions).

#### Predefined numbered parameters

| Parameters  | Usage                                                    | Persistent              |
|-------------|----------------------------------------------------------|-------------------------|
| 31 - 5000   | User defined parameters, defaults to 0.                  | No                      |
| 5061 - 5069 | Coordinates of a G38 probe result \(X, Y, Z, ...\) .     | No                      |
| 5070        | G38.3 and G38.5 probe result: 1 if successful, 0 if not. | No                      |
| 5161 - 5169 | G28 coordinates \(X, Y, Z, ...\).                        | Yes                     |
| 5181 - 5189 | G30 coordinates \(X, Y, Z, ...\).                        | Yes                     |
| 5210        | 1 if G92 offset active, 0 if not.                        | Depends on $384 setting |
| 5211 - 5219 | G92 offset \(X, Y, Z, ...\).                             | Depends on $384 setting |
| 5220        | Coordinate system number for G54 - G59.3, 1 - 9.         | Yes                     |
| 5221 - 5229 | Coordinate system 1, for G54 \(X, Y, Z, ...\).           | Yes                     |
| 5241 - 5249 | Coordinate system 2, for G55 \(X, Y, Z, ...\).           | Yes                     |
| 5261 - 5269 | Coordinate system 3, for G56 \(X, Y, Z, ...\).           | Yes                     |
| 5281 - 5289 | Coordinate system 4, for G57 \(X, Y, Z, ...\).           | Yes                     |
| 5301 - 5319 | Coordinate system 5, for G58 \(X, Y, Z, ...\).           | Yes                     |
| 5321 - 5329 | Coordinate system 6, for G59 \(X, Y, Z, ...\).           | Yes                     |
| 5341 - 5349 | Coordinate system 7, for G59.1 \(X, Y, Z, ...\).         | Yes                     |
| 5361 - 5369 | Coordinate system 8, for G59.2 \(X, Y, Z, ...\).         | Yes                     |
| 5381 - 5389 | Coordinate system 9, for G59.3 \(X, Y, Z, ...\).         | Yes                     |
| 5399        | Result from last M66, wait for input. -1 if timed out.   | No                      |
| 5400        | Tool number.                                             | No                      |
| 5420 - 5427 | Current position including all offsets \(X, Y, Z, ...\). | No                      |
| 5599        | Debug output, 1 if enabled else 0.                       | Yes                     |

#### Predefined named parameters

| Name                 | Usage                                                              | Comment                   |
|----------------------|-------------------------------------------------------------|---------------------------|
| _vmajor              | Major grblHAL version number, currently 1.1.                       |                           |
| _vminor              | Minor grblHAL version number, from build date \(YYMMDD\).          | Available from 20241025.  |
| _line                | Current G Code line number.                                        |                           |
| _motion_mode         | Current motion mode.                                               | See <sup>1</sup> below.   |
| _plane               | Current plane: 170 - G17, 180 - G18, 190 - G19.                    |                           |
| _ccomp               | Active cutter compensation: 400 - G40.                             |                           |
| _metric              | 1 if G21 is active, 0 if not.                                      |                           |
| _imperial            | 1 if G20 is active, 0 if not.                                      |                           |
| _absolute            | 1 if G90 is active, 0 if not.                                      |                           |
| _incremental         | 1 if G91 is active, 0 if not.                                      |                           |
| _inverse_time        | 1 if G93 is active, 0 if not.                                      |                           |
| _units_per_minute    | 1 if G94 is active, 0 if not.                                      |                           |
| _units_per_rev       | 1 if G95 is active, 0 if not.                                      |                           |
| _coord_system        | Current coordinate system: 540 - G54, 550 - G55, ...               |                           |
| _tool_offset         | 1 if G43 is active, 0 if not.                                      |                           |
| _retract_r_plane     | 1 if G98 is active, 0 if not.                                      |                           |
| _retract_old_z       | 1 if G99 is active, 0 if not.                                      |                           |
| _spindle_rpm_mode    | 1 if G97 is active, 0 if not.                                      |                           |
| _spindle_css_mode    | 1 if G96 is active, 0 if not.                                      |                           |
| _ijk_absolute_mode   | 1 if G90.1 is active, 0 if not.                                    |                           |             
| _lathe_diameter_mode | 1 if G8 is active, 0 if not.                                       |                           |
| _lathe_radius_mode   | 1 if G7 is active, 0 if not.                                       |                           |
| _spindle_on          | 1 if spindle is running (M3 or M4), 0 if not.                      |                           |
| _spindle_cw          | 1 if spindle is running clockwise (M3), 0 if not.                  |                           |
| _mist                | 1 if M7 is active, 0 if not.                                       |                           |
| _flood               | 1 if M8 is active, 0 if not.                                       |                           |
| _speed_override      | 1 if M48 or M50P1 is active, 0 if not.                             |                           |
| _feed_override       | 1 if M48 or M50p2 is active, 0 if not.                             |                           |
| _adaptive_feed       | Always 0.                                                          |                           |
| _feed_hold           | 1 if M53.1 is active, 0 if not.                                    |                           |
| _feed                | Current value of F.                                                | Not the actual feed rate. |
| _rpm                 | Current value of S.                                                | Not the actual RPM.       |
| _x                   | Current X coordinate including all offsets.                        | Same as #5420.            |
| _y                   | Current Y coordinate including all offsets.                        | Same as #5421.            |
| _z                   | Current Z coordinate including all offsets.                        | Same as #5422.            |
| _a                   | Current A coordinate including all offsets.                        | Same as #5423.            |
| _b                   | Current B coordinate including all offsets.                        | Same as #5424.            |
| _c                   | Current C coordinate including all offsets.                        | Same as #5425.            |
| _u                   | Current U coordinate including all offsets.                        | Same as #5426.            |
| _v                   | Current V coordinate including all offsets.                        | Same as #5427.            |
| _w                   | Current W coordinate including all offsets.                        | Same as #5428.            |
| _abs_x               | Current absolute X coordinate (G53).                               |                           |
| _abs_y               | Current absolute Y coordinate (G53).                               |                           |
| _abs_z               | Current absolute Z coordinate (G53).                               |                           |
| _abs_a               | Current absolute A coordinate (G53).                               |                           |
| _abs_b               | Current absolute B coordinate (G53).                               |                           |
| _abs_c               | Current absolute C coordinate (G53).                               |                           |
| _abs_u               | Current absolute U coordinate (G53).                               |                           |
| _abs_v               | Current absolute V coordinate (G53).                               |                           |
| _abs_w               | Current absolute W coordinate (G53).                               |                           |
| _current_tool        | Number of the tool in the spindle.                                 | Same as #5400.            |
| _current_pocket      | Same value as *_current_tool* unless file based tooltable enabled. | Available from 20250618.  |
| _selected_tool       | Current value of T.                                                | Default -1.               |
| _selected_pocket     | Same value as *_selected_tool* unless file based tooltable enabled.| Available from 20250618.  |
| _value               | Return value from the last G65 macro or O subroutine call.         | Set to 0 on entry.        |
| _value_returned      | 1 if last G65 macro or subroutine call returned a value, 0 if not. |                           |
| _call_level          | Current nesting level for G65 macro calls or O subroutines.        |                           |
| _probe_state         | Current probe input state. -1 if not available.<sup>2</sup>        | Available from 20250116.  |
| _probe2_state        | Current probe 2 input state. -1 if not available.<sup>2</sup>      | Available from 20251018.  |
| _active_probe        | Current active probe. -1 if not available.<sup>2</sup>             | Available from 20260125.  |
| _toolsetter_state    | Current toolsetter input state. -1 if not available.<sup>2</sup>   | Available from 20250116.  |
| _homed_state         | Current homed state. 1 if homed, 0 if not.<sup>2</sup>             | Available from 20250618.  |
| _homed_axes          | Homed axes as bitfield, X = bit0, Y = bit1, ...<sup>2</sup>        | Available from 20250618.  |
| _tool_table_size     | Tool table size, 0 if not enabled.<sup>2</sup>                     | Available from 20250731.  |
| _free_memory         | Free memory in KBytes, -1 if not available.<sup>2</sup>            | Available from 20251102.  |

### Comments with parameter substitution

Numbered and named parameters referenced in the comment string will be substituted in the generated output.

`(print, ...)`

Example:

`(print, metric mode: #<_metric>, coord system: #5220)`

outputs

`[MSG:metric mode on: 1, coord system: 1]`

when metric mode \(G21\) is on and the current coordinate system is G54.

`(debug, ...)`

Output from this comment is controlled by setting `$534` - set to `1` to enable `0` to disable \(default\).  
Example:

`(debug, metric mode: #<_metric>, coord system: #5220)`

outputs

`[MSG:metric mode on: 1, coord system: 1]`

when metric mode \(G21\) is on and the current coordinate system is G54.

### Generate error with user defined message

`(abort, ...)`

This will output the supplied message followed by raising error `253` thus terminating any running gcode.  
Available from build 20241025.
 
Example:
```
#200=123.456
...
(abort, Something went wrong, parameter 200=#200)
```
outputs
```
(MSG:Error: Something went wrong, parameter 200=123.456)
error:253
```

---

<sup>1</sup> Motion modes:

| Mode  | Value |
|-------|-------|
| G1    | 10    |
| G2    | 20    |
| G3    | 30    |
| G33   | 330   |
| G38.2 | 382   |
| G38.3 | 383   |
| G38.4 | 384   |
| G38.5 | 384   |
| G5    | 50    |
| G5.1  | 51    |
| G73   | 730   |
| G75   | 760   |
| G80   | 800   |
| G81   | 810   |
| G82   | 820   |
| G83   | 830   |
| G85   | 850   |
| G89   | 890   |

<sup>2</sup> grblHAL specific extension. Probe and toolsetter state parameters may return incorrect value. Use with care.
