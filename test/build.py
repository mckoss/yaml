#!/usr/bin/env python
"""
Build YAML test case file from online parser's test files.
"""
import os
import yaml
import simplejson as json

if __name__ == '__main__':
    tests = {}
    for dirpath, dirnames, filenames in os.walk('online-yaml-parser/examples'):
        for filename in filenames:
            yaml_file = open(os.path.join(dirpath, filename), 'r')
            text = yaml_file.read()
            yaml_file.close()

            try:
                data = yaml.load(text)
            except:
                print "%s: Failed to load YAML" % filename
                continue

            try:
                json_string = json.dumps(data)
            except:
                print "%s: Could not convert JSON" % filename
                continue

            tests[filename] = {'yaml': text, 'json': json_string}

    test_cases = open('test-cases.js', 'w')
    test_cases.write("namespace.module('org.startpad.yaml.test-cases', "
                     "function (exports, require) {\n")
    test_cases.write('exports.tests = %s;' % json.dumps(tests,
                                                          sort_keys=True,
                                                          indent=2,
                                                          separators=(',', ': ')))
    test_cases.write("});\n")
    test_cases.close()
    print "Exported %d tests" % len(tests)
