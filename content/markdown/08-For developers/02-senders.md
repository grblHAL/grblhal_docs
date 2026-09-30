---
slug: developers/senders
---

# Senders

## General information ** DRAFT **

grblHAL has many extensions and runs on processors/boards that differs significantly from the 8-bit Arduino variants Grbl was originally written for.
One major difference is that many cannot be hard reset on connect and that it is not always possible for the controller to send the welcome message on sender connection.

This poses some challenges for sender writers that wants to fully support grblHAL.

#### Connecting

When connection to an Arduino based board typically the processor is hard reset leading to a clean startup of the controller.
Usually this means that the controller is in a well defined state and that it is ready for communication.
This is no longer true for grblHAL based controllers as some may allow connection over native USB<sup>1</sup> or a network connection.
A hard reset is usually not possible when a connection via native USB or a network is established as this will result in the connection beeing dropped.
Some has a USB <> UART chip for communication that is not wired for a hard reset via DTR or RTS handshake signals.
And some grblHAL drivers can also be configured for a MPG/DRO to take control thus blocking all incoming traffic from a sender.

This means that relying on the grbl welcome message beeing output automatically on connect is no longer possible and the startup sequence for a sender has to take this into account. A startup sequence may thus look like this:

On connect wait for a short while \(400 - 500ms\) while listening for any incoming traffic.  
If a real-time report is received during this wait a secondary sender \(MPG\) is active. The sender should then enter wait-mode and listen to real-time reports and check for the secondary sender releasing control. This is signalled by the presence of the element `|MPG:0` in the report.  
If the grbl welcome message is received the sender can assume the controller is hard reset can proceed. NOTE: Can it?

An extended status request should then be requested by sending `0x87` and waited for, 250 ms should be more than enough. If received then a controller with an extended version of the grbl protocol \(such as grblHAL\) is at the other end and the sender can then determine whether the controller is a state where further communication is possible<sup>2</sup>. 

#### Extended protocol

Some alarm states, hold, door and tool change state blocks regular commands, if detected the controller may attempt to send a soft reset command `0x18` \(ctrl-X\) to bring it to a state where communication is possible.

If alarm state is reported then the alarm code is added as a substate to `Alarm`, e.g. `Alarm:1`. If alarm code 1, 2 and 10 \(new - estop\) is detected then the controller is in locked state \(due to a critical event\) and not able to respond to anything but real time report requests. A soft reset should be then attempted\(?\).

