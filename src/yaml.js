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
        while (true) {
            if (this.lineNumber >= this.lines.length) {
                return false;
            }
            this.line = this.lines[this.lineNumber++];
            var spaces = /^ */.exec(this.line)[0].length;
            this.setIndent(spaces);
            this.line = this.line.slice(spaces);
            this.line = strip(this.line.replace(/#.*$/, ''));
            if (this.line.length != 0) {
                break;
            }
        }
        return true;
    },

    nextToken: function () {
        while (true) {
            var parsed = parseToken(this.line);
            var token = parsed.match;
            this.line = this.line.slice(parsed.len);
            if (token != '') {
                return token;
            }
            if (!this.readLine()) {
                return '';
            }
        }
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
        throw new Error("Line " + this.lineNumber + ": " + message);
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
        this.value(this.nextToken());
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

    [true, /^$/, function value(token) {
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

var reserved = /^\s*(-|---|\.\.\.)\s+/;
var flowChars = /^\s*([\{\[\}\],:])\s*/;
var quoted = /^\s*("(?:[^"\\]|\\.)*")\s*/;
var single = /^\s*'((?:[^'])*)'\s*/;
var unquoted = /^\s*([^\{\}\[\],:]+)\s*/;
var tokenTypes = [reserved, flowChars, quoted, single, unquoted];

function parseToken(s) {
    for (var i = 0; i < tokenTypes.length; i++) {
        var pattern = tokenTypes[i];
        var match = pattern.exec(s);
        if (match) {
            if (pattern == single) {
                match[1] = '"' + match[1].replace('\\', '\\\\').replace('"', '\\"') + '"';
            }
            return {len: match[0].length, match: strip(match[1])};
        }
    }
    return {len: 0, match: ''};
}
