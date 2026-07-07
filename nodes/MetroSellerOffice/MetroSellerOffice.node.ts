import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { metroApiRequest, metroApiUpload } from './GenericFunctions';

export class MetroSellerOffice implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'METRO Seller Office',
		name: 'metroSellerOffice',
		icon: 'file:metroSelleroffice.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with the METRO Markets (Seller Office) REST API',
		defaults: {
			name: 'METRO Seller Office',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'metroSellerOfficeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Order', value: 'order' },
					{ name: 'Order Line', value: 'orderLine' },
					{ name: 'Offer', value: 'offer' },
					{ name: 'Inventory', value: 'inventory' },
					{ name: 'Category', value: 'category' },
					{ name: 'Product Upload', value: 'productUpload' },
					{ name: 'Product List', value: 'productList' },
					{ name: 'Chat', value: 'chat' },
					{ name: 'Message', value: 'message' },
					{ name: 'Market', value: 'market' },
					{ name: 'Event Subscription', value: 'eventSubscription' },
					{ name: 'Dictionary', value: 'dictionary' },
				],
				default: 'order',
			},

			// ---------------------------------------------------------------
			// Order
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['order'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get an order' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many orders' },
				],
				default: 'get',
			},
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['order'], operation: ['get'] } },
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: { show: { resource: ['order'], operation: ['getAll'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['order'], operation: ['getAll'], returnAll: [false] } },
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['order'], operation: ['getAll'] } },
				options: [
					{
						displayName: 'Status',
						name: 'status',
						type: 'string',
						default: '',
						description:
							'Comma-separated order status values to filter by (e.g. placed,shipped). See the Order documentation for valid values.',
					},
					{
						displayName: 'Created After',
						name: 'createdFrom',
						type: 'dateTime',
						default: '',
						description: 'Only return orders created after this date (RFC 3339)',
					},
					{
						displayName: 'Created Before',
						name: 'createdTo',
						type: 'dateTime',
						default: '',
						description: 'Only return orders created before this date (RFC 3339)',
					},
					{
						displayName: 'Sort By Created At',
						name: 'sortCreatedAt',
						type: 'options',
						options: [
							{ name: 'Ascending', value: 'asc' },
							{ name: 'Descending', value: 'desc' },
						],
						default: 'desc',
					},
				],
			},

			// ---------------------------------------------------------------
			// Order Line
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['orderLine'] } },
				options: [
					{ name: 'Confirm', value: 'confirm', action: 'Confirm an order line' },
					{ name: 'Ship', value: 'ship', action: 'Mark an order line as shipped' },
					{ name: 'Cancel', value: 'cancel', action: 'Cancel an order line' },
					{ name: 'Accept Return', value: 'acceptReturn', action: 'Accept a return request' },
					{ name: 'Decline Return', value: 'declineReturn', action: 'Decline a return request' },
					{
						name: 'Mark Returned',
						value: 'markReturned',
						action: 'Mark an order line as returned',
					},
					{ name: 'Upload Invoice', value: 'uploadInvoice', action: 'Upload an invoice PDF' },
					{
						name: 'Upload Credit Note',
						value: 'uploadCreditNote',
						action: 'Upload a credit note PDF',
					},
					{
						name: 'Upload Return Label',
						value: 'uploadReturnLabel',
						action: 'Upload a return label PDF',
					},
				],
				default: 'confirm',
			},
			{
				displayName: 'Order Line ID',
				name: 'orderLineId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['orderLine'] } },
			},
			{
				displayName: 'Trackings',
				name: 'trackings',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Tracking',
				default: {},
				required: true,
				displayOptions: { show: { resource: ['orderLine'], operation: ['ship'] } },
				options: [
					{
						displayName: 'Tracking',
						name: 'tracking',
						values: [
							{ displayName: 'Tracking ID', name: 'trackingId', type: 'string', default: '' },
							{
								displayName: 'Carrier',
								name: 'carrier',
								type: 'string',
								default: '',
								description:
									'Carrier code, e.g. "dhl" or "ups". Look up valid values with Dictionary > Get Delivery Carriers.',
							},
							{
								displayName: 'Country',
								name: 'country',
								type: 'string',
								default: '',
								description: 'ISO 3166-1 alpha-2 country code the tracking applies to',
							},
						],
					},
				],
			},
			{
				displayName: 'Cancellation Reason',
				name: 'cancellationReason',
				type: 'number',
				required: true,
				default: 0,
				description:
					'Numeric reason code. Look up valid values with Dictionary > Get Cancellation Reasons.',
				displayOptions: { show: { resource: ['orderLine'], operation: ['cancel'] } },
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'string',
				required: true,
				default: '',
				description:
					'Resolution code. Look up valid values with Dictionary > Get Return Reasons.',
				displayOptions: {
					show: { resource: ['orderLine'], operation: ['acceptReturn', 'declineReturn'] },
				},
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				default: 0,
				description: 'Leave at 0 to apply to the full order line quantity (partial returns otherwise)',
				displayOptions: {
					show: {
						resource: ['orderLine'],
						operation: ['acceptReturn', 'declineReturn', 'markReturned'],
					},
				},
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the input binary field containing the PDF (max 2 MB)',
				displayOptions: {
					show: {
						resource: ['orderLine'],
						operation: ['uploadInvoice', 'uploadCreditNote', 'uploadReturnLabel'],
					},
				},
			},

			// ---------------------------------------------------------------
			// Offer
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['offer'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an offer' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many offers' },
					{ name: 'Delete', value: 'delete', action: 'Delete an offer' },
				],
				default: 'create',
			},
			{
				displayName: 'Identifier Type',
				name: 'identifierType',
				type: 'options',
				options: [
					{ name: 'GTIN', value: 'gtin' },
					{ name: 'SKU', value: 'sku' },
					{ name: 'MPN + Manufacturer', value: 'mpn' },
				],
				default: 'gtin',
				displayOptions: { show: { resource: ['offer'], operation: ['create', 'delete'] } },
			},
			{
				displayName: 'GTIN',
				name: 'gtin',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['offer'], operation: ['create', 'delete'], identifierType: ['gtin'] },
				},
			},
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['offer'], operation: ['create', 'delete'], identifierType: ['sku'] },
				},
			},
			{
				displayName: 'MPN',
				name: 'mpn',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['offer'], operation: ['create', 'delete'], identifierType: ['mpn'] },
				},
			},
			{
				displayName: 'Manufacturer',
				name: 'manufacturer',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['offer'], operation: ['create', 'delete'], identifierType: ['mpn'] },
				},
			},
			{
				displayName: 'Quantity',
				name: 'offerQuantity',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
			},
			{
				displayName: 'Net Price',
				name: 'netPrice',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				required: true,
				description:
					'PriceGuard rejects price drops of 50% or more in a single update (based on price + shipping cost); delete and recreate the offer to apply a larger drop',
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
			},
			{
				displayName: 'Processing Time (Days)',
				name: 'processingTime',
				type: 'number',
				default: 1,
				required: true,
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
			},
			{
				displayName: 'Destination Country',
				name: 'destination',
				type: 'string',
				default: '',
				required: true,
				description: 'ISO 3166-1 alpha-2 country code of the marketplace, e.g. DE',
				displayOptions: { show: { resource: ['offer'], operation: ['create', 'delete'] } },
			},
			{
				displayName: 'Origin Country',
				name: 'origin',
				type: 'string',
				default: '',
				description: 'ISO 3166-1 alpha-2 country code the item ships from',
				displayOptions: { show: { resource: ['offer'], operation: ['create', 'delete'] } },
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'json',
				default: '{}',
				description:
					'Extra fields to merge into the offer payload (e.g. includedFees), as raw JSON',
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: { show: { resource: ['offer'], operation: ['getAll'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['offer'], operation: ['getAll'], returnAll: [false] } },
			},
			{
				displayName: 'Filters',
				name: 'offerFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['offer'], operation: ['getAll'] } },
				options: [
					{ displayName: 'GTIN', name: 'gtin', type: 'string', default: '' },
					{ displayName: 'SKU', name: 'sku', type: 'string', default: '' },
					{ displayName: 'Status', name: 'status', type: 'string', default: '' },
				],
			},

			// ---------------------------------------------------------------
			// Inventory
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['inventory'] } },
				options: [
					{ name: 'Update Stock', value: 'updateStock', action: 'Update stock for a SKU' },
				],
				default: 'updateStock',
			},
			{
				displayName: 'SKU',
				name: 'inventorySku',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['inventory'], operation: ['updateStock'] } },
			},
			{
				displayName: 'Quantity',
				name: 'inventoryQuantity',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: { show: { resource: ['inventory'], operation: ['updateStock'] } },
			},

			// ---------------------------------------------------------------
			// Category
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['category'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get a category and its attributes' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many categories' },
				],
				default: 'getAll',
			},
			{
				displayName: 'Market',
				name: 'market',
				type: 'string',
				required: true,
				default: 'DE',
				description: 'Market identifier, e.g. DE',
				displayOptions: { show: { resource: ['category'] } },
			},
			{
				displayName: 'Category ID',
				name: 'categoryId',
				type: 'string',
				required: true,
				default: '',
				description: 'UUID of a leaf category (one without children)',
				displayOptions: { show: { resource: ['category'], operation: ['get'] } },
			},

			// ---------------------------------------------------------------
			// Product Upload
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['productUpload'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Upload a product data file' },
					{ name: 'Get', value: 'get', action: 'Get an upload status' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many uploads' },
					{
						name: 'Get Error Report',
						value: 'getErrorReport',
						action: 'Get the error report for an upload',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Input Binary Field',
				name: 'uploadBinaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the input binary field containing the CSV or XLSX file',
				displayOptions: { show: { resource: ['productUpload'], operation: ['create'] } },
			},
			{
				displayName: 'Decimal Delimiter',
				name: 'decimalDelimiter',
				type: 'options',
				options: [
					{ name: 'Point (.)', value: '.' },
					{ name: 'Comma (,)', value: ',' },
				],
				default: '.',
				displayOptions: { show: { resource: ['productUpload'], operation: ['create'] } },
			},
			{
				displayName: 'Upload ID',
				name: 'uploadId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['productUpload'], operation: ['get', 'getErrorReport'] },
				},
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: { show: { resource: ['productUpload'], operation: ['getAll'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: {
					show: { resource: ['productUpload'], operation: ['getAll'], returnAll: [false] },
				},
			},

			// ---------------------------------------------------------------
			// Product List
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['productList'] } },
				options: [
					{ name: 'Get Approved', value: 'getApproved', action: 'Get approved products' },
					{ name: 'Get Rejected', value: 'getRejected', action: 'Get rejected products' },
					{
						name: 'Get Rejected Errors',
						value: 'getRejectedErrors',
						action: 'Get errors for a rejected product',
					},
					{
						name: 'Generate Approved Export',
						value: 'generateApprovedExport',
						action: 'Generate an approved products export',
					},
					{
						name: 'Get Latest Approved Export',
						value: 'getLatestApprovedExport',
						action: 'Get the latest approved products export',
					},
					{
						name: 'Generate Rejected Export',
						value: 'generateRejectedExport',
						action: 'Generate a rejected products export',
					},
					{
						name: 'Get Latest Rejected Export',
						value: 'getLatestRejectedExport',
						action: 'Get the latest rejected products export',
					},
					{
						name: 'Generate New Markets Export',
						value: 'generateNewMarketsExport',
						action: 'Generate a new markets export',
					},
					{
						name: 'Get Latest New Markets Export',
						value: 'getLatestNewMarketsExport',
						action: 'Get the latest new markets export',
					},
				],
				default: 'getApproved',
			},
			{
				displayName: 'Rejected Product ID',
				name: 'rejectedProductId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['productList'], operation: ['getRejectedErrors'] } },
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: { resource: ['productList'], operation: ['getApproved', 'getRejected'] },
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['productList'],
						operation: ['getApproved', 'getRejected'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'productListFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: { resource: ['productList'], operation: ['getApproved', 'getRejected'] },
				},
				options: [
					{ displayName: 'Product Name', name: 'productName', type: 'string', default: '' },
					{ displayName: 'Category', name: 'category', type: 'string', default: '' },
					{ displayName: 'Target Markets', name: 'targetMarkets', type: 'string', default: '' },
					{ displayName: 'GTIN', name: 'gtin', type: 'string', default: '' },
					{ displayName: 'MPN', name: 'mpn', type: 'string', default: '' },
					{ displayName: 'Manufacturer', name: 'manufacturer', type: 'string', default: '' },
				],
			},

			// ---------------------------------------------------------------
			// Chat
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['chat'] } },
				options: [
					{ name: 'Get Categories', value: 'getCategories', action: 'Get chat categories' },
					{ name: 'Get Subjects', value: 'getSubjects', action: 'Get chat subjects' },
					{
						name: 'Check Emails Exist',
						value: 'emailsExist',
						action: 'Check whether emails exist for an order',
					},
					{ name: 'Create', value: 'create', action: 'Create a chat for an order' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many chats' },
					{ name: 'Get Unseen', value: 'getUnseen', action: 'Get unseen chats' },
				],
				default: 'getAll',
			},
			{
				displayName: 'Order Number',
				name: 'chatOrderNumber',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['chat'], operation: ['emailsExist'] } },
			},
			{
				displayName: 'Order ID',
				name: 'chatOrderId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['chat'], operation: ['create'] } },
			},
			{
				displayName: 'Category ID',
				name: 'chatCategoryId',
				type: 'string',
				required: true,
				default: '',
				description: 'Look up valid values with Chat > Get Categories',
				displayOptions: { show: { resource: ['chat'], operation: ['create'] } },
			},
			{
				displayName: 'Subject',
				name: 'chatSubject',
				type: 'string',
				default: '',
				description: 'Look up valid values with Chat > Get Subjects',
				displayOptions: { show: { resource: ['chat'], operation: ['create'] } },
			},
			{
				displayName: 'Custom Subject',
				name: 'chatCustomSubject',
				type: 'string',
				default: '',
				description: 'Required by some subjects instead of Subject',
				displayOptions: { show: { resource: ['chat'], operation: ['create'] } },
			},
			{
				displayName: 'Filters',
				name: 'chatFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['chat'], operation: ['getAll'] } },
				options: [
					{ displayName: 'Order Number', name: 'orderNumber', type: 'string', default: '' },
					{ displayName: 'Order ID', name: 'orderId', type: 'string', default: '' },
					{ displayName: 'Chat ID', name: 'chatId', type: 'string', default: '' },
					{ displayName: 'Is Seen', name: 'isSeen', type: 'boolean', default: false },
					{
						displayName: 'Destinations',
						name: 'destinations',
						type: 'string',
						default: '',
						description: 'Comma-separated list of destination country codes',
					},
					{
						displayName: 'Statuses',
						name: 'statuses',
						type: 'string',
						default: '',
						description: 'Comma-separated list of chat statuses',
					},
					{ displayName: 'Last Message From', name: 'lastMessageFrom', type: 'dateTime', default: '' },
					{ displayName: 'Last Message To', name: 'lastMessageTo', type: 'dateTime', default: '' },
				],
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: { show: { resource: ['chat'], operation: ['getAll'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['chat'], operation: ['getAll'], returnAll: [false] } },
			},

			// ---------------------------------------------------------------
			// Message
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{
						name: 'Upload Attachment',
						value: 'uploadAttachment',
						action: 'Upload a message attachment',
					},
					{ name: 'Send', value: 'send', action: 'Send a message in a chat' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many messages in a chat' },
					{ name: 'Get', value: 'get', action: 'Get a single message' },
				],
				default: 'send',
			},
			{
				displayName: 'Order ID',
				name: 'messageOrderId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['uploadAttachment'] } },
			},
			{
				displayName: 'Input Binary Field',
				name: 'messageBinaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: { show: { resource: ['message'], operation: ['uploadAttachment'] } },
			},
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['send', 'getAll', 'get'] } },
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['get'] } },
			},
			{
				displayName: 'Content',
				name: 'messageContent',
				type: 'string',
				typeOptions: { rows: 3 },
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['send'] } },
			},
			{
				displayName: 'Attachment IDs',
				name: 'messageAttachments',
				type: 'string',
				default: '',
				description:
					'Comma-separated attachment IDs returned by Message > Upload Attachment',
				displayOptions: { show: { resource: ['message'], operation: ['send'] } },
			},

			// ---------------------------------------------------------------
			// Market
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['market'] } },
				options: [
					{ name: 'Get Many Markets', value: 'getMarkets', action: 'Get available markets' },
					{
						name: 'Get Many Origins',
						value: 'getOrigins',
						action: 'Get cross border origin/destination combinations',
					},
				],
				default: 'getMarkets',
			},

			// ---------------------------------------------------------------
			// Event Subscription
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['eventSubscription'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an event subscription' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many event subscriptions' },
					{ name: 'Update', value: 'update', action: 'Update an event subscription' },
					{ name: 'Delete', value: 'delete', action: 'Delete an event subscription' },
				],
				default: 'getAll',
			},
			{
				displayName: 'Subscription ID',
				name: 'subscriptionId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['eventSubscription'], operation: ['update', 'delete'] } },
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{ name: 'Order Created', value: 'order_created' },
					{ name: 'Order Line Shipped', value: 'order_line_shipped' },
					{ name: 'Order Line Cancelled', value: 'order_line_cancelled' },
				],
				default: 'order_created',
				required: true,
				displayOptions: { show: { resource: ['eventSubscription'], operation: ['create'] } },
			},
			{
				displayName: 'Target URL',
				name: 'targetUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Webhook URL that receives the event. Must respond 200 with {"status":"OK"}.',
				displayOptions: { show: { resource: ['eventSubscription'], operation: ['create'] } },
			},
			{
				displayName: 'Additional Fields',
				name: 'subscriptionAdditionalFields',
				type: 'json',
				default: '{}',
				description: 'Extra fields to merge into the subscription payload, as raw JSON',
				displayOptions: {
					show: { resource: ['eventSubscription'], operation: ['create', 'update'] },
				},
			},

			// ---------------------------------------------------------------
			// Dictionary
			// ---------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['dictionary'] } },
				options: [
					{
						name: 'Get Delivery Carriers',
						value: 'deliveryCarriers',
						action: 'Get available delivery carriers',
					},
					{
						name: 'Get Cancellation Reasons',
						value: 'cancellationReasons',
						action: 'Get possible cancellation reasons',
					},
					{
						name: 'Get Return Reasons',
						value: 'returnReasons',
						action: 'Get possible return reasons',
					},
					{
						name: 'Get Included Fees',
						value: 'includedFees',
						action: 'Get fees that can be included in an offer',
					},
				],
				default: 'deliveryCarriers',
			},
			{
				displayName: 'Country Code',
				name: 'countryCode',
				type: 'string',
				default: '',
				description: 'Optional ISO 3166-1 alpha-2 country code sent as the Country-code header',
				displayOptions: { show: { resource: ['dictionary'], operation: ['deliveryCarriers'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] = {};

				if (resource === 'order') {
					if (operation === 'get') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'orderManagement',
							`/openapi/v2/orders/${orderId}`,
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						const query: IDataObject = {};
						if (filters.status) {
							query['filter[status][]'] = String(filters.status)
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean);
						}
						if (filters.createdFrom) query['filter[created][from]'] = filters.createdFrom;
						if (filters.createdTo) query['filter[created][to]'] = filters.createdTo;
						if (filters.sortCreatedAt) query['sort[createdAt]'] = filters.sortCreatedAt;

						if (!returnAll) {
							query.limit = this.getNodeParameter('limit', i) as number;
						}

						const response = await metroApiRequest.call(
							this,
							'GET',
							'orderManagement',
							'/openapi/v2/orders',
							undefined,
							query,
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					}
				} else if (resource === 'orderLine') {
					const orderLineId = this.getNodeParameter('orderLineId', i) as string;
					const base = `/openapi/v2/order-lines/${orderLineId}`;

					if (operation === 'confirm') {
						await metroApiRequest.call(this, 'POST', 'orderManagement', `${base}/confirm`);
						responseData = { success: true };
					} else if (operation === 'ship') {
						const trackingsInput = this.getNodeParameter('trackings', i) as IDataObject;
						const trackingList = ((trackingsInput.tracking as IDataObject[]) ?? []).map((t) => ({
							trackingId: t.trackingId,
							carrier: t.carrier,
							country: t.country,
						}));
						await metroApiRequest.call(this, 'PUT', 'orderManagement', `${base}/ship`, {
							trackings: trackingList,
						});
						responseData = { success: true };
					} else if (operation === 'cancel') {
						const cancellationReason = this.getNodeParameter('cancellationReason', i) as number;
						await metroApiRequest.call(this, 'POST', 'orderManagement', `${base}/cancel`, {
							cancellationReason,
						});
						responseData = { success: true };
					} else if (operation === 'acceptReturn' || operation === 'declineReturn') {
						const resolution = this.getNodeParameter('resolution', i) as string;
						const quantity = this.getNodeParameter('quantity', i, 0) as number;
						const body: IDataObject = { resolution };
						if (quantity) body.quantity = quantity;
						const path = operation === 'acceptReturn' ? `${base}/accept-return` : `${base}/decline-return`;
						responseData = await metroApiRequest.call(this, 'POST', 'orderManagement', path, body);
					} else if (operation === 'markReturned') {
						const quantity = this.getNodeParameter('quantity', i, 0) as number;
						const body: IDataObject = {};
						if (quantity) body.quantity = quantity;
						responseData = await metroApiRequest.call(
							this,
							'POST',
							'orderManagement',
							`${base}/mark-returned`,
							body,
						);
					} else if (
						operation === 'uploadInvoice' ||
						operation === 'uploadCreditNote' ||
						operation === 'uploadReturnLabel'
					) {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const fieldMap: Record<string, { path: string; field: string }> = {
							uploadInvoice: { path: `${base}/invoice`, field: 'invoice' },
							uploadCreditNote: { path: `${base}/credit-note`, field: 'creditNote' },
							uploadReturnLabel: { path: `${base}/return-label`, field: 'returnLabel' },
						};
						const { path, field } = fieldMap[operation];
						responseData = await metroApiUpload.call(
							this,
							'orderManagement',
							path,
							field,
							binaryPropertyName,
							i,
						);
					}
				} else if (resource === 'offer') {
					if (operation === 'create') {
						const identifierType = this.getNodeParameter('identifierType', i) as string;
						const body: IDataObject = {
							quantity: this.getNodeParameter('offerQuantity', i) as number,
							netPrice: this.getNodeParameter('netPrice', i) as number,
							processingTime: this.getNodeParameter('processingTime', i) as number,
							destination: this.getNodeParameter('destination', i) as string,
						};
						const origin = this.getNodeParameter('origin', i, '') as string;
						if (origin) body.origin = origin;

						if (identifierType === 'gtin') {
							body.gtin = this.getNodeParameter('gtin', i) as string;
						} else if (identifierType === 'sku') {
							body.sku = this.getNodeParameter('sku', i) as string;
						} else {
							body.mpn = this.getNodeParameter('mpn', i) as string;
							body.manufacturer = this.getNodeParameter('manufacturer', i) as string;
						}

						const additionalFieldsRaw = this.getNodeParameter('additionalFields', i, '{}') as string;
						if (additionalFieldsRaw && additionalFieldsRaw !== '{}') {
							Object.assign(body, JSON.parse(additionalFieldsRaw));
						}

						responseData = await metroApiRequest.call(
							this,
							'POST',
							'offerData',
							'/openapi/v2/offers',
							body,
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('offerFilters', i, {}) as IDataObject;

						const query: IDataObject = {};
						if (filters.gtin) query['filter[gtin]'] = filters.gtin;
						if (filters.sku) query['filter[sku]'] = filters.sku;
						if (filters.status) query['filter[status]'] = filters.status;
						if (!returnAll) query.limit = this.getNodeParameter('limit', i) as number;

						const response = await metroApiRequest.call(
							this,
							'GET',
							'offerData',
							'/openapi/v2/offers',
							undefined,
							query,
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					} else if (operation === 'delete') {
						const identifierType = this.getNodeParameter('identifierType', i) as string;
						const query: IDataObject = {
							destination: this.getNodeParameter('destination', i) as string,
						};
						const origin = this.getNodeParameter('origin', i, '') as string;
						if (origin) query.origin = origin;

						if (identifierType === 'gtin') {
							query.gtin = this.getNodeParameter('gtin', i) as string;
						} else if (identifierType === 'sku') {
							query.sku = this.getNodeParameter('sku', i) as string;
						} else {
							query.mpn = this.getNodeParameter('mpn', i) as string;
							query.manufacturer = this.getNodeParameter('manufacturer', i) as string;
						}

						await metroApiRequest.call(
							this,
							'DELETE',
							'offerData',
							'/openapi/v2/offers',
							undefined,
							query,
						);
						responseData = { success: true };
					}
				} else if (resource === 'inventory') {
					if (operation === 'updateStock') {
						const sku = this.getNodeParameter('inventorySku', i) as string;
						const quantity = this.getNodeParameter('inventoryQuantity', i) as number;
						await metroApiRequest.call(
							this,
							'PATCH',
							'offerData',
							`/openapi/v3/inventory/${sku}`,
							{ quantity },
						);
						responseData = { success: true };
					}
				} else if (resource === 'category') {
					const market = this.getNodeParameter('market', i) as string;
					if (operation === 'getAll') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'serviceCategory',
							`/public/api/v1/${market}/categories`,
						);
					} else if (operation === 'get') {
						const categoryId = this.getNodeParameter('categoryId', i) as string;
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'serviceCategory',
							`/public/api/v1/${market}/categories/${categoryId}`,
						);
					}
				} else if (resource === 'productUpload') {
					if (operation === 'create') {
						const binaryPropertyName = this.getNodeParameter(
							'uploadBinaryPropertyName',
							i,
						) as string;
						const decimalDelimiter = this.getNodeParameter('decimalDelimiter', i) as string;
						responseData = await metroApiUpload.call(
							this,
							'productData',
							'/openapi/v1/uploads',
							'file',
							binaryPropertyName,
							i,
							{ decimalDelimiter },
							'upload.csv',
							'text/csv',
						);
					} else if (operation === 'get') {
						const uploadId = this.getNodeParameter('uploadId', i) as string;
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'productData',
							`/openapi/v1/uploads/${uploadId}`,
						);
					} else if (operation === 'getErrorReport') {
						const uploadId = this.getNodeParameter('uploadId', i) as string;
						const csv = await metroApiRequest.call(
							this,
							'GET',
							'productData',
							`/openapi/v1/uploads/${uploadId}/errors/file`,
							undefined,
							undefined,
							undefined,
							true,
						);
						responseData = { uploadId, csv };
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const query: IDataObject = {};
						if (!returnAll) query.limit = this.getNodeParameter('limit', i) as number;
						const response = await metroApiRequest.call(
							this,
							'GET',
							'productData',
							'/openapi/v1/uploads',
							undefined,
							query,
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					}
				} else if (resource === 'productList') {
					if (operation === 'getApproved' || operation === 'getRejected') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('productListFilters', i, {}) as IDataObject;
						const query: IDataObject = { ...filters };
						if (!returnAll) query.limit = this.getNodeParameter('limit', i) as number;
						const path =
							operation === 'getApproved'
								? '/openapi/v1/product-uploads/approved'
								: '/openapi/v1/product-uploads/rejected';
						const response = await metroApiRequest.call(
							this,
							'GET',
							'productLists',
							path,
							undefined,
							query,
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					} else if (operation === 'getRejectedErrors') {
						const rejectedProductId = this.getNodeParameter('rejectedProductId', i) as string;
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'productLists',
							`/openapi/v1/product-uploads/rejected/${rejectedProductId}/errors`,
						);
					} else if (operation === 'generateApprovedExport') {
						responseData = await metroApiRequest.call(
							this,
							'POST',
							'productLists',
							'/openapi/v1/product-list/export/generate',
						);
					} else if (operation === 'getLatestApprovedExport') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'productLists',
							'/openapi/v1/product-list/export/latest',
						);
					} else if (operation === 'generateRejectedExport') {
						responseData = await metroApiRequest.call(
							this,
							'POST',
							'productLists',
							'/openapi/v1/product-list/rejected/generate',
						);
					} else if (operation === 'getLatestRejectedExport') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'productLists',
							'/openapi/v1/product-list/rejected/latest',
						);
					} else if (operation === 'generateNewMarketsExport') {
						responseData = await metroApiRequest.call(
							this,
							'POST',
							'productLists',
							'/openapi/v1/product-list/new-markets/generate',
						);
					} else if (operation === 'getLatestNewMarketsExport') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'productLists',
							'/openapi/v1/product-list/new-markets/latest',
						);
					}
				} else if (resource === 'chat') {
					if (operation === 'getCategories') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'messageCenter',
							'/openapi/v1/chat-categories',
						);
					} else if (operation === 'getSubjects') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'messageCenter',
							'/openapi/v1/chat-subjects',
						);
					} else if (operation === 'emailsExist') {
						const orderNumber = this.getNodeParameter('chatOrderNumber', i) as string;
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'messageCenter',
							`/openapi/v1/orders/${orderNumber}/emails-exist`,
						);
					} else if (operation === 'create') {
						const orderId = this.getNodeParameter('chatOrderId', i) as string;
						const categoryId = this.getNodeParameter('chatCategoryId', i) as string;
						const subject = this.getNodeParameter('chatSubject', i, '') as string;
						const customSubject = this.getNodeParameter('chatCustomSubject', i, '') as string;
						const body: IDataObject = { categoryId };
						if (subject) body.subject = subject;
						if (customSubject) body.customSubject = customSubject;
						responseData = await metroApiRequest.call(
							this,
							'POST',
							'messageCenter',
							`/openapi/v1/orders/${orderId}/chats`,
							body,
						);
					} else if (operation === 'getUnseen') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'messageCenter',
							'/openapi/v1/chats/unseen',
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('chatFilters', i, {}) as IDataObject;
						const query: IDataObject = {};
						if (filters.orderNumber) query['filters[orderNumber]'] = filters.orderNumber;
						if (filters.orderId) query['filters[orderId]'] = filters.orderId;
						if (filters.chatId) query['filters[chatId]'] = filters.chatId;
						if (filters.isSeen !== undefined) query['filters[isSeen]'] = filters.isSeen;
						if (filters.destinations) {
							query['filters[destinations][]'] = String(filters.destinations)
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean);
						}
						if (filters.statuses) {
							query['filters[statuses][]'] = String(filters.statuses)
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean);
						}
						if (filters.lastMessageFrom) query['filters[lastMessage][from]'] = filters.lastMessageFrom;
						if (filters.lastMessageTo) query['filters[lastMessage][to]'] = filters.lastMessageTo;
						if (!returnAll) query.limit = this.getNodeParameter('limit', i) as number;

						const response = await metroApiRequest.call(
							this,
							'GET',
							'messageCenter',
							'/openapi/v1/chats',
							undefined,
							query,
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					}
				} else if (resource === 'message') {
					if (operation === 'uploadAttachment') {
						const orderId = this.getNodeParameter('messageOrderId', i) as string;
						const binaryPropertyName = this.getNodeParameter(
							'messageBinaryPropertyName',
							i,
						) as string;
						responseData = await metroApiUpload.call(
							this,
							'messageCenter',
							`/openapi/v1/orders/${orderId}/upload-file`,
							'file',
							binaryPropertyName,
							i,
						);
					} else if (operation === 'send') {
						const chatId = this.getNodeParameter('chatId', i) as string;
						const content = this.getNodeParameter('messageContent', i) as string;
						const attachments = this.getNodeParameter('messageAttachments', i, '') as string;
						const body: IDataObject = { content };
						if (attachments) {
							body.attachments = attachments
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean);
						}
						responseData = await metroApiRequest.call(
							this,
							'POST',
							'messageCenter',
							`/openapi/v1/chats/${chatId}/messages`,
							body,
						);
					} else if (operation === 'getAll') {
						const chatId = this.getNodeParameter('chatId', i) as string;
						const response = await metroApiRequest.call(
							this,
							'GET',
							'messageCenter',
							`/openapi/v1/chats/${chatId}/messages`,
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					} else if (operation === 'get') {
						const chatId = this.getNodeParameter('chatId', i) as string;
						const messageId = this.getNodeParameter('messageId', i) as string;
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'messageCenter',
							`/openapi/v1/chats/${chatId}/messages/${messageId}`,
						);
					}
				} else if (resource === 'market') {
					if (operation === 'getMarkets') {
						const response = await metroApiRequest.call(
							this,
							'GET',
							'multimarketCentral',
							'/openapi/v1/markets',
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					} else if (operation === 'getOrigins') {
						const response = await metroApiRequest.call(
							this,
							'GET',
							'multimarketCentral',
							'/openapi/v1/origins',
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					}
				} else if (resource === 'eventSubscription') {
					if (operation === 'create') {
						const eventType = this.getNodeParameter('eventType', i) as string;
						const targetUrl = this.getNodeParameter('targetUrl', i) as string;
						const body: IDataObject = { eventType, targetUrl };
						const additionalFieldsRaw = this.getNodeParameter(
							'subscriptionAdditionalFields',
							i,
							'{}',
						) as string;
						if (additionalFieldsRaw && additionalFieldsRaw !== '{}') {
							Object.assign(body, JSON.parse(additionalFieldsRaw));
						}
						responseData = await metroApiRequest.call(
							this,
							'POST',
							'eventSubscription',
							'/openapi/v1/subscriptions',
							body,
						);
					} else if (operation === 'getAll') {
						const response = await metroApiRequest.call(
							this,
							'GET',
							'eventSubscription',
							'/openapi/v1/subscriptions',
						);
						responseData = (response?.data ?? response) as IDataObject[] | IDataObject;
					} else if (operation === 'update') {
						const subscriptionId = this.getNodeParameter('subscriptionId', i) as string;
						const additionalFieldsRaw = this.getNodeParameter(
							'subscriptionAdditionalFields',
							i,
							'{}',
						) as string;
						const body: IDataObject =
							additionalFieldsRaw && additionalFieldsRaw !== '{}'
								? JSON.parse(additionalFieldsRaw)
								: {};
						responseData = await metroApiRequest.call(
							this,
							'PATCH',
							'eventSubscription',
							`/openapi/v1/subscriptions/${subscriptionId}`,
							body,
						);
					} else if (operation === 'delete') {
						const subscriptionId = this.getNodeParameter('subscriptionId', i) as string;
						await metroApiRequest.call(
							this,
							'DELETE',
							'eventSubscription',
							`/openapi/v1/subscriptions/${subscriptionId}`,
						);
						responseData = { success: true };
					}
				} else if (resource === 'dictionary') {
					if (operation === 'deliveryCarriers') {
						const countryCode = this.getNodeParameter('countryCode', i, '') as string;
						const headers: IDataObject = {};
						if (countryCode) headers['Country-code'] = countryCode;
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'orderManagement',
							'/openapi/v2/dictionary/delivery-carrier',
							undefined,
							undefined,
							headers,
						);
					} else if (operation === 'cancellationReasons') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'orderManagement',
							'/openapi/v2/dictionary/cancellation-reason',
						);
					} else if (operation === 'returnReasons') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'orderManagement',
							'/openapi/v2/dictionary/return-reason',
						);
					} else if (operation === 'includedFees') {
						responseData = await metroApiRequest.call(
							this,
							'GET',
							'offerData',
							'/openapi/v2/dictionary/included-fees',
						);
					}
				}

				const dataArray = Array.isArray(responseData) ? responseData : [responseData];
				for (const data of dataArray) {
					returnData.push({ json: data, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
