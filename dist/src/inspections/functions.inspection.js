"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_inspection_1 = require("../common/inspections/base.inspection");
var FunctionsInspection = (function (_super) {
    __extends(FunctionsInspection, _super);
    function FunctionsInspection() {
        return _super.apply(this, arguments) || this;
    }
    FunctionsInspection.prototype.checkFunctionSignature = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            if (node === null) {
                return false;
            }
            return _this.isNodeOfType(node, 'function');
        });
        raw.forEach(function (node) {
            var signatureTypes = [];
            if (node[2].length > 0) {
                node[2].forEach(function (argument) {
                    var next = node[2][node[2].indexOf(argument) + 1];
                    if (argument[2].length > 0 && next !== undefined && next[2] !== undefined) {
                        if (next[2].length === 0) {
                            var range_1 = {
                                start: { line: 0, character: 0 },
                                end: { line: 0, character: 0 },
                            };
                            var sig_1 = ((argument[1] === 'mixed' ? '' : argument[1]) + " " + argument[0] + " " + (argument[2].length > 0 ? '= ' + argument[2][3][1] : '')).trim();
                            content.split("\n").forEach(function (line, lineNo) {
                                if (line.indexOf(sig_1) !== -1) {
                                    range_1.start.line = lineNo;
                                    range_1.start.character = line.indexOf(sig_1);
                                    range_1.end.line = lineNo;
                                    range_1.end.character = line.indexOf(sig_1) + sig_1.length;
                                }
                            });
                            items.push({
                                message: "Consider moving `" + sig_1.split('=')[0].trim() + "` near the end of the argument list, since it has a default value",
                                severity: 3,
                                range: range_1
                            });
                        }
                    }
                    signatureTypes.push(((argument[1] === 'mixed' ? '' : argument[1]) + " " + argument[0] + " " + (argument[2].length > 0 ? '= ' + (argument[2][0] === 'position' ? argument[2][3][1] : argument[2][1]) : '')).trim());
                });
                var signature_1 = node[1] + "(" + signatureTypes.join(', ') + ")" + (node[5] ? ': ' + node[5] : '');
                if (node[2].length > 3) {
                    var range_2 = {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 0 },
                    };
                    content.split("\n").forEach(function (line, lineNo) {
                        if (line.indexOf(signature_1) !== -1) {
                            range_2.start.line = lineNo;
                            range_2.start.character = line.indexOf(signature_1);
                            range_2.end.line = lineNo;
                            range_2.end.character = line.indexOf(signature_1) + signature_1.length;
                        }
                    });
                    items.push({
                        message: 'Function or method taking more than 3 arguments is a sign of poor design',
                        severity: 4,
                        range: range_2
                    });
                }
            }
        });
        return items;
    };
    FunctionsInspection.prototype.analyzeForClassMethods = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            if (node === null) {
                return false;
            }
            return (_this.isNodeOfType(node, 'class') ||
                _this.isNodeOfType(node, 'interface') ||
                _this.isNodeOfType(node, 'trait'));
        });
        raw.forEach(function (entity) {
            var methods = _this.checkFunctionSignature(entity[0] === 'class' ? entity[5].methods : entity[4].methods, content);
            items = items.concat(methods);
        });
        return items;
    };
    FunctionsInspection.prototype.analyze = function (content) {
        var ast = this.parser.parseCode(content);
        return {
            items: [].concat(this.checkFunctionSignature(ast, content), this.analyzeForClassMethods(ast, content))
        };
    };
    return FunctionsInspection;
}(base_inspection_1.BaseInspection));
exports.FunctionsInspection = FunctionsInspection;
