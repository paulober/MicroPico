var https = require('https');
var exec = require('child_process').exec

//params
var github_company = "Microsoft"
var github_repo = "vscode"

// urls
var github_base = "https://github.com/" + github_company + "/" + github_repo
var github_api_base = "https://api.github.com/repos/" + github_company + "/" + github_repo

var github_tree = github_api_base + "/tree/" // append version number
var github_file = github_api_base + "/tree/" // append version number
var github_latest = github_api_base + "/releases/latest"
var github_download = github_base + "/download/v" // append <version>/<filename>

var request = require('request');
var filenames = {'win32': 'atom-windows.zip', 'win64': 'atom-x64-windows.zip', 'darwin': 'atom-mac.zip', 'linux': 'atom.x86_64.rpm', 'aix': 'atom.x86_64.rpm'}

module.exports = {
  getCurrentVersions: function(cb){
    var _this = this
     exec('code --version',function(error,stdout,stderr){
       var code_version = stdout.split('\n')[0]
       _this.loadLatest(function(electron_version){
        cb(code_version)
       })
       
     })
  },

  getDownloadUrl: function(version){
    var filename = this.getDownloadFileName()
    return github_download + version + "/" + filename
  },

  loadLatest: function(cb){
  
    getContent(github_latest,function(data){
      var json_data = JSON.parse(data)
      if(json_data){
        var version = json_data.tag_name
        cb(version)
      }else{
        cb()
      }
    })
  },

  getDownloadFileName: function(){
    var plf = process.platform
    if(plf == 'win32' && process.arch != 'ia32'){
      plf = 'win64'
    }
    return filenames[plf]
  },
  versionBiggerThen: function (a, b) {
      var i, diff;
      var regExStrip0 = /(\.0+)+$/;
      var segmentsA = a.replace(regExStrip0, '').split('.');
      var segmentsB = b.replace(regExStrip0, '').split('.');
      var l = Math.min(segmentsA.length, segmentsB.length);

      for (i = 0; i < l; i++) {
          diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
          if (diff) {
              return diff;
          }
      }
      return segmentsA.length - segmentsB.length;
  }
}

function getContent(url,cb){
  console.log(url)
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
  }
  var options = {
    url: url,
    method: 'GET',
    headers: headers
  }

  request(options, function (error,res,body) {
      var data = '';
      cb(body)
  });
}
