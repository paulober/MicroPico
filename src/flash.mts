import {
  commands,
  env,
  extensions,
  ProgressLocation,
  type QuickPickItem,
  ThemeIcon,
  Uri,
  window,
} from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import {
  downloadFirmware,
  SupportedFirmwareTypes,
} from "./downloadFirmware.mjs";

const execAsync = promisify(exec);

export async function flashPicoInteractively(
  verbose = false
): Promise<boolean> {
  // check if raspberry pi pico extension is installed
  const picoExtension = extensions.getExtension(
    "raspberry-pi.raspberry-pi-pico"
  );

  // TODO: maybe show hint to use
  if (picoExtension === undefined) {
    if (verbose) {
      const result = await window.showErrorMessage(
        "The Raspberry Pi Pico extension is not installed. " +
          "Please install it from the marketplace.",
        "Open Marketplace"
      );

      if (result === "Open Marketplace") {
        void env.openExternal(
          Uri.parse("vscode:extension/raspberry-pi.raspberry-pi-pico")
        );
      }
    }

    return false;
  } // maybe pause auto connect when found

  // check if the extension is active
  if (!picoExtension.isActive) {
    await picoExtension.activate();
  }

  // get the picotool path
  const picotoolPath = await commands.executeCommand<string>(
    "raspberry-pi-pico.getPicotoolPath"
  );

  // TODO: show use feedback
  if (picotoolPath === undefined) {
    if (verbose) {
      void window.showErrorMessage(
        "Failed to get picotool path from the Raspberry Pi Pico extension."
      );
    }

    return false;
  }

  interface PicoDevice {
    bus: string;
    address: string;
    type: string;
    flashSize: string;
  }
  let devices: PicoDevice[] | { is2040: boolean; type: string } | undefined;

  try {
    // execute picotoolPath info -d
    const { stdout } = await execAsync(`${picotoolPath} info -d`);
    if (stdout.length <= 0) {
      if (verbose) {
        void window.showErrorMessage(
          "Failed to get any connected devices. " +
            "Please make sure your board is in BOOTSEL mode."
        );
      }

      return false;
    }

    // means multiple devices found
    if (stdout.includes("Device at bus")) {
      const regex =
        // eslint-disable-next-line max-len
        /Device at bus (\d+), address (\d+):[\s\S]*?type:\s+(\w+)[\s\S]*?flash size:\s+(\d+K)/g;

      let match;
      devices = [];

      while ((match = regex.exec(stdout)) !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, bus, address, type, flashSize] = match;
        devices.push({ bus, address, type, flashSize });
      }
    } else {
      const type = /type:\s+(\w+)/.exec(stdout)?.[1];

      if (type === undefined) {
        if (verbose) {
          void window.showErrorMessage(
            "Failed to get device type. " +
              "Please make sure your board is in BOOTSEL mode."
          );
        }

        return false;
      }

      devices = { is2040: type === "RP2040", type };
    }
  } catch {
    /*this.logger.debug(
      "Failed to check for USB MSDs:",
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error"
    );*/
    // too much logging if auto-connect is using this
    /*console.debug(
      "Failed to check for USB MSDs:",
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error"
    );*/

    if (verbose) {
      void window.showErrorMessage(
        "Failed to check for connected devices. " +
          "Please make sure your board is in BOOTSEL mode."
      );
    }

    // probably not exit code zero
    return false;
  }

  if (devices !== undefined) {
    const result = await window.showInformationMessage(
      "Found a connected Pico in BOOTSEL mode. Before you can use it with " +
        "this extension, you need to flash the MicroPython firmware to it. " +
        "Do you want to flash it now? (Raspberry Pi boards only)",
      "Yes",
      "Flash manually",
      "Search only for MicroPython boards"
    );

    if (result !== "Yes") {
      if (result === "Flash manually") {
        // open micropython download website
        void env.openExternal(Uri.parse("https://micropython.org/download/"));
      }

      //this.noCheckForUSBMSDs = true;
      return true;
    }

    let device:
      | { bus: string; address: string; is2040: boolean; type: string }
      | { is2040: boolean; type: string }
      | undefined;

    // vscode quick pick item with bus and address
    interface DeviceQuickPickItem extends QuickPickItem {
      bus: string;
      address: string;
      isRP2040: boolean;
      type: string;
    }

    if (devices instanceof Array) {
      // ask user which defvice to flash
      const deviceSelection = await window.showQuickPick(
        devices.map(d => ({
          label: `${d.type} (${d.flashSize} flash)`,
          detail: `Bus: ${d.bus}, Address: ${d.address}`,
          iconPath: new ThemeIcon("device"),
          bus: d.bus,
          address: d.address,
          isRP2040: d.type === "RP2040",
          type: d.type,
        })) as DeviceQuickPickItem[],
        {
          canPickMany: false,
          placeHolder: "Select the device you want to flash",
          ignoreFocusOut: false,
        }
      );

      if (deviceSelection === undefined) {
        return false;
      }

      device = {
        bus: deviceSelection.bus,
        address: deviceSelection.address,
        is2040: deviceSelection.isRP2040,
        type: deviceSelection.type,
      };
    } else {
      device = devices;
    }

    let wirelessFirmware = false;

    // if the type is RP2040 ask if the user wants to flash Wireless firmware or not
    // else just flash the non wireless firmware for the other boards
    if (device?.is2040) {
      const flashWireless = await window.showInformationMessage(
        "Do you want to flash the Wireless firmware?",
        "Yes",
        "No"
      );

      if (flashWireless === "Yes") {
        wirelessFirmware = true;
      }
    }

    let firmwareType: SupportedFirmwareTypes | undefined;

    switch (device.type) {
      case "RP2040":
        firmwareType = wirelessFirmware
          ? SupportedFirmwareTypes.picow
          : SupportedFirmwareTypes.pico;
        break;

      case "RP2350":
        firmwareType = SupportedFirmwareTypes.pico2;
        break;
    }

    if (firmwareType === undefined) {
      // TODO: disable auto connect check for MSDs and show button for download link
      void window.showErrorMessage(
        "Unsupported board type. Please flash the firmware manually."
      );

      return false;
    }

    let firmwarePath: string | undefined;

    // download firmware
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Downloading firmware...",
        cancellable: false,
      },
      async progress => {
        // TODO: implement
        // cancellation is not possible

        firmwarePath = await downloadFirmware(firmwareType);
        progress.report({ increment: 100 });
      }
    );

    void window.showInformationMessage("Firmware downloaded. Now flashing...");

    // flash with picotool load -x --ignore-partitions --bus <bus> --address <address> <firmware>
    window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Flashing firmware...",
        cancellable: false,
      },
      async progress => {
        const command = `${picotoolPath} load -x --ignore-partitions ${
          (device && "bus" in device && "address" in device
            ? `--bus ${device.bus} --address ${device.address} `
            : "") + firmwarePath
        }`;

        try {
          await execAsync(command);
          progress.report({ increment: 100 });
          void window.showInformationMessage(
            "Firmware flashed successfully. Trying to connect..."
          );
        } catch (error) {
          progress.report({ increment: 100 });
          void window.showErrorMessage(
            "Failed to flash firmware: " +
              (error instanceof Error
                ? error.message
                : typeof error === "string"
                ? error
                : "Unknown error")
          );
          /*this.logger.error(
            error instanceof Error
              ? error.message
              : typeof error === "string"
              ? error
              : "Unknown error"
          );*/

          console.error(
            error instanceof Error
              ? error.message
              : typeof error === "string"
              ? error
              : "Unknown error"
          );
        }
      }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false;
}
