/* yaml.js - JavaScript YAML encoding and decoding.

   MIT Licensed by Mike Koss, April 2011
*/
var types = require('org.startpad.types');
require('org.startpad.funcs').patch();

exports.extend({
    'VERSION': '0.1.0r1',
    'parse': parse,
    'stringify': stringify
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
        this.push({state: 'value'});
    },

    indent: function (n) {
        while (this.peek().indent > n) {
            this.pop();
        }
        if (this.peek().state == 'value') {
            this.peek().indent = n;
        } else if (n > this.peek().indent) {
            if (this.peek().children > 0) {
                this.json += ',';
            }
            this.push({indent: n, state: 'container'});
        }
    },

    beginDoc: function () {
        if (this.json != '') {
            this.docs.push(json);
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

        if (top.state == 'container' && top.children > 0) {
            this.json += ',';
        }

        if (top.state == 'value') {
            this.push({indent: top.indent, state: 'container'});
            top = this.peek();
        }

        // top.state == 'container'
        if (top.open == undefined) {
            types.extend(top, {open: open, close: close, children: 0});
        }

        if (top.open != open) {
            this.error("Mismatched element - expected " + top.close + " before " + open);
        }

        if (top.children++ == 0) {
            this.json += open;
        }
    },

    peek: function () {
        if (this.stack.length == 0) {
            return {indent: -1};
        }
        return this.stack.slice(-1)[0];
    },

    push: function(data) {
        this.stack.push(data);
    },

    pop: function () {
        var top = this.stack.pop();
        if (top.state == 'container') {
            this.json += top.close;
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
            // BUG: Need to confirm parses as a valid string
            this.json += value;
        }
        this.json += quote(value);
    },

    error: function (message) {
        throw new Error("Line " + this.lineNumber + ": " + message);
    }
});

var tokens = [
    [/^---$/, function beginDoc(match) {
        this.beginDoc();
    }],

    [/^\.\.\.$/, function endDoc(match) {
        this.endDoc();
    }],

    [/^- +(.*)$/, function sequenceElement(match) {
        this.ensureContainer('[', ']');
        this.value(match[1]);
    }],

    [/^-$/, function sequenceElement(match) {
        this.ensureContainer('[', ']');
        this.push({state: 'value'});
    }],

    [/([^:]+) *: +([^ ]+)$/, function taggedElement(match) {
        this.ensureContainer('{', '}');
        this.string(match[1]);
        this.json += ':';
        this.value(match[2]);
    }],

    [/([^:]+) *:$/, function taggedObject(match) {
        this.ensureContainer('{', '}');
        this.string(match[1]);
        this.json += ':';
        this.push({state: 'value'});
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

        for (var t = 0; t < tokens.length; t++) {
            var match = tokens[t][0].exec(line);
            if (!match) {
                continue;
            }
            var fn = tokens[t][1];
            console.log(types.getFunctionName(fn));
            fn.call(context, match);
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
