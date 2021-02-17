'use babel';
const EventEmitter = require('events');
import ApiWrapper from './api-wrapper.js';
import Logger from '../helpers/logger.js';
var fs = require('fs');
var vscode = require('vscode');
import Config from '../config.js'
import Utils from '../helpers/utils.js';
import PySerial from '../connections/pyserial';
import {workspace} from 'vscode';
const dns = require('dns');


export default class SettingsWrapper extends EventEmitter {
  constructor(cb) {
    super()
    this.config = Config.settings()
    this.constants = Config.constants()
    this.project_config = {}
    this.api = new ApiWrapper(this)
    this.project_path = this.api.getProjectPath()
    this.global_config_file = Utils.getConfigPath("pico-go.json")
    this.config_file = this.project_path+"/pymakr.conf"
    this.json_valid = true
    this.logger = new Logger('SettingsWrapper')
    this.utils = new Utils(this)
    this.project_change_callbacks = []
    this.global_config = {}
    this.watching = {}
    this.file_watcher = {}
    this.change_watcher = {}
    this.file_changed = {}
    this.setFileChangedGlobal()
    var _this = this
    
    if (!fs.existsSync(this.global_config_file)) {
      var gc = this.getDefaultGlobalConfig();

      // Create the Code "User" folder if it doesn't already exist.
      let configFolder = Utils.getConfigPath();

      if (!fs.existsSync(configFolder))
        fs.mkdirSync(configFolder, { recursive: true });

      fs.writeFileSync(this.global_config_file, JSON.stringify(gc));
    }

    // this.refresh(function(){
    //   _this.watchConfigFile()
    //   _this.watchProjectChange()
    //   cb(_this)
    // })
    
    this.readConfigFile(this.global_config_file,true,function(contents){
      _this.global_config = contents
      _this.readConfigFile(_this.config_file,false,function(contents){
        _this.project_config = contents
        _this.refresh(function(){
          _this.watchConfigFile()
          _this.watchConfigFile(_this.config_file)
          _this.watchProjectChange()
          _this.upload_chunk_size = _this.get_upload_chunk_size()
          if(cb){
            cb(_this)
            cb = null
          }
        })

      })
    })
    
    
    
  }

  setFileChangedGlobal(){
    
    this.file_changed[this.config_file] = true
    this.file_changed[this.global_config_file] = true
  }
  onChange(key,cb){
    this.change_watcher[key] = cb
  }


  projectChanged(){
    this.getProjectPath()
    this.refreshProjectConfig()
    this.watchConfigFile(this.config_file)
  }

  getProjectPath(){
    this.project_path = this.api.getProjectPath()
    this.config_file = this.project_path+"/pymakr.conf"
    return this.project_path
  }

  registerProjectChangeWatcher(cb){
    this.project_change_callbacks.push(cb)
  }

  watchProjectChange(){
    var _this = this
    this.api.onProjectsChange(function(paths){
      _this.refreshProjectConfig()
      for(var i =0;i<_this.project_change_callbacks.length;i++){
        _this.project_change_callbacks[i](_this.project_path)
      }
    })
  }

  get_upload_chunk_size(){
    var size = this.constants.upload_batch_size
    if(this.fast_upload){
      size = size * this.constants.fast_upload_batch_multiplier
    }
    return size
  }

  watchConfigFile(file){
    if(!file){
      file = this.global_config_file
    }

    this.logger.info("Watching config file "+file)
    var _this = this
    if(this.file_watcher[file]){
      this.file_watcher[file].close()
    }
    fs.open(file,'r',function(err,content){
      if(!err){
        _this.file_watcher[file] = fs.watch(file,null,function(err){
          _this.logger.info("Config file changed, refreshing settings")
          _this.file_changed[file] = true
          // give it some time to close
          setTimeout(function(){
            _this.refresh()
          },150)
        })
      }else{
        _this.logger.warning("Error opening config file ")
        _this.logger.warning(err)
      }
    })
  }

