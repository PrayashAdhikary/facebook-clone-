const express  = require('express')
const mongoose = require('mongoose')
const bcrypt   = require('bcrypt')
const cors     = require('cors')
require('dotenv').config()

const app = express()

// Allow requests from your Vercel frontend
app.use(cors({
  origin: '*'   // replace '*' with your Vercel URL later e.g. 'https://myapp.vercel.app'
}))

app.use(express.json())

// ── Connect to MongoDB ──
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB error:', err))

// ── User Model ──
const User = mongoose.model('User', {
  firstName: String,
  lastName:  String,
  email:     { type: String, unique: true, lowercase: true },
  password:  String,
  dob:       String,
  gender:    String,
  createdAt: { type: Date, default: Date.now }
})

// ── SIGNUP ──
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, dob, gender } = req.body

  if (!email || !password || !firstName) {
    return res.status(400).json({ error: 'Please fill all required fields' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    const hash = await bcrypt.hash(password, 12)
    const user = await User.create({ firstName, lastName, email, password: hash, dob, gender })
    res.json({ success: true, message: 'Account created!', name: user.firstName })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// ── LOGIN ──
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password' })
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'No account found with this email' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Wrong password' })

    res.json({ success: true, name: user.firstName, email: user.email })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// ── Health check (just to confirm server is alive) ──
app.get('/', (req, res) => {
  res.send('Server is running!')
})

// ── Start server ──
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server running on port', PORT))
