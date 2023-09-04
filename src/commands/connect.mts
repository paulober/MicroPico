import { PyboardRunner } from "@paulober/pyboard-serial-com";
import type Settings from "../settings.mjs";
import { SettingsKey } from "../settings.mjs";
import type StateContainer from "../stateContainer.mjs";
import { Command } from "./command.mjs";

export default class ConnectCommand extends Command {
  private _state: StateContainer;
  private _settings: Settings;

  constructor(state: StateContainer, settings: Settings) {
    super("connect");

    this._state = state;
    this._settings = settings;
  }

  async execute(): Promise<void> {
    this._state.comDevice = await this._settings.getComDevice();
    if (this._state.comDevice !== undefined) {
      this._state.ui?.init();
      this._state.pyb?.switchDevice(this._state.comDevice);
      this.setupAutoConnect(this._settings);
    }
  }

  private setupAutoConnect(settings: Settings): void {
    this._state.autoConnectTimer = setInterval(
      // TODO (important): this should not take longer than 2500ms because
      // then the there would b a hell of a concurrency problem
      () =>
        void (async () => {
          // this could let the PyboardRunner let recognize that it lost connection to
          // the pyboard wrapper and mark the Pico as disconnected
          await this._state.pyb?.checkStatus();
          if (this._state.pyb?.isPipeConnected()) {
            this._state.ui?.refreshState(true);

            return;
          }
          this._state.ui?.refreshState(false);
          const autoPort = settings.getBoolean(SettingsKey.autoConnect);

          const ports = await PyboardRunner.getPorts(settings.pythonExecutable);
          if (ports.ports.length === 0) {
            return;
          }

          // try to connect to previously connected device first
          if (
            this._state.comDevice &&
            ports.ports.includes(this._state.comDevice)
          ) {
            // try to reconnect
            this._state.pyb?.switchDevice(this._state.comDevice);
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (this._state.pyb?.isPipeConnected()) {
              return;
            }
          }

          if (autoPort) {
            const port = ports.ports[0];
            this._state.comDevice = port;
            this._state.pyb?.switchDevice(port);
          }
        })(),
      2500
    );
  }
}
