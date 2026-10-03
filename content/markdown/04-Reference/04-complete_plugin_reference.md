---
slug: reference/plugins
---

# Plugins Reference

This guide lists plugin-specific **M-codes**, **G-codes**, **$-commands** and **$-settings** provided by grblHAL’s plugin ecosystem.  
Each section includes the repository URL for reference.  

---

## SD-Card (File Systems) {#file-systems}
Github Repository: https://github.com/grblHAL/Plugin_SD_card

The SD card plugin repository contains a collection of plugins that offers storage and file handling that integrates with the core based [Virtual File System - VFS](/docs/reference/commands#file-handling).

### FS FatFS and FS littlefs

These plugins are integration layers for VFS that provides file access to SD cards via [FatFs](https://elm-chan.org/fsw/ff/) and flash or EEPROM based files via the [littlefs](https://github.com/littlefs-project/littlefs) file systems.

### FS Stream {#file-systems-commands}

The FS Stream plugin sits on top of VFS and provides a number of $-commands for file handling:

| Command           | Description |
|:-----------------:|-------------|
| **`$F`**          | List CNC-compatible files (`.nc`, `.gcode`, etc.) in the current working directory |
| **`$F+`**         | List all files in the current working directory regardless of extension |
| **`$F=[file]`**   | Run G-code file |
| **`$CWD=[path]`** | Change Directory |
| **`$PWD`**        | Print Working Directory |
| **`$FM`**         | Mount SD card |
| **`$FU`**         | Unmount SD card |
| **`$FD=[file]`**  | Delete file |

The commands are documented in more detail [here](/docs/reference/commands#file-system-commands).

#### Examples:
```gcode
; Mount SD card
$FM

; List files
$F+

; Run a file
$F=myprogram.ngc

; Change directory
$CWD=subdir

; Print working directory
$PWD
```

### Macro

The macro plugin takes care of file handling for the `G65`, `G66` and `M98` subroutine commands and mapping of the tool change commands `T`, `M6` and `M60` to file based macros.

| Command          | Maps to |
|:----------------:|:--------|
|`T`               | _ts.macro_ - for selecting the tool, may be used to move a tool carousel in place (optional) |
|`M6`              | _tc.macro_ - for changing the tool |
|`M60`             | _ps.macro_ - for pallet shuttle (optional) |
|`G65, G66 and M98`| _P\<n\>.macro_ where _\<n\>_ is taken from the commands P-word|

The file used for subroutine commands is searched for in the root directory (`\`) then `\littlefs` and finally `\embedded`.  
The files used for tool change commands are searched for when a file system is mounted and then in the mount directory of that file system.
When a tool change file is found _all_ tool change files are bound to the same directory.

### YModem

The YModem plugin adds the [YModem protocol](http://wiki.synchro.net/ref:ymodem) to grblHAL and allows file down- and uploading for senders that are compatible.  
When this plugin is added to the firmware downloading is initiated by the sender by sending a `SOH` (`0x01`) or `STX` (`0x02`) character.
NOTE: this deviates from the protocol where the receiver is required to start the transfer by sending a `C` character after the sender is set up for the transfer.  
Uploading (available since build 20260916) is initiated by the `$YUP=filename` system command. The sender starts the transfer, if the command was `ok`'ed, by sending a single `C` character.

> [!NOTE]
> If the transfer fails the controller may not respond to normal input until the protocol handler times out and returns control back.
> The protocol itself is fairly robust so this should only occur following a communication loss or from a badly implemented protocol sender side.

---

## Spindle plugins {#spindles}
Github Repository: https://github.com/grblHAL/Plugins_spindle

| M-Code | Syntax | Description |
|:------:|:------:|:------------|
| `M104` | `M104 P-` | Select spindle, available when more than one spindle is enabled |

| Parameter | Description |
|:---------:|:------------|
| **`P`**   | Spindle number. |

#### Example
```gcode
; Select spindle 1
M104 P1
```

### VFD (Variable Frequency Drive) drivers <!-- toc --> {#vfd-spindles}
The spindle plugin provides drivers for Modbus control of a number of common spindles, these are Huanyang (v1 and v2 protocol), H100, GS20, YL620 and Nowforever.
In addition a generic driver, Modvfd, is provided.  
The firmware can be compiled with support for one or more spindles of which up to four can be enabled at any time, each of these must be given an unique address on the Modbus bus. 

#### Settings {#spindle-settings}

#### `$460` – VFD Modbus Address
Sets the Modbus slave address for the primary VFD.


> ℹ️ **Info**
> - This is used by VFD plugins (e.g., GS20, YL620A) to communicate with the VFD via Modbus RTU.
> - This address *must* match the ID configured in the VFD's parameters.
> - If multiple VFDs are on the same Modbus network, each needs a unique address.

| Value | Meaning |
|:------|:--------|
| 1-247 | The unique Modbus slave ID of the VFD. |

#### `$476` - `$479` – VFD Modbus Addresses
Provides additional slots for defining Modbus addresses for up to four VFDs.

> ℹ️ **Info**
> - This allows grblHAL to control multiple VFDs on the same Modbus network.
> - `$476`: Address for VFD 0
> - `$477`: Address for VFD 1
> - `$478`: Address for VFD 2
> - `$479`: Address for VFD 3

#### Common Examples
*   **Typical VFD Address:**
    *   `$460=1`

#### Tips & Tricks
- Consult your VFD's manual for its Modbus slave ID parameter.

---

#### `$461` – VFD RPM/Hz Scaling
Configures the RPM-to-frequency conversion for some VFD plugins.


> ℹ️ **Info**
> - These settings are used by some VFD drivers (like GS20, YL620A) to convert the `S` command (in RPM) to the frequency (in Hz) that the VFD requires.
> - `$460`: VFD Modbus Address (This appears to be a duplicate of `$360` for some drivers).
> - `$461`: **RPM per Hz:** The core conversion factor.

#### Common Examples for `$461`
*   **2-pole spindle motor (50 Hz → 3000 RPM):**
    *   `3000 RPM / 50 Hz = 60`.
    *   `$461=60`
*   **4-pole spindle motor (50 Hz → 1500 RPM):**
    *   `1500 RPM / 50 Hz = 30`.
    *   `$461=30`

#### MODVFD {#modvfd-spindle}

MODVFD is a generic driver that can be configured to control a number of VFD's.

#### MODVFD Settings {#modvfd-settings}

| Setting  | Meaning | Default value |
|:--------:|:--------|:-------------:|
|**`$462`**| Run/Stop register address. | `8192` (`0x2000`) |
|**`$463`**| Set Frequency register address. | `8193` (`0x2001`) |
|**`$464`**| Get Frequency register address. | `8451` (`0x2103`) |
|**`$462`**| Run CW command. Default value | `18` (`0x12`) |
|**`$463`**| Run CCW command. Default value | `34` (`0x22`) |
|**`$464`**| Stop command. Default value | `1` (`0x01`) |
|**`$465`**| RPM input multiplier | `50`  |
|**`$466`**| RPM input divider | `60` |
|**`$467`**| RPM output multiplier | `50` |
|**`$468`**| RPM output divider | `60` |

Register addresses are the locations to read or write in order to control the spindle or read its status, the command values are the values to write to these addresses.
To control the spindle RPM the RPM value has to be converted to frequency before it is sent to the VFD, this is done with the input divider and multiplier values,
the conversion formula is `RPM * multiplier value / divider value`. Similarly when reading back the status the frequency value has to be converted back to RPM.

The modbus function codes used for writing registers is `6`, reading is done with `3`.

> [!IMPORTANT]
> These value **must** match the specific register addresses, command values and conversion values defined in your VFD's manual.

**Common Examples**

Add example here.

---

### Stepper spindle

#### `$677` – Stepper Spindle Options {#677}
Configures options for a "stepper spindle," where the spindle is driven by a stepper motor.

> ℹ️ **Info**
> - An advanced feature for controlling a spindle that requires step and direction signals, similar to a motion axis.
> - This allows for precise, synchronized control of the spindle's rotation.

### Spindle offset <!-- toc --> {#spindle-offset}

The spindle offset plugin is for automatically moving and offsetting the XY-position when switching between spindles.

#### Settings {#spindle-offset-settings}

| Setting  | Meaning |
|:--------:|:--------|
|**`$770`**| X-axis offset in mm. |
|**`$771`**| Y-axis offset in mm. |
|**`$772`**| Options, [bitmask](/docs/reference/settings#bitmask). |

#### `$772` - _Options:_

| Bit | Value | Option                     | Description                                                                                             |
|:---:|:-----:|:---------------------------|:--------------------------------------------------------------------------------------------------------|
| 0   | 1     | Keep new position          | If set, when a laser spindle with an offset is activated, the machine's work position shifts by the offset amount, meaning the G-code continues from the laser's perspective. |
| 1   | 2     | Update G92 on spindle change | If set, when a laser spindle with an offset is activated, the internal `G92` offset is adjusted to keep the **work position identical** from the original spindle's perspective. |

The offsets are a key feature for machines with multiple tools (e.g., a primary milling spindle and a secondary laser) that are not parfocal in the X-axis.
When you switch to a laser spindle (or a spindle designated as a laser), grblHAL will automatically apply the offsets to all subsequentmoves, effectively shifting the coordinate system to match the laser's position.

> [!TIP]
- This offset is applied per spindle. You would configure this for the specific laser spindle ID after selecting it (e.g., via `M104 Qx`).
- The "Update G92 on spindle change" option (`$772=2`) is generally preferred if you want your G-code programs to continue relative to the workpiece origin, regardless of which tool (spindle or laser) is active. This makes the tool change "transparent" to the work coordinates.
- Test these options carefully with your setup to understand how your work zero behaves when switching between the primary spindle and the laser.

**Common Examples**
* _A laser is mounted 50.5mm to the right (positive X) and  10.0mm towards the front (positive Y) of the primary spindle:_
  * `$770=50.5`
  * `$771=10.0`
* _Default (no options, simple coordinate shift):_
  * `$772=0`
* _Update G92 offset to maintain work position consistency on spindle change:_
  * `$772=2` ("If update G92 offset is enabled then it is adjusted to keep the work position identical for the spindles.")

---

## Motor (Trinamic)
Github Repository: https://github.com/grblHAL/Plugins_motor

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M122` | `M122 [axes]` | Driver report/debug |
| `M569` | `M569 [axis] S[0|1]` | Set driver mode: StealthChop / SpreadCycle |
| `M906` | `M906 [axes] S[current]` | Set RMS current |
| `M911` | `M911` | Report prewarn flags |
| `M912` | `M912` | Clear prewarn flags |
| `M913` | `M913 [axes]` | Hybrid threshold |
| `M914` | `M914 [axes]` | Homing sensitivity |


#### `$200` – `$207` StallGuard2 Fast Threshold (TMC) {#200--207}
Sets the sensitivity of StallGuard for an axis during the initial, fast-moving phase of a sensorless homing cycle.
The last digit in the setting number corresponds to the [axis id](#axisid).

> ℹ️ **Info**
> - This is a core setting for **ensorless homing**, allowing the driver to detect a motor stall against a physical end-stop.
> - This sensitivity value is used during the `$25` (Homing Search Rate) move.
> - A **lower value is more sensitive**. A value of `0` disables stall detection.
> - Works in conjunction with `$220` (slow threshold) and `$339` (enable mask).


> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for the fast move. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. A higher value requires a harder stall to trigger. |

---

#### Settings {#trinamic-settings}

#### `$338` – Trinamic Driver Enable (mask)
Configures which axes are controlled by Trinamic stepper drivers and enables their advanced features.
The bit number number corresponds to the [axis id](/docs/reference/settings#axisid).


> ℹ️ **Info**
> - This setting is a [bitmask](/docs/reference/settings#bitmask) used to specify which individual axes are equipped with Trinamic stepper drivers (e.g., TMC2209, TMC5160).
> - Enabling a bit for an axis allows grblHAL to utilize Trinamic-specific features for that axis, such as programmable current control (`$210`-`$217`) and StallGuard for sensorless homing (`$339`).
> - This setting is typically available for boards which have pluggable or software-configurable drivers.

| Bit | Value | Axis |
|:---:|:-----:|:-----|
| 0   | 1     | X-Axis has Trinamic driver |
| 1   | 2     | Y-Axis has Trinamic driver |
| 2   | 4     | Z-Axis has Trinamic driver |
| 3   | 8     | A-Axis has Trinamic driver |
| 4   | 16    | B-Axis has Trinamic driver |
| 5   | 32    | C-Axis has Trinamic driver |
| 6   | 64    | U-Axis has Trinamic driver |
| 7   | 128   | V-Axis has Trinamic driver |

#### Common Examples
*   **X and Y axes using Trinamic drivers:**
    *   `$338=3` (1 for X + 2 for Y)
*   **All primary 3 axes using Trinamic drivers:**
    *   `$338=7` (1 for X + 2 for Y + 4 for Z)

#### Tips & Tricks
- Only enable the bits corresponding to axes that genuinely use Trinamic drivers on your board and for which you intend to use their advanced features. Incorrectly enabling this can lead to unexpected behavior.
- Refer to your specific board's documentation to confirm which axes are wired to Trinamic-compatible drivers.

---

#### `$339` – Sensorless Homing [(bitmask)](#bitmask)
The master switch to enable sensorless homing for each axis.

> ℹ️ **Info**
> - This setting tells grblHAL to use the Trinamic StallGuard feature for homing instead of physical limit switches.
> - It requires the StallGuard thresholds (`$200`-`$22x`) to be properly tuned.
> - **Spindle Ramp Down:** If `$9` bit 3 is set, this setting (`$339 > 0`) also enables Spindle Ramp Down for spindle off.

> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.

| Bit | Value | Axis |
|:---:|:-----:|:-----|
| 0   | 1     | X-Axis |
| 1   | 2     | Y-Axis |
| 2   | 4     | Z-Axis |
| 3   | 8     | A-Axis |
| 4   | 16    | B-Axis |
| 5   | 32    | C-Axis |
| 4   | 64    | U-Axis |
| 5   | 128   | V-Axis |

#### Common Examples
*   **Sensorless Homing on X and Y:**
    *   Common for CoreXY printers or CNCs where Z has a physical switch.
    *   `1` (X) + `2` (Y) → `$339=3`
*   **Sensorless on All Axes:**
    *   `1` (X) + `2` (Y) + `4` (Z) → `$339=7`

#### Tips & Tricks
- **Crucial:** Sensorless homing **only works for the homing cycle**. If you want Hard Limits (`$21`), you **must** still have physical switches installed.

#### `$210` – `$217` Hold Current (TMC) {#210--217}
Sets the percentage of the full running current that the **X-axis** driver will supply to the motor when it is idle.
The last digit in the setting number corresponds to the [axis id](#axisid).

> ℹ️ **Info**
> - This is a Trinamic-specific power-saving and heat-reduction feature. It works with the `$1` (Step Idle Delay).
> - After the idle delay expires, the driver will reduce the motor current to this percentage.
> - `0%` is the minimum, `100%` means no current reduction.

| Value (%) | Meaning | Description |
|:---------:|:--------|:------------|
| 0 - 100   | Percent | The percentage of running current to use for holding torque. |

#### Common Examples
*   **Aggressive Power Saving:**
    *   Reduces heat significantly but has very low holding torque.
    *   `$210=25`
*   **Balanced Hold and Heat (Recommended Start):**
    *   A good compromise for most axes.
    *   `$210=50`

#### Tips & Tricks
- This is a fantastic feature for reducing motor temperature on long jobs.
- If you notice the X-axis drifting or being easily moved by hand when idle, increase this value.

---

#### `$220` – `$227` StallGuard2 Slow Threshold (TMC) {#220--227}
Sets the sensitivity of StallGuard for the **X-axis** during the second, slower phase of a sensorless homing cycle.
The last digit in the setting number corresponds to the [axis id](#axisid).


> ℹ️ **Info**
> - After the initial fast search, the machine backs off and re-approaches the end-stop at the `$24` (Homing Locate Rate).
> - This setting defines the StallGuard sensitivity for that slow, precise move, allowing for more accurate homing.

> 🔥 **Danger**
> StallGuard should not be used unless the machine manufacturer has tuned the associated Trinamic parameters beforehand - the procedure for that is not simple. If enabled it is for advanced users that has a good understanding of how to tune the parameters.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Disabled| Stall detection is off for this phase. |
| 1-127 | Sensitivity | A lower value makes the driver more sensitive to stalls. |

#### Common Examples
*   **Precise Homing:**
    *   Often set to be more sensitive (lower) than the fast threshold, as there is less risk of false triggers from acceleration.
    *   `$220=30`

#### Tips & Tricks
- Tuning this value is key to repeatable sensorless homing. It should be as sensitive as possible without triggering before the axis makes firm contact with the end-stop.
- This value is almost always different from the fast threshold (`$200`).


#### Example
```gcode
; Check driver status on X/Y
M122 XY

; Set StealthChop mode for X axis
M569 X S1

; Set RMS current for all axes
M906 X100 Y100 Z100
```

---

## Networking
Github Repository: https://github.com/grblHAL/Plugin_networking/

This plugin contains code for network protocol support on top of the lwIP TCP/IP stack.

#### Server protocols supported:

* Telnet \("raw" mode\).
* Websocket.
* FTP \(requires [SD card plugin](https://github.com/grblHAL/Plugin_SD_card) and card inserted\).
* HTTP \(requires [SD card plugin](https://github.com/grblHAL/Plugin_SD_card) and card inserted\).
* WebDAV - as an extension the HTTP daemon. __Note:__ saving files does not yet work with Windows mounts. Tested ok with WinSCP.
* mDNS - \(multicast DomainName Server\).
* SSDP - \(Simple Service Discovery Protocol\). Requires the HTTP daemon running.

The mDNS and SSDP protocols uses UPD multicast/unicast transmission of data and not all drivers are set up to handle that "out-of-the-box".  
Various amount of manual code changes are needed to make them work, see the [RP2040 readme](https://github.com/grblHAL/RP2040/blob/master/README.md).

#### Client protocols supported:

* MQTT - \(MQ Telemetry Transport\). A programming API is provided for plugin code, not used by standard code.

MQTT requires lwIP 2.1.x for authentication support \(username & password\). [Template/example](https://github.com/grblHAL/Templates/tree/master/my_plugin/MQTT_example) code is available.

#### System commands {#network-commands}

$NETIF - TBC

#### Settings {#network-settings}

| Setting  | Meaning |
|:--------:|:--------|
|**`$70`**| Enable Services. |
|**`$535`**| Network MAC Address Override. |

_Enable Services_, [bitmask](/docs/reference/settings#bitmask)
\
The master switch for enabling or disabling network-related services (daemons).

| Bit | Value | Service to Enable | Description |
|:---:|:-----:|:------------------|:------------|
| 0   | 1     | Telnet | A raw data stream used by some G-code senders. |
| 1   | 2     | FTP | Allows network file transfer to/from local file systems such as a SD card. |
| 2   | 4     | HTTP | The standard web server (often used with WebSockets). |
| 3   | 8     | WebSocket | A modern, efficient protocol for web-based GUIs. |
| 4   | 16    | mDNS (Bonjour) | Broadcasts the controller's name on the network (e.g., `grblHAL.local`). |
| 5   | 32    | WebDAV | An alternative to FTP for network file access. |

> [!TIP]
> - This is a **critical** setting for any network-enabled board. Even if you configure all the IP address and WiFi settings (`$300+`), the services **will not run** unless they are enabled here.

#### Common Examples
*   **All Services Disabled (Default):**
    *   `$70=0`
*   **Enable Common Services for a GUI:**
    *   Most modern senders use Telnet or WebSockets, and FTP is needed for file transfers. mDNS is for easy discovery.
    *   `1` (Telnet) + `2` (FTP) + `8` (WebSocket) + `16` (mDNS) → `$70=27`
*   **Enable All Services:**
    *   `1+2+4+8+16+32` → `$70=63`

> [!TIP]
> - If you have configured your network settings but still cannot connect to the controller, this is the **first setting you should check**.
> - For security and to save memory on the controller, only enable the services you actually plan to use.
> - Use `$NETIF` to see which services are running (listening) as well as the Network interface's MAC address and IP address.

#### Common settings {#network-settings-common}
These are settings common for all interfaces, `x` in the setting number is the interface: `0` - ethernet, `1`- WiFi Station (STA), `2` - Wifi Access Point (AP).

| Setting  | Description | Default value |
|:--------:|:------------|:-------------:|
|**`$3x0`**| [Hostname](#3x1, up to 32 characters | `grblHAL` |
|**`$3x1`**| [IP Mode](#3x1) | `1` - DHCP |
|**`$3x2`**| [Static IP Address](#3x2) | `192.168.5.1` |
|**`$3x3`**| [Static Gateway IP address](#3x3) | `192.168.5.1` |
|**`$3x4`**| [Static Netmask](#3x4) | `255.255.255.0` |
|**`$3x5`**| Telnet [Port](#3x3-3x8) | `23` |
|**`$3x6`**| Webserver (HTTP) [Port](#3x3-3x8) | `80` |
|**`$3x7`**| Websocket [Port](#3x3-3x8) | `81` |
|**`$3x8`**| File Transfer (FTP)[Port](#3x3-3x8) | `21` |

> [!IMPORTANT]
> After changing any of these settings a controller reboot is required for them to take effect.

#### `$3x0` _Hostname_ {#3x0}

Sets the machine's name on the network.
This is the name your controller will announce on the network.
It can be used to connect via mDNS (e.g., `grblHAL.local`) if [$70](#70) has mDNS enabled.
It also helps identify the device in your router's client list.

**Common Examples**
* _Default Hostname:_
  * `$300=grblHAL`
* _Custom Hostname for a specific machine:_
  * `$300=MyCNC`or `$300=Laser` (mDNS respectively mycnc.local or laser.local)

> [!TIP]
> - For maximum compatibility, use a simple name without spaces or special characters.
> - Use a standard FTP client application (like FileZilla or WinSCP) to connect to the controller's IP address on this port.

---

#### `$3x1` _IP Mode_ {#3x1}

Selects the method the controller uses to obtain an IP address for the connection.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Static | You must manually set the IP (`$3x2`), Gateway (`$3x3`), and Netmask (`$3x4`). |
| 1     | DHCP   | The controller asks your router for an IP address. (Recommended) |
| 2     | AutoIP | A fallback where the controller picks a random address if DHCP fails. |

- **Static** is useful if the controlling computer has a dedicated ethernet port for the controller. A dedicated network interface for the controller is preferred - no collisions or competition for bandwidth, or for networks where DHCP is not available.
- **DHCP** is the standard for most networks, where your router automatically assigns an address.

> [!IMPORTANT]
> If you select _Static_ mode, you are responsible for providing correct and non-conflicting network information.
> Reserve the address in the router if possible when connected to a router. Some routers allow binding the MAC address to an IP address allowing the use of DHCP to get a fixed address.

---

#### `$3x2` – _Static IP Address_ {#3x2}
IP address for the controller when IP Mode is `0` - Static.

#### `$3x2` - _Static Gateway Address_ {#3x3}
Gateway address for the controller when IP Mode is `0` - Static.

#### `$3x2` - _Static Netmask_ {#3x4}
Netmask (address) for the controller when IP Mode is `0` - Static. The default value is what is used for most networks.

> [!NOTE]
> - The addresses are IPv4 dot-decimal notation. IPv6 notation is currently unsupported.
> - The IP address must be unique on your network.

> [!IMPORTANT]
> - If you set an IP that is already in use by another device, you will have an "IP conflict" and neither device may work correctly.
> - The IP address must be in the same subnet as the Gateway and your computer (as defined by the Netmask).

#### `$3x6` - `$3x8` – _Port numbers_ {#3x3-3x8}
Configures the network port for the given service. Valid port numbers are in the range `1` - `65535`, port numbers < `1000` are predefined.

---

#### MQTT Broker: <!-- toc -->
MQTT is a lightweight messaging protocol often used for IoT devices.
If your grblHAL build supports MQTT, this allows it to connect to an MQTT broker to publish status updates or receive commands.

#### MQTT Broker settings

| Setting  | Description |
|:--------:|:------------|
|**`$530`**| MQTT Broker IP Address. |
|**`$531`**| MQTT Broker Port, default value is 1883. |
|**`$532`**| MQTT Broker Username. |
|**`$533`**| MQTT Broker Password. |

> [!NOTE]
> grblHAL has no higher level MQTT functionality, custom plugin code has to be added to make use of the protocol. [An example](https://github.com/grblHAL/Templates/tree/master/my_plugin/MQTT_example).

---

#### Modbus TCP: <!-- toc -->

#### `$600` – `$639` – Modbus TCP Settings
This range is reserved for settings related to Modbus TCP/IP communication. This would typically involve configuring IP addresses, ports, and slave IDs for Modbus TCP devices on a network. The specific settings and their functions are dependent on the Modbus TCP plugin implementation.

### Ethernet <!-- toc -->

The ethernet plugin is driver specific since it sits between the LwIP stack and the networking plugin...

#### Settings {#ethernet-settings}

| Setting               | Description |
|:---------------------:|:------------|
|**`$300`** - **`$308`**| [Common network settings](#network-settings-common). |
|**`$535`**             | Network MAC Address Override. |

> [!NOTE]
> If the network interface only provides a single shared/non-unique MAC address, like most Wiznet modules do, this address can be overridden by setting a unique address with `$535`.
> Normally this is only necceasry when there are two or more devices on the local network with the same MAC address causing conflicts.

> [!TIP]
- You can use online tools (e.g., [browserling.com/tools/random-mac](https://www.browserling.com/tools/random-mac)) to generate unique MAC addresses.
- Alternatively, you might use the MAC address from a device not currently in use, such as an old router or network printer, which is often printed on the back of the device.

---

### WiFi <!-- toc -->

#### Settings {#wifi-settings}

| Setting | Description |
|:-------:|:------------|
|**`$73`**| WiFi Mode, determines how the WiFi radio on your controller will operate. |

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Off     | The WiFi radio is disabled. |
| 1     | [Access Point](#wifi-ap) (AP) Mode | The controller creates its own network. |
| 2     | [Station](#wifi-sta) (STA) Mode | The controller connects to an existing network. (Most common) |
| 3     | Access Point/Station (AP/STA) Mode | The controller simultaneously creates its own WiFi network and connects to an existing one. 

> [!NOTE]
> - It is only available on boards with a WiFi radio.
> - Some modes may not be available on all WiFi capable boards.

> [!TIP]
> - After changing the WiFi mode, a controller reset is required.
> - Station mode (`2`) is the most common and convenient way to put your machine on your local network.

### WiFi Access Point (AP) Mode <!-- toc --> {#wifi-ap}
In this mode the controller acts as a WiFi router.

#### Settings {#wifi-ap-settings}

| Setting  | Description |
|:--------:|:------------|
|**`$76`**| SSID, name of the network. Up to 32 characters. |
|**`$77`**| Password, password to use for connecting to the network. Minimum 8 characters. |
|**`$310`** - **`$318`**| [Common network settings](#network-settings-common). |

#### Example
* _Creating a network for your machine:_
  * `$76=MyMill-WiFi`
  * `$77=MyPassword`

> [!TIP]
> - Choose a unique name to easily identify your machine's network.
> - The password can be left blank, if not it enables WPA2 security for the network.

---

### WiFi Station (STA) Mode <!-- toc --> {#wifi-sta}
In this mode the controller is connected to a WiFi router and is visible on the local network.

#### Settings {#wifi-sta-settings}

| Setting  | Description |
|:--------:|:------------|
|**`$76`**| SSID, name of the network to connect to. Up to 64 characters. |
|**`$77`**| Password, password to use for connecting to the network. Can be left blank for unsecured networks. |
|**`$337`**| BSSID, MAC address of the network to connect to. |
|**`$320`** - **`$328`**| [Common network settings](#network-settings-common). |

#### Example
* _Connect to an existing network (change the SSID and password to match your WiFi router/access point):_
  * `$76=RouterSSID`
  * `$77=RouterPassword`

> [!TIP]
> - WiFi network names and passwords are case-sensitive. "MyWifi" is different from "mywifi".
> - If the controller fails to connect, an incorrect SSID or password is the most common cause.
> - BSSID can normally be left blank,it is for connecting to a specific router when there are more than one router broadcasting the same SSID.

---

## WebUI
Github Repository: https://github.com/grblHAL/Plugin_WebUI

Provides a server backend [ESP32-WEBUI](https://github.com/luc-github/ESP3D-webui) for some networking capable boards and drivers.

This plugin sits on top of a heavily modified [lwIP](http://savannah.nongnu.org/projects/lwip/) raw mode http daemon.  

#### Installation:

Enable WebUI support by uncommenting `#define WEBUI_ENABLE 1` in _my_machine.h_ and recompile/reflash.
This adds backends for both WebUI v2 and v3, set the define value to 2 or 3 to only add v2 or v3.

Ensure `$306` \(HTTP port\) is set to `80`, `$307` \(Websocket port\) is set to `81` and `$70` has flags set to enable both the http and websocket daemons. `15` is a safe value. Reboot.

For drivers with FlashFS support \(see table above\) enter `<ip address>/` or `<ip address>/?forcefallback=yes` as the browser URL,
the latter if it is for an update.  
Replace `<ip address>` with the controller IP address. Tip: Use `$I` to find the IP address if dynamically assigned. 
Then click on the _Interface_ top menu item in the page shown and navigate to the _dist/CNC/grblHAL_ folder and download _index.html.gz_.
You may download _index.html.gz_ directly via this [link](https://raw.githubusercontent.com/luc-github/ESP3D-WEBUI/3.0/dist/CNC/GRBLHal/index.html.gz).
Upload the file via the upload button in the _FileSystem_ panel.

For drivers without FlashFS support download directly or from [this page](https://github.com/luc-github/ESP3D-WEBUI/tree/3.0/dist/CNC/GRBLHal), create a _www_ folder on the SD card and copy the download file there.
If the SD card is mounted in the controller then the folder can be created and the file copied either via ftp or WebDAV provided the protocol to be used has been activated.

Finally enter the controller IP address in a browser window, if all is well the WebUI will then be loaded.

This plugin can be complemented with an [additional plugin](#fluidnc-webui-support) that allows the [FluidNC fork](http://wiki.fluidnc.com/en/features/webui) of the ESP3D WebUI to run. 

#### Settings: {#webui-settings}

#### `$330` – WebUI Admin Password
Sets the password for the `admin` account.

> ℹ️ **Info**
> - Used by the WebUI for authorisation

| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The password. |

#### Common Examples
*   **Set a new admin password:**
    *   `$330=MySecurePassword123`
*   **Clear the password:**
    *   `$330=` (with no value after the equals sign)

#### Tips & Tricks
- It is highly recommended to set a secure `admin` password if your machine is on a shared or untrusted network.
- The default password may be blank

---

#### `$331` – WebUI User Password
Sets the password for the `user` account.

> ℹ️ **Info**
> - Used by the WebUI for authorisation
> - The `user` account may have restricted privileges compared to the `admin` account

| Value | Meaning | Description |
|:------|:--------|:------------|
| String| The password. |

#### Common Examples
*   **Set a new user password:**
    *   `$331=Guest123`
*   **Clear the password:**
    *   `$331=` (with no value after the equals sign)

#### `$396`, `$397` – WebUI Settings
Configures behavior for the network-based Web User Interface.

> ℹ️ **Info**
> - `$396`: **WebUI Timeout:** Sets a timeout for the WebUI session.
> - `$397`: **WebUI Auto-Report Interval:** Sets how often the WebUI receives an automatic status update from the controller.

---

## Fan Control
Github Repository: https://github.com/grblHAL/Plugin_fans

Adds two M-codes for controlling fans, adopted from [Marlin specifications](https://marlinfw.org/docs/gcode/M106.html) \(with fewer parameter values supported\).

* `M106 <P->` turns fan on. The optional P-word specifies the fan, if not supplied fan 0 is turned on.
* `M107 <P->` turns fan off. The optional P-word specifies the fan, if not supplied fan 0 is turned off.

The new realtime command `0x8A` can also be used to toggle fan 0 on/off even when a G-code program is running.

Add a line with

`#define FANS_ENABLE <n>`

to _my_machine.h_ to enable `<n>` fans, e.g. `#define FANS_ENABLE 1` for one.

If the driver supports mapping of port number to fan the following $-settings, depending on number of fans configured, are made available:

### Settings {#fan-settings}

`$386` - for mapping aux port to Fan 0.  
`$387` - for mapping aux port to Fan 1.  
`$388` - for mapping aux port to Fan 2.  
`$389` - for mapping aux port to Fan 3.

Use the `$pins` command to see which port/pin is currently assigned.  
> [!IMPORTANT]
> A hard reset is required after changing port to fan mappings.  

Fans can be linked to the spindle enable command, thus turning them automatically on and off depending on the spindle state.  
> [!NOTE]
> If a fan is turned on by `M106` \(or the new real time command\) before enabling the spindle it will _not_ be turned off automatically when the spindle is stopped.

`$483` - bits for linking specific fans to spindle enable.

Fan 0 can be configured be turned off automatically on program completion, or spindle disable if linked, after a configurable delay.  

`$480` - number of minutes to delay automatic turnoff of fan 0.   
> [!NOTE]
> If set to 0 fan 0 is not automatically turned off by program end and is turned off immediately if linked to spindle enable.

#### M-Codes{#fan-mcodes}

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M106` | `M106 P[fan] S[speed]` | Turn fan ON, set PWM speed (0–255) |
| `M107` | `M107 P[fan]` | Turn fan OFF |

#### $-Settings{#fan-settings}

| $-Setting | Description |
|-----------|-------------|
| `$386-$389` | Map aux port → fan 0..3 |
| `$480` | Auto-off delay (minutes) |
| `$483` | Bitmask: link fans to spindle enable |

#### Example
```gcode
; Turn on fan 0 at PWM 200
M106 P0 S200

; Turn off fan 0
M107 P0
```

---

## Miscellaneous plugins
Github Repository: https://github.com/grblHAL/Plugins_misc

A collection of small and useful plugins.

---

### Event out  <!-- toc -->

#### Settings {#eventout-settings}

#### `$750` - `$759` – Event Trigger Source Selection (Eventout Plugin)
Configures which real-time system state change will activate each of the ten available Event Slots (0-9).

> ℹ️ **Info**
> - This advanced feature is specifically implemented by the **`eventout` plugin** (often found in `Plugins_misc`). It enables highly responsive, direct hardware control based on various real-time machine states.
> - Each setting (`$750` to `$759`) corresponds to an **Event Slot (0-9)**. The **value you assign to each setting selects the source trigger** for that Event Slot from the predefined list of `EVENT_TRIGGERS`.
> - When an Event Slot is activated by its chosen trigger, it will control the auxiliary I/O port assigned to it via the corresponding `$76x` setting.
> - A value of `0` ("None") disables the trigger for that Event Slot.

| Value | Event Trigger Source      | Description                               |
|:-----:|:--------------------------|:------------------------------------------|
| **0** | **None**                  | No trigger assigned to this Event Slot.   |
| **1** | **Spindle enable (M3/M4)**| Activates when the primary spindle is commanded ON (`M3`/`M4`). |
| **2** | **Laser enable (M3/M4)**  | Activates when the primary laser is commanded ON (`M3`/`M4`).   |
| **3** | **Mist enable (M7)**      | Activates when mist coolant is commanded ON (`M7`).      |
| **4** | **Flood enable (M8)**     | Activates when flood coolant is commanded ON (`M8`).     |
| **5** | **Feed hold**             | Activates when the controller enters a Feed Hold state. |
| **6** | **Alarm**                 | Activates when the controller enters an Alarm state.    |
| **7** | **Spindle at speed**      | Activates when the spindle is confirmed to be at commanded speed (requires `$340` and encoder feedback for closed-loop systems). |
| **8** | **Motion**                | Activates when the machine is in motion (G0, G1, G2, G3, G38.x). |
| **9** | **Optional stop toggle**  | Activates when the Optional Stop `(M1)` state is toggled ON. |
| **10** | **Single Stepping Mode** | Activates when the controller is in Single Stepping (Single Block) mode. |
| **11** | **Block delete toggle**  | Activates when the Block Delete (/ skip) state is toggled ON. |

#### Common Examples
*   **Activate Event Slot 0 when the Spindle is enabled:**
    *   `$750=1`
*   **Activate Event Slot 1 when the controller enters an Alarm state:**
    *   `$751=6`
*   **Activate Event Slot 2 when Flood coolant is enabled:**
    *   `$752=4`

#### Tips & Tricks
- This system allows you to create highly responsive, hardware-level automation by linking machine states to specific output pins.
- The physical auxiliary output pin itself is assigned via the corresponding `$76x` setting.
- Ensure the selected trigger source matches your intended automation logic. This is an advanced feature for users familiar with the `eventout` plugin.

---

#### `$760` - `$769` – Event I/O Port Assignment (Eventout Plugin)
Assigns a physical auxiliary digital output port to be controlled by each of the ten Event Slots (0-9).

> ℹ️ **Info**
> - This setting works in conjunction with `$750`-`$759` to provide direct hardware control based on real-time system states, as part of the **`eventout` plugin**.
> - Each setting (`$760` to `$769`) corresponds to an **Event Slot (0-9)**. The **value you assign specifies which auxiliary I/O Port** will be activated when its corresponding Event Slot becomes active (as determined by the trigger selected in `$75x`).
> - A value of `-1` disables the output control for that Event Slot.

| Setting | Controls Output for Event Slot | Assigns to Auxiliary I/O Port Number |
|:--------|:-------------------------------|:-------------------------------------|
| `$760`  | Event Slot 0 (Trigger defined by `$750`) | Hardware auxiliary output pin number |
| `$761`  | Event Slot 1 (Trigger defined by `$751`) | Hardware auxiliary output pin number |
| ...     | ...                            | ...                                  |
| `$769`  | Event Slot 9 (Trigger defined by `$759`) | Hardware auxiliary output pin number |

#### Common Examples
*   **When Event Slot 0 is active, control auxiliary I/O Port 5:**
    *   `$760=5` (If `$750=1`, then Port 5 activates when Spindle is enabled. This could trigger a dust collector).
*   **When Event Slot 1 is active, control auxiliary I/O Port 7:**
    *   `$761=7` (If `$751=6`, then Port 7 activates when the controller is in an Alarm state. This could trigger a warning light or a main power shutdown relay).

#### Tips & Tricks
- This system enables sophisticated hardware-level responses. For example, you could activate a fume extractor (Port 7) whenever the laser is enabled (`$752=2`, `$762=7`).
- You must know the auxiliary I/O port numbers for your specific controller board. Use the `$PINS` command to list available ports.
- If an active-low signal is required for the connected device, you can use `$372` (Invert I/O Port Outputs) to invert the logic of the selected auxiliary port.

---

### RGB LED <!-- toc -->

Adds support for Marlin style [M150 command](https://marlinfw.org/docs/gcode/M150.html).  

#### M-code{#rgb-led-mcode}
| Command | Syntax | Description |
|---------|--------|-------------|
| `M150`  | `M150 <B-> <I-> <K> <P-> <R-> <S-> <U-> <W->` | Set LED color/brightness for a strip or individual LED. |

| Parameter | Description |
|:---------:|:------------|
|**`B`**| Blue component intensity (0-255)|
|**`I`**| LED index for individual control (0-255). Available if the number of LEDs in the strip is > 1|
|**`K`**| Keep unspecified values, meaning only the provided color/brightness components will be changed, others will retain their previous state|
|**`P`**| Brightness (0-255)|
|**`R`**| Red component intensity (0-255)|
|**`S`**| Strip index (0 or 1). Default is 0|
|**`U`**| Green component intensity (0-255)|
|**`W`**| White component intensity (0-255)|

> [!IMPORTANT]
> The plugin will not be activated if the controller does not supports RGB LED strip(s) or if the B axis is enabled.

#### Examples
```gcode
; Set strip 1 to bright red
M150 R255 U0 B0 S1

; Set strip 1 to purple
M150 R128 B128 S1

; Set strip 0 to 50% brightness (P127) for all LEDs
M150 P127 S0

; Set the third LED (index 2) on strip 0 blue component, keeping other colors
M150 I2 B255 K S0

; Turn all LEDs off
M150 R0 U0 B0 S1
```

---

### Feed Override <!-- toc -->

Adds Marlin style [M220 command ](https://marlinfw.org/docs/gcode/M220.html) for setting feed overrides.

#### M-code{#feed-override-mcode}
| Command | Syntax | Description |
|:-------:|:------:|:------------|
| `M220`  | `M220 <B> <R> <S->` | Set or backup/restore feed overrides |

| Parameter | Description |
|:---------:|:------------|
|**`B`**| Backup current override|
|**`R`**| Restore override from backup or set rapids override if used in combination with `S`|
|**`S`**| Override in percent, rapids override cannot exceed 100, normal feed override 200|

> [!NOTE]
> `M220RS<percentage>` can be used to override the rapids rate, if `R` is not specified the feed rate will be overridden. This deviates from the Marlin specification.

#### Examples
```gcode
; Set feed override to 80%
M220 S80

; Set rapids (G0) override to 50%
M220 RS50
```

---

### PWM Servo Control <!-- toc -->

Adds support for Marlin style [M280](https://marlinfw.org/docs/gcode/M280.html) command.

#### M-code{#pwm-servo-mcode}
| Command | Syntax | Description |
|:-------:|:------:|:------------|
| `M280` | `M280 <P-> <S->` | Control PWM servo |

| Parameter | Description |
|:---------:|:------------|
|**`P`**| Servo to set or get position for. Default is 0 |
|**`S`**| Position in degrees, 0 - 180 |

If `S` is omitted the current position is reported.

#### Examples
```gcode
; Move servo 0 to 90 degrees
M280 P0 S90

; Query servo 1 current position
M280 P1
```

---

### BLTouch Probe Control <!-- toc -->

Adds support for Marlin style [M401](https://marlinfw.org/docs/gcode/M401.html) and [M402](https://marlinfw.org/docs/gcode/M402.html) commands.

#### M-codes{#bltouch-mcodes}
| Command | Syntax | Description |
|:-------:|:------:|:------------|
| `M401` | `M401 <H> <R-> <S->` | Deploy BLTouch probe |
| `M402` | `M402 <R->` | Stow BLTouch probe |

| Parameter | Description |
|:---------:|:------------|
|**`H`**| Report high speed mode |
|**`R`**| The R parameter is currently ignored |
|**`S`**| 0 - disable high speed mode, 1 - enable high speed mode |

#### $-commands{#bltouch-commands}
| Command | Description |
|:-------:|:------------|
|**`$BLRESET`** | Perform BLTouch probe reset|
|**`$BLTEST`** | Perform BLTouch probe self-test|

---

### ESP-AT (Telnet over WiFi) <!-- toc -->

Adds Telnet support via [ESP-AT](https://docs.espressif.com/projects/esp-at/en/latest/esp32/Get_Started/index.html) running on a supported ESP MCU.
Allows senders to connect to the controller via WiFi.

#### Settings:
Adds many networking and WiFi settings for configuring mode \(Station, Access Point\), Telnet port, IP adress etc.

- link to WifI settings here (and passthru mode for programming).

---

### Toolsetter / Secondary Probe <!-- toc -->
Github Repository: https://github.com/grblHAL/Plugins_misc

Adds support for a dedicated toolsetter input and a secondary probe input, allowing for advanced probing scenarios.

#### $-Settings {#probe-relay-settings}

| Setting | Description |
|---------|-------------|
| `$678` | **Toolsetter Input:** Auxiliary input pin number. |
| `$679` | **Secondary Probe Input:** Auxiliary input pin number. |

#### `$678` – Relay Port for Toolsetter
Assigns a physical auxiliary digital output port to control a relay for the toolsetter.

> ℹ️ **Info**
> - This setting specifies which auxiliary digital output port will be used to activate a relay associated with the toolsetter.
> - A common use case is a mechanism to deploy/retract the toolsetter, or to select the toolsetter itself using a relay.
> - Set this value to `-1` to disable the relay output for the toolsetter.
> - **Probe selection is handled by the inbuilt `G65 P5 Q<n>` macro**, where `<n>` is the probe ID (e.g., `Q1` for toolsetter). The toolsetter can also be selected automatically during `@G59.3` tool changes.

| Value | Meaning |
|:-----:|:--------|
| -1    | Disabled (no relay output for toolsetter) |
| 0-N   | The hardware auxiliary digital output port number to control the toolsetter relay. |

#### Common Examples
*   **Default (Toolsetter relay disabled):**
    *   `$678=-1`
*   **Control a toolsetter relay via auxiliary port 2:**
    *   `$678=2`

#### Tips & Tricks
- This feature requires your selected driver/board to provide at least one free auxiliary digital output port capable of driving the relay coil, either directly or via a buffer.
- Ensure the relay's polarity and wiring match the expected output of the selected port (can be inverted with `$372`).

---

#### `$679` – Relay Port for Secondary Probe
Assigns a physical auxiliary digital output port to control a relay for the secondary probe.

> ℹ️ **Info**
> - This setting specifies which auxiliary digital output port (by its hardware number) will be used to activate a relay associated with a secondary probe (e.g., a touch plate, or an additional part probe).
> - This can be used for deploying the probe or selecting between multiple probe inputs using a relay.
> - Set this value to `-1` to disable the relay output for the secondary probe.
> - **Probe selection is handled by the inbuilt `G65 P5 Q<n>` macro**, where `<n>` is the probe ID (e.g., `Q2` for secondary probe).

| Value | Meaning |
|:-----:|:--------|
| -1    | Disabled (no relay output for secondary probe) |
| 0-N   | The hardware auxiliary digital output port number to control the secondary probe relay. |

#### Common Examples
*   **Default (Secondary probe relay disabled):**
    *   `$679=-1`
*   **Control a secondary probe relay via auxiliary port 3:**
    *   `$679=3`

#### Tips & Tricks
- This feature requires your selected driver/board to provide at least one free auxiliary digital output port capable of driving the relay coil.
- This provides an advanced method for managing multiple probe devices on your machine, leveraging `G65 P5 Q` for programmatic selection.

#### Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `G65` | `G65 P5 Q[n]` | Select probe input: `Q0`=Standard, `Q1`=Toolsetter, `Q2`=Secondary. |

#### Example
```gcode
; Configure toolsetter input on Aux 2
$678=2

; Select toolsetter to probe tool length
G65 P5 Q1
G38.2 Z-50 F100

; Return to standard probe
G65 P5 Q0
```

---

## OpenPNP
Github Repository: https://github.com/grblHAL/Plugin_OpenPNP

Under development. Adds some M-codes to allow grblHAL to be used for [OpenPNP](https://openpnp.org/) machines.

#### M-codes{#openpnp-mcodes}
| M-Code | Syntax | Description |
|:------:|:------:|:------------|
| `M42`  | `M42 P- S-` | Set digital output |
| `M114` | `M114 <P->` | Report current position |
| `M115` | `M115` | Report firmware information |
| `M143` | `M143 E-\|P-` | Read raw analog or digital input<sup>1</sup> |
| `M144` | `M144 E-` | Read scaled analog or digital input<sup>1</sup> |
| `M145` | `M143 E- S- Q-` | Set scaling data for analog input port<sup>1</sup> |
| `M204` | `M204 <P->\|<S->\|<T-`> | Set axis acceleration, if value is 0 acceleration is restored to its configured value |
| `M205` | `M205 axes` | Set jerk, if value is 0 jerk is restored to its configured value |
| `M400` | `M400` | Wait for motion buffer cleared and motion stop. Same function as `G4P0`. |

| Parameter | Description |
|:---------:|:------------|
|**`E`**    | Analog port number |
|**`P`**    | `M42`: Digital port number |
|**`P`**    | `M114`: Ignored |
|**`P`**    | `M204`: Set acceleration for all axes |
|**`S`**    | `M42`: 0 - turn off output, 1 - turn on output |
|**`S`**    | `M145`: Scaling factor |
|**`S`**    | `M204`: Set acceleration for all axes except the linear axis (Z-axis) |
|**`T`**    | Set acceleration for all axes except the linear axis (Z-axis) |
|**`Q`**    | Scaling offset |

<sup>1</sup> M-code under consideration, may cchange:

> [!NOTE]
> - `M42` is equivalent to the [standard](https://linuxcnc.org/docs/2.5/html/gcode/m-code.html#sec:M62-M65) commands, `M64` and `M65`, which are supported by the core.  
> - `M143` - returned data from `M143` is in the format `A<n>:<value>` for analog inputs and `D<n>:<value>` for digital. `<n>` is the port number and `<value>` is the value read.
> - `M144` - returned data from `M144` is in the format `A<n>:<value>` where `<n>` is the port number and `<value>` is the value read.
> The returned value is `raw value * P + Q`, `P` and `Q` values as set by a previous `M145` command, defaults for these are `1` and `0` respectively.

> [!NOTE]
> Information about available axes and auxiliary ports is available in the `$I+` [system information](https://github.com/grblHAL/core/wiki/Report-extensions#other-request-responses-or-push-messages) output, see the `AXS` and `AUX IO` elements.

#### Example
```gcode
; Turn on digital output 2
M42 P2 S1

; Set acceleration for axes other than Z
M204 S500
```

---

## Laser
Github Repository: https://github.com/grblHAL/Plugins_laser

| Command | Syntax | Description |
|---------|--------|-------------|
| `M3/M4` | `M3/M4 S[power]` | Laser on with PWM power |
| `M5` | `M5` | Laser off |

#### Settings {#laser-settings}

#### `$378` – Laser Coolant On Delay (sec) {#378}
#### `$379` – Laser Coolant Off Delay (sec) {#379}
Sets a delay for when the laser coolant system turns on or off, respectively.

> ℹ️ **Info**
> - These are part of the closed-loop laser coolant control system (`$378` - `$383`, `$390`, `$391`).
> - `On Delay`: Time to wait after `M3`/`M4` before the coolant is assumed to be flowing.
> - `Off Delay`: Time the coolant pump continues to run after `M5` to cool down the laser.

| Value (seconds) | Description |
|:---------------:|:------------|
| 0.0 - N         | The delay duration in seconds. |

---

#### `$380` – Laser Coolant Min Temp (°C)
#### `$381` – Laser Coolant Max Temp (°C)
Define the acceptable operating temperature range for the laser coolant.


> ℹ️ **Info**
> - If the coolant temperature (read via `$390`) goes outside this range, an alarm or warning can be triggered to protect the laser.


| Value (°C) | Description |
|:----------:|:------------|
| N          | Temperature in degrees Celsius. |

---

#### `$382` – Laser Coolant Offset (ADC calibration)
#### `$383` – Laser Coolant Gain (ADC calibration)
Calibration parameters for the analog-to-digital converter (ADC) used to read the laser coolant temperature.

> ℹ️ **Info**
> - These are used to convert the raw ADC value from the temperature sensor into an accurate temperature reading.
> - Formula: `True_Temperature = (Raw_ADC_Reading * Gain) + Offset`

#### `$390` – Laser Coolant Temp Port (Analog pin)
Maps the analog input pin for reading the laser coolant temperature sensor.

> ℹ️ **Info**
> - This tells the laser coolant control system which ADC pin to use for temperature feedback.

| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware ADC pin number. |

---

#### `$391` – Laser Coolant OK Port (Digital pin)
Maps the digital input pin for the laser coolant flow switch.

> ℹ️ **Info**
> - This input provides feedback on whether the coolant is actually flowing, essential for laser safety.

| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital input pin number. |

#### Example
```gcode
; Laser on at 50% power
M3 S128

; Laser off
M5
```

---

## Keypad plugins {#keypad}
Github Repository: https://github.com/grblHAL/Plugins_laser

### Keypad

#### `$50` – Jog Step Speed {#50}
Sets the feed rate (in mm/min) to be used for step-style jogging moves.


> ℹ️ **Info**
> - This is an optional, driver-specific setting, primarily used by pendants and jog wheels. It may not be available on all boards.
> - It defines the speed for precise, incremental jogs (e.g., moving exactly 0.1mm).
> - Works in conjunction with `$53` (Jog Step Distance).


| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for short, precise jogging moves. |

#### Common Examples
*   **Precise Positioning Speed:**
    *   `$50=100`

#### Tips & Tricks
- This allows you to have a different, often slower, speed for fine-tuning your position compared to your general-purpose slow jog speed (`$51`).

---

#### `$51` – Jog Slow Speed
Sets the feed rate (in mm/min) to be used for continuous slow jogging.

> ℹ️ **Info**
> - An optional, driver-specific setting for pendants and jog wheels.
> - This is the speed used when you are continuously holding down a jog button for slow, controlled movement.
> - Works in conjunction with `$54` (Jog Slow Distance).

| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for continuous slow jogging. |

#### Common Examples
*   **Controlled Slow Jog:**
    *   A speed that is fast enough to cover distance but slow enough for precise stopping.
    *   `$51=500`

---

#### `$52` – Jog Fast Speed
Sets the feed rate (in mm/min) to be used for continuous fast jogging.

> ℹ️ **Info**
> - An optional, driver-specific setting for pendants and jog wheels.
> - This is the speed used when you are continuously holding down a jog button for rapid positioning.

| Value (mm/min) | Meaning |
|:--------------:|:--------|
| 1 - N          | The feed rate for continuous fast jogging. |

#### Common Examples
*   **Rapid Manual Positioning:**
    *   Typically set to a high percentage of the axis max rate.
    *   `$52=2500`

---

#### `$53` – Jog Step Distance
Sets the smallest incremental distance for step-style jogging.

> ℹ️ **Info**
> - This optional, driver-specific setting defines the distance for each "click" or "step" of a jog command when the "step" (or "x1") increment is selected.
> - It's typically used for very fine adjustments, like 0.01mm or 0.001mm.

| Value (mm) | Description |
|:----------:|:------------|
| 0.001 - N  | The incremental distance for the smallest jog step. |

#### Common Examples
*   **Default for fine adjustments:**
    *   `$53=0.01`
*   **For ultra-fine positioning:**
    *   `$53=0.001`

#### Tips & Tricks
- This setting is crucial for precise zeroing and manual probing.

---

#### `$54` – Jog Slow Distance
Sets the medium incremental distance for step-style jogging.

> ℹ️ **Info**
> - This optional, driver-specific setting defines the distance for each "click" or "step" of a jog command when the "slow" (or "x10") increment is selected.
> - It provides a balance between fine adjustment and covering distance quickly.

| Value (mm) | Description |
|:----------:|:------------|
| 0.01 - N   | The incremental distance for medium jog steps. |

#### Common Examples
*   **Default for general positioning:**
    *   `$54=0.1`
*   **For slightly coarser adjustments:**
    *   `$54=0.5`

#### Tips & Tricks
- This setting is often used for moving the tool into a general area before switching to finer jog increments.
- If `$40` (Limit Jog Commands) is enabled, you can safely set this value to be quite large if needed, as jogging commands will be clamped to stay within the machine's configured workspace, preventing accidental overtravel.

---

#### `$55` – Jog Fast Distance
Sets the largest incremental distance for step-style jogging.

> ℹ️ **Info**
> - This optional, driver-specific setting defines the distance for each "click" or "step" of a jog command when the "fast" (or "x100") increment is selected.
> - It's used for quickly traversing significant distances across the machine's work area.

| Value (mm) | Description |
|:----------:|:------------|
| 0.1 - N    | The incremental distance for the largest jog step. |

#### Common Examples
*   **Default for rapid positioning:**
    *   `$55=1.0`
*   **For very large machines or long rapid moves:**
    *   `$55=10.0`

#### Tips & Tricks
- This setting helps quickly move the tool to the vicinity of the workpiece.
- If `$40` (Limit Jog Commands) is enabled, you can safely set this value to be quite large if needed, as jogging commands will be clamped to stay within the machine's configured workspace, preventing accidental overtravel.

### Macro {keypad-macros}

####  {keypad-macros-settings}

Assigns custom M-codes (from M100 upwards) to execute specific G-code sequences directly stored in the controller's settings.

> ℹ️ **Info**
> - This is a powerful feature primarily used by the **Keypad Macro plugin** to associate custom G-code sequences with M-codes, which can then be triggered by physical button presses (via `$500+` MacroPort inputs or a keypad plugin).
> - `$490` corresponds to `M100`, `$491` to `M101`, and so on up to `$499` for `M109`.
> - The **value of the setting is the actual G-code sequence** to be executed, stored directly in the controller's EEPROM (or flash emulation). These stored macros have a **limited length** due to storage constraints.
> - Multiple G-code blocks can be defined within a single setting by separating them with a vertical bar (`|`).

| Setting | M-Code | Description |
|:--------|:-------|:------------|
| `$490`  | M100   | Executes the G-code sequence stored in setting $490 |
| `$491`  | M101   | Executes the G-code sequence stored in setting $491 |
| ...     | ...    | ...         |
| `$499`  | M109   | Executes the G-code sequence stored in setting $499 |

#### Common Examples
*   **Move to a origin position when M100 is called:**
    *   `$490=G90 G0 Z0 X0 Y0`
*   **Perform a simple Z probe when M101 is called:**
    *   `$491=G91 G38.2 Z-10 F100`

#### Tips & Tricks
- Due to length limitations of macros stored in settings, for **longer or more complex macros**, it is recommended to store them as `macro` files on the SD card. You can then call these SD card files from within an `$49x` macro using the `G65 P` command.
- For example, if you have a `500.macro` file on the SD card, you could set `$490=G65 P500`.
- These macros are most effective when combined with the MacroPort Input Mapping (`$500+`) or the Keypad plugin for physical button activation.

#### `$590` - `$599` – Button Action Mapping (MacroPort)
Assigns a specific system action to be performed when a physical input mapped to a MacroPort is triggered.

> ℹ️ **Info**
> - These settings define the action that grblHAL will take when a physical input pin (configured in `$500`-`$509`) for a given MacroPort index is activated.
> - This mapping allows physical buttons or external signals to trigger either custom G-code macros or predefined real-time system commands.
> - `$590` defines the action for MacroPort 0, `$591` for MacroPort 1, and so on, up to `$599` for MacroPort 9.

| Value | Action Description |
|:-----:|:-------------------|
| **0** | **Run Associated Macro:** Executes the G-code macro defined in the corresponding `$49x` setting (e.g., if `$590=0`, MacroPort 0 triggers the G-code from `$490`, which is M100). |
| 1     | Cycle Start        | Initiates or resumes the G-code program (`0x81` real-time command). |
| 2     | Feed Hold          | Pauses the current G-code program (`0x85` real-time command). |
| 3     | Park               | Triggers the parking cycle (`0x84` real-time command). |
| 4     | Reset              | Performs a soft reset of the controller (`0x18` real-time command). |
| 5     | Spindle Stop (during feed hold) | Disables the spindle output if currently active during a feed hold. |
| 6     | Mist Toggle        | Toggles the mist coolant output. |
| 7     | Flood Toggle       | Toggles the flood coolant output. |
| 8     | Probe Connected Toggle | Toggles the internal "probe connected" flag. |
| 9     | Optional Stop Toggle | Toggles the optional stop (`M1`) functionality. |
| 10    | Single Block Mode Toggle | Toggles single-block execution mode. |

#### Common Examples
*   **Pressing a button on MacroPort 0 runs its custom macro (M100):**
    *   `$590=0` (`$490` contains the `M100` G-code)
*   **Pressing a button on MacroPort 1 triggers a Feed Hold:**
    *   `$591=2`
*   **Pressing a button on MacroPort 2 triggers a Cycle Start:**
    *   `$592=1`

#### Tips & Tricks
- This system provides immense flexibility for customizing physical control panels and pendants.
- You can mix and match, having some buttons trigger custom macros (value `0`) and others trigger built-in grblHAL functions (values `1`-`10`).
- Ensure the G-code for any macro you intend to run (when `$59x=0`) is correctly defined in the corresponding `$49x` setting.

---

## Encoder
Github Repository: https://github.com/grblHAL/Plugin_encoder

### Settings {#encoder-settings}

#### `$400` – Encoder 0 - Index (Base)
Selects the primary function for the first encoder (Encoder 0).

> ℹ️ **Info**
> - This is the master setting for the first encoder block (`$400`-`$409`). It determines what the encoder will control.
> - Encoders are typically used for Manual Pulse Generators (MPGs) or digital control knobs.
> - A value of `0` disables this encoder.

| Index | Function | Description |
|:-----:|:---------|:------------|
| 0     | Disabled | This encoder is not used. |
| 1-6   | Jog Axis X-C | Use the encoder to jog the specified axis. |
| 7     | Feed Rate Override | Use the encoder to adjust the feed rate override. |
| 8     | Rapid Rate Override | Use the encoder to adjust the rapid rate override. |
| 9     | Spindle Speed Override | Use the encoder to adjust the spindle speed override. |

#### Common Examples
*   **Jog Z-Axis with an MPG:**
    *   `$400=3`
*   **Control Feed Rate with a Knob:**
    *   `$400=7`

---

#### `$401` – Encoder 0 - CPR / Resolution
Sets the Counts Per Revolution (CPR) of the Encoder 0 hardware.

> ℹ️ **Info**
> - This tells grblHAL how many signals the encoder generates for one full 360° turn.
> - For a quadrature encoder, CPR is typically 4 times its PPR (Pulses Per Revolution).
> - This value is usually found in the encoder's datasheet.

| Value | Meaning |
|:-----:|:--------|
| 1-N   | The CPR value of the encoder. |

#### Common Examples
*   **Standard 100-PPR MPG Pendant:**
    *   100 Pulses Per Revolution = 400 Counts Per Revolution.
    *   `$401=400`

---

#### `$402` – `$449` – Encoder Settings (Extended)
This range is reserved for additional encoder configurations beyond the primary Encoder 0 (`$400`, `$401`). It may be used for multiple MPGs, digital potentiometers, or other rotational input devices. The specific settings within this range are plugin- or driver-dependent.

---

| $-Setting | Description |
|-----------|-------------|
| `$701-$704` | Encoder pins and scaling per axis |

#### Example
```gcode
; Read spindle encoder position
M114
```

---

## Plasma / Torch Height Control (THC)
Github Repository: https://github.com/grblHAL/Plugin_plasma

Under development. Based on [LinuxCNC specification](http://linuxcnc.org/docs/2.8/html/plasma/plasmac-user-guide.html#config-panel), with limitations.

### Settings:{#plasma-settings}

#### `$350` – _THC Mode_
The master switch and mode selector for the Torch Height Control system.

> ℹ️ **Info**
> - This setting is used by the Plasma/THC plugin.
> - THC automatically adjusts torch height to maintain a constant arc voltage, which is critical for cut quality.

| Value | Meaning |
|:-----:|:--------|
| 0     | Disabled |
| 1     | Automatic |
| ...   | Plugin-specific modes |

---

#### `$351` – _THC Delay_
Sets a delay after the "Arc OK" signal is received before THC becomes active.

These settings are provided by the [Plasma plugin](/docs/reference/plugins#plasma-settings).

> ℹ️ **Info**
> - This is the "pierce delay." It allows the torch to pierce the material completely before height control begins, preventing the torch from diving into molten metal.


| Value (seconds)| Description |
|:--------------:|:------------|
| 0.0 - N        | The delay time. |

---

#### `$352` – _THC Threshold_
Sets the voltage "deadband" for THC corrections.

> ℹ️ **Info**
> - This is the +/- voltage window around the target arc voltage where no Z-axis correction will be made.
> - It prevents the Z-axis from constantly jittering ("hunting") due to tiny voltage fluctuations.

| Value (Volts) | Description |
|:-------------:|:------------|
| 0.0 - N       | The allowable voltage deviation before a correction is made. |

---

#### `$353` - `$355` – _THC PID Gains_
Sets the P, I, and D gains for the THC's Z-axis correction PID controller.

> ℹ️ **Info**
> - `$353`: P-Gain (Proportional)
> - `$354`: I-Gain (Integral)
> - `$355`: D-Gain (Derivative)
> - These values are used to tune how aggressively and smoothly the Z-axis responds to changes in arc voltage. This is a very advanced tuning process.

---

#### `$356` – _THC VAD Threshold_
Voltage-based Anti-dive threshold.


> ℹ️ **Info**
> - A feature to prevent "torch diving" at corners. When the machine slows down, this helps the THC logic to avoid misinterpreting the resulting voltage change.

---

#### `$357` – _THC Void Override_
Enables THC override when crossing voids or previously cut kerfs.

> ℹ️ **Info**
> - When the torch crosses a void, voltage spikes and a simple THC will dive. This feature helps prevent that.

---

#### `$358` – _Arc Fail Timeout (sec)_
Sets the maximum time to wait for the "Arc OK" signal after the torch is fired (`M3`).

> ℹ️ **Info**
> - After the torch is commanded to fire, the controller starts this timer.
> - It then waits for a valid "Arc OK" signal to be received on the input pin defined by `$367`.
> - If the "Arc OK" signal is not received before this timer expires, grblHAL will declare a fault and begin the retry sequence.
> - This prevents the machine from running a cutting path without the torch being properly lit and cutting.

| Value (sec)| Meaning | Description |
|:----------:|:--------|:------------|
| 0.1 - N    | Timeout | The duration to wait for the "Arc OK" signal. |

#### Common Examples
*   **Wait up to 5 seconds for the arc:**
    *   This provides ample time for the plasma cutter to fire and for the arc to transfer and stabilize.
    *   `$358=5.0`

#### Tips & Tricks
- This value should be long enough to account for your plasma cutter's entire pierce sequence.
- If it's too short, you may get false "misfire" alarms. If it's too long, the machine will wait unnecessarily before starting a retry.

---

#### `$359` – _Arc Retry Delay_ (sec)
Sets the delay between a failed arc attempt and the next attempt.

> ℹ️ **Info**
> - If the `$358` timer expires, grblHAL will turn off the torch, wait for this delay period, and then try to fire the torch again.
> - This delay allows the plasma cutter's internal systems to reset and for any post-flow air to stop before the next attempt.

| Value (sec)| Meaning | Description |
|:----------:|:--------|:------------|
| 0.1 - N    | Delay | The pause duration between retry attempts. |

#### Common Examples
*   **Wait 3 seconds between retries:**
    *   This gives the system time to reset before trying again.
    *   `$359=3.0`

#### Tips & Tricks
- Check your plasma cutter's manual for a recommended "post-flow" time, and set this delay to be slightly longer than that.

---

#### `$360` – _Arc Max Retries_
Sets the number of times to attempt to fire the torch *after* the initial failure.

> ℹ️ **Info**
> - This setting controls how many times the retry cycle (`$359` delay -> fire torch -> `$358` timeout) will be repeated.
> - If the arc still fails after all retry attempts, grblHAL will abort the job and enter an alarm state.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | No Retries | If the first attempt fails, the job will alarm immediately. |
| 1-N   | # of Retries | The number of additional attempts to make. |

#### Common Examples
*   **Allow 2 retries:**
    *   The system will try to fire the torch a total of 3 times (the initial attempt + 2 retries).
    *   `$360=2`

#### Tips & Tricks
- Setting this to `1` or `2` can often recover from intermittent misfires caused by moisture or worn consumables, saving a large job from being ruined.
- If you are getting frequent misfires that require multiple retries, it is a sign that your plasma consumables (nozzle, electrode) need to be replaced.

---

#### `$361` and `$362` – _Arc Voltage Scale & Offset_
Applies a scale factor and offset to the raw analog voltage reading from the THC.

> ℹ️ **Info**
> - These settings are used to calibrate the analog input (`$366`) to match the true arc voltage.
> - This allows you to correct for inaccuracies in the voltage divider or analog reading circuitry.
> - **Formula:** `True_Voltage = (Raw_ADC_Reading * Scale) + Offset`

| Setting | Description |
|:--------|:------------|
| `$361`  | **Voltage Scale:** A multiplier (e.g., `1.01` to increase reading by 1%). |
| `$362`  | **Voltage Offset:** A value to add or subtract (e.g., `-0.5` to subtract 0.5V). |

---

#### `$363` – _Arc Height Per Volt_
Defines the relationship between arc voltage and torch height.

> ℹ️ **Info**
> - A fundamental tuning parameter for THC. It tells the controller how much to move the Z-axis for a given change in voltage.
> - The value is typically expressed in mm/Volt or inches/Volt.
> - This value is specific to your plasma cutter, material, and consumables.

---

#### `$364` & `$365` – _Arc OK Voltage Range_
Defines the acceptable voltage window for the "Arc OK" signal.

> ℹ️ **Info**
> - In some systems without a dedicated "Arc OK" digital input, grblHAL can infer the signal by monitoring the arc voltage.
> - `$364`: **Arc OK High Voltage:** The upper voltage limit.
> - `$365`: **Arc OK Low Voltage:** The lower voltage limit.
> - If the measured arc voltage is within this window, the arc is considered stable.

---

#### `$366` – _Arc Voltage Analog Input Port_
Maps the physical analog input pin for reading the torch voltage.

> ℹ️ **Info**
> - This setting is used by the Plasma/THC plugin.
> - It tells the plugin which analog-to-digital converter (ADC) pin on the controller is connected to the plasma torch's voltage divider output.

| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware ADC pin number. |

#### Tips & Tricks
- This is a hardware-specific mapping. You **must** consult the documentation for your specific controller board to find the correct pin number.

---

#### `$367` – _Arc OK Digital Input Port_
Maps the physical digital input pin for the "Arc OK" signal.

> ℹ️ **Info**
> - This setting is used by the Plasma/THC plugin.
> - The "Arc OK" (or "Arc Transfer") signal is a digital output from the plasma cutter that confirms a stable cutting arc has been established.
> - grblHAL will not begin motion until this signal becomes active.

| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital input pin number. |

#### Tips & Tricks
- This is a hardware-specific mapping. You **must** consult the documentation for your specific controller board to find the correct pin number.

---

#### `$368` – _Torch Down Digital Output Port_
Maps the physical digital output pin to an external "Torch Down" signal.


> ℹ️ **Info**
> - This setting is used by some advanced THC systems.
> - Instead of controlling the Z-axis motor directly, grblHAL can output simple "Up" and "Down" signals to an external, dedicated torch height controller.
> - This setting defines the pin for the "Down" signal.

| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital output pin number. |

---

#### `$369` – _Torch Up Digital Output Port_
Maps the physical digital output pin to an external "Torch Up" signal.


> ℹ️ **Info**
> - This setting is used by some advanced THC systems.
> - It defines the pin for the "Up" signal to be sent to an external THC controller.
> - Works in conjunction with `$368`.

| Value | Meaning |
|:-----:|:--------|
| Pin # | The hardware digital output pin number. |

---

#### $350 - _Mode of operation_

| Mode | Description |
|------|-------------|
| 0    | Disabled.|
| 1    | Uses an external arc voltage input to calculate Arc Voltage (for Torch Height Control).<br>Uses an external Arc OK input for Arc OK.|
| 2    | Uses an external Arc OK input for Arc OK.<br>Uses external up/down signals for Torch Height Control.|
| 3    | Uses an external Arc OK input for Arc OK.|

#### THC

| Setting                    | Modes | Description |
|----------------------------|-------|-------------|
| $351 - Delay               | 1,2   | This sets the delay (in seconds) measured from the time the Arc OK signal is received until Torch Height Controller (THC) activates.|
| $352 - Threshold \(V\)     | 1     | This sets the voltage variation allowed from the target voltage before for THC makes movements to correct the torch height.|
| $353 - P Gain              | 1     | This sets the Proportional gain for the THC PID loop.<br>This roughly equates to how quickly the THC attempts to correct changes in height. |
| $354 - I Gain              | 1     | This sets the Integral gain for the THC PID loop.<br>Integral gain is associated with the sum of errors in the system over time and is not always needed.|
| $355 - D Gain              | 1     | This sets the Derivative gain for the THC PID loop.<br>Derivative gain works to dampen the system and reduce over correction oscillations and is not always needed.|
| $356 - VAD Threshold \(%\) | 1,2   | \(Velocity Anti Dive\) This sets the percentage of the current cut feed rate the machine can slow to before locking the THC to prevent torch dive.|
| $357 - Void Override \(%\) | N/A    | This sets the size of the change in cut voltage necessary to lock the THC to prevent torch dive \(higher values need greater voltage change to lock THC\)|
| $682 - Z feed factor \(%\) | 1,2   | This sets the Z-axis feedrate to use for height corrections as a percentage of the actual XY feedrate.|

#### ARC

| Setting                | Modes | Description |
|------------------------|-------|-------------|
| $358 - Fail Timeout    | 1,2,3 | This sets the amount of time (in seconds) PlasmaC will wait between commanding a "Torch On"<br>and receiving an Arc OK signal before timing out and displaying an error message.|
| $359 - Retry Delay     | 1,2,3 | This sets the time (in seconds) between an arc failure and another arc start attempt.
| $360 - Max Retries     | 1,2,3 | This sets the number of times PlasmaC will attempt to start the arc.|
| $361 - Voltage Scale   | 1     | This sets the arc voltage input scale and is used to display the correct arc voltage.|
| $362 - Voltage Offset  | 1     | This sets the arc voltage offset and is used to display zero volts when there is zero arc voltage input.|
| $363 - Height Per Volt | 1     | This sets the distance the torch would need to move to change the arc voltage by one volt.<br>Used for manual height manipulation only.|
| $364 - Ok High Voltage | N/A   | This sets the voltage threshold below which Arc OK signal is valid.|
| $365 - Ok Low Voltage  | N/A   | This sets the voltage threshold above which the Arc OK signal is valid.|

#### Auxiliary I/O

| Setting                 | Description |
|-------------------------|-------------|
| $366 - Arc voltage port | This sets which analog input port to use for the arc voltage signal. Set to -1 to not use any.<sup>1</sup> |
| $367 - Arc ok port      | This sets which digital input port to use for the arc ok signal. Set to -1 to not use any.<sup>2</sup> |
| $368 - Cutter down port | This sets which digital input port to use for the cutter down signal. Set to -1 to not use any. |
| $369 - Cutter up port   | This sets which digital input port to use for the cutter up signal. Set to -1 to not use any. |

<sup>1</sup> This pin/port is required to enable voltage controlled THC.  
<sup>2</sup> This pin/port is required to enable the plugin.

Tip: use the `$PINS` command to list available pins. The port number is the number following the "_Aux in_" text, an example: `[PIN:P3.2,Aux in 0,P0]`.

#### $674 - Plugin options

| Bit | Value |Description |
|-----|-------|------------|
| 0   | 1     | Enable [virtual ports](#virtual-ports). |
| 1   | 2     | Sync Z position. Update the Z position when THC control ends. |

Add the _Value_ fields for the functionality to enable to get the one to use for the setting.

#### `$674` – THC Options [(bitmask)](#bitmask)
Configures advanced options for the THC (Torch Height Control) plugin.

> ℹ️ **Info**
> - The available options are defined by the specific THC plugin being used.
> - This is a companion to the main THC settings in the `$350+` block.

#### `$682` – THC Feed Factor {#682}
Sets a factor to adjust the Z-axis feed rate for THC correction moves.

> ℹ️ **Info**
> - A tuning parameter for the THC plugin.
> - It can be used to scale the speed of the THC's Z-axis adjustments to match the capabilities of the machine and the cutting parameters.

#### Virtual ports

Virtual ports are controlled by regular M-Codes.

* `M62 P2` will disable THC \(Synchronized with Motion\)

* `M63 P2` will enable THC \(Synchronized with Motion\)

* `M64 P2` will disable THC \(Immediately\)

* `M65 P2` will enable THC \(Immediately\)

* `M67 E3 Q-` Velocity Reduction \(Immediately\)

* `M68 E3 Q-` Velocity Reduction \(Synchronized with Motion)

The `Q`-word for `M67` and `M68` is the percentage of the programmed feed rate the actual feed rate will be changed to.

The minimum percentage allowed is 10%, values below this will be set to 10%.  
The maximum percentage allowed is 100%, values above this will be set to 100%.

> [!IMPORTANT]
> Virtual ports will shadow any real ports with the same port number. Some dummy ports may also be added since the core require port numbers to be consecutive starting from 0.

#### Materials

The plugin can load and partially make use of LinuxCNC and/or SheetCam style material files. Loading is from either a SD card or from root mounted littlefs file system.

The following files are currently loaded from if present:
* LinuxCNC: _/linuxcnc/material.cfg_
* SheetCam: _/sheetcam/default.tools_

Additionally materials can be modified or added by LinuxCNC style _magic_ [gcode comments](https://linuxcnc.org/docs/html/plasma/qtplasmac.html#plasma:magic-comments).

To select the material to use `M190P<n>` where `<n>` is the material number.  
If NGC parameter support is enabled in the controller the feedrate from the selected material can be set by adding `F#<_hal[plasmac.cut-feed-rate]>` to the gcode file.

Currently loaded materials can be output to the sender console with the `$EM` command, the output is in a machine readable format.

> [!NOTE]
> Settings updated via _magic_ comments are currently _not_ written back to the material file.

#### Dependencies:

Driver must support a number of auxiliary I/O ports, at least one digital input for the arc ok signal.  
Some drivers support the MCP3221 I2C ADC, when enabled it can be used for the arc voltage signal.

#### Credits:

LinuxCNC documentation linked to above.

#### $-Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `$350` | Mode of operation | `1` → uses external arc voltage input |
| `$351` | Arc OK pin | `2` → input pin number |
| `$352` | Arc Voltage pin | `3` → input pin number |
| `$353` | Up/Down pin | `4` → output pin number |
| `$354` | Voltage scale | `1.0` → scaling factor |
| `$355` | Voltage threshold | `0.5` → threshold value |
| `$356` | Velocity Anti-Dive threshold (%) | `20` |

#### M-Codes

| M-Code | Syntax | Description |
|--------|--------|-------------|
| `M62` | `M62 P[port]` | Disable THC, synchronized with motion |
| `M63` | `M63 P[port]` | Enable THC, synchronized with motion |
| `M64` | `M64 P[port]` | Disable THC, immediate |
| `M65` | `M65 P[port]` | Enable THC, immediate |
| `M67` | `M67 E[port] Q[percent]` | Immediate velocity reduction |
| `M68` | `M68 E[port] Q[percent]` | Velocity reduction synchronized |

#### Example
```gcode
; Plasma THC example
$350=2          ; THC mode: arc ok + up/down
$356=20         ; VAD threshold 20%
$361=1.5        ; Voltage scaling factor
$682=80         ; Z feed factor

M190 P3         ; Select material #3
M63 P0          ; Enable THC synced
G1 X100 Y0 F2000
G1 X100 Y100 F2000
M67 E0 Q50      ; Immediate feed reduction to 50%
M64 P0          ; Disable THC after cut
```

---

## Sienci ATCi (Automatic Tool Changer Interface) {#sienciatc}
Github Repository: https://github.com/Sienci-Labs/grblhal-atci-plugin

This plugin provides advanced safety, state management, and sensor integration for the **[Sienci Automatic Tool Changer (ATC)](https://sienci.com/product/automatic_tool_changer/)**.

### M-Codes{#sienci-atci-mcode}

| M-Code | Syntax | Description |
|:------:|:------:|:------------|
| `M960` | `M960 P-` | Keepout enforcement control. |

| Parameter | Description |
|:---------:|:------------|
| **`P`**   | `0` - disable keepout enforcement, `1` - enable keepout enforcement. |

### $-Settings{#sienci-atci-settings}

#### `$683` – ATCi Configuration (mask)
Configures the operating modes for the Sienci Automatic Tool Changer Interface plugin.

> ℹ️ **Info**
> - This is a **bitmask**: add together the values of the options you want to enable.
> - **Rack Monitor:** Uses `AUXINPUT7` to detect if the rack is physically mounted. If the rack is removed, the Keepout zone is automatically disabled.
> - **TC Macro Monitor:** Automatically disables the Keepout zone while a Tool Change macro is running to allow tool fetching.

| Bit | Value | Option | Description |
|:---:|:-----:|:-------|:------------|
| 0   | 1     | **Enable Plugin** | Master switch to enable the Keepout Zone logic on startup. |
| 1   | 2     | **Monitor Rack Presence** | Only enforce Keepout if the rack sensor (`AUXINPUT7`) is triggered. |
| 2   | 4     | **Monitor TC Macro** | Automatically disable Keepout when a tool change macro is active. |

**Common Examples**
* _Enable Basic Keepout:_
  * `$683=1`
* _Enable Full Automation (Rack Sensor + Macro Awareness):_
  * `$683=7` (1+2+4)

#### `$684` – `$687` – ATCi Keepout Zone Boundaries
Defines the rectangular safety zone around the tool rack in machine coordinates.

> ℹ️ **Info**
> - These settings define the X and Y limits of the area where the spindle is forbidden to enter during normal operation (jogging/G-code).
> - Entering this zone is only allowed if `M810 P0` is sent, or if the "Monitor TC Macro" option is enabled and a macro is running.
> - **Note:** The plugin includes a "jog-out" feature allowing you to escape the zone if trapped, but prevents jogging deeper in.

| Setting | Description | Units |
|:--------|:------------|:------|
| `$684`  | **X Min:** Left boundary of the zone. | mm |
| `$685`  | **Y Min:** Front boundary of the zone. | mm |
| `$686`  | **X Max:** Right boundary of the zone. | mm |
| `$687`  | **Y Max:** Back boundary of the zone. | mm |

> [!TIP]
> - Move your machine to the front-left corner of your rack area and note the machine coordinates for `$684`/`$685`.
> - Move to the back-right corner and note coordinates for `$686`/`$687`.
> - Add a small buffer (e.g., 5mm) to these values to ensure safety.

#### Real-time Report
Appends `|ATCI:[flags]` to the status string.
*   **E**: Enforcement Enabled
*   **Z**: Machine is Inside Zone
*   **R/M/T/S**: Source of state (Rack, M-code, Tool Macro, Startup)
*   **I**: Rack Installed
*   **B**: Drawbar Open
*   **L**: Tool Loaded
*   **P**: Low Air Pressure

#### Example
```gcode
; Configure Keepout Zone
$684=10.0   ; X Min
$686=50.0   ; X Max
$685=10.0   ; Y Min
$687=50.0   ; Y Max
$683=7      ; Enable plugin (1) + Monitor Rack (2) + Monitor Macro (4)

; Manually disable keepout to jog inside for maintenance
M960 P0
```

---

## Embroidery
Github Repository: https://github.com/grblHAL/Plugin_embroidery

Stream embroidery files (.dst, .pes) directly from SD card. This experimental plugin bypasses G-code translation for precise stitch timing.

#### Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `$F`: Set Pin LOW.
    - `0xC5 `: Set Pin HIGH.
    - `PinID`: `0x80 | PinIndex`.
- **Ack/Nak:** `0xB2` (Ack), `0xB3` (Nak).

---

## Templates
Github Repository: https://github.com/grblHAL/Templates

These plugins are mainly designed to be starting points for custom functionality but often provide useful features out-of-the-box.

Some of these plugins can be added to the firmware by using the [grblHAL Web Builder](https://webbuilder.grblhal.org/), they can found in the _3rd party plugins_ tab.

### FluidNC WebUI Support  <!-- toc -->
Adds support for commands required by the FluidNC WebUI (ESP3D v2 protocol), it is an extension to the [WebUI](#webui) plugin.
*   **Repo:** `my_plugin/FluidNC_ESP3D_cmd`
*   **Function:** Enables `[ESP:...]` command handling, allowing the FluidNC generic WebUI to function with grblHAL.

### MCU Load Estimator  <!-- toc -->
Adds a `MCU:` field to the real-time status report, showing the number of idle loop iterations per 10ms.
*   **Repo:** `my_plugin/MCU_load`
*   **Report:** `|MCU:20000|` (Higher is better, meaning less load. ,,,...`
*   **Example:**
    *   `$MODBUSCMD=1,6,0x0201,1000` (Write 1000 to reg 0x201 on device 1).
    *   `$MODBUSCMD=1,4,0,2` (Read 2 registers starting at 0 from device 1).

### Motor Power Monitor  <!-- toc -->
Monitors a digital input for high-voltage power loss (common on Trinamic setups).
*   **Repo:** `my_plugin/Motor_power_monitor`
*   **Setting:** `$450` (Input pin number).
*   **Behavior:**
    *   Triggers **Alarm 17** associated with Motor Fault on power loss.
    *   Automatically runs `M122I` (Re-init drivers) when power is restored and alarm is cleared.

### Pause on SD File Run  <!-- toc -->
Automatically triggers a Feed Hold when an SD card file starts execution.
*   **Repo:** `my_plugin/Pause_on_SD_file_run`
*   **Usage:** Useful for verifying machine state or changing tools before a job automatically begins. Requires user `Cycle Start` to proceed.

### Realtime Report Aux State <!-- toc -->
Adds the state of auxiliary output pins to the status report.
*   **Repo:** `my_plugin/Realtime_report_aux_out_state`
*   **Report:** `|AUX:0010|` (Bitmask of output states). Only reports ports available via M62-M65.

### Realtime Report Timestamp  <!-- toc -->
Adds the system uptime to the status report.
*   **Repo:** `my_plugin/Realtime_report_timestamp`
*   **Report:** `|TS:123456|` (Milliseconds since boot).

### Solenoid Spindle  <!-- toc -->
Optimizes PWM output for driving solenoids (Kick-and-Hold strategy).
*   **Repo:** `my_plugin/Solenoid_spindle`
*   **Behavior:**
    *   **Kick:** 100% duty cycle for 50ms to energize the solenoid.
    *   **Hold:** Drop to 25% duty cycle to maintain position without overheating.

### Stepper Enable Control  <!-- toc -->
Adds Marlin-style G-codes for individual stepper control.
*   **Repo:** `my_plugin/Stepper_enable_control`
*   **Commands:**
    *   `M17 [X] [Y] ...` - Enable specified steppers (or all if none specified).
    *   `M18 [X] [Y] ... [S]` - Disable steppers immediately or after `S` seconds.
    *   `M84` - Alias for M18.

### HPGL  <!-- toc -->
Adds [HPGL](https://en.wikipedia.org/wiki/HP-GL) interpreter mode, allowing the CNC to act as a native pen plotter.
*   **Repo:** `my_plugin/hpgl`
*   **Command:** `$HPGL` (Enter HPGL mode).
*   **Exit:** `CTRL+X` (Return to G-code mode).
*   **Note:** Based on [Motöri the Plotter](https://caglrc.cc/motori/), enhanced and adapted for grblHAL.

## EEPROM
Github Repository: https://github.com/grblHAL/Plugin_EEPROM

The EEPROM plugin provides support for Non Volatile Storage (NVS) for configuration data such as $-settings, offsets and tool tables.
I2C EEPROMs, or compatible FRAM, is faster and more wear resistant than flash based storage and is the preferred option for storing configuration data.

> ℹ️ **Info**
> Large EEPROMs (>= 32K bytes) can be partitioned to host a [littlefs](#fs-fatfs-and-fs-littlefs) based file system.

---
