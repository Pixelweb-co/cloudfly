package service

import (
	"billing-service/internal/kafka"
	"billing-service/internal/models"
	"billing-service/pkg/pdf"
	"billing-service/pkg/wompi"
	"fmt"

	"github.com/go-resty/resty/v2"
	"log"
	"os"
)

type BillingService struct {
	client      *resty.Client
	wompiClient *wompi.Client
	apiURL      string
}

func NewBillingService() *BillingService {
	url := os.Getenv("BACKEND_API_URL")
	if url == "" {
		url = "http://backend-api:8080/internal/billing"
	}
	return &BillingService{
		client:      resty.New(),
		wompiClient: wompi.NewClient(),
		apiURL:      url,
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
		Status:             "PENDIENTE",
		Total:              89000, // Placeholder, should get from Plan
		Currency:           "COP",
		BillingPeriodStart: sub.NextBillingDate,
		BillingPeriodEnd:   sub.NextBillingDate.AddDate(0, 1, 0),
	}

	var savedInvoice models.Invoice
	resp, err := s.client.R().
		SetBody(invoice).
		SetResult(&savedInvoice).
		Post(fmt.Sprintf("%s/invoices/generate-subscription", s.apiURL))

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
		SetQueryParam("pdfUrl", pdfPath).
		Put(fmt.Sprintf("%s/invoices/%d/pdf", s.apiURL, savedInvoice.ID))

	// 4. Publish Kafka Event
	name, email, phone, _ := s.GetTenantContact(sub.TenantID)
	kafka.PublishInvoiceEmail(kafka.NotificationEvent{
		TenantID:      savedInvoice.TenantID,
		InvoiceID:     savedInvoice.ID,
		CustomerEmail: email,
		CustomerPhone: phone,
		CustomerName:  name,
		InvoiceNumber: savedInvoice.InvoiceNumber,
		PDFUrl:        savedInvoice.PDFUrl,
		Amount:        savedInvoice.Total,
		Currency:      savedInvoice.Currency,
		DueDate:       savedInvoice.DueDate.Format("2006-01-02"),
		Template:      "invoice-template-v1",
	})

	return nil
}

func (s *BillingService) ExecuteEvent(eventID int64, eventType string, tenantID int64, subscriptionID int64, payload string) error {
	log.Printf("🚀 [WORKFLOW] Executing Event %d: %s for Tenant %d", eventID, eventType, tenantID)

	switch eventType {
	case "GENERATE_INVOICE":
		// Logic to fetch subscription and generate invoice
		var sub models.Subscription
		resp, err := s.client.R().
			SetResult(&sub).
			Get(fmt.Sprintf("%s/subscriptions/%d", s.apiURL, subscriptionID))
		if err != nil || resp.IsError() {
			return fmt.Errorf("failed to fetch subscription: %v", err)
		}
		return s.ProcessRenewal(sub)

	case "AUTO_CHARGE":
		return s.AutoCharge(tenantID, subscriptionID)

	case "PRE_DUE_NOTIFICATION":
		// Publish notification event
		return nil // To be implemented

	default:
		return fmt.Errorf("unknown event type: %s", eventType)
	}
}

func (s *BillingService) AutoCharge(tenantID int64, subscriptionID int64) error {
	log.Printf("💳 [AUTO-CHARGE] Starting charge for Tenant %d", tenantID)

	// 1. Get Default Payment Method
	var pm models.PaymentMethod
	resp, err := s.client.R().
		SetResult(&pm).
		Get(fmt.Sprintf("%s/payment-methods/default?tenantId=%d", s.apiURL, tenantID))
	if err != nil || resp.IsError() {
		return fmt.Errorf("failed to fetch payment method: %v", err)
	}

	// 2. Get Last Open Invoice
	var invoices []models.Invoice
	resp, err = s.client.R().
		SetResult(&invoices).
		Get(fmt.Sprintf("%s/invoices?tenantId=%d&status=PENDIENTE", s.apiURL, tenantID))
	if err != nil || resp.IsError() || len(invoices) == 0 {
		return fmt.Errorf("no open invoices found for auto-charge")
	}
	invoice := invoices[0]

	// 3. Execute Wompi Charge
	amountInCents := int64(invoice.Total * 100)
	txID, status, err := s.wompiClient.CreateRecurringTransaction(
		amountInCents,
		invoice.Currency,
		"admin@empresa.com", // Placeholder
		pm.PaymentSourceID,
		invoice.InvoiceNumber,
	)
	if err != nil {
		return fmt.Errorf("wompi transaction failed: %v", err)
	}

	// 4. Record Transaction in Backend
	transaction := models.PaymentTransaction{
		TenantID:        tenantID,
		InvoiceID:       invoice.ID,
		TransactionID:   txID,
		Amount:          invoice.Total,
		Status:          status,
		Provider:        "WOMPI",
		PaymentMethodID: pm.ID,
	}
	s.client.R().SetBody(transaction).Post(fmt.Sprintf("%s/payment-transactions", s.apiURL))

	if status == "APPROVED" {
		s.UpdateInvoiceStatus(invoice.InvoiceNumber, "PAGADA")
	}

	return nil
}

func (s *BillingService) GetTenantContact(tenantID int64) (string, string, string, error) {
	resp, err := s.client.R().
		Get(fmt.Sprintf("%s/tenants/%d", s.apiURL, tenantID))
	if err != nil || resp.IsError() {
		return "", "", "", fmt.Errorf("failed to fetch tenant info")
	}

	var tenant struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	err = json.Unmarshal(resp.Body(), &tenant)
	return tenant.Name, tenant.Email, tenant.Phone, err
}

func (s *BillingService) CreatePaymentSource(req models.PaymentMethod) (string, error) {
	log.Printf("💳 [WOMPI] Creating payment source for Tenant %d", req.TenantID)
	// We use the token provided by the frontend
	sourceID, err := s.wompiClient.CreatePaymentSource(req.Token, "admin@cloudfly.com.co")
	if err != nil {
		return "", err
	}
	return sourceID, nil
}

func (s *BillingService) UpdateInvoiceStatus(reference string, status string) error {

	log.Printf("Updating invoice %s to status %s", reference, status)
	// reference is like INV-tenantId-subscriptionId, we need to find the invoice ID or use reference endpoint
	// For now, assuming an endpoint in backend-api exists to update by reference
	_, err := s.client.R().
		SetQueryParam("status", status).
		Put(fmt.Sprintf("%s/invoices/by-reference/%s", s.apiURL, reference))
	
	return err
}
