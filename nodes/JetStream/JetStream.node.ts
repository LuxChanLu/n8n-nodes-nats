import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	deepCopy,
} from 'n8n-workflow';

import {
	jetstreamDescription, jetstreamOperations
} from './descriptions';

import { jsNatsConnection } from './common';
import { natsCredTest } from '../common';

import * as Actions from './actions';

export class JetStream implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NATS - JetStream',
		name: 'jetStream',
		icon: 'file:jetstream.svg',
		group: ['output'],
		version: 1,
		description: 'NATS - JetStream',
		subtitle: '={{"jetstream: " + $parameter["operation"]}}',
		defaults: {
			name: 'JetStream',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'natsApi',
				required: true,
				testedBy: 'natsCredTest',
			},
		],
		properties: [
			...jetstreamDescription, ...jetstreamOperations,
		]
	};

	methods = {
		credentialTest: {
			natsCredTest
		}
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let items = this.getInputData();
		items = deepCopy(items);

		const operation = this.getNodeParameter('operation', 0);
		if (operation === 'acknowledge') {
			this.sendResponse(items[0].json);
			return [items];
		}
		const jetStream = await jsNatsConnection(this, 0);

		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; ++i) {
			try {
				await (Actions.jetstream as any)[operation](this, jetStream.js, i, returnData)
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		await jetStream.nats.drain()
		await jetStream.nats.close()
		return this.prepareOutputData(returnData);
	};
}
