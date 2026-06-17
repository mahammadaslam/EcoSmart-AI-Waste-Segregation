-- MySQL Schema for EcoSmart AI – AI Powered Waste Segregation Assistant
-- SDG 12 – Responsible Consumption and Production

CREATE DATABASE IF NOT EXISTS ecosmart_db;
USE ecosmart_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NULL, -- Null if logged in via Google OAuth
  google_id VARCHAR(255) NULL,
  profile_image TEXT NULL,
  role VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scans Table
CREATE TABLE IF NOT EXISTS scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image_url LONGTEXT NOT NULL, -- Stored as base64 or a direct link
  category VARCHAR(100) NOT NULL, -- 'Plastic', 'Paper', 'Metal', 'Organic', 'E-Waste', 'Glass', 'Other'
  confidence FLOAT NOT NULL,
  recommendation TEXT NOT NULL,
  disposal_method TEXT NULL,
  recycling_method TEXT NULL,
  environmental_impact TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Default Admin User (For demonstration and evaluation)
-- Plain text password is "admin123" - please hash this in a production environment
-- The application automatically hashes password if it creates a user from the Signup page
INSERT INTO users (name, email, password, role)
SELECT 'System Admin', 'admin@ecosmart.com', '$2b$10$v094W4zK.N4PscK.iY.8DeCOqgQ9Q5nPhP7vNlGjZ4y9u1vBIdf1m', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ecosmart.com');
