'use babel';

export default class Config {
  static constants() {
    return {
      logging_level: 3, // 3 = warning, 4 = error. anything higher than 5 = off. see logger.js for all levels
      max_sync_size: 350000,
      safeboot_version: 1150002, // 1.15.0.b2
      upload_batch_size: 512,
      fast_upload_batch_multiplier: 4, // multiplier for upload_batch_size when fast_upload is active
      compressed_files_folder: 'py_compressed', // dynamically generated and removed again after upload
      hash_check_max_size: 200, // in kb
      error_messages: {
        'EHOSTDOWN': 'Host down',
        'EHOSTUNREACH': 'Host unreachable',
        'ECONNREFUSED': 'Connection refused',
        'ECONNRESET': ' Connection was reset',
        'EPIPE': 'Broken pipe',
        'MemoryError': 'Not enough memory available on the board.'
      },
      start_text: 'Welcome to the Pico-Go plugin! Use the buttons on the left bottom to access all features and commands.\r\n' +
        'This is how you get started:\r\n' +
        " 1: Open 'Global Settings' (we went ahead and did that for you)\r\n" +
        ' 2: Connect a Raspberry Pi Pico board to your USB port and the terminal will auto-connect to it\r\n' +
        ' 3: Open a micropython project\r\n' +
        ' 4: Start running files and uploading your code \r\n' +
        '\r\n' +
        " Use the 'Help' command for more info about all the options \r\n"
    };
  }

  static settings() {
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
        default: '',
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
        default: 'py,txt,log,json,xml,html,js,css,mpy',
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
        default: false,
        title: 'Open on start',
        description: 'Automatically open the pymakr console and connect to the board after starting VS Code',
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
        description: 'Reboots your board after any upload or download action',
        order: 11
      },
      py_ignore: {
        title: 'Pyignore list',
        description: 'Comma separated list of files and folders to ignore when uploading (no wildcard or regular expressions supported)',
        type: 'array',
        items: {
          type: 'string'
        },
        default: ['pico-go.json', '.vscode', '.gitignore', '.git',
          'project.pico-go', 'env', 'venv'
        ],
        order: 7
      },
      autoconnect_comport_manufacturers: {
        title: 'Autoconnect comport manufacturers',
        description: 'Comma separated list of all the comport manufacturers supported for the autoconnect feature. Defaults to all possible manufacturers that pycom boards can return.',
        type: 'array',
        items: {
          type: 'string'
        },
        default: ['MicroPython', 'Microsoft'],
        order: 13
      },
    };
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