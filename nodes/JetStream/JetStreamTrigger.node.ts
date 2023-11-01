import {
	IDataObject,
	IExecuteResponsePromiseData,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRun,
	ITriggerFunctions,
	ITriggerResponse,
	NodeOperationError,
} from 'n8n-workflow';

import { jsNatsConnection } from './common';

export class JetStreamTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NATS - JetStream Trigger',
		name: 'jetStreamTrigger',
		icon: 'file:nats.svg',
		group: ['trigger'],
		version: 1,
		description: 'Consumer JetStream stream message',
		eventTriggerDescription: '',
		defaults: {
			name: 'JetStream Trigger',
		},
		triggerPanel: {
			header: '',
			executionsHelp: {
				inactive:
					"<b>While building your workflow</b>, click the 'listen' button, then trigger a JetStream stream message. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Once you're happy with your workflow</b>, <a data-key='activate'>activate</a> it. Then every time a change is detected, the workflow will execute. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
				active:
					"<b>While building your workflow</b>, click the 'listen' button, then trigger a JetStream stream message. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Your workflow will also execute automatically</b>, since it's activated. Every time a change is detected, this node will trigger an execution. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
			},
			activationHint:
				"Once you’ve finished building your workflow, <a data-key='activate'>activate</a> it to have it also listen continuously (you just won’t see those executions here).",
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'natsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Stream',
				name: 'stream',
				type: 'string',
				default: '',
				placeholder: 'stream',
				description: 'The name of the stream',
			},
			{
				displayName: 'Consumer',
				name: 'consumer',
				type: 'string',
				default: '',
				placeholder: 'consumer',
				description: 'The name of the consumer',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Content Is Binary',
						name: 'contentIsBinary',
						type: 'boolean',
						default: false,
						description: 'Whether to save the content as binary',
					},
					{
						displayName: 'Message Acknowledge When',
						name: 'acknowledge',
						type: 'options',
						options: [
							{
								name: 'Execution Finishes',
								value: 'executionFinishes',
								description:
									'After the workflow execution finished. No matter if the execution was successful or not.',
							},
							{
								name: 'Execution Finishes Successfully',
								value: 'executionFinishesSuccessfully',
								description: 'After the workflow execution finished successfully',
							},
							{
								name: 'Immediately',
								value: 'immediately',
								description: 'As soon as the message got received',
							},
							{
								name: 'Specified Later in Workflow',
								value: 'laterMessageNode',
								description: 'Using a NATS - JetStream node to remove the item from the queue',
							},
						],
						default: 'immediately',
						description: 'When to acknowledge the message',
					},
					{
						displayName: 'JSON Parse Body',
						name: 'jsonParseBody',
						type: 'boolean',
						displayOptions: {
							hide: {
								contentIsBinary: [true],
							},
						},
						default: false,
						description: 'Whether to parse the body to an object',
					},
					{
						displayName: 'Only Content',
						name: 'onlyContent',
						type: 'boolean',
						displayOptions: {
							hide: {
								contentIsBinary: [true],
							},
						},
						default: false,
						description: 'Whether to return only the content property',
					},
					{
						displayName: 'Parallel Message Processing Limit',
						name: 'parallelMessages',
						type: 'number',
						default: -1,
						description: 'Max number of executions at a time. Use -1 for no limit.',
					},
				]
			},
			{
				displayName:
					"To acknowledge an message from the consumer, insert a NATS - JetStream node later in the workflow and use the 'Acknowledge Message' operation",
				name: 'laterMessageNode',
				type: 'notice',
				displayOptions: {
					show: {
						'/options.acknowledge': ['laterMessageNode'],
					},
				},
				default: '',
			},
		]
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const stream = this.getNodeParameter('stream') as string;
		const consumer = this.getNodeParameter('consumer') as string;
		const options = this.getNodeParameter('options', {}) as IDataObject;

		let parallelMessages =
			options.parallelMessages !== undefined && options.parallelMessages !== -1
				? parseInt(options.parallelMessages as string, 10)
				: -1;

		if (parallelMessages === 0 || parallelMessages < -1) {
			throw new NodeOperationError(
				this.getNode(),
				'Parallel message processing limit must be greater than zero (or -1 for no limit)',
			);
		}

		if (this.getMode() === 'manual') {
			parallelMessages = 1;
		}

		let acknowledgeMode = options.acknowledge ? options.acknowledge : 'immediately';

		const jetStream = await jsNatsConnection(this, 0);
		const jsStream = await jetStream.js.streams.get(stream);
		const jsConsumer = await jsStream.getConsumer(consumer);
		const messages = await jsConsumer.consume({ max_messages: parallelMessages });

		const consume = async () => {
			for await (const message of messages) {
				message.working()
				if (acknowledgeMode === 'immediately') {
					await message.ackAck()
				}
				try {
					// Prepare message content
					let content: IDataObject | string = message.string();

					const item: INodeExecutionData = {
						json: {},
					};
					if (options.contentIsBinary === true) {
						item.binary = {
							data: await this.helpers.prepareBinaryData(Buffer.from(message.data)),
						};

						item.json = message as unknown as IDataObject;
					} else {
						if (options.jsonParseBody === true) {
							content = JSON.parse(content);
						}
						if (options.onlyContent === true) {
							item.json = { data: content as IDataObject };
						} else {
							item.json = message as unknown as IDataObject;
						}
					}

					if (acknowledgeMode === 'executionFinishes' || acknowledgeMode === 'executionFinishesSuccessfully') {
						const responsePromise = await this.helpers.createDeferredPromise<IRun>();
						this.emit([this.helpers.returnJsonArray([item])], undefined, responsePromise);
						const data = await responsePromise.promise();
						if ((!data.data.resultData.error && acknowledgeMode === 'executionFinishesSuccessfully') || acknowledgeMode === 'executionFinishes') {
							await message.ackAck();
						} else if (data.data.resultData.error && acknowledgeMode === 'executionFinishesSuccessfully') {
							message.nak();
							this.emitError(data.data.resultData.error);
						}
					} else if (acknowledgeMode === 'laterMessageNode') {
						const responsePromiseHook = await this.helpers.createDeferredPromise<IExecuteResponsePromiseData>();
						this.emit([this.helpers.returnJsonArray([item])], responsePromiseHook);
						await responsePromiseHook.promise();
						await message.ackAck();
					} else {
						this.emit([this.helpers.returnJsonArray([item])]);
					}
				} catch (error) {
					if (acknowledgeMode !== 'immediately') {
						message.nak()
					}
					this.emitError(error)
				}
			}
		}
		consume();

		const closeFunction = async () => {
			await messages.close();
			await jetStream.nats.drain();
			await jetStream.nats.close();
		};

		return {
			closeFunction,
		};
	}
}
