import * as vscode from "vscode";
import { PicoSerialEvents } from "@paulober/pico-mpy-com";
import type { VidPidPair } from "@paulober/pico-mpy-com";
import { SettingsKey } from "../settings.mjs";
import Logger from "../logger.mjs";
import { commandPrefix } from "../api.mjs";
import type { SessionContext } from "../commands/sessionContext.mjs";

/**
 * Injected side-effect boundaries so the manager is unit-testable with fakes.
 * The real activator wires these to the static {@link PicoMpyCom} port helpers,
 * the interactive USB-MSD flasher and its terminal-focus routine; tests pass
 * deterministic doubles.
 */
export interface ConnectionDeps {
  /** VID/PID-filtered ports (=`PicoMpyCom.getSerialPorts`). */
  listSupportedPorts(vidPidPairs?: VidPidPair[]): Promise<string[]>;
  /** All serial ports, unfiltered (=`PicoMpyCom.getAllSerialPorts`). */
  listAllPorts(): Promise<string[]>;
  /**
   * Offer to flash a Pico that enumerated as a USB mass-storage device.
   * Returns whether the check should be suppressed on the next 0-ports tick
   * (=`flashPicoInteractively`).
   */
  checkForUsbMsd(): Promise<boolean>;
  /**
   * View-side work to run once a board opens (terminal focus, first-connect
   * openOnStart handling). Kept out of the manager so its state (terminal,
   * activation file) stays with the activator.
   */
  onConnected?(): void;
}

/**
 * Owns the serial connection lifecycle that used to live as scattered activator
 * fields and handlers: the auto-connect polling interval, the "which port did
 * we last use" memory, the intentional-disconnect one-shot and the three bound
 * board event handlers. Cross-command state (`commandExecuting`, the shared
 * `com` instance, `ui`, `settings`, `terminal`) is reached through the injected
 * {@link SessionContext}; everything the manager alone touches is its own field.
 */
export class ConnectionManager {
  private readonly logger = new Logger("ConnectionManager");

  /** The port we are (or were last) connected to, retried first on reconnect. */
  public comDevice?: string;

  private autoConnectTimer?: NodeJS.Timeout;
  private noCheckForUsbMsd = false;
  /**
   * Set by {@link disconnect} so the next {@link setupAutoConnect} does not
   * immediately re-arm the poller after a user-requested disconnect.
   */
  private intentionalDisconnect = false;

  // Stable handler identities: `off()` removes by reference, so these must be
  // the exact functions passed to `on()` or listeners would multiply per
  // reconnect and spawn parallel connect loops.
  private readonly boundOnError = this.boardOnError.bind(this);
  private readonly boundOnExit = this.boardOnExit.bind(this);
  private readonly boundOnOpen = this.boardOnOpen.bind(this);

  public constructor(
    private readonly ctx: SessionContext,
    private readonly deps: ConnectionDeps,
  ) {}

