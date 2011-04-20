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
            docs[i] = e;
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

Context.methods({
    initDoc: function () {
        this.json = '';
        this.stack = [];
    },

    indent: function (n) {
        while (this.peek().indent > n) {
            this.pop();
        }
        if (n > this.peek().indent) {
            this.push(n);
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
        if (this.peek().open != undefined) {
            if (this.peek().open == open) {
                this.json += ',';
                return;
            }
            this.error(this.peek().open + " not closed before " + open);
        }
        this.json += open;
        types.extend(this.peek(), {open: open, close: close});
    },

    peek: function () {
        if (this.stack.length == 0) {
            return {indent: -1};
        }
        return this.stack.slice(-1)[0];
    },

    push: function (n) {
        this.stack.push({indent: n});
    },

    pop: function () {
        var top = this.stack.pop();
        this.json += top.close;
        this.lastIndent = top.indent;
    },

    value: function (value) {
        this.json += '"' + value + '"';
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

    [/^-[ \n](.*)$/, function element(match) {
        this.ensureContainer('[', ']');
        this.value(match[1]);
    }],

    [/([^:]+) *: +([^ ]+)$/, function tagged(match) {
        this.ensureContainer('{', '}');
        this.value(match[1]);
        this.json += ':';
        this.value(match[2]);
    }]
];

function jsonFromYaml(s) {
    var context = new Context();
    var lines = s.split('\n');

    for (var i = 0; i < lines.length; i++) {
        context.lineNumber = i + 1;
        var line = lines[i];
        context.indent(indent(s));
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

        context.lastIndent = context.indent;
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
