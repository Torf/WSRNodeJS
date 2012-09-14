
var page    = require('webpage').create();
var system  = require('system');
var url     = 'http://iphone.allocine.fr/salle/seances_gen_csalle=';
var options = {
 'place' : 'B0099',
 'movie' : false
};


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
//  GRAMMAR
// ------------------------------------------

var setGrammar = function(options, results){
  var movies = results.movies; results.movies = undefined;
  if (!options.directory){
    return;
  }
  
  var fs = require('fs'); // console.log(fs.workingDirectory);
  var directory = options.directory + '\\movie.xml'; // 'E:\\Dropbox\\Projects\\WSRMacro\\WSRMacro\\macros\\movie.xml';
  var xml = fs.read(directory);
  
  var replace  = '§ -->\n';
      replace += '<rule id="ruleMovieName">\n';
      replace += '  <tag>out.place="'+options.place+'";</tag>\n';
      replace += '  <one-of>\n';
      
  for(var i = 0 ; i < movies.length ; i++){
      var movie =  movies[i]; movie = movie.indexOf(':') > 0 ? movie.substring(0,movie.indexOf(':')) : movie; // Split at ':'
      replace += '    <item>'+movie+'<tag>out.movie="'+i+'";</tag></item>\n';
  }
      replace += '  </one-of>\n';
      replace += '</rule>\n';
      replace += '<!-- §';
  
  var regexp = new RegExp('§[^§]+§','gm');
  var xml    = xml.replace(regexp,replace);
  
  fs.write(directory, xml, 'w');
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

page.open(encodeURI(url + options.place + '.html'), function (status) { 
  
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
  
  // Scrapping Hours
  if (options.movie){
  
    var pos = parseInt(options.movie);
    results = evaluate(page, function(pos) {
      results = {};
      
      var theatre = $('DIV.titre B').text();
      var movie   = $('DIV.cell A[href^="/film"]').get(pos);
      
      if (movie){
        var hours = $(movie).closest('B').siblings('DIV').html();
            hours = hours.replace(/<br>/g,'. ').replace(/Lun[-,]* /g,'Lundi ')
                         .replace(/Mar[-,]* /g,'Mardi ').replace(/Mer[-,]* /g,'Mercredi ')
                         .replace(/Jeu[-,]* /g,'Jeudi ').replace(/Ven[-,]* /g,'Vendredi ')
                         .replace(/Sam[-,]* /g,'Samedi ').replace(/Dim[-,]* /g,'Dimanche ');
        
        var movie = $(movie).text();
        results.tts = 'Voici les horaires pour '+movie+' au '+theatre+' : '+hours;
      } else {
        results.tts = "Je n'ai pas trouvé le film au " + theatre;
      }
      
      return results; 
    }, pos);
  
  // Scrapping Movies  
  } else {
    results = page.evaluate(function() {
      
      results = {};
      results.movies = $('DIV.cell A[href^="/film"]').map(function(){ return $(this).text(); }).get();
    
      results.tts   = 'Voici la liste des films au ';
      results.tts += $('DIV.titre B').text() + ': ';
      results.tts += results.movies.join(', ');
        
      return results; 
    });
    
    // Generate grammar
    setGrammar(options, results);
  }
  
  // Write answer back
  console.log(JSON.stringify(results));
  phantom.exit();
});


