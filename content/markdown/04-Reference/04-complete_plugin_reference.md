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

## Spindle
Github Repository: https://github.com/grblHAL/Plugins_spindle

| M-Code | Syntax | Description |
|:------:|:------:|:------------|
| `M3` | `M3 S[rpm]` | Spindle on clockwise |
| `M4` | `M4 S[rpm]` | Spindle on counterclockwise |
| `M5` | `M5` | Spindle off |
| `M104` | `M104 P[n]` | Select spindle |
| `M51` | `M51 [options]` | Enable spindle features |

#### Example
```gcode
; Turn on spindle clockwise at 1200 RPM
M3 S1200

; Select spindle 1
M104 P1

; Turn off spindle
M5
```

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

#### `$70` – Enable Services (mask)
The master switch for enabling or disabling network-related services (daemons).

> ℹ️ **Info**
> - This is a **critical** setting for any network-enabled board. Even if you configure all the IP address and WiFi settings (`$300+`), the services **will not run** unless they are enabled here.
> - This is a **bitmask**: add together the values of the services you want to enable.


| Bit | Value | Service to Enable | Description |
|:---:|:-----:|:------------------|:------------|
| 0   | 1     | Telnet | A raw data stream used by some G-code senders. |
| 1   | 2     | FTP | Allows network file transfer to/from the SD card. |
| 2   | 4     | HTTP | The standard web server (often used with WebSockets). |
| 3   | 8     | WebSocket | A modern, efficient protocol for web-based GUIs. |
| 4   | 16    | mDNS (Bonjour) | Broadcasts the controller's name on the network (e.g., `grblHAL.local`). |
| 5   | 32    | WebDAV | An alternative to FTP for network file access. |

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


### Ethernet <!-- toc -->

The ethernet plugin is driver specific since it sits between the LwIP stack and the networking plugin...

#### Settings {#ethernet-settings}


#### `$300` – Hostname
Sets the machine's name on the network.

| Value | Meaning |
|:------|:--------|
| String| A string of up to 32 characters, default is "grblHAL". |

> ℹ️ **Info**
> - This is the name your controller will announce on the network.
> - It can be used to connect via mDNS (e.g., `grblHAL.local`) if `$70` has mDNS enabled.
> - It also helps identify the device in your router's client list.

**Common Examples**
* _Default Hostname:_
  * `$300=grblHAL`
* _Custom Hostname for a specific machine:_
  * `$300=MyCNC`or `$300=Laser` (mDNS respectively mycnc.local or laser.local)

> [!TIP]
> - For maximum compatibility, use a simple name without spaces or special characters.
> - A reboot of the controller is often required for a new hostname to be broadcast on the network.

---

#### `$301` – Ethernet IP Mode
Selects the method the controller uses to obtain an IP address for the connection.

| Value | Meaning | Description |
|:-----:|:--------|:------------|
| 0     | Static | You must manually set the IP (`$302`), Gateway (`$303`), and Netmask (`$304`). |
| 1     | DHCP   | The controller asks your router for an IP address. (Recommended) |
| 2     | AutoIP | A fallback where the controller picks a random address if DHCP fails. |

> ℹ️ **Info**
> - **Static** is useful if the controlling computer has a dedicated ethernet port for the controller. A dedicated network interface for the controller is preferred - no collisions or competition for bandwidth, or for networks where DHCP is not available.
> - **DHCP** is the standard for most networks, where your router automatically assigns an address.

**Common Examples**
* _Home/Office Network with a Router:_
  * This is the easiest option.  
    `$301=1`
* _Direct Connection to a PC (no router):_
    * You must assign a permanent, non-conflicting address.  
    `$301=0`

> [!IMPORTANT]
> If you select Static mode, you are responsible for providing correct and non-conflicting network information.
> Reserve the address in the router if possible.

---

#### `$302` – Ethernet IP Address
Manually sets the static IP address for the controller.

| Value | Description |
|:------|:------------|
| String| The IP address in dot-decimal notation, default is normally "192.168.1.5" |

> ℹ️ **Info**
> - This setting is **only** used if `$301=0` (Static IP Mode).
> - The IP address must be unique on your network.

**Common Examples**
* _Typical Static IP on a Home Network:_
  * Make sure this address is outside your router's DHCP assignment range or is reserved for static assignment.  
  `$302=192.168.1.200`

> [!IMPORTANT]
> - If you set an IP that is already in use by another device, you will have an "IP conflict" and neither device may work correctly.
> - The IP address must be in the same subnet as the Gateway and your computer (as defined by the Netmask).

