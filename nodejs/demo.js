'use strict';

// fix for sample code at https://api.test.nordnet.se/projects/api/wiki/Nodejs_example
// to make it work without ursa
// by Claes Nygren slaskhas<at>gmail.com
// Get the file 'NEXTAPI_TEST_public.pem' from https://api.test.nordnet.se/projects/api/files

const util = require('util'),
      fs = require('fs'),
      request = require('request'),
      crypto = require("crypto"),
      tls = require('tls'),
      config = require('./config.json');

const HOST = 'https://api.test.nordnet.se'; // change for production

function login(user, pass, fn) {
    var auth = encryptLogin(user, pass, 'NEXTAPI_TEST_public.pem');
    var body = "";
    
    var opts = {
	headers: {
	    'Accept': 'application/json'
	}
    };

    // post JSON
    var jsonData = {
	service: 'NEXTAPI',
	auth: auth
    };
    
    var options = {
	uri: HOST+'/next/2/login',
	method: 'POST',
	json: jsonData
    };


    request(options, function (error, response, body) {
	if (!error ) {
	    if (response.statusCode == 200)
		fn(null,body);
	    else
		fn(body,body);
	} else {
	    fn(null, body);
	};
    });

}



function subscribePrice(market, ident, sessionData) {
  var client = tls.connect(sessionData.private_feed.port, sessionData.public_feed.hostname, function () {
    client.setNoDelay(true);
    client.setTimeout(10000);
    
    console.log('Connected to feed');
    
    client.write(
      formatFeedCmd('login', {
        session_key: sessionData.session_key,
        service: 'NEXTAPI'
      }),
      
      function () {
        var subs = formatFeedCmd('subscribe', {
          t: 'price',
          i: ident,
          m: market
        });
        console.log(subs);
        client.write(subs);
      
      });
    
  }).on('data', function (d) {
    console.log(""+d);
  });
}



function formatFeedCmd(cmd, args) {
  return JSON.stringify({
    cmd: cmd,
    args: args
  }) + '\n';
}



function encryptLogin(user, pass, keyfile) {
    var publicKey = fs.readFileSync(keyfile, 'utf8');
//    var keyObjFromPem = new keyutil.Key('pem', publicKey);

    if (!publicKey) {
	console.log('KEY error');
    }
    
    var auth = new Buffer.from(user).toString('base64');
    auth += ':';
    auth += new Buffer.from(pass).toString('base64');
    auth += ':';
    auth += new Buffer.from('' + new Date().getTime()).toString('base64');

    //    var data = Uint8Array.from(auth);
    var key_data = {
	key: publicKey,
	padding: crypto.constants.RSA_PKCS1_PADDING
    };
    var encrypted = crypto.publicEncrypt(key_data,Buffer.from(auth));
    return encrypted.toString("base64");

}


login(config.username, config.password , function ( error, sessionData) {
  if (!error) {
    subscribePrice(11, '101', sessionData);
  } else
      console.log(error);
});


