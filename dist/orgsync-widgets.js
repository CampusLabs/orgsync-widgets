((function (root, factory) {
  if (typeof define === 'function' && define.amd) define(factory);
  else root.OrgSyncWidgets = factory();
})(this, function () { 
  return (function () {

/**
 * @license almond 0.2.8 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            jsSuffixRegExp = /\.js$/,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.pkgs && hasProp(config.pkgs, baseParts[0]) &&
                    jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        var i, pkgs;
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            pkgs = config.packages;
            if (config.packages) {
                config.pkgs = {};
                for (i = 0; i < pkgs.length; i++) {
                    config.pkgs[pkgs[i].name || pkgs[i]] = true;
                }
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

/*!
 * jQuery JavaScript Library v1.10.2
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:48Z
 */
(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//
var
	// The deferred used on DOM ready
	readyList,

	// A central reference to the root jQuery(document)
	rootjQuery,

	// Support: IE<10
	// For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
	core_strundefined = typeof undefined,

	// Use the correct document accordingly with window argument (sandbox)
	location = window.location,
	document = window.document,
	docElem = document.documentElement,

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// [[Class]] -> type pairs
	class2type = {},

	// List of deleted data cache ids, so we can reuse them
	core_deletedIds = [],

	core_version = "1.10.2",

	// Save a reference to some core methods
	core_concat = core_deletedIds.concat,
	core_push = core_deletedIds.push,
	core_slice = core_deletedIds.slice,
	core_indexOf = core_deletedIds.indexOf,
	core_toString = class2type.toString,
	core_hasOwn = class2type.hasOwnProperty,
	core_trim = core_version.trim,

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Used for matching numbers
	core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

	// Used for splitting on whitespace
	core_rnotwhite = /\S+/g,

	// Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

	// JSON RegExp
	rvalidchars = /^[\],:{}\s]*$/,
	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
	rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
	rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	},

	// The ready event handler
	completed = function( event ) {

		// readyState === "complete" is good enough for us to call the dom ready in oldIE
		if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
			detach();
			jQuery.ready();
		}
	},
	// Clean-up method for dom ready events
	detach = function() {
		if ( document.addEventListener ) {
			document.removeEventListener( "DOMContentLoaded", completed, false );
			window.removeEventListener( "load", completed, false );

		} else {
			document.detachEvent( "onreadystatechange", completed );
			window.detachEvent( "onload", completed );
		}
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: core_version,

	constructor: jQuery,
	init: function( selector, context, rootjQuery ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return core_slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	ready: function( fn ) {
		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	},

	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: core_push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	// Non-digits removed to match rinlinejQuery
	expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

	noConflict: function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( !document.body ) {
			return setTimeout( jQuery.ready );
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	isWindow: function( obj ) {
		/* jshint eqeqeq: false */
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return String( obj );
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ core_toString.call(obj) ] || "object" :
			typeof obj;
	},

	isPlainObject: function( obj ) {
		var key;

		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!core_hasOwn.call(obj, "constructor") &&
				!core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Support: IE<9
		// Handle iteration over inherited properties before own properties.
		if ( jQuery.support.ownLast ) {
			for ( key in obj ) {
				return core_hasOwn.call( obj, key );
			}
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		for ( key in obj ) {}

		return key === undefined || core_hasOwn.call( obj, key );
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	error: function( msg ) {
		throw new Error( msg );
	},

	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	parseHTML: function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}
		context = context || document;

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[1] ) ];
		}

		parsed = jQuery.buildFragment( [ data ], context, scripts );
		if ( scripts ) {
			jQuery( scripts ).remove();
		}
		return jQuery.merge( [], parsed.childNodes );
	},

	parseJSON: function( data ) {
		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		if ( data === null ) {
			return data;
		}

		if ( typeof data === "string" ) {

			// Make sure leading/trailing whitespace is removed (IE can't handle it)
			data = jQuery.trim( data );

			if ( data ) {
				// Make sure the incoming data is actual JSON
				// Logic borrowed from http://json.org/json2.js
				if ( rvalidchars.test( data.replace( rvalidescape, "@" )
					.replace( rvalidtokens, "]" )
					.replace( rvalidbraces, "")) ) {

					return ( new Function( "return " + data ) )();
				}
			}
		}

		jQuery.error( "Invalid JSON: " + data );
	},

	// Cross-browser xml parsing
	parseXML: function( data ) {
		var xml, tmp;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		try {
			if ( window.DOMParser ) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString( data , "text/xml" );
			} else { // IE
				xml = new ActiveXObject( "Microsoft.XMLDOM" );
				xml.async = "false";
				xml.loadXML( data );
			}
		} catch( e ) {
			xml = undefined;
		}
		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	noop: function() {},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Use native String.trim function wherever possible
	trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
		function( text ) {
			return text == null ?
				"" :
				core_trim.call( text );
		} :

		// Otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				core_push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( core_indexOf ) {
				return core_indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var l = second.length,
			i = first.length,
			j = 0;

		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var retVal,
			ret = [],
			i = 0,
			length = elems.length;
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
		return core_concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = core_slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			length = elems.length,
			bulk = key == null;

		// Sets many values
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
			}

		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {
				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < length; i++ ) {
					fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
				}
			}
		}

		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				length ? fn( elems[0], key ) : emptyGet;
	},

	now: function() {
		return ( new Date() ).getTime();
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations.
	// Note: this method belongs to the css module but it's needed here for the support module.
	// If support gets modularized, this method should be moved back to the css module.
	swap: function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.apply( elem, args || [] );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );

		// If IE event model is used
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
/*!
 * Sizzle CSS Selector Engine v1.10.2
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03
 */
(function( window, undefined ) {

var i,
	support,
	cachedruns,
	Expr,
	getText,
	isXML,
	compile,
	outermostContext,
	sortInput,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	hasDuplicate = false,
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rsibling = new RegExp( whitespace + "*[+~]" ),
	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && context.parentNode || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key += " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent.attachEvent && parent !== parent.top ) {
		parent.attachEvent( "onbeforeunload", function() {
			setDocument();
		});
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select><option selected=''></option></select>";

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {

			// Support: Opera 10-12/IE8
			// ^= $= *= and empty values
			// Should not select anything
			// Support: Windows 8 Native Apps
			// The type attribute is restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "t", "" );

			if ( div.querySelectorAll("[t^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = rnative.test( docElem.contains ) || docElem.compareDocumentPosition ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = docElem.compareDocumentPosition ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b );

		if ( compare ) {
			// Disconnected nodes
			if ( compare & 1 ||
				(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

				// Choose the first element that is related to our preferred document
				if ( a === doc || contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === doc || contains(preferredDoc, b) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		}

		// Not directly comparable, sort on existence of method
		return a.compareDocumentPosition ? -1 : 1;
	} :
	function( a, b ) {
		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Parentless nodes are either documents or disconnected
		} else if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val === undefined ?
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null :
		val;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] && match[4] !== undefined ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var data, cache, outerCache,
				dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
							if ( (data = cache[1]) === true || data === cachedruns ) {
								return data === true;
							}
						} else {
							cache = outerCache[ dir ] = [ dirkey ];
							cache[1] = matcher( elem, context, xml ) || cachedruns;
							if ( cache[1] === true ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	// A counter to specify which element is currently being matched
	var matcherCachedRuns = 0,
		bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;
				}
				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && context.parentNode || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector )
	);
	return results;
}

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return (val = elem.getAttributeNode( name )) && val.specified ?
				val.value :
				elem[ name ] === true ? name.toLowerCase() : null;
		}
	});
}

jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,
		// Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};
jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],
								fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});
jQuery.support = (function( support ) {

	var all, a, input, select, fragment, opt, eventName, isSupported, i,
		div = document.createElement("div");

	// Setup
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// Finish early in limited (non-browser) environments
	all = div.getElementsByTagName("*") || [];
	a = div.getElementsByTagName("a")[ 0 ];
	if ( !a || !a.style || !all.length ) {
		return support;
	}

	// First batch of tests
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];

	a.style.cssText = "top:1px;float:left;opacity:.5";

	// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
	support.getSetAttribute = div.className !== "t";

	// IE strips leading whitespace when .innerHTML is used
	support.leadingWhitespace = div.firstChild.nodeType === 3;

	// Make sure that tbody elements aren't automatically inserted
	// IE will insert them into empty tables
	support.tbody = !div.getElementsByTagName("tbody").length;

	// Make sure that link elements get serialized correctly by innerHTML
	// This requires a wrapper element in IE
	support.htmlSerialize = !!div.getElementsByTagName("link").length;

	// Get the style information from getAttribute
	// (IE uses .cssText instead)
	support.style = /top/.test( a.getAttribute("style") );

	// Make sure that URLs aren't manipulated
	// (IE normalizes it by default)
	support.hrefNormalized = a.getAttribute("href") === "/a";

	// Make sure that element opacity exists
	// (IE uses filter instead)
	// Use a regex to work around a WebKit issue. See #5145
	support.opacity = /^0.5/.test( a.style.opacity );

	// Verify style float existence
	// (IE uses styleFloat instead of cssFloat)
	support.cssFloat = !!a.style.cssFloat;

	// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
	support.checkOn = !!input.value;

	// Make sure that a selected-by-default option has a working selected property.
	// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
	support.optSelected = opt.selected;

	// Tests for enctype support on a form (#6743)
	support.enctype = !!document.createElement("form").enctype;

	// Makes sure cloning an html5 element does not cause problems
	// Where outerHTML is undefined, this still works
	support.html5Clone = document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>";

	// Will be defined later
	support.inlineBlockNeedsLayout = false;
	support.shrinkWrapBlocks = false;
	support.pixelPosition = false;
	support.deleteExpando = true;
	support.noCloneEvent = true;
	support.reliableMarginRight = true;
	support.boxSizingReliable = true;

	// Make sure checked status is properly cloned
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE<9
	try {
		delete div.test;
	} catch( e ) {
		support.deleteExpando = false;
	}

	// Check if we can trust getAttribute("value")
	input = document.createElement("input");
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";

	// #11217 - WebKit loses check when the name is after the checked attribute
	input.setAttribute( "checked", "t" );
	input.setAttribute( "name", "t" );

	fragment = document.createDocumentFragment();
	fragment.appendChild( input );

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	support.appendChecked = input.checked;

	// WebKit doesn't clone checked state correctly in fragments
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Opera does not clone events (and typeof div.attachEvent === undefined).
	// IE9-10 clones events bound via attachEvent, but they don't trigger with .click()
	if ( div.attachEvent ) {
		div.attachEvent( "onclick", function() {
			support.noCloneEvent = false;
		});

		div.cloneNode( true ).click();
	}

	// Support: IE<9 (lack submit/change bubble), Firefox 17+ (lack focusin event)
	// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
	for ( i in { submit: true, change: true, focusin: true }) {
		div.setAttribute( eventName = "on" + i, "t" );

		support[ i + "Bubbles" ] = eventName in window || div.attributes[ eventName ].expando === false;
	}

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Support: IE<9
	// Iteration over object's inherited properties before its own.
	for ( i in jQuery( support ) ) {
		break;
	}
	support.ownLast = i !== "0";

	// Run tests that need a body at doc ready
	jQuery(function() {
		var container, marginDiv, tds,
			divReset = "padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",
			body = document.getElementsByTagName("body")[0];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

		body.appendChild( container ).appendChild( div );

		// Support: IE8
		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
		tds = div.getElementsByTagName("td");
		tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
		isSupported = ( tds[ 0 ].offsetHeight === 0 );

		tds[ 0 ].style.display = "";
		tds[ 1 ].style.display = "none";

		// Support: IE8
		// Check if empty table cells still have offsetWidth/Height
		support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

		// Check box-sizing and margin behavior.
		div.innerHTML = "";
		div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";

		// Workaround failing boxSizing test due to offsetWidth returning wrong value
		// with some non-1 values of body zoom, ticket #13543
		jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
			support.boxSizing = div.offsetWidth === 4;
		});

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. (#3333)
			// Fails in WebKit before Feb 2011 nightlies
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = div.appendChild( document.createElement("div") );
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		if ( typeof div.style.zoom !== core_strundefined ) {
			// Support: IE<8
			// Check if natively block-level elements act like inline-block
			// elements when setting their display to 'inline' and giving
			// them layout
			div.innerHTML = "";
			div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
			support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

			// Support: IE6
			// Check if elements with layout shrink-wrap their children
			div.style.display = "block";
			div.innerHTML = "<div></div>";
			div.firstChild.style.width = "5px";
			support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );

			if ( support.inlineBlockNeedsLayout ) {
				// Prevent IE 6 from affecting layout for positioned elements #11048
				// Prevent IE from shrinking the body in IE 7 mode #12869
				// Support: IE<8
				body.style.zoom = 1;
			}
		}

		body.removeChild( container );

		// Null elements to avoid leaks in IE
		container = div = tds = marginDiv = null;
	});

	// Null elements to avoid leaks in IE
	all = select = fragment = opt = a = input = null;

	return support;
})({});

var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

function internalData( elem, name, data, pvt /* Internal Use Only */ ){
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var ret, thisCache,
		internalKey = jQuery.expando,

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && data === undefined && typeof name === "string" ) {
		return;
	}

	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		if ( isNode ) {
			id = elem[ internalKey ] = core_deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey;
		}
	}

	if ( !cache[ id ] ) {
		// Avoid exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		cache[ id ] = isNode ? {} : { toJSON: jQuery.noop };
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	if ( typeof name === "string" ) {

		// First Try to find as-is property data
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var thisCache, i,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split(" ");
					}
				}
			} else {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			i = name.length;
			while ( i-- ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	/* jshint eqeqeq: false */
	} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
		/* jshint eqeqeq: true */
		delete cache[ id ];

	// When all else fails, null
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	cache: {},

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"applet": true,
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	},

	// A method for determining if a DOM node can handle the data expando
	acceptData: function( elem ) {
		// Do not set data on non-element because it will not be cleared (#8335).
		if ( elem.nodeType && elem.nodeType !== 1 && elem.nodeType !== 9 ) {
			return false;
		}

		var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];

		// nodes accept data unless otherwise specified; rejection can be conditional
		return !noData || noData !== true && elem.getAttribute("classid") === noData;
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var attrs, name,
			data = null,
			i = 0,
			elem = this[0];

		// Special expections of .data basically thwart jQuery.access,
		// so implement the relevant behavior ourselves

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					attrs = elem.attributes;
					for ( ; i < attrs.length; i++ ) {
						name = attrs[i].name;

						if ( name.indexOf("data-") === 0 ) {
							name = jQuery.camelCase( name.slice(5) );

							dataAttr( elem, name, data[ name ] );
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return arguments.length > 1 ?

			// Sets one value
			this.each(function() {
				jQuery.data( this, key, value );
			}) :

			// Gets one value
			// Try to fetch any internally stored data first
			elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : null;
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}
jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray(data) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				jQuery._removeData( elem, type + "queue" );
				jQuery._removeData( elem, key );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var nodeHook, boolHook,
	rclass = /[\t\r\n\f]/g,
	rreturn = /\r/g,
	rfocusable = /^(?:input|select|textarea|button|object)$/i,
	rclickable = /^(?:a|area)$/i,
	ruseDefault = /^(?:checked|selected)$/i,
	getSetAttribute = jQuery.support.getSetAttribute,
	getSetInput = jQuery.support.input;

jQuery.fn.extend({
	attr: function( name, value ) {
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	},

	addClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}
					elem.className = jQuery.trim( cur );

				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}
					elem.className = value ? jQuery.trim( cur ) : "";
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( core_rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === core_strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		var ret, hooks, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// Use proper attribute retrieval(#6932, #12072)
				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :
					elem.text;
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];
					if ( (option.selected = jQuery.inArray( jQuery(option).val(), values ) >= 0) ) {
						optionSet = true;
					}
				}

				// force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === core_strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( core_rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
						elem[ propName ] = false;
					// Support: IE<9
					// Also clear defaultChecked/defaultSelected (if appropriate)
					} else {
						elem[ jQuery.camelCase( "default-" + name ) ] =
							elem[ propName ] = false;
					}

				// See #9699 for explanation of this approach (setting first, then removal)
				} else {
					jQuery.attr( elem, name, "" );
				}

				elem.removeAttribute( getSetAttribute ? name : propName );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				return tabindex ?
					parseInt( tabindex, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						-1;
			}
		}
	}
});

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
			// IE<8 needs the *property* name
			elem.setAttribute( !getSetAttribute && jQuery.propFix[ name ] || name, name );

		// Use defaultChecked and defaultSelected for oldIE
		} else {
			elem[ jQuery.camelCase( "default-" + name ) ] = elem[ name ] = true;
		}

		return name;
	}
};
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = jQuery.expr.attrHandle[ name ] || jQuery.find.attr;

	jQuery.expr.attrHandle[ name ] = getSetInput && getSetAttribute || !ruseDefault.test( name ) ?
		function( elem, name, isXML ) {
			var fn = jQuery.expr.attrHandle[ name ],
				ret = isXML ?
					undefined :
					/* jshint eqeqeq: false */
					(jQuery.expr.attrHandle[ name ] = undefined) !=
						getter( elem, name, isXML ) ?

						name.toLowerCase() :
						null;
			jQuery.expr.attrHandle[ name ] = fn;
			return ret;
		} :
		function( elem, name, isXML ) {
			return isXML ?
				undefined :
				elem[ jQuery.camelCase( "default-" + name ) ] ?
					name.toLowerCase() :
					null;
		};
});

// fix oldIE attroperties
if ( !getSetInput || !getSetAttribute ) {
	jQuery.attrHooks.value = {
		set: function( elem, value, name ) {
			if ( jQuery.nodeName( elem, "input" ) ) {
				// Does not return so that setAttribute is also used
				elem.defaultValue = value;
			} else {
				// Use nodeHook if defined (#1954); otherwise setAttribute is fine
				return nodeHook && nodeHook.set( elem, value, name );
			}
		}
	};
}

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = {
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				elem.setAttributeNode(
					(ret = elem.ownerDocument.createAttribute( name ))
				);
			}

			ret.value = value += "";

			// Break association with cloned elements by also using setAttribute (#9646)
			return name === "value" || value === elem.getAttribute( name ) ?
				value :
				undefined;
		}
	};
	jQuery.expr.attrHandle.id = jQuery.expr.attrHandle.name = jQuery.expr.attrHandle.coords =
		// Some attributes are constructed with empty-string values when not defined
		function( elem, name, isXML ) {
			var ret;
			return isXML ?
				undefined :
				(ret = elem.getAttributeNode( name )) && ret.value !== "" ?
					ret.value :
					null;
		};
	jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			return ret && ret.specified ?
				ret.value :
				undefined;
		},
		set: nodeHook.set
	};

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		set: function( elem, value, name ) {
			nodeHook.set( elem, value === "" ? false : value, name );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		};
	});
}


// Some attributes require a special call on IE
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !jQuery.support.hrefNormalized ) {
	// href/src property should get the full normalized URL (#10299/#12915)
	jQuery.each([ "href", "src" ], function( i, name ) {
		jQuery.propHooks[ name ] = {
			get: function( elem ) {
				return elem.getAttribute( name, 4 );
			}
		};
	});
}

if ( !jQuery.support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Note: IE uppercases css property names, but if we were to .toLowerCase()
			// .cssText, that would destroy case senstitivity in URL's, like in "background"
			return elem.style.cssText || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}

// Safari mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});

// IE6/7 call enctype encoding
if ( !jQuery.support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !jQuery.support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			// Support: Webkit
			// "" is returned instead of "on" if a value isn't specified
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});
var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = core_hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {
						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, ret, handleObj, matched, j,
			handlerQueue = [],
			args = core_slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var sel, handleObj, matches, i,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			/* jshint eqeqeq: false */
			for ( ; cur != this; cur = cur.parentNode || this ) {
				/* jshint eqeqeq: true */

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {
						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Even when returnValue equals to undefined Firefox will still show alert
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			if ( typeof elem[ name ] === core_strundefined ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;
		if ( !e ) {
			return;
		}
		// If stopPropagation exists, run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "submitBubbles" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "submitBubbles", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !jQuery.support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "changeBubbles" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "changeBubbles", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var type, origFn;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});
var isSimple = /^.[^:#\[\.,]*$/,
	rparentsprev = /^(?:parents|prev(?:Until|All))/,
	rneedsContext = jQuery.expr.match.needsContext,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},

	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter(function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},

	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			ret = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					cur = ret.push( cur );
					break;
				}
			}
		}

		return this.pushStack( ret.length > 1 ? jQuery.unique( ret ) : ret );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( jQuery.unique(all) );
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				ret = jQuery.unique( ret );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				ret = ret.reverse();
			}
		}

		return this.pushStack( ret );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 && elem.nodeType === 1 ?
			jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
			jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
				return elem.nodeType === 1;
			}));
	},

	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) !== not;
	});
}
function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
		safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		area: [ 1, "<map>", "</map>" ],
		param: [ 1, "<object>", "</object>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
		// unless wrapped in a div with non-breaking characters in front of it.
		_default: jQuery.support.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>"  ]
	},
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

jQuery.fn.extend({
	text: function( value ) {
		return jQuery.access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem, false ) );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}

			// If this is a select, ensure that it displays empty (#12336)
			// Support: IE<9
			if ( elem.options && jQuery.nodeName( elem, "select" ) ) {
				elem.options.length = 0;
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return jQuery.access( this, function( value ) {
			var elem = this[0] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( jQuery.support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ ( rtagName.exec( value ) || ["", ""] )[1].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for (; i < l; i++ ) {
						// Remove element nodes and prevent memory leaks
						elem = this[i] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch(e) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var
			// Snapshot the DOM in case .domManip sweeps something relevant into its fragment
			args = jQuery.map( this, function( elem ) {
				return [ elem.nextSibling, elem.parentNode ];
			}),
			i = 0;

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			var next = args[ i++ ],
				parent = args[ i++ ];

			if ( parent ) {
				// Don't use the snapshot next if it has moved (#13810)
				if ( next && next.parentNode !== parent ) {
					next = this.nextSibling;
				}
				jQuery( this ).remove();
				parent.insertBefore( elem, next );
			}
		// Allow new content to include elements from the context set
		}, true );

		// Force removal if there was no new content (e.g., from empty arguments)
		return i ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback, allowIntersection ) {

		// Flatten any nested arrays
		args = core_concat.apply( [], args );

		var first, node, hasScripts,
			scripts, doc, fragment,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[0],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction || !( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[0] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback, allowIntersection );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, !allowIntersection && this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[i], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!jQuery._data( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Hope ajax is available...
								jQuery._evalUrl( node.src );
							} else {
								jQuery.globalEval( ( node.text || node.textContent || node.innerHTML || "" ).replace( rcleanScript, "" ) );
							}
						}
					}
				}

				// Fix #11809: Avoid leaking memory
				fragment = first = null;
			}
		}

		return this;
	}
});

// Support: IE<8
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType === 1 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (jQuery.find.attr( elem, "type" ) !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );
	if ( match ) {
		elem.type = match[1];
	} else {
		elem.removeAttribute("type");
	}
	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var elem,
		i = 0;
	for ( ; (elem = elems[i]) != null; i++ ) {
		jQuery._data( elem, "globalEval", !refElements || jQuery._data( refElements[i], "globalEval" ) );
	}
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function fixCloneNodeIssues( src, dest ) {
	var nodeName, e, data;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 copies events bound via attachEvent when using cloneNode.
	if ( !jQuery.support.noCloneEvent && dest[ jQuery.expando ] ) {
		data = jQuery._data( dest );

		for ( e in data.events ) {
			jQuery.removeEvent( dest, e, data.handle );
		}

		// Event data gets referenced instead of copied if the expando gets copied too
		dest.removeAttribute( jQuery.expando );
	}

	// IE blanks contents when cloning scripts, and tries to evaluate newly-set text
	if ( nodeName === "script" && dest.text !== src.text ) {
		disableScript( dest ).text = src.text;
		restoreScript( dest );

	// IE6-10 improperly clones children of object elements using classid.
	// IE10 throws NoModificationAllowedError if parent is null, #12132.
	} else if ( nodeName === "object" ) {
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( jQuery.support.html5Clone && ( src.innerHTML && !jQuery.trim(dest.innerHTML) ) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.defaultSelected = dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone(true);
			jQuery( insert[i] )[ original ]( elems );

			// Modern browsers can apply jQuery collections as arrays, but oldIE needs a .get()
			core_push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});

function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== core_strundefined ? context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== core_strundefined ? context.querySelectorAll( tag || "*" ) :
			undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context; (elem = elems[i]) != null; i++ ) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}

// Used in buildFragment, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( manipulation_rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var destElements, node, clone, i, srcElements,
			inPage = jQuery.contains( elem.ownerDocument, elem );

		if ( jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			// Fix all IE cloning issues
			for ( i = 0; (node = srcElements[i]) != null; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					fixCloneNodeIssues( node, destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0; (node = srcElements[i]) != null; i++ ) {
					cloneCopyEvent( node, destElements[i] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		destElements = srcElements = node = null;

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var j, elem, contains,
			tmp, tag, tbody, wrap,
			l = elems.length,

			// Ensure a safe fragment
			safe = createSafeFragment( context ),

			nodes = [],
			i = 0;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || safe.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;

					tmp.innerHTML = wrap[1] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[2];

					// Descend through wrappers to the right content
					j = wrap[0];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Manually add leading whitespace removed by IE
					if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						nodes.push( context.createTextNode( rleadingWhitespace.exec( elem )[0] ) );
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !jQuery.support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						elem = tag === "table" && !rtbody.test( elem ) ?
							tmp.firstChild :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !rtbody.test( elem ) ?
								tmp :
								0;

						j = elem && elem.childNodes.length;
						while ( j-- ) {
							if ( jQuery.nodeName( (tbody = elem.childNodes[j]), "tbody" ) && !tbody.childNodes.length ) {
								elem.removeChild( tbody );
							}
						}
					}

					jQuery.merge( nodes, tmp.childNodes );

					// Fix #12392 for WebKit and IE > 9
					tmp.textContent = "";

					// Fix #12392 for oldIE
					while ( tmp.firstChild ) {
						tmp.removeChild( tmp.firstChild );
					}

					// Remember the top-level container for proper cleanup
					tmp = safe.lastChild;
				}
			}
		}

		// Fix #11356: Clear elements from fragment
		if ( tmp ) {
			safe.removeChild( tmp );
		}

		// Reset defaultChecked for any radios and checkboxes
		// about to be appended to the DOM in IE 6/7 (#8060)
		if ( !jQuery.support.appendChecked ) {
			jQuery.grep( getAll( nodes, "input" ), fixDefaultChecked );
		}

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( safe.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		tmp = null;

		return safe;
	},

	cleanData: function( elems, /* internal */ acceptData ) {
		var elem, type, id, data,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			deleteExpando = jQuery.support.deleteExpando,
			special = jQuery.event.special;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( acceptData || jQuery.acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// IE does not allow us to delete expando properties from nodes,
						// nor does it have a removeAttribute function on Document nodes;
						// we must handle all of these cases
						if ( deleteExpando ) {
							delete elem[ internalKey ];

						} else if ( typeof elem.removeAttribute !== core_strundefined ) {
							elem.removeAttribute( internalKey );

						} else {
							elem[ internalKey ] = null;
						}

						core_deletedIds.push( id );
					}
				}
			}
		}
	},

	_evalUrl: function( url ) {
		return jQuery.ajax({
			url: url,
			type: "GET",
			dataType: "script",
			async: false,
			global: false,
			"throws": true
		});
	}
});
jQuery.fn.extend({
	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});
var iframe, getStyles, curCSS,
	ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity\s*=\s*([^)]*)/,
	rposition = /^(top|right|bottom|left)$/,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" ),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function isHidden( elem, el ) {
	// isHidden might be called from jQuery#filter function;
	// in that case, element will be second argument
	elem = el || elem;
	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = jQuery._data( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = jQuery._data( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					jQuery._data( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			var len, styles,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifing setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {

				// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
				// Fixes bug #5509
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var num, val, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
if ( window.getComputedStyle ) {
	getStyles = function( elem ) {
		return window.getComputedStyle( elem, null );
	};

	curCSS = function( elem, name, _computed ) {
		var width, minWidth, maxWidth,
			computed = _computed || getStyles( elem ),

			// getPropertyValue is only needed for .css('filter') in IE9, see #12537
			ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
			style = elem.style;

		if ( computed ) {

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret;
	};
} else if ( document.documentElement.currentStyle ) {
	getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, _computed ) {
		var left, rs, rsLeft,
			computed = _computed || getStyles( elem ),
			ret = computed ? computed[ name ] : undefined,
			style = elem.style;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		return ret === "" ? "auto" : ret;
	};
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {
			// Use the already-created iframe if possible
			iframe = ( iframe ||
				jQuery("<iframe frameborder='0' width='0' height='0'/>")
				.css( "cssText", "display:block !important" )
			).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[0].contentWindow || iframe[0].contentDocument ).document;
			doc.write("<!doctype html><html><body>");
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}

// Called ONLY from within css_defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
		display = jQuery.css( elem[0], "display" );
	elem.remove();
	return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

if ( !jQuery.support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			// if value === "", then remove inline opacity #12685
			if ( ( value >= 1 || value === "" ) &&
					jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
					style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there is no filter style applied in a css rule or unset inline opacity, we are done
				if ( value === "" || currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				if ( computed ) {
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					return jQuery.swap( elem, { "display": "inline-block" },
						curCSS, [ elem, "marginRight" ] );
				}
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
		jQuery.each( [ "top", "left" ], function( i, prop ) {
			jQuery.cssHooks[ prop ] = {
				get: function( elem, computed ) {
					if ( computed ) {
						computed = curCSS( elem, prop );
						// if curCSS returns percentage, fallback to offset
						return rnumnonpx.test( computed ) ?
							jQuery( elem ).position()[ prop ] + "px" :
							computed;
					}
				}
			};
		});
	}

});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		return elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
			(!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});
var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function(){
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function(){
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !manipulation_rcheckableType.test( type ) );
		})
		.map(function( i, elem ){
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ){
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}
jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});
var
	// Document location
	ajaxLocParts,
	ajaxLocation,
	ajax_nonce = jQuery.now(),

	ajax_rquery = /\?/,
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var deep, key,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, response, type,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off, url.length );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
	jQuery.fn[ type ] = function( fn ){
		return this.on( type, fn );
	};
});

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // Cross-domain detection vars
			parts,
			// Loop variable
			i,
			// URL without anti-cache param
			cacheURL,
			// Response headers as string
			responseHeadersString,
			// timeout handle
			timeoutTimer,

			// To know if global events are to be dispatched
			fireGlobals,

			transport,
			// Response headers
			responseHeaders,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {
	var firstDataType, ct, finalDataType, type,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || jQuery("head")[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement("script");

				script.async = true;

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = null;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};

				// Circumvent IE6 bugs with base elements (#2709 and #4378) by prepending
				// Use native DOM manipulation to avoid our domManip AJAX trickery
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( undefined, true );
				}
			}
		};
	}
});
var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});
var xhrCallbacks, xhrSupported,
	xhrId = 0,
	// #5280: Internet Explorer will keep connections alive if we don't abort on unload
	xhrOnUnloadAbort = window.ActiveXObject && function() {
		// Abort all pending requests
		var key;
		for ( key in xhrCallbacks ) {
			xhrCallbacks[ key ]( undefined, true );
		}
	};

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject("Microsoft.XMLHTTP");
	} catch( e ) {}
}

// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject ?
	/* Microsoft failed to properly
	 * implement the XMLHttpRequest in IE7 (can't request local files),
	 * so we use the ActiveXObject when it is available
	 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
	 * we need a fallback.
	 */
	function() {
		return !this.isLocal && createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

// Determine support properties
xhrSupported = jQuery.ajaxSettings.xhr();
jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
xhrSupported = jQuery.support.ajax = !!xhrSupported;

// Create transport if the browser can provide an xhr
if ( xhrSupported ) {

	jQuery.ajaxTransport(function( s ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !s.crossDomain || jQuery.support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {

					// Get a new xhr
					var handle, i,
						xhr = s.xhr();

					// Open the socket
					// Passing null username, generates a login popup on Opera (#2865)
					if ( s.username ) {
						xhr.open( s.type, s.url, s.async, s.username, s.password );
					} else {
						xhr.open( s.type, s.url, s.async );
					}

					// Apply custom fields if provided
					if ( s.xhrFields ) {
						for ( i in s.xhrFields ) {
							xhr[ i ] = s.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( s.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( s.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !s.crossDomain && !headers["X-Requested-With"] ) {
						headers["X-Requested-With"] = "XMLHttpRequest";
					}

					// Need an extra try/catch for cross domain requests in Firefox 3
					try {
						for ( i in headers ) {
							xhr.setRequestHeader( i, headers[ i ] );
						}
					} catch( err ) {}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( s.hasContent && s.data ) || null );

					// Listener
					callback = function( _, isAbort ) {
						var status, responseHeaders, statusText, responses;

						// Firefox throws exceptions when accessing properties
						// of an xhr when a network error occurred
						// http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
						try {

							// Was never called and is aborted or complete
							if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

								// Only called once
								callback = undefined;

								// Do not keep as active anymore
								if ( handle ) {
									xhr.onreadystatechange = jQuery.noop;
									if ( xhrOnUnloadAbort ) {
										delete xhrCallbacks[ handle ];
									}
								}

								// If it's an abort
								if ( isAbort ) {
									// Abort it manually if needed
									if ( xhr.readyState !== 4 ) {
										xhr.abort();
									}
								} else {
									responses = {};
									status = xhr.status;
									responseHeaders = xhr.getAllResponseHeaders();

									// When requesting binary data, IE6-9 will throw an exception
									// on any attempt to access responseText (#11426)
									if ( typeof xhr.responseText === "string" ) {
										responses.text = xhr.responseText;
									}

									// Firefox throws an exception when accessing
									// statusText for faulty cross-domain requests
									try {
										statusText = xhr.statusText;
									} catch( e ) {
										// We normalize with Webkit giving an empty statusText
										statusText = "";
									}

									// Filter status for non standard behaviors

									// If the request is local and we have data: assume a success
									// (success with no data won't get notified, that's the best we
									// can do given current implementations)
									if ( !status && s.isLocal && !s.crossDomain ) {
										status = responses.text ? 200 : 404;
									// IE - #1450: sometimes returns 1223 when it should be 204
									} else if ( status === 1223 ) {
										status = 204;
									}
								}
							}
						} catch( firefoxAccessException ) {
							if ( !isAbort ) {
								complete( -1, firefoxAccessException );
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, responseHeaders );
						}
					};

					if ( !s.async ) {
						// if we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {
						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						setTimeout( callback );
					} else {
						handle = ++xhrId;
						if ( xhrOnUnloadAbort ) {
							// Create the active xhrs callbacks list if needed
							// and attach the unload handler
							if ( !xhrCallbacks ) {
								xhrCallbacks = {};
								jQuery( window ).unload( xhrOnUnloadAbort );
							}
							// Add to list of active xhrs callbacks
							xhrCallbacks[ handle ] = callback;
						}
						xhr.onreadystatechange = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback( undefined, true );
					}
				}
			};
		}
	});
}
var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		}]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = jQuery._data( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if ( jQuery.css( elem, "display" ) === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay( elem.nodeName ) === "inline" ) {
				style.display = "inline-block";

			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !jQuery.support.shrinkWrapBlocks ) {
			anim.always(function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			});
		}
	}


	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {
				continue;
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = jQuery._data( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;
			jQuery._removeData( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || jQuery._data( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = jQuery._data( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth? 1 : 0;
	for( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p*Math.PI ) / 2;
	}
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	if ( timer() && jQuery.timers.push( timer ) ) {
		jQuery.fx.start();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
jQuery.fn.offset = function( options ) {
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	var docElem, win,
		box = { top: 0, left: 0 },
		elem = this[ 0 ],
		doc = elem && elem.ownerDocument;

	if ( !doc ) {
		return;
	}

	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	return {
		top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
		left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
	};
};

jQuery.offset = {

	setOffset: function( elem, options, i ) {
		var position = jQuery.css( elem, "position" );

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		var curElem = jQuery( elem ),
			curOffset = curElem.offset(),
			curCSSTop = jQuery.css( elem, "top" ),
			curCSSLeft = jQuery.css( elem, "left" ),
			calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
			props = {}, curPosition = {}, curTop, curLeft;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true)
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;
			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || docElem;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
// Limit scope pollution from any deprecated API
// (function() {

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;

// })();
if ( typeof module === "object" && module && typeof module.exports === "object" ) {
	// Expose jQuery as module.exports in loaders that implement the Node
	// module pattern (including browserify). Do not create the global, since
	// the user will be storing it themselves locally, and globals are frowned
	// upon in the Node module world.
	module.exports = jQuery;
} else {
	// Otherwise expose jQuery to the global object as usual
	window.jQuery = window.$ = jQuery;

	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.
	if ( typeof define === "function" && define.amd ) {
		define( "jquery", [], function () { return jQuery; } );
	}
}

})( window );

//! moment.js
//! version : 2.5.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.5.0",
        global = this,
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for language config files
        languages = {},

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+\-]?\d{6}/, // -999,999 - 999,999

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            'YYYY-MM-DD',
            'GGGG-[W]WW',
            'GGGG-[W]WW-E',
            'YYYY-DDD'
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return this.weekYear();
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return this.isoWeekYear();
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = Math.abs(number) + '',
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months,
            minutes,
            hours;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        // store the minutes and hours so we can restore them
        if (days || months) {
            minutes = mom.minute();
            hours = mom.hour();
        }
        if (days) {
            mom.date(mom.date() + days * isAdding);
        }
        if (months) {
            mom.month(mom.month() + months * isAdding);
        }
        if (milliseconds && !ignoreUpdateOffset) {
            moment.updateOffset(mom);
        }
        // restore the minutes and hours after possibly changing dst
        if (days || months) {
            mom.minute(minutes);
            mom.hour(hours);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
                input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function initializeParsingFlags(config) {
        config._pf = {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
        Languages
    ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) { return parseTokenOneDigit; }
            /* falls through */
        case 'SS':
            if (strict) { return parseTokenTwoDigits; }
            /* falls through */
        case 'SSS':
        case 'DDD':
            return strict ? parseTokenThreeDigits : parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return getLangDefinition(config._l)._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return strict ? parseTokenOneDigit : parseTokenOneOrTwoDigits;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || "";
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = getLangDefinition(config._l).isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gg':
        case 'gggg':
        case 'GG':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = input;
            }
            break;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate,
            yearToUse, fixYear, w, temp, lang, weekday, week;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            fixYear = function (val) {
                var int_val = parseInt(val, 10);
                return val ?
                  (val.length < 3 ? (int_val > 68 ? 1900 + int_val : 2000 + int_val) : int_val) :
                  (config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR]);
            };

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
            }
            else {
                lang = getLangDefinition(config._l);
                weekday = w.d != null ?  parseWeekday(w.d, lang) :
                  (w.e != null ?  parseInt(w.e, 10) + lang._week.dow : 0);

                week = parseInt(w.w, 10) || 1;

                //if we're parsing 'd', then the low day numbers may be next week
                if (w.d != null && weekday < lang._week.dow) {
                    week++;
                }

                temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
            }

            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[HOUR] += toInt((config._tzm || 0) / 60);
        input[MINUTE] += toInt((config._tzm || 0) % 60);

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            initializeParsingFlags(tempConfig);
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 4; i > 0; i--) {
                if (match[i]) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i - 1] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0; i < 4; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        }
        else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else {
            config._d = new Date(input);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        // The only solid way to create an iso date from year is to use
        // a string format (Date.UTC handles only years > 1900). Don't ask why
        // it doesn't need Z at the end.
        var d = new Date(leftZeroFill(year, 6, true) + '-01-01').getUTCDay(),
            daysToAdd, dayOfYear;

        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (typeof config._pf === 'undefined') {
            initializeParsingFlags(config);
        }

        if (input === null) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = extend({}, input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        return makeMoment({
            _i : input,
            _f : format,
            _l : lang,
            _strict : strict,
            _isUTC : false
        });
    };

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var m;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        m = makeMoment({
            _useUTC : true,
            _isUTC : true,
            _l : lang,
            _i : input,
            _f : format,
            _strict : strict
        }).utc();

        return m;
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment;
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function (input) {
        return moment(input).parseZone();
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var sod = makeAs(moment(), this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : function (input) {
            var utc = this._isUTC ? 'UTC' : '',
                dayOfMonth;

            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().monthsParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }

                dayOfMonth = this.date();
                this.date(1);
                this._d['set' + utc + 'Month'](input);
                this.date(Math.min(dayOfMonth, this.daysInMonth()));

                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + 'Month']();
            }
        },

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = units || 'ms';
            return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
        },

        min: function (other) {
            other = moment.apply(null, arguments);
            return other < this ? this : other;
        },

        max: function (other) {
            other = moment.apply(null, arguments);
            return other > this ? this : other;
        },

        zone : function (input) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, true);
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        quarter : function () {
            return Math.ceil((this.month() + 1.0) / 3.0);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LANGUAGES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(deprecate) {
        var warned = false, local_moment = moment;
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        if (deprecate) {
            global.moment = function () {
                if (!warned && console && console.warn) {
                    warned = true;
                    console.warn(
                            "Accessing Moment through the global scope is " +
                            "deprecated, and will be removed in an upcoming " +
                            "release.");
                }
                return local_moment.apply(null, arguments);
            };
            extend(global.moment, local_moment);
        } else {
            global['moment'] = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
        makeGlobal(true);
    } else if (typeof define === "function" && define.amd) {
        define("moment", ['require','exports','module'],function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal !== true) {
                // If user provided noGlobal, he is aware of global
                makeGlobal(module.config().noGlobal === undefined);
            }

            return moment;
        });
    } else {
        makeGlobal();
    }
}).call(this);

// moment-timezone.js
// version : 0.0.3
// author : Tim Wood
// license : MIT
// github.com/timrwood/moment-timezone

(function () {

	var VERSION = "0.0.3";

	function onload(moment) {
		var oldZoneName = moment.fn.zoneName,
			oldZoneAbbr = moment.fn.zoneAbbr,

			defaultRule,
			rules = {},
			ruleSets = {},
			zones = {},
			zoneSets = {},
			links = {},

			TIME_RULE_WALL_CLOCK = 0,
			TIME_RULE_UTC        = 1,
			TIME_RULE_STANDARD   = 2,

			DAY_RULE_DAY_OF_MONTH   = 7,
			DAY_RULE_LAST_WEEKDAY   = 8;

		// converts time in the HH:mm:ss format to absolute number of minutes
		function parseMinutes (input) {
			input = input + '';
			var output = input.split(':'),
				sign = ~input.indexOf('-') ? -1 : 1,
				hour = Math.abs(+output[0]),
				minute = parseInt(output[1], 10) || 0,
				second = parseInt(output[2], 10) || 0;

			return sign * ((hour * 60) + (minute) + (second / 60));
		}

		/************************************
			Rules
		************************************/

		function Rule (name, startYear, endYear, month, day, dayRule, time, timeRule, offset, letters) {
			this.name      = name;
			this.startYear = +startYear;
			this.endYear   = +endYear;
			this.month     = +month;
			this.day       = +day;
			this.dayRule   = +dayRule;
			this.time      = parseMinutes(time);
			this.timeRule  = +timeRule;
			this.offset    = parseMinutes(offset);
			this.letters   = letters || '';
			this.date = memoize(this.date);
			this.weekdayAfter = memoize(this.weekdayAfter);
			this.lastWeekday = memoize(this.lastWeekday);
		}

		Rule.prototype = {
			contains : function (year) {
				return (year >= this.startYear && year <= this.endYear);
			},

			start : function (year) {
				year = Math.min(Math.max(year, this.startYear), this.endYear);
				return moment.utc([year, this.month, this.date(year), 0, this.time]);
			},

			date : function (year) {
				if (this.dayRule === DAY_RULE_DAY_OF_MONTH) {
					return this.day;
				} else if (this.dayRule === DAY_RULE_LAST_WEEKDAY) {
					return this.lastWeekday(year);
				}
				return this.weekdayAfter(year);
			},

			weekdayAfter : function (year) {
				var day = this.day,
					firstDayOfWeek = moment([year, this.month, 1]).day(),
					output = this.dayRule + 1 - firstDayOfWeek;

				while (output < day) {
					output += 7;
				}

				return output;
			},

			lastWeekday : function (year) {
				var day = this.day,
					dow = day % 7,
					lastDowOfMonth = moment([year, this.month + 1, 1]).day(),
					daysInMonth = moment([year, this.month, 1]).daysInMonth(),
					output = daysInMonth + (dow - (lastDowOfMonth - 1)) - (~~(day / 7) * 7);

				if (dow >= lastDowOfMonth) {
					output -= 7;
				}
				return output;
			}
		};

		/************************************
			Rule Year
		************************************/

		function RuleYear (year, rule) {
			this.rule = rule;
			this.start = rule.start(year);
		}

		RuleYear.prototype = {
			equals : function (other) {
				if (!other || other.rule !== this.rule) {
					return false;
				}
				return Math.abs(other.start - this.start) < 86400000; // 24 * 60 * 60 * 1000
			}
		};

		function sortRuleYears (a, b) {
			if (a.isLast) {
				return -1;
			}
			if (b.isLast) {
				return 1;
			}
			return b.start - a.start;
		}

		/************************************
			Rule Sets
		************************************/

		function RuleSet (name) {
			this.name = name;
			this.rules = [];
			this.lastYearRule = memoize(this.lastYearRule);
		}

		RuleSet.prototype = {
			add : function (rule) {
				this.rules.push(rule);
			},

			ruleYears : function (mom, lastZone) {
				var i, j,
					year = mom.year(),
					rule,
					lastZoneRule,
					rules = [];

				for (i = 0; i < this.rules.length; i++) {
					rule = this.rules[i];
					if (rule.contains(year)) {
						rules.push(new RuleYear(year, rule));
					} else if (rule.contains(year + 1)) {
						rules.push(new RuleYear(year + 1, rule));
					}
				}
				rules.push(new RuleYear(year - 1, this.lastYearRule(year - 1)));

				if (lastZone) {
					lastZoneRule = new RuleYear(year - 1, lastZone.lastRule());
					lastZoneRule.start = lastZone.until.clone().utc();
					lastZoneRule.isLast = lastZone.ruleSet !== this;
					rules.push(lastZoneRule);
				}

				rules.sort(sortRuleYears);
				return rules;
			},

			rule : function (mom, offset, lastZone) {
				var rules = this.ruleYears(mom, lastZone),
					lastOffset = 0,
					rule,
					lastZoneOffset,
					lastZoneOffsetAbs,
					lastRule,
					i;

				if (lastZone) {
					lastZoneOffset = lastZone.offset + lastZone.lastRule().offset;
					lastZoneOffsetAbs = Math.abs(lastZoneOffset) * 90000;
				}

				// make sure to include the previous rule's offset
				for (i = rules.length - 1; i > -1; i--) {
					lastRule = rule;
					rule = rules[i];

					if (rule.equals(lastRule)) {
						continue;
					}

					if (lastZone && !rule.isLast && Math.abs(rule.start - lastZone.until) <= lastZoneOffsetAbs) {
						lastOffset += lastZoneOffset - offset;
					}

					if (rule.rule.timeRule === TIME_RULE_STANDARD) {
						lastOffset = offset;
					}

					if (rule.rule.timeRule !== TIME_RULE_UTC) {
						rule.start.add('m', -lastOffset);
					}

					lastOffset = rule.rule.offset + offset;
				}

				for (i = 0; i < rules.length; i++) {
					rule = rules[i];
					if (mom >= rule.start && !rule.isLast) {
						return rule.rule;
					}
				}

				return defaultRule;
			},

			lastYearRule : function (year) {
				var i,
					rule,
					start,
					bestRule = defaultRule,
					largest = -1e30;

				for (i = 0; i < this.rules.length; i++) {
					rule = this.rules[i];
					if (year >= rule.startYear) {
						start = rule.start(year);
						if (start > largest) {
							largest = start;
							bestRule = rule;
						}
					}
				}

				return bestRule;
			}
		};

		/************************************
			Zone
		************************************/

		function Zone (name, offset, ruleSet, letters, until, untilOffset) {
			var i,
				untilArray = typeof until === 'string' ? until.split('_') : [9999];

			this.name = name;
			this.offset = parseMinutes(offset);
			this.ruleSet = ruleSet;
			this.letters = letters;
			this.lastRule = memoize(this.lastRule);

			for (i = 0; i < untilArray.length; i++) {
				untilArray[i] = +untilArray[i];
			}
			this.until = moment.utc(untilArray).subtract('m', parseMinutes(untilOffset));
		}

		Zone.prototype = {
			rule : function (mom, lastZone) {
				return this.ruleSet.rule(mom, this.offset, lastZone);
			},

			lastRule : function () {
				return this.rule(this.until);
			},

			format : function (rule) {
				return this.letters.replace("%s", rule.letters);
			}
		};

		/************************************
			Zone Set
		************************************/

		function sortZones (a, b) {
			return a.until - b.until;
		}

		function ZoneSet (name) {
			this.name = normalizeName(name);
			this.displayName = name;
			this.zones = [];
			this.zoneAndRule = memoize(this.zoneAndRule, function (mom) {
				return +mom;
			});
		}

		ZoneSet.prototype = {
			zoneAndRule : function (mom) {
				var i,
					zone,
					lastZone;

				mom = mom.clone().utc();
				for (i = 0; i < this.zones.length; i++) {
					zone = this.zones[i];
					if (mom < zone.until) {
						break;
					}
					lastZone = zone;
				}

				return [zone, zone.rule(mom, lastZone)];
			},

			add : function (zone) {
				this.zones.push(zone);
				this.zones.sort(sortZones);
			},

			format : function (mom) {
				var zoneAndRule = this.zoneAndRule(mom);
				return zoneAndRule[0].format(zoneAndRule[1]);
			},

			offset : function (mom) {
				var zoneAndRule = this.zoneAndRule(mom);
				return -(zoneAndRule[0].offset + zoneAndRule[1].offset);
			}
		};

		/************************************
			Global Methods
		************************************/

		function memoize (fn, keyFn) {
			var cache = {};
			return function (first) {
				var key = keyFn ? keyFn.apply(this, arguments) : first;
				return key in cache ?
					cache[key] :
					(cache[key] = fn.apply(this, arguments));
			};
		}

		function addRules (rules) {
			var i, j, rule;
			for (i in rules) {
				rule = rules[i];
				for (j = 0; j < rule.length; j++) {
					addRule(i + '\t' + rule[j]);
				}
			}
		}

		function addRule (ruleString) {
			// don't duplicate rules
			if (rules[ruleString]) {
				return rules[ruleString];
			}

			var p = ruleString.split(/\s/),
				name = normalizeName(p[0]),
				rule = new Rule(name, p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10]);

			// cache the rule so we don't add it again
			rules[ruleString] = rule;

			// add to the ruleset
			getRuleSet(name).add(rule);

			return rule;
		}

		function normalizeName (name) {
			return (name || '').toLowerCase().replace(/\//g, '_');
		}

		function addZones (zones) {
			var i, j, zone;
			for (i in zones) {
				zone = zones[i];
				for (j = 0; j < zone.length; j++) {
					addZone(i + '\t' + zone[j]);
				}
			}
		}

		function addLinks (linksToAdd) {
			var i;
			for (i in linksToAdd) {
				links[normalizeName(i)] = normalizeName(linksToAdd[i]);
			}
		}

		function addZone (zoneString) {
			// don't duplicate zones
			if (zones[zoneString]) {
				return zones[zoneString];
			}

			var p = zoneString.split(/\s/),
				name = normalizeName(p[0]),
				zone = new Zone(name, p[1], getRuleSet(p[2]), p[3], p[4], p[5]);

			// cache the zone so we don't add it again
			zones[zoneString] = zone;

			// add to the zoneset
			getZoneSet(p[0]).add(zone);

			return zone;
		}

		function getRuleSet (name) {
			name = normalizeName(name);
			if (!ruleSets[name]) {
				ruleSets[name] = new RuleSet(name);
			}
			return ruleSets[name];
		}

		function getZoneSet (name) {
			var machineName = normalizeName(name);
			if (links[machineName]) {
				machineName = links[machineName];
			}
			if (!zoneSets[machineName]) {
				zoneSets[machineName] = new ZoneSet(name);
			}
			return zoneSets[machineName];
		}

		function add (data) {
			if (!data) {
				return;
			}
			if (data.zones) {
				addZones(data.zones);
			}
			if (data.rules) {
				addRules(data.rules);
			}
			if (data.links) {
				addLinks(data.links);
			}
		}

		// overwrite moment.updateOffset
		moment.updateOffset = function (mom) {
			var offset;
			if (mom._z) {
				offset = mom._z.offset(mom);
				if (Math.abs(offset) < 16) {
					offset = offset / 60;
				}
				mom.zone(offset);
			}
		};

		function getZoneSets() {
			var sets = [],
				zoneName;
			for (zoneName in zoneSets) {
				sets.push(zoneSets[zoneName]);
			}
			return sets;
		}

		moment.fn.tz = function (name) {
			if (name) {
				this._z = getZoneSet(name);
				if (this._z) {
					moment.updateOffset(this);
				}
				return this;
			}
			if (this._z) {
				return this._z.displayName;
			}
		};

		moment.fn.zoneName = function () {
			if (this._z) {
				return this._z.format(this);
			}
			return oldZoneName.call(this);
		};

		moment.fn.zoneAbbr = function () {
			if (this._z) {
				return this._z.format(this);
			}
			return oldZoneAbbr.call(this);
		};

		moment.tz = function () {
			var args = [], i, len = arguments.length - 1;
			for (i = 0; i < len; i++) {
				args[i] = arguments[i];
			}
			var m = moment.apply(null, args);
			var preTzOffset = m.zone();
			m.tz(arguments[len]);
			return m.add('minutes', m.zone() - preTzOffset);
		};

		moment.tz.add = add;
		moment.tz.addRule = addRule;
		moment.tz.addZone = addZone;
		moment.tz.zones = getZoneSets;

		moment.tz.version = VERSION;

		// add default rule
		defaultRule = addRule("- 0 9999 0 0 0 0 0 0");

		return moment;
	}

	if (typeof define === "function" && define.amd) {
		define("moment-timezone", ["moment"], onload);
	} else if (typeof window !== "undefined" && window.moment) {
		onload(window.moment);
	} else if (typeof module !== 'undefined') {
		module.exports = onload(require('moment'));
	}
}).apply(this);

/**
 * @license RequireJS text 2.0.10 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('text',['module'], function (module) {
    

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.10',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.indexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1, name.length);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file.indexOf('\uFEFF') === 0) {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                errback(e);
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        errback(err);
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes,
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});

define('text!moment-timezone.json',[],function () { return '{\n\t"links": {\n\t\t"Africa/Asmera": "Africa/Asmara",\n\t\t"Africa/Timbuktu": "Africa/Bamako",\n\t\t"America/Argentina/ComodRivadavia": "America/Argentina/Catamarca",\n\t\t"America/Atka": "America/Adak",\n\t\t"America/Buenos_Aires": "America/Argentina/Buenos_Aires",\n\t\t"America/Catamarca": "America/Argentina/Catamarca",\n\t\t"America/Coral_Harbour": "America/Atikokan",\n\t\t"America/Cordoba": "America/Argentina/Cordoba",\n\t\t"America/Ensenada": "America/Tijuana",\n\t\t"America/Fort_Wayne": "America/Indiana/Indianapolis",\n\t\t"America/Indianapolis": "America/Indiana/Indianapolis",\n\t\t"America/Jujuy": "America/Argentina/Jujuy",\n\t\t"America/Knox_IN": "America/Indiana/Knox",\n\t\t"America/Kralendijk": "America/Curacao",\n\t\t"America/Louisville": "America/Kentucky/Louisville",\n\t\t"America/Lower_Princes": "America/Curacao",\n\t\t"America/Marigot": "America/Guadeloupe",\n\t\t"America/Mendoza": "America/Argentina/Mendoza",\n\t\t"America/Porto_Acre": "America/Rio_Branco",\n\t\t"America/Rosario": "America/Argentina/Cordoba",\n\t\t"America/Shiprock": "America/Denver",\n\t\t"America/St_Barthelemy": "America/Guadeloupe",\n\t\t"America/Virgin": "America/St_Thomas",\n\t\t"Antarctica/South_Pole": "Antarctica/McMurdo",\n\t\t"Arctic/Longyearbyen": "Europe/Oslo",\n\t\t"Asia/Ashkhabad": "Asia/Ashgabat",\n\t\t"Asia/Calcutta": "Asia/Kolkata",\n\t\t"Asia/Chungking": "Asia/Chongqing",\n\t\t"Asia/Dacca": "Asia/Dhaka",\n\t\t"Asia/Istanbul": "Europe/Istanbul",\n\t\t"Asia/Katmandu": "Asia/Kathmandu",\n\t\t"Asia/Macao": "Asia/Macau",\n\t\t"Asia/Saigon": "Asia/Ho_Chi_Minh",\n\t\t"Asia/Tel_Aviv": "Asia/Jerusalem",\n\t\t"Asia/Thimbu": "Asia/Thimphu",\n\t\t"Asia/Ujung_Pandang": "Asia/Makassar",\n\t\t"Asia/Ulan_Bator": "Asia/Ulaanbaatar",\n\t\t"Atlantic/Faeroe": "Atlantic/Faroe",\n\t\t"Atlantic/Jan_Mayen": "Europe/Oslo",\n\t\t"Australia/ACT": "Australia/Sydney",\n\t\t"Australia/Canberra": "Australia/Sydney",\n\t\t"Australia/LHI": "Australia/Lord_Howe",\n\t\t"Australia/NSW": "Australia/Sydney",\n\t\t"Australia/North": "Australia/Darwin",\n\t\t"Australia/Queensland": "Australia/Brisbane",\n\t\t"Australia/South": "Australia/Adelaide",\n\t\t"Australia/Tasmania": "Australia/Hobart",\n\t\t"Australia/Victoria": "Australia/Melbourne",\n\t\t"Australia/West": "Australia/Perth",\n\t\t"Australia/Yancowinna": "Australia/Broken_Hill",\n\t\t"Brazil/Acre": "America/Rio_Branco",\n\t\t"Brazil/DeNoronha": "America/Noronha",\n\t\t"Brazil/East": "America/Sao_Paulo",\n\t\t"Brazil/West": "America/Manaus",\n\t\t"Canada/Atlantic": "America/Halifax",\n\t\t"Canada/Central": "America/Winnipeg",\n\t\t"Canada/East-Saskatchewan": "America/Regina",\n\t\t"Canada/Eastern": "America/Toronto",\n\t\t"Canada/Mountain": "America/Edmonton",\n\t\t"Canada/Newfoundland": "America/St_Johns",\n\t\t"Canada/Pacific": "America/Vancouver",\n\t\t"Canada/Saskatchewan": "America/Regina",\n\t\t"Canada/Yukon": "America/Whitehorse",\n\t\t"Chile/Continental": "America/Santiago",\n\t\t"Chile/EasterIsland": "Pacific/Easter",\n\t\t"Cuba": "America/Havana",\n\t\t"Egypt": "Africa/Cairo",\n\t\t"Eire": "Europe/Dublin",\n\t\t"Etc/GMT+0": "Etc/GMT",\n\t\t"Etc/GMT-0": "Etc/GMT",\n\t\t"Etc/GMT0": "Etc/GMT",\n\t\t"Etc/Greenwich": "Etc/GMT",\n\t\t"Etc/Universal": "Etc/UTC",\n\t\t"Etc/Zulu": "Etc/UTC",\n\t\t"Europe/Belfast": "Europe/London",\n\t\t"Europe/Bratislava": "Europe/Prague",\n\t\t"Europe/Busingen": "Europe/Zurich",\n\t\t"Europe/Guernsey": "Europe/London",\n\t\t"Europe/Isle_of_Man": "Europe/London",\n\t\t"Europe/Jersey": "Europe/London",\n\t\t"Europe/Ljubljana": "Europe/Belgrade",\n\t\t"Europe/Mariehamn": "Europe/Helsinki",\n\t\t"Europe/Nicosia": "Asia/Nicosia",\n\t\t"Europe/Podgorica": "Europe/Belgrade",\n\t\t"Europe/San_Marino": "Europe/Rome",\n\t\t"Europe/Sarajevo": "Europe/Belgrade",\n\t\t"Europe/Skopje": "Europe/Belgrade",\n\t\t"Europe/Tiraspol": "Europe/Chisinau",\n\t\t"Europe/Vatican": "Europe/Rome",\n\t\t"Europe/Zagreb": "Europe/Belgrade",\n\t\t"GB": "Europe/London",\n\t\t"GB-Eire": "Europe/London",\n\t\t"GMT": "Etc/GMT",\n\t\t"GMT+0": "Etc/GMT",\n\t\t"GMT-0": "Etc/GMT",\n\t\t"GMT0": "Etc/GMT",\n\t\t"Greenwich": "Etc/GMT",\n\t\t"Hongkong": "Asia/Hong_Kong",\n\t\t"Iceland": "Atlantic/Reykjavik",\n\t\t"Iran": "Asia/Tehran",\n\t\t"Israel": "Asia/Jerusalem",\n\t\t"Jamaica": "America/Jamaica",\n\t\t"Japan": "Asia/Tokyo",\n\t\t"Kwajalein": "Pacific/Kwajalein",\n\t\t"Libya": "Africa/Tripoli",\n\t\t"Mexico/BajaNorte": "America/Tijuana",\n\t\t"Mexico/BajaSur": "America/Mazatlan",\n\t\t"Mexico/General": "America/Mexico_City",\n\t\t"NZ": "Pacific/Auckland",\n\t\t"NZ-CHAT": "Pacific/Chatham",\n\t\t"Navajo": "America/Denver",\n\t\t"PRC": "Asia/Shanghai",\n\t\t"Pacific/Ponape": "Pacific/Pohnpei",\n\t\t"Pacific/Samoa": "Pacific/Pago_Pago",\n\t\t"Pacific/Truk": "Pacific/Chuuk",\n\t\t"Pacific/Yap": "Pacific/Chuuk",\n\t\t"Poland": "Europe/Warsaw",\n\t\t"Portugal": "Europe/Lisbon",\n\t\t"ROC": "Asia/Taipei",\n\t\t"ROK": "Asia/Seoul",\n\t\t"Singapore": "Asia/Singapore",\n\t\t"Turkey": "Europe/Istanbul",\n\t\t"UCT": "Etc/UCT",\n\t\t"US/Alaska": "America/Anchorage",\n\t\t"US/Aleutian": "America/Adak",\n\t\t"US/Arizona": "America/Phoenix",\n\t\t"US/Central": "America/Chicago",\n\t\t"US/East-Indiana": "America/Indiana/Indianapolis",\n\t\t"US/Eastern": "America/New_York",\n\t\t"US/Hawaii": "Pacific/Honolulu",\n\t\t"US/Indiana-Starke": "America/Indiana/Knox",\n\t\t"US/Michigan": "America/Detroit",\n\t\t"US/Mountain": "America/Denver",\n\t\t"US/Pacific": "America/Los_Angeles",\n\t\t"US/Samoa": "Pacific/Pago_Pago",\n\t\t"UTC": "Etc/UTC",\n\t\t"Universal": "Etc/UTC",\n\t\t"W-SU": "Europe/Moscow",\n\t\t"Zulu": "Etc/UTC"\n\t},\n\t"meta": {\n\t\t"Africa/Abidjan": {\n\t\t\t"lat": 5.3167,\n\t\t\t"lon": -3.9667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Accra": {\n\t\t\t"lat": 5.55,\n\t\t\t"lon": 0.2167,\n\t\t\t"rules": "Ghana"\n\t\t},\n\t\t"Africa/Addis_Ababa": {\n\t\t\t"lat": 9.0333,\n\t\t\t"lon": 38.7,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Algiers": {\n\t\t\t"lat": 36.7833,\n\t\t\t"lon": 3.05,\n\t\t\t"rules": "Algeria"\n\t\t},\n\t\t"Africa/Asmara": {\n\t\t\t"lat": 15.3333,\n\t\t\t"lon": 38.8833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Bamako": {\n\t\t\t"lat": 12.65,\n\t\t\t"lon": -8,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Bangui": {\n\t\t\t"lat": 4.3667,\n\t\t\t"lon": 18.5833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Banjul": {\n\t\t\t"lat": 13.4667,\n\t\t\t"lon": -15.35,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Bissau": {\n\t\t\t"lat": 11.85,\n\t\t\t"lon": -14.4167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Blantyre": {\n\t\t\t"lat": -14.2167,\n\t\t\t"lon": 35,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Brazzaville": {\n\t\t\t"lat": -3.7333,\n\t\t\t"lon": 15.2833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Bujumbura": {\n\t\t\t"lat": -2.6167,\n\t\t\t"lon": 29.3667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Cairo": {\n\t\t\t"lat": 30.05,\n\t\t\t"lon": 31.25,\n\t\t\t"rules": "Egypt"\n\t\t},\n\t\t"Africa/Casablanca": {\n\t\t\t"lat": 33.65,\n\t\t\t"lon": -6.4167,\n\t\t\t"rules": "Morocco"\n\t\t},\n\t\t"Africa/Ceuta": {\n\t\t\t"lat": 35.8833,\n\t\t\t"lon": -4.6833,\n\t\t\t"rules": "Spain SpainAfrica EU"\n\t\t},\n\t\t"Africa/Conakry": {\n\t\t\t"lat": 9.5167,\n\t\t\t"lon": -12.2833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Dakar": {\n\t\t\t"lat": 14.6667,\n\t\t\t"lon": -16.5667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Dar_es_Salaam": {\n\t\t\t"lat": -5.2,\n\t\t\t"lon": 39.2833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Djibouti": {\n\t\t\t"lat": 11.6,\n\t\t\t"lon": 43.15,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Douala": {\n\t\t\t"lat": 4.05,\n\t\t\t"lon": 9.7,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/El_Aaiun": {\n\t\t\t"lat": 27.15,\n\t\t\t"lon": -12.8,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Freetown": {\n\t\t\t"lat": 8.5,\n\t\t\t"lon": -12.75,\n\t\t\t"rules": "SL"\n\t\t},\n\t\t"Africa/Gaborone": {\n\t\t\t"lat": -23.35,\n\t\t\t"lon": 25.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Harare": {\n\t\t\t"lat": -16.1667,\n\t\t\t"lon": 31.05,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Johannesburg": {\n\t\t\t"lat": -25.75,\n\t\t\t"lon": 28,\n\t\t\t"rules": "SA"\n\t\t},\n\t\t"Africa/Juba": {\n\t\t\t"lat": 4.85,\n\t\t\t"lon": 31.6,\n\t\t\t"rules": "Sudan"\n\t\t},\n\t\t"Africa/Kampala": {\n\t\t\t"lat": 0.3167,\n\t\t\t"lon": 32.4167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Khartoum": {\n\t\t\t"lat": 15.6,\n\t\t\t"lon": 32.5333,\n\t\t\t"rules": "Sudan"\n\t\t},\n\t\t"Africa/Kigali": {\n\t\t\t"lat": -0.05,\n\t\t\t"lon": 30.0667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Kinshasa": {\n\t\t\t"lat": -3.7,\n\t\t\t"lon": 15.3,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Lagos": {\n\t\t\t"lat": 6.45,\n\t\t\t"lon": 3.4,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Libreville": {\n\t\t\t"lat": 0.3833,\n\t\t\t"lon": 9.45,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Lome": {\n\t\t\t"lat": 6.1333,\n\t\t\t"lon": 1.2167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Luanda": {\n\t\t\t"lat": -7.2,\n\t\t\t"lon": 13.2333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Lubumbashi": {\n\t\t\t"lat": -10.3333,\n\t\t\t"lon": 27.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Lusaka": {\n\t\t\t"lat": -14.5833,\n\t\t\t"lon": 28.2833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Malabo": {\n\t\t\t"lat": 3.75,\n\t\t\t"lon": 8.7833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Maputo": {\n\t\t\t"lat": -24.0333,\n\t\t\t"lon": 32.5833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Maseru": {\n\t\t\t"lat": -28.5333,\n\t\t\t"lon": 27.5,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Mbabane": {\n\t\t\t"lat": -25.7,\n\t\t\t"lon": 31.1,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Mogadishu": {\n\t\t\t"lat": 2.0667,\n\t\t\t"lon": 45.3667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Monrovia": {\n\t\t\t"lat": 6.3,\n\t\t\t"lon": -9.2167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Nairobi": {\n\t\t\t"lat": -0.7167,\n\t\t\t"lon": 36.8167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Ndjamena": {\n\t\t\t"lat": 12.1167,\n\t\t\t"lon": 15.05,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Niamey": {\n\t\t\t"lat": 13.5167,\n\t\t\t"lon": 2.1167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Nouakchott": {\n\t\t\t"lat": 18.1,\n\t\t\t"lon": -14.05,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Ouagadougou": {\n\t\t\t"lat": 12.3667,\n\t\t\t"lon": -0.4833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Porto-Novo": {\n\t\t\t"lat": 6.4833,\n\t\t\t"lon": 2.6167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Sao_Tome": {\n\t\t\t"lat": 0.3333,\n\t\t\t"lon": 6.7333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Africa/Tripoli": {\n\t\t\t"lat": 32.9,\n\t\t\t"lon": 13.1833,\n\t\t\t"rules": "Libya"\n\t\t},\n\t\t"Africa/Tunis": {\n\t\t\t"lat": 36.8,\n\t\t\t"lon": 10.1833,\n\t\t\t"rules": "Tunisia"\n\t\t},\n\t\t"Africa/Windhoek": {\n\t\t\t"lat": -21.4333,\n\t\t\t"lon": 17.1,\n\t\t\t"rules": "Namibia"\n\t\t},\n\t\t"America/Adak": {\n\t\t\t"lat": 51.88,\n\t\t\t"lon": -175.3419,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Anchorage": {\n\t\t\t"lat": 61.2181,\n\t\t\t"lon": -148.0997,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Anguilla": {\n\t\t\t"lat": 18.2,\n\t\t\t"lon": -62.9333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Antigua": {\n\t\t\t"lat": 17.05,\n\t\t\t"lon": -60.2,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Araguaina": {\n\t\t\t"lat": -6.8,\n\t\t\t"lon": -47.8,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Argentina/Buenos_Aires": {\n\t\t\t"lat": -33.4,\n\t\t\t"lon": -57.55,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/Catamarca": {\n\t\t\t"lat": -27.5333,\n\t\t\t"lon": -64.2167,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/Cordoba": {\n\t\t\t"lat": -30.6,\n\t\t\t"lon": -63.8167,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/Jujuy": {\n\t\t\t"lat": -23.8167,\n\t\t\t"lon": -64.7,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/La_Rioja": {\n\t\t\t"lat": -28.5667,\n\t\t\t"lon": -65.15,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/Mendoza": {\n\t\t\t"lat": -31.1167,\n\t\t\t"lon": -67.1833,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/Rio_Gallegos": {\n\t\t\t"lat": -50.3667,\n\t\t\t"lon": -68.7833,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/Salta": {\n\t\t\t"lat": -23.2167,\n\t\t\t"lon": -64.5833,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/San_Juan": {\n\t\t\t"lat": -30.4667,\n\t\t\t"lon": -67.4833,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/San_Luis": {\n\t\t\t"lat": -32.6833,\n\t\t\t"lon": -65.65,\n\t\t\t"rules": "Arg SanLuis"\n\t\t},\n\t\t"America/Argentina/Tucuman": {\n\t\t\t"lat": -25.1833,\n\t\t\t"lon": -64.7833,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Argentina/Ushuaia": {\n\t\t\t"lat": -53.2,\n\t\t\t"lon": -67.7,\n\t\t\t"rules": "Arg"\n\t\t},\n\t\t"America/Aruba": {\n\t\t\t"lat": 12.5,\n\t\t\t"lon": -68.0333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Asuncion": {\n\t\t\t"lat": -24.7333,\n\t\t\t"lon": -56.3333,\n\t\t\t"rules": "Para"\n\t\t},\n\t\t"America/Atikokan": {\n\t\t\t"lat": 48.7586,\n\t\t\t"lon": -90.3783,\n\t\t\t"rules": "Canada"\n\t\t},\n\t\t"America/Bahia": {\n\t\t\t"lat": -11.0167,\n\t\t\t"lon": -37.4833,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Bahia_Banderas": {\n\t\t\t"lat": 20.8,\n\t\t\t"lon": -104.75,\n\t\t\t"rules": "Mexico"\n\t\t},\n\t\t"America/Barbados": {\n\t\t\t"lat": 13.1,\n\t\t\t"lon": -58.3833,\n\t\t\t"rules": "Barb"\n\t\t},\n\t\t"America/Belem": {\n\t\t\t"lat": -0.55,\n\t\t\t"lon": -47.5167,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Belize": {\n\t\t\t"lat": 17.5,\n\t\t\t"lon": -87.8,\n\t\t\t"rules": "Belize"\n\t\t},\n\t\t"America/Blanc-Sablon": {\n\t\t\t"lat": 51.4167,\n\t\t\t"lon": -56.8833,\n\t\t\t"rules": "Canada"\n\t\t},\n\t\t"America/Boa_Vista": {\n\t\t\t"lat": 2.8167,\n\t\t\t"lon": -59.3333,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Bogota": {\n\t\t\t"lat": 4.6,\n\t\t\t"lon": -73.9167,\n\t\t\t"rules": "CO"\n\t\t},\n\t\t"America/Boise": {\n\t\t\t"lat": 43.6136,\n\t\t\t"lon": -115.7975,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Cambridge_Bay": {\n\t\t\t"lat": 69.1139,\n\t\t\t"lon": -104.9472,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Campo_Grande": {\n\t\t\t"lat": -19.55,\n\t\t\t"lon": -53.3833,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Cancun": {\n\t\t\t"lat": 21.0833,\n\t\t\t"lon": -85.2333,\n\t\t\t"rules": "Mexico"\n\t\t},\n\t\t"America/Caracas": {\n\t\t\t"lat": 10.5,\n\t\t\t"lon": -65.0667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Cayenne": {\n\t\t\t"lat": 4.9333,\n\t\t\t"lon": -51.6667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Cayman": {\n\t\t\t"lat": 19.3,\n\t\t\t"lon": -80.6167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Chicago": {\n\t\t\t"lat": 41.85,\n\t\t\t"lon": -86.35,\n\t\t\t"rules": "US Chicago"\n\t\t},\n\t\t"America/Chihuahua": {\n\t\t\t"lat": 28.6333,\n\t\t\t"lon": -105.9167,\n\t\t\t"rules": "Mexico"\n\t\t},\n\t\t"America/Costa_Rica": {\n\t\t\t"lat": 9.9333,\n\t\t\t"lon": -83.9167,\n\t\t\t"rules": "CR"\n\t\t},\n\t\t"America/Creston": {\n\t\t\t"lat": 49.1,\n\t\t\t"lon": -115.4833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Cuiaba": {\n\t\t\t"lat": -14.4167,\n\t\t\t"lon": -55.9167,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Curacao": {\n\t\t\t"lat": 12.1833,\n\t\t\t"lon": -69,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Danmarkshavn": {\n\t\t\t"lat": 76.7667,\n\t\t\t"lon": -17.3333,\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"America/Dawson": {\n\t\t\t"lat": 64.0667,\n\t\t\t"lon": -138.5833,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Dawson_Creek": {\n\t\t\t"lat": 59.7667,\n\t\t\t"lon": -119.7667,\n\t\t\t"rules": "Canada Vanc"\n\t\t},\n\t\t"America/Denver": {\n\t\t\t"lat": 39.7392,\n\t\t\t"lon": -103.0158,\n\t\t\t"rules": "US Denver"\n\t\t},\n\t\t"America/Detroit": {\n\t\t\t"lat": 42.3314,\n\t\t\t"lon": -82.9542,\n\t\t\t"rules": "US Detroit"\n\t\t},\n\t\t"America/Dominica": {\n\t\t\t"lat": 15.3,\n\t\t\t"lon": -60.6,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Edmonton": {\n\t\t\t"lat": 53.55,\n\t\t\t"lon": -112.5333,\n\t\t\t"rules": "Edm Canada"\n\t\t},\n\t\t"America/Eirunepe": {\n\t\t\t"lat": -5.3333,\n\t\t\t"lon": -68.1333,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/El_Salvador": {\n\t\t\t"lat": 13.7,\n\t\t\t"lon": -88.8,\n\t\t\t"rules": "Salv"\n\t\t},\n\t\t"America/Fortaleza": {\n\t\t\t"lat": -2.2833,\n\t\t\t"lon": -37.5,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Glace_Bay": {\n\t\t\t"lat": 46.2,\n\t\t\t"lon": -58.05,\n\t\t\t"rules": "Canada Halifax"\n\t\t},\n\t\t"America/Godthab": {\n\t\t\t"lat": 64.1833,\n\t\t\t"lon": -50.2667,\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"America/Goose_Bay": {\n\t\t\t"lat": 53.3333,\n\t\t\t"lon": -59.5833,\n\t\t\t"rules": "Canada StJohns"\n\t\t},\n\t\t"America/Grand_Turk": {\n\t\t\t"lat": 21.4667,\n\t\t\t"lon": -70.8667,\n\t\t\t"rules": "TC"\n\t\t},\n\t\t"America/Grenada": {\n\t\t\t"lat": 12.05,\n\t\t\t"lon": -60.25,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Guadeloupe": {\n\t\t\t"lat": 16.2333,\n\t\t\t"lon": -60.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Guatemala": {\n\t\t\t"lat": 14.6333,\n\t\t\t"lon": -89.4833,\n\t\t\t"rules": "Guat"\n\t\t},\n\t\t"America/Guayaquil": {\n\t\t\t"lat": -1.8333,\n\t\t\t"lon": -78.1667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Guyana": {\n\t\t\t"lat": 6.8,\n\t\t\t"lon": -57.8333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Halifax": {\n\t\t\t"lat": 44.65,\n\t\t\t"lon": -62.4,\n\t\t\t"rules": "Halifax Canada"\n\t\t},\n\t\t"America/Havana": {\n\t\t\t"lat": 23.1333,\n\t\t\t"lon": -81.6333,\n\t\t\t"rules": "Cuba"\n\t\t},\n\t\t"America/Hermosillo": {\n\t\t\t"lat": 29.0667,\n\t\t\t"lon": -109.0333,\n\t\t\t"rules": "Mexico"\n\t\t},\n\t\t"America/Indiana/Indianapolis": {\n\t\t\t"lat": 39.7683,\n\t\t\t"lon": -85.8419,\n\t\t\t"rules": "US Indianapolis"\n\t\t},\n\t\t"America/Indiana/Knox": {\n\t\t\t"lat": 41.2958,\n\t\t\t"lon": -85.375,\n\t\t\t"rules": "US Starke"\n\t\t},\n\t\t"America/Indiana/Marengo": {\n\t\t\t"lat": 38.3756,\n\t\t\t"lon": -85.6553,\n\t\t\t"rules": "US Marengo"\n\t\t},\n\t\t"America/Indiana/Petersburg": {\n\t\t\t"lat": 38.4919,\n\t\t\t"lon": -86.7214,\n\t\t\t"rules": "US Pike"\n\t\t},\n\t\t"America/Indiana/Tell_City": {\n\t\t\t"lat": 37.9531,\n\t\t\t"lon": -85.2386,\n\t\t\t"rules": "US Perry"\n\t\t},\n\t\t"America/Indiana/Vevay": {\n\t\t\t"lat": 38.7478,\n\t\t\t"lon": -84.9328,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Indiana/Vincennes": {\n\t\t\t"lat": 38.6772,\n\t\t\t"lon": -86.4714,\n\t\t\t"rules": "US Vincennes"\n\t\t},\n\t\t"America/Indiana/Winamac": {\n\t\t\t"lat": 41.0514,\n\t\t\t"lon": -85.3969,\n\t\t\t"rules": "US Pulaski"\n\t\t},\n\t\t"America/Inuvik": {\n\t\t\t"lat": 68.3497,\n\t\t\t"lon": -132.2833,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Iqaluit": {\n\t\t\t"lat": 63.7333,\n\t\t\t"lon": -67.5333,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Jamaica": {\n\t\t\t"lat": 18,\n\t\t\t"lon": -75.2,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Juneau": {\n\t\t\t"lat": 58.3019,\n\t\t\t"lon": -133.5803,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Kentucky/Louisville": {\n\t\t\t"lat": 38.2542,\n\t\t\t"lon": -84.2406,\n\t\t\t"rules": "US Louisville"\n\t\t},\n\t\t"America/Kentucky/Monticello": {\n\t\t\t"lat": 36.8297,\n\t\t\t"lon": -83.1508,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Kralendijk": {\n\t\t\t"lat": 12.1508,\n\t\t\t"lon": -67.7233,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/La_Paz": {\n\t\t\t"lat": -15.5,\n\t\t\t"lon": -67.85,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Lima": {\n\t\t\t"lat": -11.95,\n\t\t\t"lon": -76.95,\n\t\t\t"rules": "Peru"\n\t\t},\n\t\t"America/Los_Angeles": {\n\t\t\t"lat": 34.0522,\n\t\t\t"lon": -117.7572,\n\t\t\t"rules": "US CA"\n\t\t},\n\t\t"America/Lower_Princes": {\n\t\t\t"lat": 18.0514,\n\t\t\t"lon": -62.9528,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Maceio": {\n\t\t\t"lat": -8.3333,\n\t\t\t"lon": -34.2833,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Managua": {\n\t\t\t"lat": 12.15,\n\t\t\t"lon": -85.7167,\n\t\t\t"rules": "Nic"\n\t\t},\n\t\t"America/Manaus": {\n\t\t\t"lat": -2.8667,\n\t\t\t"lon": -59.9833,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Marigot": {\n\t\t\t"lat": 18.0667,\n\t\t\t"lon": -62.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Martinique": {\n\t\t\t"lat": 14.6,\n\t\t\t"lon": -60.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Matamoros": {\n\t\t\t"lat": 25.8333,\n\t\t\t"lon": -96.5,\n\t\t\t"rules": "US Mexico"\n\t\t},\n\t\t"America/Mazatlan": {\n\t\t\t"lat": 23.2167,\n\t\t\t"lon": -105.5833,\n\t\t\t"rules": "Mexico"\n\t\t},\n\t\t"America/Menominee": {\n\t\t\t"lat": 45.1078,\n\t\t\t"lon": -86.3858,\n\t\t\t"rules": "US Menominee"\n\t\t},\n\t\t"America/Merida": {\n\t\t\t"lat": 20.9667,\n\t\t\t"lon": -88.3833,\n\t\t\t"rules": "Mexico"\n\t\t},\n\t\t"America/Metlakatla": {\n\t\t\t"lat": 55.1269,\n\t\t\t"lon": -130.4236,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Mexico_City": {\n\t\t\t"lat": 19.4,\n\t\t\t"lon": -98.85,\n\t\t\t"rules": "Mexico"\n\t\t},\n\t\t"America/Miquelon": {\n\t\t\t"lat": 47.05,\n\t\t\t"lon": -55.6667,\n\t\t\t"rules": "Canada"\n\t\t},\n\t\t"America/Moncton": {\n\t\t\t"lat": 46.1,\n\t\t\t"lon": -63.2167,\n\t\t\t"rules": "Canada Moncton"\n\t\t},\n\t\t"America/Monterrey": {\n\t\t\t"lat": 25.6667,\n\t\t\t"lon": -99.6833,\n\t\t\t"rules": "US Mexico"\n\t\t},\n\t\t"America/Montevideo": {\n\t\t\t"lat": -33.1167,\n\t\t\t"lon": -55.8167,\n\t\t\t"rules": "Uruguay"\n\t\t},\n\t\t"America/Montreal": {\n\t\t\t"lat": 45.5167,\n\t\t\t"lon": -72.4333,\n\t\t\t"rules": "Mont Canada"\n\t\t},\n\t\t"America/Montserrat": {\n\t\t\t"lat": 16.7167,\n\t\t\t"lon": -61.7833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Nassau": {\n\t\t\t"lat": 25.0833,\n\t\t\t"lon": -76.65,\n\t\t\t"rules": "Bahamas US"\n\t\t},\n\t\t"America/New_York": {\n\t\t\t"lat": 40.7142,\n\t\t\t"lon": -73.9936,\n\t\t\t"rules": "US NYC"\n\t\t},\n\t\t"America/Nipigon": {\n\t\t\t"lat": 49.0167,\n\t\t\t"lon": -87.7333,\n\t\t\t"rules": "Canada"\n\t\t},\n\t\t"America/Nome": {\n\t\t\t"lat": 64.5011,\n\t\t\t"lon": -164.5936,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Noronha": {\n\t\t\t"lat": -2.15,\n\t\t\t"lon": -31.5833,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/North_Dakota/Beulah": {\n\t\t\t"lat": 47.2642,\n\t\t\t"lon": -100.2222,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/North_Dakota/Center": {\n\t\t\t"lat": 47.1164,\n\t\t\t"lon": -100.7008,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/North_Dakota/New_Salem": {\n\t\t\t"lat": 46.845,\n\t\t\t"lon": -100.5892,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Ojinaga": {\n\t\t\t"lat": 29.5667,\n\t\t\t"lon": -103.5833,\n\t\t\t"rules": "Mexico US"\n\t\t},\n\t\t"America/Panama": {\n\t\t\t"lat": 8.9667,\n\t\t\t"lon": -78.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Pangnirtung": {\n\t\t\t"lat": 66.1333,\n\t\t\t"lon": -64.2667,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Paramaribo": {\n\t\t\t"lat": 5.8333,\n\t\t\t"lon": -54.8333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Phoenix": {\n\t\t\t"lat": 33.4483,\n\t\t\t"lon": -111.9267,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Port-au-Prince": {\n\t\t\t"lat": 18.5333,\n\t\t\t"lon": -71.6667,\n\t\t\t"rules": "Haiti"\n\t\t},\n\t\t"America/Port_of_Spain": {\n\t\t\t"lat": 10.65,\n\t\t\t"lon": -60.4833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Porto_Velho": {\n\t\t\t"lat": -7.2333,\n\t\t\t"lon": -62.1,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Puerto_Rico": {\n\t\t\t"lat": 18.4683,\n\t\t\t"lon": -65.8939,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Rainy_River": {\n\t\t\t"lat": 48.7167,\n\t\t\t"lon": -93.4333,\n\t\t\t"rules": "Canada"\n\t\t},\n\t\t"America/Rankin_Inlet": {\n\t\t\t"lat": 62.8167,\n\t\t\t"lon": -91.9169,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Recife": {\n\t\t\t"lat": -7.95,\n\t\t\t"lon": -33.1,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Regina": {\n\t\t\t"lat": 50.4,\n\t\t\t"lon": -103.35,\n\t\t\t"rules": "Regina"\n\t\t},\n\t\t"America/Resolute": {\n\t\t\t"lat": 74.6956,\n\t\t\t"lon": -93.1708,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Rio_Branco": {\n\t\t\t"lat": -8.0333,\n\t\t\t"lon": -66.2,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Santa_Isabel": {\n\t\t\t"lat": 30.3,\n\t\t\t"lon": -113.1333,\n\t\t\t"rules": "CA US Mexico"\n\t\t},\n\t\t"America/Santarem": {\n\t\t\t"lat": -1.5667,\n\t\t\t"lon": -53.1333,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Santiago": {\n\t\t\t"lat": -32.55,\n\t\t\t"lon": -69.3333,\n\t\t\t"rules": "Chile"\n\t\t},\n\t\t"America/Santo_Domingo": {\n\t\t\t"lat": 18.4667,\n\t\t\t"lon": -68.1,\n\t\t\t"rules": "DR US"\n\t\t},\n\t\t"America/Sao_Paulo": {\n\t\t\t"lat": -22.4667,\n\t\t\t"lon": -45.3833,\n\t\t\t"rules": "Brazil"\n\t\t},\n\t\t"America/Scoresbysund": {\n\t\t\t"lat": 70.4833,\n\t\t\t"lon": -20.0333,\n\t\t\t"rules": "C-Eur EU"\n\t\t},\n\t\t"America/Shiprock": {\n\t\t\t"lat": 36.7856,\n\t\t\t"lon": -107.3136,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Sitka": {\n\t\t\t"lat": 57.1764,\n\t\t\t"lon": -134.6981,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/St_Barthelemy": {\n\t\t\t"lat": 17.8833,\n\t\t\t"lon": -61.15,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/St_Johns": {\n\t\t\t"lat": 47.5667,\n\t\t\t"lon": -51.2833,\n\t\t\t"rules": "StJohns Canada"\n\t\t},\n\t\t"America/St_Kitts": {\n\t\t\t"lat": 17.3,\n\t\t\t"lon": -61.2833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/St_Lucia": {\n\t\t\t"lat": 14.0167,\n\t\t\t"lon": -61,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/St_Thomas": {\n\t\t\t"lat": 18.35,\n\t\t\t"lon": -63.0667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/St_Vincent": {\n\t\t\t"lat": 13.15,\n\t\t\t"lon": -60.7667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Swift_Current": {\n\t\t\t"lat": 50.2833,\n\t\t\t"lon": -106.1667,\n\t\t\t"rules": "Canada Regina Swift"\n\t\t},\n\t\t"America/Tegucigalpa": {\n\t\t\t"lat": 14.1,\n\t\t\t"lon": -86.7833,\n\t\t\t"rules": "Hond"\n\t\t},\n\t\t"America/Thule": {\n\t\t\t"lat": 76.5667,\n\t\t\t"lon": -67.2167,\n\t\t\t"rules": "Thule"\n\t\t},\n\t\t"America/Thunder_Bay": {\n\t\t\t"lat": 48.3833,\n\t\t\t"lon": -88.75,\n\t\t\t"rules": "Canada Mont"\n\t\t},\n\t\t"America/Tijuana": {\n\t\t\t"lat": 32.5333,\n\t\t\t"lon": -116.9833,\n\t\t\t"rules": "CA US Mexico"\n\t\t},\n\t\t"America/Toronto": {\n\t\t\t"lat": 43.65,\n\t\t\t"lon": -78.6167,\n\t\t\t"rules": "Canada Toronto"\n\t\t},\n\t\t"America/Tortola": {\n\t\t\t"lat": 18.45,\n\t\t\t"lon": -63.3833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"America/Vancouver": {\n\t\t\t"lat": 49.2667,\n\t\t\t"lon": -122.8833,\n\t\t\t"rules": "Vanc Canada"\n\t\t},\n\t\t"America/Whitehorse": {\n\t\t\t"lat": 60.7167,\n\t\t\t"lon": -134.95,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"America/Winnipeg": {\n\t\t\t"lat": 49.8833,\n\t\t\t"lon": -96.85,\n\t\t\t"rules": "Winn Canada"\n\t\t},\n\t\t"America/Yakutat": {\n\t\t\t"lat": 59.5469,\n\t\t\t"lon": -138.2728,\n\t\t\t"rules": "US"\n\t\t},\n\t\t"America/Yellowknife": {\n\t\t\t"lat": 62.45,\n\t\t\t"lon": -113.65,\n\t\t\t"rules": "NT_YK Canada"\n\t\t},\n\t\t"Antarctica/Casey": {\n\t\t\t"lat": -65.7167,\n\t\t\t"lon": 110.5167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Antarctica/Davis": {\n\t\t\t"lat": -67.4167,\n\t\t\t"lon": 77.9667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Antarctica/DumontDUrville": {\n\t\t\t"lat": -65.3333,\n\t\t\t"lon": 140.0167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Antarctica/Macquarie": {\n\t\t\t"lat": -53.5,\n\t\t\t"lon": 158.95,\n\t\t\t"rules": "Aus AT"\n\t\t},\n\t\t"Antarctica/Mawson": {\n\t\t\t"lat": -66.4,\n\t\t\t"lon": 62.8833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Antarctica/McMurdo": {\n\t\t\t"lat": -76.1667,\n\t\t\t"lon": 166.6,\n\t\t\t"rules": "NZAQ"\n\t\t},\n\t\t"Antarctica/Palmer": {\n\t\t\t"lat": -63.2,\n\t\t\t"lon": -63.9,\n\t\t\t"rules": "ArgAQ ChileAQ"\n\t\t},\n\t\t"Antarctica/Rothera": {\n\t\t\t"lat": -66.4333,\n\t\t\t"lon": -67.8667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Antarctica/South_Pole": {\n\t\t\t"lat": -90,\n\t\t\t"lon": 0,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Antarctica/Syowa": {\n\t\t\t"lat": -68.9939,\n\t\t\t"lon": 39.59,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Antarctica/Vostok": {\n\t\t\t"lat": -77.6,\n\t\t\t"lon": 106.9,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Arctic/Longyearbyen": {\n\t\t\t"lat": 78,\n\t\t\t"lon": 16,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Aden": {\n\t\t\t"lat": 12.75,\n\t\t\t"lon": 45.2,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Almaty": {\n\t\t\t"lat": 43.25,\n\t\t\t"lon": 76.95,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Amman": {\n\t\t\t"lat": 31.95,\n\t\t\t"lon": 35.9333,\n\t\t\t"rules": "Jordan"\n\t\t},\n\t\t"Asia/Anadyr": {\n\t\t\t"lat": 64.75,\n\t\t\t"lon": 177.4833,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Aqtau": {\n\t\t\t"lat": 44.5167,\n\t\t\t"lon": 50.2667,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Aqtobe": {\n\t\t\t"lat": 50.2833,\n\t\t\t"lon": 57.1667,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Ashgabat": {\n\t\t\t"lat": 37.95,\n\t\t\t"lon": 58.3833,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Baghdad": {\n\t\t\t"lat": 33.35,\n\t\t\t"lon": 44.4167,\n\t\t\t"rules": "Iraq"\n\t\t},\n\t\t"Asia/Bahrain": {\n\t\t\t"lat": 26.3833,\n\t\t\t"lon": 50.5833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Baku": {\n\t\t\t"lat": 40.3833,\n\t\t\t"lon": 49.85,\n\t\t\t"rules": "RussiaAsia EUAsia Azer"\n\t\t},\n\t\t"Asia/Bangkok": {\n\t\t\t"lat": 13.75,\n\t\t\t"lon": 100.5167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Beirut": {\n\t\t\t"lat": 33.8833,\n\t\t\t"lon": 35.5,\n\t\t\t"rules": "Lebanon"\n\t\t},\n\t\t"Asia/Bishkek": {\n\t\t\t"lat": 42.9,\n\t\t\t"lon": 74.6,\n\t\t\t"rules": "RussiaAsia Kyrgyz"\n\t\t},\n\t\t"Asia/Brunei": {\n\t\t\t"lat": 4.9333,\n\t\t\t"lon": 114.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Choibalsan": {\n\t\t\t"lat": 48.0667,\n\t\t\t"lon": 114.5,\n\t\t\t"rules": "Mongol"\n\t\t},\n\t\t"Asia/Chongqing": {\n\t\t\t"lat": 29.5667,\n\t\t\t"lon": 106.5833,\n\t\t\t"rules": "PRC"\n\t\t},\n\t\t"Asia/Colombo": {\n\t\t\t"lat": 6.9333,\n\t\t\t"lon": 79.85,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Damascus": {\n\t\t\t"lat": 33.5,\n\t\t\t"lon": 36.3,\n\t\t\t"rules": "Syria"\n\t\t},\n\t\t"Asia/Dhaka": {\n\t\t\t"lat": 23.7167,\n\t\t\t"lon": 90.4167,\n\t\t\t"rules": "Dhaka"\n\t\t},\n\t\t"Asia/Dili": {\n\t\t\t"lat": -7.45,\n\t\t\t"lon": 125.5833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Dubai": {\n\t\t\t"lat": 25.3,\n\t\t\t"lon": 55.3,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Dushanbe": {\n\t\t\t"lat": 38.5833,\n\t\t\t"lon": 68.8,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Gaza": {\n\t\t\t"lat": 31.5,\n\t\t\t"lon": 34.4667,\n\t\t\t"rules": "Zion EgyptAsia Jordan Palestine"\n\t\t},\n\t\t"Asia/Harbin": {\n\t\t\t"lat": 45.75,\n\t\t\t"lon": 126.6833,\n\t\t\t"rules": "PRC"\n\t\t},\n\t\t"Asia/Hebron": {\n\t\t\t"lat": 31.5333,\n\t\t\t"lon": 35.095,\n\t\t\t"rules": "Zion EgyptAsia Jordan Palestine"\n\t\t},\n\t\t"Asia/Ho_Chi_Minh": {\n\t\t\t"lat": 10.75,\n\t\t\t"lon": 106.6667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Hong_Kong": {\n\t\t\t"lat": 22.2833,\n\t\t\t"lon": 114.15,\n\t\t\t"rules": "HK"\n\t\t},\n\t\t"Asia/Hovd": {\n\t\t\t"lat": 48.0167,\n\t\t\t"lon": 91.65,\n\t\t\t"rules": "Mongol"\n\t\t},\n\t\t"Asia/Irkutsk": {\n\t\t\t"lat": 52.2667,\n\t\t\t"lon": 104.3333,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Jakarta": {\n\t\t\t"lat": -5.8333,\n\t\t\t"lon": 106.8,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Jayapura": {\n\t\t\t"lat": -1.4667,\n\t\t\t"lon": 140.7,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Jerusalem": {\n\t\t\t"lat": 31.7667,\n\t\t\t"lon": 35.2333,\n\t\t\t"rules": "Zion"\n\t\t},\n\t\t"Asia/Kabul": {\n\t\t\t"lat": 34.5167,\n\t\t\t"lon": 69.2,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Kamchatka": {\n\t\t\t"lat": 53.0167,\n\t\t\t"lon": 158.65,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Karachi": {\n\t\t\t"lat": 24.8667,\n\t\t\t"lon": 67.05,\n\t\t\t"rules": "Pakistan"\n\t\t},\n\t\t"Asia/Kashgar": {\n\t\t\t"lat": 39.4833,\n\t\t\t"lon": 75.9833,\n\t\t\t"rules": "PRC"\n\t\t},\n\t\t"Asia/Kathmandu": {\n\t\t\t"lat": 27.7167,\n\t\t\t"lon": 85.3167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Khandyga": {\n\t\t\t"lat": 62.6564,\n\t\t\t"lon": 135.5539,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Kolkata": {\n\t\t\t"lat": 22.5333,\n\t\t\t"lon": 88.3667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Krasnoyarsk": {\n\t\t\t"lat": 56.0167,\n\t\t\t"lon": 92.8333,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Kuala_Lumpur": {\n\t\t\t"lat": 3.1667,\n\t\t\t"lon": 101.7,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Kuching": {\n\t\t\t"lat": 1.55,\n\t\t\t"lon": 110.3333,\n\t\t\t"rules": "NBorneo"\n\t\t},\n\t\t"Asia/Kuwait": {\n\t\t\t"lat": 29.3333,\n\t\t\t"lon": 47.9833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Macau": {\n\t\t\t"lat": 22.2333,\n\t\t\t"lon": 113.5833,\n\t\t\t"rules": "Macau PRC"\n\t\t},\n\t\t"Asia/Magadan": {\n\t\t\t"lat": 59.5667,\n\t\t\t"lon": 150.8,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Makassar": {\n\t\t\t"lat": -4.8833,\n\t\t\t"lon": 119.4,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Manila": {\n\t\t\t"lat": 14.5833,\n\t\t\t"lon": 121,\n\t\t\t"rules": "Phil"\n\t\t},\n\t\t"Asia/Muscat": {\n\t\t\t"lat": 23.6,\n\t\t\t"lon": 58.5833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Nicosia": {\n\t\t\t"lat": 35.1667,\n\t\t\t"lon": 33.3667,\n\t\t\t"rules": "Cyprus EUAsia"\n\t\t},\n\t\t"Asia/Novokuznetsk": {\n\t\t\t"lat": 53.75,\n\t\t\t"lon": 87.1167,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Novosibirsk": {\n\t\t\t"lat": 55.0333,\n\t\t\t"lon": 82.9167,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Omsk": {\n\t\t\t"lat": 55,\n\t\t\t"lon": 73.4,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Oral": {\n\t\t\t"lat": 51.2167,\n\t\t\t"lon": 51.35,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Phnom_Penh": {\n\t\t\t"lat": 11.55,\n\t\t\t"lon": 104.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Pontianak": {\n\t\t\t"lat": 0.0333,\n\t\t\t"lon": 109.3333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Pyongyang": {\n\t\t\t"lat": 39.0167,\n\t\t\t"lon": 125.75,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Qatar": {\n\t\t\t"lat": 25.2833,\n\t\t\t"lon": 51.5333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Qyzylorda": {\n\t\t\t"lat": 44.8,\n\t\t\t"lon": 65.4667,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Rangoon": {\n\t\t\t"lat": 16.7833,\n\t\t\t"lon": 96.1667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Riyadh": {\n\t\t\t"lat": 24.6333,\n\t\t\t"lon": 46.7167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Sakhalin": {\n\t\t\t"lat": 46.9667,\n\t\t\t"lon": 142.7,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Samarkand": {\n\t\t\t"lat": 39.6667,\n\t\t\t"lon": 66.8,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Seoul": {\n\t\t\t"lat": 37.55,\n\t\t\t"lon": 126.9667,\n\t\t\t"rules": "ROK"\n\t\t},\n\t\t"Asia/Shanghai": {\n\t\t\t"lat": 31.2333,\n\t\t\t"lon": 121.4667,\n\t\t\t"rules": "Shang PRC"\n\t\t},\n\t\t"Asia/Singapore": {\n\t\t\t"lat": 1.2833,\n\t\t\t"lon": 103.85,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Taipei": {\n\t\t\t"lat": 25.05,\n\t\t\t"lon": 121.5,\n\t\t\t"rules": "Taiwan"\n\t\t},\n\t\t"Asia/Tashkent": {\n\t\t\t"lat": 41.3333,\n\t\t\t"lon": 69.3,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Asia/Tbilisi": {\n\t\t\t"lat": 41.7167,\n\t\t\t"lon": 44.8167,\n\t\t\t"rules": "RussiaAsia E-EurAsia"\n\t\t},\n\t\t"Asia/Tehran": {\n\t\t\t"lat": 35.6667,\n\t\t\t"lon": 51.4333,\n\t\t\t"rules": "Iran"\n\t\t},\n\t\t"Asia/Thimphu": {\n\t\t\t"lat": 27.4667,\n\t\t\t"lon": 89.65,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Tokyo": {\n\t\t\t"lat": 35.6544,\n\t\t\t"lon": 139.7447,\n\t\t\t"rules": "Japan"\n\t\t},\n\t\t"Asia/Ulaanbaatar": {\n\t\t\t"lat": 47.9167,\n\t\t\t"lon": 106.8833,\n\t\t\t"rules": "Mongol"\n\t\t},\n\t\t"Asia/Urumqi": {\n\t\t\t"lat": 43.8,\n\t\t\t"lon": 87.5833,\n\t\t\t"rules": "PRC"\n\t\t},\n\t\t"Asia/Ust-Nera": {\n\t\t\t"lat": 64.5603,\n\t\t\t"lon": 143.2267,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Vientiane": {\n\t\t\t"lat": 17.9667,\n\t\t\t"lon": 102.6,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Asia/Vladivostok": {\n\t\t\t"lat": 43.1667,\n\t\t\t"lon": 131.9333,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Yakutsk": {\n\t\t\t"lat": 62,\n\t\t\t"lon": 129.6667,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Yekaterinburg": {\n\t\t\t"lat": 56.85,\n\t\t\t"lon": 60.6,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Asia/Yerevan": {\n\t\t\t"lat": 40.1833,\n\t\t\t"lon": 44.5,\n\t\t\t"rules": "RussiaAsia"\n\t\t},\n\t\t"Atlantic/Azores": {\n\t\t\t"lat": 37.7333,\n\t\t\t"lon": -24.3333,\n\t\t\t"rules": "Port W-Eur EU"\n\t\t},\n\t\t"Atlantic/Bermuda": {\n\t\t\t"lat": 32.2833,\n\t\t\t"lon": -63.2333,\n\t\t\t"rules": "Bahamas US"\n\t\t},\n\t\t"Atlantic/Canary": {\n\t\t\t"lat": 28.1,\n\t\t\t"lon": -14.6,\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"Atlantic/Cape_Verde": {\n\t\t\t"lat": 14.9167,\n\t\t\t"lon": -22.4833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Atlantic/Faroe": {\n\t\t\t"lat": 62.0167,\n\t\t\t"lon": -5.2333,\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"Atlantic/Madeira": {\n\t\t\t"lat": 32.6333,\n\t\t\t"lon": -15.1,\n\t\t\t"rules": "Port EU"\n\t\t},\n\t\t"Atlantic/Reykjavik": {\n\t\t\t"lat": 64.15,\n\t\t\t"lon": -20.15,\n\t\t\t"rules": "Iceland"\n\t\t},\n\t\t"Atlantic/South_Georgia": {\n\t\t\t"lat": -53.7333,\n\t\t\t"lon": -35.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Atlantic/St_Helena": {\n\t\t\t"lat": -14.0833,\n\t\t\t"lon": -4.3,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Atlantic/Stanley": {\n\t\t\t"lat": -50.3,\n\t\t\t"lon": -56.15,\n\t\t\t"rules": "Falk"\n\t\t},\n\t\t"Australia/Adelaide": {\n\t\t\t"lat": -33.0833,\n\t\t\t"lon": 138.5833,\n\t\t\t"rules": "Aus AS"\n\t\t},\n\t\t"Australia/Brisbane": {\n\t\t\t"lat": -26.5333,\n\t\t\t"lon": 153.0333,\n\t\t\t"rules": "Aus AQ"\n\t\t},\n\t\t"Australia/Broken_Hill": {\n\t\t\t"lat": -30.05,\n\t\t\t"lon": 141.45,\n\t\t\t"rules": "Aus AN AS"\n\t\t},\n\t\t"Australia/Currie": {\n\t\t\t"lat": -38.0667,\n\t\t\t"lon": 143.8667,\n\t\t\t"rules": "Aus AT"\n\t\t},\n\t\t"Australia/Darwin": {\n\t\t\t"lat": -11.5333,\n\t\t\t"lon": 130.8333,\n\t\t\t"rules": "Aus"\n\t\t},\n\t\t"Australia/Eucla": {\n\t\t\t"lat": -30.2833,\n\t\t\t"lon": 128.8667,\n\t\t\t"rules": "Aus AW"\n\t\t},\n\t\t"Australia/Hobart": {\n\t\t\t"lat": -41.1167,\n\t\t\t"lon": 147.3167,\n\t\t\t"rules": "Aus AT"\n\t\t},\n\t\t"Australia/Lindeman": {\n\t\t\t"lat": -19.7333,\n\t\t\t"lon": 149,\n\t\t\t"rules": "Aus AQ Holiday"\n\t\t},\n\t\t"Australia/Lord_Howe": {\n\t\t\t"lat": -30.45,\n\t\t\t"lon": 159.0833,\n\t\t\t"rules": "LH"\n\t\t},\n\t\t"Australia/Melbourne": {\n\t\t\t"lat": -36.1833,\n\t\t\t"lon": 144.9667,\n\t\t\t"rules": "Aus AV"\n\t\t},\n\t\t"Australia/Perth": {\n\t\t\t"lat": -30.05,\n\t\t\t"lon": 115.85,\n\t\t\t"rules": "Aus AW"\n\t\t},\n\t\t"Australia/Sydney": {\n\t\t\t"lat": -32.1333,\n\t\t\t"lon": 151.2167,\n\t\t\t"rules": "Aus AN"\n\t\t},\n\t\t"CET": {\n\t\t\t"rules": "C-Eur"\n\t\t},\n\t\t"CST6CDT": {\n\t\t\t"rules": "US"\n\t\t},\n\t\t"EET": {\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"EST": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"EST5EDT": {\n\t\t\t"rules": "US"\n\t\t},\n\t\t"Etc/GMT": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+1": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+10": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+11": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+12": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+2": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+3": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+4": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+5": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+6": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+7": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+8": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT+9": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-1": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-10": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-11": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-12": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-13": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-14": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-2": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-3": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-4": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-5": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-6": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-7": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-8": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/GMT-9": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/UCT": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Etc/UTC": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Amsterdam": {\n\t\t\t"lat": 52.3667,\n\t\t\t"lon": 4.9,\n\t\t\t"rules": "Neth C-Eur EU"\n\t\t},\n\t\t"Europe/Andorra": {\n\t\t\t"lat": 42.5,\n\t\t\t"lon": 1.5167,\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"Europe/Athens": {\n\t\t\t"lat": 37.9667,\n\t\t\t"lon": 23.7167,\n\t\t\t"rules": "Greece EU"\n\t\t},\n\t\t"Europe/Belgrade": {\n\t\t\t"lat": 44.8333,\n\t\t\t"lon": 20.5,\n\t\t\t"rules": "C-Eur EU"\n\t\t},\n\t\t"Europe/Berlin": {\n\t\t\t"lat": 52.5,\n\t\t\t"lon": 13.3667,\n\t\t\t"rules": "C-Eur SovietZone Germany EU"\n\t\t},\n\t\t"Europe/Bratislava": {\n\t\t\t"lat": 48.15,\n\t\t\t"lon": 17.1167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Brussels": {\n\t\t\t"lat": 50.8333,\n\t\t\t"lon": 4.3333,\n\t\t\t"rules": "C-Eur Belgium EU"\n\t\t},\n\t\t"Europe/Bucharest": {\n\t\t\t"lat": 44.4333,\n\t\t\t"lon": 26.1,\n\t\t\t"rules": "Romania C-Eur E-Eur EU"\n\t\t},\n\t\t"Europe/Budapest": {\n\t\t\t"lat": 47.5,\n\t\t\t"lon": 19.0833,\n\t\t\t"rules": "C-Eur Hungary EU"\n\t\t},\n\t\t"Europe/Busingen": {\n\t\t\t"lat": 47.7,\n\t\t\t"lon": 8.6833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Chisinau": {\n\t\t\t"lat": 47,\n\t\t\t"lon": 28.8333,\n\t\t\t"rules": "Romania C-Eur Russia E-Eur EU"\n\t\t},\n\t\t"Europe/Copenhagen": {\n\t\t\t"lat": 55.6667,\n\t\t\t"lon": 12.5833,\n\t\t\t"rules": "Denmark C-Eur EU"\n\t\t},\n\t\t"Europe/Dublin": {\n\t\t\t"lat": 53.3333,\n\t\t\t"lon": -5.75,\n\t\t\t"rules": "GB-Eire EU"\n\t\t},\n\t\t"Europe/Gibraltar": {\n\t\t\t"lat": 36.1333,\n\t\t\t"lon": -4.65,\n\t\t\t"rules": "GB-Eire EU"\n\t\t},\n\t\t"Europe/Guernsey": {\n\t\t\t"lat": 49.45,\n\t\t\t"lon": -1.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Helsinki": {\n\t\t\t"lat": 60.1667,\n\t\t\t"lon": 24.9667,\n\t\t\t"rules": "Finland EU"\n\t\t},\n\t\t"Europe/Isle_of_Man": {\n\t\t\t"lat": 54.15,\n\t\t\t"lon": -3.5333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Istanbul": {\n\t\t\t"lat": 41.0167,\n\t\t\t"lon": 28.9667,\n\t\t\t"rules": "Turkey EU"\n\t\t},\n\t\t"Europe/Jersey": {\n\t\t\t"lat": 49.2,\n\t\t\t"lon": -1.8833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Kaliningrad": {\n\t\t\t"lat": 54.7167,\n\t\t\t"lon": 20.5,\n\t\t\t"rules": "C-Eur Poland Russia"\n\t\t},\n\t\t"Europe/Kiev": {\n\t\t\t"lat": 50.4333,\n\t\t\t"lon": 30.5167,\n\t\t\t"rules": "C-Eur Russia E-Eur EU"\n\t\t},\n\t\t"Europe/Lisbon": {\n\t\t\t"lat": 38.7167,\n\t\t\t"lon": -8.8667,\n\t\t\t"rules": "Port W-Eur EU"\n\t\t},\n\t\t"Europe/Ljubljana": {\n\t\t\t"lat": 46.05,\n\t\t\t"lon": 14.5167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/London": {\n\t\t\t"lat": 51.5083,\n\t\t\t"lon": 0.1253,\n\t\t\t"rules": "GB-Eire EU"\n\t\t},\n\t\t"Europe/Luxembourg": {\n\t\t\t"lat": 49.6,\n\t\t\t"lon": 6.15,\n\t\t\t"rules": "Lux Belgium C-Eur EU"\n\t\t},\n\t\t"Europe/Madrid": {\n\t\t\t"lat": 40.4,\n\t\t\t"lon": -2.3167,\n\t\t\t"rules": "Spain EU"\n\t\t},\n\t\t"Europe/Malta": {\n\t\t\t"lat": 35.9,\n\t\t\t"lon": 14.5167,\n\t\t\t"rules": "Italy C-Eur Malta EU"\n\t\t},\n\t\t"Europe/Mariehamn": {\n\t\t\t"lat": 60.1,\n\t\t\t"lon": 19.95,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Minsk": {\n\t\t\t"lat": 53.9,\n\t\t\t"lon": 27.5667,\n\t\t\t"rules": "C-Eur Russia"\n\t\t},\n\t\t"Europe/Monaco": {\n\t\t\t"lat": 43.7,\n\t\t\t"lon": 7.3833,\n\t\t\t"rules": "France EU"\n\t\t},\n\t\t"Europe/Moscow": {\n\t\t\t"lat": 55.75,\n\t\t\t"lon": 37.5833,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Europe/Oslo": {\n\t\t\t"lat": 59.9167,\n\t\t\t"lon": 10.75,\n\t\t\t"rules": "Norway C-Eur EU"\n\t\t},\n\t\t"Europe/Paris": {\n\t\t\t"lat": 48.8667,\n\t\t\t"lon": 2.3333,\n\t\t\t"rules": "France C-Eur EU"\n\t\t},\n\t\t"Europe/Podgorica": {\n\t\t\t"lat": 42.4333,\n\t\t\t"lon": 19.2667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Prague": {\n\t\t\t"lat": 50.0833,\n\t\t\t"lon": 14.4333,\n\t\t\t"rules": "C-Eur Czech EU"\n\t\t},\n\t\t"Europe/Riga": {\n\t\t\t"lat": 56.95,\n\t\t\t"lon": 24.1,\n\t\t\t"rules": "C-Eur Russia Latvia EU"\n\t\t},\n\t\t"Europe/Rome": {\n\t\t\t"lat": 41.9,\n\t\t\t"lon": 12.4833,\n\t\t\t"rules": "Italy C-Eur EU"\n\t\t},\n\t\t"Europe/Samara": {\n\t\t\t"lat": 53.2,\n\t\t\t"lon": 50.15,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Europe/San_Marino": {\n\t\t\t"lat": 43.9167,\n\t\t\t"lon": 12.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Sarajevo": {\n\t\t\t"lat": 43.8667,\n\t\t\t"lon": 18.4167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Simferopol": {\n\t\t\t"lat": 44.95,\n\t\t\t"lon": 34.1,\n\t\t\t"rules": "C-Eur Russia E-Eur EU"\n\t\t},\n\t\t"Europe/Skopje": {\n\t\t\t"lat": 41.9833,\n\t\t\t"lon": 21.4333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Sofia": {\n\t\t\t"lat": 42.6833,\n\t\t\t"lon": 23.3167,\n\t\t\t"rules": "C-Eur Bulg E-Eur EU"\n\t\t},\n\t\t"Europe/Stockholm": {\n\t\t\t"lat": 59.3333,\n\t\t\t"lon": 18.05,\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"Europe/Tallinn": {\n\t\t\t"lat": 59.4167,\n\t\t\t"lon": 24.75,\n\t\t\t"rules": "C-Eur Russia EU"\n\t\t},\n\t\t"Europe/Tirane": {\n\t\t\t"lat": 41.3333,\n\t\t\t"lon": 19.8333,\n\t\t\t"rules": "Albania EU"\n\t\t},\n\t\t"Europe/Uzhgorod": {\n\t\t\t"lat": 48.6167,\n\t\t\t"lon": 22.3,\n\t\t\t"rules": "C-Eur Russia E-Eur EU"\n\t\t},\n\t\t"Europe/Vaduz": {\n\t\t\t"lat": 47.15,\n\t\t\t"lon": 9.5167,\n\t\t\t"rules": "EU"\n\t\t},\n\t\t"Europe/Vatican": {\n\t\t\t"lat": 41.9022,\n\t\t\t"lon": 12.4531,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Vienna": {\n\t\t\t"lat": 48.2167,\n\t\t\t"lon": 16.3333,\n\t\t\t"rules": "C-Eur Austria EU"\n\t\t},\n\t\t"Europe/Vilnius": {\n\t\t\t"lat": 54.6833,\n\t\t\t"lon": 25.3167,\n\t\t\t"rules": "C-Eur Russia EU"\n\t\t},\n\t\t"Europe/Volgograd": {\n\t\t\t"lat": 48.7333,\n\t\t\t"lon": 44.4167,\n\t\t\t"rules": "Russia"\n\t\t},\n\t\t"Europe/Warsaw": {\n\t\t\t"lat": 52.25,\n\t\t\t"lon": 21,\n\t\t\t"rules": "C-Eur Poland W-Eur EU"\n\t\t},\n\t\t"Europe/Zagreb": {\n\t\t\t"lat": 45.8,\n\t\t\t"lon": 15.9667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Europe/Zaporozhye": {\n\t\t\t"lat": 47.8333,\n\t\t\t"lon": 35.1667,\n\t\t\t"rules": "C-Eur Russia E-Eur EU"\n\t\t},\n\t\t"Europe/Zurich": {\n\t\t\t"lat": 47.3833,\n\t\t\t"lon": 8.5333,\n\t\t\t"rules": "Swiss EU"\n\t\t},\n\t\t"HST": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Antananarivo": {\n\t\t\t"lat": -17.0833,\n\t\t\t"lon": 47.5167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Chagos": {\n\t\t\t"lat": -6.6667,\n\t\t\t"lon": 72.4167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Christmas": {\n\t\t\t"lat": -9.5833,\n\t\t\t"lon": 105.7167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Cocos": {\n\t\t\t"lat": -11.8333,\n\t\t\t"lon": 96.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Comoro": {\n\t\t\t"lat": -10.3167,\n\t\t\t"lon": 43.2667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Kerguelen": {\n\t\t\t"lat": -48.6472,\n\t\t\t"lon": 70.2175,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Mahe": {\n\t\t\t"lat": -3.3333,\n\t\t\t"lon": 55.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Maldives": {\n\t\t\t"lat": 4.1667,\n\t\t\t"lon": 73.5,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Mauritius": {\n\t\t\t"lat": -19.8333,\n\t\t\t"lon": 57.5,\n\t\t\t"rules": "Mauritius"\n\t\t},\n\t\t"Indian/Mayotte": {\n\t\t\t"lat": -11.2167,\n\t\t\t"lon": 45.2333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Indian/Reunion": {\n\t\t\t"lat": -19.1333,\n\t\t\t"lon": 55.4667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"MET": {\n\t\t\t"rules": "C-Eur"\n\t\t},\n\t\t"MST": {\n\t\t\t"rules": ""\n\t\t},\n\t\t"MST7MDT": {\n\t\t\t"rules": "US"\n\t\t},\n\t\t"PST8PDT": {\n\t\t\t"rules": "US"\n\t\t},\n\t\t"Pacific/Apia": {\n\t\t\t"lat": -12.1667,\n\t\t\t"lon": -170.2667,\n\t\t\t"rules": "WS"\n\t\t},\n\t\t"Pacific/Auckland": {\n\t\t\t"lat": -35.1333,\n\t\t\t"lon": 174.7667,\n\t\t\t"rules": "NZ"\n\t\t},\n\t\t"Pacific/Chatham": {\n\t\t\t"lat": -42.05,\n\t\t\t"lon": -175.45,\n\t\t\t"rules": "Chatham"\n\t\t},\n\t\t"Pacific/Chuuk": {\n\t\t\t"lat": 7.4167,\n\t\t\t"lon": 151.7833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Easter": {\n\t\t\t"lat": -26.85,\n\t\t\t"lon": -108.5667,\n\t\t\t"rules": "Chile"\n\t\t},\n\t\t"Pacific/Efate": {\n\t\t\t"lat": -16.3333,\n\t\t\t"lon": 168.4167,\n\t\t\t"rules": "Vanuatu"\n\t\t},\n\t\t"Pacific/Enderbury": {\n\t\t\t"lat": -2.8667,\n\t\t\t"lon": -170.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Fakaofo": {\n\t\t\t"lat": -8.6333,\n\t\t\t"lon": -170.7667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Fiji": {\n\t\t\t"lat": -17.8667,\n\t\t\t"lon": 178.4167,\n\t\t\t"rules": "Fiji"\n\t\t},\n\t\t"Pacific/Funafuti": {\n\t\t\t"lat": -7.4833,\n\t\t\t"lon": 179.2167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Galapagos": {\n\t\t\t"lat": 0.9,\n\t\t\t"lon": -88.4,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Gambier": {\n\t\t\t"lat": -22.8667,\n\t\t\t"lon": -133.05,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Guadalcanal": {\n\t\t\t"lat": -8.4667,\n\t\t\t"lon": 160.2,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Guam": {\n\t\t\t"lat": 13.4667,\n\t\t\t"lon": 144.75,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Honolulu": {\n\t\t\t"lat": 21.3069,\n\t\t\t"lon": -156.1417,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Johnston": {\n\t\t\t"lat": 16.75,\n\t\t\t"lon": -168.4833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Kiritimati": {\n\t\t\t"lat": 1.8667,\n\t\t\t"lon": -156.6667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Kosrae": {\n\t\t\t"lat": 5.3167,\n\t\t\t"lon": 162.9833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Kwajalein": {\n\t\t\t"lat": 9.0833,\n\t\t\t"lon": 167.3333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Majuro": {\n\t\t\t"lat": 7.15,\n\t\t\t"lon": 171.2,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Marquesas": {\n\t\t\t"lat": -9,\n\t\t\t"lon": -138.5,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Midway": {\n\t\t\t"lat": 28.2167,\n\t\t\t"lon": -176.6333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Nauru": {\n\t\t\t"lat": 0.5167,\n\t\t\t"lon": 166.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Niue": {\n\t\t\t"lat": -18.9833,\n\t\t\t"lon": -168.0833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Norfolk": {\n\t\t\t"lat": -28.95,\n\t\t\t"lon": 167.9667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Noumea": {\n\t\t\t"lat": -21.7333,\n\t\t\t"lon": 166.45,\n\t\t\t"rules": "NC"\n\t\t},\n\t\t"Pacific/Pago_Pago": {\n\t\t\t"lat": -13.7333,\n\t\t\t"lon": -169.3,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Palau": {\n\t\t\t"lat": 7.3333,\n\t\t\t"lon": 134.4833,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Pitcairn": {\n\t\t\t"lat": -24.9333,\n\t\t\t"lon": -129.9167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Pohnpei": {\n\t\t\t"lat": 6.9667,\n\t\t\t"lon": 158.2167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Port_Moresby": {\n\t\t\t"lat": -8.5,\n\t\t\t"lon": 147.1667,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Rarotonga": {\n\t\t\t"lat": -20.7667,\n\t\t\t"lon": -158.2333,\n\t\t\t"rules": "Cook"\n\t\t},\n\t\t"Pacific/Saipan": {\n\t\t\t"lat": 15.2,\n\t\t\t"lon": 145.75,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Tahiti": {\n\t\t\t"lat": -16.4667,\n\t\t\t"lon": -148.4333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Tarawa": {\n\t\t\t"lat": 1.4167,\n\t\t\t"lon": 173,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Tongatapu": {\n\t\t\t"lat": -20.8333,\n\t\t\t"lon": -174.8333,\n\t\t\t"rules": "Tonga"\n\t\t},\n\t\t"Pacific/Wake": {\n\t\t\t"lat": 19.2833,\n\t\t\t"lon": 166.6167,\n\t\t\t"rules": ""\n\t\t},\n\t\t"Pacific/Wallis": {\n\t\t\t"lat": -12.7,\n\t\t\t"lon": -175.8333,\n\t\t\t"rules": ""\n\t\t},\n\t\t"WET": {\n\t\t\t"rules": "EU"\n\t\t}\n\t},\n\t"rules": {\n\t\t"AN": [\n\t\t\t"1971 1985 9 0 8 2 2 1",\n\t\t\t"1972 1972 1 27 7 2 2 0",\n\t\t\t"1973 1981 2 1 0 2 2 0",\n\t\t\t"1982 1982 3 1 0 2 2 0",\n\t\t\t"1983 1985 2 1 0 2 2 0",\n\t\t\t"1986 1989 2 15 0 2 2 0",\n\t\t\t"1986 1986 9 19 7 2 2 1",\n\t\t\t"1987 1999 9 0 8 2 2 1",\n\t\t\t"1990 1995 2 1 0 2 2 0",\n\t\t\t"1996 2005 2 0 8 2 2 0",\n\t\t\t"2000 2000 7 0 8 2 2 1",\n\t\t\t"2001 2007 9 0 8 2 2 1",\n\t\t\t"2006 2006 3 1 0 2 2 0",\n\t\t\t"2007 2007 2 0 8 2 2 0",\n\t\t\t"2008 9999 3 1 0 2 2 0",\n\t\t\t"2008 9999 9 1 0 2 2 1"\n\t\t],\n\t\t"AQ": [\n\t\t\t"1971 1971 9 0 8 2 2 1",\n\t\t\t"1972 1972 1 0 8 2 2 0",\n\t\t\t"1989 1991 9 0 8 2 2 1",\n\t\t\t"1990 1992 2 1 0 2 2 0"\n\t\t],\n\t\t"AS": [\n\t\t\t"1971 1985 9 0 8 2 2 1",\n\t\t\t"1986 1986 9 19 7 2 2 1",\n\t\t\t"1987 2007 9 0 8 2 2 1",\n\t\t\t"1972 1972 1 27 7 2 2 0",\n\t\t\t"1973 1985 2 1 0 2 2 0",\n\t\t\t"1986 1990 2 15 0 2 2 0",\n\t\t\t"1991 1991 2 3 7 2 2 0",\n\t\t\t"1992 1992 2 22 7 2 2 0",\n\t\t\t"1993 1993 2 7 7 2 2 0",\n\t\t\t"1994 1994 2 20 7 2 2 0",\n\t\t\t"1995 2005 2 0 8 2 2 0",\n\t\t\t"2006 2006 3 2 7 2 2 0",\n\t\t\t"2007 2007 2 0 8 2 2 0",\n\t\t\t"2008 9999 3 1 0 2 2 0",\n\t\t\t"2008 9999 9 1 0 2 2 1"\n\t\t],\n\t\t"AT": [\n\t\t\t"1967 1967 9 1 0 2 2 1",\n\t\t\t"1968 1968 2 0 8 2 2 0",\n\t\t\t"1968 1985 9 0 8 2 2 1",\n\t\t\t"1969 1971 2 8 0 2 2 0",\n\t\t\t"1972 1972 1 0 8 2 2 0",\n\t\t\t"1973 1981 2 1 0 2 2 0",\n\t\t\t"1982 1983 2 0 8 2 2 0",\n\t\t\t"1984 1986 2 1 0 2 2 0",\n\t\t\t"1986 1986 9 15 0 2 2 1",\n\t\t\t"1987 1990 2 15 0 2 2 0",\n\t\t\t"1987 1987 9 22 0 2 2 1",\n\t\t\t"1988 1990 9 0 8 2 2 1",\n\t\t\t"1991 1999 9 1 0 2 2 1",\n\t\t\t"1991 2005 2 0 8 2 2 0",\n\t\t\t"2000 2000 7 0 8 2 2 1",\n\t\t\t"2001 9999 9 1 0 2 2 1",\n\t\t\t"2006 2006 3 1 0 2 2 0",\n\t\t\t"2007 2007 2 0 8 2 2 0",\n\t\t\t"2008 9999 3 1 0 2 2 0"\n\t\t],\n\t\t"AV": [\n\t\t\t"1971 1985 9 0 8 2 2 1",\n\t\t\t"1972 1972 1 0 8 2 2 0",\n\t\t\t"1973 1985 2 1 0 2 2 0",\n\t\t\t"1986 1990 2 15 0 2 2 0",\n\t\t\t"1986 1987 9 15 0 2 2 1",\n\t\t\t"1988 1999 9 0 8 2 2 1",\n\t\t\t"1991 1994 2 1 0 2 2 0",\n\t\t\t"1995 2005 2 0 8 2 2 0",\n\t\t\t"2000 2000 7 0 8 2 2 1",\n\t\t\t"2001 2007 9 0 8 2 2 1",\n\t\t\t"2006 2006 3 1 0 2 2 0",\n\t\t\t"2007 2007 2 0 8 2 2 0",\n\t\t\t"2008 9999 3 1 0 2 2 0",\n\t\t\t"2008 9999 9 1 0 2 2 1"\n\t\t],\n\t\t"AW": [\n\t\t\t"1974 1974 9 0 8 2 2 1",\n\t\t\t"1975 1975 2 1 0 2 2 0",\n\t\t\t"1983 1983 9 0 8 2 2 1",\n\t\t\t"1984 1984 2 1 0 2 2 0",\n\t\t\t"1991 1991 10 17 7 2 2 1",\n\t\t\t"1992 1992 2 1 0 2 2 0",\n\t\t\t"2006 2006 11 3 7 2 2 1",\n\t\t\t"2007 2009 2 0 8 2 2 0",\n\t\t\t"2007 2008 9 0 8 2 2 1"\n\t\t],\n\t\t"Albania": [\n\t\t\t"1940 1940 5 16 7 0 0 1 S",\n\t\t\t"1942 1942 10 2 7 3 0 0",\n\t\t\t"1943 1943 2 29 7 2 0 1 S",\n\t\t\t"1943 1943 3 10 7 3 0 0",\n\t\t\t"1974 1974 4 4 7 0 0 1 S",\n\t\t\t"1974 1974 9 2 7 0 0 0",\n\t\t\t"1975 1975 4 1 7 0 0 1 S",\n\t\t\t"1975 1975 9 2 7 0 0 0",\n\t\t\t"1976 1976 4 2 7 0 0 1 S",\n\t\t\t"1976 1976 9 3 7 0 0 0",\n\t\t\t"1977 1977 4 8 7 0 0 1 S",\n\t\t\t"1977 1977 9 2 7 0 0 0",\n\t\t\t"1978 1978 4 6 7 0 0 1 S",\n\t\t\t"1978 1978 9 1 7 0 0 0",\n\t\t\t"1979 1979 4 5 7 0 0 1 S",\n\t\t\t"1979 1979 8 30 7 0 0 0",\n\t\t\t"1980 1980 4 3 7 0 0 1 S",\n\t\t\t"1980 1980 9 4 7 0 0 0",\n\t\t\t"1981 1981 3 26 7 0 0 1 S",\n\t\t\t"1981 1981 8 27 7 0 0 0",\n\t\t\t"1982 1982 4 2 7 0 0 1 S",\n\t\t\t"1982 1982 9 3 7 0 0 0",\n\t\t\t"1983 1983 3 18 7 0 0 1 S",\n\t\t\t"1983 1983 9 1 7 0 0 0",\n\t\t\t"1984 1984 3 1 7 0 0 1 S"\n\t\t],\n\t\t"Algeria": [\n\t\t\t"1916 1916 5 14 7 23 2 1 S",\n\t\t\t"1916 1919 9 1 0 23 2 0",\n\t\t\t"1917 1917 2 24 7 23 2 1 S",\n\t\t\t"1918 1918 2 9 7 23 2 1 S",\n\t\t\t"1919 1919 2 1 7 23 2 1 S",\n\t\t\t"1920 1920 1 14 7 23 2 1 S",\n\t\t\t"1920 1920 9 23 7 23 2 0",\n\t\t\t"1921 1921 2 14 7 23 2 1 S",\n\t\t\t"1921 1921 5 21 7 23 2 0",\n\t\t\t"1939 1939 8 11 7 23 2 1 S",\n\t\t\t"1939 1939 10 19 7 1 0 0",\n\t\t\t"1944 1945 3 1 1 2 0 1 S",\n\t\t\t"1944 1944 9 8 7 2 0 0",\n\t\t\t"1945 1945 8 16 7 1 0 0",\n\t\t\t"1971 1971 3 25 7 23 2 1 S",\n\t\t\t"1971 1971 8 26 7 23 2 0",\n\t\t\t"1977 1977 4 6 7 0 0 1 S",\n\t\t\t"1977 1977 9 21 7 0 0 0",\n\t\t\t"1978 1978 2 24 7 1 0 1 S",\n\t\t\t"1978 1978 8 22 7 3 0 0",\n\t\t\t"1980 1980 3 25 7 0 0 1 S",\n\t\t\t"1980 1980 9 31 7 2 0 0"\n\t\t],\n\t\t"Arg": [\n\t\t\t"1930 1930 11 1 7 0 0 1 S",\n\t\t\t"1931 1931 3 1 7 0 0 0",\n\t\t\t"1931 1931 9 15 7 0 0 1 S",\n\t\t\t"1932 1940 2 1 7 0 0 0",\n\t\t\t"1932 1939 10 1 7 0 0 1 S",\n\t\t\t"1940 1940 6 1 7 0 0 1 S",\n\t\t\t"1941 1941 5 15 7 0 0 0",\n\t\t\t"1941 1941 9 15 7 0 0 1 S",\n\t\t\t"1943 1943 7 1 7 0 0 0",\n\t\t\t"1943 1943 9 15 7 0 0 1 S",\n\t\t\t"1946 1946 2 1 7 0 0 0",\n\t\t\t"1946 1946 9 1 7 0 0 1 S",\n\t\t\t"1963 1963 9 1 7 0 0 0",\n\t\t\t"1963 1963 11 15 7 0 0 1 S",\n\t\t\t"1964 1966 2 1 7 0 0 0",\n\t\t\t"1964 1966 9 15 7 0 0 1 S",\n\t\t\t"1967 1967 3 2 7 0 0 0",\n\t\t\t"1967 1968 9 1 0 0 0 1 S",\n\t\t\t"1968 1969 3 1 0 0 0 0",\n\t\t\t"1974 1974 0 23 7 0 0 1 S",\n\t\t\t"1974 1974 4 1 7 0 0 0",\n\t\t\t"1988 1988 11 1 7 0 0 1 S",\n\t\t\t"1989 1993 2 1 0 0 0 0",\n\t\t\t"1989 1992 9 15 0 0 0 1 S",\n\t\t\t"1999 1999 9 1 0 0 0 1 S",\n\t\t\t"2000 2000 2 3 7 0 0 0",\n\t\t\t"2007 2007 11 30 7 0 0 1 S",\n\t\t\t"2008 2009 2 15 0 0 0 0",\n\t\t\t"2008 2008 9 15 0 0 0 1 S"\n\t\t],\n\t\t"ArgAQ": [\n\t\t\t"1964 1966 2 1 7 0 0 0",\n\t\t\t"1964 1966 9 15 7 0 0 1 S",\n\t\t\t"1967 1967 3 2 7 0 0 0",\n\t\t\t"1967 1968 9 1 0 0 0 1 S",\n\t\t\t"1968 1969 3 1 0 0 0 0",\n\t\t\t"1974 1974 0 23 7 0 0 1 S",\n\t\t\t"1974 1974 4 1 7 0 0 0"\n\t\t],\n\t\t"Aus": [\n\t\t\t"1917 1917 0 1 7 0:1 0 1",\n\t\t\t"1917 1917 2 25 7 2 0 0",\n\t\t\t"1942 1942 0 1 7 2 0 1",\n\t\t\t"1942 1942 2 29 7 2 0 0",\n\t\t\t"1942 1942 8 27 7 2 0 1",\n\t\t\t"1943 1944 2 0 8 2 0 0",\n\t\t\t"1943 1943 9 3 7 2 0 1"\n\t\t],\n\t\t"Austria": [\n\t\t\t"1920 1920 3 5 7 2 2 1 S",\n\t\t\t"1920 1920 8 13 7 2 2 0",\n\t\t\t"1946 1946 3 14 7 2 2 1 S",\n\t\t\t"1946 1948 9 1 0 2 2 0",\n\t\t\t"1947 1947 3 6 7 2 2 1 S",\n\t\t\t"1948 1948 3 18 7 2 2 1 S",\n\t\t\t"1980 1980 3 6 7 0 0 1 S",\n\t\t\t"1980 1980 8 28 7 0 0 0"\n\t\t],\n\t\t"Azer": [\n\t\t\t"1997 9999 2 0 8 4 0 1 S",\n\t\t\t"1997 9999 9 0 8 5 0 0"\n\t\t],\n\t\t"Bahamas": [\n\t\t\t"1964 1975 9 0 8 2 0 0 S",\n\t\t\t"1964 1975 3 0 8 2 0 1 D"\n\t\t],\n\t\t"Barb": [\n\t\t\t"1977 1977 5 12 7 2 0 1 D",\n\t\t\t"1977 1978 9 1 0 2 0 0 S",\n\t\t\t"1978 1980 3 15 0 2 0 1 D",\n\t\t\t"1979 1979 8 30 7 2 0 0 S",\n\t\t\t"1980 1980 8 25 7 2 0 0 S"\n\t\t],\n\t\t"Belgium": [\n\t\t\t"1918 1918 2 9 7 0 2 1 S",\n\t\t\t"1918 1919 9 1 6 23 2 0",\n\t\t\t"1919 1919 2 1 7 23 2 1 S",\n\t\t\t"1920 1920 1 14 7 23 2 1 S",\n\t\t\t"1920 1920 9 23 7 23 2 0",\n\t\t\t"1921 1921 2 14 7 23 2 1 S",\n\t\t\t"1921 1921 9 25 7 23 2 0",\n\t\t\t"1922 1922 2 25 7 23 2 1 S",\n\t\t\t"1922 1927 9 1 6 23 2 0",\n\t\t\t"1923 1923 3 21 7 23 2 1 S",\n\t\t\t"1924 1924 2 29 7 23 2 1 S",\n\t\t\t"1925 1925 3 4 7 23 2 1 S",\n\t\t\t"1926 1926 3 17 7 23 2 1 S",\n\t\t\t"1927 1927 3 9 7 23 2 1 S",\n\t\t\t"1928 1928 3 14 7 23 2 1 S",\n\t\t\t"1928 1938 9 2 0 2 2 0",\n\t\t\t"1929 1929 3 21 7 2 2 1 S",\n\t\t\t"1930 1930 3 13 7 2 2 1 S",\n\t\t\t"1931 1931 3 19 7 2 2 1 S",\n\t\t\t"1932 1932 3 3 7 2 2 1 S",\n\t\t\t"1933 1933 2 26 7 2 2 1 S",\n\t\t\t"1934 1934 3 8 7 2 2 1 S",\n\t\t\t"1935 1935 2 31 7 2 2 1 S",\n\t\t\t"1936 1936 3 19 7 2 2 1 S",\n\t\t\t"1937 1937 3 4 7 2 2 1 S",\n\t\t\t"1938 1938 2 27 7 2 2 1 S",\n\t\t\t"1939 1939 3 16 7 2 2 1 S",\n\t\t\t"1939 1939 10 19 7 2 2 0",\n\t\t\t"1940 1940 1 25 7 2 2 1 S",\n\t\t\t"1944 1944 8 17 7 2 2 0",\n\t\t\t"1945 1945 3 2 7 2 2 1 S",\n\t\t\t"1945 1945 8 16 7 2 2 0",\n\t\t\t"1946 1946 4 19 7 2 2 1 S",\n\t\t\t"1946 1946 9 7 7 2 2 0"\n\t\t],\n\t\t"Belize": [\n\t\t\t"1918 1942 9 2 0 0 0 0:30 HD",\n\t\t\t"1919 1943 1 9 0 0 0 0 S",\n\t\t\t"1973 1973 11 5 7 0 0 1 D",\n\t\t\t"1974 1974 1 9 7 0 0 0 S",\n\t\t\t"1982 1982 11 18 7 0 0 1 D",\n\t\t\t"1983 1983 1 12 7 0 0 0 S"\n\t\t],\n\t\t"Brazil": [\n\t\t\t"1931 1931 9 3 7 11 0 1 S",\n\t\t\t"1932 1933 3 1 7 0 0 0",\n\t\t\t"1932 1932 9 3 7 0 0 1 S",\n\t\t\t"1949 1952 11 1 7 0 0 1 S",\n\t\t\t"1950 1950 3 16 7 1 0 0",\n\t\t\t"1951 1952 3 1 7 0 0 0",\n\t\t\t"1953 1953 2 1 7 0 0 0",\n\t\t\t"1963 1963 11 9 7 0 0 1 S",\n\t\t\t"1964 1964 2 1 7 0 0 0",\n\t\t\t"1965 1965 0 31 7 0 0 1 S",\n\t\t\t"1965 1965 2 31 7 0 0 0",\n\t\t\t"1965 1965 11 1 7 0 0 1 S",\n\t\t\t"1966 1968 2 1 7 0 0 0",\n\t\t\t"1966 1967 10 1 7 0 0 1 S",\n\t\t\t"1985 1985 10 2 7 0 0 1 S",\n\t\t\t"1986 1986 2 15 7 0 0 0",\n\t\t\t"1986 1986 9 25 7 0 0 1 S",\n\t\t\t"1987 1987 1 14 7 0 0 0",\n\t\t\t"1987 1987 9 25 7 0 0 1 S",\n\t\t\t"1988 1988 1 7 7 0 0 0",\n\t\t\t"1988 1988 9 16 7 0 0 1 S",\n\t\t\t"1989 1989 0 29 7 0 0 0",\n\t\t\t"1989 1989 9 15 7 0 0 1 S",\n\t\t\t"1990 1990 1 11 7 0 0 0",\n\t\t\t"1990 1990 9 21 7 0 0 1 S",\n\t\t\t"1991 1991 1 17 7 0 0 0",\n\t\t\t"1991 1991 9 20 7 0 0 1 S",\n\t\t\t"1992 1992 1 9 7 0 0 0",\n\t\t\t"1992 1992 9 25 7 0 0 1 S",\n\t\t\t"1993 1993 0 31 7 0 0 0",\n\t\t\t"1993 1995 9 11 0 0 0 1 S",\n\t\t\t"1994 1995 1 15 0 0 0 0",\n\t\t\t"1996 1996 1 11 7 0 0 0",\n\t\t\t"1996 1996 9 6 7 0 0 1 S",\n\t\t\t"1997 1997 1 16 7 0 0 0",\n\t\t\t"1997 1997 9 6 7 0 0 1 S",\n\t\t\t"1998 1998 2 1 7 0 0 0",\n\t\t\t"1998 1998 9 11 7 0 0 1 S",\n\t\t\t"1999 1999 1 21 7 0 0 0",\n\t\t\t"1999 1999 9 3 7 0 0 1 S",\n\t\t\t"2000 2000 1 27 7 0 0 0",\n\t\t\t"2000 2001 9 8 0 0 0 1 S",\n\t\t\t"2001 2006 1 15 0 0 0 0",\n\t\t\t"2002 2002 10 3 7 0 0 1 S",\n\t\t\t"2003 2003 9 19 7 0 0 1 S",\n\t\t\t"2004 2004 10 2 7 0 0 1 S",\n\t\t\t"2005 2005 9 16 7 0 0 1 S",\n\t\t\t"2006 2006 10 5 7 0 0 1 S",\n\t\t\t"2007 2007 1 25 7 0 0 0",\n\t\t\t"2007 2007 9 8 0 0 0 1 S",\n\t\t\t"2008 9999 9 15 0 0 0 1 S",\n\t\t\t"2008 2011 1 15 0 0 0 0",\n\t\t\t"2012 2012 1 22 0 0 0 0",\n\t\t\t"2013 2014 1 15 0 0 0 0",\n\t\t\t"2015 2015 1 22 0 0 0 0",\n\t\t\t"2016 2022 1 15 0 0 0 0",\n\t\t\t"2023 2023 1 22 0 0 0 0",\n\t\t\t"2024 2025 1 15 0 0 0 0",\n\t\t\t"2026 2026 1 22 0 0 0 0",\n\t\t\t"2027 2033 1 15 0 0 0 0",\n\t\t\t"2034 2034 1 22 0 0 0 0",\n\t\t\t"2035 2036 1 15 0 0 0 0",\n\t\t\t"2037 2037 1 22 0 0 0 0",\n\t\t\t"2038 9999 1 15 0 0 0 0"\n\t\t],\n\t\t"Bulg": [\n\t\t\t"1979 1979 2 31 7 23 0 1 S",\n\t\t\t"1979 1979 9 1 7 1 0 0",\n\t\t\t"1980 1982 3 1 6 23 0 1 S",\n\t\t\t"1980 1980 8 29 7 1 0 0",\n\t\t\t"1981 1981 8 27 7 2 0 0"\n\t\t],\n\t\t"C-Eur": [\n\t\t\t"1916 1916 3 30 7 23 0 1 S",\n\t\t\t"1916 1916 9 1 7 1 0 0",\n\t\t\t"1917 1918 3 15 1 2 2 1 S",\n\t\t\t"1917 1918 8 15 1 2 2 0",\n\t\t\t"1940 1940 3 1 7 2 2 1 S",\n\t\t\t"1942 1942 10 2 7 2 2 0",\n\t\t\t"1943 1943 2 29 7 2 2 1 S",\n\t\t\t"1943 1943 9 4 7 2 2 0",\n\t\t\t"1944 1945 3 1 1 2 2 1 S",\n\t\t\t"1944 1944 9 2 7 2 2 0",\n\t\t\t"1945 1945 8 16 7 2 2 0",\n\t\t\t"1977 1980 3 1 0 2 2 1 S",\n\t\t\t"1977 1977 8 0 8 2 2 0",\n\t\t\t"1978 1978 9 1 7 2 2 0",\n\t\t\t"1979 1995 8 0 8 2 2 0",\n\t\t\t"1981 9999 2 0 8 2 2 1 S",\n\t\t\t"1996 9999 9 0 8 2 2 0"\n\t\t],\n\t\t"CA": [\n\t\t\t"1948 1948 2 14 7 2 0 1 D",\n\t\t\t"1949 1949 0 1 7 2 0 0 S",\n\t\t\t"1950 1966 3 0 8 2 0 1 D",\n\t\t\t"1950 1961 8 0 8 2 0 0 S",\n\t\t\t"1962 1966 9 0 8 2 0 0 S"\n\t\t],\n\t\t"CO": [\n\t\t\t"1992 1992 4 3 7 0 0 1 S",\n\t\t\t"1993 1993 3 4 7 0 0 0"\n\t\t],\n\t\t"CR": [\n\t\t\t"1979 1980 1 0 8 0 0 1 D",\n\t\t\t"1979 1980 5 1 0 0 0 0 S",\n\t\t\t"1991 1992 0 15 6 0 0 1 D",\n\t\t\t"1991 1991 6 1 7 0 0 0 S",\n\t\t\t"1992 1992 2 15 7 0 0 0 S"\n\t\t],\n\t\t"Canada": [\n\t\t\t"1918 1918 3 14 7 2 0 1 D",\n\t\t\t"1918 1918 9 27 7 2 0 0 S",\n\t\t\t"1942 1942 1 9 7 2 0 1 W",\n\t\t\t"1945 1945 7 14 7 23 1 1 P",\n\t\t\t"1945 1945 8 30 7 2 0 0 S",\n\t\t\t"1974 1986 3 0 8 2 0 1 D",\n\t\t\t"1974 2006 9 0 8 2 0 0 S",\n\t\t\t"1987 2006 3 1 0 2 0 1 D",\n\t\t\t"2007 9999 2 8 0 2 0 1 D",\n\t\t\t"2007 9999 10 1 0 2 0 0 S"\n\t\t],\n\t\t"Chatham": [\n\t\t\t"1974 1974 10 1 0 2:45 2 1 D",\n\t\t\t"1975 1975 1 0 8 2:45 2 0 S",\n\t\t\t"1975 1988 9 0 8 2:45 2 1 D",\n\t\t\t"1976 1989 2 1 0 2:45 2 0 S",\n\t\t\t"1989 1989 9 8 0 2:45 2 1 D",\n\t\t\t"1990 2006 9 1 0 2:45 2 1 D",\n\t\t\t"1990 2007 2 15 0 2:45 2 0 S",\n\t\t\t"2007 9999 8 0 8 2:45 2 1 D",\n\t\t\t"2008 9999 3 1 0 2:45 2 0 S"\n\t\t],\n\t\t"Chicago": [\n\t\t\t"1920 1920 5 13 7 2 0 1 D",\n\t\t\t"1920 1921 9 0 8 2 0 0 S",\n\t\t\t"1921 1921 2 0 8 2 0 1 D",\n\t\t\t"1922 1966 3 0 8 2 0 1 D",\n\t\t\t"1922 1954 8 0 8 2 0 0 S",\n\t\t\t"1955 1966 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Chile": [\n\t\t\t"1927 1932 8 1 7 0 0 1 S",\n\t\t\t"1928 1932 3 1 7 0 0 0",\n\t\t\t"1942 1942 5 1 7 4 1 0",\n\t\t\t"1942 1942 7 1 7 5 1 1 S",\n\t\t\t"1946 1946 6 15 7 4 1 1 S",\n\t\t\t"1946 1946 8 1 7 3 1 0",\n\t\t\t"1947 1947 3 1 7 4 1 0",\n\t\t\t"1968 1968 10 3 7 4 1 1 S",\n\t\t\t"1969 1969 2 30 7 3 1 0",\n\t\t\t"1969 1969 10 23 7 4 1 1 S",\n\t\t\t"1970 1970 2 29 7 3 1 0",\n\t\t\t"1971 1971 2 14 7 3 1 0",\n\t\t\t"1970 1972 9 9 0 4 1 1 S",\n\t\t\t"1972 1986 2 9 0 3 1 0",\n\t\t\t"1973 1973 8 30 7 4 1 1 S",\n\t\t\t"1974 1987 9 9 0 4 1 1 S",\n\t\t\t"1987 1987 3 12 7 3 1 0",\n\t\t\t"1988 1989 2 9 0 3 1 0",\n\t\t\t"1988 1988 9 1 0 4 1 1 S",\n\t\t\t"1989 1989 9 9 0 4 1 1 S",\n\t\t\t"1990 1990 2 18 7 3 1 0",\n\t\t\t"1990 1990 8 16 7 4 1 1 S",\n\t\t\t"1991 1996 2 9 0 3 1 0",\n\t\t\t"1991 1997 9 9 0 4 1 1 S",\n\t\t\t"1997 1997 2 30 7 3 1 0",\n\t\t\t"1998 1998 2 9 0 3 1 0",\n\t\t\t"1998 1998 8 27 7 4 1 1 S",\n\t\t\t"1999 1999 3 4 7 3 1 0",\n\t\t\t"1999 2010 9 9 0 4 1 1 S",\n\t\t\t"2000 2007 2 9 0 3 1 0",\n\t\t\t"2008 2008 2 30 7 3 1 0",\n\t\t\t"2009 2009 2 9 0 3 1 0",\n\t\t\t"2010 2010 3 1 0 3 1 0",\n\t\t\t"2011 2011 4 2 0 3 1 0",\n\t\t\t"2011 2011 7 16 0 4 1 1 S",\n\t\t\t"2012 9999 3 23 0 3 1 0",\n\t\t\t"2012 9999 8 2 0 4 1 1 S"\n\t\t],\n\t\t"ChileAQ": [\n\t\t\t"1972 1986 2 9 0 3 1 0",\n\t\t\t"1974 1987 9 9 0 4 1 1 S",\n\t\t\t"1987 1987 3 12 7 3 1 0",\n\t\t\t"1988 1989 2 9 0 3 1 0",\n\t\t\t"1988 1988 9 1 0 4 1 1 S",\n\t\t\t"1989 1989 9 9 0 4 1 1 S",\n\t\t\t"1990 1990 2 18 7 3 1 0",\n\t\t\t"1990 1990 8 16 7 4 1 1 S",\n\t\t\t"1991 1996 2 9 0 3 1 0",\n\t\t\t"1991 1997 9 9 0 4 1 1 S",\n\t\t\t"1997 1997 2 30 7 3 1 0",\n\t\t\t"1998 1998 2 9 0 3 1 0",\n\t\t\t"1998 1998 8 27 7 4 1 1 S",\n\t\t\t"1999 1999 3 4 7 3 1 0",\n\t\t\t"1999 2010 9 9 0 4 1 1 S",\n\t\t\t"2000 2007 2 9 0 3 1 0",\n\t\t\t"2008 2008 2 30 7 3 1 0",\n\t\t\t"2009 2009 2 9 0 3 1 0",\n\t\t\t"2010 2010 3 1 0 3 1 0",\n\t\t\t"2011 2011 4 2 0 3 1 0",\n\t\t\t"2011 2011 7 16 0 4 1 1 S",\n\t\t\t"2012 9999 3 23 0 3 1 0",\n\t\t\t"2012 9999 8 2 0 4 1 1 S"\n\t\t],\n\t\t"Cook": [\n\t\t\t"1978 1978 10 12 7 0 0 0:30 HS",\n\t\t\t"1979 1991 2 1 0 0 0 0",\n\t\t\t"1979 1990 9 0 8 0 0 0:30 HS"\n\t\t],\n\t\t"Cuba": [\n\t\t\t"1928 1928 5 10 7 0 0 1 D",\n\t\t\t"1928 1928 9 10 7 0 0 0 S",\n\t\t\t"1940 1942 5 1 0 0 0 1 D",\n\t\t\t"1940 1942 8 1 0 0 0 0 S",\n\t\t\t"1945 1946 5 1 0 0 0 1 D",\n\t\t\t"1945 1946 8 1 0 0 0 0 S",\n\t\t\t"1965 1965 5 1 7 0 0 1 D",\n\t\t\t"1965 1965 8 30 7 0 0 0 S",\n\t\t\t"1966 1966 4 29 7 0 0 1 D",\n\t\t\t"1966 1966 9 2 7 0 0 0 S",\n\t\t\t"1967 1967 3 8 7 0 0 1 D",\n\t\t\t"1967 1968 8 8 0 0 0 0 S",\n\t\t\t"1968 1968 3 14 7 0 0 1 D",\n\t\t\t"1969 1977 3 0 8 0 0 1 D",\n\t\t\t"1969 1971 9 0 8 0 0 0 S",\n\t\t\t"1972 1974 9 8 7 0 0 0 S",\n\t\t\t"1975 1977 9 0 8 0 0 0 S",\n\t\t\t"1978 1978 4 7 7 0 0 1 D",\n\t\t\t"1978 1990 9 8 0 0 0 0 S",\n\t\t\t"1979 1980 2 15 0 0 0 1 D",\n\t\t\t"1981 1985 4 5 0 0 0 1 D",\n\t\t\t"1986 1989 2 14 0 0 0 1 D",\n\t\t\t"1990 1997 3 1 0 0 0 1 D",\n\t\t\t"1991 1995 9 8 0 0 2 0 S",\n\t\t\t"1996 1996 9 6 7 0 2 0 S",\n\t\t\t"1997 1997 9 12 7 0 2 0 S",\n\t\t\t"1998 1999 2 0 8 0 2 1 D",\n\t\t\t"1998 2003 9 0 8 0 2 0 S",\n\t\t\t"2000 2004 3 1 0 0 2 1 D",\n\t\t\t"2006 2010 9 0 8 0 2 0 S",\n\t\t\t"2007 2007 2 8 0 0 2 1 D",\n\t\t\t"2008 2008 2 15 0 0 2 1 D",\n\t\t\t"2009 2010 2 8 0 0 2 1 D",\n\t\t\t"2011 2011 2 15 0 0 2 1 D",\n\t\t\t"2011 2011 10 13 7 0 2 0 S",\n\t\t\t"2012 2012 3 1 7 0 2 1 D",\n\t\t\t"2012 9999 10 1 0 0 2 0 S",\n\t\t\t"2013 9999 2 8 0 0 2 1 D"\n\t\t],\n\t\t"Cyprus": [\n\t\t\t"1975 1975 3 13 7 0 0 1 S",\n\t\t\t"1975 1975 9 12 7 0 0 0",\n\t\t\t"1976 1976 4 15 7 0 0 1 S",\n\t\t\t"1976 1976 9 11 7 0 0 0",\n\t\t\t"1977 1980 3 1 0 0 0 1 S",\n\t\t\t"1977 1977 8 25 7 0 0 0",\n\t\t\t"1978 1978 9 2 7 0 0 0",\n\t\t\t"1979 1997 8 0 8 0 0 0",\n\t\t\t"1981 1998 2 0 8 0 0 1 S"\n\t\t],\n\t\t"Czech": [\n\t\t\t"1945 1945 3 8 7 2 2 1 S",\n\t\t\t"1945 1945 10 18 7 2 2 0",\n\t\t\t"1946 1946 4 6 7 2 2 1 S",\n\t\t\t"1946 1949 9 1 0 2 2 0",\n\t\t\t"1947 1947 3 20 7 2 2 1 S",\n\t\t\t"1948 1948 3 18 7 2 2 1 S",\n\t\t\t"1949 1949 3 9 7 2 2 1 S"\n\t\t],\n\t\t"DR": [\n\t\t\t"1966 1966 9 30 7 0 0 1 D",\n\t\t\t"1967 1967 1 28 7 0 0 0 S",\n\t\t\t"1969 1973 9 0 8 0 0 0:30 HD",\n\t\t\t"1970 1970 1 21 7 0 0 0 S",\n\t\t\t"1971 1971 0 20 7 0 0 0 S",\n\t\t\t"1972 1974 0 21 7 0 0 0 S"\n\t\t],\n\t\t"Denmark": [\n\t\t\t"1916 1916 4 14 7 23 0 1 S",\n\t\t\t"1916 1916 8 30 7 23 0 0",\n\t\t\t"1940 1940 4 15 7 0 0 1 S",\n\t\t\t"1945 1945 3 2 7 2 2 1 S",\n\t\t\t"1945 1945 7 15 7 2 2 0",\n\t\t\t"1946 1946 4 1 7 2 2 1 S",\n\t\t\t"1946 1946 8 1 7 2 2 0",\n\t\t\t"1947 1947 4 4 7 2 2 1 S",\n\t\t\t"1947 1947 7 10 7 2 2 0",\n\t\t\t"1948 1948 4 9 7 2 2 1 S",\n\t\t\t"1948 1948 7 8 7 2 2 0"\n\t\t],\n\t\t"Denver": [\n\t\t\t"1920 1921 2 0 8 2 0 1 D",\n\t\t\t"1920 1920 9 0 8 2 0 0 S",\n\t\t\t"1921 1921 4 22 7 2 0 0 S",\n\t\t\t"1965 1966 3 0 8 2 0 1 D",\n\t\t\t"1965 1966 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Detroit": [\n\t\t\t"1948 1948 3 0 8 2 0 1 D",\n\t\t\t"1948 1948 8 0 8 2 0 0 S",\n\t\t\t"1967 1967 5 14 7 2 0 1 D",\n\t\t\t"1967 1967 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Dhaka": [\n\t\t\t"2009 2009 5 19 7 23 0 1 S",\n\t\t\t"2009 2009 11 31 7 23:59 0 0"\n\t\t],\n\t\t"E-Eur": [\n\t\t\t"1977 1980 3 1 0 0 0 1 S",\n\t\t\t"1977 1977 8 0 8 0 0 0",\n\t\t\t"1978 1978 9 1 7 0 0 0",\n\t\t\t"1979 1995 8 0 8 0 0 0",\n\t\t\t"1981 9999 2 0 8 0 0 1 S",\n\t\t\t"1996 9999 9 0 8 0 0 0"\n\t\t],\n\t\t"E-EurAsia": [\n\t\t\t"1981 9999 2 0 8 0 0 1 S",\n\t\t\t"1979 1995 8 0 8 0 0 0",\n\t\t\t"1996 9999 9 0 8 0 0 0"\n\t\t],\n\t\t"EU": [\n\t\t\t"1977 1980 3 1 0 1 1 1 S",\n\t\t\t"1977 1977 8 0 8 1 1 0",\n\t\t\t"1978 1978 9 1 7 1 1 0",\n\t\t\t"1979 1995 8 0 8 1 1 0",\n\t\t\t"1981 9999 2 0 8 1 1 1 S",\n\t\t\t"1996 9999 9 0 8 1 1 0"\n\t\t],\n\t\t"EUAsia": [\n\t\t\t"1981 9999 2 0 8 1 1 1 S",\n\t\t\t"1979 1995 8 0 8 1 1 0",\n\t\t\t"1996 9999 9 0 8 1 1 0"\n\t\t],\n\t\t"Edm": [\n\t\t\t"1918 1919 3 8 0 2 0 1 D",\n\t\t\t"1918 1918 9 27 7 2 0 0 S",\n\t\t\t"1919 1919 4 27 7 2 0 0 S",\n\t\t\t"1920 1923 3 0 8 2 0 1 D",\n\t\t\t"1920 1920 9 0 8 2 0 0 S",\n\t\t\t"1921 1923 8 0 8 2 0 0 S",\n\t\t\t"1942 1942 1 9 7 2 0 1 W",\n\t\t\t"1945 1945 7 14 7 23 1 1 P",\n\t\t\t"1945 1945 8 0 8 2 0 0 S",\n\t\t\t"1947 1947 3 0 8 2 0 1 D",\n\t\t\t"1947 1947 8 0 8 2 0 0 S",\n\t\t\t"1967 1967 3 0 8 2 0 1 D",\n\t\t\t"1967 1967 9 0 8 2 0 0 S",\n\t\t\t"1969 1969 3 0 8 2 0 1 D",\n\t\t\t"1969 1969 9 0 8 2 0 0 S",\n\t\t\t"1972 1986 3 0 8 2 0 1 D",\n\t\t\t"1972 2006 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Egypt": [\n\t\t\t"1940 1940 6 15 7 0 0 1 S",\n\t\t\t"1940 1940 9 1 7 0 0 0",\n\t\t\t"1941 1941 3 15 7 0 0 1 S",\n\t\t\t"1941 1941 8 16 7 0 0 0",\n\t\t\t"1942 1944 3 1 7 0 0 1 S",\n\t\t\t"1942 1942 9 27 7 0 0 0",\n\t\t\t"1943 1945 10 1 7 0 0 0",\n\t\t\t"1945 1945 3 16 7 0 0 1 S",\n\t\t\t"1957 1957 4 10 7 0 0 1 S",\n\t\t\t"1957 1958 9 1 7 0 0 0",\n\t\t\t"1958 1958 4 1 7 0 0 1 S",\n\t\t\t"1959 1981 4 1 7 1 0 1 S",\n\t\t\t"1959 1965 8 30 7 3 0 0",\n\t\t\t"1966 1994 9 1 7 3 0 0",\n\t\t\t"1982 1982 6 25 7 1 0 1 S",\n\t\t\t"1983 1983 6 12 7 1 0 1 S",\n\t\t\t"1984 1988 4 1 7 1 0 1 S",\n\t\t\t"1989 1989 4 6 7 1 0 1 S",\n\t\t\t"1990 1994 4 1 7 1 0 1 S",\n\t\t\t"1995 2010 3 5 8 0 2 1 S",\n\t\t\t"1995 2005 8 4 8 23 2 0",\n\t\t\t"2006 2006 8 21 7 23 2 0",\n\t\t\t"2007 2007 8 1 4 23 2 0",\n\t\t\t"2008 2008 7 4 8 23 2 0",\n\t\t\t"2009 2009 7 20 7 23 2 0",\n\t\t\t"2010 2010 7 11 7 0 0 0",\n\t\t\t"2010 2010 8 10 7 0 0 1 S",\n\t\t\t"2010 2010 8 4 8 23 2 0"\n\t\t],\n\t\t"EgyptAsia": [\n\t\t\t"1957 1957 4 10 7 0 0 1 S",\n\t\t\t"1957 1958 9 1 7 0 0 0",\n\t\t\t"1958 1958 4 1 7 0 0 1 S",\n\t\t\t"1959 1967 4 1 7 1 0 1 S",\n\t\t\t"1959 1965 8 30 7 3 0 0",\n\t\t\t"1966 1966 9 1 7 3 0 0"\n\t\t],\n\t\t"Falk": [\n\t\t\t"1937 1938 8 0 8 0 0 1 S",\n\t\t\t"1938 1942 2 19 0 0 0 0",\n\t\t\t"1939 1939 9 1 7 0 0 1 S",\n\t\t\t"1940 1942 8 0 8 0 0 1 S",\n\t\t\t"1943 1943 0 1 7 0 0 0",\n\t\t\t"1983 1983 8 0 8 0 0 1 S",\n\t\t\t"1984 1985 3 0 8 0 0 0",\n\t\t\t"1984 1984 8 16 7 0 0 1 S",\n\t\t\t"1985 2000 8 9 0 0 0 1 S",\n\t\t\t"1986 2000 3 16 0 0 0 0",\n\t\t\t"2001 2010 3 15 0 2 0 0",\n\t\t\t"2001 2010 8 1 0 2 0 1 S"\n\t\t],\n\t\t"Fiji": [\n\t\t\t"1998 1999 10 1 0 2 0 1 S",\n\t\t\t"1999 2000 1 0 8 3 0 0",\n\t\t\t"2009 2009 10 29 7 2 0 1 S",\n\t\t\t"2010 2010 2 0 8 3 0 0",\n\t\t\t"2010 9999 9 18 0 2 0 1 S",\n\t\t\t"2011 2011 2 1 0 3 0 0",\n\t\t\t"2012 9999 0 18 0 3 0 0"\n\t\t],\n\t\t"Finland": [\n\t\t\t"1942 1942 3 3 7 0 0 1 S",\n\t\t\t"1942 1942 9 3 7 0 0 0",\n\t\t\t"1981 1982 2 0 8 2 0 1 S",\n\t\t\t"1981 1982 8 0 8 3 0 0"\n\t\t],\n\t\t"France": [\n\t\t\t"1916 1916 5 14 7 23 2 1 S",\n\t\t\t"1916 1919 9 1 0 23 2 0",\n\t\t\t"1917 1917 2 24 7 23 2 1 S",\n\t\t\t"1918 1918 2 9 7 23 2 1 S",\n\t\t\t"1919 1919 2 1 7 23 2 1 S",\n\t\t\t"1920 1920 1 14 7 23 2 1 S",\n\t\t\t"1920 1920 9 23 7 23 2 0",\n\t\t\t"1921 1921 2 14 7 23 2 1 S",\n\t\t\t"1921 1921 9 25 7 23 2 0",\n\t\t\t"1922 1922 2 25 7 23 2 1 S",\n\t\t\t"1922 1938 9 1 6 23 2 0",\n\t\t\t"1923 1923 4 26 7 23 2 1 S",\n\t\t\t"1924 1924 2 29 7 23 2 1 S",\n\t\t\t"1925 1925 3 4 7 23 2 1 S",\n\t\t\t"1926 1926 3 17 7 23 2 1 S",\n\t\t\t"1927 1927 3 9 7 23 2 1 S",\n\t\t\t"1928 1928 3 14 7 23 2 1 S",\n\t\t\t"1929 1929 3 20 7 23 2 1 S",\n\t\t\t"1930 1930 3 12 7 23 2 1 S",\n\t\t\t"1931 1931 3 18 7 23 2 1 S",\n\t\t\t"1932 1932 3 2 7 23 2 1 S",\n\t\t\t"1933 1933 2 25 7 23 2 1 S",\n\t\t\t"1934 1934 3 7 7 23 2 1 S",\n\t\t\t"1935 1935 2 30 7 23 2 1 S",\n\t\t\t"1936 1936 3 18 7 23 2 1 S",\n\t\t\t"1937 1937 3 3 7 23 2 1 S",\n\t\t\t"1938 1938 2 26 7 23 2 1 S",\n\t\t\t"1939 1939 3 15 7 23 2 1 S",\n\t\t\t"1939 1939 10 18 7 23 2 0",\n\t\t\t"1940 1940 1 25 7 2 0 1 S",\n\t\t\t"1941 1941 4 5 7 0 0 2 M",\n\t\t\t"1941 1941 9 6 7 0 0 1 S",\n\t\t\t"1942 1942 2 9 7 0 0 2 M",\n\t\t\t"1942 1942 10 2 7 3 0 1 S",\n\t\t\t"1943 1943 2 29 7 2 0 2 M",\n\t\t\t"1943 1943 9 4 7 3 0 1 S",\n\t\t\t"1944 1944 3 3 7 2 0 2 M",\n\t\t\t"1944 1944 9 8 7 1 0 1 S",\n\t\t\t"1945 1945 3 2 7 2 0 2 M",\n\t\t\t"1945 1945 8 16 7 3 0 0",\n\t\t\t"1976 1976 2 28 7 1 0 1 S",\n\t\t\t"1976 1976 8 26 7 1 0 0"\n\t\t],\n\t\t"GB-Eire": [\n\t\t\t"1916 1916 4 21 7 2 2 1 BST",\n\t\t\t"1916 1916 9 1 7 2 2 0 GMT",\n\t\t\t"1917 1917 3 8 7 2 2 1 BST",\n\t\t\t"1917 1917 8 17 7 2 2 0 GMT",\n\t\t\t"1918 1918 2 24 7 2 2 1 BST",\n\t\t\t"1918 1918 8 30 7 2 2 0 GMT",\n\t\t\t"1919 1919 2 30 7 2 2 1 BST",\n\t\t\t"1919 1919 8 29 7 2 2 0 GMT",\n\t\t\t"1920 1920 2 28 7 2 2 1 BST",\n\t\t\t"1920 1920 9 25 7 2 2 0 GMT",\n\t\t\t"1921 1921 3 3 7 2 2 1 BST",\n\t\t\t"1921 1921 9 3 7 2 2 0 GMT",\n\t\t\t"1922 1922 2 26 7 2 2 1 BST",\n\t\t\t"1922 1922 9 8 7 2 2 0 GMT",\n\t\t\t"1923 1923 3 16 0 2 2 1 BST",\n\t\t\t"1923 1924 8 16 0 2 2 0 GMT",\n\t\t\t"1924 1924 3 9 0 2 2 1 BST",\n\t\t\t"1925 1926 3 16 0 2 2 1 BST",\n\t\t\t"1925 1938 9 2 0 2 2 0 GMT",\n\t\t\t"1927 1927 3 9 0 2 2 1 BST",\n\t\t\t"1928 1929 3 16 0 2 2 1 BST",\n\t\t\t"1930 1930 3 9 0 2 2 1 BST",\n\t\t\t"1931 1932 3 16 0 2 2 1 BST",\n\t\t\t"1933 1933 3 9 0 2 2 1 BST",\n\t\t\t"1934 1934 3 16 0 2 2 1 BST",\n\t\t\t"1935 1935 3 9 0 2 2 1 BST",\n\t\t\t"1936 1937 3 16 0 2 2 1 BST",\n\t\t\t"1938 1938 3 9 0 2 2 1 BST",\n\t\t\t"1939 1939 3 16 0 2 2 1 BST",\n\t\t\t"1939 1939 10 16 0 2 2 0 GMT",\n\t\t\t"1940 1940 1 23 0 2 2 1 BST",\n\t\t\t"1941 1941 4 2 0 1 2 2 BDST",\n\t\t\t"1941 1943 7 9 0 1 2 1 BST",\n\t\t\t"1942 1944 3 2 0 1 2 2 BDST",\n\t\t\t"1944 1944 8 16 0 1 2 1 BST",\n\t\t\t"1945 1945 3 2 1 1 2 2 BDST",\n\t\t\t"1945 1945 6 9 0 1 2 1 BST",\n\t\t\t"1945 1946 9 2 0 2 2 0 GMT",\n\t\t\t"1946 1946 3 9 0 2 2 1 BST",\n\t\t\t"1947 1947 2 16 7 2 2 1 BST",\n\t\t\t"1947 1947 3 13 7 1 2 2 BDST",\n\t\t\t"1947 1947 7 10 7 1 2 1 BST",\n\t\t\t"1947 1947 10 2 7 2 2 0 GMT",\n\t\t\t"1948 1948 2 14 7 2 2 1 BST",\n\t\t\t"1948 1948 9 31 7 2 2 0 GMT",\n\t\t\t"1949 1949 3 3 7 2 2 1 BST",\n\t\t\t"1949 1949 9 30 7 2 2 0 GMT",\n\t\t\t"1950 1952 3 14 0 2 2 1 BST",\n\t\t\t"1950 1952 9 21 0 2 2 0 GMT",\n\t\t\t"1953 1953 3 16 0 2 2 1 BST",\n\t\t\t"1953 1960 9 2 0 2 2 0 GMT",\n\t\t\t"1954 1954 3 9 0 2 2 1 BST",\n\t\t\t"1955 1956 3 16 0 2 2 1 BST",\n\t\t\t"1957 1957 3 9 0 2 2 1 BST",\n\t\t\t"1958 1959 3 16 0 2 2 1 BST",\n\t\t\t"1960 1960 3 9 0 2 2 1 BST",\n\t\t\t"1961 1963 2 0 8 2 2 1 BST",\n\t\t\t"1961 1968 9 23 0 2 2 0 GMT",\n\t\t\t"1964 1967 2 19 0 2 2 1 BST",\n\t\t\t"1968 1968 1 18 7 2 2 1 BST",\n\t\t\t"1972 1980 2 16 0 2 2 1 BST",\n\t\t\t"1972 1980 9 23 0 2 2 0 GMT",\n\t\t\t"1981 1995 2 0 8 1 1 1 BST",\n\t\t\t"1981 1989 9 23 0 1 1 0 GMT",\n\t\t\t"1990 1995 9 22 0 1 1 0 GMT"\n\t\t],\n\t\t"Germany": [\n\t\t\t"1946 1946 3 14 7 2 2 1 S",\n\t\t\t"1946 1946 9 7 7 2 2 0",\n\t\t\t"1947 1949 9 1 0 2 2 0",\n\t\t\t"1947 1947 3 6 7 3 2 1 S",\n\t\t\t"1947 1947 4 11 7 2 2 2 M",\n\t\t\t"1947 1947 5 29 7 3 0 1 S",\n\t\t\t"1948 1948 3 18 7 2 2 1 S",\n\t\t\t"1949 1949 3 10 7 2 2 1 S"\n\t\t],\n\t\t"Ghana": [\n\t\t\t"1936 1942 8 1 7 0 0 0:20 GHST",\n\t\t\t"1936 1942 11 31 7 0 0 0 GMT"\n\t\t],\n\t\t"Greece": [\n\t\t\t"1932 1932 6 7 7 0 0 1 S",\n\t\t\t"1932 1932 8 1 7 0 0 0",\n\t\t\t"1941 1941 3 7 7 0 0 1 S",\n\t\t\t"1942 1942 10 2 7 3 0 0",\n\t\t\t"1943 1943 2 30 7 0 0 1 S",\n\t\t\t"1943 1943 9 4 7 0 0 0",\n\t\t\t"1952 1952 6 1 7 0 0 1 S",\n\t\t\t"1952 1952 10 2 7 0 0 0",\n\t\t\t"1975 1975 3 12 7 0 2 1 S",\n\t\t\t"1975 1975 10 26 7 0 2 0",\n\t\t\t"1976 1976 3 11 7 2 2 1 S",\n\t\t\t"1976 1976 9 10 7 2 2 0",\n\t\t\t"1977 1978 3 1 0 2 2 1 S",\n\t\t\t"1977 1977 8 26 7 2 2 0",\n\t\t\t"1978 1978 8 24 7 4 0 0",\n\t\t\t"1979 1979 3 1 7 9 0 1 S",\n\t\t\t"1979 1979 8 29 7 2 0 0",\n\t\t\t"1980 1980 3 1 7 0 0 1 S",\n\t\t\t"1980 1980 8 28 7 0 0 0"\n\t\t],\n\t\t"Guat": [\n\t\t\t"1973 1973 10 25 7 0 0 1 D",\n\t\t\t"1974 1974 1 24 7 0 0 0 S",\n\t\t\t"1983 1983 4 21 7 0 0 1 D",\n\t\t\t"1983 1983 8 22 7 0 0 0 S",\n\t\t\t"1991 1991 2 23 7 0 0 1 D",\n\t\t\t"1991 1991 8 7 7 0 0 0 S",\n\t\t\t"2006 2006 3 30 7 0 0 1 D",\n\t\t\t"2006 2006 9 1 7 0 0 0 S"\n\t\t],\n\t\t"HK": [\n\t\t\t"1941 1941 3 1 7 3:30 0 1 S",\n\t\t\t"1941 1941 8 30 7 3:30 0 0",\n\t\t\t"1946 1946 3 20 7 3:30 0 1 S",\n\t\t\t"1946 1946 11 1 7 3:30 0 0",\n\t\t\t"1947 1947 3 13 7 3:30 0 1 S",\n\t\t\t"1947 1947 11 30 7 3:30 0 0",\n\t\t\t"1948 1948 4 2 7 3:30 0 1 S",\n\t\t\t"1948 1951 9 0 8 3:30 0 0",\n\t\t\t"1952 1952 9 25 7 3:30 0 0",\n\t\t\t"1949 1953 3 1 0 3:30 0 1 S",\n\t\t\t"1953 1953 10 1 7 3:30 0 0",\n\t\t\t"1954 1964 2 18 0 3:30 0 1 S",\n\t\t\t"1954 1954 9 31 7 3:30 0 0",\n\t\t\t"1955 1964 10 1 0 3:30 0 0",\n\t\t\t"1965 1976 3 16 0 3:30 0 1 S",\n\t\t\t"1965 1976 9 16 0 3:30 0 0",\n\t\t\t"1973 1973 11 30 7 3:30 0 1 S",\n\t\t\t"1979 1979 4 8 0 3:30 0 1 S",\n\t\t\t"1979 1979 9 16 0 3:30 0 0"\n\t\t],\n\t\t"Haiti": [\n\t\t\t"1983 1983 4 8 7 0 0 1 D",\n\t\t\t"1984 1987 3 0 8 0 0 1 D",\n\t\t\t"1983 1987 9 0 8 0 0 0 S",\n\t\t\t"1988 1997 3 1 0 1 2 1 D",\n\t\t\t"1988 1997 9 0 8 1 2 0 S",\n\t\t\t"2005 2006 3 1 0 0 0 1 D",\n\t\t\t"2005 2006 9 0 8 0 0 0 S",\n\t\t\t"2012 9999 2 8 0 2 0 1 D",\n\t\t\t"2012 9999 10 1 0 2 0 0 S"\n\t\t],\n\t\t"Halifax": [\n\t\t\t"1916 1916 3 1 7 0 0 1 D",\n\t\t\t"1916 1916 9 1 7 0 0 0 S",\n\t\t\t"1920 1920 4 9 7 0 0 1 D",\n\t\t\t"1920 1920 7 29 7 0 0 0 S",\n\t\t\t"1921 1921 4 6 7 0 0 1 D",\n\t\t\t"1921 1922 8 5 7 0 0 0 S",\n\t\t\t"1922 1922 3 30 7 0 0 1 D",\n\t\t\t"1923 1925 4 1 0 0 0 1 D",\n\t\t\t"1923 1923 8 4 7 0 0 0 S",\n\t\t\t"1924 1924 8 15 7 0 0 0 S",\n\t\t\t"1925 1925 8 28 7 0 0 0 S",\n\t\t\t"1926 1926 4 16 7 0 0 1 D",\n\t\t\t"1926 1926 8 13 7 0 0 0 S",\n\t\t\t"1927 1927 4 1 7 0 0 1 D",\n\t\t\t"1927 1927 8 26 7 0 0 0 S",\n\t\t\t"1928 1931 4 8 0 0 0 1 D",\n\t\t\t"1928 1928 8 9 7 0 0 0 S",\n\t\t\t"1929 1929 8 3 7 0 0 0 S",\n\t\t\t"1930 1930 8 15 7 0 0 0 S",\n\t\t\t"1931 1932 8 24 1 0 0 0 S",\n\t\t\t"1932 1932 4 1 7 0 0 1 D",\n\t\t\t"1933 1933 3 30 7 0 0 1 D",\n\t\t\t"1933 1933 9 2 7 0 0 0 S",\n\t\t\t"1934 1934 4 20 7 0 0 1 D",\n\t\t\t"1934 1934 8 16 7 0 0 0 S",\n\t\t\t"1935 1935 5 2 7 0 0 1 D",\n\t\t\t"1935 1935 8 30 7 0 0 0 S",\n\t\t\t"1936 1936 5 1 7 0 0 1 D",\n\t\t\t"1936 1936 8 14 7 0 0 0 S",\n\t\t\t"1937 1938 4 1 0 0 0 1 D",\n\t\t\t"1937 1941 8 24 1 0 0 0 S",\n\t\t\t"1939 1939 4 28 7 0 0 1 D",\n\t\t\t"1940 1941 4 1 0 0 0 1 D",\n\t\t\t"1946 1949 3 0 8 2 0 1 D",\n\t\t\t"1946 1949 8 0 8 2 0 0 S",\n\t\t\t"1951 1954 3 0 8 2 0 1 D",\n\t\t\t"1951 1954 8 0 8 2 0 0 S",\n\t\t\t"1956 1959 3 0 8 2 0 1 D",\n\t\t\t"1956 1959 8 0 8 2 0 0 S",\n\t\t\t"1962 1973 3 0 8 2 0 1 D",\n\t\t\t"1962 1973 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Holiday": [\n\t\t\t"1992 1993 9 0 8 2 2 1",\n\t\t\t"1993 1994 2 1 0 2 2 0"\n\t\t],\n\t\t"Hond": [\n\t\t\t"1987 1988 4 1 0 0 0 1 D",\n\t\t\t"1987 1988 8 0 8 0 0 0 S",\n\t\t\t"2006 2006 4 1 0 0 0 1 D",\n\t\t\t"2006 2006 7 1 1 0 0 0 S"\n\t\t],\n\t\t"Hungary": [\n\t\t\t"1918 1918 3 1 7 3 0 1 S",\n\t\t\t"1918 1918 8 29 7 3 0 0",\n\t\t\t"1919 1919 3 15 7 3 0 1 S",\n\t\t\t"1919 1919 8 15 7 3 0 0",\n\t\t\t"1920 1920 3 5 7 3 0 1 S",\n\t\t\t"1920 1920 8 30 7 3 0 0",\n\t\t\t"1945 1945 4 1 7 23 0 1 S",\n\t\t\t"1945 1945 10 3 7 0 0 0",\n\t\t\t"1946 1946 2 31 7 2 2 1 S",\n\t\t\t"1946 1949 9 1 0 2 2 0",\n\t\t\t"1947 1949 3 4 0 2 2 1 S",\n\t\t\t"1950 1950 3 17 7 2 2 1 S",\n\t\t\t"1950 1950 9 23 7 2 2 0",\n\t\t\t"1954 1955 4 23 7 0 0 1 S",\n\t\t\t"1954 1955 9 3 7 0 0 0",\n\t\t\t"1956 1956 5 1 0 0 0 1 S",\n\t\t\t"1956 1956 8 0 8 0 0 0",\n\t\t\t"1957 1957 5 1 0 1 0 1 S",\n\t\t\t"1957 1957 8 0 8 3 0 0",\n\t\t\t"1980 1980 3 6 7 1 0 1 S"\n\t\t],\n\t\t"Iceland": [\n\t\t\t"1917 1918 1 19 7 23 0 1 S",\n\t\t\t"1917 1917 9 21 7 1 0 0",\n\t\t\t"1918 1918 10 16 7 1 0 0",\n\t\t\t"1939 1939 3 29 7 23 0 1 S",\n\t\t\t"1939 1939 10 29 7 2 0 0",\n\t\t\t"1940 1940 1 25 7 2 0 1 S",\n\t\t\t"1940 1940 10 3 7 2 0 0",\n\t\t\t"1941 1941 2 2 7 1 2 1 S",\n\t\t\t"1941 1941 10 2 7 1 2 0",\n\t\t\t"1942 1942 2 8 7 1 2 1 S",\n\t\t\t"1942 1942 9 25 7 1 2 0",\n\t\t\t"1943 1946 2 1 0 1 2 1 S",\n\t\t\t"1943 1948 9 22 0 1 2 0",\n\t\t\t"1947 1967 3 1 0 1 2 1 S",\n\t\t\t"1949 1949 9 30 7 1 2 0",\n\t\t\t"1950 1966 9 22 0 1 2 0",\n\t\t\t"1967 1967 9 29 7 1 2 0"\n\t\t],\n\t\t"Indianapolis": [\n\t\t\t"1941 1941 5 22 7 2 0 1 D",\n\t\t\t"1941 1954 8 0 8 2 0 0 S",\n\t\t\t"1946 1954 3 0 8 2 0 1 D"\n\t\t],\n\t\t"Iran": [\n\t\t\t"1978 1980 2 21 7 0 0 1 D",\n\t\t\t"1978 1978 9 21 7 0 0 0 S",\n\t\t\t"1979 1979 8 19 7 0 0 0 S",\n\t\t\t"1980 1980 8 23 7 0 0 0 S",\n\t\t\t"1991 1991 4 3 7 0 0 1 D",\n\t\t\t"1992 1995 2 22 7 0 0 1 D",\n\t\t\t"1991 1995 8 22 7 0 0 0 S",\n\t\t\t"1996 1996 2 21 7 0 0 1 D",\n\t\t\t"1996 1996 8 21 7 0 0 0 S",\n\t\t\t"1997 1999 2 22 7 0 0 1 D",\n\t\t\t"1997 1999 8 22 7 0 0 0 S",\n\t\t\t"2000 2000 2 21 7 0 0 1 D",\n\t\t\t"2000 2000 8 21 7 0 0 0 S",\n\t\t\t"2001 2003 2 22 7 0 0 1 D",\n\t\t\t"2001 2003 8 22 7 0 0 0 S",\n\t\t\t"2004 2004 2 21 7 0 0 1 D",\n\t\t\t"2004 2004 8 21 7 0 0 0 S",\n\t\t\t"2005 2005 2 22 7 0 0 1 D",\n\t\t\t"2005 2005 8 22 7 0 0 0 S",\n\t\t\t"2008 2008 2 21 7 0 0 1 D",\n\t\t\t"2008 2008 8 21 7 0 0 0 S",\n\t\t\t"2009 2011 2 22 7 0 0 1 D",\n\t\t\t"2009 2011 8 22 7 0 0 0 S",\n\t\t\t"2012 2012 2 21 7 0 0 1 D",\n\t\t\t"2012 2012 8 21 7 0 0 0 S",\n\t\t\t"2013 2015 2 22 7 0 0 1 D",\n\t\t\t"2013 2015 8 22 7 0 0 0 S",\n\t\t\t"2016 2016 2 21 7 0 0 1 D",\n\t\t\t"2016 2016 8 21 7 0 0 0 S",\n\t\t\t"2017 2019 2 22 7 0 0 1 D",\n\t\t\t"2017 2019 8 22 7 0 0 0 S",\n\t\t\t"2020 2020 2 21 7 0 0 1 D",\n\t\t\t"2020 2020 8 21 7 0 0 0 S",\n\t\t\t"2021 2023 2 22 7 0 0 1 D",\n\t\t\t"2021 2023 8 22 7 0 0 0 S",\n\t\t\t"2024 2024 2 21 7 0 0 1 D",\n\t\t\t"2024 2024 8 21 7 0 0 0 S",\n\t\t\t"2025 2027 2 22 7 0 0 1 D",\n\t\t\t"2025 2027 8 22 7 0 0 0 S",\n\t\t\t"2028 2029 2 21 7 0 0 1 D",\n\t\t\t"2028 2029 8 21 7 0 0 0 S",\n\t\t\t"2030 2031 2 22 7 0 0 1 D",\n\t\t\t"2030 2031 8 22 7 0 0 0 S",\n\t\t\t"2032 2033 2 21 7 0 0 1 D",\n\t\t\t"2032 2033 8 21 7 0 0 0 S",\n\t\t\t"2034 2035 2 22 7 0 0 1 D",\n\t\t\t"2034 2035 8 22 7 0 0 0 S",\n\t\t\t"2036 2037 2 21 7 0 0 1 D",\n\t\t\t"2036 2037 8 21 7 0 0 0 S"\n\t\t],\n\t\t"Iraq": [\n\t\t\t"1982 1982 4 1 7 0 0 1 D",\n\t\t\t"1982 1984 9 1 7 0 0 0 S",\n\t\t\t"1983 1983 2 31 7 0 0 1 D",\n\t\t\t"1984 1985 3 1 7 0 0 1 D",\n\t\t\t"1985 1990 8 0 8 1 2 0 S",\n\t\t\t"1986 1990 2 0 8 1 2 1 D",\n\t\t\t"1991 2007 3 1 7 3 2 1 D",\n\t\t\t"1991 2007 9 1 7 3 2 0 S"\n\t\t],\n\t\t"Italy": [\n\t\t\t"1916 1916 5 3 7 0 2 1 S",\n\t\t\t"1916 1916 9 1 7 0 2 0",\n\t\t\t"1917 1917 3 1 7 0 2 1 S",\n\t\t\t"1917 1917 8 30 7 0 2 0",\n\t\t\t"1918 1918 2 10 7 0 2 1 S",\n\t\t\t"1918 1919 9 1 0 0 2 0",\n\t\t\t"1919 1919 2 2 7 0 2 1 S",\n\t\t\t"1920 1920 2 21 7 0 2 1 S",\n\t\t\t"1920 1920 8 19 7 0 2 0",\n\t\t\t"1940 1940 5 15 7 0 2 1 S",\n\t\t\t"1944 1944 8 17 7 0 2 0",\n\t\t\t"1945 1945 3 2 7 2 0 1 S",\n\t\t\t"1945 1945 8 15 7 0 2 0",\n\t\t\t"1946 1946 2 17 7 2 2 1 S",\n\t\t\t"1946 1946 9 6 7 2 2 0",\n\t\t\t"1947 1947 2 16 7 0 2 1 S",\n\t\t\t"1947 1947 9 5 7 0 2 0",\n\t\t\t"1948 1948 1 29 7 2 2 1 S",\n\t\t\t"1948 1948 9 3 7 2 2 0",\n\t\t\t"1966 1968 4 22 0 0 0 1 S",\n\t\t\t"1966 1969 8 22 0 0 0 0",\n\t\t\t"1969 1969 5 1 7 0 0 1 S",\n\t\t\t"1970 1970 4 31 7 0 0 1 S",\n\t\t\t"1970 1970 8 0 8 0 0 0",\n\t\t\t"1971 1972 4 22 0 0 0 1 S",\n\t\t\t"1971 1971 8 0 8 1 0 0",\n\t\t\t"1972 1972 9 1 7 0 0 0",\n\t\t\t"1973 1973 5 3 7 0 0 1 S",\n\t\t\t"1973 1974 8 0 8 0 0 0",\n\t\t\t"1974 1974 4 26 7 0 0 1 S",\n\t\t\t"1975 1975 5 1 7 0 2 1 S",\n\t\t\t"1975 1977 8 0 8 0 2 0",\n\t\t\t"1976 1976 4 30 7 0 2 1 S",\n\t\t\t"1977 1979 4 22 0 0 2 1 S",\n\t\t\t"1978 1978 9 1 7 0 2 0",\n\t\t\t"1979 1979 8 30 7 0 2 0"\n\t\t],\n\t\t"Japan": [\n\t\t\t"1948 1948 4 1 0 2 0 1 D",\n\t\t\t"1948 1951 8 8 6 2 0 0 S",\n\t\t\t"1949 1949 3 1 0 2 0 1 D",\n\t\t\t"1950 1951 4 1 0 2 0 1 D"\n\t\t],\n\t\t"Jordan": [\n\t\t\t"1973 1973 5 6 7 0 0 1 S",\n\t\t\t"1973 1975 9 1 7 0 0 0",\n\t\t\t"1974 1977 4 1 7 0 0 1 S",\n\t\t\t"1976 1976 10 1 7 0 0 0",\n\t\t\t"1977 1977 9 1 7 0 0 0",\n\t\t\t"1978 1978 3 30 7 0 0 1 S",\n\t\t\t"1978 1978 8 30 7 0 0 0",\n\t\t\t"1985 1985 3 1 7 0 0 1 S",\n\t\t\t"1985 1985 9 1 7 0 0 0",\n\t\t\t"1986 1988 3 1 5 0 0 1 S",\n\t\t\t"1986 1990 9 1 5 0 0 0",\n\t\t\t"1989 1989 4 8 7 0 0 1 S",\n\t\t\t"1990 1990 3 27 7 0 0 1 S",\n\t\t\t"1991 1991 3 17 7 0 0 1 S",\n\t\t\t"1991 1991 8 27 7 0 0 0",\n\t\t\t"1992 1992 3 10 7 0 0 1 S",\n\t\t\t"1992 1993 9 1 5 0 0 0",\n\t\t\t"1993 1998 3 1 5 0 0 1 S",\n\t\t\t"1994 1994 8 15 5 0 0 0",\n\t\t\t"1995 1998 8 15 5 0 2 0",\n\t\t\t"1999 1999 6 1 7 0 2 1 S",\n\t\t\t"1999 2002 8 5 8 0 2 0",\n\t\t\t"2000 2001 2 4 8 0 2 1 S",\n\t\t\t"2002 9999 2 4 8 24 0 1 S",\n\t\t\t"2003 2003 9 24 7 0 2 0",\n\t\t\t"2004 2004 9 15 7 0 2 0",\n\t\t\t"2005 2005 8 5 8 0 2 0",\n\t\t\t"2006 2011 9 5 8 0 2 0",\n\t\t\t"2013 9999 9 5 8 0 2 0"\n\t\t],\n\t\t"Kyrgyz": [\n\t\t\t"1992 1996 3 7 0 0 2 1 S",\n\t\t\t"1992 1996 8 0 8 0 0 0",\n\t\t\t"1997 2005 2 0 8 2:30 0 1 S",\n\t\t\t"1997 2004 9 0 8 2:30 0 0"\n\t\t],\n\t\t"LH": [\n\t\t\t"1981 1984 9 0 8 2 0 1",\n\t\t\t"1982 1985 2 1 0 2 0 0",\n\t\t\t"1985 1985 9 0 8 2 0 0:30",\n\t\t\t"1986 1989 2 15 0 2 0 0",\n\t\t\t"1986 1986 9 19 7 2 0 0:30",\n\t\t\t"1987 1999 9 0 8 2 0 0:30",\n\t\t\t"1990 1995 2 1 0 2 0 0",\n\t\t\t"1996 2005 2 0 8 2 0 0",\n\t\t\t"2000 2000 7 0 8 2 0 0:30",\n\t\t\t"2001 2007 9 0 8 2 0 0:30",\n\t\t\t"2006 2006 3 1 0 2 0 0",\n\t\t\t"2007 2007 2 0 8 2 0 0",\n\t\t\t"2008 9999 3 1 0 2 0 0",\n\t\t\t"2008 9999 9 1 0 2 0 0:30"\n\t\t],\n\t\t"Latvia": [\n\t\t\t"1989 1996 2 0 8 2 2 1 S",\n\t\t\t"1989 1996 8 0 8 2 2 0"\n\t\t],\n\t\t"Lebanon": [\n\t\t\t"1920 1920 2 28 7 0 0 1 S",\n\t\t\t"1920 1920 9 25 7 0 0 0",\n\t\t\t"1921 1921 3 3 7 0 0 1 S",\n\t\t\t"1921 1921 9 3 7 0 0 0",\n\t\t\t"1922 1922 2 26 7 0 0 1 S",\n\t\t\t"1922 1922 9 8 7 0 0 0",\n\t\t\t"1923 1923 3 22 7 0 0 1 S",\n\t\t\t"1923 1923 8 16 7 0 0 0",\n\t\t\t"1957 1961 4 1 7 0 0 1 S",\n\t\t\t"1957 1961 9 1 7 0 0 0",\n\t\t\t"1972 1972 5 22 7 0 0 1 S",\n\t\t\t"1972 1977 9 1 7 0 0 0",\n\t\t\t"1973 1977 4 1 7 0 0 1 S",\n\t\t\t"1978 1978 3 30 7 0 0 1 S",\n\t\t\t"1978 1978 8 30 7 0 0 0",\n\t\t\t"1984 1987 4 1 7 0 0 1 S",\n\t\t\t"1984 1991 9 16 7 0 0 0",\n\t\t\t"1988 1988 5 1 7 0 0 1 S",\n\t\t\t"1989 1989 4 10 7 0 0 1 S",\n\t\t\t"1990 1992 4 1 7 0 0 1 S",\n\t\t\t"1992 1992 9 4 7 0 0 0",\n\t\t\t"1993 9999 2 0 8 0 0 1 S",\n\t\t\t"1993 1998 8 0 8 0 0 0",\n\t\t\t"1999 9999 9 0 8 0 0 0"\n\t\t],\n\t\t"Libya": [\n\t\t\t"1951 1951 9 14 7 2 0 1 S",\n\t\t\t"1952 1952 0 1 7 0 0 0",\n\t\t\t"1953 1953 9 9 7 2 0 1 S",\n\t\t\t"1954 1954 0 1 7 0 0 0",\n\t\t\t"1955 1955 8 30 7 0 0 1 S",\n\t\t\t"1956 1956 0 1 7 0 0 0",\n\t\t\t"1982 1984 3 1 7 0 0 1 S",\n\t\t\t"1982 1985 9 1 7 0 0 0",\n\t\t\t"1985 1985 3 6 7 0 0 1 S",\n\t\t\t"1986 1986 3 4 7 0 0 1 S",\n\t\t\t"1986 1986 9 3 7 0 0 0",\n\t\t\t"1987 1989 3 1 7 0 0 1 S",\n\t\t\t"1987 1989 9 1 7 0 0 0",\n\t\t\t"1997 1997 3 4 7 0 0 1 S",\n\t\t\t"1997 1997 9 4 7 0 0 0",\n\t\t\t"2013 9999 2 5 8 1 0 1 S",\n\t\t\t"2013 9999 9 5 8 2 0 0"\n\t\t],\n\t\t"Louisville": [\n\t\t\t"1921 1921 4 1 7 2 0 1 D",\n\t\t\t"1921 1921 8 1 7 2 0 0 S",\n\t\t\t"1941 1961 3 0 8 2 0 1 D",\n\t\t\t"1941 1941 8 0 8 2 0 0 S",\n\t\t\t"1946 1946 5 2 7 2 0 0 S",\n\t\t\t"1950 1955 8 0 8 2 0 0 S",\n\t\t\t"1956 1960 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Lux": [\n\t\t\t"1916 1916 4 14 7 23 0 1 S",\n\t\t\t"1916 1916 9 1 7 1 0 0",\n\t\t\t"1917 1917 3 28 7 23 0 1 S",\n\t\t\t"1917 1917 8 17 7 1 0 0",\n\t\t\t"1918 1918 3 15 1 2 2 1 S",\n\t\t\t"1918 1918 8 15 1 2 2 0",\n\t\t\t"1919 1919 2 1 7 23 0 1 S",\n\t\t\t"1919 1919 9 5 7 3 0 0",\n\t\t\t"1920 1920 1 14 7 23 0 1 S",\n\t\t\t"1920 1920 9 24 7 2 0 0",\n\t\t\t"1921 1921 2 14 7 23 0 1 S",\n\t\t\t"1921 1921 9 26 7 2 0 0",\n\t\t\t"1922 1922 2 25 7 23 0 1 S",\n\t\t\t"1922 1922 9 2 0 1 0 0",\n\t\t\t"1923 1923 3 21 7 23 0 1 S",\n\t\t\t"1923 1923 9 2 0 2 0 0",\n\t\t\t"1924 1924 2 29 7 23 0 1 S",\n\t\t\t"1924 1928 9 2 0 1 0 0",\n\t\t\t"1925 1925 3 5 7 23 0 1 S",\n\t\t\t"1926 1926 3 17 7 23 0 1 S",\n\t\t\t"1927 1927 3 9 7 23 0 1 S",\n\t\t\t"1928 1928 3 14 7 23 0 1 S",\n\t\t\t"1929 1929 3 20 7 23 0 1 S"\n\t\t],\n\t\t"Macau": [\n\t\t\t"1961 1962 2 16 0 3:30 0 1 S",\n\t\t\t"1961 1964 10 1 0 3:30 0 0",\n\t\t\t"1963 1963 2 16 0 0 0 1 S",\n\t\t\t"1964 1964 2 16 0 3:30 0 1 S",\n\t\t\t"1965 1965 2 16 0 0 0 1 S",\n\t\t\t"1965 1965 9 31 7 0 0 0",\n\t\t\t"1966 1971 3 16 0 3:30 0 1 S",\n\t\t\t"1966 1971 9 16 0 3:30 0 0",\n\t\t\t"1972 1974 3 15 0 0 0 1 S",\n\t\t\t"1972 1973 9 15 0 0 0 0",\n\t\t\t"1974 1977 9 15 0 3:30 0 0",\n\t\t\t"1975 1977 3 15 0 3:30 0 1 S",\n\t\t\t"1978 1980 3 15 0 0 0 1 S",\n\t\t\t"1978 1980 9 15 0 0 0 0"\n\t\t],\n\t\t"Malta": [\n\t\t\t"1973 1973 2 31 7 0 2 1 S",\n\t\t\t"1973 1973 8 29 7 0 2 0",\n\t\t\t"1974 1974 3 21 7 0 2 1 S",\n\t\t\t"1974 1974 8 16 7 0 2 0",\n\t\t\t"1975 1979 3 15 0 2 0 1 S",\n\t\t\t"1975 1980 8 15 0 2 0 0",\n\t\t\t"1980 1980 2 31 7 2 0 1 S"\n\t\t],\n\t\t"Marengo": [\n\t\t\t"1951 1951 3 0 8 2 0 1 D",\n\t\t\t"1951 1951 8 0 8 2 0 0 S",\n\t\t\t"1954 1960 3 0 8 2 0 1 D",\n\t\t\t"1954 1960 8 0 8 2 0 0 S"\n\t\t],\n\t\t"Mauritius": [\n\t\t\t"1982 1982 9 10 7 0 0 1 S",\n\t\t\t"1983 1983 2 21 7 0 0 0",\n\t\t\t"2008 2008 9 0 8 2 0 1 S",\n\t\t\t"2009 2009 2 0 8 2 0 0"\n\t\t],\n\t\t"Menominee": [\n\t\t\t"1946 1946 3 0 8 2 0 1 D",\n\t\t\t"1946 1946 8 0 8 2 0 0 S",\n\t\t\t"1966 1966 3 0 8 2 0 1 D",\n\t\t\t"1966 1966 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Mexico": [\n\t\t\t"1939 1939 1 5 7 0 0 1 D",\n\t\t\t"1939 1939 5 25 7 0 0 0 S",\n\t\t\t"1940 1940 11 9 7 0 0 1 D",\n\t\t\t"1941 1941 3 1 7 0 0 0 S",\n\t\t\t"1943 1943 11 16 7 0 0 1 W",\n\t\t\t"1944 1944 4 1 7 0 0 0 S",\n\t\t\t"1950 1950 1 12 7 0 0 1 D",\n\t\t\t"1950 1950 6 30 7 0 0 0 S",\n\t\t\t"1996 2000 3 1 0 2 0 1 D",\n\t\t\t"1996 2000 9 0 8 2 0 0 S",\n\t\t\t"2001 2001 4 1 0 2 0 1 D",\n\t\t\t"2001 2001 8 0 8 2 0 0 S",\n\t\t\t"2002 9999 3 1 0 2 0 1 D",\n\t\t\t"2002 9999 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Moncton": [\n\t\t\t"1933 1935 5 8 0 1 0 1 D",\n\t\t\t"1933 1935 8 8 0 1 0 0 S",\n\t\t\t"1936 1938 5 1 0 1 0 1 D",\n\t\t\t"1936 1938 8 1 0 1 0 0 S",\n\t\t\t"1939 1939 4 27 7 1 0 1 D",\n\t\t\t"1939 1941 8 21 6 1 0 0 S",\n\t\t\t"1940 1940 4 19 7 1 0 1 D",\n\t\t\t"1941 1941 4 4 7 1 0 1 D",\n\t\t\t"1946 1972 3 0 8 2 0 1 D",\n\t\t\t"1946 1956 8 0 8 2 0 0 S",\n\t\t\t"1957 1972 9 0 8 2 0 0 S",\n\t\t\t"1993 2006 3 1 0 0:1 0 1 D",\n\t\t\t"1993 2006 9 0 8 0:1 0 0 S"\n\t\t],\n\t\t"Mongol": [\n\t\t\t"1983 1984 3 1 7 0 0 1 S",\n\t\t\t"1983 1983 9 1 7 0 0 0",\n\t\t\t"1985 1998 2 0 8 0 0 1 S",\n\t\t\t"1984 1998 8 0 8 0 0 0",\n\t\t\t"2001 2001 3 6 8 2 0 1 S",\n\t\t\t"2001 2006 8 6 8 2 0 0",\n\t\t\t"2002 2006 2 6 8 2 0 1 S"\n\t\t],\n\t\t"Mont": [\n\t\t\t"1917 1917 2 25 7 2 0 1 D",\n\t\t\t"1917 1917 3 24 7 0 0 0 S",\n\t\t\t"1919 1919 2 31 7 2:30 0 1 D",\n\t\t\t"1919 1919 9 25 7 2:30 0 0 S",\n\t\t\t"1920 1920 4 2 7 2:30 0 1 D",\n\t\t\t"1920 1922 9 1 0 2:30 0 0 S",\n\t\t\t"1921 1921 4 1 7 2 0 1 D",\n\t\t\t"1922 1922 3 30 7 2 0 1 D",\n\t\t\t"1924 1924 4 17 7 2 0 1 D",\n\t\t\t"1924 1926 8 0 8 2:30 0 0 S",\n\t\t\t"1925 1926 4 1 0 2 0 1 D",\n\t\t\t"1927 1927 4 1 7 0 0 1 D",\n\t\t\t"1927 1932 8 0 8 0 0 0 S",\n\t\t\t"1928 1931 3 0 8 0 0 1 D",\n\t\t\t"1932 1932 4 1 7 0 0 1 D",\n\t\t\t"1933 1940 3 0 8 0 0 1 D",\n\t\t\t"1933 1933 9 1 7 0 0 0 S",\n\t\t\t"1934 1939 8 0 8 0 0 0 S",\n\t\t\t"1946 1973 3 0 8 2 0 1 D",\n\t\t\t"1945 1948 8 0 8 2 0 0 S",\n\t\t\t"1949 1950 9 0 8 2 0 0 S",\n\t\t\t"1951 1956 8 0 8 2 0 0 S",\n\t\t\t"1957 1973 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Morocco": [\n\t\t\t"1939 1939 8 12 7 0 0 1 S",\n\t\t\t"1939 1939 10 19 7 0 0 0",\n\t\t\t"1940 1940 1 25 7 0 0 1 S",\n\t\t\t"1945 1945 10 18 7 0 0 0",\n\t\t\t"1950 1950 5 11 7 0 0 1 S",\n\t\t\t"1950 1950 9 29 7 0 0 0",\n\t\t\t"1967 1967 5 3 7 12 0 1 S",\n\t\t\t"1967 1967 9 1 7 0 0 0",\n\t\t\t"1974 1974 5 24 7 0 0 1 S",\n\t\t\t"1974 1974 8 1 7 0 0 0",\n\t\t\t"1976 1977 4 1 7 0 0 1 S",\n\t\t\t"1976 1976 7 1 7 0 0 0",\n\t\t\t"1977 1977 8 28 7 0 0 0",\n\t\t\t"1978 1978 5 1 7 0 0 1 S",\n\t\t\t"1978 1978 7 4 7 0 0 0",\n\t\t\t"2008 2008 5 1 7 0 0 1 S",\n\t\t\t"2008 2008 8 1 7 0 0 0",\n\t\t\t"2009 2009 5 1 7 0 0 1 S",\n\t\t\t"2009 2009 7 21 7 0 0 0",\n\t\t\t"2010 2010 4 2 7 0 0 1 S",\n\t\t\t"2010 2010 7 8 7 0 0 0",\n\t\t\t"2011 2011 3 3 7 0 0 1 S",\n\t\t\t"2011 2011 6 31 7 0 0 0",\n\t\t\t"2012 2019 3 0 8 2 0 1 S",\n\t\t\t"2012 9999 8 0 8 3 0 0",\n\t\t\t"2012 2012 6 20 7 3 0 0",\n\t\t\t"2012 2012 7 20 7 2 0 1 S",\n\t\t\t"2013 2013 6 9 7 3 0 0",\n\t\t\t"2013 2013 7 8 7 2 0 1 S",\n\t\t\t"2014 2014 5 29 7 3 0 0",\n\t\t\t"2014 2014 6 29 7 2 0 1 S",\n\t\t\t"2015 2015 5 18 7 3 0 0",\n\t\t\t"2015 2015 6 18 7 2 0 1 S",\n\t\t\t"2016 2016 5 7 7 3 0 0",\n\t\t\t"2016 2016 6 7 7 2 0 1 S",\n\t\t\t"2017 2017 4 27 7 3 0 0",\n\t\t\t"2017 2017 5 26 7 2 0 1 S",\n\t\t\t"2018 2018 4 16 7 3 0 0",\n\t\t\t"2018 2018 5 15 7 2 0 1 S",\n\t\t\t"2019 2019 4 6 7 3 0 0",\n\t\t\t"2019 2019 5 5 7 2 0 1 S",\n\t\t\t"2020 2020 4 24 7 2 0 1 S",\n\t\t\t"2021 2021 4 13 7 2 0 1 S",\n\t\t\t"2022 2022 4 3 7 2 0 1 S",\n\t\t\t"2023 9999 3 0 8 2 0 1 S"\n\t\t],\n\t\t"NBorneo": [\n\t\t\t"1935 1941 8 14 7 0 0 0:20 TS",\n\t\t\t"1935 1941 11 14 7 0 0 0"\n\t\t],\n\t\t"NC": [\n\t\t\t"1977 1978 11 1 0 0 0 1 S",\n\t\t\t"1978 1979 1 27 7 0 0 0",\n\t\t\t"1996 1996 11 1 7 2 2 1 S",\n\t\t\t"1997 1997 2 2 7 2 2 0"\n\t\t],\n\t\t"NT_YK": [\n\t\t\t"1918 1918 3 14 7 2 0 1 D",\n\t\t\t"1918 1918 9 27 7 2 0 0 S",\n\t\t\t"1919 1919 4 25 7 2 0 1 D",\n\t\t\t"1919 1919 10 1 7 0 0 0 S",\n\t\t\t"1942 1942 1 9 7 2 0 1 W",\n\t\t\t"1945 1945 7 14 7 23 1 1 P",\n\t\t\t"1945 1945 8 30 7 2 0 0 S",\n\t\t\t"1965 1965 3 0 8 0 0 2 DD",\n\t\t\t"1965 1965 9 0 8 2 0 0 S",\n\t\t\t"1980 1986 3 0 8 2 0 1 D",\n\t\t\t"1980 2006 9 0 8 2 0 0 S",\n\t\t\t"1987 2006 3 1 0 2 0 1 D"\n\t\t],\n\t\t"NYC": [\n\t\t\t"1920 1920 2 0 8 2 0 1 D",\n\t\t\t"1920 1920 9 0 8 2 0 0 S",\n\t\t\t"1921 1966 3 0 8 2 0 1 D",\n\t\t\t"1921 1954 8 0 8 2 0 0 S",\n\t\t\t"1955 1966 9 0 8 2 0 0 S"\n\t\t],\n\t\t"NZ": [\n\t\t\t"1927 1927 10 6 7 2 0 1 S",\n\t\t\t"1928 1928 2 4 7 2 0 0 M",\n\t\t\t"1928 1933 9 8 0 2 0 0:30 S",\n\t\t\t"1929 1933 2 15 0 2 0 0 M",\n\t\t\t"1934 1940 3 0 8 2 0 0 M",\n\t\t\t"1934 1940 8 0 8 2 0 0:30 S",\n\t\t\t"1946 1946 0 1 7 0 0 0 S",\n\t\t\t"1974 1974 10 1 0 2 2 1 D",\n\t\t\t"1975 1975 1 0 8 2 2 0 S",\n\t\t\t"1975 1988 9 0 8 2 2 1 D",\n\t\t\t"1976 1989 2 1 0 2 2 0 S",\n\t\t\t"1989 1989 9 8 0 2 2 1 D",\n\t\t\t"1990 2006 9 1 0 2 2 1 D",\n\t\t\t"1990 2007 2 15 0 2 2 0 S",\n\t\t\t"2007 9999 8 0 8 2 2 1 D",\n\t\t\t"2008 9999 3 1 0 2 2 0 S"\n\t\t],\n\t\t"NZAQ": [\n\t\t\t"1974 1974 10 3 7 2 2 1 D",\n\t\t\t"1975 1988 9 0 8 2 2 1 D",\n\t\t\t"1989 1989 9 8 7 2 2 1 D",\n\t\t\t"1990 2006 9 1 0 2 2 1 D",\n\t\t\t"1975 1975 1 23 7 2 2 0 S",\n\t\t\t"1976 1989 2 1 0 2 2 0 S",\n\t\t\t"1990 2007 2 15 0 2 2 0 S",\n\t\t\t"2007 9999 8 0 8 2 2 1 D",\n\t\t\t"2008 9999 3 1 0 2 2 0 S"\n\t\t],\n\t\t"Namibia": [\n\t\t\t"1994 9999 8 1 0 2 0 1 S",\n\t\t\t"1995 9999 3 1 0 2 0 0"\n\t\t],\n\t\t"Neth": [\n\t\t\t"1916 1916 4 1 7 0 0 1 NST",\n\t\t\t"1916 1916 9 1 7 0 0 0 AMT",\n\t\t\t"1917 1917 3 16 7 2 2 1 NST",\n\t\t\t"1917 1917 8 17 7 2 2 0 AMT",\n\t\t\t"1918 1921 3 1 1 2 2 1 NST",\n\t\t\t"1918 1921 8 1 8 2 2 0 AMT",\n\t\t\t"1922 1922 2 0 8 2 2 1 NST",\n\t\t\t"1922 1936 9 2 0 2 2 0 AMT",\n\t\t\t"1923 1923 5 1 5 2 2 1 NST",\n\t\t\t"1924 1924 2 0 8 2 2 1 NST",\n\t\t\t"1925 1925 5 1 5 2 2 1 NST",\n\t\t\t"1926 1931 4 15 7 2 2 1 NST",\n\t\t\t"1932 1932 4 22 7 2 2 1 NST",\n\t\t\t"1933 1936 4 15 7 2 2 1 NST",\n\t\t\t"1937 1937 4 22 7 2 2 1 NST",\n\t\t\t"1937 1937 6 1 7 0 0 1 S",\n\t\t\t"1937 1939 9 2 0 2 2 0",\n\t\t\t"1938 1939 4 15 7 2 2 1 S",\n\t\t\t"1945 1945 3 2 7 2 2 1 S",\n\t\t\t"1945 1945 8 16 7 2 2 0"\n\t\t],\n\t\t"Nic": [\n\t\t\t"1979 1980 2 16 0 0 0 1 D",\n\t\t\t"1979 1980 5 23 1 0 0 0 S",\n\t\t\t"2005 2005 3 10 7 0 0 1 D",\n\t\t\t"2005 2005 9 1 0 0 0 0 S",\n\t\t\t"2006 2006 3 30 7 2 0 1 D",\n\t\t\t"2006 2006 9 1 0 1 0 0 S"\n\t\t],\n\t\t"Norway": [\n\t\t\t"1916 1916 4 22 7 1 0 1 S",\n\t\t\t"1916 1916 8 30 7 0 0 0",\n\t\t\t"1945 1945 3 2 7 2 2 1 S",\n\t\t\t"1945 1945 9 1 7 2 2 0",\n\t\t\t"1959 1964 2 15 0 2 2 1 S",\n\t\t\t"1959 1965 8 15 0 2 2 0",\n\t\t\t"1965 1965 3 25 7 2 2 1 S"\n\t\t],\n\t\t"PRC": [\n\t\t\t"1986 1986 4 4 7 0 0 1 D",\n\t\t\t"1986 1991 8 11 0 0 0 0 S",\n\t\t\t"1987 1991 3 10 0 0 0 1 D"\n\t\t],\n\t\t"Pakistan": [\n\t\t\t"2002 2002 3 2 0 0:1 0 1 S",\n\t\t\t"2002 2002 9 2 0 0:1 0 0",\n\t\t\t"2008 2008 5 1 7 0 0 1 S",\n\t\t\t"2008 2008 10 1 7 0 0 0",\n\t\t\t"2009 2009 3 15 7 0 0 1 S",\n\t\t\t"2009 2009 10 1 7 0 0 0"\n\t\t],\n\t\t"Palestine": [\n\t\t\t"1999 2005 3 15 5 0 0 1 S",\n\t\t\t"1999 2003 9 15 5 0 0 0",\n\t\t\t"2004 2004 9 1 7 1 0 0",\n\t\t\t"2005 2005 9 4 7 2 0 0",\n\t\t\t"2006 2007 3 1 7 0 0 1 S",\n\t\t\t"2006 2006 8 22 7 0 0 0",\n\t\t\t"2007 2007 8 8 4 2 0 0",\n\t\t\t"2008 2009 2 5 8 0 0 1 S",\n\t\t\t"2008 2008 8 1 7 0 0 0",\n\t\t\t"2009 2009 8 1 5 1 0 0",\n\t\t\t"2010 2010 2 26 7 0 0 1 S",\n\t\t\t"2010 2010 7 11 7 0 0 0",\n\t\t\t"2011 2011 3 1 7 0:1 0 1 S",\n\t\t\t"2011 2011 7 1 7 0 0 0",\n\t\t\t"2011 2011 7 30 7 0 0 1 S",\n\t\t\t"2011 2011 8 30 7 0 0 0",\n\t\t\t"2012 9999 2 4 8 24 0 1 S",\n\t\t\t"2012 9999 8 21 5 1 0 0"\n\t\t],\n\t\t"Para": [\n\t\t\t"1975 1988 9 1 7 0 0 1 S",\n\t\t\t"1975 1978 2 1 7 0 0 0",\n\t\t\t"1979 1991 3 1 7 0 0 0",\n\t\t\t"1989 1989 9 22 7 0 0 1 S",\n\t\t\t"1990 1990 9 1 7 0 0 1 S",\n\t\t\t"1991 1991 9 6 7 0 0 1 S",\n\t\t\t"1992 1992 2 1 7 0 0 0",\n\t\t\t"1992 1992 9 5 7 0 0 1 S",\n\t\t\t"1993 1993 2 31 7 0 0 0",\n\t\t\t"1993 1995 9 1 7 0 0 1 S",\n\t\t\t"1994 1995 1 0 8 0 0 0",\n\t\t\t"1996 1996 2 1 7 0 0 0",\n\t\t\t"1996 2001 9 1 0 0 0 1 S",\n\t\t\t"1997 1997 1 0 8 0 0 0",\n\t\t\t"1998 2001 2 1 0 0 0 0",\n\t\t\t"2002 2004 3 1 0 0 0 0",\n\t\t\t"2002 2003 8 1 0 0 0 1 S",\n\t\t\t"2004 2009 9 15 0 0 0 1 S",\n\t\t\t"2005 2009 2 8 0 0 0 0",\n\t\t\t"2010 9999 9 1 0 0 0 1 S",\n\t\t\t"2010 2012 3 8 0 0 0 0",\n\t\t\t"2013 9999 2 22 0 0 0 0"\n\t\t],\n\t\t"Perry": [\n\t\t\t"1946 1946 3 0 8 2 0 1 D",\n\t\t\t"1946 1946 8 0 8 2 0 0 S",\n\t\t\t"1953 1954 3 0 8 2 0 1 D",\n\t\t\t"1953 1959 8 0 8 2 0 0 S",\n\t\t\t"1955 1955 4 1 7 0 0 1 D",\n\t\t\t"1956 1963 3 0 8 2 0 1 D",\n\t\t\t"1960 1960 9 0 8 2 0 0 S",\n\t\t\t"1961 1961 8 0 8 2 0 0 S",\n\t\t\t"1962 1963 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Peru": [\n\t\t\t"1938 1938 0 1 7 0 0 1 S",\n\t\t\t"1938 1938 3 1 7 0 0 0",\n\t\t\t"1938 1939 8 0 8 0 0 1 S",\n\t\t\t"1939 1940 2 24 0 0 0 0",\n\t\t\t"1986 1987 0 1 7 0 0 1 S",\n\t\t\t"1986 1987 3 1 7 0 0 0",\n\t\t\t"1990 1990 0 1 7 0 0 1 S",\n\t\t\t"1990 1990 3 1 7 0 0 0",\n\t\t\t"1994 1994 0 1 7 0 0 1 S",\n\t\t\t"1994 1994 3 1 7 0 0 0"\n\t\t],\n\t\t"Phil": [\n\t\t\t"1936 1936 10 1 7 0 0 1 S",\n\t\t\t"1937 1937 1 1 7 0 0 0",\n\t\t\t"1954 1954 3 12 7 0 0 1 S",\n\t\t\t"1954 1954 6 1 7 0 0 0",\n\t\t\t"1978 1978 2 22 7 0 0 1 S",\n\t\t\t"1978 1978 8 21 7 0 0 0"\n\t\t],\n\t\t"Pike": [\n\t\t\t"1955 1955 4 1 7 0 0 1 D",\n\t\t\t"1955 1960 8 0 8 2 0 0 S",\n\t\t\t"1956 1964 3 0 8 2 0 1 D",\n\t\t\t"1961 1964 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Poland": [\n\t\t\t"1918 1919 8 16 7 2 2 0",\n\t\t\t"1919 1919 3 15 7 2 2 1 S",\n\t\t\t"1944 1944 3 3 7 2 2 1 S",\n\t\t\t"1944 1944 9 4 7 2 0 0",\n\t\t\t"1945 1945 3 29 7 0 0 1 S",\n\t\t\t"1945 1945 10 1 7 0 0 0",\n\t\t\t"1946 1946 3 14 7 0 2 1 S",\n\t\t\t"1946 1946 9 7 7 2 2 0",\n\t\t\t"1947 1947 4 4 7 2 2 1 S",\n\t\t\t"1947 1949 9 1 0 2 2 0",\n\t\t\t"1948 1948 3 18 7 2 2 1 S",\n\t\t\t"1949 1949 3 10 7 2 2 1 S",\n\t\t\t"1957 1957 5 2 7 1 2 1 S",\n\t\t\t"1957 1958 8 0 8 1 2 0",\n\t\t\t"1958 1958 2 30 7 1 2 1 S",\n\t\t\t"1959 1959 4 31 7 1 2 1 S",\n\t\t\t"1959 1961 9 1 0 1 2 0",\n\t\t\t"1960 1960 3 3 7 1 2 1 S",\n\t\t\t"1961 1964 4 0 8 1 2 1 S",\n\t\t\t"1962 1964 8 0 8 1 2 0"\n\t\t],\n\t\t"Port": [\n\t\t\t"1916 1916 5 17 7 23 0 1 S",\n\t\t\t"1916 1916 10 1 7 1 0 0",\n\t\t\t"1917 1917 1 28 7 23 2 1 S",\n\t\t\t"1917 1921 9 14 7 23 2 0",\n\t\t\t"1918 1918 2 1 7 23 2 1 S",\n\t\t\t"1919 1919 1 28 7 23 2 1 S",\n\t\t\t"1920 1920 1 29 7 23 2 1 S",\n\t\t\t"1921 1921 1 28 7 23 2 1 S",\n\t\t\t"1924 1924 3 16 7 23 2 1 S",\n\t\t\t"1924 1924 9 14 7 23 2 0",\n\t\t\t"1926 1926 3 17 7 23 2 1 S",\n\t\t\t"1926 1929 9 1 6 23 2 0",\n\t\t\t"1927 1927 3 9 7 23 2 1 S",\n\t\t\t"1928 1928 3 14 7 23 2 1 S",\n\t\t\t"1929 1929 3 20 7 23 2 1 S",\n\t\t\t"1931 1931 3 18 7 23 2 1 S",\n\t\t\t"1931 1932 9 1 6 23 2 0",\n\t\t\t"1932 1932 3 2 7 23 2 1 S",\n\t\t\t"1934 1934 3 7 7 23 2 1 S",\n\t\t\t"1934 1938 9 1 6 23 2 0",\n\t\t\t"1935 1935 2 30 7 23 2 1 S",\n\t\t\t"1936 1936 3 18 7 23 2 1 S",\n\t\t\t"1937 1937 3 3 7 23 2 1 S",\n\t\t\t"1938 1938 2 26 7 23 2 1 S",\n\t\t\t"1939 1939 3 15 7 23 2 1 S",\n\t\t\t"1939 1939 10 18 7 23 2 0",\n\t\t\t"1940 1940 1 24 7 23 2 1 S",\n\t\t\t"1940 1941 9 5 7 23 2 0",\n\t\t\t"1941 1941 3 5 7 23 2 1 S",\n\t\t\t"1942 1945 2 8 6 23 2 1 S",\n\t\t\t"1942 1942 3 25 7 22 2 2 M",\n\t\t\t"1942 1942 7 15 7 22 2 1 S",\n\t\t\t"1942 1945 9 24 6 23 2 0",\n\t\t\t"1943 1943 3 17 7 22 2 2 M",\n\t\t\t"1943 1945 7 25 6 22 2 1 S",\n\t\t\t"1944 1945 3 21 6 22 2 2 M",\n\t\t\t"1946 1946 3 1 6 23 2 1 S",\n\t\t\t"1946 1946 9 1 6 23 2 0",\n\t\t\t"1947 1949 3 1 0 2 2 1 S",\n\t\t\t"1947 1949 9 1 0 2 2 0",\n\t\t\t"1951 1965 3 1 0 2 2 1 S",\n\t\t\t"1951 1965 9 1 0 2 2 0",\n\t\t\t"1977 1977 2 27 7 0 2 1 S",\n\t\t\t"1977 1977 8 25 7 0 2 0",\n\t\t\t"1978 1979 3 1 0 0 2 1 S",\n\t\t\t"1978 1978 9 1 7 0 2 0",\n\t\t\t"1979 1982 8 0 8 1 2 0",\n\t\t\t"1980 1980 2 0 8 0 2 1 S",\n\t\t\t"1981 1982 2 0 8 1 2 1 S",\n\t\t\t"1983 1983 2 0 8 2 2 1 S"\n\t\t],\n\t\t"Pulaski": [\n\t\t\t"1946 1960 3 0 8 2 0 1 D",\n\t\t\t"1946 1954 8 0 8 2 0 0 S",\n\t\t\t"1955 1956 9 0 8 2 0 0 S",\n\t\t\t"1957 1960 8 0 8 2 0 0 S"\n\t\t],\n\t\t"ROK": [\n\t\t\t"1960 1960 4 15 7 0 0 1 D",\n\t\t\t"1960 1960 8 13 7 0 0 0 S",\n\t\t\t"1987 1988 4 8 0 0 0 1 D",\n\t\t\t"1987 1988 9 8 0 0 0 0 S"\n\t\t],\n\t\t"Regina": [\n\t\t\t"1918 1918 3 14 7 2 0 1 D",\n\t\t\t"1918 1918 9 27 7 2 0 0 S",\n\t\t\t"1930 1934 4 1 0 0 0 1 D",\n\t\t\t"1930 1934 9 1 0 0 0 0 S",\n\t\t\t"1937 1941 3 8 0 0 0 1 D",\n\t\t\t"1937 1937 9 8 0 0 0 0 S",\n\t\t\t"1938 1938 9 1 0 0 0 0 S",\n\t\t\t"1939 1941 9 8 0 0 0 0 S",\n\t\t\t"1942 1942 1 9 7 2 0 1 W",\n\t\t\t"1945 1945 7 14 7 23 1 1 P",\n\t\t\t"1945 1945 8 0 8 2 0 0 S",\n\t\t\t"1946 1946 3 8 0 2 0 1 D",\n\t\t\t"1946 1946 9 8 0 2 0 0 S",\n\t\t\t"1947 1957 3 0 8 2 0 1 D",\n\t\t\t"1947 1957 8 0 8 2 0 0 S",\n\t\t\t"1959 1959 3 0 8 2 0 1 D",\n\t\t\t"1959 1959 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Romania": [\n\t\t\t"1932 1932 4 21 7 0 2 1 S",\n\t\t\t"1932 1939 9 1 0 0 2 0",\n\t\t\t"1933 1939 3 2 0 0 2 1 S",\n\t\t\t"1979 1979 4 27 7 0 0 1 S",\n\t\t\t"1979 1979 8 0 8 0 0 0",\n\t\t\t"1980 1980 3 5 7 23 0 1 S",\n\t\t\t"1980 1980 8 0 8 1 0 0",\n\t\t\t"1991 1993 2 0 8 0 2 1 S",\n\t\t\t"1991 1993 8 0 8 0 2 0"\n\t\t],\n\t\t"Russia": [\n\t\t\t"1917 1917 6 1 7 23 0 1 MST",\n\t\t\t"1917 1917 11 28 7 0 0 0 MMT",\n\t\t\t"1918 1918 4 31 7 22 0 2 MDST",\n\t\t\t"1918 1918 8 16 7 1 0 1 MST",\n\t\t\t"1919 1919 4 31 7 23 0 2 MDST",\n\t\t\t"1919 1919 6 1 7 2 0 1 S",\n\t\t\t"1919 1919 7 16 7 0 0 0",\n\t\t\t"1921 1921 1 14 7 23 0 1 S",\n\t\t\t"1921 1921 2 20 7 23 0 2 M",\n\t\t\t"1921 1921 8 1 7 0 0 1 S",\n\t\t\t"1921 1921 9 1 7 0 0 0",\n\t\t\t"1981 1984 3 1 7 0 0 1 S",\n\t\t\t"1981 1983 9 1 7 0 0 0",\n\t\t\t"1984 1991 8 0 8 2 2 0",\n\t\t\t"1985 1991 2 0 8 2 2 1 S",\n\t\t\t"1992 1992 2 6 8 23 0 1 S",\n\t\t\t"1992 1992 8 6 8 23 0 0",\n\t\t\t"1993 2010 2 0 8 2 2 1 S",\n\t\t\t"1993 1995 8 0 8 2 2 0",\n\t\t\t"1996 2010 9 0 8 2 2 0"\n\t\t],\n\t\t"RussiaAsia": [\n\t\t\t"1981 1984 3 1 7 0 0 1 S",\n\t\t\t"1981 1983 9 1 7 0 0 0",\n\t\t\t"1984 1991 8 0 8 2 2 0",\n\t\t\t"1985 1991 2 0 8 2 2 1 S",\n\t\t\t"1992 1992 2 6 8 23 0 1 S",\n\t\t\t"1992 1992 8 6 8 23 0 0",\n\t\t\t"1993 9999 2 0 8 2 2 1 S",\n\t\t\t"1993 1995 8 0 8 2 2 0",\n\t\t\t"1996 9999 9 0 8 2 2 0"\n\t\t],\n\t\t"SA": [\n\t\t\t"1942 1943 8 15 0 2 0 1",\n\t\t\t"1943 1944 2 15 0 2 0 0"\n\t\t],\n\t\t"SL": [\n\t\t\t"1935 1942 5 1 7 0 0 0:40 SLST",\n\t\t\t"1935 1942 9 1 7 0 0 0 WAT",\n\t\t\t"1957 1962 5 1 7 0 0 1 SLST",\n\t\t\t"1957 1962 8 1 7 0 0 0 GMT"\n\t\t],\n\t\t"Salv": [\n\t\t\t"1987 1988 4 1 0 0 0 1 D",\n\t\t\t"1987 1988 8 0 8 0 0 0 S"\n\t\t],\n\t\t"SanLuis": [\n\t\t\t"2008 2009 2 8 0 0 0 0",\n\t\t\t"2007 2009 9 8 0 0 0 1 S"\n\t\t],\n\t\t"Shang": [\n\t\t\t"1940 1940 5 3 7 0 0 1 D",\n\t\t\t"1940 1941 9 1 7 0 0 0 S",\n\t\t\t"1941 1941 2 16 7 0 0 1 D"\n\t\t],\n\t\t"SovietZone": [\n\t\t\t"1945 1945 4 24 7 2 0 2 M",\n\t\t\t"1945 1945 8 24 7 3 0 1 S",\n\t\t\t"1945 1945 10 18 7 2 2 0"\n\t\t],\n\t\t"Spain": [\n\t\t\t"1917 1917 4 5 7 23 2 1 S",\n\t\t\t"1917 1919 9 6 7 23 2 0",\n\t\t\t"1918 1918 3 15 7 23 2 1 S",\n\t\t\t"1919 1919 3 5 7 23 2 1 S",\n\t\t\t"1924 1924 3 16 7 23 2 1 S",\n\t\t\t"1924 1924 9 4 7 23 2 0",\n\t\t\t"1926 1926 3 17 7 23 2 1 S",\n\t\t\t"1926 1929 9 1 6 23 2 0",\n\t\t\t"1927 1927 3 9 7 23 2 1 S",\n\t\t\t"1928 1928 3 14 7 23 2 1 S",\n\t\t\t"1929 1929 3 20 7 23 2 1 S",\n\t\t\t"1937 1937 4 22 7 23 2 1 S",\n\t\t\t"1937 1939 9 1 6 23 2 0",\n\t\t\t"1938 1938 2 22 7 23 2 1 S",\n\t\t\t"1939 1939 3 15 7 23 2 1 S",\n\t\t\t"1940 1940 2 16 7 23 2 1 S",\n\t\t\t"1942 1942 4 2 7 22 2 2 M",\n\t\t\t"1942 1942 8 1 7 22 2 1 S",\n\t\t\t"1943 1946 3 13 6 22 2 2 M",\n\t\t\t"1943 1943 9 3 7 22 2 1 S",\n\t\t\t"1944 1944 9 10 7 22 2 1 S",\n\t\t\t"1945 1945 8 30 7 1 0 1 S",\n\t\t\t"1946 1946 8 30 7 0 0 0",\n\t\t\t"1949 1949 3 30 7 23 0 1 S",\n\t\t\t"1949 1949 8 30 7 1 0 0",\n\t\t\t"1974 1975 3 13 6 23 0 1 S",\n\t\t\t"1974 1975 9 1 0 1 0 0",\n\t\t\t"1976 1976 2 27 7 23 0 1 S",\n\t\t\t"1976 1977 8 0 8 1 0 0",\n\t\t\t"1977 1978 3 2 7 23 0 1 S",\n\t\t\t"1978 1978 9 1 7 1 0 0"\n\t\t],\n\t\t"SpainAfrica": [\n\t\t\t"1967 1967 5 3 7 12 0 1 S",\n\t\t\t"1967 1967 9 1 7 0 0 0",\n\t\t\t"1974 1974 5 24 7 0 0 1 S",\n\t\t\t"1974 1974 8 1 7 0 0 0",\n\t\t\t"1976 1977 4 1 7 0 0 1 S",\n\t\t\t"1976 1976 7 1 7 0 0 0",\n\t\t\t"1977 1977 8 28 7 0 0 0",\n\t\t\t"1978 1978 5 1 7 0 0 1 S",\n\t\t\t"1978 1978 7 4 7 0 0 0"\n\t\t],\n\t\t"StJohns": [\n\t\t\t"1917 1917 3 8 7 2 0 1 D",\n\t\t\t"1917 1917 8 17 7 2 0 0 S",\n\t\t\t"1919 1919 4 5 7 23 0 1 D",\n\t\t\t"1919 1919 7 12 7 23 0 0 S",\n\t\t\t"1920 1935 4 1 0 23 0 1 D",\n\t\t\t"1920 1935 9 0 8 23 0 0 S",\n\t\t\t"1936 1941 4 9 1 0 0 1 D",\n\t\t\t"1936 1941 9 2 1 0 0 0 S",\n\t\t\t"1946 1950 4 8 0 2 0 1 D",\n\t\t\t"1946 1950 9 2 0 2 0 0 S",\n\t\t\t"1951 1986 3 0 8 2 0 1 D",\n\t\t\t"1951 1959 8 0 8 2 0 0 S",\n\t\t\t"1960 1986 9 0 8 2 0 0 S",\n\t\t\t"1987 1987 3 1 0 0:1 0 1 D",\n\t\t\t"1987 2006 9 0 8 0:1 0 0 S",\n\t\t\t"1988 1988 3 1 0 0:1 0 2 DD",\n\t\t\t"1989 2006 3 1 0 0:1 0 1 D",\n\t\t\t"2007 2011 2 8 0 0:1 0 1 D",\n\t\t\t"2007 2010 10 1 0 0:1 0 0 S"\n\t\t],\n\t\t"Starke": [\n\t\t\t"1947 1961 3 0 8 2 0 1 D",\n\t\t\t"1947 1954 8 0 8 2 0 0 S",\n\t\t\t"1955 1956 9 0 8 2 0 0 S",\n\t\t\t"1957 1958 8 0 8 2 0 0 S",\n\t\t\t"1959 1961 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Sudan": [\n\t\t\t"1970 1970 4 1 7 0 0 1 S",\n\t\t\t"1970 1985 9 15 7 0 0 0",\n\t\t\t"1971 1971 3 30 7 0 0 1 S",\n\t\t\t"1972 1985 3 0 8 0 0 1 S"\n\t\t],\n\t\t"Swift": [\n\t\t\t"1957 1957 3 0 8 2 0 1 D",\n\t\t\t"1957 1957 9 0 8 2 0 0 S",\n\t\t\t"1959 1961 3 0 8 2 0 1 D",\n\t\t\t"1959 1959 9 0 8 2 0 0 S",\n\t\t\t"1960 1961 8 0 8 2 0 0 S"\n\t\t],\n\t\t"Swiss": [\n\t\t\t"1941 1942 4 1 1 1 0 1 S",\n\t\t\t"1941 1942 9 1 1 2 0 0"\n\t\t],\n\t\t"Syria": [\n\t\t\t"1920 1923 3 15 0 2 0 1 S",\n\t\t\t"1920 1923 9 1 0 2 0 0",\n\t\t\t"1962 1962 3 29 7 2 0 1 S",\n\t\t\t"1962 1962 9 1 7 2 0 0",\n\t\t\t"1963 1965 4 1 7 2 0 1 S",\n\t\t\t"1963 1963 8 30 7 2 0 0",\n\t\t\t"1964 1964 9 1 7 2 0 0",\n\t\t\t"1965 1965 8 30 7 2 0 0",\n\t\t\t"1966 1966 3 24 7 2 0 1 S",\n\t\t\t"1966 1976 9 1 7 2 0 0",\n\t\t\t"1967 1978 4 1 7 2 0 1 S",\n\t\t\t"1977 1978 8 1 7 2 0 0",\n\t\t\t"1983 1984 3 9 7 2 0 1 S",\n\t\t\t"1983 1984 9 1 7 2 0 0",\n\t\t\t"1986 1986 1 16 7 2 0 1 S",\n\t\t\t"1986 1986 9 9 7 2 0 0",\n\t\t\t"1987 1987 2 1 7 2 0 1 S",\n\t\t\t"1987 1988 9 31 7 2 0 0",\n\t\t\t"1988 1988 2 15 7 2 0 1 S",\n\t\t\t"1989 1989 2 31 7 2 0 1 S",\n\t\t\t"1989 1989 9 1 7 2 0 0",\n\t\t\t"1990 1990 3 1 7 2 0 1 S",\n\t\t\t"1990 1990 8 30 7 2 0 0",\n\t\t\t"1991 1991 3 1 7 0 0 1 S",\n\t\t\t"1991 1992 9 1 7 0 0 0",\n\t\t\t"1992 1992 3 8 7 0 0 1 S",\n\t\t\t"1993 1993 2 26 7 0 0 1 S",\n\t\t\t"1993 1993 8 25 7 0 0 0",\n\t\t\t"1994 1996 3 1 7 0 0 1 S",\n\t\t\t"1994 2005 9 1 7 0 0 0",\n\t\t\t"1997 1998 2 1 8 0 0 1 S",\n\t\t\t"1999 2006 3 1 7 0 0 1 S",\n\t\t\t"2006 2006 8 22 7 0 0 0",\n\t\t\t"2007 2007 2 5 8 0 0 1 S",\n\t\t\t"2007 2007 10 1 5 0 0 0",\n\t\t\t"2008 2008 3 1 5 0 0 1 S",\n\t\t\t"2008 2008 10 1 7 0 0 0",\n\t\t\t"2009 2009 2 5 8 0 0 1 S",\n\t\t\t"2010 2011 3 1 5 0 0 1 S",\n\t\t\t"2012 9999 2 5 8 0 0 1 S",\n\t\t\t"2009 9999 9 5 8 0 0 0"\n\t\t],\n\t\t"TC": [\n\t\t\t"1979 1986 3 0 8 2 0 1 D",\n\t\t\t"1979 2006 9 0 8 2 0 0 S",\n\t\t\t"1987 2006 3 1 0 2 0 1 D",\n\t\t\t"2007 9999 2 8 0 2 0 1 D",\n\t\t\t"2007 9999 10 1 0 2 0 0 S"\n\t\t],\n\t\t"Taiwan": [\n\t\t\t"1945 1951 4 1 7 0 0 1 D",\n\t\t\t"1945 1951 9 1 7 0 0 0 S",\n\t\t\t"1952 1952 2 1 7 0 0 1 D",\n\t\t\t"1952 1954 10 1 7 0 0 0 S",\n\t\t\t"1953 1959 3 1 7 0 0 1 D",\n\t\t\t"1955 1961 9 1 7 0 0 0 S",\n\t\t\t"1960 1961 5 1 7 0 0 1 D",\n\t\t\t"1974 1975 3 1 7 0 0 1 D",\n\t\t\t"1974 1975 9 1 7 0 0 0 S",\n\t\t\t"1979 1979 5 30 7 0 0 1 D",\n\t\t\t"1979 1979 8 30 7 0 0 0 S"\n\t\t],\n\t\t"Thule": [\n\t\t\t"1991 1992 2 0 8 2 0 1 D",\n\t\t\t"1991 1992 8 0 8 2 0 0 S",\n\t\t\t"1993 2006 3 1 0 2 0 1 D",\n\t\t\t"1993 2006 9 0 8 2 0 0 S",\n\t\t\t"2007 9999 2 8 0 2 0 1 D",\n\t\t\t"2007 9999 10 1 0 2 0 0 S"\n\t\t],\n\t\t"Tonga": [\n\t\t\t"1999 1999 9 7 7 2 2 1 S",\n\t\t\t"2000 2000 2 19 7 2 2 0",\n\t\t\t"2000 2001 10 1 0 2 0 1 S",\n\t\t\t"2001 2002 0 0 8 2 0 0"\n\t\t],\n\t\t"Toronto": [\n\t\t\t"1919 1919 2 30 7 23:30 0 1 D",\n\t\t\t"1919 1919 9 26 7 0 0 0 S",\n\t\t\t"1920 1920 4 2 7 2 0 1 D",\n\t\t\t"1920 1920 8 26 7 0 0 0 S",\n\t\t\t"1921 1921 4 15 7 2 0 1 D",\n\t\t\t"1921 1921 8 15 7 2 0 0 S",\n\t\t\t"1922 1923 4 8 0 2 0 1 D",\n\t\t\t"1922 1926 8 15 0 2 0 0 S",\n\t\t\t"1924 1927 4 1 0 2 0 1 D",\n\t\t\t"1927 1932 8 0 8 2 0 0 S",\n\t\t\t"1928 1931 3 0 8 2 0 1 D",\n\t\t\t"1932 1932 4 1 7 2 0 1 D",\n\t\t\t"1933 1940 3 0 8 2 0 1 D",\n\t\t\t"1933 1933 9 1 7 2 0 0 S",\n\t\t\t"1934 1939 8 0 8 2 0 0 S",\n\t\t\t"1945 1946 8 0 8 2 0 0 S",\n\t\t\t"1946 1946 3 0 8 2 0 1 D",\n\t\t\t"1947 1949 3 0 8 0 0 1 D",\n\t\t\t"1947 1948 8 0 8 0 0 0 S",\n\t\t\t"1949 1949 10 0 8 0 0 0 S",\n\t\t\t"1950 1973 3 0 8 2 0 1 D",\n\t\t\t"1950 1950 10 0 8 2 0 0 S",\n\t\t\t"1951 1956 8 0 8 2 0 0 S",\n\t\t\t"1957 1973 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Tunisia": [\n\t\t\t"1939 1939 3 15 7 23 2 1 S",\n\t\t\t"1939 1939 10 18 7 23 2 0",\n\t\t\t"1940 1940 1 25 7 23 2 1 S",\n\t\t\t"1941 1941 9 6 7 0 0 0",\n\t\t\t"1942 1942 2 9 7 0 0 1 S",\n\t\t\t"1942 1942 10 2 7 3 0 0",\n\t\t\t"1943 1943 2 29 7 2 0 1 S",\n\t\t\t"1943 1943 3 17 7 2 0 0",\n\t\t\t"1943 1943 3 25 7 2 0 1 S",\n\t\t\t"1943 1943 9 4 7 2 0 0",\n\t\t\t"1944 1945 3 1 1 2 0 1 S",\n\t\t\t"1944 1944 9 8 7 0 0 0",\n\t\t\t"1945 1945 8 16 7 0 0 0",\n\t\t\t"1977 1977 3 30 7 0 2 1 S",\n\t\t\t"1977 1977 8 24 7 0 2 0",\n\t\t\t"1978 1978 4 1 7 0 2 1 S",\n\t\t\t"1978 1978 9 1 7 0 2 0",\n\t\t\t"1988 1988 5 1 7 0 2 1 S",\n\t\t\t"1988 1990 8 0 8 0 2 0",\n\t\t\t"1989 1989 2 26 7 0 2 1 S",\n\t\t\t"1990 1990 4 1 7 0 2 1 S",\n\t\t\t"2005 2005 4 1 7 0 2 1 S",\n\t\t\t"2005 2005 8 30 7 1 2 0",\n\t\t\t"2006 2008 2 0 8 2 2 1 S",\n\t\t\t"2006 2008 9 0 8 2 2 0"\n\t\t],\n\t\t"Turkey": [\n\t\t\t"1916 1916 4 1 7 0 0 1 S",\n\t\t\t"1916 1916 9 1 7 0 0 0",\n\t\t\t"1920 1920 2 28 7 0 0 1 S",\n\t\t\t"1920 1920 9 25 7 0 0 0",\n\t\t\t"1921 1921 3 3 7 0 0 1 S",\n\t\t\t"1921 1921 9 3 7 0 0 0",\n\t\t\t"1922 1922 2 26 7 0 0 1 S",\n\t\t\t"1922 1922 9 8 7 0 0 0",\n\t\t\t"1924 1924 4 13 7 0 0 1 S",\n\t\t\t"1924 1925 9 1 7 0 0 0",\n\t\t\t"1925 1925 4 1 7 0 0 1 S",\n\t\t\t"1940 1940 5 30 7 0 0 1 S",\n\t\t\t"1940 1940 9 5 7 0 0 0",\n\t\t\t"1940 1940 11 1 7 0 0 1 S",\n\t\t\t"1941 1941 8 21 7 0 0 0",\n\t\t\t"1942 1942 3 1 7 0 0 1 S",\n\t\t\t"1942 1942 10 1 7 0 0 0",\n\t\t\t"1945 1945 3 2 7 0 0 1 S",\n\t\t\t"1945 1945 9 8 7 0 0 0",\n\t\t\t"1946 1946 5 1 7 0 0 1 S",\n\t\t\t"1946 1946 9 1 7 0 0 0",\n\t\t\t"1947 1948 3 16 0 0 0 1 S",\n\t\t\t"1947 1950 9 2 0 0 0 0",\n\t\t\t"1949 1949 3 10 7 0 0 1 S",\n\t\t\t"1950 1950 3 19 7 0 0 1 S",\n\t\t\t"1951 1951 3 22 7 0 0 1 S",\n\t\t\t"1951 1951 9 8 7 0 0 0",\n\t\t\t"1962 1962 6 15 7 0 0 1 S",\n\t\t\t"1962 1962 9 8 7 0 0 0",\n\t\t\t"1964 1964 4 15 7 0 0 1 S",\n\t\t\t"1964 1964 9 1 7 0 0 0",\n\t\t\t"1970 1972 4 2 0 0 0 1 S",\n\t\t\t"1970 1972 9 2 0 0 0 0",\n\t\t\t"1973 1973 5 3 7 1 0 1 S",\n\t\t\t"1973 1973 10 4 7 3 0 0",\n\t\t\t"1974 1974 2 31 7 2 0 1 S",\n\t\t\t"1974 1974 10 3 7 5 0 0",\n\t\t\t"1975 1975 2 30 7 0 0 1 S",\n\t\t\t"1975 1976 9 0 8 0 0 0",\n\t\t\t"1976 1976 5 1 7 0 0 1 S",\n\t\t\t"1977 1978 3 1 0 0 0 1 S",\n\t\t\t"1977 1977 9 16 7 0 0 0",\n\t\t\t"1979 1980 3 1 0 3 0 1 S",\n\t\t\t"1979 1982 9 11 1 0 0 0",\n\t\t\t"1981 1982 2 0 8 3 0 1 S",\n\t\t\t"1983 1983 6 31 7 0 0 1 S",\n\t\t\t"1983 1983 9 2 7 0 0 0",\n\t\t\t"1985 1985 3 20 7 0 0 1 S",\n\t\t\t"1985 1985 8 28 7 0 0 0",\n\t\t\t"1986 1990 2 0 8 2 2 1 S",\n\t\t\t"1986 1990 8 0 8 2 2 0",\n\t\t\t"1991 2006 2 0 8 1 2 1 S",\n\t\t\t"1991 1995 8 0 8 1 2 0",\n\t\t\t"1996 2006 9 0 8 1 2 0"\n\t\t],\n\t\t"US": [\n\t\t\t"1918 1919 2 0 8 2 0 1 D",\n\t\t\t"1918 1919 9 0 8 2 0 0 S",\n\t\t\t"1942 1942 1 9 7 2 0 1 W",\n\t\t\t"1945 1945 7 14 7 23 1 1 P",\n\t\t\t"1945 1945 8 30 7 2 0 0 S",\n\t\t\t"1967 2006 9 0 8 2 0 0 S",\n\t\t\t"1967 1973 3 0 8 2 0 1 D",\n\t\t\t"1974 1974 0 6 7 2 0 1 D",\n\t\t\t"1975 1975 1 23 7 2 0 1 D",\n\t\t\t"1976 1986 3 0 8 2 0 1 D",\n\t\t\t"1987 2006 3 1 0 2 0 1 D",\n\t\t\t"2007 9999 2 8 0 2 0 1 D",\n\t\t\t"2007 9999 10 1 0 2 0 0 S"\n\t\t],\n\t\t"Uruguay": [\n\t\t\t"1923 1923 9 2 7 0 0 0:30 HS",\n\t\t\t"1924 1926 3 1 7 0 0 0",\n\t\t\t"1924 1925 9 1 7 0 0 0:30 HS",\n\t\t\t"1933 1935 9 0 8 0 0 0:30 HS",\n\t\t\t"1934 1936 2 25 6 23:30 2 0",\n\t\t\t"1936 1936 10 1 7 0 0 0:30 HS",\n\t\t\t"1937 1941 2 0 8 0 0 0",\n\t\t\t"1937 1940 9 0 8 0 0 0:30 HS",\n\t\t\t"1941 1941 7 1 7 0 0 0:30 HS",\n\t\t\t"1942 1942 0 1 7 0 0 0",\n\t\t\t"1942 1942 11 14 7 0 0 1 S",\n\t\t\t"1943 1943 2 14 7 0 0 0",\n\t\t\t"1959 1959 4 24 7 0 0 1 S",\n\t\t\t"1959 1959 10 15 7 0 0 0",\n\t\t\t"1960 1960 0 17 7 0 0 1 S",\n\t\t\t"1960 1960 2 6 7 0 0 0",\n\t\t\t"1965 1967 3 1 0 0 0 1 S",\n\t\t\t"1965 1965 8 26 7 0 0 0",\n\t\t\t"1966 1967 9 31 7 0 0 0",\n\t\t\t"1968 1970 4 27 7 0 0 0:30 HS",\n\t\t\t"1968 1970 11 2 7 0 0 0",\n\t\t\t"1972 1972 3 24 7 0 0 1 S",\n\t\t\t"1972 1972 7 15 7 0 0 0",\n\t\t\t"1974 1974 2 10 7 0 0 0:30 HS",\n\t\t\t"1974 1974 11 22 7 0 0 1 S",\n\t\t\t"1976 1976 9 1 7 0 0 0",\n\t\t\t"1977 1977 11 4 7 0 0 1 S",\n\t\t\t"1978 1978 3 1 7 0 0 0",\n\t\t\t"1979 1979 9 1 7 0 0 1 S",\n\t\t\t"1980 1980 4 1 7 0 0 0",\n\t\t\t"1987 1987 11 14 7 0 0 1 S",\n\t\t\t"1988 1988 2 14 7 0 0 0",\n\t\t\t"1988 1988 11 11 7 0 0 1 S",\n\t\t\t"1989 1989 2 12 7 0 0 0",\n\t\t\t"1989 1989 9 29 7 0 0 1 S",\n\t\t\t"1990 1992 2 1 0 0 0 0",\n\t\t\t"1990 1991 9 21 0 0 0 1 S",\n\t\t\t"1992 1992 9 18 7 0 0 1 S",\n\t\t\t"1993 1993 1 28 7 0 0 0",\n\t\t\t"2004 2004 8 19 7 0 0 1 S",\n\t\t\t"2005 2005 2 27 7 2 0 0",\n\t\t\t"2005 2005 9 9 7 2 0 1 S",\n\t\t\t"2006 2006 2 12 7 2 0 0",\n\t\t\t"2006 9999 9 1 0 2 0 1 S",\n\t\t\t"2007 9999 2 8 0 2 0 0"\n\t\t],\n\t\t"Vanc": [\n\t\t\t"1918 1918 3 14 7 2 0 1 D",\n\t\t\t"1918 1918 9 27 7 2 0 0 S",\n\t\t\t"1942 1942 1 9 7 2 0 1 W",\n\t\t\t"1945 1945 7 14 7 23 1 1 P",\n\t\t\t"1945 1945 8 30 7 2 0 0 S",\n\t\t\t"1946 1986 3 0 8 2 0 1 D",\n\t\t\t"1946 1946 9 13 7 2 0 0 S",\n\t\t\t"1947 1961 8 0 8 2 0 0 S",\n\t\t\t"1962 2006 9 0 8 2 0 0 S"\n\t\t],\n\t\t"Vanuatu": [\n\t\t\t"1983 1983 8 25 7 0 0 1 S",\n\t\t\t"1984 1991 2 23 0 0 0 0",\n\t\t\t"1984 1984 9 23 7 0 0 1 S",\n\t\t\t"1985 1991 8 23 0 0 0 1 S",\n\t\t\t"1992 1993 0 23 0 0 0 0",\n\t\t\t"1992 1992 9 23 0 0 0 1 S"\n\t\t],\n\t\t"Vincennes": [\n\t\t\t"1946 1946 3 0 8 2 0 1 D",\n\t\t\t"1946 1946 8 0 8 2 0 0 S",\n\t\t\t"1953 1954 3 0 8 2 0 1 D",\n\t\t\t"1953 1959 8 0 8 2 0 0 S",\n\t\t\t"1955 1955 4 1 7 0 0 1 D",\n\t\t\t"1956 1963 3 0 8 2 0 1 D",\n\t\t\t"1960 1960 9 0 8 2 0 0 S",\n\t\t\t"1961 1961 8 0 8 2 0 0 S",\n\t\t\t"1962 1963 9 0 8 2 0 0 S"\n\t\t],\n\t\t"W-Eur": [\n\t\t\t"1977 1980 3 1 0 1 2 1 S",\n\t\t\t"1977 1977 8 0 8 1 2 0",\n\t\t\t"1978 1978 9 1 7 1 2 0",\n\t\t\t"1979 1995 8 0 8 1 2 0",\n\t\t\t"1981 9999 2 0 8 1 2 1 S",\n\t\t\t"1996 9999 9 0 8 1 2 0"\n\t\t],\n\t\t"WS": [\n\t\t\t"2012 9999 8 0 8 3 0 1 D",\n\t\t\t"2012 9999 3 1 0 4 0 0"\n\t\t],\n\t\t"Winn": [\n\t\t\t"1916 1916 3 23 7 0 0 1 D",\n\t\t\t"1916 1916 8 17 7 0 0 0 S",\n\t\t\t"1918 1918 3 14 7 2 0 1 D",\n\t\t\t"1918 1918 9 27 7 2 0 0 S",\n\t\t\t"1937 1937 4 16 7 2 0 1 D",\n\t\t\t"1937 1937 8 26 7 2 0 0 S",\n\t\t\t"1942 1942 1 9 7 2 0 1 W",\n\t\t\t"1945 1945 7 14 7 23 1 1 P",\n\t\t\t"1945 1945 8 0 8 2 0 0 S",\n\t\t\t"1946 1946 4 12 7 2 0 1 D",\n\t\t\t"1946 1946 9 13 7 2 0 0 S",\n\t\t\t"1947 1949 3 0 8 2 0 1 D",\n\t\t\t"1947 1949 8 0 8 2 0 0 S",\n\t\t\t"1950 1950 4 1 7 2 0 1 D",\n\t\t\t"1950 1950 8 30 7 2 0 0 S",\n\t\t\t"1951 1960 3 0 8 2 0 1 D",\n\t\t\t"1951 1958 8 0 8 2 0 0 S",\n\t\t\t"1959 1959 9 0 8 2 0 0 S",\n\t\t\t"1960 1960 8 0 8 2 0 0 S",\n\t\t\t"1963 1963 3 0 8 2 0 1 D",\n\t\t\t"1963 1963 8 22 7 2 0 0 S",\n\t\t\t"1966 1986 3 0 8 2 2 1 D",\n\t\t\t"1966 2005 9 0 8 2 2 0 S",\n\t\t\t"1987 2005 3 1 0 2 2 1 D"\n\t\t],\n\t\t"Zion": [\n\t\t\t"1940 1940 5 1 7 0 0 1 D",\n\t\t\t"1942 1944 10 1 7 0 0 0 S",\n\t\t\t"1943 1943 3 1 7 2 0 1 D",\n\t\t\t"1944 1944 3 1 7 0 0 1 D",\n\t\t\t"1945 1945 3 16 7 0 0 1 D",\n\t\t\t"1945 1945 10 1 7 2 0 0 S",\n\t\t\t"1946 1946 3 16 7 2 0 1 D",\n\t\t\t"1946 1946 10 1 7 0 0 0 S",\n\t\t\t"1948 1948 4 23 7 0 0 2 DD",\n\t\t\t"1948 1948 8 1 7 0 0 1 D",\n\t\t\t"1948 1949 10 1 7 2 0 0 S",\n\t\t\t"1949 1949 4 1 7 0 0 1 D",\n\t\t\t"1950 1950 3 16 7 0 0 1 D",\n\t\t\t"1950 1950 8 15 7 3 0 0 S",\n\t\t\t"1951 1951 3 1 7 0 0 1 D",\n\t\t\t"1951 1951 10 11 7 3 0 0 S",\n\t\t\t"1952 1952 3 20 7 2 0 1 D",\n\t\t\t"1952 1952 9 19 7 3 0 0 S",\n\t\t\t"1953 1953 3 12 7 2 0 1 D",\n\t\t\t"1953 1953 8 13 7 3 0 0 S",\n\t\t\t"1954 1954 5 13 7 0 0 1 D",\n\t\t\t"1954 1954 8 12 7 0 0 0 S",\n\t\t\t"1955 1955 5 11 7 2 0 1 D",\n\t\t\t"1955 1955 8 11 7 0 0 0 S",\n\t\t\t"1956 1956 5 3 7 0 0 1 D",\n\t\t\t"1956 1956 8 30 7 3 0 0 S",\n\t\t\t"1957 1957 3 29 7 2 0 1 D",\n\t\t\t"1957 1957 8 22 7 0 0 0 S",\n\t\t\t"1974 1974 6 7 7 0 0 1 D",\n\t\t\t"1974 1974 9 13 7 0 0 0 S",\n\t\t\t"1975 1975 3 20 7 0 0 1 D",\n\t\t\t"1975 1975 7 31 7 0 0 0 S",\n\t\t\t"1985 1985 3 14 7 0 0 1 D",\n\t\t\t"1985 1985 8 15 7 0 0 0 S",\n\t\t\t"1986 1986 4 18 7 0 0 1 D",\n\t\t\t"1986 1986 8 7 7 0 0 0 S",\n\t\t\t"1987 1987 3 15 7 0 0 1 D",\n\t\t\t"1987 1987 8 13 7 0 0 0 S",\n\t\t\t"1988 1988 3 9 7 0 0 1 D",\n\t\t\t"1988 1988 8 3 7 0 0 0 S",\n\t\t\t"1989 1989 3 30 7 0 0 1 D",\n\t\t\t"1989 1989 8 3 7 0 0 0 S",\n\t\t\t"1990 1990 2 25 7 0 0 1 D",\n\t\t\t"1990 1990 7 26 7 0 0 0 S",\n\t\t\t"1991 1991 2 24 7 0 0 1 D",\n\t\t\t"1991 1991 8 1 7 0 0 0 S",\n\t\t\t"1992 1992 2 29 7 0 0 1 D",\n\t\t\t"1992 1992 8 6 7 0 0 0 S",\n\t\t\t"1993 1993 3 2 7 0 0 1 D",\n\t\t\t"1993 1993 8 5 7 0 0 0 S",\n\t\t\t"1994 1994 3 1 7 0 0 1 D",\n\t\t\t"1994 1994 7 28 7 0 0 0 S",\n\t\t\t"1995 1995 2 31 7 0 0 1 D",\n\t\t\t"1995 1995 8 3 7 0 0 0 S",\n\t\t\t"1996 1996 2 15 7 0 0 1 D",\n\t\t\t"1996 1996 8 16 7 0 0 0 S",\n\t\t\t"1997 1997 2 21 7 0 0 1 D",\n\t\t\t"1997 1997 8 14 7 0 0 0 S",\n\t\t\t"1998 1998 2 20 7 0 0 1 D",\n\t\t\t"1998 1998 8 6 7 0 0 0 S",\n\t\t\t"1999 1999 3 2 7 2 0 1 D",\n\t\t\t"1999 1999 8 3 7 2 0 0 S",\n\t\t\t"2000 2000 3 14 7 2 0 1 D",\n\t\t\t"2000 2000 9 6 7 1 0 0 S",\n\t\t\t"2001 2001 3 9 7 1 0 1 D",\n\t\t\t"2001 2001 8 24 7 1 0 0 S",\n\t\t\t"2002 2002 2 29 7 1 0 1 D",\n\t\t\t"2002 2002 9 7 7 1 0 0 S",\n\t\t\t"2003 2003 2 28 7 1 0 1 D",\n\t\t\t"2003 2003 9 3 7 1 0 0 S",\n\t\t\t"2004 2004 3 7 7 1 0 1 D",\n\t\t\t"2004 2004 8 22 7 1 0 0 S",\n\t\t\t"2005 2005 3 1 7 2 0 1 D",\n\t\t\t"2005 2005 9 9 7 2 0 0 S",\n\t\t\t"2006 2010 2 26 5 2 0 1 D",\n\t\t\t"2006 2006 9 1 7 2 0 0 S",\n\t\t\t"2007 2007 8 16 7 2 0 0 S",\n\t\t\t"2008 2008 9 5 7 2 0 0 S",\n\t\t\t"2009 2009 8 27 7 2 0 0 S",\n\t\t\t"2010 2010 8 12 7 2 0 0 S",\n\t\t\t"2011 2011 3 1 7 2 0 1 D",\n\t\t\t"2011 2011 9 2 7 2 0 0 S",\n\t\t\t"2012 2012 2 26 5 2 0 1 D",\n\t\t\t"2012 2012 8 23 7 2 0 0 S",\n\t\t\t"2013 9999 2 23 5 2 0 1 D",\n\t\t\t"2013 2026 9 2 0 2 0 0 S",\n\t\t\t"2027 2027 9 3 1 2 0 0 S",\n\t\t\t"2028 9999 9 2 0 2 0 0 S"\n\t\t]\n\t},\n\t"zones": {\n\t\t"Africa/Abidjan": [\n\t\t\t"-0:16:8 - LMT 1912 -0:16:8",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Accra": [\n\t\t\t"-0:0:52 - LMT 1918 -0:0:52",\n\t\t\t"0 Ghana %s"\n\t\t],\n\t\t"Africa/Addis_Ababa": [\n\t\t\t"2:34:48 - LMT 1870 2:34:48",\n\t\t\t"2:35:20 - ADMT 1936_4_5 2:35:20",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Algiers": [\n\t\t\t"0:12:12 - LMT 1891_2_15_0_1 0:12:12",\n\t\t\t"0:9:21 - PMT 1911_2_11 0:9:21",\n\t\t\t"0 Algeria WE%sT 1940_1_25_2",\n\t\t\t"1 Algeria CE%sT 1946_9_7 1",\n\t\t\t"0 - WET 1956_0_29",\n\t\t\t"1 - CET 1963_3_14 1",\n\t\t\t"0 Algeria WE%sT 1977_9_21 1",\n\t\t\t"1 Algeria CE%sT 1979_9_26 1",\n\t\t\t"0 Algeria WE%sT 1981_4",\n\t\t\t"1 - CET"\n\t\t],\n\t\t"Africa/Asmara": [\n\t\t\t"2:35:32 - LMT 1870 2:35:32",\n\t\t\t"2:35:32 - AMT 1890 2:35:32",\n\t\t\t"2:35:20 - ADMT 1936_4_5 2:35:20",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Bamako": [\n\t\t\t"-0:32 - LMT 1912 -0:32",\n\t\t\t"0 - GMT 1934_1_26",\n\t\t\t"-1 - WAT 1960_5_20 -1",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Bangui": [\n\t\t\t"1:14:20 - LMT 1912 1:14:20",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Banjul": [\n\t\t\t"-1:6:36 - LMT 1912 -1:6:36",\n\t\t\t"-1:6:36 - BMT 1935 -1:6:36",\n\t\t\t"-1 - WAT 1964 -1",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Bissau": [\n\t\t\t"-1:2:20 - LMT 1911_4_26 -1:2:20",\n\t\t\t"-1 - WAT 1975 -1",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Blantyre": [\n\t\t\t"2:20 - LMT 1903_2 2:20",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Brazzaville": [\n\t\t\t"1:1:8 - LMT 1912 1:1:8",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Bujumbura": [\n\t\t\t"1:57:28 - LMT 1890 1:57:28",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Cairo": [\n\t\t\t"2:5:9 - LMT 1900_9 2:5:9",\n\t\t\t"2 Egypt EE%sT"\n\t\t],\n\t\t"Africa/Casablanca": [\n\t\t\t"-0:30:20 - LMT 1913_9_26 -0:30:20",\n\t\t\t"0 Morocco WE%sT 1984_2_16",\n\t\t\t"1 - CET 1986 1",\n\t\t\t"0 Morocco WE%sT"\n\t\t],\n\t\t"Africa/Ceuta": [\n\t\t\t"-0:21:16 - LMT 1901 -0:21:16",\n\t\t\t"0 - WET 1918_4_6_23",\n\t\t\t"1 - WEST 1918_9_7_23 1",\n\t\t\t"0 - WET 1924",\n\t\t\t"0 Spain WE%sT 1929",\n\t\t\t"0 SpainAfrica WE%sT 1984_2_16",\n\t\t\t"1 - CET 1986 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Africa/Conakry": [\n\t\t\t"-0:54:52 - LMT 1912 -0:54:52",\n\t\t\t"0 - GMT 1934_1_26",\n\t\t\t"-1 - WAT 1960 -1",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Dakar": [\n\t\t\t"-1:9:44 - LMT 1912 -1:9:44",\n\t\t\t"-1 - WAT 1941_5 -1",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Dar_es_Salaam": [\n\t\t\t"2:37:8 - LMT 1931 2:37:8",\n\t\t\t"3 - EAT 1948 3",\n\t\t\t"2:45 - BEAUT 1961 2:45",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Djibouti": [\n\t\t\t"2:52:36 - LMT 1911_6 2:52:36",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Douala": [\n\t\t\t"0:38:48 - LMT 1912 0:38:48",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/El_Aaiun": [\n\t\t\t"-0:52:48 - LMT 1934_0 -0:52:48",\n\t\t\t"-1 - WAT 1976_3_14 -1",\n\t\t\t"0 - WET"\n\t\t],\n\t\t"Africa/Freetown": [\n\t\t\t"-0:53 - LMT 1882 -0:53",\n\t\t\t"-0:53 - FMT 1913_5 -0:53",\n\t\t\t"-1 SL %s 1957 -1",\n\t\t\t"0 SL %s"\n\t\t],\n\t\t"Africa/Gaborone": [\n\t\t\t"1:43:40 - LMT 1885 1:43:40",\n\t\t\t"1:30 - SAST 1903_2 1:30",\n\t\t\t"2 - CAT 1943_8_19_2 2",\n\t\t\t"3 - CAST 1944_2_19_2 3",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Harare": [\n\t\t\t"2:4:12 - LMT 1903_2 2:4:12",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Johannesburg": [\n\t\t\t"1:52 - LMT 1892_1_8 1:52",\n\t\t\t"1:30 - SAST 1903_2 1:30",\n\t\t\t"2 SA SAST"\n\t\t],\n\t\t"Africa/Juba": [\n\t\t\t"2:6:24 - LMT 1931 2:6:24",\n\t\t\t"2 Sudan CA%sT 2000_0_15_12 2",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Kampala": [\n\t\t\t"2:9:40 - LMT 1928_6 2:9:40",\n\t\t\t"3 - EAT 1930 3",\n\t\t\t"2:30 - BEAT 1948 2:30",\n\t\t\t"2:45 - BEAUT 1957 2:45",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Khartoum": [\n\t\t\t"2:10:8 - LMT 1931 2:10:8",\n\t\t\t"2 Sudan CA%sT 2000_0_15_12 2",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Kigali": [\n\t\t\t"2:0:16 - LMT 1935_5 2:0:16",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Kinshasa": [\n\t\t\t"1:1:12 - LMT 1897_10_9 1:1:12",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Lagos": [\n\t\t\t"0:13:36 - LMT 1919_8 0:13:36",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Libreville": [\n\t\t\t"0:37:48 - LMT 1912 0:37:48",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Lome": [\n\t\t\t"0:4:52 - LMT 1893 0:4:52",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Luanda": [\n\t\t\t"0:52:56 - LMT 1892 0:52:56",\n\t\t\t"0:52:4 - AOT 1911_4_26 0:52:4",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Lubumbashi": [\n\t\t\t"1:49:52 - LMT 1897_10_9 1:49:52",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Lusaka": [\n\t\t\t"1:53:8 - LMT 1903_2 1:53:8",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Malabo": [\n\t\t\t"0:35:8 - LMT 1912 0:35:8",\n\t\t\t"0 - GMT 1963_11_15",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Maputo": [\n\t\t\t"2:10:20 - LMT 1903_2 2:10:20",\n\t\t\t"2 - CAT"\n\t\t],\n\t\t"Africa/Maseru": [\n\t\t\t"1:50 - LMT 1903_2 1:50",\n\t\t\t"2 - SAST 1943_8_19_2 2",\n\t\t\t"3 - SAST 1944_2_19_2 3",\n\t\t\t"2 - SAST"\n\t\t],\n\t\t"Africa/Mbabane": [\n\t\t\t"2:4:24 - LMT 1903_2 2:4:24",\n\t\t\t"2 - SAST"\n\t\t],\n\t\t"Africa/Mogadishu": [\n\t\t\t"3:1:28 - LMT 1893_10 3:1:28",\n\t\t\t"3 - EAT 1931 3",\n\t\t\t"2:30 - BEAT 1957 2:30",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Monrovia": [\n\t\t\t"-0:43:8 - LMT 1882 -0:43:8",\n\t\t\t"-0:43:8 - MMT 1919_2 -0:43:8",\n\t\t\t"-0:44:30 - LRT 1972_4 -0:44:30",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Nairobi": [\n\t\t\t"2:27:16 - LMT 1928_6 2:27:16",\n\t\t\t"3 - EAT 1930 3",\n\t\t\t"2:30 - BEAT 1940 2:30",\n\t\t\t"2:45 - BEAUT 1960 2:45",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Africa/Ndjamena": [\n\t\t\t"1:0:12 - LMT 1912 1:0:12",\n\t\t\t"1 - WAT 1979_9_14 1",\n\t\t\t"2 - WAST 1980_2_8 2",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Niamey": [\n\t\t\t"0:8:28 - LMT 1912 0:8:28",\n\t\t\t"-1 - WAT 1934_1_26 -1",\n\t\t\t"0 - GMT 1960",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Nouakchott": [\n\t\t\t"-1:3:48 - LMT 1912 -1:3:48",\n\t\t\t"0 - GMT 1934_1_26",\n\t\t\t"-1 - WAT 1960_10_28 -1",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Ouagadougou": [\n\t\t\t"-0:6:4 - LMT 1912 -0:6:4",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Porto-Novo": [\n\t\t\t"0:10:28 - LMT 1912 0:10:28",\n\t\t\t"0 - GMT 1934_1_26",\n\t\t\t"1 - WAT"\n\t\t],\n\t\t"Africa/Sao_Tome": [\n\t\t\t"0:26:56 - LMT 1884 0:26:56",\n\t\t\t"-0:36:32 - LMT 1912 -0:36:32",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Africa/Tripoli": [\n\t\t\t"0:52:44 - LMT 1920 0:52:44",\n\t\t\t"1 Libya CE%sT 1959 1",\n\t\t\t"2 - EET 1982 2",\n\t\t\t"1 Libya CE%sT 1990_4_4 1",\n\t\t\t"2 - EET 1996_8_30 2",\n\t\t\t"1 Libya CE%sT 1997_9_4 2",\n\t\t\t"2 - EET 2012_10_10_2 2",\n\t\t\t"1 Libya CE%sT"\n\t\t],\n\t\t"Africa/Tunis": [\n\t\t\t"0:40:44 - LMT 1881_4_12 0:40:44",\n\t\t\t"0:9:21 - PMT 1911_2_11 0:9:21",\n\t\t\t"1 Tunisia CE%sT"\n\t\t],\n\t\t"Africa/Windhoek": [\n\t\t\t"1:8:24 - LMT 1892_1_8 1:8:24",\n\t\t\t"1:30 - SWAT 1903_2 1:30",\n\t\t\t"2 - SAST 1942_8_20_2 2",\n\t\t\t"3 - SAST 1943_2_21_2 3",\n\t\t\t"2 - SAST 1990_2_21 2",\n\t\t\t"2 - CAT 1994_3_3 2",\n\t\t\t"1 Namibia WA%sT"\n\t\t],\n\t\t"America/Adak": [\n\t\t\t"12:13:21 - LMT 1867_9_18 12:13:21",\n\t\t\t"-11:46:38 - LMT 1900_7_20_12 -11:46:38",\n\t\t\t"-11 - NST 1942 -11",\n\t\t\t"-11 US N%sT 1946 -11",\n\t\t\t"-11 - NST 1967_3 -11",\n\t\t\t"-11 - BST 1969 -11",\n\t\t\t"-11 US B%sT 1983_9_30_2 -10",\n\t\t\t"-10 US AH%sT 1983_10_30 -10",\n\t\t\t"-10 US HA%sT"\n\t\t],\n\t\t"America/Anchorage": [\n\t\t\t"14:0:24 - LMT 1867_9_18 14:0:24",\n\t\t\t"-9:59:36 - LMT 1900_7_20_12 -9:59:36",\n\t\t\t"-10 - CAT 1942 -10",\n\t\t\t"-10 US CAT/CAWT 1945_7_14_23",\n\t\t\t"-10 US CAT/CAPT 1946 -10",\n\t\t\t"-10 - CAT 1967_3 -10",\n\t\t\t"-10 - AHST 1969 -10",\n\t\t\t"-10 US AH%sT 1983_9_30_2 -9",\n\t\t\t"-9 US Y%sT 1983_10_30 -9",\n\t\t\t"-9 US AK%sT"\n\t\t],\n\t\t"America/Anguilla": [\n\t\t\t"-4:12:16 - LMT 1912_2_2 -4:12:16",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Antigua": [\n\t\t\t"-4:7:12 - LMT 1912_2_2 -4:7:12",\n\t\t\t"-5 - EST 1951 -5",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Araguaina": [\n\t\t\t"-3:12:48 - LMT 1914 -3:12:48",\n\t\t\t"-3 Brazil BR%sT 1990_8_17 -3",\n\t\t\t"-3 - BRT 1995_8_14 -3",\n\t\t\t"-3 Brazil BR%sT 2003_8_24 -3",\n\t\t\t"-3 - BRT 2012_9_21 -3",\n\t\t\t"-3 Brazil BR%sT"\n\t\t],\n\t\t"America/Argentina/Buenos_Aires": [\n\t\t\t"-3:53:48 - LMT 1894_9_31 -3:53:48",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 Arg AR%sT"\n\t\t],\n\t\t"America/Argentina/Catamarca": [\n\t\t\t"-4:23:8 - LMT 1894_9_31 -4:23:8",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1991_2_3 -2",\n\t\t\t"-4 - WART 1991_9_20 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_5_1 -3",\n\t\t\t"-4 - WART 2004_5_20 -4",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Argentina/Cordoba": [\n\t\t\t"-4:16:48 - LMT 1894_9_31 -4:16:48",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1991_2_3 -2",\n\t\t\t"-4 - WART 1991_9_20 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 Arg AR%sT"\n\t\t],\n\t\t"America/Argentina/Jujuy": [\n\t\t\t"-4:21:12 - LMT 1894_9_31 -4:21:12",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1990_2_4 -2",\n\t\t\t"-4 - WART 1990_9_28 -4",\n\t\t\t"-3 - WARST 1991_2_17 -3",\n\t\t\t"-4 - WART 1991_9_6 -4",\n\t\t\t"-2 - ARST 1992 -2",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Argentina/La_Rioja": [\n\t\t\t"-4:27:24 - LMT 1894_9_31 -4:27:24",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1991_2_1 -2",\n\t\t\t"-4 - WART 1991_4_7 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_5_1 -3",\n\t\t\t"-4 - WART 2004_5_20 -4",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Argentina/Mendoza": [\n\t\t\t"-4:35:16 - LMT 1894_9_31 -4:35:16",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1990_2_4 -2",\n\t\t\t"-4 - WART 1990_9_15 -4",\n\t\t\t"-3 - WARST 1991_2_1 -3",\n\t\t\t"-4 - WART 1991_9_15 -4",\n\t\t\t"-3 - WARST 1992_2_1 -3",\n\t\t\t"-4 - WART 1992_9_18 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_4_23 -3",\n\t\t\t"-4 - WART 2004_8_26 -4",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Argentina/Rio_Gallegos": [\n\t\t\t"-4:36:52 - LMT 1894_9_31 -4:36:52",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_5_1 -3",\n\t\t\t"-4 - WART 2004_5_20 -4",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Argentina/Salta": [\n\t\t\t"-4:21:40 - LMT 1894_9_31 -4:21:40",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1991_2_3 -2",\n\t\t\t"-4 - WART 1991_9_20 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Argentina/San_Juan": [\n\t\t\t"-4:34:4 - LMT 1894_9_31 -4:34:4",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1991_2_1 -2",\n\t\t\t"-4 - WART 1991_4_7 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_4_31 -3",\n\t\t\t"-4 - WART 2004_6_25 -4",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Argentina/San_Luis": [\n\t\t\t"-4:25:24 - LMT 1894_9_31 -4:25:24",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1990 -2",\n\t\t\t"-2 - ARST 1990_2_14 -2",\n\t\t\t"-4 - WART 1990_9_15 -4",\n\t\t\t"-3 - WARST 1991_2_1 -3",\n\t\t\t"-4 - WART 1991_5_1 -4",\n\t\t\t"-3 - ART 1999_9_3 -3",\n\t\t\t"-3 - WARST 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_4_31 -3",\n\t\t\t"-4 - WART 2004_6_25 -4",\n\t\t\t"-3 Arg AR%sT 2008_0_21 -2",\n\t\t\t"-4 SanLuis WAR%sT"\n\t\t],\n\t\t"America/Argentina/Tucuman": [\n\t\t\t"-4:20:52 - LMT 1894_9_31 -4:20:52",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1991_2_3 -2",\n\t\t\t"-4 - WART 1991_9_20 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_5_1 -3",\n\t\t\t"-4 - WART 2004_5_13 -4",\n\t\t\t"-3 Arg AR%sT"\n\t\t],\n\t\t"America/Argentina/Ushuaia": [\n\t\t\t"-4:33:12 - LMT 1894_9_31 -4:33:12",\n\t\t\t"-4:16:48 - CMT 1920_4 -4:16:48",\n\t\t\t"-4 - ART 1930_11 -4",\n\t\t\t"-4 Arg AR%sT 1969_9_5 -4",\n\t\t\t"-3 Arg AR%sT 1999_9_3 -3",\n\t\t\t"-4 Arg AR%sT 2000_2_3 -3",\n\t\t\t"-3 - ART 2004_4_30 -3",\n\t\t\t"-4 - WART 2004_5_20 -4",\n\t\t\t"-3 Arg AR%sT 2008_9_18 -3",\n\t\t\t"-3 - ART"\n\t\t],\n\t\t"America/Aruba": [\n\t\t\t"-4:40:24 - LMT 1912_1_12 -4:40:24",\n\t\t\t"-4:30 - ANT 1965 -4:30",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Asuncion": [\n\t\t\t"-3:50:40 - LMT 1890 -3:50:40",\n\t\t\t"-3:50:40 - AMT 1931_9_10 -3:50:40",\n\t\t\t"-4 - PYT 1972_9 -4",\n\t\t\t"-3 - PYT 1974_3 -3",\n\t\t\t"-4 Para PY%sT"\n\t\t],\n\t\t"America/Atikokan": [\n\t\t\t"-6:6:28 - LMT 1895 -6:6:28",\n\t\t\t"-6 Canada C%sT 1940_8_29 -6",\n\t\t\t"-5 - CDT 1942_1_9_2 -6",\n\t\t\t"-6 Canada C%sT 1945_8_30_2 -5",\n\t\t\t"-5 - EST"\n\t\t],\n\t\t"America/Bahia": [\n\t\t\t"-2:34:4 - LMT 1914 -2:34:4",\n\t\t\t"-3 Brazil BR%sT 2003_8_24 -3",\n\t\t\t"-3 - BRT 2011_9_16 -3",\n\t\t\t"-3 Brazil BR%sT 2012_9_21 -3",\n\t\t\t"-3 - BRT"\n\t\t],\n\t\t"America/Bahia_Banderas": [\n\t\t\t"-7:1 - LMT 1921_11_31_23_59 -7:1",\n\t\t\t"-7 - MST 1927_5_10_23 -7",\n\t\t\t"-6 - CST 1930_10_15 -6",\n\t\t\t"-7 - MST 1931_4_1_23 -7",\n\t\t\t"-6 - CST 1931_9 -6",\n\t\t\t"-7 - MST 1932_3_1 -7",\n\t\t\t"-6 - CST 1942_3_24 -6",\n\t\t\t"-7 - MST 1949_0_14 -7",\n\t\t\t"-8 - PST 1970 -8",\n\t\t\t"-7 Mexico M%sT 2010_3_4_2 -7",\n\t\t\t"-6 Mexico C%sT"\n\t\t],\n\t\t"America/Barbados": [\n\t\t\t"-3:58:29 - LMT 1924 -3:58:29",\n\t\t\t"-3:58:29 - BMT 1932 -3:58:29",\n\t\t\t"-4 Barb A%sT"\n\t\t],\n\t\t"America/Belem": [\n\t\t\t"-3:13:56 - LMT 1914 -3:13:56",\n\t\t\t"-3 Brazil BR%sT 1988_8_12 -3",\n\t\t\t"-3 - BRT"\n\t\t],\n\t\t"America/Belize": [\n\t\t\t"-5:52:48 - LMT 1912_3 -5:52:48",\n\t\t\t"-6 Belize C%sT"\n\t\t],\n\t\t"America/Blanc-Sablon": [\n\t\t\t"-3:48:28 - LMT 1884 -3:48:28",\n\t\t\t"-4 Canada A%sT 1970 -4",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Boa_Vista": [\n\t\t\t"-4:2:40 - LMT 1914 -4:2:40",\n\t\t\t"-4 Brazil AM%sT 1988_8_12 -4",\n\t\t\t"-4 - AMT 1999_8_30 -4",\n\t\t\t"-4 Brazil AM%sT 2000_9_15 -3",\n\t\t\t"-4 - AMT"\n\t\t],\n\t\t"America/Bogota": [\n\t\t\t"-4:56:16 - LMT 1884_2_13 -4:56:16",\n\t\t\t"-4:56:16 - BMT 1914_10_23 -4:56:16",\n\t\t\t"-5 CO CO%sT"\n\t\t],\n\t\t"America/Boise": [\n\t\t\t"-7:44:49 - LMT 1883_10_18_12_15_11 -7:44:49",\n\t\t\t"-8 US P%sT 1923_4_13_2 -8",\n\t\t\t"-7 US M%sT 1974 -7",\n\t\t\t"-7 - MST 1974_1_3_2 -7",\n\t\t\t"-7 US M%sT"\n\t\t],\n\t\t"America/Cambridge_Bay": [\n\t\t\t"0 - zzz 1920",\n\t\t\t"-7 NT_YK M%sT 1999_9_31_2 -6",\n\t\t\t"-6 Canada C%sT 2000_9_29_2 -5",\n\t\t\t"-5 - EST 2000_10_5_0 -5",\n\t\t\t"-6 - CST 2001_3_1_3 -6",\n\t\t\t"-7 Canada M%sT"\n\t\t],\n\t\t"America/Campo_Grande": [\n\t\t\t"-3:38:28 - LMT 1914 -3:38:28",\n\t\t\t"-4 Brazil AM%sT"\n\t\t],\n\t\t"America/Cancun": [\n\t\t\t"-5:47:4 - LMT 1922_0_1_0_12_56 -5:47:4",\n\t\t\t"-6 - CST 1981_11_23 -6",\n\t\t\t"-5 Mexico E%sT 1998_7_2_2 -4",\n\t\t\t"-6 Mexico C%sT"\n\t\t],\n\t\t"America/Caracas": [\n\t\t\t"-4:27:44 - LMT 1890 -4:27:44",\n\t\t\t"-4:27:40 - CMT 1912_1_12 -4:27:40",\n\t\t\t"-4:30 - VET 1965 -4:30",\n\t\t\t"-4 - VET 2007_11_9_03 -4",\n\t\t\t"-4:30 - VET"\n\t\t],\n\t\t"America/Cayenne": [\n\t\t\t"-3:29:20 - LMT 1911_6 -3:29:20",\n\t\t\t"-4 - GFT 1967_9 -4",\n\t\t\t"-3 - GFT"\n\t\t],\n\t\t"America/Cayman": [\n\t\t\t"-5:25:32 - LMT 1890 -5:25:32",\n\t\t\t"-5:7:12 - KMT 1912_1 -5:7:12",\n\t\t\t"-5 - EST"\n\t\t],\n\t\t"America/Chicago": [\n\t\t\t"-5:50:36 - LMT 1883_10_18_12_9_24 -5:50:36",\n\t\t\t"-6 US C%sT 1920 -6",\n\t\t\t"-6 Chicago C%sT 1936_2_1_2 -6",\n\t\t\t"-5 - EST 1936_10_15_2 -5",\n\t\t\t"-6 Chicago C%sT 1942 -6",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 Chicago C%sT 1967 -6",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/Chihuahua": [\n\t\t\t"-7:4:20 - LMT 1921_11_31_23_55_40 -7:4:20",\n\t\t\t"-7 - MST 1927_5_10_23 -7",\n\t\t\t"-6 - CST 1930_10_15 -6",\n\t\t\t"-7 - MST 1931_4_1_23 -7",\n\t\t\t"-6 - CST 1931_9 -6",\n\t\t\t"-7 - MST 1932_3_1 -7",\n\t\t\t"-6 - CST 1996 -6",\n\t\t\t"-6 Mexico C%sT 1998 -6",\n\t\t\t"-6 - CST 1998_3_5_3 -6",\n\t\t\t"-7 Mexico M%sT"\n\t\t],\n\t\t"America/Costa_Rica": [\n\t\t\t"-5:36:13 - LMT 1890 -5:36:13",\n\t\t\t"-5:36:13 - SJMT 1921_0_15 -5:36:13",\n\t\t\t"-6 CR C%sT"\n\t\t],\n\t\t"America/Creston": [\n\t\t\t"-7:46:4 - LMT 1884 -7:46:4",\n\t\t\t"-7 - MST 1916_9_1 -7",\n\t\t\t"-8 - PST 1918_5_2 -8",\n\t\t\t"-7 - MST"\n\t\t],\n\t\t"America/Cuiaba": [\n\t\t\t"-3:44:20 - LMT 1914 -3:44:20",\n\t\t\t"-4 Brazil AM%sT 2003_8_24 -4",\n\t\t\t"-4 - AMT 2004_9_1 -4",\n\t\t\t"-4 Brazil AM%sT"\n\t\t],\n\t\t"America/Curacao": [\n\t\t\t"-4:35:47 - LMT 1912_1_12 -4:35:47",\n\t\t\t"-4:30 - ANT 1965 -4:30",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Danmarkshavn": [\n\t\t\t"-1:14:40 - LMT 1916_6_28 -1:14:40",\n\t\t\t"-3 - WGT 1980_3_6_2 -3",\n\t\t\t"-3 EU WG%sT 1996 -3",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"America/Dawson": [\n\t\t\t"-9:17:40 - LMT 1900_7_20 -9:17:40",\n\t\t\t"-9 NT_YK Y%sT 1973_9_28_0 -9",\n\t\t\t"-8 NT_YK P%sT 1980 -8",\n\t\t\t"-8 Canada P%sT"\n\t\t],\n\t\t"America/Dawson_Creek": [\n\t\t\t"-8:0:56 - LMT 1884 -8:0:56",\n\t\t\t"-8 Canada P%sT 1947 -8",\n\t\t\t"-8 Vanc P%sT 1972_7_30_2 -7",\n\t\t\t"-7 - MST"\n\t\t],\n\t\t"America/Denver": [\n\t\t\t"-6:59:56 - LMT 1883_10_18_12_0_4 -6:59:56",\n\t\t\t"-7 US M%sT 1920 -7",\n\t\t\t"-7 Denver M%sT 1942 -7",\n\t\t\t"-7 US M%sT 1946 -7",\n\t\t\t"-7 Denver M%sT 1967 -7",\n\t\t\t"-7 US M%sT"\n\t\t],\n\t\t"America/Detroit": [\n\t\t\t"-5:32:11 - LMT 1905 -5:32:11",\n\t\t\t"-6 - CST 1915_4_15_2 -6",\n\t\t\t"-5 - EST 1942 -5",\n\t\t\t"-5 US E%sT 1946 -5",\n\t\t\t"-5 Detroit E%sT 1973 -5",\n\t\t\t"-5 US E%sT 1975 -5",\n\t\t\t"-5 - EST 1975_3_27_2 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Dominica": [\n\t\t\t"-4:5:36 - LMT 1911_6_1_0_1 -4:5:36",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Edmonton": [\n\t\t\t"-7:33:52 - LMT 1906_8 -7:33:52",\n\t\t\t"-7 Edm M%sT 1987 -7",\n\t\t\t"-7 Canada M%sT"\n\t\t],\n\t\t"America/Eirunepe": [\n\t\t\t"-4:39:28 - LMT 1914 -4:39:28",\n\t\t\t"-5 Brazil AC%sT 1988_8_12 -5",\n\t\t\t"-5 - ACT 1993_8_28 -5",\n\t\t\t"-5 Brazil AC%sT 1994_8_22 -5",\n\t\t\t"-5 - ACT 2008_5_24_00 -5",\n\t\t\t"-4 - AMT"\n\t\t],\n\t\t"America/El_Salvador": [\n\t\t\t"-5:56:48 - LMT 1921 -5:56:48",\n\t\t\t"-6 Salv C%sT"\n\t\t],\n\t\t"America/Fortaleza": [\n\t\t\t"-2:34 - LMT 1914 -2:34",\n\t\t\t"-3 Brazil BR%sT 1990_8_17 -3",\n\t\t\t"-3 - BRT 1999_8_30 -3",\n\t\t\t"-3 Brazil BR%sT 2000_9_22 -2",\n\t\t\t"-3 - BRT 2001_8_13 -3",\n\t\t\t"-3 Brazil BR%sT 2002_9_1 -3",\n\t\t\t"-3 - BRT"\n\t\t],\n\t\t"America/Glace_Bay": [\n\t\t\t"-3:59:48 - LMT 1902_5_15 -3:59:48",\n\t\t\t"-4 Canada A%sT 1953 -4",\n\t\t\t"-4 Halifax A%sT 1954 -4",\n\t\t\t"-4 - AST 1972 -4",\n\t\t\t"-4 Halifax A%sT 1974 -4",\n\t\t\t"-4 Canada A%sT"\n\t\t],\n\t\t"America/Godthab": [\n\t\t\t"-3:26:56 - LMT 1916_6_28 -3:26:56",\n\t\t\t"-3 - WGT 1980_3_6_2 -3",\n\t\t\t"-3 EU WG%sT"\n\t\t],\n\t\t"America/Goose_Bay": [\n\t\t\t"-4:1:40 - LMT 1884 -4:1:40",\n\t\t\t"-3:30:52 - NST 1918 -3:30:52",\n\t\t\t"-3:30:52 Canada N%sT 1919 -3:30:52",\n\t\t\t"-3:30:52 - NST 1935_2_30 -3:30:52",\n\t\t\t"-3:30 - NST 1936 -3:30",\n\t\t\t"-3:30 StJohns N%sT 1942_4_11 -3:30",\n\t\t\t"-3:30 Canada N%sT 1946 -3:30",\n\t\t\t"-3:30 StJohns N%sT 1966_2_15_2 -3:30",\n\t\t\t"-4 StJohns A%sT 2011_10 -3",\n\t\t\t"-4 Canada A%sT"\n\t\t],\n\t\t"America/Grand_Turk": [\n\t\t\t"-4:44:32 - LMT 1890 -4:44:32",\n\t\t\t"-5:7:12 - KMT 1912_1 -5:7:12",\n\t\t\t"-5 TC E%sT"\n\t\t],\n\t\t"America/Grenada": [\n\t\t\t"-4:7 - LMT 1911_6 -4:7",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Guadeloupe": [\n\t\t\t"-4:6:8 - LMT 1911_5_8 -4:6:8",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Guatemala": [\n\t\t\t"-6:2:4 - LMT 1918_9_5 -6:2:4",\n\t\t\t"-6 Guat C%sT"\n\t\t],\n\t\t"America/Guayaquil": [\n\t\t\t"-5:19:20 - LMT 1890 -5:19:20",\n\t\t\t"-5:14 - QMT 1931 -5:14",\n\t\t\t"-5 - ECT"\n\t\t],\n\t\t"America/Guyana": [\n\t\t\t"-3:52:40 - LMT 1915_2 -3:52:40",\n\t\t\t"-3:45 - GBGT 1966_4_26 -3:45",\n\t\t\t"-3:45 - GYT 1975_6_31 -3:45",\n\t\t\t"-3 - GYT 1991 -3",\n\t\t\t"-4 - GYT"\n\t\t],\n\t\t"America/Halifax": [\n\t\t\t"-4:14:24 - LMT 1902_5_15 -4:14:24",\n\t\t\t"-4 Halifax A%sT 1918 -4",\n\t\t\t"-4 Canada A%sT 1919 -4",\n\t\t\t"-4 Halifax A%sT 1942_1_9_2 -4",\n\t\t\t"-4 Canada A%sT 1946 -4",\n\t\t\t"-4 Halifax A%sT 1974 -4",\n\t\t\t"-4 Canada A%sT"\n\t\t],\n\t\t"America/Havana": [\n\t\t\t"-5:29:28 - LMT 1890 -5:29:28",\n\t\t\t"-5:29:36 - HMT 1925_6_19_12 -5:29:36",\n\t\t\t"-5 Cuba C%sT"\n\t\t],\n\t\t"America/Hermosillo": [\n\t\t\t"-7:23:52 - LMT 1921_11_31_23_36_8 -7:23:52",\n\t\t\t"-7 - MST 1927_5_10_23 -7",\n\t\t\t"-6 - CST 1930_10_15 -6",\n\t\t\t"-7 - MST 1931_4_1_23 -7",\n\t\t\t"-6 - CST 1931_9 -6",\n\t\t\t"-7 - MST 1932_3_1 -7",\n\t\t\t"-6 - CST 1942_3_24 -6",\n\t\t\t"-7 - MST 1949_0_14 -7",\n\t\t\t"-8 - PST 1970 -8",\n\t\t\t"-7 Mexico M%sT 1999 -7",\n\t\t\t"-7 - MST"\n\t\t],\n\t\t"America/Indiana/Indianapolis": [\n\t\t\t"-5:44:38 - LMT 1883_10_18_12_15_22 -5:44:38",\n\t\t\t"-6 US C%sT 1920 -6",\n\t\t\t"-6 Indianapolis C%sT 1942 -6",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 Indianapolis C%sT 1955_3_24_2 -6",\n\t\t\t"-5 - EST 1957_8_29_2 -5",\n\t\t\t"-6 - CST 1958_3_27_2 -6",\n\t\t\t"-5 - EST 1969 -5",\n\t\t\t"-5 US E%sT 1971 -5",\n\t\t\t"-5 - EST 2006 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Indiana/Knox": [\n\t\t\t"-5:46:30 - LMT 1883_10_18_12_13_30 -5:46:30",\n\t\t\t"-6 US C%sT 1947 -6",\n\t\t\t"-6 Starke C%sT 1962_3_29_2 -6",\n\t\t\t"-5 - EST 1963_9_27_2 -5",\n\t\t\t"-6 US C%sT 1991_9_27_2 -5",\n\t\t\t"-5 - EST 2006_3_2_2 -5",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/Indiana/Marengo": [\n\t\t\t"-5:45:23 - LMT 1883_10_18_12_14_37 -5:45:23",\n\t\t\t"-6 US C%sT 1951 -6",\n\t\t\t"-6 Marengo C%sT 1961_3_30_2 -6",\n\t\t\t"-5 - EST 1969 -5",\n\t\t\t"-5 US E%sT 1974_0_6_2 -5",\n\t\t\t"-5 - CDT 1974_9_27_2 -5",\n\t\t\t"-5 US E%sT 1976 -5",\n\t\t\t"-5 - EST 2006 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Indiana/Petersburg": [\n\t\t\t"-5:49:7 - LMT 1883_10_18_12_10_53 -5:49:7",\n\t\t\t"-6 US C%sT 1955 -6",\n\t\t\t"-6 Pike C%sT 1965_3_25_2 -6",\n\t\t\t"-5 - EST 1966_9_30_2 -5",\n\t\t\t"-6 US C%sT 1977_9_30_2 -5",\n\t\t\t"-5 - EST 2006_3_2_2 -5",\n\t\t\t"-6 US C%sT 2007_10_4_2 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Indiana/Tell_City": [\n\t\t\t"-5:47:3 - LMT 1883_10_18_12_12_57 -5:47:3",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 Perry C%sT 1964_3_26_2 -6",\n\t\t\t"-5 - EST 1969 -5",\n\t\t\t"-5 US E%sT 1971 -5",\n\t\t\t"-5 - EST 2006_3_2_2 -5",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/Indiana/Vevay": [\n\t\t\t"-5:40:16 - LMT 1883_10_18_12_19_44 -5:40:16",\n\t\t\t"-6 US C%sT 1954_3_25_2 -6",\n\t\t\t"-5 - EST 1969 -5",\n\t\t\t"-5 US E%sT 1973 -5",\n\t\t\t"-5 - EST 2006 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Indiana/Vincennes": [\n\t\t\t"-5:50:7 - LMT 1883_10_18_12_9_53 -5:50:7",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 Vincennes C%sT 1964_3_26_2 -6",\n\t\t\t"-5 - EST 1969 -5",\n\t\t\t"-5 US E%sT 1971 -5",\n\t\t\t"-5 - EST 2006_3_2_2 -5",\n\t\t\t"-6 US C%sT 2007_10_4_2 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Indiana/Winamac": [\n\t\t\t"-5:46:25 - LMT 1883_10_18_12_13_35 -5:46:25",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 Pulaski C%sT 1961_3_30_2 -6",\n\t\t\t"-5 - EST 1969 -5",\n\t\t\t"-5 US E%sT 1971 -5",\n\t\t\t"-5 - EST 2006_3_2_2 -5",\n\t\t\t"-6 US C%sT 2007_2_11_2 -6",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Inuvik": [\n\t\t\t"0 - zzz 1953",\n\t\t\t"-8 NT_YK P%sT 1979_3_29_2 -8",\n\t\t\t"-7 NT_YK M%sT 1980 -7",\n\t\t\t"-7 Canada M%sT"\n\t\t],\n\t\t"America/Iqaluit": [\n\t\t\t"0 - zzz 1942_7",\n\t\t\t"-5 NT_YK E%sT 1999_9_31_2 -4",\n\t\t\t"-6 Canada C%sT 2000_9_29_2 -5",\n\t\t\t"-5 Canada E%sT"\n\t\t],\n\t\t"America/Jamaica": [\n\t\t\t"-5:7:12 - LMT 1890 -5:7:12",\n\t\t\t"-5:7:12 - KMT 1912_1 -5:7:12",\n\t\t\t"-5 - EST 1974_3_28_2 -5",\n\t\t\t"-5 US E%sT 1984 -5",\n\t\t\t"-5 - EST"\n\t\t],\n\t\t"America/Juneau": [\n\t\t\t"15:2:19 - LMT 1867_9_18 15:2:19",\n\t\t\t"-8:57:41 - LMT 1900_7_20_12 -8:57:41",\n\t\t\t"-8 - PST 1942 -8",\n\t\t\t"-8 US P%sT 1946 -8",\n\t\t\t"-8 - PST 1969 -8",\n\t\t\t"-8 US P%sT 1980_3_27_2 -8",\n\t\t\t"-9 US Y%sT 1980_9_26_2 -8",\n\t\t\t"-8 US P%sT 1983_9_30_2 -7",\n\t\t\t"-9 US Y%sT 1983_10_30 -9",\n\t\t\t"-9 US AK%sT"\n\t\t],\n\t\t"America/Kentucky/Louisville": [\n\t\t\t"-5:43:2 - LMT 1883_10_18_12_16_58 -5:43:2",\n\t\t\t"-6 US C%sT 1921 -6",\n\t\t\t"-6 Louisville C%sT 1942 -6",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 Louisville C%sT 1961_6_23_2 -5",\n\t\t\t"-5 - EST 1968 -5",\n\t\t\t"-5 US E%sT 1974_0_6_2 -5",\n\t\t\t"-5 - CDT 1974_9_27_2 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Kentucky/Monticello": [\n\t\t\t"-5:39:24 - LMT 1883_10_18_12_20_36 -5:39:24",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 - CST 1968 -6",\n\t\t\t"-6 US C%sT 2000_9_29_2 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/La_Paz": [\n\t\t\t"-4:32:36 - LMT 1890 -4:32:36",\n\t\t\t"-4:32:36 - CMT 1931_9_15 -4:32:36",\n\t\t\t"-3:32:36 - BOST 1932_2_21 -3:32:36",\n\t\t\t"-4 - BOT"\n\t\t],\n\t\t"America/Lima": [\n\t\t\t"-5:8:12 - LMT 1890 -5:8:12",\n\t\t\t"-5:8:36 - LMT 1908_6_28 -5:8:36",\n\t\t\t"-5 Peru PE%sT"\n\t\t],\n\t\t"America/Los_Angeles": [\n\t\t\t"-7:52:58 - LMT 1883_10_18_12_7_2 -7:52:58",\n\t\t\t"-8 US P%sT 1946 -8",\n\t\t\t"-8 CA P%sT 1967 -8",\n\t\t\t"-8 US P%sT"\n\t\t],\n\t\t"America/Maceio": [\n\t\t\t"-2:22:52 - LMT 1914 -2:22:52",\n\t\t\t"-3 Brazil BR%sT 1990_8_17 -3",\n\t\t\t"-3 - BRT 1995_9_13 -3",\n\t\t\t"-3 Brazil BR%sT 1996_8_4 -3",\n\t\t\t"-3 - BRT 1999_8_30 -3",\n\t\t\t"-3 Brazil BR%sT 2000_9_22 -2",\n\t\t\t"-3 - BRT 2001_8_13 -3",\n\t\t\t"-3 Brazil BR%sT 2002_9_1 -3",\n\t\t\t"-3 - BRT"\n\t\t],\n\t\t"America/Managua": [\n\t\t\t"-5:45:8 - LMT 1890 -5:45:8",\n\t\t\t"-5:45:12 - MMT 1934_5_23 -5:45:12",\n\t\t\t"-6 - CST 1973_4 -6",\n\t\t\t"-5 - EST 1975_1_16 -5",\n\t\t\t"-6 Nic C%sT 1992_0_1_4 -6",\n\t\t\t"-5 - EST 1992_8_24 -5",\n\t\t\t"-6 - CST 1993 -6",\n\t\t\t"-5 - EST 1997 -5",\n\t\t\t"-6 Nic C%sT"\n\t\t],\n\t\t"America/Manaus": [\n\t\t\t"-4:0:4 - LMT 1914 -4:0:4",\n\t\t\t"-4 Brazil AM%sT 1988_8_12 -4",\n\t\t\t"-4 - AMT 1993_8_28 -4",\n\t\t\t"-4 Brazil AM%sT 1994_8_22 -4",\n\t\t\t"-4 - AMT"\n\t\t],\n\t\t"America/Martinique": [\n\t\t\t"-4:4:20 - LMT 1890 -4:4:20",\n\t\t\t"-4:4:20 - FFMT 1911_4 -4:4:20",\n\t\t\t"-4 - AST 1980_3_6 -4",\n\t\t\t"-3 - ADT 1980_8_28 -3",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Matamoros": [\n\t\t\t"-6:40 - LMT 1921_11_31_23_20 -6:40",\n\t\t\t"-6 - CST 1988 -6",\n\t\t\t"-6 US C%sT 1989 -6",\n\t\t\t"-6 Mexico C%sT 2010 -6",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/Mazatlan": [\n\t\t\t"-7:5:40 - LMT 1921_11_31_23_54_20 -7:5:40",\n\t\t\t"-7 - MST 1927_5_10_23 -7",\n\t\t\t"-6 - CST 1930_10_15 -6",\n\t\t\t"-7 - MST 1931_4_1_23 -7",\n\t\t\t"-6 - CST 1931_9 -6",\n\t\t\t"-7 - MST 1932_3_1 -7",\n\t\t\t"-6 - CST 1942_3_24 -6",\n\t\t\t"-7 - MST 1949_0_14 -7",\n\t\t\t"-8 - PST 1970 -8",\n\t\t\t"-7 Mexico M%sT"\n\t\t],\n\t\t"America/Menominee": [\n\t\t\t"-5:50:27 - LMT 1885_8_18_12 -5:50:27",\n\t\t\t"-6 US C%sT 1946 -6",\n\t\t\t"-6 Menominee C%sT 1969_3_27_2 -6",\n\t\t\t"-5 - EST 1973_3_29_2 -5",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/Merida": [\n\t\t\t"-5:58:28 - LMT 1922_0_1_0_1_32 -5:58:28",\n\t\t\t"-6 - CST 1981_11_23 -6",\n\t\t\t"-5 - EST 1982_11_2 -5",\n\t\t\t"-6 Mexico C%sT"\n\t\t],\n\t\t"America/Metlakatla": [\n\t\t\t"15:13:42 - LMT 1867_9_18 15:13:42",\n\t\t\t"-8:46:18 - LMT 1900_7_20_12 -8:46:18",\n\t\t\t"-8 - PST 1942 -8",\n\t\t\t"-8 US P%sT 1946 -8",\n\t\t\t"-8 - PST 1969 -8",\n\t\t\t"-8 US P%sT 1983_9_30_2 -7",\n\t\t\t"-8 - MeST"\n\t\t],\n\t\t"America/Mexico_City": [\n\t\t\t"-6:36:36 - LMT 1922_0_1_0_23_24 -6:36:36",\n\t\t\t"-7 - MST 1927_5_10_23 -7",\n\t\t\t"-6 - CST 1930_10_15 -6",\n\t\t\t"-7 - MST 1931_4_1_23 -7",\n\t\t\t"-6 - CST 1931_9 -6",\n\t\t\t"-7 - MST 1932_3_1 -7",\n\t\t\t"-6 Mexico C%sT 2001_8_30_02 -5",\n\t\t\t"-6 - CST 2002_1_20 -6",\n\t\t\t"-6 Mexico C%sT"\n\t\t],\n\t\t"America/Miquelon": [\n\t\t\t"-3:44:40 - LMT 1911_4_15 -3:44:40",\n\t\t\t"-4 - AST 1980_4 -4",\n\t\t\t"-3 - PMST 1987 -3",\n\t\t\t"-3 Canada PM%sT"\n\t\t],\n\t\t"America/Moncton": [\n\t\t\t"-4:19:8 - LMT 1883_11_9 -4:19:8",\n\t\t\t"-5 - EST 1902_5_15 -5",\n\t\t\t"-4 Canada A%sT 1933 -4",\n\t\t\t"-4 Moncton A%sT 1942 -4",\n\t\t\t"-4 Canada A%sT 1946 -4",\n\t\t\t"-4 Moncton A%sT 1973 -4",\n\t\t\t"-4 Canada A%sT 1993 -4",\n\t\t\t"-4 Moncton A%sT 2007 -4",\n\t\t\t"-4 Canada A%sT"\n\t\t],\n\t\t"America/Monterrey": [\n\t\t\t"-6:41:16 - LMT 1921_11_31_23_18_44 -6:41:16",\n\t\t\t"-6 - CST 1988 -6",\n\t\t\t"-6 US C%sT 1989 -6",\n\t\t\t"-6 Mexico C%sT"\n\t\t],\n\t\t"America/Montevideo": [\n\t\t\t"-3:44:44 - LMT 1898_5_28 -3:44:44",\n\t\t\t"-3:44:44 - MMT 1920_4_1 -3:44:44",\n\t\t\t"-3:30 Uruguay UY%sT 1942_11_14 -3:30",\n\t\t\t"-3 Uruguay UY%sT"\n\t\t],\n\t\t"America/Montreal": [\n\t\t\t"-4:54:16 - LMT 1884 -4:54:16",\n\t\t\t"-5 Mont E%sT 1918 -5",\n\t\t\t"-5 Canada E%sT 1919 -5",\n\t\t\t"-5 Mont E%sT 1942_1_9_2 -5",\n\t\t\t"-5 Canada E%sT 1946 -5",\n\t\t\t"-5 Mont E%sT 1974 -5",\n\t\t\t"-5 Canada E%sT"\n\t\t],\n\t\t"America/Montserrat": [\n\t\t\t"-4:8:52 - LMT 1911_6_1_0_1 -4:8:52",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Nassau": [\n\t\t\t"-5:9:30 - LMT 1912_2_2 -5:9:30",\n\t\t\t"-5 Bahamas E%sT 1976 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/New_York": [\n\t\t\t"-4:56:2 - LMT 1883_10_18_12_3_58 -4:56:2",\n\t\t\t"-5 US E%sT 1920 -5",\n\t\t\t"-5 NYC E%sT 1942 -5",\n\t\t\t"-5 US E%sT 1946 -5",\n\t\t\t"-5 NYC E%sT 1967 -5",\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"America/Nipigon": [\n\t\t\t"-5:53:4 - LMT 1895 -5:53:4",\n\t\t\t"-5 Canada E%sT 1940_8_29 -5",\n\t\t\t"-4 - EDT 1942_1_9_2 -5",\n\t\t\t"-5 Canada E%sT"\n\t\t],\n\t\t"America/Nome": [\n\t\t\t"12:58:21 - LMT 1867_9_18 12:58:21",\n\t\t\t"-11:1:38 - LMT 1900_7_20_12 -11:1:38",\n\t\t\t"-11 - NST 1942 -11",\n\t\t\t"-11 US N%sT 1946 -11",\n\t\t\t"-11 - NST 1967_3 -11",\n\t\t\t"-11 - BST 1969 -11",\n\t\t\t"-11 US B%sT 1983_9_30_2 -10",\n\t\t\t"-9 US Y%sT 1983_10_30 -9",\n\t\t\t"-9 US AK%sT"\n\t\t],\n\t\t"America/Noronha": [\n\t\t\t"-2:9:40 - LMT 1914 -2:9:40",\n\t\t\t"-2 Brazil FN%sT 1990_8_17 -2",\n\t\t\t"-2 - FNT 1999_8_30 -2",\n\t\t\t"-2 Brazil FN%sT 2000_9_15 -1",\n\t\t\t"-2 - FNT 2001_8_13 -2",\n\t\t\t"-2 Brazil FN%sT 2002_9_1 -2",\n\t\t\t"-2 - FNT"\n\t\t],\n\t\t"America/North_Dakota/Beulah": [\n\t\t\t"-6:47:7 - LMT 1883_10_18_12_12_53 -6:47:7",\n\t\t\t"-7 US M%sT 2010_10_7_2 -6",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/North_Dakota/Center": [\n\t\t\t"-6:45:12 - LMT 1883_10_18_12_14_48 -6:45:12",\n\t\t\t"-7 US M%sT 1992_9_25_02 -6",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/North_Dakota/New_Salem": [\n\t\t\t"-6:45:39 - LMT 1883_10_18_12_14_21 -6:45:39",\n\t\t\t"-7 US M%sT 2003_9_26_02 -6",\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"America/Ojinaga": [\n\t\t\t"-6:57:40 - LMT 1922_0_1_0_2_20 -6:57:40",\n\t\t\t"-7 - MST 1927_5_10_23 -7",\n\t\t\t"-6 - CST 1930_10_15 -6",\n\t\t\t"-7 - MST 1931_4_1_23 -7",\n\t\t\t"-6 - CST 1931_9 -6",\n\t\t\t"-7 - MST 1932_3_1 -7",\n\t\t\t"-6 - CST 1996 -6",\n\t\t\t"-6 Mexico C%sT 1998 -6",\n\t\t\t"-6 - CST 1998_3_5_3 -6",\n\t\t\t"-7 Mexico M%sT 2010 -7",\n\t\t\t"-7 US M%sT"\n\t\t],\n\t\t"America/Panama": [\n\t\t\t"-5:18:8 - LMT 1890 -5:18:8",\n\t\t\t"-5:19:36 - CMT 1908_3_22 -5:19:36",\n\t\t\t"-5 - EST"\n\t\t],\n\t\t"America/Pangnirtung": [\n\t\t\t"0 - zzz 1921",\n\t\t\t"-4 NT_YK A%sT 1995_3_2_2 -4",\n\t\t\t"-5 Canada E%sT 1999_9_31_2 -4",\n\t\t\t"-6 Canada C%sT 2000_9_29_2 -5",\n\t\t\t"-5 Canada E%sT"\n\t\t],\n\t\t"America/Paramaribo": [\n\t\t\t"-3:40:40 - LMT 1911 -3:40:40",\n\t\t\t"-3:40:52 - PMT 1935 -3:40:52",\n\t\t\t"-3:40:36 - PMT 1945_9 -3:40:36",\n\t\t\t"-3:30 - NEGT 1975_10_20 -3:30",\n\t\t\t"-3:30 - SRT 1984_9 -3:30",\n\t\t\t"-3 - SRT"\n\t\t],\n\t\t"America/Phoenix": [\n\t\t\t"-7:28:18 - LMT 1883_10_18_11_31_42 -7:28:18",\n\t\t\t"-7 US M%sT 1944_0_1_00_1 -6",\n\t\t\t"-7 - MST 1944_3_1_00_1 -7",\n\t\t\t"-7 US M%sT 1944_9_1_00_1 -6",\n\t\t\t"-7 - MST 1967 -7",\n\t\t\t"-7 US M%sT 1968_2_21 -7",\n\t\t\t"-7 - MST"\n\t\t],\n\t\t"America/Port-au-Prince": [\n\t\t\t"-4:49:20 - LMT 1890 -4:49:20",\n\t\t\t"-4:49 - PPMT 1917_0_24_12 -4:49",\n\t\t\t"-5 Haiti E%sT"\n\t\t],\n\t\t"America/Port_of_Spain": [\n\t\t\t"-4:6:4 - LMT 1912_2_2 -4:6:4",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Porto_Velho": [\n\t\t\t"-4:15:36 - LMT 1914 -4:15:36",\n\t\t\t"-4 Brazil AM%sT 1988_8_12 -4",\n\t\t\t"-4 - AMT"\n\t\t],\n\t\t"America/Puerto_Rico": [\n\t\t\t"-4:24:25 - LMT 1899_2_28_12 -4:24:25",\n\t\t\t"-4 - AST 1942_4_3 -4",\n\t\t\t"-4 US A%sT 1946 -4",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Rainy_River": [\n\t\t\t"-6:18:16 - LMT 1895 -6:18:16",\n\t\t\t"-6 Canada C%sT 1940_8_29 -6",\n\t\t\t"-5 - CDT 1942_1_9_2 -6",\n\t\t\t"-6 Canada C%sT"\n\t\t],\n\t\t"America/Rankin_Inlet": [\n\t\t\t"0 - zzz 1957",\n\t\t\t"-6 NT_YK C%sT 2000_9_29_2 -5",\n\t\t\t"-5 - EST 2001_3_1_3 -5",\n\t\t\t"-6 Canada C%sT"\n\t\t],\n\t\t"America/Recife": [\n\t\t\t"-2:19:36 - LMT 1914 -2:19:36",\n\t\t\t"-3 Brazil BR%sT 1990_8_17 -3",\n\t\t\t"-3 - BRT 1999_8_30 -3",\n\t\t\t"-3 Brazil BR%sT 2000_9_15 -2",\n\t\t\t"-3 - BRT 2001_8_13 -3",\n\t\t\t"-3 Brazil BR%sT 2002_9_1 -3",\n\t\t\t"-3 - BRT"\n\t\t],\n\t\t"America/Regina": [\n\t\t\t"-6:58:36 - LMT 1905_8 -6:58:36",\n\t\t\t"-7 Regina M%sT 1960_3_24_2 -7",\n\t\t\t"-6 - CST"\n\t\t],\n\t\t"America/Resolute": [\n\t\t\t"0 - zzz 1947_7_31",\n\t\t\t"-6 NT_YK C%sT 2000_9_29_2 -5",\n\t\t\t"-5 - EST 2001_3_1_3 -5",\n\t\t\t"-6 Canada C%sT 2006_9_29_2 -5",\n\t\t\t"-5 - EST 2007_2_11_3 -5",\n\t\t\t"-6 Canada C%sT"\n\t\t],\n\t\t"America/Rio_Branco": [\n\t\t\t"-4:31:12 - LMT 1914 -4:31:12",\n\t\t\t"-5 Brazil AC%sT 1988_8_12 -5",\n\t\t\t"-5 - ACT 2008_5_24_00 -5",\n\t\t\t"-4 - AMT"\n\t\t],\n\t\t"America/Santa_Isabel": [\n\t\t\t"-7:39:28 - LMT 1922_0_1_0_20_32 -7:39:28",\n\t\t\t"-7 - MST 1924 -7",\n\t\t\t"-8 - PST 1927_5_10_23 -8",\n\t\t\t"-7 - MST 1930_10_15 -7",\n\t\t\t"-8 - PST 1931_3_1 -8",\n\t\t\t"-7 - PDT 1931_8_30 -7",\n\t\t\t"-8 - PST 1942_3_24 -8",\n\t\t\t"-7 - PWT 1945_7_14_23",\n\t\t\t"-7 - PPT 1945_10_12 -7",\n\t\t\t"-8 - PST 1948_3_5 -8",\n\t\t\t"-7 - PDT 1949_0_14 -7",\n\t\t\t"-8 - PST 1954 -8",\n\t\t\t"-8 CA P%sT 1961 -8",\n\t\t\t"-8 - PST 1976 -8",\n\t\t\t"-8 US P%sT 1996 -8",\n\t\t\t"-8 Mexico P%sT 2001 -8",\n\t\t\t"-8 US P%sT 2002_1_20 -8",\n\t\t\t"-8 Mexico P%sT"\n\t\t],\n\t\t"America/Santarem": [\n\t\t\t"-3:38:48 - LMT 1914 -3:38:48",\n\t\t\t"-4 Brazil AM%sT 1988_8_12 -4",\n\t\t\t"-4 - AMT 2008_5_24_00 -4",\n\t\t\t"-3 - BRT"\n\t\t],\n\t\t"America/Santiago": [\n\t\t\t"-4:42:46 - LMT 1890 -4:42:46",\n\t\t\t"-4:42:46 - SMT 1910 -4:42:46",\n\t\t\t"-5 - CLT 1916_6_1 -5",\n\t\t\t"-4:42:46 - SMT 1918_8_1 -4:42:46",\n\t\t\t"-4 - CLT 1919_6_1 -4",\n\t\t\t"-4:42:46 - SMT 1927_8_1 -4:42:46",\n\t\t\t"-5 Chile CL%sT 1947_4_22 -5",\n\t\t\t"-4 Chile CL%sT"\n\t\t],\n\t\t"America/Santo_Domingo": [\n\t\t\t"-4:39:36 - LMT 1890 -4:39:36",\n\t\t\t"-4:40 - SDMT 1933_3_1_12 -4:40",\n\t\t\t"-5 DR E%sT 1974_9_27 -5",\n\t\t\t"-4 - AST 2000_9_29_02 -4",\n\t\t\t"-5 US E%sT 2000_11_3_01 -5",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Sao_Paulo": [\n\t\t\t"-3:6:28 - LMT 1914 -3:6:28",\n\t\t\t"-3 Brazil BR%sT 1963_9_23_00 -3",\n\t\t\t"-2 - BRST 1964 -2",\n\t\t\t"-3 Brazil BR%sT"\n\t\t],\n\t\t"America/Scoresbysund": [\n\t\t\t"-1:27:52 - LMT 1916_6_28 -1:27:52",\n\t\t\t"-2 - CGT 1980_3_6_2 -2",\n\t\t\t"-2 C-Eur CG%sT 1981_2_29 -2",\n\t\t\t"-1 EU EG%sT"\n\t\t],\n\t\t"America/Sitka": [\n\t\t\t"14:58:47 - LMT 1867_9_18 14:58:47",\n\t\t\t"-9:1:13 - LMT 1900_7_20_12 -9:1:13",\n\t\t\t"-8 - PST 1942 -8",\n\t\t\t"-8 US P%sT 1946 -8",\n\t\t\t"-8 - PST 1969 -8",\n\t\t\t"-8 US P%sT 1983_9_30_2 -7",\n\t\t\t"-9 US Y%sT 1983_10_30 -9",\n\t\t\t"-9 US AK%sT"\n\t\t],\n\t\t"America/St_Johns": [\n\t\t\t"-3:30:52 - LMT 1884 -3:30:52",\n\t\t\t"-3:30:52 StJohns N%sT 1918 -3:30:52",\n\t\t\t"-3:30:52 Canada N%sT 1919 -3:30:52",\n\t\t\t"-3:30:52 StJohns N%sT 1935_2_30 -3:30:52",\n\t\t\t"-3:30 StJohns N%sT 1942_4_11 -3:30",\n\t\t\t"-3:30 Canada N%sT 1946 -3:30",\n\t\t\t"-3:30 StJohns N%sT 2011_10 -2:30",\n\t\t\t"-3:30 Canada N%sT"\n\t\t],\n\t\t"America/St_Kitts": [\n\t\t\t"-4:10:52 - LMT 1912_2_2 -4:10:52",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/St_Lucia": [\n\t\t\t"-4:4 - LMT 1890 -4:4",\n\t\t\t"-4:4 - CMT 1912 -4:4",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/St_Thomas": [\n\t\t\t"-4:19:44 - LMT 1911_6 -4:19:44",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/St_Vincent": [\n\t\t\t"-4:4:56 - LMT 1890 -4:4:56",\n\t\t\t"-4:4:56 - KMT 1912 -4:4:56",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Swift_Current": [\n\t\t\t"-7:11:20 - LMT 1905_8 -7:11:20",\n\t\t\t"-7 Canada M%sT 1946_3_28_2 -7",\n\t\t\t"-7 Regina M%sT 1950 -7",\n\t\t\t"-7 Swift M%sT 1972_3_30_2 -7",\n\t\t\t"-6 - CST"\n\t\t],\n\t\t"America/Tegucigalpa": [\n\t\t\t"-5:48:52 - LMT 1921_3 -5:48:52",\n\t\t\t"-6 Hond C%sT"\n\t\t],\n\t\t"America/Thule": [\n\t\t\t"-4:35:8 - LMT 1916_6_28 -4:35:8",\n\t\t\t"-4 Thule A%sT"\n\t\t],\n\t\t"America/Thunder_Bay": [\n\t\t\t"-5:57 - LMT 1895 -5:57",\n\t\t\t"-6 - CST 1910 -6",\n\t\t\t"-5 - EST 1942 -5",\n\t\t\t"-5 Canada E%sT 1970 -5",\n\t\t\t"-5 Mont E%sT 1973 -5",\n\t\t\t"-5 - EST 1974 -5",\n\t\t\t"-5 Canada E%sT"\n\t\t],\n\t\t"America/Tijuana": [\n\t\t\t"-7:48:4 - LMT 1922_0_1_0_11_56 -7:48:4",\n\t\t\t"-7 - MST 1924 -7",\n\t\t\t"-8 - PST 1927_5_10_23 -8",\n\t\t\t"-7 - MST 1930_10_15 -7",\n\t\t\t"-8 - PST 1931_3_1 -8",\n\t\t\t"-7 - PDT 1931_8_30 -7",\n\t\t\t"-8 - PST 1942_3_24 -8",\n\t\t\t"-7 - PWT 1945_7_14_23",\n\t\t\t"-7 - PPT 1945_10_12 -7",\n\t\t\t"-8 - PST 1948_3_5 -8",\n\t\t\t"-7 - PDT 1949_0_14 -7",\n\t\t\t"-8 - PST 1954 -8",\n\t\t\t"-8 CA P%sT 1961 -8",\n\t\t\t"-8 - PST 1976 -8",\n\t\t\t"-8 US P%sT 1996 -8",\n\t\t\t"-8 Mexico P%sT 2001 -8",\n\t\t\t"-8 US P%sT 2002_1_20 -8",\n\t\t\t"-8 Mexico P%sT 2010 -8",\n\t\t\t"-8 US P%sT"\n\t\t],\n\t\t"America/Toronto": [\n\t\t\t"-5:17:32 - LMT 1895 -5:17:32",\n\t\t\t"-5 Canada E%sT 1919 -5",\n\t\t\t"-5 Toronto E%sT 1942_1_9_2 -5",\n\t\t\t"-5 Canada E%sT 1946 -5",\n\t\t\t"-5 Toronto E%sT 1974 -5",\n\t\t\t"-5 Canada E%sT"\n\t\t],\n\t\t"America/Tortola": [\n\t\t\t"-4:18:28 - LMT 1911_6 -4:18:28",\n\t\t\t"-4 - AST"\n\t\t],\n\t\t"America/Vancouver": [\n\t\t\t"-8:12:28 - LMT 1884 -8:12:28",\n\t\t\t"-8 Vanc P%sT 1987 -8",\n\t\t\t"-8 Canada P%sT"\n\t\t],\n\t\t"America/Whitehorse": [\n\t\t\t"-9:0:12 - LMT 1900_7_20 -9:0:12",\n\t\t\t"-9 NT_YK Y%sT 1966_6_1_2 -9",\n\t\t\t"-8 NT_YK P%sT 1980 -8",\n\t\t\t"-8 Canada P%sT"\n\t\t],\n\t\t"America/Winnipeg": [\n\t\t\t"-6:28:36 - LMT 1887_6_16 -6:28:36",\n\t\t\t"-6 Winn C%sT 2006 -6",\n\t\t\t"-6 Canada C%sT"\n\t\t],\n\t\t"America/Yakutat": [\n\t\t\t"14:41:5 - LMT 1867_9_18 14:41:5",\n\t\t\t"-9:18:55 - LMT 1900_7_20_12 -9:18:55",\n\t\t\t"-9 - YST 1942 -9",\n\t\t\t"-9 US Y%sT 1946 -9",\n\t\t\t"-9 - YST 1969 -9",\n\t\t\t"-9 US Y%sT 1983_10_30 -9",\n\t\t\t"-9 US AK%sT"\n\t\t],\n\t\t"America/Yellowknife": [\n\t\t\t"0 - zzz 1935",\n\t\t\t"-7 NT_YK M%sT 1980 -7",\n\t\t\t"-7 Canada M%sT"\n\t\t],\n\t\t"Antarctica/Casey": [\n\t\t\t"0 - zzz 1969",\n\t\t\t"8 - WST 2009_9_18_2 8",\n\t\t\t"11 - CAST 2010_2_5_2 11",\n\t\t\t"8 - WST 2011_9_28_2 8",\n\t\t\t"11 - CAST 2012_1_21_17",\n\t\t\t"8 - WST"\n\t\t],\n\t\t"Antarctica/Davis": [\n\t\t\t"0 - zzz 1957_0_13",\n\t\t\t"7 - DAVT 1964_10 7",\n\t\t\t"0 - zzz 1969_1",\n\t\t\t"7 - DAVT 2009_9_18_2 7",\n\t\t\t"5 - DAVT 2010_2_10_20",\n\t\t\t"7 - DAVT 2011_9_28_2 7",\n\t\t\t"5 - DAVT 2012_1_21_20",\n\t\t\t"7 - DAVT"\n\t\t],\n\t\t"Antarctica/DumontDUrville": [\n\t\t\t"0 - zzz 1947",\n\t\t\t"10 - PMT 1952_0_14 10",\n\t\t\t"0 - zzz 1956_10",\n\t\t\t"10 - DDUT"\n\t\t],\n\t\t"Antarctica/Macquarie": [\n\t\t\t"0 - zzz 1899_10",\n\t\t\t"10 - EST 1916_9_1_2 10",\n\t\t\t"11 - EST 1917_1 11",\n\t\t\t"10 Aus EST 1919_3 10",\n\t\t\t"0 - zzz 1948_2_25",\n\t\t\t"10 Aus EST 1967 10",\n\t\t\t"10 AT EST 2010_3_4_3 11",\n\t\t\t"11 - MIST"\n\t\t],\n\t\t"Antarctica/Mawson": [\n\t\t\t"0 - zzz 1954_1_13",\n\t\t\t"6 - MAWT 2009_9_18_2 6",\n\t\t\t"5 - MAWT"\n\t\t],\n\t\t"Antarctica/McMurdo": [\n\t\t\t"0 - zzz 1956",\n\t\t\t"12 NZAQ NZ%sT"\n\t\t],\n\t\t"Antarctica/Palmer": [\n\t\t\t"0 - zzz 1965",\n\t\t\t"-4 ArgAQ AR%sT 1969_9_5 -4",\n\t\t\t"-3 ArgAQ AR%sT 1982_4 -3",\n\t\t\t"-4 ChileAQ CL%sT"\n\t\t],\n\t\t"Antarctica/Rothera": [\n\t\t\t"0 - zzz 1976_11_1",\n\t\t\t"-3 - ROTT"\n\t\t],\n\t\t"Antarctica/Syowa": [\n\t\t\t"0 - zzz 1957_0_29",\n\t\t\t"3 - SYOT"\n\t\t],\n\t\t"Antarctica/Vostok": [\n\t\t\t"0 - zzz 1957_11_16",\n\t\t\t"6 - VOST"\n\t\t],\n\t\t"Asia/Aden": [\n\t\t\t"2:59:54 - LMT 1950 2:59:54",\n\t\t\t"3 - AST"\n\t\t],\n\t\t"Asia/Almaty": [\n\t\t\t"5:7:48 - LMT 1924_4_2 5:7:48",\n\t\t\t"5 - ALMT 1930_5_21 5",\n\t\t\t"6 RussiaAsia ALM%sT 1991 6",\n\t\t\t"6 - ALMT 1992 6",\n\t\t\t"6 RussiaAsia ALM%sT 2005_2_15 6",\n\t\t\t"6 - ALMT"\n\t\t],\n\t\t"Asia/Amman": [\n\t\t\t"2:23:44 - LMT 1931 2:23:44",\n\t\t\t"2 Jordan EE%sT"\n\t\t],\n\t\t"Asia/Anadyr": [\n\t\t\t"11:49:56 - LMT 1924_4_2 11:49:56",\n\t\t\t"12 - ANAT 1930_5_21 12",\n\t\t\t"13 Russia ANA%sT 1982_3_1_0 13",\n\t\t\t"12 Russia ANA%sT 1991_2_31_2 12",\n\t\t\t"11 Russia ANA%sT 1992_0_19_2 11",\n\t\t\t"12 Russia ANA%sT 2010_2_28_2 12",\n\t\t\t"11 Russia ANA%sT 2011_2_27_2 11",\n\t\t\t"12 - ANAT"\n\t\t],\n\t\t"Asia/Aqtau": [\n\t\t\t"3:21:4 - LMT 1924_4_2 3:21:4",\n\t\t\t"4 - FORT 1930_5_21 4",\n\t\t\t"5 - FORT 1963 5",\n\t\t\t"5 - SHET 1981_9_1 5",\n\t\t\t"6 - SHET 1982_3_1 6",\n\t\t\t"5 RussiaAsia SHE%sT 1991 5",\n\t\t\t"5 - SHET 1991_11_16 5",\n\t\t\t"5 RussiaAsia AQT%sT 1995_2_26_2 5",\n\t\t\t"4 RussiaAsia AQT%sT 2005_2_15 4",\n\t\t\t"5 - AQTT"\n\t\t],\n\t\t"Asia/Aqtobe": [\n\t\t\t"3:48:40 - LMT 1924_4_2 3:48:40",\n\t\t\t"4 - AKTT 1930_5_21 4",\n\t\t\t"5 - AKTT 1981_3_1 5",\n\t\t\t"6 - AKTST 1981_9_1 6",\n\t\t\t"6 - AKTT 1982_3_1 6",\n\t\t\t"5 RussiaAsia AKT%sT 1991 5",\n\t\t\t"5 - AKTT 1991_11_16 5",\n\t\t\t"5 RussiaAsia AQT%sT 2005_2_15 5",\n\t\t\t"5 - AQTT"\n\t\t],\n\t\t"Asia/Ashgabat": [\n\t\t\t"3:53:32 - LMT 1924_4_2 3:53:32",\n\t\t\t"4 - ASHT 1930_5_21 4",\n\t\t\t"5 RussiaAsia ASH%sT 1991_2_31_2 5",\n\t\t\t"4 RussiaAsia ASH%sT 1991_9_27 4",\n\t\t\t"4 RussiaAsia TM%sT 1992_0_19_2 4",\n\t\t\t"5 - TMT"\n\t\t],\n\t\t"Asia/Baghdad": [\n\t\t\t"2:57:40 - LMT 1890 2:57:40",\n\t\t\t"2:57:36 - BMT 1918 2:57:36",\n\t\t\t"3 - AST 1982_4 3",\n\t\t\t"3 Iraq A%sT"\n\t\t],\n\t\t"Asia/Bahrain": [\n\t\t\t"3:22:20 - LMT 1920 3:22:20",\n\t\t\t"4 - GST 1972_5 4",\n\t\t\t"3 - AST"\n\t\t],\n\t\t"Asia/Baku": [\n\t\t\t"3:19:24 - LMT 1924_4_2 3:19:24",\n\t\t\t"3 - BAKT 1957_2 3",\n\t\t\t"4 RussiaAsia BAK%sT 1991_2_31_2 4",\n\t\t\t"4 - BAKST 1991_7_30 4",\n\t\t\t"3 RussiaAsia AZ%sT 1992_8_26_23 4",\n\t\t\t"4 - AZT 1996 4",\n\t\t\t"4 EUAsia AZ%sT 1997 4",\n\t\t\t"4 Azer AZ%sT"\n\t\t],\n\t\t"Asia/Bangkok": [\n\t\t\t"6:42:4 - LMT 1880 6:42:4",\n\t\t\t"6:42:4 - BMT 1920_3 6:42:4",\n\t\t\t"7 - ICT"\n\t\t],\n\t\t"Asia/Beirut": [\n\t\t\t"2:22 - LMT 1880 2:22",\n\t\t\t"2 Lebanon EE%sT"\n\t\t],\n\t\t"Asia/Bishkek": [\n\t\t\t"4:58:24 - LMT 1924_4_2 4:58:24",\n\t\t\t"5 - FRUT 1930_5_21 5",\n\t\t\t"6 RussiaAsia FRU%sT 1991_2_31_2 6",\n\t\t\t"6 - FRUST 1991_7_31_2 6",\n\t\t\t"5 Kyrgyz KG%sT 2005_7_12 6",\n\t\t\t"6 - KGT"\n\t\t],\n\t\t"Asia/Brunei": [\n\t\t\t"7:39:40 - LMT 1926_2 7:39:40",\n\t\t\t"7:30 - BNT 1933 7:30",\n\t\t\t"8 - BNT"\n\t\t],\n\t\t"Asia/Choibalsan": [\n\t\t\t"7:38 - LMT 1905_7 7:38",\n\t\t\t"7 - ULAT 1978 7",\n\t\t\t"8 - ULAT 1983_3 8",\n\t\t\t"9 Mongol CHO%sT 2008_2_31 9",\n\t\t\t"8 Mongol CHO%sT"\n\t\t],\n\t\t"Asia/Chongqing": [\n\t\t\t"7:6:20 - LMT 1928 7:6:20",\n\t\t\t"7 - LONT 1980_4 7",\n\t\t\t"8 PRC C%sT"\n\t\t],\n\t\t"Asia/Colombo": [\n\t\t\t"5:19:24 - LMT 1880 5:19:24",\n\t\t\t"5:19:32 - MMT 1906 5:19:32",\n\t\t\t"5:30 - IST 1942_0_5 5:30",\n\t\t\t"6 - IHST 1942_8 6",\n\t\t\t"6:30 - IST 1945_9_16_2 6:30",\n\t\t\t"5:30 - IST 1996_4_25_0 5:30",\n\t\t\t"6:30 - LKT 1996_9_26_0_30 6:30",\n\t\t\t"6 - LKT 2006_3_15_0_30 6",\n\t\t\t"5:30 - IST"\n\t\t],\n\t\t"Asia/Damascus": [\n\t\t\t"2:25:12 - LMT 1920 2:25:12",\n\t\t\t"2 Syria EE%sT"\n\t\t],\n\t\t"Asia/Dhaka": [\n\t\t\t"6:1:40 - LMT 1890 6:1:40",\n\t\t\t"5:53:20 - HMT 1941_9 5:53:20",\n\t\t\t"6:30 - BURT 1942_4_15 6:30",\n\t\t\t"5:30 - IST 1942_8 5:30",\n\t\t\t"6:30 - BURT 1951_8_30 6:30",\n\t\t\t"6 - DACT 1971_2_26 6",\n\t\t\t"6 - BDT 2009 6",\n\t\t\t"6 Dhaka BD%sT"\n\t\t],\n\t\t"Asia/Dili": [\n\t\t\t"8:22:20 - LMT 1912 8:22:20",\n\t\t\t"8 - TLT 1942_1_21_23 8",\n\t\t\t"9 - JST 1945_8_23 9",\n\t\t\t"9 - TLT 1976_4_3 9",\n\t\t\t"8 - CIT 2000_8_17_00 8",\n\t\t\t"9 - TLT"\n\t\t],\n\t\t"Asia/Dubai": [\n\t\t\t"3:41:12 - LMT 1920 3:41:12",\n\t\t\t"4 - GST"\n\t\t],\n\t\t"Asia/Dushanbe": [\n\t\t\t"4:35:12 - LMT 1924_4_2 4:35:12",\n\t\t\t"5 - DUST 1930_5_21 5",\n\t\t\t"6 RussiaAsia DUS%sT 1991_2_31_2 6",\n\t\t\t"6 - DUSST 1991_8_9_2 5",\n\t\t\t"5 - TJT"\n\t\t],\n\t\t"Asia/Gaza": [\n\t\t\t"2:17:52 - LMT 1900_9 2:17:52",\n\t\t\t"2 Zion EET 1948_4_15 2",\n\t\t\t"2 EgyptAsia EE%sT 1967_5_5 3",\n\t\t\t"2 Zion I%sT 1996 2",\n\t\t\t"2 Jordan EE%sT 1999 2",\n\t\t\t"2 Palestine EE%sT 2008_7_29_0 3",\n\t\t\t"2 - EET 2008_8 2",\n\t\t\t"2 Palestine EE%sT 2010 2",\n\t\t\t"2 - EET 2010_2_27_0_1 2",\n\t\t\t"2 Palestine EE%sT 2011_7_1 3",\n\t\t\t"2 - EET 2012 2",\n\t\t\t"2 Palestine EE%sT"\n\t\t],\n\t\t"Asia/Harbin": [\n\t\t\t"8:26:44 - LMT 1928 8:26:44",\n\t\t\t"8:30 - CHAT 1932_2 8:30",\n\t\t\t"8 - CST 1940 8",\n\t\t\t"9 - CHAT 1966_4 9",\n\t\t\t"8:30 - CHAT 1980_4 8:30",\n\t\t\t"8 PRC C%sT"\n\t\t],\n\t\t"Asia/Hebron": [\n\t\t\t"2:20:23 - LMT 1900_9 2:20:23",\n\t\t\t"2 Zion EET 1948_4_15 2",\n\t\t\t"2 EgyptAsia EE%sT 1967_5_5 3",\n\t\t\t"2 Zion I%sT 1996 2",\n\t\t\t"2 Jordan EE%sT 1999 2",\n\t\t\t"2 Palestine EE%sT"\n\t\t],\n\t\t"Asia/Ho_Chi_Minh": [\n\t\t\t"7:6:40 - LMT 1906_5_9 7:6:40",\n\t\t\t"7:6:20 - SMT 1911_2_11_0_1 7:6:20",\n\t\t\t"7 - ICT 1912_4 7",\n\t\t\t"8 - ICT 1931_4 8",\n\t\t\t"7 - ICT"\n\t\t],\n\t\t"Asia/Hong_Kong": [\n\t\t\t"7:36:42 - LMT 1904_9_30 7:36:42",\n\t\t\t"8 HK HK%sT 1941_11_25 8",\n\t\t\t"9 - JST 1945_8_15 9",\n\t\t\t"8 HK HK%sT"\n\t\t],\n\t\t"Asia/Hovd": [\n\t\t\t"6:6:36 - LMT 1905_7 6:6:36",\n\t\t\t"6 - HOVT 1978 6",\n\t\t\t"7 Mongol HOV%sT"\n\t\t],\n\t\t"Asia/Irkutsk": [\n\t\t\t"6:57:20 - LMT 1880 6:57:20",\n\t\t\t"6:57:20 - IMT 1920_0_25 6:57:20",\n\t\t\t"7 - IRKT 1930_5_21 7",\n\t\t\t"8 Russia IRK%sT 1991_2_31_2 8",\n\t\t\t"7 Russia IRK%sT 1992_0_19_2 7",\n\t\t\t"8 Russia IRK%sT 2011_2_27_2 8",\n\t\t\t"9 - IRKT"\n\t\t],\n\t\t"Asia/Jakarta": [\n\t\t\t"7:7:12 - LMT 1867_7_10 7:7:12",\n\t\t\t"7:7:12 - JMT 1923_11_31_23_47_12 7:7:12",\n\t\t\t"7:20 - JAVT 1932_10 7:20",\n\t\t\t"7:30 - WIT 1942_2_23 7:30",\n\t\t\t"9 - JST 1945_8_23 9",\n\t\t\t"7:30 - WIT 1948_4 7:30",\n\t\t\t"8 - WIT 1950_4 8",\n\t\t\t"7:30 - WIT 1964 7:30",\n\t\t\t"7 - WIT"\n\t\t],\n\t\t"Asia/Jayapura": [\n\t\t\t"9:22:48 - LMT 1932_10 9:22:48",\n\t\t\t"9 - EIT 1944_8_1 9",\n\t\t\t"9:30 - CST 1964 9:30",\n\t\t\t"9 - EIT"\n\t\t],\n\t\t"Asia/Jerusalem": [\n\t\t\t"2:20:56 - LMT 1880 2:20:56",\n\t\t\t"2:20:40 - JMT 1918 2:20:40",\n\t\t\t"2 Zion I%sT"\n\t\t],\n\t\t"Asia/Kabul": [\n\t\t\t"4:36:48 - LMT 1890 4:36:48",\n\t\t\t"4 - AFT 1945 4",\n\t\t\t"4:30 - AFT"\n\t\t],\n\t\t"Asia/Kamchatka": [\n\t\t\t"10:34:36 - LMT 1922_10_10 10:34:36",\n\t\t\t"11 - PETT 1930_5_21 11",\n\t\t\t"12 Russia PET%sT 1991_2_31_2 12",\n\t\t\t"11 Russia PET%sT 1992_0_19_2 11",\n\t\t\t"12 Russia PET%sT 2010_2_28_2 12",\n\t\t\t"11 Russia PET%sT 2011_2_27_2 11",\n\t\t\t"12 - PETT"\n\t\t],\n\t\t"Asia/Karachi": [\n\t\t\t"4:28:12 - LMT 1907 4:28:12",\n\t\t\t"5:30 - IST 1942_8 5:30",\n\t\t\t"6:30 - IST 1945_9_15 6:30",\n\t\t\t"5:30 - IST 1951_8_30 5:30",\n\t\t\t"5 - KART 1971_2_26 5",\n\t\t\t"5 Pakistan PK%sT"\n\t\t],\n\t\t"Asia/Kashgar": [\n\t\t\t"5:3:56 - LMT 1928 5:3:56",\n\t\t\t"5:30 - KAST 1940 5:30",\n\t\t\t"5 - KAST 1980_4 5",\n\t\t\t"8 PRC C%sT"\n\t\t],\n\t\t"Asia/Kathmandu": [\n\t\t\t"5:41:16 - LMT 1920 5:41:16",\n\t\t\t"5:30 - IST 1986 5:30",\n\t\t\t"5:45 - NPT"\n\t\t],\n\t\t"Asia/Khandyga": [\n\t\t\t"9:2:13 - LMT 1919_11_15 9:2:13",\n\t\t\t"8 - YAKT 1930_5_21 8",\n\t\t\t"9 Russia YAK%sT 1991_2_31_2 9",\n\t\t\t"8 Russia YAK%sT 1992_0_19_2 8",\n\t\t\t"9 Russia YAK%sT 2004 9",\n\t\t\t"10 Russia VLA%sT 2011_2_27_2 10",\n\t\t\t"11 - VLAT 2011_8_13_0 11",\n\t\t\t"10 - YAKT"\n\t\t],\n\t\t"Asia/Kolkata": [\n\t\t\t"5:53:28 - LMT 1880 5:53:28",\n\t\t\t"5:53:20 - HMT 1941_9 5:53:20",\n\t\t\t"6:30 - BURT 1942_4_15 6:30",\n\t\t\t"5:30 - IST 1942_8 5:30",\n\t\t\t"6:30 - IST 1945_9_15 6:30",\n\t\t\t"5:30 - IST"\n\t\t],\n\t\t"Asia/Krasnoyarsk": [\n\t\t\t"6:11:20 - LMT 1920_0_6 6:11:20",\n\t\t\t"6 - KRAT 1930_5_21 6",\n\t\t\t"7 Russia KRA%sT 1991_2_31_2 7",\n\t\t\t"6 Russia KRA%sT 1992_0_19_2 6",\n\t\t\t"7 Russia KRA%sT 2011_2_27_2 7",\n\t\t\t"8 - KRAT"\n\t\t],\n\t\t"Asia/Kuala_Lumpur": [\n\t\t\t"6:46:46 - LMT 1901_0_1 6:46:46",\n\t\t\t"6:55:25 - SMT 1905_5_1 6:55:25",\n\t\t\t"7 - MALT 1933_0_1 7",\n\t\t\t"7:20 - MALST 1936_0_1 7:20",\n\t\t\t"7:20 - MALT 1941_8_1 7:20",\n\t\t\t"7:30 - MALT 1942_1_16 7:30",\n\t\t\t"9 - JST 1945_8_12 9",\n\t\t\t"7:30 - MALT 1982_0_1 7:30",\n\t\t\t"8 - MYT"\n\t\t],\n\t\t"Asia/Kuching": [\n\t\t\t"7:21:20 - LMT 1926_2 7:21:20",\n\t\t\t"7:30 - BORT 1933 7:30",\n\t\t\t"8 NBorneo BOR%sT 1942_1_16 8",\n\t\t\t"9 - JST 1945_8_12 9",\n\t\t\t"8 - BORT 1982_0_1 8",\n\t\t\t"8 - MYT"\n\t\t],\n\t\t"Asia/Kuwait": [\n\t\t\t"3:11:56 - LMT 1950 3:11:56",\n\t\t\t"3 - AST"\n\t\t],\n\t\t"Asia/Macau": [\n\t\t\t"7:34:20 - LMT 1912 7:34:20",\n\t\t\t"8 Macau MO%sT 1999_11_20 8",\n\t\t\t"8 PRC C%sT"\n\t\t],\n\t\t"Asia/Magadan": [\n\t\t\t"10:3:12 - LMT 1924_4_2 10:3:12",\n\t\t\t"10 - MAGT 1930_5_21 10",\n\t\t\t"11 Russia MAG%sT 1991_2_31_2 11",\n\t\t\t"10 Russia MAG%sT 1992_0_19_2 10",\n\t\t\t"11 Russia MAG%sT 2011_2_27_2 11",\n\t\t\t"12 - MAGT"\n\t\t],\n\t\t"Asia/Makassar": [\n\t\t\t"7:57:36 - LMT 1920 7:57:36",\n\t\t\t"7:57:36 - MMT 1932_10 7:57:36",\n\t\t\t"8 - CIT 1942_1_9 8",\n\t\t\t"9 - JST 1945_8_23 9",\n\t\t\t"8 - CIT"\n\t\t],\n\t\t"Asia/Manila": [\n\t\t\t"-15:56 - LMT 1844_11_31 -15:56",\n\t\t\t"8:4 - LMT 1899_4_11 8:4",\n\t\t\t"8 Phil PH%sT 1942_4 8",\n\t\t\t"9 - JST 1944_10 9",\n\t\t\t"8 Phil PH%sT"\n\t\t],\n\t\t"Asia/Muscat": [\n\t\t\t"3:54:24 - LMT 1920 3:54:24",\n\t\t\t"4 - GST"\n\t\t],\n\t\t"Asia/Nicosia": [\n\t\t\t"2:13:28 - LMT 1921_10_14 2:13:28",\n\t\t\t"2 Cyprus EE%sT 1998_8 3",\n\t\t\t"2 EUAsia EE%sT"\n\t\t],\n\t\t"Asia/Novokuznetsk": [\n\t\t\t"5:48:48 - NMT 1920_0_6 5:48:48",\n\t\t\t"6 - KRAT 1930_5_21 6",\n\t\t\t"7 Russia KRA%sT 1991_2_31_2 7",\n\t\t\t"6 Russia KRA%sT 1992_0_19_2 6",\n\t\t\t"7 Russia KRA%sT 2010_2_28_2 7",\n\t\t\t"6 Russia NOV%sT 2011_2_27_2 6",\n\t\t\t"7 - NOVT"\n\t\t],\n\t\t"Asia/Novosibirsk": [\n\t\t\t"5:31:40 - LMT 1919_11_14_6 5:31:40",\n\t\t\t"6 - NOVT 1930_5_21 6",\n\t\t\t"7 Russia NOV%sT 1991_2_31_2 7",\n\t\t\t"6 Russia NOV%sT 1992_0_19_2 6",\n\t\t\t"7 Russia NOV%sT 1993_4_23 8",\n\t\t\t"6 Russia NOV%sT 2011_2_27_2 6",\n\t\t\t"7 - NOVT"\n\t\t],\n\t\t"Asia/Omsk": [\n\t\t\t"4:53:36 - LMT 1919_10_14 4:53:36",\n\t\t\t"5 - OMST 1930_5_21 5",\n\t\t\t"6 Russia OMS%sT 1991_2_31_2 6",\n\t\t\t"5 Russia OMS%sT 1992_0_19_2 5",\n\t\t\t"6 Russia OMS%sT 2011_2_27_2 6",\n\t\t\t"7 - OMST"\n\t\t],\n\t\t"Asia/Oral": [\n\t\t\t"3:25:24 - LMT 1924_4_2 3:25:24",\n\t\t\t"4 - URAT 1930_5_21 4",\n\t\t\t"5 - URAT 1981_3_1 5",\n\t\t\t"6 - URAST 1981_9_1 6",\n\t\t\t"6 - URAT 1982_3_1 6",\n\t\t\t"5 RussiaAsia URA%sT 1989_2_26_2 5",\n\t\t\t"4 RussiaAsia URA%sT 1991 4",\n\t\t\t"4 - URAT 1991_11_16 4",\n\t\t\t"4 RussiaAsia ORA%sT 2005_2_15 4",\n\t\t\t"5 - ORAT"\n\t\t],\n\t\t"Asia/Phnom_Penh": [\n\t\t\t"6:59:40 - LMT 1906_5_9 6:59:40",\n\t\t\t"7:6:20 - SMT 1911_2_11_0_1 7:6:20",\n\t\t\t"7 - ICT 1912_4 7",\n\t\t\t"8 - ICT 1931_4 8",\n\t\t\t"7 - ICT"\n\t\t],\n\t\t"Asia/Pontianak": [\n\t\t\t"7:17:20 - LMT 1908_4 7:17:20",\n\t\t\t"7:17:20 - PMT 1932_10 7:17:20",\n\t\t\t"7:30 - WIT 1942_0_29 7:30",\n\t\t\t"9 - JST 1945_8_23 9",\n\t\t\t"7:30 - WIT 1948_4 7:30",\n\t\t\t"8 - WIT 1950_4 8",\n\t\t\t"7:30 - WIT 1964 7:30",\n\t\t\t"8 - CIT 1988_0_1 8",\n\t\t\t"7 - WIT"\n\t\t],\n\t\t"Asia/Pyongyang": [\n\t\t\t"8:23 - LMT 1890 8:23",\n\t\t\t"8:30 - KST 1904_11 8:30",\n\t\t\t"9 - KST 1928 9",\n\t\t\t"8:30 - KST 1932 8:30",\n\t\t\t"9 - KST 1954_2_21 9",\n\t\t\t"8 - KST 1961_7_10 8",\n\t\t\t"9 - KST"\n\t\t],\n\t\t"Asia/Qatar": [\n\t\t\t"3:26:8 - LMT 1920 3:26:8",\n\t\t\t"4 - GST 1972_5 4",\n\t\t\t"3 - AST"\n\t\t],\n\t\t"Asia/Qyzylorda": [\n\t\t\t"4:21:52 - LMT 1924_4_2 4:21:52",\n\t\t\t"4 - KIZT 1930_5_21 4",\n\t\t\t"5 - KIZT 1981_3_1 5",\n\t\t\t"6 - KIZST 1981_9_1 6",\n\t\t\t"6 - KIZT 1982_3_1 6",\n\t\t\t"5 RussiaAsia KIZ%sT 1991 5",\n\t\t\t"5 - KIZT 1991_11_16 5",\n\t\t\t"5 - QYZT 1992_0_19_2 5",\n\t\t\t"6 RussiaAsia QYZ%sT 2005_2_15 6",\n\t\t\t"6 - QYZT"\n\t\t],\n\t\t"Asia/Rangoon": [\n\t\t\t"6:24:40 - LMT 1880 6:24:40",\n\t\t\t"6:24:40 - RMT 1920 6:24:40",\n\t\t\t"6:30 - BURT 1942_4 6:30",\n\t\t\t"9 - JST 1945_4_3 9",\n\t\t\t"6:30 - MMT"\n\t\t],\n\t\t"Asia/Riyadh": [\n\t\t\t"3:6:52 - LMT 1950 3:6:52",\n\t\t\t"3 - AST"\n\t\t],\n\t\t"Asia/Sakhalin": [\n\t\t\t"9:30:48 - LMT 1905_7_23 9:30:48",\n\t\t\t"9 - CJT 1938 9",\n\t\t\t"9 - JST 1945_7_25 9",\n\t\t\t"11 Russia SAK%sT 1991_2_31_2 11",\n\t\t\t"10 Russia SAK%sT 1992_0_19_2 10",\n\t\t\t"11 Russia SAK%sT 1997_2_30_2 11",\n\t\t\t"10 Russia SAK%sT 2011_2_27_2 10",\n\t\t\t"11 - SAKT"\n\t\t],\n\t\t"Asia/Samarkand": [\n\t\t\t"4:27:12 - LMT 1924_4_2 4:27:12",\n\t\t\t"4 - SAMT 1930_5_21 4",\n\t\t\t"5 - SAMT 1981_3_1 5",\n\t\t\t"6 - SAMST 1981_9_1 6",\n\t\t\t"6 - TAST 1982_3_1 6",\n\t\t\t"5 RussiaAsia SAM%sT 1991_8_1 6",\n\t\t\t"5 RussiaAsia UZ%sT 1992 5",\n\t\t\t"5 - UZT"\n\t\t],\n\t\t"Asia/Seoul": [\n\t\t\t"8:27:52 - LMT 1890 8:27:52",\n\t\t\t"8:30 - KST 1904_11 8:30",\n\t\t\t"9 - KST 1928 9",\n\t\t\t"8:30 - KST 1932 8:30",\n\t\t\t"9 - KST 1954_2_21 9",\n\t\t\t"8 ROK K%sT 1961_7_10 8",\n\t\t\t"8:30 - KST 1968_9 8:30",\n\t\t\t"9 ROK K%sT"\n\t\t],\n\t\t"Asia/Shanghai": [\n\t\t\t"8:5:57 - LMT 1928 8:5:57",\n\t\t\t"8 Shang C%sT 1949 8",\n\t\t\t"8 PRC C%sT"\n\t\t],\n\t\t"Asia/Singapore": [\n\t\t\t"6:55:25 - LMT 1901_0_1 6:55:25",\n\t\t\t"6:55:25 - SMT 1905_5_1 6:55:25",\n\t\t\t"7 - MALT 1933_0_1 7",\n\t\t\t"7:20 - MALST 1936_0_1 7:20",\n\t\t\t"7:20 - MALT 1941_8_1 7:20",\n\t\t\t"7:30 - MALT 1942_1_16 7:30",\n\t\t\t"9 - JST 1945_8_12 9",\n\t\t\t"7:30 - MALT 1965_7_9 7:30",\n\t\t\t"7:30 - SGT 1982_0_1 7:30",\n\t\t\t"8 - SGT"\n\t\t],\n\t\t"Asia/Taipei": [\n\t\t\t"8:6 - LMT 1896 8:6",\n\t\t\t"8 Taiwan C%sT"\n\t\t],\n\t\t"Asia/Tashkent": [\n\t\t\t"4:37:12 - LMT 1924_4_2 4:37:12",\n\t\t\t"5 - TAST 1930_5_21 5",\n\t\t\t"6 RussiaAsia TAS%sT 1991_2_31_2 6",\n\t\t\t"5 RussiaAsia TAS%sT 1991_8_1 6",\n\t\t\t"5 RussiaAsia UZ%sT 1992 5",\n\t\t\t"5 - UZT"\n\t\t],\n\t\t"Asia/Tbilisi": [\n\t\t\t"2:59:16 - LMT 1880 2:59:16",\n\t\t\t"2:59:16 - TBMT 1924_4_2 2:59:16",\n\t\t\t"3 - TBIT 1957_2 3",\n\t\t\t"4 RussiaAsia TBI%sT 1991_2_31_2 4",\n\t\t\t"4 - TBIST 1991_3_9 4",\n\t\t\t"3 RussiaAsia GE%sT 1992 3",\n\t\t\t"3 E-EurAsia GE%sT 1994_8_25 4",\n\t\t\t"4 E-EurAsia GE%sT 1996_9_27 5",\n\t\t\t"5 - GEST 1997_2_30 5",\n\t\t\t"4 E-EurAsia GE%sT 2004_5_27 5",\n\t\t\t"3 RussiaAsia GE%sT 2005_2_27_2 3",\n\t\t\t"4 - GET"\n\t\t],\n\t\t"Asia/Tehran": [\n\t\t\t"3:25:44 - LMT 1916 3:25:44",\n\t\t\t"3:25:44 - TMT 1946 3:25:44",\n\t\t\t"3:30 - IRST 1977_10 3:30",\n\t\t\t"4 Iran IR%sT 1979 4",\n\t\t\t"3:30 Iran IR%sT"\n\t\t],\n\t\t"Asia/Thimphu": [\n\t\t\t"5:58:36 - LMT 1947_7_15 5:58:36",\n\t\t\t"5:30 - IST 1987_9 5:30",\n\t\t\t"6 - BTT"\n\t\t],\n\t\t"Asia/Tokyo": [\n\t\t\t"9:18:59 - LMT 1887_11_31_15",\n\t\t\t"9 - JST 1896 9",\n\t\t\t"9 - CJT 1938 9",\n\t\t\t"9 Japan J%sT"\n\t\t],\n\t\t"Asia/Ulaanbaatar": [\n\t\t\t"7:7:32 - LMT 1905_7 7:7:32",\n\t\t\t"7 - ULAT 1978 7",\n\t\t\t"8 Mongol ULA%sT"\n\t\t],\n\t\t"Asia/Urumqi": [\n\t\t\t"5:50:20 - LMT 1928 5:50:20",\n\t\t\t"6 - URUT 1980_4 6",\n\t\t\t"8 PRC C%sT"\n\t\t],\n\t\t"Asia/Ust-Nera": [\n\t\t\t"9:32:54 - LMT 1919_11_15 9:32:54",\n\t\t\t"8 - YAKT 1930_5_21 8",\n\t\t\t"9 Russia YAKT 1981_3_1 9",\n\t\t\t"11 Russia MAG%sT 1991_2_31_2 11",\n\t\t\t"10 Russia MAG%sT 1992_0_19_2 10",\n\t\t\t"11 Russia MAG%sT 2011_2_27_2 11",\n\t\t\t"12 - MAGT 2011_8_13_0 12",\n\t\t\t"11 - VLAT"\n\t\t],\n\t\t"Asia/Vientiane": [\n\t\t\t"6:50:24 - LMT 1906_5_9 6:50:24",\n\t\t\t"7:6:20 - SMT 1911_2_11_0_1 7:6:20",\n\t\t\t"7 - ICT 1912_4 7",\n\t\t\t"8 - ICT 1931_4 8",\n\t\t\t"7 - ICT"\n\t\t],\n\t\t"Asia/Vladivostok": [\n\t\t\t"8:47:44 - LMT 1922_10_15 8:47:44",\n\t\t\t"9 - VLAT 1930_5_21 9",\n\t\t\t"10 Russia VLA%sT 1991_2_31_2 10",\n\t\t\t"9 Russia VLA%sST 1992_0_19_2 9",\n\t\t\t"10 Russia VLA%sT 2011_2_27_2 10",\n\t\t\t"11 - VLAT"\n\t\t],\n\t\t"Asia/Yakutsk": [\n\t\t\t"8:38:40 - LMT 1919_11_15 8:38:40",\n\t\t\t"8 - YAKT 1930_5_21 8",\n\t\t\t"9 Russia YAK%sT 1991_2_31_2 9",\n\t\t\t"8 Russia YAK%sT 1992_0_19_2 8",\n\t\t\t"9 Russia YAK%sT 2011_2_27_2 9",\n\t\t\t"10 - YAKT"\n\t\t],\n\t\t"Asia/Yekaterinburg": [\n\t\t\t"4:2:24 - LMT 1919_6_15_4 4:2:24",\n\t\t\t"4 - SVET 1930_5_21 4",\n\t\t\t"5 Russia SVE%sT 1991_2_31_2 5",\n\t\t\t"4 Russia SVE%sT 1992_0_19_2 4",\n\t\t\t"5 Russia YEK%sT 2011_2_27_2 5",\n\t\t\t"6 - YEKT"\n\t\t],\n\t\t"Asia/Yerevan": [\n\t\t\t"2:58 - LMT 1924_4_2 2:58",\n\t\t\t"3 - YERT 1957_2 3",\n\t\t\t"4 RussiaAsia YER%sT 1991_2_31_2 4",\n\t\t\t"4 - YERST 1991_8_23 4",\n\t\t\t"3 RussiaAsia AM%sT 1995_8_24_2 3",\n\t\t\t"4 - AMT 1997 4",\n\t\t\t"4 RussiaAsia AM%sT 2012_2_25_2 4",\n\t\t\t"4 - AMT"\n\t\t],\n\t\t"Atlantic/Azores": [\n\t\t\t"-1:42:40 - LMT 1884 -1:42:40",\n\t\t\t"-1:54:32 - HMT 1911_4_24 -1:54:32",\n\t\t\t"-2 Port AZO%sT 1966_3_3_2 -2",\n\t\t\t"-1 Port AZO%sT 1983_8_25_1 -1",\n\t\t\t"-1 W-Eur AZO%sT 1992_8_27_1 -1",\n\t\t\t"0 EU WE%sT 1993_2_28_1",\n\t\t\t"-1 EU AZO%sT"\n\t\t],\n\t\t"Atlantic/Bermuda": [\n\t\t\t"-4:19:18 - LMT 1930_0_1_2 -4:19:18",\n\t\t\t"-4 - AST 1974_3_28_2 -4",\n\t\t\t"-4 Bahamas A%sT 1976 -4",\n\t\t\t"-4 US A%sT"\n\t\t],\n\t\t"Atlantic/Canary": [\n\t\t\t"-1:1:36 - LMT 1922_2 -1:1:36",\n\t\t\t"-1 - CANT 1946_8_30_1 -1",\n\t\t\t"0 - WET 1980_3_6_0",\n\t\t\t"1 - WEST 1980_8_28_0",\n\t\t\t"0 EU WE%sT"\n\t\t],\n\t\t"Atlantic/Cape_Verde": [\n\t\t\t"-1:34:4 - LMT 1907 -1:34:4",\n\t\t\t"-2 - CVT 1942_8 -2",\n\t\t\t"-1 - CVST 1945_9_15 -1",\n\t\t\t"-2 - CVT 1975_10_25_2 -2",\n\t\t\t"-1 - CVT"\n\t\t],\n\t\t"Atlantic/Faroe": [\n\t\t\t"-0:27:4 - LMT 1908_0_11 -0:27:4",\n\t\t\t"0 - WET 1981",\n\t\t\t"0 EU WE%sT"\n\t\t],\n\t\t"Atlantic/Madeira": [\n\t\t\t"-1:7:36 - LMT 1884 -1:7:36",\n\t\t\t"-1:7:36 - FMT 1911_4_24 -1:7:36",\n\t\t\t"-1 Port MAD%sT 1966_3_3_2 -1",\n\t\t\t"0 Port WE%sT 1983_8_25_1",\n\t\t\t"0 EU WE%sT"\n\t\t],\n\t\t"Atlantic/Reykjavik": [\n\t\t\t"-1:27:24 - LMT 1837 -1:27:24",\n\t\t\t"-1:27:48 - RMT 1908 -1:27:48",\n\t\t\t"-1 Iceland IS%sT 1968_3_7_1 -1",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Atlantic/South_Georgia": [\n\t\t\t"-2:26:8 - LMT 1890 -2:26:8",\n\t\t\t"-2 - GST"\n\t\t],\n\t\t"Atlantic/St_Helena": [\n\t\t\t"-0:22:48 - LMT 1890 -0:22:48",\n\t\t\t"-0:22:48 - JMT 1951 -0:22:48",\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Atlantic/Stanley": [\n\t\t\t"-3:51:24 - LMT 1890 -3:51:24",\n\t\t\t"-3:51:24 - SMT 1912_2_12 -3:51:24",\n\t\t\t"-4 Falk FK%sT 1983_4 -4",\n\t\t\t"-3 Falk FK%sT 1985_8_15 -3",\n\t\t\t"-4 Falk FK%sT 2010_8_5_02 -4",\n\t\t\t"-3 - FKST"\n\t\t],\n\t\t"Australia/Adelaide": [\n\t\t\t"9:14:20 - LMT 1895_1 9:14:20",\n\t\t\t"9 - CST 1899_4 9",\n\t\t\t"9:30 Aus CST 1971 9:30",\n\t\t\t"9:30 AS CST"\n\t\t],\n\t\t"Australia/Brisbane": [\n\t\t\t"10:12:8 - LMT 1895 10:12:8",\n\t\t\t"10 Aus EST 1971 10",\n\t\t\t"10 AQ EST"\n\t\t],\n\t\t"Australia/Broken_Hill": [\n\t\t\t"9:25:48 - LMT 1895_1 9:25:48",\n\t\t\t"10 - EST 1896_7_23 10",\n\t\t\t"9 - CST 1899_4 9",\n\t\t\t"9:30 Aus CST 1971 9:30",\n\t\t\t"9:30 AN CST 2000 10:30",\n\t\t\t"9:30 AS CST"\n\t\t],\n\t\t"Australia/Currie": [\n\t\t\t"9:35:28 - LMT 1895_8 9:35:28",\n\t\t\t"10 - EST 1916_9_1_2 10",\n\t\t\t"11 - EST 1917_1 11",\n\t\t\t"10 Aus EST 1971_6 10",\n\t\t\t"10 AT EST"\n\t\t],\n\t\t"Australia/Darwin": [\n\t\t\t"8:43:20 - LMT 1895_1 8:43:20",\n\t\t\t"9 - CST 1899_4 9",\n\t\t\t"9:30 Aus CST"\n\t\t],\n\t\t"Australia/Eucla": [\n\t\t\t"8:35:28 - LMT 1895_11 8:35:28",\n\t\t\t"8:45 Aus CWST 1943_6 8:45",\n\t\t\t"8:45 AW CWST"\n\t\t],\n\t\t"Australia/Hobart": [\n\t\t\t"9:49:16 - LMT 1895_8 9:49:16",\n\t\t\t"10 - EST 1916_9_1_2 10",\n\t\t\t"11 - EST 1917_1 11",\n\t\t\t"10 Aus EST 1967 10",\n\t\t\t"10 AT EST"\n\t\t],\n\t\t"Australia/Lindeman": [\n\t\t\t"9:55:56 - LMT 1895 9:55:56",\n\t\t\t"10 Aus EST 1971 10",\n\t\t\t"10 AQ EST 1992_6 10",\n\t\t\t"10 Holiday EST"\n\t\t],\n\t\t"Australia/Lord_Howe": [\n\t\t\t"10:36:20 - LMT 1895_1 10:36:20",\n\t\t\t"10 - EST 1981_2 10",\n\t\t\t"10:30 LH LHST"\n\t\t],\n\t\t"Australia/Melbourne": [\n\t\t\t"9:39:52 - LMT 1895_1 9:39:52",\n\t\t\t"10 Aus EST 1971 10",\n\t\t\t"10 AV EST"\n\t\t],\n\t\t"Australia/Perth": [\n\t\t\t"7:43:24 - LMT 1895_11 7:43:24",\n\t\t\t"8 Aus WST 1943_6 8",\n\t\t\t"8 AW WST"\n\t\t],\n\t\t"Australia/Sydney": [\n\t\t\t"10:4:52 - LMT 1895_1 10:4:52",\n\t\t\t"10 Aus EST 1971 10",\n\t\t\t"10 AN EST"\n\t\t],\n\t\t"CET": [\n\t\t\t"1 C-Eur CE%sT"\n\t\t],\n\t\t"CST6CDT": [\n\t\t\t"-6 US C%sT"\n\t\t],\n\t\t"EET": [\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"EST": [\n\t\t\t"-5 - EST"\n\t\t],\n\t\t"EST5EDT": [\n\t\t\t"-5 US E%sT"\n\t\t],\n\t\t"Etc/GMT": [\n\t\t\t"0 - GMT"\n\t\t],\n\t\t"Etc/GMT+1": [\n\t\t\t"-1 - GMT+1"\n\t\t],\n\t\t"Etc/GMT+10": [\n\t\t\t"-10 - GMT+10"\n\t\t],\n\t\t"Etc/GMT+11": [\n\t\t\t"-11 - GMT+11"\n\t\t],\n\t\t"Etc/GMT+12": [\n\t\t\t"-12 - GMT+12"\n\t\t],\n\t\t"Etc/GMT+2": [\n\t\t\t"-2 - GMT+2"\n\t\t],\n\t\t"Etc/GMT+3": [\n\t\t\t"-3 - GMT+3"\n\t\t],\n\t\t"Etc/GMT+4": [\n\t\t\t"-4 - GMT+4"\n\t\t],\n\t\t"Etc/GMT+5": [\n\t\t\t"-5 - GMT+5"\n\t\t],\n\t\t"Etc/GMT+6": [\n\t\t\t"-6 - GMT+6"\n\t\t],\n\t\t"Etc/GMT+7": [\n\t\t\t"-7 - GMT+7"\n\t\t],\n\t\t"Etc/GMT+8": [\n\t\t\t"-8 - GMT+8"\n\t\t],\n\t\t"Etc/GMT+9": [\n\t\t\t"-9 - GMT+9"\n\t\t],\n\t\t"Etc/GMT-1": [\n\t\t\t"1 - GMT-1"\n\t\t],\n\t\t"Etc/GMT-10": [\n\t\t\t"10 - GMT-10"\n\t\t],\n\t\t"Etc/GMT-11": [\n\t\t\t"11 - GMT-11"\n\t\t],\n\t\t"Etc/GMT-12": [\n\t\t\t"12 - GMT-12"\n\t\t],\n\t\t"Etc/GMT-13": [\n\t\t\t"13 - GMT-13"\n\t\t],\n\t\t"Etc/GMT-14": [\n\t\t\t"14 - GMT-14"\n\t\t],\n\t\t"Etc/GMT-2": [\n\t\t\t"2 - GMT-2"\n\t\t],\n\t\t"Etc/GMT-3": [\n\t\t\t"3 - GMT-3"\n\t\t],\n\t\t"Etc/GMT-4": [\n\t\t\t"4 - GMT-4"\n\t\t],\n\t\t"Etc/GMT-5": [\n\t\t\t"5 - GMT-5"\n\t\t],\n\t\t"Etc/GMT-6": [\n\t\t\t"6 - GMT-6"\n\t\t],\n\t\t"Etc/GMT-7": [\n\t\t\t"7 - GMT-7"\n\t\t],\n\t\t"Etc/GMT-8": [\n\t\t\t"8 - GMT-8"\n\t\t],\n\t\t"Etc/GMT-9": [\n\t\t\t"9 - GMT-9"\n\t\t],\n\t\t"Etc/UCT": [\n\t\t\t"0 - UCT"\n\t\t],\n\t\t"Etc/UTC": [\n\t\t\t"0 - UTC"\n\t\t],\n\t\t"Europe/Amsterdam": [\n\t\t\t"0:19:32 - LMT 1835 0:19:32",\n\t\t\t"0:19:32 Neth %s 1937_6_1 1:19:32",\n\t\t\t"0:20 Neth NE%sT 1940_4_16_0 0:20",\n\t\t\t"1 C-Eur CE%sT 1945_3_2_2 1",\n\t\t\t"1 Neth CE%sT 1977 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Andorra": [\n\t\t\t"0:6:4 - LMT 1901 0:6:4",\n\t\t\t"0 - WET 1946_8_30",\n\t\t\t"1 - CET 1985_2_31_2 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Athens": [\n\t\t\t"1:34:52 - LMT 1895_8_14 1:34:52",\n\t\t\t"1:34:52 - AMT 1916_6_28_0_1 1:34:52",\n\t\t\t"2 Greece EE%sT 1941_3_30 3",\n\t\t\t"1 Greece CE%sT 1944_3_4 1",\n\t\t\t"2 Greece EE%sT 1981 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Belgrade": [\n\t\t\t"1:22 - LMT 1884 1:22",\n\t\t\t"1 - CET 1941_3_18_23 1",\n\t\t\t"1 C-Eur CE%sT 1945 1",\n\t\t\t"1 - CET 1945_4_8_2 1",\n\t\t\t"2 - CEST 1945_8_16_2 1",\n\t\t\t"1 - CET 1982_10_27 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Berlin": [\n\t\t\t"0:53:28 - LMT 1893_3 0:53:28",\n\t\t\t"1 C-Eur CE%sT 1945_4_24_2 2",\n\t\t\t"1 SovietZone CE%sT 1946 1",\n\t\t\t"1 Germany CE%sT 1980 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Brussels": [\n\t\t\t"0:17:30 - LMT 1880 0:17:30",\n\t\t\t"0:17:30 - BMT 1892_4_1_12 0:17:30",\n\t\t\t"0 - WET 1914_10_8",\n\t\t\t"1 - CET 1916_4_1_0 1",\n\t\t\t"1 C-Eur CE%sT 1918_10_11_11",\n\t\t\t"0 Belgium WE%sT 1940_4_20_2",\n\t\t\t"1 C-Eur CE%sT 1944_8_3 2",\n\t\t\t"1 Belgium CE%sT 1977 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Bucharest": [\n\t\t\t"1:44:24 - LMT 1891_9 1:44:24",\n\t\t\t"1:44:24 - BMT 1931_6_24 1:44:24",\n\t\t\t"2 Romania EE%sT 1981_2_29_2 2",\n\t\t\t"2 C-Eur EE%sT 1991 2",\n\t\t\t"2 Romania EE%sT 1994 2",\n\t\t\t"2 E-Eur EE%sT 1997 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Budapest": [\n\t\t\t"1:16:20 - LMT 1890_9 1:16:20",\n\t\t\t"1 C-Eur CE%sT 1918 1",\n\t\t\t"1 Hungary CE%sT 1941_3_6_2 1",\n\t\t\t"1 C-Eur CE%sT 1945 1",\n\t\t\t"1 Hungary CE%sT 1980_8_28_2 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Chisinau": [\n\t\t\t"1:55:20 - LMT 1880 1:55:20",\n\t\t\t"1:55 - CMT 1918_1_15 1:55",\n\t\t\t"1:44:24 - BMT 1931_6_24 1:44:24",\n\t\t\t"2 Romania EE%sT 1940_7_15 2",\n\t\t\t"3 - EEST 1941_6_17 3",\n\t\t\t"1 C-Eur CE%sT 1944_7_24 2",\n\t\t\t"3 Russia MSK/MSD 1990 3",\n\t\t\t"3 - MSK 1990_4_6 3",\n\t\t\t"2 - EET 1991 2",\n\t\t\t"2 Russia EE%sT 1992 2",\n\t\t\t"2 E-Eur EE%sT 1997 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Copenhagen": [\n\t\t\t"0:50:20 - LMT 1890 0:50:20",\n\t\t\t"0:50:20 - CMT 1894_0_1 0:50:20",\n\t\t\t"1 Denmark CE%sT 1942_10_2_2 1",\n\t\t\t"1 C-Eur CE%sT 1945_3_2_2 1",\n\t\t\t"1 Denmark CE%sT 1980 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Dublin": [\n\t\t\t"-0:25 - LMT 1880_7_2 -0:25",\n\t\t\t"-0:25:21 - DMT 1916_4_21_2 -0:25:21",\n\t\t\t"0:34:39 - IST 1916_9_1_2 -0:25:21",\n\t\t\t"0 GB-Eire %s 1921_11_6",\n\t\t\t"0 GB-Eire GMT/IST 1940_1_25_2",\n\t\t\t"1 - IST 1946_9_6_2 1",\n\t\t\t"0 - GMT 1947_2_16_2",\n\t\t\t"1 - IST 1947_10_2_2 1",\n\t\t\t"0 - GMT 1948_3_18_2",\n\t\t\t"0 GB-Eire GMT/IST 1968_9_27 1",\n\t\t\t"1 - IST 1971_9_31_2",\n\t\t\t"0 GB-Eire GMT/IST 1996",\n\t\t\t"0 EU GMT/IST"\n\t\t],\n\t\t"Europe/Gibraltar": [\n\t\t\t"-0:21:24 - LMT 1880_7_2_0 -0:21:24",\n\t\t\t"0 GB-Eire %s 1957_3_14_2",\n\t\t\t"1 - CET 1982 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Helsinki": [\n\t\t\t"1:39:52 - LMT 1878_4_31 1:39:52",\n\t\t\t"1:39:52 - HMT 1921_4 1:39:52",\n\t\t\t"2 Finland EE%sT 1983 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Istanbul": [\n\t\t\t"1:55:52 - LMT 1880 1:55:52",\n\t\t\t"1:56:56 - IMT 1910_9 1:56:56",\n\t\t\t"2 Turkey EE%sT 1978_9_15 3",\n\t\t\t"3 Turkey TR%sT 1985_3_20 3",\n\t\t\t"2 Turkey EE%sT 2007 2",\n\t\t\t"2 EU EE%sT 2011_2_27_1",\n\t\t\t"2 - EET 2011_2_28_1",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Kaliningrad": [\n\t\t\t"1:22 - LMT 1893_3 1:22",\n\t\t\t"1 C-Eur CE%sT 1945 1",\n\t\t\t"2 Poland CE%sT 1946 2",\n\t\t\t"3 Russia MSK/MSD 1991_2_31_2 3",\n\t\t\t"2 Russia EE%sT 2011_2_27_2 2",\n\t\t\t"3 - FET"\n\t\t],\n\t\t"Europe/Kiev": [\n\t\t\t"2:2:4 - LMT 1880 2:2:4",\n\t\t\t"2:2:4 - KMT 1924_4_2 2:2:4",\n\t\t\t"2 - EET 1930_5_21 2",\n\t\t\t"3 - MSK 1941_8_20 3",\n\t\t\t"1 C-Eur CE%sT 1943_10_6 1",\n\t\t\t"3 Russia MSK/MSD 1990 3",\n\t\t\t"3 - MSK 1990_6_1_2 3",\n\t\t\t"2 - EET 1992 2",\n\t\t\t"2 E-Eur EE%sT 1995 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Lisbon": [\n\t\t\t"-0:36:32 - LMT 1884 -0:36:32",\n\t\t\t"-0:36:32 - LMT 1912_0_1 -0:36:32",\n\t\t\t"0 Port WE%sT 1966_3_3_2",\n\t\t\t"1 - CET 1976_8_26_1 1",\n\t\t\t"0 Port WE%sT 1983_8_25_1",\n\t\t\t"0 W-Eur WE%sT 1992_8_27_1",\n\t\t\t"1 EU CE%sT 1996_2_31_1",\n\t\t\t"0 EU WE%sT"\n\t\t],\n\t\t"Europe/London": [\n\t\t\t"-0:1:15 - LMT 1847_11_1_0 -0:1:15",\n\t\t\t"0 GB-Eire %s 1968_9_27 1",\n\t\t\t"1 - BST 1971_9_31_2",\n\t\t\t"0 GB-Eire %s 1996",\n\t\t\t"0 EU GMT/BST"\n\t\t],\n\t\t"Europe/Luxembourg": [\n\t\t\t"0:24:36 - LMT 1904_5 0:24:36",\n\t\t\t"1 Lux CE%sT 1918_10_25 1",\n\t\t\t"0 Lux WE%sT 1929_9_6_2",\n\t\t\t"0 Belgium WE%sT 1940_4_14_3 1",\n\t\t\t"1 C-Eur WE%sT 1944_8_18_3 2",\n\t\t\t"1 Belgium CE%sT 1977 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Madrid": [\n\t\t\t"-0:14:44 - LMT 1901_0_1_0 -0:14:44",\n\t\t\t"0 Spain WE%sT 1946_8_30 2",\n\t\t\t"1 Spain CE%sT 1979 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Malta": [\n\t\t\t"0:58:4 - LMT 1893_10_2_0 0:58:4",\n\t\t\t"1 Italy CE%sT 1942_10_2_2 1",\n\t\t\t"1 C-Eur CE%sT 1945_3_2_2 1",\n\t\t\t"1 Italy CE%sT 1973_2_31 1",\n\t\t\t"1 Malta CE%sT 1981 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Minsk": [\n\t\t\t"1:50:16 - LMT 1880 1:50:16",\n\t\t\t"1:50 - MMT 1924_4_2 1:50",\n\t\t\t"2 - EET 1930_5_21 2",\n\t\t\t"3 - MSK 1941_5_28 3",\n\t\t\t"1 C-Eur CE%sT 1944_6_3 2",\n\t\t\t"3 Russia MSK/MSD 1990 3",\n\t\t\t"3 - MSK 1991_2_31_2 3",\n\t\t\t"3 - EEST 1991_8_29_2 2",\n\t\t\t"2 - EET 1992_2_29_0 2",\n\t\t\t"3 - EEST 1992_8_27_0 2",\n\t\t\t"2 Russia EE%sT 2011_2_27_2 2",\n\t\t\t"3 - FET"\n\t\t],\n\t\t"Europe/Monaco": [\n\t\t\t"0:29:32 - LMT 1891_2_15 0:29:32",\n\t\t\t"0:9:21 - PMT 1911_2_11 0:9:21",\n\t\t\t"0 France WE%sT 1945_8_16_3 2",\n\t\t\t"1 France CE%sT 1977 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Moscow": [\n\t\t\t"2:30:20 - LMT 1880 2:30:20",\n\t\t\t"2:30 - MMT 1916_6_3 2:30",\n\t\t\t"2:30:48 Russia %s 1919_6_1_2 4:30:48",\n\t\t\t"3 Russia MSK/MSD 1922_9 3",\n\t\t\t"2 - EET 1930_5_21 2",\n\t\t\t"3 Russia MSK/MSD 1991_2_31_2 3",\n\t\t\t"2 Russia EE%sT 1992_0_19_2 2",\n\t\t\t"3 Russia MSK/MSD 2011_2_27_2 3",\n\t\t\t"4 - MSK"\n\t\t],\n\t\t"Europe/Oslo": [\n\t\t\t"0:43 - LMT 1895_0_1 0:43",\n\t\t\t"1 Norway CE%sT 1940_7_10_23 1",\n\t\t\t"1 C-Eur CE%sT 1945_3_2_2 1",\n\t\t\t"1 Norway CE%sT 1980 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Paris": [\n\t\t\t"0:9:21 - LMT 1891_2_15_0_1 0:9:21",\n\t\t\t"0:9:21 - PMT 1911_2_11_0_1 0:9:21",\n\t\t\t"0 France WE%sT 1940_5_14_23 1",\n\t\t\t"1 C-Eur CE%sT 1944_7_25 2",\n\t\t\t"0 France WE%sT 1945_8_16_3 2",\n\t\t\t"1 France CE%sT 1977 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Prague": [\n\t\t\t"0:57:44 - LMT 1850 0:57:44",\n\t\t\t"0:57:44 - PMT 1891_9 0:57:44",\n\t\t\t"1 C-Eur CE%sT 1944_8_17_2 1",\n\t\t\t"1 Czech CE%sT 1979 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Riga": [\n\t\t\t"1:36:24 - LMT 1880 1:36:24",\n\t\t\t"1:36:24 - RMT 1918_3_15_2 1:36:24",\n\t\t\t"2:36:24 - LST 1918_8_16_3 2:36:24",\n\t\t\t"1:36:24 - RMT 1919_3_1_2 1:36:24",\n\t\t\t"2:36:24 - LST 1919_4_22_3 2:36:24",\n\t\t\t"1:36:24 - RMT 1926_4_11 1:36:24",\n\t\t\t"2 - EET 1940_7_5 2",\n\t\t\t"3 - MSK 1941_6 3",\n\t\t\t"1 C-Eur CE%sT 1944_9_13 1",\n\t\t\t"3 Russia MSK/MSD 1989_2_26_2 3",\n\t\t\t"3 - EEST 1989_8_24_2 2",\n\t\t\t"2 Latvia EE%sT 1997_0_21 2",\n\t\t\t"2 EU EE%sT 2000_1_29 2",\n\t\t\t"2 - EET 2001_0_2 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Rome": [\n\t\t\t"0:49:56 - LMT 1866_8_22 0:49:56",\n\t\t\t"0:49:56 - RMT 1893_10_1_0 0:49:56",\n\t\t\t"1 Italy CE%sT 1942_10_2_2 1",\n\t\t\t"1 C-Eur CE%sT 1944_6 2",\n\t\t\t"1 Italy CE%sT 1980 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Samara": [\n\t\t\t"3:20:36 - LMT 1919_6_1_2 3:20:36",\n\t\t\t"3 - SAMT 1930_5_21 3",\n\t\t\t"4 - SAMT 1935_0_27 4",\n\t\t\t"4 Russia KUY%sT 1989_2_26_2 4",\n\t\t\t"3 Russia KUY%sT 1991_2_31_2 3",\n\t\t\t"2 Russia KUY%sT 1991_8_29_2 2",\n\t\t\t"3 - KUYT 1991_9_20_3 3",\n\t\t\t"4 Russia SAM%sT 2010_2_28_2 4",\n\t\t\t"3 Russia SAM%sT 2011_2_27_2 3",\n\t\t\t"4 - SAMT"\n\t\t],\n\t\t"Europe/Simferopol": [\n\t\t\t"2:16:24 - LMT 1880 2:16:24",\n\t\t\t"2:16 - SMT 1924_4_2 2:16",\n\t\t\t"2 - EET 1930_5_21 2",\n\t\t\t"3 - MSK 1941_10 3",\n\t\t\t"1 C-Eur CE%sT 1944_3_13 2",\n\t\t\t"3 Russia MSK/MSD 1990 3",\n\t\t\t"3 - MSK 1990_6_1_2 3",\n\t\t\t"2 - EET 1992 2",\n\t\t\t"2 E-Eur EE%sT 1994_4 3",\n\t\t\t"3 E-Eur MSK/MSD 1996_2_31_3 3",\n\t\t\t"4 - MSD 1996_9_27_3 3",\n\t\t\t"3 Russia MSK/MSD 1997 3",\n\t\t\t"3 - MSK 1997_2_30_1",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Sofia": [\n\t\t\t"1:33:16 - LMT 1880 1:33:16",\n\t\t\t"1:56:56 - IMT 1894_10_30 1:56:56",\n\t\t\t"2 - EET 1942_10_2_3 2",\n\t\t\t"1 C-Eur CE%sT 1945 1",\n\t\t\t"1 - CET 1945_3_2_3 1",\n\t\t\t"2 - EET 1979_2_31_23 2",\n\t\t\t"2 Bulg EE%sT 1982_8_26_2 3",\n\t\t\t"2 C-Eur EE%sT 1991 2",\n\t\t\t"2 E-Eur EE%sT 1997 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Stockholm": [\n\t\t\t"1:12:12 - LMT 1879_0_1 1:12:12",\n\t\t\t"1:0:14 - SET 1900_0_1 1:0:14",\n\t\t\t"1 - CET 1916_4_14_23 1",\n\t\t\t"2 - CEST 1916_9_1_01 2",\n\t\t\t"1 - CET 1980 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Tallinn": [\n\t\t\t"1:39 - LMT 1880 1:39",\n\t\t\t"1:39 - TMT 1918_1 1:39",\n\t\t\t"1 C-Eur CE%sT 1919_6 1",\n\t\t\t"1:39 - TMT 1921_4 1:39",\n\t\t\t"2 - EET 1940_7_6 2",\n\t\t\t"3 - MSK 1941_8_15 3",\n\t\t\t"1 C-Eur CE%sT 1944_8_22 2",\n\t\t\t"3 Russia MSK/MSD 1989_2_26_2 3",\n\t\t\t"3 - EEST 1989_8_24_2 2",\n\t\t\t"2 C-Eur EE%sT 1998_8_22 3",\n\t\t\t"2 EU EE%sT 1999_10_1 3",\n\t\t\t"2 - EET 2002_1_21 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Tirane": [\n\t\t\t"1:19:20 - LMT 1914 1:19:20",\n\t\t\t"1 - CET 1940_5_16 1",\n\t\t\t"1 Albania CE%sT 1984_6 2",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Uzhgorod": [\n\t\t\t"1:29:12 - LMT 1890_9 1:29:12",\n\t\t\t"1 - CET 1940 1",\n\t\t\t"1 C-Eur CE%sT 1944_9 2",\n\t\t\t"2 - CEST 1944_9_26 2",\n\t\t\t"1 - CET 1945_5_29 1",\n\t\t\t"3 Russia MSK/MSD 1990 3",\n\t\t\t"3 - MSK 1990_6_1_2 3",\n\t\t\t"1 - CET 1991_2_31_3 1",\n\t\t\t"2 - EET 1992 2",\n\t\t\t"2 E-Eur EE%sT 1995 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Vaduz": [\n\t\t\t"0:38:4 - LMT 1894_5 0:38:4",\n\t\t\t"1 - CET 1981 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Vienna": [\n\t\t\t"1:5:21 - LMT 1893_3 1:5:21",\n\t\t\t"1 C-Eur CE%sT 1920 1",\n\t\t\t"1 Austria CE%sT 1940_3_1_2 1",\n\t\t\t"1 C-Eur CE%sT 1945_3_2_2 1",\n\t\t\t"2 - CEST 1945_3_12_2 1",\n\t\t\t"1 - CET 1946 1",\n\t\t\t"1 Austria CE%sT 1981 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Vilnius": [\n\t\t\t"1:41:16 - LMT 1880 1:41:16",\n\t\t\t"1:24 - WMT 1917 1:24",\n\t\t\t"1:35:36 - KMT 1919_9_10 1:35:36",\n\t\t\t"1 - CET 1920_6_12 1",\n\t\t\t"2 - EET 1920_9_9 2",\n\t\t\t"1 - CET 1940_7_3 1",\n\t\t\t"3 - MSK 1941_5_24 3",\n\t\t\t"1 C-Eur CE%sT 1944_7 2",\n\t\t\t"3 Russia MSK/MSD 1991_2_31_2 3",\n\t\t\t"3 - EEST 1991_8_29_2 2",\n\t\t\t"2 C-Eur EE%sT 1998 2",\n\t\t\t"2 - EET 1998_2_29_1",\n\t\t\t"1 EU CE%sT 1999_9_31_1",\n\t\t\t"2 - EET 2003_0_1 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Volgograd": [\n\t\t\t"2:57:40 - LMT 1920_0_3 2:57:40",\n\t\t\t"3 - TSAT 1925_3_6 3",\n\t\t\t"3 - STAT 1930_5_21 3",\n\t\t\t"4 - STAT 1961_10_11 4",\n\t\t\t"4 Russia VOL%sT 1989_2_26_2 4",\n\t\t\t"3 Russia VOL%sT 1991_2_31_2 3",\n\t\t\t"4 - VOLT 1992_2_29_2 4",\n\t\t\t"3 Russia VOL%sT 2011_2_27_2 3",\n\t\t\t"4 - VOLT"\n\t\t],\n\t\t"Europe/Warsaw": [\n\t\t\t"1:24 - LMT 1880 1:24",\n\t\t\t"1:24 - WMT 1915_7_5 1:24",\n\t\t\t"1 C-Eur CE%sT 1918_8_16_3 2",\n\t\t\t"2 Poland EE%sT 1922_5 2",\n\t\t\t"1 Poland CE%sT 1940_5_23_2 1",\n\t\t\t"1 C-Eur CE%sT 1944_9 2",\n\t\t\t"1 Poland CE%sT 1977 1",\n\t\t\t"1 W-Eur CE%sT 1988 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"Europe/Zaporozhye": [\n\t\t\t"2:20:40 - LMT 1880 2:20:40",\n\t\t\t"2:20 - CUT 1924_4_2 2:20",\n\t\t\t"2 - EET 1930_5_21 2",\n\t\t\t"3 - MSK 1941_7_25 3",\n\t\t\t"1 C-Eur CE%sT 1943_9_25 1",\n\t\t\t"3 Russia MSK/MSD 1991_2_31_2 3",\n\t\t\t"2 E-Eur EE%sT 1995 2",\n\t\t\t"2 EU EE%sT"\n\t\t],\n\t\t"Europe/Zurich": [\n\t\t\t"0:34:8 - LMT 1848_8_12 0:34:8",\n\t\t\t"0:29:44 - BMT 1894_5 0:29:44",\n\t\t\t"1 Swiss CE%sT 1981 1",\n\t\t\t"1 EU CE%sT"\n\t\t],\n\t\t"HST": [\n\t\t\t"-10 - HST"\n\t\t],\n\t\t"Indian/Antananarivo": [\n\t\t\t"3:10:4 - LMT 1911_6 3:10:4",\n\t\t\t"3 - EAT 1954_1_27_23 3",\n\t\t\t"4 - EAST 1954_4_29_23 3",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Indian/Chagos": [\n\t\t\t"4:49:40 - LMT 1907 4:49:40",\n\t\t\t"5 - IOT 1996 5",\n\t\t\t"6 - IOT"\n\t\t],\n\t\t"Indian/Christmas": [\n\t\t\t"7:2:52 - LMT 1895_1 7:2:52",\n\t\t\t"7 - CXT"\n\t\t],\n\t\t"Indian/Cocos": [\n\t\t\t"6:27:40 - LMT 1900 6:27:40",\n\t\t\t"6:30 - CCT"\n\t\t],\n\t\t"Indian/Comoro": [\n\t\t\t"2:53:4 - LMT 1911_6 2:53:4",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Indian/Kerguelen": [\n\t\t\t"0 - zzz 1950",\n\t\t\t"5 - TFT"\n\t\t],\n\t\t"Indian/Mahe": [\n\t\t\t"3:41:48 - LMT 1906_5 3:41:48",\n\t\t\t"4 - SCT"\n\t\t],\n\t\t"Indian/Maldives": [\n\t\t\t"4:54 - LMT 1880 4:54",\n\t\t\t"4:54 - MMT 1960 4:54",\n\t\t\t"5 - MVT"\n\t\t],\n\t\t"Indian/Mauritius": [\n\t\t\t"3:50 - LMT 1907 3:50",\n\t\t\t"4 Mauritius MU%sT"\n\t\t],\n\t\t"Indian/Mayotte": [\n\t\t\t"3:0:56 - LMT 1911_6 3:0:56",\n\t\t\t"3 - EAT"\n\t\t],\n\t\t"Indian/Reunion": [\n\t\t\t"3:41:52 - LMT 1911_5 3:41:52",\n\t\t\t"4 - RET"\n\t\t],\n\t\t"MET": [\n\t\t\t"1 C-Eur ME%sT"\n\t\t],\n\t\t"MST": [\n\t\t\t"-7 - MST"\n\t\t],\n\t\t"MST7MDT": [\n\t\t\t"-7 US M%sT"\n\t\t],\n\t\t"PST8PDT": [\n\t\t\t"-8 US P%sT"\n\t\t],\n\t\t"Pacific/Apia": [\n\t\t\t"12:33:4 - LMT 1879_6_5 12:33:4",\n\t\t\t"-11:26:56 - LMT 1911 -11:26:56",\n\t\t\t"-11:30 - SAMT 1950 -11:30",\n\t\t\t"-11 - WST 2010_8_26 -11",\n\t\t\t"-10 - WSDT 2011_3_2_4 -10",\n\t\t\t"-11 - WST 2011_8_24_3 -11",\n\t\t\t"-10 - WSDT 2011_11_30 -10",\n\t\t\t"14 - WSDT 2012_3_1_4 14",\n\t\t\t"13 WS WS%sT"\n\t\t],\n\t\t"Pacific/Auckland": [\n\t\t\t"11:39:4 - LMT 1868_10_2 11:39:4",\n\t\t\t"11:30 NZ NZ%sT 1946_0_1 12",\n\t\t\t"12 NZ NZ%sT"\n\t\t],\n\t\t"Pacific/Chatham": [\n\t\t\t"12:13:48 - LMT 1957_0_1 12:13:48",\n\t\t\t"12:45 Chatham CHA%sT"\n\t\t],\n\t\t"Pacific/Chuuk": [\n\t\t\t"10:7:8 - LMT 1901 10:7:8",\n\t\t\t"10 - CHUT"\n\t\t],\n\t\t"Pacific/Easter": [\n\t\t\t"-7:17:44 - LMT 1890 -7:17:44",\n\t\t\t"-7:17:28 - EMT 1932_8 -7:17:28",\n\t\t\t"-7 Chile EAS%sT 1982_2_13_21 -6",\n\t\t\t"-6 Chile EAS%sT"\n\t\t],\n\t\t"Pacific/Efate": [\n\t\t\t"11:13:16 - LMT 1912_0_13 11:13:16",\n\t\t\t"11 Vanuatu VU%sT"\n\t\t],\n\t\t"Pacific/Enderbury": [\n\t\t\t"-11:24:20 - LMT 1901 -11:24:20",\n\t\t\t"-12 - PHOT 1979_9 -12",\n\t\t\t"-11 - PHOT 1995 -11",\n\t\t\t"13 - PHOT"\n\t\t],\n\t\t"Pacific/Fakaofo": [\n\t\t\t"-11:24:56 - LMT 1901 -11:24:56",\n\t\t\t"-11 - TKT 2011_11_30 -11",\n\t\t\t"13 - TKT"\n\t\t],\n\t\t"Pacific/Fiji": [\n\t\t\t"11:55:44 - LMT 1915_9_26 11:55:44",\n\t\t\t"12 Fiji FJ%sT"\n\t\t],\n\t\t"Pacific/Funafuti": [\n\t\t\t"11:56:52 - LMT 1901 11:56:52",\n\t\t\t"12 - TVT"\n\t\t],\n\t\t"Pacific/Galapagos": [\n\t\t\t"-5:58:24 - LMT 1931 -5:58:24",\n\t\t\t"-5 - ECT 1986 -5",\n\t\t\t"-6 - GALT"\n\t\t],\n\t\t"Pacific/Gambier": [\n\t\t\t"-8:59:48 - LMT 1912_9 -8:59:48",\n\t\t\t"-9 - GAMT"\n\t\t],\n\t\t"Pacific/Guadalcanal": [\n\t\t\t"10:39:48 - LMT 1912_9 10:39:48",\n\t\t\t"11 - SBT"\n\t\t],\n\t\t"Pacific/Guam": [\n\t\t\t"-14:21 - LMT 1844_11_31 -14:21",\n\t\t\t"9:39 - LMT 1901 9:39",\n\t\t\t"10 - GST 2000_11_23 10",\n\t\t\t"10 - ChST"\n\t\t],\n\t\t"Pacific/Honolulu": [\n\t\t\t"-10:31:26 - LMT 1896_0_13_12 -10:31:26",\n\t\t\t"-10:30 - HST 1933_3_30_2 -10:30",\n\t\t\t"-9:30 - HDT 1933_4_21_12 -9:30",\n\t\t\t"-10:30 - HST 1942_1_09_2 -10:30",\n\t\t\t"-9:30 - HDT 1945_8_30_2 -9:30",\n\t\t\t"-10:30 - HST 1947_5_8_2 -10:30",\n\t\t\t"-10 - HST"\n\t\t],\n\t\t"Pacific/Johnston": [\n\t\t\t"-10 - HST"\n\t\t],\n\t\t"Pacific/Kiritimati": [\n\t\t\t"-10:29:20 - LMT 1901 -10:29:20",\n\t\t\t"-10:40 - LINT 1979_9 -10:40",\n\t\t\t"-10 - LINT 1995 -10",\n\t\t\t"14 - LINT"\n\t\t],\n\t\t"Pacific/Kosrae": [\n\t\t\t"10:51:56 - LMT 1901 10:51:56",\n\t\t\t"11 - KOST 1969_9 11",\n\t\t\t"12 - KOST 1999 12",\n\t\t\t"11 - KOST"\n\t\t],\n\t\t"Pacific/Kwajalein": [\n\t\t\t"11:9:20 - LMT 1901 11:9:20",\n\t\t\t"11 - MHT 1969_9 11",\n\t\t\t"-12 - KWAT 1993_7_20 -12",\n\t\t\t"12 - MHT"\n\t\t],\n\t\t"Pacific/Majuro": [\n\t\t\t"11:24:48 - LMT 1901 11:24:48",\n\t\t\t"11 - MHT 1969_9 11",\n\t\t\t"12 - MHT"\n\t\t],\n\t\t"Pacific/Marquesas": [\n\t\t\t"-9:18 - LMT 1912_9 -9:18",\n\t\t\t"-9:30 - MART"\n\t\t],\n\t\t"Pacific/Midway": [\n\t\t\t"-11:49:28 - LMT 1901 -11:49:28",\n\t\t\t"-11 - NST 1956_5_3 -11",\n\t\t\t"-10 - NDT 1956_8_2 -10",\n\t\t\t"-11 - NST 1967_3 -11",\n\t\t\t"-11 - BST 1983_10_30 -11",\n\t\t\t"-11 - SST"\n\t\t],\n\t\t"Pacific/Nauru": [\n\t\t\t"11:7:40 - LMT 1921_0_15 11:7:40",\n\t\t\t"11:30 - NRT 1942_2_15 11:30",\n\t\t\t"9 - JST 1944_7_15 9",\n\t\t\t"11:30 - NRT 1979_4 11:30",\n\t\t\t"12 - NRT"\n\t\t],\n\t\t"Pacific/Niue": [\n\t\t\t"-11:19:40 - LMT 1901 -11:19:40",\n\t\t\t"-11:20 - NUT 1951 -11:20",\n\t\t\t"-11:30 - NUT 1978_9_1 -11:30",\n\t\t\t"-11 - NUT"\n\t\t],\n\t\t"Pacific/Norfolk": [\n\t\t\t"11:11:52 - LMT 1901 11:11:52",\n\t\t\t"11:12 - NMT 1951 11:12",\n\t\t\t"11:30 - NFT"\n\t\t],\n\t\t"Pacific/Noumea": [\n\t\t\t"11:5:48 - LMT 1912_0_13 11:5:48",\n\t\t\t"11 NC NC%sT"\n\t\t],\n\t\t"Pacific/Pago_Pago": [\n\t\t\t"12:37:12 - LMT 1879_6_5 12:37:12",\n\t\t\t"-11:22:48 - LMT 1911 -11:22:48",\n\t\t\t"-11:30 - SAMT 1950 -11:30",\n\t\t\t"-11 - NST 1967_3 -11",\n\t\t\t"-11 - BST 1983_10_30 -11",\n\t\t\t"-11 - SST"\n\t\t],\n\t\t"Pacific/Palau": [\n\t\t\t"8:57:56 - LMT 1901 8:57:56",\n\t\t\t"9 - PWT"\n\t\t],\n\t\t"Pacific/Pitcairn": [\n\t\t\t"-8:40:20 - LMT 1901 -8:40:20",\n\t\t\t"-8:30 - PNT 1998_3_27_00 -8:30",\n\t\t\t"-8 - PST"\n\t\t],\n\t\t"Pacific/Pohnpei": [\n\t\t\t"10:32:52 - LMT 1901 10:32:52",\n\t\t\t"11 - PONT"\n\t\t],\n\t\t"Pacific/Port_Moresby": [\n\t\t\t"9:48:40 - LMT 1880 9:48:40",\n\t\t\t"9:48:32 - PMMT 1895 9:48:32",\n\t\t\t"10 - PGT"\n\t\t],\n\t\t"Pacific/Rarotonga": [\n\t\t\t"-10:39:4 - LMT 1901 -10:39:4",\n\t\t\t"-10:30 - CKT 1978_10_12 -10:30",\n\t\t\t"-10 Cook CK%sT"\n\t\t],\n\t\t"Pacific/Saipan": [\n\t\t\t"-14:17 - LMT 1844_11_31 -14:17",\n\t\t\t"9:43 - LMT 1901 9:43",\n\t\t\t"9 - MPT 1969_9 9",\n\t\t\t"10 - MPT 2000_11_23 10",\n\t\t\t"10 - ChST"\n\t\t],\n\t\t"Pacific/Tahiti": [\n\t\t\t"-9:58:16 - LMT 1912_9 -9:58:16",\n\t\t\t"-10 - TAHT"\n\t\t],\n\t\t"Pacific/Tarawa": [\n\t\t\t"11:32:4 - LMT 1901 11:32:4",\n\t\t\t"12 - GILT"\n\t\t],\n\t\t"Pacific/Tongatapu": [\n\t\t\t"12:19:20 - LMT 1901 12:19:20",\n\t\t\t"12:20 - TOT 1941 12:20",\n\t\t\t"13 - TOT 1999 13",\n\t\t\t"13 Tonga TO%sT"\n\t\t],\n\t\t"Pacific/Wake": [\n\t\t\t"11:6:28 - LMT 1901 11:6:28",\n\t\t\t"12 - WAKT"\n\t\t],\n\t\t"Pacific/Wallis": [\n\t\t\t"12:15:20 - LMT 1901 12:15:20",\n\t\t\t"12 - WFT"\n\t\t],\n\t\t"WET": [\n\t\t\t"0 EU WE%sT"\n\t\t]\n\t}\n}';});

// scripts/config.es6
define(
  'config',["moment-timezone","text!moment-timezone.json","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    var moment = __dependency1__["default"] || __dependency1__;
    var timezones = __dependency2__["default"] || __dependency2__;

    moment.tz.add(JSON.parse(timezones));

    var defaults = {
      api: {cors: false}
    };

    __exports__["default"] = defaults;
  });

//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

define("underscore", (function (global) {
    return function () {
        var ret, fn;
        return ret || global._;
    };
}(this)));

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('dpr',['jquery'], factory);
  } else if (typeof exports !== 'undefined') {
    module.exports = factory(require('jquery'));
  } else {
    root.dpr = factory(root.jQuery);
  }
})(this, function ($) {
  

  // Define the namespace
  var dpr = function (arg) {

    // Return a formatted path if a path was given
    if (typeof arg === 'string') return format(arg);

    // Configure if arg is an object
    if (typeof arg === 'object') return config(arg);

    // Return the current DPR
    return get();
  };

  // Get the current DPR (I say current because it can actually change if a
  // window is dragged from, for example, a retina display to a standard 72 or
  // 92 ppi display)
  var get = function () {

    // Check support for devicePixelRatio and matchMedia
    var n = window.devicePixelRatio;
    var mm = window.matchMedia;

    // Use the fallback if neither DPR-finding method is supported
    if (!n || !mm) return dpr.fallback;

    // Remember the highest supported dpr
    var supported = dpr.supported;
    var best = null;
    var mdpr = 'min-device-pixel-ratio: ';

    // Iterate through the available DPRs and find the best match
    for (var i = 0, l = supported.length; i < l; ++i) {
      var check = supported[i];
      var mdprCheck = mdpr + check;

      // See if the DPR is >= what we can offer
      if (best === null || n >= check || mm &&
          mm(mdprCheck).matches ||
          mm('-webkit-' + mdprCheck).matches ||
          mm('-moz-' + mdprCheck).matches ||
          mm('-o-' + mdprCheck).matches ||
          mm('-ms-' + mdprCheck).matches) {
        best = check;

      // We've reached the limit
      } else {
        break;
      }
    }

    // `best` is the best available match
    return best;
  };

  // Format a path for the current dpr based on the set formatPattern
  var format = function (path) {
    var n = dpr();

    // If the DPR is 1 and formatOne is false, don't do anything to path
    if (n === 1 && !dpr.one) return path;

    // Otherwise, replace the necessary part of the path with the goods
    return path.replace(dpr.match, dpr.replace.replace(/#/, n));
  };

  // Scan the document for img[data-dpr-src] elements in need of the correct src
  // attribute
  dpr.scan = function ($el) {
    if (!$) return;
    $el || ($el = $(document));
    $('img[data-dpr-src]', $el).each(function () {
      var $self = $(this);
      var src = {src: dpr($self.data('dprSrc'))};
      $self.attr(src).removeAttr('data-dpr-src');
    });
  };

  // Define a configure method for easy option setting
  var config = function (options) {

    var scan = options.readyScan;

    // Turn readyScan on or off
    if (scan != dpr.readyScan && $) {
      $(document)[scan ? 'on' : 'off']('ready', dpr.scan);
    }

    // Apply the settings
    for (var name in options) dpr[name] = options[name];

    // Return the DPR object for chaining
    return dpr;
  };

  config({

    // These are the ratios we have images for. Sort ASC (i.e. [1, 1.5, 2])
    supported: [1, 2],

    // Specify a fallback for when the DPR cannot be determined. I assume 1 for
    // now, but maybe assume 2 in a couple years, when bandwidth/average DPR
    // increases, but for now be conservative.
    fallback: 1,

    // What part of the file do we want to replace?
    match: /(\..*)/,

    // How should filename alterations be formatted? (# is the dpr)
    replace: '-#x$1',

    // Should filenames with DPR of 1 be formatted?
    one: true,

    // Should dpr scan the document when the DOM is ready? (requires jQuery or
    // Zepto)
    readyScan: true
  });

  return dpr;
});

/*! elementQuery | Author: Tyson Matanich (http://matanich.com), 2013 | License: MIT */
(function (window, document, undefined) {
    // Enable strict mode
    

    // Use Sizzle standalone or from jQuery
    var sizzle = window.Sizzle || jQuery.find;

    // Set the number of sizzle selectors to cache (default is 50)
    //sizzle.selectors.cacheLength = 50;

    var queryData = {};

    var addQueryDataValue = function (selector, type, pair, number, value) {

        selector = trim(selector);

        if (selector != "") {
            var parts;
            if (!number && !value) {
                parts = /^([0-9]*.?[0-9]+)(px|em)$/.exec(pair)
                if (parts != null) {
                    number = Number(parts[1]);
                    if (number + "" != "NaN") {
                        value = parts[2];
                    }
                }
            }

            if (value) {
                // Compile the sizzle selector
                if (sizzle.compile) {
                    sizzle.compile(selector);
                }

                // Update the queryData object
                if (queryData[selector] === undefined) {
                    queryData[selector] = {};
                }
                if (queryData[selector][type] === undefined) {
                    queryData[selector][type] = {};
                }
                queryData[selector][type][pair] = [number, value];
            }
        }
    };

    var updateQueryData = function (data, doUpdate) {

        var i, j, k;
        for (i in data) {
            for (j in data[i]) {
                if (typeof data[i][j] == "string") {
                    addQueryDataValue(i, j, data[i][j]);
                }
                else if (typeof data[i][j] == "object") {
                    for (k = 0; k < data[i][j].length; k++) {
                        addQueryDataValue(i, j, data[i][j][k]);
                    }
                }
            }
        }

        if (doUpdate == true) {
            refresh();
        }
    };


    // Refactor from jQuery.trim()
    var trim = function (text) {
        if (text == null) {
            return "";
        }
        else {
            var core_trim = "".trim;
            if (core_trim && !core_trim.call("\uFEFF\xA0")) {
                return core_trim.call(text);
            }
            else {
                return (text + "").replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
            }
        }
    };

    // Refactor from jquery().addClass() and jquery().removeClass()
    var clean = function (element, attr) {
        // This expression is here for better compressibility
        var val = element.getAttribute(attr);
        return val ? (" " + val + " ").replace(/[\t\r\n]/g, " ") : " ";
    };

    // Refactor from jquery().addClass()
    var addTo = function (element, attr, value) {

        if (element.nodeType === 1) {
            var val = trim(value);
            if (val != "") {
                var cur = clean(element, attr);
                
                if (cur.indexOf(" " + val + " ") < 0) {
                    // Add the value if its not already there
                    element.setAttribute(attr, trim(cur + val));
                }
            }
        }
    };

    // Refactor from jquery().removeClass()
    var removeFrom = function (element, attr, value) {

        if (element.nodeType === 1) {
            var val = trim(value);
            if (val != "") {
                var cur = clean(element, attr);
                var updated = false;
                while (cur.indexOf(" " + val + " ") >= 0) {
                    // Remove the value
                    cur = cur.replace(" " + val + " ", " ");
                    updated = true;
                }
                if (updated) {
                    // Update the attribute
                    element.setAttribute(attr, trim(cur));
                }
            }
        }
    };

    var refresh = function () {

        var i, ei, j, k, elements, element, val;

        // For each selector
        for (i in queryData) {

            // Get the items matching the selector
            elements = sizzle(i);

            if (elements.length > 0) {

                // For each matching element
                for (ei = 0; ei < elements.length; ei++) {
                    element = elements[ei];

                    // For each min|max-width|height string
                    for (j in queryData[i]) {

                        // For each number px|em value pair
                        for (k in queryData[i][j]) {

                            val = queryData[i][j][k][0];

                            if (queryData[i][j][k][1] == "em") {
                                // Convert EMs to pixels
                                val = val * (window.getEmPixels ? getEmPixels(element) : 16); // NOTE: Using getEmPixels() has a small performance impact
                            }

                            /* NOTE: Using offsetWidth/Height so an element can be adjusted when it reaches a specific size.
                            /* For Nested queries scrollWidth/Height or clientWidth/Height may sometime be desired but are not supported. */

                            if ((j == "min-width" && element.offsetWidth >= val) ||
                                (j == "max-width" && element.offsetWidth <= val) ||
                                (j == "min-height" && element.offsetHeight >= val) ||
                                (j == "max-height" && element.offsetHeight <= val)) {
                                // Add matching attr value
                                addTo(element, j, k);
                            }
                            else {
                                // Remove non-matching attr value
                                removeFrom(element, j, k);
                            }
                        }
                    }
                }
            }
        }

        if (!window.addEventListener && window.attachEvent) {
            // Force a repaint in IE7 and IE8
            var className = document.documentElement.className;
            document.documentElement.className = " " + className;
            document.documentElement.className = className;
        }
    }

    // Expose some public functions
    window.elementQuery = function (arg1, arg2) {

        if (arg1 && typeof arg1 == "object" && !(arg1.cssRules || arg1.rules)) {
            // Add new selector queries
            updateQueryData(arg1, arg2);
        }
        else if (!arg1 && !arg2) {
            refresh();
        }
    };

    //NOTE: For development purposes only! Added stub to prevent errors.
    window.elementQuery.selectors = function () { };

    if (window.addEventListener) {
        window.addEventListener("resize", refresh, false);
        window.addEventListener("DOMContentLoaded", refresh, false);
        window.addEventListener("load", refresh, false);
    }
    else if (window.attachEvent) {
        window.attachEvent("onresize", refresh);
        window.attachEvent("onload", refresh);
    }
}(this, document, undefined));

/*! getEmPixels  | Author: Tyson Matanich (http://matanich.com), 2013 | License: MIT */
(function (document, documentElement) {
    // Enable strict mode
    

    // Form the style on the fly to result in smaller minified file
    var important = "!important;";
    var style = "position:absolute" + important + "visibility:hidden" + important + "width:1em" + important + "font-size:1em" + important + "padding:0" + important;

    window.getEmPixels = function (element) {

        var extraBody;

        if (!element) {
            // Emulate the documentElement to get rem value (documentElement does not work in IE6-7)
            element = extraBody = document.createElement("body");
            extraBody.style.cssText = "font-size:1em" + important;
            documentElement.insertBefore(extraBody, document.body);
        }

        // Create and style a test element
        var testElement = document.createElement("i");
        testElement.style.cssText = style;
        element.appendChild(testElement);

        // Get the client width of the test element
        var value = testElement.clientWidth;

        if (extraBody) {
            // Remove the extra body element
            documentElement.removeChild(extraBody);
        }
        else {
            // Remove the test element
            element.removeChild(testElement);
        }

        // Return the em value in pixels
        return value;
    };
}(document, document.documentElement));

define("elementQuery", ["jquery"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.elementQuery;
    };
}(this)));

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('herit',[], factory);
  else if (typeof exports !== 'undefined') module.exports = factory();
  else root.herit = factory();
})(this, function () {
  

  var extend = function (objA) {
    for (var i = 1, l = arguments.length; i < l; ++i) {
      var objB = arguments[i];
      for (var k in objB) if (objB.hasOwnProperty(k)) objA[k] = objB[k];
    }
    return objA;
  };

  // Define the mixin
  var herit = function () {

    // Juggle arguments.
    var i;
    var Parent = function () {};
    for (i = 0; typeof arguments[i] === 'function'; ++i) {
      Parent = i ? herit(arguments[i], {constructor: Parent}) : arguments[i];
    }
    var protoProps = arguments[i] || {};

    // `Child` is the passed in `constructor` proto property
    // or a default function that uses `Parent`'s constructor.
    var Child =
      protoProps.hasOwnProperty('constructor') ?
      protoProps.constructor :
      function () { return Parent.apply(this, arguments); };

    // Use Object.create if it's available.
    if (false && typeof Object.create === 'function') {
      Child.prototype = Object.create(Parent.prototype);

    // Otherwise use the workaround.
    } else {

      // `Dummy` is a dummy constructor to ensure `Parent.constructor`
      // isn't actually called as it could have unintended
      // side effects.
      var Dummy = function () { this.constructor = Child; };
      Dummy.prototype = Parent.prototype;
      Child.prototype = new Dummy();
    }

    // Pass __super__ and the on the prototype properties.
    extend(Child.prototype, protoProps);

    // Pass on the static properties.
    extend(Child, Parent, arguments[i + 1] || {});

    // Return the finished constructor.
    return Child;
  };

  return herit;
});

/**
 * This script gives you the zone info key representing your device's time zone setting.
 *
 * @name jsTimezoneDetect
 * @version 1.0.5
 * @author Jon Nylander
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://pellepim.bitbucket.org/jstz/
 *
 * Copyright (c) Jon Nylander
 */

/*jslint undef: true */
/*global console, exports*/

(function(root) {
  /**
   * Namespace to hold all the code for timezone detection.
   */
  var jstz = (function () {
      
      var HEMISPHERE_SOUTH = 's',
          
          /**
           * Gets the offset in minutes from UTC for a certain date.
           * @param {Date} date
           * @returns {Number}
           */
          get_date_offset = function (date) {
              var offset = -date.getTimezoneOffset();
              return (offset !== null ? offset : 0);
          },

          get_date = function (year, month, date) {
              var d = new Date();
              if (year !== undefined) {
                d.setFullYear(year);
              }
              d.setMonth(month);
              d.setDate(date);
              return d;
          },

          get_january_offset = function (year) {
              return get_date_offset(get_date(year, 0 ,2));
          },

          get_june_offset = function (year) {
              return get_date_offset(get_date(year, 5, 2));
          },

          /**
           * Private method.
           * Checks whether a given date is in daylight saving time.
           * If the date supplied is after august, we assume that we're checking
           * for southern hemisphere DST.
           * @param {Date} date
           * @returns {Boolean}
           */
          date_is_dst = function (date) {
              var is_southern = date.getMonth() > 7,
                  base_offset = is_southern ? get_june_offset(date.getFullYear()) : 
                                              get_january_offset(date.getFullYear()),
                  date_offset = get_date_offset(date),
                  is_west = base_offset < 0,
                  dst_offset = base_offset - date_offset;
                  
              if (!is_west && !is_southern) {
                  return dst_offset < 0;
              }

              return dst_offset !== 0;
          },

          /**
           * This function does some basic calculations to create information about
           * the user's timezone. It uses REFERENCE_YEAR as a solid year for which
           * the script has been tested rather than depend on the year set by the
           * client device.
           *
           * Returns a key that can be used to do lookups in jstz.olson.timezones.
           * eg: "720,1,2". 
           *
           * @returns {String}
           */

          lookup_key = function () {
              var january_offset = get_january_offset(),
                  june_offset = get_june_offset(),
                  diff = january_offset - june_offset;

              if (diff < 0) {
                  return january_offset + ",1";
              } else if (diff > 0) {
                  return june_offset + ",1," + HEMISPHERE_SOUTH;
              }

              return january_offset + ",0";
          },

          /**
           * Uses get_timezone_info() to formulate a key to use in the olson.timezones dictionary.
           *
           * Returns a primitive object on the format:
           * {'timezone': TimeZone, 'key' : 'the key used to find the TimeZone object'}
           *
           * @returns Object
           */
          determine = function () {
              var key = lookup_key();
              return new jstz.TimeZone(jstz.olson.timezones[key]);
          },

          /**
           * This object contains information on when daylight savings starts for
           * different timezones.
           *
           * The list is short for a reason. Often we do not have to be very specific
           * to single out the correct timezone. But when we do, this list comes in
           * handy.
           *
           * Each value is a date denoting when daylight savings starts for that timezone.
           */
          dst_start_for = function (tz_name) {

            var ru_pre_dst_change = new Date(2010, 6, 15, 1, 0, 0, 0), // In 2010 Russia had DST, this allows us to detect Russia :)
                dst_starts = {
                    'America/Denver': new Date(2011, 2, 13, 3, 0, 0, 0),
                    'America/Mazatlan': new Date(2011, 3, 3, 3, 0, 0, 0),
                    'America/Chicago': new Date(2011, 2, 13, 3, 0, 0, 0),
                    'America/Mexico_City': new Date(2011, 3, 3, 3, 0, 0, 0),
                    'America/Asuncion': new Date(2012, 9, 7, 3, 0, 0, 0),
                    'America/Santiago': new Date(2012, 9, 3, 3, 0, 0, 0),
                    'America/Campo_Grande': new Date(2012, 9, 21, 5, 0, 0, 0),
                    'America/Montevideo': new Date(2011, 9, 2, 3, 0, 0, 0),
                    'America/Sao_Paulo': new Date(2011, 9, 16, 5, 0, 0, 0),
                    'America/Los_Angeles': new Date(2011, 2, 13, 8, 0, 0, 0),
                    'America/Santa_Isabel': new Date(2011, 3, 5, 8, 0, 0, 0),
                    'America/Havana': new Date(2012, 2, 10, 2, 0, 0, 0),
                    'America/New_York': new Date(2012, 2, 10, 7, 0, 0, 0),
                    'Europe/Helsinki': new Date(2013, 2, 31, 5, 0, 0, 0),
                    'Pacific/Auckland': new Date(2011, 8, 26, 7, 0, 0, 0),
                    'America/Halifax': new Date(2011, 2, 13, 6, 0, 0, 0),
                    'America/Goose_Bay': new Date(2011, 2, 13, 2, 1, 0, 0),
                    'America/Miquelon': new Date(2011, 2, 13, 5, 0, 0, 0),
                    'America/Godthab': new Date(2011, 2, 27, 1, 0, 0, 0),
                    'Europe/Moscow': ru_pre_dst_change,
                    'Asia/Amman': new Date(2013, 2, 29, 1, 0, 0, 0),
                    'Asia/Beirut': new Date(2013, 2, 31, 2, 0, 0, 0),
                    'Asia/Damascus': new Date(2013, 3, 6, 2, 0, 0, 0),
                    'Asia/Jerusalem': new Date(2013, 2, 29, 5, 0, 0, 0),
                    'Asia/Yekaterinburg': ru_pre_dst_change,
                    'Asia/Omsk': ru_pre_dst_change,
                    'Asia/Krasnoyarsk': ru_pre_dst_change,
                    'Asia/Irkutsk': ru_pre_dst_change,
                    'Asia/Yakutsk': ru_pre_dst_change,
                    'Asia/Vladivostok': ru_pre_dst_change,
                    'Asia/Baku': new Date(2013, 2, 31, 4, 0, 0),
                    'Asia/Yerevan': new Date(2013, 2, 31, 3, 0, 0),
                    'Asia/Kamchatka': ru_pre_dst_change,
                    'Asia/Gaza': new Date(2010, 2, 27, 4, 0, 0),
                    'Africa/Cairo': new Date(2010, 4, 1, 3, 0, 0),
                    'Europe/Minsk': ru_pre_dst_change,
                    'Pacific/Apia': new Date(2010, 10, 1, 1, 0, 0, 0),
                    'Pacific/Fiji': new Date(2010, 11, 1, 0, 0, 0),
                    'Australia/Perth': new Date(2008, 10, 1, 1, 0, 0, 0)
                };

              return dst_starts[tz_name];
          };

      return {
          determine: determine,
          date_is_dst: date_is_dst,
          dst_start_for: dst_start_for 
      };
  }());

  /**
   * Simple object to perform ambiguity check and to return name of time zone.
   */
  jstz.TimeZone = function (tz_name) {
      
        /**
         * The keys in this object are timezones that we know may be ambiguous after
         * a preliminary scan through the olson_tz object.
         *
         * The array of timezones to compare must be in the order that daylight savings
         * starts for the regions.
         */
      var AMBIGUITIES = {
              'America/Denver':       ['America/Denver', 'America/Mazatlan'],
              'America/Chicago':      ['America/Chicago', 'America/Mexico_City'],
              'America/Santiago':     ['America/Santiago', 'America/Asuncion', 'America/Campo_Grande'],
              'America/Montevideo':   ['America/Montevideo', 'America/Sao_Paulo'],
              'Asia/Beirut':          ['Asia/Amman', 'Asia/Jerusalem', 'Asia/Beirut', 'Europe/Helsinki','Asia/Damascus'],
              'Pacific/Auckland':     ['Pacific/Auckland', 'Pacific/Fiji'],
              'America/Los_Angeles':  ['America/Los_Angeles', 'America/Santa_Isabel'],
              'America/New_York':     ['America/Havana', 'America/New_York'],
              'America/Halifax':      ['America/Goose_Bay', 'America/Halifax'],
              'America/Godthab':      ['America/Miquelon', 'America/Godthab'],
              'Asia/Dubai':           ['Europe/Moscow'],
              'Asia/Dhaka':           ['Asia/Yekaterinburg'],
              'Asia/Jakarta':         ['Asia/Omsk'],
              'Asia/Shanghai':        ['Asia/Krasnoyarsk', 'Australia/Perth'],
              'Asia/Tokyo':           ['Asia/Irkutsk'],
              'Australia/Brisbane':   ['Asia/Yakutsk'],
              'Pacific/Noumea':       ['Asia/Vladivostok'],
              'Pacific/Tarawa':       ['Asia/Kamchatka', 'Pacific/Fiji'],
              'Pacific/Tongatapu':    ['Pacific/Apia'],
              'Asia/Baghdad':         ['Europe/Minsk'],
              'Asia/Baku':            ['Asia/Yerevan','Asia/Baku'],
              'Africa/Johannesburg':  ['Asia/Gaza', 'Africa/Cairo']
          },

          timezone_name = tz_name,
          
          /**
           * Checks if a timezone has possible ambiguities. I.e timezones that are similar.
           *
           * For example, if the preliminary scan determines that we're in America/Denver.
           * We double check here that we're really there and not in America/Mazatlan.
           *
           * This is done by checking known dates for when daylight savings start for different
           * timezones during 2010 and 2011.
           */
          ambiguity_check = function () {
              var ambiguity_list = AMBIGUITIES[timezone_name],
                  length = ambiguity_list.length,
                  i = 0,
                  tz = ambiguity_list[0];

              for (; i < length; i += 1) {
                  tz = ambiguity_list[i];

                  if (jstz.date_is_dst(jstz.dst_start_for(tz))) {
                      timezone_name = tz;
                      return;
                  }
              }
          },

          /**
           * Checks if it is possible that the timezone is ambiguous.
           */
          is_ambiguous = function () {
              return typeof (AMBIGUITIES[timezone_name]) !== 'undefined';
          };

      if (is_ambiguous()) {
          ambiguity_check();
      }

      return {
          name: function () {
              return timezone_name;
          }
      };
  };

  jstz.olson = {};

  /*
   * The keys in this dictionary are comma separated as such:
   *
   * First the offset compared to UTC time in minutes.
   *
   * Then a flag which is 0 if the timezone does not take daylight savings into account and 1 if it
   * does.
   *
   * Thirdly an optional 's' signifies that the timezone is in the southern hemisphere,
   * only interesting for timezones with DST.
   *
   * The mapped arrays is used for constructing the jstz.TimeZone object from within
   * jstz.determine_timezone();
   */
  jstz.olson.timezones = {
      '-720,0'   : 'Pacific/Majuro',
      '-660,0'   : 'Pacific/Pago_Pago',
      '-600,1'   : 'America/Adak',
      '-600,0'   : 'Pacific/Honolulu',
      '-570,0'   : 'Pacific/Marquesas',
      '-540,0'   : 'Pacific/Gambier',
      '-540,1'   : 'America/Anchorage',
      '-480,1'   : 'America/Los_Angeles',
      '-480,0'   : 'Pacific/Pitcairn',
      '-420,0'   : 'America/Phoenix',
      '-420,1'   : 'America/Denver',
      '-360,0'   : 'America/Guatemala',
      '-360,1'   : 'America/Chicago',
      '-360,1,s' : 'Pacific/Easter',
      '-300,0'   : 'America/Bogota',
      '-300,1'   : 'America/New_York',
      '-270,0'   : 'America/Caracas',
      '-240,1'   : 'America/Halifax',
      '-240,0'   : 'America/Santo_Domingo',
      '-240,1,s' : 'America/Santiago',
      '-210,1'   : 'America/St_Johns',
      '-180,1'   : 'America/Godthab',
      '-180,0'   : 'America/Argentina/Buenos_Aires',
      '-180,1,s' : 'America/Montevideo',
      '-120,0'   : 'America/Noronha',
      '-120,1'   : 'America/Noronha',
      '-60,1'    : 'Atlantic/Azores',
      '-60,0'    : 'Atlantic/Cape_Verde',
      '0,0'      : 'UTC',
      '0,1'      : 'Europe/London',
      '60,1'     : 'Europe/Berlin',
      '60,0'     : 'Africa/Lagos',
      '60,1,s'   : 'Africa/Windhoek',
      '120,1'    : 'Asia/Beirut',
      '120,0'    : 'Africa/Johannesburg',
      '180,0'    : 'Asia/Baghdad',
      '180,1'    : 'Europe/Moscow',
      '210,1'    : 'Asia/Tehran',
      '240,0'    : 'Asia/Dubai',
      '240,1'    : 'Asia/Baku',
      '270,0'    : 'Asia/Kabul',
      '300,1'    : 'Asia/Yekaterinburg',
      '300,0'    : 'Asia/Karachi',
      '330,0'    : 'Asia/Kolkata',
      '345,0'    : 'Asia/Kathmandu',
      '360,0'    : 'Asia/Dhaka',
      '360,1'    : 'Asia/Omsk',
      '390,0'    : 'Asia/Rangoon',
      '420,1'    : 'Asia/Krasnoyarsk',
      '420,0'    : 'Asia/Jakarta',
      '480,0'    : 'Asia/Shanghai',
      '480,1'    : 'Asia/Irkutsk',
      '525,0'    : 'Australia/Eucla',
      '525,1,s'  : 'Australia/Eucla',
      '540,1'    : 'Asia/Yakutsk',
      '540,0'    : 'Asia/Tokyo',
      '570,0'    : 'Australia/Darwin',
      '570,1,s'  : 'Australia/Adelaide',
      '600,0'    : 'Australia/Brisbane',
      '600,1'    : 'Asia/Vladivostok',
      '600,1,s'  : 'Australia/Sydney',
      '630,1,s'  : 'Australia/Lord_Howe',
      '660,1'    : 'Asia/Kamchatka',
      '660,0'    : 'Pacific/Noumea',
      '690,0'    : 'Pacific/Norfolk',
      '720,1,s'  : 'Pacific/Auckland',
      '720,0'    : 'Pacific/Tarawa',
      '765,1,s'  : 'Pacific/Chatham',
      '780,0'    : 'Pacific/Tongatapu',
      '780,1,s'  : 'Pacific/Apia',
      '840,0'    : 'Pacific/Kiritimati'
  };

  if (typeof exports !== 'undefined') {
    exports.jstz = jstz;
  } else {
    root.jstz = jstz;
  }
})(this);

define("jstz", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.jstz;
    };
}(this)));

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('olay',['jquery'], factory);
  } else if (typeof exports !== 'undefined') {
    module.exports = factory(require('jquery'));
  } else {
    root.Olay = factory(root.jQuery);
  }
})(this, function ($) {
  

  // Selector for tabbable elements.
  var tabbable =
    ':input, [tabindex], [contenteditable], [href], iframe, object, embed';

  // Convenience method for `off`/`on`ing in jQuery.
  var delegate = function ($el, ev, selector, cb) {
    $el.off.call($el, ev, selector, cb).on.call($el, ev, selector, cb);
  };

  // Listen for keydown events.
  $(document).keydown(function (ev) {
    var lastContainer = $('.js-olay-container').last()[0];
    if (!lastContainer) return;
    var olay = lastContainer.olay;
    var which = ev.which;
    var keys = olay.hideOnKeys || [];
    for (var i = 0, l = keys.length; i < l; ++i) {
      if (which === keys[i]) return olay.hide() && false;
    }
  });

  // Create the `Olay` constructor.
  //
  // ```js
  // var olay = new Olay('Howdy!', {duration: 5000});
  // ```
  var Olay = function (el, options) {

    // Extend the instance with its options.
    for (var name in options) this[name] = options[name];

    // Store bound listeners to be used for callbacks. This is also used to
    // ensure event callbacks can be removed consistently.
    var self = this;
    this._hide = function () { return self.hide(); };
    this._$containerClick = function (ev) {
      var contentClicked =
        $.contains(self.$cell[0], ev.target) ||
        !$.contains($('body')[0], ev.target);
      if (self.hideOnClick && !contentClicked) self.hide();
    };

    // Create the necessary DOM nodes.
    this.$container = $('<div>')
      .addClass('js-olay-container')
      .addClass(this.transition)
      .append(
    this.$table = $('<div>')
      .addClass('js-olay-table')
      .append(
    this.$cell = $('<div>')
      .addClass('js-olay-cell')
      .append(
    this.$content = $('<div>')
      .addClass('js-olay-content')
      .attr({role: 'alertdialog', 'aria-label': this.ariaLabel}))));

    // Finally, set the element.
    this.setElement(el);
  };

  // Define `prototype` properties and methods for `Olay`.
  var proto = {

    // How long the olay should be displayed for (in ms)?
    // `0` means indefinitely.
    duration: 0,

    // What transition should be used? This simply refers to a class that will
    // be added to the `$container` when shown. Use this to style different
    // transitions with CSS.
    transition: 'js-olay-scale-up',

    // How long should the olay take to transition in or out?
    // `0` means instantly.
    transitionDuration: 250,

    // What keys hide the olay? Default is just ESC.
    hideOnKeys: [27],

    // Should the olay be hidden when there is a click outside the content box?
    hideOnClick: true,

    // Preserve the DOM data and events for this olay. If this is set to `true`,
    // be sure to either set it to `false` before your final `hide` call, or
    // after your final `hide` call invoke `destroy()` after your transition.
    // Failure to do this will cause memory leaks. When `preserve` is set to
    // `false` this is handled automaticaly.
    preserve: false,

    // Show the olay.
    show: function () {
      var inDom = $.contains($('body')[0], this.$container[0]);
      if (inDom && this.$container.hasClass('js-olay-show')) return this;
      clearTimeout(this._timeout);
      if (!inDom) this._append();

      // Force a redraw before adding the transition class. Not doing this will
      // apply the end result of the transition instantly, which is not
      // desirable in a transition...
      this.$container[0].olay = this;
      this.$container.height();
      this.$container.addClass('js-olay-show').scrollTop(0);

      // Delegate events, ensuring no double-binding.
      delegate(this.$container, 'click', this._$containerClick);
      delegate(this.$content, 'click', '.js-olay-hide', this._hide);

      this.$el.trigger('olay:show');
      var duration = this.duration;
      if (!this.duration) return this;
      duration += this.transitionDuration;
      this._timeout = setTimeout(this._hide, duration);
      return this;
    },

    // Hide the olay by removing the `'js-show'` class to the container and then
    // finally removing it from the DOM after `transitionDuration`.
    hide: function () {
      if (!this.$container.hasClass('js-olay-show')) return;
      clearTimeout(this._timeout);
      this.$container.removeClass('js-olay-show');
      var duration = this.transitionDuration;
      if (!duration) return this._remove();
      var self = this;
      this._timeout = setTimeout(function () { self._remove(); }, duration);
      return this;
    },

    // Use this method to set or update `$el`.
    setElement: function (el) {
      this.$content.empty().append(this.$el = el instanceof $ ? el : $(el));
      return this;
    },

    // Completely remove the `$container` element and its children and all of
    // the associated data and events. This will only ever need to be called if
    // the `preserve` option is `true` to prevent memory leaks.
    destroy: function () {
      this.$container.remove();
      return this;
    },

    // Append `$container` to the DOM. Used internally.
    _append: function () {
      var $body = $('body');
      var $olays = $('.js-olay-container');
      var active = document.activeElement;
      var useLast = $olays.length && active === $body[0];
      this._$active = useLast ? $olays.last() : $(active);
      $(tabbable).each(function () {
        if ('olayTabindex' in this) return;
        var $self = $(this);
        this.olayTabindex = $self.attr('tabindex') || null;
        $self.attr('tabindex', -1);
      });
      $body.addClass('js-olay-visible').append(this.$container);
      this.$content.attr('tabindex', 0).focus().removeAttr('tabindex');
      return this;
    },

    // Detach and optionally remove `$container` from the DOM. Used internally.
    _remove: function () {
      this.$container.detach();
      this._$active.attr('tabindex', 0).focus().removeAttr('tabindex');
      var $olays = $('.js-olay-container');
      ($olays.length ? $olays.last() : $('body').removeClass('js-olay-visible'))
        .find(tabbable).each(function () {
          $(this).attr('tabindex', this.olayTabindex);
          delete this.olayTabindex;
        });
      this.$el.trigger('olay:hide');
      if (!this.preserve) this.destroy();
      return this;
    }
  };

  // Extend `Olay.prototype`.
  for (var name in proto) Olay.prototype[name] = proto[name];

  return Olay;
});

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('orgsync-javascript-api',['jquery', 'underscore'], factory);
  } else if (typeof exports !== 'undefined') {
    module.exports =
      factory(null, require('underscore'), require('superagent'));
  } else {
    root.OrgSyncApi = factory(root.jQuery, root._, root.superagent);
  }
})(this, function ($, _, superagent) {
  

  var methods = ['get', 'post', 'patch', 'put', 'delete'];

  var OrgSyncApi = function (options) { _.extend(this, options); };

  _.extend(OrgSyncApi.prototype, {

    // https://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
    cors: XMLHttpRequest && 'withCredentials' in new XMLHttpRequest(),

    urlRoot: 'http://mobile-staging.orgsync.com/user_api/v1',

    req: function (method, path, data, cb) {
      if (!cb) cb = data;
      if (!_.isObject(data)) data = {};
      if (this.key) data.key = this.key;
      var url = this.urlRoot + path;
      if (superagent && this.cors) {
        return this.superagentReq(method, url, data, cb);
      }
      return this.jQueryReq(method, url, data, cb);
    },

    superagentReq: function (method, url, data, cb) {
      return superagent[method.toLowerCase()](url)
        .send(data)
        .end(function (er, res) {
          if (er) return cb(er, res);
          if (!res.ok) return cb(new Error(res.body.error), res);
          cb(null, res);
        });
    },

    jQueryReq: function (method, url, data, cb) {
      return $.ajax({
        type: this.cors ? method.toUpperCase() : 'GET',
        url: url,
        dataType: this.cors ? 'json': 'jsonp',
        contentType: 'application/json',
        data: data,
        success: function (res) {
          if (res.error) return cb(new Error(res.error));
          cb(null, res);
        },
        error: function (xhr) { cb(new Error(xhr.responseText)); }
      });
    },

    login: function (communityId, username, password, cb) {
      var self = this;
      this.post('/authentication/login', {
        device_info: 'OrgSync API JavaScript Client',
        community_id: communityId,
        username: username,
        password: password
      }, function (er, res) {
        if (er) return cb(er);
        self.key = res.body.key;
        cb(null, res);
      });
    }
  }, _.reduce(methods, function (obj, method) {
    obj[method] = function (path, data, cb) {
      return this.req(method, path, data, cb);
    };
    return obj;
  }, {}));

  return OrgSyncApi;
});

// scripts/app.es6
define(
  'app',["jquery","config","underscore","dpr","elementQuery","herit","jstz","moment","olay","orgsync-javascript-api","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __exports__) {
    
    var $ = __dependency1__["default"] || __dependency1__;
    var config = __dependency2__["default"] || __dependency2__;
    var _ = __dependency3__["default"] || __dependency3__;
    var dpr = __dependency4__["default"] || __dependency4__;
    var elementQuery = __dependency5__["default"] || __dependency5__;
    var herit = __dependency6__["default"] || __dependency6__;
    var jstz = __dependency7__["default"] || __dependency7__;
    var moment = __dependency8__["default"] || __dependency8__;
    var Olay = __dependency9__["default"] || __dependency9__;
    var OrgSyncApi = __dependency10__["default"] || __dependency10__;

    // Define our global namespace.
    var app = {
      api: new OrgSyncApi(config.api),

      // Views will add themselves to this map with their corresponding selectors.
      // i.e. {'.js-osw-index-portals': app.IndexPortalsView}
      selectorViewMap: {},

      // In the ready function, run through the selectorViewMap and initialize
      // views accordingly.
      ready: function () {
        $('html').addClass('dpr-' + dpr());
        _.each(app.selectorViewMap, function (view, selector) {
          $(selector).each(function () { new view({el: this}); });
        });
      },

      // Only calculate the current timezone name once.
      tz: jstz.determine().name()
    };

    // requestAnimationFrame shim.
    _.each(['webkit', 'moz'], function (vendor) {
      if (window.requestAnimationFrame) return;
      window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
      window.cancelAnimationFrame =
        window[vendor + 'CancelAnimationFrame'] ||
        window[vendor + 'CancelRequestAnimationFrame'];
    });
    if (!window.requestAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (cb) {
        var now = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (now - lastTime));
        var id = window.setTimeout(_.partial(cb, now + timeToCall), timeToCall);
        lastTime = now + timeToCall;
        return id;
      };
      window.cancelAnimationFrame = clearTimeout;
    }

    Olay = herit(Olay, {
      constructor: function () {
        Olay.apply(this, arguments);
        this.$content.addClass('orgsync-widget');
      }
    });

    // Tell elementQuery to keep track of sizes for `.orgsync-widget`s
    elementQuery({
      '.orgsync-widget': {
        'min-width': [
          '231px',
          '251px',
          '401px',
          '461px',
          '480px',
          '501px',
          '640px',
          '691px',
          '751px',
          '800px',
          '921px',
          '960px',
          '1001px'
        ]
      }
    });

    // Fixing the updateOffset method for some wonky DST issues.
    moment.updateOffset = function (date) {
      if (!date._z) return;
      var delta = date.zone();
      var offset = date._z.offset(date);
      if (!(delta -= offset)) return;
      date.zone(offset);
      if (Math.abs(delta) <= 60) date.subtract('minutes', delta);
    };

    $(app.ready);

    __exports__["default"] = app;
  });
    return require('app');
  }).call({});
}));
