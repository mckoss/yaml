namespace.module('org.startpad.yaml.test-cases', function (exports, require) {
exports.tests = {
  "2.01": {
    "json": "[\"Mark McGwire\", \"Sammy Sosa\", \"Ken Griffey\"]",
    "yaml": "- Mark McGwire\n- Sammy Sosa\n- Ken Griffey\n"
  },
  "2.02": {
    "json": "{\"hr\": 65, \"avg\": 0.27800000000000002, \"rbi\": 147}",
    "yaml": "hr:  65    # Home runs\navg: 0.278 # Batting average\nrbi: 147   # Runs Batted In\n"
  },
  "2.03": {
    "json": "{\"american\": [\"Boston Red Sox\", \"Detroit Tigers\", \"New York Yankees\"], \"national\": [\"New York Mets\", \"Chicago Cubs\", \"Atlanta Braves\"]}",
    "yaml": "american:\n  - Boston Red Sox\n  - Detroit Tigers\n  - New York Yankees\nnational:\n  - New York Mets\n  - Chicago Cubs\n  - Atlanta Braves\n"
  },
  "2.04": {
    "json": "[{\"hr\": 65, \"avg\": 0.27800000000000002, \"name\": \"Mark McGwire\"}, {\"hr\": 63, \"avg\": 0.28799999999999998, \"name\": \"Sammy Sosa\"}]",
    "yaml": "-\n  name: Mark McGwire\n  hr:   65\n  avg:  0.278\n-\n  name: Sammy Sosa\n  hr:   63\n  avg:  0.288\n"
  },
  "2.05": {
    "json": "[[\"name\", \"hr\", \"avg\"], [\"Mark McGwire\", 65, 0.27800000000000002], [\"Sammy Sosa\", 63, 0.28799999999999998]]",
    "yaml": "- [name        , hr, avg  ]\n- [Mark McGwire, 65, 0.278]\n- [Sammy Sosa  , 63, 0.288]\n"
  },
  "2.06": {
    "json": "{\"Sammy Sosa\": {\"hr\": 63, \"avg\": 0.28799999999999998}, \"Mark McGwire\": {\"hr\": 65, \"avg\": 0.27800000000000002}}",
    "yaml": "Mark McGwire: {hr: 65, avg: 0.278}\nSammy Sosa: {\n    hr: 63,\n    avg: 0.288\n  }\n"
  },
  "2.09": {
    "json": "{\"hr\": [\"Mark McGwire\", \"Sammy Sosa\"], \"rbi\": [\"Sammy Sosa\", \"Ken Griffey\"]}",
    "yaml": "---\nhr: # 1998 hr ranking\n  - Mark McGwire\n  - Sammy Sosa\nrbi:\n  # 1998 rbi ranking\n  - Sammy Sosa\n  - Ken Griffey\n"
  },
  "2.10": {
    "json": "{\"hr\": [\"Mark McGwire\", \"Sammy Sosa\"], \"rbi\": [\"Sammy Sosa\", \"Ken Griffey\"]}",
    "yaml": "---\nhr:\n  - Mark McGwire\n  # Following node labeled SS\n  - &SS Sammy Sosa\nrbi:\n  - *SS # Subsequent occurrence\n  - Ken Griffey\n"
  },
  "2.12": {
    "json": "[{\"item\": \"Super Hoop\", \"quantity\": 1}, {\"item\": \"Basketball\", \"quantity\": 4}, {\"item\": \"Big Shoes\", \"quantity\": 1}]",
    "yaml": "---\n# Products purchased\n- item    : Super Hoop\n  quantity: 1\n- item    : Basketball\n  quantity: 4\n- item    : Big Shoes\n  quantity: 1\n"
  },
  "2.13": {
    "json": "\"\\\\//||\\\\/||\\n// ||  ||__\\n\"",
    "yaml": "# ASCII Art\n--- |\n  \\//||\\/||\n  // ||  ||__\n"
  },
  "2.14": {
    "json": "\"Mark McGwire's year was crippled by a knee injury.\\n\"",
    "yaml": "--- >\n  Mark McGwire's\n  year was crippled\n  by a knee injury.\n"
  },
  "2.15": {
    "json": "\"Sammy Sosa completed another fine season with great stats.\\n\\n  63 Home Runs\\n  0.288 Batting Average\\n\\nWhat a year!\\n\"",
    "yaml": ">\n Sammy Sosa completed another\n fine season with great stats.\n\n   63 Home Runs\n   0.288 Batting Average\n\n What a year!\n"
  },
  "2.16": {
    "json": "{\"accomplishment\": \"Mark set a major league home run record in 1998.\\n\", \"stats\": \"65 Home Runs\\n0.278 Batting Average\\n\", \"name\": \"Mark McGwire\"}",
    "yaml": "name: Mark McGwire\naccomplishment: >\n  Mark set a major league\n  home run record in 1998.\nstats: |\n  65 Home Runs\n  0.278 Batting Average\n"
  },
  "2.17": {
    "json": "{\"control\": \"\\b1998\\t1999\\t2000\\n\", \"tie-fighter\": \"|\\\\-*-/|\", \"single\": \"\\\"Howdy!\\\" he cried.\", \"unicode\": \"Sosa did fine.\\u263a\", \"quoted\": \" # Not a 'comment'.\", \"hex esc\": \"\\r\\n is \\r\\n\"}",
    "yaml": "unicode: \"Sosa did fine.\\u263A\"\ncontrol: \"\\b1998\\t1999\\t2000\\n\"\nhex esc: \"\\x0d\\x0a is \\r\\n\"\n\nsingle: '\"Howdy!\" he cried.'\nquoted: ' # Not a ''comment''.'\ntie-fighter: '|\\-*-/|'\n"
  },
  "2.18": {
    "json": "{\"plain\": \"This unquoted scalar spans many lines.\", \"quoted\": \"So does this quoted scalar.\\n\"}",
    "yaml": "plain:\n  This unquoted scalar\n  spans many lines.\n\nquoted: \"So does this\n  quoted scalar.\\n\"\n"
  },
  "2.19": {
    "json": "{\"octal\": \"0o14\", \"decimal\": 12345, \"hexadecimal\": 12, \"canonical\": 12345}",
    "yaml": "canonical: 12345\ndecimal: +12345\noctal: 0o14\nhexadecimal: 0xC\n"
  },
  "2.20": {
    "json": "{\"not a number\": NaN, \"negative infinity\": -Infinity, \"fixed\": 1230.1500000000001, \"exponential\": 1230.1500000000001, \"canonical\": 1230.1500000000001}",
    "yaml": "canonical: 1.23015e+3\nexponential: 12.3015e+02\nfixed: 1230.15\nnegative infinity: -.inf\nnot a number: .NaN\n"
  },
  "2.21": {
    "json": "{\"null\": null, \"string\": \"012345\", \"booleans\": [true, false]}",
    "yaml": "null:\nbooleans: [ true, false ]\nstring: '012345'\n"
  },
  "2.26": {
    "json": "[[\"Mark McGwire\", 65], [\"Sammy Sosa\", 63], [\"Ken Griffy\", 58]]",
    "yaml": "# Ordered maps are represented as\n# A sequence of mappings, with\n# each mapping having one key\n--- !!omap\n- Mark McGwire: 65\n- Sammy Sosa: 63\n- Ken Griffy: 58\n"
  }
};});
