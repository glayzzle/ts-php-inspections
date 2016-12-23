#!/usr/bin/env node
"use strict";
var fs = require("fs");
var process = require("process");
var inspection = require("../src/inspections");
var treeBuilder_util_1 = require("../src/util/treeBuilder.util");
if (process.argv.indexOf('--help') !== -1) {
    console.log("\n");
    console.log('+----------=============[ PHP Inspections]=============----------+');
    console.log('|  Version: Dev                                                  |');
    console.log('+----------------------------------------------------------------+');
    console.log('|  --pretty: Outputs results as readable text                    |');
    console.log('|  --as-json: Outputs results as JSON (useful for 3rd party apps)|');
    console.log('+----------------------------------------------------------------+');
}
if (process.argv.length === 2) {
    console.error('Not enough arguments');
    process.exit(1);
}
if (!fs.existsSync(process.argv[process.argv.length - 1]) && !fs.existsSync(process.argv[process.argv.length - 1])) {
    console.log("\n");
    console.error('Error: Last argument must be the file/directory to inspect');
    console.log("\n");
    process.exit(1);
}
var inspections = [];
inspections.push(new inspection.DebugInspection());
inspections.push(new inspection.FunctionsInspection());
inspections.push(new inspection.ConditionsInspection());
if (process.argv.indexOf('--php5') === -1) {
    inspections.push(new inspection.Php7Inspection());
}
var target = process.argv.pop();
var treeWalker = new treeBuilder_util_1.TreeBuilder(target);
var results = [];
var projectFiles = treeWalker.walk();
var cache = [];
var isPretty = (process.argv.indexOf('--pretty') !== -1);
var isJSON = (!isPretty && process.argv.indexOf('--as-json') !== -1);
if (!isPretty && !isJSON) {
    isPretty = true;
}
var lines = [];
var severity = [
    'CRITICAL',
    'ERROR',
    'WARNING',
    'NOTICE',
    'INFO'
];
projectFiles.forEach(function (file, index) {
    var data = fs.readFileSync(file);
    inspections.forEach(function (inspection) {
        var r = inspection.analyze(data.toString());
        if (r.items.length !== 0) {
            r.targetFile = file;
            r.mtime = fs.lstatSync(file).mtime.getTime();
            cache.push(r);
        }
        if (isPretty) {
            r.items.forEach(function (item) {
                if (item === undefined) {
                    return;
                }
                lines.push("[" + severity[item.severity] + "] \"" + item.message + "\" in ./" + r.targetFile + " on line " + item.range.start.line + ", column " + (item.range.start.character + 1) + "-" + (item.range.end.character + 1));
            });
        }
    });
    if (isPretty && index === projectFiles.length - 1) {
        console.log('');
        console.warn(lines.join("\n"));
        console.log('');
    }
    if (isJSON && index === projectFiles.length - 1) {
        console.log(JSON.stringify(cache));
    }
});
