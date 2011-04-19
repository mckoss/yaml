# YAML - A JavaScript YAML (subset) parser.

I couldn't find a working native YAML parser for JavaScript (especially one with working test cases),
so I'm starting this project.

The full [YAML Spec] has a very rich data model with data types, and inter-object references.  This goes
well beyond the simple model supported by JSON.

As an initial pass, this project strives to read and write YAML that is *equivalent* to JSON-formatted data
(perhaps somewhat akin to the *YSON* format that is alluded to in the [YAML Spec]).

## Goals

- Support the subset of YAML that is equivalent to JSON's data model.
- Small and light-weight.
- Compatible with browser and node.js environment.
- Unit tested.

## Design and Project Plans

- I wanted to be sure that the library is [Unit Tested][Unit Tests] from the outset - so those were built first.
- Since we have a perfectly acceptable JSON parser in the browser, and in node.js, this parser
  will do a source-tranformation of the input YAML into valid JSON format, and then call the JSON parser.


Project status: Not yet started - but there are (failing) [Unit Tests]!

  [Unit Tests]: http://yaml-js.pageforest.com/test/test-runner.html
  [YAML Spec]: http://www.yaml.org/spec/1.2/spec.html
