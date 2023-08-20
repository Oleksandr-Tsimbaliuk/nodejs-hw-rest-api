const isFile = (req, res, next) => {
  if (!req.file) {
    res.status(400).json({ message: "file is not found" });
    return;
  }
  next();
};

module.exports = isFile
