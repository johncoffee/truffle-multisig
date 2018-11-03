"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const { yellow, red, blue, greenBright, grey } = chalk_1.default;
function shorten(adders) {
    return `${adders.substr(0, 4)}..${adders.substr(-2)}`;
}
exports.shorten = shorten;
