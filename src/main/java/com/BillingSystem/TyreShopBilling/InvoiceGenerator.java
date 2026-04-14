package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.itextpdf.io.font.FontConstants;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.extgstate.PdfExtGState;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.border.Border;
import com.itextpdf.layout.border.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.property.TextAlignment;
import com.itextpdf.layout.property.UnitValue;
import com.itextpdf.layout.property.VerticalAlignment;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.printing.PDFPageable;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.print.PrinterJob;
import java.io.*;

@Component
public class InvoiceGenerator {

    public void invoiceGenerator(OrdersResponse ordersResponse, String orgFolder)throws IOException {
        PdfFont boldFont = PdfFontFactory.createFont(FontConstants.HELVETICA_BOLD);

        File folder = new File(orgFolder);
        if (!folder.exists()) {
            boolean created = folder.mkdirs();
        }

        File file = new File(folder+"/"+ordersResponse.customerName()+" "+ordersResponse.invoiceNumber()+" "+" invoice.pdf");
        boolean isCreated = file.createNewFile();

        BufferedImage image = ImageIO.read(new File("src/main/resources/static/watermark.png"));

        ImageIO.write(image, "png", new File(folder+"/watermark.png"));

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {

            writer.write("Hello World!");
            writer.newLine();
            writer.write("Buffered writing is faster");

        } catch (IOException e) {
            e.printStackTrace();
        }

        PdfDocument pdf = getPdfDocument(file, folder);

        Document document = new Document(pdf,PageSize.A5);
        document.setFont(boldFont);

        Table rowTable = new Table(UnitValue.createPercentArray(new float[]{3, 4, 3})).useAllAvailableWidth();

// Remove table border
        rowTable.setBorder(Border.NO_BORDER);

// Add cells without borders
        rowTable.addCell(new Cell().add(
                        new Paragraph("GSTIN27BXHPS1520C2ZQ")
                                .setFontSize(8)
                                .setTextAlignment(TextAlignment.LEFT))
                .setBorder(Border.NO_BORDER));

        rowTable.addCell(new Cell().add(
                        new Paragraph("Subject to Solapur Jurisdiction")
                                .setFontSize(8)
                                .setTextAlignment(TextAlignment.CENTER))
                .setBorder(Border.NO_BORDER));

        rowTable.addCell(new Cell().add(
                        new Paragraph("TAX INVOICE")
                                .setFontSize(8)
                                .setTextAlignment(TextAlignment.RIGHT))
                .setBorder(Border.NO_BORDER));

        document.add(rowTable);

        float[] columnWidths = {1}; // ratio: 2/3 and 1/3
        Table table = new Table(UnitValue.createPercentArray(columnWidths)).useAllAvailableWidth();
        table.setWidth(UnitValue.createPercentValue(100)); // span full page width
        table.setMarginTop(1); // space below title

// Add outer border to the table
        table.setBorder(new SolidBorder(1f));

        table.addCell(new Cell().add(new Paragraph("AKHIL ENTERPRISES").setBold().setFontSize(18))
                .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE));

