suggestor.js
============

**suggestor.js** is a suggestions-providing / @user mentions / #tagging / autocompletion library.

![screenshot](https://raw.github.com/spantaleev/suggestor.js/master/demo/screenshot.jpg)

It's similar to [Mention.js](https://github.com/jakiestfu/Mention.js), but does NOT depend on [Twitter Bootstrap and Typeahead](https://github.com/twitter/bootstrap).
It's also less hacky, more flexible and supposedly much less buggy.

**View the demo [here](http://devture.com/projects/suggestor.js)**.

Dependencies
------------

 * [jQuery](http://jquery.com/)


Features
--------

 * Twitter Bootstrap look, without depending on it
 * Configurable start delimiter (**@query**, **#query**, etc.)
 * Predefined HTML templates for easily implementing @user mentions and #tagging
 * Flexible suggestions data sources (local, lazily-loaded from remote, per-query-loaded from remote, etc.)
 * Matching the query against more than 1 keyword (user mentions can use username, first name, last name, etc.)
 * Very customizable - various parts can be replaced with your own logic


Intro
-----

Suggestions are provided by a local or remote (lazily-loaded) data set.
A data set is an array of objects, which looks like this:

`````javascript
[
	{"id": "github"},
	{"id": "gmail"},
	{"id": "facebook"},
	{"id": "twitter"}
]
`````

Each entry **must** contain an **id** field at least.
The **id** is the value that gets used when an entry is selected from the suggestions list.

Queries are matched against each entry's `id` in the data set.
A query for "#g" will match both "#github" and "#gmail".

A **keywords** field can be specified to allow matching against more values, not just **id**.

`````javascript
[
	{
		"id": "john.doe",
		"keywords": ["John", "Doe"]
	},
	{
		"id": "john.brown",
		"keywords": ["John", "Brown"]
	}
]
`````


Usage
-----

Initialization:

`````html
<script type="text/javascript" src="jquery.js"></script>

<script type="text/javascript" src="suggestor.js"></script>
<link rel="stylesheet" href="suggestor.css" />
`````


### Example 1

Simple tag suggestions, triggered by a #hash.
The predefined `tags` suggestions template is used, which influences how the suggestions list looks like.

`````javascript
(function () {
	var dataSet = [
		{"id": "github"},
		{"id": "gmail"},
		{"id": "facebook"},
		{"id": "twitter"}
	];

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"dataSource": new Suggestor.LocalDataSource(dataSet)
	});
})();
`````


### Example 2

In this case the query is matched against the id field and all other keywords.
"#social" would trigger suggestions for "#github", "#facebook" and "#twitter".

`````javascript
(function () {
	var dataSet = [
		{"id": "github", "keywords": ["github", "social", "version-control"]},
		{"id": "gmail", "keywords": ["gmail", "google", "mail"]},
		{"id": "facebook", "keywords": ["facebook", "social"]},
		{"id": "twitter", "keywords": ["twitter", "social"]}
	];

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"dataSource": new Suggestor.LocalDataSource(dataSet)
	});
})();
`````


### Example 3

In this case the number of suggestions is limited to 2.
"#social" would trigger suggestions for "#github" and "#facebook" ONLY, not for "#twitter".

`````javascript
(function () {
	var dataSet = [
		{"id": "github", "keywords": ["github", "social", "version-control"]},
		{"id": "gmail", "keywords": ["gmail", "google", "mail"]},
		{"id": "facebook", "keywords": ["facebook", "social"]},
		{"id": "twitter", "keywords": ["twitter", "social"]}
	];

	var suggestionsLimit = 2;

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"dataSource": new Suggestor.LocalDataSource(dataSet, suggestionsLimit)
	});
})();
`````


### Example 4

In this case a custom suggestions template is used.
The template uses `%placeholder%` variables, which come from the extra fields items in the data set have.

`````javascript
(function () {
	var dataSet = [
		{"id": "github", "users": "1+ million", "domain": "github.com"},
		{"id": "gmail", "users": "400+ million", "domain": "gmail.com"},
		{"id": "facebook", "users": "1+ billion", "domain": "facebook.com"},
		{"id": "twitter", "users": "200+ million", "domain": "twitter.com"}
	];

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplateHtml": "<img src='https://www.google.com/s2/favicons?domain=%domain%' /> <strong>%id%</strong> (%users%)",
		"dataSource": new Suggestor.LocalDataSource(dataSet)
	});
})();
`````


### Example 5

Similar to the example above, but uses a function to dynamically build the HTML for each suggestion entry.
This allows for more flexibility than mere `%placeholder%` substitution.

`````javascript
(function () {
	var dataSet = [
		{"id": "github", "users": "1+ million", "domain": "github.com"},
		{"id": "gmail", "users": "400+ million", "domain": "gmail.com"},
		{"id": "facebook", "users": "1+ billion", "domain": "facebook.com"},
		{"id": "twitter", "users": "200+ million", "domain": "twitter.com"}
	];

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplateHtml": function (item) {
			var imageUrl = 'https://www.google.com/s2/favicons?domain=' + item.domain;
			return "<img src='" + imageUrl + "' /> <strong>" + item.id + "</strong> (" + item.users + ")";
		},
		"dataSource": new Suggestor.LocalDataSource(dataSet)
	});
})();
`````


### Example 6

User mentions/suggestions triggered by @query (the start delimiter is "@").

The predefined `users` suggestions template is used for rendering the suggestions list.
The template requires each entry to have the following additional data fields: `image`, `name`.

`````javascript
(function () {
	var dataSet = [
		{
			"id": "john.doe",
			"keywords": ["John", "Doe"],
			"name": "John Doe",
			"image": "/path/to/photo-1.jpg"
		},
		{
			"id": "john.brown",
			"keywords": ["John", "Brown"],
			"name": "John Brown",
			"image": "/path/to/photo-2.jpg"
		},
		{
			"id": "jack.brown",
			"keywords": ["Jack", "Brown"],
			"name": "Jack Brown",
			"image": "/path/to/photo-3.jpg"
		}
	];

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "@",
		"suggestionsTemplate": "users",
		"dataSource": new Suggestor.LocalDataSource(dataSet)
	});
})();
`````


### Example 7

Lazily-loaded data set from a URL, instead of a local/hardcoded data set.
This is only about loading a complete static data-set lazily, not for doing per-query loading from remote. Check the other example for that.

`````javascript
(function () {
	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"dataSource": new Suggestor.LazilyLoadedDataSource(function (callback) {
			$.getJSON("/path/to/data-set-tags.json", function (response) {
				callback(response.tags);
			});
		})
	});
})();
`````

Supposing that `/path/to/data-set-tags.json` returns this response:

`````javascript
{
	"tags": [
		{"id": "github"},
		{"id": "gmail"},
		{"id": "facebook"},
		{"id": "twitter"}
	]
}
`````


### Example 8

Multiple instances for the same text field.

`````javascript
(function () {
	var dataSetTags = [
		{"id": "github"},
		{"id": "gmail"},
		{"id": "facebook"},
		{"id": "twitter"}
	];

	var dataSetUsernames = [
		{"id": "john.doe"},
		{"id": "john.brown"},
		{"id": "jack.brown"}
	];

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"dataSource": new Suggestor.LocalDataSource(dataSetTags)
	}).suggestor({
		"startDelimiter": "@", //this is the default value anyway
		"suggestionsTemplate": "basic", //this is the default value anyway
		"dataSource": new Suggestor.LocalDataSource(dataSetUsernames)
	});
})();
`````


### Example 9

Per-query data source.
No local matching is performed by default - the server is supposed to return only entries that match.
The server gets hit if the query has remained the same for **150 ms**. Results are cached and reused automatically.

`````javascript
(function () {
	var dataSource = new Suggestor.PerQueryDataSource(function (query, callback) {
		var uri = "/some/path/_suggest?query=" + encodeURIComponent(query);

		$.getJSON(uri, function (response) {
			callback(response.tags);
		});
	});

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"bufferringInterval": 150,
		"dataSource": dataSource
	});
})();
`````

Supposing that `/some/path/_suggest?query=g` returns a similar response:

`````javascript
{
	"tags": [
		{"id": "github"},
		{"id": "gmail"}
	]
}
`````


### Example 10

Advanced example that overrides the default suggestions utilization logic.

`````javascript
(function () {
	//Start from the default Suggestor.SuggestionsUtilizer class
	//and override it a little bit.
	var MyUtilizer = function () {};
	MyUtilizer.prototype = new Suggestor.SuggestionsUtilizer();
	MyUtilizer.prototype.utilize = function (item) {
		alert("You chose this suggestion: " + item.id);
		this.context.$textField.val(''); //let's clear the text field
	};

	var dataSet = [
		{"id": "github"},
		{"id": "gmail"},
		{"id": "facebook"},
		{"id": "twitter"}
	];

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"suggestionsUtilizer": new MyUtilizer(),
		"dataSource": new Suggestor.LocalDataSource(dataSet)
	});
})();
`````


### Example 11

Advanced example that overrides the default matching logic.

`````javascript
(function () {
	//Start from the default Suggestor.Matcher class and override it a little bit.
	var MyMatcher = function () {};
	MyMatcher.prototype = new Suggestor.Matcher();
	MyMatcher.prototype.matches = function (item, query) {
		//Case-sensitive "prefix" match. For longer queries only. Against the id field only.
		return (query.length >= 3 && (item.id.substring(0, query.length) === query));
	};

	var dataSet = [
		{"id": "github"},
		{"id": "gmail"},
		{"id": "facebook"},
		{"id": "twitter"}
	];

	var suggestionsLimit = null; //no limit

	$('#js-textarea-suggestor').suggestor({
		"startDelimiter": "#",
		"suggestionsTemplate": "tags",
		"dataSource": new Suggestor.LocalDataSource(dataSet, suggestionsLimit, new MyMatcher())
	});
})();
`````


Other configuration options
---------------------------

There are additional configuration settings (`allowEmptyQueries`, `autoCloseOnSingleExactMatch`, etc).

See `settings` in the source code.


Doing more
----------

**suggestor.js** is highly customizable.

Various parts can be replaced with your own custom version. Such are:
 * the QueryExtractor - inspects the text field and determines which part of it is the query
 * the DataSource - takes care of providing suggestions data (locally or remotely)
 * the Matcher (often used with a DataSource) - narrows down the suggestions list to only those items that match (may not be used if matching is done on the server-side)
 * the SuggestionsRenderer - renders the suggestions list/picker
 * the SuggestionsUtilizer - utilizes the selected suggestion value (changes the text field contents)

Look at the source code for more information.


Areas for improvement
---------------------

 * Empty delimiter querying - getting suggestions for any word without having to enter a delimiter
 * Automatic HTML-escaping of `%placeholder%` variables in templates
 * More examples and documentation
