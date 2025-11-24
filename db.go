package main

import (
	"database/sql"
	"log"
)

func setupDb(dbpath string) *sql.DB {
	db, err := sql.Open("sqlite3", dbpath)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY,
			label TEXT,
			type INTEGER,
			last_done BIGINT,
			break TEXT,
			due BIGINT,
			user_id INTEGER,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE,
			passwordhash TEXT,
			active BOOLEAN
		);
		CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			uuid TEXT,
			user_id INTEGER,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);
	`)
	if err != nil { panic(err) }
	return db
}
