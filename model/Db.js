
/*import mysql from "mysql2/promise";*/
import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv"; 
import {PrismaClient} from "@prisma/client" 

const prisma=new PrismaClient()




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
    let { nombre, apellido, email, usuarios, pass } = input;

    /*try {
        const [existentes] = await pool.query("SELECT usuarios, email FROM empleados WHERE usuarios=? OR email=?", [usuarios, email]);

        if (existentes.length > 0) {
            return { status: 400, json: { err: "Usuario o email  ya existenten" } };
        }
        


        const [row] = await pool.query("INSERT INTO empleados (uuid, nombre, apellido, usuarios, imagenes, contrasenas, email) VALUES (?, ?, ?, ?, ?, ?, ?)", [uuid, nombre, apellido, usuarios, url, pass, email]);
        const [result] = await pool.query("SELECT nombre FROM empleados WHERE uuid=?", [uuid]);

        return [existentes,row, result];
    } */ 
         try{  

            const existente= await prisma.empleado.findUnique({ 
                where:{
                    OR:[{usuarios},{email}]
                }

            }) 

            if (existente) {
                return { status: 400, json: { err: "Usuario o email  ya existenten" } };
            } 

            const row= await prisma.empleado.create({
                data:{ 
                    id:uuid ,
                    nombre:nombre,
                    apellidos:apellido,
                    usuarios:usuarios,
                    contrasenas:pass,
                    imagenes:null


                }
            }) 

            const result= await prisma.empleado.findUnique({
                where:{
                    id:row.id
                } , 
                select:{
                    nombre:true
                }
            })
            
           
        return [existente,row, result];


         }
   
        catch (err) {
        console.log('Hubo un error en las consultas a la base de datos', err);
    }
}

export async function verificarEmailToken(verificacion) {
    /*try {
        const [emailResult] = await pool.query("SELECT email FROM empleados WHERE email=?", [verificacion.email]);

        if (!emailResult.length) {
            return { status: 400, json: { err: 'Usuario no encontrado' } };
        }

           await pool.query("UPDATE empleados SET verificado = true WHERE email=?", [verificacion.email]);

      
    } */  
     try{  

        const emailResult=await prisma.empleado.findUnique({
            where:{
                email:verificacion.email
            }, 
            select:{
                email:true
            }
        }) 

        if (!emailResult) {
            return { status: 400, json: { err: 'Usuario no encontrado' } };
        } 

     

        await prisma.empleado.update({ 
            where:{
                email:verificacion.email 
            }, 
            data:{
               verificado:true
            }
        })


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
            const result= await prisma.empleado.findUnique({
                where:{ 
                    usuarios:usuario

                }, 
                select:{
                    id:true,
                    contrasenas:true

                }
            }) 

            if (!result) {
                return result;
            } 

            return result[0]

         } 

       catch (err) {
        console.error('Error en el login:', err.message);
        throw new Error('Error en la base de datos');
    }
} 



export async function actualizarTokenEnBD(token, uuid) {
    /*try {
        await pool.query(
            "UPDATE empleados SET token = ? WHERE uuid = ?",
            [token, uuid]
        );
    }*/
       try{ 

        await prisma.empleado.update({ 
            where:{
                id:uuid
            }, 
            data:{ 
                token:token,
                

            }

        })

       }
        catch (err) {
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
                    usuarios:ingresoUsuario
                 } ,
                 data:{ 
                    contrasenas:contraseña,
                    usuarios:nuevoUsuario


                 }
            }) 

            const usuario=await prisma.empleado.findUnique({
                where:{
                    usuarios:nuevoUsuario
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
                    usuarios:nuevoUsuario
                }, 
                select:{
                    email:true
                }

            }) 

            const actualizarToken= await prisma.empleado.update({ 
                where:{
                    id:usuario[0].uuid
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

         try{  
            const user= await prisma.empleado.delete({
                where:{
                    usuarios:eliminar
                }, 
                select:{
                    usuarios:true,
                    contrasenas:true,
                    email:true

                }
            }) 

            if (!user) {
                return { status: 404, json: { err: 'No se encontró el usuario' } };
            }
    
            return user;
            

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

        if (!usuarios) {
            return { status: 400, send: 'No se encontraron los usuarios' };
        } 
 

        return usuarios; 
    

    }
   
        catch (err) {
        return { status: 500, send: 'Hubo un error al recibir los usuarios' };
    } 

} 


