
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv";
dotenv.config();

const pool = await mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

const uuid = uuidv4();

export async function creacionUsuarios(input, url) {
    let { nombre, apellido, email, usuarios, pass } = input;

    try {
        const [existentes] = await pool.query("SELECT usuarios, email FROM empleados WHERE usuarios=? OR email=?", [usuarios, email]);

        if (existentes.length > 0) {
            return { status: 400, json: { err: "Usuario o email  ya existenten" } };
        }
        


        const [row] = await pool.query("INSERT INTO empleados (uuid, nombre, apellido, usuarios, imagenes, contrasenas, email) VALUES (?, ?, ?, ?, ?, ?, ?)", [uuid, nombre, apellido, usuarios, url, pass, email]);
        const [result] = await pool.query("SELECT nombre FROM empleados WHERE uuid=?", [uuid]);

        return [existentes,row, result];
    } catch (err) {
        console.log('Hubo un error en las consultas a la base de datos', err);
    }
}

export async function verificarEmailToken(verificacion) {
    try {
        const [emailResult] = await pool.query("SELECT email FROM empleados WHERE email=?", [verificacion.email]);

        if (!emailResult.length) {
            return { status: 400, json: { err: 'Usuario no encontrado' } };
        }

           await pool.query("UPDATE empleados SET verificado = true WHERE email=?", [verificacion.email]);

      
    } catch (error) {
        console.error('Error en la verificación:', error.message);
        return { status: 403, json: { err: 'Token no válido o expirado' } };
    }
}


export async function LoginModel(usuario) {
    try {
        // Realiza la consulta
        const [result] = await pool.query(
            "SELECT uuid, contrasenas FROM empleados WHERE usuarios = ?",
            [usuario]
        );

        // Si no se encuentra el usuario
        if (result.length === 0) {
            return null;
        }

        return result[0]; // Devuelve el usuario encontrado
    } catch (err) {
        console.error('Error en el login:', err.message);
        throw new Error('Error en la base de datos');
    }
} 



export async function actualizarTokenEnBD(token, uuid) {
    try {
        await pool.query(
            "UPDATE empleados SET token = ? WHERE uuid = ?",
            [token, uuid]
        );
    } catch (err) {
        console.error('Error al actualizar el token en la base de datos:', err.message);
        throw new Error('Error al actualizar el token');
    }
}


export async function validarContraseña(contraseña, nuevoUsuario, ingresoUsuario, token) {
    try {
        await pool.query("UPDATE empleados SET contrasenas=?, usuarios=? WHERE usuarios=?", [contraseña, nuevoUsuario, ingresoUsuario]);
        const [usuario] = await pool.query("SELECT uuid FROM empleados WHERE usuarios=?", [nuevoUsuario]);

        if (!usuario.length) {
            return { status: 404, json: { err: 'Usuario no encontrado' } };
        }

        const [email] = await pool.query("SELECT email FROM empleados WHERE usuarios=?", [nuevoUsuario]);
        const [actualizarToken] = await pool.query("UPDATE empleados SET token=? WHERE uuid=?", [token, usuario[0].uuid]);

        return [email, actualizarToken];
    } catch (error) {
        console.error('Error al actualizar la contraseña:', error.message);
        return { status: 500, json: { err: 'Error al actualizar la contraseña' } };
    }
}

export async function elimininarUsuario(eliminar) {
    try {
        const [user] = await pool.query("SELECT usuarios, contrasenas, email FROM empleados WHERE usuarios=?", [eliminar]);

        if (user.length === 0) {
            return { status: 404, json: { err: 'No se encontró el usuario' } };
        }

        return user;
    } catch (err) {
        return { status: 500, json: { err: 'Ocurrió un error' } };
    }
} 

export async function emailModelDelete(verificacion) {
    try {
      const result = await pool.query("DELETE FROM empleados WHERE email = ?", [verificacion.email]);
      return result;  // O puedes manejar el resultado como necesites
    } catch (error) {
      console.error("Error al eliminar el empleado:", error);
      throw error;  // Lanza el error para que sea manejado fuera de la función si es necesario
    }
  } 

  export async function obtenerInfo() {  
   
    try {
        const [usuarios] = await pool.query("SELECT * FROM empleados"); 
        console.log(usuarios)

        if (!usuarios.length) {
            return { status: 400, send: 'No se encontraron los usuarios' };
        } 
 

        return usuarios; 
    
    } catch (err) {
        return { status: 500, send: 'Hubo un error al recibir los usuarios' };
    } 

} 


