import type { INodeProperties } from 'n8n-workflow';

export const natsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'publish',
		noDataExpression: true,
		options: [
			{
				name: 'Publish',
				value: 'publish',
				description: 'Publish in a subject',
				action: 'Publish in a subject',
			},
		],
	},
];


export const natsDescription: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                               nats:publish                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		placeholder: 'Subject',
		required: true,
		displayOptions: {
			show: {
				operation: ['publish'],
			},
		},
	},
	{
		displayName: 'Payload Content Type',
		name: 'contentType',
		type: 'options',
		options: [
			{
				name: 'String',
				value: 'string',
			},
			{
				name: 'N8n Binary Data',
				value: 'binaryData',
			},
		],
		default: 'string',
		description: 'Content type for the payload',
	},
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'string',
		default: '',
		placeholder: 'Payload',
		displayOptions: {
			show: {
				operation: ['publish'],
				contentType: ['string'],
			},
		},
	},
	{
		displayName: 'Payload Binary Property Name',
		name: 'payloadBinaryPropertyName',
		type: 'string',
		default: '',
		placeholder: 'data',
		displayOptions: {
			show: {
				operation: ['publish'],
				contentType: ['binaryData'],
			},
		},
	},
	{
		displayName: 'Headers',
		name: 'headersUi',
		placeholder: 'Add Header',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				operation: ['publish'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				name: 'headerValues',
				displayName: 'Header',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		]
	}
];
