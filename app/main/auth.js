const crypto = require('crypto');
const database = require('../database');

class AuthManager {
  constructor() {
    // Session tokens (in-memory, cleared on app restart)
    this.sessions = new Map();
    
    // Initialize default users if needed
    this.initDefaultUsers();
  }

  /**
   * Initialize default users in the database if they don't exist
   */
  initDefaultUsers() {
    try {
      const admin = database.getUserByUsername('admin');
      if (!admin) {
        console.log('Creating default admin user...');
        database.addUser({
          username: 'admin',
          password_hash: this.hashPassword('admin'),
          role: 'admin',
          permissions: ['all']
        });
      }

      const employee = database.getUserByUsername('employee');
      if (!employee) {
        console.log('Creating default employee user...');
        database.addUser({
          username: 'employee',
          password_hash: this.hashPassword('employee'),
          role: 'employee',
          permissions: ['view_printing', 'edit_printing', 'convert_to_debt', 'view_sales', 'edit_sales']
        });
      }
    } catch (error) {
      console.error('Error initializing default users:', error);
    }
  }

  /**
   * Hash password using PBKDF2
   */
  hashPassword(password) {
    const salt = 'multiprints-salt-key'; // In production, use random salt stored in DB
    return crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
  }

  /**
   * Verify password
   */
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  /**
   * Generate session token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Authenticate user with username and password
   */
  authenticate(username, password) {
    const user = database.getUserByUsername(username);

    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    if (!this.verifyPassword(password, user.password_hash)) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    // Parse permissions if stored as string
    let permissions = user.permissions;
    if (permissions && typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = [permissions];
      }
    }

    // Generate session token
    const token = this.generateToken();
    const session = {
      token,
      username,
      role: user.role,
      permissions: permissions || [],
      createdAt: Date.now()
    };

    this.sessions.set(token, session);

    return {
      success: true,
      token,
      user: {
        username,
        role: user.role,
        permissions: permissions || []
      }
    };
  }

  /**
   * Validate session token
   */
  validateToken(token) {
    return this.sessions.has(token);
  }

  /**
   * Get session data
   */
  getSession(token) {
    return this.sessions.get(token);
  }

  /**
   * Logout (invalidate token)
   */
  logout(token) {
    return this.sessions.delete(token);
  }

  /**
   * Add a new user (admin only)
   */
  addUser(username, password, role = 'employee') {
    if (database.getUserByUsername(username)) {
      return {
        success: false,
        error: 'User already exists'
      };
    }

    database.addUser({
      username,
      password_hash: this.hashPassword(password),
      role,
      permissions: role === 'admin' ? ['all'] : ['view_printing', 'edit_printing', 'convert_to_debt', 'view_sales', 'edit_sales']
    });

    return {
      success: true,
      message: 'User created successfully'
    };
  }

  /**
   * Update user username
   */
  updateUsername(oldUsername, newUsername) {
    if (oldUsername !== newUsername && database.getUserByUsername(newUsername)) {
      return {
        success: false,
        error: 'Username already taken'
      };
    }

    database.updateUsername(oldUsername, newUsername);

    // Update active sessions
    for (const [token, session] of this.sessions) {
      if (session.username === oldUsername) {
        session.username = newUsername;
        this.sessions.set(token, session);
      }
    }

    return {
      success: true,
      message: 'Username updated successfully'
    };
  }

  /**
   * Update user password
   */
  updatePassword(username, oldPassword, newPassword) {
    const user = database.getUserByUsername(username);

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    if (!this.verifyPassword(oldPassword, user.password_hash)) {
      return {
        success: false,
        error: 'Current password is incorrect'
      };
    }

    database.updateUserPassword(username, this.hashPassword(newPassword));

    return {
      success: true,
      message: 'Password updated successfully'
    };
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers() {
    const users = database.getAllUsers();
    return users.map(user => ({
      username: user.username,
      role: user.role
    }));
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(username) {
    if (username === 'admin') {
      return {
        success: false,
        error: 'Cannot delete admin user'
      };
    }

    if (!database.getUserByUsername(username)) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    database.deleteUser(username);

    // Invalidate all sessions for this user
    for (const [token, session] of this.sessions) {
      if (session.username === username) {
        this.sessions.delete(token);
      }
    }

    return {
      success: true,
      message: 'User deleted successfully'
    };
  }
}

// Export singleton instance
module.exports = new AuthManager();
