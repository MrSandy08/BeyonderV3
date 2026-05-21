# Imagen base muy ligera solo con Node.js
FROM node:20-slim

# Instalar git (en caso de que alguna dependencia lo necesite)
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json ./

# Instalamos dependencias de Node.js
RUN npm install --production

# Copiamos el resto del código
COPY . .

# Puerto para Render
EXPOSE 7860

# Comando de arranque
CMD ["npm", "start"]
