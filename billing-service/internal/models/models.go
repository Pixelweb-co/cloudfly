package models

import (
	"fmt"
	"time"
)

type CustomTime struct {
	time.Time
}

func (ct *CustomTime) UnmarshalJSON(b []byte) error {
	s := string(b)
	if len(s) >= 2 && s[0] == '"' && s[len(s)-1] == '"' {
		s = s[1 : len(s)-1]
	}
	if s == "" || s == "null" {
		ct.Time = time.Time{}
		return nil
	}

	// Try parsing standard RFC3339
	t, err := time.Parse(time.RFC3339, s)
	if err == nil {
		ct.Time = t
		return nil
	}

	// Try parsing ISO local datetime format "2006-01-02T15:04:05"
	t, err = time.Parse("2006-01-02T15:04:05", s)
	if err == nil {
		ct.Time = t
		return nil
	}

	// Try parsing YYYY-MM-DD
	t, err = time.Parse("2006-01-02", s)
	if err == nil {
		ct.Time = t
		return nil
	}

	return err
}

func (ct CustomTime) MarshalJSON() ([]byte, error) {
	if ct.Time.IsZero() {
		return []byte("null"), nil
	}
	return []byte(fmt.Sprintf(`"%s"`, ct.Time.Format("2006-01-02T15:04:05"))), nil
}

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
	ID                 int64      `json:"id"`
	TenantID           int64      `json:"tenantId"`
	SubscriptionID     int64      `json:"subscriptionId"`
	InvoiceNumber      string     `json:"invoiceNumber"`
	IssueDate          CustomTime `json:"issueDate"`
	DueDate            CustomTime `json:"dueDate"`
	Status             string     `json:"status"`
	Subtotal           float64    `json:"subtotal"`
	Tax                float64    `json:"tax"`
	Total              float64    `json:"total"`
	Currency           string     `json:"currency"`
	PDFUrl             string     `json:"pdfUrl"`
	BillingPeriodStart CustomTime `json:"billingPeriodStart"`
	BillingPeriodEnd   CustomTime `json:"billingPeriodEnd"`
	BillingType        string     `json:"billingType"`
	BillingPeriod      string     `json:"billingPeriod"`
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
	ID              int64      `json:"id"`
	PlanID          int64      `json:"planId"`
	TenantID        int64      `json:"customerId"`
	Status          string     `json:"status"`
	BillingCycle    string     `json:"billingCycle"`
	MonthlyPrice    float64    `json:"monthlyPrice"`
	TrialEndsAt     CustomTime `json:"trialEndsAt"`
	NextBillingDate CustomTime `json:"nextBillingDate"`
}

type Plan struct {
	ID                 int64   `json:"id"`
	Name               string  `json:"name"`
	Price              float64 `json:"price"`
	SemiannualDiscount float64 `json:"semiannualDiscount"`
	AnnualDiscount     float64 `json:"annualDiscount"`
}
