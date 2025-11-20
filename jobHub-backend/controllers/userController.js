import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};

// Placeholder for other user controller functions if needed
export const getUsers = (req, res) => {
  res.status(501).json({ message: "Not Implemented: getUsers" });
};

export const getUserById = (req, res) => {
  res.status(501).json({ message: "Not Implemented: getUserById" });
};

export const registerUser = (req, res) => {
  res.status(501).json({ message: "Not Implemented: registerUser" });
};

export const loginUser = (req, res) => {
  res.status(501).json({ message: "Not Implemented: loginUser" });
};