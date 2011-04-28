/* Source: src/namespace-plus.js */
/* Source: src/namespace.js */
/* Namespace.js - modular namespaces in JavaScript

   by Mike Koss - placed in the public domain
*/

(function(global) {
    var globalNamespace = global['namespace'];
    var VERSION = '3.0.1';

    function Module() {}

    function numeric(s) {
        if (!s) {
            return 0;
        }
        var a = s.split('.');
        return 10000 * parseInt(a[0]) + 100 * parseInt(a[1]) + parseInt(a[2]);
    }

    if (globalNamespace) {
        if (numeric(VERSION) <= numeric(globalNamespace['VERSION'])) {
            return;
        }
        Module = globalNamespace.constructor;
    } else {
        global['namespace'] = globalNamespace = new Module();
    }
    globalNamespace['VERSION'] = VERSION;

    function require(path) {
        path = path.replace(/-/g, '_');
        var parts = path.split('.');
        var ns = globalNamespace;
        for (var i = 0; i < parts.length; i++) {
            if (ns[parts[i]] === undefined) {
                ns[parts[i]] = new Module();
            }
            ns = ns[parts[i]];
        }
        return ns;
    }

    var proto = Module.prototype;

    proto['module'] = function(path, closure) {
        var exports = require(path);
        if (closure) {
            closure(exports, require);
        }
        return exports;
    };

    proto['extend'] = function(exports) {
        for (var sym in exports) {
            if (exports.hasOwnProperty(sym)) {
                this[sym] = exports[sym];
            }
        }
    };
}(this));
/* Source: src/types.js */
namespace.module('org.startpad.types', function (exports, require) {
exports.extend({
    'VERSION': '0.1.0',
    'isArguments': function (value) { return isType(value, 'arguments'); },
    'isArray': function (value) { return isType(value, 'array'); },
    'copyArray': copyArray,
    'isType': isType,
    'typeOf': typeOf,
    'extend': extend,
    'project': project,
    'getFunctionName': getFunctionName
});

// Can be used to copy Arrays and Arguments into an Array
function copyArray(arg) {
    return Array.prototype.slice.call(arg);
}

var baseTypes = ['number', 'string', 'boolean', 'array', 'function', 'date',
                 'regexp', 'arguments', 'undefined', 'null'];

function internalType(value) {
    return Object.prototype.toString.call(value).match(/\[object (.*)\]/)[1].toLowerCase();
}

function isType(value, type) {
    return typeOf(value) == type;
}

// Return one of the baseTypes as a string
function typeOf(value) {
    if (value === undefined) {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    var type = internalType(value);
    if (baseTypes.indexOf(type) == -1) {
        type = typeof(value);
    }
    return type;
}

// IE 8 has bug that does not enumerates even own properties that have
// these internal names.
var enumBug = !{toString: true}.propertyIsEnumerable('toString');
var internalNames = ['toString', 'toLocaleString', 'valueOf',
                     'constructor', 'isPrototypeOf'];

// Copy the (own) properties of all the arguments into the first one (in order).
function extend(dest) {
    var i, j;
    var source;
    var prop;

    if (dest === undefined) {
        dest = {};
    }
    for (i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                dest[prop] = source[prop];
            }
        }
        if (!enumBug) {
            continue;
        }
        for (j = 0; j < internalNames.length; j++) {
            prop = internalNames[j];
            if (source.hasOwnProperty(prop)) {
                dest[prop] = source[prop];
            }
        }
    }
    return dest;
}

// Return new object with just the listed properties "projected"
// into the new object.  Ignore undefined properties.
function project(obj, props) {
    var result = {};
    for (var i = 0; i < props.length; i++) {
        var name = props[i];
        if (obj && obj.hasOwnProperty(name)) {
            result[name] = obj[name];
        }
    }
    return result;
}

function getFunctionName(fn) {
    if (typeof fn != 'function') {
        return undefined;
    }
    var result = fn.toString().match(/function\s*(\S+)\s*\(/);
    if (!result) {
        return '';
    }
    return result[1];
}
});