  refresh(cb){
    var _this = this
    this.refreshGlobalConfig(function(){
      _this.refreshProjectConfig()
      if(cb) cb()
    })

  }
  refreshGlobalConfig(cbg){
    var _this = this

    this.logger.info("Refreshing global config")
    try{
      var contents = this.readConfigFileSync(this.global_config_file)
      this.global_config = contents
    }catch(e){
      this.emit('format_error')
      cbg(e)
      cbg = null
      return 
    }

    this.trigger_global_change_watchers()
    
    this.address = "192.168.4.1";
    // this.address = this.api.config('address')
    // this.username = this.api.config('username')
    // this.password = this.api.config('password')
    this.sync_folder = this.api.config('sync_folder')
    this.sync_file_types = this.api.config('sync_file_types')
    this.sync_all_file_types = this.api.config('sync_all_file_types')
    
    this.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect')
    this.open_on_start = this.api.config('open_on_start')
    this.safe_boot_on_upload = this.api.config('safe_boot_on_upload')
    this.statusbar_buttons = this.api.config('statusbar_buttons')
    this.reboot_after_upload = this.api.config('reboot_after_upload')
    
    this.auto_connect = this.api.config('auto_connect')
    this.manual_com_device = this.api.config('manual_com_device')
    this.py_ignore = this.api.config('py_ignore')
    this.fast_upload = this.api.config('fast_upload')
    this.autoconnect_comport_manufacturers = this.api.config('autoconnect_comport_manufacturers')

    this.timeout = 15000
    this.setProjectConfig()

    if(this.statusbar_buttons == undefined || this.statusbar_buttons == ""){
      this.statusbar_buttons = ['status',"connect","upload","download","run", "softreset"]
    }
    this.statusbar_buttons.push('global_settings')
    this.statusbar_buttons.push('project_settings')


    if(!this.py_ignore){
      this.py_ignore = []
      this.py_ignore.push(this.constants.compressed_files_folder)
    }
    


    PySerial.isSerialPort(this.address,function(is_serial){

      if(is_serial || _this.utils.isIP(_this.address)){
        if(cbg) cbg()
      }else{
        if(cbg) cbg()
      }
    })
  }

  trigger_global_change_watchers(){
    var keys = Object.keys(this.config)
    for(var i=0;i<keys.length;i++){
      var k = keys[i]
      if(this.api.config(k) != this[k] && this.change_watcher[k]){
        var old = this[k]
        this[k] = this.api.config(k)
        this.change_watcher[k](old,this.api.config(k))
      }
    }
  }

  get_allowed_file_types(){
    var types = []
    if(this.sync_file_types){
      types = this.sync_file_types
      if(typeof types === 'string'){
        types = types.split(',')
      }
      for(var i = 0; i < types.length; i++) {
        types[i] = types[i].trim();
      }
    }
    return types
  }


  checkConfigComplete(path,contents,cb){
    if(!this.isConfigComplete(contents)){
      contents = this.completeConfig(contents)
      var json_string =
       JSON.stringify(contents,null,'\t')
      
      fs.writeFile(path, json_string, function(err) {
        if(cb){
          cb()
        }
      })
      return json_string
    }else if(cb){
      cb()
    }
  }
  
  readConfigFileSync(path){
    var contents = {}
    try{
      if (fs.existsSync(path)) {
        contents = fs.readFileSync(path,{encoding: 'utf-8'})
        contents = JSON.parse(contents)
      }
    }catch(e){
      this.logger.warning("Error processing Config file:" + path )
      if (e instanceof SyntaxError && this.file_changed[path]) {
        this.emit('format_error.project')
        this.file_changed[path] = false
      }
      contents = {}
    }
    return contents
  }

  readConfigFile(path,check_complete,cb){
    var _this = this
    fs.readFile(path,function(err,contents){
      if(!err){
        try{
          contents = JSON.parse(contents)
          if(check_complete){
            _this.checkConfigComplete(path,contents,function(){
              _this.watchConfigFile(path)
              if(cb){
                cb(contents)
              }
            })
          }else if(cb){
            cb(contents)
          }

          
        }catch(e){
          console.log(e)
          cb({})
          // config file not properly formatted. TODO: throw error?
        }
      }else{
        cb({})
      }
    })
  }


  refreshProjectConfig(){
    this.logger.info("Refreshing project config")
    var _this = this
    this.project_config = {}
    this.project_path = this.api.getProjectPath()
    this.config_file = this.project_path+"/pymakr.conf"
    
    try{
      var contents = this.readConfigFileSync(this.config_file)
      if(contents){
        this.logger.silly("Found contents")
        this.project_config = contents
        _this.setProjectConfig()
      }
    }catch(e){
      _this.logger.info("No project config present")
      return null
    }
  }

