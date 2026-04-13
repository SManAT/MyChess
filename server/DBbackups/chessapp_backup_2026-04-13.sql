-- SQLite Database Dump
-- Generated: 2026-04-13T10:36:38.267Z
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Drop table if exists
DROP TABLE IF EXISTS "users";

-- Create table structure
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, online INTEGER NOT NULL DEFAULT 0 CHECK (online IN (0, 1)), created_at DATETIME DEFAULT CURRENT_TIMESTAMP);

-- Insert data for users
INSERT INTO "users" VALUES('1','alice_smith','hashed_pw_1','1','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('2','bob_jones','hashed_pw_2','0','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('3','charlie_brown','hashed_pw_3','1','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('4','diana_wilson','hashed_pw_4','0','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('5','edward_davis','hashed_pw_5','1','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('6','fiona_miller','hashed_pw_6','0','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('7','george_taylor','hashed_pw_7','1','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('8','helen_anderson','hashed_pw_8','0','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('9','ivan_thomas','hashed_pw_9','1','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('10','julia_martin','hashed_pw_10','0','2026-04-13 10:36:02');
INSERT INTO "users" VALUES('11','hans.moser','hashed_pw_10','1','2026-04-13 10:36:02');

-- Drop table if exists
DROP TABLE IF EXISTS "games";

-- Create table structure
CREATE TABLE games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      player1_inGame INTEGER NOT NULL DEFAULT 0 CHECK (closed IN (0, 1)),
      player2_inGame INTEGER NOT NULL DEFAULT 0 CHECK (closed IN (0, 1)),
      closed INTEGER NOT NULL DEFAULT 0 CHECK (closed IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- No data in games

COMMIT;
