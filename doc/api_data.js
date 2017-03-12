define({ "api": [
  {
    "type": "get",
    "url": "/add/{url}",
    "title": "add",
    "description": "<p>Scrapes a pinterest board, and adds items to the database. Creates a thumbnail hosted on server.</p>",
    "name": "add",
    "group": "ImageSearch",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "url",
            "description": "<p>The URL of the pinterest board to be scraped</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "https://image-meta-logan.herokuapp.com/add/https://www.pinterest.com/bloglovin/food/",
          "type": "url"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "response",
            "description": "<p>A JSON object representing the HTTP response code and message</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "{\n    code: 200, message: \"Images added successfully!\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./app.js",
    "groupTitle": "ImageSearch"
  },
  {
    "type": "get",
    "url": "/latest",
    "title": "latest",
    "description": "<p>Returns an array of the latest 10 searches, ordered by date</p>",
    "name": "latest",
    "group": "ImageSearch",
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "https://image-meta-logan.herokuapp.com/latest",
          "type": "url"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "response",
            "description": "<p>An array of the ten latest searches, ordered by date</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "[\n    {\"term\":\"kubrick\",\"when\":\"2017-03-12T18:10:14.454Z\"},{\"term\":\"oldest living cats\",\"when\":\"2017-03-12T01:24:10.111Z\"},{\"term\":\"cat\",\"when\":\"2017-03-12T00:45:12.675Z\"},{\"term\":\"cat\",\"when\":\"2017-03-12T00:45:09.386Z\"},{\"term\":\"cat\",\"when\":\"2017-03-12T00:45:07.296Z\"},{\"term\":\"pinterest\",\"when\":\"2017-03-12T00:44:48.295Z\"},{\"term\":\"pinterest\",\"when\":\"2017-03-12T00:44:33.543Z\"},{\"term\":\"pinterest\",\"when\":\"2017-03-12T00:44:17.838Z\"},{\"term\":\"pinterest\",\"when\":\"2017-03-12T00:43:31.185Z\"},{\"term\":\"pinterest\",\"when\":\"2017-03-12T00:43:24.363Z\"}\n]",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./app.js",
    "groupTitle": "ImageSearch"
  },
  {
    "type": "get",
    "url": "/search/{terms}[?offset={n}]",
    "title": "search",
    "description": "<p>Searches images database for search terms</p>",
    "name": "search",
    "group": "ImageSearch",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "terms",
            "description": "<p>Search terms for query</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "n",
            "description": "<p>Optional field for pagination</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Request-Example:",
        "content": "https://image-meta-logan.herokuapp.com/search/kubrick",
        "type": "url"
      },
      {
        "title": "Request-Example (offset):",
        "content": "https://image-meta-logan.herokuapp.com/search/dog?offset=1",
        "type": "url"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "results",
            "description": "<p>An array of search results, 10 at a time</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "[\n    {\"url\":\"https://s-media-cache-ak0.pinimg.com/originals/4f/f9/af/4ff9af484048e11ba1893dac0c0a54c0.jpg\",\"snippet\":\"It’s hard to believe that a horror cinema masterpiece like Stanley Kubrick’s The Shining opened to mixed reviews, with outlets like Variety calling out Jack Nic\",\"context\":\"https://www.pinterest.com/pin/171136854567062916/\",\"thumbnail\":\"http://image-meta-logan.herokuapp.com/thumbs/9b054cee58a7a98dae7f.png\"}\n]",
          "type": "json"
        },
        {
          "title": "Success-Response (offset):",
          "content": "[\n    {\"url\":\"https://s-media-cache-ak0.pinimg.com/originals/ee/da/d7/eedad77b218ea45a939c4b55aae29071.jpg\",\"snippet\":\"Zodiac signs give us insight into our futures, maybe it should also answer important questions in the present—such as, what is the best dog breed for us?\",\"context\":\"https://www.pinterest.com/pin/431923420498485639/\",\"thumbnail\":\"http://image-meta-logan.herokuapp.com/thumbs/b8eb0fcf1fb28750b6ba.png\"},{\"url\":\"https://s-media-cache-ak0.pinimg.com/originals/24/b1/8c/24b18c9ff7f13d835677421922fe2917.jpg\",\"snippet\":\"One will supervise the cat room and the other will oversee the big dogs' care. Description from funnyclipspic.blogspot.com. I searched for this on bing.com/images\",\"context\":\"https://www.pinterest.com/pin/308426274463308965/\",\"thumbnail\":\"http://image-meta-logan.herokuapp.com/thumbs/a21484d67720a3a0a6d7.png\"}\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "Object",
            "optional": false,
            "field": "MongoError",
            "description": "<p>A bad request was sent to the database</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response: ",
          "content": "{\n    \"name\": \"MongoError\", \"message\": \"Argument to $skip cannot be negative\", \"ok\": 0, \"errmsg\" :\"Argument to $skip cannot be negative\", \"code\": 15956\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./app.js",
    "groupTitle": "ImageSearch"
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./doc/main.js",
    "group": "_home_ubuntu_workspace_API_Image_Search_Abstraction_Layer_doc_main_js",
    "groupTitle": "_home_ubuntu_workspace_API_Image_Search_Abstraction_Layer_doc_main_js",
    "name": ""
  }
] });
