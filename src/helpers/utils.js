'use babel';

var path = require('path');
var rimraf = require('rimraf');
var fs = require('fs');
var os = require('os');
var homeDir = os.homedir();


// Import this class and create a new logger object in the constructor, providing
// the class name. Use the logger anywhere in the code
// this.logger = new Logger('Pyboard')
// this.logger.warning("Syncing to outdated firmware")
// Result in the console will be:
// [warning] Pyboard | Syncing to outdated firmware

export default class Utils {

  constructor(settings){
    this.settings = settings

    // TODO: grab from a .pyignore file or setting
    this.allowed_file_types = this.settings.get_allowed_file_types()
  }

  // runs a worker recursively untill a task is Done
  // worker should take 2 params: value and a continuation callback
    // continuation callback takes 2 params: error and the processed value
  // calls 'end' whenever the processed_value comes back empty/null or when an error is thrown
  doRecursively(value,worker,end){
    var _this = this
    try{
      worker(value,function(err,value_processed,done){

          if(err){
            end(err)
          }else if(done){
            end(null,value_processed)
          }else{
            setTimeout(function(){
              _this.doRecursively(value_processed,worker,end)
            },20)
          }
      })
    }catch(e){
      console.error('Failed to execute worker:');
      console.error(e)
      end(e)
    }
  }

  // vscode
  static getConfigPath(filename){
    var plf = process.platform
    var folder = process.env.APPDATA || (plf == 'darwin' ? process.env.HOME + '/Library/Application Support' : plf == 'linux' ? Utils.joinPath(homeDir, '.config') : '/var/local');
    if(/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
    return Utils.joinPath(folder, "/Code/User/", filename ? filename : "");
  }

  base64decode(b64str){
    var content = ""
    var buffer_list = []
    var b64str_arr = b64str.split('=')

    for(var i=0;i<b64str_arr.length;i++){
      var chunk = b64str_arr[i]
      if(chunk.length > 0){

        // Add == to only the last chunk
        // Ignore last 2 items, becuase the original string contains '==' + some extra chars
        if(i == b64str_arr.length-3){
          chunk += '=='
        }else{
          chunk += '='
        }
        var bc = Buffer.from(chunk, 'base64')
        buffer_list.push(bc)
        content += bc.toString()
      }
    }
    return [content,buffer_list]
  }

  plural(text,number){
    return text + (number == 1 ? "" : "s")
  }

  parse_error(content){
    var err_index = content.indexOf("OSError:")
    if(err_index > -1){
      return Error(content.slice(err_index,content.length-2))
    }else{
      return null
    }
  }


  ensureFileDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath)
    return this.ensureDirectoryExistence(dirname)
  }


  ensureDirectoryExistence(dirname) {
    if (!fs.existsSync(dirname)) {
      this.mkDirRecursive(dirname)
    }
    return true
  }

  mkDirRecursive(directory) {
    if (!path.isAbsolute(directory)) return;
    let parent = path.join(directory, "..");
    if (parent !== path.join("/") && !fs.existsSync(parent)) this.mkDirRecursive(parent);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory);
  }


  ignore_filter(file_list){
    var _this = this
    var new_list = []
    for(var i=0;i<file_list.length;i++){
      var file = file_list[i]
      var filename = file.split('/').pop()
      if(file && file != "" && file.length > 0 && file.substring(0,1) != "."){
        if(file.indexOf(".") == -1 || this.settings.sync_all_file_types || this.allowed_file_types.indexOf(file.split('.').pop()) > -1){
          if(this.settings.py_ignore.indexOf(file) == -1 && this.settings.py_ignore.indexOf(filename) == -1){
            new_list.push(file)
          }
        }
      }
    }
    return new_list
  }

  rmdir(path,cb){
    rimraf(path, function () { cb() });
  }

  calculate_int_version(version){
    var known_types = ['a', 'b', 'rc', 'r']
    if(!version){
      return 0
    }
    var version_parts = version.split(".")
    var dots = version_parts.length - 1
    if(dots == 2){
      version_parts.push('0')
    }

    for(var i=0;i<known_types.length;i++){
      var t = known_types[i]
      if(version_parts[3] && version_parts[3].indexOf(t)> -1){
        version_parts[3] = version_parts[3].replace(t,'')
      }
    }

    var version_string = ""

    for(var i=0;i<version_parts.length;i++){
      var val = version_parts[i]
      if(parseInt(val) < 10){
        version_parts[i] = '0'+val
      }
      version_string += version_parts[i]
    }
    return parseInt(version_string)
  }

  // vscode
  static getConfigPath(filename){
    var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? Utils.joinPath(homeDir, '.config') : '/var/local');
    if(/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
    return Utils.joinPath(folder, "/Code/User/", filename ? filename : "");
  }

  static joinPath(){        
    var p = "";
    for(var i=0; i<arguments.length; i++){
        p = path.join(p, arguments[i]);
    }
    return Utils.normalize(p);
  }

  static normalize(p){
    return path.normalize(p).replace(/\\/g, '/')
  }



  _was_file_not_existing(exception){
   var error_list = ['ENOENT', 'ENODEV', 'EINVAL', 'OSError:']
   var stre = exception.message
   for(var i=0;i<error_list.length;i++){
     if(stre.indexOf(error_list[i]) > -1){
       return true
     }
   }
   return false
  }

  int_16(int){
    var b = Buffer.alloc(2)
    b.writeUInt16BE(int)
    return b
  }

  int_32(int){
    var b = Buffer.aloc(4)
    b.writeUInt32BE(int)
    return b
  }

  isIP(address){
    var r = RegExp('^http[s]?:\/\/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])')
    return r.test(address)
  }

  isIP(address){
    var r = RegExp('^http[s]?:\/\/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])')
    return r.test(address)
  }
}
