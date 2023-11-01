import { IAllExecuteFunctions, ICredentialTestFunctions, ICredentialsDecrypted, IExecuteFunctions, INodeCredentialTestResult } from "n8n-workflow";
import { JetStreamClient, JetStreamOptions, NatsConnection, connect } from "nats";

export const natsConnection = async (func: IExecuteFunctions, idx: number): Promise<NatsConnection>  => {
	return connect(await func.getCredentials('nats', idx))
}

interface JSConnection {
	nats: NatsConnection
	js: JetStreamClient
}

export const jsNatsConnection = async (func: IAllExecuteFunctions, idx: number): Promise<JSConnection>  => {
	const credentials = await func.getCredentials('nats', idx)
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

export async function natsCredTest(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
	try {
		await (await connect(credential.data)).rtt()
	} catch (error) {
		return {
			status: 'Error',
			message: `Settings are not valid or authentification failed: ${error}`,
		};
	}
	return {
		status: 'OK',
		message: 'Authentication successful!',
	};
}
