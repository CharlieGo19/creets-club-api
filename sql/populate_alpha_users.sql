INSERT INTO users (disc_name) VALUES 
    ('Uriah#6969'),
    ('Don Hector#3191'),
    ('CharlieGo_#7848'),
    ('Deejay#0076'),
    ('bugbytes#0817'),
    ('Healthycheekums#3639'),
    ('holdAdoor#0420'),
    ('Lucky#0094'),
    ('jake993#7361'),
    ('DPAK#7421'),
    ('Exatorian#6106'),
    ('HANGRY#4463'),
    ('kozzy#4496'),
    ('Leemonade#2628'),
    ('DM | Crypto Pandas#9698'),
    ('Rivertrash#9211'),
    ('Ruggy#1234'),
    ('Zakarum#3129'),
    ('WarlockNKey#1337');

INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Uriah#6969';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Don Hector#3191';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'CharlieGo_#7848';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Deejay#0076';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'bugbytes#0817';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Healthycheekums#3639';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'holdAdoor#0420';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'jake993#7361';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'DPAK#7421';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Exatorian#6106';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'HANGRY#4463';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'kozzy#4496';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Leemonade#2628';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'DM | Crypto Pandas#9698';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Rivertrash#9211';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Ruggy#1234';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'Zakarum#3129';
INSERT INTO game_user_info (user_id) SELECT user_id FROM users WHERE disc_name = 'WarlockNKey#1337';
