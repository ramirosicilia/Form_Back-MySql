// Imports y configuración
import {
  creacionUsuarios,
  actualizarTokenEnBD,
  verificarEmailToken,
  obtenerInfo,
  LoginModel,
  validarContraseña,
  elimininarUsuario,
} from "../model/Db.js";
import { validarReenvio } from "../email/ReenvioMail.js";
import { emailBorrado } from "../email/MailEliminacion.js";
import { validarMail } from "../email/EmailEnvio.js";
import multer from "multer";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import cookieParser from "cookie-parser";

import dotenv from "dotenv";

dotenv.config();

const urlBack = process.env.URL_B;
const urlFront = process.env.URL_F; 

console.log(urlBack) 
console.log(urlFront)

// Configuración de multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploaddirectorio = path.join(__dirname, "../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploaddirectorio);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage: storage });

// Controlador para crear usuario

export const respuestaInsercion = async (req, res) => {
  try {
    const { nombre, apellido, email, usuarios, contrasena } = req.body;
    const imagen = req.file ? req.file.filename : null;
    const url = imagen ? `${urlBack}/uploads/${imagen}` : null;
    console.log(imagen, url);
    const pass = await bcrypt.hash(contrasena, 10);
    const input = { nombre, apellido, email, usuarios, pass };

    if (!nombre || !apellido || !email || !usuarios || !pass) {
      return res.status(400).json({ error: "Campos vacíos" });
    }

    const resultadoInsercion = await creacionUsuarios(input, url);

    console.log(resultadoInsercion);

    if (!Array.isArray(resultadoInsercion)) {
      return res.status(500).json({ error: "Formato de retorno inesperado" });
    }

    const [, , resultado] = resultadoInsercion;

    const tokeMail = jwt.sign({ email }, process.env.JWT_SECRET_EMAIL, {
      expiresIn: "1h",
    });
    await validarMail(email, tokeMail);

    console.log(resultado[0].nombre);

    res.json(resultado[0].nombre);
  } catch (err) {
    console.error("Error al recibir los datos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Controlador para verificar email
export const verificarMailControlador = async (req, res) => {
  const { token } = req.params;
  try {
    const verificacion = jwt.verify(token, process.env.JWT_SECRET_EMAIL);
    const verificado = await verificarEmailToken(verificacion);

    console.log(verificado);

    res.redirect(`${urlFront}/login`);
  } catch (err) {
    console.error("Error en la verificación:", err);
    res.status(500).json({ error: "Error en la verificación del correo" });
  }
};

// Controlador para obtener usuarios

export async function obtenerUser(req, res) {
  try {
    const usuario = await obtenerInfo();
    return res.json({usuario});
  } catch (err) {
    res.json({ ok: "error" });
  }
}

export const loginController = async (req, res) => {
  const { userInto, passwordInto } = req.body; 
  console.log(userInto,passwordInto)
 
  try {
    // Obtén los datos del usuario
    const passOne = await LoginModel(userInto); // No pasamos token aún 
    

    // Si no se encontró el usuario
    if (!passOne) {
      return res.status(404).json({ err: "Usuario no encontrado" });
    }

    // Verifica la contraseña
    const verificarPass = await bcrypt.compare(
      passwordInto,
      passOne.contrasenas
    );
    if (!verificarPass) {
      return res.status(400).json({ err: "Contraseña incorrecta" });
    }

    // Genera el token
    const token = jwt.sign(
      { id: passOne.uuid, usuarios: userInto },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Actualiza el token en la base de datos
    await actualizarTokenEnBD(token, passOne.uuid);

    // Establece la cookie con el token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });
 
    // Responde con éxito
    res.status(200).json({ respuesta: `${urlFront}/obtener-info`, token });
  } catch (err) {
    console.error("Error al recibir los datos de la base de datos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const validarController = async (req, res) => {
  const { contraseña1, contraseña2, ingresoUsuario, nuevoUsuario } = req.body;

  if (contraseña1 !== contraseña2) {
    return res.status(400).json({ err: "Las contraseñas no coinciden" });
  }

  try {
    const contraseñaHaseada = await bcrypt.hash(contraseña1, 10);
    const datos = await validarContraseña(
      contraseñaHaseada,
      nuevoUsuario,
      ingresoUsuario
    );

    if (!Array.isArray(datos) || datos.length === 0) {
      return res
        .status(400)
        .json({ err: "No se encontraron datos de usuario" });
    }

    const [email] = datos;

    const tokenRecuperacion = jwt.sign(
      { email: email[0] },
      process.env.JWT_RECUPERACION_MAIL,
      { expiresIn: "1h" }
    );
    console.log(tokenRecuperacion);

    await validarReenvio(tokenRecuperacion, email[0].email);

    const token = jwt.sign(
      { usuarios: ingresoUsuario },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log(token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({ ok: true, token });
  } catch (err) {
    console.error("Error al recibir los datos de la base de datos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const eliminarController = async (req, res) => {
  const { usuarioDelete, passwordDelete } = req.query;

  try {
    const usereliminado = await elimininarUsuario(usuarioDelete);
    console.log(usereliminado);
    if (!usereliminado.length) {
      return res.status(404).json({ err: "usuario no encontrado" });
    }
    const passWordEliminar = usereliminado[0].contrasenas;
    console.log(passWordEliminar);

    const verificacion = await bcrypt.compare(passwordDelete, passWordEliminar);
    if (!verificacion) {
      return res.status(404).json({ err: "La contraseña no coincide" });
    }

    const email = usereliminado[0].email; // Asegúrate de acceder al primer objeto del array
    const Token = jwt.sign({ email }, process.env.JWT_BORRADO, {
      expiresIn: "1h",
    });
    console.log("Token generado:", Token);

    await emailBorrado(Token, email);

    console.log(email);

    console.log(res.status(200).json({ res: "Respuesta exitosa" }));
  } catch (err) {
    console.error(
      "Error al querer eliminar el usuario de la base de datos:",
      err
    );
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
