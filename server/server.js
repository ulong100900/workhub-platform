// ============================================
// WorkFinder Server - Fixed CORS Version
// ============================================
const http = require('http');
const url = require('url');
const PORT = 5000;

// Mock database
const mockDB = {
  users: [
    { id: 1, email: 'admin@workfinder.ru', name: 'Admin', role: 'admin', password: 'admin123' },
    { id: 2, email: 'freelancer@test.ru', name: 'Иван Петров', role: 'freelancer', password: 'test123' },
    { id: 3, email: 'client@test.ru', name: 'Алексей Смирнов', role: 'client', password: 'test123' }
  ],
  projects: [
    { id: 1, title: 'Разработка сайта', description: 'Нужен современный сайт для компании', budget: 50000, clientId: 3, status: 'open', createdAt: '2024-01-10' },
    { id: 2, title: 'Дизайн логотипа', description: 'Создание логотипа для стартапа', budget: 15000, clientId: 3, status: 'in_progress', createdAt: '2024-01-09' },
    { id: 3, title: 'Мобильное приложение', description: 'Приложение для iOS и Android', budget: 100000, clientId: 3, status: 'open', createdAt: '2024-01-08' }
  ],
  bids: [
    { id: 1, projectId: 1, freelancerId: 2, amount: 45000, message: 'Выполню за 3 недели', status: 'pending', createdAt: '2024-01-11' }
  ],
  reviews: [
    { id: 1, reviewerId: 3, revieweeId: 2, rating: 5, comment: 'Отличная работа!', projectId: 1, createdAt: '2024-01-12' }
  ]
};

// Helper to read request body
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Set CORS headers
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

