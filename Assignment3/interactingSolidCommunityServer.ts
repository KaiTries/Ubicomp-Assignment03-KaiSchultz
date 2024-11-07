import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { Session } from '@inrupt/solid-client-authn-node';
import { QueryEngine } from '@comunica/query-sparql-solid';


// generally unwise to just have sensitive data like this in the code, but in this case it doesnt really matter
const id =  'my-token_05d83c6e-d48f-46bb-9fe4-684469f716d5'
const secret = '8c40d24775fc88a81e337ad6b8c664cb1f730041d38b3ef48dccc183ac5ca1f59fe4148824048c8c7cd9475d247d99fced4ceb301034f98348aec18427ecae46'
const id_provider = 'https://wiser-solid-xi.interactions.ics.unisg.ch/'
const resource = 'https://wiser-solid-xi.interactions.ics.unisg.ch/.account/account/688e5644-6e00-4349-94bd-0eab40a71998/client-credentials/cc4d7d86-6cab-4fda-8da3-4a9a94808553/'
const mainUri = "https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/";


// root uris
const root_myFamilyInfo = mainUri + 'myFamilyInfo.txt';
const root_acl = mainUri + '.acl';
const root_profile = mainUri + 'profile/card';

// resource uris
const test_main = mainUri + 'test/';
const test_acl = test_main + '.acl';
const test_myhobbies = test_main + 'myhobbies.txt';
const test_myFriendsInfo = test_main + 'myFriendsInfo.txt';

// gazeData
const gaze_main = mainUri + 'gazeData/';
const gazeData_acl = gaze_main + '.acl';
const gazeData_currentActivity = gaze_main + 'currentActivity.ttl';

// agent uris
const david = 'https://wiser-solid-xi.interactions.ics.unisg.ch/Davids-Pod/profile/card#me';
const davis_activity = 'https://wiser-solid-xi.interactions.ics.unisg.ch/Davids-Pod/gazeData/currentActivity.ttl';
const raffael = 'https://wiser-solid-xi.interactions.ics.unisg.ch/raffael_ubicomp24/profile/card#me';

// robot
const robot = "https://wiser-solid-xi.interactions.ics.unisg.ch/robotSG/";

// other string constants
const currentActivity = `
#use https://schema.org/SearchAction when an activity is classified as "Searching Activity"
#use https://schema.org/CheckAction when an activity is classified as "Inspection Activity" 

@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix schema: <https://schema.org/> .
@prefix bm: <http://bimerr.iot.linkeddata.es/def/occupancy-profile#> .

<https://solid.interactions.ics.unisg.ch/kai_ubicomp24/gazeData/currentActivity.ttl> a prov:Activity, schema:ReadAction;
                                                                              schema:name "Read action"^^xsd:string;
                                                                              prov:wasAssociatedWith <https://solid.interactions.ics.unisg.ch/kai_ubicomp24/profile/card#me>;
                                                                              prov:used <https://solid.interactions.ics.unisg.ch/kai_ubicomp24/gazeData/kaiTest1.csv>;
                                                                              prov:endedAtTime "2022-10-14T02:02:02Z"^^xsd:dateTime;
                                                                              bm:probability  "0.87"^^xsd:float.
<https://solid.interactions.ics.unisg.ch/kai_ubicomp24/profile/card#me> a foaf:Person, prov:Agent;
                                                                 foaf:name "Kai Schultz";
                                                                 foaf:mbox <mailto:kai.schultz@student.unisg.ch>.`;





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

