import nodemailer from 'nodemailer'
import dotenv from 'dotenv';

dotenv.config({path:'.env'})

const emailOlvidePassword = async(data)=>{
    const transport = nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS,
        }
    });
  
  const { email, nombre, token} = data
  
  //Enviar el email
  await transport .sendMail({
    from:'BienesRaices.com',
    to:email,
    subject:'Restablece tu password en bienesraices.com',
    text:'Restablece tu password en bienesraices.com',
    html:`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Restablece tu password</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #040404; background-color: #F4F4F4; margin: 0; padding: 0;">
                <table width="100%" style="max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border: 1px solid #0C7489; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">     
                    <tr>
                        <td style="background-color: #13505B; padding: 20px; text-align: center; color: #FFFFFF;">
                            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Bienes<span style="color: #119DA4;">Raíces</span></h1>
                            <p style="margin: 5px 0 0; font-size: 14px;">Reestablece tu password con confianza</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; color: #040404;">
                            <h2>¡Bienvenido a Bienes Raíces!</h2>
                            <p style="font-size: 16px; margin: 0 0 10px;">Hola <strong>${nombre}</strong>,</p>
                            <p style="font-size: 16px; margin: 0 0 10px;">
                                Has solicitado reestablecer tu password en bienesraices.com                            
                            </p>
                            <p style="font-size: 16px; margin: 20px 0; text-align: center;">
                                <a href="${process.env.BACKEND_URL}:${process.env.BACKEND_PORT}/auth/olvide-password/${token}" 
                                style="display: inline-block; padding: 12px 20px; background-color: #0C7489; color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                                    Reestablecer Password
                                </a>
                            </p>
                            <p style="font-size: 14px; margin: 20px 0; color: #13505B;">
                                Si tu no solicitaste el cambio de password, puedes ignorar el mensaje.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; text-align: center; background-color: #F9F9F9;">
                            <hr style="border: none; border-top: 1px solid #0C7489; margin: 20px 0;">
                            <p style="font-size: 14px; margin: 5px 0; color: #0C7489;">BienesRaices.com</p>
                            <img src="http://localhost:3001/img/firmaDigital.png" alt="Firma Digital" 
                                style="margin-top: 10px; width: 150px; height: auto;">
                            <hr style="border: none; border-top: 1px solid #0C7489; margin: 20px 0;">    
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px; text-align: center; background-color: #13505B; color: #FFFFFF; font-size: 12px;">
                            &copy; 2024 Bienes Raíces. Todos los derechos reservados.<br>
                            <a href="http://localhost:3001/auth/login" style="color: #119DA4; text-decoration: none;">Visita nuestro sitio web</a>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
 })
 }
  



const emailRegistro = async (data) =>{
    const transport = nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS,
        }
    });
    const {email,nombre,token}=data

    //enviar el email
    await transport.sendMail({
        from: 'BienesRaices.com <no-reply@bienesraices.com>',
        to: email,
        subject: 'Confirma tu cuenta en BienesRaices.com',
        text: 'Confirma tu cuenta en bienesRaices.com',
        html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirma tu Cuenta</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #040404; background-color: #F4F4F4; margin: 0; padding: 0;">
                <table width="100%" style="max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border: 1px solid #0C7489; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">     
                    <tr>
                        <td style="background-color: #13505B; padding: 20px; text-align: center; color: #FFFFFF;">
                            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Bienes<span style="color: #119DA4;">Raíces</span></h1>
                            <p style="margin: 5px 0 0; font-size: 14px;">Confirma tu cuenta con confianza</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; color: #040404;">
                            <h2>¡Bienvenido a Bienes Raíces!</h2>
                            <p style="font-size: 16px; margin: 0 0 10px;">Hola <strong>${nombre}</strong>,</p>
                            <p style="font-size: 16px; margin: 0 0 10px;">
                                ¡Gracias por registrarte! Nos complace informarte que tu cuenta ha sido creada exitosamente. Para completar tu registro, por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente enlace:
                            </p>
                            <p style="font-size: 16px; margin: 20px 0; text-align: center;">
                                <a href="${process.env.BACKEND_URL}:${process.env.BACKEND_PORT}/auth/confirmar/${token}" 
                                style="display: inline-block; padding: 12px 20px; background-color: #0C7489; color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                                    Confirmar Cuenta
                                </a>
                            </p>
                            <p style="font-size: 14px; margin: 20px 0; color: #13505B;">
                                Si tú no creaste esta cuenta, no te preocupes, simplemente ignora este mensaje.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; text-align: center; background-color: #F9F9F9;">
                            <hr style="border: none; border-top: 1px solid #0C7489; margin: 20px 0;">
                            <p style="font-size: 14px; margin: 5px 0; color: #0C7489;">BienesRaices.com</p>
                            <img src="http://localhost:3001/img/firmaDigital.png" alt="Firma Digital" 
                                style="margin-top: 10px; width: 150px; height: auto;">
                            <hr style="border: none; border-top: 1px solid #0C7489; margin: 20px 0;">    
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px; text-align: center; background-color: #13505B; color: #FFFFFF; font-size: 12px;">
                            &copy; 2024 Bienes Raíces. Todos los derechos reservados.<br>
                            <a href="http://localhost:3001/auth/login" style="color: #119DA4; text-decoration: none;">Visita nuestro sitio web</a>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    })    
}

export{
    emailRegistro,
    emailOlvidePassword
}