import React, { createContext, useContext, useState } from 'react';
import { Stack } from 'expo-router';

const FormContext = createContext();

export const useForm = () => useContext(FormContext);

export default function FormLayout() {
  const [data, setData] = useState({
    name: '',
    birthDate: '',
    cpf: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    number: '',
    complement: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    reason: '',
  });

  const updateData = (updates) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <FormContext.Provider value={{ data, updateData }}>
      <Stack screenOptions={{ headerShown: false }} />
    </FormContext.Provider>
  );
}
