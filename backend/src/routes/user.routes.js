import bcrypt from "bcrypt"
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { loginPostRequestBodySchema, signupPostRequestBodySchema } from "../validation/request.validation.js";
import { BlacklistedToken } from "../models/user.model.js";


export const signup = async (req, res) => {
 const validationResult = await signupPostRequestBodySchema.safeParseAsync(req.body);

  if (validationResult.error) {
    return res.status(400).json({ error: validationResult.error.format() });
  }

  const { name, userName, email, password } = validationResult.data;

  const existingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
    const salt = await bcrypt.genSalt(10);

  const user = await User.insertOne({
    name,
    userName,
    email,
    password: hashedPassword,
    salt,
  });

  const token = jwt.sign(
    {
        userId: user._id,
        email: user.email,
        userName: user.userName,
    },
    process.env.JWT_SECRET
  )

  return res.status(201).json({ message: "User created successfully", user, token });
};

export const login = async (req, res) => {
    const validationResult = await loginPostRequestBodySchema.safeParseAsync(req.body);

    if(validationResult.error) {
        return res.status(400).json({ error: validationResult.error.format() });
    }

    const { email, password } = validationResult.data;

    const existingUser = await User.findOne({
        email,
    })

    if(!existingUser) {
        return res.status(404).json({ error: "User not found" })
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if(!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const paylaod = {
        _id: existingUser._id,
        email: existingUser.email,
        userName: existingUser.userName,
    }

    const token = jwt.sign(paylaod, process.env.JWT_SECRET);

    return res.status(200).json({ status: "sucess", token })
};

export const logoutUser = async (req, res) => {
   try {
     if(!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
     }
     const token = req.headers.authorization?.split(" ")[1];

     await BlacklistedToken.create({ token, expiresAt: new Date(Date( req.user.exp*1000)) });

     return res.status(200).json({ status: "success", message: "Logged out successfully" });
   } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
   }
};

export const me = async (req, res) => {

    if(!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user._id).select('-password -salt');

    if(!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const userData = {
        name: user.name,
        userName: user.userName,
        email: user.email,
    }

    return res.status(200).json({ user: userData });

};

export const updatePassword = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { currentPassword, newPassword } = req.body;



        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: "New password must be at least 6 characters long" 
            });
        }


        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }


        const isSamePassword = await bcrypt.compare(newPassword, user.password);

        if (isSamePassword) {
            return res.status(400).json({ 
                error: "New password must be different from current password" 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);


        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ 
            message: "Password updated successfully" 
        });

    } catch (error) {
        console.error("Update password error:", error);
        return res.status(500).json({ 
            error: "Failed to update password" 
        });
    }
};



