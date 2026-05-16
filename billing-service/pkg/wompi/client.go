package wompi

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"os"
)

type Client struct {
	restClient *resty.Client
	publicKey  string
	privateKey string
}

func NewClient() *Client {
	return &Client{
		restClient: resty.New().SetBaseURL("https://production.wompi.co/v1"), // O sandbox.wompi.co
		publicKey:  os.Getenv("WOMPI_PUBLIC_KEY"),
		privateKey: os.Getenv("WOMPI_PRIVATE_KEY"),
	}
}

type PaymentSourceResponse struct {
	Data struct {
		ID int64 `json:"id"`
	} `json:"data"`
}

func (c *Client) CreatePaymentSource(token string, customerEmail string) (string, error) {
	resp, err := c.restClient.R().
		SetHeader("Authorization", "Bearer "+c.privateKey).
		SetBody(map[string]interface{}{
			"type":           "CARD",
			"token":          token,
			"customer_email": customerEmail,
			"acceptance_token": os.Getenv("WOMPI_ACCEPTANCE_TOKEN"),
		}).
		SetResult(&PaymentSourceResponse{}).
		Post("/payment_sources")

	if err != nil {
		return "", err
	}

	if resp.IsError() {
		return "", fmt.Errorf("wompi error: %s", resp.String())
	}

	result := resp.Result().(*PaymentSourceResponse)
	return fmt.Sprintf("%d", result.Data.ID), nil
}

type TransactionResponse struct {
	Data struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	} `json:"data"`
}

func (c *Client) CreateRecurringTransaction(amountInCents int64, currency string, customerEmail string, paymentSourceID string, reference string) (string, string, error) {
	resp, err := c.restClient.R().
		SetHeader("Authorization", "Bearer "+c.privateKey).
		SetBody(map[string]interface{}{
			"amount_in_cents": amountInCents,
			"currency":        currency,
			"customer_email":  customerEmail,
			"payment_source_id": paymentSourceID,
			"reference":       reference,
			"payment_link_id": nil,
		}).
		SetResult(&TransactionResponse{}).
		Post("/transactions")

	if err != nil {
		return "", "", err
	}

	if resp.IsError() {
		return "", "", fmt.Errorf("wompi error: %s", resp.String())
	}

	result := resp.Result().(*TransactionResponse)
	return result.Data.ID, result.Data.Status, nil
}
