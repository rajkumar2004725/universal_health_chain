import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Universal Health Chain API',
            version: '1.0.0',
            description: 'API documentation for Universal Health Chain backend',
            license: {
                name: 'MIT',
                url: 'https://spdx.org/licenses/MIT.html',
            },
            contact: {
                name: 'UHC Team',
                url: 'https://uhc.example.com',
                email: 'support@uhc.example.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: [
        './routes/*.js',
        './models/*.js',
    ],
};

export default swaggerJsdoc(options);
