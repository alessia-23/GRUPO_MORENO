// Valida cédulas y RUCs de personas naturales en Ecuador usando el algoritmo de Módulo 10
const validarIdentificacion = (numero = '') => {
    numero = String(numero).trim();

    // 1. Validar longitud y que sean solo números
    if (!/^\d{10}$/.test(numero) && !/^\d{13}$/.test(numero)) return false;

    // 2. Evitar números repetidos (ej: 1111111111)
    if (/^(\d)\1+$/.test(numero)) return false;

    // 3. Validar código de provincia (primeros dos dígitos entre 01 y 24, o 30 para extranjeros)
    const provincia = parseInt(numero.substring(0, 2), 10);
    if ((provincia < 1 || provincia > 24) && provincia !== 30) return false;

    // 4. Extraer la base de la cédula (primeros 9 dígitos) para el cálculo matemático
    const digitos = numero.substring(0, 9).split('').map(Number);
    const verificador = parseInt(numero.charAt(9), 10);
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];

    let suma = 0;
    for (let i = 0; i < coeficientes.length; i++) {
        let valor = digitos[i] * coeficientes[i];
        suma += valor > 9 ? valor - 9 : valor;
    }

    const resultado = suma % 10 === 0 ? 0 : 10 - (suma % 10);

    // 5. Si es CÉDULA (10 dígitos), el décimo dígito debe coincidir con la matemática
    if (numero.length === 10) {
        return resultado === verificador;
    }

    // 6. Si es RUC (13 dígitos), debe cumplir el módulo 10 y terminar en un establecimiento válido
    if (numero.length === 13) {
        const establecimiento = numero.substring(10, 13);
        return establecimiento !== '000' && resultado === verificador;
    }

    return false;
};

export default validarIdentificacion;