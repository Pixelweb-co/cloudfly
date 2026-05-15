package api

import (
	"billing-service/internal/service"
	"github.com/gofiber/fiber/v2"
	"log"
)

func SetupRoutes(app *fiber.App, billingSvc *service.BillingService) {
	api := app.Group("/api/billing")

	api.Post("/webhooks/wompi", func(c *fiber.Ctx) error {
		log.Println("Received Wompi Webhook")
		// Process webhook logic
		return c.SendStatus(200)
	})

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
}
