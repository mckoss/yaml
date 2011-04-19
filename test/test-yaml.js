namespace.module('org.startpad.yaml.test', function (exports, require) {
    var ut = require('com.jquery.qunit');
    var utCoverage = require('org.startpad.qunit.coverage');
    var types = require('org.startpad.types');
    var yaml = require('org.startpad.yaml');

    ut.module('org.startpad.yaml');

    var coverage;

    coverage = new utCoverage.Coverage('org.startpad.yaml');

    ut.test("version", function () {
        var version = yaml.VERSION.split('.');
        ut.equal(version.length, 3, "VERSION has 3 parts");
        ut.ok(version[0] == 0 && version[1] == 1, "tests for version 0.1");
        ut.equal();
    });

    ut.test("parse", function () {
        ut.deepEqual(yaml.parse("---\n- one\n- two"), ['one', 'two']);
    });

    ut.test("stringify", function () {
        ut.equal(yaml.stringify(['one', 'two']), "---\n- one\n- two\n");
    });

    coverage.testCoverage();
});
