'use babel';
var fs = require('fs');
import Logger from '../helpers/logger.js'
import ShellWorkers from './shell-workers.js'
import ApiWrapper from '../main/api-wrapper.js';
import Utils from '../helpers/utils.js';
import Config from '../config.js';
var crypto = require('crypto');
var exec = require('child_process').exec
var path = require("path");

export default class Shell {

  constructor(pyboard,cb,method,settings){
    var _this = this
    this.config = Config.constants()
    this.settings = settings
    this.BIN_CHUNK_SIZE = this.settings.upload_chunk_size
    this.EOF = '\x04' // reset (ctrl-d)
    this.RETRIES = 2
    this.pyboard = pyboard
    this.api = new ApiWrapper()
    this.logger = new Logger('Shell')
    this.workers = new ShellWorkers(this,pyboard,settings)
    this.utils = new Utils(settings)
    this.lib_folder = this.api.getPackageSrcPath()
    this.package_folder = this.api.getPackagePath()
    this.mcu_root_folder = '/'
    this.working = false
    this.interrupt_cb = null
    this.interrupted = false

    this.logger.silly("Try to enter raw mode")
    this.pyboard.enter_raw_repl_no_reset(function(err){
      if(err){
        cb(err)
      }

      cb(null)
    })
  }

  getVersion(cb){
    var command =
        "import os,sys\r\n" +
        "sys.stdout.write(os.uname().release)\r\n"

    this.pyboard.exec_(command,function(err,content){
      cb(content)
    })
  }

  getFreeMemory(cb){
      var command =
          "import os, sys\r\n" +
          "_s = os.statvfs('"+ this.mcu_root_folder +"')\r\n" +
          "sys.stdout.write(str(s[0]*s[3])\r\n" +
          "del(_s)\r\n"

    this.pyboard.exec_(command,function(err,content){
      cb(content)
    })
  }

  decompress(name,execute,cb){
    if(!execute){
      cb()
      return
    }
    var command =
        "import uzlib\r\n" +
        "def decompress(name):\r\n" +
        "  with open(name,'r+') as d:\r\n" +
        "    c = uzlib.decompress(d.read())\r\n" +
        "  with open(name,'w') as d:\r\n" +
        "      d.write(c)\r\n" +
        "  del(c)\r\n" +
        "decompress('"+name+"')\r\n"

    this.pyboard.exec_(command,function(err,content){
      cb(content)
    },40000)
  }

  compress(filepath,name,cb){

    var name_only = name.substr(name.lastIndexOf('/') + 1)
    var zipped_path = filepath.replace(name,this.config.compressed_files_folder + "/")
    var zipped_filepath = zipped_path+name_only+'.gz'

    this.utils.ensureDirectoryExistence(zipped_path)

    exec('python '+this.package_folder+'/scripts/compress.py "'+filepath+'" "'+zipped_filepath+'"',
      function(error,stdout,stderr){
        cb(error,stdout,zipped_filepath)
      }
    )
  }


