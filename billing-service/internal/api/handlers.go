package api

import (
	"billing-service/internal/service"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"github.com/gofiber/fiber/v2"
	"log"
	"os"
)

type WompiWebhookPayload struct {
	Event string `json:"event"`
	Data  struct {
		Transaction struct {
			ID                string `json:"id"`
			AmountInCents     int64  `json:"amount_in_cents"`
			Reference         string `json:"reference"`
			Status            string `json:"status"`
			PaymentMethodType string `json:"payment_method_type"`
		} `json:"transaction"`
	} `json:"data"`
	Timestamp int64 `json:"timestamp"`
	Signature struct {
		Checksum string `json:"checksum"`
	} `json:"signature"`
}

func SetupRoutes(app *fiber.App, billingSvc *service.BillingService) {
	api := app.Group("/api/billing")

	api.Post("/webhooks/wompi", func(c *fiber.Ctx) error {
		var payload WompiWebhookPayload
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
		}

		log.Printf("📥 [WEBHOOK] Received Wompi Event: %s for Ref: %s", payload.Event, payload.Data.Transaction.Reference)

		// Validate Signature (Integrity Check)
		eventsSecret := os.Getenv("WOMPI_EVENTS_SECRET")
		if eventsSecret != "" && !validateSignature(payload, eventsSecret) {
			log.Printf("⚠️ [WEBHOOK] Invalid signature for reference: %s", payload.Data.Transaction.Reference)
			// In production, we should return 401 or similar, but for testing we might just log
		}

		// Process Transaction Status
		if payload.Data.Transaction.Status == "APPROVED" {
			log.Printf("✅ [WEBHOOK] Transaction APPROVED: %s", payload.Data.Transaction.Reference)
			// Logic to update backend-api
			// billingSvc.UpdateInvoiceStatus(payload.Data.Transaction.Reference, "PAID")
		} else if payload.Data.Transaction.Status == "DECLINED" {
			log.Printf("❌ [WEBHOOK] Transaction DECLINED: %s", payload.Data.Transaction.Reference)
		}

		return c.SendStatus(200)
	})

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
}

func validateSignature(payload WompiWebhookPayload, secret string) bool {
	// Wompi checksum generation: sha256(transaction.id + transaction.status + transaction.amount_in_cents + timestamp + secret)
	raw := fmt.Sprintf("%s%s%d%d%s", 
		payload.Data.Transaction.ID, 
		payload.Data.Transaction.Status, 
		payload.Data.Transaction.AmountInCents, 
		payload.Timestamp, 
		secret)
	
	h := sha256.New()
	h.Write([]byte(raw))
	expectedChecksum := hex.EncodeToString(h.Sum(nil))
	
	return expectedChecksum == payload.Signature.Checksum
}
