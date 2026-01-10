import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const textFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".txt", ".md", ".csv"];
  const allowedMimes = ["text/plain", "text/markdown", "text/csv"];

  if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only text files (.txt, .md, .csv) are allowed"), false);
  }
};

export const uploadText = multer({
  storage,
  fileFilter: textFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
