'use babel';

export default class Config {
  static constants(){
    return {
      logging_level: 3, // 3 = warning, 4 = error. anything higher than 5 = off. see logger.js for all levels
      max_sync_size: 350000,
      safeboot_version: 1150002, // 1.15.0.b2
      upload_batch_size: 512,
      fast_upload_batch_multiplier: 4, // multiplier for upload_batch_size when fast_upload is active
      compressed_files_folder: "py_compressed", // dynamically generated and removed again after upload
      hash_check_max_size: 200, // in kb
      error_messages: {
        "EHOSTDOWN": "Host down",
        "EHOSTUNREACH": "Host unreachable",
        "ECONNREFUSED": "Connection refused",
        "ECONNRESET":" Connection was reset",
        "EPIPE": "Broken pipe",
        "MemoryError": "Not enough memory available on the board."
      },
      help_text:  "Pico-Go VSC Plugin Help. Commands to use (cmd/ctrl + p):\r\n"
            +  "- Connect              : Connects to the board\r\n"
            +  "- Disconnect           : Disconnects from the board\r\n"
            +  "- Global settings      : Opens the installation-wide settings file\r\n"
            +  "- Project settings     : Opens project specific settings that overwrite global settings\r\n"
            +  "- Run current file     : Runs currently open file to the board\r\n"
            +  "- Run current line or \r\n"
            +  "       selection        : Runs the current line or currently selected code on the board\r\n"
            +  "- Upload Project       : Uploads the complete project to the board, using the sync folder settings\r\n"
            +  "- Upload current\r\n"
            +  "       file only       : Uploads the current file to the board, using the sync folder settings\r\n"
            +  "- Download project     : Downloads all files and folders from the board, using the sync folder settings\r\n"
            +  "- Delete all files\r\n"
            +  "       from board      : Deletes all files and folders from your board\r\n"
            +  "- List serial ports    : Lists all available serial ports and copies the first one to the clipboard\r\n"
            +  "- Get firmware version : Displays firmware version of the connected board\r\n"
            +  "\r\n"
            +  "Settings (name : default : description):\r\n"
            +  "- sync_folder             : <empty>             : Folder to synchronize. Empty to sync projects main folder\r\n"
            +  "- sync_file_types         : py,txt,log,json,xml : Type of files to be synchronized\r\n"
            +  "- ctrl_c_on_connect       : false               : If true, executes a ctrl-c on connect to stop running programs\r\n"
            +  "- open_on_start           : true                : Weather to open the terminal and connect to the board when starting vsc\r\n"
            +  "- safe_boot_before_upload : true                : Safe-boots the board before uploading code, to prevent running out of RAM while uploading.\r\n"
            +  "- reboot_after_upload     : true                : Reboots the board after each upload.\r\n"
            +  "- auto_connect            : true                : *Global settings only* If enabled, connects to USB automatically. Disable to use the 'address' field for connecting over WiFi\r\n"
            +  "Any of these can be used inside the Project config to override the global config\r\n"
            +  "\r\n"
            +  "For more information, check github.com/pycom/pymakr-atom or docs.pycom.io\r\n"
      ,

      start_text: "Welcome to the Pico-Go plugin! Use the buttons on the left bottom to access all features and commands.\r\n"
              +  "This is how you get started:\r\n"
              +  " 1: Open 'Global Settings' (we went ahead and did that for you)\r\n"
              +  " 2: Connect a Raspberry Pi Pico board to your USB port and the terminal will auto-connect to it\r\n"
              +  " 3: Open a micropython project\r\n"
              +  " 4: Start running files and uploading your code \r\n"
              +  "\r\n"
              +  " Use the 'Help' command for more info about all the options \r\n"
    }
  }

  static settings(){
    return {
        auto_connect: {
            type: 'boolean',
            default: true,
            title: 'Autoconnect on USB',
            description: 'Ignores any \'device address\' setting and automatically connects to the top item in the serialport list',
            order: 2
        },
        sync_folder: {
            type: 'string',
            default: "",
            title: 'Sync Folder',
            description: 'This folder will be uploaded to the pyboard when using the sync button. Leave empty to sync the complete project. (only allows folders within the project). Use a path relative to the project you opened in atom, without leading or trailing slash',
            order: 5
        },
        sync_all_file_types: {
            type: 'boolean',
            default: false,
            title: 'Upload all file types',
            description: 'If enabled, all files will be uploaded no matter the file type. The list of file types below will be ignored',
            order: 6
        },
        sync_file_types: {
            type: 'string',
            default: "py,txt,log,json,xml,html,js,css,mpy",
            title: 'Upload file types',
            description: 'All types of files that will be uploaded to the board, seperated by comma. All other filetypes will be ignored during an upload (or download) action',
            order: 7
        },
        ctrl_c_on_connect: {
            type: 'boolean',
            default: false,
            title: 'Ctrl-c on connect',
            description: 'Stops all running programs when connecting to the board',
            order: 8
        },
        open_on_start: {
            type: 'boolean',
            default: true,
            title: 'Open on start',
            description: 'Automatically open the pymakr console and connect to the board after starting Atom',
            order: 9
        },
        safe_boot_on_upload: {
            type: 'boolean',
            default: false,
            title: 'Safe-boot before upload',
            description: '[Only works with firmware v1.16.0.b1 and up.] Safe boots the board before uploading to prevent running out of memory while uploading. Especially useful on older boards with less memory, but adds about 2 seconds to the upload procedure',
            order: 10
        },
        reboot_after_upload: {
            type: 'boolean',
            default: true,
            title: 'Reboot after upload',
            description: 'Reboots your pycom board after any upload or download action',
            order: 11
        },
        py_ignore: {
            title: 'Pyignore list',
            description: 'Comma separated list of files and folders to ignore when uploading (no wildcard or regular expressions supported)',
            type: 'array',
            items: {
              type: 'string'
            },
            default: ["pymakr.conf",".vscode",".gitignore",".git","project.pymakr","env","venv"],
            order: 7
        },
        autoconnect_comport_manufacturers: {
            title: 'Autoconnect comport manufacturers',
            description: 'Comma separated list of all the comport manufacturers supported for the autoconnect feature. Defaults to all possible manufacturers that pycom boards can return.',
            type: 'array',
            items: {
              type: 'string'
            },
            default: ['MicroPython'],
            order: 13
        },
    }
  }
}

// other error codes that possibly need intergration
// EINTR Interrupted system
// EIO I/O error
// EFAULT Bad address
// EBUSY Mount device busy
// ENODEV No such device
// ENOTTY Not a typewriter
// EPIPE Broken pipe
// EALREADY Operation already in progress
// ETIMEDOUT Connection timed out
// ECONNREFUSED Connection refused
// ECONNRESET Connection reset by peer
// EISCONN Socket is already connected
// ECOMM Communication error
// EIBMCONFLICT Conflicting call already outstanding on socket
