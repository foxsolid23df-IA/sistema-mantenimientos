export const mockData = {
    user: {
        id: 1,
        nombre: 'Usuario Demo',
        email: 'admin@empresa.com',
        rol: 'admin'
    },
    mantenimientos: [
        { id: 1, codigo: 'MT-001', area: 'PLANTA AGUA', equipo: 'Bomba Principal', descripcion: 'Revisión general', ultimo_servicio: '2023-11-01', proximo_servicio: new Date(Date.now() - 86400000).toISOString(), periodo_dias: 30, estado: 'pendiente', prioridad: 'alta' },
        { id: 2, codigo: 'MT-002', area: 'CALDERAS', equipo: 'Caldera #1', descripcion: 'Limpieza de filtros', ultimo_servicio: '2023-10-15', proximo_servicio: new Date(Date.now() + 86400000 * 5).toISOString(), periodo_dias: 60, estado: 'pendiente', prioridad: 'media' },
        { id: 3, codigo: 'MT-003', area: 'FRIO', equipo: 'Chiller 500T', descripcion: 'Medición de gases', ultimo_servicio: '2023-09-20', proximo_servicio: new Date(Date.now() + 86400000 * 15).toISOString(), periodo_dias: 90, estado: 'completado', prioridad: 'alta' },
        { id: 4, codigo: 'MT-004', area: 'ELEC', equipo: 'Subestación Principal', descripcion: 'Termografía', ultimo_servicio: '2023-11-20', proximo_servicio: new Date(Date.now() + 86400000 * 2).toISOString(), periodo_dias: 180, estado: 'pendiente', prioridad: 'baja' }
    ],
    logs: [
        { fecha_registro: new Date().toISOString(), equipo: 'SISTEMA', accion: 'LOGIN', valor_anterior: '-', valor_nuevo: 'Success', usuario: 'admin' },
        { fecha_registro: new Date(Date.now() - 3600000).toISOString(), equipo: 'Bomba Principal', accion: 'REGISTRO', valor_anterior: '-', valor_nuevo: 'Creado', usuario: 'admin' }
    ]
};
