var express = require('express');
var mongo = require('mongodb').MongoClient;
var scraper = require('html-metadata');
var thumb = require('./thumbnails');
var path = require('path');
var async = require("async");
var URL = require('url');
var app = express();

app.use('/thumbs', express.static(path.join(__dirname, 'thumbs')));

/**
 * accepts a string of search terms and returns the results
 * ordered by textscore
 */
app.get('/search/:terms', function(req, res) {
    mongo.connect(process.env.MONGO_URI, function(err, db) {
        if (err) return res.status(500).end('An error occurred');
        
        var images = db.collection('images');
        var searches = db.collection('searches');
        
        // close db when insert and aggregation have both finished
        var count = 0;
        var done = function() {
            if (++count == 2) {
                db.close();
            }
        };
        
        images.aggregate([
            { $match: { $text: { $search: req.params.terms} } },
            { $project: {_id: 0, context: 1, snippet: 1, url: 1, thumbnail: 1} },
            { $sort: {score: {$meta: "textScore"}} }
        ]).limit(50).toArray(function(err, images) {
            done();
            if (err) return res.status(500).json(err);
            return res.json(images);
        });
        searches.insert({
            term: req.params.terms,
            when: new Date()
        }, done);
    });
});

/**
 * returns the latest searches, ordered by date, limited to ten
 */
app.get('/latest', function(req, res) {
    mongo.connect(process.env.MONGO_URI, function(err, db) {
        if (err) return res.status(500).end('An error occurred');
        
        var searches = db.collection('searches');
        searches.find({}, {_id: 0}).sort({date: -1}).limit(10).toArray(function(err, searches) {
            db.close();
            if (err) return res.status(500).end('An error occurred');
            
            return res.json(searches);
        })
    });
});

/**
 * Intended to scrape Pinterest users and add thumbnails to thumbs
 */
app.get('/add/*', function(req, res) {
    var url = req.path.substr(5);
    console.log(url);
    scraper(url, function(err, metadata) {
        if (err || !urls) {
            return res.status(500).end('An error occurred');
        }
        var urls = metadata.jsonLd[0].itemListElement;
        
        async.each(urls, function(url, cb) {
            
            scraper(url.url, function(err, metadata) {
                if (err) {
                    return res.status(500).end('an error occurred');
                }
                
                thumb(metadata.jsonLd.image, function(err, thumbName) {
                    if (err) {
                        return cb(err);
                    }
                    mongo.connect(process.env.MONGO_URI, function(err, db) {
                        if (err) {
                            db.close();
                            return cb(err);
                        }
                        
                        var images = db.collection('images');
                        images.insert({
                            url: metadata.jsonLd.image,
                            snippet: metadata.general.description,
                            context: metadata.general.canonical,
                            thumbnail: URL.format({protocol: req.protocol, host: req.get('host'), pathname: "thumbs/" + thumbName})
                        }, function(err, data) {
                            db.close();
                            return cb(err, data);
                        });
                    });
                });
            });
        }, function(err, data) {
            if (err) {
                return res.status(500).end('err');
            }
            
            return res.status(200).json(data);
        });
    });
});

app.use('/', express.static(path.join(__dirname, 'out', 'image-search-abstraction-layer', '1.0.0')));
app.listen(process.env.PORT || 8080);