import { IAllExecuteFunctions } from "n8n-workflow";
import { JetStreamClient, JetStreamOptions, NatsConnection, connect } from "nats";
import { natsConnectionOptions } from "../common";
import { defaultJsOptions } from "nats/lib/jetstream/jsbaseclient_api";

interface JSConnection {
	nats: NatsConnection
	js: JetStreamClient
}

export const jsNatsConnection = async (func: IAllExecuteFunctions, idx: number): Promise<JSConnection>  => {
	const credentials = await func.getCredentials('natsApi', idx)
	const options = natsConnectionOptions(credentials)
	const nats = await connect(options)
	const jsOptions:JetStreamOptions = {
		apiPrefix: credentials['jsApiPrefix'] as string,
    timeout: credentials['jsTimeout'] as number,
    domain: credentials['jsDomain'] as string
	}
	if (jsOptions.apiPrefix === '') {
		jsOptions.apiPrefix = undefined
	}
	if (jsOptions.domain === '') {
		jsOptions.domain = undefined
	}


	return { nats, js: nats.jetstream(defaultJsOptions(jsOptions)) }
}
