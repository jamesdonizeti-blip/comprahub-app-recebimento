# App Recebimento — CompraHub v2

Aplicativo mobile para recebimento de pedidos de compra.
Funciona em **Android e iPhone** via Expo Go ou build nativo.

---

## Estrutura de arquivos

```
app/
  _layout.tsx          → Layout raiz (sem header, fundo escuro)
  index.tsx            → Splash / redirect login ou home
  login.tsx            → Login com Supabase Auth
  home.tsx             → Menu principal (QR Code | Digitar número)
  scan.tsx             → Scanner de QR Code
  pedido-manual.tsx    → Busca por número do pedido
  recebimento/
    [id].tsx           → Tela principal de recebimento (itens + NF)
    encerrar.tsx       → Encerramento parcial com opção de cotação
    sucesso.tsx        → Confirmação de conclusão

lib/
  config.ts            → URLs e chaves (Supabase + API)
  supabase.ts          → Cliente Supabase com SecureStore
  auth.ts              → signIn / signOut / getSession
  api.ts               → Axios com Bearer token automático + retry 401

types/
  recebimento.ts       → Tipos TypeScript do domínio
```

---

## Instalação

```bash
npm install
npx expo start
```

Escaneie o QR Code com o Expo Go (Android/iPhone).

---

## Fluxo do app

1. **Login** → credenciais do portal web (Supabase Auth)
2. **Home** → escolha entre QR Code ou digitar número
3. **QR Code** → formato esperado: `SCOMP|PEDIDO|{pedido_uuid}`
4. **Digitar número** → número do pedido (ex: 1042) → busca `/api/recebimentos/pedido?numero=1042`
5. **Recebimento** → inicia via `POST /api/recebimentos` com `pedido_id` → carrega itens
6. **Lançamento** → `PATCH /api/recebimentos/{id}` com quantidades + NF
7. **Encerrar** → `POST /api/recebimentos/{id}/encerrar` com motivo + ação pendências
8. **Sucesso** → volta ao início

---

## Correções aplicadas vs v1

| Problema | Solução |
|---|---|
| `401 Não autenticado` ao buscar pedido | Interceptor de response renova sessão e repete req |
| Telas de recebimento/encerrar/sucesso vazias | Implementação completa |
| Sem validação client-side de quantidades | Validado antes de chamar a API |
| Sem campos de Nota Fiscal | Campos NF número, série e data |
| Sem visualização de pendências | Seção de pendências na tela de recebimento |
| Sem tratamento de erros por status HTTP | 401 → re-login, 403 → sem permissão, 404 → não encontrado |

---

## Permissões necessárias no portal

O usuário precisa ter as permissões:
- `recebimento_visualizar`
- `recebimento_registrar`
- `recebimento_encerrar` (para encerrar)
- `recebimento_abrir_cotacao` (para criar cotação complementar)

---

## Build para produção

```bash
# Android APK/AAB
npx eas build --platform android

# iOS IPA
npx eas build --platform ios
```

Requer conta Expo (EAS Build) para builds nativos.
