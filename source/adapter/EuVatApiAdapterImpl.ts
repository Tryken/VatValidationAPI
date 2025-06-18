import { IVatApiAdapter } from './IVatApiAdapter.js';
import { Configuration } from '../models/ConfigurationModel.js';
import { VatValidationAdapter } from '../models/VatValidationAdapterModel.js';
import { EuCheckVatResponseDto } from '../models/EuCheckVatResponseDtoModel.js';

export class EuVatAdapterImpl implements IVatApiAdapter {
  configuration: Configuration;
  type = VatValidationAdapter.EU;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  splitVatNumber(vatNumber: string): {
    countryCode: string;
    vatNumber: string;
  } {
    const splitRegex = this.configuration.adapter?.eu?.splitRegex;
    if (!splitRegex) {
      throw new Error('Split regex is not defined in configuration.');
    }
    const match = vatNumber.match(new RegExp(splitRegex, 'i'));
    if (!match) {
      throw new Error(`Invalid VAT number format: ${vatNumber}`);
    }
    return {
      countryCode: match[1],
      vatNumber: match[2],
    };
  }

  async checkVatNumber(
    countryCode: string,
    vatNumber: string
  ): Promise<boolean> {
    const baseUrl = this.configuration.adapter?.eu?.baseUrl;
    if (!baseUrl) {
      throw new Error('Base URL is not defined in configuration.');
    }
    const url = `${baseUrl}//check-vat-number`;
    const splitVatNumber = this.splitVatNumber(vatNumber);
    const payload = {
      countryCode,
      vatNumber: splitVatNumber.vatNumber,
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = (await response.json()) as EuCheckVatResponseDto;
        return data.valid ?? false;
      })
      .catch((error: { message?: string }) => {
        throw new Error(`Failed to check VAT number: ${error.message}`);
      });
  }
}
