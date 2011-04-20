/* yaml.js - JavaScript YAML encoding and decoding.

   MIT License by Mike Koss, April 2011
*/
var types = require('org.startpad.types');
require('org.startpad.funcs').patch();

exports.extend({
    'VERSION': '0.1.0',
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
        this.indents = [];
        this.lastIndent = 0;
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

    pop: function () {
        this.json += this.stack.pop();
    },

    value: function (value) {
        this.json += '"' + value + '"';
    }
});

var tokens = [
    [/^---$/, function beginDoc(match) {
        this.beginDoc();
     }],

    [/^\.\.\.$/, function enddoc(match) {
        this.endDoc();
    }],

    [/^-[ \n](.*)$/, function element(match) {
        if (this.indent > this.lastIndent) {
            this.json += '[';
            this.value(match[1]);
            this.stack.push(']');
            return;
        }
        if (this.stack.slice(-1)[0] != ']') {
            this.json += '[';
            this.stack.push(']');
        } else {
            this.json += ',';
        }
        this.value(match[1]);
    }]
];

function jsonFromYaml(s) {
    var context = new Context();
    var lines = s.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        context.indent = indent(s);
        line = line.slice(indent);

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
