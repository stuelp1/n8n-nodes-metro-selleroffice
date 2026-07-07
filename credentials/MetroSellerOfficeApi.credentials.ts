import { createHmac } from 'crypto';
import FormData from 'form-data';
import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

export class MetroSellerOfficeApi implements ICredentialType {
	name = 'metroSellerOfficeApi';

	displayName = 'METRO Seller Office API';

	documentationUrl = 'https://developer.metro-selleroffice.com/docs/authentication/';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Sandbox', value: 'sandbox' },
				{ name: 'Production', value: 'production' },
			],
			default: 'sandbox',
			description:
				'METRO issues separate Client Key/Secret pairs per environment. The production hostnames are inferred by dropping the ".sandbox." segment used in the documented sandbox hosts (e.g. "app-order-management.sandbox.infra.metro-markets.cloud" → "app-order-management.infra.metro-markets.cloud") — confirm this with METRO before relying on it in production.',
		},
		{
			displayName: 'Client Key',
			name: 'clientKey',
			type: 'string',
			default: '',
			required: true,
			description: 'Generated in Seller Office. Sent as the X-Client-Id header on every request.',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Generated in Seller Office together with the Client Key. Only shown once — used as the HMAC-SHA256 signing key, never sent over the wire.',
		},
	];

	// METRO's API is not a plain header/query/OAuth scheme: every request must carry an
	// HMAC-SHA256 signature over "METHOD\nFULL_URI\nBODY\nTIMESTAMP" (base64, keyed with the
	// Client Secret). n8n supports this via the function form of `authenticate`, which receives
	// the fully-built request (method, absolute url, body) right before it is sent.
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const method = (requestOptions.method || 'GET').toUpperCase();

		// The signature must cover the exact URI that is sent, including any query string, so
		// the node always builds a full absolute URL (with query params already appended)
		// instead of relying on n8n's separate `qs` option.
		const uri = requestOptions.url as string;

		// Multipart/form-data uploads (invoice/credit-note/return-label PDFs) are not covered by
		// METRO's docs. We sign those with an empty body string, matching the documented "no body"
		// case — verify against the sandbox before relying on this for uploads.
		let body = '';
		if (
			requestOptions.body !== undefined &&
			requestOptions.body !== null &&
			requestOptions.body !== '' &&
			!(requestOptions.body instanceof FormData)
		) {
			body =
				typeof requestOptions.body === 'string'
					? requestOptions.body
					: JSON.stringify(requestOptions.body);
		}

		const stringToSign = [method, uri, body, timestamp].join('\n');
		const signature = createHmac('sha256', credentials.clientSecret as string)
			.update(stringToSign)
			.digest('base64');

		requestOptions.headers = {
			...requestOptions.headers,
			Accept: 'application/json',
			'X-Client-Id': credentials.clientKey as string,
			'X-Timestamp': timestamp,
			'X-Signature': signature,
		};

		return requestOptions;
	}

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			baseURL:
				'=https://app-seller-pim.{{$credentials.environment === "production" ? "" : "sandbox."}}infra.metro-markets.cloud',
			url: '/openapi/v1/check',
		},
	};
}
