---
slug: developers/firmware
---

# Firmware

## Core documentation

Core documentation generated from the source is available [here](https://svn.io-engineering.com/grblHAL/html/hal_8h.html). It is work in progress and not yet complete.

## Plugins

### Repository for hosting plugins

For those who do not want to host their plugin\(s\) on github [this repository](https://github.com/grblHAL-Plugins), maintained by @nickshl, can be used.

### Example and template plugins

A number of example and template plugins can be found [here](https://github.com/grblHAL/Templates/tree/master/my_plugin). Some are usable 'as-is', some not.
> [!NOTE]
> The ESP32 and RP2040 drivers require the `AddMyPlugin` option to be set to `ON` in _CMakeLists.txt_ to enable compilation of _my_plugin.c_.

### I have written a plugin and I want to make it available to grblHAL users

Pull requests for third party plugin code will generally not be accepted.
You will have to add it to your own github repository and create pull request\(s\) against the core for the init function and any added setting numbers.
If the plugin is properly written and generally usable it can be added to the [Web Builder](https://webbuilder.grblhal.org/) _3rd party plugins_ tab.

#### Plugin name  

A plugin has to be given an "official" name so that it can be enabled and added to the startup sequence.  
A #define symbol `<NAME>_ENABLE` and a corresponding function `void <name>_init(void)` is required, `<NAME>` and `<name>` is the upper and lower case name of your plugin.  
To add a call to the init function at startup it has to be added to [plugins_init.h](https://github.com/grblHAL/core/blob/master/plugins_init.h) in the _Third party plugin_ section.
Create a pull request for [plugins_init.h](https://github.com/grblHAL/core/blob/master/plugins_init.h) to get it added.  
An example:
```
#if PROBE_RELAY_ENABLE
    extern void probe_relay_init (void);
    probe_relay_init();
#endif
```

To install the plugin the user has to download the code from your repo and copy it to the folder where _driver.c_ is located and add `#define symbol <NAME>_ENABLE 1` somewhere in the drivers _my_machine.h_ file.

> [!NOTE]
> There is no owner of third party plugin names, existing names can be used for alternative implementations as long as they provide similar functionality.  
> Implementations should add information about itself in the `$I` report, see one of the [templates](https://github.com/grblHAL/Templates/tree/master/my_plugin) for how this is done.

> [!TIP]
> The symbol definition may be added to the compiler command line instead, some IDEs allows this from the UI.  

#### Addional M-codes

If your plugin provides additional M-codes these should be documented in the repo readme and the plugin code.
A pull request for getting them added to [gcode.h](https://github.com/grblHAL/core/blob/4a140576a2acf12172ef3532b16b433a07984f71/gcode.h#L199-L226) might be accepted, more likely so if similar in function to those defined by [Marlin](https://marlinfw.org/docs/gcode/M010-M011.html).  
It is also kind of ok to just cast the enum value [in the code](https://github.com/grblHAL/Templates/blob/master/my_plugin/probe%20select/my_plugin.c), however there is a slight risk that it could clash with other plugins - but not too high if similar to those in the Marlin list.

#### Additional `$`-settings

Setting numbers for your plugin has to be added to [settings.h](https://github.com/grblHAL/core/blob/4a140576a2acf12172ef3532b16b433a07984f71/settings.h#L165) to avoid clashes.
If any is needed [start a discussion](https://github.com/grblHAL/core/discussions) first as I do not yet have a clear idea about how this should be handled, I guess it should be possible to use non-core settings in some cases.

#### Embedded files

* The embedded file system allows plugins to add flash based read-only files in the `\embedded` directory.
A [simple example](https://github.com/grblHAL/Templates/tree/master/my_plugin/Embedded_files) can be found in the template repo.
