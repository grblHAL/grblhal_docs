---
slug: developers/hardware
---

# Hardware (Controllers)

## Some random notes for now

* Isolated inputs (optcouplers).

* Minimum 1 UART serial, 2 is better. One could be RS-485 compatible for Modbus, potentially with a header to access the raw UART signal.

* 0-10V output for VFDs.

* Use I2C EEPROM or FRAM rather than flash for settings storage, minimum 4K. At least provide a footprint?

* Expose the I2C bus for expansion? GND, 3V3, SDA, SCL and preferably an interrupt capable input. QWIIC?

* A large EEPROM can be used for littlefs if the flash block/page size is too large, handy for storing tool change macros etc. independently of SD card presence. Up to 1Mbit supported.

* Prefer MCU with 512Kb flash or more - grblHAL is growing.

* More RAM is better, important if a networking capable design.

* For SD cards provide card detection input for automatic mount/dismount.

* For RGB strips use pins that allow DMA based updates.

 ...
 