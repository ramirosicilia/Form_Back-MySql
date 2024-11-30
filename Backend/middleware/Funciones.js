
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { emailModelDelete} from "../model/Db.js";
dotenv.config();



const urlFront=process.env.URL_F

const pool = await mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
}); 


export async function queryDelete(req,res){ 
    const { Token } = req.params; // Se obtiene el Token de los parámetros de la URL
    console.log("Token recibido:", Token);

    try {
        // Verificación del token usando jwt.verify
        const verificacion = jwt.verify(Token, process.env.JWT_BORRADO);
        console.log("Token verificado:", verificacion);

        // Verifica si el token es válido (si verificacion contiene datos)
        if (!verificacion || !verificacion.email) {
            return res.status(400).json({ err: 'Hubo un error con el token.' });
        }

        
           await emailModelDelete(verificacion)
    

        
        console.log("Resultado de la eliminación:");
        res.redirect(`${urlFront}`); 

     
    } 
    catch (err) {
        // Manejo de errores si el token es inválido o cualquier otro error ocurre
        console.error("Error en la verificación del token:", err);
        res.status(500).json({ message: 'Hubo un error con la verificación del token', err });
    }


   
}  

 export function renovacionToken(req,res){
    try{ 
        const token=req.params.token  

        if(!token) return res.status(400).send('hubo un error en la autenticacion')  

       const verificacion=jwt.verify(token,process.env.JWT_RECUPERACION_MAIL) 

       
     
         res.redirect(`${urlFront}/obtener-info`)  

    } 

    catch(err){
        res.status(500).json({message:'hubo un error en la base de datos',err})
    }

 }

export function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'No autorizado, falta token' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token no válido' });
        }
        req.user = user;
        next();
    });
} 
