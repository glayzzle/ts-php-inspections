"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_inspection_1 = require("../common/inspections/base.inspection");
var ConditionsInspection = (function (_super) {
    __extends(ConditionsInspection, _super);
    function ConditionsInspection() {
        return _super.apply(this, arguments) || this;
    }
    ConditionsInspection.prototype.analyzeForWeakNotEqualComparison = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            return _this.isNodeOfType(node, 'if') && node[1][1] === '!~';
        });
        raw.forEach(function (item) {
            var range = {
                start: {
                    line: 0,
                    character: 0
                },
                end: {
                    line: 0,
                    character: 0
                },
            };
            switch (item[1][2][0]) {
                case 'position':
                    range.start.line = item[1][2][1][0];
                    range.start.character = item[1][2][1][1];
                    range.end.line = item[1][2][2][0];
                    range.end.character = item[1][2][2][1];
                    break;
                case 'var':
                    var needles_1 = [
                        item[1][2][1] + "!=" + item[1][3][1],
                        item[1][2][1] + " != " + item[1][3][1],
                    ];
                    content.split("\n").forEach(function (line, lineNo) {
                        needles_1.forEach(function (needle) {
                            if (line.indexOf(needle) !== -1) {
                                range.start.line = lineNo;
                                range.start.character = line.indexOf('!=');
                                range.end.line = lineNo;
                                range.end.character = line.indexOf('!=') + 2;
                            }
                        });
                    });
                    break;
            }
            items.push({
                message: "Type-unsafe comparison, \"!==\" should be used instead",
                severity: 3,
                range: range,
                replacement: '!=='
            });
        });
        return items;
    };
    ConditionsInspection.prototype.analyzeForWeakEqualComparison = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            return _this.isNodeOfType(node, 'if') && node[1][1] === '~';
        });
        raw.forEach(function (item) {
            var range = {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 },
            };
            switch (item[1][2][0]) {
                case 'position':
                    range.start.line = item[1][2][1][0];
                    range.start.character = item[1][2][1][1];
                    range.end.line = item[1][2][2][0];
                    range.end.character = item[1][2][2][1];
                    break;
                case 'constant':
                case 'var':
                    var needles_2 = [
                        item[1][2][1] + "==" + item[1][3][1],
                        item[1][2][1] + " == " + item[1][3][1],
                    ];
                    content.split("\n").forEach(function (line, lineNo) {
                        needles_2.forEach(function (needle) {
                            if (line.indexOf(needle) !== -1) {
                                range.start.line = lineNo;
                                range.start.character = line.indexOf('==');
                                range.end.line = lineNo;
                                range.end.character = line.indexOf('==') + 2;
                            }
                        });
                    });
                    break;
            }
            items.push({
                message: "Type-unsafe comparison, \"===\" should be used instead",
                severity: 3,
                range: range,
                replacement: '==='
            });
        });
        return items;
    };
    ConditionsInspection.prototype.analyzeForInArrayStrictParameter = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            return (_this.isNodeOfType(node, 'if') &&
                node[1][0] === 'call' &&
                node[1][1][1][0] === 'in_array');
        });
        raw.forEach(function (node) {
            if (node[1][2].length === 2) {
                var range_1 = {
                    start: {
                        line: 0,
                        character: 0
                    },
                    end: {
                        line: 0,
                        character: 0
                    }
                };
                content.split("\n").forEach(function (line, lineNo) {
                    var needles = [
                        "in_array(" + (node[1][2][0][0] === 'string' ? '"' + node[1][2][0][1] + '"' : node[1][2][0][1]) + "," + node[1][2][1][1] + ")",
                        "in_array(" + (node[1][2][0][0] === 'string' ? '\'' + node[1][2][0][1] + '\'' : node[1][2][0][1]) + "," + node[1][2][1][1] + ")",
                        "in_array(" + (node[1][2][0][0] === 'string' ? '"' + node[1][2][0][1] + '"' : node[1][2][0][1]) + ", " + node[1][2][1][1] + ")",
                        "in_array(" + (node[1][2][0][0] === 'string' ? '\'' + node[1][2][0][1] + '\'' : node[1][2][0][1]) + ", " + node[1][2][1][1] + ")",
                    ];
                    needles.forEach(function (needle) {
                        if (line.indexOf(needle) !== -1) {
                            range_1.start.line = lineNo;
                            range_1.start.character = line.indexOf(needle);
                            range_1.end.line = lineNo;
                            range_1.end.character = line.indexOf(needle) + needle.length;
                        }
                    });
                });
                items.push({
                    message: 'It is recommended to provide 3rd parameter to `in_array` so it performs type-safe comparison.',
                    severity: 3,
                    range: range_1,
                    replacement: "in_array(" + (node[1][2][0][0] === 'string' ? '\'' + node[1][2][0][1] + '\'' : node[1][2][0][1]) + ", " + node[1][2][1][1] + ", true)"
                });
            }
        });
        return items;
    };
    ConditionsInspection.prototype.analyzeForAssignmentOperators = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            return _this.isNodeOfType(node, 'if') && node[1][3] !== undefined && node[1][3][0] === 'set';
        });
        raw.forEach(function (node) {
            items.push({
                message: 'Possible bug, no comparison operator found in condition.',
                severity: 2,
                range: {
                    start: {
                        line: node[1][1][0],
                        character: node[1][1][1]
                    },
                    end: {
                        line: node[1][2][0],
                        character: node[1][2][1]
                    }
                }
            });
        });
        return items;
    };
    ConditionsInspection.prototype.analyzeForPossibleConditionOptimizations = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            if (_this.isNodeOfType(node, 'if') && node[1][3] !== undefined && (node[1][2][0] === 'constant' || node[1][3][0] === 'constant')) {
                if ((node[1][2][1] === 'false' || node[1][2][1] === 'true') || (node[1][3][1] === 'false' || node[1][3][1] === 'true')) {
                    return true;
                }
            }
            return false;
        });
        raw.forEach(function (node) {
            var expresionSign = '';
            switch (node[1][1]) {
                case '~':
                    expresionSign = '==';
                    break;
                case '!~':
                    expresionSign = '!=';
                    break;
                case '=':
                    expresionSign = '===';
                    break;
                case '!=':
                    expresionSign = '!==';
                    break;
            }
            if (node[1][2][1] === 'false' || node[1][3][1] === 'false') {
                var inspectionItem_1 = {
                    message: ''
                };
                var range_2 = {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 }
                };
                var needles = [
                    "(" + node[1][2][1] + " " + expresionSign + " " + node[1][3][1] + ")",
                    "( " + node[1][2][1] + " " + expresionSign + " " + node[1][3][1] + " )",
                    "(" + node[1][2][1] + expresionSign + node[1][3][1] + ")",
                    "( " + node[1][2][1] + expresionSign + node[1][3][1] + " )",
                ];
                needles.forEach(function (needle) {
                    content.split("\n").forEach(function (line, lineNo) {
                        if (line.indexOf(needle) !== -1) {
                            range_2.start.line = lineNo;
                            range_2.start.character = line.indexOf(needle);
                            range_2.end.line = lineNo;
                            range_2.end.character = line.indexOf(needle) + needle.length;
                            inspectionItem_1.message =
                                "Condition could be refactored to `" + ((['==', '==='].indexOf(expresionSign) !== -1) ?
                                    '(!' + (node[1][2][1].toLowerCase() === 'false' ? node[1][3][1] : node[1][2][1]) + ')' :
                                    '(' + (node[1][2][1].toLowerCase() === 'false' ? node[1][3][1] : node[1][2][1]) + ')') + "` instead";
                            inspectionItem_1.range = range_2;
                            inspectionItem_1.severity = 4;
                            inspectionItem_1.replacement = (['==', '==='].indexOf(expresionSign) !== -1) ?
                                '(!' + (node[1][2][1].toLowerCase() === 'false' ? node[1][3][1] : node[1][2][1]) + ')' :
                                '(' + (node[1][2][1].toLowerCase() === 'false' ? node[1][3][1] : node[1][2][1]) + ')';
                            items.push(inspectionItem_1);
                        }
                    });
                });
            }
            if (node[1][2][1] === 'true' || node[1][3][1] === 'true') {
                var inspectionItem_2 = {
                    message: ''
                };
                var range_3 = {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 }
                };
                var needles = [
                    "(" + node[1][2][1] + " " + expresionSign + " " + node[1][3][1] + ")",
                    "( " + node[1][2][1] + " " + expresionSign + " " + node[1][3][1] + " )",
                    "(" + node[1][2][1] + expresionSign + node[1][3][1] + ")",
                    "( " + node[1][2][1] + expresionSign + node[1][3][1] + " )",
                ];
                needles.forEach(function (needle) {
                    content.split("\n").forEach(function (line, lineNo) {
                        if (line.indexOf(needle) !== -1) {
                            range_3.start.line = lineNo;
                            range_3.start.character = line.indexOf(needle);
                            range_3.end.line = lineNo;
                            range_3.end.character = line.indexOf(needle) + needle.length;
                            inspectionItem_2.message =
                                "Condition could be refactored to `" + ((['==', '==='].indexOf(expresionSign) !== -1) ?
                                    '(' + (node[1][2][1].toLowerCase() === 'true' ? node[1][3][1] : node[1][2][1]) + ')' :
                                    '(!' + (node[1][2][1].toLowerCase() === 'true' ? node[1][3][1] : node[1][2][1]) + ')') + "` instead";
                            inspectionItem_2.range = range_3;
                            inspectionItem_2.severity = 4;
                            inspectionItem_2.replacement = (['==', '==='].indexOf(expresionSign) !== -1) ?
                                '(' + (node[1][2][1].toLowerCase() === 'true' ? node[1][3][1] : node[1][2][1]) + ')' :
                                '(!' + (node[1][2][1].toLowerCase() === 'true' ? node[1][3][1] : node[1][2][1]) + ')';
                            items.push(inspectionItem_2);
                        }
                    });
                });
            }
        });
        return items;
    };
    ConditionsInspection.prototype.analyze = function (content) {
        var ast = this.parser.parseCode(content);
        return {
            items: [].concat(this.analyzeForWeakEqualComparison(ast, content), this.analyzeForWeakNotEqualComparison(ast, content), this.analyzeForAssignmentOperators(ast, content), this.analyzeForPossibleConditionOptimizations(ast, content), this.analyzeForInArrayStrictParameter(ast, content))
        };
    };
    return ConditionsInspection;
}(base_inspection_1.BaseInspection));
exports.ConditionsInspection = ConditionsInspection;