        table.addCell(new Cell().add(new Paragraph("Authorised Dealer - CEAT Tyres\n" +
                        "MULTI BRAND TYRE STORE").setFontSize(12))
                .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE));

        table.addCell(new Cell().add(new Paragraph("146/5, Kadadi Blocks, Opp. Hotel Dhruva, Rly Lines, SOLAPUR-413001").setFontSize(8))
                .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE));

        table.addCell(new Cell().add(new Paragraph("Phone : 8669141166").setFontSize(8))
                .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE));

        for (int i = 0; i < table.getNumberOfRows(); i++) {
            for (int j = 0; j < table.getNumberOfColumns(); j++) {
                Cell cell = table.getCell(i, j);
                if (cell != null) {
                    cell.setBorder(Border.NO_BORDER);
                }
            }
        }

        // 6. Add table to document
        document.add(table);

        float[] invNumColumnWidth = {1,1};
        Table invTable = new Table(UnitValue.createPercentArray(invNumColumnWidth));
        invTable.setFontSize(8);
        invTable.setWidth(UnitValue.createPercentValue(100));
        invTable.setMarginTop(0);

        invTable.addCell(new Cell().add(new Paragraph("Invoice No. "+ordersResponse.invoiceNumber()).setFontSize(8))
                .setTextAlignment(TextAlignment.LEFT));

        invTable.addCell(new Cell().add(new Paragraph("Date : "+ordersResponse.orderDate()).setFontSize(8))
                .setTextAlignment(TextAlignment.RIGHT));

        invTable.setBorder(Border.NO_BORDER);
        for (int r = 0; r < invTable.getNumberOfRows(); r++) {
            for (int c = 0; c < invTable.getNumberOfColumns(); c++) {
                Cell cell = invTable.getCell(r, c);
                if (cell != null) {
                    cell.setBorder(Border.NO_BORDER);
                }
            }
        }

        document.add(invTable);

        float[] buyerNumColumnWidth = {1,1};
        Table buyerTable = new Table(UnitValue.createPercentArray(buyerNumColumnWidth));
        buyerTable.setFontSize(8);
        buyerTable.setWidth(UnitValue.createPercentValue(100));
        buyerTable.setMarginTop(0);
        buyerTable.setMarginBottom(10f);

        buyerTable.addCell(new Cell().add(new Paragraph("Name : "+ordersResponse.customerName()).setFontSize(8))
                .setTextAlignment(TextAlignment.LEFT));

        buyerTable.addCell(new Cell().add(new Paragraph("Mobile : "+ordersResponse.customerMobileNumber()).setFontSize(8))
                .setTextAlignment(TextAlignment.RIGHT));

        buyerTable.addCell(new Cell().add(new Paragraph("Payment Method : "+ordersResponse.paymentMethod()).setFontSize(8))
                .setTextAlignment(TextAlignment.LEFT));

        if(ordersResponse.gstInNumber()!=null) {
            buyerTable.addCell(new Cell().add(new Paragraph("GSTIN : " + ordersResponse.gstInNumber()).setFontSize(8))
                    .setTextAlignment(TextAlignment.RIGHT));
        }


        buyerTable.setBorder(Border.NO_BORDER);
        for (int r = 0; r < buyerTable.getNumberOfRows(); r++) {
            for (int c = 0; c < buyerTable.getNumberOfColumns(); c++) {
                Cell cell = buyerTable.getCell(r, c);
                if (cell != null) {
                    cell.setBorder(Border.NO_BORDER);
                }
            }
        }

        document.add(buyerTable);

        float[] productTableColumnWidths = {0.5f, 5.5f, 2, 2, 1, 2, 2.5f, 1.5f, 2};
        Table productTable = new Table(UnitValue.createPercentArray(productTableColumnWidths));
        productTable.setFontSize(8f);
        productTable.setWidth(UnitValue.createPercentValue(100));
        productTable.setMinHeight(document.getPdfDocument().getDefaultPageSize().getHeight() - 50);
        productTable.setMarginTop(0);

// Header cells
        String[] headers = {"Sr No.", "Description", "Size", "HSN/SAC", "GST (%)", "Rate", "Rate(incl. GST)", "Quantity", "Amount"};

        for (int i = 0; i < headers.length; i++) {
            Cell headerCell = new Cell().add(headers[i]);
            headerCell.setBorder(new SolidBorder(1));

            // Header alignment same as data: description left, others right
            if (i == 1) {
                headerCell.setTextAlignment(TextAlignment.LEFT);
            } else {
                headerCell.setTextAlignment(TextAlignment.RIGHT);
            }

            productTable.addHeaderCell(headerCell);
        }

