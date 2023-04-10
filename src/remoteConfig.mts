import { TextEncoder } from "util";

const VSCodeFS = {
  /*init: function () {
    this[".vscode"]["settings.json"].size = new TextEncoder().encode(
      JSON.stringify(this[".vscode"]["settings.json"].content)
    ).length;
  },*/
  ".vscode": {
    get created() {
      return this.children["settings.json"].created;
    },
    get modified() {
      return this.children["settings.json"].modified;
    },
    get size() {
      return this.children["settings.json"].size;
    },
    children: {
      "settings.json": {
        created: new Date("2023-04-09").getTime(), // Hardcoded creation date
        get modified() {
          return this.created;
        }, // Hardcoded modification date
        _size: -1,
        get size() {
          if (this._size === -1) {
            this._size = this.content.length;
          }
          return this._size;
        },
        content: new TextEncoder().encode(
          JSON.stringify({
            "python.linting.enabled": false,
          })
        ),
        setContent: function (
          localWorkspaceName: string | null,
          localRelativeStubPath: string | null
        ) {
          if (localWorkspaceName === null || localRelativeStubPath === null) {
            return;
          }

          this.content = new TextEncoder().encode(
            JSON.stringify({
              "python.linting.enabled": true,
              "python.analysis.typeshedPaths": [
                `\${workspaceFolder:${localWorkspaceName}}/${localRelativeStubPath}`,
              ],
              "python.languageServer": "Pylance",
              "python.analysis.extraPaths": [
                `\${workspaceFolder:${localWorkspaceName}}/${localRelativeStubPath}/stubs`,
              ],
            })
          );

          // recalculate size
          this._size = this.content.length;
        },
        readAsString: function (): Uint8Array {
          return this.content;
        },
      },
    },
  },
};

export default VSCodeFS;
