# Imagen base muy ligera solo con Node.js
FROM node:20-slim

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json ./

# Instalamos dependencias de Node.js
RUN npm install --production

# Copiamos el resto del código
COPY . .

# Puerto obligatorio para HF Spaces
EXPOSE 7860

# Comando de arranque
CMD ["npm", "start"]
