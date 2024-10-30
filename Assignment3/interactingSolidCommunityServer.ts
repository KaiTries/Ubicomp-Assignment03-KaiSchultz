import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';


// generally unwise to just have sensitive data like this in the code, but in this case it doesnt really matter

const id =  'my-token_05d83c6e-d48f-46bb-9fe4-684469f716d5'
const secret = '8c40d24775fc88a81e337ad6b8c664cb1f730041d38b3ef48dccc183ac5ca1f59fe4148824048c8c7cd9475d247d99fced4ceb301034f98348aec18427ecae46'
const resource = 'https://wiser-solid-xi.interactions.ics.unisg.ch/.account/account/688e5644-6e00-4349-94bd-0eab40a71998/client-credentials/cc4d7d86-6cab-4fda-8da3-4a9a94808553/'
const mainUri = "https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/";

// First we request the account API controls to find out where we can log in
const authenticate = async (): Promise<any> => {
  const indexResponse = await fetch('https://wiser-solid-xi.interactions.ics.unisg.ch/.account/');
  const { controls } = await indexResponse.json();

  // And then we log in to the account API
  const response = await fetch(controls.password.login, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'schultz.kai@student.unisg.ch', password: 'ubicomp24' }),
  });
  // This authorization value will be used to authenticate in the next step
  const { authorization } = await response.json();
  return authorization;
}

const getAuthorizationToken = async (authorization: any): Promise<any> => {
  const indexResponse = await fetch('https://wiser-solid-xi.interactions.ics.unisg.ch/.account/', {
    headers: { authorization: `CSS-Account-Token ${authorization}` }
  });
  const{controls} = await indexResponse.json();
  const response= await fetch(controls.account.clientCredentials, {
    method: 'POST',
    headers: { authorization: `CSS-Account-Token ${authorization}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'my-token', webId: 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/profile/card#me' }),
});
  const { id, secret, resource } = await response.json();
  return [id, secret, resource]
}

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
    console.log(await response.text());
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

const createNewResource = async (accessToken: any, dpopKey: any, resourcename: any, resourceContent) => {
  const resourceUrl = mainUri + resourcename;
    const dpopHeader = await createDpopHeader(resourceUrl, 'PUT', dpopKey);
    const response = await fetch(resourceUrl, {
      method: 'PUT',
      headers: {
        authorization: `DPoP ${accessToken}`,
        dpop: dpopHeader,
        'content-type': 'text/turtle',
      },
      body: resourceContent
    });
    console.log(await response.text());
}

const updateExistingResource = async (accessToken: any, dpopKey: any, resourcename: any, resourceContent) => {
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

const runAsyncFunctions = async () => {

  // const idInfo = await authenticate();
  // const tokenAuth = await getAuthorizationToken(idInfo);
  // console.log(tokenAuth);
  
  const [token,dpopKey] = await getTokenUsage(id,secret);
  

  // const resourceUrl = 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/.acl';
  // await makeAuthenticatedGetRequest(token, dpopKey, resourceUrl);

  // await createNewContainer(token, dpopKey, "test");
  // await createNewContainer(token, dpopKey, "gazeData");

  // const hobbies = "I enjoy running and my favorite langs are java and c++";
  // createNewResource(token, dpopKey, "test/myhobbies.txt", hobbies);

  const aclContent = `
  @prefix : <#>.
  @prefix acl: <http://www.w3.org/ns/auth/acl#>.
  @prefix foaf: <http://xmlns.com/foaf/0.1/>.
  @prefix k: <./>.
  @prefix c: <profile/card#>.

  :ControlReadWrite
      a acl:Authorization;
      acl:accessTo k:;
      acl:agent c:me;
      acl:default k:;
      acl:mode acl:Control, acl:Read, acl:Write.
  :Read
      a acl:Authorization;
      acl:accessTo k:;
      acl:agentClass foaf:Agent;
      acl:default k:;
      acl:mode acl:Read.`;

  // createNewResource(token, dpopKey, "test/.acl", aclContent);

  const additionalRule = `INSERT DATA { 
  <#ReadWrite> 
    a <http://www.w3.org/ns/auth/acl#Authorization>;
    <http://www.w3.org/ns/auth/acl#accessTo> <https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/test/myhobbies.txt>;
    <http://www.w3.org/ns/auth/acl#default> <https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/test/myhobbies.txt>;
    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read>, <http://www.w3.org/ns/auth/acl#Write>;
    <http://www.w3.org/ns/auth/acl#agent> <https://wiser-solid-xi.interactions.ics.unisg.ch/raffael_ubicomp24/profile/card#me>.
    }`;
  
  // updateExistingResource(token, dpopKey, "test/.acl", additionalRule);

  const resourceUrl = 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/test/.acl';
  await makeAuthenticatedGetRequest(token, dpopKey, resourceUrl);
}
 
runAsyncFunctions()