
import nodemailer from "nodemailer"; 
import dotenv, { config } from 'dotenv';

config(); 


const urlBack=process.env.URL_B

const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:465,
    secure:true,
    auth:{
        user:process.env.USER_NAME,
        pass:process.env.USER_PASSWORD
    }

}) 

 export async function validarReenvio(token,destino){ 

    return transporter.sendMail({
        from:process.env.USER_NAME, 
        to:destino,
        subject:"recuperacion de cuenta",
        html:cuerpoMail(token)

    })

} 

function cuerpoMail(token){

    return` 

                <div>
                    <h2>Por favor acepta el toquen para poder entrar a tu cuenta</h2>
                    <a href="${urlBack}/ruta-reenvio/${token}">Enviar</a>
                </div>

     
    `
}
