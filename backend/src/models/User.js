const { getPgPool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * User Model - Clean implementation matching database schema
 */
class User {
    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const pool = getPgPool();
        const query = `
            SELECT id, email, password_hash, first_name, last_name, phone,
                   role, email_verified, is_active, last_login, created_at, updated_at
            FROM users WHERE email = $1
        `;
        const result = await pool.query(query, [email.toLowerCase().trim()]);
        return result.rows[0] || null;
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const pool = getPgPool();
        const query = `
            SELECT id, email, password_hash, first_name, last_name, phone,
                   role, email_verified, is_active, last_login, created_at, updated_at
            FROM users WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Create a new user
     */
    static async create(data) {
        const pool = getPgPool();
        
        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 12);
        const id = uuidv4();
        
        const query = `
            INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, first_name, last_name, phone, role, email_verified, is_active, created_at
        `;
        
        const values = [
            id,
            data.email.toLowerCase().trim(),
            passwordHash,
            data.firstName || data.first_name,
            data.lastName || data.last_name,
            data.phone || null,
            data.role || 'customer'
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Update last login
     */
    static async updateLastLogin(userId) {
        const pool = getPgPool();
        const query = `UPDATE users SET last_login = NOW() WHERE id = $1`;
        await pool.query(query, [userId]);
    }

    /**
     * Update user
     */
    static async update(id, data) {
        const pool = getPgPool();
        const updates = [];
        const values = [];
        let i = 1;

        if (data.firstName) { updates.push(`first_name = $${i++}`); values.push(data.firstName); }
        if (data.lastName) { updates.push(`last_name = $${i++}`); values.push(data.lastName); }
        if (data.phone !== undefined) { updates.push(`phone = $${i++}`); values.push(data.phone); }
        if (data.emailVerified !== undefined) { updates.push(`email_verified = $${i++}`); values.push(data.emailVerified); }

        if (updates.length === 0) return this.findById(id);

        values.push(id);
        const query = `
            UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${i}
            RETURNING id, email, first_name, last_name, phone, role, email_verified, is_active, created_at, updated_at
        `;
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Format user for API response (removes sensitive data)
     */
    static format(user) {
        if (!user) return null;
        return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            name: `${user.first_name} ${user.last_name}`,
            phone: user.phone,
            role: user.role,
            emailVerified: user.email_verified,
            isActive: user.is_active,
            lastLogin: user.last_login,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
    }
}

module.exports = User;
