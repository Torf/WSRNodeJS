var exec = require('child_process').exec;

exports.action = function(data, callback, config){
  
  // Callback with TTS
  callback({});
  
  
  // Text to speech
  if (data.tts){
    sendKarotz(config, '-tts "'+data.tts+'"');
  }
  
  // Take photos
  else if (data.photo){
    sendKarotz(config, '-photo "http://'+config.http.ip+':'+config.http.port+'/upload"');
  }
  
  // Play music
  else if (data.play){
    sendKarotz(config, '-play "'+data.play+'"');
  }
}

var sendKarotz = function(config, args){
  var process = '%CD%/bin/KarotzNet.exe -ip '+config.module.karotz.ip+' '+args;
  console.log(process);
  var child = exec(process,
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
}