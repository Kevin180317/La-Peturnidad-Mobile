import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import cors from "cors";
import express from "express";
import multer from "multer";
import mysql from "mysql2";

const app = express();
const PORT = 3000;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "la_peturnidad",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar a MySQL:", err.message);
    process.exit(1);
  }
  console.log("✅ Conexión a MySQL exitosa");

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: "okhuysen", // tu cloud name
  api_key: "956224944828959", // tu API key
  api_secret: "2FogrBLtjRGOCnjuxsC2IXGFLgg", // tu API secret
  secure: true,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

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
      up.postal_code,
      up.profile_picture_url
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

app.put("/api/user-profile-picture", (req, res) => {
  const { email, imageUrl } = req.body;

  if (!email || !imageUrl) {
    return res.status(400).json({ error: "Email e imagen son requeridos" });
  }

  const sql = `
    UPDATE user_profiles 
    JOIN users ON user_profiles.user_id = users.id
    SET user_profiles.profile_picture_url = ?
    WHERE users.email = ?
  `;

  db.query(sql, [imageUrl, email], (err, result) => {
    if (err) {
      console.error("❌ Error al guardar imagen:", err.message);
      return res.status(500).json({ error: "Error al guardar la imagen" });
    }

    res.json({ message: "Imagen de perfil guardada exitosamente" });
  });
});

app.post("/api/pet", (req, res) => {
  const { email, type, name, color, size, features, photoUrl } = req.body;

  if (!email || !type || !name || !color || !size) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  // Buscar el user_id por email
  db.query("SELECT id FROM users WHERE email = ?", [email], (err, users) => {
    if (err) {
      console.error("❌ Error al buscar usuario:", err.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userId = users[0].id;

    // Insertar la mascota CON foto
    db.query(
      `INSERT INTO pets (user_id, type, name, color, size, features, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, name, color, size, features || null, photoUrl || null],
      (err, result) => {
        if (err) {
          console.error("❌ Error al guardar mascota:", err.message);
          return res.status(500).json({ error: "Error al guardar mascota" });
        }

        res.status(201).json({
          message: "Mascota registrada correctamente",
          petId: result.insertId,
        });
      }
    );
  });
});

app.get("/api/pets", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requerido" });

  db.query("SELECT id FROM users WHERE email = ?", [email], (err, users) => {
    if (err) return res.status(500).json({ error: "Error interno" });
    if (users.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const userId = users[0].id;
    db.query(
      "SELECT * FROM pets WHERE user_id = ? ORDER BY id DESC",
      [userId],
      (err, pets) => {
        if (err)
          return res.status(500).json({ error: "Error al obtener mascotas" });
        res.json(pets);
      }
    );
  });
});

app.post("/api/send-emergency", async (req, res) => {
  const { email, colonia, pet } = req.body;

  if (!email || !colonia || !pet) {
    return res.status(400).json({ error: "Datos incompletos." });
  }

  // Insertar el reporte en la tabla emergency_alerts
  const insertQuery = `
    INSERT INTO emergency_alerts 
      (user_id, pet_name, type, description, last_seen_location, disappearance_date, image_url, created_at)
    VALUES
      (
        (SELECT id FROM users WHERE email = ?), 
        ?, ?, ?, ?, ?, ?, NOW()
      )
  `;

  // Asegúrate de que pet contenga las propiedades: name, type, description, last_seen_location, disappearance_date, image_url
  db.query(
    insertQuery,
    [
      email,
      pet.name,
      pet.type,
      pet.features || null,
      colonia || null,
      pet.disappearance_date || new Date().toISOString().slice(0, 10),
      pet.image_url || null,
    ],
    (insertErr) => {
      if (insertErr) {
        console.error("Error guardando emergencia:", insertErr);
        return res.status(500).json({ error: "Error guardando emergencia." });
      }

      // Después de guardar, enviar notificaciones push
      db.query(
        `SELECT u.push_token
   FROM users u
   JOIN user_profiles up ON up.user_id = u.id
   WHERE up.address = ? AND u.email != ? AND u.push_token IS NOT NULL`,
        [colonia, email],
        async (err, users) => {
          if (err) return res.status(500).json({ error: "Error en DB." });

          const tokens = users.map((u) => u.push_token);

          if (tokens.length === 0) {
            return res
              .status(200)
              .json({ message: "No hay vecinos con Expo push." });
          }

          const messages = tokens.map((token) => ({
            to: token,
            sound: "default",
            title: `⚠️ Mascota perdida: ${pet.name}`,
            body: `Un vecino de tu colonia reportó a su ${pet.type} perdido.`,
            data: { petId: pet.id },
          }));

          try {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(messages),
            });

            res
              .status(200)
              .json({ message: "Emergencia guardada y notificación enviada" });
          } catch (err) {
            console.error("Expo push error:", err.message);
            res.status(500).json({ error: "Error al enviar notificación." });
          }
        }
      );
    }
  );
});

app.get("/api/emergency", (req, res) => {
  db.query(
    `SELECT ea.*, u.email
     FROM emergency_alerts ea
     JOIN users u ON ea.user_id = u.id
     ORDER BY ea.created_at DESC`,
    (err, alerts) => {
      if (err) {
        console.error("❌ Error al obtener alertas:", err.message);
        return res.status(500).json({ error: "Error al obtener alertas" });
      }

      res.json(alerts);
    }
  );
});

app.put("/api/save-push-token", (req, res) => {
  const { email, push_token } = req.body;

  if (!email || !push_token) {
    return res.status(400).json({ error: "Faltan datos." });
  }

  db.query(
    "UPDATE users SET push_token = ? WHERE email = ?",
    [push_token, email],
    (err) => {
      if (err) return res.status(500).json({ error: "Error en DB." });
      res.status(200).json({ message: "Push token guardado." });
    }
  );
});

app.get("/api/lost-pets", (req, res) => {
  const { colonia } = req.query;
  if (!colonia) return res.status(400).json({ error: "Colonia requerida" });

  db.query(
    "SELECT * FROM emergency_alerts WHERE last_seen_location = ? ORDER BY created_at DESC",
    [colonia],
    (err, pets) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Error al obtener mascotas perdidas" });
      res.json(pets);
    }
  );
});

app.get("/api/pets/recovery", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Falta el user_id en la consulta" });
  }

  const query = `
    SELECT *
    FROM emergency_alerts
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error(
        "❌ Error al obtener mascotas en recuperación:",
        err.message
      );
      return res
        .status(500)
        .json({ error: "Error al obtener mascotas en recuperación" });
    }

    res.json(results);
  });
});

app.post("/api/i-found-a-pet", (req, res) => {
  const { pet_id, user_id } = req.body;

  if (!pet_id || !user_id) {
    return res.status(400).json({ error: "pet_id y user_id son requeridos" });
  }

  db.query(
    "INSERT INTO found_pets (pet_id, user_id) VALUES (?, ?)",
    [pet_id, user_id],
    (err, result) => {
      if (err) {
        console.error(
          "❌ Error al marcar mascota como encontrada:",
          err.message
        );
        return res
          .status(500)
          .json({ error: "Error al marcar mascota como encontrada" });
      }
      res.json({ message: "Mascota marcada como encontrada" });
    }
  );
});

app.get("/api/found-pets/:owner_id", (req, res) => {
  const { owner_id } = req.params;

  if (!owner_id) {
    return res.status(400).json({ error: "Falta el owner_id en la consulta" });
  }

  const query = `
    SELECT 
      fp.id AS found_pet_id,
      fp.user_id AS finder_user_id,
      fp.pet_id,
      
      ea.id AS alert_id,
      ea.user_id AS owner_user_id,
      ea.pet_name,
      ea.type,
      ea.description,
      ea.last_seen_location,
      ea.disappearance_date,
      ea.image_url,
      ea.created_at AS alert_created_at,
      
      up.id AS profile_id,
      up.user_id,
      up.first_name,
      up.last_name,
      up.phone,
      up.birth_date,
      up.address,
      up.city,
      up.postal_code,
      up.profile_picture_url
    FROM found_pets fp
    INNER JOIN emergency_alerts ea 
      ON fp.pet_id = ea.id
    INNER JOIN user_profiles up 
      ON fp.user_id = up.user_id
    WHERE ea.user_id = ?
  `;

  db.query(query, [owner_id], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener mascotas encontradas:", err.message);
      return res
        .status(500)
        .json({ error: "Error al obtener mascotas encontradas" });
    }
    res.json(results);
  });
});

