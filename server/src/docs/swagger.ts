import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WorkFinder API',
      version: '1.0.0',
      description: 'API для фриланс-биржи WorkFinder',
      contact: {
        name: 'API Support',
        email: 'support@workfinder.ru',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.workfinder.ru/api',
        description: 'Production server',
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
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            type: { type: 'string', enum: ['FREELANCER', 'CLIENT', 'ADMIN'] },
            status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED'] },
            balance: { type: 'number' },
            rating: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          required: ['title', 'description', 'category', 'budgetMin', 'budgetMax'],
          properties: {
            title: { type: 'string', minLength: 10, maxLength: 200 },
            description: { type: 'string', minLength: 50, maxLength: 1000 },
            category: { type: 'string' },
            budgetMin: { type: 'number', minimum: 0 },
            budgetMax: { type: 'number', minimum: 0 },
            budgetType: { type: 'string', enum: ['FIXED', 'HOURLY'] },
            estimatedDuration: { type: 'string' },
            isRemote: { type: 'boolean', default: true },
            isUrgent: { type: 'boolean', default: false },
          },
        },
        Bid: {
          type: 'object',
          required: ['amount', 'description', 'timeline'],
          properties: {
            amount: { type: 'number', minimum: 0 },
            description: { type: 'string', minLength: 20, maxLength: 1000 },
            timeline: { type: 'string' },
            isHourly: { type: 'boolean', default: false },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Please authenticate',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Validation error message',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJsdoc(options);

export default specs;