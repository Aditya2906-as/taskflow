CREATE DATABASE IF NOT EXISTS taskmanager;
USE taskmanager;

-- USERS
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOARDS
CREATE TABLE boards (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    owner_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- BOARD MEMBERS
CREATE TABLE board_members (
    board_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,

    PRIMARY KEY(board_id, user_id),

    FOREIGN KEY (board_id)
        REFERENCES boards(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- COLUMNS
CREATE TABLE columns (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    board_id CHAR(36),
    title VARCHAR(100) NOT NULL,
    position INT NOT NULL DEFAULT 0,

    FOREIGN KEY (board_id)
        REFERENCES boards(id)
        ON DELETE CASCADE
);

-- TASKS
CREATE TABLE tasks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    column_id CHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    assignee_id CHAR(36),
    position INT NOT NULL DEFAULT 0,

    priority ENUM('low','medium','high')
        DEFAULT 'medium',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (column_id)
        REFERENCES columns(id)
        ON DELETE CASCADE,

    FOREIGN KEY (assignee_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- CHAT MESSAGES
CREATE TABLE chat_messages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    board_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (board_id)
        REFERENCES boards(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- INVITATIONS
CREATE TABLE invitations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    board_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL,
    receiver_id CHAR(36) NOT NULL,

    status ENUM(
        'pending',
        'accepted',
        'declined'
    ) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(board_id, receiver_id),

    FOREIGN KEY (board_id)
        REFERENCES boards(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,

    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,

    data JSON,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- PASSWORD RESET OTP
CREATE TABLE password_reset_otp (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    otp CHAR(6) NOT NULL,

    expires_at DATETIME NOT NULL,

    used BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_email(email)
);

-- WIKI PAGES
CREATE TABLE wiki_pages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    board_id CHAR(36) NOT NULL,

    title VARCHAR(200)
        DEFAULT 'Untitled',

    category ENUM(
        'notes',
        'documentation',
        'faqs',
        'guidelines'
    ) DEFAULT 'notes',

    created_by CHAR(36),

    content LONGTEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (board_id)
        REFERENCES boards(id)
        ON DELETE CASCADE,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);