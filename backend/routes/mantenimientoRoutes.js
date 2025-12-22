const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', auth, mantenimientoController.getMantenimientos);
router.get('/calendario', auth, mantenimientoController.getCalendario);
router.get('/:id', auth, mantenimientoController.getMantenimientoById);
router.post('/importar', auth, upload.single('archivo'), mantenimientoController.importarCSV);
router.put('/:id/realizar', auth, mantenimientoController.marcarRealizado);
router.put('/:id/reprogramar', auth, mantenimientoController.reprogramar);

module.exports = router;
