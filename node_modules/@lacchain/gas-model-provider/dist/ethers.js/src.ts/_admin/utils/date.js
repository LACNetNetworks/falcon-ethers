"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateTime = void 0;
function repeat(c, length) {
    if (c.length === 0) {
        throw new Error("too short");
    }
    while (c.length < length) {
        c += c;
    }
    return c.substring(0, length);
}
function zpad(value, length) {
    if (length == null) {
        length = 2;
    }
    const str = String(value);
    return repeat("0", length - str.length) + str;
}
function getDate(date) {
    return [
        date.getFullYear(),
        zpad(date.getMonth() + 1),
        zpad(date.getDate())
    ].join("-");
}
function getDateTime(date) {
    return getDate(date) + " " + [
        zpad(date.getHours()),
        zpad(date.getMinutes() + 1)
    ].join(":");
}
exports.getDateTime = getDateTime;
//# sourceMappingURL=date.js.map