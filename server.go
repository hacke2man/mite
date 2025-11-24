package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/gofiber/fiber/v3"
	"github.com/matthewhartstonge/argon2"
	_ "github.com/mattn/go-sqlite3"
)

type Action struct {
	SessionId string `json:"session_id"`
	ActionBody string `json:"action_body"`
}

type Task struct {
	Id int `json:"id"`
	Label string `json:"label"`
	LastDone int `json:"last_done"`
	Break string `json:"break"`
	Due int `json:"due"`
	Type int `json:"type"`
	Done bool `json:"done"`
}

func main() {
	dbpath := "./mite.db"
	for i := 0; i < len(os.Args); i++ {
		arg := os.Args[i]
		if arg == "db" && len(os.Args) > i+1 {
			dbpath = os.Args[i+1];
			i += 1
		}
	}
	app := setupHttp()
	db := setupDb(dbpath)
	defer db.Close()

	argon := argon2.DefaultConfig()
	for i := 0; i < len(os.Args); i++ {
		arg := os.Args[i]
		if arg == "newuser" && len(os.Args) > i + 2 {
			encoded, err := argon.HashEncoded([]byte(os.Args[i+2]))
			if err != nil { panic(err) }

			_, err = db.Exec(`
				INSERT INTO users (name, passwordhash, active)
				VALUES ('`+os.Args[i+1]+`', '`+string(encoded)+`', TRUE)
			`);
			if err != nil { panic(err); }

			i += 2
		}
	}

	sessionIds := map[string]int{}
	fileIds, err := os.ReadFile("sessionids")
	if err == nil { json.Unmarshal(fileIds, &sessionIds) }
	getUserFromUUID, err := db.Prepare(`
		SELECT user_id FROM sessions
		WHERE (uuid = ?);
	`)
	hasId := func(uuid string) (bool, int) {
		id, ok := sessionIds[uuid]
		if !ok {
			query, err := getUserFromUUID.Query(uuid)
			if err != nil { panic(err) }
			defer query.Close()

			var id int
			if !query.Next() { return false, -1 }

			err = query.Scan(&id);
			if err != nil { panic(err) }

			sessionIds[uuid] = id
			if ok {
				return ok, id
			} else {
				return ok, -1
			}
		}
		return ok, id
	}

	insertTask, err := db.Prepare(`
		INSERT INTO tasks(label, last_done, break, due, type, done, user_id)
		VALUES(?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil { panic(err) }
	defer insertTask.Close()
	app.Post("/add_task", func (c fiber.Ctx) error {
		bodydata := c.Body()

		var action Action
		err := json.Unmarshal(bodydata, &action)
		if err != nil { panic(err) }
		ok, id := hasId(action.SessionId)
		if !ok { return c.SendString("0") }

		var task Task
		err = json.Unmarshal([]byte(action.ActionBody), &task)
		if err != nil { panic(err) }

		res, err := insertTask.Exec(
			task.Label,
			task.LastDone,
			task.Break,
			task.Due,
			task.Type,
			task.Done,
			id,
		)
		if err != nil { panic(err) }

		taskid, err := res.LastInsertId()

		return c.SendString(fmt.Sprintf("%d", taskid))
	})

	dbGetItems, err := db.Prepare(`
		SELECT id, label, last_done, break, due, type, done
		FROM tasks WHERE (user_id = ?)
	`)
	if err != nil { panic(err) }
	defer dbGetItems.Close()
	app.Post("/items", func (c fiber.Ctx) error {
		bodydata := c.Body()

		var action Action
		err := json.Unmarshal(bodydata, &action)
		if err != nil { panic(err) }
		ok, userid := hasId(action.SessionId)
		if !ok { return c.SendString("0") }

		items, err := dbGetItems.Query(userid);
		if err != nil { panic(err) }
		tasks := []Task{}
		for items.Next() {
			newTask := Task{}
			items.Scan(
				&newTask.Id,
				&newTask.Label,
				&newTask.LastDone,
				&newTask.Break,
				&newTask.Due,
				&newTask.Type,
				&newTask.Done,
			)
			tasks = append(tasks, newTask)
		}
		data, err := json.Marshal(tasks)
		if err != nil { panic(err) }
		c.Set("Content-Type", "application/json")

		return c.SendString(string(data))
	})

	dbDeleteTask, err := db.Prepare(`
		DELETE FROM tasks
		WHERE id = ? AND user_id = ?;
	`)
	if err != nil { panic(err) }
	defer dbDeleteTask.Close()
	app.Post("/delete_task", func (c fiber.Ctx) error {
		bodydata := c.Body()

		var action Action
		err := json.Unmarshal(bodydata, &action)
		if err != nil { panic(err) }
		ok, userid := hasId(action.SessionId)
		if !ok { return c.SendString("0") }

		var task Task
		err = json.Unmarshal([]byte(action.ActionBody), &task)
		if err != nil { panic(err) }

		dbDeleteTask.Exec(task.Id, userid);
		return c.SendString("1");
	})

	dbUpdateTask, err := db.Prepare(`
		UPDATE tasks
		SET label = ?, last_done = ?, break = ?, due = ?, type = ?, done = ?
		WHERE id = ? AND user_id = ?;
	`)
	if err != nil { panic(err) }
	defer dbUpdateTask.Close()
	app.Post("/update_task", func (c fiber.Ctx) error {
		bodydata := c.Body()

		var action Action
		err := json.Unmarshal(bodydata, &action)
		if err != nil { panic(err) }
		ok, userid := hasId(action.SessionId)
		if !ok { return c.SendString("0") }

		var task Task
		err = json.Unmarshal([]byte(action.ActionBody), &task)
		if err != nil { panic(err) }
		dbUpdateTask.Exec(
			task.Label,
			task.LastDone,
			task.Break,
			task.Due,
			task.Type,
			task.Done,
			task.Id,
			userid,
		);
		return c.SendString("1");
	})

	setupIndex(app)
	idOfUser, err := db.Prepare(`
		SELECT id, passwordhash
		FROM users WHERE (name = ?)
	`);
	if err != nil { panic(err) }
	type Login struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	app.Post("/login", func(c fiber.Ctx) error {
		bodydata := c.Body()

		var login Login
		err := json.Unmarshal(bodydata, &login);
		if err != nil { panic(err) }

		userQuery, err := idOfUser.Query(login.Username);
		if err != nil { panic(err) }
		defer userQuery.Close()

		if !userQuery.Next() { return c.SendString("0") }
		var userId int
		var hash string
		userQuery.Scan(&userId, &hash);

		ok, err := argon2.VerifyEncoded([]byte(login.Password), []byte(hash))
		if err != nil { panic(err) }

		if ok {
			id := uuid.New()
			sessionId := id.String()
			sessionIds[sessionId] = userId;
			data, err := json.Marshal(sessionIds);
			if err != nil { panic(err) }
			err = os.WriteFile("sessionids", data, 0644)
			return c.SendString(sessionId)
		} else {
			return c.SendString("0")
		}
	})

	host := os.Getenv("HOST")
	if len(host) == 0 {
		host = ":8080"
	}
	if err := app.Listen(host); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
