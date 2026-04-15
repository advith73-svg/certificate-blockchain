const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const Blockchain = require('./blockchain');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const blockchain = new Blockchain();

// test route
app.get('/test', (req, res) => {
  res.send("Backend is working ✅");
});

// force index.html load
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// file upload setup
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});

const upload = multer({ storage });

// hash function
function generateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// upload certificate
app.post('/upload', upload.single('file'), (req, res) => {
  const hash = generateHash(req.file.path);

  blockchain.addBlock({
    filename: req.file.originalname,
    hash: hash
  });
blockchain.addBlock({
  filename: req.file.originalname,
  name: req.body.name,
  hash: hash
});
  QRCode.toDataURL(hash, (err, url) => {
  res.json({
    message: "Certificate Stored!",
    hash: hash,
    qr: url
  });
});
});

// verify certificate
app.post('/verify', upload.single('file'), (req, res) => {
  const hash = generateHash(req.file.path);

  const exists = blockchain.isHashPresent(hash);

  if (exists) {
    res.json({ valid: true, message: "Certificate is VALID ✅" });
  } else {
    res.json({ valid: false, message: "Certificate is FAKE ❌" });
  }
});
app.get('/blocks', (req, res) => {
  res.json(blockchain.chain);
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
