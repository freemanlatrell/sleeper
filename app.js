// -------------------------------------------------------------
// app.js - the main starting file for the Sleeper Bot App
// -------------------------------------------------------------

const express = require('express');
const app = express();
const compression = require('compression');
const helmet = require('helmet');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const https = require('http');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const httpPort = 3000;
const loggerLib = require(path.join(__dirname, './libs/loggerLib.js'))();
const logger = loggerLib.logger();
const httpLogger = loggerLib.httpLogger();
const sleeperApis = require('./routes/sleeperApis.js')(logger);


/**
 * Set Headers
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
const headers = (req, res, next) => {
	res.removeHeader('X-Powered-By');
	res.setHeader('Access-Control-Expose-Headers', 'Location');
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
};
/**
 * Logs all requests
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
const apiLogger = (req, res, next) => {
	logger.info('Request received >> ' + req.method + ' ' + req.originalUrl);
	res.on('finish', () => {
		logger.info('Response from ' + req.method + ' ' + req.originalUrl + ' >> ' + res.statusCode + ' ' + res.statusMessage + '');
	});
	next();
};

// ---------------------
// Setup App
// ---------------------

app.use(compression());
app.use(helmet({
	hsts: {
		maxAge: 31536000,
		includeSubDomains: true
	}
}));
app.use(bodyParser.text({type: 'text/html', limit: '1mb'}));
app.use(bodyParser.text({type: 'text/plain', limit: '1mb'}));
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));
app.use(cookieParser());
app.use(httpLogger);
app.use(apiLogger);
app.use(headers);
app.enable('trust proxy');

// Read in the specs for various routes //
// Get all files in that directory
const swaggerFiles = fs.readdirSync(path.join(__dirname, './swagger'));
const swaggerDefinitions = {};
// For each one
for (const i in swaggerFiles) {
	// Add that spec to the swaggerDefinitions
	if (swaggerFiles.hasOwnProperty(i)) {
		const spec = swaggerFiles[i].substring(0, swaggerFiles[i].length - 5); // << Remove the '.json'
		swaggerDefinitions[spec] = require('./swagger/' + swaggerFiles[i]);
	}
}

// Create the options object that swaggerJsdoc
const swaggerOptions = {
	swaggerDefinition: {
		info: {
			title: 'Sleeper Bot App',
			version: '1.0.0',
			description: 'Fantasy Football Sleeper App'
		},
		// Swagger definitions we assigned above
		definitions: swaggerDefinitions,
	},
	// Will look at all .js files in routes to find JsDocs to make swagger entries out of
	apis: ['./routes/*.js']
};

// Initialize the swaggerJsDoc
const specs = swaggerJsdoc(swaggerOptions);
// Tell it where to find spec files
specs.paths.basePath = 'swagger/';

// Set up the /api-docs route with swagger-ui-express
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api-docs', helmet.noCache());

// ---------------------
// Routes
// ---------------------
app.use('/api', helmet.noCache());
sleeperApis.getAllPicksInDraftForUser('papertrell', '2018', 'bang', (err, resp) => {
	if (err) {
		logger.error(err);
	} else {
		logger.info(resp);
	}
});


// ---------------------
// Start Server
// ---------------------
const httpServer = https.createServer(app);
const hostUrl = (process.env.HOSTURL) ? 'https://' + process.env.HOSTURL : 'https://localhost:3000';
httpServer.listen(httpPort, () => {
	logger.info('Starting Sleeper Bot App: ' + hostUrl);
});

httpServer.timeout = 28800000; // 8 hours

module.exports.server = httpServer;


