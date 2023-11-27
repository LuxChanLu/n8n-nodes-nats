import { IAllExecuteFunctions } from "n8n-workflow";
import { NatsConnection, connect, usernamePasswordAuthenticator, tokenAuthenticator, nkeyAuthenticator, jwtAuthenticator, credsAuthenticator, Authenticator } from "nats";

export const natsConnection = async (func: IAllExecuteFunctions, idx: number): Promise<NatsConnection>  => {
	const { user, pass, token, seed, jwtSeed, jwt, creds, tlsCa, tlsCert, tlsKey, ...options } = await func.getCredentials('natsApi', idx)
	const authenticators = ([] as Authenticator[])

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

	return connect({ ...options, authenticator: authenticators })
}
