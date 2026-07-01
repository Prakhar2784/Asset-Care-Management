const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.tenantId || 'default';
    const tenantUploadDir = path.join(__dirname, `../uploads/${tenantId}/invoices`);
    
    // Ensure the tenant-scoped directory exists
    if (!fs.existsSync(tenantUploadDir)) {
      fs.mkdirSync(tenantUploadDir, { recursive: true });
    }
    cb(null, tenantUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name: invoice-[timestamp]-[random].[ext]
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `invoice-${uniqueSuffix}${ext}`);
  }
});

// File filter (Allow only PDFs and Images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDFs and Image files (.jpg, .jpeg, .png) are allowed'), false);
  }
};

// Multer upload middleware setup (Limit files to 10MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

module.exports = upload;
