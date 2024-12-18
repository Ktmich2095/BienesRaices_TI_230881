
(function () {
    const lat = 20.18397099876656;

    const lng = -98.06376224560663;
    const mapa = L.map('mapa-inicio').setView([lat, lng], 17);

    let markers = new L.FeatureGroup().addTo(mapa)
    let propiedades = [];
    //Filtros
    const filtros = {
        categoria: '',
        precio: '',
        transaccion:''
    }
    const categoriasSelect = document.querySelector('#categorias');
    const preciosSelect = document.querySelector('#precios');
    const transaccionSelect = document.querySelector('#transaccion')


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa)

    //Filtrado de categorias y precios

    categoriasSelect.addEventListener('change', e => {
        filtros.categoria = +e.target.value
        filtrarPropiedades();
    })

    preciosSelect.addEventListener('change', e => {
        filtros.precio = +e.target.value
        filtrarPropiedades();
    })

    transaccionSelect.addEventListener('change', e => {
        filtros.transaccion = e.target.value
        filtrarPropiedades();
    })


    const obtenerPropiedades = async () => {
        try {
            const url = '/api/propiedades'
            const respuesta = await fetch(url)
            propiedades = await respuesta.json()

            mostrarPropiedades(propiedades)

        } catch (error) {
            console.log(error)
        }
    }

    const mostrarPropiedades = propiedades => {

        //Limpiar markers previos

        markers.clearLayers()

        propiedades.forEach(propiedad => {
            //Agregar los pines

            const marker = new L.marker([propiedad?.lat, propiedad?.lng], {
                autoPan: true
            })
                .addTo(mapa)
                .bindPopup(`
            <p class="text-cerulean font-bold">${propiedad.categoria.nombre}</p>
            <h1 class="text-xl font-extrabold uppercase my-5"> ${propiedad.titulo} </h1>
            <img src="/uploads/${propiedad?.imagen}" alt="Imagen de la propiedad ${propiedad.titulo}">
            <p class="text-gray-600 font-bold">${propiedad.precio.nombre}</p>
            <a href="/propiedad/${propiedad.id}" class="bg-darkCyan hover:bg-midnightGreen block p-2 text-center font-bold uppercase">Ver Propiedad</a>
            `)

            markers.addLayer(marker)
        })
    }

    const filtrarPropiedades = () => {
        const resultado = propiedades.filter(filtrarCategoria).filter(filtrarPrecio).filter(filtrarTransaccion)
        mostrarPropiedades(resultado)
    }

    const filtrarTransaccion = (propiedad) => {
        return filtros.transaccion ? propiedad.transaccion === filtros.transaccion : propiedad;
    };
    

    const filtrarCategoria = (propiedad) => {
        return filtros.categoria ? propiedad.categoriaID === filtros.categoria : propiedad
    }

    const filtrarPrecio = (propiedad) => {
        return filtros.precio ? propiedad.precioID === filtros.precio : propiedad
    }
    obtenerPropiedades()

})()