import { IAllExecuteFunctions } from "n8n-workflow";
import { JetStreamClient, JetStreamOptions, NatsConnection, connect } from "nats";

interface JSConnection {
	nats: NatsConnection
	js: JetStreamClient
}

export const jsNatsConnection = async (func: IAllExecuteFunctions, idx: number): Promise<JSConnection>  => {
	const credentials = await func.getCredentials('natsApi', idx)
	const nats = await connect(credentials)
	const jsOptions = {
		apiPrefix: credentials['jsApiPrefix'] as string,
    timeout: credentials['jsTimeout'] as number,
    domain: credentials['jsDomain'] as string
	} as JetStreamOptions;
	if (jsOptions.apiPrefix === '') {
		jsOptions.apiPrefix = undefined
	}
	if (jsOptions.domain === '') {
		jsOptions.domain = undefined
	}
	return { nats, js: nats.jetstream() }
}