  /**
   * (Re)arm the board event listeners and, when auto-connect or a manual COM
   * device is configured, the polling interval that reconnects to a Pico.
   *
   * @returns `true` when the poller was armed, `false` when it deliberately was
   * not (intentional disconnect, or neither auto-connect nor a manual device).
   */
  public setupAutoConnect(): boolean {
    if (this.intentionalDisconnect) {
      this.intentionalDisconnect = false;

      return false;
    }

    const instance = this.ctx.com;

    // Remove first so repeated calls never stack duplicate listeners.
    instance.off(PicoSerialEvents.portError, this.boundOnError);
    instance.off(PicoSerialEvents.portClosed, this.boundOnExit);
    instance.off(PicoSerialEvents.portOpened, this.boundOnOpen);

    instance.on(PicoSerialEvents.portError, this.boundOnError);
    instance.on(PicoSerialEvents.portClosed, this.boundOnExit);
    instance.on(PicoSerialEvents.portOpened, this.boundOnOpen);

    if (
      (this.ctx.settings.getString(SettingsKey.manualComDevice)?.length ?? 0) <=
        0 &&
      !this.ctx.settings.getBoolean(SettingsKey.autoConnect)
    ) {
      return false;
    }

    const onAutoConnect = async (): Promise<void> => {
      if (!this.ctx.com.isPortDisconnected()) {
        clearInterval(this.autoConnectTimer);

        return;
      }

      this.ctx.ui?.refreshState(false);
      this.ctx.settings.reload();
      const autoPort = this.ctx.settings.getBoolean(SettingsKey.autoConnect);
      const manualComDevice =
        this.ctx.settings.getString(SettingsKey.manualComDevice) ?? "";
      const customVidPidPairs = this.ctx.settings.getCustomVidPidPairs();

      if (
        !autoPort &&
        this.comDevice === undefined &&
        manualComDevice.length <= 0
      ) {
        return;
      }

      // Manual COM device set: connect directly without VID/PID filtering.
      if (manualComDevice.length > 0 && !autoPort) {
        try {
          const allPorts = await this.deps.listAllPorts();

          if (allPorts.includes(manualComDevice)) {
            clearInterval(this.autoConnectTimer);
            this.comDevice = manualComDevice;
            await this.ctx.com.openSerialPort(manualComDevice);
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!this.ctx.com.isPortDisconnected()) {
              return;
            }

            // Connection failed, restart the interval.
            this.autoConnectTimer = setInterval(
              () => void onAutoConnect(),
              1500,
            );
          } else {
            this.logger.warn(
              `Manual COM device '${manualComDevice}' not found in ` +
                `available ports: ${allPorts.join(", ")}`,
            );
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            "Failed to connect to manual COM device: " + errorMsg,
          );
        }

        return;
      }

      this.deps
        .listSupportedPorts(customVidPidPairs)
        .then(async ports => {
          if (ports.length === 0) {
            if (!this.noCheckForUsbMsd) {
              // must be reset by checkForUsbMsd to check again
              this.noCheckForUsbMsd = true;
              await this.checkForUsbMsd();
            }

            return;
          }

          // stop polling while we attempt to connect
          clearInterval(this.autoConnectTimer);

          // try the previously connected device first
          if (this.comDevice && ports.includes(this.comDevice)) {
            await this.ctx.com.openSerialPort(this.comDevice);
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!this.ctx.com.isPortDisconnected()) {
              return;
            }
          }

          // no else-if: if the previous device failed, try the next one
          if (autoPort) {
            const port = ports[0];
            this.comDevice = port;
            await this.ctx.com.openSerialPort(port);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // restart the interval
          this.autoConnectTimer = setInterval(() => void onAutoConnect(), 1500);
        })
        .catch((error: unknown) => {
          this.logger.error("Failed to get serial ports: " + String(error));
        });
    };

    // Tear down any interval from a previous arming so intervals never stack
    // (the flagged auto-connect timer leak: without this, each re-arm from
    // boardOnExit orphaned the prior interval → parallel connect loops).
    clearInterval(this.autoConnectTimer);
    // setInterval would only fire after 1500ms, so kick off an attempt now.
    void onAutoConnect();
    this.autoConnectTimer = setInterval(() => void onAutoConnect(), 1500);

