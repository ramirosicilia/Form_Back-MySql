
import nodemailer from "nodemailer"; 
import dotenv, { config } from 'dotenv';

config(); 

const urlBack=process.env.URL_B

const transportes = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER_NAME,
        pass: process.env.USER_PASSWORD
    }
});

export async function validarMail(direccion, token) { 
    return transportes.sendMail({
        from: process.env.USER_EMAIL,
        to: direccion, 
        subject: 'Hola, este es el envío de un mail de verificación',
        html: cuerpoMail(token)
    });
}  

function cuerpoMail(token) { 
    return ` 
        <div> 
            <h2>Por favor acepta la solicitud del envío del mail</h2> 
            <p>Al aceptar la solicitud al ingresar en nuestro sitio, aceptas nuestras políticas de uso de tus datos y privacidad.</p> 
            <a href="${urlBack}/verificar-email/${token}">Aceptar</a>  <!-- Cambiado el enlace a la ruta de verificación -->
        </div>
    `;
}
