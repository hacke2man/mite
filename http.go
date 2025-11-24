package main

import (
	"time"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/compress"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/static"
)

func setupHttp() *fiber.App {
	app := fiber.New()
	app.Use(cors.New())
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestCompression,
	}))

	app.Get("/*", static.New("./static", static.Config{
		CacheDuration: time.Second * 60 * 60 * 24,
	}))
	return app
}
