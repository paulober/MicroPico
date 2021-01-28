'use babel';

import ApiWrapper from '../main/api-wrapper.js';

export default class Runner {
  constructor(pyboard,terminal,pymakr) {
    this.pyboard = pyboard
    this.terminal = terminal
    this.pymakr = pymakr
    this.api = new ApiWrapper()
    this.busy = false
  }

  toggle(cb){
    if(this.busy){
      this.stop(cb)
    }else{
      this.start(cb)
    }
  }

  start(cb){
    var _this = this
    this._getCurrentFile(function(file,filename){
      _this.terminal.writeln("Running "+filename)
      _this.busy = true
      _this.pymakr.view.setButtonState()
      _this.pyboard.run(file,function(){
        _this.busy = false
        if(cb) cb()
      })
    },function onerror(err){
      _this.terminal.writeln_and_prompt(err)
    })
  }

  selection(codeblock,cb,hideMessage=false){
    var _this = this
    codeblock = this.__trimcodeblock(codeblock)
    if (!hideMessage)
      _this.terminal.writeln("Running selected lines")
    _this.busy = true
    _this.pyboard.run(codeblock,function(){
      _this.busy = false
      if(cb) cb()
    },function onerror(err){
      _this.terminal.writeln_and_prompt(err)
    })
  }

  stop(cb){
    var _this = this
    if(this.busy){
      this.pyboard.stop_running_programs_nofollow(function(){
        _this.pyboard.flush(function(){
          _this.pyboard.enter_friendly_repl(function(){
          })
          _this.busy = false
          if(cb) cb()
        })
      })
    }
  }

  _getCurrentFile(cb,onerror){
    this.api.getOpenFile(function(file,name){
      if(!file){
        onerror("No file open to run")
        return
      }

      var filename = "untitled file"
      if(name){
        filename = name.split('/').pop(-1)
        var filetype = filename.split('.').pop(-1)
        if(filetype.toLowerCase() != 'py'){
          onerror("Can't run "+filetype+" files, please run only python files")
          return
        }
      }
      cb(file,filename)
    },onerror)
  }

  //remove excessive identation
  __trimcodeblock(codeblock){
    // regex to split both win and unix style
    var lines = codeblock.match(/[^\n]+(?:\r?\n|$)/g);
    // count leading spaces in line1 ( Only spaces, not TAB)
    var count = 0
    if(lines){
      while (lines[0].startsWith(' ',count ) ){
        count ++;
      }

      // remove from all lines
      if (count > 0){
        var prefix = " ".repeat(count)
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith(prefix) ) {
            lines[i] = lines[i].slice(count);
          } else {
              // funky identation or selection; just trim spaces and add warning
              lines[i] = lines[i].trim() + " # <- IndentationError";
          }
        }
      }
      // glue the lines back together
      return( lines.join(''))
    }
    return codeblock
  }

}