// Product rows
        int srNo = 1;
        int totalProducts = ordersResponse.orderedProducts().size();
        for (OrderedProductResponse p : ordersResponse.orderedProducts()) {
            String hsnValue = (p.hsnNumber() == 0) ? "-" : String.valueOf(p.hsnNumber());
            // Each cell must be created individually to set borders
            String[] values = {
                    String.valueOf(srNo++),
                    p.description(),
                    p.size(),
                    hsnValue, // use the formatted HSN
                    String.valueOf(p.gst()),
                    String.format("%.2f", p.price()),
                    String.format("%.2f", p.gstPrice()),
                    String.valueOf(p.quantitySell()),
                    String.format("%.2f", p.amount())
            };

            for (int i = 0; i < values.length; i++) {
                Cell cell = new Cell().add(values[i]);

                // 🔹 Alignment: only Description column (index 1) is left-aligned
                if (i == 1) {
                    cell.setTextAlignment(TextAlignment.LEFT);
                } else {
                    cell.setTextAlignment(TextAlignment.RIGHT);
                }

                // Keep vertical lines only
                cell.setBorderLeft(new SolidBorder(1));
                cell.setBorderRight(new SolidBorder(1));
                cell.setBorderTop(Border.NO_BORDER);
                cell.setBorderBottom(Border.NO_BORDER);

                // Add bottom border to last product row
                if (srNo - 1 == totalProducts) {
                    cell.setBorderBottom(new SolidBorder(1));
                }

                productTable.addCell(cell);
            }
        }

        int rowsPerPage = 24; // Total cells
        int remainingRows = rowsPerPage - totalProducts;

        for (int r = 0; r < remainingRows; r++) {
            for (int c = 0; c < headers.length; c++) {
                Cell emptyCell = new Cell().add("");

                // Same alignment rule: Description left, others right
                if (c == 1) {
                    emptyCell.setTextAlignment(TextAlignment.LEFT);
                } else {
                    emptyCell.setTextAlignment(TextAlignment.RIGHT);
                }

                emptyCell.setBorderLeft(new SolidBorder(1));
                emptyCell.setBorderRight(new SolidBorder(1));
                emptyCell.setBorderTop(Border.NO_BORDER);
                emptyCell.setBorderBottom(Border.NO_BORDER);

                // Bottom border on the very last empty row
                if (r == remainingRows - 1) {
                    emptyCell.setBorderBottom(new SolidBorder(1));
                }

                productTable.addCell(emptyCell);
            }
        }

        float totalBaseAmount = 0;
        for (OrderedProductResponse p : ordersResponse.orderedProducts()) {
            totalBaseAmount += p.price() * p.quantitySell();
        }

        float totalTax = ordersResponse.totalAmount() - totalBaseAmount;
        float cgst = totalTax / 2;
        float sgst = totalTax / 2;

        double cgst9Total = 0.0;
        double sgst9Total = 0.0;
        double cgst14Total = 0.0;
        double sgst14Total = 0.0;

        for (OrderedProductResponse p : ordersResponse.orderedProducts()) {
            double gstRate = p.gst();  // 18 or 28
            double taxableAmount = p.gstPrice() * p.quantitySell();
            double gstFraction = gstRate / 100.0;
            double gstAmount = taxableAmount * gstFraction / (1 + gstFraction); // extract GST from price inclusive of GST

            if (gstRate == 18) {
                cgst9Total += gstAmount / 2;  // Half CGST
                sgst9Total += gstAmount / 2;  // Half SGST
            } else if (gstRate == 28) {
                cgst14Total += gstAmount / 2; // Half CGST
                sgst14Total += gstAmount / 2; // Half SGST
            }
        }

// ---------------- CGST Row ----------------
        productTable.addCell(new Cell(1, headers.length - 1)
                .add("CGST 9%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER));

        productTable.addCell(new Cell()
                .add(String.format("%.2f", cgst9Total))
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER));

// SGST 9%
        productTable.addCell(new Cell(1, headers.length - 1)
                .add("SGST 9%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER));

        productTable.addCell(new Cell()
                .add(String.format("%.2f", sgst9Total))
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER));

// CGST 14%
        productTable.addCell(new Cell(1, headers.length - 1)
                .add("CGST 14%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER));

        productTable.addCell(new Cell()
                .add(String.format("%.2f", cgst14Total))
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER));

// SGST 14% (add bottom border if this is last row)
        productTable.addCell(new Cell(1, headers.length - 1)
                .add("SGST 14%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(1))); // bottom border to close table

        productTable.addCell(new Cell()
                .add(String.format("%.2f", sgst14Total))
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1))
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(1)));

        Cell totalLabelCell = new Cell(1, headers.length - 1) // span all columns except last
                .add("Total Amount")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f) // match table font size
                .setBorderTop(new SolidBorder(1)) // optional: top border to separate from products
                .setBorderBottom(new SolidBorder(1))
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1));

        productTable.addCell(totalLabelCell);

