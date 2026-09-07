export function esRucEcuatorianoValido(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false;

  const provincia = Number(ruc.slice(0, 2));
  const tercerDigito = Number(ruc[2]);
  if (provincia < 1 || provincia > 24) return false;

  if (
    ruc.slice(10) !== '001' &&
    ruc.slice(10) !== '002' &&
    ruc.slice(10) !== '003'
  ) {
    return false;
  }

  if (tercerDigito < 6) {
    return validarCedula(ruc.slice(0, 10));
  }

  if (tercerDigito === 9) {
    return validarModuloOnce(ruc.slice(0, 10), [4, 3, 2, 7, 6, 5, 4, 3, 2]);
  }

  if (tercerDigito === 6) {
    return validarModuloOnce(ruc.slice(0, 9), [3, 2, 7, 6, 5, 4, 3, 2]);
  }

  return false;
}

function validarCedula(cedula: string): boolean {
  const total = [...cedula.slice(0, 9)].reduce((sum, digit, index) => {
    const value = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return sum + (value > 9 ? value - 9 : value);
  }, 0);
  const checkDigit = (10 - (total % 10)) % 10;
  return checkDigit === Number(cedula[9]);
}

function validarModuloOnce(value: string, weights: number[]): boolean {
  const total = weights.reduce(
    (sum, weight, index) => sum + Number(value[index]) * weight,
    0,
  );
  const remainder = total % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;
  return checkDigit === Number(value[value.length - 1]);
}
