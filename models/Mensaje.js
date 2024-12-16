import { DataTypes } from 'sequelize'
import db from '../config/db.js'

const Mensaje = db.define('mensajes', {
   mensaje: {
      type: DataTypes.STRING(200),
      allowNull: false
   },
   respuesta: {
      type: DataTypes.STRING(200), // La respuesta también será un string
      allowNull: true // Permitimos que sea opcional (sin respuesta inicial)
  }

});

export default Mensaje