  writeFile(name,file_path,contents,compare_hash,compress,callback,retries=0){
    var _this = this
    this.working = true
    this.logger.info("Writing file: "+name)
    this.logger.info("on path: "+file_path)
    var compressed_path = null

    var cb = function(err,retry){
      setTimeout(function(){
        _this.working = false
        callback(err,retry)
      },100)
    }

    var worker = function(content,callback){
      if(_this.interrupted){
        _this.interrupt_cb()
        return
      }
      _this.workers.write_file(content,callback)
    }

    var retry = function(err){
      if(retries < _this.RETRIES){
        cb(err,true)

        // if retrying for memory or OS issues (like hash checks gone wrong), do a safe-boot before retrying
        if(err && (err.message.indexOf("Not enough memory") > -1 || err.message.indexOf("OSError:") > -1)){
          _this.logger.info("Safe booting...")
          _this.safeboot_restart(function(){
            _this.writeFile(name,file_path,contents,compare_hash,compress,cb,retries+1)
          })

        // if not for memory issues, do a normal retry
        }else{
          // wait one second to give the board time to process
          setTimeout(function(){
              _this.writeFile(name,file_path,contents,compare_hash,compress,cb,retries+1)
          },1000)
        }
      }else{
        _this.logger.verbose("No more retries:")
        cb(err)
      }
    }

    var end = function(err,value_processed){
      
        if(_this.interrupted){
          _this.interrupt_cb()
          return
        }
        _this.eval("f.close()\r\n",function(close_err){
          if((err || close_err) && retries < _this.RETRIES){
            retry(err)

          }else if(!err && !close_err){
            if(compress){
              try{
                fs.unlinkSync(compressed_path)
              }catch(e){
                _this.logger.info("Removing compressed file failed, likely because it never existed. Otherwise, it'll be removed with the py_compiles folder after upload")
              }
            }

            _this.decompress(name,compress,function(){
              if(_this.interrupted){
                _this.interrupt_cb()
                return
              }
              // if(compare_hash){
              //   _this.board_ready(function(){
              //     _this.compare_hash(name,file_path,contents,function(match,err){
              //       _this.resetSyncRoot(function(){
              //         _this.board_ready(function(){
              //           if(match){
              //             cb(null)
              //           }else if(err){
              //             _this.logger.warning("Error during file hash check: "+err.message)
              //             retry(new Error("Filecheck failed: "+err.message))
              //           }else{
              //             _this.logger.warning("File hash check didn't match, trying again")
              //             retry(new Error("Filecheck failed"))
              //           }
              //         })
              //       })
              //     })
              //   })
              // }else{
                _this.board_ready(function(){
                  cb(null)
                })
              //}
            })
          }else if(err){
            cb(err)
          }else{
            cb(close_err)
          }
        })
    }

    var start = function(){
      _this.ensureDirectory(name, function() {
        // contents = utf8.encode(contents)
        _this.setSyncRoot(function(){

          var get_file_command =
            "import ubinascii\r\n"+
            "f = open('"+name+"', 'wb')\r\n"

          _this.pyboard.exec_raw_no_reset(get_file_command,function(){
            _this.utils.doRecursively([contents,0],worker,end)
          })
        })
      });
    }

    if(compress){
      _this.compress(file_path,name,function(err,output,cp){
        compressed_path = cp
        contents = fs.readFileSync(compressed_path)
        start()
      })
    }else{
      start()
    }

  }

  ensureDirectory(fullPath, cb) {
    if (fullPath == undefined || fullPath == null) {
      return;
    }

    let parts = fullPath.split(path.sep);
    let _this = this;

    // Remove filename
    parts.pop();

    if (parts.length == 0) {
      cb();
      return;
    }

    let command =   "import os\r\n" +
                    "def ensureFolder(folder):\r\n" +
                    "   try:\r\n" +
                    "     os.mkdir(folder)\r\n" +
                    "   except OSError:\r\n" +
                    "     ...\r\n" +
                    "\r\n";

    for(var i=1; i <= parts.length; i++) {
      command += `ensureFolder("${parts.slice(0, i).join("/")}")\r\n`;
    }

    this.setSyncRoot(function(){
      _this.eval(command,function(err,content){
        _this.resetSyncRoot(function(err, content){
          cb()
        })
      })
    })
  }

