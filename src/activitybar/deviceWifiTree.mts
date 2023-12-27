import {
  type PyOutCommandWithResponse,
  PyOutType,
  type PyboardRunner,
} from "@paulober/pyboard-serial-com";
import { join } from "path/posix";
import {
  TreeItem,
  type Event,
  type TreeDataProvider,
  TreeItemCollapsibleState,
  EventEmitter,
  Uri,
  window,
} from "vscode";
import Logger from "../logger.mjs";
import type PackagesWebviewProvider from "./packagesWebview.mjs";

const DETECT_WIFIS_SCRIPT = `
try:
    from network import WLAN as __pico_WLAN, STA_IF as __pico_STA_IF
    from ujson import dumps as __pico_dumps
    __pico_wlan = __pico_WLAN(__pico_STA_IF)
    __pico_wlan.active(True)
    __pico_available_networks = __pico_wlan.scan()
    __pico_networks = {n[0].decode('utf-8'): n[3] for n in __pico_available_networks}
    #don't deactivate cause it will disconnect from the wifi if connected
    #__pico_wlan.active(False)
    del __pico_wlan
    del __pico_available_networks
    del __pico_STA_IF
    del __pico_WLAN
    print(__pico_dumps(__pico_networks))
    del __pico_networks
    del __pico_dumps
except Exception as e:
    pass
`;

const CONNECT_TO_WIFI_SCRIPT = (element: Wifi, password: string): string => `
try:
    from network import WLAN as __pico_WLAN, STA_IF as __pico_STA_IF
    __pico_wlan = __pico_WLAN(__pico_STA_IF)
    __pico_wlan.active(True)
    __pico_wlan.connect('${element.label}', '${password}')
    # check if successfully connected
    __pico_connected = __pico_wlan.isconnected()
    print(__pico_connected)
    del __pico_wlan
    del __pico_STA_IF
    del __pico_WLAN
except Exception as e:
    pass
`;

const DISCONNECT_FROM_WIFI_SCRIPT = `
try:
    from network import WLAN as __pico_WLAN, STA_IF as __pico_STA_IF
    __pico_wlan = __pico_WLAN(__pico_STA_IF)
    __pico_wlan.active(True)
    __pico_wlan.disconnect()
    __pico_wlan.active(False)
    del __pico_wlan
    del __pico_STA_IF
    del __pico_WLAN
except Exception as e:
    pass
`;

const CHECK_CONNECTION_SCRIPT = `
try:
    from network import WLAN as __pico_WLAN, STA_IF as __pico_STA_IF
    __pico_wlan = __pico_WLAN(__pico_STA_IF)
    __pico_wlan.active(True)
    __pico_connected = __pico_wlan.isconnected()
    if __pico_connected:
        print(f'{str(__pico_connected)}_{__pico_wlan.config("ssid")}')
    else:
        print(__pico_connected)
    del __pico_connected
    del __pico_wlan
    del __pico_STA_IF
    del __pico_WLAN
except Exception as e:
    pass
`;

export default class DeviceWifiProvider implements TreeDataProvider<Wifi> {
  public static readonly viewType = "micropico-device-wifi";

  private _onDidChangeTreeData: EventEmitter<Wifi | undefined | void> =
    new EventEmitter<Wifi | undefined | void>();
  readonly onDidChangeTreeData: Event<Wifi | undefined | void> =
    this._onDidChangeTreeData.event;

  private _logger: Logger = new Logger("DeviceWifiProvider");

  private _connectedTo: string = "";
  private _passwords: { [key: string]: string } = {};

  constructor(
    private readonly pyb: PyboardRunner,
    private readonly packagesWebviewProvider: PackagesWebviewProvider,
    private readonly extensionPath: string
  ) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Detect if the device disconnected an clear _connectedTo if so.
   */
  public async checkConnection(): Promise<void> {
    // TODO: make check connection return the ssid it's connected to or empty string
    // so if use manually connects this gets reflected in UI
    const isConnected = await this.pyb.executeCommand(CHECK_CONNECTION_SCRIPT);

    if (isConnected.type === PyOutType.commandWithResponse) {
      const response = (isConnected as PyOutCommandWithResponse).response;
      if (response.startsWith("True")) {
        const connectedTo = response.trimEnd().split("_")[1];
        if (this._connectedTo !== connectedTo) {
          this._connectedTo = response.trimEnd().split("_")[1];
          this._logger.info(
            "Your Pico is connected to following Wifi network: ",
            connectedTo
          );
          void window.showInformationMessage(
            "Your Pico is connected to following Wifi network: " + connectedTo
          );
          // currently triggers rebuild of webview so be careful with this
          await this.packagesWebviewProvider.enable();
          this.refresh();
        }
      } else if (this._connectedTo) {
        // else if to not refresh UI to often if this function is run periodically
        this._connectedTo = "";
        this._logger.info("Pico disconnected from Wifi.");
        void window.showWarningMessage("Pico disconnected from Wifi.");
        this.refresh();
        // currently triggers rebuild of webview so be careful with this
        await this.packagesWebviewProvider.disable();
      }
    }
  }

