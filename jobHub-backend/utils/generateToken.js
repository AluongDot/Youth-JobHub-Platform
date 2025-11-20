import jwt from "jsonwebtoken";

const generateToken = (user) => {
  // Accept either user object or id
  const payload = typeof user === "string" || typeof user === "number" ? { id: user } : { id: user._id };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d"
  });
};

export default generateToken;
