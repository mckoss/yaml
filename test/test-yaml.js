namespace.module('org.startpad.yaml.test', function (exports, require) {
    var ut = require('com.jquery.qunit');
    var utCoverage = require('org.startpad.qunit.coverage');
    var types = require('org.startpad.types');
    var yaml = require('org.startpad.yaml');
    var specTests = require('org.startpad.yaml.test-cases');

    ut.module('org.startpad.yaml');

    var coverage;

    coverage = new utCoverage.Coverage('org.startpad.yaml');

    ut.test("version", function () {
        var version = yaml.VERSION.split('.');
        ut.equal(version.length, 3, "VERSION has 3 parts");
        ut.ok(version[0] == 0 && version[1] == 1, "tests for version 0.1");
        ut.equal();
    });

    ut.test("token", function() {
        var tests = [
            ['hello: there', 'hello'],
            ['hello there: 1', 'hello there'],
            ['this:is', 'this'],
            ['this-is-a-test: 1', 'this-is-a-test'],
            ['end}', 'end'],
            ['end]', 'end'],
            ['element ,', 'element'],
            ['element,', 'element'],
            ['tag : foo', 'tag'],
            ['"tag" : foo', '"tag"'],
            ['', ''],
            [' yes spaces', 'yes spaces'],
            ['- a token', '-'],
            ['---', '---'],
            ['...', '...'],
            ['a.token: 1', 'a.token'],
            ['"hello": 1', '"hello"'],
            ['"{}[],:": 1', '"{}[],:"'],
            ['"hello\\"quote": 1', '"hello\\"quote"'],
            ['"single\\\\slash"', '"single\\\\slash"'],
            ["'single': 1", '"single"'],
            ["'single\"quote': 1", '"single\\"quote"'],
            ["'single''s quote': 1", '"single\'s quote"'],
            ["'single\\slash'", '"single\\\\slash"']
        ];
        for (var i = 0; i < tests.length; i++) {
            var test = tests[i];
            var parsed = yaml.parseToken(test[0]);
            ut.equal(parsed.match, test[1]);
        }
    });

    var simpleTests = {
        "sequence": {yaml: "---\n- one\n- two", data: ["one", "two"]},
        "mapping": {yaml: "---\none: two", data: {"one": "two"}},
        "quoted mapping": {yaml: "one: 'value\"quote'", data: {"one": 'value"quote'}},
        "nested sequence": {yaml: "- one\n - two\n- three",
                            data: ["one", ["two"], "three"]},
        "nested mapping": {yaml: "one:\n two: three",
                           data: {"one": {"two": "three"}}},
        "hanging nested sequence": {yaml: "-\n - one\n-\n - two",
                                    data: [["one"], ["two"]]},
        "empty node": {yaml: "- one\n-\n- two",
                       data: ["one", null, "two"]},
        "hanging sequence value": {yaml: "-\n one",
                                   data: ["one"]},
        "hanging map in sequence": {yaml: "-\n  one: two\n  three: four",
                                    data: [{"one": "two", "three": "four"}]},
        "nested map in sequence": {yaml: "- one: two\n  three: four",
                                    data: [{"one": "two", "three": "four"}]},
        "hanging map value": {yaml: "one:\n two",
                              data: {"one": "two"}},
        "flow sequence": {yaml: "[one, two, three]",
                          data: ["one", "two", "three"]},
        "flow map": {yaml: "{one: two}",
                     data: {"one": "two"}},
        "flow in sequence": {yaml: "- [one, two]\n- three",
                             data: [["one", "two"], "three"]}
    };

    ut.test("parse", function () {
        testCases(simpleTests);
    });

    ut.test("spec tests", function () {
        delete specTests.tests['2.10'];  // Repeated nodes
        delete specTests.tests['2.19'];  // Non-decimal numbers
        delete specTests.tests['2.26'];  // Ordered mappings
        testCases(specTests.tests);
    });

    ut.test("stringify", function () {
        ut.equal(yaml.stringify(['one', 'two']), "---\n- one\n- two\n");
    });

    coverage.testCoverage();

    function testCases(tests) {
        var data;
        for (var name in tests) {
            var test = tests[name];
            try {
                data = yaml.parse(test.yaml)[0];
            } catch (e) {
                ut.ok(false, name + ": Exception: " + e.message);
                continue;
            }
            ut.deepEqual(data, test.data, name);
        }
    }
});
