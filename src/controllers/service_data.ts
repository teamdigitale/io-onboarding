import ApiManagementClient from "azure-arm-apimanagement";
import { fromOption, toError } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { OrganizationFiscalCode } from "italia-ts-commons/lib/strings";

import {
  getApimUser,
  IExtendedUserContract,
  isAdminUser
} from "../apim_operations";
import * as config from "../config";
import { getApimAccountEmail, SessionUser } from "../utils/session";

import {
  fromEither,
  fromPredicate,
  TaskEither,
  tryCatch
} from "fp-ts/lib/TaskEither";
import { identity } from "io-ts";
import nodeFetch from "node-fetch";

// tslint:disable-next-line:no-any
type ServiceDataSuccessResponse = any /* TODO: shape as the expected response from the API */;

export const serviceDataTask = (
  organizationFiscalCode: OrganizationFiscalCode,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): TaskEither<
  IResponseErrorInternal,
  IResponseSuccessJson<ServiceDataSuccessResponse>
> => {
  return tryCatch(
    async () => {
      const url = `${config.SERVICE_DATA_URL}/organizations/${organizationFiscalCode}/services`;
      const response = await fetchApi(url, {
        headers: {
          "X-Functions-Key": config.SERVICE_DATA_APIKEY
        }
      });
      return response.json();
    },
    errors => ResponseErrorInternal(toError(errors).message)
  ).map(_ => ResponseSuccessJson<boolean>(true));
};

export async function serviceData(
  apiClient: ApiManagementClient,
  authenticatedUser: SessionUser,
  organizationFiscalCode: OrganizationFiscalCode
): Promise<
  | IResponseSuccessJson<boolean>
  | IResponseErrorInternal
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
> {
  // Retrieve APIM account for the logged user
  return (
    tryCatch<
      | IResponseErrorInternal
      | IResponseErrorForbiddenNotAuthorized
      | IResponseErrorNotFound,
      Option<IExtendedUserContract>
    >(
      () => getApimUser(apiClient, getApimAccountEmail(authenticatedUser)),
      () => ResponseErrorInternal("Internal Error")
    )
      .chain(maybeApimUser =>
        fromEither(
          fromOption(
            ResponseErrorNotFound(
              "API user not found",
              "Cannot find a user in the API management with the provided email address"
            )
          )(maybeApimUser)
        )
      )
      .chain(
        fromPredicate(
          (user: IExtendedUserContract) => isAdminUser(user),
          _ => ResponseErrorForbiddenNotAuthorized
        )
      )
      // Eetrieve service data for the organization
      .chain(_ => serviceDataTask(organizationFiscalCode))
      .fold<
        | IResponseErrorInternal
        | IResponseErrorForbiddenNotAuthorized
        | IResponseErrorNotFound
        | IResponseSuccessJson<boolean>
      >(identity, identity)
      .run()
  );
}
