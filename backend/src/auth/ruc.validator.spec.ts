import { esRucEcuatorianoValido } from './ruc.validator';

describe('esRucEcuatorianoValido', () => {
  it('acepta un RUC ecuatoriano válido de persona natural', () => {
    expect(esRucEcuatorianoValido('1710034065001')).toBe(true);
  });

  it('rechaza longitud, provincia o establecimiento inválidos', () => {
    expect(esRucEcuatorianoValido('171003406500')).toBe(false);
    expect(esRucEcuatorianoValido('0010034065001')).toBe(false);
    expect(esRucEcuatorianoValido('171003406500999')).toBe(false);
  });

  it('rechaza un dígito verificador alterado', () => {
    expect(esRucEcuatorianoValido('1710034064001')).toBe(false);
  });
});
