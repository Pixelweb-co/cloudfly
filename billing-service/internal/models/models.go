package models

import "time"

type PaymentMethod struct {
	ID              int64     `json:"id"`
	TenantID        int64     `json:"tenantId"`
	Provider        string    `json:"provider"`
	PaymentSourceID string    `json:"paymentSourceId"`
	Token           string    `json:"token"`
	Brand           string    `json:"brand"`
	Last4           string    `json:"last4"`
	ExpMonth        int       `json:"expMonth"`
	ExpYear         int       `json:"expYear"`
	IsDefault       bool      `json:"isDefault"`
}

type Invoice struct {
	ID                 int64     `json:"id"`
	TenantID           int64     `json:"tenantId"`
	SubscriptionID     int64     `json:"subscriptionId"`
	InvoiceNumber      string    `json:"invoiceNumber"`
	IssueDate          time.Time `json:"issueDate"`
	DueDate            time.Time `json:"dueDate"`
	Status             string    `json:"status"`
	Subtotal           float64   `json:"subtotal"`
	Tax                float64   `json:"tax"`
	Total              float64   `json:"total"`
	Currency           string    `json:"currency"`
	PDFUrl             string    `json:"pdfUrl"`
	BillingPeriodStart time.Time `json:"billingPeriodStart"`
	BillingPeriodEnd   time.Time `json:"billingPeriodEnd"`
}

type PaymentTransaction struct {
	ID              int64     `json:"id"`
	TenantID        int64     `json:"tenantId"`
	InvoiceID       int64     `json:"invoiceId"`
	TransactionID   string    `json:"transactionId"`
	Amount          float64   `json:"amount"`
	Status          string    `json:"status"`
	Provider        string    `json:"provider"`
	PaymentMethodID int64     `json:"paymentMethodId"`
	ResponsePayload string    `json:"responsePayload"`
}

type Subscription struct {
	ID               int64     `json:"id"`
	PlanID           int64     `json:"planId"`
	TenantID         int64     `json:"tenantId"`
	Status           string    `json:"status"`
	BillingCycle     string    `json:"billingCycle"`
	MonthlyPrice     float64   `json:"monthlyPrice"`
	TrialEndsAt      time.Time `json:"trialEndsAt"`
	NextBillingDate  time.Time `json:"nextBillingDate"`
}

type Plan struct {
	ID                 int64     `json:"id"`
	Name               string    `json:"name"`
	Price              float64   `json:"price"`
	SemiannualDiscount float64   `json:"semiannualDiscount"`
	AnnualDiscount     float64   `json:"annualDiscount"`
}