  readFile(name,callback){
    var _this = this

    _this.working = true

    var cb = function(err,content_buffer,content_str){
      _this.resetSyncRoot(function(){
        setTimeout(function(){
          _this.working = false
          callback(err,content_buffer,content_str)
        },100)
      })
    }
    this.setSyncRoot(function(){
    // avoid leaking file handles 
      var command
      command = "import ubinascii,sys" + "\r\n" + 
              "with open('"+name+"', 'rb') as f:" + "\r\n" + 
              "  while True:" + "\r\n" + 
              "    c = ubinascii.b2a_base64(f.read("+_this.BIN_CHUNK_SIZE+"))" + "\r\n" + 
              "    sys.stdout.write(c)" + "\r\n" + 
              "    if not len(c) or c == b'\\n':" + "\r\n" + 
              "        break\r\n"
    
              _this.pyboard.exec_raw(command,function(err,content){

        // Workaround for the "OK" return of soft reset, which is sometimes returned with the content
        if(content.indexOf("OK") == 0){
          content = content.slice(2,content.length)
        }
        // Did an error occur 
        if (content.includes("Traceback (")) {
          // some type of error
          _this.logger.silly("Traceback error reading file contents: "+ content)
          // pass the error back
          cb(content,null ,null)
          return
        }

        var decode_result = _this.utils.base64decode(content)
        var content_buffer = decode_result[1]
        var content_str = decode_result[0].toString()

        if(err){
          _this.logger.silly("Error after executing read")
          _this.logger.silly(err)
        }
        cb(err,content_buffer,content_str)
      },60000)
    })
  }
  // list files on MCU 
  list_files(cb){
    var _this = this
    this.setSyncRoot(function(){
      var file_list = ['']

      var end = function(err,file_list_2){
        // return no error, and the retrieved file_list
        _this.resetSyncRoot(function(){
          cb(undefined,file_list)
        })
      }

      var worker = function(params,callback){
        if(_this.interrupted){
          _this.interrupt_cb()
          return
        }
        _this.workers.list_files(params,callback)
      }
      // need to determine what the root folder of the board is
      _this.utils.doRecursively([_this.mcu_root_folder,[''],file_list], worker ,end)
    })
  }

  board_ready(cb){
    var _this = this
    var command =
        "import sys\r\n" +
        "sys.stdout.write('OK')\r\n"
    this.eval(command,cb,25000)
  }


  removeFile(name,cb){
    var _this = this
    var command =
        "import os\r\n" +
        "os.remove('"+name+"')\r\n"
    this.setSyncRoot(function(){
      _this.eval(command,function(err,content){
        _this.resetSyncRoot(function(){
          cb(err,content)
        })
      })
    })
  }

  createDir(name,cb){
    var _this = this
    var command =
        "import os\r\n" +
        "os.mkdir('"+name+"')\r\n"
    this.setSyncRoot(function(){
      _this.eval(command,function(err,content){
        _this.resetSyncRoot(function(){
          cb(err,content)
        })
      })
    })
  }

  changeDir(name,cb){
    var _this = this
    var command =
        "import os\r\n" +
        "os.chdir('"+name+"')\r\n"
    this.setSyncRoot(function(){
      _this.eval(command,function(err,content){
        _this.resetSyncRoot(function(){
          cb(err,content)
        })
      })
    })
  }

  removeDir(name,cb){
    var _this = this
    var command =
        "import os\r\n" +
        "os.rmdir('"+name+"')\r\n"
    this.setSyncRoot(function(){
      _this.eval(command,function(err,content){
        _this.resetSyncRoot(function(){
          cb(err,content)
        })
      })
    })
  }

  reset(cb){
    var _this = this
    var command =
        "import machine\r\n" +
        "machine.reset()\r\n"
    
    this.pyboard.exec_raw_no_reset(command,function(err){
      _this.pyboard.soft_reset_no_follow(cb);
    });
  }

  safeboot_restart(cb){
    var _this = this
    this.pyboard.safe_boot(function(){
      _this.pyboard.enter_raw_repl_no_reset(cb)
    },4000)

  }

