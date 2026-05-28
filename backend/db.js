import Datastore from 'nedb-promises';
import path from 'path';
import fs from 'fs';

// Aseguramos que la carpeta db exista
const dbPath = './db';
if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
}

// Inicializamos las tres colecciones con NeDB (Sintaxis tipo MongoDB)
export const dbUsuarios = Datastore.create({ 
    filename: path.join(dbPath, 'usuarios.db'), 
    autoload: true 
});

export const dbReportes = Datastore.create({ 
    filename: path.join(dbPath, 'reportes.db'), 
    autoload: true 
});

export const dbCategorias = Datastore.create({ 
    filename: path.join(dbPath, 'categorias.db'), 
    autoload: true 
});