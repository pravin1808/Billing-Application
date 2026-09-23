package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.itextpdf.io.font.FontConstants;
import com.itextpdf.kernel.color.Color;
import com.itextpdf.kernel.color.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.AffineTransform;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.extgstate.PdfExtGState;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.border.Border;
import com.itextpdf.layout.border.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.property.TextAlignment;
import com.itextpdf.layout.property.UnitValue;
import com.itextpdf.layout.property.VerticalAlignment;
import com.itextpdf.layout.renderer.CellRenderer;
import com.itextpdf.layout.renderer.DrawContext;
import com.itextpdf.layout.renderer.IRenderer;
import com.itextpdf.layout.renderer.TableRenderer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.printing.PDFPageable;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;

import java.awt.print.PrinterJob;
import java.io.*;

@Component
public class InvoiceGenerator {

    public String invoiceGenerator(OrdersResponse ordersResponse, String orgFolder) throws Exception {
        PdfFont boldFont = PdfFontFactory.createFont(FontConstants.HELVETICA_BOLD);

        File baseFolder = new File(orgFolder);
        if (!baseFolder.exists()) {
            baseFolder.mkdirs();
        }

        File targetFolder;
        if (ordersResponse.isCancelled()) {
            targetFolder = new File(baseFolder, "cancelled");
            if (!targetFolder.exists()) {
                targetFolder.mkdirs();
            }
            // Remove previous active invoice from base folder if it exists
            if (ordersResponse.invoicePath() != null && !ordersResponse.invoicePath().isBlank()) {
                File oldFile = new File(ordersResponse.invoicePath());
                if (oldFile.exists() && !oldFile.getParentFile().equals(targetFolder)) {
                    oldFile.delete();
                }
            }
            File oldActiveFile = new File(baseFolder, ordersResponse.customerName() + " " + ordersResponse.invoiceNumber() + "  invoice.pdf");
            if (oldActiveFile.exists()) {
                oldActiveFile.delete();
            }
        } else {
            targetFolder = baseFolder;
        }

        File file = new File(targetFolder, ordersResponse.customerName() + " " + ordersResponse.invoiceNumber() + "  invoice.pdf");
        boolean isCreated = file.createNewFile();

        PdfDocument pdf = getPdfDocument(file);

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

        String taxInvoiceTitle = ordersResponse.isCancelled() ? "TAX INVOICE (CANCELLED)" : "TAX INVOICE";
        Paragraph titlePara = new Paragraph(taxInvoiceTitle)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.RIGHT);
        if (ordersResponse.isCancelled()) {
            titlePara.setFontColor(Color.RED).setBold();
        }
        rowTable.addCell(new Cell().add(titlePara).setBorder(Border.NO_BORDER));

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

        String formattedDate = ordersResponse.orderDate() != null
                ? ordersResponse.orderDate().format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a"))
                : "";
        invTable.addCell(new Cell().add(new Paragraph("Date : " + formattedDate).setFontSize(8))
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

// ---------------- CGST & SGST Section with Cancelled Watermark in blank space ----------------
        Cell leftBlankCell = new Cell(4, 6)
                .setBorderLeft(new SolidBorder(1))
                .setBorderRight(Border.NO_BORDER)
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(1));

        if (ordersResponse.isCancelled()) {
            leftBlankCell.setNextRenderer(new CellRenderer(leftBlankCell) {
                @Override
                public IRenderer getNextRenderer() {
                    return new CellRenderer((Cell) modelElement) {
                        @Override
                        public IRenderer getNextRenderer() {
                            return this;
                        }

                        @Override
                        public void draw(DrawContext drawContext) {
                            super.draw(drawContext);
                            drawCancelledStamp(drawContext, getOccupiedAreaBBox());
                        }
                    };
                }

                @Override
                public void draw(DrawContext drawContext) {
                    super.draw(drawContext);
                    drawCancelledStamp(drawContext, getOccupiedAreaBBox());
                }
            });
        }

        productTable.addCell(leftBlankCell);

