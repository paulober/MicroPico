'use babel';

import Config from '../config.js';

let LOG_LEVEL = Config.constants().logging_level;
let LEVELS = ['silly','verbose','info','warning','error','critical'];


// Import this class and create a new logger object in the constructor, providing
// the class name. Use the logger anywhere in the code
// this.logger = new Logger('Pyboard')
// this.logger.warning("Syncing to outdated firmware")
// Result in the console will be:
// [warning] Pyboard | Syncing to outdated firmware

export default class Logger {

  constructor(classname){
    this.classname = classname;
  }

  log(level,msg){
    if(level >= LOG_LEVEL){
      console.log('[' + LEVELS[level] + '] '+this.classname+' | '+msg);
    }
  }

  silly(msg){
    this.log(0,msg);
  }

  verbose(msg){
    this.log(1,msg);
  }

  info(msg){
    this.log(2,msg);
  }

  warning(msg){
    this.log(3,msg);
  }

  error(msg){
    this.log(4,msg);
  }

  critical(msg){
    this.log(5,msg);
  }
}
