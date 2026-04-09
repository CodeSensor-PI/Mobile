import axios from "axios";

const apiViaCep = axios.create({
  baseURL: "https://viacep.com.br/ws/",
});

/**
 *  Busca dados de endereço pelo CEP
 *  @param {string} cep
 */

export const getAddressByCep = async (cep) => {
  try {
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      throw new Error("O CEP deve conter exatamente 8 dígitos.");
    }

    const response = await apiViaCep.get(`${cleanCep}/json/`);

    if (response.data.erro) {
      throw new Error("CEP não encontrado na base de dados.");
    }

    return response.data;
    } catch (error) {
        if (error.response) {
                throw new Error("Erro no servidor do ViaCEP.");
            } else if (error.request) {
                throw new Error("Sem coneão com a internet.");
            } else {
                throw error;
            }
    }
};