  private async _connectToWifi(element: Wifi): Promise<void> {
    const isConnected = await this.pyb.executeCommand(
      CONNECT_TO_WIFI_SCRIPT(element, this._passwords[element.label])
    );

    if (isConnected.type === PyOutType.commandWithResponse) {
      if (
        (isConnected as PyOutCommandWithResponse).response.trimEnd() === "True"
      ) {
        this._connectedTo = element.label;
        this._logger.info(
          "Successfully connected Pico to wifi: ",
          element.label
        );
        void window.showInformationMessage(
          `Successfully connected Pico to ${element.label}.`
        );

        //sleep for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 4000));

        // TODO: check connection every 5 seconds if connection is still up
        this.refresh();

        // currently triggers rebuild of webview so be careful with this
        await this.packagesWebviewProvider.enable();
      } else {
        delete this._passwords[element.label];
        const resp = (isConnected as PyOutCommandWithResponse).response;
        this._logger.error("Failed to connect to wifi: ", element.label, resp);

        await window.showErrorMessage(
          "Failed to connect to wifi. Maybe the password was wrong?"
        );
      }
    }
  }

  private async _disconnectWifi(): Promise<void> {
    await this.pyb.executeCommand(DISCONNECT_FROM_WIFI_SCRIPT);

    this._connectedTo = "";
    this._logger.info("Successfully disconnected Pico from wifi.");
    void window.showInformationMessage(
      "Successfully disconnected Pico from wifi."
    );
    this.refresh();
  }

  public async elementSelected(element: Wifi): Promise<void> {
    if (element.label === this._connectedTo) {
      const result = await window.showInformationMessage(
        "Do you want to disconnect from this wifi?",
        "Yes",
        "No"
      );

      if (result === "Yes") {
        await this._disconnectWifi();
      }

      return;
    }

    if (this._passwords[element.label]) {
      await this._connectToWifi(element);
    } else {
      // ask for password input
      const password = await window.showInputBox({
        prompt: `Enter password for ${element.label}`,
        password: true,
      });

      if (password) {
        this._passwords[element.label] = password;

        return this.elementSelected(element);
      } else {
        await window.showWarningMessage(
          "Password is required to connect to wifi."
        );
      }
    }
  }

  public getTreeItem(element: Wifi): TreeItem | Thenable<TreeItem> {
    element.command = {
      command: "micropico.device-wifi.itemClicked",
      title: element.label ? element.label.toString() : "",
      arguments: [element],
    };
    if (element.label === this._connectedTo) {
      element.iconPath = {
        light: Uri.file(
          join(this.extensionPath, "images", "wifi-connected.svg")
        ),
        dark: Uri.file(
          join(this.extensionPath, "images", "wifi-connected.svg")
        ),
      };
    } else {
      element.iconPath = {
        light: Uri.file(join(this.extensionPath, "images", "wifi.svg")),
        dark: Uri.file(join(this.extensionPath, "images", "wifi.svg")),
      };
    }

    return element;
  }

  public async getChildren(element?: Wifi | undefined): Promise<Wifi[]> {
    const networks = await this.pyb.executeCommand(DETECT_WIFIS_SCRIPT);

    if (networks.type === PyOutType.commandWithResponse) {
      const response = (networks as PyOutCommandWithResponse).response;

      if (response.trimEnd() === "") {
        return [];
      }

      const wifis: { [key: string]: string } = JSON.parse(response) as {
        [key: string]: string;
      };

      return Object.keys(wifis)
        .map(
          ssid =>
            new Wifi(
              ssid,
              "WLAN",
              Number(wifis[ssid]),
              TreeItemCollapsibleState.None
            )
        )
        .sort((a, b) => b.rssi - a.rssi);
    }

    return [];
  }
}

export class Wifi extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly ssid: string,
    public readonly rssi: number,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    this.tooltip = `${this.label}-${this.ssid}`;
    this.description = `RSSI ${this.rssi} dBm`;
  }
}