    return true;
  }

  /** Interactively offer to flash a Pico enumerated as a USB MSD. */
  private async checkForUsbMsd(): Promise<void> {
    this.noCheckForUsbMsd = await this.deps.checkForUsbMsd();
  }

  /** Connect on demand (the `connect` command). */
  public async connect(): Promise<void> {
    if (this.setupAutoConnect()) {
      return;
    }

    // auto-connect is off and no manual COM device is set
    const customVidPidPairs = this.ctx.settings.getCustomVidPidPairs();
    const manualComDevice =
      this.ctx.settings.getString(SettingsKey.manualComDevice) ?? "";

    if (manualComDevice.length > 0) {
      try {
        const allPorts = await this.deps.listAllPorts();

        if (allPorts.includes(manualComDevice)) {
          this.comDevice = manualComDevice;
          await this.ctx.com.openSerialPort(manualComDevice);

          return;
        } else {
          const availablePorts =
            allPorts.length > 0 ? allPorts.join(", ") : "none";
          void vscode.window.showErrorMessage(
            `Manual COM device '${manualComDevice}' not found. ` +
              `Available ports: ${availablePorts}`,
          );

          return;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          "Failed to connect to manual COM device: " + errorMsg,
        );

        return;
      }
    }

    const boards = await this.deps.listSupportedPorts(customVidPidPairs);
    if (boards.length > 1) {
      const comDevice = await vscode.window.showQuickPick(boards, {
        placeHolder: "Select the board to connect to",
        canPickMany: false,
        ignoreFocusOut: false,
        title: "Connect to Micropython board",
      });

      if (comDevice !== undefined) {
        this.comDevice = comDevice;
        await this.ctx.com.openSerialPort(comDevice);
      }

      return;
    } else if (boards.length === 1) {
      this.comDevice = boards[0];
      await this.ctx.com.openSerialPort(boards[0]);
    } else {
      void vscode.window.showWarningMessage(
        "No board running MicroPython has been found. " +
          "Check your connection and VID/PID settings.",
      );
      await this.checkForUsbMsd();
    }
  }

  /** Disconnect on demand (the `disconnect` command). */
  public async disconnect(): Promise<void> {
    if (!this.ctx.com.isPortDisconnected()) {
      clearInterval(this.autoConnectTimer);
      this.intentionalDisconnect = true;
      this.ctx.ui?.setDisconnecting();
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.ctx.com.closeSerialPort();
    }
  }

  /** Connect if disconnected, disconnect if connected (the toggle command). */
  public toggleConnect(): void {
    // don't allow reconnect before the port has closed properly
    if (this.intentionalDisconnect) {
      return;
    }

    if (!this.ctx.com.isPortDisconnected()) {
      void this.disconnect();
    } else {
      void this.connect();
    }
  }

  /** Switch to another connected Pico (the `switchPico` command). */
  public async switchPico(): Promise<void> {
    const customVidPidPairs = this.ctx.settings.getCustomVidPidPairs();
    const ports = await this.deps.listSupportedPorts(customVidPidPairs);
    if (ports.length === 0) {
      void vscode.window.showErrorMessage("No connected Pico found!");

      // Without this return the empty list would fall through to an empty
      // quick pick (the flagged missing-return bug).
      return;
    }

    const port = await vscode.window.showQuickPick(ports, {
      canPickMany: false,
      placeHolder:
        "Select your the COM port of the Pico you want to connect to",
      ignoreFocusOut: false,
    });

    if (port !== undefined) {
      this.comDevice = port;
      await this.ctx.com.openSerialPort(this.comDevice);
    }
  }

  /** Clear the poller and detach all board listeners (on deactivate). */
  public dispose(): void {
    clearInterval(this.autoConnectTimer);
    this.ctx.com.off(PicoSerialEvents.portError, this.boundOnError);
    this.ctx.com.off(PicoSerialEvents.portClosed, this.boundOnExit);
    this.ctx.com.off(PicoSerialEvents.portOpened, this.boundOnOpen);
  }

  private boardOnError(error?: Error): void {
    if (error) {
      void vscode.window.showErrorMessage(
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Unknown error",
      );
    }
  }

  /**
   * Handle the board connection closing. Re-arms auto-connect afterwards unless
   * the disconnect was intentional.
   *
   * @param error The error that caused the exit, if any.
   */
  private boardOnExit(error?: Error | string): void {
    this.ctx.ui?.refreshState(false);
    this.ctx.setBackgroundProgram(false);
    if (error === undefined) {
      this.logger.info("Connection to board was closed.");
      if (this.comDevice !== undefined) {
        // cancel any running operation
        if (this.ctx.ui?.isUserOperationOngoing()) {
          void vscode.window.showWarningMessage(
            "Connection to board was closed. Stopping ongoing operation.",
          );
          this.ctx.ui?.userOperationStopped();
          this.ctx.commandExecuting = false;
        }
        void vscode.window.showInformationMessage("Disconnected from board.");
        this.ctx.terminal?.freeze();
        this.ctx.terminal?.write(
          "\r\n\x1b[31mConnection has been closed.\x1b[0m\r\n",
        );
        this.ctx.terminal?.clean();
      }
    } else if (!this.ctx.com.isPortDisconnected()) {
      // connection lost after a board had connected successfully
      this.logger.error(
        `Connection to board lost: ${
          error instanceof Error ? error.message : error
        }`,
      );
      void vscode.window.showErrorMessage("Connection to board has been lost.");
    }
    this.setupAutoConnect();
  }

  private boardOnOpen(): void {
    if (this.ctx.ui?.getState()) {
      return;
    }

    this.logger.debug("Connected to a board. Now executing *OnConnect stuff...");
    this.logger.info("Connection to board successfully established");

    // terminal focus / first-connect openOnStart handling (activator state)
    this.deps.onConnected?.();

    void vscode.window.showInformationMessage(
      "Connection to MicoPython board established.",
    );

    const scriptToExecute = this.ctx.settings.getString(
      SettingsKey.executeOnConnect,
    );
    if (scriptToExecute !== undefined && scriptToExecute.trim() !== "") {
      void vscode.commands.executeCommand(
        commandPrefix + "remote.run",
        scriptToExecute,
        true,
      );
    }

    const moduleToImport = this.ctx.settings.getString(
      SettingsKey.importOnConnect,
    );
    if (moduleToImport !== undefined && moduleToImport.trim() !== "") {
      void this.ctx.com.runCommand(`import ${moduleToImport}`);
    }
    this.ctx.ui?.refreshState(true);
  }
}
