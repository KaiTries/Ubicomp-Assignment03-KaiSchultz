// src/index.ts
import express, { Express, Request, Response } from "express";
import { Session } from '@inrupt/solid-client-authn-node';
import dotenv from "dotenv";
import { getTokenUsage, makeAuthenticatedGetRequest, createNewContainer, createNewResource, updateExistingResource, replaceExistingResource, deleteResource } from "./utils/solid"
import { jsonToCsv, jsonValuesToCsv } from "./utils/util";


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const kai_baseUri = process.env.MAINURI || 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/';

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});


app.get("/authGet/:podName/:resource", async (req: Request, res: Response) => {
  const id = process.env.ID;
  const secret = process.env.SECRET;
  const [accessToken, dpopKey] = await getTokenUsage(id, secret);
  const podName = req.params.podName;
  const resource = req.params.resource;
  const resourceUrl = kai_baseUri + podName + "/" + resource;
  makeAuthenticatedGetRequest(accessToken, dpopKey, resourceUrl);
  res.send("Authenticated GET request made");
  }
);

app.delete("/resource/:podName/:resourceName", async (req: Request, res: Response) => {
  const id = process.env.ID;
  const secret = process.env.SECRET;
  const [accessToken, dpopKey] = await getTokenUsage(id, secret);
  const podName = req.params.podName;
  const resourceName = req.params.resourceName;

  deleteResource(accessToken, dpopKey, podName + "/" + resourceName);
  res.send("Resource deleted");
  }
);

app.post("/resource/:podName/:resourceName", async (req: Request, res: Response) => {
  const id = process.env.ID;
  const secret = process.env.SECRET;
  const [accessToken, dpopKey] = await getTokenUsage(id, secret);
  const podName = req.params.podName;
  const resourceName = req.params.resourceName;
  const resourceContent = req.body;

  if (resourceName.endsWith(".ttl")) {
    createNewResource(accessToken, dpopKey, podName + "/" + resourceName, "text/turtle", resourceContent);
  } else {
    createNewResource(accessToken, dpopKey, podName + "/" + resourceName, "text/csv", resourceContent);
  }
  res.send("Resource created");
  }
);

app.get("/create/:podName", async (req: Request, res: Response) => {
  const id = process.env.ID;
  const secret = process.env.SECRET;
  const [accessToken, dpopKey] = await getTokenUsage(id, secret);
  const podName = req.params.podName;
  createNewContainer(accessToken, dpopKey, podName);
  res.send("Container created");
  }
);

app.post("/gazeData", async (req: Request, res: Response) => {
  const id = process.env.ID;
  const secret = process.env.SECRET;
  const [accessToken, dpopKey] = await getTokenUsage(id, secret);
  const podName = "gazeData";
  const resourceName = "kaiTest1.csv";
  const requestContent = req.body;
  const oldResource = await makeAuthenticatedGetRequest(accessToken, dpopKey, kai_baseUri + podName + "/" + resourceName);
  console.log(oldResource);



  const newResource = oldResource + "\n" + jsonValuesToCsv(requestContent);
  replaceExistingResource(accessToken, dpopKey, podName + "/" + resourceName, newResource);

  res.send("Resource created");
  }
);




app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});