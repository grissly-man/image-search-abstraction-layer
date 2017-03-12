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
 * @api {get} /search/{terms}[?offset={n}] search
 * @apiDescription Searches images database for search terms
 * @apiName search
 * @apiGroup ImageSearch
 * @apiParam {string} terms Search terms for query
 * @apiParam {Number} [n] Optional field for pagination
 * @apiExample {url} Request-Example:
 *  https://image-meta-logan.herokuapp.com/search/kubrick
 * @apiSuccess {Object[]} results An array of search results, 10 at a time
 * @apiSuccessExample {json} Success-Response:
 *  [
 *      {"url":"https://s-media-cache-ak0.pinimg.com/originals/4f/f9/af/4ff9af484048e11ba1893dac0c0a54c0.jpg","snippet":"It’s hard to believe that a horror cinema masterpiece like Stanley Kubrick’s The Shining opened to mixed reviews, with outlets like Variety calling out Jack Nic","context":"https://www.pinterest.com/pin/171136854567062916/","thumbnail":"http://image-meta-logan.herokuapp.com/thumbs/9b054cee58a7a98dae7f.png"}
 *  ]
 * @apiExample {url} Request-Example (offset):
 *  https://image-meta-logan.herokuapp.com/search/dog?offset=1
 * @apiSuccessExample {json} Success-Response (offset):
 *  [
 *      {"url":"https://s-media-cache-ak0.pinimg.com/originals/ee/da/d7/eedad77b218ea45a939c4b55aae29071.jpg","snippet":"Zodiac signs give us insight into our futures, maybe it should also answer important questions in the present—such as, what is the best dog breed for us?","context":"https://www.pinterest.com/pin/431923420498485639/","thumbnail":"http://image-meta-logan.herokuapp.com/thumbs/b8eb0fcf1fb28750b6ba.png"},{"url":"https://s-media-cache-ak0.pinimg.com/originals/24/b1/8c/24b18c9ff7f13d835677421922fe2917.jpg","snippet":"One will supervise the cat room and the other will oversee the big dogs' care. Description from funnyclipspic.blogspot.com. I searched for this on bing.com/images","context":"https://www.pinterest.com/pin/308426274463308965/","thumbnail":"http://image-meta-logan.herokuapp.com/thumbs/a21484d67720a3a0a6d7.png"}
 *  ]
 * @apiError {Object} MongoError A bad request was sent to the database
 * @apiErrorExample {json} Error-Response: 
 *  {
 *      "name": "MongoError", "message": "Argument to $skip cannot be negative", "ok": 0, "errmsg" :"Argument to $skip cannot be negative", "code": 15956
 *  }
 */
app.get('/search/:terms', function(req, res) {
    mongo.connect(process.env.MONGO_URI, function(err, db) {
        if (err) return res.status(500).json(err);
        
        var images = db.collection('images');
        var searches = db.collection('searches');
        var offset = req.query.offset || 0;
        console.log(offset);
        
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
            { $sort: {score: {$meta: "textScore"}} },
            { $skip: offset * 10 }
        ]).limit(10).toArray(function(err, images) {
            done();
            if (err) return res.status(400).json(err);
            return res.json(images);
        });
        searches.insert({
            term: req.params.terms,
            when: new Date()
        }, done);
    });
});

/**
 * @api {get} /latest latest
 * @apiDescription Returns an array of the latest 10 searches, ordered by date
 * @apiName latest
 * @apiGroup ImageSearch
 * @apiParamExample {url} Request-Example:
 *  https://image-meta-logan.herokuapp.com/latest
 * @apiSuccess {Object[]} response An array of the ten latest searches, ordered by date
 * @apiSuccessExample {json} Success-Response:
 *  [
 *      {"term":"kubrick","when":"2017-03-12T18:10:14.454Z"},{"term":"oldest living cats","when":"2017-03-12T01:24:10.111Z"},{"term":"cat","when":"2017-03-12T00:45:12.675Z"},{"term":"cat","when":"2017-03-12T00:45:09.386Z"},{"term":"cat","when":"2017-03-12T00:45:07.296Z"},{"term":"pinterest","when":"2017-03-12T00:44:48.295Z"},{"term":"pinterest","when":"2017-03-12T00:44:33.543Z"},{"term":"pinterest","when":"2017-03-12T00:44:17.838Z"},{"term":"pinterest","when":"2017-03-12T00:43:31.185Z"},{"term":"pinterest","when":"2017-03-12T00:43:24.363Z"}
 *  ]
 */
app.get('/latest', function(req, res) {
    mongo.connect(process.env.MONGO_URI, function(err, db) {
        if (err) return res.status(500).end('An error occurred');
        
        var searches = db.collection('searches');
        searches.find({}, {_id: 0}).sort({when: -1}).limit(10).toArray(function(err, searches) {
            db.close();
            if (err) return res.status(500).json(err);
            
            return res.json(searches);
        });
    });
});

/**
 * @api {get} /add/{url} add
 * @apiDescription Scrapes a pinterest board, and adds items to the database. Creates a thumbnail hosted on server.
 * @apiName add
 * @apiGroup ImageSearch
 * @apiParam {string} url The URL of the pinterest board to be scraped
 * @apiParamExample {url} Request-Example:
 *  https://image-meta-logan.herokuapp.com/add/https://www.pinterest.com/bloglovin/food/
 * @apiSuccess {Object} response A JSON object representing the HTTP response code and message
 * @apiSuccessExample {json} Success-Response:
 *  {
 *      code: 200, message: "Images added successfully!"
 *  }
 */
app.get('/add/*', function(req, res) {
    var url = req.path.substr(5);
    console.log(url);
    scraper(url, function(err, metadata) {
        if (err || !metadata.jsonLd) {
            return res.status(500).json(err);
        }
        var urls = metadata.jsonLd[0].itemListElement;
        
        async.each(urls, function(url, cb) {
            scraper(url.url, function(err, metadata) {
                if (err) {
                    return res.status(500).json(err);
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
                return res.status(500).json(err);
            }
            
            return res.status(200).json({code: 200, message: "Images added successfully!"});
        });
    });
});

app.use('/', express.static(path.join(__dirname, 'doc')));
app.listen(process.env.PORT || 8080);