// Send JSON response
function sendJSON(res, statusCode, data) {
  setCORSHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// API Handlers
const apiHandlers = {
  // =================== AUTH ===================
  async login(req, res) {
    try {
      const body = await readBody(req);
      const { email, password } = JSON.parse(body);
      
      console.log(`Login attempt: ${email}, password length: ${password?.length || 0}`);
      
      const user = mockDB.users.find(u => u.email === email);
      
      if (user) {
        // В реальном приложении здесь была бы проверка пароля
        sendJSON(res, 200, {
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token: 'mock-jwt-token-' + Date.now()
        });
      } else {
        sendJSON(res, 401, {
          success: false,
          message: 'Invalid email or password'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      sendJSON(res, 400, {
        success: false,
        message: 'Invalid request format'
      });
    }
  },

  async register(req, res) {
    try {
      const body = await readBody(req);
      const { email, password, name, role = 'client' } = JSON.parse(body);
      
      console.log(`Registration attempt: ${email}, name: ${name}, role: ${role}`);
      
      // Check if user already exists
      if (mockDB.users.find(u => u.email === email)) {
        sendJSON(res, 409, {
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }
      
      // Create new user
      const newUser = {
        id: mockDB.users.length + 1,
        email,
        name,
        role,
        password: password, // В реальном приложении нужно хэшировать!
        createdAt: new Date().toISOString()
      };
      
      mockDB.users.push(newUser);
      
      sendJSON(res, 201, {
        success: true,
        message: 'Registration successful!',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
      
      console.log(`New user registered: ${newUser.email} (ID: ${newUser.id})`);
    } catch (error) {
      console.error('Registration error:', error);
      sendJSON(res, 400, {
        success: false,
        message: 'Invalid registration data'
      });
    }
  },

  // =================== PROJECTS ===================
  getProjects(req, res) {
    const { query } = url.parse(req.url, true);
    let projects = [...mockDB.projects];
    
    if (query.status) {
      projects = projects.filter(p => p.status === query.status);
    }
    
    if (query.limit) {
      projects = projects.slice(0, parseInt(query.limit));
    }
    
    const projectsWithDetails = projects.map(project => ({
      ...project,
      client: mockDB.users.find(u => u.id === project.clientId),
      bidsCount: mockDB.bids.filter(b => b.projectId === project.id).length
    }));
    
    sendJSON(res, 200, {
      success: true,
      count: projectsWithDetails.length,
      projects: projectsWithDetails
    });
  },

  getProjectById(req, res, id) {
    const projectId = parseInt(id);
    const project = mockDB.projects.find(p => p.id === projectId);
    
    if (!project) {
      sendJSON(res, 404, {
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    const projectWithDetails = {
      ...project,
      client: mockDB.users.find(u => u.id === project.clientId),
      bids: mockDB.bids
        .filter(b => b.projectId === projectId)
        .map(bid => ({
          ...bid,
          freelancer: mockDB.users.find(u => u.id === bid.freelancerId)
        }))
    };
    
    sendJSON(res, 200, {
      success: true,
      project: projectWithDetails
    });
  },

  async createProject(req, res) {
    try {
      const body = await readBody(req);
      const projectData = JSON.parse(body);
      
      const newProject = {
        id: mockDB.projects.length + 1,
        ...projectData,
        status: 'open',
        createdAt: new Date().toISOString()
      };
      
      mockDB.projects.push(newProject);
      
      sendJSON(res, 201, {
        success: true,
        message: 'Project created successfully',
        project: newProject
      });
    } catch (error) {
      sendJSON(res, 400, {
        success: false,
        message: 'Invalid project data'
      });
    }
  },

  // =================== USERS ===================
  getUsers(req, res) {
    const users = mockDB.users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }));
    
    sendJSON(res, 200, {
      success: true,
      count: users.length,
      users: users
    });
  },

  getUserById(req, res, id) {
    const userId = parseInt(id);
    const user = mockDB.users.find(u => u.id === userId);
    
    if (!user) {
      sendJSON(res, 404, {
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    const userStats = {
      ...user,
      projectsCreated: mockDB.projects.filter(p => p.clientId === userId).length,
      bidsSubmitted: mockDB.bids.filter(b => b.freelancerId === userId).length,
      reviewsReceived: mockDB.reviews.filter(r => r.revieweeId === userId).length
    };
    
    // Remove password from response
    delete userStats.password;
    
    sendJSON(res, 200, {
      success: true,
      user: userStats
    });
  },

  // =================== BIDS ===================
  async createBid(req, res) {
    try {
      const body = await readBody(req);
      const bidData = JSON.parse(body);
      
      const newBid = {
        id: mockDB.bids.length + 1,
        ...bidData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      mockDB.bids.push(newBid);
      
      sendJSON(res, 201, {
        success: true,
        message: 'Bid submitted successfully',
        bid: newBid
      });
    } catch (error) {
      sendJSON(res, 400, {
        success: false,
        message: 'Invalid bid data'
      });
    }
  },

  // =================== SYSTEM ===================
  health(req, res) {
    sendJSON(res, 200, {
      status: 'healthy',
      service: 'WorkFinder API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
      },
      database: {
        type: 'mock',
        users: mockDB.users.length,
        projects: mockDB.projects.length,
        bids: mockDB.bids.length,
        reviews: mockDB.reviews.length
      }
    });
  },

  stats(req, res) {
    sendJSON(res, 200, {
      success: true,
      stats: {
        users: mockDB.users.length,
        projects: mockDB.projects.length,
        openProjects: mockDB.projects.filter(p => p.status === 'open').length,
        inProgressProjects: mockDB.projects.filter(p => p.status === 'in_progress').length,
        bids: mockDB.bids.length,
        pendingBids: mockDB.bids.filter(b => b.status === 'pending').length,
        reviews: mockDB.reviews.length,
        averageRating: mockDB.reviews.reduce((sum, r) => sum + r.rating, 0) / mockDB.reviews.length || 0
      }
    });
  },

  // =================== ROOT & INFO ===================
  root(req, res) {
    sendJSON(res, 200, {
      message: 'WorkFinder API Server',
      description: 'Backend API for freelance marketplace',
      version: '1.0.0',
      status: 'running',
      documentation: {
        baseURL: 'http://localhost:5000/api',
        endpoints: [
          { method: 'GET', path: '/', description: 'API information' },
          { method: 'GET', path: '/health', description: 'Health check' },
          { method: 'GET', path: '/stats', description: 'Platform statistics' },
          { method: 'POST', path: '/auth/login', description: 'User authentication' },
          { method: 'POST', path: '/auth/register', description: 'User registration' },
          { method: 'GET', path: '/projects', description: 'List projects' },
          { method: 'GET', path: '/projects/:id', description: 'Get project details' },
          { method: 'POST', path: '/projects', description: 'Create project' },
          { method: 'GET', path: '/users', description: 'List users' },
          { method: 'GET', path: '/users/:id', description: 'Get user profile' },
          { method: 'POST', path: '/bids', description: 'Submit bid' }
        ]
      }
    });
  }
};

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  // Handle OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Route handling
  try {
    // API routes
    if (pathname.startsWith('/api/')) {
      const apiPath = pathname.substring(4); // Remove '/api'
      
      // Auth routes
      if (apiPath === '/auth/login' && req.method === 'POST') {
        await apiHandlers.login(req, res);
      }
      else if (apiPath === '/auth/register' && req.method === 'POST') {
        await apiHandlers.register(req, res);
      }
      // Project routes
      else if (apiPath === '/projects' && req.method === 'GET') {
        apiHandlers.getProjects(req, res);
      }
      else if (apiPath === '/projects' && req.method === 'POST') {
        await apiHandlers.createProject(req, res);
      }
      else if (apiPath.startsWith('/projects/') && req.method === 'GET') {
        const id = apiPath.split('/')[2];
        apiHandlers.getProjectById(req, res, id);
      }
      // User routes
      else if (apiPath === '/users' && req.method === 'GET') {
        apiHandlers.getUsers(req, res);
      }
      else if (apiPath.startsWith('/users/') && req.method === 'GET') {
        const id = apiPath.split('/')[2];
        apiHandlers.getUserById(req, res, id);
      }
      // Bid routes
      else if (apiPath === '/bids' && req.method === 'POST') {
        await apiHandlers.createBid(req, res);
      }
      // System routes
      else if (apiPath === '/health' && req.method === 'GET') {
        apiHandlers.health(req, res);
      }
      else if (apiPath === '/stats' && req.method === 'GET') {
        apiHandlers.stats(req, res);
      }
      else {
        sendJSON(res, 404, {
          success: false,
          message: 'API endpoint not found',
          availableEndpoints: [
            'GET /api/health',
            'GET /api/stats',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/projects',
            'POST /api/projects',
            'GET /api/projects/:id',
            'GET /api/users',
            'GET /api/users/:id',
            'POST /api/bids'
          ]
        });
      }
    }
    // Root route
    else if (pathname === '/' && req.method === 'GET') {
      apiHandlers.root(req, res);
    }
    // Not found
    else {
      sendJSON(res, 404, {
        success: false,
        message: 'Route not found',
        try: 'http://localhost:5000/api/health'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`
============================================
🚀 WORKFINDER API SERVER (FIXED CORS)
============================================
📡 Local:    http://localhost:${PORT}
📡 API Base: http://localhost:${PORT}/api
⏰ Started:  ${new Date().toLocaleString()}
============================================
✅ CORS enabled for all origins
✅ All endpoints working
✅ Mock database initialized
============================================

📋 TEST CREDENTIALS:
  1. Admin:     admin@workfinder.ru / admin123
  2. Freelancer: freelancer@test.ru / test123  
  3. Client:    client@test.ru / test123

💡 Quick tests in browser:
  - http://localhost:${PORT}/api/health
  - http://localhost:${PORT}/api/stats
  - http://localhost:${PORT}/api/projects

============================================
`);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});