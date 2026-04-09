-- SQLite Database Dump
-- Generated: 2026-04-09T08:14:34.126Z
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Drop table if exists
DROP TABLE IF EXISTS "users";

-- Create table structure
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, online INTEGER NOT NULL DEFAULT 0 CHECK (online IN (0, 1)), created_at DATETIME DEFAULT CURRENT_TIMESTAMP);

-- Insert data for users
INSERT INTO "users" VALUES('1','hans.moser','2342','1','2026-04-06 10:38:27');
INSERT INTO "users" VALUES('2','paul','234','0','2026-04-06 10:38:45');
INSERT INTO "users" VALUES('3','getrude.mose','123','0','2026-04-06 10:39:08');
INSERT INTO "users" VALUES('4','alice_smith','hashed_pw_1','1','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('5','bob_jones','hashed_pw_2','0','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('6','charlie_brown','hashed_pw_3','1','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('7','diana_wilson','hashed_pw_4','0','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('8','edward_davis','hashed_pw_5','1','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('9','fiona_miller','hashed_pw_6','0','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('10','george_taylor','hashed_pw_7','1','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('11','helen_anderson','hashed_pw_8','0','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('12','ivan_thomas','hashed_pw_9','1','2026-04-06 10:40:35');
INSERT INTO "users" VALUES('13','julia_martin','hashed_pw_10','0','2026-04-06 10:40:35');

-- Drop table if exists
DROP TABLE IF EXISTS "games";

-- Create table structure
CREATE TABLE games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      number_of_players INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      opponent INTEGER NOT NULL,
      closed INTEGER NOT NULL DEFAULT 0 CHECK (closed IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- Insert data for games
INSERT INTO "games" VALUES('1','TEST','2','1','4','0','2026-04-07 19:02:27.223');
INSERT INTO "games" VALUES('2','TEST (1)','2','1','4','0','2026-04-07 19:03:01.371');

COMMIT;
