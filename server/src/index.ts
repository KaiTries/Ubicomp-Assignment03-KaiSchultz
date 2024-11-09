// src/index.ts
import express, { Express, Request, Response, NextFunction } from "express";
import { Session } from '@inrupt/solid-client-authn-node';
import dotenv from "dotenv";
import { getTokenUsage, makeAuthenticatedGetRequest, createNewContainer, createNewResource, updateExistingResource, replaceExistingResource, deleteResource, querySolidPod } from "./utils/solid"
import { jsonToCsv, jsonValuesToCsv, currentActivityTemplate, addRule } from "./utils/util";
import * as $rdf from 'rdflib';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8085;
const mainUri = "https://wiser-solid-xi.interactions.ics.unisg.ch/";
const kai_baseUri = process.env.MAINURI || 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/';
const kai_activity = 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/gazeData/currentActivity.ttl';
const david_activity = 'https://wiser-solid-xi.interactions.ics.unisg.ch/Davids-Pod/gazeData/currentActivity.ttl';
const raffael_activity = 'https://wiser-solid-xi.interactions.ics.unisg.ch/raffael_ubicomp24/gazeData/currentActivity.ttl';
app.use(express.json());

let accessToken: string;
let dpopKey: string;
let expiresIn: number;
let refreshTimeout: NodeJS.Timeout;
let friends: Friend[] = [];

// authenticate the session
const authenticateSession = async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = async () => {
    try {
      const id = process.env.ID;
      const secret = process.env.SECRET;
      [accessToken, dpopKey, expiresIn] = await getTokenUsage(id, secret);
      console.log(`Token refreshed, expires in ${expiresIn} seconds`);

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(refreshToken, (expiresIn - 60) * 1000);
    } catch (error) {
      console.error("Failed to refresh token:", error);
    }
  };
  if (!accessToken || !dpopKey) {
    await refreshToken();
  }

  req.accessToken = accessToken;
  req.dpopKey = dpopKey;
  next();
};

app.use(authenticateSession);

const requestQueue: Array<{ req: Request, res: Response }> = [];
let isProcessing = false;

// because gaze data is sent frequently from hololens need to make queue otherwise the requests override each other
const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const { req, res } = requestQueue.shift()!;

  try {
    const podName = "gazeData";
    const resourceName = "kaiTest1.csv";
    const requestContent = req.body;
    if (typeof requestContent !== 'object' || requestContent === null) {
      res.status(400).send("Bad Request: Invalid JSON content");
      return;
    }

    const oldResource = await makeAuthenticatedGetRequest(req.accessToken, req.dpopKey, kai_baseUri + podName + "/" + resourceName);
    const newResource = oldResource + "\n" + jsonValuesToCsv(requestContent);
    await replaceExistingResource(req.accessToken, req.dpopKey, podName + "/" + resourceName, newResource, "text/csv");

    res.send("Resource updated");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  } finally {
    isProcessing = false;
    processQueue();
  }
};

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

// get a resource from a container
app.get("/resource/:container/:resource", async (req: Request, res: Response) => {
  const container = req.params.container;
  const resource = req.params.resource;
  const resourceUrl = kai_baseUri + container + "/" + resource;
  const result = await makeAuthenticatedGetRequest(req.accessToken, req.dpopKey, resourceUrl);
  res.send(result);
});

// delete a resource from a container
app.delete("/resource/:container/:resourceName", async (req: Request, res: Response) => {
  const container = req.params.container;
  const resourceName = req.params.resourceName;
  await deleteResource(req.accessToken, req.dpopKey, kai_baseUri + container + "/" + resourceName);
  res.send("Resource deleted");
});

// create a new container
app.post("/container/:containerName", async (req: Request, res: Response) => {
  const containerName = req.params.containerName;
  await createNewContainer(req.accessToken, req.dpopKey, containerName);
  res.send("Container created");
});

