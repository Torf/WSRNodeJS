var moment    = require('moment');
moment.lang('fr');

// ------------------------------------------
//  ADD EVENT
// ------------------------------------------

var https   = require('https');
var request = require('request');
var url     = require('url');
var qs      = require('querystring');

/**
 * Parse and Store authentification data
 * @param data the body of login request
 */
var auths = {};
var setAuth = function(data){
  data.split('\n').forEach(function (dataStr) {
    var datas = dataStr.split('=');
    auths[datas[0]] = datas[1];
  });
}

/**
 * Login to google to get credential
 * @param email the google email
 * @param password the google password
 */
var login = function(email, password, callback){

  var POST = {
    accountType: "HOSTED_OR_GOOGLE",
    Email: email, 
    Passwd: password,
    service: "cl",
    source: 'WSRNodeJS',
  };
  var content = qs.stringify(POST);
  
  var LOGIN = {
    host: "www.google.com",
    path: '/accounts/ClientLogin',
    port: 443,
    method: "POST",
    headers: {
      'Content-Length': content.length,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };

  var data    = "";
  var request = https.request(LOGIN, function(response){
    response.on("data", function(chunk) { data = data + chunk; });
    response.on("end" , function()      { setAuth(data); callback(); });
  });
  
  request.write(content);
  request.end();
};


/**
 * Add Event to Calendar
 * @param event the event object
 * @param path the url to open
 */
var addEvent = function(event, path){
  
  var POST = {
    "data": {
      "title"        : event.title,
      "details"      : event.details,
      "transparency" : "opaque",
      "status"       : "confirmed",
      "location"     : event.location,
      "when": [{
        "start": event.start, // "2012-08-19T15:00:00.000Z"
        "end"  : event.end    // "2012-08-19T17:00:00.000Z"
      }]
    }
  };
  
  var ADD_EVENT = {
    host: "www.google.com",
    path: path ? path : "/calendar/feeds/default/private/full?alt=jsonc",
    port: 443,
    method: "POST",
    headers: {
      'Authorization': 'GoogleLogin auth=' + auths.Auth,
      'Content-Type' : 'application/json',
    }
  };
  
  var buffer  = "";
  var request = https.request(ADD_EVENT, function(response) {
    
    if (response.statusCode == 302) {
      var loc = url.parse(response.headers.location);
      var redirect = loc.pathname + "?" + loc.query;
      addEvent(event, redirect);
    } 
    else { 
      response.on("data",  function(data) { buffer += data; });
      response.on("end",   function()     { console.log(JSON.parse(buffer)); });
      response.on("close", function()     { console.log(JSON.parse(buffer)); });
    }
  });
  
  request.write(JSON.stringify(POST));
  request.end();
  request.on('error', function(ex) { console.error("Error", ex); });
};


/**
 * Helper to login / add event in a single function
 * @param email see login()
 * @param password see login()
 * @param event see addEvent()
 */
var addCalendarEvent = function(email, password, event){
  login(email, password, function(){
     addEvent(event);
  });
}



// ------------------------------------------
//  QUERY CALENDAR
// ------------------------------------------

var CACHED_EVENTS = {};

var matchEntry = function(entry, options){
  
  var title     = entry.title.$t;
  var when      = entry['gd$when'][0];
  var startDate = when.startTime;
  var endDate   = when.endTime;
  var reminder  = when['gd$reminder'] ? when['gd$reminder'][0] : 0;
  var uid       = entry['gCal$uid'].value;
  
  // Check cache
  if (options.cache && CACHED_EVENTS[uid]){ return false; }
  
  // .
  var start    = moment(startDate);
  var start_ms = start.valueOf();
  
  // Check reminder
  if (options.reminder){
    var now_ms   = (new Date()).getTime();
    var rmdr_ms  = reminder.minutes ? 1000*60*reminder.minutes : 1000*60*60*reminder.hours;
    if (start_ms - rmdr_ms > now_ms || now_ms > start_ms){ return false; }
  }
  
  // Check event after start date
  if (options.start){
    var end_ms = moment(endDate).valueOf();
    if (end_ms < options.start){ return false; }
  }
  
  // Check event before end date
  if (options.end){
    if (start_ms > options.end){ return false; }
  }
  
  // Perform cache
  if (options.cache) { CACHED_EVENTS[uid] = true;}
  
  // Compute time
  if (options.duration){
    var now = moment();
    title += ' ' + start.from(now);
  }
  
  if (options.time){
    title += ' à ' + start.format("HH:mm");
  }
  
  return title;
}

/**
 * Check events at the given calendar URL 
 * then callback with array of events
 * 
 * @param url the calendar private url (full with json)
 * @param callback the function to call with event array
 * @param options a configuration object
 */
var checkCalendar = function(url, callback, options){

  var request = require('request');
  request({ 'uri' : url }, function (err, response, body){
    
    if (err || response.statusCode != 200) {
      return;
    }
    
    var lastModified = response.headers['last-modified'];
    
    var json = JSON.parse(body);
    if (!json || !json.feed || !json.feed.entry){
      return;
    }
    
    var events  = [];
    var entries = json.feed.entry;
    for (var i = 0 ; i < entries.length ; i++){
      var event = matchEntry(entries[i], options); // + start date
      if (event){ events.push(event); }
    }
    
    callback(events);
  });
}

// ------------------------------------------
//  EXPORTS
// ------------------------------------------

exports.cron = function(callback, task){
  if (!task.url){
    console.log("Missing Calendar URL");
    return;
  }
  
  checkCalendar(task.url, function(events){
    if (events.length > 0){
      callback({"tts" : 'Petit rappel: '+events.join('. ')});
    }
  }, { 
    "cache"    : true, 
    "duration" : true,
    "reminder" : true
  });
}


exports.action = function(data, callback, config){
  if (!config.module.calendar.url){
    console.log("Missing Calendar URL");
    return;
  }
  
  var start = moment();
  var end   = moment().eod();
  var msg   = "Aujourd'hui";
   
  if (data.date == 'tomorrow'){
    start = start.add('days', 1).sod();
    end   =   end.add('days', 1);
    msg   = "Demain";
  }
  
  checkCalendar(config.module.calendar.url, function(events){
    if (events.length > 0){
      callback({"tts" : msg + ": " + events.join('. ')});
    } 
    else { 
      callback({"tts" : "Il n'y a aucun évènement de prévu "+msg }); 
    }
  }, { 
    "time"  : true,
    "start" : start.valueOf(),
    "end"   : end.valueOf()
  });
}



