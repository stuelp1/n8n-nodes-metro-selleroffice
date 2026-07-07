import FormData from 'form-data';
import { NodeApiError } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';

export type MetroService =
	| 'orderManagement'
	| 'offerData'
	| 'productData'
	| 'productLists'
	| 'serviceCategory'
	| 'messageCenter'
	| 'multimarketCentral'
	| 'eventSubscription';

// Subdomains as documented for the sandbox environment. Production is assumed to drop the
// ".sandbox." segment (undocumented — verify with METRO before going live).
const SERVICE_SUBDOMAINS: Record<MetroService, string> = {
	orderManagement: 'app-order-management',
	offerData: 'app-seller-inventory',
	productData: 'app-seller-pim',
	productLists: 'service-pim-utils',
	serviceCategory: 'service-category',
	messageCenter: 'service-message-center',
	multimarketCentral: 'service-multimarket-central',
	eventSubscription: 'service-subscription-settings',
};

function getHost(service: MetroService, environment: string): string {
	const subdomain = SERVICE_SUBDOMAINS[service];
	const envSegment = environment === 'production' ? '' : 'sandbox.';
	return `https://${subdomain}.${envSegment}infra.metro-markets.cloud`;
}

function buildUrl(
	service: MetroService,
	environment: string,
	path: string,
	query?: IDataObject,
): string {
	const url = new URL(path, getHost(service, environment));

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined || value === null || value === '') continue;
			if (Array.isArray(value)) {
				for (const item of value) url.searchParams.append(key, String(item));
			} else {
				url.searchParams.append(key, String(value));
			}
		}
	}

	// The HMAC signature is computed over the exact URI that goes out on the wire, so the query
	// string must already be part of the URL before the credential's `authenticate` runs.
	return url.toString();
}

export async function metroApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	service: MetroService,
	path: string,
	body?: IDataObject,
	query?: IDataObject,
	headers?: IDataObject,
	rawTextResponse = false,
) {
	const credentials = await this.getCredentials('metroSellerOfficeApi');
	const environment = credentials.environment as string;

	const options: IHttpRequestOptions = {
		method,
		url: buildUrl(service, environment, path, query),
		json: !rawTextResponse,
	};

	if (rawTextResponse) {
		options.encoding = 'text';
	}

	if (headers) {
		options.headers = headers as Record<string, string>;
	}

	if (body !== undefined) {
		options.body = body;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'metroSellerOfficeApi',
			options,
		);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function metroApiUpload(
	this: IExecuteFunctions,
	service: MetroService,
	path: string,
	formFieldName: string,
	binaryPropertyName: string,
	itemIndex: number,
	extraFields?: IDataObject,
	defaultFilename = 'document.pdf',
	defaultContentType = 'application/pdf',
) {
	const credentials = await this.getCredentials('metroSellerOfficeApi');
	const environment = credentials.environment as string;

	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const form = new FormData();
	form.append(formFieldName, buffer, {
		filename: binaryData.fileName ?? defaultFilename,
		contentType: binaryData.mimeType ?? defaultContentType,
	});

	if (extraFields) {
		for (const [key, value] of Object.entries(extraFields)) {
			if (value === undefined || value === null || value === '') continue;
			form.append(key, String(value));
		}
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: buildUrl(service, environment, path),
		body: form,
		headers: form.getHeaders(),
		json: true,
	};

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'metroSellerOfficeApi',
			options,
		);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
