import VatController from '../../source/controllers/VatController';
import { Configuration } from '../../source/models/ConfigurationModel';
import { IVatApiAdapter } from '../../source/adapter/IVatApiAdapter';
import { VatValidationAdapter } from '../../source/models/VatValidationAdapterModel';
import { EuVatAdapterImpl } from '../../source/adapter/EuVatApiAdapterImpl';
import { ChVatApiAdapterImpl } from '../../source/adapter/ChVatApiAdapterImpl';
import { VatCheckDto } from '../../source/models/VatCheckDto';

jest.mock('../../source/adapter/EuVatApiAdapterImpl');
jest.mock('../../source/adapter/ChVatApiAdapterImpl');

describe('VatController', () => {
  let controller: VatController;
  let configuration: Configuration;

  const euMock: jest.Mocked<IVatApiAdapter> = {
    type: VatValidationAdapter.EU,
    checkVatNumber: jest.fn(),
  };

  const chMock: jest.Mocked<IVatApiAdapter> = {
    type: VatValidationAdapter.CH,
    checkVatNumber: jest.fn(),
  };

  beforeEach(() => {
    configuration = {
      supportedCountryCodes: {
        DE: { adapter: VatValidationAdapter.EU },
        CH: { adapter: VatValidationAdapter.CH },
      },
    } as unknown as Configuration;

    (EuVatAdapterImpl as jest.Mock).mockImplementation(() => euMock);
    (ChVatApiAdapterImpl as jest.Mock).mockImplementation(() => chMock);

    controller = new VatController(configuration);
  });

  it('should use EU adapter for DE', async () => {
    const dto: VatCheckDto = { countryCode: 'DE', vat: 'DE123456789' };
    euMock.checkVatNumber.mockResolvedValue(true);

    const result = await controller.validateVat(dto);

    expect(result).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(euMock.checkVatNumber).toHaveBeenCalledWith('DE', 'DE123456789');
  });

  it('should throw for unsupported country', async () => {
    const dto: VatCheckDto = { countryCode: 'FR', vat: 'FR123456789' };

    await expect(controller.validateVat(dto)).rejects.toThrow(
      'No adapter found for country code: FR'
    );
  });

  it('should throw if adapter type not found', async () => {
    configuration.supportedCountryCodes = {};
    configuration.supportedCountryCodes.XY = {
      adapter: 'UNKNOWN' as VatValidationAdapter,
      validationRegex: '^XY[0-9]{9}$',
    };
    const dto: VatCheckDto = { countryCode: 'XY', vat: 'XY123456789' };

    controller = new VatController(configuration);

    await expect(controller.validateVat(dto)).rejects.toThrow(
      'No VAT API adapter found for type: UNKNOWN'
    );
  });
});
