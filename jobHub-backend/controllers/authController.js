import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Create email transporter - FIXED: createTransport (not createTransporter)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
const sendEmail = async (emailData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"YouthJobHub" <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    };

    console.log('📧 [EMAIL] Attempting to send email to:', emailData.to);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ [EMAIL] Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ [EMAIL] Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// ===================== REGISTER USER =====================
export const registerUser = async (req, res) => {
  try {
    console.log("🔍 [BACKEND] Register request received:", {
      body: req.body,
      method: req.method,
      url: req.url
    });

    const { name, email, password, userType, role } = req.body;

    console.log("🔍 [BACKEND] Parsed fields:", {
      name: name || 'undefined',
      email: email || 'undefined',
      password: password ? '***' : 'undefined',
      userType: userType || 'undefined',
      role: role || 'undefined'
    });

    if (!name || !email || !password) {
      console.log("❌ [BACKEND] Validation failed - Missing fields:", {
        name: !!name, email: !!email, password: !!password
      });
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
        missingFields: {
          name: !name,
          email: !email,
          password: !password
        }
      });
    }

    console.log("🔍 [BACKEND] Checking if user exists...");
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("❌ [BACKEND] User already exists:", email);
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const finalRole = role || (userType === 'employer' ? 'employer' : 'jobseeker');

    console.log("🔍 [BACKEND] Creating user with role:", finalRole);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: finalRole
    });

    const token = generateToken(user._id);

    console.log("✅ [BACKEND] User created successfully:", {
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token,
      message: "Registration successful"
    });

  } catch (err) {
    console.error("❌ [BACKEND] Registration error:", err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      console.log("❌ [BACKEND] Validation error details:", messages);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages
      });
    }

    if (err.code === 11000) {
      console.log("❌ [BACKEND] Duplicate email error");
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ===================== LOGIN USER =====================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error("❌ [BACKEND] Login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
};

// ===================== FORGOT PASSWORD =====================
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    console.log(`🔍 [BACKEND] Password reset request for: ${email}`);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ [BACKEND] User not found for password reset');
      // Return success even if user not found for security
      return res.status(200).json({ 
        success: true,
        message: 'If this email exists, a reset link will be sent' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token and save to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiration (10 minutes)
    const resetTokenExpires = Date.now() + 10 * 60 * 1000;

    // Debug logging
    console.log('🔑 [DEBUG] Reset token generated');
    console.log('⏰ [DEBUG] Token expires:', new Date(resetTokenExpires).toISOString());

    // Save to user document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = resetTokenExpires;
    
    console.log('💾 [DEBUG] Saving user with reset token...');
    await user.save();
    console.log('✅ [DEBUG] User saved successfully with reset token');

    // Create reset URL with plain token
    const resetURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    console.log('📧 [BACKEND] Sending password reset email...');

    // Email template
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; 
                   text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; 
                   text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #2563eb; margin: 0;">YouthJobHub</h1>
            <p style="color: #6b7280; margin: 5px 0;">Reset Your Password</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p>You requested a password reset for your YouthJobHub account. Click the button below to reset your password. This link will expire in 10 minutes.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetURL}" class="button">Reset Password</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="background: #f1f5f9; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
              ${resetURL}
            </p>
          </div>
          
          <div class="footer">
            <p>If you didn't request this reset, please ignore this email. Your password will remain unchanged.</p>
            <p>© ${new Date().getFullYear()} YouthJobHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'YouthJobHub - Password Reset Request',
      html: emailTemplate
    });

    console.log(`✅ [BACKEND] Password reset email sent successfully to: ${user.email}`);

    res.status(200).json({ 
      success: true,
      message: 'Password reset email sent successfully' 
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] Password reset error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending reset email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===================== RESET PASSWORD =====================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    console.log(`🔍 [BACKEND] Processing password reset with token`);

    // Hash the token to compare with stored one
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('❌ [BACKEND] Invalid or expired reset token');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired reset token' 
      });
    }

    console.log(`✅ [BACKEND] Valid reset token found for user: ${user.email}`);

    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    console.log(`✅ [BACKEND] Password reset successful for user: ${user.email}`);

    // Send confirmation email
    try {
      const confirmationTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { color: #059669; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="success">Password Successfully Reset</h2>
            <p>Your YouthJobHub password has been successfully reset.</p>
            <p>If you did not make this change, please contact support immediately.</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">
              This is an automated message from YouthJobHub.
            </p>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: user.email,
        subject: 'YouthJobHub - Password Reset Confirmation',
        html: confirmationTemplate
      });
    } catch (emailError) {
      console.log('⚠️ [BACKEND] Could not send confirmation email:', emailError.message);
      // Don't fail the request if confirmation email fails
    }

    res.status(200).json({ 
      success: true,
      message: 'Password reset successful' 
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===================== GET CURRENT USER =====================
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ [BACKEND] Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// ===================== UPDATE USER PROFILE =====================
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio, skills, experience } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    if (skills) user.skills = skills;
    if (experience) user.experience = experience;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience
      }
    });
  } catch (error) {
    console.error('❌ [BACKEND] Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};