'use babel';

import Shell from './shell.js'
import Config from '../config.js'
import Logger from '../helpers/logger.js'
import ApiWrapper from '../main/api-wrapper.js';
import ProjectStatus from './project-status.js';
import Utils from '../helpers/utils.js';
var fs = require('fs');


export default class Sync {

  constructor(pyboard,settings,terminal) {
    this.logger = new Logger('Sync')
    this.api = new ApiWrapper()
    this.settings = settings
    this.pyboard = pyboard
    this.terminal = terminal
    this.shell = null
    this.in_raw_mode = false
    this.total_file_size = 0
    this.total_number_of_files = 0
    this.number_of_changed_files = 0
    this.method_action = "Downloading"
    this.method_name = "Download"

    this.utils = new Utils(settings)
    this.config = Config.constants()
    this.allowed_file_types = this.settings.get_allowed_file_types()
    this.project_path = this.api.getProjectPath()
    this.isrunning = false
    this.is_stopping = false
    this.fails = 0
    this.compression_limit = 5 // minimum file size in kb that will be compressed
    this.set_paths()
    this.project_status = new ProjectStatus(this.shell,this.settings,this.py_folder)
  }

  isReady(){

    // check if there is a project open
    if(!this.project_path){
      return new Error("No project open")
    }
    // check if project exists
    if(!this.exists(this.py_folder)){
      console.log("Py folder doesn't exist")
        return new Error("Unable to find folder '"+this.settings.sync_folder+"' in your project. Please add the correct folder in your settings")
    }

    return true
  }

  exists(dir){
    return fs.existsSync(dir)
  }

  progress(text,count){
    if(count){
      this.progress_file_count += 1
      text = "["+this.progress_file_count+"/"+this.number_of_changed_files+"] " + text
    }
    var _this = this
    setTimeout(function(){
      _this.terminal.writeln(text)
    },0)
  }

  sync_done(err){
    this.logger.verbose("Sync done!")
    this.isrunning = false
    var mssg = this.method_name+" done"
    if(err){
      mssg = this.method_name+" failed."
      mssg += err.message && err.message != "" ? ": "+err.message : ""
      if(this.in_raw_mode){
        mssg += " Please reboot your device manually."
      }
    }else if(this.in_raw_mode && this.settings.reboot_after_upload){
      mssg += ", resetting board..."
    }

    this.terminal.writeln(mssg)

    if(this.pyboard.connected && !this.in_raw_mode){
      this.terminal.writePrompt()
    }

    if(this.oncomplete){
      this.oncomplete()
      this.oncomplete = null
    }else{
      this.logger.warning("Oncomplete not set!")
    }
  }

  reset_values(oncomplete,method){

    // prepare variables
    if(method!='receive'){
      method = 'send'
      this.method_action = "Uploading"
      this.method_name = "Upload"
    }
    this.method = method
    this.oncomplete = oncomplete
    this.total_file_size = 0
    this.total_number_of_files = 0
    this.number_of_changed_files = 0
    this.progress_file_count = 0
    this.isrunning = true
    this.in_raw_mode = false
    this.set_paths()
  }

  set_paths(){

    this.project_path = this.api.getProjectPath()
    if(this.project_path){

      this.project_name = this.project_path.split('/').pop()

      var dir = this.settings.sync_folder.replace(/^\/|\/$/g, '') // remove first and last slash
      this.py_folder = this.project_path + "/"
      if(dir){
        this.py_folder += dir+"/"
      }

      var sync_folder = this.settings.sync_folder
      var folder_name = sync_folder == "" ? "main folder" : sync_folder
      this.folder_name = folder_name
    }
  }

  check_file_size(cb){
    var _this = this
    this.shell.getFreeMemory(function(size){
      if(_this.method == 'send' && size*1000 < _this.total_file_size){
        var mssg = "Not enough space left on device ("+size+"kb) to fit "+_this.total_number_of_files.toString()+" files of ("+parseInt(_this.total_file_size/1000).toString()+"kb)"
        cb(size,Error(mssg))
      }else{
        cb(size,null)
      }
    })
  }