/* Source: src/funcs.js */
namespace.module('org.startpad.funcs', function (exports, require) {
var types = require('org.startpad.types');

exports.extend({
    'VERSION': '0.3.0',
    'methods': methods,
    'bind': bind,
    'decorate': decorate,
    'create': Object.create || create,
    'subclass': subclass,
    'mro': mro,
    'numericVersion': numericVersion,
    'monkeyPatch': monkeyPatch,
    'patch': patch
});

// Convert 3-part version number to comparable integer.
// Note: No part should be > 99.
function numericVersion(s) {
    if (!s) {
        return 0;
    }
    var a = s.split('.');
    return 10000 * parseInt(a[0]) + 100 * parseInt(a[1]) + parseInt(a[2]);
}

// Monkey patch additional methods to constructor prototype, but only
// if patch version is newer than current patch version.
function monkeyPatch(ctor, by, version, patchMethods) {
    if (ctor._patches) {
        var patchVersion = ctor._patches[by];
        if (numericVersion(patchVersion) >= numericVersion(version)) {
            return;
        }
    }
    ctor._patches = ctor._patches || {};
    ctor._patches[by] = version;
    methods(ctor, patchMethods);
}

function patch() {
    monkeyPatch(Function, 'org.startpad.funcs', exports.VERSION, {
        'methods': function (obj) { methods(this, obj); },
        'curry': function () {
            var args = [this, undefined].concat(types.copyArray(arguments));
            return bind.apply(undefined, args);
        },
        'curryThis': function (self) {
            var args = types.copyArray(arguments);
            args.unshift(this);
            return bind.apply(undefined, args);
        },
        'decorate': function (decorator) {
            return decorate(this, decorator);
        },
        'subclass': function(parent, extraMethods) {
            subclass(this, parent, extraMethods);
        },
        'mro': function(ctors, extraMethods) {
            ctors.unshift(this);
            mro(ctors, extraMethods);
        }
    });
    return exports;
}

// Copy methods to a Constructor Function's prototype
function methods(ctor, obj) {
    types.extend(ctor.prototype, obj);
}

// Bind 'this' and/or arguments and return new function.
// Differs from native bind (if present) in that undefined
// parameters are merged.
function bind(fn, self) {
    var presets;

    // Handle the monkey-patched and in-line forms of curry
    if (arguments.length == 3 && types.isArguments(arguments[2])) {
        presets = Array.prototype.slice.call(arguments[2], self1);
    } else {
        presets = Array.prototype.slice.call(arguments, 2);
    }

    function merge(a1, a2) {
        var merged = types.copyArray(a1);
        a2 = types.copyArray(a2);
        for (var i = 0; i < merged.length; i++) {
            if (merged[i] === undefined) {
                merged[i] = a2.shift();
            }
        }
        return merged.concat(a2);
    }

    return function curried() {
        return fn.apply(self || this, merge(presets, arguments));
    };
}

// Wrap the fn function with a generic decorator like:
//
// function decorator(fn, arguments, wrapper) {
//   if (fn == undefined) { ... init ...; return;}
//   ...
//   result = fn.apply(this, arguments);
//   ...
//   return result;
// }
//
// The decorated function is created for each call
// of the decorate function.  In addition to wrapping
// the decorated function, it can be used to save state
// information between calls by adding properties to it.
function decorate(fn, decorator) {
    function decorated() {
        return decorator.call(this, fn, arguments, decorated);
    }
    // Init call - pass undefined fn - but available in this
    // if needed.
    decorator.call(fn, undefined, arguments, decorated);
    return decorated;
}

// Create an empty object whose __proto__ points to the given object.
// It's properties will "shadow" those of the given object until modified.
function create(obj) {
    function Create() {}
    Create.prototype = obj;
    return new Create();
}

// Classical JavaScript single-inheritance pattern.
// Call super constructor via this._super(args);
// Call super methods via this._proto.method.call(this, args)
function subclass(ctor, parent, extraMethods) {
    ctor.prototype = exports.create(parent.prototype);
    ctor.prototype.constructor = ctor;
    methods(ctor, extraMethods);
    return ctor;
}

// Define method resolution order for multiple inheritance.
// Builds a custom prototype chain, where each constructor's
// prototype appears exactly once.
function mro(ctors, extraMethods) {
    var parent = ctors.pop().prototype;
    var ctor;
    while (ctors.length > 0) {
        ctor = ctors.pop();
        var ctorName = types.getFunctionName(ctor);
        var proto = exports.create(parent);
        types.extend(proto, ctor.prototype);
        proto.constructor = ctor;
        proto[ctorName + '_super'] = parent;
        parent = proto;
    }
    ctor.prototype = parent;
    methods(ctor, extraMethods);
}
});

