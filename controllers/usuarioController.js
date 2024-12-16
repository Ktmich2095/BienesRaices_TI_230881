import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generateID, generarJWT } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req, res) => {
    //validación
    await check('email').isEmail().withMessage('El email es obligatorio').run(req)
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req)

    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        })
    }


    const { email, password } = req.body
    //comprobar si el usuario existe
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no existe' }]
        })
    }

    //comprobar si el usuario esta confirmado
    if (!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu cuenta no ha sido confirmada' }]
        })
    }

    //Revisar el password
    if (!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El password es incorrecto' }]
        })
    }

    //Autenticar al usuario
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });

    console.log(token);

    //Almacenar en un cookie

    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true
    }).redirect('/mis-propiedades')

}

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}


const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req, res) => {
    console.log(req.body)
    const { nombre, email, password, birthDate,fotoPerfil=''  } = req.body;
    //validación
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio').run(req)
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)
    await check('password').isLength({ min: 6 }).withMessage('El password debe ser de almenos 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los password no coinciden').run(req)
    await check('birthDate').notEmpty().withMessage('La fecha de nacimiento no puede ir vacía').run(req);
    let resultado = validationResult(req)
    const date = new Date(birthDate);
    const age = new Date().getFullYear() - date.getFullYear();
    const week = new Date().getMonth() - date.getMonth();

    if (isNaN(date.getTime())) {
    return res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken: req.csrfToken(),
        errores: [{ msg: 'La fecha de nacimiento no es válida' }],
        usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
        birthDate: req.body.birthDate
        }
    })
    }


    if (age < 18 || (age === 18 && week < 0)) {
        return res.render('auth/registro', {
            csrfToken: req.csrfToken(),
            page: 'Crear Cuenta',
            errores: [{ msg: 'Debes tener al menos 18 años para registrarte.' }],
            user: {
                nombre: req.body.nombre,
                email: req.body.email,
                birthDate: req.body.birthDate,  
            }
        });
    }

    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
                birthDate: req.body.birthDate
            }
        })
    }

    //Extraer los datos
    



    //verificar que el usuario no este duplicado
    const existeUsuario = await Usuario.findOne({ where: { email } })
    if (existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario ya esta Registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
                birthDate: req.body.birthDate
            }
        })
    }

    //Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        birthDate,
        fotoPerfil,
        token: generateID(),
    })
    res.redirect(`/auth/fotoPerfil/${usuario.id}`);
    //Mostrar mensaje de confirmación
    
}

const subirFoto = async (req,res)=>{
    const {id} =req.params
    const usuario = await Usuario.findByPk(id)
    if(!usuario){
        return res.render('auth/registro',{
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no esta Registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }
    res.render('auth/agregar-foto', {
        pagina:'Agregar foto de perfil',
        csrfToken:req.csrfToken(),
        usuario,
        mensaje: 'Después de subir tu foto, te enviaremos un correo a: ',
        correo: usuario.email,
        mensajeDos: ' Sigue los pasos para confirmar tu cuenta'

    })
}


const almacenarFotoPerfil = async (req,res) =>{
    const { id } = req.params;

    // Validar que el usuario exista
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no está registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            },
        });
    }

    try {
        console.log(req.file);

        // Almacenar la imagen del usuario
        usuario.fotoPerfil = req.file.filename;
        await usuario.save();

        // Enviar el correo de confirmación
        emailRegistro({
            nombre: usuario.nombre,
            email: usuario.email,
            token: usuario.token,
        });

        // Mostrar la página de mensaje de confirmación
        return res.render('templates/message', {
            pagina: 'Cuenta creada correctamente',
            mensaje: 'Hemos enviado un email de confirmación, presiona en el enlace.',
            csrfToken: req.csrfToken(),
        });
    } catch (error) {
        console.log(error);

        // Manejar errores en la subida de la imagen
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'La subida de la imagen falló, intenta de nuevo.' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            },
        });
    }
}

//Funcion que comprueba una cuenta
const confirmar = async (req, res) => {
    const { token } = req.params;

    //verificar si el token es valido

    const usuario = await Usuario.findOne({ where: { token } })
    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    //confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmo correctamente'
    })


    console.log(usuario)
}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raíces',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req, res) => {
    //validación
    await check('email')
        .notEmpty()
        .withMessage("El correo electrónico es un campo obligatorio.")
        .isEmail()
        .withMessage("El correo electrónico no tiene el formato de: usuario@dominio.extension.")
        .run(req);

    let resultado = validationResult(req)
    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raíces',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //Buscar al usuario
    const { email } = req.body
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raíces',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El email no pertenece a ningún usuario' }]
        })
    }

    //Generar un token y enviar el email
    usuario.token = generateID();
    await usuario.save();

    //Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    //Renderizar un mensaje
    res.render('templates/message', {
        pagina: 'Solicitud de actualización de contraseña aceptada',
        mensaje: `Hemos enviado un correo a: `,
        correo: email,
        mensajeDos: ' para la actualización de tu contraseña.'
    })

}

const comprobarToken = async (req, res) => {
    const { token } = req.params;
    const usuario = await Usuario.findOne({ where: { token } })
    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Restablece tu password',
            mensaje: 'Hubo un error al validar tu información, intenta de nuevo',
            error: true
        })
    }

    //mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Restablece tu password',
        csrfToken: req.csrfToken()
    })

}

const nuevoPassword = async (req, res) => {
    //validar el password
    await check('new_password')
        .isLength({ min: 8 })
        .withMessage('El password debe ser de al menos 8 caracteres')
        .notEmpty()
        .withMessage('Es un campo obligatorio.')
        .run(req);
    await check('confirm_new_password')
        .equals(req.body.new_password)
        .withMessage('Los passwords deben ser iguales')
        .run(req);

    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const { token } = req.params
    const { new_password } = req.body;

    //identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: { token } })

    //hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(new_password, salt);
    usuario.token = null;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Restablecido',
        mensaje: 'El password se guardo correctamente'
    })


}

export {
    formularioLogin,
    cerrarSesion,
    formularioRegistro,
    autenticar,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword,almacenarFotoPerfil,subirFoto
}