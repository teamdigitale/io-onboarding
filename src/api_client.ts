/**
 * REST client for Notification / Preference APIs.
 * See spec here: https://teamdigitale.github.io/digital-citizenship/api/public.html
 */

import * as t from "io-ts";

// A basic response type that also include 401
import { Either, left, right } from "fp-ts/lib/Either";
import {
  ApiHeaderJson,
  basicErrorResponseDecoder,
  BasicResponseType,
  composeHeaderProducers,
  composeResponseDecoders,
  createFetchRequestForApi,
  IGetApiRequestType,
  ioResponseDecoder,
  IPostApiRequestType,
  IResponseType,
  RequestHeaderProducer,
  ResponseDecoder,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";

import { NonEmptyString } from "italia-ts-commons/lib/strings";
import nodeFetch from "node-fetch";
import { ExtendedProfile } from "./api/ExtendedProfile";
import { FiscalCode } from "./api/FiscalCode";
import { LimitedProfile } from "./api/LimitedProfile";
import { NewMessage } from "./api/NewMessage";
import { Service } from "./api/Service";
import { ServicePublic } from "./api/ServicePublic";

const OcpApimSubscriptionKey = "Ocp-Apim-Subscription-Key";
type OcpApimSubscriptionKey = typeof OcpApimSubscriptionKey;

// ProfileLimitedOrExtended is oneOf [LimitedProfile, ExtendedProfile]
const ProfileLimitedOrExtended = t.union([LimitedProfile, ExtendedProfile]);

export type ProfileLimitedOrExtended = t.TypeOf<
  typeof ProfileLimitedOrExtended
>;

export type ApiResponseType<R> =
  | BasicResponseType<R>
  | IResponseType<201, R>
  | IResponseType<401, Error>;

export function apiResponseDecoder<R, O = R>(
  type: t.Type<R, O>
): ResponseDecoder<ApiResponseType<R>> {
  const basicResponseDecoderWith401 = composeResponseDecoders(
    apiResponseDecoder(type),
    basicErrorResponseDecoder(401)
  );
  return composeResponseDecoders(
    ioResponseDecoder(201, type),
    basicResponseDecoderWith401
  );
}

export function SubscriptionKeyHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, OcpApimSubscriptionKey> {
  return () => ({
    [OcpApimSubscriptionKey]: token
  });
}

export type GetServiceT = IGetApiRequestType<
  {
    readonly id: string;
  },
  OcpApimSubscriptionKey,
  never,
  ApiResponseType<Service>
>;

export type SendMessageT = IPostApiRequestType<
  {
    readonly message: NewMessage;
    readonly fiscalCode: FiscalCode;
  },
  OcpApimSubscriptionKey | "Content-Type",
  never,
  ApiResponseType<{ readonly id: NonEmptyString }>
>;

export type CreateOrUpdateProfileT = IPostApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
    readonly newProfile: ExtendedProfile;
  },
  OcpApimSubscriptionKey | "Content-Type",
  never,
  ApiResponseType<ExtendedProfile>
>;

export type CreateServiceT = IPostApiRequestType<
  {
    readonly service: Service;
  },
  OcpApimSubscriptionKey | "Content-Type",
  never,
  ApiResponseType<ServicePublic>
>;

export type UpdateServiceT = IPostApiRequestType<
  {
    readonly service: Service;
    readonly serviceId: string;
  },
  OcpApimSubscriptionKey | "Content-Type",
  never,
  ApiResponseType<ServicePublic>
>;

export function APIClient(
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): {
  readonly createOrUpdateProfile: TypeofApiCall<CreateOrUpdateProfileT>;
  readonly createService: TypeofApiCall<CreateServiceT>;
  readonly updateService: TypeofApiCall<UpdateServiceT>;
  readonly getService: TypeofApiCall<GetServiceT>;
  readonly sendMessage: TypeofApiCall<SendMessageT>;
} {
  const options = {
    baseUrl,
    fetchApi
  };

  const tokenHeaderProducer = SubscriptionKeyHeaderProducer(token);

  const getServiceT: GetServiceT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(Service),
    url: params => `/adm/services/${params.id}`
  };

  const sendMessageT: SendMessageT = {
    body: params => JSON.stringify(params.message),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(t.interface({ id: NonEmptyString })),
    url: params => `/api/v1/messages/${params.fiscalCode}`
  };

  const createOrUpdateProfileT: CreateOrUpdateProfileT = {
    body: params => JSON.stringify(params.newProfile),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(ExtendedProfile),
    url: params => `/api/v1/profiles/${params.fiscalCode}`
  };

  const createServiceT: CreateServiceT = {
    body: params => JSON.stringify(params.service),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(ServicePublic),
    url: _ => `/adm/services`
  };

  const updateServiceT: UpdateServiceT = {
    body: params => JSON.stringify(params.service),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(ServicePublic),
    url: params => `/adm/services/${params.serviceId}`
  };

  return {
    createOrUpdateProfile: createFetchRequestForApi(
      createOrUpdateProfileT,
      options
    ),
    createService: createFetchRequestForApi(createServiceT, options),
    getService: createFetchRequestForApi(getServiceT, options),
    sendMessage: createFetchRequestForApi(sendMessageT, options),
    updateService: createFetchRequestForApi(updateServiceT, options)
  };
}

export function toEither<T>(
  res: ApiResponseType<T> | undefined
): Either<Error, T> {
  if (!res) {
    return left(new Error("Response is empty"));
  }
  if (res.status === 200 || res.status === 201) {
    return right(res.value);
  } else {
    return left(new Error("Error parsing response: " + res.status));
  }
}

export type APIClient = typeof APIClient;
