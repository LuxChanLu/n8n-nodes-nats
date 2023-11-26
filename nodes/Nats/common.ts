import { IAllExecuteFunctions } from "n8n-workflow";
import { NatsConnection, connect, usernamePasswordAuthenticator, tokenAuthenticator, nkeyAuthenticator, jwtAuthenticator, credsAuthenticator, Authenticator } from "nats";

export const natsConnection = async (func: IAllExecuteFunctions, idx: number): Promise<NatsConnection>  => {
	const { user, pass, token, seed, jwtSeed, jwt, creds, ...options } = await func.getCredentials('natsApi', idx)
	const authenticators = ([] as Authenticator[])

	if (user && pass && (user as string).length > 0 && (pass as string).length > 0) {
		authenticators.push(usernamePasswordAuthenticator(user as string, pass as string))
	}

	if (token && (token as string).length > 0) {
		authenticators.push(tokenAuthenticator(token as string))
	}

	if (seed && (seed as string).length > 0) {
		authenticators.push(nkeyAuthenticator(new TextEncoder().encode(seed as string)))
	}

	if (jwtSeed && (jwtSeed as string).length > 0 && jwt && (jwt as string).length > 0) {
		authenticators.push(jwtAuthenticator(jwtSeed as string, new TextEncoder().encode(jwt as string)))
	}

	if (creds && (creds as string).length > 0) {
		authenticators.push(credsAuthenticator(new TextEncoder().encode(creds as string)))
	}

	return connect({ ...options, authenticator: authenticators })
}
