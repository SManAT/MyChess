const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verify user credentials
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET, // Strong secret key
      {
        expiresIn: "24h", // Token expiration
      },
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};
