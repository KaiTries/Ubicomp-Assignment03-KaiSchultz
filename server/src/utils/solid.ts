import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { Session } from '@inrupt/solid-client-authn-node';
import { QueryEngine } from '@comunica/query-sparql-solid';
import exp from 'constants';
import dotenv from "dotenv";


dotenv.config();

const query3 = `
PREFIX schema: <http://schema.org/>
PREFIX assg3: <https://ics.unisg.ch#>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?occupation ?activity ?material ?materialComment WHERE {
    <https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/profile/card#me> assg3:hasOccupation ?occupation .
    ?occupation assg3:performs ?activity .
    ?activity assg3:supportMaterial ?material .
    ?material rdfs:comment ?materialComment .
    FILTER ( LANG ( ?materialComment ) = 'en' ) .
}`;


const refinedQuery = (currentActivityTTL: string) => `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX schema: <https://schema.org/>
PREFIX bm: <http://bimerr.iot.linkeddata.es/def/occupancy-profile#>
PREFIX assg3: <https://ics.unisg.ch#>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?occupation ?activity ?material ?materialComment WHERE {
  <${currentActivityTTL}> a ?actionType;
    prov:wasAssociatedWith ?agent.
  
  ?agent assg3:hasOccupation ?occupation .
  ?occupation assg3:performs ?activity .
  ?activity a ?actionType .
  ?activity assg3:supportMaterial ?material .
  ?material rdfs:comment ?materialComment .
  FILTER ( LANG ( ?materialComment ) = 'en' ) .
}
`;


const mainUri = process.env.MAINURI || 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/';

const getTokenUsage = async(id: any, secret: any): Promise<any> => {
    // A key pair is needed for encryption.
    // This function from `solid-client-authn` generates such a pair for you.
    const dpopKey = await generateDpopKeyPair();
  
    // These are the ID and secret generated in the previous step.
    // Both the ID and the secret need to be form-encoded.
    const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
    // This URL can be found by looking at the "token_endpoint" field at
    const tokenUrl = 'https://wiser-solid-xi.interactions.ics.unisg.ch/.oidc/token';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        // The header needs to be in base64 encoding.
        authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
        dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
      },
      body: 'grant_type=client_credentials&scope=webid',
    });
  
    // This is the Access token that will be used to do an authenticated request to the server.
    // The JSON also contains an "expires_in" field in seconds,
    // which you can use to know when you need request a new Access token.
    const token = await response.json();
    const { access_token: accessToken, expires_in: expiresIn } = token;
  
   return [ accessToken, dpopKey, expiresIn ];
}

const makeAuthenticatedGetRequest = async (accessToken: any, dpopKey: any, resourceUrl: any) => {
    const response = await fetch(resourceUrl, {
      method: 'GET',
      headers: {
        authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(resourceUrl, 'GET', dpopKey),
      },
    });
    const responseText = await response.text();
    console.log(responseText);
    return responseText;
}

const createNewContainer = async (accessToken: any, dpopKey: any, podName: any) => {
    const resourceUrl = mainUri + podName + "/";
      const dpopHeader = await createDpopHeader(resourceUrl, 'PUT', dpopKey);
      const response = await fetch(resourceUrl, {
        method: 'PUT',
        headers: {
          authorization: `DPoP ${accessToken}`,
          dpop: dpopHeader
        },
      });
      console.log(await response.text());
  }

const createNewResource = async (accessToken: any, dpopKey: any, resourcename: any, rtype: any, resourceContent: any) => {
    const resourceUrl = mainUri + resourcename;
      const dpopHeader = await createDpopHeader(resourceUrl, 'PUT', dpopKey);
      const response = await fetch(resourceUrl, {
        method: 'PUT',
        headers: {
          authorization: `DPoP ${accessToken}`,
          dpop: dpopHeader,
          'content-type': `${rtype}`,  
          },
        body: resourceContent
      });
      console.log(await response.text());
  }


const deleteResource = async (accessToken: any, dpopKey: any, resourceUrl: any) => {;
      const dpopHeader = await createDpopHeader(resourceUrl, 'DELETE', dpopKey);
      const response = await fetch(resourceUrl, {
        method: 'DELETE',
        headers: {
          authorization: `DPoP ${accessToken}`,
          dpop: dpopHeader,
        },
      });
      console.log(await response.text());
  }


const updateExistingResource = async (accessToken: any, dpopKey: any, resourcename: any, resourceContent: any) => {
    const resourceUrl = mainUri + resourcename;
      const dpopHeader = await createDpopHeader(resourceUrl, 'PATCH', dpopKey);
      const response = await fetch(resourceUrl, {
        method: 'PATCH',
        headers: {
          authorization: `DPoP ${accessToken}`,
          dpop: dpopHeader,
          'content-type': 'application/sparql-update',
        },
        body: resourceContent
      });
      console.log(await response.text());
  }

const replaceExistingResource = async (accessToken: any, dpopKey: any, resourcename: any, resourceContent: any, ctype: any) => {
    const resourceUrl = mainUri + resourcename;
      const dpopHeader = await createDpopHeader(resourceUrl, 'PUT', dpopKey);
      const response = await fetch(resourceUrl, {
        method: 'PUT',
        headers: {
          authorization: `DPoP ${accessToken}`,
          dpop: dpopHeader,
          'content-type': `${ctype}`,
        },
        body: resourceContent
      });
      console.log(await response.text());
  }

const robot = "https://wiser-solid-xi.interactions.ics.unisg.ch/robotSG/";


const querySolidPod = async (webId: string, currentActivitURL: string ): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    const session = new Session();
    const myEngine = new QueryEngine();

    const id = process.env.ID;
    const secret = process.env.SECRET;
    const id_provider = process.env.ISSUER;
    await session.login({
      clientId: id,
      clientSecret: secret,
      oidcIssuer: id_provider
    });

    if (session.info.isLoggedIn && typeof session.info.webId === 'string') {
      console.log("logged in");

      // Perform the refined query
      const bindingsStream = await myEngine.queryBindings(refinedQuery(currentActivitURL), {
        sources: [
          webId,
          currentActivitURL,
          robot + "operations/classifiedActivitiesMaterial.ttl",
          'https://dbpedia.org/sparql'
        ],
        // Pass the authenticated fetch function
        fetch: session.fetch,
      });

      const results: any[] = [];

      // Collect the results
      bindingsStream.on('data', (binding) => {
        console.log(binding.toString());
        results.push({
          occupation: binding.get('occupation').value,
          activity: binding.get('activity').value,
          material: binding.get('material').value,
          materialComment: binding.get('materialComment').value,
        });
      });

      bindingsStream.on('end', () => {
        console.log('All done!');
        resolve(results);
      });

      bindingsStream.on('error', (error) => {
        console.error('Error during SPARQL query:', error);
        reject(error);
      });
    } else {
      console.log("not logged in");
      reject(new Error("Not logged in"));
    }

    await session.logout();
  });
};

export { makeAuthenticatedGetRequest, getTokenUsage, createNewContainer, createNewResource, deleteResource, updateExistingResource, replaceExistingResource, querySolidPod};