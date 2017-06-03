// load modules
import request = require("request-promise-native");
import http = require("http");

const sync = require("synchronicity");

export function requestSync (url: string, options: request.Options): { response: http.IncomingMessage, body: any } {
	return sync.wait({ request }, "request", [
		url.startsWith("https://") ? url : "https://" + url,
		options,
		sync.defer("response", "body"),
	]);
}

export { request, http };