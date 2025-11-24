package main
import (
	"fmt"
	"crypto/sha256"
	"time"
	"os"
	"strings"
	"github.com/gofiber/fiber/v3"
)

func setupIndex(app *fiber.App) string {
	indexData, err := os.ReadFile("./template/index.html")
	if err != nil {panic(err)}
	tmpl := string(indexData)

	jsedata, err := os.ReadFile("./template/jse.min.js")
	if err != nil {panic(err)}
	tmpl = strings.ReplaceAll(tmpl, "{{.Jse}}", string(jsedata))

	cssdata, err := os.ReadFile("./template/app.css")
	if err != nil {panic(err)}
	tmpl = strings.ReplaceAll(tmpl, "{{.CSS}}", string(cssdata))

	names, err := os.ReadDir("./template/components")
	if err != nil { panic(err) }
	var compsdata []byte
	for _, name := range names {
		file, err := os.ReadFile("./template/components/" + name.Name())
		if err != nil { panic(err) }
		compsdata = append(compsdata, file...)
	}
	tmpl = strings.ReplaceAll(tmpl, "{{.Comps}}", string(compsdata))

	utildata, err := os.ReadFile("./template/util.js")
	if err != nil {panic(err)}
	tmpl = strings.ReplaceAll(tmpl, "{{.Util}}", string(utildata))

	// minifier := setupMinifier()
	defaultPage := func (c fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		hash := sha256.Sum256([]byte(tmpl))
		etag := fmt.Sprintf(`"%x"`, hash[:8])
		if clientETag := c.Get("If-None-Match"); clientETag == etag {
			return c.SendStatus(304) // Not Modified
		}
		c.Set("ETag", etag)
		// c.Set("Cache-Control", "max-age="+strconv.Itoa(60*24*7));
		c.Set("Expires", "max-age="+time.Now().Add(24*7*time.Hour).Format(time.RFC1123))
		path := c.Path();
		if path == "/" { path = "/home" }
		pageData, err := os.ReadFile("./static/pages/"+path+".html")
		if err != nil {c.Next()}
		page := strings.ReplaceAll(tmpl, "{{.Page}}", string(pageData))
		// page, err = minifier.String("text/html",page)
		return c.SendString(page)
	}
	app.Get("/", defaultPage)
	app.Get("/*", defaultPage)
	app.Get("/home", defaultPage)

	return tmpl
}
