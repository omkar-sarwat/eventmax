const AuthService = require('../services/authService');

const authService = new AuthService();

/**
 * Auth Controller - Clean authentication endpoints
 */
const AuthController = {
    /**
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { email, password, firstName, lastName, phone, role } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            if (!firstName || !lastName) {
                return res.status(400).json({ error: 'First name and last name are required' });
            }

            const result = await authService.register({
                email,
                password,
                firstName,
                lastName,
                phone,
                role: role || 'customer'
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            console.error('Registration error:', error.message);
            
            if (error.message.includes('already exists')) {
                return res.status(409).json({ error: error.message });
            }
            
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await authService.login(email, password);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            console.error('Login error:', error.message);
            
            if (error.message.includes('Invalid')) {
                return res.status(401).json({ error: error.message });
            }
            if (error.message.includes('disabled')) {
                return res.status(403).json({ error: error.message });
            }
            
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/auth/logout
     */
    async logout(req, res) {
        // In a stateless JWT setup, logout is handled client-side
        // Server can optionally blacklist the token in Redis
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    },

    /**
     * POST /api/auth/refresh
     */
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            const tokens = await authService.refreshTokens(refreshToken);

            res.status(200).json({
                success: true,
                data: { tokens }
            });
        } catch (error) {
            console.error('Refresh error:', error.message);
            res.status(401).json({ error: error.message });
        }
    },

    /**
     * GET /api/auth/me
     */
    async getMe(req, res) {
        try {
            const user = await authService.getCurrentUser(req.user.userId);

            res.status(200).json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('GetMe error:', error.message);
            res.status(404).json({ error: error.message });
        }
    },

    /**
     * PUT /api/auth/profile
     */
    async updateProfile(req, res) {
        try {
            const { firstName, lastName, phone } = req.body;

            const user = await authService.updateProfile(req.user.userId, {
                firstName,
                lastName,
                phone
            });

            res.status(200).json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('Update profile error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = AuthController;
