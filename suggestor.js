/** suggestor.js 1.1.1 - BSD licensed - https://github.com/spantaleev/suggestor.js **/

(function ($) {
	window.Suggestor = {};

	var preg_quote = function (str, delimiter) {
		//Source: http://phpjs.org/functions/preg_quote/
		// +   original by: booeyOH
		// +   improved by: Ates Goral (http://magnetiq.com)
		// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// +   bugfixed by: Onno Marsman
		// +   improved by: Brett Zamir (http://brett-zamir.me)
		return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
	};

	var KEY_CODE = {"TAB": 9, "ENTER": 13, "ESCAPE": 27, "ARROW_UP": 38, "ARROW_DOWN": 40};

	Suggestor.TextFieldHelper = function () {};
	Suggestor.TextFieldHelper.STOP_CHARS_LIST = [" ", ",", "?", "!"];
	Suggestor.TextFieldHelper.prototype = {
		getState: function ($textField, startDelimiter) {
			if (startDelimiter.length !== 1) {
				throw new Error("Only single-character delimiters are supported, not: " + startDelimiter);
			}

			var cursorPosition = $textField[0].selectionStart,
				queryStartPosition,
				queryEndPosition = cursorPosition,
				text = $textField.val(),
				startDelimiterFound = false,
				query = null;

			for (queryStartPosition = cursorPosition - 1; queryStartPosition >= 0; --queryStartPosition) {
				if (Suggestor.TextFieldHelper.STOP_CHARS_LIST.indexOf(text[queryStartPosition]) !== -1) {
					break;
				}

				if (text[queryStartPosition] === startDelimiter) {
					startDelimiterFound = true;
					break;
				}
			}

			if (startDelimiterFound) {
				query = text.substring(queryStartPosition + 1);
				query = query.replace(/^(.+?)([\s,!?])(.|\n)*/m, "$1");
			}

			return {
				"text": text,
				"cursorPosition": cursorPosition,
				"queryStartPosition": queryStartPosition,
				"queryEndPosition": queryEndPosition,
				"query": query
			};
		}
	};

	Suggestor.QueryExtractor = function (textFieldHelper) {
		this.textFieldHelper = textFieldHelper;
		this.context = null;
	};
	Suggestor.QueryExtractor.prototype = {
		initialize: function (context) {
			this.context = context;
		},

		getQuery: function () {
			return this.textFieldHelper.getState(this.context.$textField, this.context.settings.startDelimiter).query;
		}
	};

	Suggestor.SuggestionsUtilizer = function (textFieldHelper) {
		this.textFieldHelper = textFieldHelper;
		this.context = null;
	};
	Suggestor.SuggestionsUtilizer.prototype = {
		initialize: function (context) {
			this.context = context;
		},

		utilize: function (suggestionItem) {
			var $textField = this.context.$textField,
				state = this.textFieldHelper.getState($textField, this.context.settings.startDelimiter),
				textBefore = state.text.substring(0, state.queryStartPosition),
				textAfter = state.text.substring(state.queryEndPosition),
				suggestionValue = (this.context.settings.startDelimiter + suggestionItem[this.context.settings.insertKey]);

			this.context.$textField.val(textBefore + suggestionValue + textAfter);
			$textField[0].selectionStart = $textField[0].selectionEnd = (textBefore + suggestionValue).length;

			//Restore focus to the text field, if it got lost (due to a suggestions list click)
			$textField.focus();
		}
	};

	Suggestor.SuggestionsRenderer = function () {};
	Suggestor.SuggestionsRenderer.TEMPLATES = {
		"basic": "%id%",
		"tags": "#%id%",
		"users": "<img src='%image%' class='suggestor-image' /><strong>%name%</strong> <span class='suggestor-picker-tooltip'>@%id%</span>"
	};
	Suggestor.SuggestionsRenderer.prototype = {
		initialize: function (context) {
			var settings = context.settings;

			if (settings.suggestionsTemplateHtml === null) {
				settings.suggestionsTemplateHtml = Suggestor.SuggestionsRenderer.TEMPLATES[settings.suggestionsTemplate];
			}

			this.template = settings.suggestionsTemplateHtml; //string or function
			this.context = context;
			this.items = null;
			this.currentIndex = 0;
			this.openStatus = false;
			this.$container = $($.parseHTML('<div class="suggestor-container"></div>'));
			this.$container.insertAfter(context.$textField);

			this._setupEventHandlers();
		},

		isOpen: function () {
			return this.openStatus;
		},

		set: function (items) {
			this.items = items;
			this.currentIndex = 0;
		},

		open: function () {
			var self = this;

			var createHtml = function (items, selectedIndex) {
				var html = '';
				html += '<ul class="js-suggestor-picker suggestor-picker">';
				$.each(items, function (idx, item) {
					var entryClass = 'js-suggestor-suggestion js-suggestor-suggestion-' + idx + ' suggestor-suggestion';
					if (idx === selectedIndex) {
						entryClass += ' suggestor-suggestion-active';
					}
					html += '<li class="' + entryClass + '" data-index="' + idx + '"><a>' + self._renderItem(item) + '</a></li>';
				});
				html += '</ul>';
				return html;
			};

			this.openStatus = true;
			this.$container.html(createHtml(this.items, this.currentIndex));

			this.$container.css({
				"top": this.context.$textField.position().top + this.context.$textField.outerHeight(),
				"left": this.context.$textField.position().left
			});
		},

		close: function () {
			this.currentIndex = 0;
			this.openStatus = false;
			this.$container.find('.js-suggestor-picker').remove();
		},

		_moveUp: function () {
			this.currentIndex = (this.currentIndex > 0 ? this.currentIndex - 1 : this.items.length - 1);
			this._updateActive();
			this._scrollActiveIntoView();
		},

		_moveDown: function () {
			this.currentIndex = (this.currentIndex >= this.items.length - 1 ? 0 : this.currentIndex + 1);
			this._updateActive();
			this._scrollActiveIntoView();
		},

		_getCurrentItem: function () {
			if (this.items === null) {
				return null;
			}
			return (this.items[this.currentIndex] ? this.items[this.currentIndex] : null);
		},

		_selectCurrentItem: function () {
			this.context.onItemSelected(this._getCurrentItem());
			this.close();
		},

		_setupEventHandlers: function () {
			var self = this;

			this.context.$textField.on('keydown', function (ev) {
				if (!self.isOpen()) {
					return;
				}

				if (ev.keyCode === KEY_CODE.ARROW_UP) {
					ev.preventDefault();
					self._moveUp();
				} else if (ev.keyCode === KEY_CODE.ARROW_DOWN) {
					ev.preventDefault();
					self._moveDown();
				} else if (ev.keyCode === KEY_CODE.ESCAPE) {
					ev.preventDefault();
					self.close();
				} else if (ev.keyCode === KEY_CODE.ENTER || ev.keyCode === KEY_CODE.TAB) {
					ev.preventDefault();
					self._selectCurrentItem();
				}
			});

			this.$container.on('mouseover', '.js-suggestor-suggestion', function () {
				self.currentIndex = $(this).data('index');
				self._updateActive();
			});

			this.$container.on('click', '.js-suggestor-suggestion', function (ev) {
				ev.preventDefault();
				self._selectCurrentItem();
			});
		},

		_renderItem: function (item) {
			if (typeof(this.template) === 'function') {
				return this.template(item);
			}

			var html = this.template,
				regexVariables = /%(.+?)%/;
			while (match = regexVariables.exec(html)) {
				html = html.replace(match[0], item[match[1]]);
			}
			return html;
		},

		_updateActive: function () {
			this.$container.find('.suggestor-suggestion-active').removeClass('js-suggestor-suggestion-active suggestor-suggestion-active');
			this.$container.find('.js-suggestor-suggestion-' + this.currentIndex).addClass('js-suggestor-suggestion-active suggestor-suggestion-active');
		},

		_scrollActiveIntoView: function () {
			var $item = this.$container.find('.js-suggestor-suggestion-active'),
				$list = $item.closest('ul'),
				listMaxHeight = parseInt($list.css('maxHeight'), 10);

			if (listMaxHeight) {
				//Item may be below/above the viewport, respectively. Scroll it into view.
				if (($item.offset().top > $list.offset().top + listMaxHeight) || ($item.offset().top < $list.offset().top)) {
					$list.scrollTop($item.offset().top - $list.offset().top);
				}
			}
		}
	};

	Suggestor.Matcher = function () {};
	Suggestor.Matcher.prototype = {
		matches: function (item, query) {
			if (typeof(item.keywords) === 'undefined') {
				item.keywords = [];
			}

			//Always match against the id field.
			item.keywords.push(item.id);

			var isMatch = false;
			$.each(item.keywords, function (_idx, keyword) {
				if ((new RegExp("^" + preg_quote(query), "i")).test(keyword)) {
					isMatch = true;
					return false;
				}
			});
			return isMatch;
		}
	};

	Suggestor.LocalDataSource = function (items, limit, matcher) {
		this.items = items;
		this.limit = limit;
		this.matcher = (typeof(matcher) === 'undefined' ? new Suggestor.Matcher() : matcher);
	};
	Suggestor.LocalDataSource.prototype = {
		suggest: function (query, callback) {
			var self = this,
				itemsCount = 0;

			var items = $.grep(this.items, function (item) {
				if (self.limit && itemsCount >= self.limit) {
					return false;
				}

				if (self.matcher === null || self.matcher.matches(item, query)) {
					itemsCount += 1;
					return true;
				}

				return false;
			});

			callback(items);
		}
	};

	Suggestor.LazilyLoadedDataSource = function (dataLoader, matcher) {
		this.dataLoader = dataLoader;
		this.matcher = (typeof(matcher) === 'undefined' ? new Suggestor.Matcher() : matcher);
		this.localDataSource = null;
		this.isLoading = false;
		this.onDataSourceLoaded = function () {};
	};
	Suggestor.LazilyLoadedDataSource.prototype = {
		suggest: function (query, callback) {
			if (this.localDataSource === null) {
				var self = this;

				//Overwrite this for each new query we get while loading, so that when the data source loads,
				//we'll provide suggestions for the last query that we got, not for the first one.
				this.onDataSourceLoaded = function () {
					self.localDataSource.suggest(query, callback);
				};

				if (!this.isLoading) {
					this.isLoading = true;
					this.dataLoader(function (items) {
						self.localDataSource = new Suggestor.LocalDataSource(items, self.matcher);
						self.onDataSourceLoaded();
					});
				}
			} else {
				this.localDataSource.suggest(query, callback);
			}
		}
	};

	Suggestor.PerQueryDataSource = function (dataLoader, matcher) {
		this.dataLoader = dataLoader;
		this.matcher = (typeof(matcher) === 'undefined' ? null : matcher);
		this.cache = {};
		this.lastQuery = null;
	};
	Suggestor.PerQueryDataSource.prototype = {
		suggest: function (query, callback) {
			this.lastQuery = query;

			if (query in this.cache) {
				this._suggest(query, this.cache[query], callback);
			} else {
				var self = this;
				this.dataLoader.call(this, query, function (items) {
					self.cache[query] = items;
					self._suggest(query, self.cache[query], callback);
				});
			}
		},

		_suggest: function (query, items, callback) {
			//If the query changed, ignore this "out-of-order" response.
			if (this.lastQuery === query) {
				var ds = new Suggestor.LocalDataSource(items, null, this.matcher);
				ds.suggest(query, callback);
			}
		}
	};

	var validateSettings = function (settings) {
		if (!settings.dataSource) {
			throw new Error("At least the dataSource parameter needs to be specified.");
		}
	};

	var validateItems = function (items) {
		$.each(items, function (_idx, item) {
			if (typeof(item.id) === 'undefined') {
				throw new Error("Items need to have an id field at least.");
			}
		});
	};

	var setupEventHandlers = function ($textField, settings) {
		var lastQuery = null,
			bufferringQueue = null;

		$textField.on('keyup change', function () {
			window.clearTimeout(bufferringQueue);

			var query = settings.queryExtractor.getQuery();
			if (query === null) {
				lastQuery = null;
				settings.suggestionsRenderer.close();
				return;
			}
			if (query === '' && !settings.allowEmptyQueries) {
				lastQuery = query;
				settings.suggestionsRenderer.close();
				return;
			}

			if (query === lastQuery) {
				return;
			}

			var processQuery = function () {
				lastQuery = query;
				settings.dataSource.suggest(query, function (items) {
					validateItems(items);

					if (items.length === 0) {
						settings.suggestionsRenderer.close();
					} else if (items.length === 1 && items[0].id === query && settings.autoCloseOnSingleExactMatch) {
						settings.suggestionsRenderer.close();
					} else {
						settings.suggestionsRenderer.set(items);
						settings.suggestionsRenderer.open();
					}
				});
			};

			bufferringQueue = window.setTimeout(processQuery, settings.bufferringInterval);
		});

		$textField.on('blur', function () {
			//This text field blur event may be caused by a click on an item in the suggestions container.
			//Delay closing the suggestions window a bit, so that such a click event would get through.
			window.setTimeout(function () {
				settings.suggestionsRenderer.close();
			}, 1000);
		});
	};

	var registerTextField = function ($textField, options) {
		var settings = $.extend({}, {
			//The (single character) delimiter that identifies where a suggestion starts
			"startDelimiter": "@",

			//The json key to insert
			"insertKey": "id",

			//Specifies whether to allow empty queries (with only a prefix) to trigger suggestions (e.g. `@`, as opposed to `@<character>`)
			"allowEmptyQueries": false,

			//Specifies whether the suggestions list should close when the query matches (`item.id === query`) a single item only
			"autoCloseOnSingleExactMatch": true,

			//Time to wait (in milliseconds) before suggestions are requested.
			//Useful for rate-limiting the number of requests to the data-source.
			"bufferringInterval": 0,

			//A textarea/input query extractor - see Suggestor.QueryExtractor
			"queryExtractor": new Suggestor.QueryExtractor(new Suggestor.TextFieldHelper()),

			//Template to use, from the predefined in Suggestor.SuggestionsRenderer.TEMPLATES
			"suggestionsTemplate": "basic",

			//Template HTML, in case `suggestionsTemplate` is not enough and you want a custom one
			"suggestionsTemplateHtml": null,

			//A renderer/picker object - see Suggestor.SuggestionsRenderer
			"suggestionsRenderer": new Suggestor.SuggestionsRenderer(),

			//A textarea/input suggestion utilizer - see Suggestor.SuggestionsUtilizer
			"suggestionsUtilizer": new Suggestor.SuggestionsUtilizer(new Suggestor.TextFieldHelper())
		}, options);

		validateSettings(settings);

		var context = {
			$textField: $textField,
			settings: settings,
			onItemSelected: function (item) {
				if (item !== null) {
					settings.suggestionsUtilizer.utilize(item);
				}
			}
		};

		settings.queryExtractor.initialize(context);
		settings.suggestionsRenderer.initialize(context);
		settings.suggestionsUtilizer.initialize(context);

		setupEventHandlers($textField, settings);
	};

	$.fn.suggestor = function (options) {
		$(this).each(function () {
			registerTextField($(this), options);
		});
		return this;
	};
})(jQuery);
