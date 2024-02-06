import { IAllExecuteFunctions, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { Service } from 'typedi';
import { natsConnectionOptions } from './common';
import { JetStreamOptions, NatsConnection, connect } from 'nats';
import { defaultJsOptions } from 'nats/lib/jetstream/jsbaseclient_api';

type ConnectionEntry = {
	id: string,
	connection: NatsConnection,
	refCount: number,
	timer?: string | number | NodeJS.Timeout
}

const idleTimeout = 180_000

@Service({ global: true })
export class NatsService {

	private connections = new Map<string, ConnectionEntry>()
	private registry = new FinalizationRegistry(this.releaseConnection)

	constructor() {
	}

	async getConnection(func: IAllExecuteFunctions, credentials?:ICredentialDataDecryptedObject): Promise<NatsConnectionHandle> {

		//todo acquire n8n credentials id
		//hack use the connection name as the id
		credentials ??= await func.getCredentials('natsApi', 0)
		const options = natsConnectionOptions(credentials)
		const id = options.name ? options.name : func.getExecutionId()

		let entry = this.connections.get(id)
		if (!entry) {
			const connection = await connect(options)
			entry = {
				id: id,
				connection: connection,
				refCount: 1
			}
			this.connections.set(id, entry)
		} else if (entry.refCount++ == 0 && entry.timer) {
			clearTimeout(entry.timer)
			entry.timer = undefined
		}

		const token = { id: id }
		const handle = new NatsConnectionHandle(this, entry.connection, token)
		this.registry.register(handle, id, token)

		return handle
	}

	async getJetStream(func: IAllExecuteFunctions) {

		const credentials = await func.getCredentials('natsApi', 0)

		const jsOptions: JetStreamOptions = {
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

		const nats = await this.getConnection(func, credentials);

		const js = nats.connection.jetstream(defaultJsOptions(jsOptions));

		return { connection: nats.connection, js, [Symbol.dispose]: nats[Symbol.dispose] }
	}

	release(token: Partial<{ id: string }>) {
		this.registry.unregister(token)
		if (token.id) {
			this.releaseConnection(token.id)
		}
	}



	private releaseConnection(id: string) {
		const entry = this.connections.get(id)
		if (entry && entry.refCount > 0 && --entry.refCount == 0) {
			entry.timer = setTimeout((list, entry) => {
				if (entry.refCount == 0) {
					list.delete(entry.id)
					entry.connection.drain()
				}
			}, idleTimeout, this.connections, entry);
		}
	}
}

export class NatsConnectionHandle implements Disposable {

	constructor(private service: NatsService, public connection: NatsConnection, private token: object) {
	}

	[Symbol.dispose]() {
		this.service.release(this.token)
		this.token = {}
	}
}

