// Valida una cédula o RUC ecuatoriano de forma básica
const validarIdentificacion = (numero = '') => {
    numero = String(numero).trim();
    // Solo se permiten números
    if (!/^\d+$/.test(numero)) {
        return false;
    }
    // Evita números repetidos como:1111111111
    if (/^(\d)\1+$/.test(numero)) {
        return false;
    }
    // CÉDULA
    // Debe tener exactamente 10 dígitos
    if (numero.length === 10) {
        return true;
    }
    // RUC
    // Debe tener exactamente 13 dígitos
    if (numero.length === 13) {
        // Los últimos 3 dígitos representan el establecimiento
        const establecimiento = numero.substring(10, 13);
        // El establecimiento no puede ser 000
        if (establecimiento === '000') {
            return false;
        }
        return true;
    }
    // Cualquier otro tamaño es inválido
    return false;
};
export default validarIdentificacion;