  start(oncomplete,files){
    var _this = this
    this.settings.refresh(function(){
      _this.__start_sync(oncomplete,'send',files)
    })
  }

  start_receive(oncomplete){
    var _this = this
    this.settings.refresh(function(){
      _this.__start_sync(oncomplete,'receive')
    })
  }

  __start_sync(oncomplete,method,files){
    this.logger.info("Start sync method "+method)
    var _this = this
    this.fails = 0
    this.method = method

    var cb = function(err){
      _this.sync_done(err)
    }

    try {
      this.reset_values(oncomplete,method)
    } catch(e){
      _this.logger.error(e)
      this.sync_done(e)
      return
    }

    // check if project is ready to sync
    var ready = this.isReady()
    if(ready instanceof Error){
      this.sync_done(ready)
      return
    }

    // make sure next messages will be written on a new line
    this.terminal.enter()
    
    if(files){
      // TODO: make compatible with future usecase where files contains more than one file
      var filename = files.split('/').pop()
      this.terminal.write(this.method_action+" current file ("+filename+")...\r\n")
      // TODO: Add notification about the upload target folder when this feature is implemented
      // this.terminal.write(this.method_action+" current file ("+filename+") "+direction+" "+this.shell.mcu_root_folder+"...\r\n")
    }else{
      this.terminal.write(this.method_action+" project ("+this.folder_name+")...\r\n")
    }

    _this.__safe_boot(function(err){

      if(err){
        _this.logger.error("Safeboot failed")
        _this.logger.error(err)
        _this.progress("Safe boot failed, "+_this.method_action.toLowerCase()+" anyway.")
      }else{
        _this.logger.info("Safeboot succesful")
      }

      _this.logger.silly("Start shell")
      _this.start_shell(function(err){
        _this.in_raw_mode = true

        var direction = "to"
        if(_this.method_action.toLowerCase() == "downloading"){
          direction = "from"
        }
        _this.terminal.write(_this.method_action+" "+direction+" "+_this.shell.mcu_root_folder+"...\r\n")
        
        _this.project_status = new ProjectStatus(_this.shell,_this.settings,_this.py_folder)
        _this.logger.silly("Entered raw mode")

        if(!_this.isrunning){
          _this.stoppedByUser(cb)
          return
        }
        if(err){
          _this.logger.error(err)
          _this.throwError(cb,err)
          _this.exit()

        }else{
          if(_this.method=='receive'){
            _this.__receive(cb,err)
          }else{
            _this.__send(cb,err,files)
          }
        }
      })
    })
  }

