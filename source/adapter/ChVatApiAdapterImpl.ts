import soap from 'soap';

import { IVatApiAdapter } from './IVatApiAdapter.js';
import { Configuration } from '../models/ConfigurationModel.js';
import { VatValidationAdapter } from '../models/VatValidationAdapterModel.js';
import { ChCheckVatResponseDto } from '../models/ChCheckVatResponseDtoModel.js';

export class ChVatApiAdapterImpl implements IVatApiAdapter {
  configuration: Configuration;
  type = VatValidationAdapter.CH;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  async checkVatNumber(
    _countryCode: string,
    vatNumber: string
  ): Promise<boolean> {
    const wsdlUrl = this.configuration.adapter?.ch?.wsdlUrl;
    if (!wsdlUrl) {
      throw new Error('WSDL URL is not defined in configuration.');
    }

    return new Promise((resolve, reject) => {
      soap.createClient(wsdlUrl, {}, (error: string, client) => {
        if (error) reject(new Error(error));

        const validVatNumberFunction = client['ValidateVatNumber'] as
          | ((
              request: { vatNumber: string },
              callback: (error: string, result: ChCheckVatResponseDto) => void
            ) => void)
          | undefined;

        if (!validVatNumberFunction) {
          reject(
            new Error('ValidateVatNumber function not found in SOAP client')
          );
          return;
        }

        validVatNumberFunction(
          { vatNumber },
          (error: string, result: ChCheckVatResponseDto) => {
            if (error)
              reject(new Error(`Failed to check VAT number: ${error}`));

            resolve(result.ValidateVatNumberResult ?? false);
          }
        );
      });
    });
  }
}
