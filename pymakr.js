var vscode = require('vscode');
var exec = require('child_process').exec
var PanelView, Pymakr, Pyboard,SettingsWrapper, pb,v,sw,pymakr

function activate(context) {

    prepareSerialPort(function(error){
        if(error){
            var err_mess = "There was an error with your serialport module, Pico-Go will likely not work properly. Please try to install again or report an issue on GitHub."
            vscode.window.showErrorMessage(err_mess)
            console.log(err_mess)
            console.log(error)
        }

        SettingsWrapper = require('./lib/main/settings-wrapper').default;

        sw = new SettingsWrapper(function(){
            
            checkNodeVersion(function(nodejs_installed){
                if(!nodejs_installed){
                    vscode.window.showErrorMessage("NodeJS not detected on this machine, which is required for Pico-Go to work. See the Pymakr readme for dependancies.")
                }else{
                

                    PanelView = require('./lib/main/panel-view').default;
                    Pymakr = require('./lib/pymakr').default;
                    Pyboard = require('./lib/board/pyboard').default;

                    
                    pb = new Pyboard(sw)
                    v = new PanelView(pb,sw)
                    pymakr = new Pymakr({},pb,v,sw)
                                
                    
                    var terminal = v.terminal
                
                    var disposable = vscode.commands.registerCommand('pymakr.help', function () {
                        terminal.show()
                        pymakr.writeHelpText()
                    })
                    context.subscriptions.push(disposable);
                    
                    var disposable = vscode.commands.registerCommand('pymakr.listCommands', function () {
                        v.showQuickPick()
                    })
                    context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.connect', function () {
                        terminal.show()
                        pymakr.connect()
                    })
                
                    var disposable = vscode.commands.registerCommand('pymakr.run', function () {
                        terminal.show()
                        pymakr.run()
                    })
                    context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.runselection', function () {
                        terminal.show()
                        pymakr.runselection()
                    })
                    context.subscriptions.push(disposable);

                    var disposable = vscode.commands.registerCommand('pymakr.upload', function () {
                        terminal.show()
                        pymakr.upload()
                    })
                    context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.uploadFile', function () {
                        terminal.show()
                        pymakr.uploadFile()
                    })
                    context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.download', function () {
                        terminal.show()
                        pymakr.download()
                    })
                    context.subscriptions.push(disposable);

                    var disposable = vscode.commands.registerCommand('pymakr.deleteAllFiles', function () {
                        terminal.show()
                        pymakr.deleteAllFiles()
                    })
                    context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.globalSettings', function () {
                        pymakr.openGlobalSettings()
                    })
                    context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.projectSettings', function () {
                        pymakr.openProjectSettings()
                    })
                    context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.disconnect', function () {
                        pymakr.disconnect()
                    });
                    context.subscriptions.push(disposable);
                
                    // // not used. open/close terminal command is already available. 
                    // // Terminal opens automatically when doing a connect, run or sync action.
                    // var disposable = vscode.commands.registerCommand('pymakr.toggleREPL', function () {
                    //     pymakr.toggleVisibility()
                    // });
                    // context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.toggleConnect', function () {
                        if(!pymakr.pyboard.connected){
                            terminal.show()
                        }
                        pymakr.toggleConnect()
                    });
                    context.subscriptions.push(disposable);
                
                
                    var disposable = vscode.commands.registerCommand('pymakr.extra.getVersion', function () {
                        terminal.show()
                        pymakr.getVersion()
                    });
                    context.subscriptions.push(disposable);
                
                    // var disposable = vscode.commands.registerCommand('pymakr.extra.getWifiMac', function () {
                    //     terminal.show()
                    //     pymakr.getWifiMac()
                    // });
                    // context.subscriptions.push(disposable);
                
                    var disposable = vscode.commands.registerCommand('pymakr.extra.getSerial', function () {
                        terminal.show()
                        pymakr.getSerial()
                    });
                    context.subscriptions.push(disposable);
                    
                }
            })
        })
    })
}


exports.activate = activate;

function deactivate() {
    v.destroy()
}

function prepareSerialPort(cb){
    
    try {
        require("serialport");
        cb()
    }catch(e){
        console.log("Error while loading serialport library")
        console.log(e)
        // FIXME: install.js has been removed, the below just treid to re-copy 
        // var exec = require('child_process').exec
        // var cmd = 'npx electron-rebuild --force --version '+ process.versions['electron'];
        // exec(cmd,function(error, stdout, stderr){
        //         try {
        //             require("serialport");
        //             cb()
        //         }catch(e){
        //             cb(e)
        //         }
        //     });

        // FIXME: install.js has been removed, the below just tried to re-copy 
        // exec('node '+ __dirname+'/scripts/install.js no_rebuild',function(error, stdout, stderr){
        //         try {
        //             require("serialport");
        //             cb()
        //         }catch(e){
        //             cb(e)
        //         }
        //     });
    }
}

function checkNodeVersion(cb){
    exec('node -v',function(err,stdout,stderr){
        cb(stdout.substr(0,1) == "v")
    })
}
exports.deactivate = deactivate