/* Source: src/string.js */
namespace.module('org.startpad.string', function (exports, require) {
var funcs = require('org.startpad.funcs');

exports.extend({
    'VERSION': '0.3.0',
    'patch': patch,
    'format': format,
    'strip': strip
});

function patch() {
    funcs.monkeyPatch(String, 'org.startpad.string', exports.VERSION, {
        'format': function formatFunction () {
            if (arguments.length == 1 && typeof arguments[0] == 'object') {
                return format(this, arguments[0]);
            } else {
                return format(this, arguments);
            }
        }
    });
    return exports;
}

var reFormat = /\{\s*([^} ]+)\s*\}/g;

// Format a string using values from a dictionary or array.
// {n} - positional arg (0 based)
// {key} - object property (first match)
// .. same as {0.key}
// {key1.key2.key3} - nested properties of an object
// keys can be numbers (0-based index into an array) or
// property names.
function format(st, args, re) {
    re = re || reFormat;
    if (st == undefined) {
        return "undefined";
    }
    st = st.toString();
    st = st.replace(re, function(whole, key) {
        var value = args;
        var keys = key.split('.');
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            var n = parseInt(key);
            if (!isNaN(n)) {
                value = value[n];
            } else {
                value = value[key];
            }
            if (value == undefined) {
                return "";
            }
        }
        // Implicit toString() on this.
        return value;
    });
    return st;
}

