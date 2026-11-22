import { l10n } from "vscode";
import { SupportedFirmwareTypes } from "../downloadFirmware.mjs";

export interface BoardChoice {
  label: string;
  description?: string;
  firmware: SupportedFirmwareTypes;
}

/**
 * The boards that can carry a chip found in BOOTSEL mode. The chip alone
 * doesn't tell whether the board has Wi-Fi, and the wrong firmware only shows
 * later (no `network` module, no `Pin("LED")`), so the user picks the board.
 *
 * @param chip The chip type picotool reports, e.g. "RP2040".
 * @returns The boards to choose from, empty for an unknown chip.
 */
export function boardChoices(chip: string): BoardChoice[] {
  const wifi = l10n.t("with Wi-Fi");

  switch (chip) {
    case "RP2040":
      return [
        { label: "Raspberry Pi Pico", firmware: SupportedFirmwareTypes.pico },
        {
          label: "Raspberry Pi Pico W",
          description: wifi,
          firmware: SupportedFirmwareTypes.picow,
        },
      ];
    case "RP2350":
      return [
        {
          label: "Raspberry Pi Pico 2",
          firmware: SupportedFirmwareTypes.pico2,
        },
        {
          label: "Raspberry Pi Pico 2 W",
          description: wifi,
          firmware: SupportedFirmwareTypes.pico2w,
        },
      ];
    default:
      return [];
  }
}
