"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_inspection_1 = require("../common/inspections/base.inspection");
var Php7Inspection = (function (_super) {
    __extends(Php7Inspection, _super);
    function Php7Inspection() {
        return _super.apply(this, arguments) || this;
    }
    Php7Inspection.prototype.checkForDeclareStrict = function (content) {
        if (content.split("\n")[1].indexOf('declare(strict_types=1);') === -1) {
            return [
                {
                    message: 'Missing `declare(strict_types=1)` in file, this is recommended in order to experience the benefits of types in PHP7+',
                    severity: 4,
                    range: {
                        start: {
                            line: 2,
                            character: 0
                        },
                        end: {
                            line: 2,
                            character: 0
                        }
                    },
                    replacement: 'declare(strict_types=1);'
                }
            ];
        }
    };
    Php7Inspection.prototype.checkFunctionForArgumentTypes = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            return _this.isNodeOfType(node, 'function');
        });
        raw.forEach(function (node) {
            if (node[2].length > 0) {
                node[2].forEach(function (argument) {
                    if (argument[1] === 'mixed') {
                        var sig_1 = (argument[0] + " " + (argument[2].length > 0 ? '= ' + argument[2][1] : '')).trim();
                        content.split("\n").forEach(function (line, lineNo) {
                            if (line.indexOf("function " + node[1]) !== -1) {
                                if (line.indexOf(sig_1) !== -1) {
                                    var range = {
                                        start: { line: 0, character: 0 },
                                        end: { line: 0, character: 0 },
                                    };
                                    range.start.line = lineNo + 1;
                                    range.start.character = line.indexOf(sig_1);
                                    range.end.line = lineNo + 1;
                                    range.end.character = line.indexOf(sig_1) + sig_1.length;
                                    items.push({
                                        message: "Argument `" + argument[0] + "` does not have a type specified, consider providing one",
                                        severity: 4,
                                        range: range
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
        return items;
    };
    Php7Inspection.prototype.checkFunctionForReturnTypes = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            if (node === null) {
                return false;
            }
            return _this.isNodeOfType(node, 'function');
        });
        try {
            raw.forEach(function (node) {
                if (node[5] === false) {
                    var returns = [];
                    if (node[6].length > 0) {
                        returns = _this.walkNodeTree(node[6], function (node) {
                            return _this.isNodeOfType(node, 'return');
                        });
                    }
                    if (returns.length > 0) {
                        var signatures_1 = [
                            "function " + node[1] + " (",
                            "function " + node[1] + "("
                        ];
                        content.split("\n").forEach(function (line, lineNo) {
                            signatures_1.forEach(function (signature) {
                                if (line.indexOf(signature) !== -1) {
                                    var range = {
                                        start: { line: 0, character: 0 },
                                        end: { line: 0, character: 0 },
                                    };
                                    range.start.line = lineNo + 1;
                                    range.start.character = line.indexOf("function " + node[1]);
                                    range.end.line = lineNo + 1;
                                    range.end.character = line.lastIndexOf(')');
                                    items.push({
                                        message: "Function or method `" + node[1] + "` does not have a return type specified, consider providing one",
                                        severity: 4,
                                        range: range
                                    });
                                }
                            });
                        });
                    }
                }
            });
        }
        catch (_) {
        }
        return items;
    };
    Php7Inspection.prototype.checkMethodsForReturnTypes = function (tree, content) {
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
            var methods = entity[0] === 'class' ? entity[5].methods : entity[4].methods;
            items = items.concat(_this.checkFunctionForReturnTypes(methods, content), _this.checkFunctionForArgumentTypes(methods, content));
        });
        return items;
    };
    Php7Inspection.prototype.checkDocBlocksForPropAndReturn = function (tree, content) {
        var _this = this;
        var items = [];
        var docSwitch = false;
        var raw = this.walkNodeTree(tree, function (node) {
            if (_this.isNodeOfType(node, 'doc')) {
                docSwitch = true;
                return true;
            }
            if (docSwitch && _this.isNodeOfType(node, 'function')) {
                docSwitch = false;
                return true;
            }
            return false;
        });
        var pairs = [];
        raw.forEach(function (node, index, array) {
            if (index % 2 === 0) {
                pairs.push([
                    node, array[index + 1]
                ]);
            }
        });
        pairs.forEach(function (pair) {
            var doc, func;
            doc = pair[0], func = pair[1];
            var params = [];
            doc[1].split("\n").forEach(function (line, lineNo) {
                if (line.indexOf('@param') !== -1) {
                    var components_1 = line.split('*')[1].trim().split(/\s+/i, 3);
                    func[2].forEach(function (argument) {
                        if (argument[1] === 'mixed' && (argument[0] === components_1[1] || argument[0] === components_1[2])) {
                            if (components_1[1] === 'mixed' || components_1[2] === 'mixed') {
                                return;
                            }
                            var sig = argument[0] + " " + (argument[2].length !== 0 ? '= ' + argument[2] : '');
                            params.push([func[1], sig.trim(), (argument[1] === components_1[1] ? components_1[1] : components_1[2]) + " " + sig]);
                        }
                    });
                }
            });
            content.split("\n").forEach(function (line, lineNo) {
                params.forEach(function (param) {
                    if (line.indexOf(param[0]) !== -1) {
                        var range = {
                            start: { line: lineNo + 1, character: line.indexOf(param[1]) },
                            end: { line: lineNo + 1, character: line.indexOf(param[1]) + param[1].length }
                        };
                        items.push({
                            message: "Function or method has types defined for `" + param[1].split('=')[0].trim() + "` in docblock, but not in signature",
                            severity: 3,
                            range: range,
                            replacement: param[2]
                        });
                    }
                });
            });
        });
        return items;
    };
    Php7Inspection.prototype.analyze = function (content) {
        var ast = this.parser.parseCode(content);
        return {
            items: [].concat(this.checkForDeclareStrict(content), this.checkMethodsForReturnTypes(ast, content), this.checkFunctionForReturnTypes(ast, content), this.checkFunctionForArgumentTypes(ast, content), this.checkDocBlocksForPropAndReturn(ast, content))
        };
    };
    return Php7Inspection;
}(base_inspection_1.BaseInspection));
exports.Php7Inspection = Php7Inspection;
