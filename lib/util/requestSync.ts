// load modules
import request = require("request");
import http = require("http");

let sync = require("synchronicity");

export function requestSync (url: string, options: request.CoreOptions): { response: http.IncomingMessage, body: any } {
    return sync.wait({ request: request }, "request", [ 
        url.startsWith("https://") ? url : "https://" + url,
        options,
        sync.defer("response", "body")
    ]);
}

export { request, http };