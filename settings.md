## Settings
These settings can be specified in both the Global config file as well as the Project config file.

| Setting          | Project | Global | Default               | Purpose |
|------------------|---------|--------|-----------------------| -----------------------------------------------------------|
| `open_on_start`  | yes     | yes    | `true`                | Whether to open the terminal and connect to the board when starting Code |
| `ctrl_c_on_connect` | yes     | yes    | `false`               | If true, executes a ctrl-c on connect to stop running programs |
| `auto_connect`   | no       | yes    | `true` | Autoconnect on USB. |
| `manual_com_device`   | no       | yes    | `""` | Used when `auto_connect` is false. E.g. `COM3` or `/dev/tty.usbmodem0000000000001`. |
| `autoconnect_comport_manufacturers` | no | yes | `"MicroPython", "Microsoft"` | USB COM port manufacturers for Pico boards. |
| `sync_folder`    | yes     | yes    | `""`                  | Folder to synchronize. Empty to sync project's main folder. |
| `sync_file_types` | yes     | yes    | `"py,txt,log,json,xml,html,js, css,mpy"` | Types of files to be synchronized |
| `sync_all_file_types` | yes  | yes    | `false` | If enabled, all files will be uploaded no matter the file type (`sync_file_types` will be ignored). |
| `py_ignore`      | yes     | yes    | `[]`                  | Comma separated list of files and folders to ignore when uploading (no wildcard or regular expressions supported). |
| `safe_boot_on_upload` | yes | yes | `false` | Safe-boot before upload. |
| `reboot_after_upload` | yes | yes | `true` | Reboots your board after any upload or download action. |
| `statusbar_buttons` | yes     | yes     |`['status', 'run', 'upload', 'download', 'disconnect', 'listserial', 'settings', 'projectsettings', 'getversion']` | Which quick-access buttons to show in the status bar. |
