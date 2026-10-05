const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as view engine and use absolute path for views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  try {
    res.render('index', { 
      title: 'GlobalNexa Labs | Next-Gen Software, AI & Mobile Solutions' 
    });
  } catch (err) {
    console.error("View rendering error:", err);
    res.status(500).send(`<h3>Rendering Error:</h3><pre>${err.message}</pre>`);
  }
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log(`Inquiry from ${name} (${email}): ${message}`);
  res.send(`
    <body style="background:#020617; color:#fff; font-family:sans-serif; text-align:center; padding-top:100px;">
      <h2>Thank you, ${name}!</h2>
      <p>Your message has been received successfully.</p>
      <a href="/" style="color:#0F9B58; text-decoration:underline; display:inline-block; margin-top:20px;">Go Back Home</a>
    </body>
  `);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});