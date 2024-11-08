"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const solid_1 = require("./utils/solid");
const util_1 = require("./utils/util");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const kai_baseUri = process.env.MAINURI || 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/';
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.get("/authGet/:podName/:resource", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = process.env.ID;
    const secret = process.env.SECRET;
    const [accessToken, dpopKey] = yield (0, solid_1.getTokenUsage)(id, secret);
    const podName = req.params.podName;
    const resource = req.params.resource;
    const resourceUrl = kai_baseUri + podName + "/" + resource;
    (0, solid_1.makeAuthenticatedGetRequest)(accessToken, dpopKey, resourceUrl);
    res.send("Authenticated GET request made");
}));
app.delete("/resource/:podName/:resourceName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = process.env.ID;
    const secret = process.env.SECRET;
    const [accessToken, dpopKey] = yield (0, solid_1.getTokenUsage)(id, secret);
    const podName = req.params.podName;
    const resourceName = req.params.resourceName;
    (0, solid_1.deleteResource)(accessToken, dpopKey, podName + "/" + resourceName);
    res.send("Resource deleted");
}));
app.post("/resource/:podName/:resourceName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = process.env.ID;
    const secret = process.env.SECRET;
    const [accessToken, dpopKey] = yield (0, solid_1.getTokenUsage)(id, secret);
    const podName = req.params.podName;
    const resourceName = req.params.resourceName;
    const resourceContent = req.body;
    if (resourceName.endsWith(".ttl")) {
        (0, solid_1.createNewResource)(accessToken, dpopKey, podName + "/" + resourceName, "text/turtle", resourceContent);
    }
    else {
        (0, solid_1.createNewResource)(accessToken, dpopKey, podName + "/" + resourceName, "text/csv", resourceContent);
    }
    res.send("Resource created");
}));
app.get("/create/:podName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = process.env.ID;
    const secret = process.env.SECRET;
    const [accessToken, dpopKey] = yield (0, solid_1.getTokenUsage)(id, secret);
    const podName = req.params.podName;
    (0, solid_1.createNewContainer)(accessToken, dpopKey, podName);
    res.send("Container created");
}));
app.post("/gazeData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = process.env.ID;
    const secret = process.env.SECRET;
    const [accessToken, dpopKey] = yield (0, solid_1.getTokenUsage)(id, secret);
    const podName = "gazeData";
    const resourceName = "kaiTest1.csv";
    const requestContent = req.body;
    const oldResource = yield (0, solid_1.makeAuthenticatedGetRequest)(accessToken, dpopKey, kai_baseUri + podName + "/" + resourceName);
    console.log(oldResource);
    const newResource = oldResource + "\n" + (0, util_1.jsonToCsv)(requestContent);
    (0, solid_1.replaceExistingResource)(accessToken, dpopKey, podName + "/" + resourceName, newResource);
    res.send("Resource created");
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