const createNewResource = async (accessToken: any, dpopKey: any, resourcename: any, resourceContent: any) => {
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



const runAsyncFunctions = async () => {

  // 1. authenticate with the server to obtain id and secret 

  // const idInfo = await authenticate();
  // const tokenAuth = await getAuthorizationToken(idInfo);
  // console.log(tokenAuth);

  // 2. get the token and dpop key 
  const [token,dpopKey] = await getTokenUsage(id,secret);
  

  // 3. create the containers "test" and "gazeData"

  // await createNewContainer(token, dpopKey, "test");
  // await createNewContainer(token, dpopKey, "gazeData");

  // 4. create the resource "myhobbies.txt" in the "test" container and add some content to it

  // const hobbies = "I enjoy running and my favorite langs are java and c++";
  // createNewResource(token, dpopKey, "test/myhobbies.txt", hobbies);

  // 5. standard acl content that allows logged in agents to read the resource
  const aclContent = `
  @prefix : <#>.
  @prefix acl: <http://www.w3.org/ns/auth/acl#>.
  @prefix foaf: <http://xmlns.com/foaf/0.1/>.
  @prefix k: <./>.
  @prefix c: <https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/profile/card#>.

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

  // 5. acl file that only allows owner to read and write
  const aclContent_private = `
      @prefix : <#>.
      @prefix acl: <http://www.w3.org/ns/auth/acl#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/>.
      @prefix k: <./>.
      @prefix c: <https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/profile/card#>.
    
      :ControlReadWrite
          a acl:Authorization;
          acl:accessTo k:;
          acl:agent c:me;
          acl:default k:;
          acl:mode acl:Control, acl:Read, acl:Write.`;

  // 6. create the acl file for the "test" container and the "gazeData" container

  // await createNewResource(token, dpopKey, "test/.acl", aclContent);
  // await createNewResource(token, dpopKey, "gazeData/.acl", aclContent_private);

  // 7. create additional acl rules that allow collegues to write to the "myhobbies.txt" file
  const additionalRule = addRule(test_myhobbies, test_main , david, "Write");
  const additionalRule2 = addRule(test_myFriendsInfo, test_main, raffael, "Write");
  
  // 8. update the acl file with the additional rules
  // await updateExistingResource(token, dpopKey, "test/.acl", additionalRule);
  // await updateExistingResource(token, dpopKey, "test/.acl", additionalRule2);

  // 9. create additional resources to allow testing of access permissions
  // await createNewResource(token, dpopKey, "test/myFriendsInfo.txt", "I have a few friends");
  // await createNewResource(token, dpopKey, "myFamilyInfo.txt", "I have a brother and a sister");

  // await makeAuthenticatedGetRequest(token, dpopKey, root_acl);

  // 10. create the resources "currentActivity.ttl" and "kaiTest1.csv" in the "gazeData" container
  // await createNewResource(token, dpopKey, "gazeData/currentActivity.ttl",currentActivity);
  // await createNewResource(token, dpopKey, "gazeData/kaiTest1.csv", "");

  // 11. create acl rules that allow the agents to read the "currentActivity.ttl" file
  const activityRule = addRule(gazeData_currentActivity,gaze_main ,david);
  const activitRule2 = addRule(gazeData_currentActivity,gaze_main ,raffael);
  

  // 12. update the acl file with the additional rules
  // await updateExistingResource(token, dpopKey, "gazeData/.acl", activityRule);
  // await updateExistingResource(token, dpopKey, "gazeData/.acl", activitRule2);
  // const t = "https://wiser-solid-xi.interactions.ics.unisg.ch/Davids-Pod/test/myhobbies.txt";


  // 13. update my profile card with occupation
  // await updateExistingResource(token, dpopKey, "profile/card", "INSERT DATA { <#me> <https://ics.unisg.ch#hasOccupation> <https://ics.unisg.ch#manager> }");

  await makeAuthenticatedGetRequest(token, dpopKey, robot + "profile/card");

  const session = new Session();
  const myEngine = new QueryEngine(); 
  // await session.login({
  //   clientId: id,
  //   clientSecret: secret,
  //   oidcIssuer: id_provider
  // });

  if(session.info.isLoggedIn && typeof session.info.webId === 'string') { 
    console.log("logged in") 

    const bindingsStream = await myEngine.queryBindings(`
      SELECT * WHERE {
          ?s ?p ?o
      } LIMIT 100`, {
      // Set your profile as query source
      sources: [session.info.webId],
      // Pass the authenticated fetch function
      fetch: session.fetch,
    });

    // Log the results
    bindingsStream.on('data', (binding) => {
      console.log(binding.toString()); // Quick way to print bindings for testing

      console.log(binding.has('s')); // Will be true
      
      // Obtaining values
      console.log(binding.get('s').value);
      console.log(binding.get('s').termType);
      console.log(binding.get('p').value);
      console.log(binding.get('o').value);
    });

    bindingsStream.on('end', () => {
      console.log('All done!');
    });
  } else {
    console.log("not logged in")
  }

  await session.logout();
}

runAsyncFunctions()