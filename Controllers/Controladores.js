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
import { createClient } from "@supabase/supabase-js"; 



dotenv.config();

const urlBack = process.env.URL_B;
const urlFront = process.env.URL_F;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

 const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

 
 
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
      const { nombre, apellido, email, usuario, contrasena } = req.body; 
      const imagen = req.file ? req.file.filename : null;
      const url = imagen ? `${urlBack}/uploads/${imagen}` : null;
      const pass = await bcrypt.hash(contrasena, 10);


      if (!nombre || !apellido || !email || !usuario || !pass) {
          return res.status(400).json({ error: "Campos vacíos" });
      }

 
      // Usando Supabase para insertar el nuevo usuario
      const  data = await supabase.from('empleado').insert([{nombre:nombre,apellido:apellido,usuario:usuario,email:email,contrasena:pass,imagenes:url}])
      
       
    
        console.log(data) 
     
     

     

      const tokenMail = jwt.sign({ email }, process.env.JWT_SECRET_EMAIL, { expiresIn: "1h" }); 
      console.log(tokenMail ,)
      await validarMail(email, tokenMail); 

      res.json({nombre:nombre});
  } catch (err) {
      console.error("Error al insertar usuario:", err);
      res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Controlador para verificar email
export const verificarMailControlador = async (req, res) => {
  const { token } = req.params;

  try {
    // Verify the JWT token
    const verificacion = jwt.verify(token, process.env.JWT_SECRET_EMAIL);
    const { email } = verificacion;

    // Check for existing email (efficient single query)
    const { data: empleado, error } = await supabase
      .from('empleado')
      .select('email')
      .eq('email', email)


    if (error) {
      return res.status(400).json({ error: 'Email no encontrado' });
    }

    // Update empleado (assuming 'verificado' is a boolean column)
    const { error: updateError } = await supabase
      .from('empleado')
      .update({ verificado: true })
      .eq('email', email);

    if (updateError) {
      // Handle update errors (e.g., database connectivity issues)
      return res.status(500).json({ error: 'Error al verificar el email' });
    }

    res.redirect(`${process.env.URL_F}/login`);
  } catch (err) {
    console.error(err); // Log errors for debugging
    return res.status(500).json({ error: 'Error inesperado' });
  }
};



// Controlador de login
export const loginController = async (req, res) => {
  const { userInto, passwordInto } = req.body;
  try {
    const { data, error } = await supabase
      .from('empleado')
      .select()
      .eq('usuario', userInto);

    if (error || !data.length) {
      return res.status(404).json({ err: "Usuario no encontrado" });
    }

    const { contrasena, id } = data[0]; 
    console.log(passwordInto)
   console.log(contrasena)
    const verificarPass = await bcrypt.compare(passwordInto, contrasena);
    if (!verificarPass) {
      return res.status(400).json({ err: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id, usuario: userInto }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Actualiza el token en la base de datos 
    const { datos } = await supabase
    .from('empleado')
    .update({ token: token})
    .eq('id', id)
    .select();



    res.cookie("token", token, {
      httpOnly:true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({ respuesta: `${urlFront}/obtener-info`, token });
  } catch (err) {
    console.error("Error al recibir los datos de la base de datos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}; 

export async function obtenerUser(req, res) {
  try {
    const { data, error } = await supabase
      .from('empleado')
      .select("*");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ usuarios: data });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
}

// Controlador de validación
export const validarController = async (req, res) => {
  const { contraseña1, contraseña2, ingresoUsuario, nuevoUsuario } = req.body;

  if (contraseña1 !== contraseña2) {
    return res.status(400).json({ err: "Las contraseñas no coinciden" });
  }

  try {
    const contraseñaHaseada = await bcrypt.hash(contraseña1, 10);
    const datos = await validarContraseña(contraseñaHaseada, nuevoUsuario, ingresoUsuario); 
    console.log(datos,'yyyyyyyyyyyyyy')

    if (!Array.isArray(datos) || datos.length === 0) {
      return res.status(400).json({ err: "No se encontraron datos de usuario" });
    }

    const [email] = datos; 
    console.log(email,'7777777777777777')

    /*if (!email || !email.email) {
      return res.status(400).json({ err: "Email no encontrado o inválido" });
    }*/

    const tokenRecuperacion = jwt.sign({ email: email }, process.env.JWT_RECUPERACION_MAIL, { expiresIn: "1h" }); 
     console.log(tokenRecuperacion,'643266')
  
    await validarReenvio(tokenRecuperacion, email);

    const token = jwt.sign({ usuario: ingresoUsuario }, process.env.JWT_SECRET, { expiresIn: "1h" });

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

// Controlador para eliminar usuario
export const eliminarController = async (req, res) => {
  const { usuarioDelete } = req.query; 
  const { password } = req.body; 

  try { 

 
    const { data, error } = await supabase
      .from('empleado')
      .select()
      .eq('usuario', usuarioDelete); 


    if (error) {
      return res.status(400).json({ err: 'Usuario no encontrado' });
    } 

    const { contrasena:pass, email } = data[0]; 
    console.log(pass)
 


    
    const verificacion = await bcrypt.compare(password,pass); 
    console.log(verificacion)

    if(!verificacion){
      return res.json({err:'contraseña invalida, vamos no te desanimes'})
    }
    

    const token = jwt.sign({ email }, process.env.JWT_BORRADO, { expiresIn: "1h" });
    await emailBorrado(token, email);

    

    res.status(200).json({ res: "Usuario eliminado con éxito" });
  } catch (err) {
    console.error("Error al querer eliminar el usuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


