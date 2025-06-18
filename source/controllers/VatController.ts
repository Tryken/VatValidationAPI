import { Configuration } from '../models/ConfigurationModel.js';
import { VatCheckDto } from '../models/VatCheckDto.js';
import { EuVatAdapterImpl } from '../adapter/EuVatApiAdapterImpl.js';
import { IVatApiAdapter } from '../adapter/IVatApiAdapter.js';
import { VatValidationAdapter } from '../models/VatValidationAdapterModel.js';
import { ChVatApiAdapterImpl } from '../adapter/ChVatApiAdapterImpl.js';

export default class VatController {
  configuration: Configuration;
  adapterList: IVatApiAdapter[] = [];

  constructor(configuration: Configuration) {
    this.configuration = configuration;

    this.adapterList.push(new EuVatAdapterImpl(configuration));
    this.adapterList.push(new ChVatApiAdapterImpl(configuration));
  }

  getAdapterByType(type: VatValidationAdapter): IVatApiAdapter | undefined {
    return this.adapterList.find(adapter => adapter.type === type);
  }

  async validateVat(vatCheckDto: VatCheckDto): Promise<boolean> {
    const { countryCode, vat } = vatCheckDto;
    const adapter =
      this.configuration.supportedCountryCodes?.[countryCode]?.adapter;

    if (!adapter) {
      throw new Error(`No adapter found for country code: ${countryCode}`);
    }

    const vatApiAdapter = this.getAdapterByType(adapter);

    if (!vatApiAdapter) {
      throw new Error(`No VAT API adapter found for type: ${adapter}`);
    }

    return vatApiAdapter.checkVatNumber(countryCode, vat);
  }
}
