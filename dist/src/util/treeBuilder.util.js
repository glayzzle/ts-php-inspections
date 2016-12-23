"use strict";
var process = require("process");
var fs = require("fs");
var TreeBuilder = (function () {
    function TreeBuilder(target) {
        this.target = target;
        if (!fs.existsSync(target)) {
            console.error("File or folder \"" + target + "\" does not exist");
            process.exit(1);
        }
        this.stat = fs.lstatSync(target);
    }
    TreeBuilder.prototype.walk = function () {
        var _this = this;
        var files = [];
        if (this.stat.isDirectory()) {
            var fps = fs.readdirSync(this.target);
            fps.forEach(function (fp) {
                files = files.concat((new TreeBuilder(_this.target.replace(/\/$/i, '') + '/' + fp))
                    .walk());
            });
        }
        ;
        if (this.stat.isFile()) {
            files.push(this.target);
        }
        return files;
    };
    return TreeBuilder;
}());
exports.TreeBuilder = TreeBuilder;
