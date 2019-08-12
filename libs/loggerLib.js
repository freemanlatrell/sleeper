// -------------------------------------------------------------
// logger.js - Logger Functions
// -------------------------------------------------------------

module.exports = () => {
	const exports = {};
	const path = require('path');
	const winston = require('winston');
	const expressWinston = require('express-winston');
	const dateFormat = '%Y/%M/%d-%H:%m:%s.%r';
	exports.dateFormat = dateFormat;
	
	/**
	 * Build logger
	 * @param {string} filename
	 * @return {winston.LoggerInstance}
	 */
	exports.logger = (filename) => {
		const LOG_PATH = path.join(__dirname, '../logs/');
		let LOG_FILE_NAME;
		if (filename) {
			LOG_FILE_NAME = filename;
		} else {
			LOG_FILE_NAME = 'server.log';
		}
		
		const d = new Date();
		const timezoneOffset = d.getTimezoneOffset();
		const transports = [
			new (winston.transports.Console)({
				colorize: true,
				stderrLevels: [],
				consoleWarnLevels: [],
				timestamp: function() {
					return exports.formatDate(Date.now() - timezoneOffset * 60 * 1000, dateFormat);
				}
			}),
			new winston.transports.File({
				filename: LOG_PATH + LOG_FILE_NAME,
				maxsize: 1024 * 1024 * 2,
				maxFiles: 25,
				tailable: true,
				colorize: false,
				maxRetries: 20,
				timestamp: () => {
					return exports.formatDate(Date.now() - timezoneOffset, dateFormat);
				},
				json: false
			})
		];
		
		return new (winston.Logger)({
			transports: transports
		});
	};
	
	/**
	 * Build HTTPS Logger
	 * @param {string} filename
	 * @return {expressWinston.LoggerInstance}
	 */
	exports.httpLogger = (filename) => {
		let logger;
		if (filename) {
			logger = exports.logger(filename);
		} else {
			logger = exports.logger();
		}
		
		return expressWinston.logger({
			winstonInstance: logger,
			colorize: false,
			expressFormat: true,
			meta: false,
			baseMeta: false
		});
	};
	
	/**
	 *  Format Date
	 * @param {string} date
	 * @param {string} fmt
	 * @return {string} {void | string | never}
	 */
	exports.formatDate = (date, fmt) => {
		date = new Date(date);
		
		return fmt.replace(/%([a-zA-Z])/g, (_, fmtCode) => {
			switch (fmtCode) {
				case 'Y':
					return date.getUTCFullYear();
				case 'M':								// Month 0 padded
					return exports.pad(date.getUTCMonth() + 1, 2);
				case 'd':								// Date 0 padded
					return exports.pad(date.getUTCDate(), 2);
				case 'H':								// 24 Hour 0 padded
					return exports.pad(date.getUTCHours(), 2);
				case 'm':								// Minutes 0 padded
					return exports.pad(date.getUTCMinutes(), 2);
				case 's':								// Seconds 0 padded
					return exports.pad(date.getUTCSeconds(), 2);
				case 'r':								// Milliseconds 0 padded
					return exports.pad(date.getUTCMilliseconds(), 3);
				default:
					console.error('unsupported fmt for formatDate()', fmt);
					return date.getTime();
			}
		});
	};
	
	/**
	 * left pad number with "0" if needed
	 * @param {string} value
	 * @param {string} desired
	 * @return {string}
	 */
	exports.pad = (value, desired) => {
		let str = value.toString();
		for (let i = str.length; i < desired; i++) {
			str = '0' + str;
		}
		return str;
	};
	
	return exports;
};
