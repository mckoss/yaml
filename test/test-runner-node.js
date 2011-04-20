#!/usr/bin/env node
global.namespace = require('../src/namespace.js').namespace;
require('../yaml.js');
require('./qunit-node.js');
require('./test-cases.js');
require('./test-yaml.js');
