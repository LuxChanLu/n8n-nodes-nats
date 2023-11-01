import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	deepCopy,
} from 'n8n-workflow';

import {
	natsDescription, natsOperations
} from './descriptions';

import { natsConnection } from './common';
import { natsCredTest } from '../common';

import * as Actions from './actions';

export class Nats implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NATS',
		name: 'nats',
		icon: 'file:nats.svg',
		group: ['output'],
		version: 1,
		description: 'NATS',
		subtitle: '={{"nats: " + $parameter["operation"]}}',
		defaults: {
			name: 'NATS',
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
			...natsOperations, ...natsDescription,
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
		const nats = await natsConnection(this, 0)

		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; ++i) {
			try {
				await (Actions.nats as any)[operation](this, nats, i, returnData)
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
		await nats.drain()
		await nats.close()
		return this.prepareOutputData(returnData);
	};
}