  __receive(cb,err){
    var _this = this

    _this.progress("Reading files from board")

    if(err){
      this.progress("Failed to read files from board, canceling file download")
      this.throwError(cb,err)
      return
    }
    // list files from board --> file_list 
    this.shell.list_files(function(err,file_list){
      if(err){
        _this.progress("Failed to read files from board, canceling file download")
        _this.throwError(cb,err)
        return
      }
      _this.files = _this._getFilesRecursive("") // files on PC
      var new_files = []
      var existing_files = []
      file_list = _this.utils.ignore_filter(file_list)
      for(var i=0;i<file_list.length;i++){
        var file = file_list[i]
        if(_this.files.indexOf(file) > -1){
          existing_files.push(file)
        }else{
          new_files.push(file)
        }
      }
      file_list = existing_files.concat(new_files)

      var mssg = "No files found on the board to download"

      if (new_files.length > 0){
        mssg = "Found "+new_files.length+" new "+_this.utils.plural("file",file_list.length)
      }

      if (existing_files.length > 0){
        if(new_files.length == 0){
          mssg = "Found "
        }else{
          mssg += " and "
        }
        mssg += existing_files.length+" existing "+_this.utils.plural("file",file_list.length)
      }
      // _this.progress(mssg)


      var time = Date.now()

      var checkTimeout = function(){
        if(Date.now() - time >  29000){
          _this.throwError(cb,new Error("Choice timeout (30 seconds) occurred."))
          return false
        }
        return true
      }

      var cancel = function(){
        if(checkTimeout()){
          _this.progress("Canceled")
          _this.complete(cb)
        }
      }

      var override = function(){
        if(checkTimeout()){
          _this.progress("Downloading "+file_list.length+" "+_this.utils.plural("file",file_list.length)+"...")
          _this.progress_file_count = 0
          _this.number_of_changed_files = file_list.length
          _this.receive_files(0,file_list,function(){
            _this.logger.info("All items received")
            _this.progress("All items overwritten")
            _this.complete(cb)
          })
        }
      }

      var only_new = function(){
        if(checkTimeout()){
          _this.progress("Downloading "+new_files.length+" files...")
          _this.progress_file_count = 0
          _this.number_of_changed_files = new_files.length
          _this.receive_files(0,new_files,function(){
            _this.logger.info("All items received")
            _this.progress("All items overwritten")
            _this.complete(cb)
          })
        }
      }
      var options = {
        "Cancel": cancel,
        "Yes": override,
      }
      if(new_files.length > 0){
        options["Only new files"] = only_new
      }
      setTimeout(function(){

        if(file_list.length == 0){
          _this.complete(cb)
          return true
        }

        mssg = mssg+". Do you want to download these files into your project ("+_this.project_name+" - "+_this.folder_name+"), overwriting existing files?"
        _this.progress(mssg)
        _this.progress("(Use the confirmation box at the top of the screen)")
        _this.api.confirm("Downloading files",mssg,options)
      },100)
    })
  }

  __safe_boot(cb){
    var _this = this
    _this.pyboard.stop_running_programs_double(function(){

      if(!_this.settings.safe_boot_on_upload){
        _this.progress("Not safe booting, disabled in settings")
        cb()
        return false
      }

      if(!_this.pyboard.isSerial){
        cb()
        return false
      }

      _this.logger.info("Safe booting...")
      _this.progress("Safe booting device... (see settings for more info)")
      _this.pyboard.safe_boot(cb,4000)
    },500)
  }

  receive_files(i,list,cb){
    var _this = this
    if(i >= list.length){
      cb()
      return
    } 
    var filename = list[i]
    _this.progress("Reading "+filename,true)
    _this.shell.readFile(filename,function(err,content_buffer,content_st){

      if(err){
        _this.progress("Failed to download "+filename)
        _this.logger.error(err)
        _this.receive_files(i+1,list,cb)

      }else{
        var f = _this.py_folder + filename
        _this.utils.ensureFileDirectoryExistence(f)
        try{
          var stream = fs.createWriteStream(f)
          stream.once('open', function(fd) {
            for(var j=0;j<content_buffer.length;j++){
                stream.write(content_buffer[j])
            }
            stream.end()
            _this.receive_files(i+1,list,cb)
          })
        }catch(e){
          _this.logger.error("Failed to open and write "+f)
          _this.logger.error(e)
          _this.progress("Failed to write to local file "+filename)
          _this.receive_files(i+1,list,cb)
        }
      }
    })
  }


  __send(cb,err,files){
    var _this = this


    this.progress("Reading file status")
    this.logger.info('Reading pymakr file')

    _this.project_status.read(function(err,content){

      if(!_this.isrunning){
        _this.stoppedByUser(cb)
        return
      }

      // if files given, only upload those files
      if(files){

        if(!Array.isArray(files)){
          files = _this.project_status.prepare_file(files)
          files = [files]

          _this.progress("Uploading single file")
        }else{
          _this.progress("Uploading "+files.length+" files")
        }
        _this.number_of_changed_files = files.length
        _this.__write_files(cb,files)


      // otherwise, write changes based on project status file
      }else{
        if(err){
          _this.progress("Failed to read project status, uploading all files")
        }
        _this.__write_changes(cb)
      }



    })

  }


