import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { Session } from '@inrupt/solid-client-authn-node';
import { QueryEngine } from '@comunica/query-sparql-solid';


const mainUri = process.env.MAINURI || 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/';

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
    const { access_token: accessToken } = token;
  
   return [accessToken, dpopKey];
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


const deleteResource = async (accessToken: any, dpopKey: any, resourcename: any) => {
    const resourceUrl = mainUri + resourcename;
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

const replaceExistingResource = async (accessToken: any, dpopKey: any, resourcename: any, resourceContent: any) => {
    const resourceUrl = mainUri + resourcename;
      const dpopHeader = await createDpopHeader(resourceUrl, 'PUT', dpopKey);
      const response = await fetch(resourceUrl, {
        method: 'PUT',
        headers: {
          authorization: `DPoP ${accessToken}`,
          dpop: dpopHeader,
          'content-type': 'text/csv',
        },
        body: resourceContent
      });
      console.log(await response.text());
  }

export { makeAuthenticatedGetRequest, getTokenUsage, createNewContainer, createNewResource, deleteResource, updateExistingResource, replaceExistingResource };