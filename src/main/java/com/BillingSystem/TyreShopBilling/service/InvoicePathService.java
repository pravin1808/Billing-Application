package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.model.InvoicePath;
import com.BillingSystem.TyreShopBilling.repository.InvoicePathRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@Service
public class InvoicePathService {

    private InvoicePathRepo invoicePathRepo;

    /**
     * Resolves the default invoice folder dynamically based on the host OS:
     * - Windows: C:/Users/<username>/Invoices
     * - macOS:   /Users/<username>/Invoices
     * - Linux:   /home/<username>/Invoices
     */
    public String resolveDefaultInvoicePath() {
        String userHome = System.getProperty("user.home");
        Path defaultFolder = Paths.get(userHome, "Invoices");
        return defaultFolder.toAbsolutePath().normalize().toString().replace('\\', '/');
    }

    public String isEmpty() {
        Optional<InvoicePath> invoice = invoicePathRepo.findById(1);
        if (invoice.isPresent() && invoice.get().getFolder() != null && !invoice.get().getFolder().isBlank()) {
            String existingPath = invoice.get().getFolder();

            // Self-heal: If the database contains a Windows drive path (e.g. "C:/Invoices")
            // but the server is running on Mac or Linux, migrate it to the OS default path.
            if (isWindowsPathOnUnix(existingPath)) {
                String healedPath = resolveDefaultInvoicePath();
                changeInvoicePathFolder(healedPath);
                return healedPath;
            }

            return existingPath;
        }

        // Initialize database with OS-appropriate default
        String defaultPath = resolveDefaultInvoicePath();
        InvoicePath invoicePath = new InvoicePath(1, defaultPath);
        invoicePathRepo.save(invoicePath);
        return invoicePath.getFolder();
    }

    public String getInvoicePath() {
        return isEmpty();
    }

    public void changeInvoicePathFolder(String newPath) {
        if (newPath == null || newPath.isBlank()) {
            newPath = resolveDefaultInvoicePath();
        }

        // Normalize slashes (replaces \ with / for uniform cross-platform handling)
        String normalizedPath = Paths.get(newPath.trim()).normalize().toString().replace('\\', '/');

        // Automatically create directory on disk if it doesn't exist yet
        try {
            Files.createDirectories(Paths.get(normalizedPath));
        } catch (Exception ignored) {
            // If creation fails due to permissions, InvoiceGenerator will handle/log at write time
        }

        Optional<InvoicePath> invoice = invoicePathRepo.findById(1);
        if (invoice.isPresent()) {
            InvoicePath invoicePath = invoice.get();
            invoicePath.setFolder(normalizedPath);
            invoicePathRepo.save(invoicePath);
            return;
        }
        InvoicePath newInvoicePath = new InvoicePath(1, normalizedPath);
        invoicePathRepo.save(newInvoicePath);
    }

    /**
     * Checks if a path uses Windows drive letters (e.g. "C:...") while running on Unix/Mac.
     */
    private boolean isWindowsPathOnUnix(String path) {
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        return !isWindows && path.matches("^[a-zA-Z]:.*");
    }

    @Autowired
    public void setInvoicePathRepo(InvoicePathRepo invoicePathRepo) {
        this.invoicePathRepo = invoicePathRepo;
    }
}
