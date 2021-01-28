'use babel';
var vscode = require('vscode');
import Logger from '../helpers/logger.js'
import ApiWrapper from '../main/api-wrapper.js';

var Socket = require('net').Socket;

export default class Term {

    constructor(cb,pyboard,settings) {
      this.port = parseInt(Math.random()*1000 + 1337)
      this.host = "127.0.0.1"
      this.term_buffer = ""
      this.terminal_name = "Pico Console"
      this.shellprompt = '>>> ';
      this.pyboard = pyboard
      this.logger = new Logger('Term')
      this.api = new ApiWrapper()
      this.onMessage = function(){}
      this.lastWrite = ""
      this.settings = settings
      this.connection_attempt = 1
      this.active = true
      this.terminal = null
      this.create_failed = false
      this.stream = new Socket();
      this.connected = false
      this.is_windows = process.platform == 'win32'

      //dragging
      this.startY = null
      var _this = this
      this.create()

      this.connect(cb)
      var _this = this

      vscode.window.onDidCloseTerminal(function(event){
        if(!_this.create_failed && event._name == _this.terminal_name){
          _this.create()
        }
      })
    }

    show(){
      this.active = true
      this.terminal.show()
    }

    hide(){
      this.active = false
      this.terminal.hide()
    }

    connectReattempt(cb){
      var _this = this
      this.connection_attempt +=1
      this.connected = false
      setTimeout(function(){
        _this.connect(cb)
      },200)
      
    }

    create(){
      this.create_failed = false
      this.port = parseInt(Math.random()*1000 + 1337)
      try{
        var termpath = this.api.getPackagePath() + "terminalExec.js"
        var shellpath = this.is_windows ? "node.exe" : "node"
        this.terminal = vscode.window.createTerminal({name: this.terminal_name, shellPath: shellpath, shellArgs: [termpath,this.port.toString()]} )
        if(this.settings.open_on_start){
            this.show()
        }
      }catch(e){
        this.create_failed = true
      }
    }

    connect(cb){
      
      if(this.connection_attempt > 20) {
        cb(new Error("Unable to start the terminal. Restart VSC or file an issue on our github"))
        return
      }
      var _this = this
      var stopped = false
      this.connected = false
      this.stream = new Socket();
      this.stream.connect(this.port,this.host);
      this.stream.on('connect',function(err){
        if(err){
          _this.logger.info("Terminal failed to connect")  
        }else{
          _this.logger.info("Terminal connected")
        }
        _this.connected = true
        cb(err)
      });
      this.stream.on('timeout', function () {
        if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('error', function (error) {
        _this.logger.warning('Error while connecting to term')
        _this.logger.warning(error)
        if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('close', function (had_error) {
        _this.logger.warning('Term connection closed')
        _this.logger.warning(had_error)
        if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('end', function () {
          _this.logger.warning('Term connection ended ')
          if(!stopped){
          stopped = true
          _this.connectReattempt(cb)
        }
      });
      this.stream.on('data', function (data) {
        _this.userInput(data)
      });
    }

    initResize(el,resizer){
      // not implemented
    }

    setOnMessageListener(cb){
      this.onMessage = cb
    }

    writeln(mssg){
      this.stream.write(mssg+"\r\n")
      this.lastWrite += mssg
      if(this.lastWrite.length > 20){
        this.lastWrite = this.lastWrite.substring(1)
      }
    }

    write(mssg){
      this.stream.write(mssg)
      this.lastWrite += mssg
      if(this.lastWrite.length > 20){
        this.lastWrite = this.lastWrite.substring(1)
      }
    }

    writeln_and_prompt(mssg){
      this.writeln(mssg+"\r\n")
      this.writePrompt()
    }

    writePrompt(){
      this.write(this.shellprompt)
    }

    enter(){
      this.write('\r\n')
    }

    clear(){
      this.lastWrite = ""
    }

    userInput(input){
      this.onMessage(input)
    }

    paste(){
      var content = this.api.clipboard().replace(/\n/g,'\r')
      this.userInput(content)
    }

    copy(ev){
      
    }
}
