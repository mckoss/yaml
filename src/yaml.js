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

function Context() {
    this.docs = [];
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

    indent: function (n) {
        this.currentIndent = n;
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
    
    parseFlow: function (s) {
        var isMap = s[0] == '{';
        var end = isMap ? '}' : ']';
        var parsed;
        while (s[0] != end) {
            this.json += s[0];
            s = s.slice(1);
            if (isMap) {
                parsed = parseToken(s);
                this.string(parsed.match);
                s = s.slice(parsed.len);
                if (s[0] != ':') {
                    this.error("Missing ':' separator.");
                }
                this.json += ':';
                s = s.slice(1);
            }
            parsed = parseToken(s);
            this.value(parsed.match);
            s = s.slice(parsed.len);
        }
        this.json += end;
    },

    error: function (message) {
        throw new Error("Line " + this.lineNumber + ": " + message);
    }
});

var tokens = [
    ['---', /^$/, function beginDoc(match) {
        this.beginDoc();
    }],

    ['...', /^$/, function endDoc(match) {
        this.endDoc();
    }],

    ['-', /^(\{|\[.*)$/, function sequenceFlow(match) {
        this.ensureContainer('[', ']');
        this.parseFlow(match[1]);
    }],

    ['-', /^(.+)$/, function sequenceElement(match) {
        this.ensureContainer('[', ']');
        this.value(match[1]);
    }],

    ['-', /^$/, function sequenceObject(match) {
        this.ensureContainer('[', ']');
        this.push({state: 'value', value: 'null'});
    }],

    [true, /^: +(\{|\[.+)$/, function taggedFlow(match, token) {
        this.ensureContainer('{', '}');
        this.string(token);
        this.json += ':';
        this.parseFlow(match[1]);
    }],

    [true, /^: +(.+)$/, function taggedElement(match, token) {
        this.ensureContainer('{', '}');
        this.string(token);
        this.json += ':';
        this.value(match[1]);
    }],

    [true, /^:$/, function taggedObject(match, token) {
        this.ensureContainer('{', '}');
        this.string(token);
        this.json += ':';
        this.push({state: 'value', value: 'null'});
    }],

    ['', /^(\{|\[.*)$/, function valueFlow(match) {
        this.parseFlow(match[1]);
        this.peek().value = undefined;
        this.pop();
    }],

    [true, /^$/, function value(match, token) {
        var top = this.peek();
        if (top.state != 'value') {
            this.error("Value seen when element expected.");
        }
        top.value = token;
        this.pop();
    }]
];

function jsonFromYaml(s) {
    var context = new Context();
    var lines = s.split('\n');

    for (var i = 0; i < lines.length; i++) {
        context.lineNumber = i + 1;
        var line = lines[i];
        context.indent(indent(line));
        line = line.slice(context.indent);
        line = line.replace(/#.*$/, '');
        line = strip(line);
        if (line.length == 0) {
            continue;
        }

        // Parse and remove prefix token
        var parsed = parseToken(line);
        var token = parsed.match;
        line = strip(line.slice(parsed.len));

        for (var t = 0; t < tokens.length; t++) {
            if (!(tokens[t][0] === true || tokens[t][0] == token)) {
                continue;
            }
            var match = tokens[t][1].exec(line);
            if (!match) {
                continue;
            }
            var fn = tokens[t][2];
            console.log(types.getFunctionName(fn));
            fn.call(context, match, token);
            break;
        }
    }
    context.endDoc();
    return context.docs;
}

// Count the number of leading spaces.
function indent(s) {
    var match = /^ */.exec(s);
    return match[0].length;
}

function strip(s) {
    return (s || "").replace(/^\s+|\s+$/g, "");
}

function quote(s) {
    return '"' + s.replace(/"/g, '\\"') + '"';
}

function token(s, i) {
    if (i == undefined) {
        i = 0;
    }
    var match = /\s*([^\s:,\{\[\}\]\"])|"((?:[^\"]+|\\.)*)"/.exec(s);
}

var reserved = /^\s*(-|---|\.\.\.)\s+/;
var quoted = /^\s*("(?:[^"\\]|\\.)*")\s*/;
var single = /^\s*'((?:[^'])*)'\s*/;
var unquoted = /^\s*([^{}\[\],:]+)\s*/;

function parseToken(s) {
    var match;
    match = reserved.exec(s);
    if (match) {
        return {len: match[0].length, match: match[1]};
    }
    match = quoted.exec(s);
    if (match) {
        return {len: match[0].length, match: match[1]};
    }
    match = single.exec(s);
    if (match) {
        var match2 = match[1].replace('\\', '\\\\').replace('"', '\\"');
        return {len: match[0].length, match: '"' + match2 + '"'};
    }
    match = unquoted.exec(s);
    if (match) {
        return {len: match[0].length, match: strip(match[1])};
    }
    return {len: 0, match: ''};
}
