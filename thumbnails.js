var sharp = require('sharp');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

/**
 * main - entry point. creates a thumbnail out of a url and returns the path
 * @param {string} url - the source image of the url
 * @param {fn} cb
 */
var main = function (url, cb) {
    if (!url) {
        return cb(new Error('no url'));
    }
    if (url.substr(0, 7) == 'http://') {
        getImg(http, url, function(err, path) {
            return cb(err, path);
        });
    } else if (url.substr(0, 8) == 'https://') {
        getImg(https, url, function(err, path) {
            return cb(err, path);
        });
    }
};

/**
 * getImg - Temporarily downloads image for the sake of creating thumbnail
 * @param {fn} method - either http or https
 * @param {string} url - source image url
 * @param {fn} cb
 */
function getImg(method, url, cb) {
    var imgName = url.split('/')[url.split('/').length - 1];
    if (imgName.split('.').length == 1) {
        imgName += '.png';  // append suffix
    }
    var dest = path.join(__dirname, 'tmp', imgName);
    var ws = fs.createWriteStream(dest);
    method.get(url, function(response) {
        response.on("error", function(err) {
            return cb(err);
        });
        
        response.pipe(ws);
        
        response.on('end', function(err) {
            if (err) {
                return cb(err);
            }
            
            return createThumb(dest, cb);
        });
    });
}

/**
 * createThumb - creates a 100 x 100 thumbnail from a file on the server
 * @param {string} _path - the path to the image
 * @param {fn} cb
 */
function createThumb(_path, cb) {
    getUniqueThumbName(function(err, imgName) {
        if (err) {
            return cb(err);
        }
        
        var dest = path.join(__dirname, 'thumbs', imgName);
        sharp(_path).resize(100, 100).toFile(dest, function(err) {
            if (err) {
                return cb(err);
            }
            
            return deleteTmpImage(_path, imgName, cb);
        });
    });
}

/**
 * getUniqueThumbName - recursively creates thumbnail name
 * @param {fn} cb
 */ 
function getUniqueThumbName(cb) {
    crypto.randomBytes(10, function(err, buffer) {
        if (err) {
            return cb(err);
        }
        
        var token = buffer.toString('hex') + '.png';
        fs.exists(path.join(__dirname, 'thumbs', token), function(exists) {
            if (exists) {
                return getUniqueThumbName(cb);
            }
            
            return cb(null, token);
        });
    });
}

/**
 * deleteTmpImage - clean up by clearing tmp files
 * @param {string} path - path to image to be deleted
 * @param {string} thumbName - the returned thumbName from the previous function
 * @param {fn} cb
 */
function deleteTmpImage(path, thumbName, cb) {
    fs.unlink(path, function(err) {
        return cb(err, thumbName);
    });
}

/*
main(process.argv[2], function(err, pathname) {
    if (err) {
        return console.error(err);
    }
    
    return console.log(pathname);
});
*/

module.exports = main;