---

#### `$303` – Ethernet Gateway
Manually sets the Gateway (router) IP address.

| Value | Description |
|:------|:------------|
| String| Your router's IP address, e.g., "192.168.1.1". |

> ℹ️ **Info**
> - This setting is **only** used if `$301=0` (Static IP Mode).
> - The Gateway is the address of the device that connects your local network to the internet (usually your router).
> - It is required for features like NTP time synchronization to work.

**Common Examples**
* _Typical Home Router Address:_
  * `$303=192.168.1.1`

> [!TIP]
> If you can't connect to your controller from another network segment or if NTP fails, an incorrect Gateway address is a likely cause.

---

#### `$304` – Ethernet Netmask
Manually sets the Subnet Mask for the controller.

| Value | Description |
|:------|:------------|
| String| The Subnet Mask, default is "255.255.255.0". |

> ℹ️ **Info**
> - This setting is **only** used if `$301=0` (Static IP Mode).
> - The Netmask defines the size of your local network.

**Common Examples**
* _Standard Home/Office Network:_
  * This value is correct for the vast majority of local networks.  
  `$304=255.255.255.0`

> [!IMPORTANT]
> An incorrect Netmask can prevent the controller from communicating with other devices, even on the local network. When in doubt, use DHCP (`$301=1`).

---

#### `$305` – Telnet Port
Configures the network port for the Telnet service.

| Value | Description |
|:------|:------------|
| Port #| A valid TCP port number, default is 23. |

> ℹ️ **Info**
> - The Telnet service provides a raw, text-based data stream to and from the grblHAL controller.
> - It is used by some G-code senders for faster and more EMI resistant communication than the serial port provides.

> [!TIP]
> - Usually there is no need to change this port unless you have a specific reason
> - You will need this port number to configure your G-code sender if it uses Telnet.

---

#### `$306` – HTTP Port
Configures the network port for the HTTP service.

| Value | Description |
|:------|:------------|
| Port #| A valid TCP port number, default is 80. |

> ℹ️ **Info**
> - The HTTP service provides a web server running on the controller, for loading a WebUI, uploading files etc.
> - Modern web interfaces for grblHAL typically also use the WebSocket service (`$307`) for communication.

> [!TIP]
> This port is often used for to load a WebUI. For example, you might connect by typing `http://<ip>` into a browser.

---

#### `$307` – WebSocket Port
Configures the network port for the WebSocket service.

| Value | Description |
|:------|:------------|
| Port #| A valid TCP port number, default is 80 if the web server is not running, else 81. |

> ℹ️ **Info**
> - The WebSocket service provides a fast, modern, and efficient way for web-based user interfaces to communicate with the controller.
> - This, (along with Telnet `$305`) are the key services for most modern network-based G-code senders.

> [!TIP]
> This port is often used for a WebUI as well.

---

#### `$308` – FTP Port
Configures the network port for the FTP (File Transfer Protocol) service.

| Value | Description |
|:------|:------------|
| Port #| A valid TCP port number, default is 21. |

> ℹ️ **Info**
> - The FTP service allows you to transfer G-code files to and from the controller's SD card over the network.
> - This is extremely convenient for sending job files to the machine without needing to physically move the SD card.


> [!TIP]
> Use a standard FTP client application (like FileZilla or WinSCP) to connect to the controller's IP address on this port.

---

### WiFi <!-- toc -->

#### Settings {#wifi-settings}
TBC

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

### ESP-AT <!-- toc -->

Adds Telnet support via [ESP-AT](https://docs.espressif.com/projects/esp-at/en/latest/esp32/Get_Started/index.html) running on a supported ESP MCU.
Allows senders to connect to the controller via WiFi.

#### Settings:
Adds many networking and WiFi settings for configuring mode \(Station, Access Point\), Telnet port, IP adress etc.

- link to WifI settings here.

---

### Toolsetter / Secondary Probe <!-- toc -->
Github Repository: https://github.com/grblHAL/Plugins_misc

Adds support for a dedicated toolsetter input and a secondary probe input, allowing for advanced probing scenarios.

#### $-Settings

| Setting | Description |
|---------|-------------|
| `$678` | **Toolsetter Input:** Auxiliary input pin number. |
| `$679` | **Secondary Probe Input:** Auxiliary input pin number. |

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

#### Example
```gcode
; Laser on at 50% power
M3 S128

; Laser off
M5
```

---

## Encoder
Github Repository: https://github.com/grblHAL/Plugin_encoder

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

#### $350 - Mode of operation

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
