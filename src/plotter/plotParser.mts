// Parses the board's stdout stream into plottable samples. Beginner-friendly
// protocol (see MicroPico #258):
//   - a data line is a comma- or whitespace-separated list of numbers; each
//     column becomes a series (e.g. `print("%.2f, %.2f" % (t, h))`)
//   - an optional comma-separated header line of labels names the series
//     (e.g. `print("temp, humidity")`) when it directly precedes matching data
//   - any other (non-numeric) output is ignored, so normal prints are harmless

export type PlotEvent =
  | { type: "labels"; labels: string[] }
  | { type: "sample"; values: number[] };

const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function isNumeric(field: string): boolean {
  return NUMBER_RE.test(field);
}

function splitFields(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed === "") {
    return [];
  }
  const parts = trimmed.includes(",")
    ? trimmed.split(",")
    : trimmed.split(/\s+/);

  return parts.map(part => part.trim());
}

export class PlotParser {
  private buffer = "";
  private labels: string[] = [];
  private candidateLabels: string[] | undefined;

  /**
   * Feed raw output text (may contain partial lines) and get the plot events
   * for every completed line.
   */
  public push(text: string): PlotEvent[] {
    this.buffer += text;
    const events: PlotEvent[] = [];

    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex).replace(/\r$/, "");
      this.buffer = this.buffer.slice(newlineIndex + 1);
      this.handleLine(line, events);
      newlineIndex = this.buffer.indexOf("\n");
    }

    return events;
  }

  private handleLine(line: string, events: PlotEvent[]): void {
    const fields = splitFields(line);
    if (fields.length === 0) {
      return;
    }

    if (fields.every(isNumeric)) {
      // Adopt a pending header if its column count matches this data row.
      const header =
        this.candidateLabels?.length === fields.length
          ? this.candidateLabels
          : undefined;
      this.candidateLabels = undefined;
      if (header) {
        this.labels = header;
        events.push({ type: "labels", labels: header });
      }
      events.push({ type: "sample", values: fields.map(Number) });

      return;
    }

    // A comma-separated line of non-numeric tokens is a candidate header;
    // anything else is plain program output and is ignored.
    const isHeaderCandidate =
      line.includes(",") &&
      fields.length > 1 &&
      fields.every(field => field !== "" && !isNumeric(field));
    this.candidateLabels = isHeaderCandidate ? fields : undefined;
  }

  /** The most recently adopted series labels (empty if none seen yet). */
  public getLabels(): string[] {
    return this.labels;
  }
}
