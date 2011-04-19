#!/usr/bin/env node
global.namespace = require('../src/namespace.js').namespace;
require('./qunit-node.js');
require('../yaml.js');

require('./test-yaml.js');
