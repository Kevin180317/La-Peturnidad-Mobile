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

// Obtener perfil completo por email
app.get("/api/user-profile", (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "El email es requerido" });
  }

  const sql = `
    SELECT 
      up.id,
      up.user_id,
      up.first_name,
      up.last_name,
      up.phone,
      up.birth_date,
      up.address,
      up.city,
      up.created_at,
      up.updated_at,
      up.postal_code
    FROM user_profiles up
    JOIN users u ON up.user_id = u.id
    WHERE u.email = ?
  `;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener perfil:", err.message);
      return res.status(500).json({ error: "Error al obtener perfil" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Perfil no encontrado" });
    }

    res.json(results[0]);
  });
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

// Modificar ruta de login para verificar usuarios completos
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email y password son obligatorios" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("❌ Error en SELECT:", err.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];

    // Comparar contraseña
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("❌ Error en bcrypt compare:", err.message);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      if (!isMatch) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      // Login exitoso: devolvemos is_complete
      res.json({
        message: "Login exitoso",
        userId: user.id,
        email: user.email,
        is_complete: user.is_complete, // 👈 esto es clave
      });
    });
  });
});

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

      // Insertar usuario con estado pendiente
      db.query(
        "INSERT INTO users (email, password, is_complete) VALUES (?, ?, 0)",
        [email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error("❌ Error en INSERT:", err.message);
            return res.status(500).json({ error: "Error al guardar usuario" });
          }

          return res.status(201).json({
            message: "Usuario registrado correctamente",
            userId: result.insertId,
            requiresProfile: true,
          });
        }
      );
    });
  });
});

// Ruta para completar perfil de usuario (registro extendido) - TRANSACCIONAL
app.post("/api/register-extended", (req, res) => {
  const {
    email,
    firstName,
    lastName,
    phone,
    birthDate,
    address, // <- aquí llega la colonia desde el frontend
    postalCode, // <- nuevo campo
    city,
  } = req.body;

  // Validar campos obligatorios
  if (!email || !firstName || !lastName || !phone) {
    return res.status(400).json({
      error: "Email, nombre, apellido y teléfono son obligatorios",
    });
  }

  // Iniciar transacción
  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error al iniciar transacción:", err.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Buscar el usuario por email
    db.query(
      "SELECT id, is_complete FROM users WHERE email = ?",
      [email],
      (err, rows) => {
        if (err) {
          return db.rollback(() => {
            console.error("❌ Error en SELECT users:", err.message);
            res.status(500).json({ error: "Error interno del servidor" });
          });
        }

        if (rows.length === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: "Usuario no encontrado" });
          });
        }

        const userId = rows[0].id;

        // Convertir fecha de nacimiento si existe
        let formattedBirthDate = null;
        if (birthDate) {
          // El formato ya viene como DD/MM/YYYY del frontend
          const dateParts = birthDate.split("/");
          if (dateParts.length === 3) {
            formattedBirthDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          }
        }

        // Crear perfil del usuario
        db.query(
          `INSERT INTO user_profiles (user_id, first_name, last_name, phone, birth_date, postal_code, address, city)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            firstName,
            lastName,
            phone,
            formattedBirthDate,
            postalCode,
            address,
            city,
          ],

          (err, result) => {
            if (err) {
              return db.rollback(() => {
                console.error("❌ Error en INSERT user_profiles:", err.message);
                res.status(500).json({ error: "Error al crear perfil" });
              });
            }

            // Marcar usuario como completo
            db.query(
              "UPDATE users SET is_complete = 1 WHERE id = ?",
              [userId],
              (err, updateResult) => {
                if (err) {
                  return db.rollback(() => {
                    console.error("❌ Error en UPDATE users:", err.message);
                    res
                      .status(500)
                      .json({ error: "Error al completar registro" });
                  });
                }

                // Confirmar transacción
                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error("❌ Error en commit:", err.message);
                      res
                        .status(500)
                        .json({ error: "Error al confirmar registro" });
                    });
                  }

                  res.status(201).json({
                    message: "Registro completado exitosamente",
                    userId: userId,
                    profileId: result.insertId,
                  });
                });
              }
            );
          }
        );
      }
    );
  });
});

// Ruta para limpiar usuarios incompletos (tarea de mantenimiento)
app.delete("/api/cleanup-incomplete-users", (req, res) => {
  // Eliminar usuarios que no completaron su registro después de 24 horas
  db.query(
    `DELETE FROM users 
     WHERE is_complete = 0 
     AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    (err, result) => {
      if (err) {
        console.error("❌ Error en cleanup:", err.message);
        return res.status(500).json({ error: "Error en limpieza" });
      }

      res.json({
        message: "Limpieza completada",
        deletedUsers: result.affectedRows,
      });
    }
  );
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
