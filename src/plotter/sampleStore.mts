/**
 * Plot samples kept on the extension side for replay and CSV export. Capped so
 * a program that plots for hours can't grow memory without bounds; the oldest
 * samples are dropped first.
 */
export class SampleStore {
  private samples: number[][] = [];

  public constructor(private readonly maxSamples = 100_000) {}

  public get size(): number {
    return this.samples.length;
  }

  public add(values: number[]): void {
    this.samples.push(values);

    // trim in batches instead of shifting the array on every sample
    const slack = Math.max(1, Math.floor(this.maxSamples / 10));
    if (this.samples.length > this.maxSamples + slack) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }
  }

  public clear(): void {
    this.samples = [];
  }

  /** The newest `count` samples, oldest first. */
  public tail(count: number): number[][] {
    return this.samples.slice(-count);
  }

  /**
   * CSV with one column per series. Uses the labels when they match the
   * widest row, generic names otherwise.
   *
   * @returns undefined when there is nothing to export.
   */
  public toCsv(labels: string[]): string | undefined {
    if (this.samples.length === 0) {
      return undefined;
    }

    let columns = 0;
    for (const sample of this.samples) {
      columns = Math.max(columns, sample.length);
    }
    const header =
      labels.length === columns
        ? labels
        : Array.from({ length: columns }, (_v, i) => `series_${i + 1}`);
    const rows = this.samples.map(sample => sample.join(","));

    return [header.join(","), ...rows].join("\n") + "\n";
  }
}
