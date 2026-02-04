const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database - In-memory storage for users
let users = [
    {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        token: 'mock-admin-token-123',
        employeeId: null  // Admins don't have employee records
    },
    {
        id: 2,
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'johndoe123',
        role: 'employee',
        token: 'mock-employee-token-456',
        employeeId: 1  // Links to employee ID 1 in employees array
    },
    {
        id: 3,
        name: 'Jane Smith',
        email: 'janesmith@example.com',
        password: 'janesmith123',
        role: 'employee',
        token: 'mock-employee-token-789',
        employeeId: 2  // Links to employee ID 2 in employees array
    }
];

// Mock database - Employees
let employees = [
    { id: 1, name: 'John Doe', email: 'johndoe@example.com', role: 'employee' },
    { id: 2, name: 'Jane Smith', email: 'janesmith@example.com', role: 'employee' }
];

// Mock database - Tasks
let tasks = [
    {
        id: 1,
        title: 'Setup Development Environment',
        description: 'Install Node.js, VS Code, and Git',
        assignedTo: 1,
        status: 'completed',
        createdAt: new Date('2024-01-15').toISOString()
    },
    {
        id: 2,
        title: 'Design Database Schema',
        description: 'Create ER diagram for the application',
        assignedTo: 2,
        status: 'in-progress',
        createdAt: new Date('2024-01-20').toISOString()
    }
];

// Helper functions
const generateId = (array) => {
    return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
};

const generateToken = (email, role) => {
    return `mock-${role}-token-${Date.now()}`;
};

// GET all users (for debugging)
app.get('/api/users', (req, res) => {
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
});

// POST login - Validate credentials with role check
app.post('/api/login', (req, res) => {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!expectedRole) {
        return res.status(400).json({ error: 'Role information is required' });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.role !== expectedRole) {
        return res.status(403).json({
            error: `This account is registered as ${user.role}. Please use the ${user.role === 'admin' ? 'Admin' : 'Employee'} login card.`
        });
    }

    // Return user data without password, ensuring employeeId is included
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// POST register - Create new user
app.post('/api/register', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
        });
    }

    if (role !== 'admin' && role !== 'employee') {
        return res.status(400).json({ error: 'Role must be either admin or employee' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    const newUser = {
        id: generateId(users),
        name,
        email,
        password,
        role,
        token: generateToken(email, role)
    };

    users.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

// GET user by ID
app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// ===== EMPLOYEE ENDPOINTS =====

// GET all employees
app.get('/api/employees', (req, res) => {
    res.json(employees);
});

// POST create employee
app.post('/api/employees', (req, res) => {
    const { name, email, role } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingEmployee = employees.find(e => e.email === email);
    if (existingEmployee) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    const newEmployee = {
        id: generateId(employees),
        name,
        email,
        role: role || 'employee'
    };

    employees.push(newEmployee);
    res.status(201).json(newEmployee);
});

// PUT update employee
app.put('/api/employees/:id', (req, res) => {
    const employeeId = parseInt(req.params.id);
    const { name, email, role } = req.body;

    const employeeIndex = employees.findIndex(e => e.id === employeeId);

    if (employeeIndex === -1) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email exists for another employee
    const existingEmployee = employees.find(e => e.email === email && e.id !== employeeId);
    if (existingEmployee) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    employees[employeeIndex] = {
        ...employees[employeeIndex],
        name,
        email,
        role: role || 'employee'
    };

    res.json(employees[employeeIndex]);
});

// DELETE employee (cascade delete tasks)
app.delete('/api/employees/:id', (req, res) => {
    const employeeId = parseInt(req.params.id);

    const employeeIndex = employees.findIndex(e => e.id === employeeId);

    if (employeeIndex === -1) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Cascade delete: remove all tasks assigned to this employee
    tasks = tasks.filter(t => t.assignedTo !== employeeId);

    employees.splice(employeeIndex, 1);

    res.json({ message: 'Employee and associated tasks deleted successfully' });
});

// ===== TASK ENDPOINTS =====

// GET all tasks
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// POST create task
app.post('/api/tasks', (req, res) => {
    const { title, description, assignedTo, status } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    // Validate assignedTo exists
    if (assignedTo) {
        const employee = employees.find(e => e.id === assignedTo);
        if (!employee) {
            return res.status(400).json({ error: 'Assigned employee does not exist' });
        }
    }

    const validStatuses = ['pending', 'in-progress', 'completed'];
    const taskStatus = status && validStatuses.includes(status) ? status : 'pending';

    const newTask = {
        id: generateId(tasks),
        title,
        description,
        assignedTo: assignedTo || null,
        status: taskStatus,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT update task
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const { title, description, assignedTo, status } = req.body;

    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    // Validate assignedTo exists
    if (assignedTo) {
        const employee = employees.find(e => e.id === assignedTo);
        if (!employee) {
            return res.status(400).json({ error: 'Assigned employee does not exist' });
        }
    }

    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title,
        description,
        assignedTo: assignedTo || null,
        status: status || tasks[taskIndex].status
    };

    res.json(tasks[taskIndex]);
});

// DELETE task
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);

    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);

    res.json({ message: 'Task deleted successfully' });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`\nPre-configured demo accounts:`);
    console.log(`Admin: admin@example.com / admin123`);
    console.log(`Employee: johndoe@example.com / johndoe123`);
    console.log(`Employee: janesmith@example.com / janesmith123`);
    console.log(`\nSample data loaded: ${employees.length} employees, ${tasks.length} tasks\n`);
});
