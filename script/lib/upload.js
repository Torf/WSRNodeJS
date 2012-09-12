
exports.action = function(req, res, config){
  
  var formidable = require('formidable');
  var form       = new formidable.IncomingForm();
    
  form.parse(req, function(err, fields, files) {
    if (err) {
      console.error(err.message);
      return;
    }
      
    res.writeHead(200, {'content-type': 'text/plain'});
    res.end();
    
    var upload = config.http.upload;
    var name   = fields.filename;
    var path   = files.sendfile.path;
    
    console.log('Upload ' + path + ' to ' + upload+name);
    
    var fs   = require('fs');
    var util = require('util');
    
    var is = fs.createReadStream(path)
    var os = fs.createWriteStream(upload+name);
    
    util.pump(is, os, function() {
      fs.unlinkSync(path);
    });
  });
}