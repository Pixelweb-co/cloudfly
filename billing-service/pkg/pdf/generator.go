package pdf

import (
	"fmt"
	"billing-service/internal/models"
	"github.com/jung-kurt/gofpdf"
	"os"
)

func GenerateInvoicePDF(invoice models.Invoice, companyName string) (string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	
	// Logo placeholder (simulated with text for now)
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "CloudFly AI")
	pdf.Ln(12)
	
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "FACTURA DE VENTA")
	pdf.Ln(10)
	
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 10, fmt.Sprintf("Número: %s", invoice.InvoiceNumber))
	pdf.Ln(5)
	pdf.Cell(40, 10, fmt.Sprintf("Fecha: %s", invoice.IssueDate.Format("2006-01-02")))
	pdf.Ln(5)
	pdf.Cell(40, 10, fmt.Sprintf("Vencimiento: %s", invoice.DueDate.Format("2006-01-02")))
	pdf.Ln(10)
	
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(40, 10, "Facturado a:")
	pdf.Ln(5)
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 10, companyName)
	pdf.Ln(15)
	
	// Table Header
	pdf.SetFillColor(240, 240, 240)
	pdf.CellFormat(100, 7, "Descripción", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 7, "Cant.", "1", 0, "C", true, 0, "")
	pdf.CellFormat(60, 7, "Total", "1", 0, "C", true, 0, "")
	pdf.Ln(7)
	
	// Items (Suscripción)
	pdf.CellFormat(100, 7, fmt.Sprintf("Suscripción CloudFly - Periodo %s a %s", 
		invoice.BillingPeriodStart.Format("2006-01-02"), 
		invoice.BillingPeriodEnd.Format("2006-01-02")), "1", 0, "L", false, 0, "")
	pdf.CellFormat(30, 7, "1", "1", 0, "C", false, 0, "")
	pdf.CellFormat(60, 7, fmt.Sprintf("%.2f %s", invoice.Subtotal, invoice.Currency), "1", 0, "R", false, 0, "")
	pdf.Ln(7)
	
	// Totals
	pdf.Ln(5)
	pdf.SetX(140)
	pdf.Cell(30, 7, "Subtotal:")
	pdf.Cell(30, 7, fmt.Sprintf("%.2f", invoice.Subtotal))
	pdf.Ln(7)
	pdf.SetX(140)
	pdf.Cell(30, 7, "IVA (19%):")
	pdf.Cell(30, 7, fmt.Sprintf("%.2f", invoice.Tax))
	pdf.Ln(7)
	pdf.SetX(140)
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(30, 7, "TOTAL:")
	pdf.Cell(30, 7, fmt.Sprintf("%.2f %s", invoice.Total, invoice.Currency))
	
	// Ensure directory exists
	os.MkdirAll("uploads/invoices", 0755)
	
	filePath := fmt.Sprintf("uploads/invoices/%s.pdf", invoice.InvoiceNumber)
	err := pdf.OutputFileAndClose(filePath)
	if err != nil {
		return "", err
	}
	
	return filePath, nil
}
