package main

import (
	"billing-service/internal/api"
	"billing-service/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"log"
	"os"
)

func main() {
	app := fiber.New()
	app.Use(logger.New())

	billingSvc := service.NewBillingService()

	// Setup Routes
	api.SetupRoutes(app, billingSvc)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Billing Service starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
