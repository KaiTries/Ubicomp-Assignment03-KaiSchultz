
const jsonToCsv = (json: any) => {
    const keys = Object.keys(json[0]);
    const csv = json.map((row: any) => {
        return keys.map(key => {
        return row[key];
        }).join(",");
    }).join("\n");
    return csv;
    }

export { jsonToCsv };