import { ICredentialTestFunctions, ICredentialsDecrypted, INodeCredentialTestResult } from "n8n-workflow";
import { connect } from "nats";

export async function natsCredTest(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
	try {
		await (await connect(credential.data)).rtt()
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
