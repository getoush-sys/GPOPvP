<<<<<<< HEAD
# GPO PvP Bot

Bot de Discord para el servidor **Grand Piece Online | PVP Hispano**.

## Funcionalidades
- Sistema de tickets para Wagers (1v1 / 2v2)
- Sistema de ELO (empieza en 800)
- Ganas más ELO al vencer a alguien con mayor ELO
- Máximo +20 ELO por victoria
- Si rechazas un wager (dodge) pierdes (diferencia de ELO / 2)
- Puedes poner items apostados al crear el wager
- Solo moderadores/hosters/encargados pueden reportar resultados
- Comandos: `/setup`, `/wager`, `/profile`, `/leaderboard`, `/forceend`

## Instalación

1. Copia `.env.example` a `.env` y rellena:
```env
TOKEN=TU_TOKEN
CLIENT_ID=TU_CLIENT_ID
GUILD_ID=TU_GUILD_ID (opcional)
OWNER_ID=TU_ID
```

2. Instala dependencias
```bash
npm install
```

3. Despliega comandos slash
```bash
node deploy-commands.js
```

4. Inicia el bot
```bash
node index.js
```

## Uso

1. Usa `/setup` para configurar categoría de tickets y roles encargados
2. Usa `/wager` para abrir el panel y crear wagers
3. Los retados aceptan/rechazan desde el ticket
4. Los encargados del ticket reportan el ganador con los botones

## Hosteo gratuito
Compatible con Railway, Render, Pylex, etc. Usa el archivo `index.js` como start command.
=======
# GPOPvP
>>>>>>> 6830f67d3ae11ef1cdfbb6d18dbdf2acb3b0db80
