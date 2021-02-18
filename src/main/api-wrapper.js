'use babel';
var fs = require('fs');
var vscode = require('vscode');
var ncp = require('copy-paste')
import Utils from '../helpers/utils.js';
import {window, workspace} from 'vscode';
import Config from '../config.js';

export default class ApiWrapper {
  constructor(settings) {
    this.default_config = Config.settings()
    this.settings = settings
    this.first_time_opening = false
    this.config_file = Utils.getConfigPath("pico-go.json")
    this.is_windows = process.platform == 'win32'
    this.project_path = this.getProjectPath()
    this.connection_state_filename = 'connection_state.json'

  }

  onConfigChange(key,cb){
   // Unused in vscode (config change callbacks handled in setings-wrapper)
  }

  config(key){
    if(this.settings.global_config[key] !== undefined){
      return this.settings.global_config[key]
    }else if(this.default_config[key] !== undefined){
      return this.default_config[key].default
    }else{
      null
    }
  }



  openSettings(cb){
    if(!cb){
      cb = function(){}
    }
    var _this = this
    var config_file = this.config_file
    if(config_file){
      if(!this.settingsExist()){
          var default_config = _this.settings.getDefaultGlobalConfig() // first param to 'true' gets global settings
          var json_string = JSON.stringify(default_config,null,'\t')
          fs.writeFile(config_file, json_string, function(err) {
            if(err){
              cb(new Error(err))
              return
            }
            _this.settings.watchConfigFile(config_file)
            var uri = vscode.Uri.file(config_file)
            vscode.workspace.openTextDocument(uri).then(function(textDoc){
              vscode.window.showTextDocument(textDoc)
              cb()
            })  
          })
        }else{
          var uri = vscode.Uri.file(config_file)
          vscode.workspace.openTextDocument(uri).then(function(textDoc){
            vscode.window.showTextDocument(textDoc)
            cb()
          })
        }
    }else{
      cb(new Error("No config file found"))
    }
  }

  settingsExist(){
   
    if(this.config_file){
      try{
        fs.openSync(this.config_file,'r')
        return true
      }catch(e){
        return false
      }
      
    }
  }

  writeToCipboard(text){
    ncp.copy(text,function(){
      // completed
    })
  }

  addBottomPanel(options){
    // not implemented
  }

  getPackagePath(){
    if(this.is_windows){
      return Utils.normalize(__dirname).replace('/lib/main','/').replace(/\//g,'\\')
    }else{
      return __dirname.replace('/lib/main','/')
    }
  }

  getPackageSrcPath(){
    var dir = Utils.normalize(__dirname).replace('/lib/main','/src/')
    if(this.is_windows){
      dir = dir.replace(/\//g,'\\')
    }
    return dir
  }

  clipboard(){
    // no implmenetation needed, terminal supports it by default
  }

  getConnectionState(com){
    var state = this.getConnectionStateContents()
    if(!state) return state
    return state[com]
  }

  getConnectionStatePath(){
    var folder = this.getPackagePath()
  
    var atom_folder = folder.split('.vscode')[0] + ".atom/packages/pymakr/"

    if(fs.existsSync(atom_folder+this.connection_state_filename)){
      return atom_folder
    }else{
      return folder
    }
  }

  getConnectionStateContents(){
    var folder = this.getConnectionStatePath()
    try{
      return JSON.parse(fs.readFileSync(folder+this.connection_state_filename))
    }catch(e){
      console.log(e)
      // ignore and continue
      return {}
    }
  }

  setConnectionState(com,state,project_name){
    var folder = this.getConnectionStatePath()
    var timestamp = new Date().getTime()
    var state_object = this.getConnectionStateContents()

    if(state){
      state_object[com] = {timestamp: timestamp, project: project_name}
    }else if(state_object[com]){
      delete state_object[com]
    }

    fs.writeFileSync(folder+'/connection_state.json', JSON.stringify(state_object))
  }

  writeClipboard(text){
    // no implmenetation needed, terminal supports it by default
  }

  getProjectPaths(){
    var path = this.rootPath()
    if(path == null) return []
    return [path] 
  }

  onProjectsChange(cb){
    // no implementation, VSC doesn't support multi project
    return
  }

  listenToProjectChange(cb){
    // no implementation, VSC doesn't support multi project
    return
  }

  error(text){
    window.showErrorMessage(text)
  }

  confirm(title,text,options){
    
    var items = []
    for(var key in options){
      items.push(key);
    }
    var option_item = {
        placeHolder: text
    }
    
    // title is ignored, there's no logical place for it in a quickpick
    window.showQuickPick(items,option_item).then(function(item){
      if(item){
        options[item]()
      }else{
        options['Cancel']()
      }
    })
  }

  getProjectPath(){
    return this.rootPath()
  }

  rootPath(){
    var path =  workspace.rootPath
    if(path && path != "") {
      if(this.is_windows){
        path = path.replace(/\//g,'\\')
      }
      return path
    }
    return null
  }

  openFile(filename,cb){
    var uri = vscode.Uri.file(filename)
    workspace.openTextDocument(uri).then(function(textDoc){
      vscode.window.showTextDocument(textDoc)
      cb()
    })
  }

  // TODO: fix with vscode API to make snippets feature work
  insertInOpenFile(code){
    // var editor = atom.workspace.getActiveTextEditor()
    // if(editor){
    //   editor.insertText(code.toString())
    // }else{
    //   vscode.window.showWarningMessage("No file open to insert code into")
    // }
  }

  notification(text,type){
    if(type=='warning'){
      vscode.window.showWarningMessage(text)
    }else if(type=='info'){
      vscode.window.showInformationMessage(text)
    }else if(type=='error'){
      vscode.window.showErrorMessage(text)
    }
  }

  error(text){
    this.notification(text,'error')
  }
  info(text){
    this.notification(text,'info')
  }
  warning(text){
    this.notification(text,'warning')
  }

  getOpenFile(cb,onerror){
    var editor = window.activeTextEditor
    var doc = editor.document
    var name = doc.fileName
    cb(doc.getText(),name)
  }

  getSelected(){
    var editor = window.activeTextEditor
    var selection = editor.selection;
    var codesnip = ""
    if (!selection.isEmpty) {
      //no active selection , get the current line 
      return editor.document.getText(selection); 
    }
    return codesnip
  }

  getSelectedOrLine(){
    var code = this.getSelected()
  
    if(!code){
      var editor = window.activeTextEditor
      var selection = editor.selection;
      // the Active Selection object gives you the (0 based) line  and character where the cursor is 
      code = editor.document.lineAt(selection.active.line).text;       
    }
    return code
  }

  // restore the focus to the Editor after running a section of code
  editorFocus(){
    vscode.commands.executeCommand( 'workbench.action.focusPreviousGroup') 
    // ? "command": "workbench.action.focusActiveEditorGroup",  var disposable = 
  }

}
