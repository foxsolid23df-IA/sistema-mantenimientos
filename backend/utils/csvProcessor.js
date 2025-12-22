const fs = require('fs');

exports.processCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const resultados = [];
        const datos = fs.readFileSync(filePath, 'utf-8');
        const lineas = datos.split('\n');
        const headers = lineas[0].split(',');

        for (let i = 1; i < lineas.length; i++) {
            if (lineas[i].trim() === '') continue;

            const columnas = lineas[i].split(',');
            const mantenimiento = {
                area: columnas[0],
                equipo: columnas[1],
                descripcion: columnas[2],
                ubicacion: columnas[3],
                ultimo_servicio: columnas[4],
                proximo_servicio: columnas[5],
                periodo_dias: parseInt(columnas[6]) || 30 // Valor por defecto
            };

            resultados.push(mantenimiento);
        }

        // Eliminar el archivo temporal
        fs.unlinkSync(filePath);

        resolve(resultados);
    });
};
