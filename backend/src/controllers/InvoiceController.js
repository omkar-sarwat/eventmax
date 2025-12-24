const Invoice = require('../models/Invoice');

/**
 * Invoice Controller - Clean invoice endpoints
 */
const InvoiceController = {
    /**
     * GET /api/invoices
     * Get user's invoices
     */
    async getUserInvoices(req, res) {
        try {
            const userId = req.user.userId;
            const { limit, offset } = req.query;

            const invoices = await Invoice.findByUserId(userId, {
                limit: limit ? parseInt(limit) : 20,
                offset: offset ? parseInt(offset) : 0
            });

            res.status(200).json({
                success: true,
                data: { invoices }
            });
        } catch (error) {
            console.error('Get invoices error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/invoices/:id
     * Get invoice details
     */
    async getInvoice(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const invoice = await Invoice.findById(id);
            
            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            // Check authorization
            if (userId && invoice.userId !== userId) {
                return res.status(403).json({ error: 'Not authorized to view this invoice' });
            }

            res.status(200).json({
                success: true,
                data: { invoice }
            });
        } catch (error) {
            console.error('Get invoice error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/invoices/number/:invoiceNumber
     * Get invoice by number
     */
    async getByNumber(req, res) {
        try {
            const { invoiceNumber } = req.params;

            const invoice = await Invoice.findByNumber(invoiceNumber);
            
            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            res.status(200).json({
                success: true,
                data: { invoice }
            });
        } catch (error) {
            console.error('Get by number error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/invoices/:id/download
     * Download invoice PDF
     */
    async download(req, res) {
        try {
            const { id } = req.params;

            const invoice = await Invoice.findById(id);
            
            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            // In production, generate or retrieve PDF
            // For now, return invoice data
            res.status(200).json({
                success: true,
                message: 'PDF download would be here',
                data: { invoice }
            });
        } catch (error) {
            console.error('Download error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = InvoiceController;
