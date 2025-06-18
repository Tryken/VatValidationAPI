import { Server } from 'http';
import {
  Configuration,
  readAppConfiguration,
} from './models/ConfigurationModel.js';
import createApp from './server.js';

const configurationFile = `configurations/configuration.json`;

const configuration: Configuration = readAppConfiguration(configurationFile);

const server: Server = createApp(configuration).app.listen(
  configuration.port,
  () => {
    console.log({
      description: 'START',
      port: configuration.port,
      env: process.env.NODE_ENV,
    });
  }
);

server.keepAliveTimeout =
  configuration.expressServerOptions?.keepAliveTimeout ?? 60000; // Default 60 seconds
server.maxHeadersCount =
  configuration.expressServerOptions?.maxHeadersCount ?? 1000; // Default 1000 headers
server.maxConnections =
  configuration.expressServerOptions?.maxConnections ?? 100; // Default 100 connections
server.headersTimeout =
  configuration.expressServerOptions?.headersTimeout ?? 60000; // Default 60 seconds
server.requestTimeout =
  configuration.expressServerOptions?.requestTimeout ?? 60000; // Default 60 seconds
server.timeout = configuration.expressServerOptions?.timeout ?? 60000; // Default 60 seconds
