import { IDataObject, IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { JetStreamClient, headers } from "nats";

export async function publish(func: IExecuteFunctions, connection: JetStreamClient, idx: number, returnData: INodeExecutionData[]): Promise<any> {
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

    // /**
    //  * A string identifier used to detect duplicate published messages.
    //  * If the msgID is reused within the stream's `duplicate_window`,
    //  * the message will be rejected by the stream, and the {@link PubAck} will
    //  * mark it as a `duplicate`.
    //  */
    // msgID: string;
    // /**
    //  * The number of milliseconds to wait for the PubAck
    //  */
    // timeout: number;
    // /**
    //  * Headers associated with the message. You can create an instance of
    //  * MsgHdrs with the headers() function.
    //  */
    // headers: MsgHdrs;
    // /**
    //  * Set of constraints that when specified are verified by the server.
    //  * If the constraint(s) doesn't match, the server will reject the message.
    //  * These settings allow you to implement deduplication and consistency
    //  * strategies.
    //  */
    // expect: Partial<{
    //     /**
    //      * The expected last msgID of the last message received by the stream.
    //      */
    //     lastMsgID: string;
    //     /**
    //      * The expected stream capturing the message
    //      */
    //     streamName: string;
    //     /**
    //      * The expected last sequence on the stream.
    //      */
    //     lastSequence: number;
    //     /**
    //      * The expected last sequence on the stream for a message with this subject
    //      */
    //     lastSubjectSequence: number;
    // }>;
