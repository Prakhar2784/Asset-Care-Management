const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { isCloudinaryConfigured, uploadBufferToCloudinary } = require('../config/cloudinary');

function makeDiskStorage(folder) {
  const uploadsBaseDir = process.pkg
    ? path.join(path.dirname(process.execPath), 'uploads')
    : path.join(__dirname, '..', 'uploads');
  const dir = path.join(uploadsBaseDir, folder);
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

/**
 * Creates a smart upload handler supporting both Cloudinary and local disk storage
 */
function createUploader(type, fieldName, maxCount, allowedExtensions, maxFileSize, folderName) {
  const memoryMulter = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize },
    fileFilter: fileFilter(allowedExtensions),
  });

  const diskMulter = multer({
    storage: makeDiskStorage(folderName),
    limits: { fileSize: maxFileSize },
    fileFilter: fileFilter(allowedExtensions),
  });

  return (req, res, next) => {
    if (isCloudinaryConfigured()) {
      const uploadFn = type === 'single'
        ? memoryMulter.single(fieldName)
        : memoryMulter.array(fieldName, maxCount);

      uploadFn(req, res, async (err) => {
        if (err) return next(err);
        try {
          if (type === 'single' && req.file) {
            const ext = path.extname(req.file.originalname);
            const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
            const publicId = `${base}-${Date.now()}`;

            const result = await uploadBufferToCloudinary(req.file.buffer, {
              folder: `assetcare/${folderName}`,
              public_id: publicId,
              resource_type: 'auto',
            });
            req.file.path = result.secure_url;
            req.file.url = result.secure_url;
            req.file.filename = result.public_id;
            req.file.public_id = result.public_id;
          } else if (type === 'array' && req.files && req.files.length > 0) {
            await Promise.all(
              req.files.map(async (f) => {
                const ext = path.extname(f.originalname);
                const base = path.basename(f.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
                const publicId = `${base}-${Date.now()}`;

                const result = await uploadBufferToCloudinary(f.buffer, {
                  folder: `assetcare/${folderName}`,
                  public_id: publicId,
                  resource_type: 'auto',
                });
                f.path = result.secure_url;
                f.url = result.secure_url;
                f.filename = result.public_id;
                f.public_id = result.public_id;
              })
            );
          }
          next();
        } catch (uploadErr) {
          return res.status(500).json({ message: 'Cloudinary upload failed: ' + uploadErr.message });
        }
      });
    } else {
      const diskUploadFn = type === 'single'
        ? diskMulter.single(fieldName)
        : diskMulter.array(fieldName, maxCount);

      diskUploadFn(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
          req.file.url = `/uploads/${folderName}/${req.file.filename}`;
        }
        if (req.files) {
          req.files.forEach(f => {
            f.url = `/uploads/${folderName}/${f.filename}`;
          });
        }
        next();
      });
    }
  };
}

// Avatar — images only, 2 MB
exports.avatarUpload = createUploader('single', 'avatar', 1, ['.jpg', '.jpeg', '.png', '.webp'], 2 * 1024 * 1024, 'avatars');

// Ticket attachment — docs/images, 10 MB
exports.attachmentUpload = createUploader('array', 'files', 5, ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip'], 10 * 1024 * 1024, 'attachments');

// Invoice file — docs/images, 10 MB
exports.invoiceUpload = createUploader('single', 'file', 1, ['.jpg', '.jpeg', '.png', '.pdf'], 10 * 1024 * 1024, 'invoices');

// Company logo — images only, 5 MB
exports.logoUpload = createUploader('single', 'logo', 1, ['.jpg', '.jpeg', '.png', '.svg', '.webp'], 5 * 1024 * 1024, 'logos');

// Asset documents — invoice/warranty/AMC/manual/service report, 10 MB
exports.assetDocUpload = createUploader('array', 'documents', 5, ['.pdf', '.png', '.jpg', '.jpeg', '.docx'], 10 * 1024 * 1024, 'asset-documents');
