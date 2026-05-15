package service

import (
	"billing-service/internal/kafka"
	"billing-service/internal/models"
	"billing-service/pkg/pdf"
	"fmt"
	"github.com/go-resty/resty/v2"
	"log"
	"os"
)

type BillingService struct {
	client *resty.Client
	apiURL string
}

func NewBillingService() *BillingService {
	url := os.Getenv("BACKEND_API_URL")
	if url == "" {
		url = "http://backend-api:8080/internal/billing"
	}
	return &BillingService{
		client: resty.New(),
		apiURL: url,
	}
}

func (s *BillingService) ProcessRenewal(sub models.Subscription) error {
	log.Printf("Processing renewal for subscription %d", sub.ID)

	// 1. Generate Invoice Record in Backend
	invoice := models.Invoice{
		TenantID:           sub.TenantID,
		SubscriptionID:     sub.ID,
		InvoiceNumber:      fmt.Sprintf("INV-%d-%d", sub.TenantID, sub.ID),
		IssueDate:          sub.NextBillingDate,
		DueDate:            sub.NextBillingDate.AddDate(0, 0, 5),
		Status:             "OPEN",
		Total:              89000, // Placeholder, should get from Plan
		Currency:           "COP",
		BillingPeriodStart: sub.NextBillingDate,
		BillingPeriodEnd:   sub.NextBillingDate.AddDate(0, 1, 0),
	}

	var savedInvoice models.Invoice
	resp, err := s.client.R().
		SetBody(invoice).
		SetResult(&savedInvoice).
		Post(fmt.Sprintf("%s/invoices/generate", s.apiURL))

	if err != nil || resp.IsError() {
		return fmt.Errorf("failed to generate invoice: %v", err)
	}

	// 2. Generate PDF
	pdfPath, err := pdf.GenerateInvoicePDF(savedInvoice, "Empresa del Cliente")
	if err != nil {
		return fmt.Errorf("failed to generate PDF: %v", err)
	}

	// 3. Notify Backend with PDF URL
	savedInvoice.PDFUrl = pdfPath
	s.client.R().
		SetBody(savedInvoice).
		Post(fmt.Sprintf("%s/invoices/generate", s.apiURL))

	// 4. Publish Kafka Event
	kafka.PublishInvoiceEmail(kafka.NotificationEvent{
		TenantID:      savedInvoice.TenantID,
		InvoiceID:     savedInvoice.ID,
		CustomerEmail: "admin@cliente.com", // Should get from Tenant
		CustomerName:  "Empresa del Cliente",
		InvoiceNumber: savedInvoice.InvoiceNumber,
		PDFUrl:        savedInvoice.PDFUrl,
		Amount:        savedInvoice.Total,
		Currency:      savedInvoice.Currency,
		DueDate:       savedInvoice.DueDate.Format("2006-01-02"),
		Template:      "invoice-template-v1",
	})

	return nil
}