Other alarm substates and states allows at least `$`-commands and the sender can proceed to configure itself, typically by requesting an [extended $I report](https://github.com/grblHAL/core/wiki/Report-extensions#controller-information-extensions) with `$I+` to determine what the controller is capable of.

#### Legacy protocol

Take whatever action you used to..

For discussion:
* If a request for the full real-time status has been requested can the controller assume the sender is capable of handling \(some?)\ extensions such as a complete settings report and extended $I report?
* Do we need a top-bit set character for requesting the $I+ report so that it can be output even when in locked mode?
* Alarm code assignments.
* What to do if in hold, door or tool state? Query the user for action to take? Attempt a soft reset?
* What about ESP32 that may send a ton of boot messages on connect if hard-reset? It also has the silly "meditating guru" outputting messages seeminly at random later on. I have to admit that I am on not the friendliest terms with this character...
* 8-bit grbl controllers does not respond to anything when in locked state. This is not a problem since these are always(?) hard reset on connect? Many 32-bit ports suffers from the same "bug" but AFAIKT these do not implement many extended features.  

#### Protocol extensions

[grblHAL extensions](https://github.com/grblHAL/core/wiki/Report-extensions) to the protocol follows the same structure as [the original](https://github.com/gnea/grbl/wiki/Grbl-v1.1-Interface) and if parsing is done in the right way current and future extensions should not cause a sender to crash.

* do not assume tag values/elements are in any particular order.

* ignore unknown tag values.

* ignore unknown tags.

* expect comma separated value lists to get additional values.

* expect lists with single character definitions such as pin states to expand.

For improved error/alarm/settings code handling:

* use the new enumerations for code to text mappings for error codes, alarms and settings. Use the [csv files](https://github.com/gnea/grbl/tree/master/doc/csv) as fallback if not available. Do _not_ hardcode a settings user interface.

### Real time report

The [real time report](https://github.com/grblHAL/core/wiki/Report-extensions#realtime-report) too has been expanded with several new elements.

### Single character real-time commands.

* `0x19` \(stop\) is similar to the legacy `0x18` \(reset\) but does not perform a warm reset of the controller leaving more internal states intact.

grblHAL does not support printable single character real-time commands when reading input for $-commands or messages.
This is to allow these characters in string settings such as passwords, and to stop grbl acting strangely if they appear inside messages.
However, this solution is not perfect as it depends on the stream input buffer only holding a single block \(or line\) of input at any time. 
To overcome this additional top-bit set character versions has been made available:

* `0x80` can be used instead of `?` for requesting a real-time report. Currently `0x05` \(`CTRL+E` - ASCII ENC\) can also be used.
* `0x81` can be used instead of `~` for requesting cycle start.
* `0x82` can be used instead of `!` for requesting feed hold.

Additional command characters:

* `0x83` can be used to request a [parser state report](Report-extensions#parser-state-report-extensions), this can be used as a shortcut for `$G`.
* `0x87` can be used to request a complete real-time report including all elements sent on changes only. If alarm state is active the alarm code is added as a substate to the `Alarm` state.
* `0x88` can be used to toggle the virtual optional stop switch, available when a physical switch is not available.
* `0x89` can be used to toggle the virtual single stepping switch, available when a physical switch is not available.
* `0x8A` can be used to toggle the fan0 on/off, available when the [fans plugin](https://github.com/grblHAL/Plugin_fans) is installed and fan0 is configured. 
* `0x8B` can be used to toggle MPG mode on/off, available when the [keypad plugin](https://github.com/grblHAL/Plugin_keypad) is installed in UART mode.
* `0x8C` can be used to toggle auto real time report mode on/off, available when the auto real time report is enabled.
* `0xA2` can be used to request a PID report when spindle sync is available \(currently debug mode only\).
* `0xA3` is used to acknowledge a [tool change request](https://github.com/grblHAL/core/wiki/Manual-tool-change-protocol).
* `0xA4` can be used to toggle the virtual optional probe connected switch, available when a physical switch is not available. NOTE: not yet functional!

Support for these characters is indicated by the presence of `RT+` or `RT-` in the `NEWOPT` tag in the `$I` [response](https://github.com/grblHAL/core/wiki/Report-extensions#controller-information-extensions).

Some drivers support a two character sequence that will hard reset the controller, this is `0x1B` followed by `0x14` \(\<ESC\>\<CTRL T\> on the keyboard\).  
> ℹ️ **Info**
> controllers connected to via native USB<sup>1</sup> or network \(telnet or websocket\) will drop the connection on a hard reset. 

### Line terminator handling \(EOL\)

grblHAL will interpret CRLF \(`\r\n`\) and LFCR \(`\n\r`\) pairs as a single line terminator unlike legacy Grbl that will interpret them as two.

To avoid issues, and reduce transmission overhead, it is best to use a single character as a line terminator -
and to keep its use consistent throughout the application.

### Parser state

The [parser state response](https://github.com/grblHAL/core/wiki/Report-extensions#parser-state-report-extensions) to the `$G` command has been expanded with the new G- and M-codes grblHAL supports as well as some missing from the original.

### Push messages

grblHAL can be configured to publish the parser state \(the `$G` response\) on changes, this will be output following a status report request.
A sender should be able to handle this or document that it is no able to do so.

### Code sets and enumerations

[Code sets](Report-extensions#code-sets-and-enumerations) with mapping to text can be fetched from the controller, superseding the use of files that has to be somehow kept in sync. Unique numeric codes are still used as these are easy to parse and can be used for looking up translated terms. If no translation is available the english variant from the enumerations should be used.  

---

<sup>1</sup> Native USB is when the microcontroller itself handles the USB protocol, this is different from boards that provides USB connectivity via a dedicated USB \<\> UART converter chip.

<sup>2</sup> some grblHAL extensions related to safety:

An e-stop signal is supported by the core and some drivers has this implemented. If asserted then a soft reset will not work before the signal is deasserted as the controller will immediately re-enter locked mode with alarm code 10.

The reset signal is also handled differently, if asserted at controller startup \(a cold start\) alarm state is entered and `'$H'|'$X' to unlock` is output. There is no alarm code associated with this and thus no alarm substate is reported. G-code execution is blocked until unlocked. 

Similarly if "hard limits" is enabled together with "check hard limits at init" and any limit switch is asserted `'$H'|'$X' to unlock` will be output on a reset until all limit switches are deasserted or the machine is homed.

Finally if "homing on startup" is enabled alarm state with alarm code 11 is entered and `Homing cycle required` is output. Unlike grbl it is not always possible to use a soft reset to exit this state before homing has been sucessfully completed as configured. This behaviour is dependent on settings.

## Tool change protocol

grblHAL has been extended with a new state `Tool` that simplifies manual tool changes for machines without an automatic tool changer \(ATC\).
It allows for a number of [modes of operation](Manual,-semi-automatic-and-automatic-tool-change), from fully manual to semi-automatic.

When a `M6` command is executed by grblHAL it will change its state to `Tool`, suspend processing of subsequent commands in the input buffer and report this state in the next real time report.
It will then wait for a tool change acknowledge from the sender \(real time command `0xA3`\).
When the sender sends the acknowledge it has to suspend sending new commands from any running gcode program, enable jogging and allow setting the linear axis offset or sending $-commands after touch off.

When the tool change acknowledge is received by grblHAL it will make a copy of the current input stream buffer, flush it and accept new commands.
Motion commands except jogging is not allowed and will return error 40 as long as the tool change is pending.
When the tool change is completed a cycle start command is issued by the sender \(or via the cycle start control signal\) upon which the saved buffer will be reinstated and normal processing restored.

## MPG/Pendants

TBC

