"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_inspection_1 = require("./../common/inspections/base.inspection");
var DebugInspection = (function (_super) {
    __extends(DebugInspection, _super);
    function DebugInspection() {
        var _this = _super.apply(this, arguments) || this;
        _this.items = [
            'print_r',
            'var_export',
            'var_dump',
            'debug_zval_dump',
            'debug_print_backtrace',
            'phpinfo',
            'error_log',
            'dump',
            'debug'
        ];
        return _this;
    }
    DebugInspection.prototype.checkForDebugFunctionCalls = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            return _this.isNodeOfType(node, 'call');
        });
        raw.forEach(function (node) {
            if (node[1][0] === 'ns' && _this.items.indexOf(node[1][1][0]) !== -1) {
                items.push({
                    message: "Possible debug statement `" + node[1][1][0] + "`",
                    severity: 3,
                    range: _this.getRange(content, node[1][1][0] + "(") || _this.getRange(content, node[1][1][0] + " (")
                });
                return;
            }
            if (node[1][0] === 'static' && (_this.items.indexOf(node[1][3]) !== -1 || node[1][2][1].indexOf('Debug') !== -1)) {
                items.push({
                    message: "Possible debug statement `" + node[1][2][1].join('\\') + "::" + node[1][3] + "`",
                    severity: 3,
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 0 }
                    }
                });
                return;
            }
            if (node[1][0] === 'prop' && _this.items.indexOf(node[1][2][1]) !== -1) {
                items.push({
                    message: "Possible debug statement `" + node[1][1][1] + "->" + node[1][2][1] + "`",
                    severity: 3,
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 0 }
                    }
                });
                return;
            }
        });
        return items;
    };
    DebugInspection.prototype.checkForDebugCalls = function (tree, content) {
        var _this = this;
        var items = [];
        var raw = this.walkNodeTree(tree, function (node) {
            return (_this.isNodeOfType(node, 'class') || _this.isNodeOfType(node, 'trait'));
        });
        raw.forEach(function (node) {
            if (node[0] === 'class') {
                items = items.concat(_this.checkForDebugFunctionCalls(node[5].methods, content));
            }
            if (node[0] === 'trait') {
                items = items.concat(_this.checkForDebugFunctionCalls(node[4].methods, content));
            }
        });
        return items;
    };
    DebugInspection.prototype.analyze = function (content) {
        var ast = this.parser.parseCode(content);
        var collection = { items: [].concat(this.checkForDebugFunctionCalls(ast, content), this.checkForDebugCalls(ast, content)) };
        return collection;
    };
    return DebugInspection;
}(base_inspection_1.BaseInspection));
exports.DebugInspection = DebugInspection;
