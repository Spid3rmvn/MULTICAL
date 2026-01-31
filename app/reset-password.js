/**
 * Password Reset Script
 * Run this to reset user passwords
 * Usage: node reset-password.js [username] [new_password]
 */

const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Determine database path based on OS
function getDbPath() {
  const platform = os.platform();
  let userDataPath;
  
  if (platform === 'win32') {
    userDataPath = path.join(process.env.APPDATA, 'multiprints');
  } else if (platform === 'darwin') {
    userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'multiprints');
  } else {
    // Linux
    userDataPath = path.join(os.homedir(), '.config', 'multiprints');
  }
  
  return path.join(userDataPath, 'multiprints.db');
}

// Hash password using same method as the app
function hashPassword(password) {
  const salt = 'multiprints-salt-key';
  return crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // List all users
    try {
      const dbPath = getDbPath();
      console.log('Database path:', dbPath);
      
      const db = new Database(dbPath);
      const users = db.prepare('SELECT username, role, created_at FROM users').all();
      
      console.log('\n=== Existing Users ===');
      users.forEach(user => {
        console.log(`- Username: ${user.username} | Role: ${user.role} | Created: ${user.created_at}`);
      });
      console.log('\nTo reset a password, run:');
      console.log('  node reset-password.js <username> <new_password>');
      console.log('\nExample:');
      console.log('  node reset-password.js admin newpassword123');
      
      db.close();
    } catch (error) {
      console.error('Error reading database:', error.message);
    }
    return;
  }
  
  if (args.length !== 2) {
    console.log('Usage:');
    console.log('  List users:  node reset-password.js');
    console.log('  Reset pass:  node reset-password.js <username> <new_password>');
    return;
  }
  
  const [username, newPassword] = args;
  
  try {
    const dbPath = getDbPath();
    console.log('Database path:', dbPath);
    
    const db = new Database(dbPath);
    
    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      console.error(`\n❌ User "${username}" not found!`);
      console.log('\nExisting users:');
      const users = db.prepare('SELECT username, role FROM users').all();
      users.forEach(u => console.log(`  - ${u.username} (${u.role})`));
      db.close();
      return;
    }
    
    // Update password
    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?')
      .run(newHash, username);
    
    console.log(`\n✅ Password for "${username}" has been reset successfully!`);
    console.log(`   New password: ${newPassword}`);
    
    db.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
