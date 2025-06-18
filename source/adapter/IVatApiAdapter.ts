import { VatValidationAdapter } from '../models/VatValidationAdapterModel.js';

export interface IVatApiAdapter {
  type: VatValidationAdapter;
  checkVatNumber(countryCode: string, vatNumber: string): Promise<boolean>;
}