  __write_changes(cb,files){
    var _this = this

    var changes = _this.project_status.get_changes()

    var deletes = changes["delete"]
    var changed_files = changes["files"]
    var changed_folders = changes["folders"]
    var changed_files_folders = changed_folders.concat(changed_files)

    _this.number_of_changed_files = changed_files.length
    _this.max_failures = Math.min(Math.ceil(changed_files.length/2),5)

    if(deletes.length > 0){
      _this.progress("Deleting "+deletes.length.toString()+" files/folders")
    }

    if(deletes.length == 0 && changed_files.length == 0 && changed_folders.length == 0){
      _this.progress("No files to upload")
      _this.complete(cb)
      return
    }else{
      _this.logger.info('Removing files')
      _this.removeFilesRecursive(deletes,function(){
        if(!_this.isrunning){
          _this.stoppedByUser(cb)
          return
        }
        if(deletes.length > 0){
          _this.logger.info("Updating project-status file")
        }
        _this.project_status.write(function(){
          _this.__write_files(cb,changed_files_folders)
        })
      })
    }
  }

  __write_files(cb,files_and_folders){
    var _this = this
    _this.logger.info('Writing changed folders')
    _this.writeFilesRecursive(files_and_folders,function(err){
      if(!_this.isrunning){
        _this.stoppedByUser(cb)
        return
      }

      if(err){
        _this.throwError(cb,err)
        return
      }

      setTimeout(function(){
        _this.logger.info('Writing project file')
        _this.project_status.write(function(err){
          if(!_this.isrunning){
            _this.stoppedByUser(cb)
            return
          }
          if(err){
            _this.throwError(cb,err)
            return
          }
          _this.logger.info('Exiting...')
          _this.complete(cb)
        })
      },300)
    })
  }

  stopSilent(){
    this.logger.info("Stopping sync")
    this.isrunning = false
  }

  stop(cb){
    var _this = this
    this.stopSilent()

    if(!this.shell){
      _this.isrunning = false
      cb()
      return
    }
    this.shell.stop_working(function(){
      _this.isrunning = false
      _this.project_status.write(function(err){
        _this.complete(function(){
          _this.pyboard.stopWaitingForSilent()
          cb()
        })
      })
    })
  }

  stoppedByUser(cb){
    var _this = this
    this.logger.warning("Sync canceled")
    if(!this.is_stopping){
      this.is_stopping = true
    }
  }



  throwError(cb,err){
    var _this = this
    var mssg = err ? err : new Error("")

    this.logger.warning("Error thrown during sync procedure")

    if(!cb){
      this.sync_done(mssg)
    }else{
      cb(mssg)
    }

    _this.pyboard.stopWaitingForSilent()

    var _this = this
    this.exit(function(){
      _this.pyboard.enter_friendly_repl_non_blocking(function(){
        // do nothing, this might work or not based on what went wrong when synchronizing.
      })
    })
  }

  complete(cb){
    var _this = this
    var lcb = function(){
      _this.exit(function(){
        if(_this.oncomplete){
          _this.oncomplete()
          _this.logger.warning("Oncomplete executed, setting to null")
          _this.oncomplete = null
        }
        if(cb){
          cb()
        }
      })
    }
    try{
      _this.utils.rmdir(this.project_path + "/" + _this.config.compressed_files_folder,function(){
        lcb()
      })
    }catch(e){
      _this.logger.info("Removing py_compressed folder failed, likely it didn't exist")
      _this.logger.info(e)
      lcb()
    }
  }

