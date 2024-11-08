// src/index.ts
import express, { Express, Request, Response, NextFunction } from "express";
import { Session } from '@inrupt/solid-client-authn-node';
import dotenv from "dotenv";
import { getTokenUsage, makeAuthenticatedGetRequest, createNewContainer, createNewResource, updateExistingResource, replaceExistingResource, deleteResource } from "./utils/solid"
import { jsonToCsv, jsonValuesToCsv } from "./utils/util";


dotenv.config();

const app: Express = express();
const session = new Session();
const port = process.env.PORT || 3000;
const kai_baseUri = process.env.MAINURI || 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/';

app.use(express.json());

let accessToken: string;
let dpopKey: string;

const authenticateSession = async (req: Request, res: Response, next: NextFunction) => {
  if (!accessToken || !dpopKey) {
    const id = process.env.ID;
    const secret = process.env.SECRET;
    [accessToken, dpopKey] = await getTokenUsage(id, secret);
  }
  req.accessToken = accessToken;
  req.dpopKey = dpopKey;
  next();
};

app.use(authenticateSession);





app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/authGet/:podName/:resource", async (req: Request, res: Response) => {
  const podName = req.params.podName;
  const resource = req.params.resource;
  const resourceUrl = kai_baseUri + podName + "/" + resource;
  await makeAuthenticatedGetRequest(req.accessToken, req.dpopKey, resourceUrl);
  res.send("Authenticated GET request made");
});

app.delete("/resource/:podName/:resourceName", async (req: Request, res: Response) => {
  const podName = req.params.podName;
  const resourceName = req.params.resourceName;
  await deleteResource(req.accessToken, req.dpopKey, podName + "/" + resourceName);
  res.send("Resource deleted");
});

app.post("/resource/:podName/:resourceName", async (req: Request, res: Response) => {
  const podName = req.params.podName;
  const resourceName = req.params.resourceName;
  const resourceContent = req.body;

  if (resourceName.endsWith(".ttl")) {
    await createNewResource(req.accessToken, req.dpopKey, podName + "/" + resourceName, "text/turtle", resourceContent);
  } else {
    await createNewResource(req.accessToken, req.dpopKey, podName + "/" + resourceName, "text/csv", resourceContent);
  }
  res.send("Resource created");
});


app.post("/gazeData", async (req: Request, res: Response): Promise<void> => {
  const podName = "gazeData";
  const resourceName = "kaiTest1.csv";
  const requestContent = req.body;

  console.log(req.body);

  if (typeof requestContent !== 'object' || requestContent === null) {
    res.status(400).send("Bad Request: Invalid JSON content");
    return;
  }

  const oldResource = await makeAuthenticatedGetRequest(req.accessToken, req.dpopKey, kai_baseUri + podName + "/" + resourceName);
  console.log(oldResource);

  const newResource = oldResource + "\n" + jsonValuesToCsv(requestContent);
  await replaceExistingResource(req.accessToken, req.dpopKey, podName + "/" + resourceName, newResource);

  res.send("Resource updated");
}
);


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});