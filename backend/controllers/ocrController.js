// OCR is now handled client-side via Tesseract.js — this file is kept as a placeholder.
exports.scanInvoice = (req, res) => {
  res.status(410).json({ message: "This endpoint is deprecated. OCR runs client-side." });
};