  removeFilesRecursive(files,cb,depth){
    var _this = this
    if(!depth){ depth = 0 }
    if(files.length == 0){
      cb()
    }else{
      var file = files[0]
      var filename = file[0]
      var type = file[1]
      if(type == "d"){
        _this.progress("Removing dir "+filename)
        _this.shell.removeDir(filename,function(err){

          if(err){
            _this.progress("Failed to remove dir "+filename)
          }
          _this.project_status.update(filename)

          if(!_this.isrunning){
            _this.stoppedByUser(cb)
            return
          }

          files.splice(0,1)
          _this.removeFilesRecursive(files,cb,depth+1)
        })
      }else{
        _this.progress("Removing file "+filename)
        _this.shell.removeFile(filename,function(err){


          if(err){
            _this.progress("Failed to remove file "+filename)
          }
          _this.project_status.update(filename)

          if(!_this.isrunning){
            _this.stoppedByUser(cb)
            return
          }

          files.splice(0,1)
          _this.removeFilesRecursive(files,cb,depth+1)
        })
      }
    }
  }

  writeFilesRecursive(files,cb,depth){
    var _this = this
    if(!depth){ depth = 0 }

    var write_continue = function(files,cb,depth){
      if(files.length == 0){
        cb()
      }else{
        var file = files[0]
        var filename = file[0]
        var type = file[1]
        var size = file[3] ? Math.round(file[3]/1000) : 0
        var check_hash = size < _this.config.hash_check_max_size
        if(type == "f"){
          try{
            var file_path = _this.py_folder + filename
            var contents = fs.readFileSync(file_path)


            var message = "Writing file "+filename+" ("+size+"kb)"
            var compress = false
            if(_this.settings.fast_upload && size >= _this.compression_limit){
              compress = true
              message += " with compression"
            }

            _this.progress(message,true)
            var start_time = new Date().getTime()
            _this.shell.writeFile(filename,file_path,contents,check_hash,compress,function(err,retry){

              if(retry){
                _this.progress("Failed to write file, trying again...")
                // shell.writeFile automatically starts a re-try and executes the callback again
                // no other actions needed
              }else{
                var end_time = new Date().getTime()
                var duration = (end_time - start_time)/ 1000
                _this.logger.info("Completed in "+duration+" seconds")
                if(!check_hash){
                  _this.progress("Hashcheck not performed, file is > 500kb")
                }
                if(err){
                  _this.fails += 1
                  if(_this.fails > _this.max_failures){
                    cb(err)
                    return
                  }else{
                    _this.progress(err.message)
                  }
                }else{
                  _this.project_status.update(filename)
                }

                if(!_this.isrunning){
                  _this.stoppedByUser(cb)
                  return
                }
                files.splice(0,1)
                _this.writeFilesRecursive(files,cb,depth+1)
              }
            })
          }catch(e){
            _this.progress("Failed to write file")
            _this.logger.error(e)
            _this.writeFilesRecursive(files,cb,depth+1)
          }
        }else{
          _this.progress("Creating dir "+filename)
          _this.shell.createDir(filename,function(err){
            _this.project_status.update(filename)
            files.splice(0,1)
            _this.writeFilesRecursive(files,cb,depth+1)
          })
        }
      }
    }

    if(depth > 0 && depth%8 == 0){
      this.logger.info("Updating project-status file")
      this.project_status.write(function(err){
        write_continue(files,cb,depth)
      })
    }else{
      write_continue(files,cb,depth)
    }
  }

  start_shell(cb){
    this.shell = new Shell(this.pyboard,cb,this.method,this.settings)
  }

  _getFiles(dir){
    return fs.readdirSync(dir)
  }
  // read (project) folder on PC
  _getFilesRecursive(dir){
    var files = fs.readdirSync(this.py_folder+dir)
    var list = []
    for(var i=0;i<files.length;i++){
      var filename = dir + files[i]
      var file_path = this.py_folder + filename
      var stats = fs.lstatSync(file_path)
      if(!stats.isDirectory()){
        list.push(filename)
      }else{
        list = list.concat(this._getFilesRecursive(filename+"/"))
      }
    }
    return list
  }

  exit(cb){
    this.shell.exit(function(err){
      if(cb){
        cb(err) 
      }
    })
  }
}
