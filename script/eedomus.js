exports.action = function(data, callback, config){

  // Retrieve config
  config = config.module.eedomus;
  if (!config.api_url || !config.api_user || !config.api_secret){
    console.log("Missing Eedomus config");
    return;
  }
  
  // Build URL
  var url = config.api_url;
  url += '&api_user='+config.api_user;
  url += '&api_secret='+config.api_secret;
  url += '&periph_id='+data.periphId;
  url += '&value='+data.periphValue;
  
  console.log('URL:' + url);
  
  // Send Request
  var request = require('request');
  request({ 'uri' : url }, function (err, response, body){
    
    if (err || response.statusCode != 200) {
      callback({'tts': "L'action a échoué"});
      return;
    }
    
    console.log(body);
    
    // Callback with TTS
    callback({'tts': "Je m'en occupe !"});
  });
}
