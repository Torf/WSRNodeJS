
// ------------------------------------------
//  CONFIGURATION
// ------------------------------------------

var fs = require('fs');
var json =  fs.readFileSync('script/wsrnode.prop','utf8');
var config = JSON.parse(json);


// ------------------------------------------
//  CRON
// ------------------------------------------

var cronJob = require('./vendor/cron').CronJob;

var cronback = function(options){
  
  if (!options.tts){ return;}
  
  console.log("Say: " + options.tts);
  var say =  require('./lib/speak.js')
  say.tts(options.tts);
}

var startJob = function(task){

  var module = require('./'+task.name);
  console.log('Starting CRON Job for ' + task.name + ' at ' + task.time);
  
  // Create job
  var job = new cronJob({
    cronTime: task.time,
    onTick: function() {
      console.log('Cron: ' + task.name);
      module.cron(cronback, task);
    },
    start: true
  });
  
  // Call once 
  module.cron(cronback, task);
}

if (config.cron){
  for (var i = 0 ; i < config.cron.length ; i++){
    var task = config.cron[i];
    startJob(task);
  }
}


// ------------------------------------------
//  HTTP Server
// ------------------------------------------

var http  = require('http');
var url   = require('url');
var qs    = require('querystring');


var listener = function (req, res) {
  console.log('Request: ' + req.url);
   
  // Skip kludge
  if (req.url.indexOf('favicon.ico') > 0){ return; }
  
  // Parse URL
  var rUrl = url.parse(req.url);
  
  // Parse QueryString
  var rQs = qs.parse(rUrl.query);
  
  // Parse Command
  var cmd = rUrl.pathname;
  cmd = cmd.substring(cmd.lastIndexOf('/')+1);
  
  // Callback
  var callback = function(options){
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(options.tts);
  }
  
  // Dispatch on module
  var speech = 'Je ne comprends pas';
  try {
    if (req.url.indexOf('phantom') > 0){
      var phantom = require('./lib/phantom.js');
      phantom.action(cmd, rQs, callback, config);
    } else {
      var module = require('./'+cmd+'.js');
      module.action(rQs, callback, config);
    }
  } 
  catch(e){ 
    console.log(e);
    callback(speech);  
  }
  
};


var server = http.createServer(listener);
server.listen(8080, "127.0.0.1");

console.log('Server running on http://127.0.0.1:8080');