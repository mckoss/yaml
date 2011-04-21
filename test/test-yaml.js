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

    var tests = {
        "sequence": {yaml: "---\n- one\n- two", data: ["one", "two"]},
        "mapping": {yaml: "---\none: two", data: {"one": "two"}},
        "nested sequence": {yaml: "- one\n - two\n- three",
                            data: ["one", ["two"], "three"]},
        "nested mapping": {yaml: "one:\n two: three",
                           data: {"one": {"two": "three"}}},
        "hanging nested sequence": {yaml: "-\n - one\n-\n - two",
                                    data: [["one"], ["two"]]}
    };

    ut.test("parse", function () {
        testCases(tests);
    });

    ut.test("spec tests", function () {
        testCases(specTests.tests);
    });

    ut.test("stringify", function () {
        ut.equal(yaml.stringify(['one', 'two']), "---\n- one\n- two\n");
    });

    coverage.testCoverage();

    function testCases(tests) {
       for (var name in tests) {
           var test = tests[name];
           var data = yaml.parse(test.yaml)[0];
           ut.deepEqual(data, test.data, name);
       }
    }
});
