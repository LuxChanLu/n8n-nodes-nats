import type { INodeProperties } from 'n8n-workflow';

export const jetstreamOperations: INodeProperties[] = [
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
			{
				name: 'Acknowledge a Message',
				value: 'acknowledge',
				description: 'Acknowledge a previously received message',
				action: 'Acknowledge a previously received message',
			},
		],
	},
	{
		displayName:
			'Will acknowledge an message from the stream consumer earlier in the workflow by a NATS - JetStream Trigger node',
		name: 'acknowledgeMessage',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['acknowledge'],
			},
		},
	},
];


export const jetstreamDescription: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                            jetstream:publish                               */
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
		displayOptions: {
			show: {
				operation: ['publish'],
			},
		},
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
