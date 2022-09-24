export enum OPTIONS {
  reset = 0,
  bold = 1,
  italic = 3,
  underline = 4
}
export enum COLORS {
  red = 1,
  green = 2,
  yellow = 3,
  blue = 4,
  magenta = 5,
  cyan = 6,
  white = 7,
  black = 8
}
// prefix number for normal colors
const COLORS_NORMAL = 3;
// prefix number for muted colors
const COLORS_MUTED = 9;
export const C_RESET = "\x1b[0m";

/**
 *
 * @param color The color to use for the text
 * @param options The `OPTIONS` to use for the text
 * @param muted Whether or not to use muted colors
 * @returns The ANSI escape code for the given color and options
 */
export function c(
  color: COLORS,
  options: OPTIONS[] = [],
  muted: boolean = false
): string {
  // TODO: x1b vs x1b ??
  return `\x1b[${muted ? COLORS_MUTED : COLORS_NORMAL}${color}${
    options.length > 0 ? ';' + options.join(';') : ''
  }m`;
}
