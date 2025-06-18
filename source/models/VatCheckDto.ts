import { z } from 'zod';
import { SupportedCountryCodes } from './ConfigurationModel.js';

export const COUNTRY_CODE_NOT_IMPLEMENTED = 'COUNTRY_CODE_NOT_IMPLEMENTED';
export const VAT_FORMAT_INVALID = 'VAT_FORMAT_INVALID';

export const vatCheckDtoSchema = (
  supportedCountryCodes: SupportedCountryCodes
) =>
  z
    .object({
      countryCode: z
        .string()
        .length(2)
        .toUpperCase()
        .superRefine((val, ctx) => {
          if (!Object.keys(supportedCountryCodes).includes(val)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `County code not implemented: ${val}`,
              params: {
                errorId: COUNTRY_CODE_NOT_IMPLEMENTED,
              },
            });
          }
        }),
      vat: z.string(),
    })
    .superRefine((val, ctx) => {
      const regex = supportedCountryCodes[val.countryCode]?.validationRegex;
      if (!regex) return;

      const regexResult = z
        .string()
        .regex(new RegExp(regex))
        .safeParse(val.vat);
      if (regexResult.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `VAT format is invalid for country code ${val.countryCode}`,
          params: {
            errorId: VAT_FORMAT_INVALID,
          },
        });
      }
    });

export interface VatCheckDto {
  countryCode: string;
  vat: string;
}
