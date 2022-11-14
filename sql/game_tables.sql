CREATE TABLE IF NOT EXISTS game_user_info (
    user_id INT NOT NULL UNIQUE,
    in_game BOOLEAN NOT NULL DEFAULT false,
    conn_id VARCHAR(20) UNIQUE,
    board_id VARCHAR(36),
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    constraint fk_game_user_info
        foreign key (user_id)
        REFERENCES users (user_id),
    PRIMARY KEY (user_id)
)

-- Create table for CREET stats - awaiting structure.