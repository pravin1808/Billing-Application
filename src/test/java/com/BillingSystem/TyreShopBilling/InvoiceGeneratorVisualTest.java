package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class InvoiceGeneratorVisualTest {

    @Test
    void generateAndRenderCancelledInvoice() throws Exception {
        InvoiceGenerator generator = new InvoiceGenerator();

        OrdersResponse cancelledOrder = new OrdersResponse(
                555L,
                "Ramesh Patel",
                9876543210L,
                "27ABCDE1234F1Z5",
                555,
                null,
                LocalDateTime.now(),
                9200.0f,
                "CASH",
                true,
                LocalDateTime.now(),
                List.of(
                        new OrderedProductResponse(1L, 10, "CEAT Milaze 165/80 R14", "165/80 R14", 28, 4011, 4100.0f, 4600.0f, 2, 9200.0f)
                )
        );

        File testDir = new File("target/test-invoices");
        testDir.mkdirs();

        String pdfPath = generator.invoiceGenerator(cancelledOrder, testDir.getAbsolutePath());
        File pdfFile = new File(pdfPath);
        assertTrue(pdfFile.exists(), "PDF should exist at " + pdfPath);

        try (PDDocument doc = PDDocument.load(pdfFile)) {
            PDFRenderer renderer = new PDFRenderer(doc);
            BufferedImage image = renderer.renderImageWithDPI(0, 150);
            File pngOutput = new File("target/test-invoices/cancelled-sample.png");
            ImageIO.write(image, "PNG", pngOutput);
            assertTrue(pngOutput.exists(), "Rendered preview should exist");
        }
    }
}