  get_version(cb){
    var _this = this
    var command = "import os; os.uname().release\r\n"

    this.eval(command,function(err,content){
      var version = content.replace(command,'').replace(/>>>/g,'').replace(/'/g,"").replace(/\r\n/g,"").trim()
      var version_int = _this.utils.calculateIntVersion(version)
      if(version_int == 0 || isNaN(version_int)){
        err = new Error("Error retrieving version number")
      }else{
        err = undefined
      }
      cb(err,version_int,version)
    })
  }

  compare_hash(filename,file_path,content_buffer,cb){
    var _this = this

    var compare = function(local_hash){
      _this.get_hash(filename,function(err,remote_hash){
        _this.logger.silly("Comparing local hash to remote hash")
        _this.logger.silly("local: "+local_hash)
        _this.logger.silly("remote: "+remote_hash)
        cb(local_hash == remote_hash,err)
      })
    }
    // the file you want to get the hash
    if(file_path){
      var fd = fs.createReadStream(file_path);
      var hash = crypto.createHash('sha256');
      hash.setEncoding('hex');

      fd.on('end', function() {
          hash.end();
          var local_hash = hash.read()
          compare(local_hash)
      });
      fd.pipe(hash);
    }else{
      var local_hash = crypto.createHash('sha256').update(content_buffer.toString()).digest('hex');
      compare(local_hash)
    }
  }

  get_hash(filename,cb){
    var _this = this

    var command =
        "import uhashlib,ubinascii,sys\r\n" +
        "hash = uhashlib.sha256()\r\n" +
        "with open('"+filename+"', 'rb') as f:\r\n"+
        "  while True:\r\n"+
        "    c = f.read("+this.BIN_CHUNK_SIZE+")\r\n"+
        "    if not c:\r\n"+
        "       break\r\n"+
        "    hash.update(c)\r\n"+
        "sys.stdout.write(ubinascii.hexlify(hash.digest()))\r\n"

    this.eval(command,function(err,content){
      content = content.slice(2,-3).replace('>','')
      if(err){
        _this.logger.silly("Error after reading hash:")
        _this.logger.silly(err)
      }
      _this.logger.silly("Returned content from hash:")
      _this.logger.silly(content)
      cb(err,content)
    },40000)
  }

  resetSyncRoot(cb){
    cb()
    // TODO: Activate whenever setSyncRoot is impleneted correctly, to reset to mcu_root after each read/write action
    // var folder = this.mcu_root_folder
    // var command = 
    //   "import os\r\n" +
    //   "os.chdir('"+folder+"')\r\n"

    // this.eval(command,cb)
  }

  setSyncRoot(cb){
    cb()
    // TODO: create a setting / switch / button in UI for 'upload to /sd' or other base folder
    // var folder = this.settings.upload_base_folder
    // var command = 
    //   "import os\r\n" +
    //   "os.chdir('"+folder+"')\r\n"
      
    // this.eval(command,cb)
  }

  // evaluates command through REPL and returns the resulting feedback
  eval(c,cb,timeout){
    var _this = this
    var command =
        c+"\r\n"

    this.pyboard.exec_raw(command,function(err,content){
      if(!err){
        err = _this.utils.parse_error(content)
      }
      if(err){
        _this.logger.error(err.message)
      }
      setTimeout(function(){
          cb(err,content)
      },100)

    },timeout)
  }

  exit(cb){
    var _this = this
    this.stop_working(function(){
      _this.__clean_close(cb)
    })
  }

  stop_working(cb){
    var _this = this
    if(this.working){
      _this.logger.info("Exiting shell while still working, doing interrupt")
      var cb_done = false
      this.interrupt_cb = function(){
        cb_done = true
        _this.working = false
        _this.interrupted = false
        _this.interrupt_cb = null
        _this.logger.info("Interrupt done, closing")
        cb()
      }
      this.interrupted = true
      setTimeout(function(){
        if(!cb_done){
          _this.logger.info("Interrupt timed out, continuing anyway")
          cb()
        }
      },1000)
    }else{
      _this.logger.info("Not working, continuing closing")
      cb()
    }
  }

  __clean_close(cb){
    var _this = this
    _this.logger.info("Closing shell cleanly")

    var finish = function(err){
      _this.logger.info("Closed successfully")
      if(_this.pyboard.connection.type != 'serial'){
        _this.pyboard.disconnect_silent()
      }
      if(cb){
        _this.logger.info("Callbacking outa here")
        cb(err)
      }else{
        _this.logger.info("No callback?!? Ok, whatevs")
      }
    }

    if(this.settings.reboot_after_upload){
      _this.logger.info("Rebooting after upload")
      this.reset(finish)
    }else{
      this.pyboard.enter_friendly_repl(function(err){
        _this.pyboard.send("\r\n")
        finish(err)
      })
    }
  }
}
