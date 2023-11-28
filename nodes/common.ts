import { ICredentialDataDecryptedObject, ICredentialTestFunctions, ICredentialsDecrypted, INodeCredentialTestResult } from "n8n-workflow";
import { Authenticator, ConnectionOptions, connect, credsAuthenticator, jwtAuthenticator, nkeyAuthenticator, tokenAuthenticator, usernamePasswordAuthenticator } from "nats";

export function natsConnectionOptions(credentials: ICredentialDataDecryptedObject): ConnectionOptions {
	const { user, pass, token, seed, jwtSeed, jwt, creds, tlsCa, tlsCert, tlsKey, ...options } = credentials
	const authenticators:Authenticator[] = []

	if (user && (user as string).length > 0) {
		authenticators.push(usernamePasswordAuthenticator(user as string, pass && (pass as string).length > 0 ? pass as string : undefined))
	}

	if (token && (token as string).length > 0) {
		authenticators.push(tokenAuthenticator(token as string))
	}

	if (seed && (seed as string).length > 0) {
		authenticators.push(nkeyAuthenticator(new TextEncoder().encode(seed as string)))
	}

	if (jwt && (jwt as string).length > 0) {
		authenticators.push(jwtAuthenticator(jwt as string, (jwtSeed && (jwtSeed as string).length > 0) ? new TextEncoder().encode(jwtSeed as string) : undefined))
	}

	if (creds && (creds as string).length > 0) {
		authenticators.push(credsAuthenticator(new TextEncoder().encode(creds as string)))
	}

	if (tlsCa || tlsCert || tlsKey) {
		options.tls = { ca: tlsCa, cert: tlsCert, key: tlsKey }
	}

	return { ...options, authenticator: authenticators }
}

export async function natsCredTest(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
	if(!credential.data) {
		return {
			status: 'Error',
			message: `Credential data is required`,
		}
	}

	try {
		const options = natsConnectionOptions(credential.data)
		const nats = await connect(options)
		await nats.rtt()
		await nats.close()
	} catch (error) {
		return {
			status: 'Error',
			message: `Settings are not valid or authentification failed: ${error}`,
		};
	}
	return {
		status: 'OK',
		message: 'Authentication successful!',
	};
}
