const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function makeStorage(folder) {
  const dir = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename:    (_req, file, cb) => {
      const ext  = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '_').slice(0, 40);
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  });
}

const fileFilter = (allowed) => (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not allowed.`), false);
};

// Avatar — images only, 2 MB
exports.avatarUpload = multer({
  storage:  makeStorage('avatars'),
  limits:   { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.webp']),
}).single('avatar');

// Ticket attachment — docs/images, 10 MB
exports.attachmentUpload = multer({
  storage:  makeStorage('attachments'),
  limits:   { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip']),
}).array('files', 5);

// Invoice file — docs/images, 10 MB
exports.invoiceUpload = multer({
  storage:  makeStorage('invoices'),
  limits:   { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.pdf']),
}).single('file');

// Company logo — images only, 5 MB
exports.logoUpload = multer({
  storage:  makeStorage('logos'),
  limits:   { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.svg', '.webp']),
}).single('logo');

// Asset documents — invoice/warranty/AMC/manual/service report, 10 MB
exports.assetDocUpload = multer({
  storage:  makeStorage('asset-documents'),
  limits:   { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['.pdf', '.png', '.jpg', '.jpeg', '.docx']),
}).array('documents', 5);