  setProjectConfig(){
    // these projects settings override the global settings 
    // if('address' in this.project_config){
    //   this.address = this.project_config.address
    // }
    // if('username' in this.project_config){
    //   this.username = this.project_config.username
    // }
    // if('password' in this.project_config){
    //   this.password = this.project_config.password
    // }
    if('sync_folder' in this.project_config){
      this.sync_folder = this.project_config.sync_folder
    }
    if('sync_file_types' in this.project_config){
      this.sync_file_types = this.project_config.sync_file_types
    }
    if('ctrl_c_on_connect' in this.project_config){
      this.ctrl_c_on_connect = this.project_config.ctrl_c_on_connect
    }
    if('open_on_start' in this.project_config){
      this.open_on_start = this.project_config.open_on_start
    }
    if('safe_boot_on_upload' in this.project_config){
      this.safe_boot_on_upload = this.project_config.safe_boot_on_upload
    }
    if('statusbar_buttons' in this.project_config){
      this.statusbar_buttons = this.project_config.statusbar_buttons
    }
    if('reboot_after_upload' in this.project_config){
      this.reboot_after_upload = this.project_config.reboot_after_upload
    }
    if('py_ignore' in this.project_config){
      this.py_ignore = this.project_config.py_ignore
    }
    if('fast_upload' in this.project_config){
      this.fast_upload = this.project_config.fast_upload
    }
  }

  isConfigComplete(settings_object){
    return Object.keys(settings_object).length >= Object.keys(this.getDefaultGlobalConfig()).length
  }

  completeConfig(settings_object){
    var default_config = this.getDefaultGlobalConfig()
    if(Object.keys(settings_object).length < Object.keys(default_config).length){
      for(var k in default_config){
        if(settings_object[k] === undefined){
          settings_object[k] = default_config[k]
        }
      }
    }
    return settings_object
  }

  getDefaultProjectConfig(){
    return this.__getDefaultConfig(false)
  }

  getDefaultGlobalConfig(){
    return this.__getDefaultConfig(true)
  }

  __getDefaultConfig(global=false){
    var config = {
        "sync_folder": this.api.config('sync_folder'),
        "open_on_start": this.api.config('open_on_start'),
        "safe_boot_on_upload": this.api.config('safe_boot_on_upload'),
        "statusbar_buttons": this.api.config('statusbar_buttons'),
        "py_ignore": this.api.config('py_ignore'),
        "fast_upload": this.api.config('fast_upload')
    }
    if(global){
      config.sync_file_types = this.api.config('sync_file_types')
      config.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect')
      config.sync_all_file_types = this.api.config('sync_all_file_types')
      config.auto_connect = this.api.config('auto_connect')
      config.manual_com_device = this.api.config('manual_com_device')
      config.autoconnect_comport_manufacturers = this.api.config('autoconnect_comport_manufacturers')
    }
    return config
  }

  openProjectSettings(cb){
    var _this = this
    if(this.getProjectPath()){
      var config_file = this.config_file
      fs.open(config_file,'r',function(err,contents){
          if(err){
            var json_string = _this.newProjectSettingsJson()
            fs.writeFile(config_file, json_string, function(err) {
              if(err){
                cb(new Error(err))
                return
              }
              _this.watchConfigFile(config_file)
              var uri = vscode.Uri.file(config_file)
              workspace.openTextDocument(uri).then(function(textDoc){
                vscode.window.showTextDocument(textDoc)
                cb()
              })  

            })
          }else{
            var uri = vscode.Uri.file(config_file)
            workspace.openTextDocument(uri).then(function(textDoc){
              vscode.window.showTextDocument(textDoc)
              cb()
            })
          }
      })
    }else{
      cb(new Error("No project open"))
    }
  }

  openSettingsFile(filename,cb){
    var _this = this
    var exists = fs.existsSync(filename)
    if(!exists){
      var json_string = _this.newProjectSettingsJson()
      _this.createSettingsFile(filename,json_string,function(){
        _this.api.openFile(filename,cb)
      })
    }else{
      _this.api.openFile(filename,cb)
    }
  }

  createSettingsFile(filename,contents,cb,open=false){
    var _this = this
    fs.writeFile(filename, contents, function(err) {
      if(err){
        cb(new Error(err))
        return
      }
      _this.watchConfigFile(filename)
      if(open){
        _this.api.openFile(filename,cb)
      }else{
        cb()
      } 
    })
  }

  newProjectSettingsJson(){
    var settings = this.getDefaultProjectConfig()
    var json_string = JSON.stringify(settings,null,4)
    return json_string
  }
}
