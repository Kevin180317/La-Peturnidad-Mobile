import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import cors from "cors";
import express from "express";
import multer from "multer";
import mysql from "mysql2";

const app = express();
const PORT = 3000;

// Conexión directa a MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "la_peturnidad",
});

// Verificar conexión a MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar a MySQL:", err.message);
    process.exit(1);
  }
  console.log("✅ Conexión a MySQL exitosa");

  // Iniciar servidor solo si se conectó correctamente
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: "okhuysen", // tu cloud name
  api_key: "956224944828959", // tu API key
  api_secret: "2FogrBLtjRGOCnjuxsC2IXGFLgg", // tu API secret
  secure: true,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("¡Hola, mundo! Servidor funcionando correctamente.");
});
// Ruta para registrar usuarios
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y password son obligatorios" });
  }

  // Verificar si el usuario ya existe
  db.query("SELECT id FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("❌ Error en SELECT:", err.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (rows.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Hashear la contraseña
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error("❌ Error al hashear:", err.message);
        return res.status(500).json({ error: "Error al procesar contraseña" });
      }

      // Insertar usuario
      db.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error("❌ Error en INSERT:", err.message);
            return res.status(500).json({ error: "Error al guardar usuario" });
          }

          return res
            .status(201)
            .json({ message: "Usuario registrado correctamente" });
        }
      );
    });
  });
});

// Ruta para login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email y password son obligatorios" });

  // Buscar usuario por email
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("❌ Error en SELECT:", err.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];

    // Comparar password con bcrypt
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("❌ Error en bcrypt compare:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      if (!isMatch) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      // Login exitoso
      res.json({
        message: "Login exitoso",
        userId: user.id,
        email: user.email,
      });
    });
  });
});

app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha subido ninguna imagen" });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "peturnidad",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    res.json({
      message: "Imagen subida exitosamente",
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen:", error.message);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
});
