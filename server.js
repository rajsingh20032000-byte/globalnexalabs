const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  try {
    res.render('index', { 
      title: 'GlobalNexa Labs | Next-Gen Software, AI & Mobile Solutions' 
    });
  } catch (err) {
    console.error("Render Error:", err);
    res.status(500).send(`<h3>Template Rendering Error:</h3><pre>${err.stack}</pre>`);
  }
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log(`Inquiry from ${name} (${email}): ${message}`);
  res.redirect('/?success=true');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});