import { IAllExecuteFunctions } from "n8n-workflow";
import { NatsConnection, connect } from "nats";

export const natsConnection = async (func: IAllExecuteFunctions, idx: number): Promise<NatsConnection>  => {
	return connect(await func.getCredentials('natsApi', idx))
}
