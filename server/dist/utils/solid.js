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
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceExistingResource = exports.updateExistingResource = exports.deleteResource = exports.createNewResource = exports.createNewContainer = exports.getTokenUsage = exports.makeAuthenticatedGetRequest = void 0;
const solid_client_authn_core_1 = require("@inrupt/solid-client-authn-core");
const mainUri = process.env.MAINURI || 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/';
const getTokenUsage = (id, secret) => __awaiter(void 0, void 0, void 0, function* () {
    // A key pair is needed for encryption.
    // This function from `solid-client-authn` generates such a pair for you.
    const dpopKey = yield (0, solid_client_authn_core_1.generateDpopKeyPair)();
    // These are the ID and secret generated in the previous step.
    // Both the ID and the secret need to be form-encoded.
    const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
    // This URL can be found by looking at the "token_endpoint" field at
    const tokenUrl = 'https://wiser-solid-xi.interactions.ics.unisg.ch/.oidc/token';
    const response = yield fetch(tokenUrl, {
        method: 'POST',
        headers: {
            // The header needs to be in base64 encoding.
            authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded',
            dpop: yield (0, solid_client_authn_core_1.createDpopHeader)(tokenUrl, 'POST', dpopKey),
        },
        body: 'grant_type=client_credentials&scope=webid',
    });
    // This is the Access token that will be used to do an authenticated request to the server.
    // The JSON also contains an "expires_in" field in seconds,
    // which you can use to know when you need request a new Access token.
    const token = yield response.json();
    const { access_token: accessToken } = token;
    return [accessToken, dpopKey];
});
exports.getTokenUsage = getTokenUsage;
const makeAuthenticatedGetRequest = (accessToken, dpopKey, resourceUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(resourceUrl, {
        method: 'GET',
        headers: {
            authorization: `DPoP ${accessToken}`,
            dpop: yield (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'GET', dpopKey),
        },
    });
    const responseText = yield response.text();
    console.log(responseText);
    return responseText;
});
exports.makeAuthenticatedGetRequest = makeAuthenticatedGetRequest;
const createNewContainer = (accessToken, dpopKey, podName) => __awaiter(void 0, void 0, void 0, function* () {
    const resourceUrl = mainUri + podName + "/";
    const dpopHeader = yield (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'PUT', dpopKey);
    const response = yield fetch(resourceUrl, {
        method: 'PUT',
        headers: {
            authorization: `DPoP ${accessToken}`,
            dpop: dpopHeader
        },
    });
    console.log(yield response.text());
});
exports.createNewContainer = createNewContainer;
const createNewResource = (accessToken, dpopKey, resourcename, rtype, resourceContent) => __awaiter(void 0, void 0, void 0, function* () {
    const resourceUrl = mainUri + resourcename;
    const dpopHeader = yield (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'PUT', dpopKey);
    const response = yield fetch(resourceUrl, {
        method: 'PUT',
        headers: {
            authorization: `DPoP ${accessToken}`,
            dpop: dpopHeader,
            'content-type': `${rtype}`,
        },
        body: resourceContent
    });
    console.log(yield response.text());
});
exports.createNewResource = createNewResource;
const deleteResource = (accessToken, dpopKey, resourcename) => __awaiter(void 0, void 0, void 0, function* () {
    const resourceUrl = mainUri + resourcename;
    const dpopHeader = yield (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'DELETE', dpopKey);
    const response = yield fetch(resourceUrl, {
        method: 'DELETE',
        headers: {
            authorization: `DPoP ${accessToken}`,
            dpop: dpopHeader,
        },
    });
    console.log(yield response.text());
});
exports.deleteResource = deleteResource;
const updateExistingResource = (accessToken, dpopKey, resourcename, resourceContent) => __awaiter(void 0, void 0, void 0, function* () {
    const resourceUrl = mainUri + resourcename;
    const dpopHeader = yield (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'PATCH', dpopKey);
    const response = yield fetch(resourceUrl, {
        method: 'PATCH',
        headers: {
            authorization: `DPoP ${accessToken}`,
            dpop: dpopHeader,
            'content-type': 'application/sparql-update',
        },
        body: resourceContent
    });
    console.log(yield response.text());
});
exports.updateExistingResource = updateExistingResource;
const replaceExistingResource = (accessToken, dpopKey, resourcename, resourceContent) => __awaiter(void 0, void 0, void 0, function* () {
    const resourceUrl = mainUri + resourcename;
    const dpopHeader = yield (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'PUT', dpopKey);
    const response = yield fetch(resourceUrl, {
        method: 'PUT',
        headers: {
            authorization: `DPoP ${accessToken}`,
            dpop: dpopHeader,
            'content-type': 'text/csv',
        },
        body: resourceContent
    });
    console.log(yield response.text());
});
exports.replaceExistingResource = replaceExistingResource;
