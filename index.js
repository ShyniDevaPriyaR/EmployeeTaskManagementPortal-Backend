const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;


app.use(cors());
app.use(express.json());


let users = [
    {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        token: 'mock-admin-token-123',
        employeeId: null
    },
    {
        id: 2,
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'johndoe123',
        role: 'employee',
        token: 'mock-employee-token-456',
        employeeId: 1
    },
    {
        id: 3,
        name: 'Jane Smith',
        email: 'janesmith@example.com',
        password: 'janesmith123',
        role: 'employee',
        token: 'mock-employee-token-789',
        employeeId: 2
    },
    {
        id: 4,
        name: 'Alex Brown',
        email: 'alex@gmail.com',
        password: 'alex123',
        role: 'employee',
        token: 'token_alex_003',
        employeeId: 3
    }
];

// Mock database - Employees
let employees = [
    { id: 1, name: 'John Doe', email: 'johndoe@example.com', role: 'employee' },
    { id: 2, name: 'Jane Smith', email: 'janesmith@example.com', role: 'employee' },
    { id: 3, name: 'Alex Brown', email: 'alex@gmail.com', role: 'employee' }

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
    },
    {
        id: 3,
        title: 'Design Website',
        description: 'Create design through figma',
        assignedTo: 3,
        status: 'in-progress',
        createdAt: new Date('2024-01-20').toISOString()
    }
];


const generateId = (array) => {
    return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
};

const generateToken = (email, role) => {
    return `mock-${role}-token-${Date.now()}`;
};

app.get('/api/users', (req, res) => {
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
});


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


    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});


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

app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});


app.get('/api/employees', (req, res) => {
    res.json(employees);
});


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

app.delete('/api/employees/:id', (req, res) => {
    const employeeId = parseInt(req.params.id);

    const employeeIndex = employees.findIndex(e => e.id === employeeId);

    if (employeeIndex === -1) {
        return res.status(404).json({ error: 'Employee not found' });
    }


    tasks = tasks.filter(t => t.assignedTo !== employeeId);

    employees.splice(employeeIndex, 1);

    res.json({ message: 'Employee and associated tasks deleted successfully' });
});


app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});


app.post('/api/tasks', (req, res) => {
    const { title, description, assignedTo, status } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }


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


app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);

    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);

    res.json({ message: 'Task deleted successfully' });
});



app.listen(port, () => {
    console.log("Listenting to port number", port)
    console.log("Successfully connected")
});
