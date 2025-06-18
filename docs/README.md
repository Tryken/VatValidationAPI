# VAT Number Validation Service

## Introduction

A lightweight Node.js service for validating VAT numbers across the EU and Switzerland.  
Depending on the country code, the service uses the appropriate validation API and applies format checks before querying.

## Purpose

Many businesses operating across European borders are required to validate the VAT numbers of their customers or partners to ensure tax compliance and enable VAT-exempt transactions within the EU.
While the European Union provides the VIES service for VAT number validation via a public **REST API**, Switzerland offers a separate validation endpoint that is only accessible via **SOAP**.

This service abstracts the differences between both systems by:

- Automatically selecting the correct backend (EU REST or Swiss SOAP) based on the country code.
- Performing format checks (via regex) before sending requests to external systems.
- Returning a unified and normalized response structure, regardless of the upstream system.
- Simplifying integration with internal tools, CRMs, or web backends.

By acting as a gateway between modern applications and government VAT services, this project reduces complexity, eliminates boilerplate code, and ensures consistent validation across both EU and Swiss.

## Features

- Validates VAT numbers for all EU countries via (REST) [VIES](https://ec.europa.eu/taxation_customs/vies/)
- Supports Swiss VAT numbers via the official Swiss API (SOAP) [UID-Register](https://www.bfs.admin.ch/bfs/de/home/register/unternehmensregister/unternehmens-identifikationsnummer.assetdetail.24605175.html)
- Input validation using country-specific regex
- Modular architecture with pluggable adapters per country
- Written in TypeScript (Node.js 22.13)

## Usage

### Prerequisites
Make sure you have the following tools installed:

- [Node.js 22.13+](https://nodejs.org)
- [pnpm](https://pnpm.io) – used as package manager
- [Git](https://git-scm.com) – to clone the repository

### Installation
```bash
git clone https://github.com/Tryken/VatValidationAPI.git
cd vat-validation-service
pnpm install
```

### Scripts
The project defines the following scripts:

| Script            | Description                                                 |
|-------------------|-------------------------------------------------------------|
| `pnpm build`      | Compiles the TypeScript source using `tsconfig.build.json`. |
| `pnpm dev`        | Builds the project and starts it in development mode.       |
| `pnpm watch`      | Rebuilds and restarts automatically using `nodemon`.        |
| `pnpm start`      | Starts the compiled app in production mode.                 |
| `pnpm lint`       | Runs ESLint over the TypeScript sources.                    |
| `pnpm format`     | Fixes formatting issues using ESLint.                       |
| `pnpm test`       | Runs the unit tests once using Jest.                        |
| `pnpm watch:test` | Runs tests in watch mode.                                   |
| `pnpm test-ci`    | Runs tests once, without cache, for CI environments.        |

### Running the Service (Development)

```bash
pnpm dev
```
Or, if you want to watch file changes

```bash
pnpm watch
```

The service will start and listen on the configured port (default: 3000).

### Running in Production

Build the app and start it

```bash
pnpm build
pnpm start

```

## API Documentation

The VAT validation API is documented using [OpenAPI 3](./openapi.yml)

### Example: 

### Request POST /vat/validate 

Request (application/json)

```json
{
  "countryCode": "DE",
  "vat": "DE123456789"
}
```

Response 200 OK (application/json)

```json
{
  "validated": true,
  "details": "VAT number is valid for the given country code."
}
```


## Configuration

### Environment Variables

Add the following env variables:

```env
PORT=3000
NODE_ENV=dev
```

### Configuration File

This service can be configured using a `configurations/configuration.json` file located at the root of the project

### Example

```json
{
  "port": 3000,
  "expressServerOptions": {
    "timeout": 5000,
    "keepAliveTimeout": 10000
  },
  "supportedCountryCodes": {
    "DE": {
      "validationRegex": "^DE[0-9]{9}$",
      "adapter": "EU"
    },
    "CH": {
      "validationRegex": "^CHE[0-9]{9}(MWST)?$",
      "adapter": "CH"
    }
  },
  "adapter": {
    "eu": {
      "baseUrl": "https://ec.europa.eu/taxation_customs/vies/rest-api",
      "splitRegex": "^([A-Z]{2}-?)(.+)$"
    },
    "ch": {
      "wsdlUrl": "https://www.uid-wse-a.admin.ch/V5.0/PublicServices.svc"
    }
  }
}
```

### Top Level Configuration Options

| Key                     | Type   | Required | Description                                                  |
|-------------------------|--------|----------|--------------------------------------------------------------|
| `port`                  | number | no       | The port the service should listen on (e.g. `3000`).         |
| `expressServerOptions`  | object | no       | Options for the internal HTTP server. See below for details. |
| `supportedCountryCodes` | object | no       | List of supported country codes with validation regex.       |
| `adapter`               | object | no       | Adapter settings for EU and CH vat validation backends.      |

### Express Server Options
Optional fine-tuning of the HTTP server (based on Node.js Server settings).

| Key                | Type   | Description                                  |
|--------------------|--------|----------------------------------------------|
| `timeout`          | number | Time in ms before a request times out.       |
| `keepAliveTimeout` | number | How long to keep the socket alive in ms.     |
| `maxHeadersCount`  | number | Maximum number of headers allowed.           |
| `maxConnections`   | number | Maximum number of simultaneous connections.  |
| `headersTimeout`   | number | Timeout for receiving the complete headers.  |
| `requestTimeout`   | number | Max time allowed to complete a full request. |

### Supported Country Codes

A map of country codes (e.g. DE, CH, ...) that defines VAT validation rules.

Each entry must contain:

| Key               | Type   | Required | Description                                                                |
|-------------------|--------|----------|----------------------------------------------------------------------------|
| `validationRegex` | string | yes      | Regex pattern for validating VAT number format before calling the adapter. |
| `adapter`         | string | yes      | Defines which adapter to use: `"EU"` or `"CH"`                             |                                                                       |

```json
{
  "supportedCountryCodes": {
    "DE": {
      "validationRegex": "^DE[0-9]{9}$",
      "adapter": "EU"
    },
    "CH": {
      "validationRegex": "^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$",
      "adapter": "CH"
    }
  }
}
```

### Allowed Adapter Values

| Value | Description                                |
|-------|--------------------------------------------|
| `EU`  | Use the EU VIES REST API for validation.   |
| `CH`  | Use the Swiss UID SOAP API for validation. |


### Adapter
Defines external VAT validation endpoints for EU and Switzerland.

**adapter.eu**

| Key          | Type   | Required | Description                                                     |
|--------------|--------|----------|-----------------------------------------------------------------|
| `baseUrl`    | string | 	yes     | The REST API base URL for the EU VAT validation service.        |
| `splitRegex` | string | yes      | Regex to split or normalize VAT numbers after local validation. |

**adapter.ch**

| Key       | Type   | Required | Description                                  |
|-----------|--------|----------|----------------------------------------------|
| `baseUrl` | string | 	yes     | URL of the Swiss VAT SOAP WSDL endpoint.     |



## Dependencies
- **Node.js** 22.13
- **TypeScript**
- **Express**
- **Zod** – for input validation
- **soap** -  used for Swiss API
- **pnpm** – as package manager

## Contributing

This project is a **proof of concept (PoC)** and was created for internal evaluation purposes only.

It is **not actively maintained** and will **not be developed further**.  
As such, **no support, bugfixes, or feature requests** will be processed.

Please do **not** submit pull requests or issues.

Thank you for your interest and understanding.

## License

This project is released under the MIT License.  
You are free to use, modify, and distribute it — even commercially.

See [LICENSE](./../LICENSE.txt) for full details.