const express = require('express');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK safely from the config folder
let db = null;
try {
  const serviceAccount = require('./config/serviceAccountKey.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore();
  console.log("🔥 Firebase Admin initialized successfully!");
} catch (err) {
  console.log("⚠️ Warning: serviceAccountKey.json not found in the config folder or invalid credentials.");
}

// Set EJS view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup for Admin Authentication
app.use(session({
  secret: 'globalnexa_super_secure_admin_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ==========================================
// --- PUBLIC WEBSITE ROUTES ---
// ==========================================

app.get('/', (req, res) => {
  res.render('index', { 
    title: 'GlobalNexa Labs | Next-Gen Software, AI & Mobile Solutions' 
  });
});

// Contact Form Submission (Saves directly to Firebase Firestore 'inquiries')
app.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (db) {
      await db.collection('inquiries').add({
        name: name,
        email: email,
        message: message,
        createdAt: new Date()
      });
      console.log(`New inquiry saved to Firestore from ${name} (${email})`);
    }

    res.send(`
      <body style="background:#F8FAFC; color:#0F172A; font-family:'Plus Jakarta Sans', sans-serif; text-align:center; padding-top:120px;">
        <div style="max-width:500px; margin:0 auto; background:#ffffff; padding:40px; border-radius:16px; border:1px solid #E2E8F0; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          <div style="font-size:3rem; color:#0F9B58; margin-bottom:15px;"><i class="fa-solid fa-circle-check"></i></div>
          <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:10px;">Thank you, ${name}!</h2>
          <p style="color:#64748B; font-size:0.95rem; margin-bottom:25px;">Your message has been successfully received and securely saved in Firebase.</p>
          <a href="/" style="background:#0F9B58; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">Go Back Home</a>
        </div>
      </body>
    `);
  } catch (error) {
    console.error("Error saving inquiry to Firestore:", error);
    res.status(500).send("Error saving message to database.");
  }
});

// ==========================================
// --- ADMIN AUTHENTICATION & DASHBOARD ---
// ==========================================

app.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/admin-login', { title: 'Admin Login | GlobalNexa Labs', error: null });
});

app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  const ADMIN_EMAIL = "admin@globalnexalabs.com";
  const ADMIN_PASS = "globalnexa@2026";

  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  } else {
    res.render('admin/admin-login', { title: 'Admin Login | GlobalNexa Labs', error: 'Invalid email or password' });
  }
});

// Protected Admin Dashboard (GET) -> Handles overview cards counts and individual tabs
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }

  const activeTab = req.query.tab || 'overview';
  let inquiries = [];
  let customers = [];
  let partners = [];
  
  let totalCustomers = 0;
  let totalPartners = 0;
  let totalCategories = 0;
  let totalSubCategories = 0;

  try {
    if (db) {
      // Fetch counts for overview cards
      const custSnapshot = await db.collection('customers').get();
      totalCustomers = custSnapshot.size;

      const partSnapshot = await db.collection('partners').get();
      totalPartners = partSnapshot.size;

      // Optional: If you store categories/subcategories collections, fetch their sizes too
      try {
        const catSnapshot = await db.collection('categories').get();
        totalCategories = catSnapshot.size;
      } catch(e) { totalCategories = 4; /* Default placeholder count if collection missing */ }

      try {
        const subCatSnapshot = await db.collection('sub_categories').get();
        totalSubCategories = subCatSnapshot.size;
      } catch(e) { totalSubCategories = 12; /* Default placeholder count */ }

      // Fetch data based on active tab
      if (activeTab === 'customers') {
        customers = custSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (activeTab === 'partners') {
        partners = partSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (activeTab === 'inquiries') {
        const inqSnapshot = await db.collection('inquiries').orderBy('createdAt', 'desc').get();
        inquiries = inqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    }
  } catch (err) {
    console.error("Error fetching data from Firestore:", err);
  }

  res.render('admin/admin-dashboard', { 
    title: 'Admin Dashboard | GlobalNexa Labs',
    activeTab: activeTab,
    inquiries: inquiries,
    customers: customers,
    partners: partners,
    stats: {
      totalCustomers,
      totalPartners,
      totalCategories,
      totalSubCategories
    }
  });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});