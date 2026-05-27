package kafka

import (
	"context"
	"encoding/json"
	"github.com/segmentio/kafka-go"
	"log"
	"os"
)

type NotificationEvent struct {
	TenantID      int64   `json:"tenantId"`
	InvoiceID     int64   `json:"invoiceId"`
	CustomerEmail string  `json:"customerEmail"`
	CustomerPhone string  `json:"customerPhone"`
	CustomerName  string  `json:"customerName"`
	InvoiceNumber string  `json:"invoiceNumber"`
	PDFUrl        string  `json:"pdfUrl"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	DueDate       string  `json:"dueDate"`
	Template      string  `json:"template"`
}

func PublishInvoiceEmail(event NotificationEvent) error {
	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		broker = "kafka:9092"
	}

	writer := &kafka.Writer{
		Addr:     kafka.TCP(broker),
		Topic:    "billing.invoice.email",
		Balancer: &kafka.LeastBytes{},
	}
	defer writer.Close()

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	err = writer.WriteMessages(context.Background(),
		kafka.Message{
			Value: payload,
		},
	)

	if err != nil {
		log.Printf("Failed to publish to Kafka: %v", err)
		return err
	}

	log.Printf("Published invoice email event for invoice %s", event.InvoiceNumber)
	return nil
}
