const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ORIGEN = path.join(__dirname, "Marzo");
const DESTINO = path.join(__dirname, "thumbs");

// crear carpeta thumbs si no existe
if (!fs.existsSync(DESTINO)) {
  fs.mkdirSync(DESTINO);
}

fs.readdirSync(ORIGEN).forEach(file => {
  const ext = path.extname(file).toLowerCase();

  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return;

  sharp(path.join(ORIGEN, file))
    .resize(300, 300, { fit: "cover" })
    .toFile(path.join(DESTINO, file))
    .then(() => console.log("✔ Thumbnail creado:", file))
    .catch(err => console.error("✖ Error:", file, err));
});
