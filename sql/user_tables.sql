CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL,
    disc_id VARCHAR(37) NOT NULL UNIQUE,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS user_login_info (
    user_id INT NOT NULL UNIQUE,
    init_ip VARCHAR(16),
    last_ip VARCHAR(16),
    last_interaction TIMESTAMP,
    session_active BOOLEAN NOT NULL,
    session_expires TIMESTAMP,
    session_id VARCHAR(32),
    oauth_provider VARCHAR(256),
    bearer_token VARCHAR(256),
    refresh_token VARCHAR(256),
    constraint fk_users_login
        foreign key (user_id)
        REFERENCES users (user_id),
    PRIMARY KEY (user_id)
);
