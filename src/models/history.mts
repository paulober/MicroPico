export default class History {
  private items: string[];
  // -1 indicates no history item is currently selected
  private pos: number = -1;

  constructor() {
    this.items = [];
  }

  public add(item: string) {
    const index = this.items.indexOf(item);

    if (index > -1) {
      // if the item is already in the list, remove it
      this.items.splice(index, 1);
    }

    // add the item to the beginning of the list
    this.items.unshift(item);

    // reset the position
    this.pos = -1;
  }

  public getItems() {
    return this.items;
  }

  public arrowUp(): string {
    if (this.items.length === 0) {
      return "";
    }

    if (this.pos < this.items.length - 1) {
      this.pos++;
    }

    return this.items[this.pos];
  }

  public arrowDown(): string {
    if (this.pos === -1 || this.items.length === 0) {
      return "";
    }

    this.pos--;

    if (this.pos === -1) {
      return "";
    }

    return this.items[this.pos];
  }

  public clear() {
    this.items = [];
    this.pos = -1;
  }
}
