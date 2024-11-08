const flattenObject = (obj: any, parent: string = '', res: any = {}) => {
    for (let key in obj) {
      const propName = parent ? `${parent}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
    return res;
  };
  
  const jsonToCsv = (json: any) => {
    if (typeof json !== 'object' || json === null) {
      throw new Error("Invalid JSON content");
    }
  
    const flattenedJson = flattenObject(json);
    const keys = Object.keys(flattenedJson);
    const values = keys.map(key => flattenedJson[key]);
    const csv = `${keys.join(",")}\n${values.join(",")}`;
    return csv;
  };
  
  const jsonValuesToCsv = (json: any) => {
    if (typeof json !== 'object' || json === null) {
      throw new Error("Invalid JSON content");
    }
  
    const flattenedJson = flattenObject(json);
    const keys = Object.keys(flattenedJson);
    const values = keys.map(key => flattenedJson[key]);
    const csv = `${values.join(",")}`;
    return csv;
  };

export { jsonToCsv, jsonValuesToCsv };