// create a new  resource in a container, either a turtle or csv file
app.post("/resource/:container/:resourceName", async (req: Request, res: Response) => {
  const container = req.params.container;
  const resourceName = req.params.resourceName;
  const resourceContent = req.body;

  if (resourceName.endsWith(".ttl")) {
    await createNewResource(req.accessToken, req.dpopKey, container + "/" + resourceName, "text/turtle", resourceContent);
  } else {
    await createNewResource(req.accessToken, req.dpopKey, container + "/" + resourceName, "text/csv", resourceContent);
  }
  res.send("Resource created");
});

// update an existing resource in a container
app.patch("/resource/:container/:resourceName", async (req: Request, res: Response) => {
  const container = req.params.container;
  const resourceName = req.params.resourceName;
  const resourceContent = req.body;
  await updateExistingResource(req.accessToken, req.dpopKey, container + "/" + resourceName, resourceContent);
  res.send("Resource updated");
});


// add a friend to the profile card
app.post("/friends", async (req: Request, res: Response) => {
  const friendWebId = req.body.friendWebId;
  const friendName = req.body.friendName;
  const friendContent = `
    <${kai_baseUri + "profile/card#me"}> <http://xmlns.com/foaf/0.1/knows> <${friendWebId}> .
    <${friendWebId}> a <http://xmlns.com/foaf/0.1/Person> ;
                     <http://xmlns.com/foaf/0.1/name> "${friendName}" ;
                     <http://xmlns.com/foaf/0.1/webId> <${friendWebId}> .
  `;

  const query = `
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX base: <https://wiser-solid-xi.interactions.ics.unisg.ch/>
  INSERT DATA {
    ${friendContent}
  }`;


  await updateExistingResource(req.accessToken, req.dpopKey, "profile/card", query);
  res.send("Friend added");
  }
);

interface Friend {
  friendName: string;
  friendWebId?: string;
}