// Like Python strip() - remove leading/trailing space
function strip(s) {
    return (s || "").replace(/^\s+|\s+$/g, "");
}
});
/* Source: src/yaml.js */
namespace.module('org.startpad.yaml', function (exports, require) {
/* yaml.js - JavaScript YAML encoding and decoding.

   MIT Licensed by Mike Koss, April 2011
*/
var types = require('org.startpad.types');
require('org.startpad.funcs').patch();

exports.extend({
    'VERSION': '0.1.0r1',
    'parse': parse,
    'stringify': stringify,
    'parseToken': parseToken
});

// We always return an array of parsed documents.
function parse(s) {
    var docs = jsonFromYaml(s);
    for (var i = 0; i < docs.length; i++) {
        try {
            console.log("JSON: " + docs[i]);
            docs[i] = JSON.parse(docs[i]);
        } catch (e) {
            console.log("Failed to parse: " + e.message);
        }
    }
    return docs;
}

function stringify(obj) {
    return JSON.stringify(obj);
}

function Context(s) {
    this.docs = [];
    this.lines = s.split('\n');
    this.lineNumber = 0;
    this.initDoc();
}

// We keep a stack of nested state information during the parse.
// States are one of:
// 'value' - Excpecting a single value (scalar) at an indentation
//    level higher than the parent.
// 'container' - Expecting a child element to the parent.
//    When in container mode:
//    close: character used to close the container (']' or '}').
//    children: number of elements in the containter
Context.methods({
    initDoc: function () {
        this.json = '';
        this.stack = [];
        this.currentIndent = -1;
        this.push({state: 'value', value: 'null'});
    },

    readLine: function () {
        while (this.readRawLine()) {
            this.line = strip(this.line.replace(/#.*$/, ''));
            if (this.line.length != 0) {
                this.setIndent(this.spaces);
                return true;
            }
        }
        return false;
    },

    readRawLine: function () {
        if (this.lineNumber >= this.lines.length) {
            return false;
        }
        this.line = this.lines[this.lineNumber++];
        var match = /^( *)(.*)$/.exec(this.line);
        this.spaces = match[1].length;
        this.line = match[2];
        return true;
    },

    nextToken: function () {
        while (true) {
            var parsed = parseToken(this.line);
            var token = parsed.match;
            this.line = this.line.slice(parsed.len);
            this.linePos += parsed.len;
            if (token[0] == '|' || token[0] == '>') {
                return this.readTextBlock(token[0] == '>');
            }
            if (token != '') {
                return token;
            }
            if (!this.readLine()) {
                return '';
            }
        }
    },

    // Multi-line text block
    readTextBlock: function (folded) {
        var s = this.line;
        var sep = '';
        var blockIndent;
        while (this.readRawLine()) {
            if (s != '') {
                sep = folded ? ' ' : '\n';
            }
            if (blockIndent == undefined && this.line.length != 0) {
                blockIndent = this.spaces;
            }
            if (this.spaces < blockIndent) {
                this.lineNumber--;
                return s;
            }
            s += sep + repeat(' ', this.spaces - blockIndent) + this.line;
        }
        return s;
    },

    readDocs: function() {
        while (this.readLine()) {
            var token = this.nextToken();

            for (var t = 0; t < tokens.length; t++) {
                if (!(tokens[t][0] === true || tokens[t][0] == token)) {
                    continue;
                }
                var match = tokens[t][1].exec(this.line);
                if (!match) {
                    continue;
                }
                var fn = tokens[t][2];
                console.log(types.getFunctionName(fn));
                fn.call(this, token);
                break;
            }
        }
        this.endDoc();
    },

    setIndent: function (n) {
        this.currentIndent = n;
        this.linePos = n;
        while (this.peek().indent > n) {
            this.pop();
        }

        // Previous value was null - same indent line
        if (this.peek().state == 'value' && this.peek().indent >= n) {
            this.pop();
        }
    },

    beginDoc: function () {
        if (this.json != '') {
            this.docs.push(this.json);
            this.initDoc();
        }
    },

    endDoc: function () {
        while (this.stack.length != 0) {
            this.pop();
        }
        this.docs.push(this.json);
        this.initDoc();
    },

    ensureContainer: function (open, close) {
        var top = this.peek();

        if (this.currentIndent > top.indent) {
            this.addElement();
            this.push({state: 'container', open: open, close: close, children: 0});
            top = this.peek();
        }

        if (top.open != open) {
            this.error("Mismatched element - expected " + top.close + " before " + open);
        }

        this.addElement();
    },

    addElement: function() {
        var top = this.peek();
        switch (top.state) {
        case 'value':
            top.value = undefined;
            break;
        case 'container':
            if (this.peek().children++ > 0) {
                this.json += ',';
                break;
            }
        }
    },

    peek: function () {
        if (this.stack.length == 0) {
            return {indent: -1};
        }
        return this.stack.slice(-1)[0];
    },

    push: function(data) {
        types.extend(data, {indent: this.currentIndent});
        if (data.state == 'container') {
            this.json += data.open;
        }
        this.stack.push(data);
    },

    pop: function () {
        var top = this.stack.pop();
        if (top.state == 'container') {
            this.json += top.close;
        }
        if (top.state == 'value') {
            if (top.value != undefined) {
                this.value(top.value);
            }
        }
    },

    value: function (value) {
        try {
            value = JSON.parse(value);
            this.json += JSON.stringify(value);
        } catch (e) {
            this.string(value);
        }
    },

    string: function (value) {
        if (/^['"]/.test(value)) {
            var parsed = parseToken(value);
            if (parsed.len != value.length) {
                this.error("Ill-formed string: ->" + value + "<-");
            }
            // BUG: Need to confirm parses as a valid string
            this.json += parsed.match;
            return;
        }
        this.json += quote(value);
    },

    parseFlow: function (token) {
        var isMap = token == '{';
        var end = isMap ? '}' : ']';

        this.json += token;
        token = this.nextToken();

        while (token != end) {
            if (isMap) {
                this.string(token);
                if (this.nextToken() != ':') {
                    this.error("Missing ':' character in flow mapping.");
                }
                this.json += ':';
                token = this.nextToken();
            }
            if (token == '{' || token == '[') {
                this.parseFlow(token);
            } else {
                this.value(token);
            }
            token = this.nextToken();
            if (token == end) {
                this.json += end;
                return;
            }
            if (token == ',') {
                this.json += ',';
                token = this.nextToken();
                continue;
            }
            this.error("Missing ',' character in flow.");
        }
        this.json += end;
    },

    error: function (message) {
        throw new Error("Error on line " + this.lineNumber + ": " + message);
    }
});

var tokens = [
    ['---', /^$/, function beginDoc() {
        this.beginDoc();
    }],

    ['...', /^$/, function endDoc() {
        this.endDoc();
    }],

    ['-', /^[\{\[]/, function sequenceFlow() {
        this.ensureContainer('[', ']');
        this.parseFlow(this.nextToken());
    }],

    ['-', /^(.+)$/, function sequenceElement() {
        this.ensureContainer('[', ']');
        var linePos = this.linePos;
        var value = this.nextToken();
        // Simple value
        if (this.line.length == 0) {
            this.value(value);
            return;
        }
        // Nested map in a sequence - treat same as hanging sequence
        // with first map element read.
        if (this.line[0] == ':') {
            this.push({state: 'value', value: 'null'});
            this.setIndent(linePos);
            this.ensureContainer('{', '}');
            this.string(value);
            this.json += ':';
            this.nextToken();
            this.value(this.nextToken());
            return;
        }
        this.error("Invalid sequence element.");
    }],

    ['-', /^$/, function sequenceObject() {
        this.ensureContainer('[', ']');
        this.push({state: 'value', value: 'null'});
    }],

    [true, /^: +[\{\[]/, function taggedFlow(token) {
        this.ensureContainer('{', '}');
        this.string(token);
        this.json += ':';
        this.nextToken();
        this.parseFlow(this.nextToken());
    }],

    [true, /^: /, function taggedElement(token) {
        this.ensureContainer('{', '}');
        this.string(token);
        this.json += ':';
        this.nextToken();
        this.value(this.nextToken());
    }],

    [true, /^:$/, function taggedObject(token) {
        this.ensureContainer('{', '}');
        this.string(token);
        this.json += ':';
        this.nextToken();
        this.push({state: 'value', value: 'null'});
    }],

    ['[', /^(.*)$/, function valueFlowSeq() {
        this.parseFlow('[');
        this.peek().value = undefined;
        this.pop();
    }],

    ['{', /^(.*)$/, function valueFlowMap() {
        this.parseFlow('{');
        this.peek().value = undefined;
        this.pop();
    }],

    [true, /^/, function value(token) {
        var top = this.peek();
        if (top.state != 'value') {
            this.error("Value seen when element expected.");
        }
        top.value = token;
        this.pop();
    }]
];

function jsonFromYaml(s) {
    var context = new Context(s);
    context.readDocs();
    return context.docs;
}

function strip(s) {
    return (s || "").replace(/^\s+|\s+$/g, "");
}

function quote(s) {
    return '"' + s.replace(/"/g, '\\"') + '"';
}

function repeat(s, times) {
    return new Array(times + 1).join(s);
}

var reserved = /^\s*(-|---|\.\.\.)\s+/;
var flowChars = /^\s*([\{\[\}\],:])\s*/;
var quoted = /^\s*("(?:[^"\\]|\\.)*")\s*/;
var single = /^\s*'((?:[^']|'')*)'\s*/;
var blockChars = /^\s*([\|>][\-\+]?)\s*/;
var unquoted = /^\s*([^\{\}\[\],:]+)\s*/;
var tokenTypes = [reserved, flowChars, quoted, single, blockChars, unquoted];

function parseToken(s) {
    for (var i = 0; i < tokenTypes.length; i++) {
        var pattern = tokenTypes[i];
        var match = pattern.exec(s);
        if (match) {
            if (pattern == single) {
                match[1] = '"' + match[1].replace("''", "'")
                                         .replace('\\', '\\\\')
                                         .replace('"', '\\"') + '"';
            }
            return {len: match[0].length, match: strip(match[1])};
        }
    }
    return {len: 0, match: ''};
}
});