app.delete("/api/emergency-alert", (req, res) => {
  const { email, petName, petType } = req.body;

  if (!email || !petName || !petType) {
    return res.status(400).json({
      error: "Email, nombre de mascota y tipo son requeridos",
    });
  }

  // Primero obtén la colonia del usuario que reportó la mascota
  const getColoniaQuery = `
    SELECT up.address 
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    WHERE u.email = ?
  `;

  db.query(getColoniaQuery, [email], (errColonia, resultsColonia) => {
    if (errColonia || resultsColonia.length === 0) {
      console.error("❌ Error al obtener colonia:", errColonia?.message);
      return res
        .status(500)
        .json({ error: "Error al obtener datos del usuario" });
    }

    const colonia = resultsColonia[0].address;

    // Ahora eliminar la alerta
    const deleteQuery = `
      DELETE FROM emergency_alerts 
      WHERE user_id = (SELECT id FROM users WHERE email = ?) 
        AND pet_name = ? 
        AND type = ?
    `;

    db.query(deleteQuery, [email, petName, petType], (err, result) => {
      if (err) {
        console.error("❌ Error al eliminar alerta:", err.message);
        return res.status(500).json({ error: "Error al eliminar la alerta" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "No se encontró la alerta" });
      }

      // Obtener tokens push de vecinos (menos el que hizo la acción)
      const getTokensQuery = `
        SELECT u.push_token
        FROM users u
        JOIN user_profiles up ON up.user_id = u.id
        WHERE up.address = ? AND u.email != ? AND u.push_token IS NOT NULL
      `;

      db.query(getTokensQuery, [colonia, email], async (errTokens, users) => {
        if (errTokens) {
          console.error("❌ Error al obtener tokens:", errTokens.message);
          // Aún así respondemos OK porque se eliminó la alerta
          return res.json({
            message:
              "Mascota marcada como recuperada. Error al enviar notificaciones.",
            success: true,
          });
        }

        const tokens = users.map((u) => u.push_token);

        if (tokens.length === 0) {
          return res.json({
            message:
              "Mascota marcada como recuperada. No hay vecinos con Expo push.",
            success: true,
          });
        }

        const messages = tokens.map((token) => ({
          to: token,
          sound: "default",
          title: `✅ Mascota recuperada: ${petName}`,
          body: `Un vecino de tu colonia marcó como recuperada a su ${petType}.`,
          data: { petName, petType },
        }));

        try {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messages),
          });

          res.json({
            message: "Mascota marcada como recuperada y notificación enviada",
            success: true,
          });
        } catch (pushError) {
          console.error("Expo push error:", pushError.message);
          res.json({
            message:
              "Mascota marcada como recuperada. Error al enviar notificaciones.",
            success: true,
          });
        }
      });
    });
  });
});
