const PDFDocument = require('pdfkit');
const Attempt = require('../models/Attempt');

exports.downloadCertificate = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.attemptId)
            .populate('exam')
            .populate('user');

        if (!attempt) {
            return res.status(404).json({ msg: 'Attempt not found' });
        }

        // Verify the attempt belongs to the user
        if (attempt.user._id.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Check if the attempt was passed
        if (!attempt.isPassed) {
            return res.status(400).json({ msg: 'Certificate is only available for passed exams' });
        }

        // Create PDF document
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificate-${attempt._id}.pdf`);

        // Pipe the PDF directly to the response
        doc.pipe(res);

        // Add certificate content
        doc.font('Helvetica-Bold')
            .fontSize(35)
            .text('Certificate of Achievement', { align: 'center', margin: 50 });

        doc.moveDown(2);
        doc.font('Helvetica')
            .fontSize(20)
            .text('This is to certify that', { align: 'center' });

        doc.moveDown();
        doc.font('Helvetica-Bold')
            .fontSize(25)
            .text(attempt.user.name, { align: 'center' });

        doc.moveDown();
        doc.font('Helvetica')
            .fontSize(20)
            .text('has successfully completed and passed', { align: 'center' });

        doc.moveDown();
        doc.font('Helvetica-Bold')
            .fontSize(25)
            .text(attempt.exam.title, { align: 'center' });

        doc.moveDown();
        doc.font('Helvetica')
            .fontSize(18)
            .text(`with a score of ${Math.round(attempt.score)}%`, { align: 'center' });

        doc.moveDown(2);
        doc.fontSize(14)
            .text(`Awarded on: ${new Date(attempt.endTime).toLocaleDateString()}`, { align: 'center' });

        doc.moveDown(2);
        doc.fontSize(12)
            .text(`Certificate ID: ${attempt._id}`, { align: 'center' });

        // Finalize the PDF
        doc.end();

    } catch (err) {
        console.error('Error generating certificate:', err);
        res.status(500).send('Server error');
    }
};