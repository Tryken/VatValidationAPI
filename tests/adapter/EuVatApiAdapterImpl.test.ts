import { EuVatAdapterImpl } from '../../source/adapter/EuVatApiAdapterImpl';
import { Configuration } from '../../source/models/ConfigurationModel';

global.fetch = jest.fn();

describe('EuVatAdapterImpl', () => {
  let adapter: EuVatAdapterImpl;
  let config: Configuration;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      adapter: {
        eu: {
          baseUrl: 'https://api.example.com',
          splitRegex: '^([A-Z]{2}-?)(.+)$',
        },
      },
    } as Configuration;

    adapter = new EuVatAdapterImpl(config);
  });

  it('should return correct splitVatNumber result', () => {
    const result = adapter.splitVatNumber('DE123456789');
    expect(result).toEqual({
      countryCode: 'DE',
      vatNumber: '123456789',
    });
  });

  it('should throw if splitRegex is missing', () => {
    delete config.adapter?.eu?.splitRegex;
    adapter = new EuVatAdapterImpl(config);

    expect(() => adapter.splitVatNumber('DE123456789')).toThrow(
      'Split regex is not defined in configuration.'
    );
  });

  it('should throw on invalid VAT format', () => {
    expect(() => adapter.splitVatNumber('1INVALIDVAT')).toThrow(
      'Invalid VAT number format: 1INVALIDVAT'
    );
  });

  it('should call fetch and return valid=true', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => ({ valid: true }),
    });

    const result = await adapter.checkVatNumber('DE', 'DE123456789');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com//check-vat-number',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(result).toBe(true);
  });

  it('should return false if response.valid is missing', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => ({}),
    });

    const result = await adapter.checkVatNumber('DE', 'DE123456789');
    expect(result).toBe(false);
  });

  it('should throw on HTTP error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(adapter.checkVatNumber('DE', 'DE123456789')).rejects.toThrow(
      'Error: 500 - Internal Server Error'
    );
  });

  it('should throw on fetch rejection', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce({ message: 'Network error' });

    await expect(adapter.checkVatNumber('DE', 'DE123456789')).rejects.toThrow(
      'Failed to check VAT number: Network error'
    );
  });

  it('should throw if baseUrl is missing', async () => {
    delete config.adapter?.eu?.baseUrl;
    adapter = new EuVatAdapterImpl(config);

    await expect(adapter.checkVatNumber('DE', 'DE123456789')).rejects.toThrow(
      'Base URL is not defined in configuration.'
    );
  });
});
