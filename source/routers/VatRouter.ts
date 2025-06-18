import { Router } from 'express';
import { z } from 'zod';
import VatController from '../controllers/VatController.js';
import { Configuration } from '../models/ConfigurationModel.js';
import {
  COUNTRY_CODE_NOT_IMPLEMENTED,
  VatCheckDto,
  vatCheckDtoSchema,
} from '../models/VatCheckDto.js';

let vatController: VatController;

const router = (configuration: Configuration): Router => {
  const expressRouter: Router = Router({
    caseSensitive: true,
    strict: true,
  });

  const supportedCountryCodes = configuration.supportedCountryCodes ?? {};
  vatController = new VatController(configuration);

  expressRouter.post('/validate', (req, res): void => {
    const validation = vatCheckDtoSchema(supportedCountryCodes).safeParse(
      req.body
    );
    if (validation.error) {
      const issues = validation?.error?.issues ?? [];
      const countryCodeNotImplemented = issues.some(
        issue =>
          issue.code === z.ZodIssueCode.custom &&
          issue.params?.errorId === COUNTRY_CODE_NOT_IMPLEMENTED
      );

      res
        .status(countryCodeNotImplemented ? 501 : 400)
        .json({ error: validation.error.flatten() });
      return;
    }

    vatController
      .validateVat(validation.data as VatCheckDto)
      .then(vatValid => {
        res.status(200).json({
          valid: vatValid,
          details: vatValid
            ? 'VAT number is valid for the given country code.'
            : 'VAT number is invalid for the given country code.',
        });
      })
      .catch((error: { message?: string }) => {
        res.status(500).json({
          code: 500,
          message: `Internal Server Error: ${error.message}`,
        });
      });
  });

  return expressRouter;
};
export default router;
