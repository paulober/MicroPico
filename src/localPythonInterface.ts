import { spawn } from 'child_process';
import * as vscode from 'vscode';

const interpeterPath: string | undefined = vscode.workspace
  .getConfiguration('python')
  .get('defaultInterpreterPath');

/**
 *
 * @param bits The bits to compare to python stats mode.
 * @throws {@link Error} when python process crashed.
 * @returns {@link vscode.FileType} for the given bits or undefined.
 */
export async function checkFileModeBits(
  bits: number
): Promise<vscode.FileType | undefined> {
  if (interpeterPath === undefined) return undefined;

  //run python command localy
  const command =
    'import enum, stat, sys\r\n' +
    'class FileType(enum.IntEnum):\r\n' +
    '    Unknown = 0,\r\n' +
    '    File = 1,\r\n' +
    '    Directory = 2,\r\n' +
    '    SymbolicLink = 64,\r\n\r\n' +
    'def get_file_type(mode: int) -> int:\r\n' +
    '    if stat.S_ISDIR(mode):\r\n' +
    '        return FileType.Directory\r\n' +
    '    elif stat.S_ISREG(mode):\r\n' +
    '        return FileType.File\r\n' +
    '    elif stat.S_ISLNK(mode):\r\n' +
    '        return FileType.SymbolicLink\r\n' +
    '    else:\r\n' +
    '        return FileType.Unknown\r\n\r\n' +
    `print(int(get_file_type(${bits})))\r\n` +
    'sys.stdout.flush()';

  let runLocalPyStatConv: Promise<string | number | undefined> = new Promise(
    function (success, nosuccess) {
      const pythonProc = spawn(interpeterPath, ['-c', command]);
      let result = '';

      pythonProc.stdout.on('data', (data) => {
        if (data && (typeof data === 'string' || data instanceof Buffer)) {
          // TODO: log data with logger
          result += data.toString();
        }
      });

      pythonProc.stderr.on('data', (data) => {
        nosuccess(data);
      });

      pythonProc.on('close', (code) => {
        // TODO: with logger -> console.log(`child process exited with code ${code}`);
        if (code === 0) {
          success(result);
        } else {
          nosuccess(code);
        }
      });
    }
  );

  // interpeterPath + ' -c "' + command + '"'
  /*const res = execSync(interpeterPath + ' -c \"' + command + '\"');
    let va = res.toString();
    console.log("Res2: " + va);*/

  return runLocalPyStatConv
    .then((value: any) => {
      if (typeof value === 'number') {
        throw new Error('Python script returned number: ' + value);
      } else if (typeof value === 'string') {
        const num = parseInt(value.trim());

        //int to vscode.FileType
        switch (num) {
          case 0:
            return vscode.FileType.Unknown;
          case 1:
            return vscode.FileType.File;
          case 2:
            return vscode.FileType.Directory;
          case 64:
            return vscode.FileType.SymbolicLink;
          default:
            return undefined;
        }
      } else {
        return undefined;
      }
    })
    .catch((reason: any) => {
      console.log('Error: ' + reason);
      return undefined;
    });
}