// Amount value in last column
        Cell totalAmountCell = new Cell()
                .add(String.format("%.2f", ordersResponse.totalAmount()))
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderTop(new SolidBorder(1))
                .setBorderBottom(new SolidBorder(1))
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(new SolidBorder(1));

        productTable.addCell(totalAmountCell);

        Cell signLabelCell = new Cell(1,headers.length)
                .add("")
                .setFontSize(8)
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);

        productTable.addCell(signLabelCell);

        Cell signLabelCell3 = new Cell(1,headers.length)
                .add("")
                .setFontSize(8)
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);

        productTable.addCell(signLabelCell3);

        Cell signLabelCell4 = new Cell(1,headers.length)
                .add("")
                .setFontSize(8)
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);

        productTable.addCell(signLabelCell4);

        Cell signLabelCell1 = new Cell(1,4)
                .add("Customer's Signature")
                .setTextAlignment(TextAlignment.CENTER)
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);

        productTable.addCell(signLabelCell1);

        Cell signLabelCell2 = new Cell(1,4)
                .add("For : AKHIL ENTERPRISES")
                .setTextAlignment(TextAlignment.CENTER)
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);

        productTable.addCell(signLabelCell2);

        document.add(productTable);

        document.close();

        printInvoice(String.valueOf(file));

    }

    private static @NonNull PdfDocument getPdfDocument(File file, File folder) throws FileNotFoundException {
        PdfWriter writer = new PdfWriter(file);
        PdfDocument pdf = new PdfDocument(writer);

        // --- Add watermark on every page ---
        pdf.addEventHandler(PdfDocumentEvent.START_PAGE, new IEventHandler() {
            @Override
            public void handleEvent(Event event) {
                PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
                PdfPage page = docEvent.getPage();
                PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);

                try {
                    // Path to your watermark image (transparent PNG recommended)
                    ImageData bgImage = ImageDataFactory.create(folder +"/watermark.png");

                    Rectangle pageSize = pdf.getDefaultPageSize();
                    float width = pageSize.getWidth() / 1.5f;   // adjust scale
                    float height = pageSize.getHeight() / 1.5f;

                    float x = (pageSize.getWidth() - width) / 2;
                    float y = (pageSize.getHeight() - height) / 2;

                    canvas.saveState();
                    PdfExtGState gs = new PdfExtGState();
                    gs.setFillOpacity(0.35f); // make it light (0.05–0.15 ideal)
                    canvas.setExtGState(gs);

                    canvas.addImage(bgImage, width, 0, 0, height, x, y, false);
                    canvas.restoreState();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        });

        pdf.setDefaultPageSize(PageSize.A5);
        return pdf;
    }

    public static void printInvoice(String pdfPath) {
        try {
            File pdfFile = new File(pdfPath);
            if (pdfFile.exists()) {
                // Load the already saved invoice
                PDDocument document = PDDocument.load(pdfFile);

                PrinterJob job = PrinterJob.getPrinterJob();
                job.setPageable(new PDFPageable(document));

                // Optional: set A5 paper size programmatically
                job.defaultPage(new java.awt.print.PageFormat() {{
                    setPaper(new java.awt.print.Paper() {{
                        setSize(420, 595);  // A5 in points (1/72 inch)
                        setImageableArea(20, 20, 380, 555);
                    }});
                }});
                job.print(); // Direct print, no save prompt

                document.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
