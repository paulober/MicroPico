export type Constants = {
  uploadBatchSize: any;
  fastUploadBatchMultiplier: any;
  loggingLevel: number;
  maxSyncSize: number;
  safebootVersion: number;
  compressedFilesFolder: string;
  hashCheckMaxSize: number;
  /// eHostdown: string;
  /// ehostunreach: string;
  /// eConnRefused: string;
  /// eConnReset: string;
  /// ePipe: string;
  /// memoryError: string;
  errorMessages: { [key: string]: string };
  startText: string;
};

export default class Config {
  public static constants(): Constants {
    return {
      loggingLevel: 3, // 3 = warning, 4 = error. anything higher than 5 = off. see logger.js for all levels
      maxSyncSize: 350000,
      safebootVersion: 1150002, // 1.15.0.b2
      uploadBatchSize: 512,
      fastUploadBatchMultiplier: 4, // multiplier for uploadBatchSize when fastUpload is active
      compressedFilesFolder: "py_compressed", // dynamically generated and removed again after upload
      hashCheckMaxSize: 200, // in kb
      errorMessages: {
        eHostdown: "Host down",
        ehostunreach: "Host unreachable",
        eConnRefused: "Connection refused",
        eConnReset: " Connection was reset",
        ePipe: "Broken pipe",
        memoryError: "Not enough memory available on the board.",
      },
      startText:
        "Welcome to the Pico-W-Go plugin! Use the buttons on the left bottom to access all features and commands.\r\n" +
        "This is how you get started:\r\n" +
        " 1: Open 'Global Settings' (we went ahead and did that for you)\r\n" +
        " 2: Connect a Raspberry Pi Pico W board to your USB port and the terminal will auto-connect to it\r\n" +
        " 3: Open a micropython project\r\n" +
        " 4: Start running files and uploading your code \r\n" +
        "\r\n" +
        " Use the 'Help' command for more info about all the options \r\n",
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
