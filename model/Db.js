
/*import mysql from "mysql2/promise";*/
import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv"; 
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient() 





dotenv.config();

/*const pool = await mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});*/

const uuid = uuidv4();

export async function creacionUsuarios(input, url) {
    let { nombre, apellido, email, usuario, pass } = input; 
    console.log(nombre, apellido, email, usuario, pass )

    /*try {
        const [existentes] = await pool.query("SELECT usuarios, email FROM empleados WHERE usuarios=? OR email=?", [usuarios, email]);

        if (existentes.length > 0) {
            return { status: 400, json: { err: "Usuario o email  ya existenten" } };
        }
        


        const [row] = await pool.query("INSERT INTO empleados (uuid, nombre, apellido, usuarios, imagenes, contrasenas, email) VALUES (?, ?, ?, ?, ?, ?, ?)", [uuid, nombre, apellido, usuarios, url, pass, email]);
        const [result] = await pool.query("SELECT nombre FROM empleados WHERE uuid=?", [uuid]);

        return [existentes,row, result];
    } */ 
        try {
            // Buscar si existe un usuario o email ya registrado
            const existente = await prisma.empleado.findFirst({
              where: {
                OR: [
                  { usuario: usuario },
                  { email: email }
                ]
              }
            });
        
            console.log(existente);
        
            if (existente) {
              return { status: 400, json: { err: "Usuario o email ya existente" } };
            }
        
            // Crear el nuevo usuario
            const row = await prisma.empleado.create({
              data: { 
                id:uuid,
                nombre,
                apellido, // Corregido
                usuario,
                contrasena: pass, // Corregido 
                email,
                imagenes: url,
                token:null,
                verificado:null
              }
            });
        
            console.log(row);
        
            // Seleccionar el nombre del usuario creado
            const result = await prisma.empleado.findUnique({
                where: {
                    id: row.id // Asegúrate de que `row.id` sea correcto
                },
                select: {
                    nombre: true
                }
            });
            
            console.log(result); // Verifica si `result` tiene la propiedad 'nombre'
            
            if (!result) {
                return { status: 500, json: { err: "No se pudo obtener el nombre del usuario." } };
            }  

            return { result: result.nombre };

        } 


   
        catch (err) {
        console.log('Hubo un error en las consultas a la base de datos', err);
    }
}

export async function verificarEmailToken(email) {
    /*try {
        const [emailResult] = await pool.query("SELECT email FROM empleados WHERE email=?", [verificacion.email]);

        if (!emailResult.length) {
            return { status: 400, json: { err: 'Usuario no encontrado' } };
        }

           await pool.query("UPDATE empleados SET verificado = true WHERE email=?", [verificacion.email]);

      
    } */   

           console.log('vamos rama vos podes')
           try {
            // Verificación de existencia del email en la base de datos
            const emailResult = await prisma.empleado.findUnique({
              where: { email: email },
              select: { email: true }
            });
        
            if (!emailResult) {
              return { status: 400, json: { err: 'Usuario no encontrado' } };
            }
        
            // Actualización del estado de verificación a 'true'
            await prisma.empleado.update({
              where: { email: email },
              data: { verificado: true }
            });
        
            return { status: 200, json: { msg: 'Correo verificado correctamente' } };
        
          }
   
        catch (error) {
        console.error('Error en la verificación:', error.message);
        return { status: 403, json: { err: 'Token no válido o expirado' } };
    }
}


export async function LoginModel(usuario) {
    /*try {
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
    }*/  

         try{   

            console.log('gggg')
            const result= await prisma.empleado.findUnique({
                where:{ 
                    usuario:usuario

                }, 
                select:{
                    id:true,
                    contrasena:true,
                    usuario:true

                } 
            }) 

            console.log({a:result.usuario,b:result.contrasena,c:result.id})

            return { 
                usuario:result.usuario,
               contrasena:result.contrasena,
                id:result.id

            }

         } 

       catch (err) {
        console.error('Error en el login:', err.message);
        throw new Error('Error en la base de datos');
    }
} 



export async function actualizarTokenEnBD(id, nuevoToken) {
    try {
        if (!id) {
            throw new Error('El ID no está definido. No se puede actualizar el token.');
        }
           console.log('guacho')
        const resultado = await prisma.empleado.update({
            where: {
                id: id// Asegúrate de pasar un ID válido
            },
            data: {
                token: nuevoToken
            }
        }); 

        console.log({resultado}+'555555')

        return resultado;
    } catch (err) {
        console.error('Error al actualizar el token en la base de datos:', err.message);
        throw new Error('Error al actualizar el token');
    }
}



