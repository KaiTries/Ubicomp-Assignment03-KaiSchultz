"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToCsv = void 0;
const jsonToCsv = (json) => {
    const keys = Object.keys(json[0]);
    const csv = json.map((row) => {
        return keys.map(key => {
            return row[key];
        }).join(",");
    }).join("\n");
    return csv;
};
exports.jsonToCsv = jsonToCsv;
