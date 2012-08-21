var exec = require('child_process').exec;

exports.action = function(cmd, data, callback, config){
  var json = JSON.stringify(data).replace(/"/g, '\\"');
  var path = '%CD%/PhantomJS/phantomjs.exe %CD%/script/phantom/' + cmd  + '.js "' + json + '"';
  
  console.log("Phantom: "+path); 
  var child  = exec(path, function (error, stdout, stderr) {
    if (stdout){ console.log('Stdout: ' + stdout); }
    if (stderr){ console.log('Stderr: ' + stderr); }
    if (error) { console.log('Exec error: ' + error); }
    callback(JSON.parse(stdout));
  });
}