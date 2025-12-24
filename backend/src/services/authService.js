const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'eventmax-secret-key-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * Auth Service - Clean authentication implementation
 */
class AuthService {
    /**
     * Register a new user
     */
    async register(userData) {
        // Check if user exists
        const existing = await User.findByEmail(userData.email);
        if (existing) {
            throw new Error('User with this email already exists');
        }

        // Validate required fields
        if (!userData.email || !userData.password) {
            throw new Error('Email and password are required');
        }
        if (!userData.firstName || !userData.lastName) {
            throw new Error('First name and last name are required');
        }
        if (userData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Create user
        const user = await User.create(userData);

        // Generate tokens
        const tokens = this.generateTokens(user);

        return {
            user: User.format(user),
            tokens
        };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check if active
        if (!user.is_active) {
            throw new Error('Account is disabled');
        }

        // Verify password
        const isValid = await User.verifyPassword(password, user.password_hash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Generate tokens
        const tokens = this.generateTokens(user);

        return {
            user: User.format(user),
            tokens
        };
    }

    /**
     * Generate JWT tokens
     */
    generateTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

        return {
            accessToken,
            refreshToken,
            expiresIn: JWT_EXPIRES
        };
    }

    /**
     * Verify token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Refresh tokens
     */
    async refreshTokens(refreshToken) {
        const decoded = this.verifyToken(refreshToken);
        
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid refresh token');
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new Error('User not found');
        }

        return this.generateTokens(user);
    }

    /**
     * Get current user
     */
    async getCurrentUser(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return User.format(user);
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, data) {
        const user = await User.update(userId, data);
        if (!user) {
            throw new Error('User not found');
        }
        return User.format(user);
    }
}

module.exports = AuthService;
