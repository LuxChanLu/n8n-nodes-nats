import { IAllExecuteFunctions } from "n8n-workflow";
import { NatsConnection, connect } from "nats";
import { natsConnectionOptions } from "../common";

export const natsConnection = async (func: IAllExecuteFunctions, idx: number): Promise<NatsConnection>  => {
	const credentials =  await func.getCredentials('natsApi', idx)
	const options = natsConnectionOptions(credentials)

	return connect(options)
}
