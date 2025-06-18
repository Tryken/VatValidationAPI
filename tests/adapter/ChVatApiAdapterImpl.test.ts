import * as soap from 'soap';
import { ChVatApiAdapterImpl } from '../../source/adapter/ChVatApiAdapterImpl';
import { Configuration } from '../../source/models/ConfigurationModel';
import { ChCheckVatResponseDto } from '../../source/models/ChCheckVatResponseDtoModel';

jest.mock('soap', () => ({
  createClient: jest.fn(),
}));

describe('ChVatApiAdapterImpl', () => {
  let adapter: ChVatApiAdapterImpl;
  let config: Configuration;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      adapter: {
        ch: {
          wsdlUrl: 'https://example.com/wsdl',
        },
      },
    } as Configuration;

    adapter = new ChVatApiAdapterImpl(config);
  });

  it('should throw if WSDL URL is missing', async () => {
    delete config.adapter?.ch?.wsdlUrl;
    adapter = new ChVatApiAdapterImpl(config);

    await expect(adapter.checkVatNumber('CH', 'CHE123456789')).rejects.toThrow(
      'WSDL URL is not defined in configuration.'
    );
  });

  it('should throw if SOAP client creation fails', async () => {
    (soap.createClient as jest.Mock).mockImplementation((_, __, cb) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cb('Connection failed', null);
    });

    await expect(adapter.checkVatNumber('CH', 'CHE123456789')).rejects.toThrow(
      'Connection failed'
    );
  });

  it('should throw if ValidateVatNumber is missing in client', async () => {
    (soap.createClient as jest.Mock).mockImplementation((_, __, cb) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cb(null, {});
    });

    await expect(adapter.checkVatNumber('CH', 'CHE123456789')).rejects.toThrow(
      'ValidateVatNumber function not found in SOAP client'
    );
  });

  it('should reject if ValidateVatNumber returns error', async () => {
    (soap.createClient as jest.Mock).mockImplementation((_, __, cb) => {
      const client = {
        ValidateVatNumber: (
          _vat: string,
          callback: (err: string, result: ChCheckVatResponseDto) => void
        ) => {
          callback('Remote validation failed', {} as ChCheckVatResponseDto);
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cb(null, client);
    });

    await expect(adapter.checkVatNumber('CH', 'CHE123456789')).rejects.toThrow(
      'Failed to check VAT number: Remote validation failed'
    );
  });

  it('should resolve true if VAT is valid', async () => {
    (soap.createClient as jest.Mock).mockImplementation((_, __, cb) => {
      const client = {
        ValidateVatNumber: (
          _vat: string,
          callback: (
            err: string | undefined,
            result: ChCheckVatResponseDto
          ) => void
        ) => {
          callback(undefined, { ValidateVatNumberResult: true });
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cb(null, client);
    });

    const result = await adapter.checkVatNumber('CH', 'CHE123456789');
    expect(result).toBe(true);
  });

  it('should resolve false if result is missing', async () => {
    (soap.createClient as jest.Mock).mockImplementation((_, __, cb) => {
      const client = {
        ValidateVatNumber: (
          _vat: string,
          callback: (
            err: string | undefined,
            result: ChCheckVatResponseDto
          ) => void
        ) => {
          callback(undefined, {} as ChCheckVatResponseDto);
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cb(null, client);
    });

    const result = await adapter.checkVatNumber('CH', 'CHE123456789');
    expect(result).toBe(false);
  });
});
