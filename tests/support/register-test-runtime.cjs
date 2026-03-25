/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("node:module");
const path = require("node:path");

const originalResolveFilename = Module._resolveFilename;
const serverOnlyStubPath = path.resolve(__dirname, "server-only-stub.cjs");

Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
    if (request === "server-only") {
        return serverOnlyStubPath;
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
};