// get the name of my friends and their webId
app.get("/friends", async (req: Request, res: Response) => {
  const resourceUrl = kai_baseUri + "profile/card";
  const rdfContent = await makeAuthenticatedGetRequest(req.accessToken, req.dpopKey, resourceUrl);

  const store = $rdf.graph();
  const baseUri = "https://wiser-solid-xi.interactions.ics.unisg.ch/kai2_ubicomp24/profile/card";
  $rdf.parse(rdfContent, store,baseUri, 'text/turtle');

  const query = $rdf.SPARQLToQuery(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    SELECT ?friendName ?friendWebId WHERE {
      <${baseUri}#me> foaf:knows ?friend .
      ?friend foaf:name ?friendName ;
              foaf:webId ?friendWebId .
    }
  `, false, store);

  if (query) {
    const results: Friend[] = [];
    friends = [];
    store.query(query, (result) => {
      results.push({
        friendName: result['?friendName'].value
      });
      friends.push(
        {
          friendName: result['?friendName'].value,
          friendWebId: result['?friendWebId'].value
        }
      );
    });

    setTimeout(() => {
      if (results.length === 0) {
        console.error('No results found for the SPARQL query');
        res.status(404).send("No results found");
      } else {
        res.send(results);
      }
    }, 1000); // Adjust the timeout duration as needed
  } else {
    console.error('Failed to parse SPARQL query');
    res.status(500).send("Internal Server Error");
  }
}
);

app.post("/share", async (req: Request, res: Response) => {
  // request body is a json array
  const checkedFriends = req.body;
  // find the friend in the friends array, with the body that is just names
  if (checkedFriends.length === 0) {
    res.status(400).send("Bad Request: Empty friend list");
    return;
  }

  const wantedFriends = checkedFriends.map((n: any) => {
    const friend = friends.find((f: Friend) => f.friendName === n.friendName);
    if (!friend) {
      console.error(`Friend ${n.friendName} not found`);
      return null;
    }
    return friend;
  });
  if (wantedFriends.some((f: any) => f === null)) {
    res.status(404).send("Not Found: Some friends not found");
    return;
  }

  for (const friend of wantedFriends) {
    const additionalRule = addRule(kai_baseUri + "gazeData/currentActivity.ttl", kai_baseUri + "gazeData/", friend!.friendWebId!);
    await updateExistingResource(req.accessToken, req.dpopKey, "gazeData/.acl", additionalRule);
  }
  res.send("Resource shared");
}
);

app.post("/query", async (req: Request, res: Response) => {
  const mUri = req.body.mainUri;
  const result = await querySolidPod(mUri + "profile/card", mUri + "gazeData/currentActivity.ttl");
  if (result.length === 0) {
    res.status(404).send("No results found");
    return;
  }
  console.log("Sending additional information for the current activity");
  res.send(result);
}
);


// gets the current activity of a person and returns the activity name, probability, end time and person name
app.get("/currentActivity/:who", async (req: Request, res: Response) => {
  const who = req.params.who;
  const resourceUrl = who === "kai" ? kai_activity : who === "david" ? david_activity : raffael_activity;
  const rdfContent = await makeAuthenticatedGetRequest(req.accessToken, req.dpopKey, resourceUrl);


  const store = $rdf.graph();
  $rdf.parse(rdfContent, store,resourceUrl, 'text/turtle');

  const query = $rdf.SPARQLToQuery(`
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX schema: <https://schema.org/>
    PREFIX bm: <http://bimerr.iot.linkeddata.es/def/occupancy-profile#>

    SELECT ?personName ?probability ?activityName ?endTime WHERE {
      <${resourceUrl}> 
        schema:name ?activityName ;
        bm:probability ?probability ;
        prov:endedAtTime ?endTime ;
        prov:wasAssociatedWith ?person .
      ?person foaf:name ?personName .
    }
  `, false, store);

  if (query) {
    let resultsFound = false;
    store.query(query, (result) => {
      resultsFound = true;
      console.log("Sending current activity of " + who);
      res.send({
        personName: result['?personName'].value,
        probability: result['?probability'].value,
        activityName: result['?activityName'].value,
        endTime: result['?endTime'].value,
        mainUri: who === "kai" ? kai_baseUri : who === "david" ? "https://wiser-solid-xi.interactions.ics.unisg.ch/Davids-Pod/" : "https://wiser-solid-xi.interactions.ics.unisg.ch/raffael_ubicomp24/"
      });
    });

    setTimeout(() => {
      if (!resultsFound) {
        console.error('No results found for the SPARQL query');
        res.status(404).send("No results found");
      }
    }, 1000); 
  } else {
    console.error('Failed to parse SPARQL query');
    res.status(500).send("Internal Server Error");
  }
});

// updates the current Activity of myself
app.post("/classify", async (req: Request, res: Response) => {
  const requestContent = req.body;

  if (typeof requestContent !== 'object' || requestContent === null) {
    res.status(400).send("Bad Request: Invalid JSON content");
    return;
  }

  const { classification, schemaName, probability, endTime } = requestContent;

  const newActivityContent = currentActivityTemplate(classification, schemaName, probability, endTime);


  const query = `
  PREFIX schema: <https://schema.org/>
  PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX bm: <http://bimerr.iot.linkeddata.es/def/occupancy-profile#>
  DELETE WHERE {
      <${kai_baseUri + "gazeData/currentActivity.ttl"}> ?p ?o .
  };
  INSERT DATA {
      ${newActivityContent}
  }`;

  await updateExistingResource(req.accessToken, req.dpopKey, "gazeData/currentActivity.ttl", query);
  console.log(`Updated activity with new Prediction: ${classification} with probability ${probability} | ended at: ${endTime}`);

  res.send("Resource updated");
});

// updates the gazeData csv with the new gaze data
app.post("/gazeData", async (req: Request, res: Response): Promise<void> => {
  requestQueue.push({ req, res });
  processQueue();
}
);


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});