import { execSync, spawnSync } from 'child_process';
import * as vscode from 'vscode';

const interpeterPath: string | undefined = vscode.workspace.getConfiguration('python').get('defaultInterpreterPath');

export function checkFileModeBits(bits: number): vscode.FileType | undefined {
    if (interpeterPath === undefined) return undefined;

    //run python command localy
    const command = 
    'import enum, stat, sys' +
    'class FileType(enum.IntEnum):Unknown = 0,;File = 1,;Directory = 2,;SymbolicLink = 64,\r\n'+
    'def get_file_type(mode) -> int:\r\n' +
        'if stat.S_ISDIR(mode):\r\n' +
            'return FileType.Directory\r\n' +
        'elif stat.S_ISREG(mode):\r\n' +
            'return FileType.File\r\n' +
        'elif stat.S_ISLNK(mode):\r\n' +
            'return FileType.SymbolicLink\r\n' +
        'else:\r\n' +
            'return FileType.Unknown\r\n' +
    'print(get_file_type('+bits+'))\r\n' +
    'sys.stdout.flush()';

    /*const pythonProc = spawn(interpeterPath, ["-c", command]);

    let result = "";
    pythonProc.stdout.on('data', (data) => {
        if (data && typeof data === "string") {
            result += data;
        }
    });*/
    const res = execSync(interpeterPath + ' -c "' + command + '"');

    //int to vscode.FileType
    switch (res.toString()) {
        case "0":
            return vscode.FileType.Unknown;
        case "1":
            return vscode.FileType.File;
        case "2":
            return vscode.FileType.Directory;
        case "64":
            return vscode.FileType.SymbolicLink;
        default:
            return undefined;
    }
}
