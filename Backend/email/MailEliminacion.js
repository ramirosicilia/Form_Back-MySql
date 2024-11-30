
import nodemailer from "nodemailer" 
import dotenv, { config } from 'dotenv';

config(); 

const urlBack=process.env.URL_B

const transporter= nodemailer.createTransport({ 

    host:"smtp.gmail.com",
    port:465,
    secure:true,
    auth:{
        user:process.env.USER_EMAIL_BORRADO,
        pass:process.env.USER_PASSWORD
    }


}) 

 export async function emailBorrado(Token,destinatario){

    return transporter.sendMail({
        from:process.env.USER_EMAIL_BORRADO,
        to:destinatario,
        subject:"confirmacion de eliminacion de usuario",
        html:cuerpoHtml(Token)

    })
 } 


 function cuerpoHtml(Token){

    return ` 
       
                <div>
                    <h2>Por favor acepta el toquen para poder eliminar su cuenta</h2>
                    <a href="${urlBack}/ruta-eliminacion/${Token}">Enviar</a>
                </div>

     
    `
 }
