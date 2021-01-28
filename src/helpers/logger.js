'use babel';
import Config from '../config.js'

var LOG_LEVEL = Config.constants().logging_level
var LEVELS = ['silly','verbose','info','warning','error','critical']


// Import this class and create a new logger object in the constructor, providing
// the class name. Use the logger anywhere in the code
// this.logger = new Logger('Pyboard')
// this.logger.warning("Syncing to outdated firmware")
// Result in the console will be:
// [warning] Pyboard | Syncing to outdated firmware

export default class Logger {

  constructor(classname){
    this.classname = classname
  }

  log(level,mssg){
    if(level >= LOG_LEVEL){
      console.log("[" + LEVELS[level] + "] "+this.classname+" | "+mssg)
    }
  }

  silly(mssg){
    this.log(0,mssg)
  }

  verbose(mssg){
    this.log(1,mssg)
  }

  info(mssg){
    this.log(2,mssg)
  }

  warning(mssg){
    this.log(3,mssg)
  }

  error(mssg){
    this.log(4,mssg)
  }

  critical(mssg){
    this.log(5,mssg)
  }
}