        productTable.addCell(new Cell(1, 2)
                .add("CGST 9%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(Border.NO_BORDER)
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
        productTable.addCell(new Cell(1, 2)
                .add("SGST 9%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(Border.NO_BORDER)
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
        productTable.addCell(new Cell(1, 2)
                .add("CGST 14%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(Border.NO_BORDER)
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
        productTable.addCell(new Cell(1, 2)
                .add("SGST 14%")
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(8f)
                .setBorderLeft(Border.NO_BORDER)
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

        Cell signLabelCell2 = new Cell(1,5)
                .add("For : AKHIL ENTERPRISES")
                .setTextAlignment(TextAlignment.CENTER)
                .setBorderTop(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER);

        productTable.addCell(signLabelCell2);

        document.add(productTable);

        document.close();

        return file.getAbsolutePath();
    }

    private static @NonNull PdfDocument getPdfDocument(File file) throws FileNotFoundException {
        PdfWriter writer = new PdfWriter(file);
        PdfDocument pdf = new PdfDocument(writer);

        // --- Add shop watermark on every page (Behind content) as vector graphics/text ---
        pdf.addEventHandler(PdfDocumentEvent.START_PAGE, new IEventHandler() {
            @Override
            public void handleEvent(Event event) {
                PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
                PdfPage page = docEvent.getPage();
                PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);

                try {
                    PdfFont boldFont = PdfFontFactory.createFont(FontConstants.HELVETICA_BOLD);
                    Rectangle pageSize = pdf.getDefaultPageSize();
                    float cx = pageSize.getWidth() / 2f;
                    float cy = pageSize.getHeight() / 2f;

                    canvas.saveState();
                    PdfExtGState gs = new PdfExtGState();
                    gs.setFillOpacity(0.24f);
                    gs.setStrokeOpacity(0.24f);
                    canvas.setExtGState(gs);

                    // --- Vector Tyre Graphic (Mathematically exact to watermark.png) ---
                    float tyreSize = 78f;
                    float tyreX = cx - 112f;
                    float tyreY = cy - 39f;
                    drawTyre(canvas, tyreX, tyreY, tyreSize);

                    // --- Text: "AKHIL" and "ENTERPRISES" ---
                    Canvas textCanvas = new Canvas(canvas, pdf, pageSize);

                    float textX = cx - 22f;

                    Paragraph akhil = new Paragraph("AKHIL")
                            .setFont(boldFont)
                            .setFontSize(44f)
                            .setFontColor(Color.BLACK);
                    textCanvas.showTextAligned(akhil, textX, cy - 2f, TextAlignment.LEFT);

                    Paragraph enterprises = new Paragraph("ENTERPRISES")
                            .setFont(boldFont)
                            .setFontSize(18f)
                            .setFontColor(new DeviceRgb(220, 30, 30));
                    textCanvas.showTextAligned(enterprises, textX, cy - 22f, TextAlignment.LEFT);

                    canvas.restoreState();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        });

        pdf.setDefaultPageSize(PageSize.A5);
        return pdf;
    }

    private static final int[] TYRE_RED = new int[]{656,988,565,1000,451,994,354,969,266,929,188,874,117,800,78,745,23,625,0,514,0,422,13,345,42,262,88,185,159,108,240,52,331,15,422,0,500,0,506,6,445,15,347,55,289,95,237,145,182,225,153,295,133,394,140,514,159,585,192,662,234,732,321,825,403,880,494,920,617,948,685,948,766,935,799,923,808,926,737,963};
    private static final int[] TYRE_OUTER = new int[]{760,889,656,905,588,902,513,886,448,862,357,806,289,742,244,680,205,603,172,474,172,378,198,277,231,215,266,169,338,108,422,65,497,46,597,43,701,68,760,95,828,148,1000,572,1000,683,958,757,909,809,838,858};
    private static final int[] TYRE_GROOVE = new int[]{708,800,753,788,821,751,873,702,912,640,942,532,942,471,922,388,890,323,844,262,802,222,744,182,682,154,597,135,529,138,477,151,425,175,383,206,341,252,305,314,286,388,286,471,308,560,344,631,380,680,435,732,481,763,526,785,597,803};
    private static final int[] TYRE_RIM = new int[]{721,766,620,775,568,766,503,742,458,714,406,668,341,569,315,477,315,394,325,348,354,283,377,252,429,206,477,182,578,163,640,169,721,197,782,237,828,280,867,332,896,391,916,471,916,535,886,634,851,686,815,720,776,745};
    private static final int[][] TYRE_HOLES = new int[][]{
        new int[]{744,271,711,246,646,222,558,215,549,225,578,308,597,345,623,366,649,366,666,357},
        new int[]{571,418,594,418,607,400,594,385,575,385,565,394,562,406},
        new int[]{666,443,679,431,679,415,653,400,640,409,640,422},
        new int[]{377,443,484,440,503,434,523,412,519,378,471,292,451,271,412,302,386,345,367,409,367,434},
        new int[]{552,489,571,480,571,455,565,449,539,455,539,474},
        new int[]{666,520,679,520,695,495,675,477,669,477,656,498,656,511},
        new int[]{851,551,864,523,860,443,844,391,828,360,815,354,721,437,714,462,744,492},
        new int[]{620,551,630,542,630,529,610,514,597,517,588,526,591,542},
        new int[]{523,689,532,680,552,612,558,545,526,526,484,526,409,542,399,551,399,563,429,612,477,662},
        new int[]{633,717,659,723,734,702,769,680,802,649,802,640,711,569,688,557,672,557,640,609}
    };

    private static void drawPath(PdfCanvas canvas, float ox, float oy, float scale, int[] pts) {
        if (pts == null || pts.length < 2) return;
        canvas.moveTo(ox + pts[0] * scale, oy + pts[1] * scale);
        for (int i = 2; i < pts.length; i += 2) {
            canvas.lineTo(ox + pts[i] * scale, oy + pts[i + 1] * scale);
        }
        canvas.closePath();
    }

    private static void drawTyre(PdfCanvas canvas, float ox, float oy, float size) {
        float scale = size / 1000f;

        // 1. Red crescent swoop
        canvas.setFillColor(new DeviceRgb(215, 30, 30));
        drawPath(canvas, ox, oy, scale, TYRE_RED);
        canvas.fill();

        // 2. Black outer tyre rubber (compound path: outer tyre minus groove)
        canvas.setFillColor(Color.BLACK);
        drawPath(canvas, ox, oy, scale, TYRE_OUTER);
        drawPath(canvas, ox, oy, scale, TYRE_GROOVE);
        canvas.eoFill();

        // 3. Rim and 5 spokes (compound path: rim minus all 10 holes: 5 spoke openings + 5 lug nuts)
        canvas.setFillColor(Color.BLACK);
        drawPath(canvas, ox, oy, scale, TYRE_RIM);
        for (int[] hole : TYRE_HOLES) {
            drawPath(canvas, ox, oy, scale, hole);
        }
        canvas.eoFill();
    }

    private static void drawCancelledStamp(DrawContext drawContext, Rectangle bbox) {
        if (bbox == null) {
            return;
        }
        try {
            PdfCanvas canvas = drawContext.getCanvas();
            PdfDocument pdfDoc = drawContext.getDocument();
            PdfFont boldFont = PdfFontFactory.createFont(FontConstants.HELVETICA_BOLD);

            float cx = bbox.getX() + bbox.getWidth() / 2f;
            float cy = bbox.getY() + bbox.getHeight() / 2f;

            canvas.saveState();

            // Rotate canvas ~16 degrees around (cx, cy) to match the tilted stamp appearance
            AffineTransform transform = AffineTransform.getRotateInstance(Math.toRadians(16), cx, cy);
            canvas.concatMatrix(transform);

            // Stamp dimensions
            float bannerW = 68f;
            float bannerH = 19f;
            float cornerR = 3.5f;

            Color stampRed = new DeviceRgb(220, 30, 30);

            // 1. Mask background inside banner so nothing behind shows through
            canvas.setFillColor(Color.WHITE);
            canvas.roundRectangle(cx - bannerW / 2f, cy - bannerH / 2f, bannerW, bannerH, cornerR);
            canvas.fill();

            // 2. Apply rubber-stamp opacity for the red stamp
            PdfExtGState gs = new PdfExtGState();
            gs.setFillOpacity(0.55f);
            gs.setStrokeOpacity(0.55f);
            canvas.setExtGState(gs);

            // 3. Banner border
            canvas.setStrokeColor(stampRed);
            canvas.setLineWidth(1.8f);
            canvas.roundRectangle(cx - bannerW / 2f, cy - bannerH / 2f, bannerW, bannerH, cornerR);
            canvas.stroke();

            // 4. Middle "CANCELLED" text inside rectangle (no circles, no top/bottom words)
            Canvas stampCanvas = new Canvas(canvas, pdfDoc, bbox);
            Paragraph mainText = new Paragraph("CANCELLED")
                    .setFont(boldFont)
                    .setFontSize(10f)
                    .setFontColor(stampRed);
            stampCanvas.showTextAligned(mainText, cx, cy - 3.5f, TextAlignment.CENTER);

            canvas.restoreState();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void printInvoice(String pdfPath) throws Exception {
        File pdfFile = new File(pdfPath);
        if (!pdfFile.exists()) {
            throw new java.io.FileNotFoundException("Invoice file not found: " + pdfPath);
        }

        PDDocument document = PDDocument.load(pdfFile);
        PrinterJob job = PrinterJob.getPrinterJob();
        job.setPageable(new PDFPageable(document));

        job.defaultPage(new java.awt.print.PageFormat() {{
            setPaper(new java.awt.print.Paper() {{
                setSize(420, 595);
                setImageableArea(20, 20, 380, 555);
            }});
        }});

        job.print();
        document.close();
    }
}
