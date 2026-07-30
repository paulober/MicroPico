/**
 * Items always ignored when uploading or downloading a project, regardless of
 * the user's configuration.
 */
export const DEFAULT_IGNORED_SYNC_ITEMS = [
  "**/.picowgo",
  "**/.micropico",
  "**/.DS_Store",
];

/**
 * Resolve the configured ignore items for a specific sync folder.
 *
 * An item may be global (`item`) or scoped to a folder (`folder:item`). Scoped
 * items apply only when their folder matches the active sync folder; the folder
 * prefix is then stripped so the returned globs are relative to that folder.
 * The {@link DEFAULT_IGNORED_SYNC_ITEMS} are always included.
 *
 * @param rawItems The configured ignore entries (global or `folder:item`).
 * @param syncFolder The active sync folder that scoped entries are matched against.
 * @returns The ignore globs that apply to the given sync folder.
 */
export function resolveIgnoredSyncItems(
  rawItems: string[],
  syncFolder: string,
): string[] {
  return rawItems.reduce<string[]>(
    (acc, item) => {
      // keep the item if it is global or scoped to the current sync folder
      if (!item.includes(":") || item.split(":")[0] === syncFolder) {
        acc.push(item.includes(":") ? item.split(":")[1] : item);
      }

      return acc;
    },
    [...DEFAULT_IGNORED_SYNC_ITEMS],
  );
}
