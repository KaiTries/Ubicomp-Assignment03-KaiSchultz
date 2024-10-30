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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var solid_client_authn_core_1 = require("@inrupt/solid-client-authn-core");
var id = 'my-token_05d83c6e-d48f-46bb-9fe4-684469f716d5';
var secret = '8c40d24775fc88a81e337ad6b8c664cb1f730041d38b3ef48dccc183ac5ca1f59fe4148824048c8c7cd9475d247d99fced4ceb301034f98348aec18427ecae46';
var resource = 'https://wiser-solid-xi.interactions.ics.unisg.ch/.account/account/688e5644-6e00-4349-94bd-0eab40a71998/client-credentials/cc4d7d86-6cab-4fda-8da3-4a9a94808553/';
var mainUri = "https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/";
// First we request the account API controls to find out where we can log in
var authenticate = function () { return __awaiter(void 0, void 0, void 0, function () {
    var indexResponse, controls, response, authorization;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch('https://wiser-solid-xi.interactions.ics.unisg.ch/.account/')];
            case 1:
                indexResponse = _a.sent();
                return [4 /*yield*/, indexResponse.json()];
            case 2:
                controls = (_a.sent()).controls;
                return [4 /*yield*/, fetch(controls.password.login, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ email: 'schultz.kai@student.unisg.ch', password: 'Ipod1997' }),
                    })];
            case 3:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 4:
                authorization = (_a.sent()).authorization;
                return [2 /*return*/, authorization];
        }
    });
}); };
var getAuthorizationToken = function (authorization) { return __awaiter(void 0, void 0, void 0, function () {
    var indexResponse, controls, response, _a, id, secret, resource;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("This is the authorization that I get: ", authorization);
                return [4 /*yield*/, fetch('https://wiser-solid-xi.interactions.ics.unisg.ch/.account/', {
                        headers: { authorization: "CSS-Account-Token ".concat(authorization) }
                    })];
            case 1:
                indexResponse = _b.sent();
                return [4 /*yield*/, indexResponse.json()];
            case 2:
                controls = (_b.sent()).controls;
                console.log("This is the controls that I get: ", controls);
                return [4 /*yield*/, fetch(controls.account.clientCredentials, {
                        method: 'POST',
                        headers: { authorization: "CSS-Account-Token ".concat(authorization), 'content-type': 'application/json' },
                        // The name field will be used when generating the ID of your token.
                        // The WebID field determines which WebID you will identify as when using the token.
                        // Only WebIDs linked to your account can be used.
                        body: JSON.stringify({ name: 'my-token', webId: 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/profile/card#me' }),
                    })];
            case 3:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 4:
                _a = _b.sent(), id = _a.id, secret = _a.secret, resource = _a.resource;
                return [2 /*return*/, [id, secret, resource]];
        }
    });
}); };
var getTokenUsage = function (id, secret) { return __awaiter(void 0, void 0, void 0, function () {
    var dpopKey, authString, tokenUrl, response, _a, _b, token, accessToken;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0: return [4 /*yield*/, (0, solid_client_authn_core_1.generateDpopKeyPair)()];
            case 1:
                dpopKey = _e.sent();
                authString = "".concat(encodeURIComponent(id), ":").concat(encodeURIComponent(secret));
                tokenUrl = 'https://wiser-solid-xi.interactions.ics.unisg.ch/.oidc/token';
                _a = fetch;
                _b = [tokenUrl];
                _c = {
                    method: 'POST'
                };
                _d = {
                    // The header needs to be in base64 encoding.
                    authorization: "Basic ".concat(Buffer.from(authString).toString('base64')),
                    'content-type': 'application/x-www-form-urlencoded'
                };
                return [4 /*yield*/, (0, solid_client_authn_core_1.createDpopHeader)(tokenUrl, 'POST', dpopKey)];
            case 2: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = (_d.dpop = _e.sent(),
                        _d),
                        _c.body = 'grant_type=client_credentials&scope=openid webid',
                        _c)]))];
            case 3:
                response = _e.sent();
                return [4 /*yield*/, response.json()];
            case 4:
                token = _e.sent();
                accessToken = token.access_token;
                return [2 /*return*/, [accessToken, dpopKey]];
        }
    });
}); };
var makeAuthenticatedRequest = function (accessToken, dpopKey, resourceUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var dpopHeader, response, _a, _b, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'GET', dpopKey)];
            case 1:
                dpopHeader = _c.sent();
                return [4 /*yield*/, fetch(resourceUrl, {
                        method: 'GET',
                        headers: {
                            authorization: "DPoP ".concat(accessToken),
                            dpop: dpopHeader,
                        },
                    })];
            case 2:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("HTTP error! Status: ".concat(response.status));
                }
                _b = (_a = console).log;
                return [4 /*yield*/, response.text()];
            case 3:
                _b.apply(_a, [_c.sent()]);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _c.sent();
                console.error('Error making authenticated request:', error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
var createNewContainer = function (accessToken, dpopKey, podName) { return __awaiter(void 0, void 0, void 0, function () {
    var resourceUrl, dpopHeader, response, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                resourceUrl = mainUri + podName + "/";
                return [4 /*yield*/, (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'PUT', dpopKey)];
            case 1:
                dpopHeader = _c.sent();
                return [4 /*yield*/, fetch(resourceUrl, {
                        method: 'PUT',
                        headers: {
                            authorization: "DPoP ".concat(accessToken),
                            dpop: dpopHeader
                        },
                    })];
            case 2:
                response = _c.sent();
                _b = (_a = console).log;
                return [4 /*yield*/, response.text()];
            case 3:
                _b.apply(_a, [_c.sent()]);
                return [2 /*return*/];
        }
    });
}); };
var createNewResource = function (accessToken, dpopKey, resourcename, resourceContent) { return __awaiter(void 0, void 0, void 0, function () {
    var resourceUrl, dpopHeader, response, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                resourceUrl = mainUri + resourcename;
                return [4 /*yield*/, (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'PUT', dpopKey)];
            case 1:
                dpopHeader = _c.sent();
                return [4 /*yield*/, fetch(resourceUrl, {
                        method: 'PUT',
                        headers: {
                            authorization: "DPoP ".concat(accessToken),
                            dpop: dpopHeader,
                            'content-type': 'text/turtle',
                        },
                        body: resourceContent
                    })];
            case 2:
                response = _c.sent();
                _b = (_a = console).log;
                return [4 /*yield*/, response.text()];
            case 3:
                _b.apply(_a, [_c.sent()]);
                return [2 /*return*/];
        }
    });
}); };
var updateExistingResource = function (accessToken, dpopKey, resourcename, resourceContent) { return __awaiter(void 0, void 0, void 0, function () {
    var resourceUrl, dpopHeader, response, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                resourceUrl = mainUri + resourcename;
                return [4 /*yield*/, (0, solid_client_authn_core_1.createDpopHeader)(resourceUrl, 'PATCH', dpopKey)];
            case 1:
                dpopHeader = _c.sent();
                return [4 /*yield*/, fetch(resourceUrl, {
                        method: 'PATCH',
                        headers: {
                            authorization: "DPoP ".concat(accessToken),
                            dpop: dpopHeader,
                            'content-type': 'application/sparql-update',
                        },
                        body: resourceContent
                    })];
            case 2:
                response = _c.sent();
                _b = (_a = console).log;
                return [4 /*yield*/, response.text()];
            case 3:
                _b.apply(_a, [_c.sent()]);
                return [2 /*return*/];
        }
    });
}); };
var runAsyncFunctions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, token, dpopKey, aclContent, additionalRule, resourceUrl;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, getTokenUsage(id, secret)];
            case 1:
                _a = _b.sent(), token = _a[0], dpopKey = _a[1];
                aclContent = "\n  @prefix : <#>.\n  @prefix acl: <http://www.w3.org/ns/auth/acl#>.\n  @prefix foaf: <http://xmlns.com/foaf/0.1/>.\n  @prefix k: <./>.\n  @prefix c: <profile/card#>.\n\n  :ControlReadWrite\n      a acl:Authorization;\n      acl:accessTo k:;\n      acl:agent c:me;\n      acl:default k:;\n      acl:mode acl:Control, acl:Read, acl:Write.\n  :Read\n      a acl:Authorization;\n      acl:accessTo k:;\n      acl:agentClass foaf:Agent;\n      acl:default k:;\n      acl:mode acl:Read.";
                additionalRule = "INSERT DATA { \n  <#ReadWrite> \n    a <http://www.w3.org/ns/auth/acl#Authorization>;\n    <http://www.w3.org/ns/auth/acl#accessTo> <https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/test/myhobbies.txt>;\n    <http://www.w3.org/ns/auth/acl#default> <https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/test/myhobbies.txt>;\n    <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read>, <http://www.w3.org/ns/auth/acl#Write>;\n    <http://www.w3.org/ns/auth/acl#agent> <https://wiser-solid-xi.interactions.ics.unisg.ch/raffael_ubicomp24/profile/card#me>.\n    }";
                updateExistingResource(token, dpopKey, "test/.acl", additionalRule);
                resourceUrl = 'https://wiser-solid-xi.interactions.ics.unisg.ch/kai_ubicomp24/test/.acl';
                return [4 /*yield*/, makeAuthenticatedRequest(token, dpopKey, resourceUrl)];
            case 2:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); };
runAsyncFunctions();
