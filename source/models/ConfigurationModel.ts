import { Server } from 'http';
import fs from 'fs';
import { VatValidationAdapter } from './VatValidationAdapterModel.js';

type ExpressServerOptions = Pick<
  Server,
  | 'keepAliveTimeout'
  | 'maxHeadersCount'
  | 'timeout'
  | 'maxConnections'
  | 'headersTimeout'
  | 'requestTimeout'
>;

export type SupportedCountryCodes = {
  [key: string]: {
    validationRegex: string;
    adapter: VatValidationAdapter;
  };
};

export interface Configuration {
  port?: number;
  expressServerOptions?: ExpressServerOptions;
  supportedCountryCodes?: SupportedCountryCodes;
  adapter?: {
    eu?: {
      baseUrl?: string;
      splitRegex?: string;
    };
    ch?: {
      wsdlUrl?: string;
    };
  };
}

export const readAppConfiguration = (file: string): Configuration => {
  const configuration: Configuration = JSON.parse(
    fs.readFileSync(file, 'utf-8')
  ) as Configuration;

  configuration.port = process.env.PORT
    ? parseInt(process.env.PORT)
    : (configuration.port ?? 3000);

  return configuration;
};
