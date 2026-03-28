import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * @name Logger
 * @description A logger implementation using Pino
 */
const Logger = pino({
  level: 'debug',
  base: {
    env: process.env.NODE_ENV,
  },
  errorKey: 'error',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname,env',
        messageFormat: '{msg}',
        levelFirst: true,
        customColors:
          'fatal:bgRed,error:red,warn:yellow,info:cyan,debug:gray,trace:white',
        customLevels: '',
        useOnlyCustomProps: false,
        singleLine: false,
      },
    },
  }),
});

export { Logger };