export async function validarContraseña(contraseña, nuevoUsuario, ingresoUsuario, token) {
    /*try {
        await pool.query("UPDATE empleados SET contrasenas=?, usuarios=? WHERE usuarios=?", [contraseña, nuevoUsuario, ingresoUsuario]);
        const [usuario] = await pool.query("SELECT uuid FROM empleados WHERE usuarios=?", [nuevoUsuario]);

        if (!usuario.length) {
            return { status: 404, json: { err: 'Usuario no encontrado' } };
        }

        const [email] = await pool.query("SELECT email FROM empleados WHERE usuarios=?", [nuevoUsuario]);
        const [actualizarToken] = await pool.query("UPDATE empleados SET token=? WHERE uuid=?", [token, usuario[0].uuid]);

        return [email, actualizarToken];
    }*/
        try{  

            await prisma.empleado.update({
                 where:{
                    usuario:ingresoUsuario
                 } ,
                 data:{ 
                    contrasena:contraseña,
                    usuario:nuevoUsuario


                 }
            }) 

            const usuario=await prisma.empleado.findUnique({
                where:{
                    usuario:nuevoUsuario
                }, 
                select:{
                    id:true
                }
            }) 

            if (!usuario) {
                return { status: 404, json: { err: 'Usuario no encontrado' } };
            } 

            const email= await prisma.empleado.findUnique({ 
                where:{
                    usuario:nuevoUsuario
                }, 
                select:{
                    email:true
                }

            }) 

            const actualizarToken= await prisma.empleado.update({ 
                where:{
                    id:usuario.id
                }, 
                data:{
                    token:token
                }

            }) 

            return [email, actualizarToken]


        }
        catch (error) {
        console.error('Error al actualizar la contraseña:', error.message);
        return { status: 500, json: { err: 'Error al actualizar la contraseña' } };
    }
}

export async function elimininarUsuario(eliminar) {
    /*try {
        const [user] = await pool.query("SELECT usuarios, contrasenas, email FROM empleados WHERE usuarios=?", [eliminar]);

        if (user.length === 0) {
            return { status: 404, json: { err: 'No se encontró el usuario' } };
        }

        return user;
    }*/ 

        try { 
          
            console.log(eliminar+'55555555')
            // Verificar si el usuario existe
            const user = await prisma.empleado.findUnique({  

                where: {
                    usuario: eliminar // O cualquier criterio relevante
                },
                
                select: {
                  usuario: true,
                  contrasena:true,
                  email:true
                }
              });
       
            console.log(user.contrasena,user.usuario+'99')
        
            if (!user) {
              throw new Error("Usuario no encontrado"); // Lanza una excepción
            }
        
            // Eliminar al usuario
        
            return  {
                contrasena:user.contrasena ,
                email:user.email,
                usuario:user.usuario
            }


          } 
   
        catch (err) {
        return { status: 500, json: { err: 'Ocurrió un error' } };
    }
} 

export async function emailModelDelete(verificacion) {
    /*try {
      const result = await pool.query("DELETE FROM empleados WHERE email = ?", [verificacion.email]);
      return result;  // O puedes manejar el resultado como necesites
    }*/  
     try{ 
        const result=await prisma.empleado.delete({ 
            where:{
                email:verificacion.email
            }

        })  

        return result

     }
   
      catch (error) {
      console.error("Error al eliminar el empleado:", error);
      throw error;  // Lanza el error para que sea manejado fuera de la función si es necesario
    }
  } 

  export async function obtenerInfo() {  
   
   /* try {
        const [usuarios] = await pool.query("SELECT * FROM empleados"); 
        console.log(usuarios)

        if (!usuarios.length) {
            return { status: 400, send: 'No se encontraron los usuarios' };
        } 
 

        return usuarios; 
    
    }*/  
    try{  

        const usuarios= await prisma.empleado.findMany() 

        if (!usuarios.length) {
            return { status: 400, send: 'No se encontraron los usuarios' };
        } 
 

        return usuarios; 
    

    }
   
        catch (err) {
        return { status: 500, send: 'Hubo un error al recibir los usuarios' };
    } 

} 


