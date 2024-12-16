import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js'
import { unlink } from 'node:fs/promises'
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) => {

    //Leer QueryString
    const { pagina: paginaActual } = req.query
    const expresion = /^[0-9]$/

    if (!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const { id } = req.usuario

        //Limites y Dffset para el paginador
        const limit = 10;
        const offset = ((paginaActual * limit) - limit)

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioID: id
                },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' }
                ],
            }),
            Propiedad.count({
                where: {
                    usuarioID: id
                }
            })
        ])
        console.log(total)
        res.render('propiedades/admin', {
            pagina: 'Mis propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit,
        })

    } catch (error) {
        console.log(error)
    }

}

//Formulario para crear una nueva propiedad
const crear = async (req, res) => {

    //Consultar Modelo de Precio y Categorias

    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/crear', {
        pagina: 'Crear propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

const guardar = async (req, res) => {
    //Validacion
    let resultado = validationResult(req)

    if (!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })


    }

    //Crear registro
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioID, categoria: categoriaID,transaccion } = req.body

    const { id: usuarioID } = req.usuario
    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioID,
            categoriaID,
            transaccion,
            usuarioID,
            imagen: ''
        })

        const { id } = propiedadGuardada

        res.redirect(`/propiedades/agregar-imagen/${id}`)

    } catch (error) {
        console.log(error)
    }

}

const agregarImagen = async (req, res) => {

    const { id } = req.params
    //Validar que la propiedad exista

    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    //validar que la propiedD NO ESTE PUBLICADA
    if (propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }
    //validar que la propiedad  pertenece a quien visita esta pagina

    if (req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return res.redirect('/mis-propiedades')
    }

    return res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
}

const almacenarImagen = async (req, res, next) => {

    const { id } = req.params
    // Validar que la propiedad exista

    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad NO ESTÉ PUBLICADA
    if (propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad pertenezca a quien visita esta página

    if (req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return res.redirect('/mis-propiedades')
    }

    try {
        console.log(req.file)
        // Almacenar propiedad y publicarla

        propiedad.imagen = req.file.filename
        propiedad.publicado = 1
        await propiedad.save();

        // Si todo es exitoso, pasar al siguiente middleware o función
        next();

    } catch (error) {
        console.log(error);
        // Manejar errores aquí
        // Puedes redirigir a una página de error o hacer algo más según tus necesidades
        res.redirect('/mis-propiedades');
    }
}


const editar = async (req, res) => {

    //validaciones

    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    //consultar el precio y categorias

    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/editar', {
        pagina: `Editar propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })

}

const guardarCambios = async (req, res) => {

    //verificcar la Validacion
    let resultado = validationResult(req)

    if (!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/editar', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    //Rescribir el objeto y actualizar la bd

    try {
        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioID, categoria: categoriaID } = req.body

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioID,
            categoriaID
        })

        await propiedad.save();

        res.redirect('/mis-propiedades')

    } catch (error) {
        console.log(error)
    }

}

const eliminar = async (req, res) => {
    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    //Elminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`)
    console.log(`se elimino la imagen ${propiedad.imagen}`)
    //Eliminar la propiedad

    await propiedad.destroy()
    res.redirect('/mis-propiedades')
}

//Modificar el estado de la propiedad
const cambiarEstado = async (req, res) => {
    const { id } = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    //Actualizar 

    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: 'true'
    })

}


const mostrarPropiedad = async (req, res) => {

    const { id } = req.params

    //Comprobar que la propieadad exista

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['fotoPerfil', 'alias'], // Incluye sólo estos campos
            },
        ]
    })

    if (!propiedad  || !propiedad.publicado) {
        return res.redirect('/404')
    }

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID)
    })
}

const enviarMensaje = async (req, res) => {
    const { id } = req.params;

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['fotoPerfil', 'alias'], // Incluye sólo estos campos
            },
        ],
    });

    if (!propiedad) {
        return res.redirect('/404');
    }

    // Validación de errores
    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(), // Asegúrate de pasar el token CSRF aquí
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID),
            errores: resultado.array(),
        });
    }

    const { mensaje } = req.body;
    const { id: propiedadID } = req.params;
    const { id: usuarioID } = req.usuario;

    // Almacenar el mensaje
    try {
        await Mensaje.create({
            mensaje,
            propiedadID,
            usuarioID,
        });
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.redirect('/500'); // Página de error en caso de falla
    }
};
//Leer mensajes recibidos

const verMisMensajes = async (req, res) => {
    if (!req.usuario) {
        // Si no hay usuario en la sesión, redirigir a la página de login
        return res.redirect('/login'); // Asegúrate de tener la ruta de login configurada
    }

    const { id } = req.usuario; // Ahora puedes acceder a `id` sin problemas

    try {
        // Obtener los mensajes enviados por el usuario
        const mensajes = await Mensaje.findAll({
            where: {
                usuarioID: id, // Filtramos los mensajes del usuario
            },
            include: [
                {
                    model: Propiedad, // Obtener la propiedad asociada al mensaje
                    as: 'propiedade', // Asumiendo que la relación con la propiedad es 'propiedad'
                    attributes: ['titulo'], // Solo mostrar el título de la propiedad
                },
                {
                    model:Usuario,
                    as:'usuario',
                    attributes:['alias','fotoPerfil']
                }
            ],
        });

        res.render('propiedades/mis-mensajes', { // Usamos una nueva vista 'mis-mensajes'
            mensajes,
            csrfToken: req.csrfToken(), // Token CSRF para seguridad
            pagina: 'Mis Mensajes', // Título de la página
            formatearFecha,
        });
    } catch (error) {
        console.error(error);
        res.redirect('/500'); // Redirige a una página de error en caso de problemas
    }
};



const verMensajes = async (req, res) => {
    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {
                model: Mensaje, as: 'mensajes',
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario' },
                ],
            },
        ],
    });

    if (!propiedad) {
        return res.redirect('/mis-propiedades');
    }

    // Revisar que quien visita la URL sea dueño de la propiedad
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades');
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        csrfToken: req.csrfToken(), // Asegúrate de pasar el token CSRF aquí
        formatearFecha,
    });
};
const responderMensaje = async (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;

    // Buscar el mensaje por ID
    const mensaje = await Mensaje.findByPk(id);

    if (!mensaje) {
        return res.redirect('/404');
    }

    // Validar que el usuario tenga permiso para responder (dueño de la propiedad)
    const propiedad = await Propiedad.findByPk(mensaje.propiedadID);

    if (!propiedad || propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades');
    }

    // Guardar la respuesta
    mensaje.respuesta = respuesta;

    try {
        await mensaje.save();
        res.redirect(`/mensajes/${propiedad.id}`); // Regresar a la lista de mensajes
    } catch (error) {
        console.error(error);
        res.redirect('/500'); // Página de error
    }
};


export {
    admin,
    crear,
    guardar,
    editar,
    agregarImagen,
    almacenarImagen,
    guardarCambios,
    eliminar,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes,
    cambiarEstado,
    responderMensaje,
    verMisMensajes
}

