import * as msRest from "ms-rest";
import * as msRestAzure from "ms-rest-azure";
import * as request from "request";
import * as winston from "winston";

const subscriptionId = process.env.ARM_SUBSCRIPTION_ID as string;

const getMsiPort = (enpoint: string) => {
  const url = new URL(enpoint);
  return parseInt(url.port, 10);
};

process.on("unhandledRejection", e => winston.error(e));

export interface ICreds {
  readonly creds: msRest.ServiceClientCredentials;
  readonly subscriptionId: string;
}

export const loginWithMsi = async () => {
  const creds = await msRestAzure.loginWithMSI({
    port: getMsiPort(process.env.MSI_ENDPOINT as string)
  });
  // tslint:disable-next-line:no-object-mutation
  creds.getToken = getToken.bind(creds);
  return { creds, subscriptionId };
};

/**
 * Patched getToken()
 * see https://github.com/Azure/azure-sdk-for-node/issues/2292
 */
export const getToken = (
  callback: (
    error: Error | undefined,
    result?: {
      readonly token_type: string;
      readonly access_token: string;
    }
  ) => void
): void => {
  const postUrl = process.env.MSI_ENDPOINT as string;
  const reqOptions = this.prepareRequestOptions();
  request.post(postUrl, reqOptions, (err, _, body) => {
    if (err) {
      return callback(err);
    }
    try {
      const tokenResponse = JSON.parse(body);
      if (!tokenResponse.token_type) {
        throw new Error(
          `Invalid token response, did not find token_type. Response body is: ${body}`
        );
      } else if (!tokenResponse.access_token) {
        throw new Error(
          `Invalid token response, did not find access_token. Response body is: ${body}`
        );
      }

      return callback(undefined, tokenResponse);
    } catch (error) {
      return callback(error);
    }
  });
};
