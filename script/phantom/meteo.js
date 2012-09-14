
var page    = require('webpage').create();
var system  = require('system');
var url     = 'http://mobile.meteofrance.com/france/ville/versailles/';
var options = {'zip' :'78000'};


// ------------------------------------------
//  ARGUMENTS
// ------------------------------------------

if (system.args.length > 1){

  // Parse JSON
  var json = system.args[1];
  var params = json ? JSON.parse(json) : {};
  
  // Merge with defaults
  for (var property in params){
    options[property] = params[property];
  }
}

// ------------------------------------------
//  EVALUATE
// ------------------------------------------

var evaluate = function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
    return page.evaluate(fn);
}

// ------------------------------------------
//  PAGE.OPEN
// ------------------------------------------

page.open(encodeURI(url+options.zip), function (status) { 
  
  var results = {
    tts : "Impossible d'accèder au site"
  }
  
  // Check for page load success
  if (status !== "success") {
    console.log(JSON.stringify(results));
    phantom.exit();
    return;
  }
  
  // Load jQuery
  if (!page.injectJs("../vendor/jquery.min.js")){
    console.log(JSON.stringify(results));
    phantom.exit();
    return;
  }
  
  // Scrapping
  var pos = parseInt(options.movie);
  results = evaluate(page, function(pos) {
    results = {};
    
    var tr = $('DIV#prevision TABLE.prevSem1 TR:nth-child(4)');
    
    results.tts  = tr.find('TD:nth-child(1)').text() + ', '; // Days 
    results.tts += tr.find('TD:nth-child(2) IMG').attr('alt') + ', '; // Sun 
    results.tts += tr.find('TD:nth-child(3)').text(); // Temperature
    
    return results; 
  }, pos);
  
  
  // Write answer back
  console.log(JSON.stringify(results));
  phantom.exit();
});
