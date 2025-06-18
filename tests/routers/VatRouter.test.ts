import request from 'supertest';
import express, { json } from 'express';
import VatController from '../../source/controllers/VatController';
import { Configuration } from '../../source/models/ConfigurationModel';
import router from '../../source/routers/VatRouter';
import { VatValidationAdapter } from '../../source/models/VatValidationAdapterModel';

jest.mock('../../source/controllers/VatController');

const mockedVatController = VatController as jest.MockedClass<
  typeof VatController
>;

describe('POST /vat/validate', () => {
  let app: express.Express;

  beforeEach(() => {
    mockedVatController.prototype.validateVat = jest.fn();
  });

  const setupApp = (config: Configuration) => {
    app = express();
    app.use(json()); // für req.body
    app.use('/vat', router(config));
  };

  it('should return 200 if VAT is valid', async () => {
    mockedVatController.prototype.validateVat.mockResolvedValueOnce(true);

    setupApp({
      supportedCountryCodes: {
        DE: {
          adapter: VatValidationAdapter.EU,
          validationRegex: '^DE[0-9]{9}$',
        },
      },
    });

    const response = await request(app)
      .post('/vat/validate')
      .send({ countryCode: 'DE', vat: 'DE123456789' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      details: 'VAT number is valid for the given country code.',
      valid: true,
    });
  });

  it('should return 200 if VAT is invalid', async () => {
    mockedVatController.prototype.validateVat.mockResolvedValueOnce(false);

    setupApp({
      supportedCountryCodes: {
        DE: {
          adapter: VatValidationAdapter.EU,
          validationRegex: '^DE[0-9]{9}$',
        },
      },
    });

    const response = await request(app)
      .post('/vat/validate')
      .send({ countryCode: 'DE', vat: 'DE123456789' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      details: 'VAT number is invalid for the given country code.',
      valid: false,
    });
  });

  it('should return 400 if Zod validation fails (missing countryCode)', async () => {
    setupApp({
      supportedCountryCodes: {
        DE: {
          adapter: VatValidationAdapter.EU,
          validationRegex: '^DE[0-9]{9}$',
        },
      },
    });

    const response = await request(app)
      .post('/vat/validate')
      .send({ vat: 'DE123456789' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        fieldErrors: {
          countryCode: ['Required'],
        },
        formErrors: [],
      },
    });
  });

  it('should return 400 if Zod validation fails (missing vat)', async () => {
    setupApp({
      supportedCountryCodes: {
        DE: {
          adapter: VatValidationAdapter.EU,
          validationRegex: '^DE[0-9]{9}$',
        },
      },
    });

    const response = await request(app)
      .post('/vat/validate')
      .send({ countryCode: 'DE' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        fieldErrors: {
          vat: ['Required'],
        },
        formErrors: [],
      },
    });
  });

  it('should return 400 if Zod validation fails (invalid vat format)', async () => {
    setupApp({
      supportedCountryCodes: {
        DE: {
          adapter: VatValidationAdapter.EU,
          validationRegex: '^DE[0-9]{9}$',
        },
      },
    });

    const response = await request(app)
      .post('/vat/validate')
      .send({ countryCode: 'DE', vat: 'DE12345678' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        fieldErrors: {},
        formErrors: ['VAT format is invalid for country code DE'],
      },
    });
  });

  it('should return 501 if country code not supported', async () => {
    setupApp({
      supportedCountryCodes: {
        DE: {
          adapter: VatValidationAdapter.EU,
          validationRegex: '^DE[0-9]{9}$',
        },
      },
    });

    const response = await request(app)
      .post('/vat/validate')
      .send({ countryCode: 'FR', vat: 'FR123456789' });

    expect(response.status).toBe(501);
    expect(response.body).toEqual({
      error: {
        fieldErrors: {
          countryCode: ['County code not implemented: FR'],
        },
        formErrors: [],
      },
    });
  });

  it('should return 500 if controller throws', async () => {
    mockedVatController.prototype.validateVat.mockRejectedValueOnce(
      new Error('Something went wrong')
    );

    setupApp({
      supportedCountryCodes: {
        DE: {
          adapter: VatValidationAdapter.EU,
          validationRegex: '^DE[0-9]{9}$',
        },
      },
    });

    const response = await request(app)
      .post('/vat/validate')
      .send({ countryCode: 'DE', vat: 'DE123456789' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      code: 500,
      message: 'Internal Server Error: Something went wrong',
    });
  });
});
