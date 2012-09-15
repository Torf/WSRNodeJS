
// Inject helper
phantom.injectJs("../lib/scraper.js");

// ------------------------------------------
//  GRAMMAR
// ------------------------------------------

var setGrammar = function(options, results){

  var movies = results.movies; 
  if (!movies){ return; }
  
  results.movies = undefined;
  if (!options.directory){
    return;
  }
  
  var fs = require('fs');
  var directory = options.directory + '\\movie.xml';
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
//  OPTIONS
// ------------------------------------------

// Merge default options
var options = {
 'place' : 'B0099',
 'movie' : false
};
scraper.setOptions(options);


// ------------------------------------------
//  SCRAPING
// ------------------------------------------


// Scrap
var url = 'http://iphone.allocine.fr/salle/seances_gen_csalle='+options.place+'.html';
scraper.scrap(url, options, function(options, results){
  
  // 2. Parsing Hours of the Movie
  if (options.movie){
    var pos     = parseInt(options.movie);
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
  }
  
  // 1. Parsing List of Movies
  else {
    results.movies = $('DIV.cell A[href^="/film"]').map(function(){ return $(this).text(); }).get();
    
    results.tts   = 'Voici la liste des films au ';
    results.tts += $('DIV.titre B').text() + ': ';
    results.tts += results.movies.join(', ');
  }
}, setGrammar);

