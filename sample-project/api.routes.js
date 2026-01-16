const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ 
    id: userId, 
    name: 'John Doe', 
    email: 'john@example.com' 
  });
});

app.post('/api/users', (req, res) => {
  const newUser = {
    id: Date.now(),
    ...req.body
  };
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({
    id: userId,
    ...req.body
  });
});

app.delete('/api/users/:id', (req, res) => {
  res.json({ message: 'User deleted successfully' });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
