var vscode = require('vscode');
var exec = require('child_process').exec
var PanelView, Pymakr, Pyboard,SettingsWrapper, pb,v,sw,pymakr
var os = require("os");
var pkg = require("./package.json");
var _ = require("lodash");

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
                    vscode.window.showErrorMessage("NodeJS not detected on this machine, which is required for Pico-Go to work.")
                }else{
                    PanelView = require('./lib/main/panel-view').default;
                    Pymakr = require('./lib/pymakr').default;
                    Pyboard = require('./lib/board/pyboard').default;
                    StubsManager = require("./lib/stubs/stubs-manager").default;

                    let sm = new StubsManager();
                    sm.updateStubs();
                    
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
                
                    var disposable = vscode.commands.registerCommand('pymakr.initialise', function () {
                        sm.addToWorkspace();
                    })
                    context.subscriptions.push(disposable);
                    
                    var disposable = vscode.commands.registerCommand('pymakr.connect', function () {
                        terminal.show()
                        pymakr.connect()
                    })
                    context.subscriptions.push(disposable);
                
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

                    var disposable = vscode.commands.registerCommand('pymakr.extra.getFullVersion', function () {
                        terminal.show()
                        pymakr.getFullVersion()
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

function getOsName() {
    switch (os.platform()) {
        case "win32":
            return "Windows";
        case "linux":
            return "Linux";
        case "darwin":
            return "macOS";
        case "aix":
            return "IBM AIX";
        case "freebsd":
            return "FreeBSD";
        case "openbsd":
            return "OpenBSD";
        case "sunos":
            return "SunOS";
    }
} 

function prepareSerialPort(cb){
    
    try {
        var isCompatible = false;
        var item = _.find(pkg.compatibility, x => x.platform == os.platform());

        if (item != null) {
            isCompatible = _.includes(item.arch, os.arch());
        }

        if (!isCompatible) {
            vscode.window.showErrorMessage(`Sorry, Pico-Go isn't compatible with ${getOsName()} (${os.arch()}).`);
            return;
        }

        require("serialport");
        cb()
    }catch(e){
        console.log("Error while loading serialport library")
        console.log(e)

        if (e.message.includes("NODE_MODULE_VERSION")) {
            vscode.window.showErrorMessage("This version of Pico-Go is incompatible with VSCode " + vscode.version
                + ". Check for an update to the extension. If one isn't available, raise a bug at https://github.com/cpwood/Pico-Go to get this fixed!");
        }
        else if (e.message.includes(".vscode-server")) {
            vscode.window.showErrorMessage("Pico-Go is not currently compatible with the 'VSCode Remote - SSH' extension.");
        }
        else {
            vscode.window.showErrorMessage("There was a problem loading the serialport bindings. Pico-Go will not work.");
        }
    }
}

function checkNodeVersion(cb){
    exec('node -v',function(err,stdout,stderr){
        cb(stdout.substr(0,1) == "v")
    })
}
exports.deactivate = deactivate