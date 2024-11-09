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


const addRule = function (resourceUrl: string, defaultUrl: string, agent: string, mode: string = "Read"): string {
    const rule = `INSERT DATA { 
    <#${mode}> 
      a <http://www.w3.org/ns/auth/acl#Authorization>;
      <http://www.w3.org/ns/auth/acl#accessTo> <${resourceUrl}>;
      <http://www.w3.org/ns/auth/acl#default> <${defaultUrl}>;
      <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#${mode}>;
      <http://www.w3.org/ns/auth/acl#agent> <${agent}>.
      }`;
    return rule;
  }




const currentActivityTemplate = (classification: string, schemaName: string, probability: number, endTime: string) => `
<https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/gazeData/currentActivity.ttl> a prov:Activity, schema:${classification};
                                                                              schema:name "${schemaName}"^^xsd:string;
                                                                              prov:wasAssociatedWith <https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/profile/card#me>;
                                                                              prov:used <https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/gazeData/kaiTest1.csv>;
                                                                              prov:endedAtTime "${endTime}"^^xsd:dateTime;
                                                                              bm:probability  "${probability}"^^xsd:float.
<https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/profile/card#me> a foaf:Person, prov:Agent;
                                                                 foaf:name "Kai Schultz";
                                                                 foaf:mbox <mailto:kai.schultz@student.unisg.ch>.`;

export { jsonToCsv, jsonValuesToCsv, currentActivityTemplate, addRule };