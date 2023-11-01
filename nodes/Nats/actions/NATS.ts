import { IDataObject, IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { NatsConnection, headers } from "nats";

export async function publish(func: IExecuteFunctions, connection: NatsConnection, idx: number, returnData: INodeExecutionData[]): Promise<any> {
	const head = headers()
	for (const header of ((func.getNodeParameter('headersUi', idx) as IDataObject).headerValues ?? []) as IDataObject[]) {
		head.set(header.key as string, header.value as string)
	}
	let subject = func.getNodeParameter('subject', idx) as string
	const options = { headers: head }
	switch (func.getNodeParameter('contentType', idx)) {
		case 'string':
			connection.publish(subject, func.getNodeParameter('payload', idx) as string, options)
			break;
		case 'binaryData':
			const payloadBinaryPropertyName = func.getNodeParameter('payloadBinaryPropertyName', idx)
			connection.publish(subject, new Uint8Array(await func.helpers.getBinaryDataBuffer(idx, payloadBinaryPropertyName as string)), options)
			break;
	}
	returnData.push({
		json: { publish: true },
		pairedItem: idx
	})
}
