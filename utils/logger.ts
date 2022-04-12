import { createLogger, format, transports } from "winston";

module.exports = createLogger({
    format: format.combine(
        format.simple(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`),
    ),
    transports: [
        new transports.File({
            maxsize: 5120000,
            maxFiles: 5,
            filename: `${__dirname}/../logs/api-logs.log`,
        }),
        new transports.Console({
            level: 'debug'
        })
    ],
});
