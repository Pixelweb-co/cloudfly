package pdf

import (
	"fmt"
	"billing-service/internal/models"
	"github.com/jung-kurt/gofpdf"
	"os"
)

func GenerateInvoicePDF(invoice models.Invoice, companyName string) (string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()
	
	// --- Header ---
	// Background color for header
	pdf.SetFillColor(43, 108, 176) // Sleek Blue
	pdf.Rect(0, 0, 210, 40, "F")
	
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 24)
	pdf.Text(15, 25, "CloudFly")
	
	pdf.SetFont("Arial", "", 10)
	pdf.Text(15, 32, "Inteligencia Artificial para tu Negocio")
	
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "FACTURA", "", 0, "R", false, 0, "")
	pdf.Ln(25)
	
	// --- Invoice Details ---
	pdf.SetTextColor(50, 50, 50)
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(30, 7, "Factura N°:")
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(60, 7, invoice.InvoiceNumber)
	
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(30, 7, "Fecha Emisión:")
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(60, 7, invoice.IssueDate.Format("02/01/2006"))
	pdf.Ln(7)
	
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(30, 7, "Estado:")
	pdf.SetFont("Arial", "B", 10)
	if invoice.Status == "PAID" || invoice.Status == "PAGADA" {
		pdf.SetTextColor(56, 161, 105) // Green
	} else {
		pdf.SetTextColor(229, 62, 62) // Red
	}
	pdf.Cell(60, 7, invoice.Status)
	pdf.SetTextColor(50, 50, 50)
	
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(30, 7, "Fecha Venc.:")
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(60, 7, invoice.DueDate.Format("02/01/2006"))
	pdf.Ln(15)
	
	// --- Customer Info ---
	pdf.SetFillColor(247, 250, 252)
	pdf.Rect(15, 65, 180, 25, "F")
	
	pdf.SetY(67)
	pdf.SetX(20)
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(40, 7, "FACTURADO A:")
	pdf.Ln(6)
	pdf.SetX(20)
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(40, 7, companyName)
	pdf.Ln(20)
	
	// --- Table Header ---
	pdf.SetFillColor(43, 108, 176)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(120, 10, "Descripción", "0", 0, "L", true, 0, "")
	pdf.CellFormat(20, 10, "Cant.", "0", 0, "C", true, 0, "")
	pdf.CellFormat(40, 10, "Total", "0", 0, "R", true, 0, "")
	pdf.Ln(12)
	
	// --- Items ---
	pdf.SetTextColor(50, 50, 50)
	pdf.SetFont("Arial", "", 10)
	
	description := "Suscripción CloudFly Plan"
	if invoice.BillingType == "RECURRENTE" {
		description = fmt.Sprintf("Suscripción CloudFly (%s) - Periodo %s a %s", 
			invoice.BillingPeriod,
			invoice.BillingPeriodStart.Format("02/01/2006"), 
			invoice.BillingPeriodEnd.Format("02/01/2006"))
	} else {
		description = "Servicios CloudFly AI - Pago Único"
	}
	
	pdf.CellFormat(120, 8, description, "B", 0, "L", false, 0, "")
	pdf.CellFormat(20, 8, "1", "B", 0, "C", false, 0, "")
	pdf.CellFormat(40, 8, fmt.Sprintf("%.2f %s", invoice.Subtotal, invoice.Currency), "B", 0, "R", false, 0, "")
	pdf.Ln(15)
	
	// --- Totals ---
	pdf.SetX(130)
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(35, 7, "Subtotal:")
	pdf.CellFormat(30, 7, fmt.Sprintf("%.2f", invoice.Subtotal), "", 0, "R", false, 0, "")
	pdf.Ln(7)
	
	pdf.SetX(130)
	pdf.Cell(35, 7, "IVA (19%):")
	pdf.CellFormat(30, 7, fmt.Sprintf("%.2f", invoice.Tax), "", 0, "R", false, 0, "")
	pdf.Ln(10)
	
	pdf.SetX(130)
	pdf.SetFillColor(43, 108, 176)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(35, 10, " TOTAL:", "", 0, "L", true, 0, "")
	pdf.CellFormat(30, 10, fmt.Sprintf("%.2f %s", invoice.Total, invoice.Currency), "", 0, "R", true, 0, "")
	
	// --- Footer ---
	pdf.SetY(260)
	pdf.SetTextColor(150, 150, 150)
	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(0, 10, "Gracias por confiar en CloudFly AI. Si tiene alguna duda, contáctenos en soporte@cloudfly.com.co", "", 0, "C", false, 0, "")
	
	// Ensure directory exists
	os.MkdirAll("uploads/invoices", 0755)
	
	filePath := fmt.Sprintf("uploads/invoices/%s.pdf", invoice.InvoiceNumber)
	err := pdf.OutputFileAndClose(filePath)
	if err != nil {
		return "", err
	}
	
	return filePath, nil
}
