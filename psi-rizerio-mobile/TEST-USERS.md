# Usuários de teste — psiRizerio Mobile

O app tenta usar o backend real (`localhost:8080`). Quando o backend está
indisponível (ex.: rodando no celular, sem Docker), ele cai automaticamente
no banco de dados mock local (`services/mockDatabase.js`), que já vem
populado com os usuários e dados abaixo. **Você pode logar com qualquer um
deles sem precisar do backend.**

## Psicólogos / Admin

| Perfil                | E-mail                       | Senha         |
|-----------------------|------------------------------|---------------|
| Psicólogo             | `teste@email.com`            | `123456`      |
| Psicólogo Assistente  | `marcos.psico@agendfy.com`   | `Psico@1234`  |
| Psicólogo             | `beatriz.psico@agendfy.com`  | `123456`      |
| Psicólogo             | `rafael.psico@agendfy.com`   | `123456`      |
| Psicólogo (inativo)   | `juliana.psico@agendfy.com`  | `123456`      |
| Admin                 | `admin@agendfy.com`          | `Admin@1234`  |

## Pacientes / Clientes

| Nome             | E-mail                         | Senha          |
|------------------|--------------------------------|----------------|
| Ana Souza        | `ana.cliente@agendfy.com`      | `Cliente@1234` |
| Carlos Lima      | `carlos.cliente@agendfy.com`   | `Cliente@1234` |
| Mariana Rocha    | `mariana.cliente@agendfy.com`  | `123456`       |
| João Mendes      | `joao.cliente@agendfy.com`     | `123456`       |
| Fernanda Dias    | `fernanda.cliente@agendfy.com` | `123456`       |
| Bruno Carvalho   | `bruno.cliente@agendfy.com`    | `123456`       |
| **Paciente Novo**| `novo.paciente@email.com`      | `123456`       |

> **Primeiro acesso / formulário de cadastro:** entre com
> `novo.paciente@email.com` (sem CPF cadastrado). O app detecta o primeiro
> acesso (`isFirstAccess`) e abre o formulário inicial do paciente, onde é
> possível tirar/escolher a foto, preencher endereço (busca por CEP),
> contatos e motivo. Ao finalizar, os dados são salvos e o usuário deixa de
> ser "primeiro acesso".

## Recuperação de senha (mock)

Código de verificação fixo: **`123456`**.

## Câmera e Geolocalização

- **Foto de perfil:** ao tocar no avatar (formulário de paciente ou tela de
  Administração), o app pergunta se você quer usar a **Câmera** ou a
  **Galeria / arquivos**, pedindo a permissão adequada.
- **Geolocalização:** na tela "Meus Pacientes", o botão **Mapa** usa a
  localização atual do dispositivo para ordenar os pacientes por proximidade.
  No primeiro acesso do paciente, a localização também é capturada e salva.

## Rodando no celular

Para que o celular alcance o backend (se estiver usando-o), defina a URL da
API antes de iniciar o Expo, usando o IP da sua máquina na rede local:

```
# .env (na raiz de Mobile/psi-rizerio-mobile)
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:8080
```

Sem isso (ou se o backend estiver fora do ar), o app funciona normalmente
com os dados de teste do mock.
