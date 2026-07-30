/**
 * Available stub versions keyed by stub port (as returned by the stubs API).
 */
export type StubVersionsByPort = Record<string, string[]>;

/**
 * Flatten the available versions per port into quick-pick labels.
 *
 * When more than one port is offered, each label is prefixed with the port
 * (`"<port> - <version>"`) so the user can tell them apart; with a single port
 * the bare version is used to reduce clutter.
 *
 * @param available Available versions keyed by port.
 * @param portLabel Maps a port key to its display string.
 * @returns The quick-pick labels, in port/version order.
 */
export function buildStubVersionOptions(
  available: StubVersionsByPort,
  portLabel: (portKey: string) => string,
): string[] {
  const multiplePorts = Object.keys(available).length > 1;
  const options: string[] = [];

  for (const [portKey, versions] of Object.entries(available)) {
    for (const version of versions) {
      options.push(
        multiplePorts ? `${portLabel(portKey)} - ${version}` : version,
      );
    }
  }

  return options;
}

/**
 * Parse a selected quick-pick label back into its port key and version, the
 * inverse of {@link buildStubVersionOptions}.
 *
 * A label produced for multiple ports carries a `"<port> - <version>"` prefix;
 * otherwise the label is the bare version and the sole available port is used.
 *
 * @param selected The label the user picked.
 * @param available The same map passed to {@link buildStubVersionOptions}.
 * @param toPortKey Maps a port display string back to its port key.
 * @returns The resolved port key and version.
 */
export function parseStubVersionSelection(
  selected: string,
  available: StubVersionsByPort,
  toPortKey: (portLabel: string) => string,
): { port: string; version: string } {
  if (selected.includes(" - ")) {
    const [portLabel, version] = selected.split(" - ");

    return { port: toPortKey(portLabel), version };
  }

  return { port: Object.keys(available)[0], version: selected };
}
