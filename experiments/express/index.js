const express = require('express')
const app = express()
const port = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api/items', (req, res) => {
  res.json([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ])
})

app.get('/api/items/:id', (req, res) => {
  const id = req.params.id
  res.json({ id: id, name: `Item ${id}` })
})

app.post('/api/items', (req, res) => {
  const newItem = {
    id: Date.now(),
    name: req.body.name
  }
  res.status(201).json(newItem)
})

app.put('/api/items/:id', (req, res) => {
  const id = req.params.id
  res.json({ id: id, name: req.body.name })
})

app.delete('/api/items/:id', (req, res) => {
  res.json({ message: 'Item deleted' })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
