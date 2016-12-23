"use strict";
var BaseInspection = (function () {
    function BaseInspection() {
        this._parser = require('php-parser')
            .create({
            parser: {
                locations: true,
                suppressErrors: true,
                extractDoc: true,
            }
        });
    }
    Object.defineProperty(BaseInspection.prototype, "parser", {
        get: function () {
            return this._parser;
        },
        set: function (parser) {
            throw 'Parser should not be modified!';
        },
        enumerable: true,
        configurable: true
    });
    BaseInspection.prototype.getRange = function (content, needle) {
        var range = null;
        content.split("\n").forEach(function (line, lineNo) {
            if (range === null && line.indexOf(needle) !== -1) {
                range = {
                    start: {
                        line: lineNo + 1,
                        character: line.indexOf(needle)
                    },
                    end: {
                        line: lineNo + 1,
                        character: needle.indexOf('(') !== -1 ?
                            line.lastIndexOf(')') + 1 : line.indexOf(needle) + needle.length
                    }
                };
            }
        });
        return range;
    };
    BaseInspection.prototype.isNodeOfType = function (node, type) {
        node = node || [];
        if (typeof node !== 'object' || node[0] === undefined) {
            return false;
        }
        if (node[0] === type) {
            return true;
        }
        return false;
    };
    BaseInspection.prototype.walkNodeTree = function (ast, callback) {
        var extract = [];
        for (var _i = 0, ast_1 = ast; _i < ast_1.length; _i++) {
            var node = ast_1[_i];
            var isValid = callback(node);
            if (isValid) {
                extract.push(node);
            }
            if (!isValid && typeof node === 'object') {
                if (node !== null) {
                    extract = extract.concat(this.walkNodeTree(node, callback));
                }
                continue;
            }
        }
        return extract;
    };
    return BaseInspection;
}());
exports.BaseInspection = BaseInspection;
